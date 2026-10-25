import { describe, it, expect } from 'vitest';
import { lexiconTranslator } from '../adapters/translation/lexiconLookup';
import { lexiconManager } from '../data/lexicon';

describe('Lexicon Exact-Match and Fingerspelling Rules', () => {
  it('translates exact ISL phrases in English and Hindi correctly', async () => {
    const resEn = await lexiconTranslator.translate('Namaste');
    expect(resEn.fullMatch).toBe(true);
    expect(resEn.matchedSignClips.length).toBe(1);
    expect(resEn.matchedSignClips[0].gloss).toBe('NAMASTE');
    expect(resEn.unsupportedTokens).toEqual([]);
    expect(resEn.matchedSignClips[0].trustLevel).toBe('VERIFIED');

    const resHi = await lexiconTranslator.translate('नमस्ते');
    expect(resHi.fullMatch).toBe(true);
    expect(resHi.matchedSignClips[0].gloss).toBe('NAMASTE');

    const resThanks = await lexiconTranslator.translate('Thank you');
    expect(resThanks.fullMatch).toBe(true);
    expect(resThanks.matchedSignClips[0].gloss).toBe('THANK-YOU');
  });

  it('translates names and proper nouns via authentic ISL two-handed fingerspelling', async () => {
    const resFingerspell = await lexiconTranslator.translate('Amit');
    expect(resFingerspell.fullMatch).toBe(true);
    expect(resFingerspell.matchedSignClips.length).toBeGreaterThan(1);
    expect(resFingerspell.explanation).toContain('two-handed fingerspelling');
    // Check letter clips exist
    const glosses = resFingerspell.matchedSignClips.map((c) => c.gloss);
    expect(glosses).toContain('LETTER-A');
    expect(glosses).toContain('LETTER-M');
    expect(glosses).toContain('LETTER-I');
    expect(glosses).toContain('LETTER-T');
  });

  it('chains multi-sign sentences into continuous fluid trajectories', async () => {
    const resMulti = await lexiconTranslator.translate('Namaste Doctor');
    expect(resMulti.fullMatch).toBe(true);
    expect(resMulti.matchedSignClips.length).toBeGreaterThanOrEqual(2);
    // Composite clip should combine both signs
    expect(resMulti.matchedSignClips[0].gloss).toContain('NAMASTE');
    expect(resMulti.matchedSignClips[0].gloss).toContain('DOCTOR');
    expect(resMulti.matchedSignClips[0].durationMs).toBeGreaterThan(2000);
  });

  it('preserves trust levels and provenance across lookup', async () => {
    const clip = lexiconManager.findClipByGloss('HELP');
    expect(clip).toBeDefined();
    expect(clip?.trustLevel).toBe('VERIFIED');
    expect(clip?.provenance.source).toBeDefined();
    expect(clip?.provenance.licence).toBe('CC-BY-4.0');
    expect(clip?.provenance.reviewer).toBeDefined();
  });

  it('translates authentic distinct ISL pronouns and core actions without collision', async () => {
    const resHe = await lexiconTranslator.translate('he');
    expect(resHe.matchedSignClips[0].gloss).toBe('HE');

    const resShe = await lexiconTranslator.translate('she');
    expect(resShe.matchedSignClips[0].gloss).toBe('SHE');

    const resWe = await lexiconTranslator.translate('we');
    expect(resWe.matchedSignClips[0].gloss).toBe('WE');

    const resThey = await lexiconTranslator.translate('they');
    expect(resThey.matchedSignClips[0].gloss).toBe('THEY');

    const resDrink = await lexiconTranslator.translate('drink');
    expect(resDrink.matchedSignClips[0].gloss).toBe('DRINK');

    const resHungry = await lexiconTranslator.translate('hungry');
    expect(resHungry.matchedSignClips[0].gloss).toBe('HUNGRY');

    const resNeed = await lexiconTranslator.translate('need');
    expect(resNeed.matchedSignClips[0].gloss).toBe('NEED');
  });

  it('resolves open ISL vocabulary terms accurately from knowledge base', async () => {
    const resBook = await lexiconTranslator.translate('book');
    expect(resBook.matchedSignClips[0].gloss).toBe('BOOK');

    const resHouse = await lexiconTranslator.translate('house');
    expect(resHouse.matchedSignClips[0].gloss).toBe('HOUSE');

    const resComputer = await lexiconTranslator.translate('computer');
    expect(resComputer.matchedSignClips[0].gloss).toBe('COMPUTER');
  });
});
