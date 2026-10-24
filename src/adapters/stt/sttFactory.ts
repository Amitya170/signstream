import { SpeechToTextAdapter } from './SpeechToTextAdapter';
import { WebSpeechAdapter } from './webSpeechAdapter';
import { WhisperLocalAdapter } from './whisperAdapter';
import { MockSttAdapter } from './mockSttAdapter';

export const webSpeechAdapter = new WebSpeechAdapter();
export const whisperLocalAdapter = new WhisperLocalAdapter();
export const mockSttAdapter = new MockSttAdapter();

export function getSttAdapter(preferred: 'whisper' | 'webSpeech' | 'mock'): SpeechToTextAdapter {
  if (preferred === 'whisper' && whisperLocalAdapter.isSupported()) {
    return whisperLocalAdapter;
  }
  if (preferred === 'webSpeech' && webSpeechAdapter.isSupported()) {
    return webSpeechAdapter;
  }
  if (webSpeechAdapter.isSupported()) {
    return webSpeechAdapter;
  }
  if (whisperLocalAdapter.isSupported()) {
    return whisperLocalAdapter;
  }
  return mockSttAdapter;
}
