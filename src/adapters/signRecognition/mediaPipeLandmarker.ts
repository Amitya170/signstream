/**
 * Project SignStream - MediaPipe Tasks Vision On-Device Landmarker Service
 * Runs MediaPipe HandLandmarker locally in the browser via WebAssembly/WebGPU.
 * Enforces:
 * - 100% on-device local execution
 * - No video data ever transmitted
 * - Dual-hand support for authentic ISL two-handed signs
 * - Graceful fallback if WASM or model asset fails to load
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { LandmarkPoint } from '../../core/types';

export type VisionServiceStatus = 'uninitialized' | 'loading' | 'ready' | 'fallback' | 'error';

export interface DualHandLandmarks {
  hand1: LandmarkPoint[];
  hand2?: LandmarkPoint[];
  combined: LandmarkPoint[];
}

class MediaPipeVisionService {
  private handLandmarker: HandLandmarker | null = null;
  private status: VisionServiceStatus = 'uninitialized';
  private errorMessage: string | null = null;
  private initPromise: Promise<boolean> | null = null;

  public getStatus(): VisionServiceStatus {
    return this.status;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public async initialize(): Promise<boolean> {
    if (this.status === 'ready' && this.handLandmarker) {
      return true;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.status = 'loading';
    this.initPromise = (async () => {
      try {
        if (typeof window === 'undefined') {
          this.status = 'fallback';
          return false;
        }

        // Initialize MediaPipe Tasks Vision WASM runtime
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        });

        this.status = 'ready';
        this.errorMessage = null;
        return true;
      } catch (err: any) {
        console.warn(
          'MediaPipe on-device model unavailable; using geometric fallback template matcher:',
          err
        );
        this.status = 'fallback';
        this.errorMessage = err?.message || 'MediaPipe model failed to initialize.';
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Detects 3D landmarks for both hands in the current video frame.
   * Returns combined array (21 points for 1 hand, 42 points for 2 hands).
   */
  public detect(video: HTMLVideoElement, timestamp: number): LandmarkPoint[] | null {
    const hands = this.detectHands(video, timestamp);
    return hands ? hands.combined : null;
  }

  public detectHands(video: HTMLVideoElement, timestamp: number): DualHandLandmarks | null {
    if (this.status !== 'ready' || !this.handLandmarker) {
      return null;
    }

    try {
      if (video.readyState < 2) return null;
      const result = this.handLandmarker.detectForVideo(video, timestamp);
      if (result && result.landmarks && result.landmarks.length > 0) {
        const hand1: LandmarkPoint[] = result.landmarks[0].map((p) => ({
          x: p.x,
          y: p.y,
          z: p.z ?? 0
        }));

        const hand2: LandmarkPoint[] | undefined =
          result.landmarks.length > 1
            ? result.landmarks[1].map((p) => ({
                x: p.x,
                y: p.y,
                z: p.z ?? 0
              }))
            : undefined;

        const combined = hand2 ? [...hand1, ...hand2] : [...hand1];
        return { hand1, hand2, combined };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Renders the detected 21 (or 42) hand landmarks onto an overlay canvas.
   */
  public drawHandSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: LandmarkPoint[],
    width: number,
    height: number,
    primaryColor = '#14b8a6',
    secondaryColor = '#38bdf8'
  ): void {
    if (!landmarks || landmarks.length < 21) return;

    // Hand landmark connections (21 joints)
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle
      [5, 9], [9, 10], [10, 11], [11, 12],
      // Ring
      [9, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [13, 17], [17, 18], [18, 19], [19, 20],
      // Palm base
      [0, 17]
    ];

    const drawSingleHand = (pts: LandmarkPoint[], offset: number, strokeCol: string, fillCol: string) => {
      ctx.save();
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 3;
      ctx.fillStyle = fillCol;

      // Draw bone connections
      for (const [startIdx, endIdx] of connections) {
        const p1 = pts[offset + startIdx];
        const p2 = pts[offset + endIdx];
        if (!p1 || !p2) continue;
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }

      // Draw joint dots
      for (let i = 0; i < 21; i++) {
        const p = pts[offset + i];
        if (!p) continue;
        const radius = i === 0 || i % 4 === 0 ? 5 : 3;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // Draw dominant/first hand
    drawSingleHand(landmarks, 0, primaryColor, '#5eead4');

    // If second hand is present (42 landmarks)
    if (landmarks.length >= 42) {
      drawSingleHand(landmarks, 21, secondaryColor, '#bae6fd');
    }
  }

  public dispose(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    this.status = 'uninitialized';
  }
}

export const mediaPipeVisionService = new MediaPipeVisionService();
