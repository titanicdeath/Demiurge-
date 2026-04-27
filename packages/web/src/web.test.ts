import { describe, expect, it } from 'vitest';
import { resolveWorldSpec } from '@demiurge/shared';

describe('web package integration', () => {
  it('can consume shared resolver', () => {
    const world = resolveWorldSpec({ archetype: 'venus-like', seed: 'client-seed' });
    expect(world.atmosphere.kind).toBe('present');
  });
});
