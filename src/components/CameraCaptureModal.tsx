/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  AlertCircle,
  Upload,
  Ruler,
  FlipHorizontal,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose }) => {
  const { addDocumentAndAnalyze, isProcessing } = useProject();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    stopCamera();

    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (err) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      let message = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in browser settings or upload a file directly.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera hardware detected on this device. You can upload an existing document photo.';
      } else if (err.name === 'NotReadableError') {
        message = 'Camera is currently in use by another application.';
      }
      setCameraError(message);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setCapturedImage(dataUrl);

    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleAcceptAndAnalyze = async () => {
    if (!capturedImage) return;
    const docName = `Camera_Scan_${new Date().toLocaleTimeString().replace(/[: ]/g, '_')}`;
    onClose();
    await addDocumentAndAnalyze(capturedImage, docName);
  };

  const handleFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        onClose();
        await addDocumentAndAnalyze(dataUrl, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800/60">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Capture Document Photo</h2>
              <p className="text-xs text-slate-400">
                Position printed or handwritten document in frame to measure line spacing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!capturedImage && !cameraError && (
              <button
                onClick={toggleFacingMode}
                title="Switch Camera"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Flip</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative aspect-4/3 w-full bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center space-y-4 max-w-md">
              <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Camera Access Error</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={startCamera}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
                <button
                  onClick={() => fileFallbackRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo File</span>
                </button>
                <input
                  ref={fileFallbackRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileFallback}
                  className="hidden"
                />
              </div>
            </div>
          ) : capturedImage ? (
            /* Freeze-frame captured photo preview */
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
              <img
                src={capturedImage}
                alt="Captured Document"
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-900/90 border border-cyan-500/40 text-[11px] font-mono text-cyan-400">
                Photo Captured · Ready for Line Spacing Analysis
              </div>
            </div>
          ) : (
            /* Live Camera Stream Viewfinder */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Document Alignment Framing Overlay */}
              <div className="absolute inset-8 sm:inset-12 pointer-events-none border border-cyan-400/40 rounded-lg flex flex-col justify-between p-3 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm" />
                </div>

                <div className="w-full flex items-center justify-center gap-2">
                  <div className="h-px w-1/3 bg-cyan-400/30" />
                  <span className="text-[10px] font-mono text-cyan-400/80 px-2 py-0.5 rounded bg-black/60">
                    Align Document Horizontally
                  </span>
                  <div className="h-px w-1/3 bg-cyan-400/30" />
                </div>

                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-sm" />
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 text-xs font-mono text-cyan-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to camera hardware...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileFallbackRef.current?.click()}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors py-1.5 px-2 rounded hover:bg-slate-800"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File Instead</span>
            </button>
            <input
              ref={fileFallbackRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileFallback}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-3">
            {capturedImage ? (
              <>
                <button
                  onClick={handleRetake}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Retake Photo
                </button>
                <button
                  onClick={handleAcceptAndAnalyze}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Ruler className="w-4 h-4" />
                  <span>Analyze Line Spacing Now</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCapture}
                  disabled={!!cameraError || isInitializing}
                  className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Camera className="w-4 h-4 fill-current" />
                  <span>Click Photo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
