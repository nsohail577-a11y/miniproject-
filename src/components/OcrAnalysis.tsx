/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  FileText,
  FileSearch,
  Sparkles,
  Download,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { runOcrOnFragment } from '../services/ocrEngine';

export const OcrAnalysis: React.FC = () => {
  const { fragments, setFragments, selectedFragmentId, setSelectedFragmentId } = useProject();

  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const currentFrag = fragments.find((f) => f.id === selectedFragmentId) || fragments[0];

  const handleRunOcr = async () => {
    if (!currentFrag) return;
    setIsOcrLoading(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = currentFrag.preprocessedImageUrl || currentFrag.originalImageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const ocrResult = await runOcrOnFragment(canvas, canvas.width);

      setFragments((prev) =>
        prev.map((f) => {
          if (f.id !== currentFrag.id) return f;
          return { ...f, ocrResult };
        })
      );
    } catch (err) {
      console.error('OCR analysis error:', err);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!currentFrag?.ocrResult?.fullText) return;
    navigator.clipboard.writeText(currentFrag.ocrResult.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    if (!currentFrag?.ocrResult?.fullText) return;
    const blob = new Blob([currentFrag.ocrResult.fullText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentFrag.name}_OCR_Transcribed.txt`;
    link.click();
  };

  const ocr = currentFrag?.ocrResult;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>Module 07</span>
            <span aria-hidden="true">·</span>
            <span>Optical Character Recognition & Semantic Continuation</span>
          </div>
          <h1 className="text-xl font-bold text-white">OCR & Text Transcription Analysis</h1>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={handleRunOcr}
            disabled={isOcrLoading || !currentFrag}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOcrLoading ? 'animate-spin' : ''}`} />
            <span>{isOcrLoading ? 'Transcribing...' : 'Run OCR Recognition'}</span>
          </button>
        </div>
      </div>

      {/* OCR KPI Strip */}
      {ocr && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-0.5">Recognition Engine</div>
            <div className="text-base font-mono font-bold text-cyan-400 uppercase">
              {ocr.engineUsed}
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-0.5">Average Confidence</div>
            <div className="text-base font-mono font-bold text-emerald-400 tabular-nums">
              {(ocr.averageConfidence * 100).toFixed(0)}%
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-0.5">Transcribed Lines</div>
            <div className="text-base font-mono font-bold text-white tabular-nums">
              {ocr.lines.length}
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-0.5">Interrupted Words at Edge</div>
            <div className="text-base font-mono font-bold text-amber-400 tabular-nums">
              {ocr.interruptedWordsCount}
            </div>
          </div>
        </div>
      )}

      {/* Text Output Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Fragment Preview & Cut-off highlights (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">Visual Fragment Reference</h3>
            <div className="aspect-4/3 w-full bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src={currentFrag?.preprocessedImageUrl || currentFrag?.originalImageUrl}
                alt={currentFrag?.name}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">OCR Domain Notes:</div>
              <p className="leading-relaxed text-[11px]">
                For degraded historical scripts or torn cursive manuscripts, characters near irregular
                fracture boundaries may exhibit severed strokes. Bracketed text marks reconstructed or
                incomplete glyphs.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Transcribed Text & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Extracted Text Content</h3>
              {ocr && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadText}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              )}
            </div>

            {ocr ? (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed max-h-[480px] overflow-y-auto whitespace-pre-wrap select-text">
                {ocr.fullText}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 bg-slate-950/60 rounded-lg border border-slate-800/60 space-y-3">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No OCR transcript available for this fragment yet.</p>
                <button
                  onClick={handleRunOcr}
                  disabled={isOcrLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium rounded text-xs transition-colors"
                >
                  Run OCR Extraction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
