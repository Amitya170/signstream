import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Trash2,
  Edit2,
  Maximize2,
  Eye,
  Check,
  RotateCw,
  Hand,
  AlertOctagon,
  Printer,
  Sparkles
} from 'lucide-react';
import { Message, MessageSource, Phrase, SignClip } from '../../core/types';
import { db, addMessage, applyUserCorrections } from '../../lib/storage';
import { TrustBadge } from '../../components/TrustBadge';
import { browserSpeechSynthesis } from '../../adapters/tts/browserSpeechSynthesis';
import { getSttAdapter } from '../../adapters/stt/sttFactory';
import { lexiconManager } from '../../data/lexicon';
import { liveSentenceSigner, LiveSentencePackage } from '../../adapters/translation/liveSentenceSigner';
import { AvatarStage } from '../../components/AvatarStage';
import { EmergencySOSModal } from './EmergencySOSModal';
import { DOMAIN_PACKS } from '../../data/lexicon/domainPacks';
import { openSessionTranscriptPrintWindow } from '../../lib/sessionExporter';
import { AudioWaveformVisualizer } from '../../components/AudioWaveformVisualizer';

export const ConversationView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickPhrases, setQuickPhrases] = useState<Phrase[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Full-Screen "Show to Other Person" State
  const [fullScreenText, setFullScreenText] = useState<string | null>(null);
  const [isRotated180, setIsRotated180] = useState<boolean>(false);

  // Sign preview modal with Conversational Teleprompter & Extended Pacing
  const [previewClip, setPreviewClip] = useState<SignClip | null>(null);
  const [previewSentencePackage, setPreviewSentencePackage] = useState<LiveSentencePackage | null>(null);
  const [previewActiveWordId, setPreviewActiveWordId] = useState<string | null>(null);
  const [previewMessageText, setPreviewMessageText] = useState<string>('');
  const [previewSeekTimeMs, setPreviewSeekTimeMs] = useState<number | null>(null);

  // Commercial Tools: 1-Tap SOS Beacon & Domain Packs
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    const allMessages = await db.messages.orderBy('timestamp').toArray();
    setMessages(allMessages);

    const phrases = await db.phrases.orderBy('frequency').reverse().limit(8).toArray();
    setQuickPhrases(phrases);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const raw = (textToSend || inputText).trim();
    if (!raw) return;

    const corrected = await applyUserCorrections(raw);

    if (editingMessageId) {
      await db.messages.update(editingMessageId, { text: corrected });
      setEditingMessageId(null);
      setInputText('');
      loadData();
      return;
    }

    // Compile sentence stream to determine trust & gloss match
    const clip = lexiconManager.findClipByGloss(corrected);
    const pkg = liveSentenceSigner.compileSentence(corrected);

    await addMessage({
      text: corrected,
      source: 'TYPED',
      trustLevel: clip ? clip.trustLevel : pkg.words.length > 0 ? 'VERIFIED' : 'UNVERIFIED',
      glossMatch: clip?.gloss || (pkg.words.length > 0 ? pkg.islGrammarSyntax : undefined)
    });

    setInputText('');
    loadData();
  };

  const handleToggleMic = async () => {
    const row = await db.settings.get('app_settings');
    const preferred = (row?.value?.sttEngine as 'whisper' | 'webSpeech' | 'mock') || 'webSpeech';
    const adapter = getSttAdapter(preferred);

    if (isListening) {
      if (audioStream) {
        audioStream.getTracks().forEach((t) => t.stop());
        setAudioStream(null);
      }
      await adapter.stop();
      setIsListening(false);
      return;
    }

    if (!adapter.isSupported()) return;

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((s) => setAudioStream(s))
          .catch(() => {});
      }

      await adapter.start('en', {
        onResult: async (text, isFinal) => {
          if (isFinal && text.trim()) {
            const corrected = await applyUserCorrections(text.trim());
            const clip = lexiconManager.findClipByGloss(corrected);
            const pkg = liveSentenceSigner.compileSentence(corrected);
            await addMessage({
              text: corrected,
              source: 'SPOKEN',
              trustLevel: clip ? clip.trustLevel : pkg.words.length > 0 ? 'VERIFIED' : 'UNVERIFIED',
              glossMatch: clip?.gloss || (pkg.words.length > 0 ? pkg.islGrammarSyntax : undefined)
            });
            loadData();
          }
        },
        onError: () => setIsListening(false),
        onStateChange: (state) => setIsListening(state === 'listening' || state === 'downloading')
      });
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const handleSpeakAloud = async (text: string) => {
    await browserSpeechSynthesis.speak(text);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    await db.messages.delete(id);
    loadData();
  };

  const handleShowSign = (msg: Message) => {
    setPreviewMessageText(msg.text);
    // Always compile complete conversational sentence with extended communicative pacing
    const pkg = liveSentenceSigner.compileSentence(msg.text, { pacing: 'conversational' });
    setPreviewSentencePackage(pkg);
    setPreviewClip(pkg.compositeClip);
    setPreviewActiveWordId(pkg.words[0]?.id || null);
    setPreviewSeekTimeMs(null);
  };

  const handlePreviewTimeUpdate = (timeMs: number) => {
    if (!previewSentencePackage) return;
    const active = liveSentenceSigner.getActiveWordAtTime(previewSentencePackage, timeMs);
    if (active && active.id !== previewActiveWordId) {
      setPreviewActiveWordId(active.id);
    }
  };

  const handleWordChipClick = (word: any) => {
    setPreviewSeekTimeMs(word.startTimeMs);
    setPreviewActiveWordId(word.id);
  };

  const sourceLabels: Record<MessageSource, { label: string; badgeClass: string }> = {
    TYPED: { label: 'TYPED', badgeClass: 'bg-slate-800 text-slate-300' },
    SPOKEN: { label: 'SPOKEN (STT)', badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-500/40' },
    'SIGN-DEMO': { label: 'SIGN-DEMO', badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/40' },
    TRANSLATED: { label: 'TRANSLATED', badgeClass: 'bg-teal-950/70 text-teal-300 border-teal-500/40' },
    UNVERIFIED: { label: 'UNVERIFIED', badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-500/40' }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-140px)]">
      {/* Top Header & Commercial Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Conversation Mode</h1>
          <p className="text-xs text-slate-400">Two-way accessible dialogue with ISL reordering & speech</p>
        </div>

        <div className="flex items-center gap-2">
          {/* 1-Tap Emergency SOS Trigger */}
          <button
            type="button"
            onClick={() => setIsSosOpen(true)}
            className="min-h-touch px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-900/40 focus-visible:ring-2 focus-visible:ring-red-400"
            title="Trigger full-screen emergency distress beacon"
            aria-label="Emergency SOS Beacon"
          >
            <AlertOctagon className="w-4 h-4 animate-pulse" />
            <span>SOS</span>
          </button>

          {/* Official Printable Session Audit Report */}
          <button
            type="button"
            onClick={() => openSessionTranscriptPrintWindow(messages)}
            disabled={messages.length === 0}
            className="min-h-touch px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm focus-visible:ring-2"
            title="Print or export official session record"
            aria-label="Print or export official session record"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Audit Report</span>
          </button>

          {/* Large View for Face-to-Face Partner */}
          <button
            type="button"
            onClick={() => {
              if (messages.length > 0) {
                setFullScreenText(messages[messages.length - 1].text);
              }
            }}
            disabled={messages.length === 0}
            className="min-h-touch px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm focus-visible:ring-2"
            title="Open large high-contrast display for face-to-face partner"
            aria-label="Large View for face-to-face partner"
          >
            <Maximize2 className="w-4 h-4 text-brand-400" />
            <span>Large View</span>
          </button>
        </div>
      </div>

      {/* Domain Packs Category Drawer (Healthcare, Banking, Transit, Emergency) */}
      <div className="py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-400" />
          Packs:
        </span>
        {DOMAIN_PACKS.map((dp) => (
          <button
            key={dp.id}
            type="button"
            onClick={() => setSelectedDomain(selectedDomain === dp.id ? null : dp.id)}
            className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors ${
              selectedDomain === dp.id
                ? 'bg-brand-600 border-brand-500 text-white shadow'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            {dp.name}
          </button>
        ))}
      </div>

      {/* Selected Domain Phrases */}
      {selectedDomain && (
        <div className="py-2.5 px-3 bg-slate-900/90 rounded-2xl border border-brand-500/30 my-2 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-brand-300 font-bold">
            <span>{DOMAIN_PACKS.find((p) => p.id === selectedDomain)?.name} Quick Vocabulary</span>
            <button
              type="button"
              onClick={() => setSelectedDomain(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DOMAIN_PACKS.find((p) => p.id === selectedDomain)?.phrases.map((ph, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(ph.text)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex flex-col text-left transition-colors"
              >
                <span className="font-semibold text-white">{ph.text}</span>
                <span className="text-[10px] text-slate-400">{ph.textHi}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Phrases Bar */}
      {quickPhrases.length > 0 && (
        <div className="py-2.5 overflow-x-auto flex items-center gap-1.5 border-b border-slate-800/80 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Quick:
          </span>
          {quickPhrases.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSendMessage(p.text)}
              className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/60 text-xs text-slate-300 whitespace-nowrap transition-colors"
            >
              {p.text}
            </button>
          ))}
        </div>
      )}

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <Hand className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-slate-400">No messages yet.</p>
            <p className="text-xs max-w-xs">
              Type or speak a message below, or use the sign camera to populate the conversation.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const srcMeta = sourceLabels[m.source] || sourceLabels['UNVERIFIED'];
            const hasClip = Boolean(m.glossMatch || lexiconManager.findClipByGloss(m.text) || m.text.trim());

            return (
              <div
                key={m.id}
                className="group p-4 rounded-2xl bg-slate-900/90 border-2 border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-md"
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${srcMeta.badgeClass}`}
                    >
                      {srcMeta.label}
                    </span>
                    <TrustBadge level={m.trustLevel} showDetailsButton={false} />
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body */}
                <p className="text-white text-base sm:text-lg font-medium leading-relaxed break-words">
                  {m.text}
                </p>

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSpeakAloud(m.text)}
                      className="min-h-touch px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 font-semibold"
                      aria-label="Speak aloud"
                    >
                      <Volume2 className="w-4 h-4 text-brand-400" />
                      <span>Speak</span>
                    </button>

                    {hasClip && (
                      <button
                        type="button"
                        onClick={() => handleShowSign(m)}
                        className="min-h-touch px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 font-semibold"
                        aria-label="Show ISL sign"
                      >
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>Sign</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setFullScreenText(m.text);
                      }}
                      className="min-h-touch px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 font-semibold"
                      aria-label="Present full screen"
                    >
                      <Maximize2 className="w-4 h-4 text-blue-400" />
                      <span>Present</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.text)}
                      className="p-2 min-h-touch rounded-lg hover:text-white hover:bg-slate-800"
                      aria-label="Copy text"
                    >
                      {copiedId === m.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMessageId(m.id);
                        setInputText(m.text);
                      }}
                      className="p-2 min-h-touch rounded-lg hover:text-white hover:bg-slate-800"
                      aria-label="Edit message"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="p-2 min-h-touch rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800"
                      aria-label="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="pt-2">
        {/* Real-time Audio Waveform & Deaf Visual Sound Alert */}
        {isListening && (
          <div className="mb-2 animate-fade-in">
            <AudioWaveformVisualizer stream={audioStream} isActive={isListening} />
          </div>
        )}

        {editingMessageId && (
          <div className="flex items-center justify-between text-xs text-amber-300 pb-1.5 px-1">
            <span>Editing message...</span>
            <button
              type="button"
              onClick={() => {
                setEditingMessageId(null);
                setInputText('');
              }}
              className="text-slate-400 hover:text-white underline"
            >
              Cancel Edit
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message here (or speak)..."
            className="flex-1 min-h-touch px-4 py-3 bg-slate-900 border-2 border-slate-700 focus:border-brand-500 rounded-xl text-white placeholder-slate-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          />

          <button
            type="button"
            onClick={handleToggleMic}
            className={`min-h-touch min-w-touch p-3 rounded-xl border flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            aria-label={isListening ? 'Stop microphone' : 'Speak message'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-brand-400" />}
          </button>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="min-h-touch min-w-touch px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-brand-950/40"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Full-Screen "Show to Other Person" High-Contrast Modal */}
      {fullScreenText && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="High contrast partner display"
          className="fixed inset-0 z-50 bg-black text-yellow-300 p-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b-2 border-yellow-400/40 pb-4">
            <span className="text-sm font-black tracking-widest text-yellow-400 uppercase">
              PROJECT SIGNSTREAM | CONVERSATION
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRotated180(!isRotated180)}
                className="min-h-touch px-4 py-2 rounded-xl bg-yellow-400 text-black font-black text-xs flex items-center gap-2 shadow"
                aria-label="Rotate 180 degrees for person sitting across"
              >
                <RotateCw className="w-4 h-4" />
                <span>Flip 180°</span>
              </button>

              <button
                type="button"
                onClick={() => setFullScreenText(null)}
                className="min-h-touch px-4 py-2 rounded-xl bg-slate-900 border-2 border-yellow-400 text-yellow-300 font-bold text-xs"
              >
                Close (ESC)
              </button>
            </div>
          </div>

          <div
            className={`flex-1 flex items-center justify-center px-4 transition-transform duration-300 ${
              isRotated180 ? 'rotate-180' : ''
            }`}
          >
            <p className="text-3xl sm:text-5xl md:text-6xl font-black text-center leading-tight tracking-tight select-none">
              {fullScreenText}
            </p>
          </div>

          <div className="border-t-2 border-yellow-400/40 pt-4 flex items-center justify-between text-xs text-yellow-400/80">
            <span>High-Contrast Partner Mode</span>
            <button
              type="button"
              onClick={() => handleSpeakAloud(fullScreenText)}
              className="px-3 py-1.5 rounded-lg bg-yellow-400 text-black font-bold flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4" /> Speak Aloud
            </button>
          </div>
        </div>
      )}

      {/* Extended Conversational Sign Clip Modal Preview with Teleprompter */}
      {previewClip && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ISL Sign Keyframe Preview"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-slate-950/95 border-2 border-teal-500/40 rounded-3xl p-4 sm:p-6 space-y-4 shadow-[0_0_50px_rgba(13,148,136,0.25)] animate-fade-in my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white text-base sm:text-lg tracking-tight">
                    {previewSentencePackage?.islGrammarSyntax || previewClip.gloss}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    {(previewClip.durationMs / 1000).toFixed(1)}s Conversational Duration
                  </span>
                  <TrustBadge level={previewClip.trustLevel} provenance={previewClip.provenance} />
                </div>
                {previewMessageText && (
                  <p className="text-xs sm:text-sm text-slate-300 italic font-medium">
                    "{previewMessageText}"
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewClip(null);
                  setPreviewSentencePackage(null);
                  setPreviewActiveWordId(null);
                }}
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 shrink-0"
              >
                Close (ESC)
              </button>
            </div>

            {/* Avatar Stage with Real-Time Scrubbing & Extended Pacing */}
            <AvatarStage
              clip={previewClip}
              showCaption={true}
              onTimeUpdate={handlePreviewTimeUpdate}
              seekTimeMs={previewSeekTimeMs}
              className="w-full shadow-2xl rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950"
            />

            {/* Synchronized Word Teleprompter Strip in Modal */}
            {previewSentencePackage && previewSentencePackage.words.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    Live Sentence Teleprompter
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {previewSentencePackage.words.length} signs · Tap any word to seek
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {previewSentencePackage.words.map((word) => {
                    const isActive = previewActiveWordId === word.id;
                    return (
                      <button
                        key={word.id}
                        type="button"
                        onClick={() => handleWordChipClick(word)}
                        aria-label={`Jump avatar to: ${word.originalWord}`}
                        className={`px-3 py-1.5 rounded-xl text-left transition-all border ${
                          isActive
                            ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg shadow-teal-950/60 scale-105 ring-1 ring-teal-400'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold capitalize">{word.originalWord}</span>
                          {word.isFingerspelled && (
                            <span className="text-[9px] px-1 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              A-Z
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-teal-400/90 truncate max-w-[120px]">
                          {word.islGloss}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
              <span>{previewClip.labels.en} • {previewClip.labels.hi}</span>
              <span className="text-[11px] text-slate-500">Pacing: Natural Conversational Dialogue</span>
            </div>
          </div>
        </div>
      )}

      {/* Commercial 1-Tap Emergency SOS Modal */}
      <EmergencySOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </div>
  );
};
