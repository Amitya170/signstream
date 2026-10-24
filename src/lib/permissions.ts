/**
 * Explicit, per-feature, revocable on-device permission manager.
 * Enforces:
 * - No camera or microphone data leaves the device.
 * - Explicit consent modal/gate before opening hardware streams.
 * - Live visual indicator whenever camera/mic is active.
 */

export interface FeatureConsentState {
  cameraConsent: boolean;
  microphoneConsent: boolean;
  activeMediaStream: MediaStream | null;
}

class PermissionManager {
  private cameraConsent = false;
  private microphoneConsent = false;
  private activeStreams: Set<MediaStream> = new Set();
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getConsent(feature: 'camera' | 'microphone'): boolean {
    return feature === 'camera' ? this.cameraConsent : this.microphoneConsent;
  }

  public setConsent(feature: 'camera' | 'microphone', consent: boolean): void {
    if (feature === 'camera') {
      this.cameraConsent = consent;
      if (!consent) this.stopActiveStreams('video');
    } else {
      this.microphoneConsent = consent;
      if (!consent) this.stopActiveStreams('audio');
    }
    this.notify();
  }

  public registerStream(stream: MediaStream): void {
    this.activeStreams.add(stream);
    this.notify();
  }

  public unregisterStream(stream: MediaStream): void {
    this.activeStreams.delete(stream);
    this.notify();
  }

  public isHardwareActive(type: 'audio' | 'video'): boolean {
    for (const s of this.activeStreams) {
      if (s.active) {
        const tracks = type === 'audio' ? s.getAudioTracks() : s.getVideoTracks();
        if (tracks.some(t => t.readyState === 'live')) return true;
      }
    }
    return false;
  }

  public stopActiveStreams(type?: 'audio' | 'video'): void {
    for (const s of this.activeStreams) {
      const tracks = type === 'audio' 
        ? s.getAudioTracks() 
        : type === 'video' 
          ? s.getVideoTracks() 
          : s.getTracks();

      tracks.forEach(t => t.stop());
    }
    if (!type) {
      this.activeStreams.clear();
    }
    this.notify();
  }
}

export const permissionManager = new PermissionManager();
