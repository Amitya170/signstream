import { SignClip, SignKeyframe } from '../../core/types';

export interface SemanticAnalysisResult {
  concept: string;
  category: 'action' | 'emotion' | 'object' | 'nature' | 'intellectual' | 'social';
  valence: 'positive' | 'negative' | 'neutral';
  handshape: 'index' | 'open5' | 'flatB' | 'curvedC' | 'fistS' | 'yHand';
  locus: 'chest' | 'chin' | 'forehead' | 'space';
  isTwoHanded: boolean;
}

export class SemanticSignImproviser {
  /**
   * Analyzes an unseen concept to determine its semantic morphemes and gesture profile.
   */
  public analyzeConcept(word: string): SemanticAnalysisResult {
    const lower = word.toLowerCase().trim();

    // Emotion keywords
    if (/happy|joy|love|kind|gentle|warm|smile|laugh|cheer|proud|grateful|excite|celebrat/.test(lower)) {
      return {
        concept: word,
        category: 'emotion',
        valence: 'positive',
        handshape: 'open5',
        locus: 'chest',
        isTwoHanded: true
      };
    }
    if (/sad|cry|pain|hurt|tear|sorrow|grief|depress|alone|unhappy|fear|scare|terr/.test(lower)) {
      return {
        concept: word,
        category: 'emotion',
        valence: 'negative',
        handshape: 'open5',
        locus: 'chin',
        isTwoHanded: false
      };
    }
    if (/angry|mad|furious|hate|rage|disgust|annoy|bitter/.test(lower)) {
      return {
        concept: word,
        category: 'emotion',
        valence: 'negative',
        handshape: 'fistS',
        locus: 'chest',
        isTwoHanded: true
      };
    }

    // Intellectual & Cognition keywords
    if (/think|idea|smart|mind|brain|wisdom|know|learn|study|logic|science|math|physics|philosophy|understand|plan/.test(lower)) {
      return {
        concept: word,
        category: 'intellectual',
        valence: 'neutral',
        handshape: 'index',
        locus: 'forehead',
        isTwoHanded: false
      };
    }

    // Technology, Tools & Objects
    if (/computer|code|program|tech|robot|machine|software|app|data|cyber|electric|engine|device|digital|screen/.test(lower)) {
      return {
        concept: word,
        category: 'object',
        valence: 'neutral',
        handshape: 'curvedC',
        locus: 'space',
        isTwoHanded: true
      };
    }

    // Nature, Cosmos & Earth
    if (/sky|star|space|sun|planet|galaxy|universe|cloud|wind|ocean|sea|mountain|forest|flower|air|light/.test(lower)) {
      return {
        concept: word,
        category: 'nature',
        valence: 'positive',
        handshape: 'open5',
        locus: 'space',
        isTwoHanded: true
      };
    }

    // Dynamic Action keywords
    if (/run|fly|jump|climb|swim|drive|build|create|fight|protect|guard|move|travel|explore|search|find/.test(lower)) {
      return {
        concept: word,
        category: 'action',
        valence: 'neutral',
        handshape: 'flatB',
        locus: 'space',
        isTwoHanded: true
      };
    }

    // Social, Community & Peace
    if (/friend|family|team|together|unity|peace|society|community|people|talk|meet|agree|harmony|nation/.test(lower)) {
      return {
        concept: word,
        category: 'social',
        valence: 'positive',
        handshape: 'flatB',
        locus: 'chest',
        isTwoHanded: true
      };
    }

    // Default general semantic mapping based on string hash
    let hash = 0;
    for (let i = 0; i < lower.length; i++) hash = (hash << 5) - hash + lower.charCodeAt(i);
    const handshapes: Array<SemanticAnalysisResult['handshape']> = ['flatB', 'open5', 'index', 'curvedC', 'fistS'];
    const chosenHand = handshapes[Math.abs(hash) % handshapes.length];

    return {
      concept: word,
      category: 'action',
      valence: 'neutral',
      handshape: chosenHand,
      locus: 'space',
      isTwoHanded: Math.abs(hash) % 2 === 0
    };
  }

  /**
   * Generates a fully articulated 4-keyframe SignClip with authentic forward-signing kinematics.
   */
  public synthesizeSign(word: string, hindiTranslation?: string): SignClip {
    const analysis = this.analyzeConcept(word);
    const upperGloss = word.toUpperCase().replace(/\s+/g, '-');
    const durMs = 1800;

    // Resting initial keyframe
    const kf0: SignKeyframe = {
      timeMs: 0,
      leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
      rightArm: { shoulderRotation: [0.2, -0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
      leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
      rightHand: { position: [0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
      face: { browState: 0, mouthState: 'neutral', headRotation: [0, 0, 0] }
    };

    // Calculate curls based on handshape archetype
    let rightCurl: [number, number, number, number, number] = [0.1, 0.1, 0.1, 0.1, 0.1];
    let leftCurl: [number, number, number, number, number] = [0.1, 0.1, 0.1, 0.1, 0.1];
    let spread = 0.15;

    switch (analysis.handshape) {
      case 'index':
        rightCurl = [0.95, 0.05, 0.95, 0.95, 0.95];
        leftCurl = [0.95, 0.05, 0.95, 0.95, 0.95];
        spread = 0.05;
        break;
      case 'open5':
        rightCurl = [0.05, 0.05, 0.05, 0.05, 0.05];
        leftCurl = [0.05, 0.05, 0.05, 0.05, 0.05];
        spread = 0.35;
        break;
      case 'flatB':
        rightCurl = [0.1, 0.1, 0.1, 0.1, 0.1];
        leftCurl = [0.1, 0.1, 0.1, 0.1, 0.1];
        spread = 0.05;
        break;
      case 'curvedC':
        rightCurl = [0.35, 0.35, 0.35, 0.35, 0.35];
        leftCurl = [0.35, 0.35, 0.35, 0.35, 0.35];
        spread = 0.15;
        break;
      case 'fistS':
        rightCurl = [0.95, 0.95, 0.95, 0.95, 0.95];
        leftCurl = [0.95, 0.95, 0.95, 0.95, 0.95];
        spread = 0;
        break;
      case 'yHand':
        rightCurl = [0.05, 0.95, 0.95, 0.95, 0.05];
        leftCurl = [0.05, 0.95, 0.95, 0.95, 0.05];
        spread = 0.3;
        break;
    }

    // Locus coordinates (elevation and depth in forward signing space z > 0)
    let rightY1 = 0.32;
    let rightY2 = 0.32;
    let rightZ = 0.28;
    let brow = 0.1;
    let mouth: 'neutral' | 'open' | 'smile' | 'round' | 'tight-lips' = 'neutral';
    let headPitch = 0;

    if (analysis.valence === 'positive') {
      mouth = 'smile';
      brow = 0.2;
    } else if (analysis.valence === 'negative') {
      mouth = 'tight-lips';
      brow = -0.3;
    }

    if (analysis.locus === 'forehead') {
      rightY1 = 0.54;
      rightY2 = 0.54;
      rightZ = 0.22;
      headPitch = 0.06;
    } else if (analysis.locus === 'chin') {
      rightY1 = 0.44;
      rightY2 = 0.38;
      rightZ = 0.24;
    } else if (analysis.locus === 'chest') {
      rightY1 = 0.34;
      rightY2 = 0.28;
      rightZ = 0.28;
    } else {
      // General signing space
      rightY1 = 0.32;
      rightY2 = 0.36;
      rightZ = 0.3;
    }

    const kf1: SignKeyframe = {
      timeMs: 650,
      leftArm: analysis.isTwoHanded
        ? { shoulderRotation: [0.5, 0.15, 0], elbowAngle: 1.25, forearmRoll: 0 }
        : { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
      rightArm: { shoulderRotation: [0.55, -0.15, 0], elbowAngle: 1.3, forearmRoll: 0 },
      leftHand: analysis.isTwoHanded
        ? { position: [-0.12, rightY1, rightZ], rotation: [0.1, 0.1, 0], curl: leftCurl, spread }
        : { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
      rightHand: { position: [0.12, rightY1, rightZ], rotation: [0.1, -0.1, 0], curl: rightCurl, spread },
      face: { browState: brow, mouthState: mouth, headRotation: [headPitch, 0, 0] }
    };

    const kf2: SignKeyframe = {
      timeMs: 1250,
      leftArm: analysis.isTwoHanded
        ? { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.15, forearmRoll: 0 }
        : { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
      rightArm: { shoulderRotation: [0.5, -0.15, 0], elbowAngle: 1.2, forearmRoll: 0 },
      leftHand: analysis.isTwoHanded
        ? { position: [-0.08, rightY2, rightZ], rotation: [0.1, 0.1, 0], curl: leftCurl, spread }
        : { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
      rightHand: { position: [0.14, rightY2, rightZ], rotation: [0.1, -0.1, 0], curl: rightCurl, spread },
      face: { browState: brow, mouthState: mouth, headRotation: [headPitch, 0, 0] }
    };

    const kf3: SignKeyframe = {
      timeMs: durMs,
      leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
      rightArm: { shoulderRotation: [0.2, -0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
      leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
      rightHand: { position: [0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
      face: { browState: 0, mouthState: 'neutral', headRotation: [0, 0, 0] }
    };

    const hi = hindiTranslation || word;

    return {
      id: `improvised-${upperGloss.toLowerCase()}-${Date.now()}`,
      version: '2.0.0',
      gloss: upperGloss,
      labels: {
        en: word.charAt(0).toUpperCase() + word.slice(1),
        hi
      },
      durationMs: durMs,
      trustLevel: 'COMMUNITY',
      provenance: {
        source: 'SignStream Web Semantic Improviser Engine',
        licence: 'CC-BY-4.0',
        reviewer: 'AI Semantic Gesture Synthesizer',
        reviewedOn: new Date().toISOString().split('T')[0],
        notes: `Auto-synthesized gesture for "${word}" via morphological semantic analysis (${analysis.category}, ${analysis.handshape} handshape, ${analysis.locus} locus).`
      },
      linguisticNotes: `Semantic Improvisation: Concept="${word}", Locus=${analysis.locus}, Handshape=${analysis.handshape}.`,
      keyframes: [kf0, kf1, kf2, kf3]
    };
  }
}

export const semanticSignImproviser = new SemanticSignImproviser();
