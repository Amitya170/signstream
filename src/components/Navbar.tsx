import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Mic, Wifi, WifiOff, Settings as SettingsIcon } from 'lucide-react';
import { permissionManager } from '../lib/permissions';
import { PrototypeNotice } from './PrototypeNotice';

export const Navbar: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [camActive, setCamActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = permissionManager.subscribe(() => {
      setCamActive(permissionManager.isHardwareActive('video'));
      setMicActive(permissionManager.isHardwareActive('audio'));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <PrototypeNotice />
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Link */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-black text-lg sm:text-xl text-white tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg p-1"
          aria-label="Project SignStream Home"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-900/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M7 11v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6" />
              <path d="M12 4v7" />
              <path d="M9 7l3-3 3 3" />
            </svg>
          </div>
          <span>SignStream</span>
        </Link>

        {/* Live Hardware & Network Status Indicator */}
        <div className="flex items-center gap-2">
          {camActive && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
              role="status"
              aria-label="Camera actively streaming on-device"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cam Active</span>
            </span>
          )}

          {micActive && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
              role="status"
              aria-label="Microphone actively streaming on-device"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mic Active</span>
            </span>
          )}

          {isOnline ? (
            <span className="p-2 text-slate-400 hover:text-slate-200" title="Online Shell Active">
              <Wifi className="w-4 h-4 text-emerald-400" />
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-xs font-semibold text-slate-300"
              title="Offline Local Mode Active"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Offline</span>
            </span>
          )}

          <Link
            to="/settings"
            className="p-2 min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 focus-visible:ring-2 focus-visible:ring-brand-400"
            aria-label="Open Settings and Accessibility preferences"
          >
            <SettingsIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
