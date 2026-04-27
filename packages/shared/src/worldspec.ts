import { z } from 'zod';

const compositionSchema = z.record(z.string(), z.number().nonnegative());

export const worldSpecSchema = z.object({
  schemaVersion: z.literal(1),
  seed: z.string().min(1),
  star: z.object({
    spectralClass: z.string(),
    massSolar: z.number().positive(),
    luminositySolar: z.number().positive(),
    ageGyr: z.number().nonnegative(),
    binaryCompanion: z
      .object({
        spectralClass: z.string(),
        separationAu: z.number().positive(),
        eccentricity: z.number().min(0).max(1)
      })
      .optional()
  }),
  orbit: z.object({
    semiMajorAxisAu: z.number().positive(),
    eccentricity: z.number().min(0).max(1),
    inclinationDeg: z.number(),
    axialTiltDeg: z.number().min(0).max(180),
    rotationPeriodHours: z.number().positive(),
    tidalLock: z.enum(['none', 'primary', 'resonant'])
  }),
  body: z.object({
    massEarth: z.number().positive(),
    radiusEarth: z.number().positive(),
    bulkDensityKgM3: z.number().positive(),
    tectonics: z.enum(['plate', 'stagnant-lid', 'episodic', 'cryovolcanic', 'inert']),
    composition: z.object({ core: z.string(), mantle: z.string(), crust: z.string() }),
    magneticFieldMicrotesla: z.number().nonnegative()
  }),
  volatiles: z.record(z.string(), z.number().nonnegative()),
  surface: z.object({
    elevationHint: z.enum(['smooth', 'mixed', 'rugged']),
    dominantMaterials: z.array(z.string()).min(1),
    impactHistory: z.enum(['quiet', 'moderate', 'heavy'])
  }),
  atmosphere: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none') }),
    z.object({
      kind: z.literal('present'),
      pressureBar: z.number().positive(),
      composition: compositionSchema
    })
  ]),
  hydrosphere: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none') }),
    z.object({ kind: z.literal('water-ocean'), coverage: z.number().min(0).max(1), salinityPsu: z.number().nonnegative() }),
    z.object({ kind: z.literal('methane-lakes'), coverage: z.number().min(0).max(1) }),
    z.object({ kind: z.literal('brine'), coverage: z.number().min(0).max(1), salinityPsu: z.number().nonnegative() }),
    z.object({ kind: z.literal('lava'), coverage: z.number().min(0).max(1) })
  ]),
  life: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none') }),
    z.object({ kind: z.literal('microbial') }),
    z.object({ kind: z.literal('complex') }),
    z.object({ kind: z.literal('sapient'), techLevel: z.enum(['preindustrial', 'industrial', 'digital', 'spacefaring']), culturalSeed: z.string() })
  ]),
  moons: z.array(
    z.object({
      name: z.string(),
      massEarth: z.number().positive(),
      radiusEarth: z.number().positive(),
      orbitSemiMajorAxisKm: z.number().positive(),
      composition: z.enum(['rocky', 'icy', 'mixed'])
    })
  ),
  rings: z
    .object({
      innerRadiusKm: z.number().positive(),
      outerRadiusKm: z.number().positive(),
      composition: z.enum(['ice', 'dust', 'mixed'])
    })
    .optional()
});

export type WorldSpec = z.infer<typeof worldSpecSchema>;
export type Archetype =
  | 'earth-analog'
  | 'mars-like'
  | 'venus-like'
  | 'titan-like'
  | 'europa-like'
  | 'airless-rockball'
  | 'tide-locked-m-dwarf-desert';
