import { LandmarkPoint } from '../../core/types';
import { db } from '../../lib/storage';
import {
  RecognitionResult,
  SignRecognizerAdapter,
  SupportedSignInfo
} from './SignRecognizerAdapter';

export const BUILTIN_DEMO_SIGNS: SupportedSignInfo[] = [
  {
    gloss: 'NAMASTE',
    labelEn: 'Namaste / Hello',
    labelHi: 'नमस्ते',
    description: 'Two hands joined together flat at chest level.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'THANK-YOU',
    labelEn: 'Thank You',
    labelHi: 'धन्यवाद',
    description: 'Open flat hand moving from chin forward.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'PLEASE',
    labelEn: 'Please',
    labelHi: 'कृपया',
    description: 'Flat palm resting against mid-chest politely.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'YES',
    labelEn: 'Yes',
    labelHi: 'हाँ',
    description: 'Closed fist positioned vertically, nodding up/down.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'NO',
    labelEn: 'No',
    labelHi: 'नहीं',
    description: 'Extended index finger pointing upright shaking side to side.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'HELP',
    labelEn: 'Help',
    labelHi: 'मदद',
    description: 'Thumb-up fist resting upon a flat supporting palm.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'WATER',
    labelEn: 'Water',
    labelHi: 'पानी',
    description: 'Three fingers (W-handshape) near mouth / chin.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'FOOD',
    labelEn: 'Food / Eat',
    labelHi: 'खाना / भोजन',
    description: 'Bunched fingertips tapped repeatedly near mouth.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'DOCTOR',
    labelEn: 'Doctor',
    labelHi: 'डॉक्टर',
    description: 'Two fingers placed over opposite wrist pulse.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'DEAF',
    labelEn: 'Deaf',
    labelHi: 'बधिर',
    description: 'Index finger pointing from ear towards mouth.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'HOW-ARE-YOU',
    labelEn: 'How are you?',
    labelHi: 'आप कैसे हैं?',
    description: 'Open palms facing upward moving gently outward.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'GOOD-MORNING',
    labelEn: 'Good Morning',
    labelHi: 'सुप्रभात',
    description: 'Thumb extended rising upward like morning sun.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'STOP',
    labelEn: 'Stop',
    labelHi: 'रुको',
    description: 'Open flat palm facing outward vertically.',
    trustLevel: 'VERIFIED'
  },
  {
    gloss: 'TIME',
    labelEn: 'Time',
    labelHi: 'समय',
    description: 'Index finger tapping the back of the opposite wrist.',
    trustLevel: 'VERIFIED'
  }
];

export class LandmarkTemplateMatcher implements SignRecognizerAdapter {
  public id = 'landmarkTemplateMatcher';
  public name = 'Geometric Landmark Template Classifier';

  public isSupported(): boolean {
    return true;
  }

  public async getSupportedSigns(): Promise<SupportedSignInfo[]> {
    const list = [...BUILTIN_DEMO_SIGNS];
    // Include user-recorded personal custom signs
    const customSigns = await db.customSigns.toArray();
    for (const cs of customSigns) {
      list.push({
        gloss: cs.gloss,
        labelEn: `${cs.label} (Personal Custom)`,
        labelHi: `${cs.label} (निजी संकेत)`,
        description: cs.notes || 'User-recorded custom landmark template.',
        trustLevel: 'COMMUNITY'
      });
    }
    return list;
  }

  /**
   * Normalizes landmarks relative to wrist (landmark[0]) and scales to unit bounding sphere.
   */
  public normalizeLandmarks(points: LandmarkPoint[]): LandmarkPoint[] {
    if (!points || points.length === 0) return [];
    const origin = points[0];
    const translated = points.map((p) => ({
      x: p.x - origin.x,
      y: p.y - origin.y,
      z: (p.z ?? 0) - (origin.z ?? 0)
    }));

    let maxDist = 0.0001;
    for (const p of translated) {
      const d = Math.sqrt(p.x * p.x + p.y * p.y + (p.z ?? 0) * (p.z ?? 0));
      if (d > maxDist) maxDist = d;
    }

    return translated.map((p) => ({
      x: p.x / maxDist,
      y: p.y / maxDist,
      z: (p.z ?? 0) / maxDist
    }));
  }

  /**
   * Returns finger extension states: [thumb, index, middle, ring, pinky]
   * (true = extended, false = curled)
   */
  public computeFingerStates(norm: LandmarkPoint[]): boolean[] {
    if (norm.length < 21) return [false, false, false, false, false];

    // Tips: 4 (thumb), 8 (index), 12 (middle), 16 (ring), 20 (pinky)
    // MCPs/PIPs: 2, 6, 10, 14, 18
    const isExtended = (tipIdx: number, pipIdx: number) => {
      const tipDist = Math.sqrt(norm[tipIdx].x ** 2 + norm[tipIdx].y ** 2);
      const pipDist = Math.sqrt(norm[pipIdx].x ** 2 + norm[pipIdx].y ** 2);
      return tipDist > pipDist * 1.15;
    };

    return [
      isExtended(4, 2),
      isExtended(8, 6),
      isExtended(12, 10),
      isExtended(16, 14),
      isExtended(20, 18)
    ];
  }

  public async recognize(rawPoints: LandmarkPoint[]): Promise<RecognitionResult | null> {
    if (!rawPoints || rawPoints.length < 21) {
      return null;
    }

    // Separate hand 1 and hand 2 if dual hands detected (42 landmarks)
    const isDualHand = rawPoints.length >= 42;
    const hand1Raw = rawPoints.slice(0, 21);
    const hand2Raw = isDualHand ? rawPoints.slice(21, 42) : null;

    const norm1 = this.normalizeLandmarks(hand1Raw);
    const fingers1 = this.computeFingerStates(norm1);
    const [thumb1, index1, middle1, ring1, pinky1] = fingers1;

    // Check user-recorded custom templates first
    const customSigns = await db.customSigns.toArray();
    for (const cs of customSigns) {
      if (cs.landmarks && cs.landmarks.length >= 21) {
        const normCustom = this.normalizeLandmarks(cs.landmarks);
        let errorSum = 0;
        const compareLen = Math.min(norm1.length, normCustom.length);
        for (let i = 0; i < compareLen; i++) {
          const dx = norm1[i].x - normCustom[i].x;
          const dy = norm1[i].y - normCustom[i].y;
          errorSum += Math.sqrt(dx * dx + dy * dy);
        }
        const avgDist = errorSum / compareLen;
        if (avgDist < 0.28) {
          const conf = Math.max(0.65, Math.min(0.96, 1 - avgDist * 2));
          return {
            gloss: cs.gloss,
            labelEn: cs.label,
            labelHi: cs.label,
            confidence: Number(conf.toFixed(2)),
            trustLevel: 'COMMUNITY',
            source: 'USER_CUSTOM',
            isCustomSign: true
          };
        }
      }
    }

    // DUAL-HAND RECOGNITION (e.g. NAMASTE, HELP, DOCTOR, HOW-ARE-YOU)
    if (hand2Raw) {
      const norm2 = this.normalizeLandmarks(hand2Raw);
      const fingers2 = this.computeFingerStates(norm2);
      const [thumb2, index2, middle2, ring2, pinky2] = fingers2;

      // Distance between wrists
      const wristDist = Math.sqrt(
        (hand1Raw[0].x - hand2Raw[0].x) ** 2 + (hand1Raw[0].y - hand2Raw[0].y) ** 2
      );

      // 1. NAMASTE: Both wrists close together (< 0.28), all fingers extended upward
      if (wristDist < 0.28 && thumb1 && index1 && middle1 && thumb2 && index2 && middle2) {
        return {
          gloss: 'NAMASTE',
          labelEn: 'Namaste / Hello',
          labelHi: 'नमस्ते',
          confidence: 0.94,
          trustLevel: 'VERIFIED',
          source: 'CLASSIFIER'
        };
      }

      // 2. HELP: Non-dominant hand flat (hand2 flat: all extended), dominant hand fist with thumb up resting on it
      const hand1IsThumbUpFist = thumb1 && !index1 && !middle1 && !ring1 && !pinky1;
      const hand2IsFlat = index2 && middle2 && ring2 && pinky2;
      if (wristDist < 0.35 && ((hand1IsThumbUpFist && hand2IsFlat) || (!index1 && !middle1 && thumb1))) {
        return {
          gloss: 'HELP',
          labelEn: 'Help',
          labelHi: 'मदद',
          confidence: 0.91,
          trustLevel: 'VERIFIED',
          source: 'CLASSIFIER'
        };
      }

      // 3. DOCTOR: Hand1 index and middle extended resting on hand2 wrist area
      if (wristDist < 0.30 && index1 && middle1 && !ring1 && !pinky1) {
        return {
          gloss: 'DOCTOR',
          labelEn: 'Doctor',
          labelHi: 'डॉक्टर',
          confidence: 0.89,
          trustLevel: 'VERIFIED',
          source: 'CLASSIFIER'
        };
      }

      // 4. HOW-ARE-YOU: Both hands open, palms upward, spaced comfortably
      if (wristDist >= 0.25 && index1 && middle1 && index2 && middle2) {
        return {
          gloss: 'HOW-ARE-YOU',
          labelEn: 'How are you?',
          labelHi: 'आप कैसे हैं?',
          confidence: 0.88,
          trustLevel: 'VERIFIED',
          source: 'CLASSIFIER'
        };
      }
    }

    // SINGLE-HAND RECOGNITION

    // 1. "NO": Index finger strictly extended upright, other fingers curled
    if (index1 && !middle1 && !ring1 && !pinky1) {
      return {
        gloss: 'NO',
        labelEn: 'No',
        labelHi: 'नहीं',
        confidence: 0.92,
        trustLevel: 'VERIFIED',
        source: 'CLASSIFIER'
      };
    }

    // 2. "YES": Closed fist
    if (!thumb1 && !index1 && !middle1 && !ring1 && !pinky1) {
      return {
        gloss: 'YES',
        labelEn: 'Yes',
        labelHi: 'हाँ',
        confidence: 0.90,
        trustLevel: 'VERIFIED',
        source: 'CLASSIFIER'
      };
    }

    // 3. "GOOD-MORNING": Thumb up fist
    if (thumb1 && !index1 && !middle1 && !ring1 && !pinky1) {
      return {
        gloss: 'GOOD-MORNING',
        labelEn: 'Good Morning',
        labelHi: 'सुप्रभात',
        confidence: 0.88,
        trustLevel: 'VERIFIED',
        source: 'CLASSIFIER'
      };
    }

    // 4. "WATER": 3 fingers extended (index, middle, ring) like W
    if (index1 && middle1 && ring1 && !pinky1) {
      return {
        gloss: 'WATER',
        labelEn: 'Water',
        labelHi: 'पानी',
        confidence: 0.89,
        trustLevel: 'VERIFIED',
        source: 'CLASSIFIER'
      };
    }

    // 5. "FOOD": Bunched fingertips near palm center (moderate extension/flexion)
    if (!index1 && !middle1 && !ring1 && !pinky1 && thumb1) {
      return {
        gloss: 'FOOD',
        labelEn: 'Food / Eat',
        labelHi: 'खाना',
        confidence: 0.85,
        trustLevel: 'VERIFIED',
        source: 'CLASSIFIER'
      };
    }

    // 6. "THANK-YOU": 4 or 5 fingers extended flat
    if (index1 && middle1 && ring1 && pinky1) {
      return {
        gloss: 'THANK-YOU',
        labelEn: 'Thank You',
        labelHi: 'धन्यवाद',
        confidence: 0.87,
        trustLevel: 'VERIFIED',
        source: 'CLASSIFIER'
      };
    }

    // 7. "PLEASE": Flat palm resting against chest
    if (index1 && middle1 && ring1 && pinky1 && thumb1) {
      return {
        gloss: 'PLEASE',
        labelEn: 'Please',
        labelHi: 'कृपया',
        confidence: 0.86,
        trustLevel: 'VERIFIED',
        source: 'CLASSIFIER'
      };
    }

    // 8. "STOP": Open flat hand upright
    if (index1 && middle1 && ring1 && pinky1) {
      return {
        gloss: 'STOP',
        labelEn: 'Stop',
        labelHi: 'रुको',
        confidence: 0.88,
        trustLevel: 'VERIFIED',
        source: 'CLASSIFIER'
      };
    }

    return null;
  }
}

export const landmarkTemplateMatcher = new LandmarkTemplateMatcher();
