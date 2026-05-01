# Milestone 04: Sphere rendering and LOD backbone

## Built
- Web renderer now mounts a live Three.js scene and renders an M4 test planet as a gray sphere surface.
- Added cube-sphere mapping module and deterministic chunk LOD selector with horizon-aware culling and screen-size subdivision.
- Added dual camera modes (orbit/free), camera-relative transform path, debug HUD, wireframe toggle, and backend indicator.
- Added M4 archetype `m4-test-planet` and wired web entrypoint to consume existing shared pipeline (`resolveWorldSpec`, `deriveWorldDerivedState`).
- Added M4 unit tests (cube-sphere unit length, deterministic LOD, zoom-in chunk growth) and updated smoke screenshot target.

## Deferred
- Full frustum culling and neighbor-aware crack stitching skirts are not fully modeled yet.
- Performance budget validation on RTX hardware deferred to human local Windows verification.

## Painful-to-change decisions
- Chunk grid resolution: 33x33.
- LOD depth default: 12.
- Screen threshold default: 100 px per chunk edge.
- Camera-relative rendering selected over floating-origin rewrites.

## Performance notes
Sandbox is CPU-only and headless; measured browser performance is not representative of RTX 3070 Ti target hardware.
