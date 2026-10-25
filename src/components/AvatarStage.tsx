import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Repeat,
  Gauge,
  Layers,
  Compass,
  Camera,
  Smile,
  Hand
} from 'lucide-react';
import { SignClip } from '../core/types';
import {
  interpolateKeyframes,
  getDefaultPose,
  InterpolatedPose
} from '../adapters/signAnimation/SignAnimatorAdapter';
import { ThreeAvatarRig, CameraPreset } from '../adapters/signAnimation/threeAvatarAdapter';
import { SvgAvatarAdapter } from '../adapters/signAnimation/svgAvatarAdapter';
import { TrustBadge } from './TrustBadge';

interface AvatarStageProps {
  clip: SignClip | null;
  mode?: 'three' | 'svg';
  skinTone?: string;
  outfitColor?: string;
  backgroundColor?: string;
  showCaption?: boolean;
  className?: string;
  onTimeUpdate?: (currentTimeMs: number) => void;
  seekTimeMs?: number | null;
}

export const AvatarStage: React.FC<AvatarStageProps> = ({
  clip,
  mode = 'three',
  skinTone = '#e0ac69',
  outfitColor = '#0d9488',
  backgroundColor = '#0b0f19',
  showCaption = true,
  className = '',
  onTimeUpdate,
  seekTimeMs
}) => {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<ThreeAvatarRig | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [currentPose, setCurrentPose] = useState<InterpolatedPose>(getDefaultPose());
  const [renderMode, setRenderMode] = useState<'three' | 'svg'>(mode);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('CHEST_SIGNING');

  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  const currentTimeMsRef = useRef<number>(0);

  // Initialize Three.js Rig
  useEffect(() => {
    if (renderMode !== 'three' || !threeContainerRef.current) return;

    try {
      const rig = new ThreeAvatarRig(threeContainerRef.current, {
        skinTone,
        outfitColor,
        backgroundColor
      });
      rigRef.current = rig;

      const handleResize = () => rig.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        rig.dispose();
        rigRef.current = null;
      };
    } catch (e) {
      console.warn('Three.js initialization failed; falling back to 2D SVG avatar.', e);
      setRenderMode('svg');
    }
  }, [renderMode, backgroundColor]);

  // Update rig material options
  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.updateAppearance({ skinTone, outfitColor, backgroundColor });
    }
  }, [skinTone, outfitColor, backgroundColor]);

  // Main Animation Loop with Direct Synchronous 60 FPS RAF Execution
  const animate = useCallback((timestamp: number) => {
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const delta = (timestamp - lastTimestampRef.current) * speed;
    lastTimestampRef.current = timestamp;

    if (clip && isPlaying) {
      let nextTime = currentTimeMsRef.current + delta;
      if (nextTime >= clip.durationMs) {
        if (isLooping) {
          nextTime = 0;
        } else {
          nextTime = clip.durationMs;
          setIsPlaying(false);
        }
      }
      currentTimeMsRef.current = nextTime;

      // Direct synchronous pose update inside RAF without cascading effect delays
      const pose = interpolateKeyframes(clip, nextTime);
      if (rigRef.current) {
        rigRef.current.updatePose(pose);
      }
      if (renderMode === 'svg') {
        setCurrentPose(pose);
      }

      setCurrentTimeMs(nextTime);
      onTimeUpdateRef.current?.(nextTime);
    } else if (!clip) {
      const def = getDefaultPose();
      if (rigRef.current) {
        rigRef.current.updatePose(def);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [clip, isPlaying, isLooping, speed, renderMode]);

  useEffect(() => {
    lastTimestampRef.current = null;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animate]);

  // React to external seek requests
  useEffect(() => {
    if (seekTimeMs !== undefined && seekTimeMs !== null) {
      currentTimeMsRef.current = seekTimeMs;
      setCurrentTimeMs(seekTimeMs);
      onTimeUpdateRef.current?.(seekTimeMs);
      if (clip) {
        const pose = interpolateKeyframes(clip, seekTimeMs);
        if (rigRef.current) rigRef.current.updatePose(pose);
        if (renderMode === 'svg') setCurrentPose(pose);
      }
    }
  }, [seekTimeMs, clip, renderMode]);

  // Reset playhead and pose when clip changes
  useEffect(() => {
    currentTimeMsRef.current = 0;
    setCurrentTimeMs(0);
    setIsPlaying(true);
    if (clip) {
      const pose = interpolateKeyframes(clip, 0);
      if (rigRef.current) rigRef.current.updatePose(pose);
      if (renderMode === 'svg') setCurrentPose(pose);
    } else {
      const def = getDefaultPose();
      if (rigRef.current) rigRef.current.updatePose(def);
      if (renderMode === 'svg') setCurrentPose(def);
    }
  }, [clip?.id, renderMode]);

  const handleStepForward = () => {
    if (!clip) return;
    setIsPlaying(false);
    const stepped = Math.min(clip.durationMs, currentTimeMsRef.current + 120);
    currentTimeMsRef.current = stepped;
    setCurrentTimeMs(stepped);
    const pose = interpolateKeyframes(clip, stepped);
    if (rigRef.current) rigRef.current.updatePose(pose);
    if (renderMode === 'svg') setCurrentPose(pose);
    onTimeUpdateRef.current?.(stepped);
  };

  const handleReplay = () => {
    currentTimeMsRef.current = 0;
    setCurrentTimeMs(0);
    setIsPlaying(true);
    if (clip) {
      const pose = interpolateKeyframes(clip, 0);
      if (rigRef.current) rigRef.current.updatePose(pose);
      if (renderMode === 'svg') setCurrentPose(pose);
    }
    onTimeUpdateRef.current?.(0);
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5];

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 text-slate-100 shadow-2xl ${className}`}
      role="region"
      aria-label="Indian Sign Language Animated Avatar Stage"
    >
      {/* Top Overlay Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {showCaption && clip ? (
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg">
            <span className="font-extrabold text-sm tracking-wide text-brand-300">
              {clip.gloss}
            </span>
            <span className="text-xs text-slate-300">
              ({clip.labels.hi} / {clip.labels.en})
            </span>
            <TrustBadge level={clip.trustLevel} provenance={clip.provenance} />
          </div>
        ) : (
          <div className="pointer-events-auto bg-slate-900/80 px-3 py-1 rounded-full text-xs text-slate-400">
            Awaiting Sign Input
          </div>
        )}

        <button
          type="button"
          onClick={() => setRenderMode(renderMode === 'three' ? 'svg' : 'three')}
          className="pointer-events-auto p-1.5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md rounded-lg text-xs font-semibold flex items-center gap-1 text-slate-200 border border-slate-700 focus-visible:ring-2"
          aria-label={`Toggle avatar mode. Current: ${renderMode === 'three' ? '3D Rig' : '2D SVG'}`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{renderMode === 'three' ? '3D' : '2D'}</span>
        </button>
      </div>

      {/* Main Avatar Viewport */}
      <div className="relative w-full h-72 sm:h-84 flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {renderMode === 'three' ? (
          <div ref={threeContainerRef} className="w-full h-full" />
        ) : (
          <SvgAvatarAdapter
            pose={currentPose}
            skinTone={skinTone}
            outfitColor={outfitColor}
            className="w-full h-full max-h-72"
          />
        )}

        {renderMode === 'three' && (
          <>
            {/* Camera Perspective Presets */}
            <div className="absolute top-12 left-3 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-[11px] shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setCameraPreset('CHEST_SIGNING');
                  rigRef.current?.applyCameraPreset('CHEST_SIGNING');
                }}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                  cameraPreset === 'CHEST_SIGNING'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chest & Signing Space"
              >
                <Camera className="w-3 h-3" />
                <span>Sign</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCameraPreset('HANDS_FOCUS');
                  rigRef.current?.applyCameraPreset('HANDS_FOCUS');
                }}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                  cameraPreset === 'HANDS_FOCUS'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Hands Zoom"
              >
                <Hand className="w-3 h-3" />
                <span>Hands</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCameraPreset('FACE_NMM');
                  rigRef.current?.applyCameraPreset('FACE_NMM');
                }}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                  cameraPreset === 'FACE_NMM'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Face & Non-Manual Markers"
              >
                <Smile className="w-3 h-3" />
                <span>Face</span>
              </button>
            </div>

            <div className="absolute top-12 right-3 pointer-events-none text-[11px] font-semibold text-slate-400 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded border border-slate-700/60 shadow">
              360° Drag & Zoom
            </div>
          </>
        )}

        {/* Progress Bar */}
        {clip && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80">
            <div
              className="h-full bg-brand-500"
              style={{
                width: `${(currentTimeMs / clip.durationMs) * 100}%`
              }}
            />
          </div>
        )}
      </div>

      {/* Playback Controls Toolbar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Play/Pause & Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!clip}
            className="min-h-touch min-w-touch px-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold flex items-center gap-1.5 shadow focus-visible:ring-2"
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={handleReplay}
            disabled={!clip}
            className="min-h-touch p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 focus-visible:ring-2"
            aria-label="Replay sign from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleStepForward}
            disabled={!clip}
            className="min-h-touch p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 focus-visible:ring-2"
            aria-label="Step forward 120 milliseconds"
          >
            <StepForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`min-h-touch p-2.5 rounded-xl border focus-visible:ring-2 ${
              isLooping
                ? 'bg-brand-950/60 border-brand-500 text-brand-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            aria-label={`Loop playback: ${isLooping ? 'Enabled' : 'Disabled'}`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {renderMode === 'three' && (
            <button
              type="button"
              onClick={() => rigRef.current?.resetView()}
              className="min-h-touch p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus-visible:ring-2"
              title="Reset 3D camera to front orientation"
              aria-label="Reset 3D camera to front orientation"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Playback Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" aria-hidden="true" />
          {speedOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold focus-visible:ring-2 ${
                speed === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
