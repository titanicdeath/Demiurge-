# Decision 0004: Archetype taxonomy expansion

## Status
Accepted — Milestone 02 (April 27, 2026)

## Context
Milestone 01 established seven baseline archetypes, but downstream systems need a wider representative spread of rocky/icy planet classes to avoid overfitting climate, biosphere, and civilization assumptions to Earth/Mars/Venus-like outcomes.

## Decision
We expand the resolver taxonomy to twelve archetypes by adding five new presets:

- **super-earth-temperate**: high-mass rocky world around a K-dwarf with denser air and slower geology. This gives us a high-gravity habitable-ish branch that is not Earth-clone.
- **ocean-world**: global ocean / Hycean-style world with no exposed continents. This covers ocean-dominated volatile budgets and high water inventory cases.
- **iron-world**: Mercury-like high-core-fraction airless world with spin-orbit resonance. This captures metal-rich, volatile-poor close-in outcomes.
- **volcanic-moon**: Io-like tidally heated moon with thin SO2 atmosphere and lava hydrosphere. This gives us a static extreme volcanism endpoint without simulation.
- **cold-rockball**: distant Pluto/Triton-like ice world with trace nitrogen-methane air and cryogenic regime.

Each archetype is encoded in the single `baseByArchetype` configuration table; no archetype switch statements were added.

## How to add archetypes
1. Add the new string literal to `Archetype` in `packages/shared/src/worldspec.ts`.
2. Add exactly one new preset entry in `baseByArchetype` in `packages/shared/src/resolver.ts`.
3. Regenerate M2 fixtures with `pnpm run gen:m2:fixtures`.
4. Ensure the archetype resolves and capabilities stay distinct via tests.

## Not included in M2
We intentionally deferred gas giant classes, synthetic megastructure classes, and simulation-heavy classes (e.g., time-varying runaway greenhouse transitions) because M2 is static type/data derivation only.
