# Milestone 04.5 — Cube-sphere chunked LOD wiring

Built:
- Replaced single `IcosahedronGeometry` planet mesh with per-chunk cube-sphere meshes generated from face regions and projected via `cubeToSphere`.
- Added deterministic chunk selection each frame from six root faces with recursive quadtree subdivision using a screen-space edge threshold (default 100 px) and max depth 12.
- Added horizon culling using sphere/camera analytic visibility test and retained Three.js frustum culling via mesh bounding spheres.
- Added skirts per chunk for crack mitigation. Depth is `max(10m, 0.5% of chunk edge length)`.
- HUD now displays true active chunk counts by LOD level.

Painful-to-change decisions:
- Grid resolution: 33x33 vertices per chunk.
- Max LOD depth: 12.
- Screen-space subdivision threshold: 100 px chunk edge.
- Skirt depth scaling: 0.5% chunk-edge with 10m minimum.

Performance note:
- Sandbox performance is environment-dependent and not representative of Windows + RTX 3070 Ti; user hardware remains source of truth for target verification.
