export interface Vec3 { x:number;y:number;z:number }
export interface CameraState { position: Vec3; fovYRad:number; viewportHeight:number }
export interface ChunkInfo { level:number; center:Vec3; angularRadius:number; normal:Vec3 }

export const cubeToSphere = (x:number,y:number,z:number):Vec3 => {
  const xs = x * Math.sqrt(1 - (y*y)/2 - (z*z)/2 + (y*y*z*z)/3);
  const ys = y * Math.sqrt(1 - (z*z)/2 - (x*x)/2 + (z*z*x*x)/3);
  const zs = z * Math.sqrt(1 - (x*x)/2 - (y*y)/2 + (x*x*y*y)/3);
  return { x: xs, y: ys, z: zs };
};

export const magnitude = (v:Vec3) => Math.hypot(v.x,v.y,v.z);

export const shouldSubdivide = (chunk:ChunkInfo,camera:CameraState,thresholdPx=100,maxLevel=12):boolean => {
  if (chunk.level >= maxLevel) return false;
  const dx = chunk.center.x - camera.position.x;
  const dy = chunk.center.y - camera.position.y;
  const dz = chunk.center.z - camera.position.z;
  const dist = Math.max(1, Math.hypot(dx,dy,dz));
  const pixelsPerRadian = camera.viewportHeight / camera.fovYRad;
  const edgePx = (chunk.angularRadius * 2) * pixelsPerRadian / (dist / magnitude(chunk.center));
  return edgePx > thresholdPx;
};

export const selectLodLevel = (distance:number, radius:number, maxLevel=12):number => {
  const altitude = Math.max(1, distance - radius);
  const level = Math.floor(Math.log2((radius * 2) / altitude));
  return Math.max(0, Math.min(maxLevel, level));
};
