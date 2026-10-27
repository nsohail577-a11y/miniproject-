/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { TopBar } from './components/TopBar';
import { NavigationTabs } from './components/NavigationTabs';
import { Dashboard } from './components/Dashboard';
import { DocumentUpload } from './components/DocumentUpload';
import { PreprocessingInspector } from './components/PreprocessingInspector';
import { LineSpacingAnalysis } from './components/LineSpacingAnalysis';
import { TornEdgeMatching } from './components/TornEdgeMatching';
import { ReconstructionWorkspace } from './components/ReconstructionWorkspace';
import { OcrAnalysis } from './components/OcrAnalysis';
import { AnalysisReport } from './components/AnalysisReport';
import { SettingsModal } from './components/SettingsModal';

const MainContent: React.FC = () => {
  const { activeTab, isProcessing, processingProgress } = useProject();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar Navigation */}
      <TopBar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Module Navigation Tabs */}
      <NavigationTabs />

      {/* Global Processing Banner Indicator */}
      {isProcessing && (
        <div className="bg-cyan-950/80 border-b border-cyan-800/80 px-6 py-2 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{processingProgress || 'Processing computer vision pipeline...'}</span>
          </div>
          <span className="text-[11px] text-cyan-400/80">O(N) Pixel Buffers & Projection Profiler</span>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'upload' && <DocumentUpload />}
        {activeTab === 'preprocessing' && <PreprocessingInspector />}
        {activeTab === 'lines' && <LineSpacingAnalysis />}
        {activeTab === 'edges' && <TornEdgeMatching />}
        {activeTab === 'reconstruction' && <ReconstructionWorkspace />}
        {activeTab === 'ocr' && <OcrAnalysis />}
        {activeTab === 'report' && <AnalysisReport />}
      </main>

      {/* Settings & Calibration Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">TornDoc AI</span>
          <span aria-hidden="true">·</span>
          <span>Line Spacing Detection & Torn Document Reconstruction</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>Computer Vision & Image Processing</span>
          <span aria-hidden="true">·</span>
          <span>Open Academic Reference Model</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <MainContent />
    </ProjectProvider>
  );
}
