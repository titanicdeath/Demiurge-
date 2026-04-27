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

fn approx_json(a: &serde_json::Value, b: &serde_json::Value, eps: f64) -> bool {
    match (a, b) {
        (serde_json::Value::Number(na), serde_json::Value::Number(nb)) => {
            let fa = na.as_f64().unwrap();
            let fb = nb.as_f64().unwrap();
            (fa - fb).abs() <= eps * fa.abs().max(fb.abs()).max(1.0)
        }
        (serde_json::Value::Array(aa), serde_json::Value::Array(ab)) => {
            aa.len() == ab.len() && aa.iter().zip(ab.iter()).all(|(x, y)| approx_json(x, y, eps))
        }
        (serde_json::Value::Object(oa), serde_json::Value::Object(ob)) => {
            oa.iter()
                .all(|(k, v)| ob.get(k).map(|w| approx_json(v, w, eps)).unwrap_or(true))
                && ob
                    .iter()
                    .all(|(k, v)| oa.get(k).map(|w| approx_json(w, v, eps)).unwrap_or(true))
        }
        _ => a == b,
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
        let derived_json = serde_json::to_value(derived).unwrap();
        assert!(approx_json(&derived_json, &row.derived, 1e-1), "parity mismatch for archetype {}", row.archetype);
    }
}
