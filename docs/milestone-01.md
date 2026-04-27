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
