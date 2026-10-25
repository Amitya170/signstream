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
import { lexiconManager } from '../../data/lexicon';
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

  // Predictive auto-complete suggestions
  const suggestions = React.useMemo(() => {
    const q = inputText.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const all = lexiconManager.getAllClips();
    const matches: { text: string; gloss: string }[] = [];
    const seen = new Set<string>();

    for (const c of all) {
      const en = c.labels.en.toLowerCase();
      const hi = c.labels.hi;
      const gloss = c.gloss.toLowerCase();
      if (en.includes(q) || gloss.includes(q) || hi.includes(q)) {
        const display = language === 'hi' ? c.labels.hi : c.labels.en;
        if (!seen.has(display.toLowerCase())) {
          seen.add(display.toLowerCase());
          matches.push({ text: display, gloss: c.gloss });
          if (matches.length >= 6) break;
        }
      }
    }
    return matches;
  }, [inputText, language]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Speech to Sign Studio
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-teal-50 text-teal-800 border border-teal-300 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
              Live 60 FPS
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              100% On-Device
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Real-time ISL sentence compilation with natural co-articulation, analytical 2-bone IK, and synchronized teleprompter.
          </p>
        </div>

        {/* English / Hindi Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-sm self-start sm:self-auto">
          <Globe className="w-4 h-4 text-slate-500 ml-2 mr-1" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`min-h-touch px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            English (en-IN)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`min-h-touch px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              language === 'hi'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
            <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                    Live Sentence Teleprompter
                  </span>
                </div>
                <span className="text-[10px] text-teal-700 font-mono font-bold">
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
                          ? 'bg-teal-50 border-2 border-teal-500 text-teal-950 shadow-sm scale-105 ring-1 ring-teal-400'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold capitalize">{word.originalWord}</span>
                        {word.isFingerspelled ? (
                          <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                            A-Z
                          </span>
                        ) : word.clip.provenance.source?.includes('Web') || word.clip.provenance.source?.includes('Improviser') ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold" title="Auto-Learned via Web / Semantic Improviser">
                            ✨ Web Learned
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] font-mono text-teal-700 truncate max-w-[130px] font-semibold">
                        {word.islGloss}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ISL Grammar Sequence Formula */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Grammar Flow:</span>
                  <code className="text-teal-800 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 font-bold">
                    {sentencePackage.islGrammarSyntax}
                  </code>
                </div>
                {sentencePackage.grammarAnalysis.explanation && (
                  <span className="text-amber-800 text-[10px] font-semibold">
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
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3.5">
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
                  className="w-full min-h-touch px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-teal-500 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 transition-all shadow-inner"
                />
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300/80 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Predictive Auto-Complete Chips */}
              {suggestions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 animate-in fade-in duration-150">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" /> Suggest:
                  </span>
                  {suggestions.map((s) => (
                    <button
                      key={s.gloss}
                      type="button"
                      onClick={() => {
                        setInputText(s.text);
                        handleTranslate(s.text);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                    >
                      <span>{s.text}</span>
                      <span className="text-[9px] text-teal-700 font-mono">({s.gloss})</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {/* Mic Button with Glowing Pulse Audio Visualizer */}
                <div className="relative">
                  {isListening && (
                    <span className="absolute -inset-1 rounded-2xl bg-rose-500/30 animate-ping pointer-events-none" />
                  )}
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`w-full min-h-touch px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all relative z-10 ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                    }`}
                    aria-label={isListening ? 'Stop microphone' : 'Start speaking'}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4 animate-bounce" />
                    ) : (
                      <Mic className="w-4 h-4 text-teal-600" />
                    )}
                    <span>{isListening ? (sttStatus === 'downloading' ? 'Loading...' : 'Listening...') : 'Speak'}</span>
                  </button>
                </div>

                {/* Translate Button */}
                <button
                  type="submit"
                  disabled={translating || !inputText.trim()}
                  className="min-h-touch px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 focus-visible:ring-2 transition-all active:scale-95"
                >
                  {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Translate</span>
                </button>
              </div>
            </form>

            {/* Real-time Audio Spectrum & Deaf Voice Alert Indicator */}
            {isListening && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-bold text-teal-800">
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
              <div className="flex items-center gap-2 text-[11px] text-slate-600 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">
                  <strong>Active Engine:</strong> {sttEngineName}
                </span>
              </div>
            )}

            {/* Neural Pre-trained Semantic Model Indicator */}
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">
                  <strong>Neural NLP:</strong> Hugging Face Xenova/all-MiniLM-L6-v2
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                76 ISL Concepts
              </span>
            </div>
          </div>

          {/* STT Error Notification */}
          {sttError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{sttError}</span>
            </div>
          )}

          {/* Commercial Domain Scenarios & Quick Phrases */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Quick Scenarios & Vocabulary
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">1-Tap Translate</span>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory('essential')}
                className={`min-h-[34px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                  activeCategory === 'essential'
                    ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Everyday</span>
              </button>

              {DOMAIN_PACKS.map((dp) => (
                <button
                  key={dp.id}
                  type="button"
                  onClick={() => setActiveCategory(dp.id)}
                  className={`min-h-[34px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                    activeCategory === dp.id
                      ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
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
                      className="px-3 py-1.5 min-h-[32px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border border-slate-200 hover:border-teal-400 text-xs font-semibold transition-all shadow-xs active:scale-95"
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
                      className="px-3 py-1.5 min-h-[32px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border border-slate-200 hover:border-teal-400 text-xs font-semibold transition-all shadow-xs active:scale-95"
                    >
                      {label}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Translation Coverage Analysis & Honesty Breakdown */}
          {coverage && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Linguistic Coverage
                </span>
                {coverage.fullMatch ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full ISL Lexicon Match
                  </span>
                ) : coverage.matchedSignClips.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Partial Lexicon Match
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> No Direct Lexicon Match
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {coverage.explanation}
              </p>

              {/* Matched Signs Selector if multiple tokens */}
              {coverage.matchedSignClips.length > 1 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                            ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                            : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
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
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Two-handed fingerspelling fallback: [{coverage.unsupportedTokens.join(', ')}]</span>
                  </div>
                  <p className="text-amber-800/90 text-[11px]">
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