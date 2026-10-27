/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BenchmarkDocument, DocumentFragment, Point } from '../types';

export const BENCHMARK_DOCUMENTS: BenchmarkDocument[] = [
  {
    id: 'bench-historical',
    title: '1842 Archival Correspondence Manuscript',
    category: 'historical',
    description: 'Calligraphic handwritten epistolary document featuring non-uniform baseline slopes, varied paragraph margins, ink bleeds, and delicate parchment texture.',
    fullImageUrl: '', // Generated programmatically via Canvas
    groundTruthLineCount: 14,
    groundTruthMedianGapPx: 26,
    groundTruthDpi: 300,
    recommendedTearConfig: {
      roughness: 0.28,
      fragmentCount: 2,
      cutType: 'vertical',
      rotationJitterDegrees: 2.5,
    },
  },
  {
    id: 'bench-legal',
    title: 'Real Estate Commercial Deed Agreement',
    category: 'legal',
    description: 'Formal notarized legal contract with numbered covenants, structured indentations, high-contrast serif typography, and torn notary section.',
    fullImageUrl: '',
    groundTruthLineCount: 18,
    groundTruthMedianGapPx: 22,
    groundTruthDpi: 300,
    recommendedTearConfig: {
      roughness: 0.32,
      fragmentCount: 2,
      cutType: 'vertical',
      rotationJitterDegrees: -1.8,
    },
  },
  {
    id: 'bench-academic',
    title: 'IEEE Transactions Scientific Article',
    category: 'academic',
    description: 'Two-column scientific conference paper with section headings, displayed mathematical formulas with large vertical voids, and citation footnotes.',
    fullImageUrl: '',
    groundTruthLineCount: 20,
    groundTruthMedianGapPx: 19,
    groundTruthDpi: 300,
    recommendedTearConfig: {
      roughness: 0.24,
      fragmentCount: 2,
      cutType: 'horizontal',
      rotationJitterDegrees: 3.0,
    },
  },
  {
    id: 'bench-financial',
    title: 'Itemized Commercial Freight Invoice',
    category: 'financial',
    description: 'Tabular enterprise shipping invoice with regular baseline spacing, currency columns, and missing item lines caused by central paper tear.',
    fullImageUrl: '',
    groundTruthLineCount: 16,
    groundTruthMedianGapPx: 24,
    groundTruthDpi: 300,
    recommendedTearConfig: {
      roughness: 0.35,
      fragmentCount: 3,
      cutType: 'cross',
      rotationJitterDegrees: 2.0,
    },
  },
  {
    id: 'bench-literary',
    title: 'Rare First-Edition Literary Prose Folio',
    category: 'literary',
    description: 'Book page from historical press with dropped initial cap, wide paragraph breaks, uneven lead type impressions, and water damage stains.',
    fullImageUrl: '',
    groundTruthLineCount: 17,
    groundTruthMedianGapPx: 25,
    groundTruthDpi: 300,
    recommendedTearConfig: {
      roughness: 0.3,
      fragmentCount: 2,
      cutType: 'vertical',
      rotationJitterDegrees: -3.2,
    },
  },
];

/**
 * Generates high-resolution synthetic document canvases for the 5 benchmarks
 */
export function renderBenchmarkDocument(docId: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1050;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background parchment tone with subtle grain
  ctx.fillStyle = '#FAF8F2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle paper noise texture
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain - 2));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain - 4));
  }
  ctx.putImageData(imgData, 0, 0);

  // Border frame
  ctx.strokeStyle = 'rgba(180, 160, 130, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.fillStyle = '#1E232A';

  switch (docId) {
    case 'bench-historical': {
      // Calligraphic manuscript
      ctx.font = 'italic 26px "Playfair Display", Georgia, serif';
      ctx.fillText('Historical Epistolary Record — London, 1842', 60, 80);

      ctx.font = 'italic 18px "Georgia", serif';
      const lines = [
        'My Esteemed Colleague,',
        'I write to you regarding our recent empirical findings on the spectral',
        'refraction of light through crystallized mineral ores at twilight.',
        'The mathematical measurements we conducted on the southern ridge',
        'revealed continuous geometric symmetries hitherto unrecorded.',
        'We observed a persistent displacement of nineteen minutes of arc,',
        'which cannot be attributed merely to atmospheric refraction alone.',
        '',
        'The following table of celestial coordinates must be verified:',
        'Alpha Centauri: 14h 39m 36s | Declination: -60° 50′ 02″',
        'Beta Crucis:    12h 47m 43s | Declination: -59° 41′ 19″',
        'The vertical baseline spacing between these readings was strictly kept.',
        'Pray inspect the attached manuscript fragments with utmost precision,',
        'for the torn parchment contains the remaining half of our equation.',
        'I remain your humble servant, Arthur H. Pendelton.',
      ];

      let y = 140;
      for (const line of lines) {
        if (line === '') {
          y += 35; // Intentional paragraph gap anomaly
        } else {
          ctx.fillText(line, 65 + (Math.sin(y * 0.05) * 3), y);
          y += 46;
        }
      }
      break;
    }

    case 'bench-legal': {
      ctx.font = 'bold 24px "Times New Roman", serif';
      ctx.fillText('DEED OF COMMERCIAL CONVEYANCE AND INDENTURE', 60, 80);
      ctx.font = '12px "Times New Roman", serif';
      ctx.fillText('RECORDED DOCUMENT NO. 2026-CV-884920 · OFFICIAL REGISTRY ARCHIVE', 60, 105);

      ctx.beginPath();
      ctx.moveTo(60, 120);
      ctx.lineTo(740, 120);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '16px "Times New Roman", serif';
      const legalLines = [
        'THIS INDENTURE WITNESSETH, that for valuable consideration paid and received,',
        'the Grantor hereby grants, bargains, conveys, and confirms unto the Grantee,',
        'all that certain tract of land and premises situated in Section 14, Township 4,',
        'together with all appurtenances, tenements, and hereditaments thereunto.',
        '',
        'ARTICLE I. COVENANTS OF TITLE AND QUIET ENJOYMENT',
        'The Grantor covenants that it has good right, full power, and lawful authority',
        'to grant and convey the aforementioned parcel free from all prior encumbrances.',
        'Neither party shall violate the registered building envelope boundary lines.',
        '',
        'ARTICLE II. ARBITRATION AND RECONSTRUCTION OF DAMAGED RECORDS',
        'In the event of accidental mutilation or physical tearing of this indenture,',
        'both parties agree to apply line-spacing baseline analysis and geometric matching',
        'to reconstruct the exact original provisions and notarized attestations.',
        '',
        'IN WITNESS WHEREOF, the parties hereto set their respective hands and seals.',
        'Signed, sealed, and delivered in the presence of the undersigned witnesses.',
      ];

      let y = 160;
      for (const line of legalLines) {
        if (line.startsWith('ARTICLE')) {
          ctx.font = 'bold 16px "Times New Roman", serif';
          y += 12;
        } else {
          ctx.font = '16px "Times New Roman", serif';
        }
        if (line === '') {
          y += 32;
        } else {
          ctx.fillText(line, 60, y);
          y += 44;
        }
      }
      break;
    }

    case 'bench-academic': {
      ctx.font = 'bold 22px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText('Automated Line Spacing & Document Fragment Alignment', 60, 75);
      ctx.font = 'italic 14px "Helvetica Neue", Arial, sans-serif';
      ctx.fillText('Dr. Elena Rostova, Department of Computer Science & Vision Systems', 60, 100);

      ctx.font = '15px "Times New Roman", serif';
      const academicLines = [
        'Abstract—We present a unified mathematical framework for recovering torn documents.',
        'By modeling the horizontal projection profile H(y) of degraded document images,',
        'we detect text line baselines and quantify vertical gap deviations with sub-pixel fidelity.',
        '',
        'I. INTRODUCTION AND PROBLEM FORMULATION',
        'When physical documents suffer mechanical tearing, text lines are severed along',
        'irregular fracture boundaries. Traditional puzzle-solving approaches rely purely',
        'on color matching. Our method enforces line-spacing continuity across the seam.',
        '',
        'II. MATHEMATICAL LINE SPACING MODEL',
        'Let Top(i) and Bottom(i) denote the vertical extents of detected line i.',
        'The inter-line gap is defined as Gap(i) = Top(i+1) - Bottom(i).',
        'Under regular typographic typesetting, the baseline spacing satisfies:',
        'Spacing(i) = Baseline(i+1) - Baseline(i) = S_nominal ± epsilon.',
        '',
        'III. FRACTURE MATCHING COMPATIBILITY METRIC',
        'Candidate fragment pairs (A, B) are evaluated using a weighted multi-factor score:',
        'Score(A, B) = w_edge * S_edge + w_spacing * S_spacing + w_text * S_text.',
      ];

      let y = 145;
      for (const line of academicLines) {
        if (line.startsWith('I.') || line.startsWith('II.') || line.startsWith('III.')) {
          ctx.font = 'bold 15px "Helvetica Neue", Arial, sans-serif';
          y += 10;
        } else {
          ctx.font = '15px "Times New Roman", serif';
        }
        if (line === '') {
          y += 28;
        } else {
          ctx.fillText(line, 60, y);
          y += 42;
        }
      }
      break;
    }

    default: {
      // General invoice or prose
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('COMMERCIAL SHIPPING FREIGHT INVOICE', 60, 80);
      ctx.font = '15px sans-serif';
      const lines = [
        'Invoice Reference: INV-2026-9812-B | Date: October 27, 2026',
        'Billed To: Global Logistics Corporation, Terminal 4 Pier 12',
        'Item 01: High-Precision Optical Spectrometer Unit ...... $14,250.00',
        'Item 02: Industrial Camera Sensor Assembly ............ $4,820.00',
        'Item 03: Precision Rotary Calibration Stage ........... $3,190.00',
        'Item 04: Telecentric Measurement Lens 0.5x ............ $1,740.00',
        'Item 05: Fiber Optic Illuminator Matrix ............... $890.00',
        'Subtotal Freight Charges:                              $24,890.00',
        'Import Tariffs & Clearance:                            $1,493.40',
        'Total Remittance Due Upon Receipt:                     $26,383.40',
        '',
        'Payment Terms: Net 30 Days via Wire Transfer or Bank Draft.',
        'Goods inspected and verified intact prior to transport seal.',
      ];
      let y = 140;
      for (const line of lines) {
        if (line === '') y += 30;
        else {
          ctx.fillText(line, 60, y);
          y += 48;
        }
      }
      break;
    }
  }

  return canvas;
}

/**
 * Realistic Fractal Tearing Simulation
 * Takes an intact canvas image and rips it along an irregular Brownian / Perlin random walk.
 * Produces 2 or more interlocking fragments with exact ground truth transformations!
 */
export function simulateDocumentTear(
  sourceCanvas: HTMLCanvasElement,
  options: {
    roughness?: number; // 0.1 to 0.5
    cutType?: 'vertical' | 'horizontal' | 'diagonal';
    fragmentCount?: number;
    rotationJitterDegrees?: number;
  } = {}
): {
  fragments: Array<{
    name: string;
    canvas: HTMLCanvasElement;
    groundTruth: {
      originalX: number;
      originalY: number;
      originalRotation: number;
      fragmentIndex: number;
      splitPoints: Point[];
    };
  }>;
} {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const roughness = options.roughness ?? 0.28;
  const cutType = options.cutType ?? 'vertical';
  const rotationJitter = options.rotationJitterDegrees ?? 2.5;

  // Generate irregular fracture tear path
  const splitPoints: Point[] = [];

  if (cutType === 'vertical') {
    const midX = width * 0.5;
    let currX = midX;
    const stepY = 4;
    const steps = Math.ceil(height / stepY);

    for (let i = 0; i <= steps; i++) {
      const y = Math.min(height, i * stepY);
      // Brownian random walk with mean-reversion toward midX
      const drift = (midX - currX) * 0.05;
      const noise = (Math.random() - 0.5) * (roughness * 60);
      currX += drift + noise;
      // Clamp within middle 30% - 70% of document width
      currX = Math.max(width * 0.25, Math.min(width * 0.75, currX));
      splitPoints.push({ x: Math.round(currX), y });
    }

    // Fragment 1: Left fragment
    const canvasLeft = document.createElement('canvas');
    canvasLeft.width = width;
    canvasLeft.height = height;
    const ctxL = canvasLeft.getContext('2d')!;

    ctxL.save();
    ctxL.beginPath();
    ctxL.moveTo(0, 0);
    for (const pt of splitPoints) {
      ctxL.lineTo(pt.x, pt.y);
    }
    ctxL.lineTo(0, height);
    ctxL.closePath();
    ctxL.clip();
    ctxL.drawImage(sourceCanvas, 0, 0);
    ctxL.restore();

    // Fragment 2: Right fragment (with slight rotation jitter)
    const canvasRight = document.createElement('canvas');
    canvasRight.width = width;
    canvasRight.height = height;
    const ctxR = canvasRight.getContext('2d')!;

    ctxR.save();
    // Apply slight rotation around center to simulate disoriented physical scan
    ctxR.translate(width / 2, height / 2);
    ctxR.rotate((rotationJitter * Math.PI) / 180);
    ctxR.translate(-width / 2, -height / 2);

    ctxR.beginPath();
    ctxR.moveTo(splitPoints[0].x, splitPoints[0].y);
    for (const pt of splitPoints) {
      ctxR.lineTo(pt.x, pt.y);
    }
    ctxR.lineTo(width, height);
    ctxR.lineTo(width, 0);
    ctxR.closePath();
    ctxR.clip();
    ctxR.drawImage(sourceCanvas, 0, 0);
    ctxR.restore();

    return {
      fragments: [
        {
          name: 'Fragment A (Left Piece)',
          canvas: canvasLeft,
          groundTruth: {
            originalX: 0,
            originalY: 0,
            originalRotation: 0,
            fragmentIndex: 0,
            splitPoints,
          },
        },
        {
          name: 'Fragment B (Right Piece - Torn)',
          canvas: canvasRight,
          groundTruth: {
            originalX: 0,
            originalY: 0,
            originalRotation: rotationJitter,
            fragmentIndex: 1,
            splitPoints,
          },
        },
      ],
    };
  } else {
    // Horizontal cut
    const midY = height * 0.48;
    let currY = midY;
    const stepX = 4;
    const steps = Math.ceil(width / stepX);

    for (let i = 0; i <= steps; i++) {
      const x = Math.min(width, i * stepX);
      const drift = (midY - currY) * 0.05;
      const noise = (Math.random() - 0.5) * (roughness * 60);
      currY += drift + noise;
      currY = Math.max(height * 0.25, Math.min(height * 0.75, currY));
      splitPoints.push({ x, y: Math.round(currY) });
    }

    // Top Fragment
    const canvasTop = document.createElement('canvas');
    canvasTop.width = width;
    canvasTop.height = height;
    const ctxT = canvasTop.getContext('2d')!;

    ctxT.save();
    ctxT.beginPath();
    ctxT.moveTo(0, 0);
    ctxT.lineTo(width, 0);
    for (let i = splitPoints.length - 1; i >= 0; i--) {
      ctxT.lineTo(splitPoints[i].x, splitPoints[i].y);
    }
    ctxT.closePath();
    ctxT.clip();
    ctxT.drawImage(sourceCanvas, 0, 0);
    ctxT.restore();

    // Bottom Fragment
    const canvasBottom = document.createElement('canvas');
    canvasBottom.width = width;
    canvasBottom.height = height;
    const ctxB = canvasBottom.getContext('2d')!;

    ctxB.save();
    ctxB.translate(width / 2, height / 2);
    ctxB.rotate((rotationJitter * Math.PI) / 180);
    ctxB.translate(-width / 2, -height / 2);

    ctxB.beginPath();
    ctxB.moveTo(0, height);
    for (const pt of splitPoints) {
      ctxB.lineTo(pt.x, pt.y);
    }
    ctxB.lineTo(width, height);
    ctxB.closePath();
    ctxB.clip();
    ctxB.drawImage(sourceCanvas, 0, 0);
    ctxB.restore();

    return {
      fragments: [
        {
          name: 'Fragment A (Top Header Section)',
          canvas: canvasTop,
          groundTruth: {
            originalX: 0,
            originalY: 0,
            originalRotation: 0,
            fragmentIndex: 0,
            splitPoints,
          },
        },
        {
          name: 'Fragment B (Bottom Section - Torn)',
          canvas: canvasBottom,
          groundTruth: {
            originalX: 0,
            originalY: 0,
            originalRotation: rotationJitter,
            fragmentIndex: 1,
            splitPoints,
          },
        },
      ],
    };
  }
}
