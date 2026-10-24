import React from 'react';
import { InterpolatedPose } from './SignAnimatorAdapter';

interface SvgAvatarProps {
  pose: InterpolatedPose;
  skinTone?: string;
  outfitColor?: string;
  className?: string;
}

export const SvgAvatarAdapter: React.FC<SvgAvatarProps> = ({
  pose,
  skinTone = '#e0ac69',
  outfitColor = '#0d9488',
  className = 'w-full h-full'
}) => {
  // Center points and forward kinematics in 2D space (ViewBox: 400 x 440)
  const neckX = 200;
  const neckY = 165;
  const leftShoulderX = 135;
  const rightShoulderX = 265;
  const shoulderY = 185;

  // Left Arm Joint Kinematics
  const leftArmPitch = pose.leftArm.shoulderRotation[0];
  const leftElbowAngle = pose.leftArm.elbowAngle;
  const leftElbowX = leftShoulderX - Math.cos(leftArmPitch) * 52;
  const leftElbowY = shoulderY + Math.sin(leftArmPitch) * 45 + 32;
  const leftHandX = leftElbowX + Math.sin(leftElbowAngle) * 55 + pose.leftHand.position[0] * 70;
  const leftHandY = leftElbowY - Math.cos(leftElbowAngle) * 55 - pose.leftHand.position[1] * 70;

  // Right Arm Joint Kinematics
  const rightArmPitch = pose.rightArm.shoulderRotation[0];
  const rightElbowAngle = pose.rightArm.elbowAngle;
  const rightElbowX = rightShoulderX + Math.cos(rightArmPitch) * 52;
  const rightElbowY = shoulderY + Math.sin(rightArmPitch) * 45 + 32;
  const rightHandX = rightElbowX - Math.sin(rightElbowAngle) * 55 + pose.rightHand.position[0] * 70;
  const rightHandY = rightElbowY - Math.cos(rightElbowAngle) * 55 - pose.rightHand.position[1] * 70;

  // Head Rotations & NMM Expressions
  const headTiltDeg = pose.face.headRotation[2] * (180 / Math.PI);
  const headNodY = pose.face.headRotation[0] * 12;
  const browOffset = -pose.face.browState * 6;
  const browAngle = pose.face.browState * 10;

  return (
    <svg
      viewBox="0 0 400 440"
      className={className}
      role="img"
      aria-label="Professional 2D Vector Sign Language Avatar"
    >
      <defs>
        {/* Modern Studio Ambient Backdrop */}
        <radialGradient id="stageAura" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#0f172a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#020617" stopOpacity="1" />
        </radialGradient>

        {/* Outfit Shading */}
        <linearGradient id="outfitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={outfitColor} />
          <stop offset="100%" stopColor="#042f2e" />
        </linearGradient>

        {/* Skin Depth Shading */}
        <linearGradient id="skinGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.25" />
        </linearGradient>

        {/* Studio Pedestal Drop Shadow */}
        <filter id="pedestalShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* Background Studio Aura */}
      <rect width="400" height="440" fill="url(#stageAura)" rx="24" />

      {/* Stage Floor Pedestal */}
      <ellipse cx="200" cy="410" rx="140" ry="24" fill="#090d16" stroke="#1e293b" strokeWidth="2" filter="url(#pedestalShadow)" />

      {/* Torso & Contoured Garment */}
      <path
        d="M 125 185 Q 115 280 135 390 L 265 390 Q 285 280 275 185 Q 200 205 125 185 Z"
        fill="url(#outfitGrad)"
        stroke="#0f172a"
        strokeWidth="3"
      />
      {/* Torso Shading Contour */}
      <path
        d="M 125 185 Q 115 280 135 390 L 265 390 Q 285 280 275 185 Z"
        fill="url(#skinGrad)"
        opacity="0.4"
      />

      {/* Shirt V-Neck Collar */}
      <path d="M 175 185 Q 200 230 225 185 Z" fill={skinTone} stroke="#0f172a" strokeWidth="2" />
      <path d="M 168 182 L 200 236 L 232 182" fill="none" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.3" />

      {/* Neck */}
      <rect x="187" y="135" width="26" height="50" rx="8" fill={skinTone} stroke="#0f172a" strokeWidth="2.5" />
      <rect x="187" y="135" width="26" height="50" rx="8" fill="url(#skinGrad)" opacity="0.3" />

      {/* HEAD GROUP with Natural Tilt and Nod */}
      <g transform={`translate(${neckX}, ${neckY - 60}) rotate(${headTiltDeg}) translate(${-neckX}, ${-(neckY - 60) + headNodY})`}>
        {/* Soft Head Drop Shadow */}
        <circle cx="200" cy="105" r="50" fill="#000000" opacity="0.15" />

        {/* Head Base */}
        <circle cx="200" cy="105" r="48" fill={skinTone} stroke="#0f172a" strokeWidth="3" />
        <circle cx="200" cy="105" r="48" fill="url(#skinGrad)" opacity="0.35" />

        {/* Sculpted Ears */}
        <ellipse cx="148" cy="108" rx="8" ry="14" fill={skinTone} stroke="#0f172a" strokeWidth="2" />
        <ellipse cx="252" cy="108" rx="8" ry="14" fill={skinTone} stroke="#0f172a" strokeWidth="2" />

        {/* Modern Stylized Hair */}
        <path
          d="M 148 102 C 150 48, 250 48, 252 102 C 242 84, 158 84, 148 102 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
        {/* Hair Fringe Highlights */}
        <path
          d="M 160 88 Q 190 74 235 84 Q 200 78 160 88 Z"
          fill="#334155"
        />

        {/* EYEBROWS with ISL Grammatical Furrow / Raise */}
        {/* Left Eyebrow */}
        <g transform={`translate(178, ${90 + browOffset}) rotate(${browAngle}) translate(-178, ${-(90 + browOffset)})`}>
          <path
            d="M 166 92 Q 178 86 190 92"
            stroke="#0f172a"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        {/* Right Eyebrow */}
        <g transform={`translate(222, ${90 + browOffset}) rotate(${-browAngle}) translate(-222, ${-(90 + browOffset)})`}>
          <path
            d="M 210 92 Q 222 86 234 92"
            stroke="#0f172a"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* EYES with Sclera & Iris Highlights */}
        {/* Left Eye */}
        <ellipse cx="178" cy="105" rx="9" ry="7" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="178" cy="105" r="4.5" fill="#0f172a" />
        <circle cx="176.5" cy="103" r="1.5" fill="#ffffff" />

        {/* Right Eye */}
        <ellipse cx="222" cy="105" rx="9" ry="7" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="222" cy="105" r="4.5" fill="#0f172a" />
        <circle cx="220.5" cy="103" r="1.5" fill="#ffffff" />

        {/* Sculpted Nose */}
        <path d="M 200 102 L 197 116 Q 200 119 204 116 Z" fill="#b45309" opacity="0.35" />

        {/* EXPRESSIVE MOUTH */}
        {pose.face.mouthState === 'open' && (
          <ellipse cx="200" cy="128" rx="8" ry="10" fill="#881337" stroke="#0f172a" strokeWidth="2" />
        )}
        {pose.face.mouthState === 'smile' && (
          <path d="M 188 126 Q 200 136 212 126" fill="none" stroke="#881337" strokeWidth="3.5" strokeLinecap="round" />
        )}
        {pose.face.mouthState === 'round' && (
          <circle cx="200" cy="128" r="6" fill="#881337" stroke="#0f172a" strokeWidth="2" />
        )}
        {pose.face.mouthState === 'tight-lips' && (
          <line x1="190" y1="128" x2="210" y2="128" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
        )}
        {(!pose.face.mouthState || pose.face.mouthState === 'neutral') && (
          <path d="M 191 128 Q 200 131 209 128" fill="none" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
        )}
      </g>

      {/* LEFT ARM (Smooth Organic Bézier Curves) */}
      <path
        d={`M ${leftShoulderX} ${shoulderY} Q ${leftElbowX} ${leftElbowY} ${leftHandX} ${leftHandY}`}
        stroke={skinTone}
        strokeWidth="28"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M ${leftShoulderX} ${shoulderY} Q ${leftElbowX} ${leftElbowY} ${leftHandX} ${leftHandY}`}
        stroke="#0f172a"
        strokeWidth="30"
        strokeLinecap="round"
        fill="none"
        opacity="0.1"
      />
      {/* Shoulder Sleeve */}
      <circle cx={leftShoulderX} cy={shoulderY} r="18" fill="url(#outfitGrad)" stroke="#0f172a" strokeWidth="2.5" />

      {/* LEFT HAND & FINGERS */}
      <g transform={`translate(${leftHandX}, ${leftHandY})`}>
        {/* Palm Center */}
        <circle cx="0" cy="0" r="16" fill={skinTone} stroke="#0f172a" strokeWidth="2.5" />
        {/* Opposable Thumb */}
        <ellipse cx="-12" cy="4" rx="8" ry="5" fill={skinTone} stroke="#0f172a" strokeWidth="2" transform="rotate(-30)" />
        {/* 4 Articulated Fingers */}
        {[-9, -3, 3, 9].map((offset, idx) => {
          const curl = pose.leftHand.curl[idx + 1] ?? 0;
          const fingerLen = 16 - curl * 10;
          return (
            <line
              key={idx}
              x1={offset}
              y1="-10"
              x2={offset}
              y2={-10 - fingerLen}
              stroke={skinTone}
              strokeWidth="5"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* RIGHT ARM (Smooth Organic Bézier Curves) */}
      <path
        d={`M ${rightShoulderX} ${shoulderY} Q ${rightElbowX} ${rightElbowY} ${rightHandX} ${rightHandY}`}
        stroke={skinTone}
        strokeWidth="28"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M ${rightShoulderX} ${shoulderY} Q ${rightElbowX} ${rightElbowY} ${rightHandX} ${rightHandY}`}
        stroke="#0f172a"
        strokeWidth="30"
        strokeLinecap="round"
        fill="none"
        opacity="0.1"
      />
      {/* Shoulder Sleeve */}
      <circle cx={rightShoulderX} cy={shoulderY} r="18" fill="url(#outfitGrad)" stroke="#0f172a" strokeWidth="2.5" />

      {/* RIGHT HAND & FINGERS */}
      <g transform={`translate(${rightHandX}, ${rightHandY})`}>
        {/* Palm Center */}
        <circle cx="0" cy="0" r="16" fill={skinTone} stroke="#0f172a" strokeWidth="2.5" />
        {/* Opposable Thumb */}
        <ellipse cx="12" cy="4" rx="8" ry="5" fill={skinTone} stroke="#0f172a" strokeWidth="2" transform="rotate(30)" />
        {/* 4 Articulated Fingers */}
        {[-9, -3, 3, 9].map((offset, idx) => {
          const curl = pose.rightHand.curl[idx + 1] ?? 0;
          const fingerLen = 16 - curl * 10;
          return (
            <line
              key={idx}
              x1={offset}
              y1="-10"
              x2={offset}
              y2={-10 - fingerLen}
              stroke={skinTone}
              strokeWidth="5"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </svg>
  );
};
