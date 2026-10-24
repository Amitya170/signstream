import { describe, it, expect } from 'vitest';
import { liveSentenceSigner } from '../adapters/translation/liveSentenceSigner';

describe('Live Continuous Sentence Signer & Teleprompter Sync', () => {
  it('compiles common phrases into continuous sign stream', () => {
    const pkg = liveSentenceSigner.compileSentence('Thank you');
    expect(pkg.words.length).toBeGreaterThanOrEqual(1);
    expect(pkg.compositeClip).toBeDefined();
    expect(pkg.compositeClip.durationMs).toBeGreaterThan(0);
    expect(pkg.compositeClip.keyframes.length).toBeGreaterThan(0);
  });

  it('compiles complex sentence into co-articulated ISL sign sequence', () => {
    const pkg = liveSentenceSigner.compileSentence('Doctor where');
    expect(pkg.words.length).toBeGreaterThanOrEqual(1);
    expect(pkg.compositeClip.keyframes.length).toBeGreaterThan(0);
    expect(pkg.islGrammarSyntax).toBeTruthy();
  });

  it('falls back to authentic ISL two-handed fingerspelling for unseen words', () => {
    const pkg = liveSentenceSigner.compileSentence('AMIT');
    expect(pkg.words.length).toBe(1);
    expect(pkg.words[0].isFingerspelled).toBe(true);
    expect(pkg.words[0].fingerspellLetters).toEqual(['A', 'M', 'I', 'T']);
    expect(pkg.words[0].islGloss).toBe('SPELL:AMIT');
  });

  it('accurately identifies active word at time t for teleprompter highlighting', () => {
    const pkg = liveSentenceSigner.compileSentence('Namaste thank you');
    expect(pkg.words.length).toBeGreaterThanOrEqual(2);

    const firstWord = pkg.words[0];
    const secondWord = pkg.words[1];

    const activeAtStart = liveSentenceSigner.getActiveWordAtTime(pkg, firstWord.startTimeMs + 50);
    expect(activeAtStart?.id).toBe(firstWord.id);

    const activeAtSecond = liveSentenceSigner.getActiveWordAtTime(pkg, secondWord.startTimeMs + 50);
    expect(activeAtSecond?.id).toBe(secondWord.id);
  });

  it('compiles Hindi conversational sentences into authentic ISL signs', () => {
    const pkg = liveSentenceSigner.compileSentence('मुझे डॉक्टर चाहिए');
    expect(pkg.words.length).toBeGreaterThanOrEqual(2);
    const glosses = pkg.words.map((w) => w.islGloss);
    expect(glosses).toContain('DOCTOR');
    expect(glosses).toContain('WANT');
  });

  it('supports distinct numerals and fingerspelled manual alphabet', () => {
    const pkgNum = liveSentenceSigner.compileSentence('5 10');
    expect(pkgNum.words.length).toBe(2);
    expect(pkgNum.words[0].islGloss).toBe('NUM-FIVE');
    expect(pkgNum.words[1].islGloss).toBe('NUM-TEN');
  });
});
