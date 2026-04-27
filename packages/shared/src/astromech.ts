import type { WorldSpec } from './worldspec';

type Star = WorldSpec['star'];
type Orbit = WorldSpec['orbit'];

// IAU 2015 Resolution B3 nominal solar and astronomical constants.
const SOLAR_MASS_KG = 1.98847e30;
const SOLAR_RADIUS_M = 6.957e8;
const SOLAR_LUMINOSITY_W = 3.828e26;
const AU_M = 1.495978707e11;
// CODATA/NIST 2018 gravitational constant.
const G = 6.6743e-11;
// CODATA Stefan–Boltzmann constant.
const SIGMA = 5.670374419e-8;
// Wien displacement constant (NIST), in nm*K.
const WIEN_NM_K = 2.897771955e6;
const SOLAR_CONSTANT_W_M2 = 1361;
const EARTH_YEAR_SECONDS = 31_556_952;

export interface StellarProperties {
  mass_kg: number;
  radius_m: number;
  effective_temperature_k: number;
  luminosity_w: number;
  bolometric_flux_at_1au_w_m2: number;
  peak_emission_wavelength_nm: number;
  uv_flux_relative_to_sun: number;
  habitable_zone_inner_au: number;
  habitable_zone_outer_au: number;
  main_sequence_lifetime_gyr: number;
  branch: 'pre-main-sequence' | 'main-sequence' | 'post-main-sequence' | 'sub-stellar';
  secondary?: Omit<StellarProperties, 'secondary' | 'combined_bolometric_flux_at_planet_w_m2'>;
  combined_bolometric_flux_at_planet_w_m2?: number;
}

export interface OrbitalProperties {
  period_seconds: number;
  period_earth_days: number;
  period_earth_years: number;
  mean_orbital_velocity_m_s: number;
  min_distance_au: number;
  max_distance_au: number;
  time_averaged_insolation_w_m2: number;
  solar_day_seconds: number;
}

export interface OrbitalState {
  position_m: [number, number, number];
  velocity_m_s: [number, number, number];
  true_anomaly_rad: number;
  mean_anomaly_rad: number;
  eccentric_anomaly_rad: number;
  current_distance_au: number;
  current_orbital_speed_m_s: number;
  instantaneous_insolation_w_m2: number;
}

export interface MoonOrbitalState {
  name: string;
  semi_major_axis_m: number;
  period_seconds: number;
  mean_velocity_m_s: number;
  hill_sphere_stable: boolean;
  inside_roche_limit: boolean;
  unstable: boolean;
  tidal_heating_power_w: number;
  transit_interval_seconds: number;
  eclipse_interval_seconds: number;
  eclipse_duration_seconds: number;
}

export interface InsolationSample {
  time_seconds: number;
  insolation_w_m2: number;
  sub_stellar_latitude_deg: number;
}

export interface TransitEvent {
  subject: string;
  observer: 'host_planet' | 'star_system_external';
  start_seconds: number;
  duration_seconds: number;
  interval_seconds: number;
}

export interface EclipseEvent {
  moon: string;
  start_seconds: number;
  duration_seconds: number;
}

export interface DerivedState {
  stellar: StellarProperties;
  orbital_properties: OrbitalProperties;
  orbital_state: OrbitalState;
  moon_orbits: MoonOrbitalState[];
  ring_stable: boolean;
  tidal_lock_state: 'free' | 'synchronous' | 'spin-orbit-resonance';
}

interface SpectralParsed {
  classLetter: string;
  subtype: number;
  luminosityClass?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mod2pi = (value: number) => {
  const twoPi = Math.PI * 2;
  let out = value % twoPi;
  if (out < 0) out += twoPi;
  return out;
};

const parseSpectralClass = (spectralClass: string): SpectralParsed => {
  const m = spectralClass.trim().match(/^([OBAFGKMLTYWD])\s*([0-9](?:\.[0-9])?)?\s*([IV]+|D)?/i);
  if (!m) return { classLetter: 'G', subtype: 2, luminosityClass: 'V' };
  return {
    classLetter: m[1].toUpperCase(),
    subtype: clamp(m[2] ? Number.parseFloat(m[2]) : 5, 0, 9),
    luminosityClass: m[3]?.toUpperCase()
  };
};

const classRanges: Record<string, { mass0: number; mass9: number; temp0: number; temp9: number; radius0: number; radius9: number }> = {
  O: { mass0: 60, mass9: 16, temp0: 50000, temp9: 33000, radius0: 15, radius9: 7 },
  B: { mass0: 16, mass9: 2.1, temp0: 30000, temp9: 10500, radius0: 7, radius9: 2.1 },
  A: { mass0: 2.1, mass9: 1.4, temp0: 9800, temp9: 7500, radius0: 2.4, radius9: 1.4 },
  F: { mass0: 1.4, mass9: 1.04, temp0: 7300, temp9: 6000, radius0: 1.4, radius9: 1.15 },
  G: { mass0: 1.04, mass9: 0.8, temp0: 5940, temp9: 5200, radius0: 1.1, radius9: 0.9 },
  K: { mass0: 0.8, mass9: 0.45, temp0: 5200, temp9: 3900, radius0: 0.9, radius9: 0.7 },
  M: { mass0: 0.45, mass9: 0.08, temp0: 3900, temp9: 2400, radius0: 0.7, radius9: 0.12 }
};

const interpSubtype = (a: number, b: number, subtype: number) => a + (b - a) * (subtype / 9);

const deriveStellarSingle = (star: Star): Omit<StellarProperties, 'secondary' | 'combined_bolometric_flux_at_planet_w_m2'> => {
  const parsed = parseSpectralClass(star.spectralClass);
  const isSubstellar = ['L', 'T', 'Y'].includes(parsed.classLetter);

  let massSolar = star.massSolar;
  let radiusSolar = star.massSolar ** 0.8;
  let tempK = 5772;
  let branch: StellarProperties['branch'] = 'main-sequence';

  if (isSubstellar) {
    branch = 'sub-stellar';
    massSolar = clamp(star.massSolar, 0.01, 0.079);
    radiusSolar = 0.1;
    tempK = parsed.classLetter === 'L' ? 1800 : parsed.classLetter === 'T' ? 1100 : 500;
  } else if (classRanges[parsed.classLetter]) {
    const r = classRanges[parsed.classLetter];
    const inferredMass = interpSubtype(r.mass0, r.mass9, parsed.subtype);
    if (!(massSolar > 0)) massSolar = inferredMass;
    radiusSolar = interpSubtype(r.radius0, r.radius9, parsed.subtype);
    tempK = interpSubtype(r.temp0, r.temp9, parsed.subtype);

    const msLife = 10 * massSolar ** -2.5;
    if (parsed.luminosityClass && parsed.luminosityClass !== 'V') {
      branch = 'post-main-sequence';
      radiusSolar *= 8;
      tempK *= 0.75;
    } else if (star.ageGyr < msLife * 0.05 && ['F', 'G', 'K', 'M'].includes(parsed.classLetter)) {
      branch = 'pre-main-sequence';
      radiusSolar *= 1.3;
      tempK *= 0.9;
    } else if (star.ageGyr > msLife) {
      branch = 'post-main-sequence';
      radiusSolar *= 12;
      tempK *= 0.7;
    }
  }

  const luminositySolar = branch === 'main-sequence' ? massSolar ** 3.5 : (radiusSolar ** 2 * (tempK / 5772) ** 4);
  const luminosityW = luminositySolar * SOLAR_LUMINOSITY_W;
  const flux1Au = luminosityW / (4 * Math.PI * AU_M * AU_M);
  const hzInner = Math.sqrt(luminositySolar / 1.107);
  const hzOuter = Math.sqrt(luminositySolar / 0.356);

  return {
    mass_kg: massSolar * SOLAR_MASS_KG,
    radius_m: radiusSolar * SOLAR_RADIUS_M,
    effective_temperature_k: tempK,
    luminosity_w: luminosityW,
    bolometric_flux_at_1au_w_m2: flux1Au,
    peak_emission_wavelength_nm: WIEN_NM_K / tempK,
    uv_flux_relative_to_sun: luminositySolar * (tempK / 5772) ** 1.5,
    habitable_zone_inner_au: hzInner,
    habitable_zone_outer_au: hzOuter,
    main_sequence_lifetime_gyr: 10 * massSolar ** -2.5,
    branch
  };
};

export const deriveStellarProperties = (star: Star, planetSemiMajorAxisAu = 1): StellarProperties => {
  const primary = deriveStellarSingle(star);
  if (!star.binaryCompanion) return primary;

  const companionStar: Star = {
    spectralClass: star.binaryCompanion.spectralClass,
    massSolar: Math.max(0.08, star.massSolar * 0.6),
    luminositySolar: Math.max(0.0001, star.luminositySolar * 0.2),
    ageGyr: star.ageGyr
  };

  const secondary = deriveStellarSingle(companionStar);
  const separationM = star.binaryCompanion.separationAu * AU_M;
  const e = star.binaryCompanion.eccentricity;
  const avgSecondaryDistanceM = separationM * (1 + e * e / 2);
  const primaryFluxAtPlanet = primary.bolometric_flux_at_1au_w_m2 / (planetSemiMajorAxisAu * planetSemiMajorAxisAu);
  const secondaryFluxAtPlanet = secondary.luminosity_w / (4 * Math.PI * avgSecondaryDistanceM * avgSecondaryDistanceM);

  return {
    ...primary,
    secondary,
    combined_bolometric_flux_at_planet_w_m2: primaryFluxAtPlanet + secondaryFluxAtPlanet
  };
};

export const solveKeplerEquation = (meanAnomalyRad: number, eccentricity: number): number => {
  let eAnomaly = eccentricity < 0.8 ? meanAnomalyRad : Math.PI;
  for (let i = 0; i < 15; i += 1) {
    const f = eAnomaly - eccentricity * Math.sin(eAnomaly) - meanAnomalyRad;
    const fp = 1 - eccentricity * Math.cos(eAnomaly);
    const step = f / fp;
    eAnomaly -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return mod2pi(eAnomaly);
};

export const deriveOrbitalProperties = (
  orbit: Orbit,
  starMassKg: number,
  bolometricFluxAt1AuWm2 = SOLAR_CONSTANT_W_M2
): OrbitalProperties => {
  const aM = orbit.semiMajorAxisAu * AU_M;
  const mu = G * starMassKg;
  const period = 2 * Math.PI * Math.sqrt((aM ** 3) / mu);
  const meanVelocity = (2 * Math.PI * aM) / period;
  const minDistance = orbit.semiMajorAxisAu * (1 - orbit.eccentricity);
  const maxDistance = orbit.semiMajorAxisAu * (1 + orbit.eccentricity);
  const avgInsolation = bolometricFluxAt1AuWm2 / (orbit.semiMajorAxisAu ** 2 * Math.sqrt(1 - orbit.eccentricity ** 2));
  const siderealDay = orbit.rotationPeriodHours * 3600;
  const solarDay = Math.abs((1 / siderealDay) - (1 / period)) < 1e-12 ? Number.POSITIVE_INFINITY : 1 / Math.abs((1 / siderealDay) - (1 / period));

  return {
    period_seconds: period,
    period_earth_days: period / 86400,
    period_earth_years: period / EARTH_YEAR_SECONDS,
    mean_orbital_velocity_m_s: meanVelocity,
    min_distance_au: minDistance,
    max_distance_au: maxDistance,
    time_averaged_insolation_w_m2: avgInsolation,
    solar_day_seconds: solarDay
  };
};

export const deriveOrbitalState = (
  orbit: Orbit,
  starMassKg: number,
  timeSeconds: number,
  bolometricFluxAt1AuWm2 = SOLAR_CONSTANT_W_M2
): OrbitalState => {
  const aM = orbit.semiMajorAxisAu * AU_M;
  const e = orbit.eccentricity;
  const mu = G * starMassKg;
  const n = Math.sqrt(mu / (aM ** 3));
  const meanAnomaly = mod2pi(n * timeSeconds);
  const eAnomaly = solveKeplerEquation(meanAnomaly, e);
  const rM = aM * (1 - e * Math.cos(eAnomaly));
  const trueAnomaly = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(eAnomaly / 2), Math.sqrt(1 - e) * Math.cos(eAnomaly / 2));

  const xOrb = aM * (Math.cos(eAnomaly) - e);
  const yOrb = aM * Math.sqrt(1 - e ** 2) * Math.sin(eAnomaly);
  const vxOrb = (-aM * n * Math.sin(eAnomaly)) / (1 - e * Math.cos(eAnomaly));
  const vyOrb = (aM * n * Math.sqrt(1 - e ** 2) * Math.cos(eAnomaly)) / (1 - e * Math.cos(eAnomaly));

  const inc = (orbit.inclinationDeg * Math.PI) / 180;
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);
  const position: [number, number, number] = [xOrb, yOrb * cosI, yOrb * sinI];
  const velocity: [number, number, number] = [vxOrb, vyOrb * cosI, vyOrb * sinI];

  const currentDistanceAu = rM / AU_M;
  const speed = Math.sqrt(vxOrb * vxOrb + vyOrb * vyOrb);

  return {
    position_m: position,
    velocity_m_s: velocity,
    true_anomaly_rad: mod2pi(trueAnomaly),
    mean_anomaly_rad: meanAnomaly,
    eccentric_anomaly_rad: eAnomaly,
    current_distance_au: currentDistanceAu,
    current_orbital_speed_m_s: speed,
    instantaneous_insolation_w_m2: bolometricFluxAt1AuWm2 / (currentDistanceAu ** 2)
  };
};

export const deriveTidalLockState = (
  orbit: Orbit,
  starMassKg: number,
  bodyMassKg = 5.9722e24,
  bodyRadiusM = 6.371e6
): 'free' | 'synchronous' | 'spin-orbit-resonance' => {
  const properties = deriveOrbitalProperties(orbit, starMassKg);
  const ratio = properties.period_seconds / (orbit.rotationPeriodHours * 3600);
  const k2 = 0.3;
  const q = 100;
  const inertia = 0.4 * bodyMassKg * bodyRadiusM ** 2;
  const aM = orbit.semiMajorAxisAu * AU_M;
  const tLock = (inertia * q * aM ** 6) / (3 * G * starMassKg ** 2 * k2 * bodyRadiusM ** 5);

  if (Math.abs(ratio - 1) < 0.05 || tLock < 1e16) return 'synchronous';
  if (Math.abs(ratio - 1.5) < 0.08 || orbit.tidalLock === 'resonant') return 'spin-orbit-resonance';
  return 'free';
};

export const deriveMoonOrbits = (
  moons: WorldSpec['moons'],
  hostBodyMassKg: number,
  hostOrbit: Orbit,
  starMassKg: number,
  hostRadiusM = 6.371e6,
  hostDensityKgM3 = 5514
): MoonOrbitalState[] => {
  const hillRadius = hostOrbit.semiMajorAxisAu * AU_M * (1 - hostOrbit.eccentricity) * (hostBodyMassKg / (3 * starMassKg)) ** (1 / 3);

  return moons.map((moon) => {
    const moonMassKg = moon.massEarth * 5.9722e24;
    const moonRadiusM = moon.radiusEarth * 6.371e6;
    const moonDensity = moonMassKg / ((4 / 3) * Math.PI * moonRadiusM ** 3);
    const aM = moon.orbitSemiMajorAxisKm * 1000;
    const period = 2 * Math.PI * Math.sqrt(aM ** 3 / (G * (hostBodyMassKg + moonMassKg)));
    const meanVelocity = (2 * Math.PI * aM) / period;
    const rocheLimit = 2.44 * hostRadiusM * (hostDensityKgM3 / moonDensity) ** (1 / 3);
    const insideRoche = aM < rocheLimit;
    const stableHill = aM < hillRadius * 0.5;
    const eMoon = Math.max(0.001, hostOrbit.eccentricity * 0.5);
    const n = 2 * Math.PI / period;
    const tidalPower = (21 / 2) * (0.3 / 100) * (G * hostBodyMassKg ** 2 * moonRadiusM ** 5 * n * eMoon ** 2) / (aM ** 6);

    return {
      name: moon.name,
      semi_major_axis_m: aM,
      period_seconds: period,
      mean_velocity_m_s: meanVelocity,
      hill_sphere_stable: stableHill,
      inside_roche_limit: insideRoche,
      unstable: !stableHill || insideRoche,
      tidal_heating_power_w: tidalPower,
      transit_interval_seconds: period,
      eclipse_interval_seconds: period,
      eclipse_duration_seconds: (2 * hostRadiusM) / meanVelocity
    };
  });
};

export const deriveRingStability = (spec: WorldSpec): boolean => {
  if (!spec.rings) return true;
  const hostRadiusM = spec.body.radiusEarth * 6.371e6;
  const hostDensity = spec.body.bulkDensityKgM3;
  const ringDensity = spec.rings.composition === 'ice' ? 900 : spec.rings.composition === 'dust' ? 2500 : 1400;
  const rocheLimitKm = (2.44 * hostRadiusM * (hostDensity / ringDensity) ** (1 / 3)) / 1000;
  return spec.rings.outerRadiusKm <= rocheLimitKm * 1.2;
};

export const computeInsolationCurve = (spec: WorldSpec, samples: number): InsolationSample[] => {
  const stellar = deriveStellarProperties(spec.star);
  const orbital = deriveOrbitalProperties(spec.orbit, stellar.mass_kg, stellar.bolometric_flux_at_1au_w_m2);
  const out: InsolationSample[] = [];
  const count = Math.max(2, samples);

  for (let i = 0; i < count; i += 1) {
    const time = (orbital.period_seconds * i) / (count - 1);
    const state = deriveOrbitalState(spec.orbit, stellar.mass_kg, time, stellar.bolometric_flux_at_1au_w_m2);
    const lock = deriveTidalLockState(spec.orbit, stellar.mass_kg, spec.body.massEarth * 5.9722e24, spec.body.radiusEarth * 6.371e6);
    const subStellarLat = lock === 'synchronous' ? 0 : spec.orbit.axialTiltDeg * Math.sin((2 * Math.PI * time) / orbital.period_seconds);
    out.push({ time_seconds: time, insolation_w_m2: state.instantaneous_insolation_w_m2, sub_stellar_latitude_deg: subStellarLat });
  }

  return out;
};

export const computeTransitWindow = (spec: WorldSpec, observer: 'host_planet' | 'star_system_external'): TransitEvent[] => {
  const stellar = deriveStellarProperties(spec.star);
  const orbital = deriveOrbitalProperties(spec.orbit, stellar.mass_kg, stellar.bolometric_flux_at_1au_w_m2);

  if (observer === 'star_system_external') {
    const duration = ((stellar.radius_m + spec.body.radiusEarth * 6.371e6) / orbital.mean_orbital_velocity_m_s) * 2;
    return [{ subject: 'planet', observer, start_seconds: 0, duration_seconds: duration, interval_seconds: orbital.period_seconds }];
  }

  return deriveMoonOrbits(spec.moons, spec.body.massEarth * 5.9722e24, spec.orbit, stellar.mass_kg, spec.body.radiusEarth * 6.371e6, spec.body.bulkDensityKgM3).map((moon) => ({
    subject: moon.name,
    observer,
    start_seconds: 0,
    duration_seconds: moon.eclipse_duration_seconds,
    interval_seconds: moon.transit_interval_seconds
  }));
};

export const computeEclipseSchedule = (spec: WorldSpec, durationYears: number): EclipseEvent[] => {
  const stellar = deriveStellarProperties(spec.star);
  const moons = deriveMoonOrbits(spec.moons, spec.body.massEarth * 5.9722e24, spec.orbit, stellar.mass_kg, spec.body.radiusEarth * 6.371e6, spec.body.bulkDensityKgM3);
  const horizon = durationYears * EARTH_YEAR_SECONDS;
  const events: EclipseEvent[] = [];

  moons.forEach((moon) => {
    for (let t = 0; t < horizon; t += moon.eclipse_interval_seconds) {
      events.push({ moon: moon.name, start_seconds: t, duration_seconds: moon.eclipse_duration_seconds });
    }
  });

  return events;
};

export const deriveWorldDerivedState = (spec: WorldSpec, timeSeconds: number): DerivedState => {
  const stellar = deriveStellarProperties(spec.star, spec.orbit.semiMajorAxisAu);
  const orbitalProperties = deriveOrbitalProperties(spec.orbit, stellar.mass_kg, stellar.bolometric_flux_at_1au_w_m2);
  const orbitalState = deriveOrbitalState(spec.orbit, stellar.mass_kg, timeSeconds, stellar.bolometric_flux_at_1au_w_m2);
  const moonOrbits = deriveMoonOrbits(spec.moons, spec.body.massEarth * 5.9722e24, spec.orbit, stellar.mass_kg, spec.body.radiusEarth * 6.371e6, spec.body.bulkDensityKgM3);

  return {
    stellar,
    orbital_properties: orbitalProperties,
    orbital_state: orbitalState,
    moon_orbits: moonOrbits,
    ring_stable: deriveRingStability(spec),
    tidal_lock_state: deriveTidalLockState(spec.orbit, stellar.mass_kg, spec.body.massEarth * 5.9722e24, spec.body.radiusEarth * 6.371e6)
  };
};
