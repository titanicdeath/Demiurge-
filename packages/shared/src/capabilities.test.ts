import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveCapabilities } from './capabilities';
import { archetypeDefaults, resolveWorldSpec } from './resolver';

describe('capabilities derivation', () => {
  it('derives visibly distinct capability bundles for all archetypes', () => {
    const archetypes = Object.keys(archetypeDefaults) as Array<keyof typeof archetypeDefaults>;
    const rendered = archetypes.map((archetype) => JSON.stringify(deriveCapabilities(resolveWorldSpec({ archetype, seed: `caps-${archetype}` }))));
    expect(new Set(rendered).size).toBe(archetypes.length);
  });

  it('matches the parity fixture for all M2 archetype presets', () => {
    const fixture = JSON.parse(readFileSync(new URL('../testdata/world-capabilities-presets-m2.json', import.meta.url), 'utf-8')) as unknown[];
    const archetypes = Object.keys(archetypeDefaults) as Array<keyof typeof archetypeDefaults>;
    const derived = archetypes.map((archetype) => deriveCapabilities(resolveWorldSpec({ archetype, seed: `fixture-${archetype}` })));
    expect(derived).toEqual(fixture);
  });
});
