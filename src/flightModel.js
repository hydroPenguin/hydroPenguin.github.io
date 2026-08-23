import * as THREE from 'three';
import { AIRCRAFT } from './config.js';

const _forward = new THREE.Vector3();
const _up = new THREE.Vector3();
const _right = new THREE.Vector3();
const _vel = new THREE.Vector3();
const _velDir = new THREE.Vector3();
const _force = new THREE.Vector3();
const _liftDir = new THREE.Vector3();
const _torque = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _angVel = new THREE.Vector3();

const RHO = 1.225;

/**
 * Apply thrust, lift, drag, and control torques to a Rapier rigid body.
 * Body local axes: +Z forward, +Y up, +X right (matches Three.js default after sync).
 */
export class FlightModel {
  constructor() {
    this.throttle = 0.35;
  }

  /**
   * @param {import('@dimforge/rapier3d-compat').RigidBody} body
   * @param {{ pitch: number, roll: number, throttleDelta: number }} input
   * @param {number} dt
   */
  step(body, input, dt) {
    this.throttle = THREE.MathUtils.clamp(
      this.throttle + input.throttleDelta * 0.55 * dt,
      0,
      1,
    );

    const rot = body.rotation();
    _quat.set(rot.x, rot.y, rot.z, rot.w);

    _forward.set(0, 0, 1).applyQuaternion(_quat);
    _up.set(0, 1, 0).applyQuaternion(_quat);
    _right.set(1, 0, 0).applyQuaternion(_quat);

    const lv = body.linvel();
    _vel.set(lv.x, lv.y, lv.z);
    const speed = _vel.length();

    // Thrust
    _force.copy(_forward).multiplyScalar(this.throttle * AIRCRAFT.maxThrust);
    body.addForce({ x: _force.x, y: _force.y, z: _force.z }, true);

    if (speed > 0.5) {
      _velDir.copy(_vel).normalize();

      // Angle of attack: angle between velocity and forward in the pitch plane
      const velAlongFwd = _vel.dot(_forward);
      const velAlongUp = _vel.dot(_up);
      const aoa = Math.atan2(velAlongUp, Math.max(velAlongFwd, 0.01));

      const cl = liftCoefficient(aoa);
      const cd = dragCoefficient(aoa, this.throttle);

      const q = 0.5 * RHO * speed * speed;

      // Lift roughly perpendicular to velocity, toward aircraft up
      _liftDir.copy(_up).sub(_velDir.clone().multiplyScalar(_up.dot(_velDir)));
      if (_liftDir.lengthSq() < 1e-6) {
        _liftDir.copy(_up);
      } else {
        _liftDir.normalize();
      }
      const liftMag = q * AIRCRAFT.wingArea * cl;
      _force.copy(_liftDir).multiplyScalar(liftMag);
      body.addForce({ x: _force.x, y: _force.y, z: _force.z }, true);

      // Drag opposite velocity
      const dragMag = q * AIRCRAFT.dragArea * cd;
      _force.copy(_velDir).multiplyScalar(-dragMag);
      body.addForce({ x: _force.x, y: _force.y, z: _force.z }, true);

      // Mild weathercock / auto-coordination: yaw toward velocity heading in horizontal
      const sideSlip = _vel.dot(_right);
      _torque.copy(_up).multiplyScalar(-sideSlip * AIRCRAFT.autoYawGain * speed);
      body.addTorque({ x: _torque.x, y: _torque.y, z: _torque.z }, true);
    }

    // Control torques in body axes (pitch about -X / +X, roll about Z)
    // ArrowUp = pitch up (nose up) → negative torque about local X if +X is right...
    // Right-hand: positive rotation about +X is pitch nose-down when +Z forward +Y up.
    // So pitch up input → negative X torque.
    const dynamic = THREE.MathUtils.clamp(speed / 40, 0.25, 1.2);
    _torque
      .set(
        -input.pitch * AIRCRAFT.maxPitchTorque * dynamic,
        0,
        -input.roll * AIRCRAFT.maxRollTorque * dynamic,
      )
      .applyQuaternion(_quat);
    body.addTorque({ x: _torque.x, y: _torque.y, z: _torque.z }, true);

    // Angular damping feel
    const av = body.angvel();
    _angVel.set(av.x, av.y, av.z).multiplyScalar(-1.8);
    body.addTorque({ x: _angVel.x, y: _angVel.y, z: _angVel.z }, true);
  }

  reset() {
    this.throttle = 0.35;
  }
}

function liftCoefficient(aoa) {
  const stall = AIRCRAFT.stallAoA;
  const clamped = THREE.MathUtils.clamp(aoa, -stall * 1.4, stall * 1.4);
  let cl = 4.8 * clamped;
  if (Math.abs(aoa) > stall) {
    const over = Math.abs(aoa) - stall;
    cl *= Math.max(0.15, 1 - over * 3.5);
    cl = Math.sign(cl) * Math.abs(cl);
  }
  return cl + 0.25; // slight camber / ground-effect-ish baseline
}

function dragCoefficient(aoa, throttle) {
  const base = 0.045 + 0.02 * throttle;
  return base + 1.1 * aoa * aoa;
}
