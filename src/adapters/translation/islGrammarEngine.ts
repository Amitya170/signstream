/**
 * ISL Grammatical Reordering & Syntax Engine
 * 
 * Indian Sign Language (ISL) is a natural, visual-gestural language with distinct grammar:
 * 1. Topic-Comment / Subject-Object-Verb (SOV) word order (not English SVO).
 * 2. Time/Temporal markers precede the sentence (Timeline rule).
 * 3. Interrogative WH-markers (Where, What, When, Who, Why, How) are positioned at the END of the clause.
 * 4. Polar (Yes/No) questions maintain sentence structure but carry raised eyebrows (NMM).
 * 5. Negation (NOT, NO, NEVER) is placed after the predicate accompanied by a head shake (NMM).
 * 6. Copulas ("is", "am", "are", "was", "were", "है", "था") and grammatical articles ("a", "an", "the") are elided.
 * 7. Modals/desires ("want", "need", "can", "चाहिए") follow the object/theme ("WATER WANT").
 */

export interface ISLGrammarAnalysis {
  originalText: string;
  reorderedTokens: string[];
  omittedTokens: string[];
  isInterrogative: boolean;
  questionType?: 'WH_QUESTION' | 'POLAR_QUESTION';
  isNegated: boolean;
  timeMarker?: string;
  nonManualMarkers: {
    browState: 'furrowed' | 'raised' | 'neutral';
    headTilt: 'left' | 'right' | 'forward' | 'nod' | 'shake' | 'neutral';
    mouthMorpheme?: string;
  };
  explanation: string;
}

const TEMPORAL_WORDS = new Set([
  'today', 'tomorrow', 'yesterday', 'now', 'morning', 'afternoon', 'evening',
  'night', 'daily', 'later', 'soon', 'always', 'never', 'already',
  'आज', 'कल', 'परसों', 'अब', 'अभी', 'सुबह', 'दोपहर', 'शाम', 'रात', 'रोज़', 'हमेशा'
]);

const WH_QUESTION_WORDS = new Set([
  'where', 'what', 'when', 'who', 'whom', 'whose', 'why', 'how', 'which',
  'कहाँ', 'क्या', 'कब', 'कौन', 'किसने', 'किसको', 'किसका', 'क्यों', 'कैसे', 'कितना', 'कितनी', 'कितने', 'कहा'
]);

const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'neither', 'none', "don't", "doesn't", "didn't",
  "won't", "cannot", "can't", "isn't", "aren't", "wasn't", "weren't",
  'नहीं', 'ना', 'मत', 'न'
]);

const COPULA_AND_ARTICLES = new Set([
  'is', 'am', 'are', 'was', 'were', 'be', 'being', 'been',
  'do', 'does', 'did',
  'a', 'an', 'the',
  'है', 'हैं', 'हूँ', 'हो', 'था', 'थी', 'थे', 'हुआ', 'हुई', 'हुए'
]);

const PREPOSITIONS_TO_ELIDE = new Set([
  'to', 'at', 'in', 'on', 'of', 'for', 'with', 'by', 'from', 'into',
  'का', 'की', 'के', 'में', 'से', 'को', 'पर', 'ने', 'तक', 'लिए', 'द्वारा'
]);

const MODAL_DESIRE_WORDS = new Set([
  'want', 'wants', 'wanted', 'need', 'needs', 'needed', 'can', 'could', 'must', 'should',
  'चाहिए', 'चाहिएँ', 'सकता', 'सकती', 'सकते', 'पड़ेगा', 'पड़ेगी'
]);

const PRONOUNS = new Set([
  'i', 'me', 'my', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'we', 'us', 'they', 'them',
  'मैं', 'मुझे', 'मेरा', 'मेरी', 'मेरे', 'हम', 'हमें', 'हमारा', 'आप', 'आपका', 'आपकी', 'तुम', 'तुम्हारा',
  'वह', 'उसका', 'उसकी', 'यह', 'इसका', 'इसकी', 'वे', 'उनका'
]);

/**
 * Reorders a spoken/written English or Hindi sentence into authentic ISL syntax.
 */
export function parseAndReorderISL(sentence: string): ISLGrammarAnalysis {
  const trimmed = sentence.trim();
  if (!trimmed) {
    return {
      originalText: '',
      reorderedTokens: [],
      omittedTokens: [],
      isInterrogative: false,
      isNegated: false,
      nonManualMarkers: { browState: 'neutral', headTilt: 'neutral' },
      explanation: 'Empty input.'
    };
  }

  // Detect punctuation-based interrogative
  const hasQuestionMark = trimmed.endsWith('?');
  const cleanInput = trimmed.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '').toLowerCase();

  // Preserve authentic ISL idiomatic conversational formulas as single atomic units
  const CONVERSATIONAL_IDIOMS = new Set([
    'thank you',
    'how are you',
    'good morning',
    'good afternoon',
    'good evening',
    'good night',
    'welcome',
    'you are welcome',
    'धन्यवाद',
    'शुक्रिया',
    'आप कैसे हैं',
    'नमस्ते',
    'शुभ प्रभात',
    'सुप्रभात'
  ]);

  if (CONVERSATIONAL_IDIOMS.has(cleanInput)) {
    return {
      originalText: trimmed,
      reorderedTokens: [cleanInput],
      omittedTokens: [],
      isInterrogative: hasQuestionMark,
      questionType: hasQuestionMark ? 'POLAR_QUESTION' : undefined,
      isNegated: false,
      nonManualMarkers: {
        browState: hasQuestionMark ? 'raised' : 'neutral',
        headTilt: 'neutral'
      },
      explanation: 'Preserved authentic ISL idiomatic conversational formula.'
    };
  }

  const rawTokens = cleanInput.split(/\s+/).filter(Boolean);

  const omittedTokens: string[] = [];
  const timeTokens: string[] = [];
  const subjectTokens: string[] = [];
  const objectTokens: string[] = [];
  const verbTokens: string[] = [];
  const modalTokens: string[] = [];
  const negationTokens: string[] = [];
  const whTokens: string[] = [];

  let isInterrogative = hasQuestionMark;
  let isNegated = false;

  for (let idx = 0; idx < rawTokens.length; idx++) {
    const token = rawTokens[idx];

    // 1. Elide copulas and articles (ISL does not use them)
    if (COPULA_AND_ARTICLES.has(token)) {
      omittedTokens.push(token);
      continue;
    }

    // 2. Identify temporal words (Timeline first)
    if (TEMPORAL_WORDS.has(token)) {
      timeTokens.push(token);
      continue;
    }

    // 3. Identify WH question words
    if (WH_QUESTION_WORDS.has(token)) {
      whTokens.push(token);
      isInterrogative = true;
      continue;
    }

    // 4. Identify Negation words
    if (NEGATION_WORDS.has(token)) {
      negationTokens.push('not');
      isNegated = true;
      continue;
    }

    // 5. Identify Modals and desires
    if (MODAL_DESIRE_WORDS.has(token)) {
      const normalized = token.replace(/s$|ed$/, '');
      modalTokens.push(normalized);
      continue;
    }

    // 6. Elide weak prepositions/postpositions unless critical
    if (PREPOSITIONS_TO_ELIDE.has(token) && idx > 0) {
      omittedTokens.push(token);
      continue;
    }

    // 7. Pronouns & Subjects
    if (PRONOUNS.has(token) && subjectTokens.length === 0) {
      subjectTokens.push(token);
      continue;
    }

    // 8. Distinguish verbs vs objects/nouns heuristically
    const KNOWN_VERBS = [
      'help', 'come', 'go', 'eat', 'drink', 'give', 'take', 'call', 'see', 'meet', 'know', 'understand', 'stop', 'work', 'learn', 'rest',
      'मदद', 'आना', 'जाना', 'खाना', 'पीना', 'देना', 'लेना', 'बुलाना', 'देखना', 'मिलना', 'जानना', 'समझना', 'रुकना', 'काम'
    ];

    if (KNOWN_VERBS.includes(token)) {
      verbTokens.push(token);
    } else {
      objectTokens.push(token);
    }
  }

  // Determine Question Type and Non-Manual Markers (NMMs)
  let questionType: 'WH_QUESTION' | 'POLAR_QUESTION' | undefined;
  let browState: 'furrowed' | 'raised' | 'neutral' = 'neutral';
  let headTilt: 'left' | 'right' | 'forward' | 'nod' | 'shake' | 'neutral' = 'neutral';

  if (whTokens.length > 0) {
    questionType = 'WH_QUESTION';
    browState = 'furrowed'; // In ISL, WH-questions require furrowed eyebrows
    headTilt = 'forward';
  } else if (isInterrogative) {
    questionType = 'POLAR_QUESTION';
    browState = 'raised'; // Polar Yes/No questions require raised eyebrows
    headTilt = 'forward';
  } else if (isNegated) {
    browState = 'furrowed';
    headTilt = 'shake'; // Negation requires head shake
  }

  // Synthesize authentic ISL Order:
  // [TIME] -> [TOPIC / SUBJECT] -> [OBJECT / COMPLEMENT] -> [VERB] -> [MODAL] -> [NEGATION] -> [WH-QUESTION]
  const reordered: string[] = [];

  reordered.push(...timeTokens);
  reordered.push(...subjectTokens);
  reordered.push(...objectTokens);
  reordered.push(...verbTokens);
  reordered.push(...modalTokens);
  reordered.push(...negationTokens);
  reordered.push(...whTokens);

  // If no reordered tokens matched, preserve raw tokens excluding copulas/articles
  if (reordered.length === 0) {
    for (const t of rawTokens) {
      if (!COPULA_AND_ARTICLES.has(t)) {
        reordered.push(t);
      }
    }
  }

  // Construct linguistic explanation for transparency
  let explanation = 'Authentic ISL Topic-Comment structure applied.';
  if (questionType === 'WH_QUESTION') {
    explanation = `ISL WH-Question: Question word "${whTokens.join(' ')}" moved to end with furrowed brow NMM.`;
  } else if (questionType === 'POLAR_QUESTION') {
    explanation = 'ISL Polar Question: Synthesized with raised eyebrow NMM.';
  } else if (isNegated) {
    explanation = 'ISL Negation: Negation marker placed after predicate with head-shake NMM.';
  }

  return {
    originalText: sentence,
    reorderedTokens: reordered,
    omittedTokens,
    isInterrogative,
    questionType,
    isNegated,
    timeMarker: timeTokens[0],
    nonManualMarkers: {
      browState,
      headTilt,
      mouthMorpheme: isNegated ? 'tight-lips' : undefined
    },
    explanation
  };
}
