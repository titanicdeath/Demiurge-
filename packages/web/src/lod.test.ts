import { describe, expect, it } from 'vitest';
import { cubeToSphere, magnitude, selectLodLevel } from './lod';

describe('cube-sphere mapping', () => {
  it('maps cube points to unit vectors', () => {
    const p = cubeToSphere(1, 0.3, -0.7);
    expect(Math.abs(magnitude(p) - 1)).toBeLessThan(1e-10);
  });
});

describe('LOD determinism', () => {
  it('selects deterministic level for fixed camera state', () => {
    const levelA = selectLodLevel(8e6, 6_371_000, 12);
    const levelB = selectLodLevel(8e6, 6_371_000, 12);
    expect(levelA).toBe(levelB);
  });

  it('chunk detail grows when zooming in', () => {
    const far = selectLodLevel(1e9, 6_371_000, 12);
    const near = selectLodLevel(7e6, 6_371_000, 12);
    expect(near).toBeGreaterThan(far);
  });
});
