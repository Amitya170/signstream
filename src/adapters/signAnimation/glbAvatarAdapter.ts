import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InterpolatedPose } from './SignAnimatorAdapter';
import { AvatarOptions, CameraPreset, VisualStyle } from './threeAvatarAdapter';

export type GlbModelId = 'michelle' | 'readyplayer' | 'xbot';

export interface GlbAvatarOptions extends AvatarOptions {
  modelId?: GlbModelId;
}

const MODEL_PATHS: Record<GlbModelId, string> = {
  michelle: '/models/Michelle.glb',
  readyplayer: '/models/readyplayer.me.glb',
  xbot: '/models/Xbot.glb'
};

interface BoneCache {
  head: THREE.Bone | null;
  neck: THREE.Bone | null;
  spine2: THREE.Bone | null;
  leftShoulder: THREE.Bone | null;
  leftArm: THREE.Bone | null;
  leftForeArm: THREE.Bone | null;
  leftHand: THREE.Bone | null;
  rightShoulder: THREE.Bone | null;
  rightArm: THREE.Bone | null;
  rightForeArm: THREE.Bone | null;
  rightHand: THREE.Bone | null;
  leftFingers: THREE.Bone[][];
  rightFingers: THREE.Bone[][];
}

export class GlbAvatarRig {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private disposed = false;
  private visualStyle: VisualStyle = 'STUDIO_HUMAN';
  private currentModelId: GlbModelId = 'michelle';

  private model: THREE.Group | null = null;
  private bones: BoneCache = {
    head: null,
    neck: null,
    spine2: null,
    leftShoulder: null,
    leftArm: null,
    leftForeArm: null,
    leftHand: null,
    rightShoulder: null,
    rightArm: null,
    rightForeArm: null,
    rightHand: null,
    leftFingers: [[], [], [], [], []],
    rightFingers: [[], [], [], [], []]
  };
  private originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private holoMaterial: THREE.MeshStandardMaterial;

  private loading = true;
  private loadError = false;
  private loadingSpinner: THREE.Group | null = null;
  private lastPose: InterpolatedPose | null = null;

  // Studio Lighting System
  private ambientLight: THREE.AmbientLight;
  private keyLight: THREE.DirectionalLight;
  private cyanRimLight: THREE.DirectionalLight;
  private warmFillLight: THREE.DirectionalLight;
  private hologramUpLight: THREE.PointLight;

  // Hologram Pedestal FX
  private stageMesh: THREE.Mesh;
  private hologramPedestalGroup: THREE.Group;
  private hologramRing1: THREE.Mesh;
  private hologramRing2: THREE.Mesh;
  private scanlineMesh: THREE.Mesh | null = null;

  // Camera Orbit & View Presets
  private activePreset: CameraPreset = 'CHEST_SIGNING';
  private isDragging = false;
  private previousPointerPosition = { x: 0, y: 0 };
  private orbitY = 0;
  private orbitX = 0;
  private zoomDistance = 1.65;
  private modelCenterY = 1.25;

  constructor(
    container: HTMLElement,
    options: GlbAvatarOptions,
    modelId: GlbModelId = 'michelle'
  ) {
    this.container = container;
    this.visualStyle = options.visualStyle || 'STUDIO_HUMAN';
    this.currentModelId = modelId;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.backgroundColor);
    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);

    // 2. High-Precision PBR Renderer (with PCFShadowMap)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // 3. Cinematic Studio Three-Point Lighting System
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.keyLight.position.set(1.5, 3.2, 2.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.scene.add(this.keyLight);

    this.cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    this.cyanRimLight.position.set(-1.8, 2.2, -1.2);
    this.scene.add(this.cyanRimLight);

    this.warmFillLight = new THREE.DirectionalLight(0xfef08a, 0.6);
    this.warmFillLight.position.set(1.5, 1.2, -1.0);
    this.scene.add(this.warmFillLight);

    this.hologramUpLight = new THREE.PointLight(0x06b6d4, 2.5, 3.5);
    this.hologramUpLight.position.set(0, 0.1, 0);
    this.hologramUpLight.visible = this.visualStyle === 'CYBER_HOLOGRAM';
    this.scene.add(this.hologramUpLight);

    // Hologram Material
    this.holoMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88
    });

    // 4. Stage Pedestal
    const stageGeo = new THREE.CylinderGeometry(0.85, 0.9, 0.04, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    this.stageMesh = new THREE.Mesh(stageGeo, stageMat);
    this.stageMesh.position.set(0, -0.02, 0);
    this.stageMesh.receiveShadow = true;
    this.scene.add(this.stageMesh);

    // Hologram Concentric Light Rings
    this.hologramPedestalGroup = new THREE.Group();
    this.hologramPedestalGroup.position.set(0, 0.01, 0);
    this.hologramPedestalGroup.visible = this.visualStyle === 'CYBER_HOLOGRAM';
    this.scene.add(this.hologramPedestalGroup);

    const holoRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const ring1Geo = new THREE.RingGeometry(0.46, 0.51, 32);
    ring1Geo.rotateX(-Math.PI / 2);
    this.hologramRing1 = new THREE.Mesh(ring1Geo, holoRingMat);
    this.hologramPedestalGroup.add(this.hologramRing1);

    const ring2Geo = new THREE.RingGeometry(0.68, 0.72, 32);
    ring2Geo.rotateX(-Math.PI / 2);
    this.hologramRing2 = new THREE.Mesh(ring2Geo, holoRingMat);
    this.hologramPedestalGroup.add(this.hologramRing2);

    // Cyber Hologram Vertical Scanning Beam Disc
    const scanGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.015, 32);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.scanlineMesh = new THREE.Mesh(scanGeo, scanMat);
    this.scanlineMesh.visible = this.visualStyle === 'CYBER_HOLOGRAM';
    this.scene.add(this.scanlineMesh);

    this.createLoadingSpinner();
    this.setupOrbitInteraction();
    this.loadGlbModel(this.currentModelId);
  }

  public loadModel(modelId: GlbModelId): void {
    if (this.currentModelId === modelId && this.model) return;
    this.currentModelId = modelId;
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
    }
    this.originalMaterials.clear();
    this.createLoadingSpinner();
    this.loading = true;
    this.loadGlbModel(modelId);
  }

  private createLoadingSpinner(): void {
    if (this.loadingSpinner) return;
    this.loadingSpinner = new THREE.Group();
    this.loadingSpinner.position.set(0, 1.25, 0);

    const ringGeo = new THREE.TorusGeometry(0.18, 0.014, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.loadingSpinner.add(ringMesh);
    this.scene.add(this.loadingSpinner);
  }

  private loadGlbModel(modelId: GlbModelId): void {
    const url = MODEL_PATHS[modelId] || MODEL_PATHS.michelle;
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        if (this.disposed) return;
        this.model = gltf.scene;
        this.model.position.set(0, 0, 0);

        this.model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            this.originalMaterials.set(child, child.material);
          }
        });

        this.scene.add(this.model);

        if (this.loadingSpinner) {
          this.scene.remove(this.loadingSpinner);
          this.loadingSpinner = null;
        }

        // Auto-frame camera based on model bounding box
        this.autoFrameCamera(this.model);

        // Discover and cache skeleton bones
        this.discoverBones(this.model);
        this.applyVisualStyleToModel();

        this.loading = false;
        if (this.lastPose) {
          this.updatePose(this.lastPose);
        } else {
          this.render();
        }
      },
      undefined,
      (error) => {
        console.warn(`GLB Avatar load error for ${url}, trying fallback:`, error);
        if (modelId !== 'readyplayer') {
          this.loadGlbModel('readyplayer');
        } else {
          this.loadError = true;
          this.loading = false;
        }
      }
    );
  }

  private autoFrameCamera(root: THREE.Object3D): void {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());

    // Head-relative framing invariant to character height & geometry
    this.modelCenterY = box.max.y - size.y * 0.22;
    this.zoomDistance = Math.max(1.35, size.y * 0.82);
    this.applyCameraPreset('CHEST_SIGNING');
  }

  private findBone(root: THREE.Object3D, targetName: string): THREE.Bone | null {
    let result: THREE.Bone | null = null;
    root.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const clean = child.name.replace(/^mixamorig/, '');
        if (
          clean.toLowerCase() === targetName.toLowerCase() ||
          child.name.toLowerCase() === targetName.toLowerCase()
        ) {
          result = child;
        }
      }
    });
    return result;
  }

  private discoverBones(root: THREE.Object3D): void {
    root.updateMatrixWorld(true);

    this.bones.head = this.findBone(root, 'Head');
    this.bones.neck = this.findBone(root, 'Neck');
    this.bones.spine2 = this.findBone(root, 'Spine2');
    this.bones.leftShoulder = this.findBone(root, 'LeftShoulder');
    this.bones.leftArm = this.findBone(root, 'LeftArm');
    this.bones.leftForeArm = this.findBone(root, 'LeftForeArm');
    this.bones.leftHand = this.findBone(root, 'LeftHand');
    this.bones.rightShoulder = this.findBone(root, 'RightShoulder');
    this.bones.rightArm = this.findBone(root, 'RightArm');
    this.bones.rightForeArm = this.findBone(root, 'RightForeArm');
    this.bones.rightHand = this.findBone(root, 'RightHand');

    const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
    for (let f = 0; f < 5; f++) {
      const fName = fingerNames[f];
      this.bones.leftFingers[f] = [];
      this.bones.rightFingers[f] = [];
      for (let p = 1; p <= 4; p++) {
        const leftB = this.findBone(root, `LeftHand${fName}${p}`);
        if (leftB) this.bones.leftFingers[f].push(leftB);

        const rightB = this.findBone(root, `RightHand${fName}${p}`);
        if (rightB) this.bones.rightFingers[f].push(rightB);
      }
    }
  }

  private applyVisualStyleToModel(): void {
    if (!this.model) return;
    const isHolo = this.visualStyle === 'CYBER_HOLOGRAM';

    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (isHolo) {
          child.material = this.holoMaterial;
        } else {
          const original = this.originalMaterials.get(child);
          if (original) child.material = original;
        }
      }
    });

    this.hologramPedestalGroup.visible = isHolo;
    this.hologramUpLight.visible = isHolo;
    if (this.scanlineMesh) {
      this.scanlineMesh.visible = isHolo;
    }
  }

  public setVisualStyle(style: VisualStyle): void {
    if (this.visualStyle === style) return;
    this.visualStyle = style;
    this.applyVisualStyleToModel();
    this.render();
  }

  public updateAppearance(options: Partial<AvatarOptions>): void {
    if (options.visualStyle) {
      this.setVisualStyle(options.visualStyle);
    }
    if (options.backgroundColor) {
      this.scene.background = new THREE.Color(options.backgroundColor);
    }
    this.render();
  }

  public applyCameraPreset(preset: CameraPreset): void {
    this.activePreset = preset;
    this.orbitY = 0;
    this.orbitX = 0;
    if (this.model) this.model.rotation.y = 0;

    const cy = this.modelCenterY;

    switch (preset) {
      case 'CHEST_SIGNING':
        this.camera.position.set(0, cy + 0.05, this.zoomDistance);
        this.camera.lookAt(0, cy - 0.02, 0);
        break;
      case 'HANDS_FOCUS':
        this.camera.position.set(0, cy - 0.12, this.zoomDistance * 0.72);
        this.camera.lookAt(0, cy - 0.15, 0);
        break;
      case 'FACE_NMM':
        this.camera.position.set(0, cy + 0.28, this.zoomDistance * 0.55);
        this.camera.lookAt(0, cy + 0.25, 0);
        break;
      case 'FREE_ORBIT':
        break;
    }

    this.render();
  }

  public resetView(): void {
    this.applyCameraPreset('CHEST_SIGNING');
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

      if (this.model) this.model.rotation.y = this.orbitY;
      this.camera.position.y = this.modelCenterY + 0.05 + this.orbitX;

      this.previousPointerPosition = { x: e.clientX, y: e.clientY };
      this.render();
    };

    const onPointerUp = (e: PointerEvent) => {
      this.isDragging = false;
      el.style.cursor = 'grab';
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore capture release errors
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.zoomDistance = Math.max(0.75, Math.min(2.8, this.zoomDistance + e.deltaY * 0.0015));
      this.camera.position.z = this.zoomDistance;
      this.render();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
  }

  public getActiveSolverName(): string {
    if (this.lastPose) {
      const rawL = this.lastPose.leftHand.position || [-0.15, -0.1, 0.2];
      const rawR = this.lastPose.rightHand.position || [0.15, -0.1, 0.2];
      const isCenter = Math.abs(rawL[0]) <= 0.12 && Math.abs(rawR[0]) <= 0.12;
      const dist = Math.hypot(rawR[0] - rawL[0], rawR[1] - rawL[1], rawR[2] - rawL[2]);
      if (isCenter || dist < 0.24) {
        const leftExt = (this.lastPose.leftHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) < 0.35;
        const rightExt = (this.lastPose.rightHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) < 0.35;
        const rightFist = (this.lastPose.rightHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) > 0.6;
        if (leftExt && rightExt) return 'Anjali Mudra (Namaste)';
        if (leftExt && rightFist) return 'Support Help (Fist on Palm)';
      }
    }
    return 'Articulated Signing';
  }

  /**
   * Anatomical 3D Sign Engine & Contact Solver:
   * Authentic Namaste (Anjali Mudra), Help, and Natural Human Sign Kinematics
   */
  public updatePose(pose: InterpolatedPose): void {
    if (this.disposed) return;
    this.lastPose = pose;

    const now = Date.now() / 1000;

    // Loading spinner animation if still downloading
    if (this.loading && this.loadingSpinner) {
      this.loadingSpinner.rotation.z += 0.05;
      this.render();
      return;
    }

    if (!this.model) return;

    // 1. Natural Respiratory Torso Oscillation
    const breath = Math.sin(now * 1.85) * 0.015;
    if (this.bones.spine2) {
      this.bones.spine2.rotation.x = breath * 0.3;
    }

    // 2. Two-Handed Interaction & Continuous Bilateral Synchronization Solver
    const rawL = pose.leftHand.position || [-0.15, -0.1, 0.2];
    const rawR = pose.rightHand.position || [0.15, -0.1, 0.2];

    const distTarget = Math.hypot(rawR[0] - rawL[0], rawR[1] - rawL[1], rawR[2] - rawL[2]);
    const leftExt = (pose.leftHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) < 0.35;
    const rightExt = (pose.rightHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) < 0.35;
    const rightFist = (pose.rightHand.curl.slice(1).reduce((a, b) => a + b, 0) / 4) > 0.6;

    // Continuous hermite blend factor: 0 when hands are far apart (>0.26m), 1 when touching (<=0.10m)
    const rawSyncFactor = Math.max(0, Math.min(1, (0.26 - distTarget) / 0.16));
    const syncFactor = rawSyncFactor * rawSyncFactor * (3 - 2 * rawSyncFactor);

    const isNamasteCandidate = leftExt && rightExt && (Math.abs(rawL[0]) <= 0.16 && Math.abs(rawR[0]) <= 0.16);
    const isSupportCandidate = leftExt && rightFist && (Math.abs(rawL[0]) <= 0.16 && Math.abs(rawR[0]) <= 0.16);
    const isPrayingNamaste = isNamasteCandidate && syncFactor > 0.65;
    const isSupportHelp = isSupportCandidate && syncFactor > 0.65;

    // 3. Biomechanical Clavicle & Shoulder Elevation
    const pitchL = Math.max(0, pose.leftArm.shoulderRotation[0]);
    const pitchR = Math.max(0, pose.rightArm.shoulderRotation[0]);
    if (this.bones.leftShoulder) {
      this.bones.leftShoulder.position.y = Math.max(0, pitchL - 0.2) * 0.02 + breath * 0.003;
    }
    if (this.bones.rightShoulder) {
      this.bones.rightShoulder.position.y = Math.max(0, pitchR - 0.2) * 0.02 + breath * 0.003;
    }

    // 4. Head Gaze & Respectful Nod / Dynamic Hand Altitude Tracking
    if (this.bones.head) {
      if (isPrayingNamaste) {
        // Authentic respectful forward nod
        this.bones.head.rotation.set(0.12, 0, 0);
      } else {
        const gazeY = ((rawL[1] + rawR[1]) * 0.5 - 0.1) * 0.2;
        this.bones.head.rotation.set(
          pose.face.headRotation[0] * 0.7 - gazeY,
          pose.face.headRotation[1] * 0.7,
          pose.face.headRotation[2] * 0.7
        );
      }
    }

    // 5. Anatomical Arm & Hand Solving with Bilateral Anti-Collision Physics
    const isMudraActive = isPrayingNamaste || (isNamasteCandidate && syncFactor > 0.15);
    if (isMudraActive) {
      // Symmetrical Pad-to-Pad Flush Contact Physics:
      // Forearms pitch forward identically (+0.45) so hands meet in the same exact Z-depth plane
      // Wrists have zero lateral deviation (Z = 0.0) preventing scissor crossing or finger penetration
      const armPitch = 0.48;
      const armRoll = 0.08;
      const armAdduct = 1.05;
      
      const forePitch = 0.45;
      const foreYaw = 0.15;
      const foreElbow = 0.85;

      const wristPitch = -0.75;
      const wristYaw = 0.35;
      const wristRoll = 0.0; // 0 lateral deviation prevents fingers crossing over midline

      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(armPitch, armRoll, armAdduct);
        this.bones.leftForeArm.rotation.set(forePitch, foreYaw, foreElbow);
        this.bones.leftHand.rotation.set(wristPitch, wristYaw, wristRoll);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(armPitch, -armRoll, -armAdduct);
        this.bones.rightForeArm.rotation.set(forePitch, -foreYaw, -foreElbow);
        this.bones.rightHand.rotation.set(wristPitch, -wristYaw, -wristRoll);
      }
    } else if (isSupportHelp) {
      // Authentic Help Sign: Right fist resting on flat upward-facing left palm
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(0.38, 0.15, 1.22);
        this.bones.leftForeArm.rotation.set(0.1, 0.7, 1.45);
        this.bones.leftHand.rotation.set(-0.1, 0.6, 0.4);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(0.48, -0.15, -1.2);
        this.bones.rightForeArm.rotation.set(-0.1, -0.55, -1.55);
        this.bones.rightHand.rotation.set(0.15, -0.2, -0.2);
      }
    } else {
      // Natural Signing Space: No chicken-wing flare, relaxed adduction near torso
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        const rollL = pose.leftArm.shoulderRotation[1];
        const yawL = pose.leftArm.shoulderRotation[2];
        const elbowL = Math.max(0.1, pose.leftArm.elbowAngle);
        const adductionL = 1.32 - pitchL * 0.25;

        this.bones.leftArm.rotation.set(pitchL * 0.9, rollL * 0.4 + yawL * 0.3, adductionL);
        this.bones.leftForeArm.rotation.set(pose.leftArm.forearmRoll * 0.4, 0.2, elbowL * 0.95 + 0.15);
        this.bones.leftHand.rotation.set(pose.leftHand.rotation[0], pose.leftHand.rotation[1], pose.leftHand.rotation[2]);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        const rollR = pose.rightArm.shoulderRotation[1];
        const yawR = pose.rightArm.shoulderRotation[2];
        const elbowR = Math.max(0.1, pose.rightArm.elbowAngle);
        const adductionR = -1.32 + pitchR * 0.25;

        this.bones.rightArm.rotation.set(pitchR * 0.9, rollR * 0.4 + yawR * 0.3, adductionR);
        this.bones.rightForeArm.rotation.set(pose.rightArm.forearmRoll * 0.4, -0.2, -elbowR * 0.95 - 0.15);
        this.bones.rightHand.rotation.set(pose.rightHand.rotation[0], pose.rightHand.rotation[1], pose.rightHand.rotation[2]);
      }
    }

    // 6. Five-Finger Articulation Across Phalanges (Flush Extension Locking)
    for (let f = 0; f < 5; f++) {
      const curlL = isMudraActive ? 0 : (isSupportHelp ? 0 : (pose.leftHand.curl[f] ?? 0));
      const leftChain = this.bones.leftFingers[f];
      if (leftChain) {
        for (let p = 0; p < leftChain.length; p++) {
          const b = leftChain[p];
          if (f === 0) {
            b.rotation.x = isMudraActive ? -0.15 : (curlL * 0.35);
            b.rotation.z = isMudraActive ? 0.05 : (curlL * 0.3);
          } else {
            b.rotation.z = curlL * 0.65;
          }
        }
      }

      const curlR = isMudraActive ? 0 : (isSupportHelp ? (f === 0 ? 0.7 : 0.9) : (pose.rightHand.curl[f] ?? 0));
      const rightChain = this.bones.rightFingers[f];
      if (rightChain) {
        for (let p = 0; p < rightChain.length; p++) {
          const b = rightChain[p];
          if (f === 0) {
            b.rotation.x = isMudraActive ? -0.15 : (curlR * 0.35);
            b.rotation.z = isMudraActive ? -0.05 : (-curlR * 0.3);
          } else {
            b.rotation.z = -curlR * 0.65;
          }
        }
      }
    }

    // 7. Hologram Floor Pedestal Rings & Vertical Scanline Sweep
    if (this.visualStyle === 'CYBER_HOLOGRAM') {
      this.hologramRing1.rotation.z += 0.015;
      this.hologramRing2.rotation.z -= 0.01;
      const pulse = Math.sin(now * 3.5) * 0.12 + 0.88;
      (this.hologramRing1.material as THREE.MeshBasicMaterial).opacity = 0.75 * pulse;
      (this.hologramRing2.material as THREE.MeshBasicMaterial).opacity = 0.5 * pulse;

      if (this.scanlineMesh) {
        const scanY = (now * 0.7) % 1.7;
        this.scanlineMesh.position.y = scanY;
        const alpha = Math.sin((scanY / 1.7) * Math.PI) * 0.45;
        (this.scanlineMesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      }
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

  public isLoading(): boolean {
    return this.loading;
  }

  public hasError(): boolean {
    return this.loadError;
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
