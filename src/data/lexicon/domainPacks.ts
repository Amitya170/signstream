export interface DomainCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  icon: string;
  phrases: Array<{
    text: string;
    textHi: string;
    gloss: string;
    category: string;
  }>;
}

export const DOMAIN_PACKS: DomainCategory[] = [
  {
    id: 'healthcare',
    name: 'Healthcare & Hospital',
    nameHi: 'स्वास्थ्य और अस्पताल',
    description: 'Essential medical phrases for doctor appointments, triage, and pharmacy counters.',
    icon: 'Stethoscope',
    phrases: [
      { text: 'Where is the doctor?', textHi: 'डॉक्टर कहाँ हैं?', gloss: 'DOCTOR', category: 'medical' },
      { text: 'I need medicine', textHi: 'मुझे दवाई चाहिए', gloss: 'MEDICINE', category: 'medical' },
      { text: 'I have fever and pain', textHi: 'मुझे बुखार और दर्द है', gloss: 'FEVER', category: 'medical' },
      { text: 'Need ambulance urgently', textHi: 'तुरंत एम्बुलेंस चाहिए', gloss: 'AMBULANCE', category: 'emergency' },
      { text: 'Please help me', textHi: 'कृपया मेरी मदद करें', gloss: 'HELP', category: 'medical' },
      { text: 'I need water to drink', textHi: 'मुझे पीने के लिए पानी चाहिए', gloss: 'WATER', category: 'medical' }
    ]
  },
  {
    id: 'transit',
    name: 'Railway, Metro & Transit',
    nameHi: 'रेलवे, मेट्रो और पारगमन',
    description: 'Navigation and ticketing dialogues for train stations and bus terminals.',
    icon: 'Train',
    phrases: [
      { text: 'Where is the train?', textHi: 'ट्रेन कहाँ है?', gloss: 'TRAIN', category: 'transit' },
      { text: 'I want to buy ticket', textHi: 'मुझे टिकट खरीदना है', gloss: 'TICKET', category: 'transit' },
      { text: 'Where is the metro station?', textHi: 'मेट्रो स्टेशन कहाँ है?', gloss: 'METRO', category: 'transit' },
      { text: 'Where is the bus?', textHi: 'बस कहाँ है?', gloss: 'BUS', category: 'transit' },
      { text: 'Stop here please', textHi: 'कृपया यहाँ रोकें', gloss: 'STOP', category: 'transit' },
      { text: 'What is the time?', textHi: 'समय क्या है?', gloss: 'TIME', category: 'transit' }
    ]
  },
  {
    id: 'banking',
    name: 'Banking & Finance Counters',
    nameHi: 'बैंकिंग और वित्त काउंटर',
    description: 'Standard terminology for cash deposit, passbook update, and ATM counters.',
    icon: 'Landmark',
    phrases: [
      { text: 'Where is the bank?', textHi: 'बैंक कहाँ है?', gloss: 'BANK', category: 'banking' },
      { text: 'I need cash money', textHi: 'मुझे नकद पैसे चाहिए', gloss: 'MONEY', category: 'banking' },
      { text: 'Please verify my signature', textHi: 'कृपया मेरे हस्ताक्षर सत्यापित करें', gloss: 'SIGNATURE', category: 'banking' },
      { text: 'Where is my card?', textHi: 'मेरा कार्ड कहाँ है?', gloss: 'CARD', category: 'banking' }
    ]
  },
  {
    id: 'family',
    name: 'Family & Relations',
    nameHi: 'परिवार और रिश्ते',
    description: 'Conversational signs for family members and social connections.',
    icon: 'Users',
    phrases: [
      { text: 'This is my mother', textHi: 'यह मेरी माँ हैं', gloss: 'MOTHER', category: 'family' },
      { text: 'This is my father', textHi: 'यह मेरे पिता हैं', gloss: 'FATHER', category: 'family' },
      { text: 'We are a family', textHi: 'हमारा परिवार है', gloss: 'FAMILY', category: 'family' },
      { text: 'You are my friend', textHi: 'आप मेरे दोस्त हैं', gloss: 'FRIEND', category: 'family' },
      { text: 'Nice to meet you', textHi: 'आपसे मिलकर खुशी हुई', gloss: 'MEET', category: 'family' },
      { text: 'What is your name?', textHi: 'आपका नाम क्या है?', gloss: 'NAME', category: 'family' }
    ]
  },
  {
    id: 'emergency',
    name: 'Emergency & Safety (SOS)',
    nameHi: 'आपातकालीन और सुरक्षा (SOS)',
    description: 'High-priority distress phrases for first responders, police, and security.',
    icon: 'AlertOctagon',
    phrases: [
      { text: 'Emergency! I am Deaf', textHi: 'आपातकाल! मैं बधिर हूँ', gloss: 'EMERGENCY', category: 'emergency' },
      { text: 'I need safe shelter', textHi: 'मुझे सुरक्षित जगह चाहिए', gloss: 'SAFE', category: 'emergency' },
      { text: 'Please call ambulance', textHi: 'कृपया एम्बुलेंस बुलाओ', gloss: 'AMBULANCE', category: 'emergency' },
      { text: 'Stop immediately', textHi: 'तुरंत रुको', gloss: 'STOP', category: 'emergency' }
    ]
  }
];
