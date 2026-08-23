import * as THREE from 'three';
import { visualQuality, WORLD } from './config.js';

const SKY_D = 0x6ba3c9;
const SKY_B = 0x7a9eb0;
const GROUND_D = 0x4a6b45;
const GROUND_B = 0x3d5a38;
const RUNWAY = 0x3a3f45;
const RUNWAY_MARK = 0xe8e4d8;

/**
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} renderer
 */
export function createWorld(scene, renderer) {
  applyQuality(scene, renderer);

  const groundMat = makeGroundMaterial();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.groundSize, WORLD.groundSize, 1, 1),
    groundMat,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = visualQuality === 'D';
  scene.add(ground);

  const runwayGroup = buildRunway();
  scene.add(runwayGroup);

  // Distant low hills (simple extruded boxes / cones for depth)
  const hills = buildHills();
  scene.add(hills);

  const sun = new THREE.DirectionalLight(0xfff2d6, visualQuality === 'D' ? 1.35 : 0.9);
  sun.position.set(120, 220, 80);
  if (visualQuality === 'D') {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 600;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
  }
  scene.add(sun);

  const ambient = new THREE.AmbientLight(0xb8cfe0, visualQuality === 'D' ? 0.45 : 0.7);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x9ec8e6, 0x4a6b45, visualQuality === 'D' ? 0.35 : 0.2);
  scene.add(hemi);

  return { ground, runwayGroup, sun, ambient, hemi };
}

/**
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} renderer
 */
export function applyQuality(scene, renderer) {
  const isD = visualQuality === 'D';
  scene.background = new THREE.Color(isD ? SKY_D : SKY_B);
  scene.fog = new THREE.Fog(isD ? SKY_D : SKY_B, WORLD.fogNear, isD ? WORLD.fogFar : WORLD.fogFar * 0.75);
  renderer.shadowMap.enabled = isD;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = isD ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = isD ? 1.05 : 1;
}

function makeGroundMaterial() {
  if (visualQuality === 'D') {
    return new THREE.MeshStandardMaterial({
      color: GROUND_D,
      roughness: 0.92,
      metalness: 0.02,
    });
  }
  return new THREE.MeshLambertMaterial({ color: GROUND_B, flatShading: true });
}

function makeRunwayMaterial(color) {
  if (visualQuality === 'D') {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.05,
    });
  }
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function buildRunway() {
  const group = new THREE.Group();
  const len = WORLD.runwayLength;
  const wid = WORLD.runwayWidth;

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(wid, 0.15, len),
    makeRunwayMaterial(RUNWAY),
  );
  strip.position.y = 0.08;
  strip.receiveShadow = true;
  group.add(strip);

  const centerLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.04, len * 0.92),
    makeRunwayMaterial(RUNWAY_MARK),
  );
  centerLine.position.y = 0.18;
  group.add(centerLine);

  const markMat = makeRunwayMaterial(RUNWAY_MARK);
  for (let i = -3; i <= 3; i++) {
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.08, 0.05, 8), markMat);
    threshold.position.set(i * (wid * 0.11), 0.17, -len * 0.42);
    group.add(threshold);
  }

  return group;
}

function buildHills() {
  const group = new THREE.Group();
  const mat =
    visualQuality === 'D'
      ? new THREE.MeshStandardMaterial({ color: 0x3f5c3a, roughness: 0.95, metalness: 0 })
      : new THREE.MeshLambertMaterial({ color: 0x355233, flatShading: true });

  const placements = [
    [380, 40, -220],
    [-420, 55, 180],
    [520, 70, 400],
    [-300, 35, -480],
    [200, 48, 620],
    [-550, 60, -100],
  ];

  for (const [x, h, z] of placements) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(h * 2.2, h, 6), mat);
    hill.position.set(x, h * 0.45, z);
    hill.castShadow = visualQuality === 'D';
    hill.receiveShadow = visualQuality === 'D';
    group.add(hill);
  }
  return group;
}
