import { worldSpecSchema, type Archetype, type WorldSpec } from './worldspec';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export interface PresetInput {
  archetype: Archetype;
  seed: string;
  overrides?: DeepPartial<WorldSpec>;
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
  }
};

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

export const resolveWorldSpec = (input: PresetInput): WorldSpec => {
  const merged = mergeDeep(baseByArchetype[input.archetype], input.overrides as DeepPartial<Omit<WorldSpec, 'seed'>>);
  return worldSpecSchema.parse({ ...merged, seed: input.seed });
};

export const archetypeDefaults = baseByArchetype;
