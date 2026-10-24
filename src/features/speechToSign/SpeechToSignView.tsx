import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  AlertCircle,
  CheckCircle2,
  Info,
  Globe,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { SignClip, TranslationCoverage } from '../../core/types';
import { lexiconTranslator } from '../../adapters/translation/lexiconLookup';
import { getSttAdapter } from '../../adapters/stt/sttFactory';
import { AvatarStage } from '../../components/AvatarStage';
import { TrustBadge } from '../../components/TrustBadge';
import { permissionManager } from '../../lib/permissions';
import { incrementPhraseFrequency, db, applyUserCorrections } from '../../lib/storage';

export const SpeechToSignView: React.FC = () => {
  const [inputText, setInputText] = useState<string>('Namaste');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttStatus, setSttStatus] = useState<string>('idle');
  const [sttError, setSttError] = useState<string | null>(null);
  const [sttEngineName, setSttEngineName] = useState<string>('Web Speech');
  const [sttPrivacyNotice, setSttPrivacyNotice] = useState<string>('');

  const [activeClip, setActiveClip] = useState<SignClip | null>(null);
  const [coverage, setCoverage] = useState<TranslationCoverage | null>(null);
  const [translating, setTranslating] = useState<boolean>(false);

  // Load initial translation & STT preferences
  useEffect(() => {
    handleTranslate('Namaste');
    loadSttInfo();
  }, []);

  const loadSttInfo = async () => {
    const row = await db.settings.get('app_settings');
    const preferred = (row?.value?.sttEngine as 'whisper' | 'webSpeech' | 'mock') || 'webSpeech';
    const adapter = getSttAdapter(preferred);
    setSttEngineName(adapter.name);
    setSttPrivacyNotice(adapter.getPrivacyNotice());
  };

  const handleTranslate = async (phraseToTranslate: string) => {
    const query = phraseToTranslate.trim();
    if (!query) return;

    // Apply safe local user corrections if any exist
    const correctedQuery = await applyUserCorrections(query);

    setTranslating(true);
    try {
      const result = await lexiconTranslator.translate(correctedQuery);
      setCoverage(result);
      if (result.matchedSignClips.length > 0) {
        setActiveClip(result.matchedSignClips[0]);
        // Update user frequency memory safe on-device
        incrementPhraseFrequency(correctedQuery);
      } else {
        setActiveClip(null);
      }
    } finally {
      setTranslating(false);
    }
  };

  const handleToggleMic = async () => {
    const row = await db.settings.get('app_settings');
    const preferred = (row?.value?.sttEngine as 'whisper' | 'webSpeech' | 'mock') || 'webSpeech';
    const adapter = getSttAdapter(preferred);

    if (isListening) {
      await adapter.stop();
      setIsListening(false);
      setSttStatus('idle');
      return;
    }

    setSttError(null);
    permissionManager.setConsent('microphone', true);

    if (!adapter.isSupported()) {
      setSttError(
        'Speech recognition is not supported in this browser. You can type freely in the box below.'
      );
      return;
    }

    try {
      await adapter.start(language, {
        onResult: async (text, isFinal) => {
          const corrected = await applyUserCorrections(text);
          setInputText(corrected);
          if (isFinal) {
            handleTranslate(corrected);
          }
        },
        onError: (errMsg) => {
          setSttError(errMsg);
          setIsListening(false);
          setSttStatus('idle');
        },
        onStateChange: (state) => {
          setSttStatus(state);
        }
      });
      setIsListening(true);
    } catch (e: any) {
      setSttError(e.message || 'Microphone error.');
      setIsListening(false);
    }
  };

  const sampleQuickGlosses = [
    { en: 'Namaste', hi: 'नमस्ते' },
    { en: 'Thank you', hi: 'धन्यवाद' },
    { en: 'Please', hi: 'कृपया' },
    { en: 'Yes', hi: 'हाँ' },
    { en: 'No', hi: 'नहीं' },
    { en: 'Help', hi: 'मदद' },
    { en: 'Water', hi: 'पानी' },
    { en: 'Doctor', hi: 'डॉक्टर' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Title & Language Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Speech to Sign
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Translates input strictly against authentic ISL lexicon packs. No faked grammar.
          </p>
        </div>

        {/* English / Hindi Selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Globe className="w-4 h-4 text-slate-400 ml-2 mr-1" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`min-h-touch px-3 rounded-lg text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English (en-IN)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`min-h-touch px-3 rounded-lg text-xs font-bold transition-all ${
              language === 'hi'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            हिंदी (hi-IN)
          </button>
        </div>
      </div>

      {/* Avatar Stage */}
      <AvatarStage
        clip={activeClip}
        showCaption={true}
        className="w-full"
      />

      {/* Input Control Box */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTranslate(inputText);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'कोई शब्द या वाक्य लिखें या बोलें...'
                  : 'Type or speak a word or phrase (e.g., Namaste, Thank you)...'
              }
              className="w-full min-h-touch px-4 py-3 bg-slate-900 border-2 border-slate-700 focus:border-brand-500 rounded-xl text-white placeholder-slate-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 transition-colors"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mic Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              className={`min-h-touch min-w-touch px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              aria-label={isListening ? 'Stop microphone' : 'Start speaking'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5 text-brand-400" />
              )}
              <span>{isListening ? (sttStatus === 'downloading' ? 'Loading model...' : 'Listening...') : 'Speak'}</span>
            </button>

            {/* Translate Button */}
            <button
              type="submit"
              disabled={translating || !inputText.trim()}
              className="min-h-touch px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-900/30 focus-visible:ring-2"
            >
              {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Translate</span>
            </button>
          </div>
        </form>

        {/* STT Engine Privacy / Status Note */}
        {sttPrivacyNotice && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>
              <strong>Active STT:</strong> {sttEngineName} — {sttPrivacyNotice}
            </span>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-500 mr-1">Quick vocabulary:</span>
          {sampleQuickGlosses.map((item) => {
            const label = language === 'hi' ? item.hi : item.en;
            return (
              <button
                key={item.en}
                type="button"
                onClick={() => {
                  setInputText(label);
                  handleTranslate(label);
                }}
                className="px-2.5 py-1 min-h-[32px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* STT Error Notification */}
      {sttError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{sttError}</span>
        </div>
      )}

      {/* Translation Coverage Analysis & Honesty Breakdown */}
      {coverage && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Linguistic Coverage Report
            </span>
            {coverage.fullMatch ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Full ISL Lexicon Match
              </span>
            ) : coverage.matchedSignClips.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                <AlertCircle className="w-4 h-4" /> Partial Lexicon Match
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                <AlertCircle className="w-4 h-4" /> No ISL Match Available
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {coverage.explanation}
          </p>

          {/* Matched Signs Selector if multiple tokens */}
          {coverage.matchedSignClips.length > 1 && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-xs font-semibold text-slate-400">
                Play individual matched signs:
              </span>
              <div className="flex flex-wrap gap-2">
                {coverage.matchedSignClips.map((clip) => (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => setActiveClip(clip)}
                    className={`min-h-touch px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      activeClip?.id === clip.id
                        ? 'bg-brand-600 text-white border-brand-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <span>{clip.gloss}</span>
                    <TrustBadge level={clip.trustLevel} showDetailsButton={false} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unsupported Token Warning */}
          {coverage.unsupportedTokens.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Unsupported words: [{coverage.unsupportedTokens.join(', ')}]</span>
              </div>
              <p className="text-amber-200/80">
                Indian Sign Language does not translate words one-to-one from spoken grammar. Unmatched words are never faked.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
