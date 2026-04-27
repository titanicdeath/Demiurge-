import type { WorldSpec } from './worldspec';

export interface WorldCapabilities {
  hasAtmosphere: boolean;
  atmosphereThickness: 'none' | 'trace' | 'thin' | 'standard' | 'thick' | 'crushing';
  surfaceLiquid: 'none' | 'water' | 'methane' | 'brine' | 'lava' | 'mixed';
  hasOceanLayer: 'none' | 'surface' | 'subsurface' | 'both';
  tectonicMode: 'plate' | 'stagnant-lid' | 'episodic' | 'cryovolcanic' | 'inert';
  hasMagnetosphere: boolean;
  lifePresent: 'none' | 'microbial' | 'complex' | 'sapient';
  tidalLockState: 'free' | 'synchronous' | 'spin-orbit-resonance';
  temperatureRegime: 'cryogenic' | 'cold' | 'temperate' | 'hot' | 'extreme';
  habitabilityClass: 'sterile' | 'extremophile-only' | 'marginal' | 'habitable' | 'lush';
}

const deriveAtmosphereThickness = (spec: WorldSpec): WorldCapabilities['atmosphereThickness'] => {
  if (spec.atmosphere.kind === 'none') return 'none';
  const pressure = spec.atmosphere.pressureBar;
  if (pressure < 0.001) return 'trace';
  if (pressure < 0.2) return 'thin';
  if (pressure < 2) return 'standard';
  if (pressure < 10) return 'thick';
  return 'crushing';
};

const deriveSurfaceLiquid = (spec: WorldSpec): WorldCapabilities['surfaceLiquid'] => {
  if (spec.hydrosphere.kind === 'none') return 'none';
  const hasWater = (spec.volatiles.H2O ?? 0) > 1e19;
  const hasMethane = (spec.volatiles.CH4 ?? 0) > 1e16;
  if ((spec.hydrosphere.kind === 'water-ocean' || spec.hydrosphere.kind === 'methane-lakes') && hasWater && hasMethane) {
    return 'mixed';
  }
  if (spec.hydrosphere.kind === 'water-ocean') return 'water';
  if (spec.hydrosphere.kind === 'methane-lakes') return 'methane';
  if (spec.hydrosphere.kind === 'brine') return 'brine';
  return 'lava';
};

const hasSubsurfaceOceanSignal = (spec: WorldSpec): boolean => {
  if (spec.body.tectonics !== 'cryovolcanic') return false;
  const icyCrust = spec.body.composition.crust.includes('ice');
  return icyCrust || (spec.volatiles.H2O ?? 0) > 1e20;
};

const deriveOceanLayer = (spec: WorldSpec): WorldCapabilities['hasOceanLayer'] => {
  const surface = spec.hydrosphere.kind !== 'none';
  const subsurface = hasSubsurfaceOceanSignal(spec);
  if (surface && subsurface) return 'both';
  if (surface) return 'surface';
  if (subsurface) return 'subsurface';
  return 'none';
};

const deriveTidalLockState = (spec: WorldSpec): WorldCapabilities['tidalLockState'] => {
  if (spec.orbit.tidalLock === 'primary') return 'synchronous';
  if (spec.orbit.tidalLock === 'resonant') return 'spin-orbit-resonance';
  return 'free';
};

const deriveTemperatureRegime = (spec: WorldSpec): WorldCapabilities['temperatureRegime'] => {
  const insolation = spec.star.luminositySolar / (spec.orbit.semiMajorAxisAu * spec.orbit.semiMajorAxisAu);
  if (insolation < 0.15) return 'cryogenic';
  if (insolation < 0.65) return 'cold';
  if (insolation < 1.5) return 'temperate';
  if (insolation < 3.5) return 'hot';
  return 'extreme';
};

const deriveHabitabilityClass = (
  spec: WorldSpec,
  surfaceLiquid: WorldCapabilities['surfaceLiquid'],
  hasOceanLayer: WorldCapabilities['hasOceanLayer'],
  temperatureRegime: WorldCapabilities['temperatureRegime'],
  hasAtmosphere: boolean
): WorldCapabilities['habitabilityClass'] => {
  if (spec.life.kind === 'sapient' || spec.life.kind === 'complex') return 'lush';
  if (!hasAtmosphere && surfaceLiquid === 'none') return 'sterile';
  if (temperatureRegime === 'extreme' && surfaceLiquid === 'none') return 'sterile';
  if (temperatureRegime === 'cryogenic' && hasOceanLayer === 'none') return 'sterile';
  if (spec.life.kind === 'microbial' || hasOceanLayer === 'subsurface') return 'extremophile-only';
  if (surfaceLiquid === 'water' || surfaceLiquid === 'brine') {
    return temperatureRegime === 'temperate' || temperatureRegime === 'cold' ? 'habitable' : 'marginal';
  }
  if (surfaceLiquid === 'methane' || surfaceLiquid === 'mixed') return 'marginal';
  return 'extremophile-only';
};

export const deriveCapabilities = (spec: WorldSpec): WorldCapabilities => {
  const hasAtmosphere = spec.atmosphere.kind === 'present';
  const atmosphereThickness = deriveAtmosphereThickness(spec);
  const surfaceLiquid = deriveSurfaceLiquid(spec);
  const hasOceanLayer = deriveOceanLayer(spec);
  const temperatureRegime = deriveTemperatureRegime(spec);

  return {
    hasAtmosphere,
    atmosphereThickness,
    surfaceLiquid,
    hasOceanLayer,
    tectonicMode: spec.body.tectonics,
    hasMagnetosphere: spec.body.magneticFieldMicrotesla >= 5,
    lifePresent: spec.life.kind,
    tidalLockState: deriveTidalLockState(spec),
    temperatureRegime,
    habitabilityClass: deriveHabitabilityClass(spec, surfaceLiquid, hasOceanLayer, temperatureRegime, hasAtmosphere)
  };
};
