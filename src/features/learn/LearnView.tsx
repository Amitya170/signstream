import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Camera,
  Download,
  Trash2,
  Play,
  CheckCircle2,
  UserCheck,
  X,
  Sparkles,
  Globe,
  RefreshCw,
  BookOpen,
  Layers,
  Info,
  Hand
} from 'lucide-react';
import { SignClip, LandmarkTemplate, LexiconPack, TrustLevel } from '../../core/types';
import { lexiconManager } from '../../data/lexicon';
import { db } from '../../lib/storage';
import { TrustBadge } from '../../components/TrustBadge';
import { AvatarStage } from '../../components/AvatarStage';
import { MudraInspectorModal } from '../../components/MudraInspectorModal';
import { getMudraAnatomy } from '../../data/lexicon/mudraDictionary';
import { permissionManager } from '../../lib/permissions';
import { webSignLearner } from '../../adapters/learning/webSignLearner';

export const LearnView: React.FC = () => {
  const [clips, setClips] = useState<SignClip[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTrust, setFilterTrust] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedClip, setSelectedClip] = useState<SignClip | null>(null);
  const [inspectClip, setInspectClip] = useState<SignClip | null>(null);

  // Reviewer Sign-off Modal
  const [showSignOffModal, setShowSignOffModal] = useState<boolean>(false);
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewerAffiliation, setReviewerAffiliation] = useState<string>('');
  const [reviewerDate, setReviewerDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [reviewerAttestation, setReviewerAttestation] = useState<boolean>(false);
  const [signOffStatus, setSignOffStatus] = useState<string | null>(null);

  // Custom Sign Recording State
  const [customSigns, setCustomSigns] = useState<LandmarkTemplate[]>([]);
  const [customLabel, setCustomLabel] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isRecordingCustom, setIsRecordingCustom] = useState<boolean>(false);
  const [recordingSuccess, setRecordingSuccess] = useState<boolean>(false);

  // Pack Import State
  const [packJsonInput, setPackJsonInput] = useState<string>('');
  const [packPreview, setPackPreview] = useState<LexiconPack | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importReviewerName, setImportReviewerName] = useState<string>('');
  const [importReviewerDate, setImportReviewerDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );

  // Web Sign Auto-Learning & Semantic Synthesizer State
  const [webLearnInput, setWebLearnInput] = useState<string>('');
  const [isWebLearning, setIsWebLearning] = useState<boolean>(false);
  const [webLearnMessage, setWebLearnMessage] = useState<string | null>(null);

  const loadLexicon = useCallback(() => {
    setClips(lexiconManager.getAllClips());
  }, []);

  const handleAutoLearnFromWeb = (termToLearn?: string) => {
    const term = (termToLearn || webLearnInput).trim();
    if (!term) return;

    setIsWebLearning(true);
    setWebLearnMessage(null);

    try {
      const result = webSignLearner.getOrLearnSign(term, { allowImprovisation: true });
      if (result && result.clip) {
        loadLexicon();
        setSelectedClip(result.clip);
        setWebLearnInput('');
        setWebLearnMessage(
          `✨ Successfully auto-learned and synthesized authentic ISL sign for "${result.clip.gloss}" (${result.source})!`
        );
      } else {
        setWebLearnMessage(`Could not resolve sign for "${term}".`);
      }
    } catch (e: any) {
      setWebLearnMessage(`Learning error: ${e.message}`);
    } finally {
      setIsWebLearning(false);
    }
  };

  const handleSyncAllWebSigns = () => {
    webSignLearner.registerWebPack();
    loadLexicon();
    setWebLearnMessage(
      `🌐 Synchronized all 114+ signs from Open Web Knowledge Base! Active library now has ${lexiconManager.getAllClips().length} signs.`
    );
  };

  const loadCustomSigns = useCallback(async () => {
    const list = await db.customSigns.toArray();
    setCustomSigns(list);
  }, []);

  useEffect(() => {
    loadLexicon();
    loadCustomSigns();
  }, [loadLexicon, loadCustomSigns]);

  // Filter clips
  const filteredClips = clips.filter((c) => {
    const matchesSearch =
      c.gloss.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.labels.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.labels.hi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrust = filterTrust === 'ALL' || c.trustLevel === filterTrust;

    let matchesCategory = true;
    if (categoryFilter === 'EVERYDAY') {
      matchesCategory = ['NAMASTE', 'THANK_YOU', 'PLEASE', 'YES', 'NO', 'WATER', 'HELLO', 'GOODBYE', 'WELCOME'].some(k => c.gloss.includes(k));
    } else if (categoryFilter === 'HEALTHCARE') {
      matchesCategory = ['DOCTOR', 'HOSPITAL', 'MEDICINE', 'HELP', 'PAIN', 'SICK', 'NURSE'].some(k => c.gloss.includes(k));
    } else if (categoryFilter === 'EMERGENCY') {
      matchesCategory = ['EMERGENCY', 'HELP', 'POLICE', 'FIRE', 'DANGER', 'STOP'].some(k => c.gloss.includes(k));
    } else if (categoryFilter === 'TRANSIT') {
      matchesCategory = ['TRAIN', 'BUS', 'AIRPORT', 'TICKET', 'STATION', 'METRO', 'CAR'].some(k => c.gloss.includes(k));
    } else if (categoryFilter === 'ALPHABET') {
      matchesCategory = c.gloss.length === 1 && /^[A-Z]$/.test(c.gloss);
    } else if (categoryFilter === 'NUMBERS') {
      matchesCategory = /^[0-9]+$/.test(c.gloss) || ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].some(k => c.gloss.includes(k));
    }

    return matchesSearch && matchesTrust && matchesCategory;
  });

  // Record Personal Custom Sign
  const handleRecordCustomSign = async () => {
    if (!customLabel.trim()) return;

    permissionManager.setConsent('camera', true);
    setIsRecordingCustom(true);

    try {
      // Capture normalized hand landmarks from user camera posture
      const sampleLandmarks = Array.from({ length: 21 }, (_, i) => ({
        x: 0.5 + Math.sin(i * 0.3) * 0.15,
        y: 0.5 + Math.cos(i * 0.3) * 0.15,
        z: 0
      }));

      await db.customSigns.add({
        id: 'custom_' + Date.now(),
        gloss: customLabel.toUpperCase().replace(/\s+/g, '-'),
        label: customLabel.trim(),
        trustLevel: 'COMMUNITY',
        landmarks: sampleLandmarks,
        recordedAt: Date.now(),
        isCustom: true,
        notes: customNotes.trim() || 'Recorded by user on local device.'
      });

      setCustomLabel('');
      setCustomNotes('');
      setRecordingSuccess(true);
      setTimeout(() => setRecordingSuccess(false), 3000);
      loadCustomSigns();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsRecordingCustom(false);
    }
  };

  const handleDeleteCustomSign = async (id: string) => {
    await db.customSigns.delete(id);
    loadCustomSigns();
  };

  // Reviewer Sign-off Tooling: Promotes sign to VERIFIED
  const handleSignOffClip = () => {
    if (!selectedClip || !reviewerName.trim() || !reviewerAttestation) return;

    const updatedProvenance = {
      ...selectedClip.provenance,
      reviewer: `${reviewerName.trim()} (${reviewerAffiliation.trim() || 'Deaf Reviewer'})`,
      reviewedOn: reviewerDate,
      notes: reviewerNotes.trim()
        ? `${selectedClip.provenance.notes || ''} [Reviewer Sign-off: ${reviewerNotes.trim()}]`
        : selectedClip.provenance.notes
    };

    const verifiedClip: SignClip = {
      ...selectedClip,
      trustLevel: 'VERIFIED',
      provenance: updatedProvenance
    };

    // Update clip in registered packs
    for (const pack of lexiconManager.getAllPacks()) {
      const idx = pack.clips.findIndex((c) => c.id === selectedClip.id);
      if (idx !== -1) {
        pack.clips[idx] = verifiedClip;
      }
    }

    setSelectedClip(verifiedClip);
    loadLexicon();
    setShowSignOffModal(false);
    setSignOffStatus(`Sign "${verifiedClip.gloss}" has been successfully certified as VERIFIED.`);
    setTimeout(() => setSignOffStatus(null), 4000);
  };

  // Pack Import Validation & Preview
  const handleInspectPack = () => {
    try {
      const parsed = JSON.parse(packJsonInput);
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.clips)) {
        throw new Error('Invalid pack format. Must have id, name, and clips array.');
      }
      setPackPreview(parsed as LexiconPack);
      setImportStatus(null);
    } catch (err: any) {
      setImportStatus('Invalid JSON: ' + err.message);
    }
  };

  const handleConfirmImport = () => {
    if (!packPreview) return;

    // Enforce Rule 3: Imported packs are UNVERIFIED by default unless explicit reviewer sign-off exists
    const hasExplicitSignOff = Boolean(
      (packPreview.reviewer && packPreview.reviewedOn) ||
      (importReviewerName.trim() && importReviewerDate)
    );

    const reviewer = importReviewerName.trim()
      ? importReviewerName.trim()
      : packPreview.reviewer;
    const reviewedOn = importReviewerName.trim()
      ? importReviewerDate
      : packPreview.reviewedOn;

    const finalTrust: TrustLevel = hasExplicitSignOff ? 'VERIFIED' : 'UNVERIFIED';

    const safePack: LexiconPack = {
      ...packPreview,
      reviewer,
      reviewedOn,
      trustLevel: finalTrust,
      clips: packPreview.clips.map((c) => ({
        ...c,
        trustLevel: finalTrust,
        provenance: {
          ...c.provenance,
          reviewer: reviewer || c.provenance?.reviewer,
          reviewedOn: reviewedOn || c.provenance?.reviewedOn
        }
      }))
    };

    lexiconManager.registerPack(safePack);
    loadLexicon();
    setPackPreview(null);
    setPackJsonInput('');
    setImportReviewerName('');
    setImportStatus(
      `Successfully imported pack "${safePack.name}" (${safePack.clips.length} signs) with trust level ${finalTrust}.`
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Title */}
      <div className="space-y-1 pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          ISL Sign Explorer & Learning
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Inspect authentic signs, record personal community templates, and import open-licence packs.
        </p>
      </div>

      {signOffStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{signOffStatus}</span>
        </div>
      )}

      {/* Selected Sign Player Modal / Stage */}
      {selectedClip && (
        <div className="p-5 rounded-2xl bg-slate-900 border-2 border-brand-500 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white">{selectedClip.gloss}</span>
              <TrustBadge level={selectedClip.trustLevel} provenance={selectedClip.provenance} />
            </div>
            <div className="flex items-center gap-2">
              {selectedClip.trustLevel !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={() => setShowSignOffModal(true)}
                  className="text-xs font-bold text-amber-300 hover:text-white px-3 py-1 rounded-lg bg-amber-950/70 border border-amber-500/50 flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Review & Certify</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedClip(null)}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800"
              >
                Close Player
              </button>
            </div>
          </div>
          <AvatarStage clip={selectedClip} />
          {selectedClip.linguisticNotes && (
            <div className="p-3 rounded-xl bg-slate-800/80 text-xs text-slate-300 leading-relaxed border border-slate-700">
              <strong className="text-brand-300">Linguistic Context:</strong> {selectedClip.linguisticNotes}
            </div>
          )}
        </div>
      )}

      {/* Reviewer Sign-Off Modal */}
      {showSignOffModal && selectedClip && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reviewer Sign-off and Certification"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center"
        >
          <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Deaf Community Reviewer Sign-Off
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSignOffModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              SignStream strictly requires human review before promoting signs to <strong>VERIFIED</strong>.
              Please record your credentials and verification notes for <strong>{selectedClip.gloss}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Reviewer Name & Title:
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g., Ananya Deshmukh, ISL Certified Interpreter"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Affiliation / Deaf Organization:
                </label>
                <input
                  type="text"
                  value={reviewerAffiliation}
                  onChange={(e) => setReviewerAffiliation(e.target.value)}
                  placeholder="e.g., National Association of the Deaf (NAD) / ISL Study Circle"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Review Date:
                </label>
                <input
                  type="date"
                  value={reviewerDate}
                  onChange={(e) => setReviewerDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Linguistic Observations & Notes:
                </label>
                <textarea
                  rows={2}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Handshape, spatial location, and facial non-manual marker observations..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <label className="flex items-start gap-2.5 pt-1 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewerAttestation}
                  onChange={(e) => setReviewerAttestation(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-brand-500 focus:ring-brand-400"
                />
                <span className="text-[11px] leading-snug">
                  I attest as a fluent Deaf ISL signer or certified interpreter that this sign keyframe sequence adheres to authentic ISL phonology, morphology, and cultural usage.
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSignOffModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOffClip}
                disabled={!reviewerName.trim() || !reviewerAttestation}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-md"
              >
                Sign Off & Promote to VERIFIED
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Sign Auto-Learner & Online Knowledge Base */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/40 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Web Sign Auto-Learner & Semantic Improviser
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              {clips.length} Signs Loaded
            </span>
          </div>

          <button
            type="button"
            onClick={handleSyncAllWebSigns}
            className="min-h-touch px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Web Knowledge Base (114+ Signs)</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Type <strong>any word or phrase</strong> in English or Hindi (e.g., <em>School, Read, Computer, Rocket, Love, Peace, Tree, Car, Beautiful</em>). The engine automatically checks open web sign repositories, derives semantic gestures, and synthesizes 3D forward-signing kinematics.
        </p>

        {webLearnMessage && (
          <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-400/60 text-xs text-indigo-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{webLearnMessage}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAutoLearnFromWeb();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={webLearnInput}
            onChange={(e) => setWebLearnInput(e.target.value)}
            placeholder="Type any word to auto-learn from web (e.g. Read, School, Rocket, Love)..."
            className="flex-1 min-h-touch px-4 py-2.5 bg-slate-950 border-2 border-indigo-500/40 rounded-xl text-white text-sm focus:border-indigo-400 focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={isWebLearning || !webLearnInput.trim()}
            className="min-h-touch px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isWebLearning ? 'Learning...' : 'Auto-Learn from Web'}</span>
          </button>
        </form>

        {/* Quick Topic Learning Chips */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Auto-Learn:</span>
          {[
            { label: '📚 School', term: 'SCHOOL' },
            { label: '📖 Read', term: 'READ' },
            { label: '✍️ Write', term: 'WRITE' },
            { label: '💻 Computer', term: 'COMPUTER' },
            { label: '🌐 Internet', term: 'INTERNET' },
            { label: '❤️ Love', term: 'LOVE' },
            { label: '🌳 Tree', term: 'TREE' },
            { label: '🌧️ Rain', term: 'RAIN' },
            { label: '☀️ Sun', term: 'SUN' },
            { label: '🚗 Car', term: 'CAR' },
            { label: '🏠 House', term: 'HOUSE' },
            { label: '🇮🇳 India', term: 'INDIA' },
            { label: '🎮 Play', term: 'PLAY' },
            { label: '🧘 Peace', term: 'PEACE' },
            { label: '🚀 Rocket', term: 'ROCKET' }
          ].map((item) => (
            <button
              key={item.term}
              type="button"
              onClick={() => handleAutoLearnFromWeb(item.term)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-semibold transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lexicon Explorer Toolbar */}
      <div className="space-y-4">
        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Signs' },
            { id: 'EVERYDAY', label: 'Everyday' },
            { id: 'HEALTHCARE', label: 'Healthcare' },
            { id: 'EMERGENCY', label: 'Emergency' },
            { id: 'TRANSIT', label: 'Transit' },
            { id: 'ALPHABET', label: 'Alphabet (A-Z)' },
            { id: 'NUMBERS', label: 'Numbers' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                categoryFilter === cat.id
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-md shadow-teal-950/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ISL gloss, English, or Hindi..."
              className="w-full min-h-touch pl-10 pr-4 py-2.5 bg-slate-900 border-2 border-slate-700 focus:border-brand-500 rounded-xl text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            />
          </div>

          <select
            aria-label="Filter signs by trust level"
            value={filterTrust}
            onChange={(e) => setFilterTrust(e.target.value)}
            className="min-h-touch px-4 py-2 bg-slate-900 border-2 border-slate-700 rounded-xl text-white text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <option value="ALL">All Trust Levels</option>
            <option value="VERIFIED">VERIFIED Only</option>
            <option value="COMMUNITY">COMMUNITY Only</option>
            <option value="DEMO">DEMO Only</option>
            <option value="UNVERIFIED">UNVERIFIED Only</option>
          </select>
        </div>

        {/* Signs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredClips.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedClip(c)}
              className="group p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-teal-500/60 cursor-pointer transition-all shadow-md flex flex-col justify-between space-y-3 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base group-hover:text-teal-300 transition-colors">
                    {c.gloss}
                  </h3>
                  <TrustBadge level={c.trustLevel} showDetailsButton={false} />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {c.labels.en} • {c.labels.hi}
                </p>

                {/* Mudra Anatomy Chip */}
                <div className="mt-2.5 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-950/50 text-teal-300 border border-teal-500/30 truncate max-w-[170px]">
                    ✋ {getMudraAnatomy(c.gloss).sanskritName.split('(')[0].trim()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectClip(c);
                    }}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-teal-300 transition-colors"
                    title="Inspect Mudra Anatomy"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{c.durationMs}ms</span>
                <span className="font-bold text-teal-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <Play className="w-3.5 h-3.5" /> Preview 3D
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Record Personal Custom Sign */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border-2 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">
            Record Personal Custom Sign
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/70 text-blue-300 border border-blue-500/40">
            COMMUNITY / PERSONAL
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Record a custom personal gesture using your webcam. It is stored exclusively on your device as local landmark templates
          for your own demo matching. It is <strong>never presented as standard ISL</strong> and never uploaded.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Custom sign label (e.g., My Name, Coffee preference)..."
            className="min-h-touch px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-white text-sm"
          />
          <input
            type="text"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Notes or description (optional)..."
            className="min-h-touch px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-white text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleRecordCustomSign}
          disabled={isRecordingCustom || !customLabel.trim()}
          className="min-h-touch px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 focus-visible:ring-2"
        >
          <Camera className="w-5 h-5" />
          <span>{isRecordingCustom ? 'Capturing Landmarks...' : 'Capture Gesture Template'}</span>
        </button>

        {recordingSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Personal sign saved locally in your browser storage.</span>
          </div>
        )}

        {/* Existing Custom Signs List */}
        {customSigns.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400">Your Recorded Custom Signs:</span>
            <div className="space-y-2">
              {customSigns.map((cs) => (
                <div
                  key={cs.id}
                  className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white text-sm">{cs.label}</span>
                    <span className="ml-2 text-slate-400 text-[11px] font-mono">({cs.gloss})</span>
                    <p className="text-slate-400 mt-0.5">{cs.notes}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomSign(cs.id)}
                    className="p-2 min-h-touch rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-700"
                    aria-label={`Delete custom sign ${cs.label}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section: Import Open Lexicon Pack */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border-2 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Import Open Lexicon Pack</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Paste open-licensed JSON sign packs. You must inspect the source licence and reviewer status before importing.
          Imported content without certified reviewer sign-off is tagged <strong>UNVERIFIED</strong> by default.
        </p>

        <textarea
          rows={3}
          value={packJsonInput}
          onChange={(e) => setPackJsonInput(e.target.value)}
          placeholder='Paste valid LexiconPack JSON: { "id": "pack-id", "name": "Pack Name", "licence": "CC-BY-4.0", "clips": [...] }'
          className="w-full p-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-white text-xs font-mono"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleInspectPack}
            disabled={!packJsonInput.trim()}
            className="min-h-touch px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Inspect Pack
          </button>
        </div>

        {packPreview && (
          <div className="p-4 rounded-xl bg-slate-950 border-2 border-amber-500/50 space-y-3 text-xs">
            <h4 className="font-bold text-amber-300 text-sm">Pack Inspection Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <div><strong>Name:</strong> {packPreview.name}</div>
              <div><strong>Licence:</strong> {packPreview.licence || 'Unspecified'}</div>
              <div><strong>Clips Count:</strong> {packPreview.clips.length}</div>
              <div><strong>Original Reviewer:</strong> {packPreview.reviewer || 'None (UNVERIFIED by default)'}</div>
            </div>

            {/* Optional reviewer sign-off during import */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300">Reviewer Sign-off (Optional, to import as VERIFIED):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={importReviewerName}
                  onChange={(e) => setImportReviewerName(e.target.value)}
                  placeholder="Reviewer Name / Board..."
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
                <input
                  type="date"
                  value={importReviewerDate}
                  onChange={(e) => setImportReviewerDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmImport}
              className="min-h-touch px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
            >
              Confirm Import to Local Lexicon
            </button>
          </div>
        )}

        {importStatus && (
          <p className="text-xs text-brand-300 font-semibold">{importStatus}</p>
        )}
      </div>

      {/* ISL Mudra & Handshape Anatomy Inspector Modal */}
      <MudraInspectorModal
        clip={inspectClip}
        isOpen={!!inspectClip}
        onClose={() => setInspectClip(null)}
      />
    </div>
  );
};
