# 0012 — Camera precision strategy
Date: 2026-05-01

M4 uses camera-relative rendering: CPU keeps world positions in double precision meter units, then scene content is shifted by `-cameraPosition` each frame prior to draw submission.

This avoids float precision loss at 1e9 m scales while preserving smooth near-surface movement.
