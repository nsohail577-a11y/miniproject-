/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Layers,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Eye,
  Columns,
  Sparkles,
} from 'lucide-react';

export const PreprocessingInspector: React.FC = () => {
  const {
    fragments,
    selectedFragmentId,
    setSelectedFragmentId,
    preprocessingOptions,
    updatePreprocessingOptions,
    processFragment,
    isProcessing,
  } = useProject();

  const [activeStage, setActiveStage] = useState<string>('binarized');
  const [viewMode, setViewMode] = useState<'split' | 'single'>('split');
  const [splitPosition, setSplitPosition] = useState<number>(50);

  const currentFrag = fragments.find((f) => f.id === selectedFragmentId) || fragments[0];

  const stages = [
    { id: 'original', label: '1. Original' },
    { id: 'grayscale', label: '2. Grayscale' },
    { id: 'denoised', label: '3. Noise Filter' },
    { id: 'clahe', label: '4. CLAHE' },
    { id: 'binarized', label: '5. Binarized' },
    { id: 'morphology', label: '6. Morphology' },
  ];

  const getStageImageUrl = (stageId: string): string => {
    if (!currentFrag) return '';
    if (stageId === 'original') return currentFrag.originalImageUrl;
    const stageImgs = currentFrag.processingStageImages;
    if (!stageImgs) return currentFrag.originalImageUrl;

    switch (stageId) {
      case 'grayscale':
        return stageImgs.grayscale || currentFrag.originalImageUrl;
      case 'denoised':
        return stageImgs.denoised || stageImgs.grayscale || currentFrag.originalImageUrl;
      case 'clahe':
        return stageImgs.clahe || stageImgs.denoised || currentFrag.originalImageUrl;
      case 'binarized':
        return stageImgs.binarized || currentFrag.preprocessedImageUrl || currentFrag.originalImageUrl;
      case 'morphology':
        return stageImgs.morphology || stageImgs.binarized || currentFrag.originalImageUrl;
      default:
        return currentFrag.originalImageUrl;
    }
  };

  const currentProcessedUrl = getStageImageUrl(activeStage);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white">Image Preprocessing Pipeline</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-stage document restoration: noise suppression, Sauvola binarization, CLAHE, and
            morphology.
          </p>
        </div>

        {/* Fragment selector dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Fragment:</label>
          <select
            value={currentFrag?.id || ''}
            onChange={(e) => setSelectedFragmentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-3 py-1.5 focus:border-cyan-400 outline-none"
          >
            {fragments.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => currentFrag && processFragment(currentFrag.id)}
            disabled={isProcessing || !currentFrag}
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-Apply Pipeline</span>
          </button>
        </div>
      </div>

      {/* Main Viewport & Stage Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Stage Viewport (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Stage selection tabs */}
          <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-lg border border-slate-800 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 min-w-max">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
                    activeStage === stage.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                onClick={() => setViewMode(viewMode === 'split' ? 'single' : 'split')}
                title="Toggle Before / After Split Slider"
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'split' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Image Canvas Display */}
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center select-none">
            {viewMode === 'split' ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {/* Processed image (full background) */}
                <img
                  src={currentProcessedUrl}
                  alt="Processed"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />

                {/* Original image (clipped on left by splitPosition) */}
                <div
                  className="absolute inset-0 overflow-hidden flex items-center justify-center"
                  style={{ width: `${splitPosition}%` }}
                >
                  <img
                    src={currentFrag?.originalImageUrl}
                    alt="Original"
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain pointer-events-none"
                    style={{
                      width: '100%',
                      minWidth: '100%',
                    }}
                  />
                </div>

                {/* Split line divider */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-md cursor-ew-resize z-10"
                  style={{ left: `${splitPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-center shadow-lg">
                    <Columns className="w-3 h-3 text-cyan-400" />
                  </div>
                </div>

                {/* Split slider drag handle input */}
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={splitPosition}
                  onChange={(e) => setSplitPosition(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />

                {/* Labels */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-300 pointer-events-none">
                  Original Document
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-cyan-400 pointer-events-none">
                  Stage: {activeStage.toUpperCase()}
                </div>
              </div>
            ) : (
              <img
                src={currentProcessedUrl}
                alt={activeStage}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Right Configuration Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Algorithm Parameters</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Live Calibration</span>
            </div>

            {/* Binarization Mode */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Binarization Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updatePreprocessingOptions({ binarization: 'sauvola' })}
                  className={`py-1.5 text-xs font-medium rounded border ${
                    preprocessingOptions.binarization === 'sauvola'
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Sauvola (Adaptive)
                </button>
                <button
                  onClick={() => updatePreprocessingOptions({ binarization: 'otsu' })}
                  className={`py-1.5 text-xs font-medium rounded border ${
                    preprocessingOptions.binarization === 'otsu'
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Otsu (Global)
                </button>
              </div>
            </div>

            {/* Sauvola k parameter */}
            {preprocessingOptions.binarization === 'sauvola' && (
              <div className="space-y-3 p-3 bg-slate-950/60 rounded border border-slate-800/80">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Sauvola k Factor</span>
                    <span className="font-mono text-cyan-400">{preprocessingOptions.sauvolaK}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.6"
                    step="0.05"
                    value={preprocessingOptions.sauvolaK}
                    onChange={(e) =>
                      updatePreprocessingOptions({ sauvolaK: parseFloat(e.target.value) })
                    }
                    className="w-full accent-cyan-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Controls threshold sensitivity to local standard deviation.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Window Size (W)</span>
                    <span className="font-mono text-cyan-400">
                      {preprocessingOptions.sauvolaWindow} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="55"
                    step="2"
                    value={preprocessingOptions.sauvolaWindow}
                    onChange={(e) =>
                      updatePreprocessingOptions({ sauvolaWindow: parseInt(e.target.value) })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            )}

            {/* CLAHE Clip Limit */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>CLAHE Clip Limit</span>
                <span className="font-mono text-cyan-400">
                  {preprocessingOptions.claheClipLimit}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={preprocessingOptions.claheClipLimit}
                onChange={(e) =>
                  updatePreprocessingOptions({ claheClipLimit: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Noise filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Noise Filter</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['none', 'gaussian', 'median'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => updatePreprocessingOptions({ noiseFilter: filter })}
                    className={`py-1.5 capitalize rounded border ${
                      preprocessingOptions.noiseFilter === filter
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 font-medium'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Morphological dilation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Morphological Dilation (Text Ribbons)</span>
                <input
                  type="checkbox"
                  checked={preprocessingOptions.morphologicalDilation}
                  onChange={(e) =>
                    updatePreprocessingOptions({ morphologicalDilation: e.target.checked })
                  }
                  className="rounded accent-cyan-400"
                />
              </div>
              {preprocessingOptions.morphologicalDilation && (
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Structuring Element Width</span>
                    <span className="font-mono text-cyan-400">
                      {preprocessingOptions.dilationKernelWidth} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="2"
                    value={preprocessingOptions.dilationKernelWidth}
                    onChange={(e) =>
                      updatePreprocessingOptions({
                        dilationKernelWidth: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => currentFrag && processFragment(currentFrag.id)}
              disabled={isProcessing || !currentFrag}
              className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Apply Changes to Fragment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
