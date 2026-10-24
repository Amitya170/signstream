export interface SttCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string) => void;
  onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'downloading') => void;
}

export interface SpeechToTextAdapter {
  id: string;
  name: string;
  isSupported(): boolean;
  getPrivacyNotice(): string;
  start(language: string, callbacks: SttCallbacks): Promise<void>;
  stop(): Promise<void>;
  isListening(): boolean;
}
