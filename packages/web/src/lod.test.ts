import { describe, expect, it } from 'vitest';
import { cubeToSphere, selectChunks, type CameraState, type LODConfig } from './lod';

const config: LODConfig = {
  radius: 6_371_000,
  maxLevel: 12,
  screenThresholdPx: 100,
  gridResolution: 33,
  skirtDepthMeters: 20
};

describe('cube sphere math', () => {
  it('maps cube points to unit sphere', () => {
    const pts = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1],
      [0.2, -0.8, 1],
      [-0.5, 1, 0.3]
    ] as const;
    for (const p of pts) {
      const m = cubeToSphere(p[0], p[1], p[2]);
      expect(Math.abs(Math.hypot(m[0], m[1], m[2]) - 1)).toBeLessThan(1e-10);
    }
  });

  it('lod selection is deterministic', () => {
    const cam: CameraState = { position: [0, 0, 8_000_000], fovDeg: 60, viewportHeightPx: 1080 };
    expect(selectChunks(config, cam)).toEqual(selectChunks(config, cam));
  });

  it('chunk count grows when zooming in', () => {
    const far: CameraState = { position: [0, 0, 1_000_000_000], fovDeg: 60, viewportHeightPx: 1080 };
    const near: CameraState = { position: [0, 0, 6_371_100], fovDeg: 60, viewportHeightPx: 1080 };
    expect(selectChunks( config, near).length).toBeGreaterThan(selectChunks(config, far).length);
  });
});
