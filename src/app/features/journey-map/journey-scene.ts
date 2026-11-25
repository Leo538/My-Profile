import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { ProjectId, MainProjectId } from '../../core/data/projects.data';
import type { JourneyActivityState } from './journey-activity';
import {
  ENTRANCE,
  LEVEL_CENTRES,
  LOWER_ASCENT,
  UPPER_ASCENT,
  SUMMIT_ASCENT,
  STATION_POSITIONS,
  STATION_LEVELS,
  findWalkingPath,
  mapLevelAt,
  worldCanWalk,
  worldHeight,
  type MapLevel,
  type WorldPoint,
} from './journey-world';

export interface MapLabel {
  id: ProjectId;
  x: number;
  y: number;
  level: MapLevel;
}

const DESTINATIONS = Object.fromEntries(
  Object.entries(STATION_POSITIONS).map(([id, point]) => [id, new THREE.Vector3(...point)]),
) as Record<ProjectId, THREE.Vector3>;
const START = new THREE.Vector3(0, 0.38, 4.35);
const JUNCTION: [number, number] = [0, 3.7];
const BRANCHES: Record<MainProjectId, [number, number][]> = {
  finansmart: [JUNCTION, [-2.3, 3.1], [-4.3, 2.65], [-5.8, 2.25]],
  sicop: [JUNCTION, [-0.35, 1.8], [0, 0.2], [0, -2]],
  chatquality: [JUNCTION, [2.2, 2.9], [4.4, 2.2], [5.8, 1.8]],
};

/** A self-contained diorama. Route content and project sheets never depend on WebGL. */
export class JourneyScene {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly robot = new THREE.Group();
  private readonly limbs: THREE.Group[] = [];
  private readonly keys = new Set<string>();
  private readonly resizeObserver: ResizeObserver;
  private readonly geometryCache = new Map<string, THREE.BufferGeometry>();
  private readonly paintedMaterials = new Map<string, THREE.MeshStandardMaterial>();
  private readonly movement = new THREE.Vector3();
  private readonly cameraRight = new THREE.Vector3();
  private readonly cameraForward = new THREE.Vector3();
  private readonly nextPosition = new THREE.Vector3();
  private readonly cameraTarget = new THREE.Vector3(0, 1.4, -0.8);
  private readonly desiredCameraTarget = new THREE.Vector3();
  private readonly desiredCameraPosition = new THREE.Vector3();
  private readonly cameraOffset = new THREE.Vector3(0, 9.9, 22.8);
  private readonly projectedLabel = new THREE.Vector3();
  private readonly labelAnchors: Record<ProjectId, THREE.Vector3> = {
    finansmart: new THREE.Vector3(-5.8, 4.65, 0.15),
    sicop: new THREE.Vector3(0, 6.05, -4.4),
    chatquality: new THREE.Vector3(5.8, 4.6, -0.4),
    riego: new THREE.Vector3(-0.5, 6.3, -11.65),
    agropay: new THREE.Vector3(6.8, 6, -11.6),
    vinculacion: new THREE.Vector3(-5.3, 6.4, -11.65),
    rgb: new THREE.Vector3(-3.5, 8.8, -21.4),
    novacore: new THREE.Vector3(4.3, 9.1, -21.65),
    pantufladas: new THREE.Vector3(1.3, 15.1, -34.2),
  };
  private routeEntry = { x: 50, y: 80 };
  private lastLabelSignature = '';
  private readonly mobile = matchMedia('(max-width: 700px)').matches;
  private readonly startedAt = performance.now();
  private pavingMap?: THREE.CanvasTexture;
  private readonly ink = this.material('#4e6b85', 0.55, '#193e60', 0.18);
  private readonly clay = this.material('#95664c', 0.7);
  private readonly paper = this.material('#c5b393', 0.8);
  private readonly stone = this.material('#6d727a', 0.9);
  private readonly foliage = this.material('#405b50', 0.9);
  private readonly warmGlass = this.material('#dfa34d', 0.3, '#ffad42', 0.7);
  private readonly roadRim = this.material('#d99436', 0.55, '#ff991d', 0.55);
  private glassLighting = false;
  private readonly wornPaint = this.paintTexture();
  private readonly policyIndicators: THREE.MeshBasicMaterial[] = [];
  private readonly transmissionIndicators: THREE.MeshBasicMaterial[] = [];
  private readonly summitIndicators: THREE.MeshBasicMaterial[] = [];
  private summitStar?: THREE.MeshStandardMaterial;
  private summitLight?: THREE.PointLight;
  private journeyAwarded = false;
  private frame = 0;
  private active = true;
  private prepared = false;
  private dirty = true;
  private lastFrameTime = performance.now();
  private lastShadowTime = 0;
  private renderCount = 0;
  private movingRenderTime = 0;
  private movingSamples = 0;
  private firstRender?: () => void;
  private elapsed = 0;
  private nearest: ProjectId | null = null;
  private travel?: {
    id: ProjectId | null;
    destination: THREE.Vector3;
    points: THREE.Vector3[];
    cumulative: number[];
    length: number;
    time: number;
    duration: number;
    onArrival: () => void;
  };
  private disposed = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly onNear: (id: ProjectId | null) => void,
    private readonly onLabels: (
      labels: MapLabel[],
      entry: { x: number; y: number },
      level: MapLevel,
    ) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    this.renderer.setClearColor('#101b2c', 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.domElement.setAttribute('role', 'img');
    this.setLanguage('es');
    host.appendChild(this.renderer.domElement);
    this.paper.map = this.wornPaint;
    this.paper.bumpMap = this.wornPaint;
    this.paper.bumpScale = 0.008;
    this.scene.fog = new THREE.Fog('#101b2c', 35, 70);
    this.buildLighting();
    this.buildIsland();
    this.buildLookout();
    this.buildArchive();
    this.buildTower();
    this.buildLandscape();
    this.buildHillside();
    this.buildUpperStations();
    this.buildSummit();
    this.setActivityState({ policyStage: 0, transmissions: [] });
    this.buildRobot();
    this.robot.scale.setScalar(1);
    this.robot.position.copy(START);
    this.robot.rotation.y = 0.42;
    this.scene.add(this.robot);
    this.camera.position.set(0, 11.3, 22);
    this.camera.lookAt(0, 1.4, -0.8);
    this.camera.updateMatrixWorld();
    this.cameraRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.cameraForward.set(-this.cameraRight.z, 0, this.cameraRight.x);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.updateMetrics('preparing');
  }

  /** Compile without a blocking first draw, then paint once before exposing the ready state. */
  async prepare(): Promise<void> {
    await this.renderer.compileAsync(this.scene, this.camera);
    if (this.disposed) return;
    this.prepared = true;
    this.lastFrameTime = performance.now();
    if (!this.active) return;
    await new Promise<void>((resolve) => {
      this.firstRender = resolve;
      this.requestRender();
    });
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    this.lastFrameTime = performance.now();
    if (!active) {
      this.keys.clear();
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.updateMetrics('paused');
      return;
    }
    this.requestRender();
  }

  setKey(key: string, down: boolean): void {
    if (!down && !this.keys.has(key.toLowerCase())) return;
    if (down) {
      if (!this.keys.size && !this.travel) this.lastFrameTime = performance.now();
      this.travel = undefined;
      this.keys.add(key.toLowerCase());
    } else this.keys.delete(key.toLowerCase());
    this.requestRender();
  }

  clearKeys(): void {
    this.keys.clear();
    this.requestRender();
  }

  setLanguage(language: 'es' | 'en'): void {
    this.renderer.domElement.setAttribute(
      'aria-label',
      language === 'es'
        ? 'Mapa nocturno de nueve proyectos: tres en la plaza, tres en la primera terraza, dos en la segunda y Pantufladas como proyecto estrella en la cima.'
        : 'Nine projects at night: three in the plaza, three on the first terrace, two on the second, and featured project Pantufladas at the summit.',
    );
  }

  goTo(id: ProjectId): void {
    this.travel = undefined;
    this.clearKeys();
    this.robot.position.copy(DESTINATIONS[id]);
    this.robot.rotation.y = Math.PI;
    this.lastFrameTime = performance.now();
    this.updateNearest();
    this.renderer.shadowMap.needsUpdate = true;
    this.requestRender();
  }

  returnToEntrance(onArrival: () => void = () => {}): boolean {
    return this.moveToPoint(ENTRANCE, onArrival);
  }

  travelToLevel(level: MapLevel, onArrival: () => void): boolean {
    return this.moveToPoint(LEVEL_CENTRES[level], onArrival);
  }

  goToLevel(level: MapLevel): void {
    this.travel = undefined;
    this.clearKeys();
    this.robot.position.set(...LEVEL_CENTRES[level]);
    this.lastFrameTime = performance.now();
    this.updateNearest();
    this.renderer.shadowMap.needsUpdate = true;
    this.requestRender();
  }

  setActivityState(state: JourneyActivityState): void {
    const stage = THREE.MathUtils.clamp(Math.trunc(state.policyStage), 0, 3);
    this.policyIndicators.forEach((material, index) => {
      let color = '#26394a';
      if (index < stage || stage === 3) color = '#80ddb0';
      else if (index === stage) color = '#efb65b';
      material.color.set(color);
    });
    this.requestRender();
    this.transmissionIndicators.forEach((material, index) => {
      const entry = state.transmissions[index];
      let color = '#26394a';
      if (entry) color = entry.accepted ? '#80ddb0' : '#efb65b';
      material.color.set(color);
    });
  }

  setJourneyProgress(levels: readonly boolean[], completed: boolean): void {
    this.summitIndicators.forEach((material, index) =>
      material.color.set(levels[index] ? '#ffe0a1' : '#394958'),
    );
    this.journeyAwarded = completed;
    if (this.summitStar) this.summitStar.emissiveIntensity = completed ? 0.32 : 0.12;
    if (this.summitLight) this.summitLight.intensity = completed ? 40 : 25;
    this.host.dataset['summitAwarded'] = String(completed);
    this.requestRender();
  }

  travelTo(id: ProjectId, onArrival: () => void): boolean {
    return this.moveToPoint(STATION_POSITIONS[id], onArrival, id);
  }

  private moveToPoint(
    destination: WorldPoint,
    onArrival: () => void,
    id: ProjectId | null = null,
  ): boolean {
    this.clearKeys();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.travel = undefined;
      this.robot.position.set(...destination);
      this.updateCamera(1, true);
      this.updateNearest();
      this.renderer.shadowMap.needsUpdate = true;
      this.requestRender();
      onArrival();
      return true;
    }
    const target = new THREE.Vector3(...destination);
    if (this.robot.position.distanceTo(target) < 0.05) {
      onArrival();
      return true;
    }
    const route = findWalkingPath(
      [this.robot.position.x, this.robot.position.y, this.robot.position.z],
      destination,
    );
    const points = route.map((point) => new THREE.Vector3(...point));
    if (points.length < 2) return false;
    const cumulative = [0];
    for (let index = 1; index < points.length; index++)
      cumulative.push(cumulative[index - 1] + points[index].distanceTo(points[index - 1]));
    const length = cumulative[cumulative.length - 1];
    this.travel = {
      id,
      destination: target,
      points,
      cumulative,
      length,
      time: 0,
      duration: Math.max(length / 4.2, 0.8),
      onArrival,
    };
    this.lastFrameTime = performance.now();
    this.requestRender();
    return true;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.firstRender?.();
    this.firstRender = undefined;
    this.resizeObserver.disconnect();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.Line
      ) {
        geometries.add(object.geometry);
        const entries = Array.isArray(object.material) ? object.material : [object.material];
        entries.forEach((material) => {
          materials.add(material);
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) textures.add(value);
          });
        });
      }
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.geometryCache.clear();
    this.paintedMaterials.clear();
  }

  private material(
    color: string,
    roughness = 0.75,
    emissive = '#000000',
    emissiveIntensity = 0,
  ): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.05,
      emissive,
      emissiveIntensity,
    });
  }

  private paintTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#e7dfcd';
    context.fillRect(0, 0, 256, 256);
    let seed = 437;
    for (let index = 0; index < 7000; index++) {
      seed = (seed * 16807) % 2147483647;
      context.fillStyle = index % 2 ? '#ffffff16' : '#77674c14';
      context.fillRect(seed % 256, Math.floor(seed / 256) % 256, 2, 2);
    }
    context.strokeStyle = '#6d635449';
    context.lineWidth = 0.6;
    for (let index = 0; index < 28; index++) {
      const x = (index * 47) % 256;
      const y = (index * 73) % 256;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 4 + (index % 9), y - 2);
      context.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private paintedMetal(color: string): THREE.MeshStandardMaterial {
    const cached = this.paintedMaterials.get(color);
    if (cached) return cached;
    const material = this.material(color, 0.58);
    material.metalness = 0.24;
    material.map = this.wornPaint;
    material.bumpMap = this.wornPaint;
    material.bumpScale = 0.012;
    this.paintedMaterials.set(color, material);
    return material;
  }

  private geometry(key: string, create: () => THREE.BufferGeometry): THREE.BufferGeometry {
    const cached = this.geometryCache.get(key);
    if (cached) return cached;
    const geometry = create();
    this.geometryCache.set(key, geometry);
    return geometry;
  }

  private buildLighting(): void {
    this.scene.add(new THREE.HemisphereLight('#8ba6d1', '#222437', 1.35));
    const moon = new THREE.DirectionalLight('#aacbff', 1.8);
    moon.position.set(-8, 16, -5);
    moon.castShadow = true;
    moon.shadow.mapSize.setScalar(this.mobile ? 512 : 1024);
    moon.shadow.camera.left = -15;
    moon.shadow.camera.right = 15;
    moon.shadow.camera.top = 12;
    moon.shadow.camera.bottom = -12;
    moon.shadow.normalBias = 0.03;
    moon.shadow.radius = 3.5;
    this.scene.add(moon);
    const warm = new THREE.SpotLight('#ffc17a', 160, 30, 0.75, 0.95, 1.5);
    warm.position.set(-2, 9, 6);
    warm.target.position.set(-2, 0, 2.7);
    this.scene.add(warm, warm.target);
    const fill = new THREE.DirectionalLight('#f3b66b', 0.8);
    fill.position.set(2, 4, 9);
    this.scene.add(fill);
  }

  private box(
    parent: THREE.Object3D,
    size: [number, number, number],
    position: [number, number, number],
    material: THREE.Material,
    radius = 0.05,
  ): THREE.Mesh {
    const segments = radius >= 0.1 ? 2 : 1;
    const geometry = this.geometry(
      `box:${size.join(',')}:${radius}`,
      () => new RoundedBoxGeometry(...size, segments, radius),
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private cylinder(
    parent: THREE.Object3D,
    radius: number,
    height: number,
    position: [number, number, number],
    material: THREE.Material,
    topRadius = radius,
  ): THREE.Mesh {
    const geometry = this.geometry(
      `cylinder:${topRadius}:${radius}:${height}`,
      () => new THREE.CylinderGeometry(topRadius, radius, height, 18),
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private road(points: [number, number][], width: number, material: THREE.Material): void {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const vertices: number[] = [];
    const indices: number[] = [];
    const edges: THREE.Vector3[][] = [[], []];
    for (let index = 0; index <= 96; index++) {
      const progress = index / 96;
      const point = curve.getPoint(progress);
      const tangent = curve.getTangent(progress);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      for (let side = 0; side < 2; side++) {
        const edge = point.clone().addScaledVector(normal, side === 0 ? -width : width);
        edge.y = this.groundHeight(edge.x, edge.z) + 0.025;
        vertices.push(edge.x, edge.y, edge.z);
        edges[side].push(edge.clone().add(new THREE.Vector3(0, 0.025, 0)));
      }
      if (index < 96) {
        const offset = index * 2;
        indices.push(offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const road = new THREE.Mesh(geometry, material);
    road.receiveShadow = true;
    this.scene.add(road);
    edges.forEach((points) =>
      this.scene.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.025, 6, false),
          this.roadRim,
        ),
      ),
    );
  }

  setLiquidGlassLighting(enabled: boolean): void {
    if (enabled === this.glassLighting) return;
    this.glassLighting = enabled;
    this.roadRim.emissive.set(enabled ? '#ffd694' : '#ff991d');
    this.roadRim.emissiveIntensity = enabled ? 1.95 : 0.55;
    this.requestRender();
  }

  private groundHeight(x: number, z: number): number {
    return worldHeight(x, z);
  }

  private buildHillside(): void {
    const mountain = new THREE.PlaneGeometry(20, 34, 40, 88);
    mountain.rotateX(-Math.PI / 2);
    mountain.translate(1, 0, -21.7);
    const vertices = mountain.getAttribute('position');
    for (let index = 0; index < vertices.count; index++) {
      const x = vertices.getX(index),
        z = vertices.getZ(index);
      const roughness = worldCanWalk(x, z) ? 0 : Math.sin(x * 1.8 + z) * 0.12;
      vertices.setY(index, worldHeight(x, z) - 0.3 + roughness);
    }
    mountain.computeVertexNormals();
    const rock = this.material('#465465', 0.96);
    rock.map = this.pavingTexture();
    const slope = new THREE.Mesh(mountain, rock);
    slope.receiveShadow = true;
    this.scene.add(slope);
    const platform = this.material('#81796c', 0.92);
    platform.map = this.pavingTexture();
    const retaining = this.material('#424c5c', 0.95);
    for (const [x, top, z, width, depth] of [
      [0.9, 2.96, -10.95, 16.8, 5.2],
      [0.35, 5.76, -20.8, 14.1, 5.8],
      [1.3, 8.56, -33.75, 11.2, 6.5],
    ]) {
      this.box(this.scene, [width, 1.1, depth], [x, top - 0.58, z], retaining, 0.2);
      this.box(this.scene, [width - 0.12, 0.12, depth - 0.1], [x, top - 0.03, z], platform, 0.07);
      const lamp = new THREE.PointLight('#ffc681', top > 8 ? 35 : 70, 11, 2);
      lamp.position.set(x, top + 4.5, z + 1.8);
      this.scene.add(lamp);
    }
    const path = this.material('#a27b3d', 0.85, '#bd741b', 0.3);
    this.road(
      [
        [0, 3.7],
        [1.5, 2.3],
        [3, 0.8],
      ],
      0.58,
      path,
    );
    this.road(
      LOWER_ASCENT.map(([x, , z]) => [x, z]),
      0.65,
      path,
    );
    this.road(
      UPPER_ASCENT.map(([x, , z]) => [x, z]),
      0.65,
      path,
    );
    this.road(
      SUMMIT_ASCENT.map(([x, , z]) => [x, z]),
      0.67,
      path,
    );
    this.road(
      [
        [-5.3, -9.35],
        [-2.9, -9.4],
        [-0.5, -9.7],
        [1.2, -9.3],
        [3, -9.3],
        [5, -9.4],
        [6.8, -9.65],
      ],
      0.55,
      path,
    );
    this.road(
      [
        [-3.5, -19.15],
        [-1, -18.8],
        [1, -18.7],
        [2.8, -18.8],
        [4.3, -19.2],
      ],
      0.55,
      path,
    );
    const light = new THREE.MeshBasicMaterial({ color: '#ffcf7e', toneMapped: false });
    for (const trail of [LOWER_ASCENT, UPPER_ASCENT, SUMMIT_ASCENT]) {
      trail.forEach(([x, y, z], index) => {
        if (index === 0) return;
        this.cylinder(this.scene, 0.055, 0.72, [x + 0.88, y + 0.29, z], this.ink);
        this.box(this.scene, [0.18, 0.15, 0.18], [x + 0.88, y + 0.69, z], light, 0.04);
      });
    }
    // The entrance marker is visible between the archive and the communications tower.
    this.cylinder(this.scene, 0.05, 1.25, [3.7, 0.98, -0.3], this.clay);
    this.box(this.scene, [1.05, 0.42, 0.12], [3.7, 1.5, -0.3], this.paper, 0.05);
    const arrow = this.box(this.scene, [0.36, 0.045, 0.05], [3.7, 1.5, -0.22], light);
    arrow.rotation.z = Math.PI / 4;
    const arrowTip = this.box(this.scene, [0.17, 0.045, 0.05], [3.79, 1.6, -0.22], light);
    arrowTip.rotation.z = -Math.PI / 4;
  }

  private buildUpperStations(): void {
    const frame = this.paintedMetal('#bdc3ba');
    const glass = new THREE.MeshStandardMaterial({
      color: '#789f91',
      transparent: true,
      opacity: 0.46,
      roughness: 0.3,
      metalness: 0.08,
    });
    const green = this.material('#528268', 0.85);
    const dark = this.material('#253246', 0.7);
    const warm = this.material('#e6aa55', 0.35, '#ffc060', 0.55);
    const greenhouse = new THREE.Group();
    greenhouse.position.set(-0.5, 2.62, -11.65);
    this.box(greenhouse, [3.2, 0.25, 2.8], [0, 0.42, 0], this.stone);
    this.box(greenhouse, [3.1, 1.75, 2.65], [0, 1.4, 0], glass);
    for (const x of [-1.52, 0, 1.52]) {
      for (const z of [-1.3, 1.3]) this.box(greenhouse, [0.07, 1.85, 0.07], [x, 1.4, z], frame);
      const beamA = this.box(greenhouse, [0.075, 1.95, 0.075], [x, 2.6, -0.63], frame);
      beamA.rotation.x = -0.64;
      const beamB = this.box(greenhouse, [0.075, 1.95, 0.075], [x, 2.6, 0.63], frame);
      beamB.rotation.x = 0.64;
    }
    for (const z of [-0.64, 0.64]) {
      const roof = this.box(greenhouse, [3.1, 0.045, 1.75], [0, 2.62, z], glass);
      roof.rotation.x = z < 0 ? -0.64 : 0.64;
    }
    for (const z of [-1.3, 1.3]) this.box(greenhouse, [3.12, 0.075, 0.075], [0, 2.32, z], frame);
    for (const x of [-1, 0.8])
      for (const z of [-0.6, 0.3]) {
        this.box(greenhouse, [0.65, 0.28, 0.65], [x, 0.65, z], this.clay);
        this.cylinder(greenhouse, 0.26, 0.55, [x, 1.03, z], green, 0.16);
      }
    this.box(greenhouse, [0.66, 1.2, 0.07], [0, 1.12, 1.38], dark);
    this.box(greenhouse, [0.44, 0.78, 0.04], [0, 1.27, 1.43], glass);
    this.scene.add(greenhouse);

    const market = new THREE.Group();
    market.position.set(6.8, 2.62, -11.6);
    this.box(market, [3.65, 0.2, 2.7], [0, 0.43, 0], this.stone);
    this.box(market, [3.4, 2.0, 2.5], [0, 1.5, -0.05], this.paper, 0.12);
    this.box(market, [3.65, 0.25, 2.9], [0, 2.62, 0], dark);
    for (let index = 0; index < 7; index++) {
      const stripe = this.box(
        market,
        [0.5, 0.08, 1.1],
        [-1.5 + index * 0.5, 2.29, 1.4],
        index % 2 ? this.paper : this.clay,
      );
      stripe.rotation.x = 0.2;
    }
    for (const x of [-1.48, 1.48]) this.cylinder(market, 0.045, 2.05, [x, 1.47, 1.8], frame);
    this.box(market, [2.9, 0.73, 0.65], [0, 0.88, 1.55], this.clay);
    for (const x of [-0.9, 0, 0.9]) {
      this.box(market, [0.7, 0.25, 0.58], [x, 1.35, 1.55], this.paper);
      for (let i = 0; i < 3; i++)
        this.cylinder(market, 0.11, 0.15, [x - 0.2 + i * 0.2, 1.55, 1.55], green, 0.08);
    }
    this.box(market, [1.3, 0.65, 0.06], [0, 1.93, 1.24], warm);
    this.scene.add(market);

    const workshop = new THREE.Group();
    workshop.position.set(-3.5, 5.42, -21.4);
    this.box(workshop, [3.5, 0.2, 2.8], [0, 0.43, 0], this.stone);
    this.box(workshop, [3.2, 2.15, 2.55], [0, 1.55, 0], this.clay, 0.13);
    this.box(workshop, [3.6, 0.22, 3.0], [0, 2.75, 0], dark);
    this.box(workshop, [2.1, 1.28, 0.18], [0, 1.73, 1.34], dark, 0.08);
    const rgb = ['#ec7773', '#8bdb9e', '#80aff5'];
    rgb.forEach((color, index) =>
      this.box(
        workshop,
        [0.55, 0.9, 0.035],
        [-0.62 + index * 0.62, 1.73, 1.45],
        new THREE.MeshBasicMaterial({ color, toneMapped: false }),
      ),
    );
    this.box(workshop, [0.9, 0.65, 0.48], [1.1, 0.72, 1.4], this.paper);
    this.scene.add(workshop);

    const studio = new THREE.Group();
    studio.position.set(4.3, 5.42, -21.65);
    this.box(studio, [3.7, 0.22, 2.9], [0, 0.43, 0], this.stone);
    this.box(studio, [3.4, 2.35, 2.7], [0, 1.65, 0], this.paper, 0.14);
    this.box(studio, [3.8, 0.24, 3.1], [0, 2.94, 0], dark);
    this.box(studio, [2.65, 1.35, 0.1], [0, 1.77, 1.4], dark, 0.07);
    for (let row = 0; row < 4; row++)
      this.box(
        studio,
        [1.1 + (row % 2) * 0.7, 0.045, 0.025],
        [-0.15, 2.15 - row * 0.22, 1.47],
        warm,
      );
    for (const x of [-1.3, 1.3]) this.box(studio, [0.12, 1.5, 0.06], [x, 1.8, 1.48], frame);
    this.scene.add(studio);

    const irrigationHub = new THREE.Group();
    irrigationHub.position.set(-5.3, 2.62, -11.65);
    this.box(irrigationHub, [3.5, 0.24, 2.9], [0, 0.44, 0], this.stone, 0.1);
    this.box(irrigationHub, [3.2, 1.8, 2.5], [0, 1.4, 0], this.paper, 0.12);
    this.box(irrigationHub, [3.6, 0.2, 2.95], [0, 2.42, 0], dark, 0.06);
    const water = this.material('#65b6c6', 0.3, '#398dba', 0.35);
    this.cylinder(irrigationHub, 0.68, 1.15, [-0.78, 2.95, 0], frame);
    this.cylinder(irrigationHub, 0.59, 0.7, [-0.78, 3.05, 0], water);
    this.cylinder(irrigationHub, 0.71, 0.12, [-0.78, 3.57, 0], dark);
    this.box(irrigationHub, [1.28, 0.9, 0.12], [0.62, 1.6, 1.3], dark, 0.07);
    for (let row = 0; row < 3; row++)
      this.box(
        irrigationHub,
        [0.72 - row * 0.13, 0.04, 0.025],
        [0.62, 1.85 - row * 0.2, 1.38],
        water,
      );
    for (const x of [-1.2, 0, 1.2]) {
      this.box(irrigationHub, [0.62, 0.2, 0.52], [x, 0.6, 1.45], this.clay);
      this.cylinder(irrigationHub, 0.13, 0.35, [x, 0.89, 1.45], green, 0.08);
    }
    this.cylinder(irrigationHub, 0.035, 1.45, [1.18, 3.13, -0.45], frame);
    this.box(irrigationHub, [0.24, 0.16, 0.19], [1.18, 3.86, -0.45], water, 0.045);
    this.scene.add(irrigationHub);
  }

  private buildSummit(): void {
    const atelier = new THREE.Group();
    atelier.position.set(1.3, 8.22, -34.2);
    const trim = this.paintedMetal('#b49b71');
    const roof = this.material('#283448', 0.68);
    const gold = this.material('#ca8b20', 0.42, '#db7d10', 0.12);
    gold.metalness = 0.7;
    this.summitStar = gold;
    this.box(atelier, [6.1, 0.28, 4.0], [0, 0.45, 0], this.stone, 0.14);
    this.box(atelier, [5.7, 2.8, 3.5], [0, 1.95, 0], this.paper, 0.15);
    this.box(atelier, [6.1, 0.22, 3.95], [0, 3.45, 0], trim, 0.06);
    for (const x of [-1.85, 0, 1.85]) {
      this.box(atelier, [1.55, 1.7, 0.16], [x, 1.9, 1.84], roof, 0.08);
      this.box(atelier, [1.3, 1.44, 0.045], [x, 1.92, 1.94], this.warmGlass, 0.05);
      this.box(atelier, [1.8, 0.17, 0.48], [x, 0.87, 1.9], trim, 0.04);
    }
    for (const x of [-1.8, 0, 1.8]) {
      const roofPanel = this.box(atelier, [1.95, 0.18, 4], [x, 3.72, 0], roof, 0.06);
      roofPanel.rotation.z = 0.12;
    }
    this.box(atelier, [5.85, 0.42, 0.2], [0, 3.12, 1.96], trim, 0.06);
    // A pair of slippers in the warm central display identifies the factory/atelier.
    for (const side of [-1, 1]) {
      const slipper = this.box(atelier, [0.42, 0.17, 0.79], [side * 0.28, 1.47, 2.06], roof, 0.13);
      slipper.rotation.x = -0.22;
      this.box(atelier, [0.41, 0.23, 0.43], [side * 0.28, 1.65, 1.98], this.clay, 0.12);
    }
    this.cylinder(atelier, 0.67, 0.25, [0, 4.02, 0.2], trim);
    const star = new THREE.Shape();
    for (let point = 0; point < 10; point++) {
      const angle = Math.PI / 2 + (point * Math.PI) / 5;
      const radius = point % 2 ? 0.48 : 1.12;
      const x = Math.cos(angle) * radius,
        y = Math.sin(angle) * radius;
      if (!point) star.moveTo(x, y);
      else star.lineTo(x, y);
    }
    star.closePath();
    const starMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(star, {
        depth: 0.22,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.07,
        bevelSegments: 2,
        steps: 1,
      }),
      gold,
    );
    starMesh.position.set(0, 5.12, 0.45);
    starMesh.castShadow = true;
    atelier.add(starMesh);
    for (let index = 0; index < 3; index++) {
      const indicator = new THREE.MeshBasicMaterial({ color: '#394958' });
      this.summitIndicators.push(indicator);
      this.box(atelier, [0.22, 0.11, 0.04], [-0.38 + index * 0.38, 4.03, 0.93], indicator, 0.035);
    }
    this.scene.add(atelier);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.055, 8, 64), gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(1.3, 8.66, -31.7);
    this.scene.add(ring);
    this.summitLight = new THREE.PointLight('#ffd28c', 25, 13, 2);
    this.summitLight.position.set(1.3, 13.5, -31.8);
    this.scene.add(this.summitLight);
    for (const x of [-2.8, 5.4]) {
      this.cylinder(this.scene, 0.1, 0.15, [x, 8.72, -31.4], roof);
      this.cylinder(this.scene, 0.04, 1.65, [x, 9.55, -31.4], trim);
      this.box(this.scene, [0.25, 0.3, 0.25], [x, 10.35, -31.4], this.warmGlass, 0.04);
      this.box(this.scene, [0.34, 0.08, 0.34], [x, 10.53, -31.4], roof, 0.03);
      this.box(this.scene, [1.05, 0.35, 0.7], [x, 8.82, -33.1], this.clay, 0.08);
      this.cylinder(this.scene, 0.3, 0.8, [x, 9.38, -33.1], this.foliage, 0.18);
    }
  }

  private buildRaisedPlaza(): void {
    const geometry = new THREE.PlaneGeometry(7.8, 7.1, 32, 32);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, -2.75);
    const positions = geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index++)
      positions.setY(index, this.groundHeight(positions.getX(index), positions.getZ(index)) - 0.04);
    geometry.computeVertexNormals();
    const material = this.material('#77777b', 0.98);
    material.map = this.pavingTexture();
    material.bumpMap = material.map;
    material.bumpScale = 0.08;
    const hill = new THREE.Mesh(geometry, material);
    hill.receiveShadow = true;
    this.scene.add(hill);
    this.box(this.scene, [6, 0.7, 4.2], [0, 0.68, -4.1], this.stone, 0.13);
  }

  private buildIsland(): void {
    const outline = new THREE.Shape();
    outline.moveTo(-10, -3.3);
    outline.bezierCurveTo(-10.7, -1, -10.3, 3.3, -8.7, 5.4);
    outline.bezierCurveTo(-6.7, 7.1, -3.3, 6.8, -0.3, 6.9);
    outline.bezierCurveTo(3.7, 7.2, 7.9, 6.3, 9.9, 4.1);
    outline.bezierCurveTo(11.2, 1.5, 10.5, -2.3, 9.5, -4.6);
    outline.bezierCurveTo(6.8, -6.3, 3.1, -5.2, -0.1, -5.6);
    outline.bezierCurveTo(-4.7, -5.5, -8.4, -5.6, -10, -3.3);
    const texture = this.pavingTexture();
    const earth = this.material('#72747a', 0.98);
    earth.map = texture;
    earth.bumpMap = texture;
    earth.bumpScale = 0.12;
    const cliff = this.material('#4a5061', 0.97);
    cliff.map = texture;
    cliff.bumpMap = texture;
    cliff.bumpScale = 0.25;
    const geometry = new THREE.ExtrudeGeometry(outline, {
      depth: 1.3,
      bevelEnabled: true,
      bevelThickness: 0.18,
      bevelSize: 0.35,
      bevelSegments: 3,
      curveSegments: 18,
      steps: 1,
    });
    const positions = geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const z = positions.getZ(index);
      const taper = Math.max(0, (1.3 - z) / 1.3);
      positions.setXYZ(
        index,
        x + Math.sin(y * 1.8 + x * 0.5) * 0.12 * taper,
        y + Math.sin(x * 2.3 - y * 0.7) * 0.13 * taper,
        z + Math.sin(x * 2.7 + y * 2.2) * 0.06 * taper,
      );
    }
    geometry.computeVertexNormals();
    const terrain = new THREE.Mesh(geometry, [earth, cliff]);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -1.14;
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.ShadowMaterial({ color: '#02060f', opacity: 0.35 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.6;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.buildRaisedPlaza();
    const path = this.material('#986f37', 0.9, '#ba6c14', 0.25);
    this.road([[0, 5.3], [0, 4.3], JUNCTION], 0.58, path);
    (Object.keys(BRANCHES) as MainProjectId[]).forEach((id) => this.road(BRANCHES[id], 0.56, path));
    this.cylinder(this.scene, 1.48, 0.06, [0, 0.365, 4.15], this.material('#897b67', 0.92));
    const ringMaterial = this.material('#dba149', 0.35, '#ff9e2b', 0.6);
    for (const destination of Object.values(DESTINATIONS)) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.032, 8, 64), ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(
        destination.x,
        this.groundHeight(destination.x, destination.z) + 0.055,
        destination.z,
      );
      this.scene.add(ring);
    }
    for (const [x, z] of [
      [-8.2, 2.8],
      [-2.3, 0.9],
      [2.3, 0.9],
      [8.2, 2.5],
    ])
      this.streetLamp(x, z);
  }

  private pavingTexture(): THREE.CanvasTexture {
    if (this.pavingMap) return this.pavingMap;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#b4b0a6';
    context.fillRect(0, 0, 512, 512);
    let seed = 1931;
    for (let index = 0; index < 22000; index++) {
      seed = (seed * 16807) % 2147483647;
      context.fillStyle = index % 2 ? '#ffffff12' : '#2e394825';
      context.fillRect(seed % 512, Math.floor(seed / 512) % 512, 1 + (index % 4), 1 + (index % 3));
    }
    context.strokeStyle = '#3d465135';
    context.lineWidth = 1;
    for (let index = 0; index < 45; index++) {
      const x = (index * 83) % 512;
      const y = (index * 137) % 512;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 13, y + 7);
      context.lineTo(x + 23, y + 4);
      context.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.22, 0.22);
    this.pavingMap = texture;
    return texture;
  }

  private streetLamp(x: number, z: number): void {
    const iron = this.material('#26323f', 0.5);
    iron.metalness = 0.65;
    this.cylinder(this.scene, 0.12, 0.14, [x, 0.44, z], iron);
    this.cylinder(this.scene, 0.042, 1.75, [x, 1.3, z], iron);
    this.box(this.scene, [0.3, 0.09, 0.3], [x, 2.16, z], iron, 0.03);
    this.box(this.scene, [0.21, 0.3, 0.21], [x, 2, z], this.warmGlass, 0.025);
    for (const offset of [-0.11, 0.11]) {
      this.box(this.scene, [0.025, 0.35, 0.025], [x + offset, 2, z + 0.11], iron, 0.005);
      this.box(this.scene, [0.025, 0.35, 0.025], [x + offset, 2, z - 0.11], iron, 0.005);
    }
    const light = new THREE.PointLight('#ffb762', 11, 5.5, 2);
    light.position.set(x, 1.95, z);
    this.scene.add(light);
  }

  private buildLookout(): void {
    const group = new THREE.Group();
    group.position.set(-5.8, 0.35, 0.15);
    this.scene.add(group);
    const trim = this.paintedMetal('#8e8f8a');
    const dark = this.material('#25313d', 0.6);
    this.box(group, [4.65, 0.28, 2.95], [0, 0.16, 0], this.stone, 0.15);
    this.box(group, [4.22, 3.15, 2.4], [0, 1.85, -0.12], this.paper, 0.12);
    this.box(group, [4.48, 0.22, 2.64], [0, 3.46, -0.12], trim, 0.08);
    this.box(group, [4.15, 0.18, 2.33], [0, 3.68, -0.12], dark, 0.07);
    this.box(group, [3.67, 0.23, 2.04], [0, 3.88, -0.12], trim, 0.06);
    for (const x of [-1.95, 1.95]) {
      this.box(group, [0.23, 3.05, 0.23], [x, 1.86, 1.16], trim, 0.04);
      this.box(group, [0.36, 0.2, 0.38], [x, 0.47, 1.16], this.stone, 0.04);
      this.box(group, [0.36, 0.18, 0.38], [x, 3.28, 1.16], this.stone, 0.04);
    }
    this.box(group, [2.38, 1.8, 0.15], [-0.5, 2.04, 1.18], dark, 0.1);
    this.box(group, [2.12, 1.56, 0.07], [-0.5, 2.04, 1.28], this.material('#1d2a2c', 0.25), 0.06);
    const graph = this.material('#dfa858', 0.35, '#ffae42', 0.75);
    for (let index = 0; index < 4; index++) {
      const height = 0.32 + index * 0.25;
      this.box(
        group,
        [0.26, height, 0.045],
        [-1.22 + index * 0.44, 1.47 + height / 2, 1.34],
        graph,
        0.02,
      );
    }
    this.box(group, [1.97, 0.035, 0.045], [-0.5, 1.46, 1.34], graph, 0.01);
    this.box(group, [4.3, 0.13, 0.2], [0, 2.99, 1.27], trim, 0.025);
    for (const x of [-1.3, -0.3, 0.7]) {
      this.box(group, [0.68, 0.35, 0.085], [x, 3.23, 1.25], dark, 0.025);
      this.box(group, [0.51, 0.21, 0.025], [x, 3.23, 1.31], this.warmGlass, 0.015);
    }
    this.box(group, [0.75, 2.05, 0.12], [1.15, 1.43, 1.23], dark, 0.04);
    this.box(group, [0.59, 1.86, 0.04], [1.15, 1.43, 1.31], this.warmGlass, 0.03);
    this.box(group, [0.03, 1.85, 0.04], [1.15, 1.43, 1.34], trim, 0.008);
    for (const z of [-0.7, 0.45]) {
      this.box(group, [0.07, 1.52, 0.66], [2.14, 1.95, z], dark, 0.025);
      this.box(group, [0.03, 1.33, 0.5], [2.19, 1.95, z], this.warmGlass, 0.02);
    }
    for (let index = 0; index < 3; index++)
      this.box(
        group,
        [4.0 - index * 0.18, 0.1, 0.44],
        [0, 0.06 + index * 0.08, 1.8 - index * 0.17],
        this.stone,
        0.025,
      );
    const light = new THREE.PointLight('#ffbf75', 18, 7, 2);
    light.position.set(-6.1, 2.1, 2.25);
    this.scene.add(light);
  }

  private buildArchive(): void {
    const group = new THREE.Group();
    group.position.set(0, 1.05, -4.4);
    this.scene.add(group);
    const trim = this.paintedMetal('#b0aaa0');
    const roof = this.material('#414c60', 0.6);
    this.box(group, [4.9, 0.24, 3.2], [0, 0.13, 0], this.stone, 0.1);
    this.box(group, [4.25, 3.3, 2.55], [0, 1.92, -0.08], this.paper, 0.08);
    this.box(group, [4.7, 0.24, 2.96], [0, 3.65, 0], trim, 0.06);
    this.box(group, [4.43, 0.17, 2.72], [0, 3.89, 0], roof, 0.05);
    const pediment = new THREE.Shape();
    pediment.moveTo(-2.38, 0);
    pediment.lineTo(0, 0.95);
    pediment.lineTo(2.38, 0);
    pediment.closePath();
    const facade = new THREE.Mesh(
      new THREE.ExtrudeGeometry(pediment, {
        depth: 0.22,
        bevelEnabled: true,
        bevelSize: 0.06,
        bevelThickness: 0.04,
        bevelSegments: 2,
      }),
      trim,
    );
    facade.position.set(0, 3.78, 1.27);
    facade.castShadow = true;
    group.add(facade);
    this.box(group, [4.85, 0.17, 0.4], [0, 3.76, 1.35], trim, 0.04);
    this.box(group, [2.05, 0.3, 0.12], [0, 3.57, 1.54], roof, 0.045);
    this.policyIndicators.push(...this.indicatorRow(group, 4, [0, 3.57, 1.63], 0.42));
    for (const x of [-1.86, -0.98, 0.98, 1.86]) {
      this.cylinder(group, 0.21, 0.2, [x, 0.45, 1.42], trim);
      this.cylinder(group, 0.14, 2.9, [x, 1.98, 1.42], this.paper, 0.17);
      this.cylinder(group, 0.23, 0.18, [x, 3.46, 1.42], trim);
    }
    this.archedPanel(group, 1.66, 2.66, 0.16, [0, 0.37, 1.23], roof);
    this.archedPanel(group, 1.39, 2.48, 0.04, [0, 0.4, 1.42], this.warmGlass);
    this.box(group, [0.04, 1.9, 0.04], [0, 1.36, 1.49], trim, 0.008);
    this.box(group, [1.29, 0.04, 0.04], [0, 2.2, 1.49], trim, 0.008);
    for (const x of [-1.47, 1.47]) {
      this.archedPanel(group, 0.55, 1.52, 0.07, [x, 1.26, 1.25], roof);
      this.archedPanel(group, 0.41, 1.38, 0.035, [x, 1.29, 1.34], this.warmGlass);
    }
    for (let index = 0; index < 4; index++)
      this.box(
        group,
        [3.1 - index * 0.22, 0.1, 0.5],
        [0, 0.04 + index * 0.075, 2.0 - index * 0.17],
        this.stone,
        0.025,
      );
    const folder = new THREE.Group();
    folder.position.set(1.1, 0.46, 1.95);
    folder.rotation.y = -0.15;
    this.box(folder, [0.74, 0.11, 0.52], [0, 0, 0], this.clay, 0.025);
    this.box(folder, [0.62, 0.04, 0.44], [0, 0.075, 0], this.paper, 0.01);
    this.box(folder, [0.27, 0.04, 0.14], [-0.18, 0.08, -0.25], this.clay, 0.012);
    group.add(folder);
    const light = new THREE.PointLight('#ffcd87', 21, 7, 2);
    light.position.set(0, 3.4, -2.2);
    this.scene.add(light);
  }

  private archedPanel(
    parent: THREE.Object3D,
    width: number,
    height: number,
    depth: number,
    position: [number, number, number],
    material: THREE.Material,
  ): void {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(width / 2, height - width / 2);
    shape.absarc(0, height - width / 2, width / 2, 0, Math.PI, false);
    shape.lineTo(-width / 2, 0);
    const panel = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSize: 0.02,
        bevelThickness: 0.015,
        bevelSegments: 2,
        curveSegments: 20,
      }),
      material,
    );
    panel.position.set(...position);
    panel.castShadow = true;
    parent.add(panel);
  }

  private buildTower(): void {
    const group = new THREE.Group();
    group.position.set(5.8, 0.35, -0.4);
    this.scene.add(group);
    const trim = this.paintedMetal('#929a9f');
    const dark = this.material('#202e3d', 0.5);
    const green = this.material('#85d9ad', 0.3, '#48c78c', 0.65);
    this.box(group, [4.36, 0.25, 2.91], [0, 0.14, 0], this.stone, 0.1);
    this.box(group, [3.92, 2.98, 2.42], [0, 1.74, -0.1], this.paper, 0.13);
    this.box(group, [4.2, 0.25, 2.7], [0, 3.28, -0.1], trim, 0.06);
    this.box(group, [3.91, 0.15, 2.42], [0, 3.48, -0.1], dark, 0.05);
    for (const x of [-1.77, 1.77]) this.box(group, [0.2, 2.82, 0.22], [x, 1.8, 1.17], trim, 0.04);
    this.box(group, [2.42, 1.65, 0.14], [0.35, 1.97, 1.16], dark, 0.11);
    this.box(group, [2.15, 1.39, 0.045], [0.35, 1.97, 1.25], this.material('#14292b', 0.25), 0.08);
    this.box(group, [0.64, 0.48, 0.035], [-0.24, 2.23, 1.29], green, 0.07);
    this.box(group, [0.54, 0.045, 0.035], [0.65, 2.36, 1.29], green, 0.015);
    this.box(group, [0.81, 0.04, 0.035], [0.78, 2.15, 1.29], green, 0.015);
    for (let index = 0; index < 3; index++)
      this.box(
        group,
        [1.65 - index * 0.2, 0.045, 0.035],
        [0.31, 1.82 - index * 0.2, 1.29],
        green,
        0.015,
      );

    this.box(group, [4.03, 0.1, 0.21], [0, 2.86, 1.23], trim, 0.025);
    this.box(group, [2.42, 0.29, 0.1], [0.15, 2.87, 1.4], dark, 0.04);
    this.transmissionIndicators.push(...this.indicatorRow(group, 6, [0.15, 2.87, 1.47], 0.34));
    for (const x of [-1.24, 0, 1.24]) {
      this.box(group, [0.68, 0.27, 0.075], [x, 3.05, 1.23], dark, 0.02);
      this.box(group, [0.49, 0.14, 0.025], [x, 3.05, 1.28], this.warmGlass, 0.012);
    }
    this.box(group, [0.68, 2.02, 0.12], [-1.16, 1.45, 1.21], dark, 0.04);
    this.box(group, [0.52, 1.85, 0.04], [-1.16, 1.45, 1.3], this.warmGlass, 0.025);
    this.cylinder(group, 0.2, 1.95, [1.25, 4.415, -0.32], trim, 0.11);
    for (const y of [3.56, 4.19, 4.9]) this.cylinder(group, 0.42, 0.1, [1.25, y, -0.32], dark);
    this.cylinder(group, 0.04, 0.62, [1.25, 5.62, -0.32], trim);
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.66, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      this.paper,
    );
    dish.position.set(0.9, 4.74, -0.1);
    dish.rotation.x = Math.PI / 2.8;
    dish.rotation.z = -0.28;
    dish.castShadow = true;
    group.add(dish);
    this.cylinder(group, 0.04, 0.6, [0.9, 4.78, 0.37], trim).rotation.x = Math.PI / 2;
    for (const radius of [0.42, 0.73]) {
      const signal = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.025, 8, 40, Math.PI * 0.72),
        green,
      );
      signal.position.set(1.45, 5.68, -0.35);
      signal.rotation.z = -0.35;
      group.add(signal);
    }
    for (let index = 0; index < 3; index++)
      this.box(
        group,
        [3.55 - index * 0.2, 0.1, 0.44],
        [0, 0.06 + index * 0.08, 1.81 - index * 0.17],
        this.stone,
        0.025,
      );
    const light = new THREE.PointLight('#ffc079', 18, 7, 2);
    light.position.set(5.9, 2.2, 1.6);
    this.scene.add(light);
  }

  private signpost(x: number, z: number, height: number): void {
    this.cylinder(this.scene, 0.04, height, [x, 0.38 + height / 2, z], this.ink);
    this.box(this.scene, [0.66, 0.26, 0.08], [x, 0.38 + height, z], this.clay, 0.03);
  }

  private indicatorRow(
    parent: THREE.Object3D,
    count: number,
    position: [number, number, number],
    spacing: number,
  ): THREE.MeshBasicMaterial[] {
    const socket = this.material('#101c2b', 0.5);
    return Array.from({ length: count }, (_, index) => {
      const x = position[0] + (index - (count - 1) / 2) * spacing;
      this.cylinder(parent, 0.115, 0.045, [x, position[1], position[2]], socket).rotation.x =
        Math.PI / 2;
      const material = new THREE.MeshBasicMaterial({ color: '#26394a', toneMapped: false });
      this.cylinder(
        parent,
        0.078,
        0.03,
        [x, position[1], position[2] + 0.03],
        material,
      ).rotation.x = Math.PI / 2;
      return material;
    });
  }

  private buildLandscape(): void {
    const rockMaterial = this.material('#4e596a', 0.98);
    rockMaterial.bumpMap = this.pavingTexture();
    rockMaterial.bumpScale = 0.15;
    const rocks = [
      [-9.5, 3.3, 0.8],
      [-8.6, 4.8, 0.8],
      [-6.4, 5.1, 0.7],
      [-3.8, 5.3, 0.8],
      [-1.6, 5.1, 0.65],
      [1.5, 5.2, 0.75],
      [3.7, 5.1, 0.85],
      [6.3, 4.7, 0.8],
      [8.5, 3.9, 0.9],
      [9.5, 1.2, 0.9],
      [-9.2, -3, 0.9],
      [9.1, -2.8, 1.1],
    ];
    rocks.forEach(([x, z, size], index) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size * 0.78, 0), rockMaterial);
      rock.position.set(x, -0.31, z);
      rock.rotation.set(index * 0.34, index * 0.7, index * 0.19);
      rock.scale.set(1.3, 0.5 + (index % 3) * 0.1, 0.85);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    });
    for (const [x, z, size] of [
      [-8.8, -2.1, 1.25],
      [-8.9, 0.2, 0.82],
      [8.8, -1.7, 1.2],
      [9.3, 1.1, 0.8],
      [-3.1, -3.5, 0.9],
      [3.1, -4.1, 0.85],
    ])
      this.tree(x, z, size);
    this.signpost(-3.1, 2.3, 0.65);
    this.signpost(3.1, 2.3, 0.65);
  }

  private tree(x: number, z: number, size: number): void {
    const trunk = this.paintedMetal('#655844');
    this.cylinder(
      this.scene,
      0.09 * size,
      1.25 * size,
      [x, 0.35 + 0.625 * size, z],
      trunk,
      0.055 * size,
    );
    for (const side of [-1, 1]) {
      const branch = this.cylinder(
        this.scene,
        0.045 * size,
        0.75 * size,
        [x + side * 0.2 * size, 1.32 * size, z],
        trunk,
        0.025 * size,
      );
      branch.rotation.z = -side * 0.65;
    }
    for (let index = 0; index < 4; index++) {
      const geometry = this.geometry(
        `crown:${size}`,
        () => new THREE.IcosahedronGeometry(0.55 * size, 1),
      );
      const crown = new THREE.Mesh(geometry, this.foliage);
      crown.position.set(
        x + Math.sin(index * 2.4) * 0.34 * size,
        0.35 + (1.35 + index * 0.16) * size,
        z + Math.cos(index * 2.4) * 0.24 * size,
      );
      crown.scale.set(1, 1.25, 0.88);
      crown.castShadow = true;
      this.scene.add(crown);
    }
  }

  private buildRobot(): void {
    const cream = this.paintedMetal('#dac8a7');
    const edge = this.paintedMetal('#e4d2af');
    const joint = this.material('#202831', 0.48);
    joint.metalness = 0.7;
    const visor = this.material('#191c1d', 0.24);
    const amber = this.material('#ffc257', 0.25, '#ff9b21', 1.2);
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

  private resize(): void {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan((Math.tan(THREE.MathUtils.degToRad(44) / 2) * 1.4) / this.camera.aspect),
    );
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    const base = this.camera.clone();
    base.position.set(0, 11.3, 22);
    base.lookAt(0, 1.4, -0.8);
    base.updateMatrixWorld();
    const entry = new THREE.Vector3(0, 0.39, 5.3).project(base);
    this.routeEntry = { x: (entry.x + 1) * 50, y: (1 - entry.y) * 50 };
    this.publishLabels(true);
    this.renderer.shadowMap.needsUpdate = true;
    this.requestRender();
  }

  private publishLabels(force = false): void {
    const height = this.host.clientHeight || 1;
    const level = mapLevelAt(this.robot.position.z);
    const labels = (Object.keys(this.labelAnchors) as ProjectId[]).map((id) => {
      const point = this.projectedLabel.copy(this.labelAnchors[id]).project(this.camera);
      return {
        id,
        x: THREE.MathUtils.clamp((point.x + 1) * 50, 13, 87),
        y: THREE.MathUtils.clamp((1 - point.y) * 50, Math.max(28, (180 / height) * 100), 82),
        level: STATION_LEVELS[id],
      };
    });
    const signature =
      level + ':' + labels.map((label) => label.x.toFixed(1) + ',' + label.y.toFixed(1)).join(';');
    if (force || signature !== this.lastLabelSignature) {
      this.lastLabelSignature = signature;
      this.onLabels(labels, this.routeEntry, level);
    }
  }

  private updateCamera(delta: number, snap = false): boolean {
    const ascent = THREE.MathUtils.smoothstep(-this.robot.position.z, 2.7, 7.8);
    this.desiredCameraTarget.set(
      this.robot.position.x * 0.28 * ascent,
      1.4 + (this.robot.position.y - 0.38) * ascent,
      -0.8 + (this.robot.position.z - 4.35) * ascent,
    );
    this.desiredCameraPosition.copy(this.desiredCameraTarget).add(this.cameraOffset);
    const error =
      this.cameraTarget.distanceToSquared(this.desiredCameraTarget) +
      this.camera.position.distanceToSquared(this.desiredCameraPosition);
    if (error < 0.00008 && !snap) return false;
    const alpha = snap ? 1 : 1 - Math.exp(-delta * 5);
    this.cameraTarget.lerp(this.desiredCameraTarget, alpha);
    this.camera.position.lerp(this.desiredCameraPosition, alpha);
    if (error < 0.0004) {
      this.cameraTarget.copy(this.desiredCameraTarget);
      this.camera.position.copy(this.desiredCameraPosition);
    }
    this.camera.lookAt(this.cameraTarget);
    this.camera.updateMatrixWorld();
    this.cameraRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.cameraForward.set(-this.cameraRight.z, 0, this.cameraRight.x);
    this.publishLabels();
    return error >= 0.0004;
  }

  private updateNearest(): void {
    const nearby =
      (Object.keys(DESTINATIONS) as ProjectId[]).find(
        (id) => this.robot.position.distanceTo(DESTINATIONS[id]) < 1.3,
      ) ?? null;
    if (nearby !== this.nearest) {
      this.nearest = nearby;
      this.onNear(nearby);
    }
  }

  private requestRender(): void {
    this.dirty = true;
    if (this.disposed || !this.active || !this.prepared || this.frame) return;
    this.frame = requestAnimationFrame(this.animate);
  }

  private updateMetrics(state: 'preparing' | 'paused' | 'moving' | 'settling' | 'idle'): void {
    this.host.dataset['sceneState'] = state;
    this.host.dataset['renderFrames'] = String(this.renderCount);
    this.host.dataset['renderPixelRatio'] = this.renderer.getPixelRatio().toFixed(2);
    this.host.dataset['sceneGeometries'] = String(this.renderer.info.memory.geometries);
    this.host.dataset['sceneTriangles'] = String(this.renderer.info.render.triangles);
    this.host.dataset['robotX'] = this.robot.position.x.toFixed(3);
    this.host.dataset['robotY'] = this.robot.position.y.toFixed(3);
    this.host.dataset['robotZ'] = this.robot.position.z.toFixed(3);
    this.host.dataset['cameraTargetZ'] = this.cameraTarget.z.toFixed(3);
    this.host.dataset['summitAwarded'] = String(this.journeyAwarded);
  }

  private animate = (now: number): void => {
    this.frame = 0;
    if (this.disposed || !this.active || !this.prepared) return;
    const frameInterval = now - this.lastFrameTime;
    const delta = Math.min(frameInterval / 1000, 0.1);
    this.lastFrameTime = now;
    this.elapsed += delta;
    const movement = this.movement.set(0, 0, 0);
    {
      const horizontal =
        Number(this.keys.has('d') || this.keys.has('arrowright')) -
        Number(this.keys.has('a') || this.keys.has('arrowleft'));
      const vertical =
        Number(this.keys.has('w') || this.keys.has('arrowup')) -
        Number(this.keys.has('s') || this.keys.has('arrowdown'));
      movement
        .copy(this.cameraRight)
        .multiplyScalar(horizontal)
        .addScaledVector(this.cameraForward, -vertical);
      movement.y = 0;
      if (movement.lengthSq()) movement.normalize().multiplyScalar(delta * 3.2);
      if (this.travel) {
        this.travel.time += delta;
        const amount = Math.min(this.travel.time / this.travel.duration, 1);
        const destination = this.travel.destination;
        const distance = amount * this.travel.length;
        const segment = Math.max(
          1,
          this.travel.cumulative.findIndex((length) => length >= distance),
        );
        const start = this.travel.cumulative[segment - 1];
        const span = this.travel.cumulative[segment] - start;
        this.nextPosition
          .copy(this.travel.points[segment - 1])
          .lerp(this.travel.points[segment], span ? (distance - start) / span : 1);
        movement.copy(this.nextPosition).sub(this.robot.position);
        if (amount === 1) {
          const arrive = this.travel.onArrival;
          this.travel = undefined;
          this.robot.position.copy(destination);
          movement.set(0, 0, 0);
          this.updateNearest();
          arrive();
        }
      }
    }
    if (movement.lengthSq() > 0.000001) {
      const nextX = this.robot.position.x + movement.x;
      const nextZ = this.robot.position.z + movement.z;
      if (worldCanWalk(nextX, this.robot.position.z)) this.robot.position.x = nextX;
      if (worldCanWalk(this.robot.position.x, nextZ)) this.robot.position.z = nextZ;
      this.robot.position.y = this.groundHeight(this.robot.position.x, this.robot.position.z);
      const angle = Math.atan2(movement.x, movement.z);
      this.robot.rotation.y +=
        Math.atan2(
          Math.sin(angle - this.robot.rotation.y),
          Math.cos(angle - this.robot.rotation.y),
        ) * Math.min(delta * 14, 1);
      this.limbs.forEach(
        (limb, index) =>
          (limb.rotation.x =
            Math.sin(this.elapsed * 11 + (index === 0 || index === 3 ? 0 : Math.PI)) * 0.35),
      );
    } else
      this.limbs.forEach((limb) => {
        limb.rotation.x *= Math.max(0, 1 - delta * 12);
        if (Math.abs(limb.rotation.x) < 0.001) limb.rotation.x = 0;
      });
    this.updateNearest();
    const cameraMoving = this.updateCamera(delta);
    this.publishLabels();
    const moving = this.keys.size > 0 || Boolean(this.travel);
    const settling = this.limbs.some((limb) => Math.abs(limb.rotation.x) >= 0.001);
    if (!this.dirty && !moving && !settling && !cameraMoving) return;
    if (movement.lengthSq() > 0.000001 && now - this.lastShadowTime >= 100) {
      this.renderer.shadowMap.needsUpdate = true;
    }
    if (this.renderer.shadowMap.needsUpdate) this.lastShadowTime = now;
    const renderStarted = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.renderCount++;
    this.dirty = false;
    if (!this.host.dataset['sceneReadyMs']) {
      this.host.dataset['sceneReadyMs'] = (performance.now() - this.startedAt).toFixed(0);
    }
    this.firstRender?.();
    this.firstRender = undefined;
    this.updateMetrics(moving ? 'moving' : settling || cameraMoving ? 'settling' : 'idle');
    if (moving && this.renderCount > 1) {
      this.movingRenderTime += Math.max(performance.now() - renderStarted, frameInterval);
      this.movingSamples++;
      if (this.movingSamples === 24) {
        if (
          this.movingRenderTime / this.movingSamples > 28 &&
          this.renderer.getPixelRatio() > 0.8
        ) {
          this.renderer.setPixelRatio(Math.max(0.8, this.renderer.getPixelRatio() - 0.15));
          this.renderer.shadowMap.needsUpdate = true;
        }
        this.movingRenderTime = this.movingSamples = 0;
      }
    }
    if (moving || settling || cameraMoving) this.requestRender();
  };
}
