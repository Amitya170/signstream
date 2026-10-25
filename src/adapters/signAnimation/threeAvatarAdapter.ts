import * as THREE from 'three';
import { InterpolatedPose } from './SignAnimatorAdapter';

export type VisualStyle = 'STUDIO_HUMAN' | 'CYBER_HOLOGRAM';

export interface AvatarOptions {
  skinTone: string;
  outfitColor: string;
  backgroundColor: string;
  visualStyle?: VisualStyle;
}

export type CameraPreset = 'CHEST_SIGNING' | 'HANDS_FOCUS' | 'FACE_NMM' | 'FREE_ORBIT';

interface FingerRig {
  baseGroup: THREE.Group;
  distalGroup: THREE.Group;
  tipGroup: THREE.Group;
  proximalMesh: THREE.Mesh;
  distalMesh: THREE.Mesh;
  tipMesh: THREE.Mesh;
}

export class ThreeAvatarRig {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private disposed = false;
  private visualStyle: VisualStyle = 'STUDIO_HUMAN';

  // Hierarchical Skeletal Nodes
  private rootGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private collarMesh: THREE.Mesh;
  private neckMesh: THREE.Mesh;

  private headGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private hairMesh: THREE.Mesh;
  private leftFringe: THREE.Mesh;
  private rightFringe: THREE.Mesh;
  private leftEar: THREE.Mesh;
  private rightEar: THREE.Mesh;
  private leftEyeGroup: THREE.Group;
  private rightEyeGroup: THREE.Group;
  private leftEyelid: THREE.Mesh;
  private rightEyelid: THREE.Mesh;
  private leftBrowMesh: THREE.Mesh;
  private rightBrowMesh: THREE.Mesh;
  private noseMesh: THREE.Mesh;
  private mouthMesh: THREE.Mesh;

  // Left Arm & Joint Couplings
  private leftClavicle: THREE.Group;
  private leftShoulderJoint: THREE.Mesh;
  private leftUpperArm: THREE.Mesh;
  private leftElbowGroup: THREE.Group;
  private leftElbowJoint: THREE.Mesh;
  private leftForearm: THREE.Mesh;
  private leftWristGroup: THREE.Group;
  private leftWristJoint: THREE.Mesh;
  private leftPalm: THREE.Mesh;
  private leftFingerRigs: FingerRig[] = [];

  // Right Arm & Joint Couplings
  private rightClavicle: THREE.Group;
  private rightShoulderJoint: THREE.Mesh;
  private rightUpperArm: THREE.Mesh;
  private rightElbowGroup: THREE.Group;
  private rightElbowJoint: THREE.Mesh;
  private rightForearm: THREE.Mesh;
  private rightWristGroup: THREE.Group;
  private rightWristJoint: THREE.Mesh;
  private rightPalm: THREE.Mesh;
  private rightFingerRigs: FingerRig[] = [];

  // Studio Lighting System
  private ambientLight: THREE.AmbientLight;
  private keyLight: THREE.DirectionalLight;
  private cyanRimLight: THREE.DirectionalLight;
  private warmFillLight: THREE.DirectionalLight;
  private hologramUpLight: THREE.PointLight;

  // Studio Realistic Human Materials
  private humanSkinMaterial: THREE.MeshStandardMaterial;
  private humanOutfitMaterial: THREE.MeshStandardMaterial;
  private humanHairMaterial: THREE.MeshStandardMaterial;
  private humanJointMaterial: THREE.MeshStandardMaterial;

  // Cyber Hologram Digital Materials
  private holoSkinMaterial: THREE.MeshStandardMaterial;
  private holoOutfitMaterial: THREE.MeshStandardMaterial;
  private holoHairMaterial: THREE.MeshStandardMaterial;
  private holoJointMaterial: THREE.MeshStandardMaterial;

  // Hologram Projector Pedestal FX
  private stageMesh: THREE.Mesh;
  private hologramPedestalGroup: THREE.Group;
  private hologramRing1: THREE.Mesh;
  private hologramRing2: THREE.Mesh;
  private hologramRays: THREE.Mesh[] = [];

  // Camera Orbit & View Presets
  private activePreset: CameraPreset = 'CHEST_SIGNING';
  private isDragging = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private orbitY = 0;
  private orbitX = 0;
  private zoomDistance = 1.85;

  constructor(container: HTMLElement, options: AvatarOptions) {
    this.container = container;
    this.visualStyle = options.visualStyle || 'STUDIO_HUMAN';
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.backgroundColor);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);

    // 2. High-Precision PBR Renderer with Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.applyCameraPreset('CHEST_SIGNING');

    // 3. Cinematic Studio Three-Point Lighting System
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.keyLight.position.set(1.4, 2.4, 2.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.001;
    this.scene.add(this.keyLight);

    this.cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    this.cyanRimLight.position.set(-1.8, 1.8, -1.4);
    this.scene.add(this.cyanRimLight);

    this.warmFillLight = new THREE.DirectionalLight(0xfef08a, 0.45);
    this.warmFillLight.position.set(1.5, 0.8, -1.0);
    this.scene.add(this.warmFillLight);

    // Hologram Emitter Point Light (from pedestal)
    this.hologramUpLight = new THREE.PointLight(0x06b6d4, 1.8, 2.5);
    this.hologramUpLight.position.set(0, 0.05, 0);
    this.hologramUpLight.visible = this.visualStyle === 'CYBER_HOLOGRAM';
    this.scene.add(this.hologramUpLight);

    // 4. Studio Human Shaded Materials
    this.humanSkinMaterial = new THREE.MeshStandardMaterial({
      color: options.skinTone,
      roughness: 0.42,
      metalness: 0.05
    });

    this.humanOutfitMaterial = new THREE.MeshStandardMaterial({
      color: options.outfitColor,
      roughness: 0.55,
      metalness: 0.1
    });

    this.humanHairMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.75,
      metalness: 0.1
    });

    this.humanJointMaterial = new THREE.MeshStandardMaterial({
      color: options.skinTone,
      roughness: 0.42,
      metalness: 0.05
    });

    // 5. Cyber Hologram Digital Materials
    this.holoSkinMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88
    });

    this.holoOutfitMaterial = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.7,
      transparent: true,
      opacity: 0.84
    });

    this.holoHairMaterial = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.92
    });

    this.holoJointMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.92
    });

    // 6. Rig Construction
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Studio Stage Floor Pedestal
    const stageGeo = new THREE.CylinderGeometry(0.85, 0.9, 0.04, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    this.stageMesh = new THREE.Mesh(stageGeo, stageMat);
    this.stageMesh.position.set(0, -0.04, 0);
    this.stageMesh.receiveShadow = true;
    this.rootGroup.add(this.stageMesh);

    // Hologram Projector Pedestal FX
    this.hologramPedestalGroup = new THREE.Group();
    this.hologramPedestalGroup.position.set(0, -0.015, 0);
    this.hologramPedestalGroup.visible = this.visualStyle === 'CYBER_HOLOGRAM';
    this.rootGroup.add(this.hologramPedestalGroup);

    const holoRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const ring1Geo = new THREE.RingGeometry(0.48, 0.52, 32);
    ring1Geo.rotateX(-Math.PI / 2);
    this.hologramRing1 = new THREE.Mesh(ring1Geo, holoRingMat);
    this.hologramPedestalGroup.add(this.hologramRing1);

    const ring2Geo = new THREE.RingGeometry(0.68, 0.71, 32);
    ring2Geo.rotateX(-Math.PI / 2);
    this.hologramRing2 = new THREE.Mesh(ring2Geo, holoRingMat);
    this.hologramPedestalGroup.add(this.hologramRing2);

    // Hologram Vertical Emitter Beams
    const rayGeo = new THREE.CylinderGeometry(0.005, 0.005, 1.3, 8);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.28
    });
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (const ang of angles) {
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(Math.cos(ang) * 0.48, 0.65, Math.sin(ang) * 0.48);
      this.hologramPedestalGroup.add(ray);
      this.hologramRays.push(ray);
    }

    // Active Materials selector
    const activeSkinMat = this.visualStyle === 'CYBER_HOLOGRAM' ? this.holoSkinMaterial : this.humanSkinMaterial;
    const activeOutfitMat = this.visualStyle === 'CYBER_HOLOGRAM' ? this.holoOutfitMaterial : this.humanOutfitMaterial;
    const activeHairMat = this.visualStyle === 'CYBER_HOLOGRAM' ? this.holoHairMaterial : this.humanHairMaterial;
    const activeJointMat = this.visualStyle === 'CYBER_HOLOGRAM' ? this.holoJointMaterial : this.humanJointMaterial;

    // Torso Group
    this.torsoGroup = new THREE.Group();
    this.rootGroup.add(this.torsoGroup);

    // Anatomical Torso with contoured chest taper
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.48, 24);
    this.torsoMesh = new THREE.Mesh(torsoGeo, activeOutfitMat);
    this.torsoMesh.position.set(0, 0.22, 0);
    this.torsoMesh.castShadow = true;
    this.torsoGroup.add(this.torsoMesh);

    // Professional Collar Trim
    const collarGeo = new THREE.TorusGeometry(0.075, 0.015, 12, 24);
    collarGeo.rotateX(Math.PI / 2);
    this.collarMesh = new THREE.Mesh(collarGeo, activeOutfitMat);
    this.collarMesh.position.set(0, 0.455, 0);
    this.torsoGroup.add(this.collarMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.062, 0.072, 0.09, 20);
    this.neckMesh = new THREE.Mesh(neckGeo, activeSkinMat);
    this.neckMesh.position.set(0, 0.495, 0);
    this.torsoGroup.add(this.neckMesh);

    // 7. Sculpted Head & Expressive Facial Features
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.655, 0);
    this.torsoGroup.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.155, 32, 32);
    this.headMesh = new THREE.Mesh(headGeo, activeSkinMat);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Sculpted Hair
    const hairGeo = new THREE.SphereGeometry(0.162, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62);
    this.hairMesh = new THREE.Mesh(hairGeo, activeHairMat);
    this.hairMesh.position.set(0, 0.02, -0.01);
    this.headGroup.add(this.hairMesh);

    // Hair Side Fringe
    const fringeGeo = new THREE.BoxGeometry(0.06, 0.08, 0.04);
    this.leftFringe = new THREE.Mesh(fringeGeo, activeHairMat);
    this.leftFringe.position.set(-0.13, 0.02, 0.08);
    this.leftFringe.rotation.z = 0.2;
    this.rightFringe = new THREE.Mesh(fringeGeo, activeHairMat);
    this.rightFringe.position.set(0.13, 0.02, 0.08);
    this.rightFringe.rotation.z = -0.2;
    this.headGroup.add(this.leftFringe, this.rightFringe);

    // Sculpted Ears
    const earGeo = new THREE.SphereGeometry(0.035, 12, 12);
    earGeo.scale(0.5, 1, 0.7);
    this.leftEar = new THREE.Mesh(earGeo, activeSkinMat);
    this.leftEar.position.set(-0.155, 0.01, 0);
    this.rightEar = new THREE.Mesh(earGeo, activeSkinMat);
    this.rightEar.position.set(0.155, 0.01, 0);
    this.headGroup.add(this.leftEar, this.rightEar);

    // Expressive Eyes with Pupils & Eyelids
    this.leftEyeGroup = this.createDetailedEye(-0.058);
    this.rightEyeGroup = this.createDetailedEye(0.058);
    this.headGroup.add(this.leftEyeGroup, this.rightEyeGroup);

    this.leftEyelid = this.leftEyeGroup.getObjectByName('eyelid') as THREE.Mesh;
    this.rightEyelid = this.rightEyeGroup.getObjectByName('eyelid') as THREE.Mesh;

    // Sculpted Nose Bridge
    const noseGeo = new THREE.ConeGeometry(0.02, 0.055, 12);
    noseGeo.rotateX(Math.PI / 2);
    this.noseMesh = new THREE.Mesh(noseGeo, activeSkinMat);
    this.noseMesh.position.set(0, 0.01, 0.158);
    this.headGroup.add(this.noseMesh);

    // Expressive Eyebrows for ISL Non-Manual Markers
    const browGeo = new THREE.BoxGeometry(0.075, 0.018, 0.012);
    this.leftBrowMesh = new THREE.Mesh(browGeo, activeHairMat);
    this.leftBrowMesh.position.set(-0.06, 0.078, 0.152);
    this.rightBrowMesh = new THREE.Mesh(browGeo, activeHairMat);
    this.rightBrowMesh.position.set(0.06, 0.078, 0.152);
    this.headGroup.add(this.leftBrowMesh, this.rightBrowMesh);

    // Morph Lips / Mouth
    const mouthGeo = new THREE.CapsuleGeometry(0.022, 0.05, 8, 16);
    mouthGeo.rotateZ(Math.PI / 2);
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0x9f1239,
      roughness: 0.3
    });
    this.mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthMesh.position.set(0, -0.065, 0.152);
    this.headGroup.add(this.mouthMesh);

    // 8. Natural Human Shoulders & Arms (Athletic 0.48m Width)
    const upperArmGeo = new THREE.CylinderGeometry(0.05, 0.044, 0.28, 18);
    upperArmGeo.translate(0, -0.14, 0);

    const forearmGeo = new THREE.CylinderGeometry(0.044, 0.036, 0.26, 18);
    forearmGeo.translate(0, -0.13, 0);

    const shoulderJointGeo = new THREE.SphereGeometry(0.058, 16, 16);
    const elbowJointGeo = new THREE.SphereGeometry(0.048, 16, 16);
    const wristJointGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const palmGeo = new THREE.BoxGeometry(0.078, 0.09, 0.024);

    // LEFT ARM
    this.leftClavicle = new THREE.Group();
    this.leftClavicle.position.set(-0.24, 0.42, 0);
    this.torsoGroup.add(this.leftClavicle);

    this.leftShoulderJoint = new THREE.Mesh(shoulderJointGeo, activeOutfitMat);
    this.leftClavicle.add(this.leftShoulderJoint);

    this.leftUpperArm = new THREE.Mesh(upperArmGeo, activeOutfitMat);
    this.leftUpperArm.castShadow = true;
    this.leftClavicle.add(this.leftUpperArm);

    this.leftElbowGroup = new THREE.Group();
    this.leftElbowGroup.position.set(0, -0.28, 0);
    this.leftClavicle.add(this.leftElbowGroup);

    this.leftElbowJoint = new THREE.Mesh(elbowJointGeo, activeJointMat);
    this.leftElbowGroup.add(this.leftElbowJoint);

    this.leftForearm = new THREE.Mesh(forearmGeo, activeSkinMat);
    this.leftForearm.castShadow = true;
    this.leftElbowGroup.add(this.leftForearm);

    this.leftWristGroup = new THREE.Group();
    this.leftWristGroup.position.set(0, -0.26, 0);
    this.leftElbowGroup.add(this.leftWristGroup);

    this.leftWristJoint = new THREE.Mesh(wristJointGeo, activeJointMat);
    this.leftWristGroup.add(this.leftWristJoint);

    this.leftPalm = new THREE.Mesh(palmGeo, activeSkinMat);
    this.leftPalm.position.set(0, -0.045, 0);
    this.leftPalm.castShadow = true;
    this.leftWristGroup.add(this.leftPalm);

    this.leftFingerRigs = this.build3PhalanxDetailedFingers(this.leftWristGroup, false, activeSkinMat);

    // RIGHT ARM
    this.rightClavicle = new THREE.Group();
    this.rightClavicle.position.set(0.24, 0.42, 0);
    this.torsoGroup.add(this.rightClavicle);

    this.rightShoulderJoint = new THREE.Mesh(shoulderJointGeo, activeOutfitMat);
    this.rightClavicle.add(this.rightShoulderJoint);

    this.rightUpperArm = new THREE.Mesh(upperArmGeo, activeOutfitMat);
    this.rightUpperArm.castShadow = true;
    this.rightClavicle.add(this.rightUpperArm);

    this.rightElbowGroup = new THREE.Group();
    this.rightElbowGroup.position.set(0, -0.28, 0);
    this.rightClavicle.add(this.rightElbowGroup);

    this.rightElbowJoint = new THREE.Mesh(elbowJointGeo, activeJointMat);
    this.rightElbowGroup.add(this.rightElbowJoint);

    this.rightForearm = new THREE.Mesh(forearmGeo, activeSkinMat);
    this.rightForearm.castShadow = true;
    this.rightElbowGroup.add(this.rightForearm);

    this.rightWristGroup = new THREE.Group();
    this.rightWristGroup.position.set(0, -0.26, 0);
    this.rightElbowGroup.add(this.rightWristGroup);

    this.rightWristJoint = new THREE.Mesh(wristJointGeo, activeJointMat);
    this.rightWristGroup.add(this.rightWristJoint);

    this.rightPalm = new THREE.Mesh(palmGeo, activeSkinMat);
    this.rightPalm.position.set(0, -0.045, 0);
    this.rightPalm.castShadow = true;
    this.rightWristGroup.add(this.rightPalm);

    this.rightFingerRigs = this.build3PhalanxDetailedFingers(this.rightWristGroup, true, activeSkinMat);

    this.setupOrbitInteraction();
    this.render();
  }

  private createDetailedEye(posX: number): THREE.Group {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(posX, 0.028, 0.144);

    // Sclera (White of Eye)
    const scleraGeo = new THREE.SphereGeometry(0.024, 16, 16);
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    eyeGroup.add(sclera);

    // Iris & Pupil
    const irisGeo = new THREE.CircleGeometry(0.012, 16);
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(0, 0, 0.022);
    eyeGroup.add(iris);

    // Specular Reflection Glint
    const glintGeo = new THREE.CircleGeometry(0.0035, 8);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const glint = new THREE.Mesh(glintGeo, glintMat);
    glint.position.set(0.004, 0.004, 0.023);
    eyeGroup.add(glint);

    // Upper Eyelid for procedural blinking
    const eyelidGeo = new THREE.SphereGeometry(0.026, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const eyelidMat = this.visualStyle === 'CYBER_HOLOGRAM' ? this.holoSkinMaterial : this.humanSkinMaterial;
    const eyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    eyelid.name = 'eyelid';
    eyelid.position.set(0, 0.002, 0.002);
    eyelid.scale.set(1, 0.1, 1);
    eyeGroup.add(eyelid);

    return eyeGroup;
  }

  /**
   * Anatomically Articulated 3-Phalanx Fingers:
   * Proximal Phalanx -> Intermediate Phalanx -> Distal Fingertip Phalanx.
   */
  private build3PhalanxDetailedFingers(
    wrist: THREE.Group,
    isRight: boolean,
    mat: THREE.MeshStandardMaterial
  ): FingerRig[] {
    const fingerRigs: FingerRig[] = [];
    const spreadAngles = [-0.18, -0.06, 0, 0.06, 0.18];
    const fingerLengths = [0.040, 0.052, 0.056, 0.052, 0.042];

    for (let f = 0; f < 5; f++) {
      const isThumb = f === 0;
      const totalLen = fingerLengths[f];
      const baseGroup = new THREE.Group();

      if (isThumb) {
        // Anatomically opposable thumb mounted laterally on saddle joint
        const thumbX = isRight ? 0.044 : -0.044;
        baseGroup.position.set(thumbX, -0.038, 0.012);
        baseGroup.rotation.z = isRight ? -0.45 : 0.45;
        baseGroup.rotation.y = isRight ? -0.2 : 0.2;
      } else {
        const splayX = (f - 2.5) * 0.016;
        baseGroup.position.set(splayX, -0.09, 0);
        baseGroup.rotation.z = spreadAngles[f];
      }

      // 1. Proximal Phalanx
      const pLen = totalLen * 0.44;
      const pGeo = new THREE.CapsuleGeometry(0.007, pLen, 6, 10);
      pGeo.translate(0, -pLen / 2, 0);
      const proximalMesh = new THREE.Mesh(pGeo, mat);
      proximalMesh.castShadow = true;
      baseGroup.add(proximalMesh);

      // 2. Intermediate Phalanx (Knuckle / PIP joint)
      const distalGroup = new THREE.Group();
      distalGroup.position.set(0, -pLen, 0);
      baseGroup.add(distalGroup);

      const iLen = totalLen * 0.33;
      const iGeo = new THREE.CapsuleGeometry(0.0064, iLen, 6, 10);
      iGeo.translate(0, -iLen / 2, 0);
      const distalMesh = new THREE.Mesh(iGeo, mat);
      distalMesh.castShadow = true;
      distalGroup.add(distalMesh);

      // 3. Distal Phalanx & Rounded Fingertip Pad (DIP joint)
      const tipGroup = new THREE.Group();
      tipGroup.position.set(0, -iLen, 0);
      distalGroup.add(tipGroup);

      const tLen = totalLen * 0.23;
      const tGeo = new THREE.CapsuleGeometry(0.0058, tLen, 6, 10);
      tGeo.translate(0, -tLen / 2, 0);
      const tipMesh = new THREE.Mesh(tGeo, mat);
      tipMesh.castShadow = true;
      tipGroup.add(tipMesh);

      wrist.add(baseGroup);
      fingerRigs.push({
        baseGroup,
        distalGroup,
        tipGroup,
        proximalMesh,
        distalMesh,
        tipMesh
      });
    }

    return fingerRigs;
  }

  private setupOrbitInteraction(): void {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';

    const onPointerDown = (e: PointerEvent) => {
      this.isDragging = true;
      this.activePreset = 'FREE_ORBIT';
      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousPointerPosition.x;
      const deltaY = e.clientY - this.previousPointerPosition.y;

      this.orbitY += deltaX * 0.009;
      this.orbitX = Math.max(-0.4, Math.min(0.5, this.orbitX + deltaY * 0.007));

      this.rootGroup.rotation.y = this.orbitY;
      this.camera.position.y = 0.42 + this.orbitX;

      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
      this.render();
    };

    const onPointerUp = (e: PointerEvent) => {
      this.isDragging = false;
      el.style.cursor = 'grab';
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore pointer capture release errors
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.zoomDistance = Math.max(0.85, Math.min(2.8, this.zoomDistance + e.deltaY * 0.0015));
      this.camera.position.z = this.zoomDistance;
      this.render();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
  }

  public applyCameraPreset(preset: CameraPreset): void {
    this.activePreset = preset;
    this.orbitY = 0;
    this.orbitX = 0;
    this.rootGroup.rotation.y = 0;

    switch (preset) {
      case 'CHEST_SIGNING':
        this.camera.position.set(0, 0.42, 1.85);
        this.camera.lookAt(0, 0.38, 0);
        this.zoomDistance = 1.85;
        break;
      case 'HANDS_FOCUS':
        this.camera.position.set(0, 0.28, 1.25);
        this.camera.lookAt(0, 0.24, 0);
        this.zoomDistance = 1.25;
        break;
      case 'FACE_NMM':
        this.camera.position.set(0, 0.68, 0.95);
        this.camera.lookAt(0, 0.65, 0);
        this.zoomDistance = 0.95;
        break;
      case 'FREE_ORBIT':
        break;
    }

    this.render();
  }

  public resetView(): void {
    this.applyCameraPreset('CHEST_SIGNING');
  }

  /**
   * Analytical 2-Bone Inverse Kinematics (IK) Solver:
   * Solves exact shoulder and elbow orientations to place wristGroup at targetWrist
   * with zero position error. Elbows naturally flare outward using anatomical pole vectors.
   */
  private applyArmIK(
    clavicle: THREE.Group,
    elbowGroup: THREE.Group,
    wristGroup: THREE.Group,
    targetWrist: THREE.Vector3,
    poleVector: THREE.Vector3
  ): void {
    const S = clavicle.position.clone();
    const W = targetWrist.clone();
    const L1 = 0.28; // Upper arm length
    const L2 = 0.26; // Forearm length

    const toTarget = new THREE.Vector3().subVectors(W, S);
    let dist = toTarget.length();
    const maxReach = (L1 + L2) * 0.995;
    const minReach = Math.abs(L1 - L2) * 1.05;
    dist = Math.max(minReach, Math.min(maxReach, dist));

    if (toTarget.length() > maxReach) {
      W.copy(S).add(toTarget.clone().normalize().multiplyScalar(maxReach));
    }

    // Law of Cosines for Shoulder Angle relative to Target Line
    const cosShoulder = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist);
    const shoulderAngle = Math.acos(Math.max(-1, Math.min(1, cosShoulder)));

    const dirTarget = new THREE.Vector3().subVectors(W, S).normalize();
    const normal = new THREE.Vector3().crossVectors(dirTarget, poleVector).normalize();
    const upInPlane = new THREE.Vector3().crossVectors(normal, dirTarget).normalize();

    // Elbow World Position
    const E = S.clone()
      .add(dirTarget.clone().multiplyScalar(L1 * Math.cos(shoulderAngle)))
      .add(upInPlane.clone().multiplyScalar(L1 * Math.sin(shoulderAngle)));

    // Upper Arm points from Shoulder S to Elbow E
    const dirUpper = new THREE.Vector3().subVectors(E, S).normalize();
    const down = new THREE.Vector3(0, -1, 0);
    clavicle.quaternion.setFromUnitVectors(down, dirUpper);

    // Forearm points from Elbow E to Wrist W in Clavicle local coordinates
    const dirForearmWorld = new THREE.Vector3().subVectors(W, E).normalize();
    const clavicleInv = clavicle.quaternion.clone().invert();
    const dirForearmLocal = dirForearmWorld.clone().applyQuaternion(clavicleInv);
    elbowGroup.quaternion.setFromUnitVectors(down, dirForearmLocal);

    // Keep wrist attached at standard anatomical forearm length
    wristGroup.position.set(0, -L2, 0);
  }

  public updatePose(pose: InterpolatedPose): void {
    if (this.disposed) return;

    const now = Date.now() / 1000;

    // 1. Natural Respiratory Chest Oscillation
    const breath = Math.sin(now * 1.85) * 0.015;
    this.torsoMesh.scale.set(1 + breath * 0.4, 1 + breath, 1 + breath * 0.8);
    this.leftClavicle.position.y = 0.42 + breath * 0.3;
    this.rightClavicle.position.y = 0.42 + breath * 0.3;

    // 2. Realistic Eyelid Blinking & Saccadic Eye Micro-Gaze
    const blinkCycle = now % 4.0;
    const isBlinking = blinkCycle < 0.14;
    const eyelidScale = isBlinking ? 1.0 : 0.1;
    this.leftEyelid.scale.y = eyelidScale;
    this.rightEyelid.scale.y = eyelidScale;

    // Natural biological eye saccades (subtle visual tracking of signing space)
    const saccadeCycle = (now * 0.35) % 3.2;
    const saccadeX = saccadeCycle < 0.18 ? 0.0025 : saccadeCycle > 2.9 ? -0.0025 : 0;
    const saccadeY = Math.sin(now * 0.8) * 0.0015;
    this.leftEyeGroup.position.x = -0.058 + saccadeX;
    this.leftEyeGroup.position.y = 0.028 + saccadeY;
    this.rightEyeGroup.position.x = 0.058 + saccadeX;
    this.rightEyeGroup.position.y = 0.028 + saccadeY;

    // 3. Head & Gaze Orientation
    this.headGroup.rotation.set(
      pose.face.headRotation[0],
      pose.face.headRotation[1],
      pose.face.headRotation[2]
    );

    // 4. ISL Non-Manual Markers (Eyebrows)
    const browY = 0.078 + pose.face.browState * 0.024;
    this.leftBrowMesh.position.y = browY;
    this.rightBrowMesh.position.y = browY;

    if (pose.face.browState < -0.2) {
      // WH-Question Furrow: Angled inward
      this.leftBrowMesh.rotation.z = -0.24;
      this.rightBrowMesh.rotation.z = 0.24;
    } else if (pose.face.browState > 0.2) {
      // Polar Question Raised Brows
      this.leftBrowMesh.rotation.z = 0.14;
      this.rightBrowMesh.rotation.z = -0.14;
    } else {
      this.leftBrowMesh.rotation.z = 0;
      this.rightBrowMesh.rotation.z = 0;
    }

    // 5. ISL Mouth Morphemes
    if (pose.face.mouthState === 'open') {
      this.mouthMesh.scale.set(1.2, 2.2, 1);
    } else if (pose.face.mouthState === 'smile') {
      this.mouthMesh.scale.set(1.4, 0.8, 1);
    } else if (pose.face.mouthState === 'round') {
      this.mouthMesh.scale.set(0.7, 1.9, 1);
    } else if (pose.face.mouthState === 'tight-lips') {
      this.mouthMesh.scale.set(1.2, 0.4, 1);
    } else {
      this.mouthMesh.scale.set(1.0, 1.0, 1);
    }

    // 6. Two-Handed Interaction & Contact Solver
    const rawL = pose.leftHand.position || [-0.15, -0.1, 0.2];
    const rawR = pose.rightHand.position || [0.15, -0.1, 0.2];

    // Compute target coordinates in front of chest (mid-sternum at y=0.28, z=0.28)
    const targetLeft = new THREE.Vector3(
      rawL[0],
      0.28 + rawL[1] * 0.75,
      Math.max(0.18, rawL[2] * 0.9)
    );
    const targetRight = new THREE.Vector3(
      rawR[0],
      0.28 + rawR[1] * 0.75,
      Math.max(0.18, rawR[2] * 0.9)
    );

    // Detect two-handed interaction / contact
    const handDistance = targetLeft.distanceTo(targetRight);

    const isPrayingNamaste = pose.activeGloss === 'NAMASTE';
    const isSupportHelp = pose.activeGloss === 'HELP';
    const isThankYouSign = pose.activeGloss === 'THANK-YOU';
    const isDoctorSign = pose.activeGloss === 'DOCTOR';
    const isTimeSign = pose.activeGloss === 'TIME';
    const isPleaseSign = pose.activeGloss === 'PLEASE';
    const isSorrySign = pose.activeGloss === 'SORRY';
    const isWaterSign = pose.activeGloss === 'WATER';

    const p = Math.max(0, Math.min(1, pose.progress ?? 0.5));

    if (isPrayingNamaste) {
      // Namaste / Prayer Gesture: Hands meet flush at center
      const midY = (targetLeft.y + targetRight.y) / 2;
      const midZ = (targetLeft.z + targetRight.z) / 2;
      targetLeft.set(-0.018, midY, midZ);
      targetRight.set(0.018, midY, midZ);
    } else if (isSupportHelp) {
      // Support / Help: Right fist sits on left palm
      const midX = (targetLeft.x + targetRight.x) / 2;
      const midZ = Math.max(targetLeft.z, targetRight.z);
      targetLeft.set(midX, targetLeft.y, midZ);
      targetRight.set(midX, targetLeft.y + 0.045, midZ);
    } else if (isThankYouSign) {
      targetLeft.set(-0.24, 0.15, 0.1);
      if (p <= 0.35) {
        const s = (p / 0.35);
        targetRight.set(0.02 * s, 0.15 + (0.52 - 0.15) * s, 0.1 + (0.22 - 0.1) * s);
      } else if (p <= 0.75) {
        const s = ((p - 0.35) / 0.40);
        targetRight.set(0.02 + 0.06 * s, 0.52 - 0.18 * s, 0.22 + 0.22 * s);
      } else {
        const s = ((p - 0.75) / 0.25);
        targetRight.set(0.08 + (0.24 - 0.08) * s, 0.34 + (0.15 - 0.34) * s, 0.44 + (0.1 - 0.44) * s);
      }
    } else if (isDoctorSign) {
      targetLeft.set(-0.05, 0.30, 0.32);
      targetRight.set(-0.05, 0.32, 0.32);
    } else if (isTimeSign) {
      targetLeft.set(-0.05, 0.32, 0.30);
      targetRight.set(-0.05, 0.34, 0.30);
    } else if (isPleaseSign || isSorrySign) {
      targetLeft.set(-0.24, 0.15, 0.1);
      targetRight.set(0.02, 0.36, 0.20);
    } else if (isWaterSign) {
      targetLeft.set(-0.24, 0.15, 0.1);
      targetRight.set(0.04, 0.50, 0.20);
    } else {
      // General close interaction (WORK, MEET, FRIEND)
      if (handDistance < 0.035) {
        const mid = new THREE.Vector3().addVectors(targetLeft, targetRight).multiplyScalar(0.5);
        targetLeft.x = Math.min(targetLeft.x, mid.x - 0.018);
        targetRight.x = Math.max(targetRight.x, mid.x + 0.018);
      }
    }

    // 7. Apply 2-Bone Analytical IK to Left & Right Arms
    const poleL = new THREE.Vector3(-0.35, -0.25, 0.12).normalize();
    const poleR = new THREE.Vector3(0.35, -0.25, 0.12).normalize();
    this.applyArmIK(this.leftClavicle, this.leftElbowGroup, this.leftWristGroup, targetLeft, poleL);
    this.applyArmIK(this.rightClavicle, this.rightElbowGroup, this.rightWristGroup, targetRight, poleR);

    // 8. Wrist Orientation
    if (isPrayingNamaste) {
      // Palms pressed flush together, fingers pointing vertically up (+Y)
      this.leftWristGroup.rotation.set(0, Math.PI / 2, Math.PI);
      this.rightWristGroup.rotation.set(0, -Math.PI / 2, -Math.PI);
    } else if (isSupportHelp) {
      // Left palm facing up (+Y), right fist on top facing forward
      this.leftWristGroup.rotation.set(Math.PI / 2, 0, 0);
      this.rightWristGroup.rotation.set(0, 0, 0);
    } else if (isThankYouSign) {
      if (p <= 0.35) {
        this.rightWristGroup.rotation.set(-0.6, 0.3, 0);
      } else {
        this.rightWristGroup.rotation.set(0.3, 0, 0);
      }
      this.leftWristGroup.rotation.set(0, 0, 0);
    } else if (isDoctorSign) {
      this.leftWristGroup.rotation.set(Math.PI / 2, 0, 0);
      this.rightWristGroup.rotation.set(-Math.PI / 4, 0, 0);
    } else if (isTimeSign) {
      this.leftWristGroup.rotation.set(-Math.PI / 4, 0, 0);
      this.rightWristGroup.rotation.set(-Math.PI / 4, 0, 0);
    } else {
      this.leftWristGroup.rotation.set(
        pose.leftHand.rotation[0],
        pose.leftHand.rotation[1],
        pose.leftHand.rotation[2]
      );
      this.rightWristGroup.rotation.set(
        pose.rightHand.rotation[0],
        pose.rightHand.rotation[1],
        pose.rightHand.rotation[2]
      );
    }

    // 9. Articulated 3-Phalanx Fingers (Cascading Knuckle, PIP, DIP Flexion)
    const leftSpread = isPrayingNamaste ? 0.04 : (pose.leftHand.spread ?? 0.1);
    const rightSpread = isPrayingNamaste ? 0.04 : (pose.rightHand.spread ?? 0.1);
    const spreadFactors = [0, -0.22, -0.06, 0.08, 0.24];

    for (let f = 0; f < 5; f++) {
      const curlL = isPrayingNamaste ? 0 : (pose.leftHand.curl[f] ?? 0);
      const rigL = this.leftFingerRigs[f];
      if (rigL) {
        if (f === 0) {
          // Opposable thumb saddle rotation
          rigL.baseGroup.rotation.x = curlL * 0.9;
          rigL.baseGroup.rotation.y = 0.2 + curlL * 0.45;
          rigL.baseGroup.rotation.z = 0.45 - leftSpread * 0.35 + curlL * 0.25;
          rigL.distalGroup.rotation.x = curlL * 1.1;
          rigL.tipGroup.rotation.x = curlL * 0.9;
        } else {
          rigL.baseGroup.rotation.x = curlL * 1.0;
          rigL.baseGroup.rotation.z = spreadFactors[f] * (0.35 + leftSpread * 1.1);
          rigL.distalGroup.rotation.x = curlL * 1.15;
          rigL.tipGroup.rotation.x = curlL * 0.95;
        }
      }

      const curlR = isPrayingNamaste ? 0 : (pose.rightHand.curl[f] ?? 0);
      const rigR = this.rightFingerRigs[f];
      if (rigR) {
        if (f === 0) {
          rigR.baseGroup.rotation.x = curlR * 0.9;
          rigR.baseGroup.rotation.y = -0.2 - curlR * 0.45;
          rigR.baseGroup.rotation.z = -0.45 + rightSpread * 0.35 - curlR * 0.25;
          rigR.distalGroup.rotation.x = curlR * 1.1;
          rigR.tipGroup.rotation.x = curlR * 0.9;
        } else {
          rigR.baseGroup.rotation.x = curlR * 1.0;
          rigR.baseGroup.rotation.z = spreadFactors[f] * (0.35 + rightSpread * 1.1);
          rigR.distalGroup.rotation.x = curlR * 1.15;
          rigR.tipGroup.rotation.x = curlR * 0.95;
        }
      }
    }

    // 10. Cyber Hologram Pedestal Dynamic Animation
    if (this.visualStyle === 'CYBER_HOLOGRAM') {
      this.hologramRing1.rotation.z += 0.015;
      this.hologramRing2.rotation.z -= 0.01;
      const pulse = Math.sin(now * 3.5) * 0.12 + 0.88;
      (this.hologramRing1.material as THREE.MeshBasicMaterial).opacity = 0.65 * pulse;
      (this.hologramRing2.material as THREE.MeshBasicMaterial).opacity = 0.45 * pulse;
    }

    this.render();
  }

  public setVisualStyle(style: VisualStyle): void {
    if (this.visualStyle === style) return;
    this.visualStyle = style;

    const isHolo = style === 'CYBER_HOLOGRAM';
    const sMat = isHolo ? this.holoSkinMaterial : this.humanSkinMaterial;
    const oMat = isHolo ? this.holoOutfitMaterial : this.humanOutfitMaterial;
    const hMat = isHolo ? this.holoHairMaterial : this.humanHairMaterial;
    const jMat = isHolo ? this.holoJointMaterial : this.humanJointMaterial;

    // Update body meshes
    this.torsoMesh.material = oMat;
    this.collarMesh.material = oMat;
    this.neckMesh.material = sMat;
    this.headMesh.material = sMat;
    this.hairMesh.material = hMat;
    this.leftFringe.material = hMat;
    this.rightFringe.material = hMat;
    this.leftEar.material = sMat;
    this.rightEar.material = sMat;
    this.noseMesh.material = sMat;
    this.leftBrowMesh.material = hMat;
    this.rightBrowMesh.material = hMat;

    // Update arm and hand meshes
    this.leftShoulderJoint.material = oMat;
    this.leftUpperArm.material = oMat;
    this.leftElbowJoint.material = jMat;
    this.leftForearm.material = sMat;
    this.leftWristJoint.material = jMat;
    this.leftPalm.material = sMat;

    this.rightShoulderJoint.material = oMat;
    this.rightUpperArm.material = oMat;
    this.rightElbowJoint.material = jMat;
    this.rightForearm.material = sMat;
    this.rightWristJoint.material = jMat;
    this.rightPalm.material = sMat;

    // Update fingers
    for (const f of this.leftFingerRigs) {
      f.proximalMesh.material = sMat;
      f.distalMesh.material = sMat;
      f.tipMesh.material = sMat;
    }
    for (const f of this.rightFingerRigs) {
      f.proximalMesh.material = sMat;
      f.distalMesh.material = sMat;
      f.tipMesh.material = sMat;
    }

    // Toggle Hologram FX
    this.hologramPedestalGroup.visible = isHolo;
    this.hologramUpLight.visible = isHolo;

    this.render();
  }

  public updateAppearance(options: Partial<AvatarOptions>): void {
    if (options.visualStyle) {
      this.setVisualStyle(options.visualStyle);
    }
    if (options.skinTone) {
      this.humanSkinMaterial.color.set(options.skinTone);
      this.humanJointMaterial.color.set(options.skinTone);
    }
    if (options.outfitColor) {
      this.humanOutfitMaterial.color.set(options.outfitColor);
    }
    if (options.backgroundColor) {
      this.scene.background = new THREE.Color(options.backgroundColor);
    }
    this.render();
  }

  public resize(): void {
    if (this.disposed) return;
    const width = this.container.clientWidth || 360;
    const height = this.container.clientHeight || 420;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.render();
  }

  private render(): void {
    if (!this.disposed && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public dispose(): void {
    this.disposed = true;
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}
