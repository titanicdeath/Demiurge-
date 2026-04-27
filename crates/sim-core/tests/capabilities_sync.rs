use sim_core::capabilities::{derive_capabilities, WorldCapabilities};
use sim_core::worldspec::WorldSpec;
use std::path::PathBuf;

fn fixture_path(file: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("packages")
        .join("shared")
        .join("testdata")
        .join(file)
}

#[test]
fn rust_capabilities_match_ts_fixture_for_m2_presets() {
    let worlds_fixture = std::fs::read_to_string(fixture_path("worldspec-presets-m2.json")).unwrap();
    let capabilities_fixture = std::fs::read_to_string(fixture_path("world-capabilities-presets-m2.json")).unwrap();

    let worlds: Vec<WorldSpec> = serde_json::from_str(&worlds_fixture).unwrap();
    let expected: Vec<WorldCapabilities> = serde_json::from_str(&capabilities_fixture).unwrap();

    let derived: Vec<WorldCapabilities> = worlds.iter().map(derive_capabilities).collect();
    assert_eq!(derived, expected);
}
