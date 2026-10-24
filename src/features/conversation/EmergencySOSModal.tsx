import React, { useEffect } from 'react';
import { AlertOctagon, X, Volume2, ShieldAlert } from 'lucide-react';
import { browserSpeechSynthesis } from '../../adapters/tts/browserSpeechSynthesis';
import { AvatarStage } from '../../components/AvatarStage';
import { lexiconManager } from '../../data/lexicon';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
  const emergencyClip = lexiconManager.findClipByGloss('EMERGENCY') || lexiconManager.findClipByGloss('HELP');

  useEffect(() => {
    if (!isOpen) return;

    // Trigger urgent mobile haptic distress pattern (SOS: ... --- ...)
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 100, 150, 100, 150, 300, 400, 150, 400, 150, 400, 300, 150, 100, 150]);
      } catch {
        // ignore
      }
    }

    // High-priority urgent audio synthesis loop
    const speakDistressMessage = () => {
      browserSpeechSynthesis.speak(
        'Emergency. I am Deaf. Please assist me immediately. I require emergency medical or security help.',
        {
          lang: 'en-IN',
          rate: 0.95,
          pitch: 1.1
        }
      );
    };

    speakDistressMessage();
    const interval = setInterval(speakDistressMessage, 8000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-red-950/95 backdrop-blur-xl animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-title"
    >
      {/* Top Header & Dismiss Button */}
      <div className="w-full max-w-2xl flex items-center justify-between pb-3 border-b-2 border-red-500/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-600 text-white animate-pulse">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h1 id="sos-title" className="text-xl sm:text-2xl font-black text-white tracking-wide">
              EMERGENCY SOS BEACON
            </h1>
            <span className="text-xs font-bold text-red-200">आपातकालीन सुरक्षा अलार्म</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-touch px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-white font-black rounded-xl border-2 border-white/40 flex items-center gap-2 shadow-2xl focus-visible:ring-4 focus-visible:ring-white"
          aria-label="Dismiss Emergency SOS Alert"
        >
          <X className="w-5 h-5 text-red-400" />
          <span>Exit SOS</span>
        </button>
      </div>

      {/* Main Distress Banner with High Contrast */}
      <div className="w-full max-w-2xl my-auto text-center space-y-4">
        <div className="p-6 rounded-3xl bg-black border-4 border-red-500 shadow-2xl shadow-red-900/60 space-y-3">
          <p className="text-2xl sm:text-4xl font-black text-red-400 tracking-tight leading-tight uppercase">
            I AM DEAF / मैं बधिर हूँ
          </p>
          <p className="text-xl sm:text-3xl font-extrabold text-white leading-snug">
            PLEASE ASSIST IMMEDIATELY.
          </p>
          <p className="text-sm sm:text-base text-red-200 font-semibold">
            Audio announcement is currently playing aloud through device speakers.
          </p>
        </div>

        {/* ISL Emergency Sign Clip Loop */}
        {emergencyClip && (
          <div className="rounded-2xl overflow-hidden border-2 border-red-600/70 shadow-2xl max-w-md mx-auto">
            <AvatarStage
              clip={emergencyClip}
              mode="three"
              skinTone="#e0ac69"
              outfitColor="#dc2626"
              backgroundColor="#1a0505"
              showCaption={false}
            />
          </div>
        )}
      </div>

      {/* Bottom Emergency Action Callouts */}
      <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-black/70 border border-red-500/40 text-xs text-red-100">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-red-400 animate-bounce" />
          <span>Repeating Emergency Speech Announcement active</span>
        </div>
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <ShieldAlert className="w-4 h-4" />
          <span>Call 112 for Police / 102 for Ambulance (India)</span>
        </div>
      </div>
    </div>
  );
};
