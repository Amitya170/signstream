# Project SignStream: Architecture & Technical Design

Project SignStream is an open-source, mobile-first, local-first accessibility Progressive Web Application (PWA). It bridges Indian Sign Language (ISL), speech, and text while strictly adhering to linguistic honesty, verified trust levels, and total device privacy.

---

## 1. System Architecture Overview

The system is built on an **Adapter Pattern** where every external interface (Speech-to-Text, Text-to-Speech, Sign Recognition, Sign Animation, and Machine Translation) is decoupled behind strict TypeScript interfaces.

```
+-------------------------------------------------------------------------+
|                              REACT UI LAYER                             |
|  [SpeechToSign]   [SignToSpeech]   [Conversation]   [Learn]   [Memory]  |
+-------------------------------------------------------------------------+
       |                  |                |             |         |
+-------------------------------------------------------------------------+
|                          CORE ADAPTERS (PLUGGABLE)                      |
|                                                                         |
|  [STT Adapter]           [TTS Adapter]          [Sign Recognition]      |
|   - WebSpeech             - SpeechSynthesis      - LandmarkTemplate     |
|   - WhisperLocal (Opt-in) - MockTts              - MLModelStub          |
|                                                                         |
|  [Sign Animation]        [ISL Translation]                              |
|   - ThreeAvatar (3D Rig)  - LexiconExactLookup (Strict non-generative)  |
|   - SvgAvatar (2D Rig)    - Future Model Stub                           |
+-------------------------------------------------------------------------+
       |                                                 |
+---------------------------------------+   +-----------------------------+
|        LOCAL-FIRST STORAGE (Dexie)    |   |     LEXICON PACK REGISTRY   |
|  - IndexedDB: Conversations, Phrases  |   |  - JSON Declarative Packs   |
|  - Custom Signs & Voice Corrections   |   |  - Strict Provenance/Trust  |
|  - Local Error Reports (Exportable)   |   |  - Reviewer Sign-off Gate   |
+---------------------------------------+   +-----------------------------+
```

---

## 2. Pluggable Adapters

### 2.1 Speech-to-Text (`src/adapters/stt/`)
- **`SpeechToTextAdapter`**: Base contract with `start(language, callbacks)`, `stop()`, `isSupported()`, and `getPrivacyNotice()`.
- **`WebSpeechAdapter`**: Uses browser native `SpeechRecognition` / `webkitSpeechRecognition`. Displays an active privacy warning informing users that some browsers send audio packets to external cloud services.
- **`WhisperLocalAdapter`**: On-device speech recognition via Transformers.js (`@xenova/transformers`). Transparently shows quantized model size (~39 MB), progress bar, and guarantees zero audio egress.
- **`MockSttAdapter`**: Fallback adapter for automated testing and unsupported browsers.

### 2.2 Text-to-Speech (`src/adapters/tts/`)
- **`BrowserSpeechSynthesisAdapter`**: Wraps `window.speechSynthesis`. Automatically indexes system voices, filters Indian accent variants (`en-IN`, `hi-IN`), and provides real-time control over speech rate (0.5x to 1.5x) and pitch.

### 2.3 Sign Recognition (`src/adapters/signRecognition/`)
- **`LandmarkTemplateMatcher`**: Real-time on-device geometric template matcher. Normalizes hand coordinates relative to wrist (`landmark[0]`), checks finger curl states, and recognizes explicitly listed benchmark signs (`NAMASTE`, `YES`, `NO`, `HELP`, `WATER`, `THANK-YOU`).
- **`MLModelAdapterStub`**: Extensibility point for full sequence classifiers (e.g. PyTorch ONNX/TFLite models trained on INCLUDE). Documented in `scripts/evaluate_model.py`.

### 2.4 Sign Animation (`src/adapters/signAnimation/`)
- **`ThreeAvatarRig`**: Three.js humanoid rig with articulated joints: shoulders, elbows, forearms, wrists, 5 individual fingers per hand, neck, and dynamic facial articulators (eyebrows and mouth).
- **`SvgAvatarAdapter`**: Accessible 2D SVG vector fallback for low-power mobile devices, high-contrast modes, and reduced-motion user preferences.

### 2.5 ISL Translation (`src/adapters/translation/`)
- **`LexiconLookupTranslator`**: Exact-match and tokenized coverage analyzer. Evaluates input against curated ISL gloss dictionaries. Refuses to generate synthetic grammatical approximations for unseen phrases. Returns detailed `TranslationCoverage` breakdown.

---

## 3. Declarative `SignClip` JSON Format

Sign clips are declarative, versioned, and independent of any rendering engine:

```typescript
export interface SignClip {
  id: string;                     // Unique identifier (e.g., "isl-namaste")
  version: string;                // Semantic version (e.g., "1.0.0")
  gloss: string;                  // Standard ISL gloss (e.g., "NAMASTE")
  labels: { en: string; hi: string }; // User-friendly localized strings
  durationMs: number;             // Duration in milliseconds (e.g., 2000)
  trustLevel: TrustLevel;         // 'VERIFIED' | 'COMMUNITY' | 'DEMO' | 'UNVERIFIED'
  provenance: {
    source: string;               // Corpus or study source
    licence: string;              // e.g. "CC-BY-4.0"
    reviewer?: string;            // Name / Board of Deaf ISL reviewer
    reviewedOn?: string;          // Verification date
    notes?: string;               // Phonological or grammatical context
  };
  keyframes: SignKeyframe[];       // Ordered keyframes across time offsets
  linguisticNotes?: string;       // Non-manual markers (mouth, head tilt, eyes)
}
```

---

## 4. Local-First Storage (`src/lib/storage.ts`)

Powered by Dexie (IndexedDB):
- **`messages`**: Conversation timeline records with origin source (`TYPED`, `SPOKEN`, `SIGN-DEMO`, `TRANSLATED`) and trust badges.
- **`phrases`**: User frequency dictionary enabling self-improving suggestions.
- **`corrections`**: Safe local voice corrections (`"namastey" -> "Namaste"`) applied during STT post-processing.
- **`customSigns`**: User-recorded landmark templates tagged as `COMMUNITY`.
- **`reports`**: Error feedback records for maintainer review.
- **`settings`**: User accessibility preferences, text scaling, and theme choices.
- **WebCrypto AES-GCM**: Client-side encrypted export/import using password derivation (PBKDF2).
