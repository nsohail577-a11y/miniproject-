/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useProject } from '../context/ProjectContext';
import { BENCHMARK_DOCUMENTS } from '../services/syntheticDatasetGenerator';
import {
  FileText,
  Scissors,
  Ruler,
  AlertTriangle,
  Play,
  ArrowRight,
  Database,
  Calculator,
  Layers,
  Sparkles,
  Camera,
} from 'lucide-react';

export const Dashboard: React.FC<{ onOpenCamera: () => void }> = ({ onOpenCamera }) => {
  const {
    fragments,
    matches,
    loadBenchmarkSuite,
    setActiveTab,
    processAllFragments,
    isProcessing,
    activeProjectTitle,
  } = useProject();

  // Aggregate telemetry
  const totalLines = fragments.reduce((sum, f) => sum + f.lines.length, 0);
  const totalAnomalies = fragments.reduce((sum, f) => sum + f.metrics.anomalyCount, 0);
  const totalMissingLines = fragments.reduce((sum, f) => sum + f.metrics.missingLinesCount, 0);
  const medianGaps = fragments
    .filter((f) => f.metrics.medianGapPx > 0)
    .map((f) => f.metrics.medianGapPx);
  const overallMedian =
    medianGaps.length > 0
      ? (medianGaps.reduce((a, b) => a + b, 0) / medianGaps.length).toFixed(1)
      : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Hero Welcome & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
            <span>Research & Engineering Prototype</span>
            <span aria-hidden="true">·</span>
            <span>Computer Vision & Document Forensics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Torn Document Reconstruction & Line Spacing Core
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Empirical line spacing analysis, morphological text baseline segmentation, and
            automated fragment matching for damaged and physically torn documents.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCamera}
            className="px-4 py-2 text-xs font-semibold text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click Photo</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            Upload / Tear Simulator
          </button>
          <button
            onClick={processAllFragments}
            disabled={isProcessing || fragments.length === 0}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap disabled:opacity-50 shadow-sm inline-flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Process All Fragments</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Uploaded Fragments</span>
            <Scissors className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {fragments.length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Active: {activeProjectTitle.slice(0, 24)}...
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Detected Text Lines</span>
            <Ruler className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {totalLines}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Mean spacing: {overallMedian} px
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Spacing Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {totalAnomalies}
          </div>
          <div className="text-[11px] text-amber-400/80 font-mono mt-0.5">
            {totalMissingLines} probable missing lines
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Candidate Matches</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {matches.length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Top compatibility: {matches.length > 0 ? `${(matches[0].totalScore * 100).toFixed(0)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* 5 Academic Benchmark Datasets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Demonstration Benchmarks & Synthetic Tearing Datasets
            </h2>
            <p className="text-xs text-slate-400">
              Load calibrated intact documents, apply fractal random-walk tearing, and validate
              against ground truth.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">5 Ground-Truth Suites</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENCHMARK_DOCUMENTS.map((doc) => {
            const isCurrent = activeProjectTitle === doc.title;
            return (
              <div
                key={doc.id}
                className={`p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-slate-800/80 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                    {doc.category}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                      Loaded
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-white mb-1.5">{doc.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {doc.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <div className="text-slate-400 font-mono text-[11px]">
                    {doc.groundTruthLineCount} lines · ~{doc.groundTruthMedianGapPx}px gap
                  </div>
                  <button
                    onClick={() => loadBenchmarkSuite(doc.id)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                  >
                    <span>Load & Rip</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Mathematical Formulation & Architecture Card */}
      <section className="p-5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">
            Core Mathematical Formulation & Spacing Invariants
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Vertical Line Gap</div>
            <div className="text-cyan-400 font-bold mb-1">Gap(i) = Top(i+1) − Bottom(i)</div>
            <p className="text-slate-500 text-[10px] font-sans">
              Measures the pure white paper void between adjacent glyph boundaries.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Baseline Spacing Rhythm</div>
            <div className="text-emerald-400 font-bold mb-1">Spacing(i) = Base(i+1) − Base(i)</div>
            <p className="text-slate-500 text-[10px] font-sans">
              Tracks the typographic lead pitch invariant across paragraphs and fragments.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Spacing Deviation & Anomaly</div>
            <div className="text-amber-400 font-bold mb-1">Dev(i) = |Gap(i) − Median(Gap)|</div>
            <p className="text-slate-500 text-[10px] font-sans">
              Flags gaps exceeding 1.5× IQR as damage voids, omissions, or headings.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Multi-Factor Matching Score</div>
            <div className="text-cyan-400 font-bold mb-1">Score = Σ w_k · S_k</div>
            <p className="text-slate-500 text-[10px] font-sans">
              Weighted composite of edge complementarity, baseline alignment, and OCR context.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Flow Navigator */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={onOpenCamera}
          className="p-4 rounded-lg bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-left transition-colors group shadow-xs"
        >
          <div className="text-xs font-mono text-cyan-400 mb-1">Live Camera Scan</div>
          <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
            <span>Click Document Photo</span>
            <Camera className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Capture a printed or handwritten page to detect lines and calculate line spacing instantly.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('lines')}
          className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors group"
        >
          <div className="text-xs font-mono text-cyan-400 mb-1">Module 03</div>
          <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors flex items-center justify-between">
            <span>Inspect Line Spacing</span>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            View horizontal projection profiles, detected baselines, and gap annotations.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('edges')}
          className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors group"
        >
          <div className="text-xs font-mono text-cyan-400 mb-1">Module 04 & 05</div>
          <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors flex items-center justify-between">
            <span>Torn Edges & Matching</span>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyze fractal edge curvature and inspect candidate fragment matches.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('reconstruction')}
          className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors group"
        >
          <div className="text-xs font-mono text-cyan-400 mb-1">Module 06</div>
          <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors flex items-center justify-between">
            <span>Reconstruction Canvas</span>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interactive 2D workspace to snap, rotate, align, and export reconstructed documents.
          </p>
        </button>
      </section>
    </div>
  );
};
