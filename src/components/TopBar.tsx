/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useProject } from '../context/ProjectContext';
import { Play, Sparkles } from 'lucide-react';

export const TopBar: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { activeTab, setActiveTab, processAllFragments, isProcessing, fragments } = useProject();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white shrink-0 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-cyan-400 transition-colors"
        >
          TornDoc AI
        </a>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          · Vision & Line Spacing Core
        </span>
      </div>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`whitespace-nowrap transition-colors hover:text-cyan-400 ${
            activeTab === 'dashboard' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`whitespace-nowrap transition-colors hover:text-cyan-400 ${
            activeTab === 'upload' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Upload & Rip
        </button>
        <button
          onClick={() => setActiveTab('lines')}
          className={`whitespace-nowrap transition-colors hover:text-cyan-400 ${
            activeTab === 'lines' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Line Spacing
        </button>
        <button
          onClick={() => setActiveTab('reconstruction')}
          className={`whitespace-nowrap transition-colors hover:text-cyan-400 ${
            activeTab === 'reconstruction' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Reconstruction
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`whitespace-nowrap transition-colors hover:text-cyan-400 ${
            activeTab === 'report' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Evaluation
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenSettings}
          className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded border border-slate-700 hover:border-slate-600 transition-colors"
        >
          Calibration
        </button>
        <button
          onClick={processAllFragments}
          disabled={isProcessing || fragments.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isProcessing ? 'Analyzing...' : 'Run Analysis Pipeline'}</span>
        </button>
      </div>
    </header>
  );
};
