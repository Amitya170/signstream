import { SpeechToTextAdapter, SttCallbacks } from './SpeechToTextAdapter';

export class MockSttAdapter implements SpeechToTextAdapter {
  public id = 'mock';
  public name = 'Mock Speech Recognizer (Testing & Fallback)';
  private listening = false;
  private timeoutId: any = null;

  public isSupported(): boolean {
    return true;
  }

  public getPrivacyNotice(): string {
    return 'Mock mode: Generates simulated sample speech events for testing and accessibility audit.';
  }

  public async start(language: string, callbacks: SttCallbacks): Promise<void> {
    this.listening = true;
    callbacks.onStateChange?.('listening');

    this.timeoutId = setTimeout(() => {
      const mockResult = language === 'hi' ? 'नमस्ते धन्यवाद' : 'Namaste thank you';
      callbacks.onResult(mockResult, true);
      this.listening = false;
      callbacks.onStateChange?.('idle');
    }, 1200);
  }

  public async stop(): Promise<void> {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.listening = false;
  }

  public isListening(): boolean {
    return this.listening;
  }
}
