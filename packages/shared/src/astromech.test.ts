import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import {
  computeInsolationCurve,
  deriveMoonOrbits,
  deriveOrbitalProperties,
  deriveStellarProperties,
  deriveTidalLockState,
  deriveWorldDerivedState,
  resolveWorldSpec
} from './index';

describe('milestone-03 astromech', () => {
  it('stellar properties for sun-like star are within 5%', () => {
    const spec = resolveWorldSpec({ archetype: 'earth-analog', seed: 'sun' });
    const stellar = deriveStellarProperties(spec.star);
    expect(Math.abs(stellar.mass_kg - 1.98847e30) / 1.98847e30).toBeLessThan(0.05);
    expect(Math.abs(stellar.effective_temperature_k - 5772) / 5772).toBeLessThan(0.05);
  });

  it('earth orbital properties are close to reference values', () => {
    const spec = resolveWorldSpec({ archetype: 'earth-analog', seed: 'earth' });
    const stellar = deriveStellarProperties(spec.star);
    const orbital = deriveOrbitalProperties(spec.orbit, stellar.mass_kg, stellar.bolometric_flux_at_1au_w_m2);
    expect(Math.abs(orbital.period_earth_days - 365.25) / 365.25).toBeLessThan(0.001);
    expect(Math.abs(orbital.min_distance_au - 0.9833) / 0.9833).toBeLessThan(0.005);
    expect(Math.abs(orbital.max_distance_au - 1.0167) / 1.0167).toBeLessThan(0.005);
    expect(Math.abs(orbital.mean_orbital_velocity_m_s - 29780) / 29780).toBeLessThan(0.005);
  });

  it('detects mercury-like resonance/locking', () => {
    const spec = resolveWorldSpec({
      archetype: 'iron-world',
      seed: 'mercury',
      overrides: { star: { spectralClass: 'M3V', massSolar: 0.3, luminositySolar: 0.015 }, orbit: { semiMajorAxisAu: 0.05, rotationPeriodHours: 1000 } }
    });
    const stellar = deriveStellarProperties(spec.star);
    const state = deriveTidalLockState(spec.orbit, stellar.mass_kg, spec.body.massEarth * 5.9722e24, spec.body.radiusEarth * 6.371e6);
    expect(['synchronous', 'spin-orbit-resonance']).toContain(state);
  });

  it('hill-sphere check accepts earth-moon analog and rejects 2x hill radius moon', () => {
    const spec = resolveWorldSpec({ archetype: 'earth-analog', seed: 'moon' });
    const stellar = deriveStellarProperties(spec.star);
    const normal = deriveMoonOrbits(spec.moons, spec.body.massEarth * 5.9722e24, spec.orbit, stellar.mass_kg, spec.body.radiusEarth * 6.371e6, spec.body.bulkDensityKgM3);
    expect(normal[0]?.unstable).toBe(false);

    const hillKm =
      (spec.orbit.semiMajorAxisAu *
        1.495978707e8 *
        (1 - spec.orbit.eccentricity) *
        ((spec.body.massEarth * 5.9722e24) / (3 * stellar.mass_kg)) ** (1 / 3)) /
      1000;
    const farMoon = [{ ...spec.moons[0], orbitSemiMajorAxisKm: hillKm * 2 }];
    const unstable = deriveMoonOrbits(farMoon, spec.body.massEarth * 5.9722e24, spec.orbit, stellar.mass_kg, spec.body.radiusEarth * 6.371e6, spec.body.bulkDensityKgM3);
    expect(unstable[0]?.unstable).toBe(true);
  });

  it('eccentric world insolation curve swings strongly (~70%+)', () => {
    const spec = resolveWorldSpec({ archetype: 'earth-analog', seed: 'ecc', overrides: { orbit: { eccentricity: 0.3 } } });
    const curve = computeInsolationCurve(spec, 256);
    const values = curve.map((x) => x.insolation_w_m2);
    const min = Math.min(...values);
    const max = Math.max(...values);
    expect((max - min) / min).toBeGreaterThan(0.7);
  });

  it('derived-state compute finishes under 50ms for one spec', () => {
    const spec = resolveWorldSpec({ archetype: 'super-earth-temperate', seed: 'perf' });
    const t0 = performance.now();
    deriveWorldDerivedState(spec, 0);
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(50);
  });
});
