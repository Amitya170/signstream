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

---

## 5. Commercial & Enterprise Production Systems

### 5.1 ISL Grammatical Reordering Engine (`src/adapters/translation/islGrammarEngine.ts`)
- **Linguistic Word-Order Normalization:** Converts English/Hindi (SVO) input into authentic ISL Topic-Comment / SOV syntax.
- **Interrogatives at Clause End:** Interrogatives (`WHERE`, `WHAT`, `WHEN`, `HOW`) are placed at the end of the sign sequence with furrowed brow NMMs.
- **Timeline-First Positioning:** Temporal markers (`TODAY`, `TOMORROW`, `YESTERDAY`) precede the clause.
- **Grammatical Elision:** Copulas (*"is"*, *"are"*, *"was"*) and auxiliary do-support are elided per ISL linguistics.
- **Non-Manual Markers (NMMs):** Embeds facial expressions (brow furrowing for WH-questions, brow raising for polar yes/no questions, head shake for negation) directly into keyframes.

### 5.2 3D Anatomical Rig with 360° Orbit Camera (`src/adapters/signAnimation/threeAvatarAdapter.ts`)
- **Dual-Phalanx Knuckles:** Each of the 5 fingers features independently articulated proximal and distal joint groups (MCP and PIP/DIP joints).
- **Opposable Thumb Geometry:** Angled lateral thumb placement with cross-palm flexion.
- **Respiratory & Blinking Kinematics:** Procedural breathing oscillation and eyelid blinking every ~3.8 seconds.
- **Interactive 360° Orbit Camera:** Pointer drag rotates the avatar, pinch/wheel zooms, and the Compass button resets view.

### 5.3 Temporal Continuous Gesture Classifier (`src/adapters/signRecognition/temporalGestureClassifier.ts`)
- **45-Frame Rolling FIFO Buffer:** Analyzes velocity and acceleration deltas to segment signs into **Preparation**, **Active Stroke**, and **Retraction** phases.
- **Dynamic Stroke Detection:** Identifies semantic stability plateaus to classify gestures during natural continuous signing.

### 5.4 Commercial Vision HUD (`src/features/signToSpeech/VisionHUD.tsx`)
- **Signing Space Silhouette Guide:** Targets the optimal torso framing for MediaPipe landmark extraction.
- **Ambient Lux Meter:** Perceptual luminance calculation (ITU-R BT.601) warning when lighting is dim.
- **Tracking Stability Gauge:** Real-time visual feedback on landmark stability.

### 5.5 Audio Waveform Visualizer & Deaf Sound Alert Ring (`src/components/AudioWaveformVisualizer.tsx`)
- **Real-Time Frequency Equalizer:** Live Web Audio API frequency spectrum analyzer showing mic input and decibel levels.
- **Deaf Visual Alert Ring:** Subtle pulsing emerald border flash around the interface whenever speech/sound is detected.

### 5.6 Enterprise Domain Packs (`src/data/lexicon/domainPacks.ts`)
- Pre-calibrated vocabulary for **Healthcare & Hospitals**, **Banking & Finance Counters**, **Transit & Metro Stations**, and **Emergency & Safety**.

### 5.7 1-Tap Emergency SOS Mode (`src/features/conversation/EmergencySOSModal.tsx`)
- Full-screen red strobe distress beacon with SOS mobile haptic vibrations (`... --- ...`), continuous audio announcement loop, and an animated loop of the authentic ISL `EMERGENCY` sign.

### 5.8 Official Session Transcript Audit Generator (`src/lib/sessionExporter.ts`)
- Generates official, printable/PDF-exportable interaction logs with timestamps, speaker attributions, trust levels, ISL glosses, and dual signature blocks.
