# Decision 0009: Tiered determinism contract

## Status
Accepted (M3 cleanup)

## Context
We performed two rounds of attempted bit-exact cross-language parity for M3 astromech physics.

- Round 1 fixed real bugs by canonicalizing computation paths between fixture generation and runtime derivation.
- Round 2 fixed real bugs by removing fractional-exponent `pow`/`powf` usage in deterministic physics code.

After those fixes, residual one-ULP mismatches remained across TS/Rust on different platforms. The remaining variance comes from compiler/libm-level behavior (operand grouping choices, intermediate precision details, math implementation differences) that is not practically eliminable from source alone without imposing structural code ugliness on all future physics milestones.

## Decision
We adopt a tiered determinism contract.

### Bit-exact across TS and Rust (unchanged)
- PRNG output
- WorldSpec schema parity
- Archetype resolver output
- Capability flag derivation

### ULP-tolerant across TS and Rust
- Astromech physics derivations:
  - stellar properties
  - orbital mechanics
  - moon orbits
  - observables

Cross-language tolerance definition:

`|a - b| / max(|a|, |b|, 1e-300) <= 1e-13`

Intra-language determinism remains bit-exact: same language + same machine + same input must produce identical bits across runs.

## Why this is acceptable
At the ULP scale, the error is negligible for project use cases. A ~10^-16 relative error on Earth orbital period is approximately:

- ~4 nanoseconds per year, or
- ~0.12 mm position drift per orbit at Earth orbital velocity.

No current or planned downstream system is sensitive to this:

- visual rendering typically uses f32 (~10^-7 relative precision),
- climate/biome/terrain systems are not ULP-sensitive,
- long-horizon N-body integration is explicitly out of scope.

## What this does not change
- Intra-language determinism is still bit-exact.
- Seeded reproducibility on the same machine in the same runtime remains strict.
- Only cross-language physics parity uses ULP tolerance.

## Inheritance for future milestones
M5 (tectonics), M6 (hydrosphere), M7 (climate), and later physics-heavy milestones may use this same tiered cross-language contract. They are not required to add defensive parenthesization for bit-identical cross-language outputs; they are required to preserve intra-language determinism.

## Revisit criteria
If a future use case requires strict bit-exact cross-language physics (for example shared multiplayer simulation with mixed TS/Rust execution), this decision must be revisited. Likely path:

1. choose one canonical physics implementation (likely Rust/WASM),
2. have other runtimes defer to it,
3. remove duplicate-implementation parity surface for physics.
