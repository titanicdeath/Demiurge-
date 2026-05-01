pub mod astromech;
pub mod capabilities;
pub mod prng;
pub mod tectonics;
pub mod worldspec;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn wasm_smoke_test() -> String {
    "ok".to_string()
}

#[wasm_bindgen]
pub fn validate_worldspec_json(json: &str) -> bool {
    serde_json::from_str::<worldspec::WorldSpec>(json).is_ok()
}
