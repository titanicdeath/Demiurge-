# Milestone 02: Archetype system and capability flags

## Built
- Expanded archetypes from 7 to 12 with new presets: `super-earth-temperate`, `ocean-world`, `iron-world`, `volcanic-moon`, `cold-rockball`.
- Added compositional resolver overrides with deterministic macro order:
  1. `temperature`
  2. `gravity`
  3. `age`
  4. `weather`
  5. `moons`
  6. raw deep field overrides
- Added `WorldCapabilities` derivation in TS and Rust mirror.
- Added M2 fixtures (`worldspec-presets-m2.json`, `world-capabilities-presets-m2.json`) and parity tests.
- Added composition tests for:
  - titan-like + warm
  - earth-analog + high gravity
  - airless-rockball + ancient age

## Deferred
- Dynamic simulation behavior (climate stepping, tectonic simulation, orbital evolution).
- Resolver code generation/shared source between TS and Rust.

## Painful-to-change-later decisions
- `WorldCapabilities` field names and enum values (downstream contract surface).
- Archetype canonical names (used in fixture generation and test indexing).
- Macro names and order (`temperature`, `gravity`, `age`, `weather`, `moons`, then raw overrides).

## Notes for M3
Hand-maintaining mirror derivation logic in TS and Rust is workable for M2 but will become error-prone as contracts grow. Consider codegen/shared spec metadata in M3 while preserving decision 0002 constraints.
