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
    expect(archetypes.length).toBeGreaterThanOrEqual(12);
    const rendered = archetypes.map((archetype) => JSON.stringify(resolveWorldSpec({ archetype, seed: `seed-${archetype}` })));
    expect(new Set(rendered).size).toBe(archetypes.length);
  });

  it('composes temperature warm for titan-like coherently', () => {
    const base = resolveWorldSpec({ archetype: 'titan-like', seed: 'frostfall' });
    const warmed = resolveWorldSpec({ archetype: 'titan-like', seed: 'frostfall', overrides: { temperature: 'warm' } });
    expect(warmed.hydrosphere.kind).toBe('methane-lakes');
    if (warmed.hydrosphere.kind !== 'methane-lakes' || base.hydrosphere.kind !== 'methane-lakes') throw new Error('expected methane lakes');
    expect(warmed.hydrosphere.coverage).toBeLessThan(base.hydrosphere.coverage);
    expect(warmed.atmosphere.kind).toBe('present');
    expect(base.atmosphere.kind).toBe('present');
    if (warmed.atmosphere.kind !== 'present' || base.atmosphere.kind !== 'present') throw new Error('expected atmosphere');
    expect(warmed.atmosphere.pressureBar).toBeGreaterThan(base.atmosphere.pressureBar);
  });

  it('composes gravity high for earth-analog into denser atmosphere and higher mass', () => {
    const base = resolveWorldSpec({ archetype: 'earth-analog', seed: 'gaia' });
    const heavy = resolveWorldSpec({ archetype: 'earth-analog', seed: 'gaia', overrides: { gravity: 'high' } });
    expect(heavy.body.massEarth).toBeGreaterThan(base.body.massEarth);
    if (heavy.atmosphere.kind !== 'present' || base.atmosphere.kind !== 'present') throw new Error('expected atmosphere');
    expect(heavy.atmosphere.pressureBar).toBeGreaterThan(base.atmosphere.pressureBar);
  });

  it('composes age ancient for airless-rockball into heavy impact history', () => {
    const aged = resolveWorldSpec({ archetype: 'airless-rockball', seed: 'oldstone', overrides: { age: 'ancient' } });
    expect(aged.surface.impactHistory).toBe('heavy');
  });

  it('supports mixed macro and raw overrides deterministically', () => {
    const one = resolveWorldSpec({
      archetype: 'titan-like',
      seed: 'frostfall',
      overrides: { temperature: 'warm', moons: 2, star: { spectralClass: 'G2V' } }
    });
    const two = resolveWorldSpec({
      archetype: 'titan-like',
      seed: 'frostfall',
      overrides: { temperature: 'warm', moons: 2, star: { spectralClass: 'G2V' } }
    });
    expect(one.moons).toHaveLength(2);
    expect(one.star.spectralClass).toBe('G2V');
    expect(JSON.stringify(one)).toBe(JSON.stringify(two));
  });
});
