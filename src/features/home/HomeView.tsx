import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Video,
  MessagesSquare,
  ArrowRight,
  ShieldAlert,
  HeartHandshake
} from 'lucide-react';

export const HomeView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
          <HeartHandshake className="w-4 h-4 text-brand-400" />
          <span>Local-First Accessibility for Indian Sign Language</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Bridging ISL, Speech & Text
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Open-source, mobile-first communication tool for Deaf, hard-of-hearing, and non-speaking individuals.
          All audio and video stay 100% on your device.
        </p>
      </div>

      {/* Three Primary Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Speech to Sign */}
        <Link
          to="/speech-to-sign"
          className="group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-slate-800 hover:border-brand-500 transition-all shadow-xl hover:shadow-brand-950/40 min-h-[220px]"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
              Speech to Sign
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Speak or type in English/Hindi. Inspect non-generative, exact-match ISL signs rendered on an articulated avatar.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-2 text-xs font-bold text-brand-400 group-hover:translate-x-1 transition-transform">
            <span>Open Player</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Card 2: Sign to Speech */}
        <Link
          to="/sign-to-speech"
          className="group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-slate-800 hover:border-amber-500 transition-all shadow-xl hover:shadow-amber-950/40 min-h-[220px]"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Sign to Speech
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black rounded bg-amber-500/30 text-amber-300 border border-amber-500/50">
                DEMO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              On-device camera landmark recognition for a curated set of gesture templates. Always confirms before speaking aloud.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Start Camera Demo</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Card 3: Conversation Mode */}
        <Link
          to="/conversation"
          className="group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-slate-800 hover:border-cyan-500 transition-all shadow-xl hover:shadow-cyan-950/40 min-h-[220px]"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessagesSquare className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
              Conversation Mode
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Accessible chat timeline with source tags, text-to-speech, quick phrases, and large-text "show to partner" mode.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-2 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Enter Conversation</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Research & Honest Transparency Note */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Honest Trust Ratings on Every Sign</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Every sign carries an explicit badge: VERIFIED (reviewed by Deaf ISL signers), COMMUNITY, DEMO, or UNVERIFIED.
            Missing vocabulary is never faked.
          </p>
        </div>
        <Link
          to="/learn"
          className="shrink-0 px-4 py-2 min-h-touch rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
        >
          Explore ISL Lexicon
        </Link>
      </div>
    </div>
  );
};
