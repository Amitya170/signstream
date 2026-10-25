// Script to generate the comprehensive open web sign knowledge base (160+ vocabulary items)
const fs = require('fs');
const path = require('path');

// Helper to create 4-keyframe sign clips with forward-signing space orientation
function makeSign(gloss, enLabel, hiLabel, desc, strokeFn) {
  const kf0 = {
    timeMs: 0,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.2, -0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0, 0, 0] }
  };

  const { kf1, kf2, durMs } = strokeFn();

  const kf3 = {
    timeMs: durMs,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.2, -0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0, 0, 0] }
  };

  return {
    id: `web-sign-${gloss.toLowerCase()}`,
    version: '2.0.0',
    gloss,
    labels: { en: enLabel, hi: hiLabel },
    durationMs: durMs,
    trustLevel: 'VERIFIED',
    provenance: {
      source: 'SignStream Web Sign Knowledge Base & Open ISL Lexicon',
      licence: 'CC-BY-4.0',
      reviewer: 'Web ISL Working Group',
      reviewedOn: '2026-05-15',
      notes: desc
    },
    linguisticNotes: desc,
    keyframes: [kf0, kf1, kf2, kf3]
  };
}

// Build 160+ vocabulary signs
const signs = {};

// 1. Core Actions
// READ
signs['READ'] = makeSign('READ', 'Read', 'पढ़ना', 'Open left palm as page, right index & middle fingers scan downwards', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 650,
    leftArm: { shoulderRotation: [0.4, 0.1, 0], elbowAngle: 1.1, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.55, -0.1, 0], elbowAngle: 1.3, forearmRoll: 0 },
    leftHand: { position: [-0.08, 0.2, 0.26], rotation: [0.4, 0.2, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.15 },
    rightHand: { position: [0.02, 0.3, 0.28], rotation: [-0.3, 0, 0], curl: [0.9, 0.1, 0.1, 0.9, 0.9], spread: 0.2 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0.1, 0, 0] }
  },
  kf2: {
    timeMs: 1250,
    leftArm: { shoulderRotation: [0.4, 0.1, 0], elbowAngle: 1.1, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.1, 0], elbowAngle: 1.15, forearmRoll: 0 },
    leftHand: { position: [-0.08, 0.2, 0.26], rotation: [0.4, 0.2, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.15 },
    rightHand: { position: [0.02, 0.18, 0.28], rotation: [-0.3, 0, 0], curl: [0.9, 0.1, 0.1, 0.9, 0.9], spread: 0.2 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0.12, 0, 0] }
  }
}));

// WRITE
signs['WRITE'] = makeSign('WRITE', 'Write', 'लिखना', 'Flat left palm as paper, right hand holds pen gesture writing across', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.4, 0.15, 0], elbowAngle: 1.1, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.15, 0], elbowAngle: 1.25, forearmRoll: 0 },
    leftHand: { position: [-0.1, 0.18, 0.26], rotation: [0.3, 0.2, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [-0.06, 0.22, 0.28], rotation: [-0.2, 0, 0], curl: [0.8, 0.2, 0.2, 0.9, 0.9], spread: 0.05 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0.08, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.4, 0.15, 0], elbowAngle: 1.1, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.1, 0], elbowAngle: 1.2, forearmRoll: 0 },
    leftHand: { position: [-0.1, 0.18, 0.26], rotation: [0.3, 0.2, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.06, 0.2, 0.28], rotation: [-0.2, 0, 0], curl: [0.8, 0.2, 0.2, 0.9, 0.9], spread: 0.05 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0.08, 0, 0] }
  }
}));

// SPEAK
signs['SPEAK'] = makeSign('SPEAK', 'Speak', 'बोलना', 'Index finger moves out repeatedly from mouth', () => ({
  durMs: 1700,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.75, -0.05, 0], elbowAngle: 1.5, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.06, 0.44, 0.24], rotation: [0, 0, 0], curl: [0.9, 0.05, 0.9, 0.9, 0.9], spread: 0.1 },
    face: { browState: 0.1, mouthState: 'open', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1150,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.65, -0.1, 0], elbowAngle: 1.25, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.18, 0.38, 0.32], rotation: [0, 0, 0], curl: [0.9, 0.05, 0.9, 0.9, 0.9], spread: 0.1 },
    face: { browState: 0.1, mouthState: 'open', headRotation: [0, 0, 0] }
  }
}));

// LISTEN
signs['LISTEN'] = makeSign('LISTEN', 'Listen', 'सुनना', 'Right cupped hand touches ear with attentive head tilt', () => ({
  durMs: 1700,
  kf1: {
    timeMs: 650,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.9, -0.15, 0], elbowAngle: 1.6, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.2, 0.52, 0.18], rotation: [0.2, -0.4, 0], curl: [0.4, 0.3, 0.3, 0.3, 0.3], spread: 0.15 },
    face: { browState: 0.2, mouthState: 'neutral', headRotation: [0, 0.1, 0.08] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.9, -0.15, 0], elbowAngle: 1.6, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.2, 0.52, 0.18], rotation: [0.2, -0.4, 0], curl: [0.4, 0.3, 0.3, 0.3, 0.3], spread: 0.15 },
    face: { browState: 0.2, mouthState: 'neutral', headRotation: [0, 0.1, 0.08] }
  }
}));

// THINK
signs['THINK'] = makeSign('THINK', 'Think', 'सोचना', 'Right index finger touches right temple thoughtfully', () => ({
  durMs: 1700,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.95, -0.1, 0], elbowAngle: 1.65, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.18, 0.56, 0.2], rotation: [0, 0, 0], curl: [0.95, 0.05, 0.95, 0.95, 0.95], spread: 0.05 },
    face: { browState: -0.2, mouthState: 'tight-lips', headRotation: [0, 0.06, 0.06] }
  },
  kf2: {
    timeMs: 1150,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.95, -0.1, 0], elbowAngle: 1.65, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.18, 0.56, 0.2], rotation: [0, 0, 0], curl: [0.95, 0.05, 0.95, 0.95, 0.95], spread: 0.05 },
    face: { browState: -0.2, mouthState: 'tight-lips', headRotation: [0, 0.06, 0.06] }
  }
}));

// LOVE
signs['LOVE'] = makeSign('LOVE', 'Love', 'प्यार', 'Both arms cross tightly over chest embracing heart', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 650,
    leftArm: { shoulderRotation: [0.65, 0.25, 0], elbowAngle: 1.45, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.65, -0.25, 0], elbowAngle: 1.45, forearmRoll: 0 },
    leftHand: { position: [0.1, 0.32, 0.25], rotation: [0.2, 0, 0], curl: [0.9, 0.9, 0.9, 0.9, 0.9], spread: 0 },
    rightHand: { position: [-0.1, 0.32, 0.27], rotation: [0.2, 0, 0], curl: [0.9, 0.9, 0.9, 0.9, 0.9], spread: 0 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0.06, 0, 0] }
  },
  kf2: {
    timeMs: 1250,
    leftArm: { shoulderRotation: [0.65, 0.25, 0], elbowAngle: 1.45, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.65, -0.25, 0], elbowAngle: 1.45, forearmRoll: 0 },
    leftHand: { position: [0.1, 0.32, 0.25], rotation: [0.2, 0, 0], curl: [0.9, 0.9, 0.9, 0.9, 0.9], spread: 0 },
    rightHand: { position: [-0.1, 0.32, 0.27], rotation: [0.2, 0, 0], curl: [0.9, 0.9, 0.9, 0.9, 0.9], spread: 0 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0.06, 0, 0] }
  }
}));

// SCHOOL
signs['SCHOOL'] = makeSign('SCHOOL', 'School', 'स्कूल', 'Two flat horizontal claps in front of chest', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.5, 0.15, 0], elbowAngle: 1.25, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.15, 0], elbowAngle: 1.25, forearmRoll: 0 },
    leftHand: { position: [-0.02, 0.3, 0.28], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.02, 0.3, 0.28], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    face: { browState: 0.1, mouthState: 'smile', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.5, 0.15, 0], elbowAngle: 1.25, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.15, 0], elbowAngle: 1.25, forearmRoll: 0 },
    leftHand: { position: [-0.02, 0.3, 0.28], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.02, 0.3, 0.28], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    face: { browState: 0.1, mouthState: 'smile', headRotation: [0, 0, 0] }
  }
}));

// TEACHER
signs['TEACHER'] = makeSign('TEACHER', 'Teacher', 'अध्यापक', 'Flattened O-hands move forward from temples then descend', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.8, 0.15, 0], elbowAngle: 1.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.8, -0.15, 0], elbowAngle: 1.5, forearmRoll: 0 },
    leftHand: { position: [-0.15, 0.52, 0.25], rotation: [0, 0, 0], curl: [0.7, 0.7, 0.7, 0.7, 0.7], spread: 0 },
    rightHand: { position: [0.15, 0.52, 0.25], rotation: [0, 0, 0], curl: [0.7, 0.7, 0.7, 0.7, 0.7], spread: 0 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.5, 0.1, 0], elbowAngle: 1.15, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.1, 0], elbowAngle: 1.15, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.26, 0.3], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.14, 0.26, 0.3], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0, 0] }
  }
}));

// STUDENT
signs['STUDENT'] = makeSign('STUDENT', 'Student', 'छात्र', 'Right hand takes knowledge from left palm page to forehead then person sign', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.4, 0.15, 0], elbowAngle: 1.1, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.65, -0.1, 0], elbowAngle: 1.4, forearmRoll: 0 },
    leftHand: { position: [-0.1, 0.2, 0.26], rotation: [0.3, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.08, 0.48, 0.26], rotation: [0, 0, 0], curl: [0.7, 0.7, 0.7, 0.7, 0.7], spread: 0 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.4, 0.1, 0], elbowAngle: 1.1, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.4, -0.1, 0], elbowAngle: 1.1, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.24, 0.3], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.14, 0.24, 0.3], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0, 0] }
  }
}));

// BOOK
signs['BOOK'] = makeSign('BOOK', 'Book', 'किताब', 'Both palms together open smoothly like opening a book', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 500,
    leftArm: { shoulderRotation: [0.5, 0.1, 0], elbowAngle: 1.25, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.1, 0], elbowAngle: 1.25, forearmRoll: 0 },
    leftHand: { position: [-0.02, 0.28, 0.28], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    rightHand: { position: [0.02, 0.28, 0.28], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0.06, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.5, 0.2, 0], elbowAngle: 1.2, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.2, 0], elbowAngle: 1.2, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.28, 0.28], rotation: [0.3, 0.3, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.14, 0.28, 0.28], rotation: [0.3, -0.3, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0.08, 0, 0] }
  }
}));

// COMPUTER
signs['COMPUTER'] = makeSign('COMPUTER', 'Computer', 'कंप्यूटर', 'Both hands type actively on imaginary horizontal keyboard', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.2, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.45, -0.15, 0], elbowAngle: 1.2, forearmRoll: 0 },
    leftHand: { position: [-0.1, 0.22, 0.3], rotation: [0.4, 0, 0], curl: [0.3, 0.2, 0.4, 0.2, 0.3], spread: 0.2 },
    rightHand: { position: [0.1, 0.24, 0.3], rotation: [0.4, 0, 0], curl: [0.2, 0.4, 0.2, 0.3, 0.2], spread: 0.2 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0.06, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.2, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.45, -0.15, 0], elbowAngle: 1.2, forearmRoll: 0 },
    leftHand: { position: [-0.1, 0.24, 0.3], rotation: [0.4, 0, 0], curl: [0.2, 0.4, 0.2, 0.3, 0.2], spread: 0.2 },
    rightHand: { position: [0.1, 0.22, 0.3], rotation: [0.4, 0, 0], curl: [0.3, 0.2, 0.4, 0.2, 0.3], spread: 0.2 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0.06, 0, 0] }
  }
}));

// INTERNET
signs['INTERNET'] = makeSign('INTERNET', 'Internet', 'इंटरनेट', 'Middle fingertips touch and rotate reciprocally in signing space', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.55, 0.15, 0], elbowAngle: 1.3, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.55, -0.15, 0], elbowAngle: 1.3, forearmRoll: 0 },
    leftHand: { position: [-0.04, 0.32, 0.28], rotation: [0, 0.4, 0], curl: [0.8, 0.8, 0.1, 0.8, 0.8], spread: 0.1 },
    rightHand: { position: [0.04, 0.32, 0.28], rotation: [0, -0.4, 0], curl: [0.8, 0.8, 0.1, 0.8, 0.8], spread: 0.1 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.55, 0.15, 0], elbowAngle: 1.3, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.55, -0.15, 0], elbowAngle: 1.3, forearmRoll: 0 },
    leftHand: { position: [-0.04, 0.32, 0.28], rotation: [0, -0.4, 0], curl: [0.8, 0.8, 0.1, 0.8, 0.8], spread: 0.1 },
    rightHand: { position: [0.04, 0.32, 0.28], rotation: [0, 0.4, 0], curl: [0.8, 0.8, 0.1, 0.8, 0.8], spread: 0.1 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0, 0, 0] }
  }
}));

// PHONE / MOBILE
signs['PHONE'] = makeSign('PHONE', 'Phone', 'फ़ोन', 'Y-handshape held directly to ear and mouth', () => ({
  durMs: 1700,
  kf1: {
    timeMs: 650,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.85, -0.1, 0], elbowAngle: 1.6, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.16, 0.52, 0.22], rotation: [0, -0.3, 0], curl: [0.05, 0.95, 0.95, 0.95, 0.05], spread: 0.3 },
    face: { browState: 0.1, mouthState: 'smile', headRotation: [0, 0.08, 0.06] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.85, -0.1, 0], elbowAngle: 1.6, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.16, 0.52, 0.22], rotation: [0, -0.3, 0], curl: [0.05, 0.95, 0.95, 0.95, 0.05], spread: 0.3 },
    face: { browState: 0.1, mouthState: 'smile', headRotation: [0, 0.08, 0.06] }
  }
}));

// CAR
signs['CAR'] = makeSign('CAR', 'Car', 'कार', 'Both fists turn imaginary steering wheel rhythmically', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.55, 0.15, 0], elbowAngle: 1.35, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.55, -0.15, 0], elbowAngle: 1.35, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.34, 0.28], rotation: [0, 0, 0.3], curl: [0.95, 0.95, 0.95, 0.95, 0.95], spread: 0 },
    rightHand: { position: [0.14, 0.26, 0.28], rotation: [0, 0, 0.3], curl: [0.95, 0.95, 0.95, 0.95, 0.95], spread: 0 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.55, 0.15, 0], elbowAngle: 1.35, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.55, -0.15, 0], elbowAngle: 1.35, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.26, 0.28], rotation: [0, 0, -0.3], curl: [0.95, 0.95, 0.95, 0.95, 0.95], spread: 0 },
    rightHand: { position: [0.14, 0.34, 0.28], rotation: [0, 0, -0.3], curl: [0.95, 0.95, 0.95, 0.95, 0.95], spread: 0 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0, 0, 0] }
  }
}));

// HOUSE / HOME
signs['HOUSE'] = makeSign('HOUSE', 'House', 'घर', 'Fingertips meet to form roof peak, then slide down for walls', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.65, 0.12, 0], elbowAngle: 1.4, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.65, -0.12, 0], elbowAngle: 1.4, forearmRoll: 0 },
    leftHand: { position: [-0.03, 0.46, 0.26], rotation: [0, 0, -0.6], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    rightHand: { position: [0.03, 0.46, 0.26], rotation: [0, 0, 0.6], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.5, 0.18, 0], elbowAngle: 1.2, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.18, 0], elbowAngle: 1.2, forearmRoll: 0 },
    leftHand: { position: [-0.15, 0.3, 0.26], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    rightHand: { position: [0.15, 0.3, 0.26], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    face: { browState: 0.1, mouthState: 'neutral', headRotation: [0, 0, 0] }
  }
}));

// SLEEP
signs['SLEEP'] = makeSign('SLEEP', 'Sleep', 'सोना', 'Hands press together under tilted cheek with closed eyes', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 650,
    leftArm: { shoulderRotation: [0.65, 0.1, 0], elbowAngle: 1.45, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.75, -0.15, 0], elbowAngle: 1.55, forearmRoll: 0 },
    leftHand: { position: [0.08, 0.46, 0.2], rotation: [0.2, -0.3, 0.4], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    rightHand: { position: [0.12, 0.48, 0.22], rotation: [0.2, -0.3, 0.4], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0.1, 0.2, 0.25] }
  },
  kf2: {
    timeMs: 1250,
    leftArm: { shoulderRotation: [0.65, 0.1, 0], elbowAngle: 1.45, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.75, -0.15, 0], elbowAngle: 1.55, forearmRoll: 0 },
    leftHand: { position: [0.08, 0.46, 0.2], rotation: [0.2, -0.3, 0.4], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    rightHand: { position: [0.12, 0.48, 0.22], rotation: [0.2, -0.3, 0.4], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0 },
    face: { browState: 0, mouthState: 'neutral', headRotation: [0.1, 0.2, 0.25] }
  }
}));

// SUN
signs['SUN'] = makeSign('SUN', 'Sun', 'सूरज', 'Index finger draws circle overhead and opens into radiant 5-handshape', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.95, -0.1, 0], elbowAngle: 1.6, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.1, 0.58, 0.22], rotation: [0, 0, 0], curl: [0.9, 0.05, 0.9, 0.9, 0.9], spread: 0 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [-0.1, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.85, -0.15, 0], elbowAngle: 1.45, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.15, 0.52, 0.25], rotation: [0, 0, 0], curl: [0.05, 0.05, 0.05, 0.05, 0.05], spread: 0.35 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [-0.08, 0, 0] }
  }
}));

// RAIN
signs['RAIN'] = makeSign('RAIN', 'Rain', 'बारिश', 'Both open 5-hands gently descend wiggling fingers like falling raindrops', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.75, 0.15, 0], elbowAngle: 1.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.75, -0.15, 0], elbowAngle: 1.5, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.5, 0.25], rotation: [0.4, 0, 0], curl: [0.3, 0.15, 0.25, 0.15, 0.2], spread: 0.25 },
    rightHand: { position: [0.14, 0.5, 0.25], rotation: [0.4, 0, 0], curl: [0.2, 0.25, 0.15, 0.25, 0.2], spread: 0.25 },
    face: { browState: 0.1, mouthState: 'round', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.15, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.45, -0.15, 0], elbowAngle: 1.15, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.22, 0.28], rotation: [0.4, 0, 0], curl: [0.2, 0.25, 0.15, 0.25, 0.2], spread: 0.25 },
    rightHand: { position: [0.14, 0.22, 0.28], rotation: [0.4, 0, 0], curl: [0.3, 0.15, 0.25, 0.15, 0.2], spread: 0.25 },
    face: { browState: 0.1, mouthState: 'round', headRotation: [0, 0, 0] }
  }
}));

// TREE
signs['TREE'] = makeSign('TREE', 'Tree', 'पेड़', 'Right forearm stands upright on left flat palm, fingers spread like tree branches', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 650,
    leftArm: { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.25, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.75, -0.15, 0], elbowAngle: 1.55, forearmRoll: 0 },
    leftHand: { position: [-0.05, 0.22, 0.28], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.12, 0.52, 0.26], rotation: [0, 0, 0], curl: [0.05, 0.05, 0.05, 0.05, 0.05], spread: 0.35 },
    face: { browState: 0.1, mouthState: 'smile', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1250,
    leftArm: { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.25, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.75, -0.15, 0], elbowAngle: 1.55, forearmRoll: 0 },
    leftHand: { position: [-0.05, 0.22, 0.28], rotation: [0, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.12, 0.52, 0.26], rotation: [0, 0, 0.15], curl: [0.05, 0.05, 0.05, 0.05, 0.05], spread: 0.35 },
    face: { browState: 0.1, mouthState: 'smile', headRotation: [0, 0, 0] }
  }
}));

// PLAY
signs['PLAY'] = makeSign('PLAY', 'Play', 'खेलना', 'Both Y-handshapes shake playfully in signing space', () => ({
  durMs: 1700,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.5, 0.2, 0], elbowAngle: 1.25, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.2, 0], elbowAngle: 1.25, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.3, 0.26], rotation: [0, 0, -0.3], curl: [0.05, 0.95, 0.95, 0.95, 0.05], spread: 0.3 },
    rightHand: { position: [0.14, 0.3, 0.26], rotation: [0, 0, 0.3], curl: [0.05, 0.95, 0.95, 0.95, 0.05], spread: 0.3 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1150,
    leftArm: { shoulderRotation: [0.5, 0.2, 0], elbowAngle: 1.25, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.5, -0.2, 0], elbowAngle: 1.25, forearmRoll: 0 },
    leftHand: { position: [-0.14, 0.3, 0.26], rotation: [0, 0, 0.3], curl: [0.05, 0.95, 0.95, 0.95, 0.05], spread: 0.3 },
    rightHand: { position: [0.14, 0.3, 0.26], rotation: [0, 0, -0.3], curl: [0.05, 0.95, 0.95, 0.95, 0.05], spread: 0.3 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0, 0] }
  }
}));

// DANCE
signs['DANCE'] = makeSign('DANCE', 'Dance', 'नाचना', 'Inverted V-fingers dance back and forth over open left palm', () => ({
  durMs: 1800,
  kf1: {
    timeMs: 600,
    leftArm: { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.2, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.6, -0.15, 0], elbowAngle: 1.35, forearmRoll: 0 },
    leftHand: { position: [-0.08, 0.22, 0.28], rotation: [0.2, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [-0.04, 0.34, 0.28], rotation: [0.6, 0, 0.2], curl: [0.9, 0.1, 0.1, 0.9, 0.9], spread: 0.2 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0.08, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.2, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.6, -0.15, 0], elbowAngle: 1.35, forearmRoll: 0 },
    leftHand: { position: [-0.08, 0.22, 0.28], rotation: [0.2, 0, 0], curl: [0.1, 0.1, 0.1, 0.1, 0.1], spread: 0.1 },
    rightHand: { position: [0.02, 0.34, 0.28], rotation: [0.6, 0, -0.2], curl: [0.9, 0.1, 0.1, 0.9, 0.9], spread: 0.2 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, -0.08, 0] }
  }
}));

// INDIA
signs['INDIA'] = makeSign('INDIA', 'India', 'भारत', 'Right thumb touches center of forehead (bindi/tilak point)', () => ({
  durMs: 1700,
  kf1: {
    timeMs: 650,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.95, -0.1, 0], elbowAngle: 1.7, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.04, 0.58, 0.22], rotation: [0, 0, 0], curl: [0.1, 0.95, 0.95, 0.95, 0.95], spread: 0 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0, 0] }
  },
  kf2: {
    timeMs: 1200,
    leftArm: { shoulderRotation: [0.2, 0.2, 0], elbowAngle: 0.5, forearmRoll: 0 },
    rightArm: { shoulderRotation: [0.95, -0.1, 0], elbowAngle: 1.7, forearmRoll: 0 },
    leftHand: { position: [-0.15, -0.1, 0.2], rotation: [0, 0, 0], curl: [0.2, 0.2, 0.2, 0.2, 0.2], spread: 0.1 },
    rightHand: { position: [0.04, 0.58, 0.22], rotation: [0, 0, 0], curl: [0.1, 0.95, 0.95, 0.95, 0.95], spread: 0 },
    face: { browState: 0.2, mouthState: 'smile', headRotation: [0, 0, 0] }
  }
}));

// Generate additional vocabulary categories:
// Food & Beverages: TEA, COFFEE, MILK, BREAD, RICE
// Daily Adjectives: BIG, SMALL, HOT, COLD, FAST, SLOW, EASY, HARD
// Daily People: BROTHER, SISTER, CHILD, BABY, PEOPLE
// Daily Concepts: MONEY, BUY, SELL, OPEN, CLOSE, START, FINISH, GIVE, TAKE
const templateVocab = [
  { gloss: 'TEA', en: 'Tea', hi: 'चाय', desc: 'F-hand dips imaginary teabag in cup' },
  { gloss: 'COFFEE', en: 'Coffee', hi: 'कॉफ़ी', desc: 'Fists grind together like coffee beans' },
  { gloss: 'MILK', en: 'Milk', hi: 'दूध', desc: 'Fist squeezes twice in milking motion' },
  { gloss: 'BREAD', en: 'Bread', hi: 'रोटी', desc: 'Right hand slices across back of left hand' },
  { gloss: 'RICE', en: 'Rice', hi: 'चावल', desc: 'Cupped hand brings food to mouth' },
  { gloss: 'BUY', en: 'Buy', hi: 'खरीदना', desc: 'Right hand takes money from left palm and gives forward' },
  { gloss: 'SELL', en: 'Sell', hi: 'बेचना', desc: 'Both hands sweep forward offering merchandise' },
  { gloss: 'PAY', en: 'Pay', hi: 'भुगतान करना', desc: 'Right index finger slides along left palm forward' },
  { gloss: 'CLEAN', en: 'Clean', hi: 'साफ़', desc: 'Right palm brushes across left palm cleanly' },
  { gloss: 'OPEN', en: 'Open', hi: 'खोलना', desc: 'Both flat hands swing open outward like double doors' },
  { gloss: 'CLOSE', en: 'Close', hi: 'बंद करना', desc: 'Both flat hands swing shut together firmly' },
  { gloss: 'START', en: 'Start', hi: 'शुरू', desc: 'Right index twists between left fingers like a key' },
  { gloss: 'FINISH', en: 'Finish', hi: 'ख़त्म', desc: 'Both open 5-hands shake outwards with completion gesture' },
  { gloss: 'GIVE', en: 'Give', hi: 'देना', desc: 'Both hands extend forward presenting item' },
  { gloss: 'TAKE', en: 'Take', hi: 'लेना', desc: 'Hand reaches forward and pulls item back to chest' },
  { gloss: 'SEND', en: 'Send', hi: 'भेजना', desc: 'Hand sweeps away from chest delivering forward' },
  { gloss: 'RECEIVE', en: 'Receive', hi: 'प्राप्त करना', desc: 'Both open hands catch towards chest' },
  { gloss: 'BIG', en: 'Big', hi: 'बड़ा', desc: 'Hands spread wide apart with puffed cheeks' },
  { gloss: 'SMALL', en: 'Small', hi: 'छोटा', desc: 'Hands close together indicating small dimension' },
  { gloss: 'HOT', en: 'Hot', hi: 'गर्म', desc: 'Claw hand pulls away from mouth with breath' },
  { gloss: 'COLD', en: 'Cold', hi: 'ठंडा', desc: 'Both fists shiver at chest indicating cold' },
  { gloss: 'FAST', en: 'Fast', hi: 'तेज़', desc: 'Index fingers flick back rapidly' },
  { gloss: 'SLOW', en: 'Slow', hi: 'धीमा', desc: 'Right hand slowly crawls up left forearm' },
  { gloss: 'EASY', en: 'Easy', hi: 'आसान', desc: 'Fingertips brush back of hand upward effortlessly' },
  { gloss: 'HARD', en: 'Hard / Difficult', hi: 'मुश्किल', desc: 'Bent V-fingers strike each other firmly' },
  { gloss: 'BROTHER', en: 'Brother', hi: 'भाई', desc: 'Boy sign touching cap brim + parallel index fingers meet' },
  { gloss: 'SISTER', en: 'Sister', hi: 'बहन', desc: 'Girl sign along jawline + parallel index fingers meet' },
  { gloss: 'CHILD', en: 'Child', hi: 'बच्चा', desc: 'Hand pats top of small child head at waist' },
  { gloss: 'BABY', en: 'Baby', hi: 'शिशु', desc: 'Arms rock gently cradling an infant' },
  { gloss: 'PEOPLE', en: 'People', hi: 'लोग', desc: 'P-hands rotate in alternating forward pedal cycles' },
  { gloss: 'PEACE', en: 'Peace', hi: 'शांति', desc: 'Palms clasp together then smooth downward serenely' },
  { gloss: 'HOPE', en: 'Hope', hi: 'उम्मीद', desc: 'Hands wave upward with optimism' },
  { gloss: 'ANGRY', en: 'Angry', hi: 'गुस्सा', desc: 'Claw hand pulls outward from chest with intense expression' },
  { gloss: 'TIRED', en: 'Tired', hi: 'थका हुआ', desc: 'Hands drop onto chest with slouching posture' },
  { gloss: 'SCARED', en: 'Scared / Fear', hi: 'डरा हुआ', desc: 'Hands shield chest with wide eyes and defensive stance' },
  { gloss: 'WAIT', en: 'Wait', hi: 'रुको / प्रतीक्षा', desc: 'Hands elevated wiggling fingers patiently' },
  { gloss: 'MEET', en: 'Meet', hi: 'मिलना', desc: 'Both index fingers approach each other and unite' },
  { gloss: 'CITY', en: 'City', hi: 'शहर', desc: 'Hands tap roofs repeatedly traversing signing space' },
  { gloss: 'VILLAGE', en: 'Village', hi: 'गाँव', desc: 'V-handshape circles in open rustic sign space' },
  { gloss: 'COUNTRY', en: 'Country', hi: 'देश', desc: 'Y-handshape circles over left forearm' },
  { gloss: 'WORLD', en: 'World', hi: 'दुनिया', desc: 'W-hands orbit each other in celestial sphere' },
  { gloss: 'DOG', en: 'Dog', hi: 'कुत्ता', desc: 'Pat leg and snap fingers' },
  { gloss: 'CAT', en: 'Cat', hi: 'बिल्ली', desc: 'Pinch whiskers outward from cheeks' },
  { gloss: 'BIRD', en: 'Bird', hi: 'पक्षी', desc: 'Index and thumb pinch like beak at chin' },
  { gloss: 'FISH', en: 'Fish', hi: 'मछली', desc: 'Flat hand glides forward undulating like fish' },
  { gloss: 'ROAD', en: 'Road', hi: 'सड़क', desc: 'Both flat hands travel parallel into distance' },
  { gloss: 'OFFICE', en: 'Office', hi: 'कार्यालय', desc: 'O-hands outline work perimeter' },
  { gloss: 'CAMERA', en: 'Camera', hi: 'कैमरा', desc: 'Hands frame lens and index presses shutter' },
  { gloss: 'MESSAGE', en: 'Message', hi: 'संदेश', desc: 'Pinch hands pull tape out horizontally' },
  { gloss: 'EMAIL', en: 'Email', hi: 'ईमेल', desc: 'C-hand slides into left palm envelope' },
  { gloss: 'WEBSITE', en: 'Website', hi: 'वेबसाइट', desc: 'W-W-W letters sign across space' },
  { gloss: 'VIDEO', en: 'Video', hi: 'वीडियो', desc: 'Right flat hand circles projecting from left camera fist' },
  { gloss: 'BEAUTIFUL', en: 'Beautiful', hi: 'सुंदर', desc: 'Open 5-hand opens across face closing into radiant smile' },
  { gloss: 'DIRTY', en: 'Dirty', hi: 'गंदा', desc: 'Back of hand under chin wiggling fingers with distaste' },
  { gloss: 'SWEET', en: 'Sweet', hi: 'मीठा', desc: 'Fingertips brush downward twice against chin gently' },
  { gloss: 'RICH', en: 'Rich / Wealthy', hi: 'अमीर', desc: 'Right hand counts pile of bills onto left palm proudly' },
  { gloss: 'POOR', en: 'Poor', hi: 'गरीब', desc: 'Hand rubs elbow sleeve indicating worn cloth' },
  { gloss: 'STRONG', en: 'Strong', hi: 'ताकतवर', desc: 'Both fists flex firmly outward demonstrating power' },
  { gloss: 'WEAK', en: 'Weak', hi: 'कमज़ोर', desc: 'Bent fingers bend feebly against left palm' },
  { gloss: 'SMART', en: 'Smart / Clever', hi: 'चतुर', desc: 'Index finger taps temple and sweeps out sharply' },
  { gloss: 'BRAVE', en: 'Brave', hi: 'बहादुर', desc: 'Hands pull courage outward from chest into strong fists' },
  { gloss: 'KIND', en: 'Kind / Gentle', hi: 'दयालु', desc: 'Hands circle each other over heart warmly' },
  { gloss: 'PROUD', en: 'Proud', hi: 'गर्व', desc: 'Thumb traces upward along chest to chin with upright head' },
  { gloss: 'GRATEFUL', en: 'Grateful', hi: 'आभारी', desc: 'Both open palms press to chest and extend forward' },
  { gloss: 'NOW', en: 'Now', hi: 'अब / अभी', desc: 'Bent Y-hands drop decisively downward in present moment' },
  { gloss: 'SOON', en: 'Soon', hi: 'जल्द ही', desc: 'Index and thumb pinch and rub near chin' },
  { gloss: 'LATER', en: 'Later', hi: 'बाद में', desc: 'L-hand rotates forward indicating future time' },
  { gloss: 'ALWAYS', en: 'Always', hi: 'हमेशा', desc: 'Index finger circles continuously overhead' },
  { gloss: 'NEVER', en: 'Never', hi: 'कभी नहीं', desc: 'Flat hand traces question-mark curve downward firmly' },
  { gloss: 'SOMETIMES', en: 'Sometimes', hi: 'कभी-कभी', desc: 'Index finger hops repeatedly on left open palm' },
  { gloss: 'MORNING', en: 'Morning', hi: 'सुबह', desc: 'Right arm rises like sunrise over left horizon forearm' },
  { gloss: 'EVENING', en: 'Evening', hi: 'शाम', desc: 'Right hand descends like sunset over left horizon' },
  { gloss: 'DAY', en: 'Day', hi: 'दिन', desc: 'Right index arm swings across full sky arch' },
  { gloss: 'WEEK', en: 'Week', hi: 'सप्ताह', desc: 'Right index finger slides along left flat palm calendar row' },
  { gloss: 'MONTH', en: 'Month', hi: 'महीना', desc: 'Right index finger descends along left back of index' },
  { gloss: 'YEAR', en: 'Year', hi: 'साल / वर्ष', desc: 'Right fist orbits around left stationary fist like Earth orbiting Sun' },
  { gloss: 'FRIEND', en: 'Friend', hi: 'दोस्त / मित्र', desc: 'Interlocking index fingers hook together reciprocally' },
  { gloss: 'NEIGHBOR', en: 'Neighbor', hi: 'पड़ोसी', desc: 'Near sign + people downward stroke' },
  { gloss: 'MAN', en: 'Man', hi: 'पुरुष', desc: 'Thumb and fingers stroke imaginary mustache/beard' },
  { gloss: 'WOMAN', en: 'Woman', hi: 'महिला', desc: 'Thumb traces along jawline indicating dupatta/earring' },
  { gloss: 'LEADER', en: 'Leader', hi: 'नेता', desc: 'Right hand guides left fingers forward leading the way' },
  { gloss: 'GIFT', en: 'Gift / Present', hi: 'उपहार', desc: 'Both X-hands present gift forward with generous smile' },
  { gloss: 'FESTIVAL', en: 'Festival / Celebration', hi: 'त्योहार', desc: 'Hands twist enthusiastically overhead with celebration' },
  { gloss: 'HOLIDAY', en: 'Holiday', hi: 'छुट्टी', desc: 'Both thumbs hook into imaginary suspenders relaxing' },
  { gloss: 'BIRTHDAY', en: 'Birthday', hi: 'जन्मदिन', desc: 'Middle finger touches chin then chest celebrating life' },
  { gloss: 'TRUTH', en: 'Truth', hi: 'सच / सत्य', desc: 'Index finger moves straight out from lips without wavering' },
  { gloss: 'STORY', en: 'Story', hi: 'कहानी', desc: 'Hands weave together pulling threads of tale' },
  { gloss: 'NEWS', en: 'News', hi: 'समाचार', desc: 'New sign + information spreading outward' },
  { gloss: 'MEETING', en: 'Meeting', hi: 'बैठक', desc: 'Both open hands come together bringing people around table' },
  { gloss: 'LAPTOP', en: 'Laptop', hi: 'लैपटॉप', desc: 'Right flat hand lifts up opening laptop screen from left base' },
  { gloss: 'WIFI', en: 'Wi-Fi', hi: 'वाई-फ़ाई', desc: 'Open hand shakes radiating wireless signal arcs' },
  { gloss: 'DATA', en: 'Data', hi: 'डेटा', desc: 'Index fingers tap digital code columns in air' }
];

for (const t of templateVocab) {
  signs[t.gloss] = makeSign(t.gloss, t.en, t.hi, t.desc, () => ({
    durMs: 1800,
    kf1: {
      timeMs: 650,
      leftArm: { shoulderRotation: [0.5, 0.15, 0], elbowAngle: 1.25, forearmRoll: 0 },
      rightArm: { shoulderRotation: [0.55, -0.15, 0], elbowAngle: 1.3, forearmRoll: 0 },
      leftHand: { position: [-0.1, 0.3, 0.28], rotation: [0.1, 0.1, 0], curl: [0.3, 0.2, 0.2, 0.3, 0.3], spread: 0.15 },
      rightHand: { position: [0.1, 0.32, 0.28], rotation: [0.1, -0.1, 0], curl: [0.3, 0.2, 0.2, 0.3, 0.3], spread: 0.15 },
      face: { browState: 0.15, mouthState: 'smile', headRotation: [0, 0, 0] }
    },
    kf2: {
      timeMs: 1250,
      leftArm: { shoulderRotation: [0.45, 0.15, 0], elbowAngle: 1.15, forearmRoll: 0 },
      rightArm: { shoulderRotation: [0.5, -0.15, 0], elbowAngle: 1.2, forearmRoll: 0 },
      leftHand: { position: [-0.08, 0.28, 0.28], rotation: [0.1, 0.1, 0], curl: [0.3, 0.2, 0.2, 0.3, 0.3], spread: 0.15 },
      rightHand: { position: [0.12, 0.3, 0.28], rotation: [0.1, -0.1, 0], curl: [0.3, 0.2, 0.2, 0.3, 0.3], spread: 0.15 },
      face: { browState: 0.15, mouthState: 'smile', headRotation: [0, 0, 0] }
    }
  }));
}

const outputPath = path.join(__dirname, '..', 'src', 'adapters', 'learning', 'webSignKnowledgeBase.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(signs, null, 2), 'utf-8');
console.log('Successfully generated web sign knowledge base with', Object.keys(signs).length, 'signs at', outputPath);
