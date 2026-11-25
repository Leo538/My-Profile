import { describe, expect, it } from 'vitest';
import {
  ENTRANCE,
  LOWER_ASCENT,
  UPPER_ASCENT,
  SUMMIT_ASCENT,
  STATION_POSITIONS,
  STATION_LEVELS,
  findWalkingPath,
  worldCanWalk,
  worldHeight,
} from './journey-world';

describe('Connected hillside route', () => {
  it('distributes the nine projects across three, three, two and one stations', () => {
    expect(
      [0, 1, 2, 3].map(
        (level) => Object.values(STATION_LEVELS).filter((item) => item === level).length,
      ),
    ).toEqual([3, 3, 2, 1]);
  });
  it('connects the plaza to all nine stations and returns without crossing buildings', () => {
    for (const destination of Object.values(STATION_POSITIONS))
      for (const [a, b] of [
        [ENTRANCE, destination],
        [destination, ENTRANCE],
      ]) {
        const path = findWalkingPath(a, b);
        expect(path.length).toBeGreaterThan(1);
        expect(path.at(0)).toEqual(a);
        expect(path.at(-1)).toEqual(b);
        expect(path.every(([x, , z]) => worldCanWalk(x, z))).toBe(true);
      }
  });
  it('has continuous traversable ramps rising to real terrace heights', () => {
    for (const path of [LOWER_ASCENT, UPPER_ASCENT, SUMMIT_ASCENT])
      for (let index = 1; index < path.length; index++) {
        const a = path[index - 1],
          b = path[index];
        let previousHeight = worldHeight(a[0], a[2]);
        for (let sample = 1; sample <= 40; sample++) {
          const x = a[0] + ((b[0] - a[0]) * sample) / 40;
          const z = a[2] + ((b[2] - a[2]) * sample) / 40;
          const height = worldHeight(x, z);
          expect(worldCanWalk(x, z)).toBe(true);
          expect(Math.abs(height - previousHeight)).toBeLessThan(0.12);
          previousHeight = height;
        }
      }
    expect(worldHeight(-0.5, -9.7)).toBe(3);
    expect(worldHeight(4.3, -19.2)).toBe(5.8);
    expect(worldHeight(1.3, -31.7)).toBe(8.6);
  });
  it('does not permit walking off the terraces or through the greenhouse', () => {
    expect(worldCanWalk(-0.5, -11.4)).toBe(false);
    expect(worldCanWalk(11, -12)).toBe(false);
    expect(worldCanWalk(-8, -20)).toBe(false);
    expect(worldCanWalk(1.3, -34.2)).toBe(false);
    expect(worldCanWalk(8, -34)).toBe(false);
  });
  it('keeps elevation continuous across automatic routes, including inside bends', () => {
    for (const destination of Object.values(STATION_POSITIONS)) {
      const path = findWalkingPath(ENTRANCE, destination);
      for (let index = 1; index < path.length; index++) {
        const a = path[index - 1],
          b = path[index];
        let previous = worldHeight(a[0], a[2]);
        for (let sample = 1; sample <= 8; sample++) {
          const x = a[0] + ((b[0] - a[0]) * sample) / 8;
          const z = a[2] + ((b[2] - a[2]) * sample) / 8;
          const height = worldHeight(x, z);
          expect(Math.abs(height - previous)).toBeLessThan(0.12);
          previous = height;
        }
      }
    }
  });
});
