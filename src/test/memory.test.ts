import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  initializeDatabase,
  addMessage,
  isMemoryPaused,
  applyUserCorrections,
  incrementPhraseFrequency,
  clearAllMemory,
  exportMemoryData,
  importMemoryData,
  DEFAULT_SETTINGS
} from '../lib/storage';

describe('Local-First Memory & Storage Engine', () => {
  beforeEach(async () => {
    await clearAllMemory();
    await db.settings.put({ id: 'app_settings', value: { ...DEFAULT_SETTINGS, memoryPaused: false } });
    await initializeDatabase();
  });

  it('stores messages and preserves trust level and source tags', async () => {
    const msg = await addMessage({
      text: 'Need doctor immediately',
      source: 'SIGN-DEMO',
      trustLevel: 'DEMO',
      glossMatch: 'DOCTOR'
    });

    expect(msg).toBeDefined();
    expect(msg?.text).toBe('Need doctor immediately');
    expect(msg?.trustLevel).toBe('DEMO');

    const inDb = await db.messages.get(msg!.id);
    expect(inDb).toBeDefined();
    expect(inDb?.source).toBe('SIGN-DEMO');
  });

  it('respects the memory pause toggle without saving new history', async () => {
    // Enable pause
    await db.settings.put({ id: 'app_settings', value: { ...DEFAULT_SETTINGS, memoryPaused: true } });
    expect(await isMemoryPaused()).toBe(true);

    const countBefore = await db.messages.count();
    const ephemeralMsg = await addMessage({
      text: 'Private test message',
      source: 'TYPED',
      trustLevel: 'UNVERIFIED'
    });

    // Should return ephemeral message object with ephemeral_ prefix
    expect(ephemeralMsg?.id).toContain('ephemeral_');

    // Count in DB must NOT increase
    const countAfter = await db.messages.count();
    expect(countAfter).toBe(countBefore);
  });

  it('applies safe local voice corrections to transcribed text', async () => {
    await db.corrections.add({
      id: 'corr-1',
      originalText: 'namastey',
      correctedText: 'Namaste',
      appliedCount: 0,
      createdAt: Date.now()
    });

    const corrected = await applyUserCorrections('hello and namastey to all');
    expect(corrected).toBe('hello and Namaste to all');

    const item = await db.corrections.get('corr-1');
    expect(item?.appliedCount).toBe(1);
  });

  it('increments vocabulary frequency safely on-device', async () => {
    await incrementPhraseFrequency('Namaste');
    const match = await db.phrases.filter(p => p.text.toLowerCase() === 'namaste').first();
    expect(match).toBeDefined();
    expect(match!.frequency).toBeGreaterThan(0);
  });

  it('exports and imports backup data cleanly', async () => {
    await addMessage({
      text: 'Backup test note',
      source: 'TYPED',
      trustLevel: 'COMMUNITY'
    });

    const exportedJson = await exportMemoryData();
    expect(exportedJson).toContain('Backup test note');

    await clearAllMemory();
    expect(await db.messages.count()).toBe(0);

    const importRes = await importMemoryData(exportedJson);
    expect(importRes.success).toBe(true);
    expect(await db.messages.count()).toBeGreaterThan(0);
  });

  it('wipes all data completely on "Forget Everything"', async () => {
    await addMessage({ text: 'Secret to forget', source: 'TYPED', trustLevel: 'UNVERIFIED' });
    expect(await db.messages.count()).toBeGreaterThan(0);

    await clearAllMemory();
    expect(await db.messages.count()).toBe(0);
    expect(await db.phrases.count()).toBe(0);
    expect(await db.corrections.count()).toBe(0);
  });
});
