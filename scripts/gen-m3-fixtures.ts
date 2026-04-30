import { writeFileSync } from 'node:fs';
import { archetypeDefaults, deriveWorldDerivedState, resolveWorldSpec } from '../packages/shared/src/index.ts';

const archetypes = Object.keys(archetypeDefaults) as Array<keyof typeof archetypeDefaults>;
const rows = archetypes.flatMap((archetype) => {
  const spec = resolveWorldSpec({ archetype, seed: `m3-${archetype}` });
  const derivedAtZero = deriveWorldDerivedState(spec, 0);
  const quarterPeriod = derivedAtZero.orbital_properties.period_seconds / 4;
  return [0, quarterPeriod].map((timeSeconds) => ({ archetype, timeSeconds, derived: deriveWorldDerivedState(spec, timeSeconds) }));
});

writeFileSync('packages/shared/testdata/derived-state-m3.json', `${JSON.stringify(rows, null, 2)}\n`);
