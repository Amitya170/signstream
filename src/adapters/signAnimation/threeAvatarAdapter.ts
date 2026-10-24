import * as THREE from 'three';
import { InterpolatedPose } from './SignAnimatorAdapter';

export interface AvatarOptions {
  skinTone: string;
  outfitColor: string;
  backgroundColor: string;
}

export class ThreeAvatarRig {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private disposed = false;

  // Rig Hierarchical Nodes
  private rootGroup: THREE.Group;
  private headGroup: THREE.Group;
  private browMesh: THREE.Mesh;
  private mouthMesh: THREE.Mesh;
  
  private leftShoulder: THREE.Group;
  private leftUpperArm: THREE.Mesh;
  private leftElbow: THREE.Group;
  private leftForearm: THREE.Mesh;
  private leftWrist: THREE.Group;
  private leftFingers: THREE.Mesh[] = [];

  private rightShoulder: THREE.Group;
  private rightUpperArm: THREE.Mesh;
  private rightElbow: THREE.Group;
  private rightForearm: THREE.Mesh;
  private rightWrist: THREE.Group;
  private rightFingers: THREE.Mesh[] = [];

  private skinMaterial: THREE.MeshStandardMaterial;
  private outfitMaterial: THREE.MeshStandardMaterial;

  constructor(container: HTMLElement, options: AvatarOptions) {
    this.container = container;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.backgroundColor);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0.45, 1.85);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // 3. Lighting (Three-point accessible lighting for clear sign silhouette)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(1.5, 2.5, 2.0);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x99f6e4, 0.5);
    rimLight.position.set(-1.5, 1.5, -1.0);
    this.scene.add(rimLight);

    // 4. Materials
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: options.skinTone,
      roughness: 0.5,
      metalness: 0.1
    });

    this.outfitMaterial = new THREE.MeshStandardMaterial({
      color: options.outfitColor,
      roughness: 0.6
    });

    // 5. Build Rig Hierarchy
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Torso / Chest
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.48, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.outfitMaterial);
    torsoMesh.position.set(0, 0.22, 0);
    this.rootGroup.add(torsoMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.1, 16);
    const neckMesh = new THREE.Mesh(neckGeo, this.skinMaterial);
    neckMesh.position.set(0, 0.49, 0);
    this.rootGroup.add(neckMesh);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.65, 0);
    this.rootGroup.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    this.headGroup.add(headMesh);

    // Stylized Eyes
    const eyeGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.06, 0.03, 0.145);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.06, 0.03, 0.145);
    this.headGroup.add(leftEye, rightEye);

    // Eyebrows (Dynamic for ISL linguistic markers)
    const browGeo = new THREE.BoxGeometry(0.18, 0.015, 0.01);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    this.browMesh = new THREE.Mesh(browGeo, browMat);
    this.browMesh.position.set(0, 0.08, 0.155);
    this.headGroup.add(this.browMesh);

    // Mouth (Dynamic shape for ISL articulation)
    const mouthGeo = new THREE.BoxGeometry(0.08, 0.02, 0.01);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
    this.mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthMesh.position.set(0, -0.06, 0.155);
    this.headGroup.add(this.mouthMesh);

    // LEFT ARM RIG
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.28, 0.42, 0);
    this.rootGroup.add(this.leftShoulder);

    const upperArmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.28, 12);
    upperArmGeo.translate(0, -0.14, 0);
    this.leftUpperArm = new THREE.Mesh(upperArmGeo, this.outfitMaterial);
    this.leftShoulder.add(this.leftUpperArm);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.set(0, -0.28, 0);
    this.leftShoulder.add(this.leftElbow);

    const forearmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.26, 12);
    forearmGeo.translate(0, -0.13, 0);
    this.leftForearm = new THREE.Mesh(forearmGeo, this.skinMaterial);
    this.leftElbow.add(this.leftForearm);

    this.leftWrist = new THREE.Group();
    this.leftWrist.position.set(0, -0.26, 0);
    this.leftElbow.add(this.leftWrist);

    const palmGeo = new THREE.BoxGeometry(0.08, 0.09, 0.025);
    const leftPalm = new THREE.Mesh(palmGeo, this.skinMaterial);
    leftPalm.position.set(0, -0.045, 0);
    this.leftWrist.add(leftPalm);

    // Left articulated fingers (5 fingers)
    for (let f = 0; f < 5; f++) {
      const fingerGeo = new THREE.BoxGeometry(0.015, 0.07, 0.015);
      fingerGeo.translate(0, -0.035, 0);
      const fingerMesh = new THREE.Mesh(fingerGeo, this.skinMaterial);
      fingerMesh.position.set(-0.03 + f * 0.015, -0.09, 0);
      this.leftWrist.add(fingerMesh);
      this.leftFingers.push(fingerMesh);
    }

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

    // Right articulated fingers
    for (let f = 0; f < 5; f++) {
      const fingerGeo = new THREE.BoxGeometry(0.015, 0.07, 0.015);
      fingerGeo.translate(0, -0.035, 0);
      const fingerMesh = new THREE.Mesh(fingerGeo, this.skinMaterial);
      fingerMesh.position.set(-0.03 + f * 0.015, -0.09, 0);
      this.rightWrist.add(fingerMesh);
      this.rightFingers.push(fingerMesh);
    }

    this.render();
  }

  public updatePose(pose: InterpolatedPose): void {
    if (this.disposed) return;

    // Head & Face
    this.headGroup.rotation.set(
      pose.face.headRotation[0],
      pose.face.headRotation[1],
      pose.face.headRotation[2]
    );

    // Dynamic Eyebrow raise/furrow
    this.browMesh.position.y = 0.08 + pose.face.browState * 0.02;

    // Dynamic mouth state
    if (pose.face.mouthState === 'open') {
      this.mouthMesh.scale.set(1.1, 2.0, 1);
    } else if (pose.face.mouthState === 'smile') {
      this.mouthMesh.scale.set(1.4, 0.7, 1);
    } else if (pose.face.mouthState === 'round') {
      this.mouthMesh.scale.set(0.7, 1.8, 1);
    } else {
      this.mouthMesh.scale.set(1, 1, 1);
    }

    // Left Arm Rotation
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

    // Left Finger flexion & curl
    for (let f = 0; f < 5; f++) {
      const curl = pose.leftHand.curl[f] ?? 0;
      this.leftFingers[f].rotation.x = curl * 1.6;
    }

    // Right Arm Rotation
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

    // Right Finger flexion & curl
    for (let f = 0; f < 5; f++) {
      const curl = pose.rightHand.curl[f] ?? 0;
      this.rightFingers[f].rotation.x = curl * 1.6;
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
