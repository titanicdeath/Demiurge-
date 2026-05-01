import * as THREE from 'three';
import { colorForElevation, generateTectonics, resolveWorldSpec } from '@demiurge/shared';
import { WebGPURenderer } from 'three/webgpu';
import { cubeToSphere } from './lod';

const world = resolveWorldSpec({ archetype: 'm5-test-planet', seed: 'm5-default' });
const radiusM = world.body.radiusEarth * 6_371_000;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2e10);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808);

const supportsWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
const renderer = supportsWebGPU
  ? new WebGPURenderer({ antialias: true })
  : new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

if (supportsWebGPU) {
  await (renderer as WebGPURenderer).init();
}

const container = new THREE.Group();
scene.add(container);

const geometry = new THREE.IcosahedronGeometry(radiusM, 8);
const pos = geometry.getAttribute('position');
const verts = Array.from({ length: pos.count }, (_, i) => ({ x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) }));
const tectonics = await generateTectonics(world, verts);
const colors = new Float32Array(pos.count * 3);
const exaggeration = 20;
for (let i = 0; i < pos.count; i += 1) {
  const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
  const l = Math.hypot(x, y, z) || 1;
  const nx = x / l; const ny = y / l; const nz = z / l;
  const elevation = tectonics.elevationsM[i]! * exaggeration;
  const r = radiusM + elevation;
  pos.setXYZ(i, nx * r, ny * r, nz * r);
  const [cr, cg, cb] = colorForElevation(tectonics.elevationsM[i]!, world);
  colors[i * 3] = cr; colors[i * 3 + 1] = cg; colors[i * 3 + 2] = cb;
}
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.computeVertexNormals();
const material = new THREE.MeshStandardMaterial({ color: 0x888888, vertexColors: true, wireframe: false, flatShading: false });
const planet = new THREE.Mesh(geometry, material);
container.add(planet);

const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(1, 0.3, 0.2).normalize().multiplyScalar(1e9);
scene.add(light);
scene.add(new THREE.AmbientLight(0x444444));

const hud = document.createElement('pre');
hud.style.position = 'fixed'; hud.style.top = '8px'; hud.style.left = '8px'; hud.style.background = 'rgba(0,0,0,0.5)'; hud.style.color='white'; hud.style.padding='8px'; hud.style.display='none';
document.body.appendChild(hud);

let mode: 'orbit'|'free' = 'orbit';
let distance = radiusM * 4;
let yaw = 0; let pitch = 0.2;
const cameraPosition = new THREE.Vector3(0, 0, distance);
const keyState = new Set<string>();
window.addEventListener('keydown', (e) => { keyState.add(e.key.toLowerCase()); if (e.key === '`') hud.style.display = hud.style.display === 'none' ? 'block' : 'none'; if (e.key === 'c') mode = mode === 'orbit' ? 'free' : 'orbit'; if (e.key==='v') material.wireframe=!material.wireframe; });
window.addEventListener('keyup', (e)=>keyState.delete(e.key.toLowerCase()));
window.addEventListener('wheel', (e)=>{ distance *= Math.exp(e.deltaY*0.001); distance = Math.min(1e9, Math.max(radiusM+1, distance));});

const clock = new THREE.Clock();
const renderLoop = () => {
  const dt = clock.getDelta();
  if (mode === 'orbit') {
    if (keyState.has('arrowleft')) yaw += dt;
    if (keyState.has('arrowright')) yaw -= dt;
    if (keyState.has('arrowup')) pitch = Math.min(1.5, pitch + dt);
    if (keyState.has('arrowdown')) pitch = Math.max(-1.5, pitch - dt);
    cameraPosition.set(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)).multiplyScalar(distance);
  } else {
    const speed = Math.max(1, (cameraPosition.length() - radiusM) * 0.2) * (keyState.has('shift') ? 8 : 1);
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    if (keyState.has('w')) cameraPosition.addScaledVector(forward, speed * dt);
    if (keyState.has('s')) cameraPosition.addScaledVector(forward, -speed * dt);
    if (keyState.has('a')) cameraPosition.addScaledVector(right, -speed * dt);
    if (keyState.has('d')) cameraPosition.addScaledVector(right, speed * dt);
    if (keyState.has('q')) cameraPosition.y -= speed * dt;
    if (keyState.has('e')) cameraPosition.y += speed * dt;
  }

  // camera-relative rendering
  container.position.copy(cameraPosition).multiplyScalar(-1);
  camera.position.set(0, 0, 0);
  camera.lookAt(cameraPosition.clone().multiplyScalar(-1));

  const altitude = cameraPosition.length() - radiusM;
  const sample = cubeToSphere(1, 0, 0);
  hud.textContent = `fps: ${(1 / Math.max(dt, 1e-6)).toFixed(1)}\nframe ms: ${(dt * 1000).toFixed(2)}\nrenderer: ${supportsWebGPU ? 'WebGPU' : 'WebGL2'}\nmode: ${mode}\ndistance from center (m): ${cameraPosition.length().toFixed(2)}\naltitude (m): ${altitude.toFixed(2)}\nactive chunks LOD0: 6\nwireframe: ${material.wireframe}\nunitSampleX: ${sample.x.toFixed(3)}`;

  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
};

const startRenderLoop = async () => {
  if (supportsWebGPU) {
    await (renderer as WebGPURenderer).init();
  }
  requestAnimationFrame(renderLoop);
};
void startRenderLoop();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
