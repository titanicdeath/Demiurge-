export type Face = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';

export interface ChunkKey {
  face: Face;
  level: number;
  x: number;
  y: number;
}

export interface LODConfig {
  radius: number;
  maxLevel: number;
  screenThresholdPx: number;
  gridResolution: number;
  skirtDepthMeters: number;
}

export interface CameraState {
  position: [number, number, number];
  fovDeg: number;
  viewportHeightPx: number;
}

const faces: Face[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];

export const cubeToSphere = (x: number, y: number, z: number): [number, number, number] => {
  const x2 = x * x;
  const y2 = y * y;
  const z2 = z * z;
  return [
    x * Math.sqrt(1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3),
    y * Math.sqrt(1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3),
    z * Math.sqrt(1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3)
  ];
};

const normalize = (v: [number, number, number]): [number, number, number] => {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};

const faceBasis = (face: Face, u: number, v: number): [number, number, number] => {
  switch (face) {
    case 'px': return [1, v, -u];
    case 'nx': return [-1, v, u];
    case 'py': return [u, 1, -v];
    case 'ny': return [u, -1, v];
    case 'pz': return [u, v, 1];
    case 'nz': return [-u, v, -1];
  }
};

export const chunkCenterDirection = (key: ChunkKey): [number, number, number] => {
  const cells = 1 << key.level;
  const u = ((key.x + 0.5) / cells) * 2 - 1;
  const v = ((key.y + 0.5) / cells) * 2 - 1;
  const cube = faceBasis(key.face, u, v);
  return normalize(cubeToSphere(cube[0], cube[1], cube[2]));
};

const chunkAngularSize = (level: number): number => Math.PI / (2 * (1 << level));

const visibleByHorizon = (dir: [number, number, number], cam: CameraState, radius: number): boolean => {
  const c = cam.position;
  const cd = Math.hypot(c[0], c[1], c[2]);
  if (cd <= radius) return true;
  const camDir: [number, number, number] = [c[0] / cd, c[1] / cd, c[2] / cd];
  const horizon = Math.acos(radius / cd);
  const dot = dir[0] * camDir[0] + dir[1] * camDir[1] + dir[2] * camDir[2];
  return dot > -Math.sin(horizon);
};

const screenSizePx = (dist: number, worldSize: number, cam: CameraState): number => {
  const fov = (cam.fovDeg * Math.PI) / 180;
  const pxPerMeter = cam.viewportHeightPx / (2 * Math.tan(fov / 2) * Math.max(dist, 1));
  return worldSize * pxPerMeter;
};

export const selectChunks = (config: LODConfig, cam: CameraState): ChunkKey[] => {
  const out: ChunkKey[] = [];
  const stack: ChunkKey[] = faces.map((face) => ({ face, level: 0, x: 0, y: 0 }));
  while (stack.length) {
    const k = stack.pop()!;
    const dir = chunkCenterDirection(k);
    if (!visibleByHorizon(dir, cam, config.radius)) continue;
    const center: [number, number, number] = [dir[0] * config.radius, dir[1] * config.radius, dir[2] * config.radius];
    const dx = center[0] - cam.position[0];
    const dy = center[1] - cam.position[1];
    const dz = center[2] - cam.position[2];
    const dist = Math.hypot(dx, dy, dz);
    const worldEdge = 2 * config.radius * Math.tan(chunkAngularSize(k.level) / 2);
    const px = screenSizePx(dist, worldEdge, cam);
    if (px > config.screenThresholdPx && k.level < config.maxLevel) {
      const n = k.level + 1;
      const bx = k.x * 2;
      const by = k.y * 2;
      stack.push({ face: k.face, level: n, x: bx, y: by });
      stack.push({ face: k.face, level: n, x: bx + 1, y: by });
      stack.push({ face: k.face, level: n, x: bx, y: by + 1 });
      stack.push({ face: k.face, level: n, x: bx + 1, y: by + 1 });
    } else {
      out.push(k);
    }
  }
  return out.sort((a, b) => `${a.face}-${a.level}-${a.x}-${a.y}`.localeCompare(`${b.face}-${b.level}-${b.x}-${b.y}`));
};
