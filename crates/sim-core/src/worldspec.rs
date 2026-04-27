use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorldSpec {
    pub schema_version: u8,
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
#[serde(rename_all = "camelCase")]
pub struct Star {
    pub spectral_class: String,
    pub mass_solar: f64,
    pub luminosity_solar: f64,
    pub age_gyr: f64,
    pub binary_companion: Option<BinaryCompanion>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BinaryCompanion {
    pub spectral_class: String,
    pub separation_au: f64,
    pub eccentricity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Orbit {
    pub semi_major_axis_au: f64,
    pub eccentricity: f64,
    pub inclination_deg: f64,
    pub axial_tilt_deg: f64,
    pub rotation_period_hours: f64,
    pub tidal_lock: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Body {
    pub mass_earth: f64,
    pub radius_earth: f64,
    pub bulk_density_kg_m3: f64,
    pub tectonics: String,
    pub composition: Composition,
    pub magnetic_field_microtesla: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Composition {
    pub core: String,
    pub mantle: String,
    pub crust: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Surface {
    pub elevation_hint: String,
    pub dominant_materials: Vec<String>,
    pub impact_history: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind")]
pub enum Atmosphere {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "present", rename_all = "camelCase")]
    Present {
        pressure_bar: f64,
        composition: BTreeMap<String, f64>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind")]
pub enum Hydrosphere {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "water-ocean", rename_all = "camelCase")]
    WaterOcean { coverage: f64, salinity_psu: f64 },
    #[serde(rename = "methane-lakes")]
    MethaneLakes { coverage: f64 },
    #[serde(rename = "brine", rename_all = "camelCase")]
    Brine { coverage: f64, salinity_psu: f64 },
    #[serde(rename = "lava")]
    Lava { coverage: f64 },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind")]
pub enum Life {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "microbial")]
    Microbial,
    #[serde(rename = "complex")]
    Complex,
    #[serde(rename = "sapient", rename_all = "camelCase")]
    Sapient { tech_level: String, cultural_seed: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MoonSpec {
    pub name: String,
    pub mass_earth: f64,
    pub radius_earth: f64,
    pub orbit_semi_major_axis_km: f64,
    pub composition: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Rings {
    pub inner_radius_km: f64,
    pub outer_radius_km: f64,
    pub composition: String,
}
