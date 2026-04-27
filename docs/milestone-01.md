# Milestone 01 Summary

## Built

- Repo foundation with TS client (`packages/web`), shared TS core (`packages/shared`), and Rust+WASM simulation core (`crates/sim-core`, emitted package in `packages/wasm-sim/pkg`).
- Deterministic xoshiro256++ in TS and Rust with shared golden file and parity tests.
- `WorldSpec` schema with non-Earth-biased unions for atmosphere, hydrosphere, and life states.
- Data-driven archetype resolver for:
  - earth-analog
  - mars-like
  - venus-like
  - titan-like
  - europa-like
  - airless-rockball
  - tide-locked-m-dwarf-desert
- Vitest + Playwright + Cargo tests wired behind a single root `pnpm test` command.

## Deferred

- Rendering stack and any graphics pipeline.
- Any simulation systems (tectonics, climate, orbital evolution, hydrology dynamics).
- User-facing editing UI.

## Decisions likely painful to change later

- **WorldSpec discriminated union shape** across atmosphere/hydrosphere/life.
- **PRNG algorithm and float extraction method** (golden-file-locked).
- **Monorepo layout** (`packages/*` + `crates/*`) and wasm output location.

## Cleanup pass

- Fixed Rust golden-file and fixture path resolution by anchoring file discovery with `CARGO_MANIFEST_DIR` and platform-correct `PathBuf` joins.
- Converted Rust `WorldSpec` mirror types to idiomatic snake_case field names and used serde `rename_all = "camelCase"` so wire JSON remains unchanged while removing local lint warnings.
- Removed unnecessary parentheses in `prng_golden.rs` closure bodies to silence compiler warnings.
- Added explicit command coverage targets for `cargo test --workspace`, `cargo test -p sim-core`, and `cargo test` (from `crates/sim-core`), and for full `pnpm test` including Playwright smoke.
- In this execution environment those commands are blocked by network proxy restrictions when fetching Cargo/npm artifacts, so re-validation must run in CI or a networked dev machine.
- The path fix now uses `PathBuf` joins and `CARGO_MANIFEST_DIR`, making path resolution platform-correct for Windows path separators.

## Float determinism follow-up

A one-ULP mismatch was traced to cross-language float range scaling and decimal formatting behavior in the determinism harness. The canonical `next_range_float` formulation is now locked to `((max - min) * raw) + min` (with explicit equal-range handling), and both Rust and TypeScript carry matching comments to prevent algebraic rewrites that can perturb IEEE-754 rounding.

TypeScript remained the canonical output source for the committed golden data; Rust was updated to mirror deterministic behavior and the harness now includes a dedicated cross-language bit-pattern regression fixture for representative ranges (including signed zero).
