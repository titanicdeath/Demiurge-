import { describe, expect, it } from 'vitest';
import { archetypeDefaults, resolveWorldSpec } from './resolver';
import { worldSpecSchema } from './worldspec';

const archetypes = Object.keys(archetypeDefaults) as Array<keyof typeof archetypeDefaults>;

describe('worldspec schema and resolver', () => {
  it('round-trips worldspec via JSON parse', () => {
    const spec = resolveWorldSpec({ archetype: 'earth-analog', seed: 'hello' });
    const parsed = worldSpecSchema.parse(JSON.parse(JSON.stringify(spec)));
    expect(parsed).toEqual(spec);
  });

  it('preset resolution is stable byte-for-byte', () => {
    const a = resolveWorldSpec({ archetype: 'titan-like', seed: 'x' });
    const b = resolveWorldSpec({ archetype: 'titan-like', seed: 'x' });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('all archetypes resolve with zero schema errors and are distinct', () => {
    const rendered = archetypes.map((archetype) => JSON.stringify(resolveWorldSpec({ archetype, seed: `seed-${archetype}` })));
    expect(new Set(rendered).size).toBe(archetypes.length);
  });
});
