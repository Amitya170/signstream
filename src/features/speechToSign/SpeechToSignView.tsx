import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  AlertCircle,
  CheckCircle2,
  Info,
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Landmark,
  Train,
  AlertOctagon,
  Activity,
  Users,
  BookOpen,
  Laptop
} from 'lucide-react';
import { SignClip, TranslationCoverage } from '../../core/types';
import { lexiconTranslator } from '../../adapters/translation/lexiconLookup';
import {
  liveSentenceSigner,
  LiveSentencePackage,
  SentenceSignWord
} from '../../adapters/translation/liveSentenceSigner';
import { getSttAdapter } from '../../adapters/stt/sttFactory';
import { AvatarStage } from '../../components/AvatarStage';
import { TrustBadge } from '../../components/TrustBadge';
import { AudioWaveformVisualizer } from '../../components/AudioWaveformVisualizer';
import { permissionManager } from '../../lib/permissions';
import { incrementPhraseFrequency, db, applyUserCorrections } from '../../lib/storage';
import { DOMAIN_PACKS } from '../../data/lexicon/domainPacks';
import { neuralSemanticMatcher } from '../../adapters/nlp/neuralSemanticMatcher';

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

  // Live Continuous Sentence Stream & Word Teleprompter
  const [sentencePackage, setSentencePackage] = useState<LiveSentencePackage | null>(null);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const activeWordIdRef = useRef<string | null>(null);
  activeWordIdRef.current = activeWordId;
  const [seekTargetTimeMs, setSeekTargetTimeMs] = useState<number | null>(null);

  // Active Microphone Audio Stream for Visualizer
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  micStreamRef.current = micStream;

  // Domain Scenario Filter Tab
  const [activeCategory, setActiveCategory] = useState<string>('essential');

  // Load initial translation & STT preferences
  useEffect(() => {
    handleTranslate('Namaste');
    loadSttInfo();
    // Warm up pre-trained neural semantic matcher in background
    neuralSemanticMatcher.loadModel().catch(() => {});

    return () => {
      // Clean up mic stream if active
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
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
      // 1. Compute Linguistic Coverage for Honesty Report
      const result = await lexiconTranslator.translate(correctedQuery);
      setCoverage(result);

      // 2. Compile Live Continuous ISL Sentence Stream with Co-articulation
      const pkg = liveSentenceSigner.compileSentence(correctedQuery);
      setSentencePackage(pkg);

      if (pkg.compositeClip && pkg.words.length > 0) {
        if (result.matchedSignClips.length === 1 && pkg.words.length === 1) {
          setActiveClip(result.matchedSignClips[0]);
        } else {
          setActiveClip(pkg.compositeClip);
        }
        setActiveWordId(pkg.words[0].id);
        incrementPhraseFrequency(correctedQuery);
      } else if (result.matchedSignClips.length > 0) {
        setActiveClip(result.matchedSignClips[0]);
      } else {
        setActiveClip(null);
        setActiveWordId(null);
      }
    } finally {
      setTranslating(false);
    }
  };

  const handleTimeUpdate = useCallback(
    (currentTimeMs: number) => {
      if (!sentencePackage || !sentencePackage.words.length) return;
      const currentWord = liveSentenceSigner.getActiveWordAtTime(sentencePackage, currentTimeMs);
      if (currentWord && currentWord.id !== activeWordIdRef.current) {
        activeWordIdRef.current = currentWord.id;
        setActiveWordId(currentWord.id);
      }
    },
    [sentencePackage]
  );

  const handleWordChipClick = (word: SentenceSignWord) => {
    setActiveWordId(word.id);
    setSeekTargetTimeMs(word.startTimeMs);
    // Reset seekTarget so subsequent clicks work
    setTimeout(() => setSeekTargetTimeMs(null), 80);
  };

  const handleToggleMic = async () => {
    const row = await db.settings.get('app_settings');
    const preferred = (row?.value?.sttEngine as 'whisper' | 'webSpeech' | 'mock') || 'webSpeech';
    const adapter = getSttAdapter(preferred);

    if (isListening) {
      await adapter.stop();
      setIsListening(false);
      setSttStatus('idle');
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        setMicStream(null);
      }
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

    // Try acquiring audio stream for the visualizer
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream);
      }
    } catch {
      // Continue even if visualizer stream fails
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
          if (micStream) {
            micStream.getTracks().forEach((t) => t.stop());
            setMicStream(null);
          }
        },
        onStateChange: (state) => {
          setSttStatus(state);
        }
      });
      setIsListening(true);
    } catch (e: any) {
      setSttError(e.message || 'Microphone error.');
      setIsListening(false);
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        setMicStream(null);
      }
    }
  };

  const essentialPhrases = [
    { en: 'Namaste', hi: 'नमस्ते' },
    { en: 'Thank you', hi: 'धन्यवाद' },
    { en: 'Please', hi: 'कृपया' },
    { en: 'Yes', hi: 'हाँ' },
    { en: 'No', hi: 'नहीं' },
    { en: 'Help', hi: 'मदद' },
    { en: 'Water', hi: 'पानी' },
    { en: 'Doctor', hi: 'डॉक्टर' },
    { en: 'How are you', hi: 'आप कैसे हैं' },
    { en: 'Good morning', hi: 'शुभ प्रभात' },
    { en: 'I am Deaf', hi: 'मैं बधिर हूँ' }
  ];

  const getDomainIcon = (id: string) => {
    switch (id) {
      case 'healthcare':
        return <Stethoscope className="w-3.5 h-3.5" />;
      case 'banking':
        return <Landmark className="w-3.5 h-3.5" />;
      case 'transit':
        return <Train className="w-3.5 h-3.5" />;
      case 'family':
        return <Users className="w-3.5 h-3.5" />;
      case 'education':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'technology':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'emergency':
        return <AlertOctagon className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Executive Studio Header & Language Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-500/20">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-teal-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
              Speech to Sign Studio
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-[0_0_10px_rgba(20,184,166,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              Live 60 FPS
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
              <ShieldCheck className="w-3 h-3 text-brand-400" />
              100% On-Device
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ISL sentence compilation with natural co-articulation, analytical 2-bone IK, and synchronized teleprompter.
          </p>
        </div>

        {/* English / Hindi Selector */}
        <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-xl p-1 rounded-2xl border border-slate-800 shadow-xl self-start sm:self-auto">
          <Globe className="w-4 h-4 text-slate-400 ml-2 mr-1" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`min-h-touch px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40 ring-1 ring-brand-400/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English (en-IN)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`min-h-touch px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              language === 'hi'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40 ring-1 ring-brand-400/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            हिंदी (hi-IN)
          </button>
        </div>
      </div>

      {/* Responsive Studio 3.0 Dual-Pane Layout: Left 3D Viewport & Prompter, Right Command Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: 3D Sign Avatar Stage & Live Teleprompter (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Avatar Stage with Real-Time Time Tracking & Preset Controls */}
          <AvatarStage
            clip={activeClip}
            showCaption={true}
            onTimeUpdate={handleTimeUpdate}
            seekTimeMs={seekTargetTimeMs}
            className="w-full"
          />

          {/* Synchronized Live Word Teleprompter Strip */}
          {sentencePackage && sentencePackage.words.length > 0 && (
            <div className="p-4 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-teal-500/20 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                    Live Sentence Teleprompter
                  </span>
                </div>
                <span className="text-[10px] text-teal-400 font-mono font-bold">
                  {sentencePackage.words.length} signs · {(sentencePackage.totalDurationMs / 1000).toFixed(1)}s continuous
                </span>
              </div>

              {/* Interactive Word Chips Bar */}
              <div className="flex flex-wrap gap-2 items-center">
                {sentencePackage.words.map((word) => {
                  const isActive = activeWordId === word.id;
                  return (
                    <button
                      key={word.id}
                      type="button"
                      onClick={() => handleWordChipClick(word)}
                      aria-label={`Jump avatar to sign: ${word.originalWord}`}
                      className={`group px-3.5 py-2 rounded-2xl text-left transition-all border ${
                        isActive
                          ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg shadow-teal-950/60 scale-105 ring-1 ring-teal-400'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold capitalize">{word.originalWord}</span>
                        {word.isFingerspelled ? (
                          <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            A-Z
                          </span>
                        ) : word.clip.provenance.source?.includes('Web') || word.clip.provenance.source?.includes('Improviser') ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/25 text-indigo-300 border border-indigo-500/40" title="Auto-Learned via Web / Semantic Improviser">
                            ✨ Web Learned
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] font-mono text-teal-400/90 truncate max-w-[130px]">
                        {word.islGloss}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ISL Grammar Sequence Formula */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Grammar Flow:</span>
                  <code className="text-teal-300 font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    {sentencePackage.islGrammarSyntax}
                  </code>
                </div>
                {sentencePackage.grammarAnalysis.explanation && (
                  <span className="text-amber-400/90 text-[10px] font-medium">
                    NMM: {sentencePackage.grammarAnalysis.explanation}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Command Console & Linguistic Coverage (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Input Control Box */}
          <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-3.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTranslate(inputText);
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'कोई शब्द या वाक्य लिखें या बोलें...'
                      : 'Type or speak any sentence...'
                  }
                  className="w-full min-h-touch px-4 py-3 bg-slate-950/90 border-2 border-slate-800 focus:border-teal-500 rounded-2xl text-white placeholder-slate-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 transition-all shadow-inner"
                />
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`min-h-touch px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-900/50 animate-pulse'
                      : 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 shadow-md'
                  }`}
                  aria-label={isListening ? 'Stop microphone' : 'Start speaking'}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4 text-brand-400" />
                  )}
                  <span>{isListening ? (sttStatus === 'downloading' ? 'Loading...' : 'Listening...') : 'Speak'}</span>
                </button>

                {/* Translate Button */}
                <button
                  type="submit"
                  disabled={translating || !inputText.trim()}
                  className="min-h-touch px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-brand-600 hover:from-teal-400 hover:to-brand-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 focus-visible:ring-2 transition-all active:scale-95"
                >
                  {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Translate</span>
                </button>
              </div>
            </form>

            {/* Real-time Audio Spectrum & Deaf Voice Alert Indicator */}
            {isListening && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-teal-400">
                    <Activity className="w-4 h-4 animate-pulse" />
                    Live Acoustic Monitor
                  </span>
                  <span>Visualizing voice</span>
                </div>
                <AudioWaveformVisualizer stream={micStream} isActive={isListening} />
              </div>
            )}

            {/* STT Privacy & Active Engine Bar */}
            {sttPrivacyNotice && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">
                  <strong>Active Engine:</strong> {sttEngineName}
                </span>
              </div>
            )}

            {/* Neural Pre-trained Semantic Model Indicator */}
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">
                  <strong>Neural NLP:</strong> Hugging Face Xenova/all-MiniLM-L6-v2
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 shrink-0">
                76 ISL Concepts
              </span>
            </div>
          </div>

          {/* STT Error Notification */}
          {sttError && (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{sttError}</span>
            </div>
          )}

          {/* Commercial Domain Scenarios & Quick Phrases */}
          <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Quick Scenarios & Vocabulary
              </span>
              <span className="text-[10px] text-slate-400 font-medium">1-Tap Translate</span>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory('essential')}
                className={`min-h-[34px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                  activeCategory === 'essential'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-md shadow-teal-950/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Everyday</span>
              </button>

              {DOMAIN_PACKS.map((dp) => (
                <button
                  key={dp.id}
                  type="button"
                  onClick={() => setActiveCategory(dp.id)}
                  className={`min-h-[34px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                    activeCategory === dp.id
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-md shadow-teal-950/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {getDomainIcon(dp.id)}
                  <span>{language === 'hi' ? dp.nameHi : dp.name}</span>
                </button>
              ))}
            </div>

            {/* Quick Phrase Chips Grid */}
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
              {activeCategory === 'essential' &&
                essentialPhrases.map((item) => {
                  const label = language === 'hi' ? item.hi : item.en;
                  return (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => {
                        setInputText(label);
                        handleTranslate(label);
                      }}
                      className="px-3 py-1.5 min-h-[32px] rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-teal-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
                    >
                      {label}
                    </button>
                  );
                })}

              {activeCategory !== 'essential' &&
                DOMAIN_PACKS.find((dp) => dp.id === activeCategory)?.phrases.map((phrase) => {
                  const label = language === 'hi' ? phrase.textHi : phrase.text;
                  return (
                    <button
                      key={phrase.text}
                      type="button"
                      onClick={() => {
                        setInputText(label);
                        handleTranslate(label);
                      }}
                      className="px-3 py-1.5 min-h-[32px] rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-teal-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
                    >
                      {label}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Translation Coverage Analysis & Honesty Breakdown */}
          {coverage && (
            <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                  Linguistic Coverage
                </span>
                {coverage.fullMatch ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Full ISL Lexicon Match
                  </span>
                ) : coverage.matchedSignClips.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                    <AlertCircle className="w-3.5 h-3.5" /> Partial Lexicon Match
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
                    <AlertCircle className="w-3.5 h-3.5" /> No Direct Lexicon Match
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {coverage.explanation}
              </p>

              {/* Matched Signs Selector if multiple tokens */}
              {coverage.matchedSignClips.length > 1 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Individual signs:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
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
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Two-handed fingerspelling fallback: [{coverage.unsupportedTokens.join(', ')}]</span>
                  </div>
                  <p className="text-amber-200/80 text-[11px]">
                    Unmatched proper nouns or unseen words are signed using authentic ISL two-handed manual fingerspelling (A-Z).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};