import { writeFileSync } from 'node:fs';
import { resolveWorldSpec, archetypeDefaults } from '../packages/shared/src/index.ts';

const archetypes = Object.keys(archetypeDefaults) as Array<keyof typeof archetypeDefaults>;
const worlds = archetypes.map((archetype) => resolveWorldSpec({ archetype, seed: `fixture-${archetype}` }));
writeFileSync('packages/shared/testdata/worldspec-presets.json', `${JSON.stringify(worlds, null, 2)}\n`);
