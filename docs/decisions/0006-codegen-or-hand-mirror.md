# Decision 0006: codegen or hand-mirror for M3

## Status
Accepted — stay hand-mirror for M3.

## Context
M3 adds substantial new cross-language derivation logic (`derive_stellar_properties`, `derive_orbital_state`, `derive_moon_orbits`, observables). That increases parity burden across TypeScript and Rust.

## Decision
For M3 we keep hand-mirrored logic rather than introducing code generation.

## Why now
- Existing JSON wire format and fixture parity are already stable with hand-authored mirrors.
- A codegen migration during first physics milestone would add integration risk and blur debugging of numerical parity issues.
- Current scope remains tractable with explicit parity fixtures and tests.

## Mitigation
- Keep derivation outputs fixture-tested across both languages.
- Keep formulas centralized per module and documented with constant sources.

## Revisit point
If M4+ introduces additional physics domains (climate chemistry, tectonics, biosphere coupling), we should re-evaluate codegen before parity debt grows further.
