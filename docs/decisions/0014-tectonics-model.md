# 0014 — Simplified Tectonics Model

We use a visually-motivated approximation:

1. Seed plates using deterministic Fibonacci-sphere centers.
2. Assign vertices by nearest center (spherical Voronoi).
3. Assign oceanic/continental plate type and motion axes from deterministic PRNG.
4. Build elevation as base crust height + boundary uplift/subduction signals + low-amplitude multi-frequency noise.

This is **not** a geophysical simulator; it is a procedural visual model for plausible continental/ocean morphology in M-series milestones.
