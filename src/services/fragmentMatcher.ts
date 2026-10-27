/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentFragment, FragmentMatch, Point, TornEdge } from '../types';

interface MatchWeights {
  edgeComplementarity: number;
  spacingConsistency: number;
  textContinuation: number;
  geometric: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  edgeComplementarity: 0.35,
  spacingConsistency: 0.35,
  textContinuation: 0.15,
  geometric: 0.15,
};

/**
 * Computes all pairwise candidate matches between document fragments
 * using multi-factor computer vision and line-spacing continuity analysis.
 */
export function matchDocumentFragments(
  fragments: DocumentFragment[],
  weights: MatchWeights = DEFAULT_WEIGHTS
): FragmentMatch[] {
  const matches: FragmentMatch[] = [];

  if (fragments.length < 2) return [];

  for (let i = 0; i < fragments.length; i++) {
    for (let j = 0; j < fragments.length; j++) {
      if (i === j) continue;
      const fragA = fragments[i];
      const fragB = fragments[j];

      // Test possible boundary pairings:
      // 1. Horizontal rip: Frag A Bottom torn edge vs Frag B Top torn edge (or vice-versa)
      // 2. Vertical rip: Frag A Right torn edge vs Frag B Left torn edge (or vice-versa)
      const horizontalMatch = evaluateBoundaryPair(fragA, fragB, 'bottom', 'top', weights);
      const verticalMatch = evaluateBoundaryPair(fragA, fragB, 'right', 'left', weights);

      const candidate = horizontalMatch.totalScore > verticalMatch.totalScore
        ? horizontalMatch
        : verticalMatch;

      // Only include candidate if there is non-trivial compatibility
      if (candidate.totalScore > 0.15) {
        matches.push(candidate);
      }
    }
  }

  // Sort descending by total composite score
  matches.sort((a, b) => b.totalScore - a.totalScore);
  return matches;
}

function evaluateBoundaryPair(
  fragA: DocumentFragment,
  fragB: DocumentFragment,
  sideA: 'bottom' | 'right' | 'top' | 'left',
  sideB: 'top' | 'left' | 'bottom' | 'right',
  weights: MatchWeights
): FragmentMatch {
  const edgeA = fragA.edges.find((e) => e.side === sideA);
  const edgeB = fragB.edges.find((e) => e.side === sideB);

  const isTornA = edgeA ? edgeA.isTorn : false;
  const isTornB = edgeB ? edgeB.isTorn : false;

  // 1. Edge Shape Complementarity Score
  let edgeScore = 0.2; // Baseline
  if (edgeA && edgeB && (isTornA || isTornB)) {
    edgeScore = computeContourComplementarity(edgeA, edgeB);
  } else if (!isTornA && !isTornB) {
    // Both edges are straight page margins, improbable to be an internal torn boundary
    edgeScore = 0.1;
  }

  // 2. Text Baseline Continuity & Line Spacing Score
  const { spacingScore, optimalYOffset, explanationSpacing } = evaluateLineContinuity(
    fragA,
    fragB,
    sideA,
    sideB
  );

  // 3. Text Continuation & OCR Context Score
  const textScore = evaluateTextContinuity(fragA, fragB, sideA, sideB);

  // 4. Geometric Dimensions Compatibility Score
  const geomScore = evaluateGeometricCompatibility(fragA, fragB, sideA);

  // Calculate composite weighted score
  const totalScore = parseFloat(
    (
      weights.edgeComplementarity * edgeScore +
      weights.spacingConsistency * spacingScore +
      weights.textContinuation * textScore +
      weights.geometric * geomScore
    ).toFixed(3)
  );

  // Determine relative alignment offset (dx, dy)
  let relativeOffset: Point = { x: 0, y: 0 };
  let explanation = '';

  if (sideA === 'right' && sideB === 'left') {
    // Left-to-right alignment
    relativeOffset = {
      x: Math.round(fragA.width * 0.96), // Slight mechanical interlock
      y: Math.round(optimalYOffset),
    };
    explanation = `Vertical tear alignment: Frag B placed to the right of Frag A (Δx ≈ ${relativeOffset.x}px, Δy ≈ ${relativeOffset.y}px). ${explanationSpacing} Edge complementarity: ${(edgeScore * 100).toFixed(0)}%.`;
  } else {
    // Top-to-bottom alignment
    const expectedGap = Math.max(15, fragA.metrics.medianGapPx || 25);
    relativeOffset = {
      x: 0,
      y: Math.round(fragA.height + expectedGap * 0.2),
    };
    explanation = `Horizontal tear alignment: Frag B placed beneath Frag A (Δy ≈ ${relativeOffset.y}px). Spacing consistency: ${(spacingScore * 100).toFixed(0)}%. ${explanationSpacing}`;
  }

  // Determine transparent confidence tier
  let confidenceTier: 'high' | 'medium' | 'low' | 'estimate' = 'estimate';
  if (totalScore >= 0.75) confidenceTier = 'high';
  else if (totalScore >= 0.55) confidenceTier = 'medium';
  else if (totalScore >= 0.35) confidenceTier = 'low';

  return {
    matchId: `match-${fragA.id}-${fragB.id}-${sideA}-${sideB}`,
    fragmentAId: fragA.id,
    fragmentBId: fragB.id,
    fragmentAName: fragA.name,
    fragmentBName: fragB.name,
    relativeOffset,
    relativeRotation: 0,
    edgeComplementarityScore: parseFloat(edgeScore.toFixed(3)),
    spacingConsistencyScore: parseFloat(spacingScore.toFixed(3)),
    textContinuationScore: parseFloat(textScore.toFixed(3)),
    geometricCompatibilityScore: parseFloat(geomScore.toFixed(3)),
    totalScore,
    confidenceTier,
    explanation,
  };
}

/**
 * Computes Normalized Cross-Correlation (NCC) between the inverted edge profile of B
 * and edge profile of A to evaluate interlocking physical fracture complementarity.
 */
function computeContourComplementarity(edgeA: TornEdge, edgeB: TornEdge): number {
  const ptsA = edgeA.points;
  const ptsB = edgeB.points;

  if (ptsA.length < 5 || ptsB.length < 5) {
    return 0.3;
  }

  const isVertical = edgeA.side === 'right' || edgeA.side === 'left';
  const len = Math.min(ptsA.length, ptsB.length, 60);

  // Sample normalized coordinates along common length
  const sigA = new Float32Array(len);
  const sigB = new Float32Array(len);

  for (let i = 0; i < len; i++) {
    const idxA = Math.floor((i / len) * ptsA.length);
    const idxB = Math.floor((i / len) * ptsB.length);
    // For vertical tears, compare x deviation
    sigA[i] = isVertical ? ptsA[idxA].x : ptsA[idxA].y;
    // B's matching edge should be the inverse (peaks fit into valleys)
    sigB[i] = isVertical ? ptsB[idxB].x : ptsB[idxB].y;
  }

  // Mean center
  let meanA = 0, meanB = 0;
  for (let i = 0; i < len; i++) {
    meanA += sigA[i];
    meanB += sigB[i];
  }
  meanA /= len;
  meanB /= len;

  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < len; i++) {
    const a = sigA[i] - meanA;
    const b = sigB[i] - meanB;
    num += a * (-b); // Negative because interlocking edges are inverse
    denA += a * a;
    denB += b * b;
  }

  const denom = Math.sqrt(denA * denB);
  if (denom < 1e-5) return 0.4;

  const ncc = num / denom;
  // Map NCC [-1..1] to score [0..1]
  const score = Math.max(0, Math.min(1, (ncc + 1.0) / 2.0));
  return score;
}

/**
 * Evaluates line spacing continuity across fragments:
 * - For vertical side-by-side splits: finds the vertical shift Δy that aligns text lines across the seam.
 * - For horizontal top-bottom splits: checks if distance between bottom line of A and top line of B matches median spacing.
 */
function evaluateLineContinuity(
  fragA: DocumentFragment,
  fragB: DocumentFragment,
  sideA: string,
  sideB: string
): { spacingScore: number; optimalYOffset: number; explanationSpacing: string } {
  const linesA = fragA.lines;
  const linesB = fragB.lines;

  if (linesA.length === 0 || linesB.length === 0) {
    return {
      spacingScore: 0.3,
      optimalYOffset: 0,
      explanationSpacing: 'Insufficient text lines detected for rigorous spacing correlation.',
    };
  }

  if (sideA === 'right' && sideB === 'left') {
    // Side-by-side vertical tear
    // Sweep vertical shift Δy in [-80..80] px to find shift that maximizes baseline co-linearity
    let bestDeltaY = 0;
    let maxAlignedCount = 0;
    const tolerance = 6; // px tolerance for text baseline continuation

    for (let dy = -60; dy <= 60; dy += 2) {
      let aligned = 0;
      for (const lineA of linesA) {
        for (const lineB of linesB) {
          const diff = Math.abs(lineA.baseline - (lineB.baseline + dy));
          if (diff <= tolerance) {
            aligned++;
          }
        }
      }
      if (aligned > maxAlignedCount) {
        maxAlignedCount = aligned;
        bestDeltaY = dy;
      }
    }

    const alignmentRatio = maxAlignedCount / Math.max(1, Math.min(linesA.length, linesB.length));
    const score = Math.min(1.0, alignmentRatio * 0.9 + 0.1);

    return {
      spacingScore: parseFloat(score.toFixed(3)),
      optimalYOffset: bestDeltaY,
      explanationSpacing: `${maxAlignedCount} of ${Math.min(linesA.length, linesB.length)} text lines show co-linear baseline continuation at vertical offset Δy = ${bestDeltaY}px.`,
    };
  } else {
    // Top-to-bottom horizontal tear
    const lastLineA = linesA[linesA.length - 1];
    const firstLineB = linesB[0];
    const medianGap = fragA.metrics.medianGapPx || 25;

    // Expected gap across the tear should be ~ median gap
    // or if a line was torn away, a multiple of median baseline spacing
    const candidateGap = firstLineB.top; // If B is placed below A
    const diff = Math.abs(candidateGap - medianGap);
    const score = Math.max(0.2, 1.0 - diff / (medianGap * 3.0));

    return {
      spacingScore: parseFloat(score.toFixed(3)),
      optimalYOffset: fragA.height,
      explanationSpacing: `Inter-fragment boundary gap conforms to estimated document baseline rhythm within ±${Math.round(diff)}px of median (${Math.round(medianGap)}px).`,
    };
  }
}

/**
 * Evaluates semantic text continuation from OCR results if available
 */
function evaluateTextContinuity(
  fragA: DocumentFragment,
  fragB: DocumentFragment,
  sideA: string,
  sideB: string
): number {
  if (!fragA.ocrResult || !fragB.ocrResult) return 0.5;

  const ocrA = fragA.ocrResult;
  const ocrB = fragB.ocrResult;

  if (sideA === 'right' && sideB === 'left') {
    // Check if right-boundary words on A continue into left-boundary words on B
    const rightWordsA = ocrA.words.filter((w) => w.isCutOffAtBorder || w.bbox.x1 > fragA.width - 60);
    const leftWordsB = ocrB.words.filter((w) => w.isCutOffAtBorder || w.bbox.x0 < 60);

    if (rightWordsA.length > 0 && leftWordsB.length > 0) {
      return 0.85; // High semantic continuation
    }
    return 0.6;
  }

  return 0.5;
}

/**
 * Evaluates physical geometric compatibility (heights, widths, aspect ratios)
 */
function evaluateGeometricCompatibility(
  fragA: DocumentFragment,
  fragB: DocumentFragment,
  sideA: string
): number {
  if (sideA === 'right' || sideA === 'left') {
    // Heights should be relatively comparable (within 50% or matching document height)
    const ratio = Math.min(fragA.height, fragB.height) / Math.max(fragA.height, fragB.height);
    return Math.max(0.4, ratio);
  } else {
    // Widths should be relatively comparable
    const ratio = Math.min(fragA.width, fragB.width) / Math.max(fragA.width, fragB.width);
    return Math.max(0.4, ratio);
  }
}
