import { SignClip } from '../../core/types';

export interface InterpolatedPose {
  activeGloss?: string;
  progress?: number;
  timeMs?: number;
  durationMs?: number;
  leftArm: {
    shoulderRotation: [number, number, number];
    elbowAngle: number;
    forearmRoll: number;
  };
  rightArm: {
    shoulderRotation: [number, number, number];
    elbowAngle: number;
    forearmRoll: number;
  };
  leftHand: {
    position: [number, number, number];
    rotation: [number, number, number];
    curl: [number, number, number, number, number];
    spread: number;
  };
  rightHand: {
    position: [number, number, number];
    rotation: [number, number, number];
    curl: [number, number, number, number, number];
    spread: number;
  };
  face: {
    browState: number;
    mouthState: 'neutral' | 'open' | 'smile' | 'round' | 'tight-lips';
    headRotation: [number, number, number];
  };
}

export function smootherstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function lerpAngle(a: number, b: number, t: number): number {
  let diff = (b - a) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.max(0, Math.min(1, t));
}

export function interpolateKeyframes(clip: SignClip, timeMs: number): InterpolatedPose {
  const kfs = clip.keyframes;
  if (!kfs || kfs.length === 0) {
    return getDefaultPose();
  }

  // Clamping time
  const clampedTime = Math.max(0, Math.min(clip.durationMs, timeMs));

  // Find surrounding keyframes
  let prev = kfs[0];
  let next = kfs[kfs.length - 1];

  for (let i = 0; i < kfs.length; i++) {
    if (kfs[i].timeMs <= clampedTime) {
      prev = kfs[i];
    }
    if (kfs[i].timeMs >= clampedTime) {
      next = kfs[i];
      break;
    }
  }

  const range = next.timeMs - prev.timeMs;
  const rawRatio = range === 0 ? 0 : (clampedTime - prev.timeMs) / range;
  // Biomechanical minimum-jerk easing curve for fluid, lifelike movement
  const factor = smootherstep(rawRatio);

  return {
    activeGloss: clip.gloss,
    progress: clip.durationMs > 0 ? clampedTime / clip.durationMs : 0,
    timeMs: clampedTime,
    durationMs: clip.durationMs,
    leftArm: {
      shoulderRotation: [
        lerpAngle(prev.leftArm?.shoulderRotation?.[0] ?? 0.2, next.leftArm?.shoulderRotation?.[0] ?? 0.2, factor),
        lerpAngle(prev.leftArm?.shoulderRotation?.[1] ?? 0.2, next.leftArm?.shoulderRotation?.[1] ?? 0.2, factor),
        lerpAngle(prev.leftArm?.shoulderRotation?.[2] ?? 0, next.leftArm?.shoulderRotation?.[2] ?? 0, factor)
      ],
      elbowAngle: lerp(prev.leftArm?.elbowAngle ?? 0.5, next.leftArm?.elbowAngle ?? 0.5, factor),
      forearmRoll: lerpAngle(prev.leftArm?.forearmRoll ?? 0, next.leftArm?.forearmRoll ?? 0, factor)
    },
    rightArm: {
      shoulderRotation: [
        lerpAngle(prev.rightArm?.shoulderRotation?.[0] ?? 0.2, next.rightArm?.shoulderRotation?.[0] ?? 0.2, factor),
        lerpAngle(prev.rightArm?.shoulderRotation?.[1] ?? -0.2, next.rightArm?.shoulderRotation?.[1] ?? -0.2, factor),
        lerpAngle(prev.rightArm?.shoulderRotation?.[2] ?? 0, next.rightArm?.shoulderRotation?.[2] ?? 0, factor)
      ],
      elbowAngle: lerp(prev.rightArm?.elbowAngle ?? 0.5, next.rightArm?.elbowAngle ?? 0.5, factor),
      forearmRoll: lerpAngle(prev.rightArm?.forearmRoll ?? 0, next.rightArm?.forearmRoll ?? 0, factor)
    },
    leftHand: {
      position: [
        lerp(prev.leftHand?.position?.[0] ?? -0.15, next.leftHand?.position?.[0] ?? -0.15, factor),
        lerp(prev.leftHand?.position?.[1] ?? -0.1, next.leftHand?.position?.[1] ?? -0.1, factor),
        lerp(prev.leftHand?.position?.[2] ?? 0.2, next.leftHand?.position?.[2] ?? 0.2, factor)
      ],
      rotation: [
        lerpAngle(prev.leftHand?.rotation?.[0] ?? 0, next.leftHand?.rotation?.[0] ?? 0, factor),
        lerpAngle(prev.leftHand?.rotation?.[1] ?? 0, next.leftHand?.rotation?.[1] ?? 0, factor),
        lerpAngle(prev.leftHand?.rotation?.[2] ?? 0, next.leftHand?.rotation?.[2] ?? 0, factor)
      ],
      curl: [
        lerp(prev.leftHand?.curl?.[0] ?? 0.2, next.leftHand?.curl?.[0] ?? 0.2, factor),
        lerp(prev.leftHand?.curl?.[1] ?? 0.2, next.leftHand?.curl?.[1] ?? 0.2, factor),
        lerp(prev.leftHand?.curl?.[2] ?? 0.2, next.leftHand?.curl?.[2] ?? 0.2, factor),
        lerp(prev.leftHand?.curl?.[3] ?? 0.2, next.leftHand?.curl?.[3] ?? 0.2, factor),
        lerp(prev.leftHand?.curl?.[4] ?? 0.2, next.leftHand?.curl?.[4] ?? 0.2, factor)
      ],
      spread: lerp(prev.leftHand?.spread ?? 0.1, next.leftHand?.spread ?? 0.1, factor)
    },
    rightHand: {
      position: [
        lerp(prev.rightHand?.position?.[0] ?? 0.15, next.rightHand?.position?.[0] ?? 0.15, factor),
        lerp(prev.rightHand?.position?.[1] ?? -0.1, next.rightHand?.position?.[1] ?? -0.1, factor),
        lerp(prev.rightHand?.position?.[2] ?? 0.2, next.rightHand?.position?.[2] ?? 0.2, factor)
      ],
      rotation: [
        lerpAngle(prev.rightHand?.rotation?.[0] ?? 0, next.rightHand?.rotation?.[0] ?? 0, factor),
        lerpAngle(prev.rightHand?.rotation?.[1] ?? 0, next.rightHand?.rotation?.[1] ?? 0, factor),
        lerpAngle(prev.rightHand?.rotation?.[2] ?? 0, next.rightHand?.rotation?.[2] ?? 0, factor)
      ],
      curl: [
        lerp(prev.rightHand?.curl?.[0] ?? 0.2, next.rightHand?.curl?.[0] ?? 0.2, factor),
        lerp(prev.rightHand?.curl?.[1] ?? 0.2, next.rightHand?.curl?.[1] ?? 0.2, factor),
        lerp(prev.rightHand?.curl?.[2] ?? 0.2, next.rightHand?.curl?.[2] ?? 0.2, factor),
        lerp(prev.rightHand?.curl?.[3] ?? 0.2, next.rightHand?.curl?.[3] ?? 0.2, factor),
        lerp(prev.rightHand?.curl?.[4] ?? 0.2, next.rightHand?.curl?.[4] ?? 0.2, factor)
      ],
      spread: lerp(prev.rightHand?.spread ?? 0.1, next.rightHand?.spread ?? 0.1, factor)
    },
    face: {
      browState: lerp(prev.face?.browState ?? 0, next.face?.browState ?? 0, factor),
      mouthState: (factor > 0.5 ? next.face?.mouthState : prev.face?.mouthState) ?? 'neutral',
      headRotation: [
        lerpAngle(prev.face?.headRotation?.[0] ?? 0, next.face?.headRotation?.[0] ?? 0, factor),
        lerpAngle(prev.face?.headRotation?.[1] ?? 0, next.face?.headRotation?.[1] ?? 0, factor),
        lerpAngle(prev.face?.headRotation?.[2] ?? 0, next.face?.headRotation?.[2] ?? 0, factor)
      ]
    }
  };
}

export function getDefaultPose(): InterpolatedPose {
  return {
    progress: 0,
    timeMs: 0,
    durationMs: 1000,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.2, -0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0, 0, 0] }
  };
}
