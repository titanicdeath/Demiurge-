import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveWorldDerivedState, resolveWorldSpec } from './index';

interface Row {
  archetype: string;
  timeSeconds: number;
  derived: unknown;
}

describe('m3 fixture determinism', () => {
  it('matches generated derived-state fixture for all archetypes and checkpoints', () => {
    const rows = JSON.parse(readFileSync(new URL('../testdata/derived-state-m3.json', import.meta.url), 'utf-8')) as Row[];
    const normalize = (value: unknown): unknown => {
      if (typeof value === 'number') return Object.is(value, -0) ? 0 : value;
      if (Array.isArray(value)) return value.map(normalize);
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, normalize(v)]));
      }
      return value;
    };
    const recomputed = rows.map((row) => {
      const spec = resolveWorldSpec({ archetype: row.archetype as never, seed: `m3-${row.archetype}` });
      return normalize({ archetype: row.archetype, timeSeconds: row.timeSeconds, derived: deriveWorldDerivedState(spec, row.timeSeconds) });
    });
    expect(recomputed).toEqual(rows.map(normalize));
  });
});
