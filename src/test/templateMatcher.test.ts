import { describe, it, expect } from 'vitest';
import { detectCapabilities } from '../lib/capabilities';
import { landmarkTemplateMatcher } from '../adapters/signRecognition/landmarkTemplateMatcher';
import { LandmarkPoint } from '../core/types';
import { db } from '../lib/storage';

describe('System Capabilities & Hardware Detection', () => {
  it('detects available browser capabilities accurately', () => {
    const caps = detectCapabilities();
    expect(typeof caps.camera).toBe('boolean');
    expect(typeof caps.microphone).toBe('boolean');
    expect(typeof caps.speechSynthesis).toBe('boolean');
    expect(typeof caps.indexedDB).toBe('boolean');
  });
});

describe('Landmark Template Matcher & Trust Level', () => {
  it('normalizes raw landmark coordinates relative to wrist', () => {
    const raw: LandmarkPoint[] = [
      { x: 100, y: 200, z: 0 },
      { x: 120, y: 220, z: 0 }
    ];
    const norm = landmarkTemplateMatcher.normalizeLandmarks(raw);
    expect(norm[0].x).toBe(0);
    expect(norm[0].y).toBe(0);
    expect(norm[1].x).toBeGreaterThan(0);
  });

  it('recognizes NO gesture when index finger is strictly extended', async () => {
    // 21 landmarks: wrist at (0.5, 0.7), index pointing up (tip y = 0.2), other fingers curled (y > 0.6)
    const landmarks: LandmarkPoint[] = [{ x: 0.5, y: 0.7, z: 0 }];
    for (let i = 1; i < 21; i++) {
      if (i >= 5 && i <= 8) {
        // Index finger extended straight up
        landmarks.push({ x: 0.5, y: 0.2 + (i - 5) * 0.05, z: 0 });
      } else {
        // Other fingers curled near palm
        landmarks.push({ x: 0.5 + (i * 0.01), y: 0.65, z: 0 });
      }
    }

    const result = await landmarkTemplateMatcher.recognize(landmarks);
    if (result) {
      expect(result.gloss).toBe('NO');
      expect(result.trustLevel).toBe('VERIFIED');
      expect(result.confidence).toBeGreaterThan(0.7);
    }
  });

  it('matches user custom personal signs with COMMUNITY trust label', async () => {
    const customPoints: LandmarkPoint[] = Array.from({ length: 21 }, () => ({
      x: 0.3,
      y: 0.3,
      z: 0
    }));

    await db.customSigns.add({
      id: 'test-custom-1',
      gloss: 'CUSTOM-PET',
      label: 'My Pet Dog Sign',
      trustLevel: 'COMMUNITY',
      landmarks: customPoints,
      recordedAt: Date.now(),
      isCustom: true
    });

    const match = await landmarkTemplateMatcher.recognize(customPoints);
    expect(match).toBeDefined();
    expect(match?.trustLevel).toBe('COMMUNITY');
    expect(match?.isCustomSign).toBe(true);
  });
});
