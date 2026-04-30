use sim_core::astromech::derive_world_derived_state;
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

fn normalize_numbers(value: &serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::Number(n) => {
            let f = n.as_f64().unwrap();
            let normalized = if f == 0.0 { 0.0 } else { f };
            serde_json::json!(normalized)
        }
        serde_json::Value::Array(arr) => serde_json::Value::Array(arr.iter().map(normalize_numbers).collect()),
        serde_json::Value::Object(map) => serde_json::Value::Object(
            map.iter()
                .map(|(k, v)| (k.clone(), normalize_numbers(v)))
                .collect(),
        ),
        _ => value.clone(),
    }
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Row {
    archetype: String,
    time_seconds: f64,
    derived: serde_json::Value,
}

#[test]
fn rust_astromech_matches_ts_fixture_for_m3_cases() {
    let fixture = std::fs::read_to_string(fixture_path("derived-state-m3.json")).unwrap();
    let rows: Vec<Row> = serde_json::from_str(&fixture).unwrap();
    let worlds_fixture = std::fs::read_to_string(fixture_path("worldspec-presets-m2.json")).unwrap();
    let worlds: Vec<WorldSpec> = serde_json::from_str(&worlds_fixture).unwrap();

    for row in rows {
        let mut spec = worlds
            .iter()
            .find(|w| w.seed == format!("fixture-{}", row.archetype))
            .unwrap()
            .clone();
        spec.seed = format!("m3-{}", row.archetype);

        let derived = derive_world_derived_state(&spec, row.time_seconds);
        let derived_json = normalize_numbers(&serde_json::to_value(derived).unwrap());
        let fixture_json = normalize_numbers(&row.derived);
        assert_eq!(derived_json, fixture_json, "parity mismatch for archetype {}", row.archetype);
    }
}
