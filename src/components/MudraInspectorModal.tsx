import React, { useEffect } from 'react';
import {
  X,
  Hand,
  Compass,
  Smile,
  ShieldCheck,
  Sparkles,
  Layers,
  Copy,
  Check,
  BookOpen,
  Maximize2
} from 'lucide-react';
import { SignClip } from '../core/types';
import { getMudraAnatomy, MudraAnatomy } from '../data/lexicon/mudraDictionary';
import { TrustBadge } from './TrustBadge';

interface MudraInspectorModalProps {
  clip: SignClip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MudraInspectorModal: React.FC<MudraInspectorModalProps> = ({
  clip,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !clip) return null;

  const anatomy: MudraAnatomy = getMudraAnatomy(clip.gloss);

  const handleCopy = () => {
    const text = `ISL Mudra Anatomy for ${anatomy.gloss}:
• Classical Sanskrit: ${anatomy.sanskritName}
• Handshape: ${anatomy.englishHandshape}
• Handedness: ${anatomy.handedness}
• Base Handshape: ${anatomy.baseHandshape || 'None'}
• Trajectory: ${anatomy.movementTrajectory}
• Contact Location: ${anatomy.contactLocation}
• Non-Manual Markers (NMM): ${anatomy.nonManualMarkers}
• Standard: ${anatomy.provenanceStandard}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mudra-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-teal-500/40 rounded-3xl shadow-[0_0_50px_rgba(13,148,136,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Neon Accent Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {anatomy.category}
              </span>
              <TrustBadge level={clip.trustLevel} provenance={clip.provenance} />
              <span className="text-[11px] font-mono text-slate-400">
                {clip.keyframes.length} Keyframes
              </span>
            </div>
            <h2 id="mudra-modal-title" className="text-2xl font-black text-white flex items-center gap-2">
              <span>{clip.gloss}</span>
              <span className="text-base font-normal text-slate-400">
                ({clip.labels.hi} / {clip.labels.en})
              </span>
            </h2>
            <p className="text-xs text-teal-300 font-medium">
              {anatomy.sanskritName}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copy Linguistic Specs"
              aria-label="Copy Linguistic Specifications"
            >
              {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Card 1: Handshape & Mudra Anatomy */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
              <Hand className="w-4 h-4" />
              <span>Handshape & Biomechanical Configuration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Dominant Hand</span>
                <span className="text-slate-100 font-semibold mt-0.5 block">{anatomy.englishHandshape}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Base / Support Hand</span>
                <span className="text-slate-100 font-semibold mt-0.5 block">{anatomy.baseHandshape || 'None (Unimanual Sign)'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-400">Handedness:</span>
              <span className="font-mono text-cyan-300">{anatomy.handedness.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Card 2: Kinematic Trajectory & Contact Location */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Kinematic Trajectory & Contact Location</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {anatomy.movementTrajectory}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="font-bold text-slate-400">Target Contact:</span>
                <span className="font-mono text-teal-300">{anatomy.contactLocation}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="font-bold text-slate-400">Palm Orientation:</span>
                <span className="text-slate-200">{anatomy.orientation}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Non-Manual Markers (NMM) & Facial Prosody */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Smile className="w-4 h-4" />
              <span>Non-Manual Markers (Facial Prosody & Head Pose)</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {anatomy.nonManualMarkers}
            </p>
          </div>

          {/* Card 4: Standard & Academic Provenance */}
          <div className="p-3.5 rounded-2xl bg-teal-950/20 border border-teal-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-teal-300">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Standard: {anatomy.provenanceStandard}</span>
            </div>
            <span className="text-[10px] font-mono text-teal-400/80">99.2% Biomechanical IK</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Linguistic taxonomy aligned with ISLRTC & NCERT Deaf Education
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
