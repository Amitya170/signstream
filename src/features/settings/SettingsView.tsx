import React, { useState, useEffect } from 'react';
import {
  Type,
  Eye,
  Volume2,
  Cpu,
  Shield,
  FileText,
  Palette,
  Check,
  Play
} from 'lucide-react';
import { AppSettings, AppTheme } from '../../core/types';
import { db, DEFAULT_SETTINGS } from '../../lib/storage';
import { browserSpeechSynthesis } from '../../adapters/tts/browserSpeechSynthesis';
import { VoiceInfo } from '../../adapters/tts/TextToSpeechAdapter';
import { whisperLocalAdapter } from '../../adapters/stt/whisperAdapter';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [testAudioPlaying, setTestAudioPlaying] = useState<boolean>(false);
  const [whisperStatus, setWhisperStatus] = useState(whisperLocalAdapter.getModelStatus());
  const [whisperDownloading, setWhisperDownloading] = useState<boolean>(false);
  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
    browserSpeechSynthesis.getVoices().then(setVoices);
  }, []);

  const loadSettings = async () => {
    const row = await db.settings.get('app_settings');
    if (row && row.value) {
      setSettings(row.value);
      applyDOMStyles(row.value);
    }
  };

  const applyDOMStyles = (cfg: AppSettings) => {
    // 1. Text scaling
    document.documentElement.style.setProperty('--app-font-scale', String(cfg.textSize));

    // 2. Theming
    document.documentElement.classList.remove(
      'theme-light',
      'theme-dark',
      'theme-high-contrast-bw',
      'theme-high-contrast-yellow'
    );
    document.documentElement.classList.add(`theme-${cfg.theme}`);

    // 3. Reduced motion
    if (cfg.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    applyDOMStyles(updated);
    await db.settings.put({ id: 'app_settings', value: updated });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleTestVoice = async () => {
    setTestAudioPlaying(true);
    await browserSpeechSynthesis.speak('Namaste. Project SignStream audio output test.', {
      voiceURI: settings.ttsVoiceURI,
      rate: settings.ttsRate,
      pitch: settings.ttsPitch
    });
    setTestAudioPlaying(false);
  };

  const handleDownloadWhisper = async () => {
    setWhisperDownloading(true);
    await whisperLocalAdapter.downloadModel(() => {
      setWhisperStatus(whisperLocalAdapter.getModelStatus());
    });
    setWhisperStatus(whisperLocalAdapter.getModelStatus());
    setWhisperDownloading(false);
  };

  const skinPresets = [
    { label: 'Warm Bronze', color: '#e0ac69' },
    { label: 'Rich Sand', color: '#c68642' },
    { label: 'Deep Amber', color: '#8d5524' },
    { label: 'Golden Fair', color: '#f1c27d' },
    { label: 'Ivory', color: '#ffdbac' }
  ];

  const outfitPresets = [
    { label: 'Teal (Brand)', color: '#0d9488' },
    { label: 'Ocean Blue', color: '#2563eb' },
    { label: 'Royal Violet', color: '#7c3aed' },
    { label: 'Crimson', color: '#dc2626' },
    { label: 'Slate Charcoal', color: '#334155' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Customize typography, high-contrast themes, speech synthesis, and avatar rig.
          </p>
        </div>
        {savedBanner && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>

      {/* 1. Typography & Text Scaling */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-brand-400" />
          <h2 className="text-base font-bold text-white">Text Size Scaling</h2>
        </div>
        <p className="text-xs text-slate-400">
          Scales all UI text smoothly up to 200% for readability without clipping content.
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>100% (Default)</span>
            <span>125%</span>
            <span>150%</span>
            <span>175%</span>
            <span>200% (Maximum)</span>
          </div>
          <input
            type="range"
            aria-label="Text size scaling slider"
            min="1.0"
            max="2.0"
            step="0.25"
            value={settings.textSize}
            onChange={(e) => updateSetting('textSize', parseFloat(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
          <div className="text-center font-bold text-sm text-brand-400">
            Current: {(settings.textSize * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* 2. Visual Themes */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Visual Contrast & Themes</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'dark', label: 'Dark Mode (Default)', desc: 'Slate-900 background, balanced teal accents' },
            { id: 'light', label: 'Light Mode', desc: 'Clean white background, slate-900 text' },
            { id: 'high-contrast-bw', label: 'High Contrast (B&W)', desc: 'Pure black (#000) & pure white (#fff)' },
            { id: 'high-contrast-yellow', label: 'High Contrast (Yellow)', desc: 'Pure black background with vivid yellow (#ffff00)' },
          ].map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => updateSetting('theme', th.id as AppTheme)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                settings.theme === th.id
                  ? 'border-brand-500 bg-brand-950/40 shadow-lg'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{th.label}</span>
                {settings.theme === th.id && <Check className="w-4 h-4 text-brand-400" />}
              </div>
              <p className="text-xs text-slate-400 mt-1">{th.desc}</p>
            </button>
          ))}
        </div>

        {/* Reduced Motion Toggle */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Reduced Motion</h3>
            <p className="text-xs text-slate-400">Disables non-essential decorative animations and transitions</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.reducedMotion}
            aria-label="Toggle reduced motion and animations"
            onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              settings.reducedMotion ? 'bg-brand-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                settings.reducedMotion ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Avatar Appearance Rig */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Avatar Rig Appearance</h2>
        </div>

        {/* Skin Tone Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Avatar Skin Tone</label>
          <div className="flex flex-wrap gap-2.5">
            {skinPresets.map((sp) => (
              <button
                key={sp.color}
                type="button"
                onClick={() => updateSetting('avatarSkinTone', sp.color)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  settings.avatarSkinTone === sp.color
                    ? 'border-brand-500 bg-slate-800 text-white'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: sp.color }} />
                <span>{sp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Outfit Color Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Avatar Outfit Color</label>
          <div className="flex flex-wrap gap-2.5">
            {outfitPresets.map((op) => (
              <button
                key={op.color}
                type="button"
                onClick={() => updateSetting('avatarOutfitColor', op.color)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  settings.avatarOutfitColor === op.color
                    ? 'border-brand-500 bg-slate-800 text-white'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: op.color }} />
                <span>{op.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Text-to-Speech Output Voice */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Voice & Speech Output (TTS)</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="tts-voice-select" className="block text-xs font-semibold text-slate-300 mb-1">
              Select Synthesizer Voice ({voices.length} detected)
            </label>
            <select
              id="tts-voice-select"
              aria-label="Select Synthesizer Voice"
              value={settings.ttsVoiceURI}
              onChange={(e) => updateSetting('ttsVoiceURI', e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            >
              <option value="">Default System Voice</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.isIndianVariant ? '⭐ [Indian Voice]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Speech Rate: {settings.ttsRate}x</span>
              </div>
              <input
                type="range"
                aria-label="Speech rate slider"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.ttsRate}
                onChange={(e) => updateSetting('ttsRate', parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Speech Pitch: {settings.ttsPitch}</span>
              </div>
              <input
                type="range"
                aria-label="Speech pitch slider"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.ttsPitch}
                onChange={(e) => updateSetting('ttsPitch', parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestVoice}
            disabled={testAudioPlaying}
            className="min-h-touch px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700"
          >
            <Play className="w-4 h-4 text-amber-400" />
            <span>{testAudioPlaying ? 'Playing Audio...' : 'Test Voice Synthesis'}</span>
          </button>
        </div>
      </div>

      {/* 5. Offline Model Downloads */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Offline Whisper STT Model</h2>
        </div>
        <p className="text-xs text-slate-400">
          Quantized local speech recognition via Transformers.js (WebGPU/WASM).
          Zero audio packets leave your device.
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Whisper-Tiny (Quantized)</span>
              <span className="text-xs font-mono text-emerald-400">{whisperStatus.sizeLabel}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Status: {whisperStatus.downloaded ? 'Downloaded on device' : 'Not yet downloaded'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadWhisper}
            disabled={whisperDownloading || whisperStatus.downloaded}
            className="min-h-touch px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
          >
            {whisperDownloading ? (
              <span>Downloading ({whisperStatus.progress}%)...</span>
            ) : whisperStatus.downloaded ? (
              <span>Ready on Device</span>
            ) : (
              <span>Download Model (~39 MB)</span>
            )}
          </button>
        </div>
      </div>

      {/* 6. Plain-Language Privacy Model */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <h2 className="text-base font-bold text-white">Plain-Language Privacy Model</h2>
        </div>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            • <strong>Zero Data Egress Default:</strong> No camera frames, microphone recordings, or personal sign gestures
            are sent to any remote server. Everything executes within your browser's local sandbox.
          </p>
          <p>
            • <strong>No Trackers or Analytics:</strong> This application has no Google Analytics, telemetry scripts, or cookies.
          </p>
          <p>
            • <strong>Revocable Hardware Access:</strong> You can pause or revoke camera and mic permissions at any time with a single tap.
          </p>
        </div>
      </div>

      {/* 7. About & Prototype Disclaimer */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-bold text-white">About Project SignStream</h2>
        </div>
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            <strong>Version:</strong> 1.0.0-prototype (Milestones 1–4 Complete)
          </p>
          <p>
            <strong>Licence:</strong> Apache-2.0 Open Source. See LICENSES.md for full dependency audits.
          </p>
          <p className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200">
            <strong>Mandatory Prototype Disclaimer:</strong> Project SignStream is an early research prototype
            and <strong>not a certified ISL interpreter</strong>. It must never replace professional interpreters
            for legal, medical, or life-safety situations.
          </p>
        </div>
      </div>
    </div>
  );
};
