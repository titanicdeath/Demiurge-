import { worldSpecSchema, type Archetype, type WorldSpec } from './worldspec';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

type TemperatureMacro = 'frigid' | 'cold' | 'temperate' | 'warm' | 'inferno';
type GravityMacro = 'low' | 'standard' | 'high';
type AgeMacro = 'young' | 'mature' | 'ancient';
type WeatherMacro = 'calm' | 'active' | 'extreme';

type RawWorldSpecOverrides = Omit<DeepPartial<Omit<WorldSpec, 'seed'>>, 'moons'> & {
  moons?: WorldSpec['moons'];
};

export type WorldSpecOverrides = RawWorldSpecOverrides & {
  temperature?: TemperatureMacro;
  gravity?: GravityMacro;
  age?: AgeMacro;
  weather?: WeatherMacro;
  moons?: number | WorldSpec['moons'];
};

export interface PresetInput {
  archetype: Archetype;
  seed: string;
  overrides?: WorldSpecOverrides;
}

const baseByArchetype: Record<Archetype, Omit<WorldSpec, 'seed'>> = {
  'earth-analog': {
    schemaVersion: 1,
    star: { spectralClass: 'G2V', massSolar: 1, luminositySolar: 1, ageGyr: 4.6 },
    orbit: { semiMajorAxisAu: 1, eccentricity: 0.0167, inclinationDeg: 0, axialTiltDeg: 23.4, rotationPeriodHours: 24, tidalLock: 'none' },
    body: { massEarth: 1, radiusEarth: 1, bulkDensityKgM3: 5514, tectonics: 'plate', composition: { core: 'iron-nickel', mantle: 'silicate', crust: 'basalt+granite' }, magneticFieldMicrotesla: 50 },
    volatiles: { H2O: 1.4e21, CO2: 3.2e15, N2: 4e18, CH4: 5e14 },
    surface: { elevationHint: 'mixed', dominantMaterials: ['silicate rock', 'water ice'], impactHistory: 'moderate' },
    atmosphere: { kind: 'present', pressureBar: 1.01, composition: { N2: 0.78, O2: 0.21, Ar: 0.009, CO2: 0.0004 } },
    hydrosphere: { kind: 'water-ocean', coverage: 0.71, salinityPsu: 35 },
    life: { kind: 'complex' },
    moons: [{ name: 'Luna', massEarth: 0.0123, radiusEarth: 0.273, orbitSemiMajorAxisKm: 384400, composition: 'rocky' }]
  },
  'mars-like': {
    schemaVersion: 1,
    star: { spectralClass: 'G2V', massSolar: 1, luminositySolar: 1, ageGyr: 4.6 },
    orbit: { semiMajorAxisAu: 1.52, eccentricity: 0.093, inclinationDeg: 1.85, axialTiltDeg: 25.2, rotationPeriodHours: 24.6, tidalLock: 'none' },
    body: { massEarth: 0.107, radiusEarth: 0.532, bulkDensityKgM3: 3933, tectonics: 'inert', composition: { core: 'iron-sulfur', mantle: 'silicate', crust: 'basaltic' }, magneticFieldMicrotesla: 0.1 },
    volatiles: { H2O: 2e19, CO2: 2.5e16, N2: 2e15 },
    surface: { elevationHint: 'rugged', dominantMaterials: ['basalt', 'iron oxides', 'water ice'], impactHistory: 'heavy' },
    atmosphere: { kind: 'present', pressureBar: 0.006, composition: { CO2: 0.95, N2: 0.027, Ar: 0.016 } },
    hydrosphere: { kind: 'none' },
    life: { kind: 'none' },
    moons: [
      { name: 'Phobos', massEarth: 1.8e-8, radiusEarth: 0.0017, orbitSemiMajorAxisKm: 9376, composition: 'rocky' },
      { name: 'Deimos', massEarth: 2.4e-9, radiusEarth: 0.00098, orbitSemiMajorAxisKm: 23463, composition: 'rocky' }
    ]
  },
  'venus-like': {
    schemaVersion: 1,
    star: { spectralClass: 'G2V', massSolar: 1, luminositySolar: 1, ageGyr: 4.6 },
    orbit: { semiMajorAxisAu: 0.72, eccentricity: 0.007, inclinationDeg: 3.4, axialTiltDeg: 177.4, rotationPeriodHours: 5832, tidalLock: 'none' },
    body: { massEarth: 0.815, radiusEarth: 0.949, bulkDensityKgM3: 5243, tectonics: 'stagnant-lid', composition: { core: 'iron', mantle: 'silicate', crust: 'basaltic' }, magneticFieldMicrotesla: 0 },
    volatiles: { CO2: 4.8e20, N2: 1.8e19, SO2: 1e16 },
    surface: { elevationHint: 'smooth', dominantMaterials: ['basalt', 'sulfur compounds'], impactHistory: 'quiet' },
    atmosphere: { kind: 'present', pressureBar: 92, composition: { CO2: 0.965, N2: 0.035, SO2: 0.00015 } },
    hydrosphere: { kind: 'none' },
    life: { kind: 'none' },
    moons: []
  },
  'titan-like': {
    schemaVersion: 1,
    star: { spectralClass: 'G2V', massSolar: 1, luminositySolar: 1, ageGyr: 4.2 },
    orbit: { semiMajorAxisAu: 9.5, eccentricity: 0.03, inclinationDeg: 0.3, axialTiltDeg: 0.3, rotationPeriodHours: 382.7, tidalLock: 'primary' },
    body: { massEarth: 0.0225, radiusEarth: 0.404, bulkDensityKgM3: 1880, tectonics: 'cryovolcanic', composition: { core: 'rock', mantle: 'high-pressure ice', crust: 'water ice' }, magneticFieldMicrotesla: 0 },
    volatiles: { CH4: 1.4e17, N2: 4.3e18, H2O: 1e21 },
    surface: { elevationHint: 'mixed', dominantMaterials: ['water ice', 'tholins'], impactHistory: 'moderate' },
    atmosphere: { kind: 'present', pressureBar: 1.45, composition: { N2: 0.95, CH4: 0.05 } },
    hydrosphere: { kind: 'methane-lakes', coverage: 0.02 },
    life: { kind: 'none' },
    moons: []
  },
  'europa-like': {
    schemaVersion: 1,
    star: { spectralClass: 'G2V', massSolar: 1, luminositySolar: 1, ageGyr: 4.5 },
    orbit: { semiMajorAxisAu: 5.2, eccentricity: 0.01, inclinationDeg: 0.47, axialTiltDeg: 0.1, rotationPeriodHours: 85.2, tidalLock: 'primary' },
    body: { massEarth: 0.008, radiusEarth: 0.245, bulkDensityKgM3: 3010, tectonics: 'cryovolcanic', composition: { core: 'iron', mantle: 'silicate', crust: 'water ice' }, magneticFieldMicrotesla: 0 },
    volatiles: { H2O: 2.8e21, O2: 1e13 },
    surface: { elevationHint: 'smooth', dominantMaterials: ['water ice', 'salts'], impactHistory: 'quiet' },
    atmosphere: { kind: 'present', pressureBar: 1e-11, composition: { O2: 1 } },
    hydrosphere: { kind: 'brine', coverage: 1, salinityPsu: 80 },
    life: { kind: 'microbial' },
    moons: []
  },
  'airless-rockball': {
    schemaVersion: 1,
    star: { spectralClass: 'K5V', massSolar: 0.7, luminositySolar: 0.2, ageGyr: 6 },
    orbit: { semiMajorAxisAu: 0.4, eccentricity: 0.08, inclinationDeg: 2.2, axialTiltDeg: 2, rotationPeriodHours: 500, tidalLock: 'none' },
    body: { massEarth: 0.2, radiusEarth: 0.55, bulkDensityKgM3: 4200, tectonics: 'inert', composition: { core: 'metal-rich', mantle: 'silicate', crust: 'anorthosite' }, magneticFieldMicrotesla: 0 },
    volatiles: { H2O: 1e15, Na: 1e14 },
    surface: { elevationHint: 'rugged', dominantMaterials: ['regolith', 'basalt'], impactHistory: 'heavy' },
    atmosphere: { kind: 'none' },
    hydrosphere: { kind: 'none' },
    life: { kind: 'none' },
    moons: []
  },
  'tide-locked-m-dwarf-desert': {
    schemaVersion: 1,
    star: { spectralClass: 'M4V', massSolar: 0.2, luminositySolar: 0.008, ageGyr: 7 },
    orbit: { semiMajorAxisAu: 0.07, eccentricity: 0.02, inclinationDeg: 0, axialTiltDeg: 0.5, rotationPeriodHours: 240, tidalLock: 'primary' },
    body: { massEarth: 2.4, radiusEarth: 1.3, bulkDensityKgM3: 6100, tectonics: 'episodic', composition: { core: 'iron', mantle: 'silicate', crust: 'basaltic' }, magneticFieldMicrotesla: 8 },
    volatiles: { H2O: 2e20, CO2: 4e18, N2: 8e18 },
    surface: { elevationHint: 'mixed', dominantMaterials: ['silicate dust', 'evaporites'], impactHistory: 'moderate' },
    atmosphere: { kind: 'present', pressureBar: 0.4, composition: { N2: 0.8, CO2: 0.19, H2O: 0.01 } },
    hydrosphere: { kind: 'none' },
    life: { kind: 'none' },
    moons: [],
    rings: { innerRadiusKm: 60000, outerRadiusKm: 110000, composition: 'dust' }
  },
  'super-earth-temperate': {
    schemaVersion: 1,
    star: { spectralClass: 'K2V', massSolar: 0.82, luminositySolar: 0.39, ageGyr: 6.8 },
    orbit: { semiMajorAxisAu: 0.66, eccentricity: 0.03, inclinationDeg: 1.2, axialTiltDeg: 18, rotationPeriodHours: 30, tidalLock: 'none' },
    body: { massEarth: 2.1, radiusEarth: 1.28, bulkDensityKgM3: 5600, tectonics: 'episodic', composition: { core: 'iron-nickel', mantle: 'silicate', crust: 'basalt+granite' }, magneticFieldMicrotesla: 72 },
    volatiles: { H2O: 2.8e21, CO2: 1.1e17, N2: 8e18, CH4: 2e14 },
    surface: { elevationHint: 'mixed', dominantMaterials: ['silicate rock', 'water ice'], impactHistory: 'moderate' },
    atmosphere: { kind: 'present', pressureBar: 1.8, composition: { N2: 0.76, O2: 0.2, CO2: 0.02, Ar: 0.01 } },
    hydrosphere: { kind: 'water-ocean', coverage: 0.78, salinityPsu: 38 },
    life: { kind: 'complex' },
    moons: [{ name: 'Thalassa', massEarth: 0.02, radiusEarth: 0.31, orbitSemiMajorAxisKm: 460000, composition: 'rocky' }]
  },
  'ocean-world': {
    schemaVersion: 1,
    star: { spectralClass: 'K6V', massSolar: 0.7, luminositySolar: 0.17, ageGyr: 5.4 },
    orbit: { semiMajorAxisAu: 0.43, eccentricity: 0.01, inclinationDeg: 0.4, axialTiltDeg: 9, rotationPeriodHours: 19, tidalLock: 'none' },
    body: { massEarth: 1.4, radiusEarth: 1.16, bulkDensityKgM3: 4700, tectonics: 'stagnant-lid', composition: { core: 'iron', mantle: 'hydrated silicate', crust: 'high-pressure ice + oceanic crust' }, magneticFieldMicrotesla: 24 },
    volatiles: { H2O: 7.5e21, CO2: 1.5e17, N2: 3.2e18, CH4: 1.1e16 },
    surface: { elevationHint: 'smooth', dominantMaterials: ['global ocean', 'water ice'], impactHistory: 'quiet' },
    atmosphere: { kind: 'present', pressureBar: 2.4, composition: { N2: 0.69, H2O: 0.17, CO2: 0.08, CH4: 0.06 } },
    hydrosphere: { kind: 'water-ocean', coverage: 1, salinityPsu: 42 },
    life: { kind: 'microbial' },
    moons: []
  },
  'iron-world': {
    schemaVersion: 1,
    star: { spectralClass: 'K1V', massSolar: 0.79, luminositySolar: 0.35, ageGyr: 7.2 },
    orbit: { semiMajorAxisAu: 0.09, eccentricity: 0.15, inclinationDeg: 4.1, axialTiltDeg: 0.6, rotationPeriodHours: 58, tidalLock: 'resonant' },
    body: { massEarth: 0.35, radiusEarth: 0.5, bulkDensityKgM3: 7100, tectonics: 'inert', composition: { core: 'iron-rich', mantle: 'thin silicate', crust: 'basaltic regolith' }, magneticFieldMicrotesla: 2.8 },
    volatiles: { Na: 2.2e15, K: 8.1e14 },
    surface: { elevationHint: 'rugged', dominantMaterials: ['metal-rich regolith', 'basalt'], impactHistory: 'heavy' },
    atmosphere: { kind: 'none' },
    hydrosphere: { kind: 'none' },
    life: { kind: 'none' },
    moons: []
  },
  'volcanic-moon': {
    schemaVersion: 1,
    star: { spectralClass: 'G3V', massSolar: 0.97, luminositySolar: 0.92, ageGyr: 3.9 },
    orbit: { semiMajorAxisAu: 5.5, eccentricity: 0.02, inclinationDeg: 0.1, axialTiltDeg: 0.2, rotationPeriodHours: 42.5, tidalLock: 'primary' },
    body: { massEarth: 0.015, radiusEarth: 0.285, bulkDensityKgM3: 3520, tectonics: 'episodic', composition: { core: 'iron-sulfide', mantle: 'silicate', crust: 'sulfur-rich basalt' }, magneticFieldMicrotesla: 0 },
    volatiles: { SO2: 2.2e16, S2: 9e14, CO2: 2.5e13 },
    surface: { elevationHint: 'rugged', dominantMaterials: ['sulfur frost', 'basaltic lava'], impactHistory: 'quiet' },
    atmosphere: { kind: 'present', pressureBar: 0.0003, composition: { SO2: 0.93, S2: 0.06, NaCl: 0.01 } },
    hydrosphere: { kind: 'lava', coverage: 0.09 },
    life: { kind: 'none' },
    moons: []
  },
  'm4-test-planet': {
    schemaVersion: 1,
    star: { spectralClass: 'G2V', massSolar: 1, luminositySolar: 1, ageGyr: 4.6 },
    orbit: { semiMajorAxisAu: 1, eccentricity: 0.01, inclinationDeg: 0.5, axialTiltDeg: 23.4, rotationPeriodHours: 24, tidalLock: 'none' },
    body: { massEarth: 1, radiusEarth: 1, bulkDensityKgM3: 5514, tectonics: 'plate', composition: { core: 'iron-nickel', mantle: 'silicate', crust: 'basalt+granite' }, magneticFieldMicrotesla: 50 },
    volatiles: { H2O: 1.4e21, CO2: 3.2e15, N2: 4e18 },
    surface: { elevationHint: 'mixed', dominantMaterials: ['silicate rock'], impactHistory: 'moderate' },
    atmosphere: { kind: 'present', pressureBar: 1.01, composition: { N2: 0.78, O2: 0.21, Ar: 0.009, CO2: 0.0004 } },
    hydrosphere: { kind: 'water-ocean', coverage: 0.7, salinityPsu: 35 },
    life: { kind: 'none' },
    moons: []
  },
  'cold-rockball': {
    schemaVersion: 1,
    star: { spectralClass: 'M0V', massSolar: 0.55, luminositySolar: 0.07, ageGyr: 8.5 },
    orbit: { semiMajorAxisAu: 42, eccentricity: 0.24, inclinationDeg: 7.1, axialTiltDeg: 57, rotationPeriodHours: 153, tidalLock: 'none' },
    body: { massEarth: 0.003, radiusEarth: 0.18, bulkDensityKgM3: 1850, tectonics: 'inert', composition: { core: 'rock-ice mix', mantle: 'water/ammonia ice', crust: 'nitrogen+methane ice' }, magneticFieldMicrotesla: 0 },
    volatiles: { N2: 7e17, CH4: 2.4e17, CO: 8e15, H2O: 5e19 },
    surface: { elevationHint: 'smooth', dominantMaterials: ['nitrogen ice', 'methane ice', 'tholins'], impactHistory: 'heavy' },
    atmosphere: { kind: 'present', pressureBar: 0.00001, composition: { N2: 0.97, CH4: 0.03 } },
    hydrosphere: { kind: 'none' },
    life: { kind: 'none' },
    moons: []
  }
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const mergeDeep = <T extends Record<string, unknown>>(base: T, overrides?: DeepPartial<T>): T => {
  if (!overrides) return structuredClone(base);
  const out: Record<string, unknown> = structuredClone(base);
  for (const [k, v] of Object.entries(overrides)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = mergeDeep(out[k] as Record<string, unknown>, v as DeepPartial<Record<string, unknown>>);
    } else {
      out[k] = v as unknown;
    }
  }
  return out as T;
};

const makeSyntheticMoon = (index: number): WorldSpec['moons'][number] => ({
  name: `Moon-${index + 1}`,
  massEarth: 0.002 + index * 0.0005,
  radiusEarth: 0.08 + index * 0.01,
  orbitSemiMajorAxisKm: 160000 + index * 90000,
  composition: index % 2 === 0 ? 'rocky' : 'icy'
});

const applyTemperatureMacro = (spec: Omit<WorldSpec, 'seed'>, macro: TemperatureMacro): Omit<WorldSpec, 'seed'> => {
  const next = structuredClone(spec);
  const factorByMacro: Record<TemperatureMacro, number> = { frigid: 1.6, cold: 1.2, temperate: 1, warm: 0.8, inferno: 0.55 };
  next.orbit.semiMajorAxisAu *= factorByMacro[macro];

  if (next.hydrosphere.kind === 'methane-lakes') {
    next.hydrosphere.coverage = macro === 'warm' || macro === 'inferno' ? clamp(next.hydrosphere.coverage * 0.4, 0.003, 1) : next.hydrosphere.coverage;
    if (next.atmosphere.kind === 'present' && (macro === 'warm' || macro === 'inferno')) {
      next.atmosphere.pressureBar *= 1.1;
      next.atmosphere.composition.CH4 = clamp((next.atmosphere.composition.CH4 ?? 0.05) * 0.65, 0.005, 1);
      next.atmosphere.composition.N2 = clamp((next.atmosphere.composition.N2 ?? 0.9) + 0.02, 0, 1);
    }
  }

  if (next.hydrosphere.kind === 'water-ocean') {
    if (macro === 'frigid') {
      next.hydrosphere.coverage = clamp(next.hydrosphere.coverage * 0.85, 0, 1);
    } else if (macro === 'warm' || macro === 'inferno') {
      next.hydrosphere.coverage = clamp(next.hydrosphere.coverage * 0.95, 0, 1);
      if (next.atmosphere.kind === 'present') {
        next.atmosphere.composition.H2O = (next.atmosphere.composition.H2O ?? 0) + 0.03;
      }
    }
  }

  if (macro === 'inferno' && next.hydrosphere.kind === 'none') {
    next.hydrosphere = { kind: 'lava', coverage: 0.04 };
  }

  return next;
};

const applyGravityMacro = (spec: Omit<WorldSpec, 'seed'>, macro: GravityMacro): Omit<WorldSpec, 'seed'> => {
  if (macro === 'standard') return spec;
  const next = structuredClone(spec);
  if (macro === 'high') {
    next.body.massEarth *= 1.4;
    next.body.radiusEarth *= 1.12;
    next.body.bulkDensityKgM3 *= 1.08;
    if (next.atmosphere.kind === 'present') next.atmosphere.pressureBar *= 1.35;
  } else {
    next.body.massEarth *= 0.72;
    next.body.radiusEarth *= 0.9;
    next.body.bulkDensityKgM3 *= 0.94;
    if (next.atmosphere.kind === 'present') next.atmosphere.pressureBar *= 0.7;
  }
  return next;
};

const applyAgeMacro = (spec: Omit<WorldSpec, 'seed'>, macro: AgeMacro): Omit<WorldSpec, 'seed'> => {
  const next = structuredClone(spec);
  if (macro === 'young') {
    next.star.ageGyr = clamp(next.star.ageGyr * 0.45, 0.2, 13.5);
    next.surface.impactHistory = 'moderate';
  } else if (macro === 'mature') {
    next.star.ageGyr = clamp(next.star.ageGyr, 0.2, 13.5);
  } else {
    next.star.ageGyr = clamp(next.star.ageGyr * 1.35, 0.2, 13.5);
    next.surface.impactHistory = 'heavy';
  }
  return next;
};

const applyWeatherMacro = (spec: Omit<WorldSpec, 'seed'>, macro: WeatherMacro): Omit<WorldSpec, 'seed'> => {
  const next = structuredClone(spec);
  const eccentricityFactor: Record<WeatherMacro, number> = { calm: 0.6, active: 1, extreme: 1.6 };
  const tiltFactor: Record<WeatherMacro, number> = { calm: 0.7, active: 1, extreme: 1.5 };
  next.orbit.eccentricity = clamp(next.orbit.eccentricity * eccentricityFactor[macro], 0, 0.9);
  next.orbit.axialTiltDeg = clamp(next.orbit.axialTiltDeg * tiltFactor[macro], 0, 180);
  if (next.atmosphere.kind === 'present') {
    const pressureFactor: Record<WeatherMacro, number> = { calm: 0.95, active: 1, extreme: 1.15 };
    next.atmosphere.pressureBar *= pressureFactor[macro];
  }
  return next;
};

const applyMoonMacro = (spec: Omit<WorldSpec, 'seed'>, moonCount: number): Omit<WorldSpec, 'seed'> => {
  const next = structuredClone(spec);
  const target = Math.max(0, Math.floor(moonCount));
  if (next.moons.length >= target) {
    next.moons = next.moons.slice(0, target);
    return next;
  }
  const moons = [...next.moons];
  while (moons.length < target) {
    moons.push(makeSyntheticMoon(moons.length));
  }
  next.moons = moons;
  return next;
};

const splitOverrides = (overrides?: WorldSpecOverrides) => {
  if (!overrides) return { raw: undefined, temperature: undefined, gravity: undefined, age: undefined, weather: undefined, moons: undefined };
  const { temperature, gravity, age, weather, moons, ...raw } = overrides;
  const rawWithMoons: RawWorldSpecOverrides = Array.isArray(moons) ? { ...raw, moons } : raw;
  return {
    raw: rawWithMoons as DeepPartial<Omit<WorldSpec, 'seed'>>,
    temperature,
    gravity,
    age,
    weather,
    moons: typeof moons === 'number' ? moons : undefined
  };
};

export const resolveWorldSpec = (input: PresetInput): WorldSpec => {
  const split = splitOverrides(input.overrides);
  let merged = structuredClone(baseByArchetype[input.archetype]);

  if (split.temperature) merged = applyTemperatureMacro(merged, split.temperature);
  if (split.gravity) merged = applyGravityMacro(merged, split.gravity);
  if (split.age) merged = applyAgeMacro(merged, split.age);
  if (split.weather) merged = applyWeatherMacro(merged, split.weather);
  if (typeof split.moons === 'number') merged = applyMoonMacro(merged, split.moons);

  merged = mergeDeep(merged, split.raw);

  return worldSpecSchema.parse({ ...merged, seed: input.seed });
};

export const archetypeDefaults = baseByArchetype;
