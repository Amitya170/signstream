/**
 * Project SignStream - Core Types
 * Strict, extensible contracts for trust, declarative sign clips, messages, and provenance.
 */

export type TrustLevel = 'VERIFIED' | 'COMMUNITY' | 'DEMO' | 'UNVERIFIED';

export interface Provenance {
  source: string;
  licence: string;
  reviewer?: string;
  reviewedOn?: string;
  notes?: string;
}

export interface HandPoseTarget {
  /** 3D position offset relative to wrist [x, y, z] */
  position?: [number, number, number];
  /** Euler rotation angles [pitch, yaw, roll] in radians */
  rotation?: [number, number, number];
  /** Normalized finger flexion states: [thumb, index, middle, ring, pinky] (0 = fully extended, 1 = fully curled/closed) */
  curl?: [number, number, number, number, number];
  /** Hand spread angle between fingers (0 = tight together, 1 = spread wide) */
  spread?: number;
}

export interface ArmPoseTarget {
  /** Shoulder rotation [pitch, yaw, roll] in radians */
  shoulderRotation?: [number, number, number];
  /** Elbow flexion in radians (0 = straight, ~2.2 = fully bent) */
  elbowAngle?: number;
  /** Forearm roll / pronation-supination in radians */
  forearmRoll?: number;
}

export interface FacePoseTarget {
  /** Brow raise (-1 = furrowed/concerned, 0 = neutral, 1 = raised/question) */
  browState?: number;
  /** Mouth expression: 'neutral' | 'open' | 'smile' | 'round' */
  mouthState?: 'neutral' | 'open' | 'smile' | 'round' | 'tight-lips';
  /** Head tilt/nod [pitch, yaw, roll] in radians */
  headRotation?: [number, number, number];
}

export interface TorsoPoseTarget {
  lean?: [number, number, number];
}

export interface SignKeyframe {
  /** Time offset in milliseconds from clip start (0 to durationMs) */
  timeMs: number;
  leftHand?: HandPoseTarget;
  rightHand?: HandPoseTarget;
  leftArm?: ArmPoseTarget;
  rightArm?: ArmPoseTarget;
  face?: FacePoseTarget;
  torso?: TorsoPoseTarget;
  /** Optional caption or linguistic marker at this exact moment */
  annotation?: string;
  /** Active sub-word gloss during continuous multi-word sentence playback */
  activeGloss?: string;
}

export interface SignClip {
  id: string;
  version: string;
  /** Official ISL gloss descriptor (e.g., "NAMASTE", "THANK-YOU", "HELP") */
  gloss: string;
  labels: {
    en: string;
    hi: string;
  };
  durationMs: number;
  trustLevel: TrustLevel;
  provenance: Provenance;
  keyframes: SignKeyframe[];
  /** Notes on ISL syntax or non-manual markers (mouth, head tilt) */
  linguisticNotes?: string;
}

export type MessageSource = 'TYPED' | 'SPOKEN' | 'SIGN-DEMO' | 'TRANSLATED' | 'UNVERIFIED';

export interface Message {
  id: string;
  text: string;
  source: MessageSource;
  trustLevel: TrustLevel;
  timestamp: number;
  glossMatch?: string;
  audioLanguage?: string;
}

export interface Phrase {
  id: string;
  text: string;
  hindiText?: string;
  gloss: string;
  frequency: number;
  isFavorite: boolean;
  category: 'greetings' | 'emergency' | 'daily' | 'medical' | 'custom';
  createdAt: number;
}

export interface UserCorrection {
  id: string;
  originalText: string;
  correctedText: string;
  appliedCount: number;
  createdAt: number;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface LandmarkTemplate {
  id: string;
  gloss: string;
  label: string;
  trustLevel: TrustLevel;
  /** 21 normalized landmarks per hand */
  landmarks: LandmarkPoint[];
  recordedAt: number;
  isCustom: boolean;
  notes?: string;
}

export interface LexiconPack {
  id: string;
  name: string;
  version: string;
  licence: string;
  source: string;
  reviewer?: string;
  reviewedOn?: string;
  trustLevel: TrustLevel;
  clips: SignClip[];
  description?: string;
}

export type AppTheme = 'light' | 'dark' | 'high-contrast-bw' | 'high-contrast-yellow';

export interface AppSettings {
  textSize: number; // 1.0 (100%) to 2.0 (200%)
  theme: AppTheme;
  reducedMotion: boolean;
  avatarMode: 'three' | 'svg';
  avatarSkinTone: string;
  avatarOutfitColor: string;
  avatarBackground: string;
  avatarScale: number;
  playbackSpeed: number; // 0.5 to 1.5
  uiLanguage: 'en' | 'hi';
  sttEngine: 'webSpeech' | 'whisper' | 'mock';
  ttsVoiceURI: string;
  ttsRate: number;
  ttsPitch: number;
  memoryPaused: boolean;
}

export interface TranslationCoverage {
  fullMatch: boolean;
  inputPhrase: string;
  matchedSignClips: SignClip[];
  unsupportedTokens: string[];
  explanation: string;
}

export interface LocalErrorReport {
  id: string;
  timestamp: number;
  type: 'WRONG_SIGN' | 'WRONG_TRANSCRIPTION' | 'UI_BUG' | 'OTHER';
  inputContext: string;
  actualOutput: string;
  userFeedback: string;
}
