import * as THREE from 'three';
import { resolveWorldSpec } from '@demiurge/shared';
import { WebGPURenderer } from 'three/webgpu';
import { buildChunkGeometry, chunkKey, computeActiveChunks, type ChunkNode } from './lod';

const world = resolveWorldSpec({ archetype: 'm4-test-planet', seed: 'm4-default' });
const radiusM = world.body.radiusEarth * 6_371_000;
const GRID_RESOLUTION = 33;
const LOD_THRESHOLD_PX = 100;
const MAX_LOD_LEVEL = 12;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2e10);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808);
const supportsWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;

const createRenderer = async (): Promise<THREE.WebGLRenderer | WebGPURenderer> => {
  if (supportsWebGPU) {
    const r = new WebGPURenderer({ antialias: true });
    await r.init();
    return r;
  }
  return new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
};

const container = new THREE.Group();
scene.add(container);
const material = new THREE.MeshStandardMaterial({ color: 0x888888, wireframe: false });
const chunkMeshes = new Map<string, THREE.Mesh>();

const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(1, 0.3, 0.2).normalize().multiplyScalar(1e9);
scene.add(light);
scene.add(new THREE.AmbientLight(0x444444));

const hud = document.createElement('pre');
hud.style.cssText = 'position:fixed;top:8px;left:8px;background:rgba(0,0,0,0.5);color:white;padding:8px;display:none';
document.body.appendChild(hud);

let mode: 'orbit' | 'free' = 'orbit';
let distance = radiusM * 4;
let yaw = 0; let pitch = 0.2;
const cameraPosition = new THREE.Vector3(0, 0, distance);
const keyState = new Set<string>();

window.addEventListener('keydown', (e) => { keyState.add(e.key.toLowerCase()); if (e.key === '`') hud.style.display = hud.style.display === 'none' ? 'block' : 'none'; if (e.key === 'c') mode = mode === 'orbit' ? 'free' : 'orbit'; if (e.key === 'v') material.wireframe = !material.wireframe; });
window.addEventListener('keyup', (e)=>keyState.delete(e.key.toLowerCase()));
window.addEventListener('wheel', (e)=>{ distance *= Math.exp(e.deltaY * 0.001); distance = Math.min(1e9, Math.max(radiusM + 1, distance)); });

const updateChunkMeshes = (activeChunks: ChunkNode[]): Record<number, number> => {
  const activeKeys = new Set<string>();
  const byLod: Record<number, number> = {};
  for (const chunk of activeChunks) {
    const key = chunkKey(chunk); activeKeys.add(key); byLod[chunk.level] = (byLod[chunk.level] ?? 0) + 1;
    if (!chunkMeshes.has(key)) {
      const mesh = new THREE.Mesh(buildChunkGeometry(chunk, radiusM, GRID_RESOLUTION), material);
      mesh.frustumCulled = true;
      chunkMeshes.set(key, mesh);
      container.add(mesh);
    }
  }
  for (const [key, mesh] of chunkMeshes.entries()) {
    if (!activeKeys.has(key)) {
      container.remove(mesh);
      mesh.geometry.dispose();
      chunkMeshes.delete(key);
    }
  }
  return byLod;
};

const boot = async (): Promise<void> => {
  const renderer = await createRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const clock = new THREE.Clock();
  const renderLoop = (): void => {
    const dt = clock.getDelta();
    if (mode === 'orbit') {
      if (keyState.has('arrowleft')) yaw += dt;
      if (keyState.has('arrowright')) yaw -= dt;
      if (keyState.has('arrowup')) pitch = Math.min(1.5, pitch + dt);
      if (keyState.has('arrowdown')) pitch = Math.max(-1.5, pitch - dt);
      cameraPosition.set(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)).multiplyScalar(distance);
    } else {
      const speed = Math.max(1, (cameraPosition.length() - radiusM) * 0.2) * (keyState.has('shift') ? 8 : 1);
      const forward = new THREE.Vector3(); camera.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      if (keyState.has('w')) cameraPosition.addScaledVector(forward, speed * dt);
      if (keyState.has('s')) cameraPosition.addScaledVector(forward, -speed * dt);
      if (keyState.has('a')) cameraPosition.addScaledVector(right, -speed * dt);
      if (keyState.has('d')) cameraPosition.addScaledVector(right, speed * dt);
      if (keyState.has('q')) cameraPosition.y -= speed * dt;
      if (keyState.has('e')) cameraPosition.y += speed * dt;
    }

    const chunks = computeActiveChunks({ x: cameraPosition.x, y: cameraPosition.y, z: cameraPosition.z }, radiusM, window.innerHeight, THREE.MathUtils.degToRad(camera.fov), LOD_THRESHOLD_PX, MAX_LOD_LEVEL);
    const chunkCounts = updateChunkMeshes(chunks);

    container.position.copy(cameraPosition).multiplyScalar(-1);
    camera.position.set(0, 0, 0);
    camera.lookAt(cameraPosition.clone().multiplyScalar(-1));

    const altitude = cameraPosition.length() - radiusM;
    const lodText = Object.entries(chunkCounts).sort((a,b)=>Number(a[0])-Number(b[0])).map(([lod,count])=>`LOD${lod}=${count}`).join(' ');
    hud.textContent = `fps: ${(1 / Math.max(dt, 1e-6)).toFixed(1)}\nframe ms: ${(dt * 1000).toFixed(2)}\nrenderer: ${supportsWebGPU ? 'WebGPU' : 'WebGL2'}\nmode: ${mode}\ndistance from center (m): ${cameraPosition.length().toFixed(2)}\naltitude (m): ${altitude.toFixed(2)}\nactive chunks: ${lodText}\nwireframe: ${material.wireframe}`;

    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
  };
  requestAnimationFrame(renderLoop);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

void boot();
