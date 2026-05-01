import { describe, expect, it } from 'vitest';
import { resolveWorldSpec } from '@demiurge/shared';

describe('web package integration', () => {
  it('can resolve m4 test archetype', () => {
    const world = resolveWorldSpec({ archetype: 'm4-test-planet', seed: 'client-seed' });
    expect(world.body.radiusEarth).toBe(1);
  });
});
