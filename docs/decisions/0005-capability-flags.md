# Decision 0005: Capability flags layer for downstream systems

## Status
Accepted — Milestone 02 (April 27, 2026)

## Context
Downstream milestones repeatedly need high-level checks (surface liquid presence, tectonic behavior, habitability envelope). Reading discriminated unions directly at every call site duplicates logic and couples every consumer to low-level schema shape.

## Decision
Introduce a derived `WorldCapabilities` contract computed from `WorldSpec` by pure functions:

- TypeScript: `deriveCapabilities(spec: WorldSpec): WorldCapabilities`
- Rust mirror: `derive_capabilities(&WorldSpec) -> WorldCapabilities`

The shape is fixed for M2:

- `hasAtmosphere`
- `atmosphereThickness`
- `surfaceLiquid`
- `hasOceanLayer`
- `tectonicMode`
- `hasMagnetosphere`
- `lifePresent`
- `tidalLockState`
- `temperatureRegime`
- `habitabilityClass`

## Principle: derivation, not authored data
Capabilities are computed from authored `WorldSpec` fields and must never become separately edited source-of-truth data. This keeps consistency guarantees: if schema internals change, only derivation functions update.

## Contract for downstream milestones
Starting with M2, downstream logic should consume `WorldCapabilities` for gating decisions and avoid direct ad-hoc introspection into `WorldSpec` discriminants unless a capability is missing and explicitly needs extension.

## Verification
M2 adds fixture-based parity checks: TS-derived and Rust-derived capability JSON must match byte-for-byte for all M2 archetype preset fixtures.
