# Project SignStream: Deaf Community Review & Verification Workflow

> **Guiding Principle:** "Nothing about us without us." Indian Sign Language (ISL) belongs to the Deaf community. Software tools must never self-certify sign representations. Content is elevated to `VERIFIED` status only through explicit human evaluation by fluent Deaf signers or certified interpreters.

---

## 1. Trust Hierarchy & Lifecycle

Every `SignClip`, lexicon pack, and conversation message carries a visible trust badge:

```
[Imported Open Dataset / Synthetic]
              │
              ▼
        UNVERIFIED (Default for any external or machine data)
              │
              ├── User records custom sign on-device ──► COMMUNITY (Local Personal Sign)
              │
              ▼
   Human Review by Fluent Deaf Signer / Certified Interpreter
   - Attestation of authenticity
   - Complete phonological rubric check
   - Formal reviewer credentials recorded
              │
              ▼
           VERIFIED
```

---

## 2. Phonological Evaluation Rubric

ISL signs are characterized by five phonological parameters plus non-manual markers. Reviewers evaluate each parameter:

| Parameter | Criteria | Pass / Fail Flags |
| :--- | :--- | :--- |
| **1. Handshape** | Are the finger flexion, thumb position, and spread authentic to ISL? | Must not conflate ASL or BSL distinct handshapes. |
| **2. Orientation** | Palm facing direction (inward, outward, upward, downward, prone, supine). | Orientation shifts alter lexical meaning. |
| **3. Location** | Spatial placement relative to signer torso, neutral space, chest, chin, or temple. | Signs must respect neutral signing space (WCAG clear view). |
| **4. Movement** | Path, speed, repetition, and directionality. | Distinguishes continuous vs single-stroke signs. |
| **5. Non-Manual Markers (NMM)** | Facial expressions, brow furrow/raise, head tilt, mouthing. | Critical for ISL grammatical questions, negation, and emphasis. |

---

## 3. Reviewer Sign-Off Tooling Protocol

In `LearnView`, a reviewer can select any `UNVERIFIED` or `COMMUNITY` sign or imported pack and launch the **Review & Certify** modal:

1. **Reviewer Identification:** Name and professional or community title (e.g., *"National Association of the Deaf Reviewer"* or *"Certified ISL Interpreter"*).
2. **Review Date:** Recorded in ISO 8601 format (`YYYY-MM-DD`).
3. **Linguistic Notes:** Specific phonological observations, regional variants, and situational usage notes.
4. **Mandatory Attestation:** The reviewer explicitly checks the declaration:
   > *"I attest as a fluent Deaf ISL signer or certified interpreter that this sign keyframe sequence adheres to authentic ISL phonology, morphology, and cultural usage."*
5. **Persistence:** The clip's `provenance` metadata is permanently stamped and the trust level updates to `VERIFIED`.

---

## 4. Regional Variations in ISL

Indian Sign Language has vibrant regional dialects (Northern, Western, Southern, Eastern).
- SignStream does **not** enforce a monolithic dialect.
- When regional variants exist, clips are assigned regional gloss tags (e.g., `WATER-DELHI`, `WATER-MUMBAI`, `WATER-CHENNAI`).
- Reviewers document the region in the `linguisticNotes` field.

---

## 5. Offline & Consent Guarantees During Review

- All review operations happen locally in IndexedDB storage.
- If a reviewer wishes to contribute their review back to the open-source repository:
  1. Open the `Memory` screen.
  2. Click **Export Backup (JSON)**.
  3. Submit a pull request to `src/data/lexicon/` with the signed JSON file.
- No automated network telemetry or background submission ever takes place.
