use pretty_assertions::assert_eq;
use serde::Deserialize;
use serde_json::Value;
use sim_core::prng::{Seed256, Xoshiro256PlusPlus};
use std::path::PathBuf;

fn golden_file_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("packages")
        .join("shared")
        .join("testdata")
        .join("prng.golden.json")
}

fn range_golden_file_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("packages")
        .join("shared")
        .join("testdata")
        .join("prng-range-float.golden.json")
}

fn to_fixed_16(value: f64) -> f64 {
    format!("{value:.16}").parse::<f64>().unwrap()
}

#[test]
fn matches_golden_file() {
    let file = std::fs::read_to_string(golden_file_path()).unwrap();
    let golden: Value = serde_json::from_str(&file).unwrap();

    let mut rng =
        Xoshiro256PlusPlus::from_seed(Seed256::from_hex(golden["seedHex"].as_str().unwrap()).unwrap());
    let mut fork = rng.fork(golden["fork"]["label"].as_str().unwrap());

    let out = serde_json::json!({
      "u64": (0..8).map(|_| format!("0x{:016x}", rng.next_u64())).collect::<Vec<String>>(),
      "f64": (0..4).map(|_| to_fixed_16(rng.next_f64())).collect::<Vec<f64>>(),
      "ranges": {
        "int_10_99": (0..6).map(|_| rng.next_range_int(10,99)).collect::<Vec<i64>>(),
        "float_neg1_1": (0..3).map(|_| to_fixed_16(fork.next_range_float(-1.0,1.0))).collect::<Vec<f64>>()
      },
      "fork": {
        "label": golden["fork"]["label"],
        "u64": (0..4).map(|_| format!("0x{:016x}", fork.next_u64())).collect::<Vec<String>>()
      }
    });

    assert_eq!(out["u64"], golden["u64"]);
    assert_eq!(out["f64"], golden["f64"]);
    assert_eq!(out["ranges"]["int_10_99"], golden["ranges"]["int_10_99"]);
    assert_eq!(out["ranges"]["float_neg1_1"], golden["ranges"]["float_neg1_1"]);
    assert_eq!(out["fork"], golden["fork"]);
}

#[derive(Deserialize)]
struct RangeCase {
    min: f64,
    max: f64,
    #[serde(rename = "bitsHex")]
    bits_hex: String,
}

#[derive(Deserialize)]
struct RangeFixture {
    #[allow(dead_code)]
    #[serde(rename = "seedHex")]
    seed_hex: String,
    cases: Vec<RangeCase>,
}

#[test]
fn matches_next_range_float_regression_fixture_bits() {
    let file = std::fs::read_to_string(range_golden_file_path()).unwrap();
    let fixture: RangeFixture = serde_json::from_str(&file).unwrap();
    let mut rng = Xoshiro256PlusPlus::from_seed(Seed256::from_hex(&fixture.seed_hex).unwrap());
    let bits = fixture
        .cases
        .iter()
        .map(|case| format!("0x{:016x}", rng.next_range_float(case.min, case.max).to_bits()))
        .collect::<Vec<String>>();
    let expected = fixture
        .cases
        .iter()
        .map(|case| case.bits_hex.clone())
        .collect::<Vec<String>>();
    assert_eq!(bits, expected);
}

#[test]
fn seed_round_trip_hex() {
    let seed = Seed256::from_string("demiurge-seed");
    let hex = seed.to_hex();
    assert_eq!(Seed256::from_hex(&hex).unwrap().to_hex(), hex);
}

#[test]
fn fork_divergence_and_repeatability() {
    let parent = Xoshiro256PlusPlus::from_string("fork-root");
    let mut a1 = parent.fork("climate");
    let mut a2 = parent.fork("climate");
    let mut b = parent.fork("tectonics");
    let s1: Vec<u64> = (0..4).map(|_| a1.next_u64()).collect();
    let s2: Vec<u64> = (0..4).map(|_| a2.next_u64()).collect();
    let s3: Vec<u64> = (0..4).map(|_| b.next_u64()).collect();
    assert_eq!(s1, s2);
    assert_ne!(s1, s3);
}
