# Project SignStream 🤟🔊💬

[![SignStream CI](https://github.com/project-signstream/signstream/actions/workflows/ci.yml/badge.svg)](https://github.com/project-signstream/signstream/actions)
[![Licence: Apache-2.0](https://img.shields.io/badge/Licence-Apache--2.0-blue.svg)](LICENSES.md)
[![Accessibility: WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-teal.svg)](#accessibility)
[![Privacy: 100% On-Device](https://img.shields.io/badge/Privacy-100%25%20On--Device-emerald.svg)](#privacy-model)

> **MANDATORY RESEARCH PROTOTYPE DISCLAIMER:**
> Project SignStream is an early open-source research prototype designed for accessibility research, community co-design, and guided communication. **It is NOT a certified Indian Sign Language (ISL) interpreter.** It must never be relied upon for life-critical medical, legal, or emergency scenarios without a certified human interpreter.

---

## Table of Contents

1. [Overview & Core Values](#overview--core-values)
2. [What Works, What is Demo, What is Not Built](#what-works-what-is-demo-what-is-not-built)
3. [Quick Start & Installation](#quick-start--installation)
4. [Architecture & Replaceable Adapters](#architecture--replaceable-adapters)
5. [Trust Levels & Honesty Rules](#trust-levels--honesty-rules)
6. [How to Add a Lexicon Pack & SignClip](#how-to-add-a-lexicon-pack--signclip)
7. [How to Swap in a Real Recognition or Translation Model](#how-to-swap-in-a-real-recognition-or-translation-model)
8. [Privacy & Security Model](#privacy--security-model)
9. [Browser Support Matrix](#browser-support-matrix)
10. [Data Sources & Licences](#data-sources--licences)
11. [Ethical Guidance](#ethical-guidance)
12. [Milestones & Roadmap](#milestones--roadmap)

---

## 1. Overview & Core Values

Project SignStream is a mobile-first, local-first Progressive Web App (PWA) facilitating two-way communication between Deaf, hard-of-hearing, non-speaking, and hearing individuals using Indian Sign Language (ISL), speech synthesis, and text.

### Core Tenets
- **ISL is an Autonomous Language:** ISL is a natural visual-gestural language with its own morphology and grammar. It is **not** a word-for-word translation of spoken English or Hindi, and it is **not** American Sign Language (ASL).
- **No Faked Translations:** If a phrase is not in the verified ISL lexicon, SignStream states plainly: *"Sign translation is not available for this phrase."* It never fabricates random gestures to simulate unseen words.
- **100% On-Device Privacy:** Video frames and audio streams are processed locally via browser APIs, WebAssembly, and WebGPU. No data leaves the device.
- **Deaf Community Centered:** Authentic signs require direct review from native Deaf signers before receiving `VERIFIED` status.

---

## 2. What Works, What is Demo, What is Not Built

| Feature / Module | Status | Details & Limits |
| :--- | :--- | :--- |
| **Speech to Sign (Exact Match + Fingerspelling)** | ✅ **REAL & FUNCTIONAL** | Non-generative lookup against 49+ authentic ISL signs (core vocabulary, greetings, emergency, medical, numbers 1-10) with complete ISL two-handed manual fingerspelling (A-Z) fallback for proper nouns/unseen terms. Evaluates exact phrases and token coverage; flags missing words without hallucinating. |
| **Avatar Stage (3D Three.js + 2D SVG)** | ✅ **REAL & FUNCTIONAL** | Renders keyframe animations from declarative `SignClip` JSON. Smoothly chains compound multi-sign sentence trajectories (`createCompositeClip`). Supports speed adjustment (0.5x–1.5x), replay, pause, step forward, and looping. |
| **Speech-to-Text (Offline Whisper & Web Speech)** | ✅ **REAL & FUNCTIONAL** | Real on-device Whisper STT via `@xenova/transformers` (`whisper-tiny` running locally on WebGPU/WASM) with model download progress & caching, browser Web Speech API fallback with active privacy notice, and typed input. |
| **Text-to-Speech (TTS)** | ✅ **REAL & FUNCTIONAL** | Browser `SpeechSynthesis` with voice picker (supporting `en-IN` & `hi-IN`), pitch, and rate control. |
| **Sign-to-Speech Recognition** | ✅ **REAL & FUNCTIONAL (DEMO SCOPE)** | Real-time dual-hand tracking (21/42 3D landmarks) via MediaPipe Tasks Vision + geometric spatial vector classifier (`localLandmarkClassifier.ts`). Recognizes 14 core ISL signs and user-calibrated personal custom gestures. **Never speaks automatically**; strictly enforces confirm-before-speak flow. |
| **Conversation Mode** | ✅ **REAL & FUNCTIONAL** | Timeline with message source tags (`TYPED`, `SPOKEN`, `SIGN-DEMO`, `TRANSLATED`), speak-aloud, and high-contrast full-screen partner mode (with 180° flip). |
| **Local-First Memory (Dexie IndexedDB)** | ✅ **REAL & FUNCTIONAL** | Safe self-improvement: frequent phrases, custom vocabulary, local voice corrections post-processing, storage gauge, memory pause, and WebCrypto AES-GCM encrypted export/import. |
| **Deaf Reviewer Certification** | ✅ **REAL & FUNCTIONAL** | Strict review & sign-off workflow modal with signed attestations before promoting any pack to `VERIFIED`. |
| **Certified Medical / Legal Translation** | ❌ **OUT OF SCOPE** | Requires certified human interpreters. Not supported by this software. |

---

## 3. Quick Start & Installation

### Prerequisites
- Node.js 18+ (tested on Node.js 20, 22, and 24)
- npm 9+

### Commands

```bash
# 1. Clone repository
git clone https://github.com/project-signstream/signstream.git
cd project-signstream

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run unit and accessibility tests (Vitest + axe-core)
npm test

# 5. Run end-to-end browser tests (Playwright)
npm run test:e2e

# 6. Build production PWA bundle
npm run build
```

---

## 4. Architecture & Replaceable Adapters

SignStream uses strict TypeScript interfaces so any component can be upgraded without modifying UI code:

- `src/adapters/stt/`: `SpeechToTextAdapter` (`webSpeechAdapter`, `whisperAdapter`, `mockSttAdapter`)
- `src/adapters/tts/`: `TextToSpeechAdapter` (`browserSpeechSynthesis`)
- `src/adapters/signRecognition/`: `SignRecognizerAdapter` (`landmarkTemplateMatcher`, `mlModelAdapterStub`)
- `src/adapters/signAnimation/`: `SignAnimatorAdapter` (`threeAvatarAdapter`, `svgAvatarAdapter`)
- `src/adapters/translation/`: `IslTranslatorAdapter` (`lexiconLookup`)

For details, read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 5. Trust Levels & Honesty Rules

Every piece of content carries a trust rating:
- **`VERIFIED`** (Emerald): Reviewed and signed off by a fluent ISL signer or Deaf organization. Includes reviewer name and date.
- **`COMMUNITY`** (Blue): User-contributed or personal custom signs recorded on-device.
- **`DEMO`** (Amber): Placeholder keyframes or geometric template matching for testing only.
- **`UNVERIFIED`** (Rose): Newly imported datasets or machine-generated content without human verification.

---

## 6. How to Add a Lexicon Pack & SignClip

1. Open or create a JSON pack in `src/data/lexicon/`.
2. Ensure each clip follows the `SignClip` schema:

```json
{
  "id": "isl-namaste",
  "version": "1.0.0",
  "gloss": "NAMASTE",
  "labels": { "en": "Namaste / Hello", "hi": "नमस्ते" },
  "durationMs": 2000,
  "trustLevel": "DEMO",
  "provenance": {
    "source": "Open ISL Linguistic Corpus",
    "licence": "CC-BY-4.0",
    "reviewer": "ISL Deaf Review Board",
    "reviewedOn": "2026-04-10"
  },
  "keyframes": [
    {
      "timeMs": 0,
      "leftArm": { "shoulderRotation": [0.2, 0.3, 0], "elbowAngle": 0.5 },
      "rightArm": { "shoulderRotation": [0.2, -0.3, 0], "elbowAngle": 0.5 },
      "face": { "mouthState": "smile", "browState": 0.2 }
    },
    {
      "timeMs": 1000,
      "leftArm": { "shoulderRotation": [0.6, 0.4, 0.2], "elbowAngle": 1.7 },
      "rightArm": { "shoulderRotation": [0.6, -0.4, -0.2], "elbowAngle": 1.7 },
      "face": { "mouthState": "smile", "headRotation": [0.2, 0, 0] }
    }
  ]
}
```

---

## 7. How to Swap in a Real Recognition or Translation Model

1. **Model Weights:** Export your PyTorch or TensorFlow model to ONNX or TFLite format.
2. **Implement Adapter:** Implement `SignRecognizerAdapter` in `src/adapters/signRecognition/`:
   - Feed sequence of `[30_frames, 126_landmarks]`.
   - Return `{ gloss, labelEn, labelHi, confidence, trustLevel: 'UNVERIFIED' }`.
3. **Run Evaluation Harness:**
   ```bash
   python scripts/evaluate_model.py --model path/to/model.onnx --dataset path/to/test_data/ --output results.json
   ```
4. **Publish Results:** Record dataset, accuracy, signer-independence, and limits in the README.
5. **Deaf Community Sign-Off:** Before setting trust to `VERIFIED`, complete the sign-off protocol described in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

---

## 8. Privacy & Security Model

- **No Remote Telemetry:** No analytics scripts, no third-party tracking pixels, no advertising cookies.
- **Camera & Mic Sandbox:** Hardware access requires explicit opt-in via `PermissionGate`. Video frames and audio stay entirely inside the browser's JavaScript sandbox.
- **Revocable in 1-Click:** Tapping "Stop Camera" or "Stop Mic" instantly disposes the hardware stream tracks.
- **Local-First Storage:** All messages, custom signs, voice corrections, and phrase counts reside in client IndexedDB.
- **WebCrypto Encryption:** Export backups can be password-encrypted using client-side AES-GCM (PBKDF2 with 100,000 iterations).

---

## 9. Browser Support Matrix

| Browser / Platform | Speech-to-Text | Camera Landmarks | Three.js 3D Avatar | SVG 2D Fallback | IndexedDB Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Chrome (Android / Desktop)** | ✅ Web Speech & Whisper | ✅ MediaDevices | ✅ WebGL | ✅ Native | ✅ Supported |
| **Edge (Desktop)** | ✅ Web Speech & Whisper | ✅ MediaDevices | ✅ WebGL | ✅ Native | ✅ Supported |
| **Safari (iOS 16+ / macOS)** | ⚠️ Web Speech (Cloud) | ✅ MediaDevices | ✅ WebGL | ✅ Native | ✅ Supported |
| **Firefox (Desktop / Android)** | ⚠️ Whisper / Typed Only | ✅ MediaDevices | ✅ WebGL | ✅ Native | ✅ Supported |

---

## 10. Data Sources & Licences

- Project Licence: **Apache-2.0** (see [LICENSES.md](LICENSES.md))
- ISL Lexicon Dataset: Creative Commons Attribution 4.0 International (**CC-BY-4.0**)
- Evaluation candidate corpora: AI4Bharat INCLUDE dataset (CC-BY-4.0), MediaPipe (Apache-2.0).
- **Warning on ISLRTC:** Indian Sign Language Research and Training Centre materials are copyrighted government assets. Do not scrape or ingest without explicit written permission (see [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)).

---

## 11. Ethical Guidance

- **Involve Deaf ISL Signers:** Never deploy accessibility technology without participatory co-design.
- **Honest Error Handling:** Never approximate unseen phrases with random animations.
- **Non-Manual Markers:** Facial expressions and head tilts in ISL are grammatical, not decorative.

---

## 12. Milestones & Roadmap

- **Milestone 1 (Completed):** Scaffold, accessible navigation, 4 high-contrast themes, text scaling (100%–200%), exact-match lexicon translation, Three.js 3D rig + 2D SVG avatar, conversation mode, starter ISL pack with 12 foundational signs.
- **Milestone 2 (Completed):** On-device camera landmark overlay, geometric template matcher with DEMO rating, user custom personal sign recording, confirm-before-speak flow.
- **Milestone 3 (Completed):** Local-first Dexie database, voice corrections post-processing, offline Whisper adapter architecture, WebCrypto AES-GCM encrypted backup export/import, pack import with reviewer sign-off requirement.
- **Milestone 4 (Completed):** Evaluation harness (`scripts/evaluate_model.py`), axe-core WCAG audits in CI, Playwright smoke tests, full ethics, architecture, and data source documentation.
