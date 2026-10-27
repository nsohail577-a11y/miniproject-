/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Ruler,
  AlertTriangle,
  BarChart3,
  Eye,
  Layers,
  HelpCircle,
  Download,
  Info,
} from 'lucide-react';
import { DetectedLine, LineGap } from '../types';

export const LineSpacingAnalysis: React.FC = () => {
  const { fragments, selectedFragmentId, setSelectedFragmentId, settings } = useProject();

  const [overlayLayers, setOverlayLayers] = useState<{
    showLineBoxes: boolean;
    showBaselines: boolean;
    showGapAnnotations: boolean;
    showAnomalies: boolean;
    showProjectionChart: boolean;
  }>({
    showLineBoxes: true,
    showBaselines: true,
    showGapAnnotations: true,
    showAnomalies: true,
    showProjectionChart: true,
  });

  const [selectedLine, setSelectedLine] = useState<DetectedLine | null>(null);
  const [selectedGap, setSelectedGap] = useState<LineGap | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  const currentFrag = fragments.find((f) => f.id === selectedFragmentId) || fragments[0];

  // Draw overlay annotations on document canvas
  useEffect(() => {
    if (!currentFrag || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw base document
      ctx.drawImage(img, 0, 0);

      const lines = currentFrag.lines || [];
      const gaps = currentFrag.gaps || [];

      // 1. Draw Text Line Bounding Ribbons
      if (overlayLayers.showLineBoxes) {
        lines.forEach((line) => {
          const isSelected = selectedLine?.id === line.id;
          ctx.strokeStyle = isSelected
            ? 'rgba(6, 182, 212, 1.0)'
            : 'rgba(16, 185, 129, 0.7)';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.fillStyle = isSelected
            ? 'rgba(6, 182, 212, 0.15)'
            : 'rgba(16, 185, 129, 0.08)';

          const x = Math.max(10, line.leftBound - 6);
          const w = Math.min(canvas.width - x - 10, line.width + 12);
          ctx.fillRect(x, line.top, w, line.height);
          ctx.strokeRect(x, line.top, w, line.height);

          // Index tag
          ctx.fillStyle = isSelected ? '#06B6D4' : '#10B981';
          ctx.font = '10px monospace';
          ctx.fillText(`L${line.index}`, x + 4, line.top + 10);
        });
      }

      // 2. Draw Text Baselines
      if (overlayLayers.showBaselines) {
        lines.forEach((line) => {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);

          const x = Math.max(10, line.leftBound - 6);
          const w = Math.min(canvas.width - x - 10, line.width + 12);

          ctx.beginPath();
          ctx.moveTo(x, line.baseline);
          ctx.lineTo(x + w, line.baseline);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // 3. Draw Vertical Gaps & Missing Line Annotations
      gaps.forEach((gap) => {
        const isAnomaly = gap.isAnomaly && overlayLayers.showAnomalies;
        const isSelected = selectedGap?.id === gap.id;

        if (isAnomaly || overlayLayers.showGapAnnotations) {
          ctx.fillStyle = isAnomaly
            ? 'rgba(239, 68, 68, 0.14)'
            : 'rgba(59, 130, 246, 0.07)';
          ctx.strokeStyle = isAnomaly
            ? 'rgba(239, 68, 68, 0.85)'
            : 'rgba(59, 130, 246, 0.6)';
          ctx.lineWidth = isAnomaly ? 2 : 1;

          // Gap rectangle
          ctx.fillRect(20, gap.topY, canvas.width - 40, gap.gapPx);
          ctx.strokeRect(20, gap.topY, canvas.width - 40, gap.gapPx);

          // Vertical dimension arrow in margin
          const arrowX = canvas.width - 55;
          ctx.beginPath();
          ctx.moveTo(arrowX, gap.topY);
          ctx.lineTo(arrowX, gap.bottomY);
          ctx.stroke();

          // Arrow heads
          ctx.beginPath();
          ctx.moveTo(arrowX - 3, gap.topY + 4);
          ctx.lineTo(arrowX, gap.topY);
          ctx.lineTo(arrowX + 3, gap.topY + 4);
          ctx.moveTo(arrowX - 3, gap.bottomY - 4);
          ctx.lineTo(arrowX, gap.bottomY);
          ctx.lineTo(arrowX + 3, gap.bottomY - 4);
          ctx.stroke();

          // Gap measurement label badge
          const midY = (gap.topY + gap.bottomY) / 2;
          ctx.fillStyle = isAnomaly ? '#DC2626' : '#1E293B';
          const badgeText = `${gap.gapPx}px (${gap.gapMm}mm)`;
          ctx.font = 'bold 10px monospace';
          const textWidth = ctx.measureText(badgeText).width;

          ctx.fillRect(arrowX - textWidth - 10, midY - 8, textWidth + 6, 16);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(badgeText, arrowX - textWidth - 7, midY + 4);

          // If probable missing line detected, draw dashed phantom line
          if (gap.probableMissingLines > 0 && overlayLayers.showAnomalies) {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
            ctx.setLineDash([5, 4]);
            ctx.lineWidth = 1.5;

            const step = gap.gapPx / (gap.probableMissingLines + 1);
            for (let m = 1; m <= gap.probableMissingLines; m++) {
              const phantomY = gap.topY + step * m;
              ctx.beginPath();
              ctx.moveTo(40, phantomY);
              ctx.lineTo(canvas.width - 40, phantomY);
              ctx.stroke();

              ctx.fillStyle = '#A855F7';
              ctx.font = 'italic 10px sans-serif';
              ctx.fillText(`[Probable Severed Line Void #${m}]`, 50, phantomY - 4);
            }
            ctx.setLineDash([]);
          }
        }
      });
    };
    img.src = currentFrag.preprocessedImageUrl || currentFrag.originalImageUrl;
  }, [currentFrag, overlayLayers, selectedLine, selectedGap]);

  // Draw Horizontal Projection Profile Graph
  useEffect(() => {
    if (!currentFrag?.projectionProfile || !chartCanvasRef.current) return;

    const chartCanvas = chartCanvasRef.current;
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;

    const profile = currentFrag.projectionProfile;
    const h = chartCanvas.height;
    const w = chartCanvas.width;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // Find max peak in profile
    const maxVal = Math.max(1, ...profile);

    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let y = 0; y < profile.length; y++) {
      const plotY = (y / profile.length) * h;
      const plotX = (profile[y] / maxVal) * (w - 20) + 10;
      if (y === 0) ctx.moveTo(plotX, plotY);
      else ctx.lineTo(plotX, plotY);
    }
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(0, h);
    ctx.lineTo(0, 0);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fill();

    // Mark detected baseline lines in chart
    (currentFrag.lines || []).forEach((line) => {
      const plotY = (line.baseline / profile.length) * h;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, plotY);
      ctx.lineTo(w, plotY);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }, [currentFrag]);

  if (!currentFrag) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400">
        No document fragments loaded. Please upload or load a benchmark.
      </div>
    );
  }

  const metrics = currentFrag.metrics;
  const lines = currentFrag.lines || [];
  const gaps = currentFrag.gaps || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>Module 03</span>
            <span aria-hidden="true">·</span>
            <span>Intelligent Line Spacing & Anomaly Detection</span>
          </div>
          <h1 className="text-xl font-bold text-white">Line Spacing Analysis & Coordinate Inspection</h1>
        </div>

        {/* Fragment selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Active Fragment:</label>
          <select
            value={currentFrag.id}
            onChange={(e) => setSelectedFragmentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-3 py-1.5 focus:border-cyan-400 outline-none"
          >
            {fragments.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Numerical Metrics Ribbon (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-0.5">Detected Text Lines</div>
          <div className="text-xl font-mono font-bold text-white tabular-nums">
            {metrics.totalLines}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
            {lines.filter((l) => l.incompleteAtBorder).length} incomplete at seam
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-0.5">Median Inter-Line Gap</div>
          <div className="text-xl font-mono font-bold text-cyan-400 tabular-nums">
            {metrics.medianGapPx} <span className="text-xs text-slate-400">px</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {metrics.medianGapMm} mm ({settings.dpi} DPI)
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-0.5">Median Baseline Spacing</div>
          <div className="text-xl font-mono font-bold text-white tabular-nums">
            {metrics.medianBaselineSpacingPx} <span className="text-xs text-slate-400">px</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {metrics.medianBaselineSpacingMm} mm rhythm
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-0.5">Gap IQR / Std Dev (σ)</div>
          <div className="text-xl font-mono font-bold text-white tabular-nums">
            ±{metrics.iqrGapPx} <span className="text-xs text-slate-400">px</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            σ = {metrics.stdDevGapPx} px
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-0.5">Spacing Anomalies Flagged</div>
          <div className="text-xl font-mono font-bold text-amber-400 tabular-nums">
            {metrics.anomalyCount}
          </div>
          <div className="text-[10px] text-purple-400 font-mono mt-0.5">
            {metrics.missingLinesCount} missing line voids
          </div>
        </div>
      </div>

      {/* Main Analysis Stage: Overlay Canvas + Oscilloscope Projection Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Annotated Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Overlay visibility toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 px-2">Visual Layers:</span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={overlayLayers.showLineBoxes}
                  onChange={(e) =>
                    setOverlayLayers((prev) => ({ ...prev, showLineBoxes: e.target.checked }))
                  }
                  className="rounded accent-emerald-500"
                />
                <span>Text Lines</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={overlayLayers.showBaselines}
                  onChange={(e) =>
                    setOverlayLayers((prev) => ({ ...prev, showBaselines: e.target.checked }))
                  }
                  className="rounded accent-cyan-400"
                />
                <span>Baselines</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={overlayLayers.showGapAnnotations}
                  onChange={(e) =>
                    setOverlayLayers((prev) => ({ ...prev, showGapAnnotations: e.target.checked }))
                  }
                  className="rounded accent-blue-500"
                />
                <span>Gap Callouts</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={overlayLayers.showAnomalies}
                  onChange={(e) =>
                    setOverlayLayers((prev) => ({ ...prev, showAnomalies: e.target.checked }))
                  }
                  className="rounded accent-rose-500"
                />
                <span>Anomalies & Missing Voids</span>
              </label>
            </div>
          </div>

          {/* Interactive Document Stage with side Projection Profile */}
          <div className="flex gap-2">
            {/* The Document Canvas */}
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-auto max-h-[640px] flex items-center justify-center">
              <canvas ref={canvasRef} className="max-w-full h-auto object-contain shadow-lg" />
            </div>

            {/* Horizontal Projection Profile Oscilloscope Column */}
            {overlayLayers.showProjectionChart && (
              <div className="w-28 shrink-0 bg-slate-950 rounded-xl border border-slate-800 p-2 flex flex-col items-center">
                <span className="text-[10px] font-mono text-cyan-400 rotate-90 my-6 whitespace-nowrap">
                  HPP Density Profile H(y)
                </span>
                <canvas
                  ref={chartCanvasRef}
                  width={100}
                  height={600}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Detected Line Coordinates & Spacing Table (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Line & Gap Table</h3>
              <span className="text-[11px] font-mono text-slate-400">
                {lines.length} Lines · {gaps.length} Gaps
              </span>
            </div>

            <div className="overflow-y-auto max-h-[540px] space-y-1.5 scrollbar-thin">
              {lines.map((line, idx) => {
                const nextGap = gaps.find((g) => g.fromLineIndex === line.index);
                const isSelected = selectedLine?.id === line.id;

                return (
                  <div key={line.id} className="space-y-1">
                    {/* Line Item */}
                    <div
                      onClick={() => setSelectedLine(line)}
                      className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-400 text-white'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-cyan-400">Line {line.index}</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          H: {line.height}px
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-slate-400">
                        <span>Top: {line.top}</span>
                        <span>Bot: {line.bottom}</span>
                        <span className="text-cyan-300">Base: {line.baseline}</span>
                      </div>
                      {line.incompleteAtBorder && (
                        <div className="mt-1 text-[10px] text-amber-400 font-sans flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Interrupted at torn boundary</span>
                        </div>
                      )}
                    </div>

                    {/* Gap between this line and next */}
                    {nextGap && (
                      <div
                        onClick={() => setSelectedGap(nextGap)}
                        className={`mx-2 p-1.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                          nextGap.isAnomaly
                            ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                            : 'bg-slate-900 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            Gap {line.index}→{line.index + 1}:
                          </span>
                          <span className="font-bold tabular-nums">
                            {nextGap.gapPx}px ({nextGap.gapMm}mm)
                          </span>
                        </div>
                        {nextGap.isAnomaly && (
                          <div className="mt-0.5 text-[10px] text-rose-400 font-sans">
                            {nextGap.anomalyReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
