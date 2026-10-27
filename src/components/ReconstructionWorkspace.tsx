/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Move,
  RotateCw,
  Sparkles,
  Download,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const ReconstructionWorkspace: React.FC = () => {
  const {
    fragments,
    setFragments,
    matches,
    selectedFragmentId,
    setSelectedFragmentId,
    activeProjectTitle,
  } = useProject();

  const [zoom, setZoom] = useState<number>(0.85);
  const [showBaselinesGuide, setShowBaselinesGuide] = useState<boolean>(true);
  const [showTornSeamHighlight, setShowTornSeamHighlight] = useState<boolean>(true);
  const [draggingFragmentId, setDraggingFragmentId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fragInitialOffset, setFragInitialOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedFrag = fragments.find((f) => f.id === selectedFragmentId) || fragments[0];
  const topMatch = matches.length > 0 ? matches[0] : null;

  // Auto-snap to best algorithmic match
  const handleAutoSnap = () => {
    if (!topMatch) return;
    setFragments((prev) =>
      prev.map((f) => {
        if (f.id === topMatch.fragmentBId) {
          const fragA = prev.find((p) => p.id === topMatch.fragmentAId);
          const baseOffset = fragA?.offset || { x: 80, y: 80 };
          return {
            ...f,
            offset: {
              x: baseOffset.x + topMatch.relativeOffset.x,
              y: baseOffset.y + topMatch.relativeOffset.y,
            },
            rotation: topMatch.relativeRotation,
          };
        }
        return f;
      })
    );
  };

  // Render composite canvas workspace
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas dimensions
    canvas.width = 1400;
    canvas.height = 1100;

    // Draw workbench background grid
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (30px grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render each fragment with its current position and rotation
    fragments.forEach((frag) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.translate(frag.offset.x + frag.width / 2, frag.offset.y + frag.height / 2);
        ctx.rotate((frag.rotation * Math.PI) / 180);
        ctx.translate(-frag.width / 2, -frag.height / 2);

        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;

        ctx.drawImage(img, 0, 0, frag.width, frag.height);
        ctx.shadowColor = 'transparent';

        // Draw selection highlight border
        if (frag.id === selectedFragmentId) {
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(0, 0, frag.width, frag.height);

          // Corner handles
          ctx.fillStyle = '#06B6D4';
          ctx.fillRect(-4, -4, 8, 8);
          ctx.fillRect(frag.width - 4, -4, 8, 8);
          ctx.fillRect(-4, frag.height - 4, 8, 8);
          ctx.fillRect(frag.width - 4, frag.height - 4, 8, 8);
        }

        // Draw Baselines Seam Guide
        if (showBaselinesGuide && frag.lines.length > 0) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 1.5;

          frag.lines.forEach((line) => {
            ctx.beginPath();
            // Extend guide line outside fragment to verify alignment across seam
            ctx.moveTo(-40, line.baseline);
            ctx.lineTo(frag.width + 40, line.baseline);
            ctx.stroke();
          });
          ctx.setLineDash([]);
        }

        ctx.restore();
      };
      img.src = frag.originalImageUrl;
    });
  }, [fragments, selectedFragmentId, showBaselinesGuide, showTornSeamHighlight]);

  // Drag interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    // Check hit test on fragments from top to bottom
    for (let i = fragments.length - 1; i >= 0; i--) {
      const f = fragments[i];
      if (
        mouseX >= f.offset.x &&
        mouseX <= f.offset.x + f.width &&
        mouseY >= f.offset.y &&
        mouseY <= f.offset.y + f.height
      ) {
        setSelectedFragmentId(f.id);
        setDraggingFragmentId(f.id);
        setDragStartPos({ x: mouseX, y: mouseY });
        setFragInitialOffset({ ...f.offset });
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingFragmentId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    const deltaX = mouseX - dragStartPos.x;
    const deltaY = mouseY - dragStartPos.y;

    setFragments((prev) =>
      prev.map((f) => {
        if (f.id === draggingFragmentId) {
          return {
            ...f,
            offset: {
              x: Math.round(fragInitialOffset.x + deltaX),
              y: Math.round(fragInitialOffset.y + deltaY),
            },
          };
        }
        return f;
      })
    );
  };

  const handleMouseUp = () => {
    setDraggingFragmentId(null);
  };

  const handleRotateFragment = (degrees: number) => {
    if (!selectedFragmentId) return;
    setFragments((prev) =>
      prev.map((f) => {
        if (f.id === selectedFragmentId) {
          return { ...f, rotation: degrees };
        }
        return f;
      })
    );
  };

  // Export reconstructed composite as PNG
  const exportReconstructedImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `TornDoc_Reconstruction_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const isLowConfidence = topMatch ? topMatch.totalScore < 0.8 : true;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>Module 06</span>
            <span aria-hidden="true">·</span>
            <span>Interactive 2D Reconstruction Workbench</span>
          </div>
          <h1 className="text-xl font-bold text-white">Document Fragment Alignment & Reconstruction</h1>
        </div>

        <div className="flex items-center gap-3">
          {topMatch && (
            <button
              onClick={handleAutoSnap}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Snap to Algorithmic Match ({(topMatch.totalScore * 100).toFixed(0)}%)</span>
            </button>
          )}

          <button
            onClick={exportReconstructedImage}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Uncertainty Notice Badge */}
      {isLowConfidence && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Algorithmic Estimate:</strong> Current alignment is based on probability score{' '}
              {topMatch ? `${(topMatch.totalScore * 100).toFixed(0)}%` : 'N/A'}. Manual verification
              recommended.
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700">
            ESTIMATE
          </span>
        </div>
      )}

      {/* Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Canvas Viewport (9 cols) */}
        <div className="lg:col-span-9 space-y-3">
          {/* Toolbar controls */}
          <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="font-semibold px-2">Guides:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBaselinesGuide}
                  onChange={(e) => setShowBaselinesGuide(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
                <span>Baseline Continuations</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-mono">Zoom:</span>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-white tabular-nums px-1">
                {(zoom * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Canvas Container */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-[620px] bg-slate-950 rounded-xl border border-slate-800 overflow-auto cursor-grab active:cursor-grabbing flex items-center justify-center relative select-none"
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: draggingFragmentId ? 'none' : 'transform 0.1s ease',
              }}
            >
              <canvas ref={canvasRef} className="shadow-2xl rounded" />
            </div>

            <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded text-[11px] font-mono text-slate-400 pointer-events-none">
              Click & drag to position · Selected:{' '}
              <span className="text-cyan-400">{selectedFrag?.name || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Selected Fragment Fine-Tuning Controls (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {selectedFrag ? (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white truncate">{selectedFrag.name}</h3>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  X: {selectedFrag.offset.x}px · Y: {selectedFrag.offset.y}px
                </div>
              </div>

              {/* Rotation Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Fine Rotation</span>
                  <span className="font-mono text-cyan-400">{selectedFrag.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="0.5"
                  value={selectedFrag.rotation}
                  onChange={(e) => handleRotateFragment(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="grid grid-cols-4 gap-1 pt-1">
                  <button
                    onClick={() => handleRotateFragment((selectedFrag.rotation - 90) % 360)}
                    className="py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    -90°
                  </button>
                  <button
                    onClick={() => handleRotateFragment(selectedFrag.rotation - 1)}
                    className="py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    -1°
                  </button>
                  <button
                    onClick={() => handleRotateFragment(selectedFrag.rotation + 1)}
                    className="py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    +1°
                  </button>
                  <button
                    onClick={() => handleRotateFragment((selectedFrag.rotation + 90) % 360)}
                    className="py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    +90°
                  </button>
                </div>
              </div>

              {/* Fragment layer ordering */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Layer Fragments:</span>
                <div className="space-y-1">
                  {fragments.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFragmentId(f.id)}
                      className={`w-full p-2 text-left text-xs rounded truncate transition-colors flex items-center justify-between ${
                        f.id === selectedFrag.id
                          ? 'bg-slate-800 text-cyan-400 font-semibold border border-cyan-500/40'
                          : 'bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{f.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">#{i + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top match quick snap */}
              {topMatch && (
                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={handleAutoSnap}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-cyan-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Align Candidate</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
              Select a fragment in the canvas to adjust position and rotation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
