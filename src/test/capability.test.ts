import { describe, it, expect, vi, afterEach } from 'vitest';
import { detectCapabilities } from '../lib/capabilities';

describe('Hardware and Browser Capability Detection Tests', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects missing camera when mediaDevices is unavailable', () => {
    // Mock navigator without mediaDevices
    const mockNav = {
      ...originalNavigator,
      mediaDevices: undefined,
      onLine: true
    };
    vi.stubGlobal('navigator', mockNav);

    const caps = detectCapabilities();
    expect(caps.camera).toBe(false);
    expect(caps.microphone).toBe(false);
  });

  it('detects missing speech synthesis when window.speechSynthesis is not defined', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const caps = detectCapabilities();
    expect(caps.speechSynthesis).toBe(false);
  });

  it('detects missing Web Speech API when recognition constructors do not exist', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const caps = detectCapabilities();
    expect(caps.webSpeechSTT).toBe(false);
  });

  it('detects complete available hardware when all APIs are present', () => {
    const mockNav = {
      ...originalNavigator,
      mediaDevices: {
        getUserMedia: vi.fn()
      },
      gpu: {},
      onLine: true
    };
    vi.stubGlobal('navigator', mockNav);
    vi.stubGlobal('speechSynthesis', { speak: vi.fn() });
    vi.stubGlobal('SpeechRecognition', vi.fn());

    const caps = detectCapabilities();
    expect(caps.camera).toBe(true);
    expect(caps.microphone).toBe(true);
    expect(caps.speechSynthesis).toBe(true);
    expect(caps.webSpeechSTT).toBe(true);
    expect(caps.webGPU).toBe(true);
    expect(caps.online).toBe(true);
  });
});
