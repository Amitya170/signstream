import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock Web Speech Synthesis
if (typeof window !== 'undefined') {
  // Mock HTMLElement.prototype.scrollIntoView
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = function () {};
  }

  const mockVoices = [
    { name: 'Google English (India)', lang: 'en-IN', voiceURI: 'en-IN-std' },
    { name: 'Google Hindi', lang: 'hi-IN', voiceURI: 'hi-IN-std' }
  ];

  window.speechSynthesis = {
    speaking: false,
    paused: false,
    pending: false,
    onvoiceschanged: null,
    getVoices: () => mockVoices as any,
    speak: (utterance: any) => {
      setTimeout(() => utterance.onend?.(), 10);
    },
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  } as any;

  // @ts-expect-error Mock Utterance
  window.SpeechSynthesisUtterance = class {
    text: string;
    rate = 1;
    pitch = 1;
    voice = null;
    onend = null;
    onerror = null;
    constructor(text = '') {
      this.text = text;
    }
  };

  // Mock navigator.mediaDevices.getUserMedia
  if (!navigator.mediaDevices) {
    // @ts-expect-error mock mediaDevices
    navigator.mediaDevices = {};
  }
  navigator.mediaDevices.getUserMedia = async () => {
    const track = { stop: () => {}, readyState: 'live' };
    return {
      active: true,
      getTracks: () => [track],
      getVideoTracks: () => [track],
      getAudioTracks: () => [track]
    } as any;
  };

  // Mock navigator.storage.estimate
  if (!navigator.storage) {
    // @ts-expect-error mock storage
    navigator.storage = {};
  }
  navigator.storage.estimate = async () => ({
    usage: 1024 * 50,
    quota: 1024 * 1024 * 500
  });
}
