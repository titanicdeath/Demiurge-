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

fn float_close(a: f64, b: f64) -> bool {
    if a == b {
        return true;
    }
    if a.is_nan() && b.is_nan() {
        return true;
    }
    let denom = a.abs().max(b.abs()).max(1e-300);
    ((a - b).abs() / denom) <= 1e-13
}

fn compare_json(path: &str, rust_value: &serde_json::Value, ts_value: &serde_json::Value) -> Result<(), String> {
    match (rust_value, ts_value) {
        (serde_json::Value::Number(rn), serde_json::Value::Number(tn)) => {
            let r = rn.as_f64().ok_or_else(|| format!("{}: rust number is not f64", path))?;
            let t = tn.as_f64().ok_or_else(|| format!("{}: ts number is not f64", path))?;
            if float_close(r, t) {
                Ok(())
            } else {
                let rel_err = (r - t).abs() / r.abs().max(t.abs()).max(1e-300);
                Err(format!(
                    "{}: numeric mismatch outside tolerance (1e-13); ts={}, rust={}, rel_err={}",
                    path, t, r, rel_err
                ))
            }
        }
        (serde_json::Value::Array(ra), serde_json::Value::Array(ta)) => {
            if ra.len() != ta.len() {
                return Err(format!("{}: array length mismatch ts={}, rust={}", path, ta.len(), ra.len()));
            }
            for (i, (rv, tv)) in ra.iter().zip(ta.iter()).enumerate() {
                compare_json(&format!("{}[{}]", path, i), rv, tv)?;
            }
            Ok(())
        }
        (serde_json::Value::Object(ro), serde_json::Value::Object(to)) => {
            for key in ro.keys() {
                if !to.contains_key(key) {
                    return Err(format!("{}: missing key in ts fixture: {}", path, key));
                }
            }
            for key in to.keys() {
                if !ro.contains_key(key) {
                    return Err(format!("{}: missing key in rust output: {}", path, key));
                }
            }
            for (k, rv) in ro {
                let tv = to.get(k).expect("key existence checked");
                let next_path = if path == "$" { format!("$.{}", k) } else { format!("{}.{}", path, k) };
                compare_json(&next_path, rv, tv)?;
            }
            Ok(())
        }
        _ => {
            if rust_value == ts_value {
                Ok(())
            } else {
                Err(format!("{}: non-numeric mismatch ts={:?}, rust={:?}", path, ts_value, rust_value))
            }
        }
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

        // Diagnostic contract:
        // - If this assertion fails, the message includes the JSON path and relative error.
        // - rel_err <= 1e-13 is considered within expected cross-language ULP-level variance.
        // - rel_err > 1e-13 indicates a likely formula/data regression that should be investigated.
        if let Err(msg) = compare_json("$", &derived_json, &row.derived) {
            panic!("parity mismatch for archetype {}: {}", row.archetype, msg);
        }
    }
}
