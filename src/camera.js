import * as THREE from 'three';

const _desired = new THREE.Vector3();
const _look = new THREE.Vector3();
const _fwd = new THREE.Vector3();

export class ChaseCamera {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {THREE.Object3D} target
   */
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;
    this.offset = new THREE.Vector3(0, 4.5, -14);
    this.lookAhead = 8;
    this.smooth = 4.5;
    this.idleOrbit = true;
    this._idleAngle = 0.35;
  }

  /** Gentle orbit while waiting on the start screen */
  updateIdle(dt) {
    this._idleAngle += dt * 0.12;
    const pos = this.target.position;
    const r = 18;
    this.camera.position.set(
      pos.x + Math.sin(this._idleAngle) * r,
      pos.y + 6,
      pos.z + Math.cos(this._idleAngle) * r - 4,
    );
    this.camera.lookAt(pos.x, pos.y + 1, pos.z);
  }

  /** @param {number} dt */
  update(dt) {
    this.target.getWorldDirection(_fwd);

    _desired.copy(this.offset);
    // Offset in target local space: behind (-Z relative to forward if offset.z negative)
    const q = this.target.quaternion;
    _desired.applyQuaternion(q);
    _desired.add(this.target.position);

    // Prefer staying above ground a bit
    _desired.y = Math.max(_desired.y, this.target.position.y + 2.5);

    const a = 1 - Math.exp(-this.smooth * dt);
    this.camera.position.lerp(_desired, a);

    _look.copy(this.target.position).addScaledVector(_fwd, this.lookAhead);
    _look.y += 1.2;
    this.camera.lookAt(_look);
  }

  snapBehind() {
    this.target.getWorldDirection(_fwd);
    _desired.copy(this.offset).applyQuaternion(this.target.quaternion).add(this.target.position);
    this.camera.position.copy(_desired);
    _look.copy(this.target.position).addScaledVector(_fwd, this.lookAhead);
    this.camera.lookAt(_look);
  }
}
