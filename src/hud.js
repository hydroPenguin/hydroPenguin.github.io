import { MS_TO_KT, M_TO_FT } from './config.js';

export class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    this.speed = document.getElementById('hud-speed');
    this.alt = document.getElementById('hud-alt');
    this.thr = document.getElementById('hud-thr');
    this.banner = document.getElementById('banner');
    this._bannerTimer = 0;
  }

  show() {
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
  }

  /**
   * @param {{ speedMs: number, altitudeM: number, throttle: number }} state
   */
  update(state) {
    this.speed.textContent = String(Math.round(state.speedMs * MS_TO_KT));
    this.alt.textContent = String(Math.max(0, Math.round(state.altitudeM * M_TO_FT)));
    this.thr.textContent = String(Math.round(state.throttle * 100));
  }

  /**
   * @param {string} text
   * @param {number} ms
   */
  flash(text, ms = 2200) {
    this.banner.textContent = text;
    this.banner.hidden = false;
    this._bannerTimer = ms;
  }

  /** @param {number} dtMs */
  tickBanner(dtMs) {
    if (this._bannerTimer <= 0) return;
    this._bannerTimer -= dtMs;
    if (this._bannerTimer <= 0) {
      this.banner.hidden = true;
    }
  }
}
