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
  UserCheck,
  Info,
  Share2,
  Maximize2,
  Minimize2,
  User
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
import { MudraInspectorModal } from './MudraInspectorModal';
import { ClipExporterModal } from './ClipExporterModal';

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
  backgroundColor = '#f1f5f9',
  showCaption = true,
  className = '',
  onTimeUpdate,
  seekTimeMs
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
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
  const [isMudraOpen, setIsMudraOpen] = useState<boolean>(false);
  const [isExporterOpen, setIsExporterOpen] = useState<boolean>(false);
  const [isFullDisplay, setIsFullDisplay] = useState<boolean>(false);

  const effectiveBgColor = visualStyle === 'CYBER_HOLOGRAM' ? '#090d16' : (backgroundColor === '#0b0f19' || backgroundColor === '#1e293b' || !backgroundColor ? '#f1f5f9' : backgroundColor);

  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  const currentTimeMsRef = useRef<number>(0);

  // Toggle Fullscreen / Full Display Mode
  const toggleFullDisplay = useCallback(() => {
    setIsFullDisplay((prev) => {
      const next = !prev;
      if (next) {
        if (stageRef.current && stageRef.current.requestFullscreen && !document.fullscreenElement) {
          stageRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
    // Trigger immediate re-render on next tick
    setTimeout(() => {
      glbRigRef.current?.resize();
      threeRigRef.current?.resize();
    }, 50);
  }, []);

  // Listen for browser fullscreen change or ESC key to sync full display state
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullDisplay) {
        setIsFullDisplay(false);
        setTimeout(() => {
          glbRigRef.current?.resize();
          threeRigRef.current?.resize();
        }, 50);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullDisplay) {
        setIsFullDisplay(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setTimeout(() => {
          glbRigRef.current?.resize();
          threeRigRef.current?.resize();
        }, 50);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullDisplay]);

  // 1. Initialize Realistic GLB Rig
  useEffect(() => {
    if (renderMode !== 'glb' || !glbContainerRef.current) return;

    try {
      const rig = new GlbAvatarRig(
        glbContainerRef.current,
        {
          skinTone,
          outfitColor,
          backgroundColor: effectiveBgColor,
          visualStyle
        },
        glbModelId
      );
      glbRigRef.current = rig;
      (window as any).__GLB_RIG__ = rig;

      // Seed initial pose immediately so model renders in active pose when load completes
      const initialPose = clip ? interpolateKeyframes(clip, currentTimeMsRef.current) : getDefaultPose();
      rig.updatePose(initialPose);

      const handleResize = () => rig.resize();
      window.addEventListener('resize', handleResize);

      // High-precision ResizeObserver: adapts immediately to any display size or container change
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && glbContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          rig.resize();
        });
        resizeObserver.observe(glbContainerRef.current);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) resizeObserver.disconnect();
        rig.dispose();
        glbRigRef.current = null;
      };
    } catch (e) {
      console.warn('GLB Avatar initialization failed; falling back to Three.js procedural avatar.', e);
      setRenderMode('three');
    }
  }, [renderMode, effectiveBgColor, glbModelId]);

  // 2. Initialize Three.js Procedural Rig (Fallback)
  useEffect(() => {
    if (renderMode !== 'three' || !threeContainerRef.current) return;

    try {
      const rig = new ThreeAvatarRig(threeContainerRef.current, {
        skinTone,
        outfitColor,
        backgroundColor: effectiveBgColor,
        visualStyle
      });
      threeRigRef.current = rig;

      const handleResize = () => rig.resize();
      window.addEventListener('resize', handleResize);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && threeContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          rig.resize();
        });
        resizeObserver.observe(threeContainerRef.current);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) resizeObserver.disconnect();
        rig.dispose();
        threeRigRef.current = null;
      };
    } catch (e) {
      console.warn('Three.js initialization failed; falling back to 2D SVG avatar.', e);
      setRenderMode('svg');
    }
  }, [renderMode, effectiveBgColor]);

  // Update rig material options and visual style
  useEffect(() => {
    if (glbRigRef.current) {
      glbRigRef.current.updateAppearance({ skinTone, outfitColor, backgroundColor: effectiveBgColor, visualStyle });
    }
    if (threeRigRef.current) {
      threeRigRef.current.updateAppearance({ skinTone, outfitColor, backgroundColor: effectiveBgColor, visualStyle });
    }
  }, [skinTone, outfitColor, effectiveBgColor, visualStyle]);

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
      ref={stageRef}
      className={`flex flex-col bg-white border-2 border-slate-200/90 overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.06)] relative transition-all duration-300 ${
        isFullDisplay
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen flex flex-col'
          : `rounded-3xl ${className}`
      }`}
    >
      {/* Subtle Top Accent Line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent pointer-events-none" />

      {/* 1. TOP STUDIO HEADER BAR (Shifted ABOVE the canvas, in clean light colour) */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/90 flex items-center justify-between flex-wrap gap-2 text-slate-800 z-10 shadow-xs">
        {/* Left: Active Sign Gloss Pill */}
        {clip ? (
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            <span className="text-xs font-black text-slate-900 tracking-wide">
              {clip.gloss}
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              ({clip.labels.hi} / {clip.labels.en})
            </span>
            <TrustBadge level={clip.trustLevel} provenance={clip.provenance} />
          </div>
        ) : (
          <div className="bg-white px-3.5 py-1.5 rounded-full text-xs text-slate-600 border border-slate-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="font-semibold">Awaiting Sign Input</span>
          </div>
        )}

        {/* Right: Model & Render Mode Switchers & Full Display (Light colour) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 3D Model Selection */}
          {renderMode === 'glb' && (
            <div className="flex items-center bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs shadow-sm">
              <label htmlFor="avatar-model-select" className="sr-only">3D Avatar Model</label>
              <select
                id="avatar-model-select"
                value={glbModelId}
                onChange={(e) => setGlbModelId(e.target.value as GlbModelId)}
                className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                aria-label="Select 3D Avatar Character"
              >
                <option value="michelle" className="bg-white text-slate-900 font-semibold">Michelle (Human)</option>
                <option value="readyplayer" className="bg-white text-slate-900 font-semibold">ReadyPlayer (Stylized)</option>
                <option value="xbot" className="bg-white text-slate-900 font-semibold">Xbot (Cyber Humanoid)</option>
              </select>
            </div>
          )}

          {/* Visual Style: Studio Human vs Cyber Hologram */}
          <button
            type="button"
            onClick={() => setVisualStyle(v => (v === 'STUDIO_HUMAN' ? 'CYBER_HOLOGRAM' : 'STUDIO_HUMAN'))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shadow-sm ${
              visualStyle === 'CYBER_HOLOGRAM'
                ? 'bg-cyan-100 text-cyan-900 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
            aria-label={`Toggle avatar visual style. Current: ${visualStyle === 'CYBER_HOLOGRAM' ? 'Cyber Hologram' : 'Studio Human'}`}
            title="Toggle between Realistic Studio Human and Cyber Hologram digital aesthetics"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">{visualStyle === 'CYBER_HOLOGRAM' ? 'Hologram' : 'Studio'}</span>
          </button>

          {/* Render Mode Switcher: Realistic GLB 3D -> Pro 3D -> 2D SVG */}
          <button
            type="button"
            onClick={cycleRenderMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shadow-sm ${
              renderMode === 'glb'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
            aria-label={`Cycle avatar render mode. Current: ${renderMode === 'glb' ? 'Realistic Human 3D' : renderMode === 'three' ? 'Procedural 3D' : '2D SVG'}`}
            title="Cycle between Realistic Human 3D, Procedural 3D, and 2D SVG avatars"
          >
            {renderMode === 'glb' ? (
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{renderMode === 'glb' ? 'Human 3D' : renderMode === 'three' ? 'Pro 3D' : '2D'}</span>
          </button>

          {/* Full Display / Fullscreen Mode Toggle */}
          <button
            type="button"
            onClick={toggleFullDisplay}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shadow-sm ${
              isFullDisplay
                ? 'bg-teal-600 text-white border-teal-500 shadow-md ring-1 ring-teal-400'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
            aria-label={isFullDisplay ? 'Exit Full Display (Esc)' : 'Expand to Full Display'}
            title={isFullDisplay ? 'Exit Full Display (Esc)' : 'Expand to Full Display'}
          >
            {isFullDisplay ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
            )}
            <span>{isFullDisplay ? 'Exit Full' : 'Full Display'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 3D AVATAR VIEWPORT (100% UNRESTRICTED - ZERO OVERLAYS HIDING THE CHARACTER - FULLY ADAPTING TO DISPLAY SIZE) */}
      <div className={`relative w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
        isFullDisplay
          ? 'flex-1 min-h-[400px] h-full'
          : 'h-[460px] sm:h-[520px] lg:h-[calc(100vh-320px)] lg:min-h-[500px] xl:h-[calc(100vh-270px)] xl:min-h-[580px]'
      } ${
        visualStyle === 'CYBER_HOLOGRAM'
          ? 'bg-slate-950'
          : 'bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200/60'
      }`}>
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
            className="w-full h-full max-h-84"
          />
        )}
      </div>

      {/* 3. DIRECTOR & TOOLS BAR (Shifted BELOW the canvas, in clean light colour) */}
      <div className="px-4 py-2.5 bg-slate-50/90 border-t border-b border-slate-200/90 flex items-center justify-between flex-wrap gap-2 text-slate-800 z-10 shadow-xs">
        {/* Left: Camera Perspective Angle Selector */}
        {(renderMode === 'glb' || renderMode === 'three') ? (
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-300 shadow-sm text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 px-1.5 hidden md:inline">Camera:</span>
            <button
              type="button"
              onClick={() => {
                setCameraPreset('CHEST_SIGNING');
                glbRigRef.current?.applyCameraPreset('CHEST_SIGNING');
                threeRigRef.current?.applyCameraPreset('CHEST_SIGNING');
              }}
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                cameraPreset === 'CHEST_SIGNING'
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Chest & Signing Space"
            >
              <Camera className="w-3 h-3" />
              <span>Sign</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCameraPreset('FULL_BODY');
                glbRigRef.current?.applyCameraPreset('FULL_BODY');
                threeRigRef.current?.applyCameraPreset('FULL_BODY');
              }}
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                cameraPreset === 'FULL_BODY'
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Full Body Head-to-Toe View"
            >
              <User className="w-3 h-3" />
              <span>Full Body</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCameraPreset('HANDS_FOCUS');
                glbRigRef.current?.applyCameraPreset('HANDS_FOCUS');
                threeRigRef.current?.applyCameraPreset('HANDS_FOCUS');
              }}
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                cameraPreset === 'HANDS_FOCUS'
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                cameraPreset === 'FACE_NMM'
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Face & Non-Manual Markers"
            >
              <Smile className="w-3 h-3" />
              <span>Face</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCameraPreset('DIAGONAL_45');
                glbRigRef.current?.applyCameraPreset('DIAGONAL_45');
                threeRigRef.current?.applyCameraPreset('DIAGONAL_45');
              }}
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                cameraPreset === 'DIAGONAL_45'
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="45° Profile Perspective"
            >
              <Compass className="w-3 h-3" />
              <span>45° Profile</span>
            </button>
          </div>
        ) : <div />}

        {/* Right: Mudra Inspector, Clip Exporter & Kinematic Solver HUD */}
        <div className="flex items-center gap-2 flex-wrap">
          {clip && (
            <>
              <button
                type="button"
                onClick={() => setIsMudraOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-300 text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                title="Inspect ISL Mudra & Handshape Anatomy"
              >
                <Info className="w-3.5 h-3.5 text-teal-600" />
                <span>Mudra Anatomy</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExporterOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold border border-cyan-300 text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                title="Export Sign Video Clip or Snapshot"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>Export Clip</span>
              </button>
            </>
          )}

          {/* Solver Status Pill */}
          {(renderMode === 'glb' || renderMode === 'three') && (
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 text-[10px] text-teal-700 font-mono shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="font-bold">{activeSolverText}</span>
            </div>
          )}

          <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm hidden sm:block">
            360° Orbit
          </div>
        </div>
      </div>

      {/* 4. SYNCHRONIZED SCRUBBING TIMELINE (Light styled) */}
      <div className="px-5 py-3 bg-white border-b border-slate-200/90 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-teal-700 font-bold">{(currentTimeMs / 1000).toFixed(2)}s</span>
          <span className="text-slate-600 font-bold tracking-wider">
            {clip ? `${clip.keyframes.length} KEYFRAMES · BIOMECHANICAL IK` : 'IDLE'}
          </span>
          <span className="text-slate-500">{clip ? (clip.durationMs / 1000).toFixed(2) + 's' : '0.00s'}</span>
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
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 disabled:opacity-40"
          />
          <div
            className="absolute left-0 top-0 bottom-0 bg-teal-500/40 rounded-l-lg pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Keyframe Marker Dots */}
          {clip &&
            clip.keyframes.map((kf, i) => {
              const leftPct = (kf.timeMs / clip.durationMs) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white shadow-sm pointer-events-none"
                  style={{ left: `${leftPct}%` }}
                  title={`Keyframe ${i + 1}: ${kf.timeMs}ms`}
                />
              );
            })}
        </div>
      </div>

      {/* 5. ANIMATION PLAYBACK HUD (Light styled) */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50/90 rounded-b-3xl">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!clip}
            className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 active:scale-95"
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
            className="p-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-300 rounded-xl shadow-xs transition-colors focus-visible:ring-2 active:scale-95"
            aria-label="Restart animation from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step forward */}
          <button
            type="button"
            onClick={handleStepForward}
            disabled={!clip}
            className="p-2.5 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-300 rounded-xl shadow-xs transition-colors focus-visible:ring-2 active:scale-95"
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
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl shadow-xs transition-colors focus-visible:ring-2 active:scale-95"
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
            className={`p-2.5 rounded-xl transition-all shadow-xs focus-visible:ring-2 ${
              isLooping
                ? 'bg-teal-100 text-teal-800 border border-teal-300 shadow-sm'
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-300'
            }`}
            aria-label={isLooping ? 'Disable continuous looping' : 'Enable continuous looping'}
            aria-pressed={isLooping}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Speed Presets */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 p-1 rounded-xl text-xs shadow-xs">
            <Gauge className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
            {[0.5, 0.75, 1.0].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-colors ${
                  speed === s
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label={`Playback speed ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ISL Mudra & Handshape Anatomy Inspector Modal */}
      <MudraInspectorModal
        clip={clip}
        isOpen={isMudraOpen}
        onClose={() => setIsMudraOpen(false)}
      />

      {/* On-Device Sign Clip Exporter Modal */}
      <ClipExporterModal
        clip={clip}
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
      />
    </div>
  );
};
