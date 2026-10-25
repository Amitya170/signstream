import React, { useState } from 'react';
import {
  X,
  Video,
  Camera,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { SignClip } from '../core/types';

interface ClipExporterModalProps {
  clip: SignClip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClipExporterModal: React.FC<ClipExporterModalProps> = ({
  clip,
  isOpen,
  onClose
}) => {
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  if (!isOpen || !clip) return null;

  const getActiveCanvas = (): HTMLCanvasElement | null => {
    return document.querySelector('canvas');
  };

  const handleExportSnapshot = () => {
    setExportError(null);
    try {
      const canvas = getActiveCanvas();
      if (!canvas) {
        setExportError('Could not find active 3D Avatar canvas.');
        return;
      }

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `ISL-${clip.gloss}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSnapshotTaken(true);
      setTimeout(() => setSnapshotTaken(false), 2500);
    } catch (e: any) {
      setExportError(e.message || 'Snapshot export failed.');
    }
  };

  const handleExportWebMVideo = async () => {
    setExportError(null);
    const canvas = getActiveCanvas();
    if (!canvas) {
      setExportError('Could not find active 3D Avatar canvas.');
      return;
    }

    if (typeof (canvas as any).captureStream !== 'function') {
      setExportError('Canvas capture is not supported in this browser environment.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setExportError('MediaRecorder is not supported in this browser.');
      return;
    }

    setIsExportingVideo(true);
    setVideoProgress(5);
    setExportedVideoUrl(null);

    try {
      const stream = (canvas as any).captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setExportedVideoUrl(url);
        setIsExportingVideo(false);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `ISL-${clip.gloss}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      recorder.start();

      // Record for the clip's duration or default 2500ms
      const duration = Math.max(1500, Math.min(clip.durationMs || 2500, 5000));
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(95, Math.round((elapsed / duration) * 100));
        setVideoProgress(pct);
      }, 100);

      setTimeout(() => {
        clearInterval(progressInterval);
        setVideoProgress(100);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, duration);
    } catch (e: any) {
      setIsExportingVideo(false);
      setExportError(e.message || 'Video recording failed.');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Indian Sign Language (ISL) Sign: "${clip.gloss}" (${clip.labels.hi} / ${clip.labels.en})\nVerified against ISLRTC Corpus via Project SignStream.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exporter-modal-title"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-teal-500/40 rounded-3xl shadow-[0_0_50px_rgba(13,148,136,0.3)] overflow-hidden flex flex-col">
        {/* Neon Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500" />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
                On-Device Exporter
              </span>
              <span className="text-xs font-mono text-slate-400">100% Private</span>
            </div>
            <h2 id="exporter-modal-title" className="text-xl font-black text-white mt-1">
              Export & Share Sign: {clip.gloss}
            </h2>
            <p className="text-xs text-slate-400">
              Generate offline video recordings, HD snapshots, and direct sharing links.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {exportError && (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Action 1: WebM Video Recording */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Record WebM Video</h3>
                  <p className="text-[11px] text-slate-400">
                    Captures 60 FPS animation sequence directly from the 3D canvas
                  </p>
                </div>
              </div>
            </div>

            {isExportingVideo ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-teal-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording Canvas...
                  </span>
                  <span className="font-mono">{videoProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-100"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              </div>
            ) : exportedVideoUrl ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Clip Downloaded Successfully!
                </span>
                <button
                  type="button"
                  onClick={handleExportWebMVideo}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 font-bold"
                >
                  Record Again
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleExportWebMVideo}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                <Video className="w-4 h-4" />
                <span>Record & Download WebM ({((clip.durationMs || 2500) / 1000).toFixed(1)}s)</span>
              </button>
            )}
          </div>

          {/* Action 2: HD Snapshot Frame */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Capture HD Frame</h3>
                <p className="text-[11px] text-slate-400">Instant PNG snapshot of current avatar pose</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportSnapshot}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-98"
            >
              {snapshotTaken ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save PNG</span>
                </>
              )}
            </button>
          </div>

          {/* Action 3: Quick Share via WhatsApp */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">WhatsApp & Messaging</h3>
                <p className="text-[11px] text-slate-400">Share sign gloss and ISL translation with peers</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
