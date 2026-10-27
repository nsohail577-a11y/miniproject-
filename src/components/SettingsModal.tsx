/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useProject } from '../context/ProjectContext';
import { X, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, processAllFragments } = useProject();

  if (!isOpen) return null;

  const handleWeightChange = (key: keyof typeof settings.weights, val: number) => {
    updateSettings({
      weights: {
        ...settings.weights,
        [key]: val,
      },
    });
  };

  const handleResetDefaults = () => {
    updateSettings({
      dpi: 300,
      anomalyIqrMultiplier: 1.5,
      anomalyStdDevMultiplier: 1.8,
      missingLineGapRatio: 1.6,
      edgeRoughnessThreshold: 0.15,
      weights: {
        edgeComplementarity: 0.35,
        spacingConsistency: 0.35,
        textContinuation: 0.15,
        geometric: 0.15,
      },
      ocrEngine: 'hybrid',
      binarizationMode: 'sauvola',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">System Calibration & Parameters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DPI Calibration */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Physical Measurement & Scanner Calibration
          </h3>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Scanner Calibration DPI</span>
              <span className="font-mono text-cyan-400">{settings.dpi} DPI</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[150, 200, 300, 600].map((dpiVal) => (
                <button
                  key={dpiVal}
                  onClick={() => updateSettings({ dpi: dpiVal })}
                  className={`py-1.5 text-xs font-mono rounded border ${
                    settings.dpi === dpiVal
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {dpiVal} DPI
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used for precise conversion of pixel distances to physical millimeters (mm = px × 25.4 / DPI).
            </p>
          </div>
        </div>

        {/* Anomaly Detection Thresholds */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Line Spacing Anomaly Thresholds
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Interquartile Range (IQR) Multiplier</span>
                <span className="font-mono text-cyan-400">{settings.anomalyIqrMultiplier}×</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={settings.anomalyIqrMultiplier}
                onChange={(e) =>
                  updateSettings({ anomalyIqrMultiplier: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
              <p className="text-[10px] text-slate-500">
                Gaps deviating by more than k × IQR from the median are flagged as abnormal voids or
                headings.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Missing Line Void Threshold Ratio</span>
                <span className="font-mono text-cyan-400">{settings.missingLineGapRatio}×</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="2.5"
                step="0.1"
                value={settings.missingLineGapRatio}
                onChange={(e) =>
                  updateSettings({ missingLineGapRatio: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Fragment Matching Weights */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Fragment Matching Weights (Σ = 1.0)
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Torn Edge Complementarity (w_edge)</span>
                <span className="font-mono text-cyan-400">{settings.weights.edgeComplementarity}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={settings.weights.edgeComplementarity}
                onChange={(e) =>
                  handleWeightChange('edgeComplementarity', parseFloat(e.target.value))
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Line Spacing & Baseline Rhythm (w_spacing)</span>
                <span className="font-mono text-emerald-400">{settings.weights.spacingConsistency}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={settings.weights.spacingConsistency}
                onChange={(e) =>
                  handleWeightChange('spacingConsistency', parseFloat(e.target.value))
                }
                className="w-full accent-emerald-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Text Continuation / OCR Context (w_text)</span>
                <span className="font-mono text-purple-400">{settings.weights.textContinuation}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.05"
                value={settings.weights.textContinuation}
                onChange={(e) =>
                  handleWeightChange('textContinuation', parseFloat(e.target.value))
                }
                className="w-full accent-purple-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Geometric Constraints (w_geom)</span>
                <span className="font-mono text-blue-400">{settings.weights.geometric}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.05"
                value={settings.weights.geometric}
                onChange={(e) => handleWeightChange('geometric', parseFloat(e.target.value))}
                className="w-full accent-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Academic Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                processAllFragments();
              }}
              className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold rounded text-xs transition-colors shadow-sm"
            >
              Save & Recalibrate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
