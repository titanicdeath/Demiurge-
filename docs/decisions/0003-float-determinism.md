# Decision: Canonical float range scaling for cross-language determinism

To keep PRNG output bit-identical between TypeScript and Rust, `next_range_float(min, max)` is locked to the exact operation order `((max - min) * raw) + min`, where `raw` is `next_f64()` in `[0, 1)`. Although mathematically equivalent rewrites exist, IEEE-754 rounding means operand reordering can produce one-ULP differences in edge cases.

We explicitly avoid fused operations (`mul_add`/FMA) and keep a non-strict inequality guard (`max >= min`) with equal-range short-circuit returning `min` (including signed zero). This gives consistent semantics for pairs like `(-0.0, 0.0)` and removes ambiguity for future contributors.

A dedicated regression fixture captures expected `to_bits` outputs across multiple range pairs so parity regressions fail fast without tolerance-based comparisons.
