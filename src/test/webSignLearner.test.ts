import { describe, it, expect } from 'vitest';
import { webSignLearner } from '../adapters/learning/webSignLearner';
import { liveSentenceSigner } from '../adapters/translation/liveSentenceSigner';
import { lexiconManager } from '../data/lexicon';

describe('Web Sign Auto-Learner & AI Semantic Improviser', () => {
  it('loads and registers 114+ signs from Open Web Knowledge Base', () => {
    webSignLearner.registerWebPack();
    const allClips = lexiconManager.getAllClips();
    expect(allClips.length).toBeGreaterThanOrEqual(220);

    const readClip = lexiconManager.findClipByGloss('READ');
    expect(readClip).toBeDefined();
    expect(readClip?.labels.en).toBe('Read');
    expect(readClip?.labels.hi).toBe('पढ़ना');
  });

  it('resolves lemmatized and inflected forms from web knowledge base', () => {
    const resReading = webSignLearner.getOrLearnSign('reading');
    expect(resReading).toBeDefined();
    expect(resReading?.clip.gloss).toBe('READ');

    const resBooks = webSignLearner.getOrLearnSign('books');
    expect(resBooks).toBeDefined();
    expect(resBooks?.clip.gloss).toBe('BOOK');
  });

  it('dynamically synthesizes and auto-learns novel concepts via Semantic Improviser', () => {
    const resNovel = webSignLearner.getOrLearnSign('nanotechnology', { allowImprovisation: true });
    expect(resNovel).toBeDefined();
    expect(resNovel?.isNewlyLearned).toBe(true);
    expect(resNovel?.clip.gloss).toBe('NANOTECHNOLOGY');
    expect(resNovel?.clip.provenance.source).toContain('Improviser');
    expect(resNovel?.clip.keyframes.length).toBe(4);

    // Verify forward-signing space kinematics (z > 0)
    for (const kf of resNovel!.clip.keyframes) {
      expect(kf.rightHand?.position?.[2]).toBeGreaterThanOrEqual(0.18);
    }
  });

  it('compiles sentences with web-learned words without falling back to letter spelling', () => {
    const pkg = liveSentenceSigner.compileSentence('Teacher is reading book');
    expect(pkg.words.length).toBeGreaterThanOrEqual(2);

    const glosses = pkg.words.map((w) => w.islGloss);
    expect(glosses).toContain('TEACHER');
    expect(glosses).toContain('READ');

    // Neither TEACHER nor READ should be fingerspelled
    const teacherWord = pkg.words.find((w) => w.islGloss === 'TEACHER');
    expect(teacherWord?.isFingerspelled).toBe(false);
  });
});
