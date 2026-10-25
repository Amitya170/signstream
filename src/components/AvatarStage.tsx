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
  Hand,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { SignClip } from '../core/types';
import {
  interpolateKeyframes,
  getDefaultPose,
  InterpolatedPose
} from '../adapters/signAnimation/SignAnimatorAdapter';
import { ThreeAvatarRig, CameraPreset, VisualStyle } from '../adapters/signAnimation/threeAvatarAdapter';
import { GlbAvatarRig, GlbModelId } from '../adapters/signAnimation/glbAvatarAdapter';
import { SvgAvatarAdapter } from '../adapters/signAnimation/svgAvatarAdapter';
import { TrustBadge } from './TrustBadge';

export type AvatarRenderMode = 'glb' | 'three' | 'svg';

interface AvatarStageProps {
  clip: SignClip | null;
  mode?: AvatarRenderMode;
  visualStyle?: VisualStyle;
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
  mode = 'glb',
  visualStyle: initialVisualStyle = 'STUDIO_HUMAN',
  skinTone = '#e0ac69',
  outfitColor = '#0d9488',
  backgroundColor = '#0b0f19',
  showCaption = true,
  className = '',
  onTimeUpdate,
  seekTimeMs
}) => {
  const glbContainerRef = useRef<HTMLDivElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const glbRigRef = useRef<GlbAvatarRig | null>(null);
  const threeRigRef = useRef<ThreeAvatarRig | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [currentPose, setCurrentPose] = useState<InterpolatedPose>(getDefaultPose());
  const [renderMode, setRenderMode] = useState<AvatarRenderMode>(mode);
  const [glbModelId, setGlbModelId] = useState<GlbModelId>('michelle');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(initialVisualStyle);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('CHEST_SIGNING');
  const [activeSolverText, setActiveSolverText] = useState<string>('Articulated Signing');

  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  const currentTimeMsRef = useRef<number>(0);

  // 1. Initialize Realistic GLB Rig
  useEffect(() => {
    if (renderMode !== 'glb' || !glbContainerRef.current) return;

    try {
      const rig = new GlbAvatarRig(
        glbContainerRef.current,
        {
          skinTone,
          outfitColor,
          backgroundColor,
          visualStyle
        },
        glbModelId
      );
      glbRigRef.current = rig;

      // Seed initial pose immediately so model renders in active pose when load completes
      const initialPose = clip ? interpolateKeyframes(clip, currentTimeMsRef.current) : getDefaultPose();
      rig.updatePose(initialPose);

      const handleResize = () => rig.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        rig.dispose();
        glbRigRef.current = null;
      };
    } catch (e) {
      console.warn('GLB Avatar initialization failed; falling back to Three.js procedural avatar.', e);
      setRenderMode('three');
    }
  }, [renderMode, backgroundColor, glbModelId]);

  // 2. Initialize Three.js Procedural Rig (Fallback)
  useEffect(() => {
    if (renderMode !== 'three' || !threeContainerRef.current) return;

    try {
      const rig = new ThreeAvatarRig(threeContainerRef.current, {
        skinTone,
        outfitColor,
        backgroundColor,
        visualStyle
      });
      threeRigRef.current = rig;

      const handleResize = () => rig.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        rig.dispose();
        threeRigRef.current = null;
      };
    } catch (e) {
      console.warn('Three.js initialization failed; falling back to 2D SVG avatar.', e);
      setRenderMode('svg');
    }
  }, [renderMode, backgroundColor]);

  // Update rig material options and visual style
  useEffect(() => {
    if (glbRigRef.current) {
      glbRigRef.current.updateAppearance({ skinTone, outfitColor, backgroundColor, visualStyle });
    }
    if (threeRigRef.current) {
      threeRigRef.current.updateAppearance({ skinTone, outfitColor, backgroundColor, visualStyle });
    }
  }, [skinTone, outfitColor, backgroundColor, visualStyle]);

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
      if (renderMode === 'glb' && glbRigRef.current) {
        glbRigRef.current.updatePose(pose);
        const solver = glbRigRef.current.getActiveSolverName();
        setActiveSolverText(solver);
      } else if (renderMode === 'three' && threeRigRef.current) {
        threeRigRef.current.updatePose(pose);
      } else if (renderMode === 'svg') {
        setCurrentPose(pose);
      }

      setCurrentTimeMs(nextTime);
      onTimeUpdateRef.current?.(nextTime);
    } else if (!clip) {
      const def = getDefaultPose();
      if (renderMode === 'glb' && glbRigRef.current) {
        glbRigRef.current.updatePose(def);
        const solver = glbRigRef.current.getActiveSolverName();
        setActiveSolverText(solver);
      } else if (renderMode === 'three' && threeRigRef.current) {
        threeRigRef.current.updatePose(def);
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
        if (renderMode === 'glb' && glbRigRef.current) glbRigRef.current.updatePose(pose);
        if (renderMode === 'three' && threeRigRef.current) threeRigRef.current.updatePose(pose);
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
      if (renderMode === 'glb' && glbRigRef.current) glbRigRef.current.updatePose(pose);
      if (renderMode === 'three' && threeRigRef.current) threeRigRef.current.updatePose(pose);
      if (renderMode === 'svg') setCurrentPose(pose);
    } else {
      const def = getDefaultPose();
      if (renderMode === 'glb' && glbRigRef.current) glbRigRef.current.updatePose(def);
      if (renderMode === 'three' && threeRigRef.current) threeRigRef.current.updatePose(def);
      if (renderMode === 'svg') setCurrentPose(def);
    }
  }, [clip?.id, renderMode]);

  const handleStepForward = () => {
    if (!clip) return;
    setIsPlaying(false);
    const stepped = Math.min(clip.durationMs, currentTimeMsRef.current + 120);
    currentTimeMsRef.current = stepped;
    setCurrentTimeMs(stepped);
    onTimeUpdateRef.current?.(stepped);
    const pose = interpolateKeyframes(clip, stepped);
    if (renderMode === 'glb' && glbRigRef.current) glbRigRef.current.updatePose(pose);
    if (renderMode === 'three' && threeRigRef.current) threeRigRef.current.updatePose(pose);
    if (renderMode === 'svg') setCurrentPose(pose);
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!clip) return;
    const time = Number(e.target.value);
    currentTimeMsRef.current = time;
    setCurrentTimeMs(time);
    onTimeUpdateRef.current?.(time);
    const pose = interpolateKeyframes(clip, time);
    if (renderMode === 'glb' && glbRigRef.current) glbRigRef.current.updatePose(pose);
    if (renderMode === 'three' && threeRigRef.current) threeRigRef.current.updatePose(pose);
    if (renderMode === 'svg') setCurrentPose(pose);
  };

  const progressPercent = clip ? (currentTimeMs / clip.durationMs) * 100 : 0;

  const cycleRenderMode = () => {
    if (renderMode === 'glb') setRenderMode('three');
    else if (renderMode === 'three') setRenderMode('svg');
    else setRenderMode('glb');
  };

  return (
    <div
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative ${className}`}
    >
      {/* Stage Top Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        {clip ? (
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 pointer-events-auto shadow-md">
            <span className="text-xs font-bold text-white tracking-wide">
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

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* 3D Model Selection: Michelle (Realistic Human) vs ReadyPlayer vs Xbot */}
          {renderMode === 'glb' && (
            <div className="flex items-center bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/80 text-xs">
              <label htmlFor="avatar-model-select" className="sr-only">3D Avatar Model</label>
              <select
                id="avatar-model-select"
                value={glbModelId}
                onChange={(e) => setGlbModelId(e.target.value as GlbModelId)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                aria-label="Select 3D Avatar Character"
              >
                <option value="michelle" className="bg-slate-900 text-slate-100">Michelle (Human)</option>
                <option value="readyplayer" className="bg-slate-900 text-slate-100">ReadyPlayer (Stylized)</option>
                <option value="xbot" className="bg-slate-900 text-slate-100">Xbot (Cyber Humanoid)</option>
              </select>
            </div>
          )}

          {/* Visual Style: Studio Human vs Cyber Hologram */}
          <button
            type="button"
            onClick={() => setVisualStyle(v => (v === 'STUDIO_HUMAN' ? 'CYBER_HOLOGRAM' : 'STUDIO_HUMAN'))}
            className={`px-2.5 py-1 backdrop-blur-md rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              visualStyle === 'CYBER_HOLOGRAM'
                ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            aria-label={`Toggle avatar visual style. Current: ${visualStyle === 'CYBER_HOLOGRAM' ? 'Cyber Hologram' : 'Studio Human'}`}
            title="Toggle between Realistic Studio Human and Cyber Hologram digital aesthetics"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{visualStyle === 'CYBER_HOLOGRAM' ? 'Hologram' : 'Human'}</span>
          </button>

          {/* Render Mode Switcher: Realistic GLB 3D -> Pro 3D -> 2D SVG */}
          <button
            type="button"
            onClick={cycleRenderMode}
            className={`px-2.5 py-1 backdrop-blur-md rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              renderMode === 'glb'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            aria-label={`Cycle avatar render mode. Current: ${renderMode === 'glb' ? 'Realistic Human 3D' : renderMode === 'three' ? 'Procedural 3D' : '2D SVG'}`}
            title="Cycle between Realistic Human 3D (ReadyPlayerMe), Procedural 3D, and 2D SVG avatars"
          >
            {renderMode === 'glb' ? (
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Layers className="w-3.5 h-3.5" />
            )}
            <span>{renderMode === 'glb' ? 'Human 3D' : renderMode === 'three' ? 'Pro 3D' : '2D'}</span>
          </button>
        </div>
      </div>

      {/* Main Avatar Viewport */}
      <div className="relative w-full h-72 sm:h-84 flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {renderMode === 'glb' && (
          <div ref={glbContainerRef} className="w-full h-full" />
        )}
        {renderMode === 'three' && (
          <div ref={threeContainerRef} className="w-full h-full" />
        )}
        {renderMode === 'svg' && (
          <SvgAvatarAdapter
            pose={currentPose}
            skinTone={skinTone}
            outfitColor={outfitColor}
            visualStyle={visualStyle}
            className="w-full h-full max-h-72"
          />
        )}

        {(renderMode === 'glb' || renderMode === 'three') && (
          <>
            {/* Camera Perspective Presets */}
            <div className="absolute top-12 left-3 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-[11px] shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setCameraPreset('CHEST_SIGNING');
                  glbRigRef.current?.applyCameraPreset('CHEST_SIGNING');
                  threeRigRef.current?.applyCameraPreset('CHEST_SIGNING');
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
                  glbRigRef.current?.applyCameraPreset('HANDS_FOCUS');
                  threeRigRef.current?.applyCameraPreset('HANDS_FOCUS');
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
                  glbRigRef.current?.applyCameraPreset('FACE_NMM');
                  threeRigRef.current?.applyCameraPreset('FACE_NMM');
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

            {/* Live Kinematic Solver HUD Badge */}
            <div className="absolute bottom-3 right-3 pointer-events-none flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-cyan-400 font-mono shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{activeSolverText}</span>
            </div>
          </>
        )}
      </div>

      {/* Synchronized Scrubbing Timeline */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{(currentTimeMs / 1000).toFixed(2)}s</span>
          <span className="text-brand-400 font-semibold tracking-wide">
            {clip ? `${clip.keyframes.length} KEYFRAMES (MINIMUM-JERK SMOOTHED)` : 'IDLE'}
          </span>
          <span>{clip ? (clip.durationMs / 1000).toFixed(2) + 's' : '0.00s'}</span>
        </div>

        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={clip ? clip.durationMs : 1000}
            value={currentTimeMs}
            onChange={handleTimelineChange}
            disabled={!clip}
            aria-label="Animation playhead scrubbing timeline"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 disabled:opacity-40"
          />
          <div
            className="absolute left-0 top-0 bottom-0 bg-brand-500/40 rounded-l-lg pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Animation Playback HUD */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!clip}
            className="p-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-white rounded-xl shadow transition-colors focus-visible:ring-2 focus-visible:ring-brand-400"
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Reset playhead */}
          <button
            type="button"
            onClick={() => {
              currentTimeMsRef.current = 0;
              setCurrentTimeMs(0);
              onTimeUpdateRef.current?.(0);
              if (clip) {
                const pose = interpolateKeyframes(clip, 0);
                if (renderMode === 'glb' && glbRigRef.current) glbRigRef.current.updatePose(pose);
                if (renderMode === 'three' && threeRigRef.current) threeRigRef.current.updatePose(pose);
                if (renderMode === 'svg') setCurrentPose(pose);
              }
            }}
            disabled={!clip}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition-colors focus-visible:ring-2"
            aria-label="Restart animation from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step forward */}
          <button
            type="button"
            onClick={handleStepForward}
            disabled={!clip}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition-colors focus-visible:ring-2"
            aria-label="Step forward 120ms"
          >
            <StepForward className="w-4 h-4" />
          </button>

          {/* Reset Orbit View */}
          {(renderMode === 'glb' || renderMode === 'three') && (
            <button
              type="button"
              onClick={() => {
                setCameraPreset('CHEST_SIGNING');
                glbRigRef.current?.resetView();
                threeRigRef.current?.resetView();
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors focus-visible:ring-2"
              aria-label="Reset 3D camera orientation"
              title="Reset 3D View"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Speed Controls & Loop Toggle */}
        <div className="flex items-center gap-2">
          {/* Loop Toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-xl transition-colors focus-visible:ring-2 ${
              isLooping
                ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            aria-label={isLooping ? 'Disable continuous looping' : 'Enable continuous looping'}
            aria-pressed={isLooping}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Speed Presets */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {[0.5, 0.75, 1.0].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded-lg font-mono font-semibold transition-colors ${
                  speed === s
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label={`Playback speed ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
