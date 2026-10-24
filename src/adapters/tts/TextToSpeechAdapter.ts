export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  isIndianVariant: boolean;
}

export interface TtsOptions {
  voiceURI?: string;
  rate?: number; // 0.5 to 2.0
  pitch?: number; // 0.5 to 2.0
  lang?: string;
}

export interface TextToSpeechAdapter {
  id: string;
  name: string;
  isSupported(): boolean;
  getVoices(): Promise<VoiceInfo[]>;
  speak(text: string, options?: TtsOptions): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
}
