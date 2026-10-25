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

function stageInterp(
  p: number,
  tContact: number,
  tRelease: number,
  rest: [number, number, number],
  contact: [number, number, number],
  release: [number, number, number]
): [number, number, number] {
  if (p <= tContact) {
    const t = tContact > 0 ? Math.max(0, Math.min(1, p / tContact)) : 1;
    const s = t * t * (3 - 2 * t);
    return [
      rest[0] + (contact[0] - rest[0]) * s,
      rest[1] + (contact[1] - rest[1]) * s,
      rest[2] + (contact[2] - rest[2]) * s
    ];
  } else if (p <= tRelease) {
    const range = tRelease - tContact;
    const t = range > 0 ? Math.max(0, Math.min(1, (p - tContact) / range)) : 1;
    const s = t * t * (3 - 2 * t);
    return [
      contact[0] + (release[0] - contact[0]) * s,
      contact[1] + (release[1] - contact[1]) * s,
      contact[2] + (release[2] - contact[2]) * s
    ];
  } else {
    const range = 1 - tRelease;
    const t = range > 0 ? Math.max(0, Math.min(1, (p - tRelease) / range)) : 1;
    const s = t * t * (3 - 2 * t);
    return [
      release[0] + (rest[0] - release[0]) * s,
      release[1] + (rest[1] - release[1]) * s,
      release[2] + (rest[2] - release[2]) * s
    ];
  }
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

    // Head-to-waist framing invariant to character height & geometry
    // Lowered modelCenterY and scaled zoom distance fully capture both upper-chest and lower-waist signing spaces
    this.modelCenterY = box.max.y - size.y * 0.30;
    this.zoomDistance = Math.max(1.48, size.y * 0.95);
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
        this.camera.position.set(0, cy + 0.04, this.zoomDistance);
        this.camera.lookAt(0, cy - 0.04, 0);
        break;
      case 'HANDS_FOCUS':
        this.camera.position.set(0, cy - 0.14, this.zoomDistance * 0.72);
        this.camera.lookAt(0, cy - 0.16, 0);
        break;
      case 'FACE_NMM':
        this.camera.position.set(0, cy + 0.28, this.zoomDistance * 0.55);
        this.camera.lookAt(0, cy + 0.24, 0);
        break;
      case 'DIAGONAL_45':
        this.camera.position.set(this.zoomDistance * 0.72, cy + 0.05, this.zoomDistance * 0.72);
        this.camera.lookAt(0, cy - 0.04, 0);
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
    const gloss = this.lastPose?.activeGloss;
    if (gloss === 'NAMASTE') return 'Anjali Mudra (Namaste)';
    if (gloss === 'HELP') return 'Support Help (Fist on Palm)';
    if (gloss === 'THANK-YOU') return 'Chin-to-Forward Gratitude (Thank You)';
    if (gloss === 'DOCTOR') return 'Radial Pulse Check (Doctor)';
    if (gloss === 'TIME') return 'Wristwatch Tap (Time)';
    if (gloss === 'PLEASE') return 'Chest Circular Rub (Please)';
    if (gloss === 'SORRY') return 'Heart Fist Rub with Bow (Sorry)';
    if (gloss === 'WELCOME') return 'Open Palms Inward Scoop (Welcome)';
    if (gloss === 'WATER') return 'Sip/Tap at Mouth (Water)';
    if (gloss === 'YES') return 'Fist Nodding Affirmation (Yes)';
    if (gloss === 'NO') return 'Index Wagging Negation (No)';
    if (gloss === 'I') return 'Index Pointing to Chest (I/Me)';
    if (gloss === 'YOU') return 'Direct Pointing to Partner (You)';
    if (gloss === 'WHERE') return 'Palms-Up Interrogative Shrug (Where)';
    if (gloss === 'GOOD') return 'Thumbs-Up Forward Affirmation (Good)';
    if (gloss) return `Authentic ISL: ${gloss}`;
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

    const gloss = pose.activeGloss;
    const progress = Math.max(0, Math.min(1, pose.progress ?? 0.5));
    let overrideCurlL: number[] | null = null;
    let overrideCurlR: number[] | null = null;

    const rawL = pose.leftHand.position || [-0.15, -0.1, 0.2];
    const rawR = pose.rightHand.position || [0.15, -0.1, 0.2];

    // 2. Biomechanical Clavicle & Shoulder Elevation
    const pitchL = Math.max(0, pose.leftArm.shoulderRotation[0]);
    const pitchR = Math.max(0, pose.rightArm.shoulderRotation[0]);
    if (this.bones.leftShoulder) {
      this.bones.leftShoulder.position.y = Math.max(0, pitchL - 0.2) * 0.02 + breath * 0.003;
    }
    if (this.bones.rightShoulder) {
      this.bones.rightShoulder.position.y = Math.max(0, pitchR - 0.2) * 0.02 + breath * 0.003;
    }

    // Default anatomical resting positions: natural drape beside hips with passive carrying angle
    const restR_Arm: [number, number, number] = [0.02, 0.0, -1.46];
    const restR_Fore: [number, number, number] = [0.0, 0.02, -0.05];
    const restR_Hand: [number, number, number] = [0.0, 0.0, 0.0];

    const restL_Arm: [number, number, number] = [0.02, 0.0, 1.46];
    const restL_Fore: [number, number, number] = [0.0, -0.02, 0.05];
    const restL_Hand: [number, number, number] = [0.0, 0.0, 0.0];

    // 3. Dedicated Authentic ISLRTC Sign Solvers
    if (gloss === 'NAMASTE') {
      // Authentic Sacred Anjali Mudra (Indian Namaste):
      // 1. Preparation (0.0 to 0.28): Hands rise smoothly from rest beside hips to mid-chest.
      // 2. Stroke & Hold with Polite Bow (0.28 to 0.75): Palms meet flush pad-to-pad, all 10 fingers vertical, respectful Indian head bow.
      // 3. Release (0.75 to 1.0): Hands separate and descend smoothly back to relaxed rest pose.
      const anjaliL_Arm: [number, number, number] = [0.60, 0.08, 0.98];
      const anjaliL_Fore: [number, number, number] = [-0.20, 0.40, 1.40];
      const anjaliL_Hand: [number, number, number] = [-1.15, -0.35, 0.35];

      const anjaliR_Arm: [number, number, number] = [0.60, -0.08, -0.98];
      const anjaliR_Fore: [number, number, number] = [-0.20, -0.40, -1.40];
      const anjaliR_Hand: [number, number, number] = [-1.15, 0.35, -0.35];

      const lArm = stageInterp(progress, 0.28, 0.75, restL_Arm, anjaliL_Arm, anjaliL_Arm);
      const lFore = stageInterp(progress, 0.28, 0.75, restL_Fore, anjaliL_Fore, anjaliL_Fore);
      const lHand = stageInterp(progress, 0.28, 0.75, restL_Hand, anjaliL_Hand, anjaliL_Hand);

      const rArm = stageInterp(progress, 0.28, 0.75, restR_Arm, anjaliR_Arm, anjaliR_Arm);
      const rFore = stageInterp(progress, 0.28, 0.75, restR_Fore, anjaliR_Fore, anjaliR_Fore);
      const rHand = stageInterp(progress, 0.28, 0.75, restR_Hand, anjaliR_Hand, anjaliR_Hand);

      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...lArm);
        this.bones.leftForeArm.rotation.set(...lFore);
        this.bones.leftHand.rotation.set(...lHand);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.head) {
        const bow = (progress >= 0.25 && progress <= 0.78)
          ? Math.sin(((progress - 0.25) / 0.53) * Math.PI) * 0.16
          : 0;
        this.bones.head.rotation.set(bow, 0, 0);
      }

      // Fingers transition smoothly from relaxed rest curl to flat Anjali Mudra
      if (progress >= 0.20 && progress <= 0.82) {
        overrideCurlL = [0, 0, 0, 0, 0];
        overrideCurlR = [0, 0, 0, 0, 0];
      } else {
        const t = progress < 0.20 ? (1 - progress / 0.20) : ((progress - 0.82) / 0.18);
        const restCurl = [0.32 * t, 0.38 * t, 0.40 * t, 0.40 * t, 0.36 * t];
        overrideCurlL = restCurl;
        overrideCurlR = restCurl;
      }
    } else if (gloss === 'HELP') {
      // Authentic ISLRTC Help:
      // Non-dominant (left) flat hand palm up at chest; dominant (right) closed fist resting on left palm and lifting slightly together.
      const lArmTarget: [number, number, number] = [0.42, 0.08, 0.88];
      const lForeTarget: [number, number, number] = [-0.10, 0.45, 1.25];
      const lHandTarget: [number, number, number] = [-0.40, 0.50, 0.35];

      const rArmTarget: [number, number, number] = [0.46, -0.08, -0.92];
      const rForeTarget: [number, number, number] = [-0.15, -0.35, -1.35];
      const rHandTarget: [number, number, number] = [-0.25, -0.15, -0.15];

      const lift = Math.sin(progress * Math.PI) * 0.04;

      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(lArmTarget[0] + lift, lArmTarget[1], lArmTarget[2]);
        this.bones.leftForeArm.rotation.set(...lForeTarget);
        this.bones.leftHand.rotation.set(...lHandTarget);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(rArmTarget[0] + lift, rArmTarget[1], rArmTarget[2]);
        this.bones.rightForeArm.rotation.set(...rForeTarget);
        this.bones.rightHand.rotation.set(...rHandTarget);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.06, 0, 0);
      }
      overrideCurlL = [0, 0, 0, 0, 0];
      overrideCurlR = [0, 0.95, 0.95, 0.95, 0.95];
    } else if (gloss === 'THANK-YOU') {
      // Authentic ISLRTC Thank You:
      // Dominant flat hand touching lower chin, then sweeping smoothly forward/downward in gratitude with polite nod.
      const chinArm: [number, number, number] = [0.88, -0.08, -0.98];
      const chinFore: [number, number, number] = [-0.25, -0.40, -1.95];
      const chinHand: [number, number, number] = [-0.85, 0.30, -0.30];

      const relArm: [number, number, number] = [0.55, -0.10, -1.02];
      const relFore: [number, number, number] = [-0.20, -0.15, -1.15];
      const relHand: [number, number, number] = [-0.35, 0.20, -0.15];

      const rArm = stageInterp(progress, 0.32, 0.72, restR_Arm, chinArm, relArm);
      const rFore = stageInterp(progress, 0.32, 0.72, restR_Fore, chinFore, relFore);
      const rHand = stageInterp(progress, 0.32, 0.72, restR_Hand, chinHand, relHand);

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      if (this.bones.head) {
        const nod = progress > 0.32 && progress < 0.85
          ? Math.sin(((progress - 0.32) / 0.53) * Math.PI) * 0.14
          : 0;
        this.bones.head.rotation.set(nod, 0, 0);
      }
      overrideCurlR = [0, 0, 0, 0, 0];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else if (gloss === 'DOCTOR') {
      // Authentic ISLRTC Doctor:
      // Left arm extended forward at lower chest, palm up. Right index and middle fingers tap twice on inner wrist (pulse).
      const lArmTarget: [number, number, number] = [0.42, 0.08, 0.88];
      const lForeTarget: [number, number, number] = [-0.10, 0.50, 1.25];
      const lHandTarget: [number, number, number] = [-0.35, 0.50, 0.35];

      const rArmTarget: [number, number, number] = [0.44, -0.08, -0.96];
      const rForeTarget: [number, number, number] = [-0.18, -0.45, -1.35];
      const rHandTarget: [number, number, number] = [-0.20, -0.25, -0.20];

      const lArm = stageInterp(progress, 0.20, 0.80, restL_Arm, lArmTarget, lArmTarget);
      const lFore = stageInterp(progress, 0.20, 0.80, restL_Fore, lForeTarget, lForeTarget);
      const lHand = stageInterp(progress, 0.20, 0.80, restL_Hand, lHandTarget, lHandTarget);

      const rArm = stageInterp(progress, 0.20, 0.80, restR_Arm, rArmTarget, rArmTarget);
      const rFore = stageInterp(progress, 0.20, 0.80, restR_Fore, rForeTarget, rForeTarget);
      const rHand = stageInterp(progress, 0.20, 0.80, restR_Hand, rHandTarget, rHandTarget);

      if (progress >= 0.25 && progress <= 0.75) {
        const tap = Math.sin(((progress - 0.25) / 0.50) * Math.PI * 6);
        rArm[0] += (tap > 0 ? 0.04 : 0);
      }

      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...lArm);
        this.bones.leftForeArm.rotation.set(...lFore);
        this.bones.leftHand.rotation.set(...lHand);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.08, 0, 0);
      }
      overrideCurlL = [0, 0, 0, 0, 0];
      overrideCurlR = [0.85, 0, 0, 0.85, 0.85];
    } else if (gloss === 'TIME') {
      // Authentic ISLRTC Time:
      // Left arm across chest, back of wrist up. Right index finger taps wristwatch twice.
      const lArmTarget: [number, number, number] = [0.42, 0.08, 0.95];
      const lForeTarget: [number, number, number] = [-0.12, 0.20, 1.35];
      const lHandTarget: [number, number, number] = [0.15, -0.15, 0.10];

      const rArmTarget: [number, number, number] = [0.46, -0.10, -0.98];
      const rForeTarget: [number, number, number] = [-0.18, -0.40, -1.35];
      const rHandTarget: [number, number, number] = [-0.20, -0.20, -0.20];

      const lArm = stageInterp(progress, 0.20, 0.80, restL_Arm, lArmTarget, lArmTarget);
      const lFore = stageInterp(progress, 0.20, 0.80, restL_Fore, lForeTarget, lForeTarget);
      const lHand = stageInterp(progress, 0.20, 0.80, restL_Hand, lHandTarget, lHandTarget);

      const rArm = stageInterp(progress, 0.20, 0.80, restR_Arm, rArmTarget, rArmTarget);
      const rFore = stageInterp(progress, 0.20, 0.80, restR_Fore, rForeTarget, rForeTarget);
      const rHand = stageInterp(progress, 0.20, 0.80, restR_Hand, rHandTarget, rHandTarget);

      if (progress >= 0.25 && progress <= 0.75) {
        const tap = Math.sin(((progress - 0.25) / 0.50) * Math.PI * 6);
        rArm[0] += (tap > 0 ? 0.04 : 0);
      }

      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...lArm);
        this.bones.leftForeArm.rotation.set(...lFore);
        this.bones.leftHand.rotation.set(...lHand);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.08, 0, 0);
      }
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
      overrideCurlR = [0.85, 0, 0.85, 0.85, 0.85];
    } else if (gloss === 'PLEASE') {
      // Authentic ISLRTC Please:
      // Dominant flat hand circular rub over the chest with respectful expression.
      const chestArm: [number, number, number] = [0.65, -0.05, -0.75];
      const chestFore: [number, number, number] = [-0.20, -0.30, -2.05];
      const chestHand: [number, number, number] = [0.25, 0.35, -0.20];

      const rArm = stageInterp(progress, 0.20, 0.80, restR_Arm, chestArm, chestArm);
      const rFore = stageInterp(progress, 0.20, 0.80, restR_Fore, chestFore, chestFore);
      const rHand = stageInterp(progress, 0.20, 0.80, restR_Hand, chestHand, chestHand);

      if (progress >= 0.20 && progress <= 0.80) {
        const phi = ((progress - 0.20) / 0.60) * Math.PI * 4;
        rArm[0] += Math.sin(phi) * 0.035;
        rArm[2] += Math.cos(phi) * 0.035;
      }

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.08, 0, 0);
      }
      overrideCurlR = [0, 0, 0, 0, 0];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else if (gloss === 'SORRY') {
      // Authentic ISLRTC Sorry:
      // Closed fist rubbing gently over heart/chest with remorseful head bow.
      const chestArm: [number, number, number] = [0.62, -0.05, -0.72];
      const chestFore: [number, number, number] = [-0.22, -0.32, -2.10];
      const chestHand: [number, number, number] = [0.20, 0.30, -0.20];

      const rArm = stageInterp(progress, 0.20, 0.80, restR_Arm, chestArm, chestArm);
      const rFore = stageInterp(progress, 0.20, 0.80, restR_Fore, chestFore, chestFore);
      const rHand = stageInterp(progress, 0.20, 0.80, restR_Hand, chestHand, chestHand);

      if (progress >= 0.20 && progress <= 0.80) {
        const phi = ((progress - 0.20) / 0.60) * Math.PI * 4;
        rArm[0] += Math.sin(phi) * 0.035;
        rArm[2] += Math.cos(phi) * 0.035;
      }

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.14, 0.06, -0.04);
      }
      overrideCurlR = [1.0, 1.0, 1.0, 1.0, 1.0];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else if (gloss === 'WELCOME') {
      // Authentic ISLRTC Welcome:
      // Both open hands, palms facing up/inward toward body, scooping in welcoming gesture.
      const lArmTarget: [number, number, number] = [0.48, 0.15, 1.05];
      const lForeTarget: [number, number, number] = [-0.15, 0.55, 1.25];
      const lHandTarget: [number, number, number] = [-0.45, 0.45, 0.35];

      const rArmTarget: [number, number, number] = [0.48, -0.15, -1.05];
      const rForeTarget: [number, number, number] = [-0.15, -0.55, -1.25];
      const rHandTarget: [number, number, number] = [-0.45, -0.45, -0.35];

      const lArm = stageInterp(progress, 0.25, 0.75, restL_Arm, lArmTarget, lArmTarget);
      const lFore = stageInterp(progress, 0.25, 0.75, restL_Fore, lForeTarget, lForeTarget);
      const lHand = stageInterp(progress, 0.25, 0.75, restL_Hand, lHandTarget, lHandTarget);

      const rArm = stageInterp(progress, 0.25, 0.75, restR_Arm, rArmTarget, rArmTarget);
      const rFore = stageInterp(progress, 0.25, 0.75, restR_Fore, rForeTarget, rForeTarget);
      const rHand = stageInterp(progress, 0.25, 0.75, restR_Hand, rHandTarget, rHandTarget);

      if (progress >= 0.25 && progress <= 0.75) {
        const scoop = Math.sin(((progress - 0.25) / 0.50) * Math.PI) * 0.12;
        lArm[0] -= scoop;
        rArm[0] -= scoop;
      }

      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...lArm);
        this.bones.leftForeArm.rotation.set(...lFore);
        this.bones.leftHand.rotation.set(...lHand);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.10, 0, 0);
      }
      overrideCurlL = [0, 0, 0, 0, 0];
      overrideCurlR = [0, 0, 0, 0, 0];
    } else if (gloss === 'WATER') {
      // Authentic ISLRTC Water:
      // Dominant hand in 'W' shape tapping twice near corner of mouth.
      const mouthArm: [number, number, number] = [0.86, -0.08, -0.95];
      const mouthFore: [number, number, number] = [-0.25, -0.40, -2.15];
      const mouthHand: [number, number, number] = [-0.60, 0.35, -0.30];

      const rArm = stageInterp(progress, 0.25, 0.75, restR_Arm, mouthArm, mouthArm);
      const rFore = stageInterp(progress, 0.25, 0.75, restR_Fore, mouthFore, mouthFore);
      const rHand = stageInterp(progress, 0.25, 0.75, restR_Hand, mouthHand, mouthHand);

      if (progress >= 0.25 && progress <= 0.75) {
        const tap = Math.sin(((progress - 0.25) / 0.50) * Math.PI * 6) * 0.04;
        rFore[2] += tap;
      }

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      overrideCurlR = [0.85, 0, 0, 0, 0.85];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else if (gloss === 'YES') {
      // Closed fist nodding up and down at wrist with head nod
      const chestArm: [number, number, number] = [0.55, -0.10, -1.02];
      const chestFore: [number, number, number] = [-0.20, -0.20, -1.25];

      const rArm = stageInterp(progress, 0.20, 0.80, restR_Arm, chestArm, chestArm);
      const rFore = stageInterp(progress, 0.20, 0.80, restR_Fore, chestFore, chestFore);
      let nod = 0;
      if (progress >= 0.20 && progress <= 0.80) {
        nod = Math.sin(((progress - 0.20) / 0.60) * Math.PI * 6) * 0.35;
      }

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(-0.35 + nod, 0.15, -0.10);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(Math.max(0, nod * 0.4), 0, 0);
      }
      overrideCurlR = [1.0, 1.0, 1.0, 1.0, 1.0];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else if (gloss === 'NO') {
      // Index finger extended wagging left-right with head shake
      const chestArm: [number, number, number] = [0.55, -0.10, -1.02];
      const chestFore: [number, number, number] = [-0.20, -0.20, -1.25];

      const rArm = stageInterp(progress, 0.20, 0.80, restR_Arm, chestArm, chestArm);
      const rFore = stageInterp(progress, 0.20, 0.80, restR_Fore, chestFore, chestFore);
      let wag = 0;
      if (progress >= 0.20 && progress <= 0.80) {
        wag = Math.sin(((progress - 0.20) / 0.60) * Math.PI * 6) * 0.35;
      }

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(-0.35, 0.15 + wag, -0.10);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0, -wag * 0.4, 0);
      }
      overrideCurlR = [0.85, 0, 0.85, 0.85, 0.85];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else if (gloss === 'I') {
      // Index finger pointing to center of chest
      const chestArm: [number, number, number] = [0.65, -0.05, -0.75];
      const chestFore: [number, number, number] = [-0.20, -0.30, -2.05];
      const chestHand: [number, number, number] = [0.45, 0.35, -0.20];

      const rArm = stageInterp(progress, 0.25, 0.75, restR_Arm, chestArm, chestArm);
      const rFore = stageInterp(progress, 0.25, 0.75, restR_Fore, chestFore, chestFore);
      const rHand = stageInterp(progress, 0.25, 0.75, restR_Hand, chestHand, chestHand);

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      overrideCurlR = [0.85, 0, 0.85, 0.85, 0.85];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else if (gloss === 'YOU') {
      // Index finger pointing forward at conversational partner
      const fwdArm: [number, number, number] = [0.55, -0.10, -1.02];
      const fwdFore: [number, number, number] = [-0.15, 0.05, -1.05];
      const fwdHand: [number, number, number] = [-0.25, 0.15, -0.10];

      const rArm = stageInterp(progress, 0.25, 0.75, restR_Arm, fwdArm, fwdArm);
      const rFore = stageInterp(progress, 0.25, 0.75, restR_Fore, fwdFore, fwdFore);
      const rHand = stageInterp(progress, 0.25, 0.75, restR_Hand, fwdHand, fwdHand);

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.05, 0, 0);
      }
      overrideCurlR = [0.85, 0, 0.85, 0.85, 0.85];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else if (gloss === 'WHERE') {
      // Both open hands palms up at lower chest level shrugging side to side
      const lArmTarget: [number, number, number] = [0.45, 0.12, 1.10];
      const lForeTarget: [number, number, number] = [-0.15, 0.50, 1.25];
      const lHandTarget: [number, number, number] = [-0.40, 0.45, 0.30];

      const rArmTarget: [number, number, number] = [0.45, -0.12, -1.10];
      const rForeTarget: [number, number, number] = [-0.15, -0.50, -1.25];
      const rHandTarget: [number, number, number] = [-0.40, -0.45, -0.30];

      const lArm = stageInterp(progress, 0.25, 0.75, restL_Arm, lArmTarget, lArmTarget);
      const lFore = stageInterp(progress, 0.25, 0.75, restL_Fore, lForeTarget, lForeTarget);
      const lHand = stageInterp(progress, 0.25, 0.75, restL_Hand, lHandTarget, lHandTarget);

      const rArm = stageInterp(progress, 0.25, 0.75, restR_Arm, rArmTarget, rArmTarget);
      const rFore = stageInterp(progress, 0.25, 0.75, restR_Fore, rForeTarget, rForeTarget);
      const rHand = stageInterp(progress, 0.25, 0.75, restR_Hand, rHandTarget, rHandTarget);

      if (progress >= 0.25 && progress <= 0.75) {
        const shrug = Math.sin(((progress - 0.25) / 0.50) * Math.PI * 4) * 0.04;
        lArm[2] -= shrug;
        rArm[2] += shrug;
      }

      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...lArm);
        this.bones.leftForeArm.rotation.set(...lFore);
        this.bones.leftHand.rotation.set(...lHand);
      }
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.04, 0, 0);
      }
      overrideCurlL = [0, 0, 0, 0, 0];
      overrideCurlR = [0, 0, 0, 0, 0];
    } else if (gloss === 'GOOD') {
      // Thumbs-up moving forward from chest with affirmative smile
      const fwdArm: [number, number, number] = [0.55, -0.10, -1.02];
      const fwdFore: [number, number, number] = [-0.15, -0.10, -1.15];
      const fwdHand: [number, number, number] = [-0.25, 0.20, -0.10];

      const rArm = stageInterp(progress, 0.25, 0.75, restR_Arm, fwdArm, fwdArm);
      const rFore = stageInterp(progress, 0.25, 0.75, restR_Fore, fwdFore, fwdFore);
      const rHand = stageInterp(progress, 0.25, 0.75, restR_Hand, fwdHand, fwdHand);

      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        this.bones.rightArm.rotation.set(...rArm);
        this.bones.rightForeArm.rotation.set(...rFore);
        this.bones.rightHand.rotation.set(...rHand);
      }
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        this.bones.leftArm.rotation.set(...restL_Arm);
        this.bones.leftForeArm.rotation.set(...restL_Fore);
        this.bones.leftHand.rotation.set(...restL_Hand);
      }
      if (this.bones.head) {
        this.bones.head.rotation.set(0.08, 0, 0);
      }
      overrideCurlR = [0, 1.0, 1.0, 1.0, 1.0];
      overrideCurlL = [0.32, 0.38, 0.40, 0.40, 0.36];
    } else {
      // Dynamic Kinematic Spatial Solving for all other dictionary words and sentences:
      if (this.bones.head) {
        const gazeY = ((rawL[1] + rawR[1]) * 0.5 - 0.1) * 0.2;
        this.bones.head.rotation.set(
          pose.face.headRotation[0] * 0.7 - gazeY,
          pose.face.headRotation[1] * 0.7,
          pose.face.headRotation[2] * 0.7
        );
      }

      const isRightActive = rawR[1] > -0.05 || rawR[2] > 0.24 || Math.abs(rawR[0] - 0.15) > 0.03;
      const isLeftActive = rawL[1] > -0.05 || rawL[2] > 0.24 || Math.abs(rawL[0] + 0.15) > 0.03;

      // Right Arm Solving
      if (this.bones.rightArm && this.bones.rightForeArm && this.bones.rightHand) {
        if (!isRightActive) {
          this.bones.rightArm.rotation.set(...restR_Arm);
          this.bones.rightForeArm.rotation.set(...restR_Fore);
          this.bones.rightHand.rotation.set(...restR_Hand);
        } else {
          const targetX = rawR[0];
          const targetY = rawR[1];
          const targetZ = rawR[2];

          // 1. Shoulder Pitch
          const basePitchR = 0.42 + (targetY + 0.08) * 0.95;
          const rPitch = targetY > 0.30
            ? Math.max(basePitchR, 0.52 + (targetY - 0.30) * 1.1)
            : basePitchR;
          const clampedPitchR = Math.max(0.25, Math.min(1.42, rPitch));

          // 2. Shoulder Adduction
          const adductionR = -1.25 + Math.min(0.48, Math.max(-0.45, (0.18 - targetX) * 0.88));

          // 3. Elbow Flexion
          const baseElbowR = pose.rightArm?.elbowAngle
            ? pose.rightArm.elbowAngle * 0.95
            : Math.max(0.45, 1.45 - (targetZ - 0.2) * 1.6);
          const rElbow = targetY > 0.30 && targetZ < 0.26
            ? Math.max(baseElbowR, 1.55 + (targetY - 0.30) * 0.6)
            : baseElbowR;

          // 4. Forearm Orientation
          const foreRollR = pose.rightArm?.forearmRoll || -0.25;
          const rForePitch = -0.20 + (targetY > 0.25 ? -(targetY - 0.25) * 0.35 : 0);

          this.bones.rightArm.rotation.set(clampedPitchR, -0.10, adductionR);
          this.bones.rightForeArm.rotation.set(rForePitch, foreRollR, -rElbow);

          // 5. Hand & Wrist Rotation: Respects keyframe rotation directly without forced hyperextension
          this.bones.rightHand.rotation.set(
            pose.rightHand.rotation[0],
            pose.rightHand.rotation[1],
            pose.rightHand.rotation[2]
          );
        }
      }

      // Left Arm Solving
      if (this.bones.leftArm && this.bones.leftForeArm && this.bones.leftHand) {
        if (!isLeftActive) {
          this.bones.leftArm.rotation.set(...restL_Arm);
          this.bones.leftForeArm.rotation.set(...restL_Fore);
          this.bones.leftHand.rotation.set(...restL_Hand);
        } else {
          const targetX = rawL[0];
          const targetY = rawL[1];
          const targetZ = rawL[2];

          // 1. Shoulder Pitch
          const basePitchL = 0.42 + (targetY + 0.08) * 0.95;
          const lPitch = targetY > 0.30
            ? Math.max(basePitchL, 0.52 + (targetY - 0.30) * 1.1)
            : basePitchL;
          const clampedPitchL = Math.max(0.25, Math.min(1.42, lPitch));

          // 2. Shoulder Adduction
          const adductionL = 1.25 - Math.min(0.48, Math.max(-0.45, (targetX + 0.18) * 0.88));

          // 3. Elbow Flexion
          const baseElbowL = pose.leftArm?.elbowAngle
            ? pose.leftArm.elbowAngle * 0.95
            : Math.max(0.45, 1.45 - (targetZ - 0.2) * 1.6);
          const lElbow = targetY > 0.30 && targetZ < 0.26
            ? Math.max(baseElbowL, 1.55 + (targetY - 0.30) * 0.6)
            : baseElbowL;

          // 4. Forearm Orientation
          const foreRollL = pose.leftArm?.forearmRoll || 0.25;
          const lForePitch = -0.20 + (targetY > 0.25 ? -(targetY - 0.25) * 0.35 : 0);

          this.bones.leftArm.rotation.set(clampedPitchL, 0.10, adductionL);
          this.bones.leftForeArm.rotation.set(lForePitch, foreRollL, lElbow);

          // 5. Hand & Wrist Rotation
          this.bones.leftHand.rotation.set(
            pose.leftHand.rotation[0],
            pose.leftHand.rotation[1],
            pose.leftHand.rotation[2]
          );
        }
      }
    }

    // 6. Biological Multi-Phalanx Flexion, Anti-Starfish Finger Convergence & Thumb Adduction
    const spreadR = (pose.rightHand.spread ?? 0.05);
    const spreadL = (pose.leftHand.spread ?? 0.05);
    const phalanxFlex = [1.25, 1.45, 1.10, 0.60];

    for (let f = 0; f < 5; f++) {
      const curlL = overrideCurlL ? (overrideCurlL[f] ?? 0) : (pose.leftHand.curl[f] ?? 0);
      const leftChain = this.bones.leftFingers[f];
      if (leftChain) {
        for (let p = 0; p < leftChain.length; p++) {
          const b = leftChain[p];
          if (f === 0) {
            // Biomechanically calibrated thumb adduction & flexion (Pataka vs Fist vs Resting)
            if (curlL < 0.25) {
              // Flat Pataka Handshape: Thumb adducts flush along radial index border
              b.rotation.x = -0.35 * (p === 0 ? 1.0 : 0.6);
              b.rotation.y = -0.45 * (p === 0 ? 1.0 : 0.4);
              b.rotation.z = 0.40 * (p === 0 ? 1.0 : 0.6);
            } else if (curlL > 0.70) {
              // Closed S-Fist: Thumb wraps across folded fingers
              b.rotation.x = -0.55 * (p === 0 ? 1.0 : 0.7);
              b.rotation.y = 0.15 * (p === 0 ? 1.0 : 0.5);
              b.rotation.z = 0.75 * (p === 0 ? 1.0 : 0.7);
            } else {
              // Relaxed Resting Thumb (natural drape)
              const t = (curlL - 0.25) / 0.45;
              b.rotation.x = (-0.35 + (-0.55 - -0.35) * t) * (p === 0 ? 1.0 : 0.6);
              b.rotation.y = (-0.45 + (0.15 - -0.45) * t) * (p === 0 ? 1.0 : 0.4);
              b.rotation.z = (0.40 + (0.75 - 0.40) * t) * (p === 0 ? 1.0 : 0.6);
            }
          } else {
            const flex = (phalanxFlex[p] ?? 1.1) * curlL;
            b.rotation.x = 0;
            b.rotation.z = flex;
            // Anti-starfish finger convergence when flat; spread only when explicitly commanded
            if (spreadL > 0.1) {
              b.rotation.y = (f - 2) * spreadL * 0.25 * (p === 0 ? 1.0 : 0.3);
            } else {
              b.rotation.y = (f - 2) * 0.07 * (1.0 - Math.min(1.0, curlL * 1.2)) * (p === 0 ? 1.0 : 0.4);
            }
          }
        }
      }

      const curlR = overrideCurlR ? (overrideCurlR[f] ?? 0) : (pose.rightHand.curl[f] ?? 0);
      const rightChain = this.bones.rightFingers[f];
      if (rightChain) {
        for (let p = 0; p < rightChain.length; p++) {
          const b = rightChain[p];
          if (f === 0) {
            // Biomechanically calibrated thumb adduction & flexion (Pataka vs Fist vs Resting)
            if (curlR < 0.25) {
              // Flat Pataka Handshape: Thumb adducts flush along radial index border
              b.rotation.x = -0.35 * (p === 0 ? 1.0 : 0.6);
              b.rotation.y = 0.45 * (p === 0 ? 1.0 : 0.4);
              b.rotation.z = -0.40 * (p === 0 ? 1.0 : 0.6);
            } else if (curlR > 0.70) {
              // Closed S-Fist: Thumb wraps across folded fingers
              b.rotation.x = -0.55 * (p === 0 ? 1.0 : 0.7);
              b.rotation.y = -0.15 * (p === 0 ? 1.0 : 0.5);
              b.rotation.z = -0.75 * (p === 0 ? 1.0 : 0.7);
            } else {
              // Relaxed Resting Thumb (natural drape)
              const t = (curlR - 0.25) / 0.45;
              b.rotation.x = (-0.35 + (-0.55 - -0.35) * t) * (p === 0 ? 1.0 : 0.6);
              b.rotation.y = (0.45 + (-0.15 - 0.45) * t) * (p === 0 ? 1.0 : 0.4);
              b.rotation.z = (-0.40 + (-0.75 - -0.40) * t) * (p === 0 ? 1.0 : 0.6);
            }
          } else {
            const flex = (phalanxFlex[p] ?? 1.1) * curlR;
            b.rotation.x = 0;
            b.rotation.z = -flex;
            // Anti-starfish finger convergence when flat; spread only when explicitly commanded
            if (spreadR > 0.1) {
              b.rotation.y = (f - 2) * -spreadR * 0.25 * (p === 0 ? 1.0 : 0.3);
            } else {
              b.rotation.y = (f - 2) * -0.07 * (1.0 - Math.min(1.0, curlR * 1.2)) * (p === 0 ? 1.0 : 0.4);
            }
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
