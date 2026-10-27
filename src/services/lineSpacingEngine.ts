/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DetectedLine, LineGap, SpacingMetrics, TornEdge } from '../types';

/**
 * Intelligent Text Line Segmentation using Horizontal Projection Profiles (HPP)
 * and Adaptive Valley Thresholding.
 */
export function detectTextLines(
  binary: ImageData,
  tornEdges: TornEdge[] = []
): { lines: DetectedLine[]; profile: number[] } {
  const width = binary.width;
  const height = binary.height;
  const data = binary.data;

  // 1. Compute Horizontal Projection Profile (foreground pixels per row)
  const profile: number[] = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    let count = 0;
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[rowOffset + x * 4] < 128) {
        count++;
      }
    }
    profile[y] = count;
  }

  // 2. Smooth profile using 3-tap moving average filter to remove stroke ripples
  const smoothed = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    let n = 0;
    for (let k = -2; k <= 2; k++) {
      const py = y + k;
      if (py >= 0 && py < height) {
        sum += profile[py];
        n++;
      }
    }
    smoothed[y] = sum / n;
  }

  // Calculate adaptive noise floor threshold for line detection
  // Ignore isolated flecks (under 2% of max line peak or 5px)
  let maxPeak = 0;
  for (let y = 0; y < height; y++) {
    if (smoothed[y] > maxPeak) maxPeak = smoothed[y];
  }
  const valleyThreshold = Math.max(3, maxPeak * 0.04);

  // 3. Segment into candidate text line intervals [top, bottom]
  const rawSegments: Array<{ top: number; bottom: number }> = [];
  let inLine = false;
  let currentTop = 0;

  for (let y = 0; y < height; y++) {
    if (!inLine && smoothed[y] >= valleyThreshold) {
      inLine = true;
      currentTop = y;
    } else if (inLine && smoothed[y] < valleyThreshold) {
      inLine = false;
      const currentBottom = y;
      const lineH = currentBottom - currentTop;
      // Filter out tiny noise specks (< 4px height)
      if (lineH >= 5) {
        rawSegments.push({ top: currentTop, bottom: currentBottom });
      }
    }
  }
  if (inLine && height - currentTop >= 5) {
    rawSegments.push({ top: currentTop, bottom: height - 1 });
  }

  // 4. Merge split sub-lines (e.g. accents or dot of 'i' separated by 1-2 empty pixels)
  const mergedSegments: Array<{ top: number; bottom: number }> = [];
  for (let i = 0; i < rawSegments.length; i++) {
    if (mergedSegments.length === 0) {
      mergedSegments.push({ ...rawSegments[i] });
      continue;
    }
    const last = mergedSegments[mergedSegments.length - 1];
    const curr = rawSegments[i];
    const interGap = curr.top - last.bottom;
    const lastH = last.bottom - last.top;
    const currH = curr.bottom - curr.top;

    // If gap between two small elements is tiny (< 4px) and total combined height is plausible
    if (interGap <= 3 && (lastH < 10 || currH < 10) && lastH + interGap + currH < 60) {
      last.bottom = curr.bottom;
    } else {
      mergedSegments.push({ ...curr });
    }
  }

  // 5. For each line, compute precise Baseline and Horizontal Extents [left, right]
  const detectedLines: DetectedLine[] = [];

  mergedSegments.forEach((seg, idx) => {
    const top = seg.top;
    const bottom = seg.bottom;
    const lineH = bottom - top;

    // Scan horizontal bounding bounds
    let leftBound = width;
    let rightBound = 0;
    for (let y = top; y <= bottom; y++) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x++) {
        if (data[rowOffset + x * 4] < 128) {
          if (x < leftBound) leftBound = x;
          if (x > rightBound) rightBound = x;
        }
      }
    }
    if (leftBound > rightBound) {
      leftBound = 0;
      rightBound = width;
    }

    // Baseline calculation:
    // Look at the bottom 45% of the text line profile.
    // The baseline is the coordinate where the foreground pixel density experiences
    // its steepest negative gradient (transition from character x-height bodies to descenders / blank paper)
    let baseline = bottom - Math.round(lineH * 0.15); // Fallback estimate
    let maxDrop = -1e9;
    const searchStart = top + Math.round(lineH * 0.55);
    const searchEnd = bottom;

    for (let y = searchStart; y < searchEnd; y++) {
      const drop = smoothed[y] - smoothed[y + 1];
      if (drop > maxDrop) {
        maxDrop = drop;
        baseline = y;
      }
    }

    // Check if line touches torn edges (truncated / interrupted text)
    let incompleteAtBorder = false;
    for (const edge of tornEdges) {
      if (!edge.isTorn) continue;
      if (edge.side === 'left' && leftBound < 25) incompleteAtBorder = true;
      if (edge.side === 'right' && rightBound > width - 25) incompleteAtBorder = true;
      if (edge.side === 'top' && top < 25) incompleteAtBorder = true;
      if (edge.side === 'bottom' && bottom > height - 25) incompleteAtBorder = true;
    }

    detectedLines.push({
      id: `line-${idx + 1}`,
      index: idx + 1,
      top,
      bottom,
      baseline,
      height: lineH,
      width: Math.max(10, rightBound - leftBound),
      confidence: Math.min(1.0, 0.75 + (lineH > 8 ? 0.2 : 0)),
      incompleteAtBorder,
      leftBound,
      rightBound,
    });
  });

  return { lines: detectedLines, profile };
}

/**
 * Calculates Rigorous Line Spacing, Baseline Intervals, Deviations,
 * Statistical Distributions, and Probable Missing Lines.
 */
export function analyzeLineSpacing(
  lines: DetectedLine[],
  dpi: number = 300,
  iqrMultiplier: number = 1.5,
  missingLineGapRatio: number = 1.6
): { gaps: LineGap[]; metrics: SpacingMetrics } {
  if (lines.length < 2) {
    const singleMetrics: SpacingMetrics = {
      totalLines: lines.length,
      medianGapPx: 0,
      medianGapMm: 0,
      averageGapPx: 0,
      averageGapMm: 0,
      minGapPx: 0,
      minGapMm: 0,
      maxGapPx: 0,
      maxGapMm: 0,
      stdDevGapPx: 0,
      iqrGapPx: 0,
      medianBaselineSpacingPx: 0,
      medianBaselineSpacingMm: 0,
      anomalyCount: 0,
      missingLinesCount: 0,
      dpi,
    };
    return { gaps: [], metrics: singleMetrics };
  }

  // Convert px to physical mm using: mm = px * (25.4 / DPI)
  const pxToMm = (px: number) => parseFloat(((px * 25.4) / dpi).toFixed(2));

  // Compute raw consecutive gaps and baseline spacings
  const rawGaps: number[] = [];
  const rawBaselineSpacings: number[] = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i];
    const next = lines[i + 1];
    const gap = next.top - current.bottom;
    const baselineSpacing = next.baseline - current.baseline;
    rawGaps.push(gap);
    rawBaselineSpacings.push(baselineSpacing);
  }

  // Robust Statistics: Median & IQR
  const sortedGaps = [...rawGaps].sort((a, b) => a - b);
  const medianGap = computeMedian(sortedGaps);
  const q1 = sortedGaps[Math.floor(sortedGaps.length * 0.25)];
  const q3 = sortedGaps[Math.floor(sortedGaps.length * 0.75)];
  const iqr = Math.max(2, q3 - q1);

  const sortedBaselines = [...rawBaselineSpacings].sort((a, b) => a - b);
  const medianBaseline = computeMedian(sortedBaselines);

  // Mean & Standard Deviation
  const avgGap = sortedGaps.reduce((sum, v) => sum + v, 0) / sortedGaps.length;
  const variance =
    sortedGaps.reduce((sum, v) => sum + Math.pow(v - avgGap, 2), 0) / sortedGaps.length;
  const stdDev = Math.sqrt(variance);

  const minGap = sortedGaps[0];
  const maxGap = sortedGaps[sortedGaps.length - 1];

  let anomalyCount = 0;
  let totalMissingLines = 0;

  const gaps: LineGap[] = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i];
    const next = lines[i + 1];
    const gapPx = next.top - current.bottom;
    const baselineSpacingPx = next.baseline - current.baseline;
    const deviationPx = Math.abs(gapPx - medianGap);

    // Flag anomalies
    const isTooLarge =
      gapPx > medianGap + iqrMultiplier * iqr ||
      (gapPx >= medianGap * missingLineGapRatio && deviationPx > 10);
    const isTooSmall =
      gapPx < Math.max(0, medianGap - iqrMultiplier * iqr) ||
      (gapPx <= medianGap * 0.4 && deviationPx > 10);
    const isAnomaly = isTooLarge || isTooSmall;

    let probableMissing = 0;
    let anomalyReason: string | undefined;

    if (isTooLarge) {
      // Estimate missing lines: Gap / Median Baseline Spacing
      probableMissing = Math.max(
        1,
        Math.round((gapPx + medianGap * 0.5) / Math.max(10, medianBaseline)) - 1
      );
      if (gapPx > medianGap * missingLineGapRatio) {
        anomalyReason = `Large vertical void (${gapPx}px) exceeds normal spacing (${Math.round(medianGap)}px). Estimated ${probableMissing} interrupted text line(s).`;
      } else {
        anomalyReason = `Significant line spacing enlargement (+${Math.round(deviationPx)}px above median).`;
      }
    } else if (isTooSmall) {
      anomalyReason = `Compressed vertical gap (${gapPx}px). Text lines potentially overlapping or tightly squeezed.`;
    }

    if (isAnomaly) anomalyCount++;
    totalMissingLines += probableMissing;

    gaps.push({
      id: `gap-${current.index}-${next.index}`,
      fromLineIndex: current.index,
      toLineIndex: next.index,
      topY: current.bottom,
      bottomY: next.top,
      gapPx,
      gapMm: pxToMm(gapPx),
      baselineSpacingPx,
      baselineSpacingMm: pxToMm(baselineSpacingPx),
      deviationPx: parseFloat(deviationPx.toFixed(1)),
      deviationMm: pxToMm(deviationPx),
      isAnomaly,
      probableMissingLines: probableMissing,
      anomalyReason,
    });
  }

  const metrics: SpacingMetrics = {
    totalLines: lines.length,
    medianGapPx: parseFloat(medianGap.toFixed(1)),
    medianGapMm: pxToMm(medianGap),
    averageGapPx: parseFloat(avgGap.toFixed(1)),
    averageGapMm: pxToMm(avgGap),
    minGapPx: minGap,
    minGapMm: pxToMm(minGap),
    maxGapPx: maxGap,
    maxGapMm: pxToMm(maxGap),
    stdDevGapPx: parseFloat(stdDev.toFixed(2)),
    iqrGapPx: parseFloat(iqr.toFixed(1)),
    medianBaselineSpacingPx: parseFloat(medianBaseline.toFixed(1)),
    medianBaselineSpacingMm: pxToMm(medianBaseline),
    anomalyCount,
    missingLinesCount: totalMissingLines,
    dpi,
  };

  return { gaps, metrics };
}

function computeMedian(sortedArr: number[]): number {
  if (sortedArr.length === 0) return 0;
  const mid = Math.floor(sortedArr.length / 2);
  if (sortedArr.length % 2 !== 0) {
    return sortedArr[mid];
  }
  return (sortedArr[mid - 1] + sortedArr[mid]) / 2;
}
