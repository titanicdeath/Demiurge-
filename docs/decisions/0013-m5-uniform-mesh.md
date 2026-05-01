# 0013 — M5 Uniform Mesh Terrain

M5 uses a single `IcosahedronGeometry` mesh at detail 8 for deterministic tectonic displacement and vertex coloring.

- Pros: no LOD seam bugs, simple caching, stable deterministic output.
- Cons: uniform geometric detail and visible triangulation near surface.

We selected detail 8 instead of 9 to keep initial generation time and memory lower while still producing clearly legible continents from orbit.
LOD is deferred to a future walking/surface milestone.
