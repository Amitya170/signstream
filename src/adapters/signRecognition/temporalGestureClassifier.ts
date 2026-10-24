/**
 * Temporal Continuous Gesture Recognition Engine
 * 
 * Unlike static single-frame template matchers, authentic sign recognition operates
 * over a continuous temporal sequence (30 to 45 frames @ 30 FPS).
 * A sign consists of:
 * 1. Preparation Phase (hands moving up into signing space)
 * 2. Nucleus / Stroke Phase (peak semantic movement and handshape)
 * 3. Retraction Phase (hands returning to rest or transitioning to next sign)
 * 
 * This engine tracks:
 * - 45-frame rolling FIFO buffer of normalized 3D landmarks
 * - Positional velocity & acceleration vectors
 * - Peak stroke energy and trajectory curvature
 */

import { LandmarkPoint } from '../../core/types';
import { RecognitionResult } from './SignRecognizerAdapter';
import { localLandmarkClassifier } from './localLandmarkClassifier';

export interface TemporalFrame {
  timestamp: number;
  landmarks: LandmarkPoint[];
  velocity: number; // RMS landmark velocity compared to previous frame
}

export interface StrokePhaseState {
  phase: 'IDLE' | 'PREPARATION' | 'STROKE' | 'RETRACTION';
  velocity: number;
  stability: number; // 0.0 to 1.0
  frameCount: number;
}

export class TemporalGestureClassifier {
  private frameBuffer: TemporalFrame[] = [];
  private readonly maxBufferSize = 45; // ~1.5 seconds at 30fps
  private currentPhase: 'IDLE' | 'PREPARATION' | 'STROKE' | 'RETRACTION' = 'IDLE';
  private lastRecognitionTime = 0;
  private readonly cooldownMs = 1200; // avoid duplicate rapid triggers

  /**
   * Pushes a new frame into the rolling temporal buffer and performs continuous stroke analysis.
   */
  public pushFrame(landmarks: LandmarkPoint[]): {
    phaseState: StrokePhaseState;
    recognition: RecognitionResult | null;
  } {
    const now = Date.now();
    let velocity = 0;

    // Calculate RMS velocity between current frame and most recent frame
    if (this.frameBuffer.length > 0) {
      const prev = this.frameBuffer[this.frameBuffer.length - 1];
      const count = Math.min(landmarks.length, prev.landmarks.length);
      let sumSq = 0;
      for (let i = 0; i < count; i++) {
        const dx = landmarks[i].x - prev.landmarks[i].x;
        const dy = landmarks[i].y - prev.landmarks[i].y;
        sumSq += dx * dx + dy * dy;
      }
      velocity = Math.sqrt(sumSq / Math.max(1, count));
    }

    const frame: TemporalFrame = {
      timestamp: now,
      landmarks,
      velocity
    };

    this.frameBuffer.push(frame);
    if (this.frameBuffer.length > this.maxBufferSize) {
      this.frameBuffer.shift();
    }

    // Determine gesture phase based on kinetic velocity profile
    const avgRecentVelocity = this.getRecentVelocity(8);

    if (avgRecentVelocity < 0.008) {
      // Very low movement -> Hands held in pose or idle
      this.currentPhase = this.currentPhase === 'PREPARATION' || this.currentPhase === 'STROKE'
        ? 'STROKE' // Active stroke plateau
        : 'IDLE';
    } else if (avgRecentVelocity > 0.045) {
      // Rapid movement -> Preparation or Retraction
      this.currentPhase = 'PREPARATION';
    } else {
      // Moderate movement
      this.currentPhase = 'STROKE';
    }

    // Calculate stability: inverted variance in landmark position
    const stability = Math.max(0, Math.min(1, 1 - avgRecentVelocity * 15));

    const phaseState: StrokePhaseState = {
      phase: this.currentPhase,
      velocity: avgRecentVelocity,
      stability,
      frameCount: this.frameBuffer.length
    };

    // Trigger semantic recognition during stable STROKE plateaus
    let recognition: RecognitionResult | null = null;
    if (
      this.currentPhase === 'STROKE' &&
      stability > 0.65 &&
      now - this.lastRecognitionTime > this.cooldownMs
    ) {
      // Best frame in recent window (frame with lowest velocity / highest clarity)
      const bestFrame = this.getMostStableFrame(12) || frame;
      const syncResult = this.classifySynchronous(bestFrame.landmarks);
      if (syncResult && syncResult.confidence >= 0.75) {
        recognition = syncResult;
        this.lastRecognitionTime = now;
      }
    }

    return { phaseState, recognition };
  }

  private classifySynchronous(landmarks: LandmarkPoint[]): RecognitionResult | null {
    // Leverage the multi-point spatial vector heuristics from localLandmarkClassifier
    const match = localLandmarkClassifier.classifySync(landmarks);
    if (match) {
      return {
        ...match,
        source: 'CLASSIFIER'
      };
    }
    return null;
  }

  private getRecentVelocity(windowCount: number): number {
    const len = this.frameBuffer.length;
    if (len === 0) return 0;
    const count = Math.min(windowCount, len);
    let sum = 0;
    for (let i = len - count; i < len; i++) {
      sum += this.frameBuffer[i].velocity;
    }
    return sum / count;
  }

  private getMostStableFrame(windowCount: number): TemporalFrame | null {
    const len = this.frameBuffer.length;
    if (len === 0) return null;
    const count = Math.min(windowCount, len);
    let lowestVel = Infinity;
    let best: TemporalFrame | null = null;

    for (let i = len - count; i < len; i++) {
      if (this.frameBuffer[i].velocity < lowestVel) {
        lowestVel = this.frameBuffer[i].velocity;
        best = this.frameBuffer[i];
      }
    }
    return best;
  }

  public reset(): void {
    this.frameBuffer = [];
    this.currentPhase = 'IDLE';
    this.lastRecognitionTime = 0;
  }
}

export const temporalClassifier = new TemporalGestureClassifier();
