import { TextToSpeechAdapter, VoiceInfo, TtsOptions } from './TextToSpeechAdapter';

export class BrowserSpeechSynthesisAdapter implements TextToSpeechAdapter {
  public id = 'browserSynthesis';
  public name = 'Browser SpeechSynthesis';

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public async getVoices(): Promise<VoiceInfo[]> {
    if (!this.isSupported()) return [];

    let rawVoices = window.speechSynthesis.getVoices();
    if (rawVoices.length === 0) {
      // Wait for voiceschanged event
      await new Promise<void>((resolve) => {
        const handler = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
          resolve();
        };
        window.speechSynthesis.addEventListener('voiceschanged', handler);
        setTimeout(resolve, 800); // timeout fallback
      });
      rawVoices = window.speechSynthesis.getVoices();
    }

    return rawVoices.map((v) => {
      const langLower = v.lang.toLowerCase();
      const isIndian = langLower.includes('in') || langLower.includes('hi') || langLower.includes('india');
      return {
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        isIndianVariant: isIndian
      };
    });
  }

  public async speak(text: string, options?: TtsOptions): Promise<void> {
    if (!this.isSupported()) return;
    this.stop(); // Stop any ongoing speech

    const trimmed = text.trim();
    if (!trimmed) return;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(trimmed);

      if (options?.rate) utterance.rate = options.rate;
      if (options?.pitch) utterance.pitch = options.pitch;

      const voices = window.speechSynthesis.getVoices();
      if (options?.voiceURI) {
        const match = voices.find(v => v.voiceURI === options.voiceURI);
        if (match) utterance.voice = match;
      } else if (options?.lang) {
        const match = voices.find(v => v.lang.toLowerCase().startsWith(options.lang!.toLowerCase()));
        if (match) utterance.voice = match;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    if (!this.isSupported()) return false;
    return window.speechSynthesis.speaking;
  }
}

export const browserSpeechSynthesis = new BrowserSpeechSynthesisAdapter();
