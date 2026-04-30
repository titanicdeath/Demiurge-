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

## Determinism cleanup (post-M3)
- Two prior fixes both addressed real bugs but did not achieve durable cross-language bit-exact physics parity: (1) canonicalized computation paths between fixture generation and runtime, then (2) removed fractional-exponent `pow`/`powf` usage.
- We now adopt the tiered determinism contract in Decision 0009: logic-layer parity (PRNG, WorldSpec/resolver, capabilities) remains bit-exact across TS/Rust, while astromech physics parity is cross-language ULP-tolerant at `|a-b|/max(|a|,|b|,1e-300) <= 1e-13`.
- Intra-language determinism remains bit-exact; this preserves the key reproducibility guarantee that the same seed produces the same world on the same machine.
