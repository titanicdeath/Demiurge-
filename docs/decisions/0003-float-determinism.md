# Decision: Canonical float range scaling for cross-language determinism

To keep PRNG output bit-identical between TypeScript and Rust, `next_range_float(min, max)` is locked to the exact operation order `((max - min) * raw) + min`, where `raw` is `next_f64()` in `[0, 1)`. Although mathematically equivalent rewrites exist, IEEE-754 rounding means operand reordering can produce one-ULP differences in edge cases.

We explicitly avoid fused operations (`mul_add`/FMA) and keep a non-strict inequality guard (`max >= min`) with an equal-range short-circuit returning `min`.

A dedicated regression fixture (`packages/shared/testdata/prng-range-float.golden.json`) captures expected `to_bits` outputs across multiple range pairs so parity regressions fail fast without tolerance-based comparisons.

## Signed zero is out of scope for the cross-language fixture

The fixture intentionally does not include the case `(-0.0, 0.0)`. JSON has no canonical representation of signed zero, so a value written as `-0` cannot be guaranteed to round-trip back to `-0.0` after parsing — the result depends on the parser implementation, on every tool that reads or rewrites the file, and on JSON serializers used along the way. Including such a case in a JSON-backed fixture tests the JSON pipeline's handling of signed zero, not the PRNG's, and produces brittle test results.

If a future system depends on `next_range_float` producing a specific signed zero, that requirement must be tested via a unit test internal to each language (asserting on the bit pattern produced at runtime), not via a shared fixture. The cross-language guarantee covers all non-signed-zero edge cases; signed zero is treated as numerically equal to positive zero for the purposes of cross-language parity.