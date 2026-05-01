import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';
import { resolveWorldSpec, deriveWorldDerivedState } from '@demiurge/shared';
import { chunkCenterDirection, cubeToSphere, selectChunks, type CameraState, type ChunkKey, type LODConfig } from './lod';

const WORLD = resolveWorldSpec({ archetype: 'm4-test-planet', seed: 'm4-dev' });
const DERIVED = deriveWorldDerivedState(WORLD, 0);
const PLANET_RADIUS_M = WORLD.body.radiusEarth * 6_371_000;
const CONFIG: LODConfig = { radius: PLANET_RADIUS_M, maxLevel: 12, screenThresholdPx: 100, gridResolution: 33, skirtDepthMeters: 20 };

const container = document.querySelector<HTMLDivElement>('#app')!;
container.innerHTML = `<div id="hud" style="position:fixed;top:8px;left:8px;background:#111c;color:#eee;padding:8px;font:12px monospace;display:none;z-index:10"></div><button id="modeBtn" style="position:fixed;top:8px;right:8px;z-index:10">mode: orbit</button><button id="wireBtn" style="position:fixed;top:38px;right:8px;z-index:10">wireframe: off</button><canvas id="scene"></canvas>`;

const canvas = container.querySelector<HTMLCanvasElement>('#scene')!;
const hud = container.querySelector<HTMLDivElement>('#hud')!;
const modeBtn = container.querySelector<HTMLButtonElement>('#modeBtn')!;
const wireBtn = container.querySelector<HTMLButtonElement>('#wireBtn')!;

const mkRenderer = async (): Promise<{ renderer: THREE.WebGLRenderer | WebGPURenderer; backend: string }> => {
  if ('gpu' in navigator) {
    const r = new WebGPURenderer({ canvas, antialias: true });
    await r.init();
    return { renderer: r, backend: 'webgpu' };
  }
  return { renderer: new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true }), backend: 'webgl2' };
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030305);
const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 2e9);
const root = new THREE.Group();
scene.add(root);
const chunkGroup = new THREE.Group();
root.add(chunkGroup);

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
const starPos = DERIVED.orbital_state.position_m;
sun.position.set(-starPos[0], -starPos[1], -starPos[2]).normalize();
scene.add(sun);
scene.add(new THREE.AmbientLight(0x222222));

let cameraMode: 'orbit' | 'free' = 'orbit';
let wireframe = false;
let showHud = false;
let yaw = 0;
let pitch = 0;
let orbitDistance = PLANET_RADIUS_M * 4;
let cameraPos = new THREE.Vector3(0, 0, orbitDistance);

const keys = new Set<string>();
window.addEventListener('keydown', (e) => { keys.add(e.key.toLowerCase()); if (e.key === '`') showHud = !showHud; });
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
modeBtn.onclick = () => { cameraMode = cameraMode === 'orbit' ? 'free' : 'orbit'; modeBtn.textContent = `mode: ${cameraMode}`; };
wireBtn.onclick = () => { wireframe = !wireframe; wireBtn.textContent = `wireframe: ${wireframe ? 'on' : 'off'}`; rebuildChunks(lastCamState); };

let dragging = false;
let lastX = 0;
let lastY = 0;
canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  yaw -= dx * 0.003;
  pitch = Math.max(-1.5, Math.min(1.5, pitch - dy * 0.003));
});
canvas.addEventListener('wheel', (e) => {
  const s = Math.exp(e.deltaY * 0.0015);
  orbitDistance = Math.min(1e9, Math.max(1, orbitDistance * s));
  e.preventDefault();
}, { passive: false });

const geometryForChunk = (key: ChunkKey): THREE.BufferGeometry => {
  const cells = 1 << key.level;
  const u0 = (key.x / cells) * 2 - 1;
  const v0 = (key.y / cells) * 2 - 1;
  const u1 = ((key.x + 1) / cells) * 2 - 1;
  const v1 = ((key.y + 1) / cells) * 2 - 1;
  const res = CONFIG.gridResolution;
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const toCube = (u: number, v: number): [number, number, number] => {
    switch (key.face) {
      case 'px': return [1, v, -u];
      case 'nx': return [-1, v, u];
      case 'py': return [u, 1, -v];
      case 'ny': return [u, -1, v];
      case 'pz': return [u, v, 1];
      case 'nz': return [-u, v, -1];
    }
  };

  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const u = u0 + (u1 - u0) * (x / (res - 1));
      const v = v0 + (v1 - v0) * (y / (res - 1));
      const c = toCube(u, v);
      const s = cubeToSphere(c[0], c[1], c[2]);
      pos.push(s[0] * PLANET_RADIUS_M, s[1] * PLANET_RADIUS_M, s[2] * PLANET_RADIUS_M);
      nor.push(s[0], s[1], s[2]);
    }
  }
  for (let y = 0; y < res - 1; y++) {
    for (let x = 0; x < res - 1; x++) {
      const i = y * res + x;
      idx.push(i, i + 1, i + res, i + 1, i + res + 1, i + res);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
};

const mat = () => new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1, metalness: 0, wireframe });
let lastCamState: CameraState = { position: [0, 0, orbitDistance], fovDeg: 60, viewportHeightPx: window.innerHeight };
const rebuildChunks = (camState: CameraState): void => {
  chunkGroup.clear();
  const chunks = selectChunks(CONFIG, camState);
  for (const c of chunks) {
    chunkGroup.add(new THREE.Mesh(geometryForChunk(c), mat()));
  }
  chunkGroup.userData.chunkCount = chunks.length;
  const byLod: Record<number, number> = {};
  for (const c of chunks) byLod[c.level] = (byLod[c.level] ?? 0) + 1;
  chunkGroup.userData.byLod = byLod;
};

const animate = async (): Promise<void> => {
  const { renderer, backend } = await mkRenderer();
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  let last = performance.now();
  let avg = 16;
  rebuildChunks(lastCamState);

  const loop = () => {
    const now = performance.now();
    const dt = Math.max(0.001, (now - last) / 1000);
    last = now;
    avg = avg * 0.9 + dt * 1000 * 0.1;

    if (cameraMode === 'orbit') {
      const dir = new THREE.Vector3(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw));
      cameraPos.copy(dir.multiplyScalar(orbitDistance));
      camera.position.set(0, 0, 0);
      camera.lookAt(new THREE.Vector3(0, 0, -1));
    } else {
      const alt = Math.max(1, cameraPos.length() - PLANET_RADIUS_M);
      const speed = Math.max(2, Math.min(5e6, alt * 0.5)) * (keys.has('shift') ? 8 : 1);
      const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      if (keys.has('w')) cameraPos.addScaledVector(forward, speed * dt);
      if (keys.has('s')) cameraPos.addScaledVector(forward, -speed * dt);
      if (keys.has('a')) cameraPos.addScaledVector(right, -speed * dt);
      if (keys.has('d')) cameraPos.addScaledVector(right, speed * dt);
      if (keys.has('q')) cameraPos.y += speed * dt;
      if (keys.has('e')) cameraPos.y -= speed * dt;
      camera.position.set(0, 0, 0);
      camera.lookAt(new THREE.Vector3(Math.sin(yaw), Math.sin(pitch), Math.cos(yaw)).normalize());
    }

    root.position.set(-cameraPos.x, -cameraPos.y, -cameraPos.z);

    const camState: CameraState = { position: [cameraPos.x, cameraPos.y, cameraPos.z], fovDeg: camera.fov, viewportHeightPx: window.innerHeight };
    const dist = Math.hypot(camState.position[0] - lastCamState.position[0], camState.position[1] - lastCamState.position[1], camState.position[2] - lastCamState.position[2]);
    if (dist > Math.max(1, (cameraPos.length() - PLANET_RADIUS_M) * 0.02)) {
      lastCamState = camState;
      rebuildChunks(camState);
    }

    hud.style.display = showHud ? 'block' : 'none';
    if (showHud) {
      const altitude = cameraPos.length() - PLANET_RADIUS_M;
      hud.innerText = [
        `backend: ${backend}`,
        `fps: ${(1000 / avg).toFixed(1)} frame: ${avg.toFixed(2)}ms`,
        `mode: ${cameraMode}`,
        `camera: ${cameraPos.x.toFixed(1)}, ${cameraPos.y.toFixed(1)}, ${cameraPos.z.toFixed(1)}`,
        `altitude_m: ${altitude.toFixed(1)}`,
        `chunks: ${chunkGroup.userData.chunkCount ?? 0}`,
        `lod: ${JSON.stringify(chunkGroup.userData.byLod ?? {})}`
      ].join('\n');
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
};

void animate();
