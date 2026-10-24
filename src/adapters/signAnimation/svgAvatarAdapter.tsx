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
  // Compute 2D joint coordinates from pose rotations and arm angles
  const shoulderY = 160;
  const leftShoulderX = 140;
  const rightShoulderX = 260;

  // Left arm forward kinematics
  const leftElbowAngle = pose.leftArm.elbowAngle;
  const leftArmPitch = pose.leftArm.shoulderRotation[0];
  const leftElbowX = leftShoulderX - Math.cos(leftArmPitch) * 45;
  const leftElbowY = shoulderY + Math.sin(leftArmPitch) * 45 + 30;
  const leftHandX = leftElbowX + Math.sin(leftElbowAngle) * 45 + pose.leftHand.position[0] * 80;
  const leftHandY = leftElbowY - Math.cos(leftElbowAngle) * 45 - pose.leftHand.position[1] * 80;

  // Right arm forward kinematics
  const rightElbowAngle = pose.rightArm.elbowAngle;
  const rightArmPitch = pose.rightArm.shoulderRotation[0];
  const rightElbowX = rightShoulderX + Math.cos(rightArmPitch) * 45;
  const rightElbowY = shoulderY + Math.sin(rightArmPitch) * 45 + 30;
  const rightHandX = rightElbowX - Math.sin(rightElbowAngle) * 45 + pose.rightHand.position[0] * 80;
  const rightHandY = rightElbowY - Math.cos(rightElbowAngle) * 45 - pose.rightHand.position[1] * 80;

  // Face head rotation and brow state
  const headTilt = pose.face.headRotation[2] * (180 / Math.PI);
  const headNod = pose.face.headRotation[0] * 15;
  const browOffset = -pose.face.browState * 4;

  return (
    <svg
      viewBox="0 0 400 420"
      className={className}
      role="img"
      aria-label="2D Accessible Sign Language Avatar"
    >
      <defs>
        <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="420" fill="url(#stageGlow)" rx="16" />

      {/* Torso & Upper Body */}
      <path
        d="M 125 180 L 140 340 L 260 340 L 275 180 Z"
        fill={outfitColor}
        stroke="#000000"
        strokeWidth="3"
      />
      {/* Collar */}
      <path d="M 180 180 L 200 210 L 220 180 Z" fill={skinTone} />

      {/* Neck */}
      <rect x="188" y="140" width="24" height="42" fill={skinTone} stroke="#000000" strokeWidth="2" />

      {/* Head Group (tilts and nods) */}
      <g transform={`translate(200, 110) rotate(${headTilt}) translate(-200, ${-110 + headNod})`}>
        {/* Head Base */}
        <circle cx="200" cy="110" r="48" fill={skinTone} stroke="#000000" strokeWidth="3" />
        
        {/* Hair / Stylized Crown */}
        <path
          d="M 152 105 C 155 60, 245 60, 248 105 C 235 90, 165 90, 152 105 Z"
          fill="#1e293b"
        />

        {/* Eyebrows */}
        <path
          d={`M 175 ${95 + browOffset} Q 185 ${92 + browOffset} 193 ${95 + browOffset}`}
          stroke="#0f172a"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 207 ${95 + browOffset} Q 215 ${92 + browOffset} 225 ${95 + browOffset}`}
          stroke="#0f172a"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyes */}
        <ellipse cx="184" cy="108" rx="4" ry="5" fill="#0f172a" />
        <ellipse cx="216" cy="108" rx="4" ry="5" fill="#0f172a" />

        {/* Nose */}
        <path d="M 198 114 L 202 122 L 197 124" stroke="#000000" strokeWidth="2" fill="none" />

        {/* Mouth */}
        {pose.face.mouthState === 'open' ? (
          <ellipse cx="200" cy="135" rx="8" ry="7" fill="#881337" stroke="#000000" strokeWidth="2" />
        ) : pose.face.mouthState === 'smile' ? (
          <path d="M 188 132 Q 200 144 212 132" stroke="#881337" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : pose.face.mouthState === 'round' ? (
          <circle cx="200" cy="135" r="5" fill="#881337" stroke="#000000" strokeWidth="2" />
        ) : (
          <line x1="192" y1="135" x2="208" y2="135" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
        )}
      </g>

      {/* Left Arm & Forearm */}
      <line
        x1={leftShoulderX}
        y1={shoulderY}
        x2={leftElbowX}
        y2={leftElbowY}
        stroke={outfitColor}
        strokeWidth="20"
        strokeLinecap="round"
      />
      <line
        x1={leftElbowX}
        y1={leftElbowY}
        x2={leftHandX}
        y2={leftHandY}
        stroke={skinTone}
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* Left Hand & Fingers */}
      <circle cx={leftHandX} cy={leftHandY} r="14" fill={skinTone} stroke="#000000" strokeWidth="2" />
      {pose.leftHand.curl[1] < 0.5 && (
        <line x1={leftHandX} y1={leftHandY} x2={leftHandX - 8} y2={leftHandY - 14} stroke={skinTone} strokeWidth="5" strokeLinecap="round" />
      )}
      {pose.leftHand.curl[2] < 0.5 && (
        <line x1={leftHandX} y1={leftHandY} x2={leftHandX} y2={leftHandY - 16} stroke={skinTone} strokeWidth="5" strokeLinecap="round" />
      )}

      {/* Right Arm & Forearm */}
      <line
        x1={rightShoulderX}
        y1={shoulderY}
        x2={rightElbowX}
        y2={rightElbowY}
        stroke={outfitColor}
        strokeWidth="20"
        strokeLinecap="round"
      />
      <line
        x1={rightElbowX}
        y1={rightElbowY}
        x2={rightHandX}
        y2={rightHandY}
        stroke={skinTone}
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* Right Hand & Fingers */}
      <circle cx={rightHandX} cy={rightHandY} r="14" fill={skinTone} stroke="#000000" strokeWidth="2" />
      {pose.rightHand.curl[1] < 0.5 && (
        <line x1={rightHandX} y1={rightHandY} x2={rightHandX + 8} y2={rightHandY - 14} stroke={skinTone} strokeWidth="5" strokeLinecap="round" />
      )}
      {pose.rightHand.curl[2] < 0.5 && (
        <line x1={rightHandX} y1={rightHandY} x2={rightHandX} y2={rightHandY - 16} stroke={skinTone} strokeWidth="5" strokeLinecap="round" />
      )}
    </svg>
  );
};
