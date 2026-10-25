import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Video,
  MessagesSquare,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Zap,
  Lock,
  Globe2,
  BookOpen,
  Activity,
  ChevronRight
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const quickScenarios = [
    { label: 'Namaste', phrase: 'Namaste', category: 'Everyday', gloss: 'NAMASTE' },
    { label: 'Doctor', phrase: 'Where is the doctor?', category: 'Hospital', gloss: 'DOCTOR' },
    { label: 'Water', phrase: 'I need water please', category: 'Everyday', gloss: 'WATER' },
    { label: 'Help', phrase: 'Please help me', category: 'Emergency', gloss: 'HELP' },
    { label: 'Thank You', phrase: 'Thank you very much', category: 'Everyday', gloss: 'THANK-YOU' },
    { label: 'Station', phrase: 'Where is platform 3?', category: 'Transit', gloss: 'STATION' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Header with Glow Accents */}
      <div className="text-center space-y-4 pt-2 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-teal-500/10 via-cyan-500/15 to-emerald-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold shadow-lg shadow-teal-950/40">
          <HeartHandshake className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>Indian Sign Language (ISLRTC) • Local-First Accessibility</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Communicate in <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Indian Sign Language</span> Anywhere
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Open-source, mobile-first assistive studio for Deaf, hard-of-hearing, and non-speaking individuals.
          Real-time speech-to-sign 3D avatar, continuous sentence co-articulation, and 100% on-device neural NLP.
        </p>

        {/* Live System Capabilities Bar */}
        <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">76+ ISL Concepts</div>
              <div className="text-[10px] text-slate-400">ISLRTC Verified</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Neural NLP</div>
              <div className="text-[10px] text-slate-400">MiniLM-L6-v2</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">100% Private</div>
              <div className="text-[10px] text-slate-400">Zero Cloud Upload</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Globe2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Offline Ready</div>
              <div className="text-[10px] text-slate-400">PWA Local Storage</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Tap Quick Scenario Launchpad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>1-Tap Immediate Translations</span>
          </div>
          <Link to="/speech-to-sign" className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1">
            <span>Open Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {quickScenarios.map((s) => (
            <Link
              key={s.label}
              to={`/speech-to-sign?q=${encodeURIComponent(s.phrase)}`}
              className="p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/50 transition-all text-left group shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-teal-400/80">{s.category}</span>
                <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">{s.label}</div>
              </div>
              <div className="pt-2 text-[10px] text-slate-400 group-hover:text-slate-200 flex items-center justify-between">
                <span>Play 3D</span>
                <ArrowRight className="w-3 h-3 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Three Primary Feature Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Workspace 1: Speech to Sign Studio */}
        <Link
          to="/speech-to-sign"
          className="group relative flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border-2 border-slate-800 hover:border-teal-500/80 transition-all shadow-xl hover:shadow-teal-950/40 min-h-[250px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                STUDIO 3D
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                Speech to Sign
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed pt-1.5">
                Speak or type in English/Hindi. Watch continuous co-articulated 3D ISL avatar signing with multi-phalanx mudras and synchronised teleprompter.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center gap-2 text-xs font-bold text-teal-400 group-hover:translate-x-1 transition-transform">
            <span>Launch Sign Studio</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Workspace 2: Conversation Mode */}
        <Link
          to="/conversation"
          className="group relative flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border-2 border-slate-800 hover:border-cyan-500/80 transition-all shadow-xl hover:shadow-cyan-950/40 min-h-[250px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <MessagesSquare className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                TWO-WAY CHAT
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Conversation Mode
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed pt-1.5">
                Real-time back-and-forth dialogue timeline with high-contrast large-text partner display, SOS emergency strobe, and speech output.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center gap-2 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Enter Conversation</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Workspace 3: Sign to Speech Vision */}
        <Link
          to="/sign-to-speech"
          className="group relative flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border-2 border-slate-800 hover:border-amber-500/80 transition-all shadow-xl hover:shadow-amber-950/40 min-h-[250px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                CAMERA VISION
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Sign to Speech
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed pt-1.5">
                On-device camera landmark tracking recognition for ISL gestures. Confirms landmark confidence before speaking aloud.
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Open Camera Vision</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Honest Transparency & Educational Lexicon Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>Honest ISLRTC Linguistic Transparency</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Every sign carries an explicit audit trust level (VERIFIED by Deaf ISL signers, COMMUNITY, or UNVERIFIED).
            Missing vocabulary is never hallucinated or faked.
          </p>
        </div>
        <Link
          to="/learn"
          className="shrink-0 px-5 py-2.5 min-h-touch rounded-2xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 text-xs font-bold text-teal-300 border border-teal-500/40 flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          <span>Explore ISL Dictionary</span>
        </Link>
      </div>
    </div>
  );
};
