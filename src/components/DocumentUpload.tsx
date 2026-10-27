/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  UploadCloud,
  FileImage,
  Scissors,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Play,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { simulateDocumentTear } from '../services/syntheticDatasetGenerator';

export const DocumentUpload: React.FC<{ onOpenCamera: () => void }> = ({ onOpenCamera }) => {
  const {
    fragments,
    setFragments,
    selectedFragmentId,
    setSelectedFragmentId,
    processAllFragments,
    isProcessing,
    settings,
  } = useProject();

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ripRoughness, setRipRoughness] = useState<number>(0.28);
  const [ripType, setRipType] = useState<'vertical' | 'horizontal'>('vertical');
  const [ripJitter, setRipJitter] = useState<number>(2.5);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setErrorMsg(null);
    const validExtensions = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp', 'application/pdf'];

    files.forEach((file) => {
      if (!validExtensions.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|tif|tiff|webp|pdf)$/i)) {
        setErrorMsg(`Unsupported format: ${file.name}. Please upload JPG, PNG, TIFF, or PDF.`);
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg(`File ${file.name} exceeds 25MB maximum limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const newId = `frag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const placeholderMetrics = {
            totalLines: 0,
            medianGapPx: 0,
            medianGapMm: 0,
            averageGapPx: 0,
            averageGapMm: 0,
            minGapPx: 0,
            minGapMm: 0,
            maxGapPx: 0,
            maxGapMm: 0,
            stdDevGapPx: 0,
            iqrGapPx: 0,
            medianBaselineSpacingPx: 0,
            medianBaselineSpacingMm: 0,
            anomalyCount: 0,
            missingLinesCount: 0,
            dpi: settings.dpi,
          };

          const newFragment = {
            id: newId,
            name: file.name,
            originalImageUrl: dataUrl,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            rotation: 0,
            offset: { x: 0, y: 0 },
            scale: 1,
            edges: [],
            lines: [],
            gaps: [],
            metrics: placeholderMetrics,
            projectionProfile: [],
          };

          setFragments((prev) => [...prev, newFragment]);
          setSelectedFragmentId(newId);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Applies fractal tearing to currently selected intact fragment
   */
  const handleTearCurrentFragment = () => {
    const target = fragments.find((f) => f.id === selectedFragmentId) || fragments[0];
    if (!target) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const { fragments: splitItems } = simulateDocumentTear(canvas, {
        roughness: ripRoughness,
        cutType: ripType,
        rotationJitterDegrees: ripJitter,
      });

      const generated = splitItems.map((item, idx) => {
        const id = `frag_${Date.now()}_${idx}`;
        return {
          id,
          name: `${target.name.replace(/\.[^/.]+$/, '')} (${item.name})`,
          originalImageUrl: item.canvas.toDataURL('image/png'),
          width: item.canvas.width,
          height: item.canvas.height,
          rotation: 0,
          offset: { x: idx * 300, y: 0 },
          scale: 1,
          edges: [],
          lines: [],
          gaps: [],
          metrics: { ...target.metrics },
          projectionProfile: [],
          syntheticGroundTruth: {
            parentId: target.name,
            originalX: item.groundTruth.originalX,
            originalY: item.groundTruth.originalY,
            originalRotation: item.groundTruth.originalRotation,
            fragmentIndex: item.groundTruth.fragmentIndex,
            trueSplitBoundary: item.groundTruth.splitPoints,
          },
        };
      });

      setFragments((prev) => [...prev.filter((f) => f.id !== target.id), ...generated]);
      setSelectedFragmentId(generated[0]?.id || null);
    };
    img.src = target.originalImageUrl;
  };

  const rotateSelectedFragment = (deltaAngle: number) => {
    if (!selectedFragmentId) return;
    setFragments((prev) =>
      prev.map((f) => {
        if (f.id !== selectedFragmentId) return f;
        const newAngle = (f.rotation + deltaAngle) % 360;
        return { ...f, rotation: newAngle };
      })
    );
  };

  const removeSelectedFragment = () => {
    if (!selectedFragmentId) return;
    setFragments((prev) => prev.filter((f) => f.id !== selectedFragmentId));
    setSelectedFragmentId(fragments[0]?.id || null);
  };

  const selectedFrag = fragments.find((f) => f.id === selectedFragmentId) || fragments[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white">Document Upload & Tear Generator</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Click a document photo with your camera, upload files, or synthesize irregular fractal
            tears.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCamera}
            className="px-4 py-2 text-xs font-semibold text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click Photo with Camera</span>
          </button>
          <button
            onClick={processAllFragments}
            disabled={isProcessing || fragments.length === 0}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isProcessing ? 'Processing Pipeline...' : 'Process All Fragments'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-md text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Zone & Tear Controls Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drag & Drop Ingestion (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Direct Camera Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Capture Document Photo</h3>
                <p className="text-xs text-slate-400">
                  Point your camera at any document to measure line spacing immediately
                </p>
              </div>
            </div>
            <button
              onClick={onOpenCamera}
              className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 fill-current" />
              <span>Click Photo</span>
            </button>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.tif,.tiff"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 rounded-full bg-slate-800 text-cyan-400">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  Drop scanned document images or PDF pages here
                </p>
                <p className="text-xs text-slate-400">
                  Supports JPG, PNG, TIFF, and PDF scans (up to 25MB each)
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Select intact documents or pre-cut torn fragments
              </div>
            </div>
          </div>

          {/* Fragment Thumbnail Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Uploaded Fragments ({fragments.length})
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Click to inspect and manipulate
              </span>
            </div>

            {fragments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800/80">
                No fragments loaded. Upload document images or load a benchmark from Dashboard.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fragments.map((frag) => {
                  const isSelected = frag.id === selectedFragmentId;
                  return (
                    <div
                      key={frag.id}
                      onClick={() => setSelectedFragmentId(frag.id)}
                      className={`relative p-2 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/50'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="aspect-4/3 w-full bg-slate-950 rounded flex items-center justify-center overflow-hidden mb-2">
                        <img
                          src={frag.originalImageUrl}
                          alt={frag.name}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                          style={{ transform: `rotate(${frag.rotation}deg)` }}
                        />
                      </div>
                      <div className="text-xs font-medium text-white truncate">{frag.name}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span>
                          {frag.width}×{frag.height}px
                        </span>
                        {frag.lines.length > 0 && (
                          <span className="text-cyan-400">{frag.lines.length} lines</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Fragment Inspection & Tear Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fragment Detail Card */}
          {selectedFrag ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white truncate max-w-[220px]">
                    {selectedFrag.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400">
                    ID: {selectedFrag.id.slice(0, 14)} · Rotation: {selectedFrag.rotation}°
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => rotateSelectedFragment(90)}
                    title="Rotate 90 degrees"
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={removeSelectedFragment}
                    title="Delete fragment"
                    className="p-1.5 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fragment Zoomable Viewport */}
              <div className="relative aspect-4/3 w-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
                <img
                  src={selectedFrag.originalImageUrl}
                  alt={selectedFrag.name}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain transition-transform"
                  style={{
                    transform: `rotate(${selectedFrag.rotation}deg) scale(${zoomLevel})`,
                  }}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded p-1 text-slate-400">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1 hover:text-white"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1 tabular-nums">
                    {(zoomLevel * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="p-1 hover:text-white"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Synthetic Tearing Controls Panel */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Fractal Tear Simulator</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Brownian Walk</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Fractal Edge Roughness</span>
                      <span className="font-mono text-white">{ripRoughness}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.02"
                      value={ripRoughness}
                      onChange={(e) => setRipRoughness(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Cut Fracture Orientation</span>
                      <span className="font-mono uppercase text-white">{ripType}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRipType('vertical')}
                        className={`py-1.5 text-xs font-medium rounded border ${
                          ripType === 'vertical'
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        Vertical Split
                      </button>
                      <button
                        onClick={() => setRipType('horizontal')}
                        className={`py-1.5 text-xs font-medium rounded border ${
                          ripType === 'horizontal'
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        Horizontal Split
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Angular Jitter Angle</span>
                      <span className="font-mono text-white">{ripJitter}°</span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.5"
                      value={ripJitter}
                      onChange={(e) => setRipJitter(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <button
                  onClick={handleTearCurrentFragment}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Simulate Tear & Generate Ground Truth</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
              Select or upload a fragment to inspect and manipulate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
