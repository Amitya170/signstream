import { describe, it, expect } from 'vitest';
import { neuralSemanticMatcher } from '../adapters/nlp/neuralSemanticMatcher';
import { liveSentenceSigner } from '../adapters/translation/liveSentenceSigner';

describe('Neural Semantic Matcher (Hugging Face Xenova/all-MiniLM-L6-v2)', () => {
  it('loads semantic concept embeddings successfully', () => {
    const status = neuralSemanticMatcher.getStatus();
    expect(status.modelName).toContain('Xenova/all-MiniLM-L6-v2');
    expect(status.conceptCount).toBeGreaterThanOrEqual(70);
    expect(status.dimensions).toBe(384);
  });

  it('matches synonyms and semantic descriptions to authentic ISL glosses', () => {
    const thankMatch = neuralSemanticMatcher.findBestMatchSync('gratitude');
    expect(thankMatch).not.toBeNull();
    expect(thankMatch?.gloss).toBe('THANK-YOU');

    const doctorMatch = neuralSemanticMatcher.findBestMatchSync('physician');
    expect(doctorMatch).not.toBeNull();
    expect(doctorMatch?.gloss).toBe('DOCTOR');

    const timeMatch = neuralSemanticMatcher.findBestMatchSync('wristwatch');
    expect(timeMatch).not.toBeNull();
    expect(timeMatch?.gloss).toBe('TIME');

    const waterMatch = neuralSemanticMatcher.findBestMatchSync('hydration');
    expect(waterMatch).not.toBeNull();
    expect(waterMatch?.gloss).toBe('WATER');
  });

  it('integrates seamlessly into liveSentenceSigner for conversational sentences', () => {
    const res = liveSentenceSigner.compileSentence('deepest gratitude to you');
    expect(res.words.length).toBeGreaterThan(0);
    const hasThankYou = res.words.some(w => w.islGloss === 'THANK-YOU');
    expect(hasThankYou).toBe(true);
  });
});
