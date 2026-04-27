use sim_core::worldspec::WorldSpec;
use std::path::PathBuf;

fn fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("packages")
        .join("shared")
        .join("testdata")
        .join("worldspec-presets-m2.json")
}

#[test]
fn rust_worldspec_mirror_accepts_all_m2_presets_fixture() {
    let fixture = std::fs::read_to_string(fixture_path()).unwrap();
    let specs: Vec<WorldSpec> = serde_json::from_str(&fixture).unwrap();
    assert!(specs.len() >= 12);
}
