# Decision 0012: Camera precision strategy for M4

## Status
Accepted

## Decision
Use camera-relative rendering for large-scale precision:
- track camera in double-precision JS state,
- keep GPU camera near origin,
- translate planet/chunks by `-cameraPosition` each frame before render submission.

## Why
At interstellar scales (~1e9 m), raw world coordinates exceed useful f32 precision. Camera-relative translation preserves local precision near the viewer without invasive floating-origin world rewrites.
