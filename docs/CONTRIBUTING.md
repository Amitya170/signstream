# Contributing to Project SignStream

Thank you for contributing to Project SignStream! We welcome contributions from Deaf signers, interpreters, linguists, accessibility specialists, and software engineers.

---

## 1. Code of Conduct & Core Values

- **Respect Deaf Culture:** Acknowledge Indian Sign Language (ISL) as a natural, autonomous language.
- **Honesty First:** Never exaggerate model capabilities, fake translation coverage, or omit trust ratings.
- **Privacy by Default:** Do not introduce dependencies that upload client camera or microphone data to external cloud services.

---

## 2. Development Setup

```bash
# Clone the repository
git clone https://github.com/project-signstream/signstream.git
cd project-signstream

# Install exact dependencies
npm install

# Run the local development server
npm run dev

# Run unit tests and WCAG accessibility audits
npm run test

# Run build verification
npm run build
```

---

## 3. Deaf Community Sign Review Workflow

To promote any sign or lexicon pack from `DEMO` or `UNVERIFIED` to **`VERIFIED`**:

1. **Review Session:** Conduct an evaluation session with at least one native/fluent Deaf ISL signer or certified ISL interpreter.
2. **Review Checklist:**
   - [ ] Handshape accuracy (MCP/PIP flexion, thumb posture)
   - [ ] Palm orientation (facing, tilting, rotation)
   - [ ] Location (placement relative to chest, head, chin, or neutral space)
   - [ ] Movement path and repetition
   - [ ] Non-manual markers (facial expression, head tilt, mouthing)
3. **Record Sign-Off:**
   Update the `provenance` block in the pack JSON:
   ```json
   "provenance": {
     "source": "ISL Linguistic Field Study",
     "licence": "CC-BY-4.0",
     "reviewer": "Reviewer Name or Deaf Association ID",
     "reviewedOn": "YYYY-MM-DD",
     "notes": "Verified correct handshape and non-manual markers."
   }
   ```
4. **Submit PR:** Submit a Pull Request documenting the review context.

---

## 4. Accessibility & Quality Requirements

Every Pull Request must satisfy:
1. **Zero Critical axe-core Violations:** Run `npm run test` to verify WCAG 2.2 AA compliance.
2. **Minimum 48px Touch Targets:** All interactive controls must meet minimum touch dimensions.
3. **Strict TypeScript:** No `any` types without explicit documentation.
4. **Keyboard Navigable:** All buttons, dialogs, and sliders must be reachable and operable via keyboard.
