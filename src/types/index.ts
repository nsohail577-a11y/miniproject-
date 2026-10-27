/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
}

export interface DetectedLine {
  id: string;
  index: number;
  top: number;
  bottom: number;
  baseline: number;
  height: number;
  width: number;
  text?: string;
  confidence: number;
  incompleteAtBorder: boolean;
  leftBound: number;
  rightBound: number;
}

export interface LineGap {
  id: string;
  fromLineIndex: number;
  toLineIndex: number;
  topY: number;
  bottomY: number;
  gapPx: number;
  gapMm: number;
  baselineSpacingPx: number;
  baselineSpacingMm: number;
  deviationPx: number;
  deviationMm: number;
  isAnomaly: boolean;
  probableMissingLines: number;
  anomalyReason?: string;
}

export interface SpacingMetrics {
  totalLines: number;
  medianGapPx: number;
  medianGapMm: number;
  averageGapPx: number;
  averageGapMm: number;
  minGapPx: number;
  minGapMm: number;
  maxGapPx: number;
  maxGapMm: number;
  stdDevGapPx: number;
  iqrGapPx: number;
  medianBaselineSpacingPx: number;
  medianBaselineSpacingMm: number;
  anomalyCount: number;
  missingLinesCount: number;
  dpi: number;
}

export interface TornEdge {
  edgeId: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  isTorn: boolean;
  roughness: number;
  curvatureVariance: number;
  fractalDimension: number;
  points: Point[];
  simplifiedContour: Point[];
  irregularityScore: number; // 0 (perfect straight line) to 1 (highly jagged tear)
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  isCutOffAtBorder?: boolean;
}

export interface OcrResult {
  fullText: string;
  words: OcrWord[];
  lines: string[];
  averageConfidence: number;
  engineUsed: 'tesseract' | 'gemini' | 'hybrid';
  interruptedWordsCount: number;
}

export interface DocumentFragment {
  id: string;
  name: string;
  originalImageUrl: string;
  preprocessedImageUrl?: string;
  width: number;
  height: number;
  rotation: number; // in degrees
  offset: Point;
  scale: number;
  edges: TornEdge[];
  lines: DetectedLine[];
  gaps: LineGap[];
  metrics: SpacingMetrics;
  projectionProfile: number[];
  ocrResult?: OcrResult;
  processingStageImages?: {
    grayscale?: string;
    denoised?: string;
    binarized?: string;
    clahe?: string;
    skewCorrected?: string;
    morphology?: string;
    edgesVisualized?: string;
  };
  syntheticGroundTruth?: {
    parentId: string;
    originalX: number;
    originalY: number;
    originalRotation: number;
    fragmentIndex: number;
    trueSplitBoundary?: Point[];
  };
}

export interface FragmentMatch {
  matchId: string;
  fragmentAId: string;
  fragmentBId: string;
  fragmentAName: string;
  fragmentBName: string;
  relativeOffset: Point;
  relativeRotation: number;
  edgeComplementarityScore: number; // 0 to 1
  spacingConsistencyScore: number; // 0 to 1
  textContinuationScore: number; // 0 to 1
  geometricCompatibilityScore: number; // 0 to 1
  totalScore: number; // weighted sum 0 to 1
  confidenceTier: 'high' | 'medium' | 'low' | 'estimate';
  explanation: string;
  seamPoints?: Point[];
}

export interface PreprocessingOptions {
  grayscale: boolean;
  noiseFilter: 'none' | 'gaussian' | 'median';
  binarization: 'otsu' | 'sauvola' | 'adaptive';
  sauvolaK: number; // typically 0.2 to 0.5
  sauvolaWindow: number; // typically 15 to 35
  clahe: boolean;
  claheClipLimit: number;
  skewCorrection: boolean;
  morphologicalOpening: boolean;
  morphologicalDilation: boolean;
  dilationKernelWidth: number;
}

export interface AnalysisSettings {
  dpi: number;
  anomalyIqrMultiplier: number;
  anomalyStdDevMultiplier: number;
  missingLineGapRatio: number;
  edgeRoughnessThreshold: number;
  weights: {
    edgeComplementarity: number;
    spacingConsistency: number;
    textContinuation: number;
    geometric: number;
  };
  ocrEngine: 'tesseract' | 'gemini' | 'hybrid';
  binarizationMode: 'sauvola' | 'otsu' | 'adaptive';
}

export interface BenchmarkDocument {
  id: string;
  title: string;
  category: 'historical' | 'legal' | 'academic' | 'financial' | 'literary';
  description: string;
  fullImageUrl: string;
  groundTruthLineCount: number;
  groundTruthMedianGapPx: number;
  groundTruthDpi: number;
  recommendedTearConfig: {
    roughness: number;
    fragmentCount: number;
    cutType: 'vertical' | 'horizontal' | 'diagonal' | 'cross';
    rotationJitterDegrees: number;
  };
}

export interface ReconstructionEvaluation {
  fragmentPairId: string;
  predictedOffset: Point;
  groundTruthOffset: Point;
  offsetErrorPx: number;
  predictedRotation: number;
  groundTruthRotation: number;
  rotationErrorDegrees: number;
  textLineDetectionPrecision: number;
  textLineDetectionRecall: number;
  textLineF1Score: number;
  lineSpacingMeanAbsoluteErrorPx: number;
  tornEdgeClassificationAccuracy: number;
  top1MatchSuccess: boolean;
  processingTimeMs: number;
}
