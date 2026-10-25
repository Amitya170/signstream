export interface MudraAnatomy {
  gloss: string;
  sanskritName: string;
  englishHandshape: string;
  handedness: 'ONE_HANDED' | 'TWO_HANDED_SYMMETRIC' | 'TWO_HANDED_ASYMMETRIC';
  baseHandshape?: string;
  movementTrajectory: string;
  contactLocation: string;
  nonManualMarkers: string;
  orientation: string;
  category: string;
  provenanceStandard: string;
}

export const MUDRA_REGISTRY: Record<string, MudraAnatomy> = {
  NAMASTE: {
    gloss: 'NAMASTE',
    sanskritName: 'Anjali Mudra / Pataka (अञ्जलि मुद्रा)',
    englishHandshape: 'Both Palms Flat & Pressed Together (Open B-Handshape)',
    handedness: 'TWO_HANDED_SYMMETRIC',
    baseHandshape: 'Contralateral Flat Palm pressed symmetrically at mid-chest',
    movementTrajectory: 'Both arms rise together from rest, meet at chest midline, gentle hold, respectful descent',
    contactLocation: 'Mid-Sternum (Signing Space Center)',
    nonManualMarkers: 'Respectful 12° forward head bow with serene facial expression',
    orientation: 'Palms touching, fingers angled 45° upward and slightly forward',
    category: 'Greeting & Respect',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  THANK_YOU: {
    gloss: 'THANK_YOU',
    sanskritName: 'Pataka Mudra (पताक मुद्रा)',
    englishHandshape: 'Open Flat Palm, thumb tucked softly alongside palm edge',
    handedness: 'ONE_HANDED',
    baseHandshape: 'None (Unimanual sign)',
    movementTrajectory: 'Fingertips contact chin/lower lip, then sweep forward and downward toward conversational partner',
    contactLocation: 'Chin / Lower Lip -> Forward Space',
    nonManualMarkers: 'Affirmative gentle head nod with warm, direct eye contact and grateful smile',
    orientation: 'Palm facing chest at start, rotating smoothly outward toward recipient',
    category: 'Politeness & Social',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  PLEASE: {
    gloss: 'PLEASE',
    sanskritName: 'Pataka Mudra (पताक मुद्रा)',
    englishHandshape: 'Flat Open Hand, all 5 fingers fully extended and adducted',
    handedness: 'ONE_HANDED',
    baseHandshape: 'None (Unimanual chest contact)',
    movementTrajectory: 'Gentle clockwise circular rubbing stroke over the sternum/chest (2 complete revolutions)',
    contactLocation: 'Central Sternum',
    nonManualMarkers: 'Polite slight brow raise with gentle tilt of head and soft respectful mouth posture',
    orientation: 'Palm resting flat against chest surface, fingers pointing upward/left',
    category: 'Politeness & Social',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  YES: {
    gloss: 'YES',
    sanskritName: 'Mutti Mudra (मुष्टि मुद्रा)',
    englishHandshape: 'Firm Closed Fist (S-Handshape with thumb crossing front knuckles)',
    handedness: 'ONE_HANDED',
    baseHandshape: 'None (Unimanual sign in signing space)',
    movementTrajectory: 'Wrist flexion nodding down and up twice, imitating a human nodding head',
    contactLocation: 'Right Chest Signing Neutral Space',
    nonManualMarkers: 'Synchronized affirmative head nod, relaxed open eyes and confirming mouth posture',
    orientation: 'Knuckles facing forward toward conversational partner',
    category: 'Affirmation & Agreement',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  NO: {
    gloss: 'NO',
    sanskritName: 'Kartarimukha / Suchi Pinch (कर्तरीमुख मुद्रा)',
    englishHandshape: 'Index and middle fingers extend, then snap shut against thumb pad',
    handedness: 'ONE_HANDED',
    baseHandshape: 'None (Unimanual sign in signing space)',
    movementTrajectory: 'Horizontal side-to-side wrist oscillation with rapid closing snap of index and middle fingers',
    contactLocation: 'Upper Neutral Signing Space (Shoulder Height)',
    nonManualMarkers: 'Head shake side-to-side, slightly furrowed brows, mouth pronouncing "no" or compressed lips',
    orientation: 'Palm facing outward toward conversational partner',
    category: 'Negation & Denial',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  HELP: {
    gloss: 'HELP',
    sanskritName: 'Shikhara on Pataka (शिखर एवं पताक मुद्रा)',
    englishHandshape: 'Dominant Shikhara (Thumbs-up fist) placed firmly upon non-dominant Flat Palm',
    handedness: 'TWO_HANDED_ASYMMETRIC',
    baseHandshape: 'Horizontal Non-Dominant Palm facing upward (Providing support plane)',
    movementTrajectory: 'Dominant fist rests upon flat base palm; both hands lift upward together in tandem',
    contactLocation: 'Abdominal Signing Plane to Mid-Chest Plane',
    nonManualMarkers: 'Forward leaning torso, urgent or expectant eye gaze, raised expressive eyebrows',
    orientation: 'Base palm flat upward; dominant thumb pointed vertically upward',
    category: 'Emergency & Assistance',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  DOCTOR: {
    gloss: 'DOCTOR',
    sanskritName: 'Katakamukha / Tri-finger Pulse (कटकमुख मुद्रा)',
    englishHandshape: 'Dominant Index and Middle fingertips extended together (Pulse-feeling grip)',
    handedness: 'TWO_HANDED_ASYMMETRIC',
    baseHandshape: 'Non-Dominant Forearm extended horizontal, palm facing upward (Supine radial pulse plane)',
    movementTrajectory: 'Dominant fingertips tap twice in steady rhythm onto radial artery of base wrist',
    contactLocation: 'Non-Dominant Left Radial Wrist',
    nonManualMarkers: 'Attentive, focused gaze directed downward toward pulse contact point',
    orientation: 'Base wrist supine facing upward; dominant fingers pointing downward vertically',
    category: 'Healthcare & Medical',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  WATER: {
    gloss: 'WATER',
    sanskritName: 'Tripataka Mudra (त्रिपताक मुद्रा)',
    englishHandshape: 'W-Handshape: Index, middle, and ring fingers extended upright; thumb holds pinky',
    handedness: 'ONE_HANDED',
    baseHandshape: 'None (Unimanual sign at lower face)',
    movementTrajectory: 'Index finger of W-hand taps lower lip/chin twice in rhythmic contact',
    contactLocation: 'Lower Lip & Chin Margin',
    nonManualMarkers: 'Subtle mouth movement forming the syllable "paa-ni" or "water"',
    orientation: 'Palm facing left/inward toward signer\'s face',
    category: 'Sustenance & Everyday',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  HOSPITAL: {
    gloss: 'HOSPITAL',
    sanskritName: 'Suchi Mudra (सूची मुद्रा)',
    englishHandshape: 'Dominant Extended Index Finger (Tracing medical cross)',
    handedness: 'TWO_HANDED_ASYMMETRIC',
    baseHandshape: 'Non-Dominant Upper Arm / Forearm surface',
    movementTrajectory: 'Dominant index finger traces a vertical stroke then horizontal cross stroke on upper shoulder/arm',
    contactLocation: 'Non-Dominant Upper Bicep / Shoulder',
    nonManualMarkers: 'Neutral professional expression, alert posture',
    orientation: 'Index fingertip contacting bicep fabric',
    category: 'Healthcare & Medical',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  },
  EMERGENCY: {
    gloss: 'EMERGENCY',
    sanskritName: 'Shikhara / E-Handshape (शिखर मुद्रा)',
    englishHandshape: 'Compact E-Handshape shaking urgently with high frequency',
    handedness: 'ONE_HANDED',
    baseHandshape: 'None (Urgent oscillatory motion in central space)',
    movementTrajectory: 'Rapid side-to-side wrist vibration/shake in neutral signing space',
    contactLocation: 'Mid-Chest Space (Upper Torso Height)',
    nonManualMarkers: 'Wide alert eyes, elevated brows, tense facial muscles signaling urgency',
    orientation: 'Palm facing forward toward observer',
    category: 'Emergency & Urgency',
    provenanceStandard: 'ISLRTC Official Corpus Vol. 1'
  }
};

export function getMudraAnatomy(glossOrWord: string): MudraAnatomy {
  const normalized = glossOrWord.toUpperCase().trim().replace(/[^A-Z_]/g, '');

  if (MUDRA_REGISTRY[normalized]) {
    return MUDRA_REGISTRY[normalized];
  }

  // Look for partial matches in registry
  for (const [key, data] of Object.entries(MUDRA_REGISTRY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return data;
    }
  }

  // Fallback for fingerspelled / arbitrary signs
  return {
    gloss: normalized || glossOrWord,
    sanskritName: 'Bihasta Aksharamala (द्विहस्त वर्णमाला / Two-handed ISL Alphabet)',
    englishHandshape: 'Two-Handed ISL Manual Fingerspelling Configuration',
    handedness: 'TWO_HANDED_ASYMMETRIC',
    baseHandshape: 'Non-Dominant Base Hand supporting phonetic phalanx position',
    movementTrajectory: 'Targeted fingertip contact mapping to ISL two-handed manual alphabet keypoints',
    contactLocation: 'Chest Neutral Signing Space',
    nonManualMarkers: 'Mouth morpheme synchronizing with pronounced syllables',
    orientation: 'Palms facing conversational partner in clear signing envelope',
    category: 'Manual Fingerspelling',
    provenanceStandard: 'ISLRTC Bilingual Deaf Standards'
  };
}
