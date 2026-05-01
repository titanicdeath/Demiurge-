# 0010 — Rendering stack for M4
Date: 2026-05-01

M4 adopts Three.js with `three/webgpu` `WebGPURenderer` as primary and automatic fallback to `WebGLRenderer` when `navigator.gpu` is unavailable.

TSL is the preferred shader path; M4 uses built-in mesh materials and does not require custom WGSL/GLSL.

Known gap in M4 implementation: explicit logarithmic depth configuration is only applied on WebGL fallback; WebGPU path relies on default depth precision.
