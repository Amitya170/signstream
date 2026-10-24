import * as THREE from 'three';
import { InterpolatedPose } from './SignAnimatorAdapter';

export interface AvatarOptions {
  skinTone: string;
  outfitColor: string;
  backgroundColor: string;
}

export type CameraPreset = 'CHEST_SIGNING' | 'HANDS_FOCUS' | 'FACE_NMM' | 'FREE_ORBIT';

interface FingerRig {
  baseGroup: THREE.Group;
  distalGroup: THREE.Group;
  proximalMesh: THREE.Mesh;
  distalMesh: THREE.Mesh;
}

export class ThreeAvatarRig {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private disposed = false;

  // Hierarchical Skeletal Nodes
  private rootGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private collarMesh: THREE.Mesh;
  private neckMesh: THREE.Mesh;

  private headGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private hairMesh: THREE.Mesh;
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

  // Materials with PBR Shading
  private skinMaterial: THREE.MeshStandardMaterial;
  private outfitMaterial: THREE.MeshStandardMaterial;
  private hairMaterial: THREE.MeshStandardMaterial;
  private jointMaterial: THREE.MeshStandardMaterial;

  // Camera Orbit & View Presets
  private activePreset: CameraPreset = 'CHEST_SIGNING';
  private isDragging = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private orbitY = 0;
  private orbitX = 0;
  private zoomDistance = 1.85;

  constructor(container: HTMLElement, options: AvatarOptions) {
    this.container = container;
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(1.4, 2.4, 2.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    cyanRimLight.position.set(-1.8, 1.8, -1.4);
    this.scene.add(cyanRimLight);

    const warmFillLight = new THREE.DirectionalLight(0xfef08a, 0.45);
    warmFillLight.position.set(1.5, 0.8, -1.0);
    this.scene.add(warmFillLight);

    // 4. Shaded Materials
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: options.skinTone,
      roughness: 0.42,
      metalness: 0.05
    });

    this.outfitMaterial = new THREE.MeshStandardMaterial({
      color: options.outfitColor,
      roughness: 0.55,
      metalness: 0.1
    });

    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.75,
      metalness: 0.1
    });

    this.jointMaterial = new THREE.MeshStandardMaterial({
      color: options.skinTone,
      roughness: 0.42,
      metalness: 0.05
    });

    // 5. Rig Construction
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Studio Stage Floor Pedestal
    const stageGeo = new THREE.CylinderGeometry(0.85, 0.9, 0.04, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.set(0, -0.04, 0);
    stageMesh.receiveShadow = true;
    this.rootGroup.add(stageMesh);

    // Torso Group
    this.torsoGroup = new THREE.Group();
    this.rootGroup.add(this.torsoGroup);

    // Anatomical Torso with contoured chest taper
    const torsoGeo = new THREE.CylinderGeometry(0.25, 0.19, 0.48, 24);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.outfitMaterial);
    this.torsoMesh.position.set(0, 0.22, 0);
    this.torsoMesh.castShadow = true;
    this.torsoGroup.add(this.torsoMesh);

    // Professional Collar Trim
    const collarGeo = new THREE.TorusGeometry(0.08, 0.015, 12, 24);
    collarGeo.rotateX(Math.PI / 2);
    this.collarMesh = new THREE.Mesh(collarGeo, this.outfitMaterial);
    this.collarMesh.position.set(0, 0.455, 0);
    this.torsoGroup.add(this.collarMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.09, 20);
    this.neckMesh = new THREE.Mesh(neckGeo, this.skinMaterial);
    this.neckMesh.position.set(0, 0.495, 0);
    this.torsoGroup.add(this.neckMesh);

    // 6. Sculpted Head & Expressive Facial Features
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.655, 0);
    this.torsoGroup.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.155, 32, 32);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Sculpted Hair
    const hairGeo = new THREE.SphereGeometry(0.162, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62);
    this.hairMesh = new THREE.Mesh(hairGeo, this.hairMaterial);
    this.hairMesh.position.set(0, 0.02, -0.01);
    this.headGroup.add(this.hairMesh);

    // Hair Side Fringe
    const fringeGeo = new THREE.BoxGeometry(0.06, 0.08, 0.04);
    const leftFringe = new THREE.Mesh(fringeGeo, this.hairMaterial);
    leftFringe.position.set(-0.13, 0.02, 0.08);
    leftFringe.rotation.z = 0.2;
    const rightFringe = new THREE.Mesh(fringeGeo, this.hairMaterial);
    rightFringe.position.set(0.13, 0.02, 0.08);
    rightFringe.rotation.z = -0.2;
    this.headGroup.add(leftFringe, rightFringe);

    // Sculpted Ears
    const earGeo = new THREE.SphereGeometry(0.035, 12, 12);
    earGeo.scale(0.5, 1, 0.7);
    const leftEar = new THREE.Mesh(earGeo, this.skinMaterial);
    leftEar.position.set(-0.155, 0.01, 0);
    const rightEar = new THREE.Mesh(earGeo, this.skinMaterial);
    rightEar.position.set(0.155, 0.01, 0);
    this.headGroup.add(leftEar, rightEar);

    // Expressive Eyes with Pupils & Eyelids
    this.leftEyeGroup = this.createDetailedEye(-0.058);
    this.rightEyeGroup = this.createDetailedEye(0.058);
    this.headGroup.add(this.leftEyeGroup, this.rightEyeGroup);

    this.leftEyelid = this.leftEyeGroup.getObjectByName('eyelid') as THREE.Mesh;
    this.rightEyelid = this.rightEyeGroup.getObjectByName('eyelid') as THREE.Mesh;

    // Sculpted Nose Bridge
    const noseGeo = new THREE.ConeGeometry(0.02, 0.055, 12);
    noseGeo.rotateX(Math.PI / 2);
    this.noseMesh = new THREE.Mesh(noseGeo, this.skinMaterial);
    this.noseMesh.position.set(0, 0.01, 0.158);
    this.headGroup.add(this.noseMesh);

    // Expressive Eyebrows for ISL Non-Manual Markers
    const browGeo = new THREE.BoxGeometry(0.075, 0.018, 0.012);
    this.leftBrowMesh = new THREE.Mesh(browGeo, this.hairMaterial);
    this.leftBrowMesh.position.set(-0.06, 0.078, 0.152);
    this.rightBrowMesh = new THREE.Mesh(browGeo, this.hairMaterial);
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

    // 7. Arms with Articulated Joint Spheres (Zero Visual Gaps)
    const upperArmGeo = new THREE.CylinderGeometry(0.052, 0.046, 0.28, 18);
    upperArmGeo.translate(0, -0.14, 0);

    const forearmGeo = new THREE.CylinderGeometry(0.046, 0.038, 0.26, 18);
    forearmGeo.translate(0, -0.13, 0);

    const shoulderJointGeo = new THREE.SphereGeometry(0.062, 16, 16);
    const elbowJointGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const wristJointGeo = new THREE.SphereGeometry(0.042, 16, 16);
    const palmGeo = new THREE.BoxGeometry(0.082, 0.092, 0.026);

    // LEFT ARM
    this.leftClavicle = new THREE.Group();
    this.leftClavicle.position.set(-0.28, 0.42, 0);
    this.torsoGroup.add(this.leftClavicle);

    this.leftShoulderJoint = new THREE.Mesh(shoulderJointGeo, this.outfitMaterial);
    this.leftClavicle.add(this.leftShoulderJoint);

    this.leftUpperArm = new THREE.Mesh(upperArmGeo, this.outfitMaterial);
    this.leftUpperArm.castShadow = true;
    this.leftClavicle.add(this.leftUpperArm);

    this.leftElbowGroup = new THREE.Group();
    this.leftElbowGroup.position.set(0, -0.28, 0);
    this.leftClavicle.add(this.leftElbowGroup);

    this.leftElbowJoint = new THREE.Mesh(elbowJointGeo, this.jointMaterial);
    this.leftElbowGroup.add(this.leftElbowJoint);

    this.leftForearm = new THREE.Mesh(forearmGeo, this.skinMaterial);
    this.leftForearm.castShadow = true;
    this.leftElbowGroup.add(this.leftForearm);

    this.leftWristGroup = new THREE.Group();
    this.leftWristGroup.position.set(0, -0.26, 0);
    this.leftElbowGroup.add(this.leftWristGroup);

    this.leftWristJoint = new THREE.Mesh(wristJointGeo, this.jointMaterial);
    this.leftWristGroup.add(this.leftWristJoint);

    this.leftPalm = new THREE.Mesh(palmGeo, this.skinMaterial);
    this.leftPalm.position.set(0, -0.046, 0);
    this.leftPalm.castShadow = true;
    this.leftWristGroup.add(this.leftPalm);

    this.leftFingerRigs = this.buildDetailedFingers(this.leftWristGroup, false);

    // RIGHT ARM
    this.rightClavicle = new THREE.Group();
    this.rightClavicle.position.set(0.28, 0.42, 0);
    this.torsoGroup.add(this.rightClavicle);

    this.rightShoulderJoint = new THREE.Mesh(shoulderJointGeo, this.outfitMaterial);
    this.rightClavicle.add(this.rightShoulderJoint);

    this.rightUpperArm = new THREE.Mesh(upperArmGeo, this.outfitMaterial);
    this.rightUpperArm.castShadow = true;
    this.rightClavicle.add(this.rightUpperArm);

    this.rightElbowGroup = new THREE.Group();
    this.rightElbowGroup.position.set(0, -0.28, 0);
    this.rightClavicle.add(this.rightElbowGroup);

    this.rightElbowJoint = new THREE.Mesh(elbowJointGeo, this.jointMaterial);
    this.rightElbowGroup.add(this.rightElbowJoint);

    this.rightForearm = new THREE.Mesh(forearmGeo, this.skinMaterial);
    this.rightForearm.castShadow = true;
    this.rightElbowGroup.add(this.rightForearm);

    this.rightWristGroup = new THREE.Group();
    this.rightWristGroup.position.set(0, -0.26, 0);
    this.rightElbowGroup.add(this.rightWristGroup);

    this.rightWristJoint = new THREE.Mesh(wristJointGeo, this.jointMaterial);
    this.rightWristGroup.add(this.rightWristJoint);

    this.rightPalm = new THREE.Mesh(palmGeo, this.skinMaterial);
    this.rightPalm.position.set(0, -0.046, 0);
    this.rightPalm.castShadow = true;
    this.rightWristGroup.add(this.rightPalm);

    this.rightFingerRigs = this.buildDetailedFingers(this.rightWristGroup, true);

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

    // Specular Reflection
    const glintGeo = new THREE.CircleGeometry(0.0035, 8);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const glint = new THREE.Mesh(glintGeo, glintMat);
    glint.position.set(0.004, 0.004, 0.023);
    eyeGroup.add(glint);

    // Upper Eyelid for procedural blinking
    const eyelidGeo = new THREE.SphereGeometry(0.026, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const eyelid = new THREE.Mesh(eyelidGeo, this.skinMaterial);
    eyelid.name = 'eyelid';
    eyelid.position.set(0, 0.002, 0.002);
    eyelid.scale.set(1, 0.1, 1);
    eyeGroup.add(eyelid);

    return eyeGroup;
  }

  private buildDetailedFingers(wrist: THREE.Group, isRight: boolean): FingerRig[] {
    const fingerRigs: FingerRig[] = [];
    const spreadAngles = [-0.18, -0.06, 0, 0.06, 0.18];
    const fingerLengths = [0.040, 0.052, 0.056, 0.052, 0.042];

    for (let f = 0; f < 5; f++) {
      const isThumb = f === 0;
      const baseGroup = new THREE.Group();

      if (isThumb) {
        // Anatomically opposable thumb mounted laterally
        const thumbX = isRight ? 0.046 : -0.046;
        baseGroup.position.set(thumbX, -0.038, 0.012);
        baseGroup.rotation.z = isRight ? -0.45 : 0.45;
        baseGroup.rotation.y = isRight ? -0.2 : 0.2;
      } else {
        const splayX = (f - 2.5) * 0.0165;
        baseGroup.position.set(splayX, -0.092, 0);
        baseGroup.rotation.z = spreadAngles[f];
      }

      // Proximal Phalanx
      const pLen = fingerLengths[f] * 0.55;
      const pGeo = new THREE.CapsuleGeometry(0.0075, pLen, 6, 12);
      pGeo.translate(0, -pLen / 2, 0);
      const proximalMesh = new THREE.Mesh(pGeo, this.skinMaterial);
      proximalMesh.castShadow = true;
      baseGroup.add(proximalMesh);

      // Distal Joint & Phalanx (Knuckle articulation)
      const distalGroup = new THREE.Group();
      distalGroup.position.set(0, -pLen, 0);
      baseGroup.add(distalGroup);

      const dLen = fingerLengths[f] * 0.45;
      const dGeo = new THREE.CapsuleGeometry(0.0068, dLen, 6, 12);
      dGeo.translate(0, -dLen / 2, 0);
      const distalMesh = new THREE.Mesh(dGeo, this.skinMaterial);
      distalMesh.castShadow = true;
      distalGroup.add(distalMesh);

      wrist.add(baseGroup);
      fingerRigs.push({ baseGroup, distalGroup, proximalMesh, distalMesh });
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
        // ignore
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.zoomDistance = Math.max(0.85, Math.min(2.8, this.zoomDistance + e.deltaY * 0.002));
      this.camera.position.z = this.zoomDistance;
      this.render();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
  }

  /**
   * Applies a studio camera perspective preset.
   */
  public applyCameraPreset(preset: CameraPreset): void {
    this.activePreset = preset;
    this.rootGroup?.rotation.set(0, 0, 0);
    this.orbitY = 0;
    this.orbitX = 0;

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

  public updatePose(pose: InterpolatedPose): void {
    if (this.disposed) return;

    // 1. Natural Respiratory Chest Oscillation
    const now = Date.now() / 1000;
    const breath = Math.sin(now * 1.85) * 0.015;
    this.torsoMesh.scale.set(1 + breath * 0.4, 1 + breath, 1 + breath * 0.8);
    this.leftClavicle.position.y = 0.42 + breath * 0.3;
    this.rightClavicle.position.y = 0.42 + breath * 0.3;

    // 2. Realistic Eyelid Blinking
    const blinkCycle = now % 4.0;
    const isBlinking = blinkCycle < 0.14;
    const eyelidScale = isBlinking ? 1.0 : 0.1;
    this.leftEyelid.scale.y = eyelidScale;
    this.rightEyelid.scale.y = eyelidScale;

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

    // 6. Left Arm Kinematics
    this.leftClavicle.rotation.set(
      pose.leftArm.shoulderRotation[0],
      pose.leftArm.shoulderRotation[1],
      pose.leftArm.shoulderRotation[2]
    );
    this.leftElbowGroup.rotation.set(pose.leftArm.elbowAngle, 0, pose.leftArm.forearmRoll);
    this.leftWristGroup.rotation.set(
      pose.leftHand.rotation[0],
      pose.leftHand.rotation[1],
      pose.leftHand.rotation[2]
    );

    // Left Finger Knuckle Articulation
    for (let f = 0; f < 5; f++) {
      const curl = pose.leftHand.curl[f] ?? 0;
      const rig = this.leftFingerRigs[f];
      if (rig) {
        rig.baseGroup.rotation.x = curl * 1.1;
        rig.distalGroup.rotation.x = curl * 1.35;
      }
    }

    // 7. Right Arm Kinematics
    this.rightClavicle.rotation.set(
      pose.rightArm.shoulderRotation[0],
      pose.rightArm.shoulderRotation[1],
      pose.rightArm.shoulderRotation[2]
    );
    this.rightElbowGroup.rotation.set(pose.rightArm.elbowAngle, 0, pose.rightArm.forearmRoll);
    this.rightWristGroup.rotation.set(
      pose.rightHand.rotation[0],
      pose.rightHand.rotation[1],
      pose.rightHand.rotation[2]
    );

    // Right Finger Knuckle Articulation
    for (let f = 0; f < 5; f++) {
      const curl = pose.rightHand.curl[f] ?? 0;
      const rig = this.rightFingerRigs[f];
      if (rig) {
        rig.baseGroup.rotation.x = curl * 1.1;
        rig.distalGroup.rotation.x = curl * 1.35;
      }
    }

    this.render();
  }

  public updateAppearance(options: Partial<AvatarOptions>): void {
    if (options.skinTone) {
      this.skinMaterial.color.set(options.skinTone);
      this.jointMaterial.color.set(options.skinTone);
    }
    if (options.outfitColor) {
      this.outfitMaterial.color.set(options.outfitColor);
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
