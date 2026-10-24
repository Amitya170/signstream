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
      { text: 'I need medicine', textHi: 'मुझे दवाई चाहिए', gloss: 'HOSPITAL', category: 'medical' },
      { text: 'I have fever and pain', textHi: 'मुझे बुखार और दर्द है', gloss: 'EMERGENCY', category: 'medical' },
      { text: 'Need ambulance urgently', textHi: 'तुरंत एम्बुलेंस चाहिए', gloss: 'EMERGENCY', category: 'emergency' },
      { text: 'Please help me', textHi: 'कृपया मेरी मदद करें', gloss: 'HELP', category: 'medical' },
      { text: 'I need water to drink', textHi: 'मुझे पीने के लिए पानी चाहिए', gloss: 'WATER', category: 'medical' }
    ]
  },
  {
    id: 'banking',
    name: 'Banking & Finance Counters',
    nameHi: 'बैंकिंग और वित्त काउंटर',
    description: 'Standard terminology for cash deposit, passbook update, and ATM counters.',
    icon: 'Landmark',
    phrases: [
      { text: 'I want to deposit cash', textHi: 'मैं नकद जमा करना चाहता हूँ', gloss: 'HELP', category: 'daily' },
      { text: 'Where is the ATM?', textHi: 'एटीएम कहाँ है?', gloss: 'TIME', category: 'daily' },
      { text: 'Please verify my signature', textHi: 'कृपया मेरे हस्ताक्षर सत्यापित करें', gloss: 'PLEASE', category: 'daily' },
      { text: 'I need my account balance', textHi: 'मुझे अपना खाता बैलेंस चाहिए', gloss: 'TIME', category: 'daily' }
    ]
  },
  {
    id: 'transit',
    name: 'Railway, Metro & Transit',
    nameHi: 'रेलवे, मेट्रो और पारगमन',
    description: 'Navigation and ticketing dialogues for train stations and bus terminals.',
    icon: 'Train',
    phrases: [
      { text: 'Which platform for train?', textHi: 'ट्रेन किस प्लेटफार्म पर है?', gloss: 'TIME', category: 'daily' },
      { text: 'I want to buy ticket', textHi: 'मुझे टिकट खरीदना है', gloss: 'PLEASE', category: 'daily' },
      { text: 'Is the metro delayed?', textHi: 'क्या मेट्रो लेट है?', gloss: 'TIME', category: 'daily' },
      { text: 'Stop here please', textHi: 'कृपया यहाँ रोकें', gloss: 'STOP', category: 'daily' }
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
      { text: 'Call police immediately', textHi: 'तुरंत पुलिस को बुलाओ', gloss: 'EMERGENCY', category: 'emergency' },
      { text: 'I am in danger, help me', textHi: 'मैं खतरे में हूँ, मेरी मदद करो', gloss: 'HELP', category: 'emergency' },
      { text: 'Stop immediately', textHi: 'तुरंत रुको', gloss: 'STOP', category: 'emergency' }
    ]
  }
];
