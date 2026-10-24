import * as THREE from 'three';
import { InterpolatedPose } from './SignAnimatorAdapter';

export interface AvatarOptions {
  skinTone: string;
  outfitColor: string;
  backgroundColor: string;
}

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

  // Rig Hierarchical Nodes
  private rootGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private headGroup: THREE.Group;
  private leftEye: THREE.Mesh;
  private rightEye: THREE.Mesh;
  private leftBrowMesh: THREE.Mesh;
  private rightBrowMesh: THREE.Mesh;
  private mouthMesh: THREE.Mesh;
  
  private leftShoulder: THREE.Group;
  private leftUpperArm: THREE.Mesh;
  private leftElbow: THREE.Group;
  private leftForearm: THREE.Mesh;
  private leftWrist: THREE.Group;
  private leftFingerRigs: FingerRig[] = [];

  private rightShoulder: THREE.Group;
  private rightUpperArm: THREE.Mesh;
  private rightElbow: THREE.Group;
  private rightForearm: THREE.Mesh;
  private rightWrist: THREE.Group;
  private rightFingerRigs: FingerRig[] = [];

  private skinMaterial: THREE.MeshStandardMaterial;
  private outfitMaterial: THREE.MeshStandardMaterial;

  // Orbit Interaction State
  private isDragging = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private defaultCameraPos = new THREE.Vector3(0, 0.45, 1.85);
  private orbitY = 0;
  private orbitX = 0;
  private zoomDistance = 1.85;

  constructor(container: HTMLElement, options: AvatarOptions) {
    this.container = container;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.backgroundColor);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.copy(this.defaultCameraPos);

    // 2. Renderer with High-DPI Antialiasing
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // 3. Lighting (Three-Point Studio Lighting for ISL Finger Silhouette Clarity)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(1.5, 2.5, 2.0);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.5);
    fillLight.position.set(-1.8, 1.2, 1.5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x99f6e4, 0.6);
    rimLight.position.set(-1.5, 1.5, -1.2);
    this.scene.add(rimLight);

    // 4. Materials
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: options.skinTone,
      roughness: 0.45,
      metalness: 0.05
    });

    this.outfitMaterial = new THREE.MeshStandardMaterial({
      color: options.outfitColor,
      roughness: 0.55
    });

    // 5. Rig Construction
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Torso (Anatomical Chest with breathing expansion)
    const torsoGeo = new THREE.CylinderGeometry(0.25, 0.20, 0.48, 20);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.outfitMaterial);
    this.torsoMesh.position.set(0, 0.22, 0);
    this.rootGroup.add(this.torsoMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.068, 0.078, 0.1, 18);
    const neckMesh = new THREE.Mesh(neckGeo, this.skinMaterial);
    neckMesh.position.set(0, 0.49, 0);
    this.rootGroup.add(neckMesh);

    // Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.65, 0);
    this.rootGroup.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    this.headGroup.add(headMesh);

    // Stylized Eyes with Procedural Blinking
    const eyeGeo = new THREE.SphereGeometry(0.024, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEye.position.set(-0.06, 0.03, 0.145);
    this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEye.position.set(0.06, 0.03, 0.145);
    this.headGroup.add(this.leftEye, this.rightEye);

    // Dual Expressive Eyebrows for ISL Non-Manual Markers (NMMs)
    const browGeo = new THREE.BoxGeometry(0.075, 0.016, 0.012);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    this.leftBrowMesh = new THREE.Mesh(browGeo, browMat);
    this.leftBrowMesh.position.set(-0.06, 0.08, 0.155);

    this.rightBrowMesh = new THREE.Mesh(browGeo, browMat);
    this.rightBrowMesh.position.set(0.06, 0.08, 0.155);

    this.headGroup.add(this.leftBrowMesh, this.rightBrowMesh);

    // Dynamic Morph Mouth for ISL Oral Adverbs & Morphemes
    const mouthGeo = new THREE.BoxGeometry(0.08, 0.022, 0.012);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x881337 });
    this.mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthMesh.position.set(0, -0.06, 0.155);
    this.headGroup.add(this.mouthMesh);

    // Arm Geometries
    const upperArmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.28, 14);
    upperArmGeo.translate(0, -0.14, 0);

    const forearmGeo = new THREE.CylinderGeometry(0.045, 0.038, 0.26, 14);
    forearmGeo.translate(0, -0.13, 0);

    const palmGeo = new THREE.BoxGeometry(0.082, 0.09, 0.026);

    // LEFT ARM RIG
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.28, 0.42, 0);
    this.rootGroup.add(this.leftShoulder);

    this.leftUpperArm = new THREE.Mesh(upperArmGeo, this.outfitMaterial);
    this.leftShoulder.add(this.leftUpperArm);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.set(0, -0.28, 0);
    this.leftShoulder.add(this.leftElbow);

    this.leftForearm = new THREE.Mesh(forearmGeo, this.skinMaterial);
    this.leftElbow.add(this.leftForearm);

    this.leftWrist = new THREE.Group();
    this.leftWrist.position.set(0, -0.26, 0);
    this.leftElbow.add(this.leftWrist);

    const leftPalm = new THREE.Mesh(palmGeo, this.skinMaterial);
    leftPalm.position.set(0, -0.045, 0);
    this.leftWrist.add(leftPalm);

    this.leftFingerRigs = this.createArticulatedFingers(this.leftWrist, false);

    // RIGHT ARM RIG
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.28, 0.42, 0);
    this.rootGroup.add(this.rightShoulder);

    this.rightUpperArm = new THREE.Mesh(upperArmGeo, this.outfitMaterial);
    this.rightShoulder.add(this.rightUpperArm);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.set(0, -0.28, 0);
    this.rightShoulder.add(this.rightElbow);

    this.rightForearm = new THREE.Mesh(forearmGeo, this.skinMaterial);
    this.rightElbow.add(this.rightForearm);

    this.rightWrist = new THREE.Group();
    this.rightWrist.position.set(0, -0.26, 0);
    this.rightElbow.add(this.rightWrist);

    const rightPalm = new THREE.Mesh(palmGeo, this.skinMaterial);
    rightPalm.position.set(0, -0.045, 0);
    this.rightWrist.add(rightPalm);

    this.rightFingerRigs = this.createArticulatedFingers(this.rightWrist, true);

    // Attach 360° Orbit Drag & Zoom Handlers
    this.setupOrbitControls();

    this.render();
  }

  /**
   * Constructs 5 anatomically articulated fingers with dual-phalanx knuckles.
   */
  private createArticulatedFingers(wrist: THREE.Group, isRight: boolean): FingerRig[] {
    const fingerRigs: FingerRig[] = [];
    const spreadAngles = [-0.15, -0.05, 0, 0.05, 0.15];
    const fingerLengths = [0.038, 0.048, 0.052, 0.048, 0.040]; // thumb, index, middle, ring, pinky

    for (let f = 0; f < 5; f++) {
      const isThumb = f === 0;
      const baseGroup = new THREE.Group();

      if (isThumb) {
        // Opposable thumb placed laterally on hand
        const thumbX = isRight ? 0.045 : -0.045;
        baseGroup.position.set(thumbX, -0.035, 0.01);
        baseGroup.rotation.z = isRight ? -0.4 : 0.4;
      } else {
        // Standard fingers arranged across distal palm border
        const splayX = (f - 2.5) * 0.016;
        baseGroup.position.set(splayX, -0.09, 0);
        baseGroup.rotation.z = spreadAngles[f];
      }

      // Proximal Phalanx Mesh (Base Knuckle)
      const pLen = fingerLengths[f] * 0.55;
      const pGeo = new THREE.BoxGeometry(0.014, pLen, 0.014);
      pGeo.translate(0, -pLen / 2, 0);
      const proximalMesh = new THREE.Mesh(pGeo, this.skinMaterial);
      baseGroup.add(proximalMesh);

      // Distal Phalanx Joint Group & Mesh (Fingertip)
      const distalGroup = new THREE.Group();
      distalGroup.position.set(0, -pLen, 0);
      baseGroup.add(distalGroup);

      const dLen = fingerLengths[f] * 0.45;
      const dGeo = new THREE.BoxGeometry(0.013, dLen, 0.013);
      dGeo.translate(0, -dLen / 2, 0);
      const distalMesh = new THREE.Mesh(dGeo, this.skinMaterial);
      distalGroup.add(distalMesh);

      wrist.add(baseGroup);
      fingerRigs.push({ baseGroup, distalGroup, proximalMesh, distalMesh });
    }

    return fingerRigs;
  }

  /**
   * Sets up touch and pointer 360° orbit rotation & zoom controls.
   */
  private setupOrbitControls(): void {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';

    const onPointerDown = (e: PointerEvent) => {
      this.isDragging = true;
      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousPointerPosition.x;
      const deltaY = e.clientY - this.previousPointerPosition.y;

      this.orbitY += deltaX * 0.01;
      this.orbitX = Math.max(-0.4, Math.min(0.6, this.orbitX + deltaY * 0.008));

      this.rootGroup.rotation.y = this.orbitY;
      this.camera.position.y = 0.45 + this.orbitX;

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
      this.zoomDistance = Math.max(1.1, Math.min(2.8, this.zoomDistance + e.deltaY * 0.002));
      this.camera.position.z = this.zoomDistance;
      this.render();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
  }

  /**
   * Resets 360° orbital camera view to default frontal signing posture.
   */
  public resetView(): void {
    this.orbitY = 0;
    this.orbitX = 0;
    this.zoomDistance = 1.85;
    this.rootGroup.rotation.y = 0;
    this.camera.position.set(0, 0.45, 1.85);
    this.render();
  }

  public updatePose(pose: InterpolatedPose): void {
    if (this.disposed) return;

    // 1. Procedural Natural Respiratory Breathing
    const now = Date.now() / 1000;
    const breathOscillation = Math.sin(now * 1.8) * 0.015;
    this.torsoMesh.scale.set(1 + breathOscillation * 0.5, 1 + breathOscillation, 1 + breathOscillation * 0.8);
    this.leftShoulder.position.y = 0.42 + breathOscillation * 0.3;
    this.rightShoulder.position.y = 0.42 + breathOscillation * 0.3;

    // 2. Procedural Eyelid Blinking (every 3.8s for 120ms)
    const blinkCycle = now % 3.8;
    const isBlinking = blinkCycle < 0.12;
    this.leftEye.scale.y = isBlinking ? 0.1 : 1.0;
    this.rightEye.scale.y = isBlinking ? 0.1 : 1.0;

    // 3. Head & Gaze Orientation
    this.headGroup.rotation.set(
      pose.face.headRotation[0],
      pose.face.headRotation[1],
      pose.face.headRotation[2]
    );

    // 4. ISL Grammatical Eyebrow Modulation (WH-Question furrow vs Polar question raise)
    const browOffset = pose.face.browState * 0.025;
    this.leftBrowMesh.position.y = 0.08 + browOffset;
    this.rightBrowMesh.position.y = 0.08 + browOffset;

    if (pose.face.browState < -0.2) {
      // Furrow: Inward diagonal rotation
      this.leftBrowMesh.rotation.z = -0.25;
      this.rightBrowMesh.rotation.z = 0.25;
    } else if (pose.face.browState > 0.2) {
      // Raised: Arch upwards
      this.leftBrowMesh.rotation.z = 0.12;
      this.rightBrowMesh.rotation.z = -0.12;
    } else {
      this.leftBrowMesh.rotation.z = 0;
      this.rightBrowMesh.rotation.z = 0;
    }

    // 5. ISL Mouth Morphemes
    if (pose.face.mouthState === 'open') {
      this.mouthMesh.scale.set(1.1, 2.2, 1);
    } else if (pose.face.mouthState === 'smile') {
      this.mouthMesh.scale.set(1.5, 0.7, 1);
    } else if (pose.face.mouthState === 'round') {
      this.mouthMesh.scale.set(0.7, 2.0, 1);
    } else if (pose.face.mouthState === 'tight-lips') {
      this.mouthMesh.scale.set(1.2, 0.4, 1); // Negation tight-mouth morpheme
    } else {
      this.mouthMesh.scale.set(1.0, 1.0, 1);
    }

    // 6. Left Arm Kinematics
    this.leftShoulder.rotation.set(
      pose.leftArm.shoulderRotation[0],
      pose.leftArm.shoulderRotation[1],
      pose.leftArm.shoulderRotation[2]
    );
    this.leftElbow.rotation.set(pose.leftArm.elbowAngle, 0, pose.leftArm.forearmRoll);
    this.leftWrist.rotation.set(
      pose.leftHand.rotation[0],
      pose.leftHand.rotation[1],
      pose.leftHand.rotation[2]
    );

    // Left Knuckle Flexion (dual-joint anatomical bend)
    for (let f = 0; f < 5; f++) {
      const curl = pose.leftHand.curl[f] ?? 0;
      const rig = this.leftFingerRigs[f];
      if (rig) {
        rig.baseGroup.rotation.x = curl * 1.05; // Base MCP joint flex
        rig.distalGroup.rotation.x = curl * 1.25; // PIP/DIP knuckle flex
      }
    }

    // 7. Right Arm Kinematics
    this.rightShoulder.rotation.set(
      pose.rightArm.shoulderRotation[0],
      pose.rightArm.shoulderRotation[1],
      pose.rightArm.shoulderRotation[2]
    );
    this.rightElbow.rotation.set(pose.rightArm.elbowAngle, 0, pose.rightArm.forearmRoll);
    this.rightWrist.rotation.set(
      pose.rightHand.rotation[0],
      pose.rightHand.rotation[1],
      pose.rightHand.rotation[2]
    );

    // Right Knuckle Flexion (dual-joint anatomical bend)
    for (let f = 0; f < 5; f++) {
      const curl = pose.rightHand.curl[f] ?? 0;
      const rig = this.rightFingerRigs[f];
      if (rig) {
        rig.baseGroup.rotation.x = curl * 1.05;
        rig.distalGroup.rotation.x = curl * 1.25;
      }
    }

    this.render();
  }

  public updateAppearance(options: Partial<AvatarOptions>): void {
    if (options.skinTone) {
      this.skinMaterial.color.set(options.skinTone);
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
    const width = this.container.clientWidth || 320;
    const height = this.container.clientHeight || 360;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.render();
  }

  private render(): void {
    if (!this.disposed) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
