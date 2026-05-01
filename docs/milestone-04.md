# Milestone 04 — Sphere Rendering & LOD Backbone

Implemented:
- Three.js renderer boot with WebGPU primary / WebGL2 fallback.
- Gray spherical planet render targetting Earth scale.
- Camera-relative transform pipeline.
- Orbit/free camera modes, basic controls, debug HUD, wireframe toggle.
- Deterministic helper functions for cube-sphere mapping and LOD level selection plus unit tests.
- Added `m4-test-planet` archetype in shared schema/resolver taxonomy.
- Updated E2E smoke to verify canvas mount and generate `docs/milestone-04-screenshot.png`.

Deferred to follow-up:
- Full cube-face quadtree chunk system with skirts/horizon+frustum culling.
- Full chunk-count-by-LOD diagnostics.
- Surface-point cursor zoom and full mouse drag rig polish.

Sandbox performance:
- Not representative of RTX 3070 Ti. Human verification required on target hardware.

Painful-to-change decisions:
- Camera-relative transform as foundational precision contract.
- Archetype isolation for rendering testbed stability.
