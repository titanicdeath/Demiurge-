use sim_core::worldspec::WorldSpec;

#[test]
fn rust_worldspec_mirror_accepts_all_presets_fixture() {
    let fixture = std::fs::read_to_string("packages/shared/testdata/worldspec-presets.json").unwrap();
    let specs: Vec<WorldSpec> = serde_json::from_str(&fixture).unwrap();
    assert_eq!(specs.len(), 7);
}
