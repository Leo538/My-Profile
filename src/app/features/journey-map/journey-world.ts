import type { ProjectId } from '../../core/data/projects.data';

export type MapLevel = 0 | 1 | 2 | 3;
export type WorldPoint = readonly [x: number, y: number, z: number];

export const ENTRANCE: WorldPoint = [0, 0.38, 4.35];
export const LEVEL_CENTRES: Record<MapLevel, WorldPoint> = {
  0: ENTRANCE,
  1: [3, 3, -9.3],
  2: [1, 5.8, -18.7],
  3: [1.3, 8.6, -31.7],
};
export const STATION_POSITIONS: Record<ProjectId, WorldPoint> = {
  finansmart: [-5.8, 0.38, 2.25],
  sicop: [0, 1.08, -2],
  chatquality: [5.8, 0.38, 1.8],
  riego: [-0.5, 3, -9.7],
  agropay: [6.8, 3, -9.65],
  vinculacion: [-5.3, 3, -9.35],
  rgb: [-3.5, 5.8, -19.15],
  novacore: [4.3, 5.8, -19.2],
  pantufladas: [1.3, 8.6, -31.7],
};
export const STATION_LEVELS: Record<ProjectId, MapLevel> = {
  finansmart: 0,
  sicop: 0,
  chatquality: 0,
  riego: 1,
  agropay: 1,
  vinculacion: 1,
  rgb: 2,
  novacore: 2,
  pantufladas: 3,
};

/** The same 3D centreline is used for the road, collision corridor and robot elevation. */
export const LOWER_ASCENT: readonly WorldPoint[] = [
  [3, 0.38, 0.8],
  [3, 1.08, -2.5],
  [3.15, 1.2, -4],
  [4.5, 1.6, -6],
  [6, 2.2, -7.3],
  [6, 3, -8.4],
  [3, 3, -9.3],
];
export const UPPER_ASCENT: readonly WorldPoint[] = [
  [3, 3, -9.3],
  [3, 3, -12.6],
  [0, 3.6, -14.2],
  [-1.5, 4.6, -16.5],
  [0.8, 5.8, -18.1],
  [1, 5.8, -18.7],
];

export const SUMMIT_ASCENT: readonly WorldPoint[] = [
  [1, 5.8, -18.7],
  [1, 5.8, -23.7],
  [0.6, 6.4, -25.2],
  [-1.2, 7.2, -27.1],
  [0.1, 8, -29.1],
  [1.3, 8.6, -30.6],
  [1.3, 8.6, -31.7],
];

const BUILDINGS = [
  [-8.25, -3.35, -1.5, 1.85],
  [-2.45, 2.45, -6.05, -2.85],
  [3.55, 8.05, -2.05, 1.15],
  [-2.1, 1.1, -13.1, -10.25],
  [4.95, 8.65, -12.9, -10.3],
  [-7, -3.6, -13.1, -10.25],
  [-5.25, -1.75, -22.8, -20.2],
  [2.45, 6.15, -23.1, -20.25],
  [-1.6, 4.2, -36.3, -32.3],
] as const;

function smoothstep(value: number, low: number, high: number): number {
  const amount = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return amount * amount * (3 - 2 * amount);
}

export function projectOnPath(x: number, z: number, path: readonly WorldPoint[]) {
  let distance = Infinity;
  let height = path[0][1];
  for (let index = 1; index < path.length; index++) {
    const a = path[index - 1],
      b = path[index];
    const dx = b[0] - a[0],
      dz = b[2] - a[2];
    const fraction = Math.max(
      0,
      Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz)),
    );
    const nextDistance = Math.hypot(x - a[0] - dx * fraction, z - a[2] - dz * fraction);
    if (nextDistance < distance) {
      distance = nextDistance;
      height = a[1] + (b[1] - a[1]) * fraction;
    }
  }
  return { distance, height };
}

/** All ascents progress monotonically towards the back of the map.
 * Interpolating elevation along Z keeps the whole road width continuous,
 * including the inside of bends where nearest-segment projection switches. */
function elevationAtZ(z: number, path: readonly WorldPoint[]): number {
  if (z >= path[0][2]) return path[0][1];
  for (let index = 1; index < path.length; index++) {
    const a = path[index - 1],
      b = path[index];
    if (z >= b[2]) return a[1] + ((z - a[2]) / (b[2] - a[2])) * (b[1] - a[1]);
  }
  return path.at(-1)![1];
}

export function worldHeight(x: number, z: number): number {
  if (z <= -30.6) return 8.6;
  if (z < -23.7) return elevationAtZ(z, SUMMIT_ASCENT);
  if (z <= -18.1) return 5.8;
  if (z < -12.6) return elevationAtZ(z, UPPER_ASCENT);
  if (z <= -8.4) return 3;
  const lowerHeight = elevationAtZ(z, LOWER_ASCENT);
  if (z < -6.25) return lowerHeight;
  const approach = smoothstep(0.8 - z, 0, 2.8);
  const sides = 1 - smoothstep(Math.abs(x), 3, 3.9);
  const plazaHeight = 0.38 + 0.7 * approach * sides;
  const rampBlend = 1 - smoothstep(projectOnPath(x, z, LOWER_ASCENT).distance, 0.94, 1.55);
  return plazaHeight + (lowerHeight - plazaHeight) * rampBlend;
}

export function mapLevelAt(z: number): MapLevel {
  return z < -29.8 ? 3 : z < -17.3 ? 2 : z < -7.6 ? 1 : 0;
}

export function worldCanWalk(x: number, z: number): boolean {
  if (
    BUILDINGS.some(
      ([left, right, back, front]) =>
        x > left - 0.12 && x < right + 0.12 && z > back - 0.12 && z < front + 0.12,
    )
  )
    return false;
  const plaza =
    z >= -6.25 &&
    z <= 5.4 &&
    ((x / 9.4) ** 2 + ((z + 0.2) / 6) ** 2 < 0.96 || (Math.abs(x) < 3.7 && z < 0.8));
  const firstTerrace = x >= -7.3 && x <= 9.1 && z >= -13.45 && z <= -8.5;
  const secondTerrace = x >= -6.45 && x <= 7.15 && z >= -23.5 && z <= -18.05;
  const summit = x >= -4.2 && x <= 6.75 && z >= -36.9 && z <= -30.6;
  return (
    plaza ||
    firstTerrace ||
    secondTerrace ||
    summit ||
    projectOnPath(x, z, LOWER_ASCENT).distance < 0.94 ||
    projectOnPath(x, z, UPPER_ASCENT).distance < 0.94 ||
    projectOnPath(x, z, SUMMIT_ASCENT).distance < 0.94
  );
}

/** Small navigation grid follows the actual walkable terrain; it never bypasses building collisions. */
export function findWalkingPath(origin: WorldPoint, destination: WorldPoint): WorldPoint[] {
  const step = 0.4;
  const key = (x: number, z: number) => `${x},${z}`;
  const snap = (point: WorldPoint): [number, number] => {
    const x = Math.round(point[0] / step),
      z = Math.round(point[2] / step);
    if (worldCanWalk(x * step, z * step)) return [x, z];
    for (const radius of [1, 2, 3])
      for (let dx = -radius; dx <= radius; dx++)
        for (let dz = -radius; dz <= radius; dz++)
          if (worldCanWalk((x + dx) * step, (z + dz) * step)) return [x + dx, z + dz];
    return [x, z];
  };
  const start = snap(origin),
    goal = snap(destination);
  const queue: [number, number][] = [start];
  const previous = new Map<string, [number, number] | null>([[key(...start), null]]);
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  for (let index = 0; index < queue.length; index++) {
    const [x, z] = queue[index];
    if (x === goal[0] && z === goal[1]) break;
    for (const [dx, dz] of directions) {
      const next: [number, number] = [x + dx, z + dz];
      const id = key(...next);
      if (previous.has(id) || next[0] < -24 || next[0] > 24 || next[1] < -96 || next[1] > 14)
        continue;
      if (
        !worldCanWalk(next[0] * step, next[1] * step) ||
        !worldCanWalk(next[0] * step, z * step) ||
        !worldCanWalk(x * step, next[1] * step)
      )
        continue;
      previous.set(id, [x, z]);
      queue.push(next);
    }
  }
  if (!previous.has(key(...goal))) return [];
  const path: WorldPoint[] = [destination];
  let point: [number, number] | null = goal;
  while (point) {
    const x = point[0] * step,
      z = point[1] * step;
    path.push([x, worldHeight(x, z), z]);
    point = previous.get(key(...point)) ?? null;
  }
  path.push(origin);
  return path
    .reverse()
    .filter(
      (point, index, points) =>
        !index ||
        Math.hypot(point[0] - points[index - 1][0], point[2] - points[index - 1][2]) > 0.01,
    );
}
