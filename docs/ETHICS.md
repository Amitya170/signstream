# Project SignStream: Ethical Framework & Linguistic Integrity

Technology designed for accessibility must be developed with rigorous ethical safeguards, cultural humility, and honest transparency. This document codifies the non-negotiable ethical commitments of Project SignStream.

---

## 1. "Nothing About Us Without Us" (Deaf Leadership)

Linguistic research and accessibility tools for Indian Sign Language (ISL) must center the Deaf community. Hearing technologists must not invent or dictate sign language representations without direct participation, co-design, and governance from fluent Deaf signers, Deaf-led organizations, and certified interpreters.

---

## 2. Indian Sign Language (ISL) is a Complete Natural Language

1. **Autonomous Grammar:** ISL is a rich, natural language with its own independent phonology, morphology, and spatial syntax. It is **not** a visual code for English or Hindi, and it is **not** American Sign Language (ASL).
2. **Grammar Integrity:** The syntax of ISL differs fundamentally from spoken languages (often employing Topic-Comment, Subject-Object-Verb, and spatial indexing).
3. **Prohibition Against "Faked" Translation:**
   - SignStream strictly refuses to concatenate arbitrary signs to simulate whole-sentence English or Hindi text.
   - When an exact phrase or idiom is not supported in verified lexicon packs, SignStream prominently states:
     > *"Sign translation is not available for this phrase."*
   - Unmatched words are never silently omitted or replaced with random gesture approximations.

---

## 3. Verifiable Trust Level System

Every sign, phrase, and model output in the application displays a visible trust badge:

| Trust Level | Definition | Requirements for Assignment |
| :--- | :--- | :--- |
| **`VERIFIED`** | Human-reviewed by fluent Deaf ISL signers or certified interpreters. | Documented reviewer identity, review date, and open-source provenance in metadata. |
| **`COMMUNITY`** | Contributed by users or personal custom signs recorded on-device. | Stored locally or shared with explicit community tags. |
| **`DEMO`** | Synthetic or placeholder keyframe sequences created for testing and UI prototyping. | Clearly marked in the UI so users understand it is experimental. |
| **`UNVERIFIED`** | Machine-generated or newly imported dataset packs without human review. | Default state for all external imports until certified review sign-off. |

---

## 4. No False Accuracy Claims

- Prototype recognition modes (such as camera-based gesture recognition) run in **clearly marked DEMO mode**.
- SignStream will never market gesture recognition as "solved" or claim clinical/commercial accuracy without formal evaluation published in `scripts/evaluate_model.py` and reviewed by Deaf linguists.
- Voice output from sign recognition will **never** speak aloud automatically; it requires an explicit, conscious user confirmation step (*"Confirm & Speak Aloud"*).

---

## 5. Absolute On-Device Privacy & Revocable Consent

- **Zero Data Egress:** Camera frames, hand landmark vectors, and microphone recordings must never leave the user's device.
- **Revocable Consent:** Users can grant, deny, or revoke camera and microphone permissions at any time via the dedicated Permission Gate.
- **Local Self-Improvement:** User voice corrections and phrase frequencies are stored only in client IndexedDB and are never aggregated or uploaded to external telemetry servers.
