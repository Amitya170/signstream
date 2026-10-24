import Dexie, { type EntityTable } from 'dexie';
import {
  Message,
  Phrase,
  UserCorrection,
  LandmarkTemplate,
  LocalErrorReport,
  AppSettings
} from '../core/types';

export const DEFAULT_SETTINGS: AppSettings = {
  textSize: 1.0,
  theme: 'dark',
  reducedMotion: false,
  avatarMode: 'three',
  avatarSkinTone: '#e0ac69',
  avatarOutfitColor: '#0d9488',
  avatarBackground: '#1e293b',
  avatarScale: 1.0,
  playbackSpeed: 1.0,
  uiLanguage: 'en',
  sttEngine: 'webSpeech',
  ttsVoiceURI: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
  memoryPaused: false,
};

const INITIAL_PHRASES: Omit<Phrase, 'id'>[] = [
  { text: 'Namaste', hindiText: 'नमस्ते', gloss: 'NAMASTE', frequency: 12, isFavorite: true, category: 'greetings', createdAt: Date.now() - 10000 },
  { text: 'Thank you', hindiText: 'धन्यवाद', gloss: 'THANK-YOU', frequency: 8, isFavorite: true, category: 'greetings', createdAt: Date.now() - 9000 },
  { text: 'Please help me', hindiText: 'कृपया मेरी मदद करें', gloss: 'HELP', frequency: 5, isFavorite: true, category: 'emergency', createdAt: Date.now() - 8000 },
  { text: 'I need water', hindiText: 'मुझे पानी चाहिए', gloss: 'WATER', frequency: 6, isFavorite: false, category: 'daily', createdAt: Date.now() - 7000 },
  { text: 'Call a doctor', hindiText: 'डॉक्टर को बुलाएं', gloss: 'DOCTOR', frequency: 4, isFavorite: true, category: 'medical', createdAt: Date.now() - 6000 },
  { text: 'I am Deaf', hindiText: 'मैं बधिर हूँ', gloss: 'DEAF', frequency: 10, isFavorite: true, category: 'daily', createdAt: Date.now() - 5000 },
];

class SignStreamDatabase extends Dexie {
  messages!: EntityTable<Message, 'id'>;
  phrases!: EntityTable<Phrase, 'id'>;
  corrections!: EntityTable<UserCorrection, 'id'>;
  customSigns!: EntityTable<LandmarkTemplate, 'id'>;
  reports!: EntityTable<LocalErrorReport, 'id'>;
  settings!: EntityTable<{ id: string; value: any }, 'id'>;

  constructor() {
    super('SignStreamDB');
    this.version(1).stores({
      messages: 'id, timestamp, source, trustLevel',
      phrases: 'id, text, gloss, frequency, isFavorite, category, createdAt',
      corrections: 'id, originalText, appliedCount, createdAt',
      customSigns: 'id, gloss, label, trustLevel, recordedAt, isCustom',
      reports: 'id, timestamp, type',
      settings: 'id'
    });
  }
}

export const db = new SignStreamDatabase();

// Initialize initial default data if empty
export async function initializeDatabase(): Promise<void> {
  const phraseCount = await db.phrases.count();
  if (phraseCount === 0) {
    for (const phrase of INITIAL_PHRASES) {
      await db.phrases.add({
        ...phrase,
        id: 'phrase_' + Math.random().toString(36).substring(2, 9),
      });
    }
  }

  const existingSettings = await db.settings.get('app_settings');
  if (!existingSettings) {
    await db.settings.put({ id: 'app_settings', value: DEFAULT_SETTINGS });
  }
}

// Memory pause checker
export async function isMemoryPaused(): Promise<boolean> {
  const row = await db.settings.get('app_settings');
  if (row && row.value) {
    return Boolean(row.value.memoryPaused);
  }
  return false;
}

// Safe Message Appender
export async function addMessage(msg: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> {
  if (await isMemoryPaused()) {
    return {
      ...msg,
      id: 'ephemeral_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
  }

  const fullMsg: Message = {
    ...msg,
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now()
  };
  await db.messages.add(fullMsg);
  return fullMsg;
}

// User Correction Applier (Safe On-Device Post-Processing)
export async function applyUserCorrections(input: string): Promise<string> {
  const corrections = await db.corrections.toArray();
  let modified = input;
  for (const item of corrections) {
    const reg = new RegExp(`\\b${item.originalText}\\b`, 'gi');
    if (reg.test(modified)) {
      modified = modified.replace(reg, item.correctedText);
      if (!(await isMemoryPaused())) {
        await db.corrections.update(item.id, {
          appliedCount: item.appliedCount + 1
        });
      }
    }
  }
  return modified;
}

// Frequency-based suggestion finder
export async function getFrequentPhrases(limit: number = 6): Promise<Phrase[]> {
  return await db.phrases
    .orderBy('frequency')
    .reverse()
    .limit(limit)
    .toArray();
}

export async function incrementPhraseFrequency(text: string): Promise<void> {
  if (await isMemoryPaused()) return;
  const match = await db.phrases.filter(p => p.text.toLowerCase() === text.toLowerCase()).first();
  if (match) {
    await db.phrases.update(match.id, { frequency: match.frequency + 1 });
  } else {
    await db.phrases.add({
      id: 'phrase_' + Math.random().toString(36).substring(2, 9),
      text,
      gloss: text.toUpperCase().replace(/\s+/g, '-'),
      frequency: 1,
      isFavorite: false,
      category: 'daily',
      createdAt: Date.now()
    });
  }
}

// Full memory export (JSON)
export async function exportMemoryData(): Promise<string> {
  const [messages, phrases, corrections, customSigns, reports, settings] = await Promise.all([
    db.messages.toArray(),
    db.phrases.toArray(),
    db.corrections.toArray(),
    db.customSigns.toArray(),
    db.reports.toArray(),
    db.settings.toArray()
  ]);

  const bundle = {
    app: 'Project SignStream',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      messages,
      phrases,
      corrections,
      customSigns,
      reports,
      settings
    }
  };

  return JSON.stringify(bundle, null, 2);
}

// Memory import
export async function importMemoryData(jsonStr: string): Promise<{ success: boolean; count: number }> {
  const bundle = JSON.parse(jsonStr);
  if (!bundle.data) throw new Error('Unrecognized backup format.');

  let count = 0;
  if (Array.isArray(bundle.data.phrases)) {
    for (const p of bundle.data.phrases) {
      await db.phrases.put(p);
      count++;
    }
  }
  if (Array.isArray(bundle.data.customSigns)) {
    for (const cs of bundle.data.customSigns) {
      await db.customSigns.put(cs);
      count++;
    }
  }
  if (Array.isArray(bundle.data.corrections)) {
    for (const c of bundle.data.corrections) {
      await db.corrections.put(c);
      count++;
    }
  }
  if (Array.isArray(bundle.data.messages)) {
    for (const m of bundle.data.messages) {
      await db.messages.put(m);
      count++;
    }
  }

  return { success: true, count };
}

// "Forget everything" button implementation
export async function clearAllMemory(): Promise<void> {
  await db.messages.clear();
  await db.phrases.clear();
  await db.corrections.clear();
  await db.customSigns.clear();
  await db.reports.clear();
}
