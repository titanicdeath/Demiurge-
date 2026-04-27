import { writeFileSync } from 'node:fs';
import { archetypeDefaults, deriveOrbitalProperties, deriveStellarProperties, deriveWorldDerivedState, resolveWorldSpec } from '../packages/shared/src/index.ts';

const archetypes = Object.keys(archetypeDefaults) as Array<keyof typeof archetypeDefaults>;
const rows = archetypes.flatMap((archetype) => {
  const spec = resolveWorldSpec({ archetype, seed: `m3-${archetype}` });
  const stellar = deriveStellarProperties(spec.star, spec.orbit.semiMajorAxisAu);
  const orbital = deriveOrbitalProperties(spec.orbit, stellar.mass_kg, stellar.bolometric_flux_at_1au_w_m2);
  return [0, orbital.period_seconds / 4].map((timeSeconds) => ({ archetype, timeSeconds, derived: deriveWorldDerivedState(spec, timeSeconds) }));
});

writeFileSync('packages/shared/testdata/derived-state-m3.json', `${JSON.stringify(rows, null, 2)}\n`);
