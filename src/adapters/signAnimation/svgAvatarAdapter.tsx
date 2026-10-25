import React from 'react';
import { InterpolatedPose } from './SignAnimatorAdapter';
import { VisualStyle } from './threeAvatarAdapter';

interface SvgAvatarProps {
  pose: InterpolatedPose;
  skinTone?: string;
  outfitColor?: string;
  visualStyle?: VisualStyle;
  className?: string;
}

export const SvgAvatarAdapter: React.FC<SvgAvatarProps> = ({
  pose,
  skinTone = '#e0ac69',
  outfitColor = '#0d9488',
  visualStyle = 'STUDIO_HUMAN',
  className = 'w-full h-full'
}) => {
  const isHolo = visualStyle === 'CYBER_HOLOGRAM';

  // SVO / Shoulder anchor positions in SVG coordinate system (400 x 440)
  const neckX = 200;
  const neckY = 165;
  const leftShoulderX = 145;
  const rightShoulderX = 255;
  const shoulderY = 185;

  // 1. Two-Handed Geometric Target Coordinates in Signing Space
  const rawL = pose.leftHand.position || [-0.15, -0.1, 0.2];
  const rawR = pose.rightHand.position || [0.15, -0.1, 0.2];

  let targetLeftX = 200 + rawL[0] * 210;
  let targetLeftY = 245 - rawL[1] * 180;
  let targetRightX = 200 + rawR[0] * 210;
  let targetRightY = 245 - rawR[1] * 180;

  // 2. Two-Handed Interaction & Contact Solver
  const isCenterL = Math.abs(rawL[0]) <= 0.08;
  const isCenterR = Math.abs(rawR[0]) <= 0.08;
  const dist2D = Math.hypot(targetRightX - targetLeftX, targetRightY - targetLeftY);

  let isPrayingNamaste = false;
  let isSupportHelp = false;

  if ((isCenterL && isCenterR) || dist2D < 48) {
    const leftExt = (pose.leftHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) < 0.35;
    const rightExt = (pose.rightHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) < 0.35;
    const rightFist = (pose.rightHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) > 0.6;

    if (leftExt && rightExt) {
      // Namaste / Prayer: Hands meet flush at center
      isPrayingNamaste = true;
      const midY = (targetLeftY + targetRightY) / 2;
      targetLeftX = 194;
      targetRightX = 206;
      targetLeftY = midY;
      targetRightY = midY;
    } else if (leftExt && rightFist) {
      // Support / Help: Right fist on left palm
      isSupportHelp = true;
      targetLeftX = 200;
      targetRightX = 200;
      targetRightY = targetLeftY - 26;
    } else {
      // General close interaction (WORK, MEET, FRIEND)
      if (dist2D < 22) {
        targetLeftX = 189;
        targetRightX = 211;
      }
    }
  }

  // 3. 2D Inverse Kinematics Elbow Placement (Anatomical Outward Flare)
  const dLX = targetLeftX - leftShoulderX;
  const dLY = targetLeftY - shoulderY;
  const distL = Math.hypot(dLX, dLY);
  const midLX = (leftShoulderX + targetLeftX) / 2;
  const midLY = (shoulderY + targetLeftY) / 2;
  const leftElbowX = midLX - Math.max(20, 52 - distL * 0.22);
  const leftElbowY = midLY + 16;

  const dRX = targetRightX - rightShoulderX;
  const dRY = targetRightY - shoulderY;
  const distR = Math.hypot(dRX, dRY);
  const midRX = (rightShoulderX + targetRightX) / 2;
  const midRY = (shoulderY + targetRightY) / 2;
  const rightElbowX = midRX + Math.max(20, 52 - distR * 0.22);
  const rightElbowY = midRY + 16;

  // Head Rotations & NMM Expressions
  const headTiltDeg = pose.face.headRotation[2] * (180 / Math.PI);
  const headNodY = pose.face.headRotation[0] * 12;
  const browOffset = -pose.face.browState * 6;
  const browAngle = pose.face.browState * 10;

  // Active theme colors
  const activeSkin = isHolo ? '#06b6d4' : skinTone;
  const activeOutfit = isHolo ? '#0284c7' : outfitColor;
  const strokeColor = isHolo ? '#38bdf8' : '#0f172a';
  const glowFilter = isHolo ? 'url(#holoGlow)' : undefined;

  return (
    <svg
      viewBox="0 0 400 440"
      className={className}
      role="img"
      aria-label="Interactive Sign Language Avatar"
    >
      <defs>
        {/* Background Studio / Hologram Aura */}
        <radialGradient id="stageAura" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={isHolo ? '#083344' : '#1e293b'} stopOpacity="0.8" />
          <stop offset="60%" stopColor="#0f172a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#020617" stopOpacity="1" />
        </radialGradient>

        {/* Outfit Shading */}
        <linearGradient id="outfitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={activeOutfit} />
          <stop offset="100%" stopColor={isHolo ? '#0369a1' : '#042f2e'} />
        </linearGradient>

        {/* Skin Depth Shading */}
        <linearGradient id="skinGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={isHolo ? '#67e8f9' : '#ffedd5'} stopOpacity={isHolo ? '0.5' : '0.35'} />
          <stop offset="100%" stopColor={isHolo ? '#0891b2' : '#7c2d12'} stopOpacity={isHolo ? '0.4' : '0.25'} />
        </linearGradient>

        {/* Hologram Bloom Filter */}
        <filter id="holoGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Studio Pedestal Drop Shadow */}
        <filter id="pedestalShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor={isHolo ? '#0891b2' : '#000000'} floodOpacity={isHolo ? '0.5' : '0.75'} />
        </filter>
      </defs>

      {/* Background Stage Aura */}
      <rect width="400" height="440" fill="url(#stageAura)" rx="24" />

      {/* Stage Floor Pedestal */}
      <ellipse cx="200" cy="410" rx="140" ry="24" fill="#090d16" stroke={isHolo ? '#06b6d4' : '#1e293b'} strokeWidth="2" filter="url(#pedestalShadow)" />

      {/* Hologram Concentric Light Rings */}
      {isHolo && (
        <g opacity="0.8">
          <ellipse cx="200" cy="410" rx="110" ry="18" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" />
          <ellipse cx="200" cy="410" rx="75" ry="12" fill="none" stroke="#67e8f9" strokeWidth="1.5" />
          <line x1="90" y1="410" x2="90" y2="160" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="4 6" />
          <line x1="310" y1="410" x2="310" y2="160" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="4 6" />
        </g>
      )}

      {/* Torso & Contoured Garment */}
      <path
        d="M 130 185 Q 120 280 140 390 L 260 390 Q 280 280 270 185 Q 200 205 130 185 Z"
        fill="url(#outfitGrad)"
        stroke={strokeColor}
        strokeWidth="3"
        filter={glowFilter}
        opacity={isHolo ? 0.9 : 1}
      />
      {/* Torso Shading Contour */}
      <path
        d="M 130 185 Q 120 280 140 390 L 260 390 Q 280 280 270 185 Z"
        fill="url(#skinGrad)"
        opacity="0.35"
      />

      {/* Shirt V-Neck Collar */}
      <path d="M 175 185 Q 200 228 225 185 Z" fill={activeSkin} stroke={strokeColor} strokeWidth="2" />
      <path d="M 168 182 L 200 234 L 232 182" fill="none" stroke={isHolo ? '#67e8f9' : '#ffffff'} strokeWidth="3" strokeOpacity="0.4" />

      {/* Neck */}
      <rect x="187" y="135" width="26" height="50" rx="8" fill={activeSkin} stroke={strokeColor} strokeWidth="2.5" />
      <rect x="187" y="135" width="26" height="50" rx="8" fill="url(#skinGrad)" opacity="0.3" />

      {/* HEAD GROUP with Natural Tilt and Nod */}
      <g transform={`translate(${neckX}, ${neckY - 60}) rotate(${headTiltDeg}) translate(${-neckX}, ${-(neckY - 60) + headNodY})`}>
        {/* Soft Head Drop Shadow */}
        <circle cx="200" cy="105" r="50" fill="#000000" opacity="0.15" />

        {/* Head Base */}
        <circle cx="200" cy="105" r="48" fill={activeSkin} stroke={strokeColor} strokeWidth="3" filter={glowFilter} />
        <circle cx="200" cy="105" r="48" fill="url(#skinGrad)" opacity="0.35" />

        {/* Sculpted Ears */}
        <ellipse cx="148" cy="108" rx="8" ry="14" fill={activeSkin} stroke={strokeColor} strokeWidth="2" />
        <ellipse cx="252" cy="108" rx="8" ry="14" fill={activeSkin} stroke={strokeColor} strokeWidth="2" />

        {/* Stylized Hair */}
        <path
          d="M 148 102 C 150 48, 250 48, 252 102 C 242 84, 158 84, 148 102 Z"
          fill={isHolo ? '#0891b2' : '#1e293b'}
          stroke={strokeColor}
          strokeWidth="2.5"
        />

        {/* EYEBROWS with ISL Grammatical Furrow / Raise */}
        <g transform={`translate(178, ${90 + browOffset}) rotate(${browAngle}) translate(-178, ${-(90 + browOffset)})`}>
          <path d="M 166 92 Q 178 86 190 92" stroke={strokeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
        <g transform={`translate(222, ${90 + browOffset}) rotate(${-browAngle}) translate(-222, ${-(90 + browOffset)})`}>
          <path d="M 210 92 Q 222 86 234 92" stroke={strokeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>

        {/* EYES with Sclera & Iris Highlights */}
        <ellipse cx="178" cy="105" rx="9" ry="7" fill={isHolo ? '#e0f2fe' : '#ffffff'} stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="178" cy="105" r="4.5" fill={isHolo ? '#0284c7' : '#0f172a'} />
        <circle cx="176.5" cy="103" r="1.5" fill="#ffffff" />

        <ellipse cx="222" cy="105" rx="9" ry="7" fill={isHolo ? '#e0f2fe' : '#ffffff'} stroke={strokeColor} strokeWidth="1.5" />
        <circle cx="222" cy="105" r="4.5" fill={isHolo ? '#0284c7' : '#0f172a'} />
        <circle cx="220.5" cy="103" r="1.5" fill="#ffffff" />

        {/* Sculpted Nose */}
        <path d="M 200 102 L 197 116 Q 200 119 204 116 Z" fill={isHolo ? '#0284c7' : '#b45309'} opacity="0.35" />

        {/* EXPRESSIVE MOUTH */}
        {pose.face.mouthState === 'open' && (
          <ellipse cx="200" cy="128" rx="8" ry="10" fill={isHolo ? '#0284c7' : '#881337'} stroke={strokeColor} strokeWidth="2" />
        )}
        {pose.face.mouthState === 'smile' && (
          <path d="M 188 126 Q 200 136 212 126" fill="none" stroke={isHolo ? '#0284c7' : '#881337'} strokeWidth="3.5" strokeLinecap="round" />
        )}
        {pose.face.mouthState === 'round' && (
          <circle cx="200" cy="128" r="6" fill={isHolo ? '#0284c7' : '#881337'} stroke={strokeColor} strokeWidth="2" />
        )}
        {pose.face.mouthState === 'tight-lips' && (
          <line x1="190" y1="128" x2="210" y2="128" stroke={isHolo ? '#0284c7' : '#881337'} strokeWidth="3" strokeLinecap="round" />
        )}
        {(!pose.face.mouthState || pose.face.mouthState === 'neutral') && (
          <path d="M 191 128 Q 200 131 209 128" fill="none" stroke={isHolo ? '#0284c7' : '#881337'} strokeWidth="3" strokeLinecap="round" />
        )}
      </g>

      {/* LEFT ARM (2D Geometric IK Outward Flare) */}
      <path
        d={`M ${leftShoulderX} ${shoulderY} Q ${leftElbowX} ${leftElbowY} ${targetLeftX} ${targetLeftY}`}
        stroke={activeSkin}
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
        filter={glowFilter}
      />
      <circle cx={leftShoulderX} cy={shoulderY} r="17" fill="url(#outfitGrad)" stroke={strokeColor} strokeWidth="2.5" />

      {/* LEFT HAND & FINGERS */}
      <g transform={`translate(${targetLeftX}, ${targetLeftY})`}>
        <circle cx="0" cy="0" r="15" fill={activeSkin} stroke={strokeColor} strokeWidth="2.5" filter={glowFilter} />
        {/* Opposable Thumb */}
        {(() => {
          const tCurl = isPrayingNamaste ? 0 : (pose.leftHand.curl[0] ?? 0.1);
          const isFolded = tCurl > 0.45;
          return isFolded ? (
            <ellipse cx="2" cy="2" rx="7" ry="5" fill={activeSkin} stroke={strokeColor} strokeWidth="2" transform="rotate(45)" />
          ) : (
            <ellipse cx="-12" cy="3" rx="8.5" ry="5" fill={activeSkin} stroke={strokeColor} strokeWidth="2" transform="rotate(-30)" />
          );
        })()}
        {/* Splayed / Straightened Fingers */}
        {[-8, -2.5, 3, 8.5].map((offset, idx) => {
          const curl = isPrayingNamaste ? 0 : (pose.leftHand.curl[idx + 1] ?? 0);
          const spread = isPrayingNamaste ? 0.05 : (pose.leftHand.spread ?? 0.1);
          const spreadAngles = [-0.22, -0.07, 0.07, 0.22];
          const isCurled = curl > 0.45;
          if (isCurled) {
            return (
              <circle
                key={idx}
                cx={offset}
                cy={-6 + (curl - 0.4) * 5}
                r="3.8"
                fill={activeSkin}
                stroke={strokeColor}
                strokeWidth="2"
              />
            );
          }
          const fingerLen = 18 - curl * 7;
          const angle = spreadAngles[idx] * (0.35 + spread * 1.2);
          const targetX = offset + Math.sin(angle) * fingerLen;
          const targetY = -9 - Math.cos(angle) * fingerLen;
          return (
            <line
              key={idx}
              x1={offset}
              y1="-9"
              x2={targetX}
              y2={targetY}
              stroke={activeSkin}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* RIGHT ARM (2D Geometric IK Outward Flare) */}
      <path
        d={`M ${rightShoulderX} ${shoulderY} Q ${rightElbowX} ${rightElbowY} ${targetRightX} ${targetRightY}`}
        stroke={activeSkin}
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
        filter={glowFilter}
      />
      <circle cx={rightShoulderX} cy={shoulderY} r="17" fill="url(#outfitGrad)" stroke={strokeColor} strokeWidth="2.5" />

      {/* RIGHT HAND & FINGERS */}
      <g transform={`translate(${targetRightX}, ${targetRightY})`}>
        <circle cx="0" cy="0" r="15" fill={activeSkin} stroke={strokeColor} strokeWidth="2.5" filter={glowFilter} />
        {/* Opposable Thumb */}
        {(() => {
          const tCurl = isPrayingNamaste ? 0 : (pose.rightHand.curl[0] ?? 0.1);
          const isFolded = tCurl > 0.45;
          return isFolded ? (
            <ellipse cx="-2" cy="2" rx="7" ry="5" fill={activeSkin} stroke={strokeColor} strokeWidth="2" transform="rotate(-45)" />
          ) : (
            <ellipse cx="12" cy="3" rx="8.5" ry="5" fill={activeSkin} stroke={strokeColor} strokeWidth="2" transform="rotate(30)" />
          );
        })()}
        {/* Splayed / Straightened Fingers */}
        {[-8, -2.5, 3, 8.5].map((offset, idx) => {
          const curl = isPrayingNamaste ? 0 : (pose.rightHand.curl[idx + 1] ?? 0);
          const spread = isPrayingNamaste ? 0.05 : (pose.rightHand.spread ?? 0.1);
          const spreadAngles = [-0.22, -0.07, 0.07, 0.22];
          const isCurled = curl > 0.45;
          if (isCurled) {
            return (
              <circle
                key={idx}
                cx={offset}
                cy={-6 + (curl - 0.4) * 5}
                r="3.8"
                fill={activeSkin}
                stroke={strokeColor}
                strokeWidth="2"
              />
            );
          }
          const fingerLen = 18 - curl * 7;
          const angle = spreadAngles[idx] * (0.35 + spread * 1.2);
          const targetX = offset + Math.sin(angle) * fingerLen;
          const targetY = -9 - Math.cos(angle) * fingerLen;
          return (
            <line
              key={idx}
              x1={offset}
              y1="-9"
              x2={targetX}
              y2={targetY}
              stroke={activeSkin}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </svg>
  );
};
