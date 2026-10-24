import React, { useEffect, useState } from 'react';
import { Sun, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { StrokePhaseState } from '../../adapters/signRecognition/temporalGestureClassifier';

interface VisionHUDProps {
  phaseState: StrokePhaseState | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  handCount: number;
}

export const VisionHUD: React.FC<VisionHUDProps> = ({
  phaseState,
  videoRef,
  isActive,
  handCount
}) => {
  const [luminance, setLuminance] = useState<number>(120); // 0 (pitch black) to 255 (bright)

  // Periodic Ambient Light Sampling (every 1 second)
  useEffect(() => {
    if (!isActive) return;

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 32;
    sampleCanvas.height = 24;
    const ctx = sampleCanvas.getContext('2d');

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !ctx) return;

      try {
        ctx.drawImage(video, 0, 0, 32, 24);
        const data = ctx.getImageData(0, 0, 32, 24).data;
        let sum = 0;
        const totalPixels = 32 * 24;

        for (let i = 0; i < data.length; i += 4) {
          // Standard ITU-R BT.601 perceptual luminance formula
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += lum;
        }

        const avg = Math.round(sum / totalPixels);
        setLuminance(avg);
      } catch {
        // cross-origin or video not ready
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isActive, videoRef]);

  if (!isActive) return null;

  const isLowLight = luminance < 45;
  const isOptimalLight = luminance >= 80;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Top Status Indicators */}
      <div className="flex items-center justify-between w-full">
        {/* Ambient Lux / Lighting Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border shadow transition-colors ${
            isLowLight
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse'
              : isOptimalLight
              ? 'bg-slate-900/80 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900/80 text-amber-300 border-amber-500/40'
          }`}
        >
          {isLowLight ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Light: Increase Illumination</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Lighting: {isOptimalLight ? 'Optimal' : 'Moderate'}</span>
            </>
          )}
        </div>

        {/* Real-time Hand Detection Counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-slate-200 border border-slate-700 backdrop-blur-md shadow">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>{handCount === 0 ? 'No Hands in Frame' : `${handCount} Hand${handCount > 1 ? 's' : ''} Tracked`}</span>
        </div>
      </div>

      {/* Center Silhouette Alignment Guide (Semi-transparent visual target box) */}
      <div className="flex-1 flex items-center justify-center my-2">
        <div className="relative w-4/5 max-w-[340px] aspect-[4/3] border-2 border-dashed border-brand-400/35 rounded-3xl flex flex-col items-center justify-center pointer-events-none">
          {/* Subtle guide crosshairs */}
          <div className="absolute top-2 text-[10px] uppercase font-bold tracking-widest text-brand-400/60 bg-slate-950/40 px-2 py-0.5 rounded">
            Signing Space
          </div>
          <div className="w-20 h-20 rounded-full border border-dashed border-slate-500/30 opacity-40 mb-2" />
          <div className="text-[11px] font-semibold text-slate-400/80 bg-slate-900/60 px-2 py-1 rounded-md text-center max-w-[200px]">
            Keep chest and hands within this guide
          </div>
        </div>
      </div>

      {/* Bottom Kinetic Gesture Phase & Stability Gauge */}
      {phaseState && (
        <div className="w-full flex items-center justify-between gap-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            <span className="font-semibold">
              Stroke Phase:{' '}
              <strong
                className={
                  phaseState.phase === 'STROKE'
                    ? 'text-emerald-400'
                    : phaseState.phase === 'PREPARATION'
                    ? 'text-amber-300'
                    : 'text-slate-400'
                }
              >
                {phaseState.phase}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Tracking Stability:</span>
            <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-100"
                style={{ width: `${Math.round(phaseState.stability * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-white">
              {Math.round(phaseState.stability * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
