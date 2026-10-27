/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { analyzeLineSpacing, detectTextLines } from '../src/services/lineSpacingEngine';
import { DetectedLine } from '../src/types';

/**
 * Unit Test Suite for Intelligent Line Spacing Detection Engine
 */
function runTests() {
  console.log('--- Running Line Spacing Engine Tests ---');

  // Synthetic text lines with one intentional large gap anomaly
  const mockLines: DetectedLine[] = [
    { id: '1', index: 1, top: 50, bottom: 70, baseline: 66, height: 20, width: 300, confidence: 0.95, incompleteAtBorder: false, leftBound: 50, rightBound: 350 },
    { id: '2', index: 2, top: 95, bottom: 115, baseline: 111, height: 20, width: 300, confidence: 0.95, incompleteAtBorder: false, leftBound: 50, rightBound: 350 },
    { id: '3', index: 3, top: 140, bottom: 160, baseline: 156, height: 20, width: 300, confidence: 0.95, incompleteAtBorder: false, leftBound: 50, rightBound: 350 },
    // Large gap anomaly: top 240 - bottom 160 = 80px gap (normal is 25px)
    { id: '4', index: 4, top: 240, bottom: 260, baseline: 256, height: 20, width: 300, confidence: 0.95, incompleteAtBorder: false, leftBound: 50, rightBound: 350 },
    { id: '5', index: 5, top: 285, bottom: 305, baseline: 301, height: 20, width: 300, confidence: 0.95, incompleteAtBorder: false, leftBound: 50, rightBound: 350 },
  ];

  const { gaps, metrics } = analyzeLineSpacing(mockLines, 300, 1.5, 1.6);

  console.log(`Total Lines: ${metrics.totalLines}`);
  console.log(`Median Gap: ${metrics.medianGapPx} px`);
  console.log(`Median Baseline Spacing: ${metrics.medianBaselineSpacingPx} px`);
  console.log(`Anomaly Count: ${metrics.anomalyCount}`);
  console.log(`Missing Lines Detected: ${metrics.missingLinesCount}`);

  // Assertions
  if (metrics.medianGapPx !== 25) {
    throw new Error(`Expected median gap to be 25px, got ${metrics.medianGapPx}`);
  }

  if (metrics.anomalyCount !== 1) {
    throw new Error(`Expected 1 anomaly, got ${metrics.anomalyCount}`);
  }

  const anomalousGap = gaps.find((g) => g.isAnomaly);
  if (!anomalousGap || anomalousGap.gapPx !== 80) {
    throw new Error(`Expected 80px gap to be flagged as anomaly, got ${anomalousGap?.gapPx}`);
  }

  if (anomalousGap.probableMissingLines < 1) {
    throw new Error(`Expected at least 1 missing line estimated, got ${anomalousGap.probableMissingLines}`);
  }

  console.log('✓ All Line Spacing Mathematical Tests Passed Successfully!');
}

runTests();
