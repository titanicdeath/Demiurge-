# Decision 0008: No fractional-exponent pow in deterministic derivations

## Status
Accepted

## Context
M3 parity fixtures are generated on one platform and validated on others. We observed one-ULP drift across Windows/Linux in derived fields including UV flux and moon tidal heating.

The drift source was fractional-exponent power evaluation (`Math.pow`, `**` with non-integer exponents, and `f64::powf`). These operations are not guaranteed to produce identical bit patterns across platforms.

## Decision
For all cross-platform-determinism-required simulation code, do not use:
- `Math.pow(x, y)` where `y` is non-integer
- `x ** y` where `y` is non-integer
- `f64::powf(y)`

Allowed operations are: `+`, `-`, `*`, `/`, `sqrt`, `cbrt`, and integer-power forms (`powi`, repeated multiplication).

## Rewrite recipes
- `pow(x, 1.5)` -> `x * sqrt(x)`
- `pow(x, 0.5)` -> `sqrt(x)`
- `pow(x, 2)` -> `x * x` (or `powi(2)` in Rust)
- `pow(x, 3)` -> `x * x * x` (or `powi(3)` in Rust)
- `pow(x, 1/3)` -> `cbrt(x)`
- `pow(x, -2.5)` -> `1 / (x * x * sqrt(x))`
- `pow(x, 3.5)` -> `x * x * x * sqrt(x)`

If an exponent cannot be represented with these forms (for example `0.7`), treat it as a determinism-risk and escalate before implementation.

## Consequences
- Bit-exact fixtures are stable across supported OS targets for deterministic derivation code.
- Implementations in TS and Rust remain mathematically equivalent while avoiding platform libm `pow` divergence.
