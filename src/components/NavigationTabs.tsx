/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  Ruler,
  Scissors,
  SplitSquareVertical,
  FileSearch,
  FileCheck2,
} from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, fragments } = useProject();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload & Rip', icon: UploadCloud, count: fragments.length },
    { id: 'preprocessing', label: 'Preprocessing', icon: Layers },
    { id: 'lines', label: 'Line Spacing', icon: Ruler },
    { id: 'edges', label: 'Torn Edges', icon: Scissors },
    { id: 'reconstruction', label: 'Reconstruction', icon: SplitSquareVertical },
    { id: 'ocr', label: 'OCR & Text', icon: FileSearch },
    { id: 'report', label: 'Report & Eval', icon: FileCheck2 },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1.5 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
