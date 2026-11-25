import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const START = new THREE.Vector3(0.7, 0, 2.7);
const TERMINAL = new THREE.Vector3(2.2, 0, -2.5);

/** All rendering resources belong to one route instance and are released on exit. */
export class StationScene {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly robot = new THREE.Group();
  private readonly limbs: THREE.Group[] = [];
  private readonly keys = new Set<string>();
  private readonly clock = new THREE.Clock();
  private readonly observer: ResizeObserver;
  private readonly indicatorMaterial = new THREE.MeshBasicMaterial({
    color: '#ffb53f',
    toneMapped: false,
  });
  private readonly screenMaterial: THREE.MeshStandardMaterial;
  private frame = 0;
  private elapsed = 0;
  private wasNear = false;
  private paused = false;
  private disposed = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly onNear: (near: boolean) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Taller 3D de Estación Ambato. Robot al centro, consola al frente a la derecha y valle nocturno a la izquierda.',
    );
    this.renderer.domElement.setAttribute('role', 'img');
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color('#101c34');
    this.scene.fog = new THREE.Fog('#142035', 24, 65);
    this.screenMaterial = this.material('#0b0f12', 0.4, '#964d07', 0.07);
    this.buildRoom();
    this.buildConsole();
    this.buildRobot();
    this.buildLighting();
    this.robot.position.copy(START);
    this.robot.rotation.y = Math.PI;
    this.scene.add(this.robot);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.animate();
  }

  setKey(key: string, down: boolean): void {
    if (down) this.keys.add(key.toLowerCase());
    else this.keys.delete(key.toLowerCase());
  }

  clearKeys(): void {
    this.keys.clear();
  }
  setPaused(paused: boolean): void {
    this.paused = paused;
    this.clearKeys();
  }

  setSolved(solved: boolean): void {
    this.indicatorMaterial.color.set(solved ? '#47e899' : '#ffb53f');
    this.screenMaterial.emissive.set(solved ? '#428f68' : '#964d07');
  }

  reset(): void {
    this.robot.position.copy(START);
    this.robot.rotation.y = Math.PI;
    this.robot.position.y = 0;
    this.limbs.forEach((limb) => (limb.rotation.x = 0));
    this.setSolved(false);
    this.clearKeys();
    this.onNear(false);
    this.wasNear = false;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        const entries = Array.isArray(object.material) ? object.material : [object.material];
        entries.forEach((material) => {
          materials.add(material);
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) textures.add(value);
          });
        });
      }
    });
    geometries.forEach((item) => item.dispose());
    materials.forEach((item) => item.dispose());
    textures.forEach((item) => item.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private material(
    color: string,
    roughness = 0.65,
    emissive = '#000000',
    intensity = 0,
  ): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.15,
      emissive,
      emissiveIntensity: intensity,
    });
  }

  private box(
    parent: THREE.Object3D,
    size: [number, number, number],
    pos: [number, number, number],
    material: THREE.Material,
    radius = 0.04,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, radius), material);
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private cylinder(
    parent: THREE.Object3D,
    radius: number,
    height: number,
    pos: [number, number, number],
    material: THREE.Material,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), material);
    mesh.position.set(...pos);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private buildRobot(): void {
    const cream = this.material('#c8b694', 0.42);
    const edge = this.material('#e0ccaa', 0.5);
    const joint = this.material('#202831', 0.48);
    const visor = this.material('#191c1d', 0.24);
    const amber = this.material('#ffc257', 0.25, '#ff9b21', 2);
    this.box(this.robot, [0.89, 0.75, 0.51], [0, 1.18, 0], cream, 0.15);
    this.box(this.robot, [0.71, 0.55, 0.075], [0, 1.22, 0.27], edge, 0.09);
    const badge = this.cylinder(this.robot, 0.11, 0.06, [0, 1.23, 0.33], amber);
    badge.rotation.x = Math.PI / 2;
    this.cylinder(this.robot, 0.17, 0.18, [0, 1.65, 0], joint);
    this.box(this.robot, [1.27, 0.87, 0.81], [0, 2.08, 0], cream, 0.22);
    this.box(this.robot, [1.12, 0.66, 0.09], [0, 2.08, 0.397], edge, 0.18);
    this.box(this.robot, [0.99, 0.53, 0.07], [0, 2.08, 0.45], visor, 0.15);
    for (let i = 0; i < 3; i++) {
      this.box(this.robot, [0.67, 0.025, 0.014], [0, 2.03 + i * 0.058, 0.492], amber, 0.007);
      this.box(this.robot, [0.43, 0.035, 0.025], [0, 1.99 + i * 0.09, -0.41], joint, 0.008);
    }
    // Offset antenna and rear service plate preserve the monitor silhouette from behind.
    this.cylinder(this.robot, 0.035, 0.41, [0.43, 2.65, -0.16], joint).rotation.z = -0.17;
    this.box(this.robot, [0.19, 0.13, 0.15], [0.46, 2.87, -0.16], edge, 0.045);
    this.box(this.robot, [0.55, 0.4, 0.03], [0, 1.18, -0.27], edge, 0.06);
    for (const side of [-1, 1]) {
      const shoulder = this.cylinder(this.robot, 0.18, 0.2, [side * 0.52, 1.41, 0], joint);
      shoulder.rotation.z = Math.PI / 2;
      const shoulderCap = this.cylinder(this.robot, 0.12, 0.22, [side * 0.55, 1.41, 0], edge);
      shoulderCap.rotation.z = Math.PI / 2;
      const arm = new THREE.Group();
      arm.position.set(side * 0.56, 1.38, 0);
      arm.rotation.z = side * 0.22;
      this.box(arm, [0.13, 0.36, 0.15], [0, -0.23, 0], joint);
      this.box(arm, [0.25, 0.36, 0.27], [0, -0.48, 0], cream, 0.075);
      this.cylinder(arm, 0.1, 0.15, [0, -0.71, 0], joint);
      for (const finger of [-1, 1])
        this.box(arm, [0.065, 0.15, 0.14], [finger * 0.09, -0.79, 0.04], joint, 0.03);
      this.robot.add(arm);
      this.limbs.push(arm);
      const leg = new THREE.Group();
      leg.position.set(side * 0.25, 0.87, 0);
      this.cylinder(leg, 0.12, 0.34, [0, -0.15, 0], joint);
      this.box(leg, [0.32, 0.37, 0.33], [0, -0.42, 0], cream, 0.07);
      this.box(leg, [0.46, 0.24, 0.65], [0, -0.68, 0.11], edge, 0.09);
      this.box(leg, [0.47, 0.12, 0.66], [0, -0.78, 0.11], joint, 0.035);
      this.robot.add(leg);
      this.limbs.push(leg);
    }
    const screw = this.material('#6d746d', 0.28);
    for (const x of [-0.27, 0.27])
      for (const y of [1.03, 1.41]) {
        const mesh = this.cylinder(this.robot, 0.025, 0.025, [x, y, -0.3], screw);
        mesh.rotation.x = Math.PI / 2;
      }
    this.robot.scale.setScalar(0.8);
  }

  private buildConsole(): void {
    const console = new THREE.Group();
    console.position.copy(TERMINAL);
    this.scene.add(console);
    const cream = this.material('#b8a480', 0.52);
    const trim = this.material('#514f44', 0.55);
    const dark = this.material('#1e2528', 0.4);
    const key = this.material('#d7bc84', 0.45);
    this.box(console, [3.1, 0.4, 1.4], [0, 0.25, 0], trim, 0.09);
    this.box(console, [2.95, 1.25, 1.1], [0, 0.95, -0.1], cream, 0.12);
    this.box(console, [3.15, 0.28, 1.48], [0, 1.45, 0.25], cream, 0.08).rotation.x = 0.12;
    this.box(console, [2.95, 2.1, 0.83], [0, 2.35, -0.3], cream, 0.19);
    this.box(console, [2.6, 1.48, 0.12], [0, 2.23, 0.16], trim, 0.16);
    this.box(console, [2.32, 1.25, 0.12], [0, 2.23, 0.23], dark, 0.19);
    this.box(console, [2.12, 1.07, 0.05], [0, 2.23, 0.31], this.screenMaterial, 0.16);
    const screenTexture = this.makeScreen();
    const screenText = new THREE.Mesh(
      new THREE.PlaneGeometry(1.93, 0.89),
      new THREE.MeshBasicMaterial({
        map: screenTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    screenText.position.set(0, 2.23, 0.345);
    console.add(screenText);
    this.box(console, [2.67, 0.41, 0.12], [0, 3.13, 0.17], trim, 0.07);
    const green = new THREE.MeshBasicMaterial({ color: '#47e899', toneMapped: false });
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * 0.39;
      this.cylinder(console, 0.135, 0.09, [x, 3.13, 0.26], dark).rotation.x = Math.PI / 2;
      this.cylinder(
        console,
        0.087,
        0.1,
        [x, 3.13, 0.29],
        i === 5 ? this.indicatorMaterial : green,
      ).rotation.x = Math.PI / 2;
    }
    this.box(console, [1.55, 0.08, 0.58], [0.15, 1.66, 0.47], dark, 0.035);
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 10; col++) {
        this.box(
          console,
          [0.12, 0.065, 0.105],
          [-0.49 + col * 0.14, 1.72 - row * 0.015, 0.25 + row * 0.13],
          key,
          0.014,
        );
      }
    for (let i = 0; i < 3; i++)
      this.box(
        console,
        [0.25, 0.08, 0.12],
        [-1.07, 1.68, 0.28 + i * 0.18],
        i === 2 ? key : dark,
        0.02,
      );
    this.box(console, [0.31, 0.085, 0.4], [1.13, 1.67, 0.48], dark, 0.025);
    this.box(console, [2.25, 0.48, 0.04], [0, 0.75, 0.48], trim, 0.025);
    for (let i = 0; i < 11; i++)
      this.box(console, [0.045, 0.24, 0.02], [-0.85 + i * 0.17, 0.75, 0.51], dark, 0.005);
    for (const x of [-1.34, 1.34])
      for (const y of [0.45, 1.2, 1.9, 2.7, 3.22]) {
        this.cylinder(console, 0.038, 0.045, [x, y, 0.17], trim).rotation.x = Math.PI / 2;
      }
  }

  private makeScreen(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffbd55';
    ctx.font = '20px monospace';
    ctx.fillText('CHATQUALITY / TERMINAL 01', 28, 44);
    ctx.fillStyle = '#ba7b28';
    ctx.fillRect(28, 60, 575, 2);
    ctx.font = '17px monospace';
    [
      'IP 192.0.2.38  /  10 SEGUNDOS',
      '> 01 02 03 04 05  [ENVIADOS]',
      '> 06              [BLOQUEADO]',
      '',
      'REVISAR REGISTRO _',
    ].forEach((line, i) => ctx.fillText(line, 28, 98 + i * 32));
    for (let y = 0; y < 300; y += 4) {
      ctx.fillStyle = '#00000028';
      ctx.fillRect(0, y, 640, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildRoom(): void {
    const steel = this.material('#29343b', 0.65);
    const plaster = this.material('#726b60', 0.95);
    const wood = this.material('#665440', 0.85);
    const brass = this.material('#a27a3a', 0.55);
    const tile = this.floorTexture();
    const floorMaterial = this.material('#a4a3a0', 0.89);
    floorMaterial.map = tile;
    floorMaterial.bumpMap = tile;
    floorMaterial.bumpScale = 0.035;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = 1;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.box(this.scene, [7.1, 6.8, 0.3], [2.95, 3.3, -4.5], plaster);
    this.box(this.scene, [0.3, 6.8, 11], [6.35, 3.3, 0.85], plaster);
    // The opening occupies the left half of the back wall.
    this.box(this.scene, [6.1, 0.8, 0.5], [-3.4, 5.6, -4.4], steel);
    for (const x of [-6.2, -0.38, 6.2]) {
      this.box(this.scene, [0.33, 6.5, 0.48], [x, 3.15, -4.18], steel);
      this.box(this.scene, [0.65, 0.18, 0.75], [x, 0.1, -4.18], steel);
    }
    this.box(this.scene, [12.8, 0.24, 0.45], [0, 4.75, -4.05], steel);
    for (const z of [-3.3, 0.5, 4.3]) this.box(this.scene, [12.8, 0.25, 0.24], [0, 6.15, z], steel);
    for (let x = -5.9; x < -0.5; x += 1.8)
      this.cylinder(this.scene, 0.055, 1.2, [x, 0.58, -4], brass);
    for (const y of [0.35, 1.12]) {
      const rail = this.cylinder(this.scene, 0.065, 5.8, [-3.3, y, -4], brass);
      rail.rotation.z = Math.PI / 2;
    }
    const panorama = new THREE.Mesh(
      new THREE.PlaneGeometry(37, 10),
      new THREE.MeshBasicMaterial({ map: this.panorama() }),
    );
    panorama.position.set(-1, 0, -18);
    this.scene.add(panorama);
    // Painted safety perimeter leaves an unobstructed path to the keyboard.
    const paint = this.material('#c99a3e', 0.95);
    for (let i = 0; i < 15; i++) {
      this.box(
        this.scene,
        [0.2, 0.012, 0.48],
        [0.1 + i * 0.29, 0.005, -0.8],
        paint,
        0.002,
      ).rotation.y = -0.38;
    }
    this.buildWorkbench(-4.8, 0.6, wood, steel);
    this.buildWorkbench(5.1, -1.8, wood, steel);
    // Shelf by the console with service boxes and books.
    this.box(this.scene, [1.6, 3.3, 0.65], [-1.6, 1.65, -4.07], steel);
    for (const y of [0.45, 1.45, 2.45]) {
      this.box(this.scene, [1.47, 0.07, 0.9], [-1.6, y, -3.85], wood);
      for (let i = 0; i < 4; i++)
        this.box(
          this.scene,
          [0.24, 0.54 + i * 0.06, 0.4],
          [-2.08 + i * 0.29, y + 0.37, -3.8],
          this.material(['#79684c', '#686e65', '#a18b63', '#525f66'][i]),
        );
    }
    // Conduit runs and a small wall-mounted schematic.
    const pipe = this.cylinder(this.scene, 0.07, 4.7, [4.65, 3, -4.17], steel);
    this.box(this.scene, [1.26, 1.05, 0.08], [5.25, 3.6, -4.25], steel);
    const diagram = this.material('#b39152');
    for (let i = 0; i < 3; i++)
      this.box(
        this.scene,
        [0.75 - i * 0.1, 0.018, 0.03],
        [5.25, 3.35 + i * 0.25, -4.19],
        diagram,
        0.002,
      );
    pipe.receiveShadow = true;
    // A potted plant softens the edge of the valley opening.
    this.cylinder(this.scene, 0.26, 0.61, [-0.42, 0.3, -3.5], this.material('#a08a6c'));
    const leaf = this.material('#4d6650', 0.9);
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), leaf);
      mesh.scale.set(1, 2.4, 0.35);
      mesh.position.set(
        -0.42 + Math.sin(angle) * 0.25,
        0.9 + i * 0.09,
        -3.5 + Math.cos(angle) * 0.2,
      );
      mesh.rotation.z = Math.sin(angle) * 0.8;
      this.scene.add(mesh);
    }
  }

  private buildWorkbench(x: number, z: number, wood: THREE.Material, steel: THREE.Material): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    this.scene.add(group);
    this.box(group, [2.2, 0.17, 1.25], [0, 1.25, 0], wood);
    for (const lx of [-0.9, 0.9])
      for (const lz of [-0.45, 0.45]) this.box(group, [0.1, 1.2, 0.1], [lx, 0.6, lz], steel);
    this.box(group, [1.3, 0.66, 0.82], [0, 0.4, 0], this.material('#72756a'));
    this.box(group, [0.7, 0.4, 0.52], [-0.38, 1.53, -0.15], this.material('#7c8d89'));
    this.box(group, [0.72, 0.06, 0.55], [-0.38, 1.74, -0.15], steel);
    this.cylinder(group, 0.12, 0.23, [0.31, 1.45, 0.3], this.material('#c5b598'));
    this.cylinder(group, 0.24, 0.07, [0.72, 1.38, -0.25], steel);
    this.cylinder(group, 0.035, 0.5, [0.72, 1.65, -0.25], steel);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.23, 20, 1, true),
      this.material('#807350'),
    );
    shade.position.set(0.72, 1.95, -0.25);
    group.add(shade);
    const lamp = new THREE.PointLight('#ffb354', 9, 4, 2);
    lamp.position.set(0.72, 1.83, -0.25);
    group.add(lamp);
  }

  private floorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#8a9293';
    ctx.fillRect(0, 0, 512, 512);
    let seed = 158;
    for (let i = 0; i < 16000; i++) {
      seed = (seed * 16807) % 2147483647;
      const x = seed % 512;
      const y = Math.floor(seed / 512) % 512;
      ctx.fillStyle = i % 2 ? '#ffffff0b' : '#0000000c';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.strokeStyle = '#343e47';
    ctx.lineWidth = 6;
    ctx.strokeRect(1, 1, 510, 510);
    ctx.strokeStyle = '#8a8b82';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 502, 502);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private panorama(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    const sky = ctx.createLinearGradient(0, 0, 0, 1024);
    sky.addColorStop(0, '#081225');
    sky.addColorStop(0.55, '#263d65');
    sky.addColorStop(1, '#53657b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 2048, 1024);
    let seed = 126;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 280; i++) {
      ctx.fillStyle = '#bac9dc';
      ctx.globalAlpha = random() * 0.6;
      ctx.fillRect(random() * 2048, random() * 530, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#354a6a';
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(240, 440);
    ctx.lineTo(410, 378);
    ctx.lineTo(680, 145);
    ctx.lineTo(1050, 495);
    ctx.lineTo(1320, 405);
    ctx.lineTo(1680, 550);
    ctx.lineTo(2048, 420);
    ctx.lineTo(2048, 1024);
    ctx.lineTo(0, 1024);
    ctx.fill();
    ctx.fillStyle = '#9caec2';
    ctx.beginPath();
    ctx.moveTo(520, 300);
    ctx.lineTo(680, 145);
    ctx.lineTo(858, 316);
    ctx.lineTo(730, 265);
    ctx.lineTo(706, 299);
    ctx.lineTo(658, 239);
    ctx.lineTo(620, 300);
    ctx.lineTo(601, 269);
    ctx.fill();
    for (let layer = 0; layer < 5; layer++) {
      ctx.fillStyle = ['#233b56', '#1d334c', '#192c42', '#18293b', '#132333'][layer];
      ctx.beginPath();
      ctx.moveTo(0, 1024);
      for (let x = 0; x <= 2048; x += 20) {
        const y =
          570 +
          layer * 82 +
          Math.sin(x / 320 + layer * 1.7) * (110 - layer * 8) +
          Math.sin(x / 90 + layer) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(2048, 1024);
      ctx.fill();
    }
    for (let i = 0; i < 1300; i++) {
      const x = random() * 2048;
      const y = 700 + random() * 260;
      if (y < 760 + Math.sin(x / 300) * 80) continue;
      ctx.fillStyle = ['#e4a95d', '#ffcf89', '#a48666'][i % 3];
      ctx.globalAlpha = 0.3 + random() * 0.65;
      ctx.fillRect(x, y, 1 + random() * 3, 1.5);
    }
    ctx.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildLighting(): void {
    this.scene.add(new THREE.HemisphereLight('#9ab9df', '#514335', 1.9));
    const moon = new THREE.DirectionalLight('#86b8ff', 2.3);
    moon.position.set(-6, 5, -5);
    this.scene.add(moon);
    const warm = new THREE.SpotLight('#ffb95f', 100, 18, 0.75, 0.65, 1.4);
    warm.position.set(2.2, 5.4, -0.6);
    warm.target.position.set(1.6, 0, -1.4);
    warm.castShadow = true;
    warm.shadow.mapSize.set(2048, 2048);
    warm.shadow.bias = -0.0004;
    warm.shadow.radius = 4;
    this.scene.add(warm, warm.target);
    const fill = new THREE.PointLight('#ffb35e', 18, 9, 2);
    fill.position.set(1.7, 2.6, 0);
    this.scene.add(fill);
    const steel = this.material('#393b35');
    this.box(this.scene, [2.8, 0.24, 0.56], [2.2, 5.2, -1.6], steel, 0.07);
    this.box(
      this.scene,
      [2.6, 0.06, 0.43],
      [2.2, 5.04, -1.6],
      this.material('#fff0c4', 0.3, '#ffbd5a', 3),
      0.025,
    );
    for (const x of [1.1, 3.3]) this.cylinder(this.scene, 0.025, 0.9, [x, 5.75, -1.6], steel);
  }

  private resize(): void {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    // A wider lens keeps both the valley opening and the terminal visible on phones.
    this.camera.fov = width < 700 ? 61 : 43;
    this.camera.position.set(width < 700 ? 2.4 : 2.9, 5.1, width < 700 ? 13.8 : 11.4);
    this.camera.lookAt(0.2, 1.7, -0.8);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += delta;
    const movement = new THREE.Vector3();
    if (!this.paused) {
      movement.x =
        Number(this.keys.has('d') || this.keys.has('arrowright')) -
        Number(this.keys.has('a') || this.keys.has('arrowleft'));
      movement.z =
        Number(this.keys.has('s') || this.keys.has('arrowdown')) -
        Number(this.keys.has('w') || this.keys.has('arrowup'));
    }
    if (movement.lengthSq()) {
      movement.normalize().multiplyScalar(delta * 2.5);
      const next = this.robot.position.clone().add(movement);
      next.x = THREE.MathUtils.clamp(next.x, -3.4, 4.1);
      next.z = THREE.MathUtils.clamp(next.z, -1.15, 5.4);
      this.robot.position.copy(next);
      const targetAngle = Math.atan2(movement.x, movement.z);
      this.robot.rotation.y +=
        Math.atan2(
          Math.sin(targetAngle - this.robot.rotation.y),
          Math.cos(targetAngle - this.robot.rotation.y),
        ) * Math.min(delta * 14, 1);
      this.limbs.forEach(
        (limb, i) =>
          (limb.rotation.x =
            Math.sin(this.elapsed * 10 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.35),
      );
      this.robot.position.y = Math.abs(Math.sin(this.elapsed * 10)) * 0.045;
    } else {
      this.limbs.forEach((limb) => (limb.rotation.x *= Math.max(0, 1 - delta * 12)));
      this.robot.position.y = 0;
    }
    const distance = Math.hypot(
      this.robot.position.x - TERMINAL.x,
      this.robot.position.z - TERMINAL.z,
    );
    const near = distance < 2.9;
    if (near !== this.wasNear) {
      this.wasNear = near;
      this.onNear(near);
    }
    this.renderer.render(this.scene, this.camera);
  };
}
