# Decision 0007: keep derived physics state separate from WorldSpec

## Status
Accepted — Milestone 03.

## Context
M3 introduces computed stellar/orbital/moon mechanics. These values are runtime derivations, not authored source data.

## Decision
Use a separate `DerivedState` payload (`stellar`, `orbital_properties`, `orbital_state`, `moon_orbits`, `ring_stable`, `tidal_lock_state`) returned by derivation functions, instead of embedding computed fields in `WorldSpec`.

## Rationale
- Preserves the M1/M2 principle: WorldSpec remains descriptive/authored only.
- Keeps schema churn low for user-authored data.
- Enables recomputation at different `time_seconds` without mutating spec.

## Consequences
- Downstream milestones consume `(WorldSpec, DerivedState)` pair.
- Caching strategy is explicit: cache static derived subsets, recompute time-dependent orbit state as needed.
