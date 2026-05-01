import { describe, expect, it } from 'vitest';
import { resolveWorldSpec } from './resolver';
import { generateTectonics } from './tectonics';

const sphere = Array.from({ length: 1000 }, (_, i) => {
  const t = i * 0.01;
  const z = -1 + (2 * i) / 999;
  const r = Math.sqrt(Math.max(0, 1 - z * z));
  return { x: Math.cos(t) * r, y: z, z: Math.sin(t) * r };
});

describe('tectonics', () => {
  it('is deterministic for same seed', async () => {
    const spec = resolveWorldSpec({ archetype: 'm5-test-planet', seed: 'same-seed' });
    const a = await generateTectonics(spec, sphere);
    const b = await generateTectonics(spec, sphere);
    expect(Array.from(a.plateIds)).toEqual(Array.from(b.plateIds));
    expect(Array.from(a.elevationsM)).toEqual(Array.from(b.elevationsM));
  });

  it('respects inert plate count', async () => {
    const spec = resolveWorldSpec({ archetype: 'airless-rockball', seed: 'a' });
    const out = await generateTectonics(spec, sphere);
    expect(out.plateCount).toBe(1);
  });
});
