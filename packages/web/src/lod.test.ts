import { describe, expect, it } from 'vitest';
import { computeActiveChunks, cubeToSphere, magnitude, selectLodLevel } from './lod';

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

  it('chunk count grows when zooming in', () => {
    const far = computeActiveChunks({ x: 0, y: 0, z: 1e9 }, 6_371_000, 1080, Math.PI / 3, 100, 7).length;
    const near = computeActiveChunks({ x: 0, y: 0, z: 7e6 }, 6_371_000, 1080, Math.PI / 3, 100, 7).length;
    expect(near).toBeGreaterThan(far);
  });

  it('horizon-culls back-side chunks', () => {
    const chunks = computeActiveChunks({ x: 0, y: 0, z: 1e9 }, 6_371_000, 1080, Math.PI / 3, 100, 0);
    const hasNz = chunks.some((c) => c.face === 'nz');
    expect(hasNz).toBe(false);
  });
});
