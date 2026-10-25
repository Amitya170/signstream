import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Mic, Wifi, WifiOff, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { permissionManager } from '../lib/permissions';

export const Navbar: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [camActive, setCamActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const location = useLocation();

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
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Link with Studio Badge */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-black text-lg sm:text-xl text-white tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-xl p-1 group"
            aria-label="Project SignStream Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-900/40 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path d="M7 11v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6" />
                <path d="M12 4v7" />
                <path d="M9 7l3-3 3 3" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span>SignStream</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400/90 hidden sm:inline">ISL Studio</span>
            </div>
          </Link>

          {/* Quick Engine Telemetry Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 font-mono shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 font-semibold">60 FPS</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">On-Device Neural NLP</span>
          </div>
        </div>

        {/* Live Hardware & Navigation Shortcuts */}
        <div className="flex items-center gap-2">
          {camActive && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-sm shadow-rose-950/50"
              role="status"
              aria-label="Camera actively streaming on-device"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cam Active</span>
            </span>
          )}

          {micActive && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shadow-sm shadow-amber-950/50"
              role="status"
              aria-label="Microphone actively streaming on-device"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mic Active</span>
            </span>
          )}

          {isOnline ? (
            <span className="p-2 text-slate-400 hover:text-slate-200 transition-colors" title="Local PWA with Online Network Available">
              <Wifi className="w-4 h-4 text-emerald-400" />
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-xs font-semibold text-amber-300 border border-amber-500/30"
              title="100% Offline Local Engine Active"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Offline</span>
            </span>
          )}

          <Link
            to="/speech-to-sign"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              location.pathname === '/speech-to-sign'
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md shadow-teal-950/40'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Studio</span>
          </Link>

          <Link
            to="/settings"
            className="p-2 min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-teal-500/40 transition-all focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label="Open Settings and Accessibility preferences"
          >
            <SettingsIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
