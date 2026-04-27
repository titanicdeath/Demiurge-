use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WorldSpec {
    pub schemaVersion: u8,
    pub seed: String,
    pub star: Star,
    pub orbit: Orbit,
    pub body: Body,
    pub volatiles: BTreeMap<String, f64>,
    pub surface: Surface,
    pub atmosphere: Atmosphere,
    pub hydrosphere: Hydrosphere,
    pub life: Life,
    pub moons: Vec<MoonSpec>,
    pub rings: Option<Rings>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Star { pub spectralClass: String, pub massSolar: f64, pub luminositySolar: f64, pub ageGyr: f64, pub binaryCompanion: Option<BinaryCompanion> }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BinaryCompanion { pub spectralClass: String, pub separationAu: f64, pub eccentricity: f64 }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Orbit { pub semiMajorAxisAu: f64, pub eccentricity: f64, pub inclinationDeg: f64, pub axialTiltDeg: f64, pub rotationPeriodHours: f64, pub tidalLock: String }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Body { pub massEarth: f64, pub radiusEarth: f64, pub bulkDensityKgM3: f64, pub tectonics: String, pub composition: Composition, pub magneticFieldMicrotesla: f64 }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Composition { pub core: String, pub mantle: String, pub crust: String }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Surface { pub elevationHint: String, pub dominantMaterials: Vec<String>, pub impactHistory: String }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind")]
pub enum Atmosphere { #[serde(rename = "none")] None, #[serde(rename = "present")] Present { pressureBar: f64, composition: BTreeMap<String, f64> } }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind")]
pub enum Hydrosphere {
    #[serde(rename = "none")] None,
    #[serde(rename = "water-ocean")] WaterOcean { coverage: f64, salinityPsu: f64 },
    #[serde(rename = "methane-lakes")] MethaneLakes { coverage: f64 },
    #[serde(rename = "brine")] Brine { coverage: f64, salinityPsu: f64 },
    #[serde(rename = "lava")] Lava { coverage: f64 },
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind")]
pub enum Life { #[serde(rename = "none")] None, #[serde(rename = "microbial")] Microbial, #[serde(rename = "complex")] Complex, #[serde(rename = "sapient")] Sapient { techLevel: String, culturalSeed: String } }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MoonSpec { pub name: String, pub massEarth: f64, pub radiusEarth: f64, pub orbitSemiMajorAxisKm: f64, pub composition: String }
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Rings { pub innerRadiusKm: f64, pub outerRadiusKm: f64, pub composition: String }
