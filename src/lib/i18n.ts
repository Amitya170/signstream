/**
 * Project SignStream - Internationalization (i18n)
 * English and Hindi UI strings.
 * Note: Hindi translations marked with [MT] are machine-translated initial strings awaiting Deaf native-speaker verification.
 */

export type SupportedLanguage = 'en' | 'hi';

export const TRANSLATIONS = {
  en: {
    // Header & Prototype
    appTitle: 'Project SignStream',
    prototypeBadge: 'Early Research Prototype',
    prototypeNotice: 'Not a certified ISL interpreter. Designed for exploration, research, and guided communication.',
    aboutPrototype: 'About this prototype',

    // Nav
    navHome: 'Home',
    navLearn: 'Learn',
    navMemory: 'Memory',
    navSettings: 'Settings',

    // Home Cards
    cardSpeechToSignTitle: 'Speech to Sign',
    cardSpeechToSignDesc: 'Speak or type words in English/Hindi to view authentic ISL sign keyframes on an interactive avatar.',
    cardSignToSpeechTitle: 'Sign to Speech',
    cardSignToSpeechDesc: 'Camera-based on-device landmark recognition with confirmation before speaking aloud (DEMO).',
    cardConversationTitle: 'Conversation Mode',
    cardConversationDesc: 'Side-by-side accessible timeline with large-text presentation for face-to-face interaction.',

    // Speech to Sign
    inputPlaceholder: 'Type or speak a word or phrase (e.g., Namaste, Thank you, Help)...',
    translateBtn: 'Translate to Sign',
    listeningBtn: 'Listening...',
    startMicBtn: 'Speak',
    stopMicBtn: 'Stop Mic',
    replayBtn: 'Replay',
    pauseBtn: 'Pause',
    stepBtn: 'Step Forward',
    loopBtn: 'Loop',
    speedLabel: 'Playback Speed',
    unsupportedWarning: 'Sign translation is not available for this phrase.',
    webSpeechNotice: 'Browser Web Speech API in use. Note: some browsers may stream audio to external speech engines.',
    coveragePartial: 'Partial match: Some words are not available in the ISL lexicon.',
    viewProvenance: 'View Provenance & Trust Details',

    // Sign to Speech
    cameraGateTitle: 'Camera Permission & Privacy Gate',
    cameraGateNotice: 'All video frames and hand landmarks are processed 100% on your local device. No video or biometric data is ever recorded, stored, or sent to any server.',
    grantCameraBtn: 'Grant On-Device Camera Access',
    revokeCameraBtn: 'Stop & Revoke Camera Access',
    cameraActive: 'Camera Active (On-Device Local Processing)',
    switchCamera: 'Switch Camera',
    mirrorToggle: 'Mirror Camera',
    overlayToggle: 'Landmarks Overlay',
    recognizedSign: 'Recognized Sign (DEMO)',
    confidenceScore: 'Match Confidence',
    confirmAndSpeakBtn: 'Confirm & Speak Aloud',
    demoLimitations: 'Demo Recognizer Active: Recognizes template handshapes only (e.g. Namaste, Thank You, Yes, No, Help). Not a full ISL recognizer.',

    // Conversation Mode
    conversationTitle: 'Live Conversation',
    showOtherPersonBtn: 'Show to Other Person',
    exitFullScreenBtn: 'Exit Full Screen',
    quickPhrasesTitle: 'Quick Phrases',
    speakAloudAction: 'Speak Aloud',
    showSignAction: 'Show Sign',
    copyAction: 'Copy Text',
    deleteAction: 'Delete',

    // Learn
    learnTitle: 'ISL Sign Explorer & Learning',
    learnSubtitle: 'Explore verified and demo signs, record personal community templates, and inspect provenance.',
    searchPlaceholder: 'Search ISL signs or glosses...',
    recordCustomSignTitle: 'Record Personal Custom Sign',
    recordCustomNotice: 'Stored locally as landmark templates. Labelled COMMUNITY/personal and used only for your own device.',
    importPackTitle: 'Import Open Lexicon Pack',
    importPackNotice: 'Import verified open-license dataset packs with explicit licensing and reviewer sign-offs.',

    // Memory
    memoryTitle: 'Local-First Memory & History',
    memorySubtitle: 'All conversations, frequent vocabulary, and personal corrections remain safely in your browser IndexedDB.',
    pauseMemoryToggle: 'Pause Memory Storage',
    exportBackupBtn: 'Export Backup (JSON)',
    importBackupBtn: 'Import Backup',
    clearAllBtn: 'Forget Everything',
    correctionsTitle: 'Saved Voice Corrections',
    storageMeter: 'Local Storage Used',

    // Settings
    settingsTitle: 'Settings & Preferences',
    textSizeLabel: 'Text Scaling',
    themeLabel: 'Visual Theme',
    reducedMotionLabel: 'Reduce Motion & Animations',
    avatarAppearance: 'Avatar Rig Appearance',
    ttsSettings: 'Voice & Speech Output',
    whisperModel: 'Offline Whisper STT Model'
  },
  hi: {
    // Header & Prototype
    appTitle: 'प्रोजेक्ट साइनस्ट्रीम [MT]',
    prototypeBadge: 'प्रारंभिक शोध प्रोटोटाइप [MT]',
    prototypeNotice: 'यह कोई प्रमाणित आईएसएल (ISL) दुभाषिया नहीं है। यह शोध, अन्वेषण और सुलभ संवाद के लिए बनाया गया है। [MT]',
    aboutPrototype: 'इस प्रोटोटाइप के बारे में [MT]',

    // Nav
    navHome: 'होम [MT]',
    navLearn: 'सीखें [MT]',
    navMemory: 'मेमोरी [MT]',
    navSettings: 'सेटिंग्स [MT]',

    // Home Cards
    cardSpeechToSignTitle: 'आवाज से संकेत (Speech to Sign) [MT]',
    cardSpeechToSignDesc: 'अंग्रेजी या हिंदी में बोलें या लिखें और 3D अवतार पर प्रामाणिक आईएसएल संकेत देखें। [MT]',
    cardSignToSpeechTitle: 'संकेत से आवाज (Sign to Speech) [MT]',
    cardSignToSpeechDesc: 'डिवाइस पर ही कैमरा लैंडमार्क पहचान और पुष्टि के बाद आवाज में उच्चारण (डेमो)। [MT]',
    cardConversationTitle: 'वार्तालाप मोड (Conversation Mode) [MT]',
    cardConversationDesc: 'सामने वाले व्यक्ति को स्पष्ट संवाद के लिए बड़े अक्षरों और उच्च कंट्रास्ट वाली स्क्रीन। [MT]',

    // Speech to Sign
    inputPlaceholder: 'कोई शब्द या वाक्य लिखें या बोलें (उदा: नमस्ते, धन्यवाद, मदद)... [MT]',
    translateBtn: 'संकेत में बदलें [MT]',
    listeningBtn: 'सुन रहा है... [MT]',
    startMicBtn: 'बोलें [MT]',
    stopMicBtn: 'माइक रोकें [MT]',
    replayBtn: 'दोबारा चलाएं [MT]',
    pauseBtn: 'रोकें [MT]',
    stepBtn: 'आगे बढ़ाएं [MT]',
    loopBtn: 'लगातार चलाएं [MT]',
    speedLabel: 'गति [MT]',
    unsupportedWarning: 'इस वाक्यांश के लिए सांकेतिक अनुवाद उपलब्ध नहीं है। [MT]',
    webSpeechNotice: 'ब्राउज़र वेब स्पीच सक्रिय है। कृपया ध्यान दें कि कुछ ब्राउज़र ऑडियो को बाहरी सर्वर पर भेज सकते हैं। [MT]',
    coveragePartial: 'आंशिक मिलान: कुछ शब्दों के लिए आईएसएल संकेत उपलब्ध नहीं हैं। [MT]',
    viewProvenance: 'सत्यापन और स्रोत विवरण [MT]',

    // Sign to Speech
    cameraGateTitle: 'कैमरा अनुमति और गोपनीयता [MT]',
    cameraGateNotice: 'सभी वीडियो और हाथ के लैंडमार्क केवल आपके डिवाइस पर प्रोसेस होते हैं। कोई भी डेटा सर्वर पर नहीं भेजा जाता। [MT]',
    grantCameraBtn: 'कैमरा अनुमति दें [MT]',
    revokeCameraBtn: 'कैमरा बंद करें [MT]',
    cameraActive: 'कैमरा सक्रिय (केवल डिवाइस पर) [MT]',
    switchCamera: 'कैमरा बदलें [MT]',
    mirrorToggle: 'मिरर टॉगल [MT]',
    overlayToggle: 'लैंडमार्क ओवरले [MT]',
    recognizedSign: 'पहचाना गया संकेत (डेमो) [MT]',
    confidenceScore: 'सटीकता [MT]',
    confirmAndSpeakBtn: 'पुष्टि करें और बोलें [MT]',
    demoLimitations: 'डेमो मोड: केवल पूर्व-निर्धारित संकेत पहचानता है (नमस्ते, धन्यवाद, हाँ, नहीं, मदद)। [MT]',

    // Conversation Mode
    conversationTitle: 'सीधा संवाद [MT]',
    showOtherPersonBtn: 'दूसरे व्यक्ति को दिखाएं [MT]',
    exitFullScreenBtn: 'फुल स्क्रीन से बाहर निकलें [MT]',
    quickPhrasesTitle: 'त्वरित वाक्यांश [MT]',
    speakAloudAction: 'आवाज में बोलें [MT]',
    showSignAction: 'संकेत देखें [MT]',
    copyAction: 'कॉपी करें [MT]',
    deleteAction: 'हटाएं [MT]',

    // Learn
    learnTitle: 'आईएसएल संकेत अन्वेषक और शिक्षण [MT]',
    learnSubtitle: 'प्रमाणित व डेमो संकेत देखें, अपने निजी संकेत रिकॉर्ड करें और स्रोत विवरण जांचें। [MT]',
    searchPlaceholder: 'संकेत या शब्द खोजें... [MT]',
    recordCustomSignTitle: 'अपना व्यक्तिगत संकेत रिकॉर्ड करें [MT]',
    recordCustomNotice: 'यह केवल आपके डिवाइस पर सुरक्षित रहेगा और COMMUNITY/personal के रूप में चिन्हित होगा। [MT]',
    importPackTitle: 'ओपन लेक्सिकॉन पैक आयात करें [MT]',
    importPackNotice: 'खुले लाइसेंस वाले डेटासेट पैक आयात करें जिनमें समीक्षक की अनुमति शामिल हो। [MT]',

    // Memory
    memoryTitle: 'लोकल-फर्स्ट मेमोरी [MT]',
    memorySubtitle: 'सभी बातचीत और व्यक्तिगत सुधार आपके ब्राउज़र में सुरक्षित रहते हैं। [MT]',
    pauseMemoryToggle: 'मेमोरी स्टोरेज रोकें [MT]',
    exportBackupBtn: 'बैकअप डाउनलोड करें (JSON) [MT]',
    importBackupBtn: 'बैकअप अपलोड करें [MT]',
    clearAllBtn: 'सब कुछ मिटाएं [MT]',
    correctionsTitle: 'सुरक्षित आवाज सुधार [MT]',
    storageMeter: 'उपयोग किया गया स्टोरेज [MT]',

    // Settings
    settingsTitle: 'सेटिंग्स और प्राथमिकताएं [MT]',
    textSizeLabel: 'टेक्स्ट का आकार [MT]',
    themeLabel: 'थीम [MT]',
    reducedMotionLabel: 'मोशन कम करें [MT]',
    avatarAppearance: 'अवतार का रूप [MT]',
    ttsSettings: 'आवाज और उच्चारण [MT]',
    whisperModel: 'ऑफलाइन व्हिस्पर मॉडल [MT]'
  }
};

export function getTranslation(lang: SupportedLanguage, key: keyof typeof TRANSLATIONS.en): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}
