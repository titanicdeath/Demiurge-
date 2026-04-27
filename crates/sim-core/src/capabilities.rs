use crate::worldspec::{Atmosphere, Hydrosphere, Life, WorldSpec};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorldCapabilities {
    pub has_atmosphere: bool,
    pub atmosphere_thickness: String,
    pub surface_liquid: String,
    pub has_ocean_layer: String,
    pub tectonic_mode: String,
    pub has_magnetosphere: bool,
    pub life_present: String,
    pub tidal_lock_state: String,
    pub temperature_regime: String,
    pub habitability_class: String,
}

fn derive_atmosphere_thickness(spec: &WorldSpec) -> String {
    match &spec.atmosphere {
        Atmosphere::None => "none".to_string(),
        Atmosphere::Present { pressure_bar, .. } => {
            if *pressure_bar < 0.001 {
                "trace".to_string()
            } else if *pressure_bar < 0.2 {
                "thin".to_string()
            } else if *pressure_bar < 2.0 {
                "standard".to_string()
            } else if *pressure_bar < 10.0 {
                "thick".to_string()
            } else {
                "crushing".to_string()
            }
        }
    }
}

fn derive_surface_liquid(spec: &WorldSpec) -> String {
    let has_water = spec.volatiles.get("H2O").copied().unwrap_or(0.0) > 1e19;
    let has_methane = spec.volatiles.get("CH4").copied().unwrap_or(0.0) > 1e16;

    match spec.hydrosphere {
        Hydrosphere::None => "none".to_string(),
        Hydrosphere::WaterOcean { .. } | Hydrosphere::MethaneLakes { .. } if has_water && has_methane => {
            "mixed".to_string()
        }
        Hydrosphere::WaterOcean { .. } => "water".to_string(),
        Hydrosphere::MethaneLakes { .. } => "methane".to_string(),
        Hydrosphere::Brine { .. } => "brine".to_string(),
        Hydrosphere::Lava { .. } => "lava".to_string(),
    }
}

fn has_subsurface_ocean_signal(spec: &WorldSpec) -> bool {
    if spec.body.tectonics != "cryovolcanic" {
        return false;
    }
    spec.body.composition.crust.contains("ice")
        || spec.volatiles.get("H2O").copied().unwrap_or(0.0) > 1e20
}

fn derive_ocean_layer(spec: &WorldSpec) -> String {
    let surface = !matches!(spec.hydrosphere, Hydrosphere::None);
    let subsurface = has_subsurface_ocean_signal(spec);
    if surface && subsurface {
        "both".to_string()
    } else if surface {
        "surface".to_string()
    } else if subsurface {
        "subsurface".to_string()
    } else {
        "none".to_string()
    }
}

fn derive_tidal_lock_state(spec: &WorldSpec) -> String {
    match spec.orbit.tidal_lock.as_str() {
        "primary" => "synchronous".to_string(),
        "resonant" => "spin-orbit-resonance".to_string(),
        _ => "free".to_string(),
    }
}

fn derive_temperature_regime(spec: &WorldSpec) -> String {
    let insolation = spec.star.luminosity_solar / (spec.orbit.semi_major_axis_au * spec.orbit.semi_major_axis_au);
    if insolation < 0.15 {
        "cryogenic".to_string()
    } else if insolation < 0.65 {
        "cold".to_string()
    } else if insolation < 1.5 {
        "temperate".to_string()
    } else if insolation < 3.5 {
        "hot".to_string()
    } else {
        "extreme".to_string()
    }
}

fn derive_habitability_class(
    spec: &WorldSpec,
    surface_liquid: &str,
    has_ocean_layer: &str,
    temperature_regime: &str,
    has_atmosphere: bool,
) -> String {
    if matches!(spec.life, Life::Sapient { .. } | Life::Complex) {
        return "lush".to_string();
    }
    if !has_atmosphere && surface_liquid == "none" {
        return "sterile".to_string();
    }
    if temperature_regime == "extreme" && surface_liquid == "none" {
        return "sterile".to_string();
    }
    if temperature_regime == "cryogenic" && has_ocean_layer == "none" {
        return "sterile".to_string();
    }
    if matches!(spec.life, Life::Microbial) || has_ocean_layer == "subsurface" {
        return "extremophile-only".to_string();
    }
    if surface_liquid == "water" || surface_liquid == "brine" {
        if temperature_regime == "temperate" || temperature_regime == "cold" {
            return "habitable".to_string();
        }
        return "marginal".to_string();
    }
    if surface_liquid == "methane" || surface_liquid == "mixed" {
        return "marginal".to_string();
    }
    "extremophile-only".to_string()
}

pub fn derive_capabilities(spec: &WorldSpec) -> WorldCapabilities {
    let has_atmosphere = matches!(spec.atmosphere, Atmosphere::Present { .. });
    let atmosphere_thickness = derive_atmosphere_thickness(spec);
    let surface_liquid = derive_surface_liquid(spec);
    let has_ocean_layer = derive_ocean_layer(spec);
    let temperature_regime = derive_temperature_regime(spec);

    let life_present = match spec.life {
        Life::None => "none",
        Life::Microbial => "microbial",
        Life::Complex => "complex",
        Life::Sapient { .. } => "sapient",
    }
    .to_string();

    WorldCapabilities {
        has_atmosphere,
        atmosphere_thickness,
        surface_liquid: surface_liquid.clone(),
        has_ocean_layer: has_ocean_layer.clone(),
        tectonic_mode: spec.body.tectonics.clone(),
        has_magnetosphere: spec.body.magnetic_field_microtesla >= 5.0,
        life_present,
        tidal_lock_state: derive_tidal_lock_state(spec),
        temperature_regime: temperature_regime.clone(),
        habitability_class: derive_habitability_class(
            spec,
            &surface_liquid,
            &has_ocean_layer,
            &temperature_regime,
            has_atmosphere,
        ),
    }
}
