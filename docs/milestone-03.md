# Milestone 03: Star and orbital mechanics

## Built
- Added deterministic stellar derivation including branch classification (`pre-main-sequence`, `main-sequence`, `post-main-sequence`, `sub-stellar`), SI outputs, Wien peak, UV proxy, conservative habitable-zone bounds, and main-sequence lifetime estimate.
- Added Kepler/Newton orbital mechanics functions for static properties and time-dependent state vectors, plus instantaneous and time-averaged insolation.
- Added tidal-lock/resonance classification helper.
- Added moon orbital derivations: period/velocity, Hill-sphere and Roche checks, tidal heating estimate, transit/eclipsing intervals.
- Added observable packaging functions: insolation curve, transit windows, eclipse schedule.
- Added a separate `DerivedState` shape rather than mutating `WorldSpec`.
- Added TS/Rust parity fixture for M3 checkpoints (`t=0`, `t=period/4`) over all M2 archetypes.

## Approximations and stubs
- Post-main-sequence stars are approximated by radius/temperature scaling from main-sequence templates.
- Brown dwarf classes (L/T/Y) use documented coarse ranges and fixed radius approximation.
- Binary-star combined flux is time-averaged using companion separation/eccentricity; no phase-resolved two-body stepping.
- Transit/eclipse timings are periodic first-order estimates, not full geometry ray-traces.

## Deferred
- No long-term secular orbital evolution stepping.
- No full N-body integrations.
- No relativistic corrections.
- No climate/escape/albedo coupling beyond top-of-atmosphere flux.

## Painful-to-change-later items
- `DerivedState` top-level shape.
- Enum/string contracts for branch and lock-state outputs.
- Fixture contract for M3 parity checkpoints.
