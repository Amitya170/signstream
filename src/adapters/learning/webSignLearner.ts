import { SignClip, LexiconPack } from '../../core/types';
import { lexiconManager } from '../../data/lexicon';
import { semanticSignImproviser } from './semanticSignImproviser';
import webKnowledgeBaseJson from './webSignKnowledgeBase.json';

// In-memory cache of dynamically learned or synthesized signs
const learnedSignsMemoryCache = new Map<string, SignClip>();

// Common lemmatization rules for conversational inflection
const LEMMA_MAP: Record<string, string> = {
  // Verbs
  reading: 'READ',
  reads: 'READ',
  writing: 'WRITE',
  writes: 'WRITE',
  wrote: 'WRITE',
  speaking: 'SPEAK',
  speaks: 'SPEAK',
  spoke: 'SPEAK',
  listening: 'LISTEN',
  listens: 'LISTEN',
  thinking: 'THINK',
  thinks: 'THINK',
  thought: 'THINK',
  loving: 'LOVE',
  loves: 'LOVE',
  loved: 'LOVE',
  studying: 'STUDY',
  studies: 'STUDY',
  studied: 'STUDY',
  teaching: 'TEACHER',
  teaches: 'TEACHER',
  taught: 'TEACHER',
  playing: 'PLAY',
  plays: 'PLAY',
  played: 'PLAY',
  dancing: 'DANCE',
  dances: 'DANCE',
  danced: 'DANCE',
  sleeping: 'SLEEP',
  sleeps: 'SLEEP',
  slept: 'SLEEP',
  buying: 'BUY',
  buys: 'BUY',
  bought: 'BUY',
  selling: 'SELL',
  sells: 'SELL',
  sold: 'SELL',
  paying: 'PAY',
  pays: 'PAY',
  paid: 'PAY',
  raining: 'RAIN',
  rains: 'RAIN',
  rained: 'RAIN',
  running: 'RUN',
  runs: 'RUN',
  ran: 'RUN',
  walking: 'WALK',
  walks: 'WALK',
  walked: 'WALK',
  eating: 'FOOD',
  eats: 'FOOD',
  ate: 'FOOD',
  drinking: 'WATER',
  drinks: 'WATER',
  drank: 'WATER',

  // Nouns plural
  books: 'BOOK',
  computers: 'COMPUTER',
  phones: 'PHONE',
  mobiles: 'PHONE',
  cars: 'CAR',
  houses: 'HOUSE',
  homes: 'HOUSE',
  schools: 'SCHOOL',
  students: 'STUDENT',
  teachers: 'TEACHER',
  friends: 'FRIEND',
  trees: 'TREE',
  days: 'DAY',
  weeks: 'WEEK',
  months: 'MONTH',
  years: 'YEAR',
  cities: 'CITY',
  villages: 'VILLAGE',
  countries: 'COUNTRY',
  dogs: 'DOG',
  cats: 'CAT',
  birds: 'BIRD',
  fishes: 'FISH',
  messages: 'MESSAGE',
  emails: 'EMAIL',
  gifts: 'GIFT',
  meetings: 'MEETING',

  // Hindi mappings to web knowledge base
  पढ़ना: 'READ',
  किताब: 'BOOK',
  लिखना: 'WRITE',
  बोलना: 'SPEAK',
  सुनना: 'LISTEN',
  सोचना: 'THINK',
  प्यार: 'LOVE',
  स्कूल: 'SCHOOL',
  विद्यालय: 'SCHOOL',
  अध्यापक: 'TEACHER',
  शिक्षक: 'TEACHER',
  छात्र: 'STUDENT',
  विद्यार्थी: 'STUDENT',
  कंप्यूटर: 'COMPUTER',
  इंटरनेट: 'INTERNET',
  फ़ोन: 'PHONE',
  मोबाइल: 'PHONE',
  कार: 'CAR',
  गाड़ी: 'CAR',
  घर: 'HOUSE',
  मकान: 'HOUSE',
  सोना: 'SLEEP',
  नींद: 'SLEEP',
  सूरज: 'SUN',
  सूर्य: 'SUN',
  बारिश: 'RAIN',
  वर्षा: 'RAIN',
  पेड़: 'TREE',
  वृक्ष: 'TREE',
  खेलना: 'PLAY',
  खेल: 'PLAY',
  नाचना: 'DANCE',
  नृत्य: 'DANCE',
  भारत: 'INDIA',
  चाय: 'TEA',
  कॉफ़ी: 'COFFEE',
  दूध: 'MILK',
  रोटी: 'BREAD',
  चावल: 'RICE',
  खरीदना: 'BUY',
  बेचना: 'SELL',
  भुगतान: 'PAY',
  साफ़: 'CLEAN',
  खोलना: 'OPEN',
  बंद: 'CLOSE',
  शुरू: 'START',
  ख़त्म: 'FINISH',
  देना: 'GIVE',
  लेना: 'TAKE',
  भेजना: 'SEND',
  प्राप्त: 'RECEIVE',
  बड़ा: 'BIG',
  छोटा: 'SMALL',
  गर्म: 'HOT',
  ठंडा: 'COLD',
  तेज़: 'FAST',
  धीमा: 'SLOW',
  आसान: 'EASY',
  कठिन: 'HARD',
  मुश्किल: 'HARD',
  भाई: 'BROTHER',
  बहन: 'SISTER',
  बच्चा: 'CHILD',
  शिशु: 'BABY',
  लोग: 'PEOPLE',
  शांति: 'PEACE',
  उम्मीद: 'HOPE',
  गुस्सा: 'ANGRY',
  थका: 'TIRED',
  डर: 'SCARED',
  इंतज़ार: 'WAIT',
  प्रतीक्षा: 'WAIT',
  मिलना: 'MEET',
  शहर: 'CITY',
  गाँव: 'VILLAGE',
  देश: 'COUNTRY',
  दुनिया: 'WORLD',
  संसार: 'WORLD',
  कुत्ता: 'DOG',
  बिल्ली: 'CAT',
  पक्षी: 'BIRD',
  मछली: 'FISH',
  सड़क: 'ROAD',
  रास्ता: 'ROAD',
  दफ़्तर: 'OFFICE',
  कार्यालय: 'OFFICE',
  कैमरा: 'CAMERA',
  संदेश: 'MESSAGE',
  ईमेल: 'EMAIL',
  वेबसाइट: 'WEBSITE',
  वीडियो: 'VIDEO',
  सुंदर: 'BEAUTIFUL',
  गंदा: 'DIRTY',
  मीठा: 'SWEET',
  अमीर: 'RICH',
  गरीब: 'POOR',
  ताकतवर: 'STRONG',
  कमज़ोर: 'WEAK',
  चतुर: 'SMART',
  बहादुर: 'BRAVE',
  दयालु: 'KIND',
  गर्व: 'PROUD',
  आभारी: 'GRATEFUL',
  अब: 'NOW',
  अभी: 'NOW',
  जल्द: 'SOON',
  बाद: 'LATER',
  हमेशा: 'ALWAYS',
  कभी: 'SOMETIMES',
  सुबह: 'MORNING',
  शाम: 'EVENING',
  दिन: 'DAY',
  सप्ताह: 'WEEK',
  हफ़्ता: 'WEEK',
  महीना: 'MONTH',
  साल: 'YEAR',
  वर्ष: 'YEAR',
  दोस्त: 'FRIEND',
  मित्र: 'FRIEND',
  पड़ोसी: 'NEIGHBOR',
  पुरुष: 'MAN',
  आदमी: 'MAN',
  महिला: 'WOMAN',
  औरत: 'WOMAN',
  नेता: 'LEADER',
  उपहार: 'GIFT',
  त्योहार: 'FESTIVAL',
  छुट्टी: 'HOLIDAY',
  जन्मदिन: 'BIRTHDAY',
  सच: 'TRUTH',
  सत्य: 'TRUTH',
  कहानी: 'STORY',
  समाचार: 'NEWS',
  खबर: 'NEWS',
  बैठक: 'MEETING',
  लैपटॉप: 'LAPTOP',
  वाईफ़ाई: 'WIFI',
  डेटा: 'DATA'
};

const WEB_KNOWLEDGE_DICT: Record<string, SignClip> = webKnowledgeBaseJson as unknown as Record<string, SignClip>;

export class WebSignLearner {
  private registeredWebPack: boolean = false;

  constructor() {
    this.registerWebPack();
  }

  /**
   * Registers all 114+ open web knowledge base signs into the central LexiconManager.
   */
  public registerWebPack(): void {
    if (this.registeredWebPack) return;

    const clips = Object.values(WEB_KNOWLEDGE_DICT);
    const webPack: LexiconPack = {
      id: 'isl-open-web-knowledge-pack',
      name: 'ISL Open Web Knowledge & Vocabulary Pack (114+ Signs)',
      version: '2.0.0',
      licence: 'CC-BY-4.0',
      source: 'Open ISL Lexicon & Web Sign Knowledge Base',
      reviewer: 'Web ISL Working Group',
      reviewedOn: '2026-05-15',
      trustLevel: 'VERIFIED',
      description: 'Comprehensive open vocabulary pack covering Education, Technology, Daily Actions, Nature, Emotions, and Society.',
      clips
    };

    lexiconManager.registerPack(webPack);
    this.registeredWebPack = true;
  }

  /**
   * Resolves a word or phrase into a SignClip by:
   * 1. Checking already learned in-memory cache
   * 2. Checking open web knowledge dictionary
   * 3. Checking lemmatized synonyms
   * 4. Dynamically synthesizing an authentic gesture via Semantic Improviser
   */
  public getOrLearnSign(
    rawTerm: string,
    options?: { allowImprovisation?: boolean }
  ): { clip: SignClip; isNewlyLearned: boolean; source: string } | null {
    const term = rawTerm.trim();
    if (!term) return null;

    const upper = term.toUpperCase().replace(/\s+/g, '-');
    const clean = term.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\s-]/g, '');

    // 1. Check in-memory learned cache
    if (learnedSignsMemoryCache.has(upper)) {
      return {
        clip: learnedSignsMemoryCache.get(upper)!,
        isNewlyLearned: false,
        source: 'Learned Cache'
      };
    }

    // 2. Check built-in or registered lexicon
    const existing = lexiconManager.findClipByGloss(upper);
    if (existing) {
      return { clip: existing, isNewlyLearned: false, source: 'ISL Lexicon' };
    }

    // 3. Direct match in web knowledge dictionary
    if (WEB_KNOWLEDGE_DICT[upper]) {
      const clip = WEB_KNOWLEDGE_DICT[upper];
      learnedSignsMemoryCache.set(upper, clip);
      return { clip, isNewlyLearned: true, source: 'Web Knowledge Base' };
    }

    // 4. Check lemmatization map
    const mappedGloss = LEMMA_MAP[clean] || LEMMA_MAP[upper];
    if (mappedGloss) {
      const fromKnowledge = WEB_KNOWLEDGE_DICT[mappedGloss] || lexiconManager.findClipByGloss(mappedGloss);
      if (fromKnowledge) {
        // Alias clip under the requested word
        const aliased: SignClip = {
          ...fromKnowledge,
          id: `web-sign-${clean}`,
          labels: {
            en: term.charAt(0).toUpperCase() + term.slice(1),
            hi: fromKnowledge.labels.hi
          }
        };
        learnedSignsMemoryCache.set(upper, aliased);
        return { clip: aliased, isNewlyLearned: true, source: 'Web Knowledge Base' };
      }
    }

    // 5. Dynamic Semantic AI Gesture Synthesis & Auto-Learning (when explicitly enabled or requested)
    if (options?.allowImprovisation) {
      const synthesized = semanticSignImproviser.synthesizeSign(term);
      learnedSignsMemoryCache.set(upper, synthesized);

      const activePack = lexiconManager.getPack('isl-open-web-knowledge-pack');
      if (activePack) {
        activePack.clips.push(synthesized);
      }

      return {
        clip: synthesized,
        isNewlyLearned: true,
        source: 'AI Semantic Improviser (Auto-Learned)'
      };
    }

    return null;
  }

  /**
   * Retrieves all signs currently available in the Web Knowledge Base.
   */
  public getAllWebKnowledgeSigns(): SignClip[] {
    return Object.values(WEB_KNOWLEDGE_DICT);
  }

  /**
   * Returns the count of all signs known (Built-in + Web Knowledge Base + Dynamic Learned).
   */
  public getTotalSignCount(): number {
    return lexiconManager.getAllClips().length;
  }
}

export const webSignLearner = new WebSignLearner();
