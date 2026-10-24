import { describe, it, expect } from 'vitest';
import { parseAndReorderISL } from '../adapters/translation/islGrammarEngine';

describe('ISL Grammatical Reordering & Syntax Engine', () => {
  it('reorders English SVO WH-questions to ISL Topic-Comment order with furrowed brow NMM', () => {
    const analysis = parseAndReorderISL('Where is the doctor?');
    
    // Expected ISL: [doctor] [where]
    expect(analysis.isInterrogative).toBe(true);
    expect(analysis.questionType).toBe('WH_QUESTION');
    expect(analysis.nonManualMarkers.browState).toBe('furrowed');
    expect(analysis.nonManualMarkers.headTilt).toBe('forward');
    expect(analysis.omittedTokens).toContain('is');
    expect(analysis.omittedTokens).toContain('the');
    expect(analysis.reorderedTokens).toEqual(['doctor', 'where']);
  });

  it('correctly places temporal timeline markers at the beginning of the sentence', () => {
    const analysis = parseAndReorderISL('I will come tomorrow');
    
    // In ISL, timeline comes first: [tomorrow] [i] [come]
    expect(analysis.timeMarker).toBe('tomorrow');
    expect(analysis.reorderedTokens[0]).toBe('tomorrow');
    expect(analysis.reorderedTokens).toContain('come');
  });

  it('handles negation with head shake NMM and moves negation to predicate end', () => {
    const analysis = parseAndReorderISL('I do not understand');
    
    expect(analysis.isNegated).toBe(true);
    expect(analysis.nonManualMarkers.headTilt).toBe('shake');
    expect(analysis.nonManualMarkers.browState).toBe('furrowed');
    expect(analysis.reorderedTokens).toEqual(['i', 'understand', 'not']);
  });

  it('identifies polar Yes/No questions and applies raised eyebrow NMM', () => {
    const analysis = parseAndReorderISL('You need water?');
    
    expect(analysis.isInterrogative).toBe(true);
    expect(analysis.questionType).toBe('POLAR_QUESTION');
    expect(analysis.nonManualMarkers.browState).toBe('raised');
  });
});
