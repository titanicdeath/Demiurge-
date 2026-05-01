import * as THREE from 'three';

export interface Vec3 { x: number; y: number; z: number }
export type FaceName = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';
export interface CameraState { position: Vec3; fovYRad: number; viewportHeight: number }
export interface ChunkKey { face: FaceName; level: number; x: number; y: number }
export interface ChunkNode extends ChunkKey { centerDir: Vec3; angularRadius: number }

export const cubeToSphere = (x:number,y:number,z:number):Vec3 => ({
  x: x * Math.sqrt(1 - (y*y)/2 - (z*z)/2 + (y*y*z*z)/3),
  y: y * Math.sqrt(1 - (z*z)/2 - (x*x)/2 + (z*z*x*x)/3),
  z: z * Math.sqrt(1 - (x*x)/2 - (y*y)/2 + (x*x*y*y)/3)
});

export const magnitude = (v:Vec3) => Math.hypot(v.x,v.y,v.z);
const normalize = (v:Vec3):Vec3 => { const m = magnitude(v); return { x: v.x / m, y: v.y / m, z: v.z / m }; };
const dot = (a:Vec3,b:Vec3) => a.x*b.x + a.y*b.y + a.z*b.z;

export const faceUvToCube = (face: FaceName, u: number, v: number): Vec3 => {
  switch (face) {
    case 'px': return { x: 1, y: v, z: -u };
    case 'nx': return { x: -1, y: v, z: u };
    case 'py': return { x: u, y: 1, z: -v };
    case 'ny': return { x: u, y: -1, z: v };
    case 'pz': return { x: u, y: v, z: 1 };
    case 'nz': return { x: -u, y: v, z: -1 };
  }
};

const chunkCenter = (face: FaceName, level: number, x: number, y: number): Vec3 => {
  const n = 1 << level;
  const u0 = (x / n) * 2 - 1; const u1 = ((x + 1) / n) * 2 - 1;
  const v0 = (y / n) * 2 - 1; const v1 = ((y + 1) / n) * 2 - 1;
  const uc = (u0 + u1) * 0.5; const vc = (v0 + v1) * 0.5;
  const c = faceUvToCube(face, uc, vc);
  return normalize(cubeToSphere(c.x, c.y, c.z));
};

const faces: FaceName[] = ['px','nx','py','ny','pz','nz'];

export const shouldSubdivide = (chunk:ChunkNode,camera:CameraState,radius:number,thresholdPx=100,maxLevel=12):boolean => {
  if (chunk.level >= maxLevel) return false;
  const chunkCenter = { x: chunk.centerDir.x * radius, y: chunk.centerDir.y * radius, z: chunk.centerDir.z * radius };
  const dist = Math.max(1, Math.hypot(chunkCenter.x - camera.position.x, chunkCenter.y - camera.position.y, chunkCenter.z - camera.position.z));
  const pxPerRad = camera.viewportHeight / camera.fovYRad;
  const chunkEdgeMeters = radius * chunk.angularRadius;
  const edgePx = chunkEdgeMeters * pxPerRad / dist;
  return edgePx > thresholdPx;
};

export const selectLodLevel = (distance:number, radius:number, maxLevel=12):number => {
  const altitude = Math.max(1, distance - radius);
  return Math.max(0, Math.min(maxLevel, Math.floor(Math.log2((radius * 2) / altitude))));
};

const horizonVisible = (centerDir: Vec3, cameraPosition: Vec3, radius: number): boolean => {
  const d = magnitude(cameraPosition);
  if (d <= radius) return true;
  const camDir = normalize(cameraPosition);
  const limit = -Math.sqrt(1 - (radius / d) ** 2);
  return dot(centerDir, camDir) > limit;
};

export const computeActiveChunks = (
  cameraPosition: Vec3,
  radius: number,
  viewportHeight: number,
  fovYRad: number,
  thresholdPx = 100,
  maxLevel = 12
): ChunkNode[] => {
  const result: ChunkNode[] = [];
  const recurse = (face: FaceName, level: number, x: number, y: number): void => {
    const centerDir = chunkCenter(face, level, x, y);
    if (!horizonVisible(centerDir, cameraPosition, radius)) return;
    const dist = Math.max(1, magnitude({
      x: cameraPosition.x - centerDir.x * radius,
      y: cameraPosition.y - centerDir.y * radius,
      z: cameraPosition.z - centerDir.z * radius
    }));
    const node: ChunkNode = { face, level, x, y, centerDir, angularRadius: Math.PI / (2 * (1 << level)) };
    const chunkEdgeMeters = radius * node.angularRadius;
    const edgePx = chunkEdgeMeters * (viewportHeight / fovYRad) / dist;
    if (level < maxLevel && edgePx > thresholdPx) {
      recurse(face, level + 1, x * 2, y * 2);
      recurse(face, level + 1, x * 2 + 1, y * 2);
      recurse(face, level + 1, x * 2, y * 2 + 1);
      recurse(face, level + 1, x * 2 + 1, y * 2 + 1);
    } else {
      result.push(node);
    }
  };
  for (const face of faces) recurse(face, 0, 0, 0);
  result.sort((a,b)=> a.face.localeCompare(b.face) || a.level-b.level || a.y-b.y || a.x-b.x);
  return result;
};

export const chunkKey = (c:ChunkKey) => `${c.face}:${c.level}:${c.x}:${c.y}`;

export const buildChunkGeometry = (chunk: ChunkNode, radius:number, grid=33, skirtRatio=0.005): THREE.BufferGeometry => {
  const n = 1 << chunk.level;
  const u0 = (chunk.x / n) * 2 - 1; const u1 = ((chunk.x + 1) / n) * 2 - 1;
  const v0 = (chunk.y / n) * 2 - 1; const v1 = ((chunk.y + 1) / n) * 2 - 1;
  const size = grid;
  const positions:number[] = []; const normals:number[] = []; const indices:number[] = [];
  const vertexIndex = (i:number,j:number) => i * size + j;
  for (let i=0;i<size;i++) {
    const ty = i/(size-1); const v = v0 + (v1-v0)*ty;
    for (let j=0;j<size;j++) {
      const tx = j/(size-1); const u = u0 + (u1-u0)*tx;
      const c = faceUvToCube(chunk.face, u, v);
      const s = normalize(cubeToSphere(c.x,c.y,c.z));
      positions.push(s.x*radius,s.y*radius,s.z*radius); normals.push(s.x,s.y,s.z);
    }
  }
  for (let i=0;i<size-1;i++) for (let j=0;j<size-1;j++) {
    const a=vertexIndex(i,j),b=vertexIndex(i,j+1),c=vertexIndex(i+1,j),d=vertexIndex(i+1,j+1);
    indices.push(a,c,b,b,c,d);
  }
  const edgeLength = radius * (Math.PI/2) / n;
  const skirtDepth = Math.max(10, edgeLength * skirtRatio);
  const ring:number[] = [];
  for (let j=0;j<size;j++) ring.push(vertexIndex(0,j));
  for (let i=1;i<size;i++) ring.push(vertexIndex(i,size-1));
  for (let j=size-2;j>=0;j--) ring.push(vertexIndex(size-1,j));
  for (let i=size-2;i>0;i--) ring.push(vertexIndex(i,0));
  const base = positions.length/3;
  for (const idx of ring) {
    const nx = normals[idx*3], ny = normals[idx*3+1], nz = normals[idx*3+2];
    const px = positions[idx*3] - nx*skirtDepth, py = positions[idx*3+1] - ny*skirtDepth, pz = positions[idx*3+2] - nz*skirtDepth;
    positions.push(px,py,pz); normals.push(nx,ny,nz);
  }
  for (let i=0;i<ring.length;i++) {
    const i0=ring[i], i1=ring[(i+1)%ring.length], s0=base+i, s1=base+((i+1)%ring.length);
    indices.push(i0,s0,i1,i1,s0,s1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals,3));
  g.setIndex(indices); g.computeBoundingSphere();
  return g;
};
