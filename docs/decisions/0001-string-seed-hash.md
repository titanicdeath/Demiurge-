# Decision: SHA-256 for string seed derivation

We selected SHA-256 for deriving 256-bit seeds from arbitrary string inputs in both TypeScript and Rust. The key reason is implementation clarity and parity reliability: both ecosystems have high-quality, ubiquitous SHA-256 implementations with unambiguous output encoding semantics. This keeps cross-language determinism straightforward and testable while avoiding dependency complexity in Milestone 1. If we change hash strategy later (e.g., BLAKE3), golden tests will intentionally fail and require explicit migration.
