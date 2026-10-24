/**
 * System Capability Detection
 * Evaluates hardware and browser APIs for STT, TTS, WebGPU, and Vision.
 */

export interface SystemCapabilities {
  webSpeechSTT: boolean;
  speechSynthesis: boolean;
  camera: boolean;
  microphone: boolean;
  webGPU: boolean;
  wasm: boolean;
  indexedDB: boolean;
  online: boolean;
}

export function detectCapabilities(): SystemCapabilities {
  const hasWindow = typeof window !== 'undefined';
  const hasNav = typeof navigator !== 'undefined';

  const webSpeechSTT = hasWindow && Boolean(
    // @ts-expect-error browser prefix
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  const speechSynthesis = hasWindow && Boolean((window as any).speechSynthesis);
  const camera = hasNav && Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const microphone = hasNav && Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const webGPU = hasNav && 'gpu' in navigator;
  const wasm = typeof WebAssembly !== 'undefined';
  const indexedDB = hasWindow && typeof window.indexedDB !== 'undefined';
  const online = hasNav ? navigator.onLine : true;

  return {
    webSpeechSTT,
    speechSynthesis,
    camera,
    microphone,
    webGPU,
    wasm,
    indexedDB,
    online
  };
}
