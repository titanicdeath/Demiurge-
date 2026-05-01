import { writeFileSync } from 'node:fs';
import { archetypeDefaults, deriveCapabilities, resolveWorldSpec } from '../packages/shared/src/index.ts';

const archetypes = Object.keys(archetypeDefaults) as Array<keyof typeof archetypeDefaults>;
const worlds = archetypes.map((archetype) => resolveWorldSpec({ archetype, seed: `fixture-${archetype}` }));
const capabilities = worlds.map((world) => deriveCapabilities(world));

writeFileSync('packages/shared/testdata/worldspec-presets-m2.json', `${JSON.stringify(worlds, null, 2)}\n`);
writeFileSync('packages/shared/testdata/world-capabilities-presets-m2.json', `${JSON.stringify(capabilities, null, 2)}\n`);
