import { Xoshiro256PlusPlus } from './prng';
import type { WorldSpec } from './worldspec';

export type PlateType = 'oceanic' | 'continental';
export type BoundaryType = 'convergent' | 'divergent' | 'transform';
export interface Vertex3 { x: number; y: number; z: number }
export interface Plate { id: number; center: Vertex3; type: PlateType; axis: Vertex3; speed: number }
export interface PlateMap { plateCount: number; plateIds: Uint16Array; plateTypes: PlateType[]; elevationsM: Float32Array }

const EARTH_RADIUS_M = 6_371_000;
const dot = (a: Vertex3, b: Vertex3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (v: Vertex3) => Math.hypot(v.x, v.y, v.z);
const norm = (v: Vertex3): Vertex3 => { const l = len(v) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; };
const sub = (a: Vertex3, b: Vertex3): Vertex3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cross = (a: Vertex3, b: Vertex3): Vertex3 => ({ x: a.y*b.z-a.z*b.y, y: a.z*b.x-a.x*b.z, z: a.x*b.y-a.y*b.x });

const plateCountFor = (spec: WorldSpec, rng: Xoshiro256PlusPlus) => {
  const rScale = Math.max(0.4, Math.min(1.8, spec.body.radiusEarth));
  switch (spec.body.tectonics) {
    case 'plate': return Math.max(8, Math.min(15, Math.round(8 + rScale * 4 + rng.nextRangeInt(0, 4))));
    case 'episodic': return Math.max(4, Math.min(9, Math.round(4 + rScale * 3 + rng.nextRangeInt(0, 2))));
    case 'stagnant-lid': return 1 + rng.nextRangeInt(0, 3);
    case 'cryovolcanic': return 2 + rng.nextRangeInt(0, 3);
    case 'inert': return 1;
  }
};

const fibonacciSphere = (count: number): Vertex3[] => {
  const pts: Vertex3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = phi * i;
    pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
  }
  return pts;
};

const hashNoise = (v: Vertex3, k: number) => {
  const n = Math.sin(v.x * 12.9898 * k + v.y * 78.233 + v.z * 37.719) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
};

export const generateTectonics = async (spec: WorldSpec, vertices: readonly Vertex3[]): Promise<PlateMap> => {
  const rng = await Xoshiro256PlusPlus.fromString(`${spec.seed}::tectonics`);
  const plateCount = plateCountFor(spec, rng);
  const centers = fibonacciSphere(plateCount);
  const plates: Plate[] = centers.map((center, id) => ({
    id,
    center,
    type: rng.nextF64() < (spec.hydrosphere.kind === 'water-ocean' ? 0.6 : 0.3) ? 'oceanic' : 'continental',
    axis: norm({ x: rng.nextRangeFloat(-1, 1), y: rng.nextRangeFloat(-1, 1), z: rng.nextRangeFloat(-1, 1) }),
    speed: rng.nextRangeFloat(0.2, 1.2)
  }));

  const plateIds = new Uint16Array(vertices.length);
  const elevationsM = new Float32Array(vertices.length);
  const plateTypes = plates.map((p) => p.type);

  for (let i = 0; i < vertices.length; i += 1) {
    const v = norm(vertices[i]!);
    let best = 0; let bestScore = -Infinity;
    for (let p = 0; p < plates.length; p += 1) {
      const s = dot(v, plates[p]!.center);
      if (s > bestScore) { bestScore = s; best = p; }
    }
    plateIds[i] = best;
  }

  for (let i = 0; i < vertices.length; i += 1) {
    const v = norm(vertices[i]!);
    const pid = plateIds[i]!;
    const base = plates[pid]!.type === 'oceanic' ? -4000 : 200;
    let boundary = 0;
    let nearestOther = -Infinity;
    for (let p = 0; p < plates.length; p += 1) {
      if (p === pid) continue;
      nearestOther = Math.max(nearestOther, dot(v, plates[p]!.center));
    }
    const ownScore = bestScoreApprox(v, plates[pid]!.center);
    const boundaryness = Math.max(0, nearestOther - ownScore);
    const rel = dot(sub(plates[pid]!.axis, plates[(pid + 1) % plates.length]!.axis), v);
    if (boundaryness > -0.05) {
      if (rel > 0.15) boundary += 3800;
      else if (rel < -0.15) boundary += plates[pid]!.type === 'oceanic' ? 1300 : -700;
      else boundary += 250;
      if (plates[pid]!.type === 'oceanic' && rel > 0.2) boundary -= 4500;
    }
    const noise = hashNoise(v, 1) * (plates[pid]!.type === 'continental' ? 420 : 180) + hashNoise(v, 2) * 160;
    elevationsM[i] = Math.max(-11_500, Math.min(8_800, base + boundary + noise));
  }

  return { plateCount, plateIds, plateTypes, elevationsM };
};

const bestScoreApprox = (a: Vertex3, b: Vertex3) => dot(a, b);

export const colorForElevation = (e: number, spec: WorldSpec): [number, number, number] => {
  const dry = spec.hydrosphere.kind === 'none';
  const palette = dry
    ? [[-1e9, 0x4a3326], [0, 0x6a4a34], [1000, 0x88705a], [3000, 0xb0a79b]]
    : [[-4000, 0x0a1f4a], [-200, 0x1f4a8c], [0, 0x2e6fb4], [500, 0x3d7c3d], [2000, 0x7a6f4a], [4000, 0x8c8580], [1e9, 0xe0e0e0]];
  for (const [max, hex] of palette) if (e <= max) return [((hex as number >> 16) & 255) / 255, (((hex as number) >> 8) & 255) / 255, ((hex as number) & 255) / 255];
  return [1,1,1];
};
