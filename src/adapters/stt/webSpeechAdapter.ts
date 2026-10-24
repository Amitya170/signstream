import { SpeechToTextAdapter, SttCallbacks } from './SpeechToTextAdapter';
import { permissionManager } from '../../lib/permissions';

export class WebSpeechAdapter implements SpeechToTextAdapter {
  public id = 'webSpeech';
  public name = 'Browser Web Speech API';
  private recognition: any = null;
  private listening = false;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      // @ts-expect-error browser speech prefix
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
  }

  public getPrivacyNotice(): string {
    return 'Privacy Notice: Browser Web Speech API may transmit audio to external browser cloud services (e.g., Google or Apple) for transcription. For zero data egress, use the offline Whisper model.';
  }

  public async start(language: string, callbacks: SttCallbacks): Promise<void> {
    if (!this.isSupported()) {
      callbacks.onError('Web Speech API is not supported in this browser.');
      return;
    }

    if (!permissionManager.getConsent('microphone')) {
      callbacks.onError('Microphone consent not granted. Please allow microphone access.');
      return;
    }

    try {
      // @ts-expect-error browser speech prefix
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      this.recognition.onstart = () => {
        this.listening = true;
        callbacks.onStateChange?.('listening');
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (final) {
          callbacks.onResult(final.trim(), true);
        } else if (interim) {
          callbacks.onResult(interim.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.listening = false;
        callbacks.onStateChange?.('idle');
        callbacks.onError(event.error || 'Speech recognition encountered an error.');
      };

      this.recognition.onend = () => {
        this.listening = false;
        callbacks.onStateChange?.('idle');
      };

      this.recognition.start();
    } catch (err: any) {
      this.listening = false;
      callbacks.onError(err.message || 'Failed to start speech recognition.');
    }
  }

  public async stop(): Promise<void> {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.listening = false;
  }

  public isListening(): boolean {
    return this.listening;
  }
}
