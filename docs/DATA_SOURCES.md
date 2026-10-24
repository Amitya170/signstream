# Project SignStream: Data Sources, Licences & Evaluation Guide

This document catalogs open datasets, linguistic corpora, and landmark frameworks for Indian Sign Language (ISL) research. Maintainers and contributors must verify the terms of each source before training, importing, or distributing content.

---

## 1. Candidate Open Datasets & Resources

### 1.1 AI4Bharat: INCLUDE Dataset
- **Description:** A large-scale Indian Sign Language dataset consisting of ~4,287 videos over 263 isolated signs recorded across 7 Deaf signers in various lighting conditions.
- **Source:** [AI4Bharat INCLUDE (ACM Multimedia 2020)](https://ai4bharat.org)
- **Licence:** Creative Commons Attribution 4.0 International (CC-BY-4.0).
- **Suitability for SignStream:**
  - Excellent candidate for isolated sign evaluation and landmark training.
  - Video landmarks can be extracted into declarative `SignClip` JSON sequences.
  - Test split can be evaluated using `scripts/evaluate_model.py`.

### 1.2 ISL-CSLTR (Continuous Sign Language Translation and Recognition)
- **Description:** Benchmark corpus for continuous Indian Sign Language sentences recorded with regional variations.
- **Source:** Research publications by Indian Institute of Information Technology (IIIT) and academic consortiums.
- **Licence:** Research / Academic Non-Commercial Use (Must verify specific institutional release terms per version).
- **Suitability:** High research value for future sequence-to-sequence translation models. Content must be tagged `UNVERIFIED` until reviewed by ISL community partners.

### 1.3 Google MediaPipe Hands & Pose
- **Description:** On-device ML pipeline predicting 21 3D hand landmarks per hand and 33 body pose landmarks in real time.
- **Source:** [Google MediaPipe](https://github.com/google/mediapipe)
- **Licence:** Apache-2.0.
- **Suitability:** Standard coordinate system for SignStream landmark templates and camera overlay visualization.

---

## 2. Copyright & Terms of Service Warnings

### 2.1 ISLRTC (Indian Sign Language Research and Training Centre) Dictionary Content
> [!CAUTION]
> **Strict Legal Warning Regarding ISLRTC Content:**
> The Indian Sign Language dictionary published by ISLRTC (Department of Empowerment of Persons with Disabilities, Ministry of Social Justice & Empowerment, Govt. of India) is copyrighted government intellectual property.
>
> **Rules:**
> 1. **DO NOT SCRAPE OR CRAWL:** Automated scraping of the ISLRTC website or mobile application is strictly forbidden.
> 2. **NO UNLICENSED REDISTRIBUTION:** Video files, illustrations, or derivative datasets must not be ingested into SignStream without an explicit, written open-licence grant from ISLRTC.
> 3. **RESPECT COPYRIGHT:** Only open-access materials explicitly published under CC-BY or public domain may be used.

---

## 3. Protocol for Adding External Lexicon Packs

To add or import a new lexicon pack into SignStream:

1. **Verify Source Licence:** The pack must have an OSI-approved open-source or Creative Commons licence (e.g., CC-BY-4.0, CC-0, MIT, Apache-2.0).
2. **Include Complete Provenance:**
   - Author / Institution
   - Licence URL and text
   - Reviewer certification status
3. **Trust Level Default:** All newly imported packs are assigned `UNVERIFIED` by default. They can only be elevated to `VERIFIED` after sign-off by a qualified Deaf reviewer recorded in the pack's `reviewer` and `reviewedOn` metadata fields.
