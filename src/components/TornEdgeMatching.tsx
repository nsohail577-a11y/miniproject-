/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Scissors,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle,
  SplitSquareVertical,
} from 'lucide-react';
import { FragmentMatch } from '../types';

export const TornEdgeMatching: React.FC = () => {
  const {
    fragments,
    matches,
    selectedFragmentId,
    setSelectedFragmentId,
    setActiveTab,
    setFragments,
    settings,
  } = useProject();

  const [selectedMatch, setSelectedMatch] = useState<FragmentMatch | null>(
    matches.length > 0 ? matches[0] : null
  );

  const currentFrag = fragments.find((f) => f.id === selectedFragmentId) || fragments[0];

  const applyMatchToWorkspace = (match: FragmentMatch) => {
    // Automatically update the relative offsets of fragment B relative to fragment A
    setFragments((prev) =>
      prev.map((f) => {
        if (f.id === match.fragmentBId) {
          const fragA = prev.find((p) => p.id === match.fragmentAId);
          const baseOffset = fragA?.offset || { x: 50, y: 50 };
          return {
            ...f,
            offset: {
              x: baseOffset.x + match.relativeOffset.x,
              y: baseOffset.y + match.relativeOffset.y,
            },
            rotation: match.relativeRotation,
          };
        }
        return f;
      })
    );

    setActiveTab('reconstruction');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>Modules 04 & 05</span>
            <span aria-hidden="true">·</span>
            <span>Torn Boundary Analysis & Compatibility Optimization</span>
          </div>
          <h1 className="text-xl font-bold text-white">Torn Edge Detection & Fragment Matching</h1>
        </div>

        {matches.length > 0 && (
          <button
            onClick={() => applyMatchToWorkspace(matches[0])}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shadow-sm"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Apply Top Match to Reconstruction Workspace</span>
          </button>
        )}
      </div>

      {/* Edge Roughness Inspection for Current Fragment */}
      {currentFrag && (
        <section className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">
                Boundary Edge Classification: {currentFrag.name}
              </h2>
            </div>
            <select
              value={currentFrag.id}
              onChange={(e) => setSelectedFragmentId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded px-3 py-1 outline-none"
            >
              {fragments.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['top', 'right', 'bottom', 'left'].map((side) => {
              const edge = currentFrag.edges.find((e) => e.side === side);
              const isTorn = edge ? edge.isTorn : false;
              const roughness = edge ? edge.roughness : 0;
              const fractalDim = edge ? edge.fractalDimension : 1.0;

              return (
                <div
                  key={side}
                  className={`p-3 rounded-lg border text-xs ${
                    isTorn
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono uppercase font-bold text-white">{side} Edge</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isTorn
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isTorn ? 'Irregular Torn Fracture' : 'Straight Page Border'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Roughness:</span>
                      <span className="text-slate-300">{roughness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fractal Dimension:</span>
                      <span className="text-cyan-400">{fractalDim}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Candidate Matches Ranking Table & Detail Inspector */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Algorithmic Fragment Compatibility Rankings ({matches.length} Candidates)
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated across edge complementarity, text line continuity, baseline co-linearity,
              and geometric constraints.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Sorted by Composite Score</span>
        </div>

        {matches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
            No candidate fragment matches found yet. Run the pipeline on two or more fragments.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Match List (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              {matches.map((m, idx) => {
                const isSelected = selectedMatch?.matchId === m.matchId;
                const scorePercent = (m.totalScore * 100).toFixed(0);

                return (
                  <div
                    key={m.matchId}
                    onClick={() => setSelectedMatch(m)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          #{idx + 1}
                        </span>
                        <div className="text-sm font-semibold text-white">
                          {m.fragmentAName} ↔ {m.fragmentBName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-cyan-300">
                          {scorePercent}%
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                            m.confidenceTier === 'high'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : m.confidenceTier === 'medium'
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {m.confidenceTier}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                      {m.explanation}
                    </p>

                    {/* Sub-scores mini bar */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <div>
                        Edge Fit: {(m.edgeComplementarityScore * 100).toFixed(0)}%
                      </div>
                      <div>
                        Spacing: {(m.spacingConsistencyScore * 100).toFixed(0)}%
                      </div>
                      <div>
                        Text: {(m.textContinuationScore * 100).toFixed(0)}%
                      </div>
                      <div>
                        Geom: {(m.geometricCompatibilityScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Match Scientific Deep Dive Inspector (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {selectedMatch ? (
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-white">Candidate Compatibility Audit</h3>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {(selectedMatch.totalScore * 100).toFixed(1)}% Match
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Edge Shape Complementarity (w = {settings.weights.edgeComplementarity})</span>
                        <span className="font-mono text-white">
                          {(selectedMatch.edgeComplementarityScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${selectedMatch.edgeComplementarityScore * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Line Spacing Continuity (w = {settings.weights.spacingConsistency})</span>
                        <span className="font-mono text-white">
                          {(selectedMatch.spacingConsistencyScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${selectedMatch.spacingConsistencyScore * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Text Continuation / OCR (w = {settings.weights.textContinuation})</span>
                        <span className="font-mono text-white">
                          {(selectedMatch.textContinuationScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full"
                          style={{ width: `${selectedMatch.textContinuationScore * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Geometric Aspect (w = {settings.weights.geometric})</span>
                        <span className="font-mono text-white">
                          {(selectedMatch.geometricCompatibilityScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${selectedMatch.geometricCompatibilityScore * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Offset Breakdown */}
                  <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80 space-y-1.5 font-mono text-xs">
                    <div className="text-slate-400 text-[11px]">Computed Alignment Transform:</div>
                    <div className="text-cyan-300">
                      ΔX: {selectedMatch.relativeOffset.x} px · ΔY: {selectedMatch.relativeOffset.y} px
                    </div>
                    <div className="text-slate-400">ΔRotation: {selectedMatch.relativeRotation}°</div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {selectedMatch.explanation}
                  </p>

                  <button
                    onClick={() => applyMatchToWorkspace(selectedMatch)}
                    className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <SplitSquareVertical className="w-4 h-4" />
                    <span>Apply Alignment to Reconstruction Workspace</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                  Select a candidate match to view scientific breakdown.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
