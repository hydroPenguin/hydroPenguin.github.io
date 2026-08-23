import * as THREE from 'three';
import { FIXED_DT, MAX_SUBSTEPS, AIRCRAFT, setVisualQuality, visualQuality } from './config.js';
import { Input } from './input.js';
import { createWorld } from './world.js';
import { createAircraftMesh } from './aircraftMesh.js';
import { createPhysics } from './physics.js';
import { FlightModel } from './flightModel.js';
import { ChaseCamera } from './camera.js';
import { HUD } from './hud.js';

const CRASH_VERTICAL = 14;
const LAND_VERTICAL = 4.5;
const AIRBORNE_HEIGHT = 3.5;

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.flightEnabled = false;
    this.ended = false;
    this.wasAirborne = false;
    this.accum = 0;
    this.clock = new THREE.Clock();
    this.input = new Input();
    this.flight = new FlightModel();
    this.hud = new HUD();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2500,
    );

    this.worldVisuals = createWorld(this.scene, this.renderer);
    this.aircraftMesh = createAircraftMesh();
    this.scene.add(this.aircraftMesh);

    this.chase = new ChaseCamera(this.camera, this.aircraftMesh);
    this.physics = null;

    this._overlay = document.getElementById('overlay');
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    this._fpsSamples = [];
    this._lastFpsCheck = 0;
  }

  async init() {
    this.physics = await createPhysics();
    this.syncMesh();
    this.chase.snapBehind();
    this.bindStartGate();
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  bindStartGate() {
    const start = (e) => {
      if (e.repeat) return;
      if (this.flightEnabled) return;
      // Ignore pure modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

      this._overlay.classList.add('is-hidden');
      this.flightEnabled = true;
      this.hud.show();
      this.chase.idleOrbit = false;
      this.chase.snapBehind();
      window.removeEventListener('keydown', start);
    };
    window.addEventListener('keydown', start);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.hud.tickBanner(dt * 1000);

    if (!this.flightEnabled) {
      this.chase.updateIdle(dt);
      this.spinProp(dt * 8);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.input.consumeReset()) {
      this.reset('RESET');
    }

    this.input.update();

    if (!this.ended) {
      this.accum += dt;
      let steps = 0;
      while (this.accum >= FIXED_DT && steps < MAX_SUBSTEPS) {
        this.physicsStep(FIXED_DT);
        this.accum -= FIXED_DT;
        steps += 1;
      }
      this.checkOutcome();
    }

    this.syncMesh();
    this.spinProp(this.flight.throttle * 28 * dt + 2 * dt);
    this.chase.update(dt);

    const lv = this.physics.aircraft.linvel();
    const speed = Math.hypot(lv.x, lv.y, lv.z);
    const alt = this.physics.aircraft.translation().y;
    this.hud.update({
      speedMs: speed,
      altitudeM: alt,
      throttle: this.flight.throttle,
    });

    this.trackPerf(dt);
    this.renderer.render(this.scene, this.camera);
  }

  /** @param {number} dt */
  physicsStep(dt) {
    const body = this.physics.aircraft;
    body.resetForces(true);
    body.resetTorques(true);
    this.flight.step(body, this.input, dt);
    this.physics.step();
  }

  syncMesh() {
    const t = this.physics.aircraft.translation();
    const r = this.physics.aircraft.rotation();
    this.aircraftMesh.position.set(t.x, t.y, t.z);
    this.aircraftMesh.quaternion.set(r.x, r.y, r.z, r.w);
  }

  /** @param {number} amount */
  spinProp(amount) {
    const prop = this.aircraftMesh.getObjectByName('prop');
    if (prop) prop.rotation.z += amount;
  }

  checkOutcome() {
    const body = this.physics.aircraft;
    const t = body.translation();
    const lv = body.linvel();
    const speed = Math.hypot(lv.x, lv.y, lv.z);
    const vertical = Math.abs(lv.y);
    const height = t.y;

    if (height > AIRBORNE_HEIGHT) {
      this.wasAirborne = true;
    }

    // Upside-down near ground or extreme impact
    const upY = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(this.aircraftMesh.quaternion).y;

    const onGround = height < AIRCRAFT.gearHeight + 1.2;

    if (onGround && this.wasAirborne) {
      if (vertical > CRASH_VERTICAL || speed > AIRCRAFT.crashSpeed || upY < 0.35) {
        this.finish('CRASH', true);
        return;
      }
      if (vertical < LAND_VERTICAL && speed < AIRCRAFT.softLandingSpeed && upY > 0.75) {
        this.finish('TOUCHDOWN', false);
      }
    }

    // Fell off world
    if (height < -5 || Math.hypot(t.x, t.z) > 1800) {
      this.finish('CRASH', true);
    }
  }

  /**
   * @param {string} label
   * @param {boolean} crash
   */
  finish(label, crash) {
    if (this.ended) return;
    this.ended = true;
    this.hud.flash(crash ? `${label} — R to reset` : `${label} — R to fly again`);
    // Soft freeze: kill velocities after a beat via reset wait; leave plane where it is
    const body = this.physics.aircraft;
    const lv = body.linvel();
    body.setLinvel({ x: lv.x * 0.2, y: Math.min(lv.y, 0), z: lv.z * 0.2 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }

  /** @param {string} [banner] */
  reset(banner = 'READY') {
    this.physics.resetAircraft();
    this.flight.reset();
    this.ended = false;
    this.wasAirborne = false;
    this.accum = 0;
    this.syncMesh();
    this.chase.snapBehind();
    this.hud.flash(banner, 1200);
  }

  /** @param {number} dt */
  trackPerf(dt) {
    this._fpsSamples.push(1 / Math.max(dt, 1e-4));
    this._lastFpsCheck += dt;
    if (this._lastFpsCheck < 4) return;
    const avg =
      this._fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, this._fpsSamples.length);
    this._fpsSamples.length = 0;
    this._lastFpsCheck = 0;
    // Auto-drop to Option B if sustained low FPS
    if (avg < 28 && visualQuality === 'D') {
      setVisualQuality('B');
      // Soft note: full material rebuild would need scene rebuild; fog/tonemap still help
      this.scene.fog = new THREE.Fog(0x7a9eb0, 180, 1000);
      this.scene.background = new THREE.Color(0x7a9eb0);
      this.renderer.shadowMap.enabled = false;
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.hud.flash('QUALITY → B', 1600);
    }
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
