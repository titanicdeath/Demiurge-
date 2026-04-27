# Demiurge

Demiurge is a procedural world-generation project aimed at deterministic, physically grounded generation of terrestrial and icy worlds from stellar context down to local surface detail. Milestone 1 focuses only on foundation: repository architecture, deterministic cross-language random streams, and a future-proof world description schema.

## Milestone 1 scope

This milestone delivers:

- pnpm workspace + Cargo workspace monorepo scaffold.
- Vite TypeScript browser client.
- Rust simulation core compiled to WebAssembly via `wasm-pack`/`wasm-bindgen`.
- Shared `@demiurge/shared` package with strict TypeScript Zod schema, xoshiro256++ PRNG, and archetype resolver.
- Cross-language golden-file determinism tests for PRNG.
- WorldSpec preset validation/stability tests.
- Playwright smoke test ensuring app loads and WASM responds.

## Install

Prerequisites:

- Node.js LTS (with corepack)
- pnpm 10+
- Rust stable toolchain
- `wasm-pack` available in PATH

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Builds the WASM module once, then starts Vite and a Rust source watcher that rebuilds WASM package outputs on changes.

## Tests

```bash
pnpm test
```

Runs the full pipeline in order:

1. `test:rust` — Rust unit/integration tests via `cargo test --workspace`.
2. `wasm:build` — one-shot WASM build via `wasm-pack`.
3. `test:ts` — TypeScript tests via Vitest in `@demiurge/shared` and `@demiurge/web`.
4. `test:e2e:no-build` — Playwright smoke test against the built app.

Each step can also be run independently:

```bash
pnpm test:rust            # Rust tests only
pnpm test:ts              # TS tests only (assumes WASM is built)
pnpm test:e2e             # Builds WASM, then runs Playwright
pnpm wasm:build           # Just the WASM build
```

## Tooling rationale

- **Monorepo:** pnpm workspaces + Cargo workspace keeps JS and Rust dependency graphs clean while allowing a single root install/test experience.
- **Rust ↔ TS binding:** `wasm-bindgen` / `wasm-pack` is stable, typed, and broadly adopted for Rust WASM integration.
- **Schema sync strategy:** WorldSpec is authored in Zod for TS inference and mirrored in Rust `serde` types, with fixtures/tests ensuring Rust can parse all resolved presets.
- **String seed hash:** SHA-256 to produce a deterministic 256-bit seed in both Rust and TS using mature standard libraries, minimizing implementation ambiguity.
- **WASM build wiring:** the WASM module is a build artifact, not a checked-in file. Root-level scripts (`wasm:build`, `wasm:build:dev`, `wasm:watch`) make the lifecycle explicit; `pnpm dev` and `pnpm test` orchestrate it automatically so a fresh checkout works without manual steps.