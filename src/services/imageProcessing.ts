/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, TornEdge } from '../types';

/**
 * Converts ImageData to standard Luma Grayscale:
 * Y = 0.299 * R + 0.587 * G + 0.114 * B
 */
export function rgbToGrayscale(src: ImageData): ImageData {
  const width = src.width;
  const height = src.height;
  const dst = new ImageData(width, height);
  const sData = src.data;
  const dData = dst.data;

  for (let i = 0; i < sData.length; i += 4) {
    const luma = Math.round(0.299 * sData[i] + 0.587 * sData[i + 1] + 0.114 * sData[i + 2]);
    dData[i] = luma;
    dData[i + 1] = luma;
    dData[i + 2] = luma;
    dData[i + 3] = sData[i + 3]; // Preserve alpha
  }
  return dst;
}

/**
 * 5x5 Separable Gaussian Blur Kernel for noise suppression
 */
export function applyGaussianBlur(src: ImageData): ImageData {
  const width = src.width;
  const height = src.height;
  const dst = new ImageData(width, height);
  const sData = src.data;
  const dData = dst.data;

  // 1D Gaussian kernel: [1, 4, 6, 4, 1] / 16
  const kernel = [1, 4, 6, 4, 1];
  const kSum = 16;
  const temp = new Float32Array(width * height);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -2; k <= 2; k++) {
        const px = Math.min(Math.max(x + k, 0), width - 1);
        const idx = (y * width + px) * 4;
        acc += sData[idx] * kernel[k + 2];
      }
      temp[y * width + x] = acc / kSum;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -2; k <= 2; k++) {
        const py = Math.min(Math.max(y + k, 0), height - 1);
        acc += temp[py * width + x] * kernel[k + 2];
      }
      const val = Math.min(255, Math.max(0, Math.round(acc / kSum)));
      const idx = (y * width + x) * 4;
      dData[idx] = val;
      dData[idx + 1] = val;
      dData[idx + 2] = val;
      dData[idx + 3] = sData[idx + 3];
    }
  }

  return dst;
}

/**
 * 3x3 Median Filter for salt-and-pepper noise removal while preserving sharp edges
 */
export function applyMedianFilter(src: ImageData, radius: number = 1): ImageData {
  const width = src.width;
  const height = src.height;
  const dst = new ImageData(width, height);
  const sData = src.data;
  const dData = dst.data;
  const windowSize = (radius * 2 + 1) * (radius * 2 + 1);
  const values = new Uint8Array(windowSize);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const py = Math.min(Math.max(y + dy, 0), height - 1);
        for (let dx = -radius; dx <= radius; dx++) {
          const px = Math.min(Math.max(x + dx, 0), width - 1);
          values[count++] = sData[(py * width + px) * 4];
        }
      }
      // Simple insertion sort on the small window
      for (let i = 1; i < count; i++) {
        const key = values[i];
        let j = i - 1;
        while (j >= 0 && values[j] > key) {
          values[j + 1] = values[j];
          j--;
        }
        values[j + 1] = key;
      }
      const median = values[Math.floor(count / 2)];
      const idx = (y * width + x) * 4;
      dData[idx] = median;
      dData[idx + 1] = median;
      dData[idx + 2] = median;
      dData[idx + 3] = sData[idx + 3];
    }
  }

  return dst;
}

/**
 * Contrast Limited Adaptive Histogram Equalization (CLAHE)
 * Divides image into contextual tiles, clips histogram, and bilinearly interpolates.
 */
export function applyCLAHE(
  src: ImageData,
  clipLimit: number = 2.5,
  gridCols: number = 8,
  gridRows: number = 8
): ImageData {
  const width = src.width;
  const height = src.height;
  const dst = new ImageData(width, height);
  const sData = src.data;
  const dData = dst.data;

  const tileW = Math.ceil(width / gridCols);
  const tileH = Math.ceil(height / gridRows);

  // Compute CDF for each tile
  const cdfs: Float32Array[] = [];

  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      const hist = new Int32Array(256);
      const startX = gx * tileW;
      const endX = Math.min(startX + tileW, width);
      const startY = gy * tileH;
      const endY = Math.min(startY + tileH, height);
      const tileArea = (endX - startX) * (endY - startY);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const val = sData[(y * width + x) * 4];
          hist[val]++;
        }
      }

      // Clip histogram
      const clipValue = Math.max(1, Math.round((clipLimit * tileArea) / 256));
      let excess = 0;
      for (let b = 0; b < 256; b++) {
        if (hist[b] > clipValue) {
          excess += hist[b] - clipValue;
          hist[b] = clipValue;
        }
      }
      const bonusPerBin = Math.floor(excess / 256);
      for (let b = 0; b < 256; b++) {
        hist[b] += bonusPerBin;
      }

      // Compute CDF mapping (normalized to 0..255)
      const cdf = new Float32Array(256);
      let cumulative = 0;
      for (let b = 0; b < 256; b++) {
        cumulative += hist[b];
        cdf[b] = Math.min(255, (cumulative * 255) / tileArea);
      }
      cdfs.push(cdf);
    }
  }

  // Bilinear interpolation of mapping across tile centers
  for (let y = 0; y < height; y++) {
    const gy = (y - tileH / 2) / tileH;
    const gy0 = Math.max(0, Math.min(gridRows - 1, Math.floor(gy)));
    const gy1 = Math.max(0, Math.min(gridRows - 1, gy0 + 1));
    const dy = Math.max(0, Math.min(1, gy - gy0));

    for (let x = 0; x < width; x++) {
      const gx = (x - tileW / 2) / tileW;
      const gx0 = Math.max(0, Math.min(gridCols - 1, Math.floor(gx)));
      const gx1 = Math.max(0, Math.min(gridCols - 1, gx0 + 1));
      const dx = Math.max(0, Math.min(1, gx - gx0));

      const val = sData[(y * width + x) * 4];

      const cdf00 = cdfs[gy0 * gridCols + gx0][val];
      const cdf10 = cdfs[gy0 * gridCols + gx1][val];
      const cdf01 = cdfs[gy1 * gridCols + gx0][val];
      const cdf11 = cdfs[gy1 * gridCols + gx1][val];

      const top = cdf00 * (1 - dx) + cdf10 * dx;
      const bottom = cdf01 * (1 - dx) + cdf11 * dx;
      const finalVal = Math.round(top * (1 - dy) + bottom * dy);

      const idx = (y * width + x) * 4;
      dData[idx] = finalVal;
      dData[idx + 1] = finalVal;
      dData[idx + 2] = finalVal;
      dData[idx + 3] = sData[idx + 3];
    }
  }

  return dst;
}

/**
 * Otsu's Global Binarization
 * Maximizes inter-class variance to find optimal global separation threshold.
 */
export function applyOtsuThreshold(src: ImageData): { binarized: ImageData; threshold: number } {
  const width = src.width;
  const height = src.height;
  const dst = new ImageData(width, height);
  const sData = src.data;
  const dData = dst.data;

  const hist = new Int32Array(256);
  const total = width * height;

  for (let i = 0; i < sData.length; i += 4) {
    hist[sData[i]]++;
  }

  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * hist[t];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > maxVariance) {
      maxVariance = varBetween;
      threshold = t;
    }
  }

  for (let i = 0; i < sData.length; i += 4) {
    const isFg = sData[i] < threshold; // Text is dark foreground
    const val = isFg ? 0 : 255;
    dData[i] = val;
    dData[i + 1] = val;
    dData[i + 2] = val;
    dData[i + 3] = sData[i + 3];
  }

  return { binarized: dst, threshold };
}

/**
 * Sauvola Local Adaptive Binarization
 * Formulated specifically for degraded, torn, stained document images:
 * T(x, y) = m(x, y) * (1 + k * (s(x, y) / R - 1))
 * where m is local mean, s is local standard deviation, R = 128 dynamic range, k ~ 0.2 to 0.5.
 * Uses Integral Image & Squared Integral Image for O(1) local mean & variance calculation.
 */
export function applySauvolaBinarization(
  src: ImageData,
  windowSize: number = 25,
  k: number = 0.3,
  R: number = 128
): ImageData {
  const width = src.width;
  const height = src.height;
  const dst = new ImageData(width, height);
  const sData = src.data;
  const dData = dst.data;

  // Build integral image and squared integral image
  const intImg = new Float64Array((width + 1) * (height + 1));
  const intSqImg = new Float64Array((width + 1) * (height + 1));

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    let rowSqSum = 0;
    for (let x = 0; x < width; x++) {
      const p = sData[(y * width + x) * 4];
      rowSum += p;
      rowSqSum += p * p;
      const idx = (y + 1) * (width + 1) + (x + 1);
      intImg[idx] = intImg[y * (width + 1) + (x + 1)] + rowSum;
      intSqImg[idx] = intSqImg[y * (width + 1) + (x + 1)] + rowSqSum;
    }
  }

  const half = Math.floor(windowSize / 2);

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - half);
    const y1 = Math.min(height, y + half + 1);

    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - half);
      const x1 = Math.min(width, x + half + 1);

      const area = (x1 - x0) * (y1 - y0);

      // Integral sum: D - B - C + A
      const sum =
        intImg[y1 * (width + 1) + x1] -
        intImg[y0 * (width + 1) + x1] -
        intImg[y1 * (width + 1) + x0] +
        intImg[y0 * (width + 1) + x0];

      const sqSum =
        intSqImg[y1 * (width + 1) + x1] -
        intSqImg[y0 * (width + 1) + x1] -
        intSqImg[y1 * (width + 1) + x0] +
        intSqImg[y0 * (width + 1) + x0];

      const mean = sum / area;
      const variance = Math.max(0, sqSum / area - mean * mean);
      const stdDev = Math.sqrt(variance);

      const thresh = mean * (1 + k * (stdDev / R - 1));
      const val = sData[(y * width + x) * 4];
      const isFg = val < thresh;
      const out = isFg ? 0 : 255;

      const idx = (y * width + x) * 4;
      dData[idx] = out;
      dData[idx + 1] = out;
      dData[idx + 2] = out;
      dData[idx + 3] = sData[idx + 3];
    }
  }

  return dst;
}

/**
 * Computes Horizontal Projection Profile (HPP)
 * Returns array of foreground pixel counts for each row y in 0..height-1
 */
export function computeHorizontalProjectionProfile(binary: ImageData): number[] {
  const width = binary.width;
  const height = binary.height;
  const profile = new Array(height).fill(0);
  const data = binary.data;

  for (let y = 0; y < height; y++) {
    let count = 0;
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      // In binarized image, 0 = black foreground text
      if (data[rowOffset + x * 4] < 128) {
        count++;
      }
    }
    profile[y] = count;
  }

  return profile;
}

/**
 * Skew Angle Detection using Projection Profile Variance Maximization
 * Sweeps angles from -maxAngle to +maxAngle in steps of 0.5 degrees.
 * Rotates binary projection and measures variance; max variance = true text alignment!
 */
export function estimateSkewAngle(
  binary: ImageData,
  maxAngle: number = 10,
  step: number = 0.5
): number {
  const width = binary.width;
  const height = binary.height;
  const data = binary.data;

  let bestAngle = 0;
  let maxVariance = -1;

  // Subsample rows to make skew detection lightning fast (<50ms)
  const stepY = Math.max(1, Math.floor(height / 400));

  for (let angle = -maxAngle; angle <= maxAngle; angle += step) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const centerX = width / 2;
    const centerY = height / 2;

    const profile = new Float32Array(height);

    for (let y = 0; y < height; y += stepY) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x += 4) {
        if (data[rowOffset + x * 4] < 128) {
          // Project rotated coordinate Y'
          const rx = x - centerX;
          const ry = y - centerY;
          const rotY = Math.round(rx * sin + ry * cos + centerY);
          if (rotY >= 0 && rotY < height) {
            profile[rotY]++;
          }
        }
      }
    }

    // Calculate variance of profile
    let sum = 0;
    let sumSq = 0;
    let n = 0;
    for (let i = 0; i < height; i++) {
      const v = profile[i];
      sum += v;
      sumSq += v * v;
      n++;
    }
    const variance = (sumSq - (sum * sum) / n) / n;

    if (variance > maxVariance) {
      maxVariance = variance;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

/**
 * Morphological Operations (Dilation, Erosion, Opening, Closing)
 * Uses rectangular horizontal structuring element to link characters along lines.
 */
export function applyMorphology(
  binary: ImageData,
  operation: 'dilate' | 'erode' | 'open' | 'close',
  kernelW: number = 7,
  kernelH: number = 3
): ImageData {
  const width = binary.width;
  const height = binary.height;

  function dilate(src: ImageData): ImageData {
    const dst = new ImageData(width, height);
    const s = src.data;
    const d = dst.data;
    const kwHalf = Math.floor(kernelW / 2);
    const khHalf = Math.floor(kernelH / 2);

    // Initialize all to white (255)
    d.fill(255);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (s[(y * width + x) * 4] < 128) {
          // Foreground: paint structuring element
          for (let dy = -khHalf; dy <= khHalf; dy++) {
            const py = y + dy;
            if (py < 0 || py >= height) continue;
            for (let dx = -kwHalf; dx <= kwHalf; dx++) {
              const px = x + dx;
              if (px < 0 || px >= width) continue;
              const idx = (py * width + px) * 4;
              d[idx] = 0;
              d[idx + 1] = 0;
              d[idx + 2] = 0;
              d[idx + 3] = 255;
            }
          }
        }
      }
    }
    return dst;
  }

  function erode(src: ImageData): ImageData {
    const dst = new ImageData(width, height);
    const s = src.data;
    const d = dst.data;
    const kwHalf = Math.floor(kernelW / 2);
    const khHalf = Math.floor(kernelH / 2);

    d.fill(255);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let allFg = true;
        for (let dy = -khHalf; dy <= khHalf && allFg; dy++) {
          const py = y + dy;
          if (py < 0 || py >= height) {
            allFg = false;
            break;
          }
          for (let dx = -kwHalf; dx <= kwHalf; dx++) {
            const px = x + dx;
            if (px < 0 || px >= width) {
              allFg = false;
              break;
            }
            if (s[(py * width + px) * 4] >= 128) {
              allFg = false;
              break;
            }
          }
        }
        const idx = (y * width + x) * 4;
        const val = allFg ? 0 : 255;
        d[idx] = val;
        d[idx + 1] = val;
        d[idx + 2] = val;
        d[idx + 3] = 255;
      }
    }
    return dst;
  }

  if (operation === 'dilate') return dilate(binary);
  if (operation === 'erode') return erode(binary);
  if (operation === 'open') return dilate(erode(binary));
  if (operation === 'close') return erode(dilate(binary));

  return binary;
}

/**
 * Detects outer contour and identifies torn edges vs straight boundary edges.
 * Uses perimeter boundary tracing, computes curvature variance and fractal roughness.
 */
export function analyzeTornEdges(
  canvas: HTMLCanvasElement,
  thresholdRoughness: number = 0.15
): TornEdge[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Identify document paper boundaries by scanning from each edge inward
  // Paper is anything with alpha > 50 and not completely transparent/black background
  const isPaper = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * 4;
    return data[idx + 3] > 60; // Has alpha opacity
  };

  // Sample top, bottom, left, right perimeter profiles
  const topPoints: Point[] = [];
  const bottomPoints: Point[] = [];
  const leftPoints: Point[] = [];
  const rightPoints: Point[] = [];

  // Top and Bottom sampling
  for (let x = 0; x < width; x += 3) {
    let topY = -1;
    for (let y = 0; y < height; y++) {
      if (isPaper(x, y)) {
        topY = y;
        break;
      }
    }
    if (topY !== -1) topPoints.push({ x, y: topY });

    let botY = -1;
    for (let y = height - 1; y >= 0; y--) {
      if (isPaper(x, y)) {
        botY = y;
        break;
      }
    }
    if (botY !== -1) bottomPoints.push({ x, y: botY });
  }

  // Left and Right sampling
  for (let y = 0; y < height; y += 3) {
    let leftX = -1;
    for (let x = 0; x < width; x++) {
      if (isPaper(x, y)) {
        leftX = x;
        break;
      }
    }
    if (leftX !== -1) leftPoints.push({ x: leftX, y });

    let rightX = -1;
    for (let x = width - 1; x >= 0; x--) {
      if (isPaper(x, y)) {
        rightX = x;
        break;
      }
    }
    if (rightX !== -1) rightPoints.push({ x: rightX, y });
  }

  function evaluateEdge(points: Point[], side: 'top' | 'bottom' | 'left' | 'right'): TornEdge {
    if (points.length < 5) {
      return {
        edgeId: `${side}-edge`,
        side,
        isTorn: false,
        roughness: 0,
        curvatureVariance: 0,
        fractalDimension: 1.0,
        points: [],
        simplifiedContour: [],
        irregularityScore: 0,
      };
    }

    // Linear regression fit line through points to measure deviations
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    const n = points.length;

    for (const pt of points) {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
      sumYY += pt.y * pt.y;
    }

    // Residual sum of squares from straight line fit
    let residuals = 0;
    let curvatureSum = 0;

    const isHorizontal = side === 'top' || side === 'bottom';

    if (isHorizontal) {
      const slope = (n * sumXY - sumX * sumY) / Math.max(1e-5, n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      for (let i = 0; i < n; i++) {
        const expectedY = slope * points[i].x + intercept;
        residuals += Math.abs(points[i].y - expectedY);

        if (i > 1) {
          const dy1 = points[i - 1].y - points[i - 2].y;
          const dy2 = points[i].y - points[i - 1].y;
          curvatureSum += Math.abs(dy2 - dy1);
        }
      }
    } else {
      const slope = (n * sumXY - sumX * sumY) / Math.max(1e-5, n * sumYY - sumY * sumY);
      const intercept = (sumX - slope * sumY) / n;
      for (let i = 0; i < n; i++) {
        const expectedX = slope * points[i].y + intercept;
        residuals += Math.abs(points[i].x - expectedX);

        if (i > 1) {
          const dx1 = points[i - 1].x - points[i - 2].x;
          const dx2 = points[i].x - points[i - 1].x;
          curvatureSum += Math.abs(dx2 - dx1);
        }
      }
    }

    const meanResidual = residuals / n;
    const meanCurvature = curvatureSum / Math.max(1, n - 2);

    // Fractal roughness index
    const roughness = (meanResidual * 0.6 + meanCurvature * 0.4) / (isHorizontal ? height : width);
    const curvatureVariance = meanCurvature;
    const isTorn = roughness > thresholdRoughness || meanResidual > 6.0;

    // Ramer-Douglas-Peucker simplification for fast contour rendering
    const simplified = rdpSimplify(points, 2.5);

    return {
      edgeId: `${side}-edge`,
      side,
      isTorn,
      roughness: parseFloat(roughness.toFixed(4)),
      curvatureVariance: parseFloat(curvatureVariance.toFixed(3)),
      fractalDimension: parseFloat((1.0 + Math.min(0.99, roughness * 3.5)).toFixed(3)),
      points,
      simplifiedContour: simplified,
      irregularityScore: parseFloat(Math.min(1.0, roughness * 4.0).toFixed(3)),
    };
  }

  return [
    evaluateEdge(topPoints, 'top'),
    evaluateEdge(rightPoints, 'right'),
    evaluateEdge(bottomPoints, 'bottom'),
    evaluateEdge(leftPoints, 'left'),
  ];
}

/**
 * Ramer-Douglas-Peucker algorithm for polyline simplification
 */
function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const rec1 = rdpSimplify(points.slice(0, index + 1), epsilon);
    const rec2 = rdpSimplify(points.slice(index), epsilon);
    return rec1.slice(0, rec1.length - 1).concat(rec2);
  }

  return [start, end];
}

function perpendicularDistance(pt: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < 1e-6) return Math.hypot(pt.x - lineStart.x, pt.y - lineStart.y);
  return Math.abs(dy * pt.x - dx * pt.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / mag;
}

/**
 * Converts ImageData to base64 Data URL using an offscreen canvas
 */
export function imageDataToDataUrl(imgData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Loads image from URL or base64 into an HTMLImageElement
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = url;
  });
}
