# Decision: Zod-authoritative schema with Rust serde mirror + compatibility fixtures

WorldSpec is authored first in Zod to optimize TypeScript inference and preset authoring ergonomics. Rust uses hand-mirrored serde types because they are simple, explicit, and stable in this milestone. Drift is controlled with compatibility tests that deserialize all resolved archetype fixtures in Rust; if fields or discriminants diverge, tests fail. We prefer this over premature codegen to keep milestone complexity low while preserving safety.
