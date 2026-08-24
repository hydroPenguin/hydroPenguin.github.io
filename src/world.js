import * as THREE from 'three';
import { visualQuality, WORLD } from './config.js';

const SKY_D = 0x6ba3c9;
const SKY_B = 0x7a9eb0;
/** Horizon tint — fog + clear color so distant ground melts into sky */
const HORIZON_D = 0xb8d0e4;
const HORIZON_B = 0xa8b8c4;
const ZENITH_D = 0x3a6fa8;
const ZENITH_B = 0x5a7a90;
const GROUND_D = 0x4a6b45;
const GROUND_B = 0x3d5a38;
const RUNWAY = 0x3a3f45;
const RUNWAY_MARK = 0xe8e4d8;

const SKY_RADIUS = 2200;

/**
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} renderer
 */
export function createWorld(scene, renderer) {
  applyQuality(scene, renderer);

  const sky = buildSky();
  scene.add(sky);

  const clouds = buildClouds();
  scene.add(clouds);

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

  const landmarks = buildLandmarks();
  scene.add(landmarks);

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

  return { ground, runwayGroup, sun, ambient, hemi, sky, clouds };
}

/**
 * Keep sky/clouds centered on the camera so the dome never clips at world edges.
 * @param {{ sky: THREE.Object3D, clouds: THREE.Object3D }} world
 * @param {THREE.Camera} camera
 */
export function syncSkyToCamera(world, camera) {
  world.sky.position.copy(camera.position);
  world.clouds.position.set(camera.position.x, 0, camera.position.z);
}

/**
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} renderer
 */
export function applyQuality(scene, renderer) {
  const isD = visualQuality === 'D';
  const horizon = isD ? HORIZON_D : HORIZON_B;
  scene.background = new THREE.Color(horizon);
  scene.fog = new THREE.Fog(horizon, WORLD.fogNear, isD ? WORLD.fogFar : WORLD.fogFar * 0.75);
  renderer.shadowMap.enabled = isD;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = isD ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = isD ? 1.05 : 1;
}

function buildSky() {
  const isD = visualQuality === 'D';
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: {
      topColor: { value: new THREE.Color(isD ? ZENITH_D : ZENITH_B) },
      midColor: { value: new THREE.Color(isD ? SKY_D : SKY_B) },
      horizonColor: { value: new THREE.Color(isD ? HORIZON_D : HORIZON_B) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldDirection;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDirection = worldPos.xyz - cameraPosition;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      varying vec3 vWorldDirection;
      void main() {
        float h = normalize(vWorldDirection).y;
        vec3 col = mix(horizonColor, midColor, smoothstep(-0.02, 0.28, h));
        col = mix(col, topColor, smoothstep(0.2, 0.92, h));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

  const segs = isD ? 32 : 16;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, segs, segs / 2), mat);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  return sky;
}

function buildClouds() {
  const group = new THREE.Group();
  const isD = visualQuality === 'D';
  const puffMat = new THREE.MeshLambertMaterial({
    color: isD ? 0xf4f7fb : 0xe8eef2,
    transparent: true,
    opacity: isD ? 0.88 : 0.75,
    depthWrite: false,
  });

  /** @type {Array<[number, number, number, number]>} x, y, z, scale */
  const clusters = [
    [180, 95, -320, 1.1],
    [-260, 120, 140, 1.35],
    [420, 140, 280, 1.0],
    [-90, 160, -520, 1.5],
    [90, 110, 480, 0.95],
    [-480, 130, -60, 1.2],
    [300, 175, -180, 0.85],
    [-200, 145, 360, 1.15],
  ];
  if (!isD) clusters.length = 5;

  const puffGeo = new THREE.SphereGeometry(28, isD ? 10 : 6, isD ? 8 : 5);
  for (const [cx, cy, cz, scale] of clusters) {
    const cluster = new THREE.Group();
    cluster.position.set(cx, cy, cz);
    cluster.scale.setScalar(scale);
    const offsets = [
      [0, 0, 0, 1],
      [36, 4, -18, 0.72],
      [-32, -2, 22, 0.78],
      [12, 10, 30, 0.55],
      [-18, 6, -28, 0.6],
    ];
    for (const [ox, oy, oz, s] of offsets) {
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.set(ox, oy, oz);
      puff.scale.set(s * 1.6, s * 0.55, s);
      cluster.add(puff);
    }
    group.add(cluster);
  }

  return group;
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
    [680, 85, -350],
    [-640, 75, 420],
    [90, 32, -700],
    [-150, 45, 750],
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

/** Trees, hangar, and field markers near the strip for low-altitude reference. */
function buildLandmarks() {
  const group = new THREE.Group();
  const isD = visualQuality === 'D';

  const foliageMat = isD
    ? new THREE.MeshStandardMaterial({ color: 0x2f5230, roughness: 0.95, metalness: 0 })
    : new THREE.MeshLambertMaterial({ color: 0x2a482c, flatShading: true });
  const trunkMat = isD
    ? new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9, metalness: 0 })
    : new THREE.MeshLambertMaterial({ color: 0x4a3528, flatShading: true });
  const barnMat = isD
    ? new THREE.MeshStandardMaterial({ color: 0x8b4a3a, roughness: 0.88, metalness: 0.05 })
    : new THREE.MeshLambertMaterial({ color: 0x7a4034, flatShading: true });
  const roofMat = isD
    ? new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.75, metalness: 0.1 })
    : new THREE.MeshLambertMaterial({ color: 0x3f454c, flatShading: true });
  const fieldMat = isD
    ? new THREE.MeshStandardMaterial({ color: 0x5c7a42, roughness: 0.98, metalness: 0 })
    : new THREE.MeshLambertMaterial({ color: 0x4e6a38, flatShading: true });
  const rockMat = isD
    ? new THREE.MeshStandardMaterial({ color: 0x6a6e68, roughness: 0.95, metalness: 0 })
    : new THREE.MeshLambertMaterial({ color: 0x5a5e58, flatShading: true });

  const canopyGeo = new THREE.ConeGeometry(4.5, 11, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.55, 0.75, 4.5, 5);

  /** @type {Array<[number, number]>} */
  const treeSpots = [
    [55, -80],
    [70, -40],
    [62, 20],
    [85, 90],
    [48, 160],
    [-58, -100],
    [-72, -30],
    [-65, 50],
    [-80, 130],
    [-52, 200],
    [110, -180],
    [-120, -160],
    [140, 40],
    [-150, 80],
    [95, -250],
    [-100, -220],
    [180, 180],
    [-190, 160],
    [40, 280],
    [-45, 300],
    [220, -60],
    [-240, 20],
  ];
  if (!isD) treeSpots.length = 14;

  for (const [x, z] of treeSpots) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    const canopy = new THREE.Mesh(canopyGeo, foliageMat);
    canopy.position.y = 8.2;
    tree.add(trunk, canopy);
    tree.position.set(x, 0, z);
    const s = 0.75 + ((Math.abs(x) + Math.abs(z)) % 17) * 0.04;
    tree.scale.setScalar(s);
    if (isD) {
      trunk.castShadow = true;
      canopy.castShadow = true;
      canopy.receiveShadow = true;
    }
    group.add(tree);
  }

  // Hangar beside the runway threshold
  const hangar = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(28, 10, 36), barnMat);
  body.position.y = 5;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(30, 1.2, 38), roofMat);
  roof.position.y = 10.4;
  hangar.add(body, roof);
  hangar.position.set(55, 0, -190);
  if (isD) {
    body.castShadow = true;
    body.receiveShadow = true;
    roof.castShadow = true;
  }
  group.add(hangar);

  // Control-tower stub opposite the hangar
  const tower = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(4, 18, 4), roofMat);
  shaft.position.y = 9;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 7), barnMat);
  cab.position.y = 20;
  tower.add(shaft, cab);
  tower.position.set(-42, 0, -140);
  if (isD) {
    shaft.castShadow = true;
    cab.castShadow = true;
  }
  group.add(tower);

  // Pale field patches so the green isn't one sheet from altitude
  const fieldGeo = new THREE.CircleGeometry(55, isD ? 12 : 8);
  const fieldSpots = [
    [160, -120],
    [-180, 60],
    [240, 220],
    [-260, -280],
    [40, 420],
    [-320, 300],
  ];
  for (const [x, z] of fieldSpots) {
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.rotation.x = -Math.PI / 2;
    field.position.set(x, 0.05, z);
    field.receiveShadow = isD;
    group.add(field);
  }

  // A few rock piles for near-ground texture
  const rockGeo = new THREE.DodecahedronGeometry(3.5, 0);
  const rockSpots = [
    [35, -50],
    [-38, 30],
    [100, 250],
    [-90, -300],
    [300, 90],
  ];
  for (const [x, z] of rockSpots) {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(x, 1.4, z);
    rock.rotation.set(0.3, x * 0.01, 0.2);
    rock.scale.set(1, 0.65, 1.15);
    if (isD) {
      rock.castShadow = true;
      rock.receiveShadow = true;
    }
    group.add(rock);
  }

  return group;
}
