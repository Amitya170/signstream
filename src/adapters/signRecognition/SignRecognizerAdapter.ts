import { LandmarkPoint, TrustLevel } from '../../core/types';

export interface SupportedSignInfo {
  gloss: string;
  labelEn: string;
  labelHi: string;
  description: string;
  trustLevel: TrustLevel;
}

export interface RecognitionResult {
  gloss: string;
  labelEn: string;
  labelHi: string;
  confidence: number; // 0.0 to 1.0
  trustLevel: TrustLevel;
  source: 'TEMPLATE_MATCHER' | 'USER_CUSTOM' | 'ML_MODEL' | 'CLASSIFIER';
  isCustomSign?: boolean;
}

export interface SignRecognizerAdapter {
  id: string;
  name: string;
  isSupported(): boolean;
  getSupportedSigns(): Promise<SupportedSignInfo[]>;
  recognize(landmarks: LandmarkPoint[]): Promise<RecognitionResult | null>;
}
