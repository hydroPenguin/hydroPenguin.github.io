export class Input {
  constructor() {
    this.pitch = 0;
    this.roll = 0;
    this.throttleDelta = 0;
    this.resetRequested = false;
    this._keys = new Set();

    this._onKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this._keys.add(e.code);
      if (e.code === 'KeyR') this.resetRequested = true;
    };
    this._onKeyUp = (e) => {
      this._keys.delete(e.code);
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  /** Call each frame while flight is enabled */
  update() {
    this.pitch = 0;
    this.roll = 0;
    this.throttleDelta = 0;

    if (this._keys.has('ArrowUp')) this.pitch += 1;
    if (this._keys.has('ArrowDown')) this.pitch -= 1;
    if (this._keys.has('ArrowLeft')) this.roll -= 1;
    if (this._keys.has('ArrowRight')) this.roll += 1;
    if (this._keys.has('KeyW')) this.throttleDelta += 1;
    if (this._keys.has('KeyS')) this.throttleDelta -= 1;
  }

  consumeReset() {
    const v = this.resetRequested;
    this.resetRequested = false;
    return v;
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
