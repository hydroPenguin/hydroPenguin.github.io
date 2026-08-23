import {
  WORLD_BG,
  FOOD_COLOR,
  FOOD_RADIUS,
  TRAIL_LOD_THRESHOLD,
} from './constants';

const MAX_FX = 80;

function hsl(hue, sat, light, alpha = 1) {
  return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
}

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.fx = [];
    this.camera = { zoom: 1, panX: 0, panY: 0 };
  }

  setCamera(camera) {
    this.camera = camera;
  }

  resize(cssWidth, cssHeight) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.width = Math.max(1, Math.floor(cssWidth));
    this.height = Math.max(1, Math.floor(cssHeight));
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  applyScreenTransform() {
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  applyWorldTransform() {
    const { ctx, dpr, camera } = this;
    ctx.setTransform(
      dpr * camera.zoom,
      0,
      0,
      dpr * camera.zoom,
      dpr * camera.panX,
      dpr * camera.panY
    );
  }

  addEvents(events) {
    for (let i = 0; i < events.length; i += 1) {
      const e = events[i];
      if (e.type === 'reset') {
        this.fx.push({
          kind: 'shockwave',
          x: e.x,
          y: e.y,
          life: 1,
          decay: 0.018,
          hue: 170,
        });
        continue;
      }
      this.fx.push({
        kind: e.type,
        x: e.x,
        y: e.y,
        life: 1,
        decay: e.type === 'death' ? 0.03 : 0.045,
        hue: e.hue ?? 160,
      });
    }
    if (this.fx.length > MAX_FX) {
      this.fx.splice(0, this.fx.length - MAX_FX);
    }
  }

  clear() {
    const { ctx, width, height } = this;
    this.applyScreenTransform();
    ctx.fillStyle = WORLD_BG;
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.35,
      Math.min(width, height) * 0.1,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );
    gradient.addColorStop(0, 'rgba(30, 58, 95, 0.35)');
    gradient.addColorStop(0.55, 'rgba(15, 23, 42, 0.15)');
    gradient.addColorStop(1, 'rgba(2, 6, 14, 0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  drawFood(food) {
    const { ctx } = this;
    ctx.save();
    for (let i = 0; i < food.length; i += 1) {
      const f = food[i];
      ctx.beginPath();
      ctx.fillStyle = FOOD_COLOR;
      ctx.globalAlpha = 0.85;
      ctx.arc(f.x, f.y, FOOD_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.globalAlpha = 0.25;
      ctx.arc(f.x, f.y, FOOD_RADIUS * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawTrails(creatures) {
    if (creatures.length > TRAIL_LOD_THRESHOLD) return;
    const { ctx } = this;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < creatures.length; i += 1) {
      const c = creatures[i];
      if (!c.trail || c.trail.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = hsl(c.genes.hue, 70, 60, 0.22);
      ctx.lineWidth = Math.max(1, c.genes.size * 0.35);
      ctx.moveTo(c.trail[0].x, c.trail[0].y);
      for (let t = 1; t < c.trail.length; t += 1) {
        ctx.lineTo(c.trail[t].x, c.trail[t].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCreatures(creatures, selectedId, hoverId) {
    const { ctx } = this;
    for (let i = 0; i < creatures.length; i += 1) {
      const c = creatures[i];
      const isFocus = c.id === selectedId || c.id === hoverId;
      const energyRatio = Math.max(0.15, Math.min(1, c.energy / 95));

      if (isFocus) {
        ctx.beginPath();
        ctx.strokeStyle = hsl(c.genes.hue, 80, 70, 0.35);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.arc(c.x, c.y, c.genes.sense, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.fillStyle = hsl(c.genes.hue, 72, 28 + energyRatio * 28, 0.95);
      ctx.shadowColor = hsl(c.genes.hue, 90, 55, isFocus ? 0.55 : 0.25);
      ctx.shadowBlur = isFocus ? 16 : 8;
      ctx.arc(c.x, c.y, c.genes.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const angle = Math.atan2(c.vy, c.vx);
      const tip = c.genes.size * 1.35;
      ctx.beginPath();
      ctx.fillStyle = hsl(c.genes.hue, 80, 75, 0.9);
      ctx.moveTo(
        c.x + Math.cos(angle) * tip,
        c.y + Math.sin(angle) * tip
      );
      ctx.lineTo(
        c.x + Math.cos(angle + 2.5) * c.genes.size * 0.55,
        c.y + Math.sin(angle + 2.5) * c.genes.size * 0.55
      );
      ctx.lineTo(
        c.x + Math.cos(angle - 2.5) * c.genes.size * 0.55,
        c.y + Math.sin(angle - 2.5) * c.genes.size * 0.55
      );
      ctx.closePath();
      ctx.fill();
    }
  }

  drawFx() {
    const { ctx } = this;
    const next = [];
    for (let i = 0; i < this.fx.length; i += 1) {
      const fx = this.fx[i];
      fx.life -= fx.decay;
      if (fx.life <= 0) continue;
      next.push(fx);

      const alpha = fx.life;
      if (fx.kind === 'shockwave') {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(94, 234, 212, ${alpha * 0.55})`;
        ctx.lineWidth = 3 * fx.life;
        ctx.arc(fx.x, fx.y, (1 - fx.life) * 180 + 20, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }

      const radius =
        fx.kind === 'death'
          ? 8 + (1 - fx.life) * 28
          : 4 + (1 - fx.life) * 18;

      ctx.beginPath();
      ctx.fillStyle = hsl(
        fx.hue,
        fx.kind === 'eat' ? 85 : 70,
        fx.kind === 'birth' ? 70 : 55,
        alpha * 0.55
      );
      ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    this.fx = next;
  }

  drawVignette() {
    const { ctx, width, height } = this;
    this.applyScreenTransform();
    const g = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  render(engine) {
    this.clear();
    this.applyWorldTransform();
    this.drawFood(engine.food);
    this.drawTrails(engine.creatures);
    this.drawCreatures(engine.creatures, engine.selectedId, engine.hoverId);
    this.drawFx();
    this.drawVignette();
  }
}
