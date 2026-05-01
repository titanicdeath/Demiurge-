# Decision 0010: Rendering stack for M4

## Status
Accepted

## Decision
- Primary renderer: Three.js `WebGPURenderer` from `three/webgpu` when `navigator.gpu` is available.
- Fallback renderer: Three.js `WebGLRenderer` with `logarithmicDepthBuffer: true`.
- Shading: built-in PBR material for M4 (`MeshStandardMaterial`) to stay cross-backend and simple.

## Notes
- M4 avoids custom shader code; no TSL/WGSL needed yet.
- WebGPU path is the default development path on Windows + RTX 3070 Ti class hardware.
- WebGL fallback is functional but not feature-parity complete for future milestones.
