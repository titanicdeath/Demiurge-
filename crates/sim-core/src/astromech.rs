use crate::worldspec::{MoonSpec, Orbit, Star, WorldSpec};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

const SOLAR_MASS_KG: f64 = 1.98847e30;
const SOLAR_RADIUS_M: f64 = 6.957e8;
const SOLAR_LUMINOSITY_W: f64 = 3.828e26;
const AU_M: f64 = 1.495978707e11;
const G: f64 = 6.6743e-11;
const WIEN_NM_K: f64 = 2.897771955e6;
const SOLAR_CONSTANT_W_M2: f64 = 1361.0;
const EARTH_YEAR_SECONDS: f64 = 31_556_952.0;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StellarProperties {
    pub mass_kg: f64,
    pub radius_m: f64,
    pub effective_temperature_k: f64,
    pub luminosity_w: f64,
    pub bolometric_flux_at_1au_w_m2: f64,
    pub peak_emission_wavelength_nm: f64,
    pub uv_flux_relative_to_sun: f64,
    pub habitable_zone_inner_au: f64,
    pub habitable_zone_outer_au: f64,
    pub main_sequence_lifetime_gyr: f64,
    pub branch: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub secondary: Option<Box<StellarProperties>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub combined_bolometric_flux_at_planet_w_m2: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct OrbitalProperties {
    pub period_seconds: f64,
    pub period_earth_days: f64,
    pub period_earth_years: f64,
    pub mean_orbital_velocity_m_s: f64,
    pub min_distance_au: f64,
    pub max_distance_au: f64,
    pub time_averaged_insolation_w_m2: f64,
    pub solar_day_seconds: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct OrbitalState {
    pub position_m: [f64; 3],
    pub velocity_m_s: [f64; 3],
    pub true_anomaly_rad: f64,
    pub mean_anomaly_rad: f64,
    pub eccentric_anomaly_rad: f64,
    pub current_distance_au: f64,
    pub current_orbital_speed_m_s: f64,
    pub instantaneous_insolation_w_m2: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MoonOrbitalState {
    pub name: String,
    pub semi_major_axis_m: f64,
    pub period_seconds: f64,
    pub mean_velocity_m_s: f64,
    pub hill_sphere_stable: bool,
    pub inside_roche_limit: bool,
    pub unstable: bool,
    pub tidal_heating_power_w: f64,
    pub transit_interval_seconds: f64,
    pub eclipse_interval_seconds: f64,
    pub eclipse_duration_seconds: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DerivedState {
    pub stellar: StellarProperties,
    pub orbital_properties: OrbitalProperties,
    pub orbital_state: OrbitalState,
    pub moon_orbits: Vec<MoonOrbitalState>,
    pub ring_stable: bool,
    pub tidal_lock_state: String,
}

fn clamp(v: f64, min: f64, max: f64) -> f64 {
    v.max(min).min(max)
}

fn mod2pi(value: f64) -> f64 {
    let two_pi = 2.0 * PI;
    let mut out = value % two_pi;
    if out < 0.0 {
        out += two_pi;
    }
    out
}

fn parse_spectral(st: &str) -> (char, f64, Option<String>) {
    let s = st.trim().to_uppercase();
    let class = s.chars().next().unwrap_or('G');
    let subtype = s
        .chars()
        .nth(1)
        .and_then(|c| c.to_digit(10))
        .map(|v| v as f64)
        .unwrap_or(5.0);
    let lum = if s.contains("III") || s.contains("II") || s.contains('I') {
        Some("III".to_string())
    } else if s.contains('D') {
        Some("D".to_string())
    } else {
        Some("V".to_string())
    };
    (class, clamp(subtype, 0.0, 9.0), lum)
}

fn interp(a: f64, b: f64, subtype: f64) -> f64 {
    a + (b - a) * (subtype / 9.0)
}

fn derive_stellar_single(star: &Star) -> StellarProperties {
    let (class, subtype, lum_class) = parse_spectral(&star.spectral_class);
    let is_substellar = ['L', 'T', 'Y'].contains(&class);

    let mut mass_solar = star.mass_solar;
    let mut radius_solar: f64;
    let mut temp_k: f64;
    let mut branch = "main-sequence".to_string();

    if is_substellar {
        branch = "sub-stellar".to_string();
        mass_solar = clamp(star.mass_solar, 0.01, 0.079);
        radius_solar = 0.1;
        temp_k = match class {
            'L' => 1800.0,
            'T' => 1100.0,
            _ => 500.0,
        };
    } else {
        let (m0, m9, t0, t9, r0, r9) = match class {
            'O' => (60.0, 16.0, 50000.0, 33000.0, 15.0, 7.0),
            'B' => (16.0, 2.1, 30000.0, 10500.0, 7.0, 2.1),
            'A' => (2.1, 1.4, 9800.0, 7500.0, 2.4, 1.4),
            'F' => (1.4, 1.04, 7300.0, 6000.0, 1.4, 1.15),
            'G' => (1.04, 0.8, 5940.0, 5200.0, 1.1, 0.9),
            'K' => (0.8, 0.45, 5200.0, 3900.0, 0.9, 0.7),
            _ => (0.45, 0.08, 3900.0, 2400.0, 0.7, 0.12),
        };
        let inferred_mass = interp(m0, m9, subtype);
        if mass_solar <= 0.0 {
            mass_solar = inferred_mass;
        }
        radius_solar = interp(r0, r9, subtype);
        temp_k = interp(t0, t9, subtype);

        let ms_life = 10.0 * mass_solar.powf(-2.5);
        if lum_class.as_deref() != Some("V") {
            branch = "post-main-sequence".to_string();
            radius_solar *= 8.0;
            temp_k *= 0.75;
        } else if star.age_gyr < ms_life * 0.05 && ['F', 'G', 'K', 'M'].contains(&class) {
            branch = "pre-main-sequence".to_string();
            radius_solar *= 1.3;
            temp_k *= 0.9;
        } else if star.age_gyr > ms_life {
            branch = "post-main-sequence".to_string();
            radius_solar *= 12.0;
            temp_k *= 0.7;
        }
    }

    let luminosity_solar = if branch == "main-sequence" {
        mass_solar.powf(3.5)
    } else {
        radius_solar.powi(2) * (temp_k / 5772.0).powi(4)
    };
    let luminosity_w = luminosity_solar * SOLAR_LUMINOSITY_W;
    let flux_1au = luminosity_w / (4.0 * PI * AU_M * AU_M);

    StellarProperties {
        mass_kg: mass_solar * SOLAR_MASS_KG,
        radius_m: radius_solar * SOLAR_RADIUS_M,
        effective_temperature_k: temp_k,
        luminosity_w,
        bolometric_flux_at_1au_w_m2: flux_1au,
        peak_emission_wavelength_nm: WIEN_NM_K / temp_k,
        uv_flux_relative_to_sun: luminosity_solar * (temp_k / 5772.0).powf(1.5),
        habitable_zone_inner_au: (luminosity_solar / 1.107).sqrt(),
        habitable_zone_outer_au: (luminosity_solar / 0.356).sqrt(),
        main_sequence_lifetime_gyr: 10.0 * mass_solar.powf(-2.5),
        branch,
        secondary: None,
        combined_bolometric_flux_at_planet_w_m2: None,
    }
}

pub fn derive_stellar_properties(star: &Star, planet_semi_major_axis_au: f64) -> StellarProperties {
    let mut primary = derive_stellar_single(star);
    if let Some(binary) = &star.binary_companion {
        let companion = Star {
            spectral_class: binary.spectral_class.clone(),
            mass_solar: star.mass_solar * 0.6,
            luminosity_solar: star.luminosity_solar * 0.2,
            age_gyr: star.age_gyr,
            binary_companion: None,
        };
        let secondary = derive_stellar_single(&companion);
        let sep_m = binary.separation_au * AU_M;
        let avg_dist = sep_m * (1.0 + binary.eccentricity * binary.eccentricity / 2.0);
        let p_flux = primary.bolometric_flux_at_1au_w_m2 / (planet_semi_major_axis_au * planet_semi_major_axis_au);
        let s_flux = secondary.luminosity_w / (4.0 * PI * avg_dist * avg_dist);
        primary.combined_bolometric_flux_at_planet_w_m2 = Some(p_flux + s_flux);
        primary.secondary = Some(Box::new(secondary));
    }
    primary
}

pub fn solve_kepler_equation(mean_anomaly_rad: f64, eccentricity: f64) -> f64 {
    let mut e_anom = if eccentricity < 0.8 { mean_anomaly_rad } else { PI };
    for _ in 0..15 {
        let f = e_anom - eccentricity * e_anom.sin() - mean_anomaly_rad;
        let fp = 1.0 - eccentricity * e_anom.cos();
        let step = f / fp;
        e_anom -= step;
        if step.abs() < 1e-12 {
            break;
        }
    }
    mod2pi(e_anom)
}

pub fn derive_orbital_properties(orbit: &Orbit, star_mass_kg: f64, flux_1au: f64) -> OrbitalProperties {
    let a_m = orbit.semi_major_axis_au * AU_M;
    let mu = G * star_mass_kg;
    let period = 2.0 * PI * (a_m.powi(3) / mu).sqrt();
    let mean_velocity = 2.0 * PI * a_m / period;
    let min_d = orbit.semi_major_axis_au * (1.0 - orbit.eccentricity);
    let max_d = orbit.semi_major_axis_au * (1.0 + orbit.eccentricity);
    let avg_ins = flux_1au / (orbit.semi_major_axis_au.powi(2) * (1.0 - orbit.eccentricity * orbit.eccentricity).sqrt());
    let sidereal_day = orbit.rotation_period_hours * 3600.0;
    let inv = (1.0 / sidereal_day) - (1.0 / period);
    let solar_day = if inv.abs() < 1e-12 { f64::INFINITY } else { 1.0 / inv.abs() };

    OrbitalProperties {
        period_seconds: period,
        period_earth_days: period / 86400.0,
        period_earth_years: period / EARTH_YEAR_SECONDS,
        mean_orbital_velocity_m_s: mean_velocity,
        min_distance_au: min_d,
        max_distance_au: max_d,
        time_averaged_insolation_w_m2: avg_ins,
        solar_day_seconds: solar_day,
    }
}

pub fn derive_orbital_state(orbit: &Orbit, star_mass_kg: f64, time_seconds: f64, flux_1au: f64) -> OrbitalState {
    let a_m = orbit.semi_major_axis_au * AU_M;
    let e = orbit.eccentricity;
    let mu = G * star_mass_kg;
    let n = (mu / a_m.powi(3)).sqrt();
    let mean_anomaly = mod2pi(n * time_seconds);
    let e_anomaly = solve_kepler_equation(mean_anomaly, e);
    let r_m = a_m * (1.0 - e * e_anomaly.cos());
    let true_anomaly = 2.0 * (((1.0 + e).sqrt() * (e_anomaly / 2.0).sin()).atan2((1.0 - e).sqrt() * (e_anomaly / 2.0).cos()));

    let x_orb = a_m * (e_anomaly.cos() - e);
    let y_orb = a_m * (1.0 - e * e).sqrt() * e_anomaly.sin();
    let vx_orb = (-a_m * n * e_anomaly.sin()) / (1.0 - e * e_anomaly.cos());
    let vy_orb = (a_m * n * (1.0 - e * e).sqrt() * e_anomaly.cos()) / (1.0 - e * e_anomaly.cos());

    let inc = orbit.inclination_deg.to_radians();
    let cos_i = inc.cos();
    let sin_i = inc.sin();
    let position = [x_orb, y_orb * cos_i, y_orb * sin_i];
    let velocity = [vx_orb, vy_orb * cos_i, vy_orb * sin_i];
    let current_au = r_m / AU_M;
    let speed = (vx_orb * vx_orb + vy_orb * vy_orb).sqrt();

    OrbitalState {
        position_m: position,
        velocity_m_s: velocity,
        true_anomaly_rad: mod2pi(true_anomaly),
        mean_anomaly_rad: mean_anomaly,
        eccentric_anomaly_rad: e_anomaly,
        current_distance_au: current_au,
        current_orbital_speed_m_s: speed,
        instantaneous_insolation_w_m2: flux_1au / current_au.powi(2),
    }
}

pub fn derive_tidal_lock_state(orbit: &Orbit, star_mass_kg: f64, body_mass_kg: f64, body_radius_m: f64) -> String {
    let properties = derive_orbital_properties(orbit, star_mass_kg, SOLAR_CONSTANT_W_M2);
    let ratio = properties.period_seconds / (orbit.rotation_period_hours * 3600.0);
    let k2 = 0.3;
    let q = 100.0;
    let inertia = 0.4 * body_mass_kg * body_radius_m.powi(2);
    let a_m = orbit.semi_major_axis_au * AU_M;
    let t_lock = (inertia * q * a_m.powi(6)) / (3.0 * G * star_mass_kg.powi(2) * k2 * body_radius_m.powi(5));

    if (ratio - 1.0).abs() < 0.05 || t_lock < 1e16 {
        "synchronous".to_string()
    } else if (ratio - 1.5).abs() < 0.08 || orbit.tidal_lock == "resonant" {
        "spin-orbit-resonance".to_string()
    } else {
        "free".to_string()
    }
}

pub fn derive_moon_orbits(
    moons: &[MoonSpec],
    host_body_mass_kg: f64,
    host_orbit: &Orbit,
    star_mass_kg: f64,
    host_radius_m: f64,
    host_density_kg_m3: f64,
) -> Vec<MoonOrbitalState> {
    let hill = host_orbit.semi_major_axis_au * AU_M * (1.0 - host_orbit.eccentricity) * (host_body_mass_kg / (3.0 * star_mass_kg)).powf(1.0 / 3.0);

    moons
        .iter()
        .map(|moon| {
            let moon_mass = moon.mass_earth * 5.9722e24;
            let moon_radius = moon.radius_earth * 6.371e6;
            let moon_density = moon_mass / ((4.0 / 3.0) * PI * moon_radius.powi(3));
            let a_m = moon.orbit_semi_major_axis_km * 1000.0;
            let period = 2.0 * PI * (a_m.powi(3) / (G * (host_body_mass_kg + moon_mass))).sqrt();
            let vel = 2.0 * PI * a_m / period;
            let roche = 2.44 * host_radius_m * (host_density_kg_m3 / moon_density).powf(1.0 / 3.0);
            let inside_roche = a_m < roche;
            let stable_hill = a_m < hill * 0.5;
            let e_moon = host_orbit.eccentricity.max(0.001) * 0.5;
            let n = 2.0 * PI / period;
            let tidal = (21.0 / 2.0) * (0.3 / 100.0) * (G * host_body_mass_kg.powi(2) * moon_radius.powi(5) * n * e_moon.powi(2)) / a_m.powi(6);

            MoonOrbitalState {
                name: moon.name.clone(),
                semi_major_axis_m: a_m,
                period_seconds: period,
                mean_velocity_m_s: vel,
                hill_sphere_stable: stable_hill,
                inside_roche_limit: inside_roche,
                unstable: !stable_hill || inside_roche,
                tidal_heating_power_w: tidal,
                transit_interval_seconds: period,
                eclipse_interval_seconds: period,
                eclipse_duration_seconds: (2.0 * host_radius_m) / vel,
            }
        })
        .collect()
}

pub fn derive_ring_stability(spec: &WorldSpec) -> bool {
    if let Some(rings) = &spec.rings {
        let host_radius_m = spec.body.radius_earth * 6.371e6;
        let host_density = spec.body.bulk_density_kg_m3;
        let ring_density = if rings.composition == "ice" { 900.0 } else if rings.composition == "dust" { 2500.0 } else { 1400.0 };
        let roche_km = (2.44 * host_radius_m * (host_density / ring_density).powf(1.0 / 3.0)) / 1000.0;
        rings.outer_radius_km <= roche_km * 1.2
    } else {
        true
    }
}

pub fn derive_world_derived_state(spec: &WorldSpec, time_seconds: f64) -> DerivedState {
    let stellar = derive_stellar_properties(&spec.star, spec.orbit.semi_major_axis_au);
    let orbital_properties = derive_orbital_properties(&spec.orbit, stellar.mass_kg, stellar.bolometric_flux_at_1au_w_m2);
    let orbital_state = derive_orbital_state(&spec.orbit, stellar.mass_kg, time_seconds, stellar.bolometric_flux_at_1au_w_m2);
    let moon_orbits = derive_moon_orbits(
        &spec.moons,
        spec.body.mass_earth * 5.9722e24,
        &spec.orbit,
        stellar.mass_kg,
        spec.body.radius_earth * 6.371e6,
        spec.body.bulk_density_kg_m3,
    );
    let tidal_lock_state = derive_tidal_lock_state(
        &spec.orbit,
        stellar.mass_kg,
        spec.body.mass_earth * 5.9722e24,
        spec.body.radius_earth * 6.371e6,
    );

    DerivedState {
        stellar,
        orbital_properties,
        orbital_state,
        moon_orbits,
        ring_stable: derive_ring_stability(spec),
        tidal_lock_state,
    }
}
