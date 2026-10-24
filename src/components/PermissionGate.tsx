import React from 'react';
import { Camera, Mic, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { permissionManager } from '../lib/permissions';

interface PermissionGateProps {
  feature: 'camera' | 'microphone';
  title?: string;
  description?: string;
  onConsentGranted: () => void;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  feature,
  title,
  description,
  onConsentGranted
}) => {
  const isCamera = feature === 'camera';
  const Icon = isCamera ? Camera : Mic;

  const defaultTitle = isCamera
    ? 'Camera Permission & On-Device Vision Gate'
    : 'Microphone Permission & On-Device Audio Gate';

  const defaultDesc = isCamera
    ? 'Video frames and hand landmarks are processed 100% on your local device. No video or biometric landmarks are ever uploaded, recorded, or shared.'
    : 'Audio recordings for speech-to-text remain strictly on your device. You can revoke this permission anytime.';

  const handleGrant = () => {
    permissionManager.setConsent(feature, true);
    onConsentGranted();
  };

  return (
    <div
      className="p-6 rounded-2xl bg-slate-900 border-2 border-brand-500/40 text-slate-100 shadow-xl"
      role="region"
      aria-label={`${feature} permission gate`}
    >
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-brand-500/20 text-brand-400">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title || defaultTitle}</h3>
          <span className="inline-flex items-center gap-1 text-xs text-brand-400 font-semibold">
            <Lock className="w-3 h-3" /> Fully Local / Zero Cloud Transmission
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-300 leading-relaxed">
        {description || defaultDesc}
      </p>

      <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2 text-xs text-slate-300">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Real-time processing via WebAssembly / WebGPU</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Explicit consent required per feature; revocable in 1-click</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>No camera frames or audio packets leave your browser sandbox</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleGrant}
          className="flex-1 min-h-touch px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-900/30 transition-all focus-visible:ring-4 focus-visible:ring-brand-400"
        >
          <ShieldCheck className="w-5 h-5" />
          Allow On-Device {isCamera ? 'Camera' : 'Microphone'}
        </button>
      </div>
    </div>
  );
};
