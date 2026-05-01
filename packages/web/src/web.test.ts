import { describe, expect, it } from 'vitest';
import { resolveWorldSpec } from '@demiurge/shared';
import { selectChunks } from './lod';

describe('web package integration', () => {
  it('can consume m4 test archetype', () => {
    const world = resolveWorldSpec({ archetype: 'm4-test-planet', seed: 'client-seed' });
    expect(world.body.radiusEarth).toBe(1);
  });

  it('lod list is non-empty for orbital camera', () => {
    const chunks = selectChunks(
      { radius: 6_371_000, maxLevel: 12, screenThresholdPx: 100, gridResolution: 33, skirtDepthMeters: 20 },
      { position: [0, 0, 8_000_000], fovDeg: 60, viewportHeightPx: 1080 }
    );
    expect(chunks.length).toBeGreaterThan(0);
  });
});
