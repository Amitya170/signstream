import React, { useState, useEffect } from 'react';
import {
  Search,
  Pin,
  Trash2,
  Download,
  Upload,
  Lock,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  FileText,
  CheckCircle2,
  HardDrive,
  Plus,
  X
} from 'lucide-react';
import {
  Phrase,
  UserCorrection,
  LocalErrorReport
} from '../../core/types';
import {
  db,
  isMemoryPaused,
  exportMemoryData,
  importMemoryData,
  clearAllMemory
} from '../../lib/storage';
import { encryptData, decryptData } from '../../lib/crypto';

export const MemoryView: React.FC = () => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [storageEstimate, setStorageEstimate] = useState<{ usedKb: number; quotaMb: number } | null>(null);

  // Phrases, Corrections & History
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [corrections, setCorrections] = useState<UserCorrection[]>([]);
  const [reports, setReports] = useState<LocalErrorReport[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Correction Inputs
  const [origWord, setOrigWord] = useState<string>('');
  const [corrWord, setCorrWord] = useState<string>('');

  // Local Error Reporting Form
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportType, setReportType] = useState<LocalErrorReport['type']>('WRONG_SIGN');
  const [reportContext, setReportContext] = useState<string>('');
  const [reportFeedback, setReportFeedback] = useState<string>('');

  // Encryption State
  const [encryptPassphrase, setEncryptPassphrase] = useState<string>('');
  const [isEncryptedExport, setIsEncryptedExport] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // "Forget Everything" Confirmation Modal
  const [showForgetModal, setShowForgetModal] = useState<boolean>(false);

  useEffect(() => {
    loadAllMemory();
  }, []);

  const loadAllMemory = async () => {
    const paused = await isMemoryPaused();
    setIsPaused(paused);

    const [allPhrases, allCorrections, allReports] = await Promise.all([
      db.phrases.orderBy('frequency').reverse().toArray(),
      db.corrections.toArray(),
      db.reports.toArray()
    ]);

    setPhrases(allPhrases);
    setCorrections(allCorrections);
    setReports(allReports);

    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      setStorageEstimate({
        usedKb: Math.round((est.usage || 0) / 1024),
        quotaMb: Math.round((est.quota || 0) / (1024 * 1024))
      });
    }
  };

  const handleTogglePause = async () => {
    const nextVal = !isPaused;
    const settingsRow = await db.settings.get('app_settings');
    const updated = { ...(settingsRow?.value || {}), memoryPaused: nextVal };
    await db.settings.put({ id: 'app_settings', value: updated });
    setIsPaused(nextVal);
    setStatusMsg(`Memory storage is now ${nextVal ? 'PAUSED' : 'RESUMED'}.`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Add Voice Correction
  const handleAddCorrection = async () => {
    if (!origWord.trim() || !corrWord.trim()) return;

    await db.corrections.add({
      id: 'corr_' + Date.now(),
      originalText: origWord.trim(),
      correctedText: corrWord.trim(),
      appliedCount: 0,
      createdAt: Date.now()
    });

    setOrigWord('');
    setCorrWord('');
    loadAllMemory();
    setStatusMsg('Saved speech correction rule.');
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleDeleteCorrection = async (id: string) => {
    await db.corrections.delete(id);
    loadAllMemory();
  };

  // Toggle Favorite
  const handleToggleFavorite = async (phrase: Phrase) => {
    await db.phrases.update(phrase.id, { isFavorite: !phrase.isFavorite });
    loadAllMemory();
  };

  const handleDeletePhrase = async (id: string) => {
    await db.phrases.delete(id);
    loadAllMemory();
  };

  // Save Error Report
  const handleSubmitReport = async () => {
    if (!reportContext.trim() || !reportFeedback.trim()) return;

    await db.reports.add({
      id: 'rep_' + Date.now(),
      timestamp: Date.now(),
      type: reportType,
      inputContext: reportContext.trim(),
      actualOutput: 'Local test output',
      userFeedback: reportFeedback.trim()
    });

    setReportContext('');
    setReportFeedback('');
    setShowReportModal(false);
    loadAllMemory();
    setStatusMsg('Saved local report. You can export this to share with maintainers.');
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Export Backup
  const handleExportBackup = async () => {
    const rawData = await exportMemoryData();
    let finalContent = rawData;
    let fileName = `signstream_memory_${new Date().toISOString().slice(0, 10)}.json`;

    if (isEncryptedExport) {
      if (!encryptPassphrase.trim()) {
        setStatusMsg('Please provide a passphrase for encrypted export.');
        return;
      }
      finalContent = await encryptData(rawData, encryptPassphrase);
      fileName = `signstream_encrypted_${new Date().toISOString().slice(0, 10)}.enc.json`;
    }

    const blob = new Blob([finalContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg(`Exported ${fileName} successfully.`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Import Backup
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let content = event.target?.result as string;
        if (content.includes('"cipher": "AES-GCM-256"')) {
          const pass = prompt('Enter passphrase to decrypt this backup:');
          if (!pass) return;
          content = await decryptData(content, pass);
        }
        const res = await importMemoryData(content);
        loadAllMemory();
        setStatusMsg(`Imported ${res.count} records successfully.`);
      } catch (err: any) {
        setStatusMsg('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // "Forget Everything"
  const handleConfirmForget = async () => {
    await clearAllMemory();
    setShowForgetModal(false);
    loadAllMemory();
    setStatusMsg('All local memory has been completely wiped.');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const filteredPhrases = phrases.filter(
    (p) =>
      p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.hindiText && p.hindiText.includes(searchQuery)) ||
      p.gloss.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Title & Memory Pause Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Local-First Memory & History
            </h1>
            {isPaused && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PAUSED
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Stored 100% in your browser IndexedDB. Self-improves only on your device.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTogglePause}
          className={`min-h-touch px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
            isPaused
              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
          aria-label={isPaused ? 'Resume memory recording' : 'Pause memory recording'}
        >
          {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4 text-amber-400" />}
          <span>{isPaused ? 'Resume Memory' : 'Pause Memory'}</span>
        </button>
      </div>

      {/* Storage Gauge & Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-brand-400" />
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Local Storage Meter</span>
              <p className="text-sm font-black text-white">
                {storageEstimate ? `${storageEstimate.usedKb} KB used` : 'Estimating...'}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500">100% On-Device</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Error Reports Saved</span>
              <p className="text-sm font-black text-white">{reports.length} report(s)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-brand-300 border border-slate-700"
          >
            + New Report
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-brand-950/80 border border-brand-500/60 text-xs text-brand-300 font-semibold flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Frequent & Favorite Vocabulary Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white">
            Saved & Frequent Vocabulary ({filteredPhrases.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phrases..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {filteredPhrases.map((phrase) => (
            <div
              key={phrase.id}
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm">{phrase.text}</span>
                  {phrase.hindiText && <span className="text-slate-400">({phrase.hindiText})</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ISL Gloss: <span className="font-mono text-brand-400">{phrase.gloss}</span> • Used {phrase.frequency}x
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(phrase)}
                  className={`p-1.5 rounded-lg ${
                    phrase.isFavorite ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400 hover:text-white'
                  }`}
                  aria-label={phrase.isFavorite ? 'Unpin favorite' : 'Pin to favorites'}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePhrase(phrase.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-700"
                  aria-label="Delete phrase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Corrections (Safe Local STT Post-Processing) */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">
            Speech Recognition Post-Processing Corrections
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fix repeated transcription errors. If the speech engine mistranscribes a word, specify your replacement rule here.
            Applied strictly on your local device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={origWord}
            onChange={(e) => setOrigWord(e.target.value)}
            placeholder="When speech engine hears (e.g. namastey)..."
            className="min-h-touch px-4 py-2 bg-slate-950 border-2 border-slate-700 rounded-xl text-white text-xs"
          />
          <input
            type="text"
            value={corrWord}
            onChange={(e) => setCorrWord(e.target.value)}
            placeholder="Replace with (e.g. Namaste)..."
            className="min-h-touch px-4 py-2 bg-slate-950 border-2 border-slate-700 rounded-xl text-white text-xs"
          />
        </div>

        <button
          type="button"
          onClick={handleAddCorrection}
          disabled={!origWord.trim() || !corrWord.trim()}
          className="min-h-touch px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Save Voice Correction Rule</span>
        </button>

        {corrections.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {corrections.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="line-through text-rose-400">{c.originalText}</span>
                  <span className="mx-2 text-slate-400">➔</span>
                  <span className="font-bold text-emerald-400">{c.correctedText}</span>
                  <span className="ml-3 text-slate-500 text-[10px]">(Applied {c.appliedCount} times)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCorrection(c.id)}
                  className="p-1 rounded text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export, Import & Forget Everything Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">Backup, Encryption & Privacy Controls</h2>

        {/* Encrypted Export Checkbox */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-semibold">
            <input
              type="checkbox"
              checked={isEncryptedExport}
              onChange={(e) => setIsEncryptedExport(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <Lock className="w-4 h-4 text-brand-400" />
            <span>Encrypt backup file using WebCrypto AES-GCM password</span>
          </label>

          {isEncryptedExport && (
            <input
              type="password"
              value={encryptPassphrase}
              onChange={(e) => setEncryptPassphrase(e.target.value)}
              placeholder="Enter encryption passphrase..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs mt-2"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="min-h-touch px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (JSON)</span>
          </button>

          <label className="min-h-touch px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowForgetModal(true)}
            className="min-h-touch px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold text-xs flex items-center gap-2 border border-rose-500/50 ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Forget Everything</span>
          </button>
        </div>
      </div>

      {/* New Error Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md p-6 bg-slate-900 border-2 border-slate-700 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Report Wrong Sign / Transcription</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Issue Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="WRONG_SIGN">Wrong Sign Keyframe / Gesture</option>
                  <option value="WRONG_TRANSCRIPTION">Incorrect Speech-to-Text</option>
                  <option value="UI_BUG">Accessibility or UI Bug</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Input Phrase / Context</label>
                <input
                  type="text"
                  value={reportContext}
                  onChange={(e) => setReportContext(e.target.value)}
                  placeholder="e.g. Spoken phrase or sign gloss..."
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Feedback / Correction</label>
                <textarea
                  rows={3}
                  value={reportFeedback}
                  onChange={(e) => setReportFeedback(e.target.value)}
                  placeholder="Describe what was wrong and how fluent ISL signers sign this..."
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitReport}
              className="w-full min-h-touch py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              Save Report Locally
            </button>
          </div>
        </div>
      )}

      {/* "Forget Everything" Confirmation Modal */}
      {showForgetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md p-6 bg-slate-900 border-2 border-rose-600 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-white text-lg">Wipe All Local Memory?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will completely delete all conversation history, custom signs, voice correction rules,
              and saved vocabulary from your device. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForgetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmForget}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
