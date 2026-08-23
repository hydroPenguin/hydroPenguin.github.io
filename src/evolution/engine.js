import {
  MAX_CREATURES,
  MAX_FOOD,
  GENE_RANGES,
  FOOD_ENERGY,
  REPRODUCE_ENERGY,
  BIRTH_ENERGY,
  START_ENERGY,
  FOOD_RADIUS,
  EAT_PADDING,
  DEFAULT_PARAMS,
  STATS_HISTORY_LENGTH,
} from './constants';

const CELL_SIZE = 64;
const TWO_PI = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function mutateGene(value, rate, range) {
  if (Math.random() > rate) return value;
  const span = range.max - range.min;
  const delta = (Math.random() - 0.5) * span * rate * 2.4;
  return clamp(value + delta, range.min, range.max);
}

function createGenes(base, mutationRate) {
  if (!base) {
    return {
      speed: randomInRange(GENE_RANGES.speed.min, GENE_RANGES.speed.max * 0.7),
      size: randomInRange(GENE_RANGES.size.min, GENE_RANGES.size.max * 0.55),
      sense: randomInRange(GENE_RANGES.sense.min, GENE_RANGES.sense.max * 0.55),
      hue: randomInRange(0, 360),
      metabolism: randomInRange(
        GENE_RANGES.metabolism.min,
        GENE_RANGES.metabolism.max * 0.7
      ),
    };
  }

  return {
    speed: mutateGene(base.speed, mutationRate, GENE_RANGES.speed),
    size: mutateGene(base.size, mutationRate, GENE_RANGES.size),
    sense: mutateGene(base.sense, mutationRate, GENE_RANGES.sense),
    hue: mutateGene(base.hue, mutationRate, GENE_RANGES.hue),
    metabolism: mutateGene(base.metabolism, mutationRate, GENE_RANGES.metabolism),
  };
}

function createCreature(x, y, genes, generation, id) {
  const angle = Math.random() * TWO_PI;
  return {
    id,
    x,
    y,
    vx: Math.cos(angle) * genes.speed * 0.4,
    vy: Math.sin(angle) * genes.speed * 0.4,
    energy: START_ENERGY,
    genes,
    generation,
    age: 0,
    trail: [],
  };
}

function createFood(x, y, id) {
  return { id, x, y };
}

export class SimulationEngine {
  constructor(width, height, params = {}) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.creatures = [];
    this.food = [];
    this.events = [];
    this.nextCreatureId = 1;
    this.nextFoodId = 1;
    this.foodAccumulator = 0;
    this.tickCount = 0;
    this.paused = false;
    this.selectedId = null;
    this.hoverId = null;
    this.statsHistory = [];
    this.reset(this.params.startingPopulation);
  }

  setSize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
  }

  setParams(partial) {
    this.params = { ...this.params, ...partial };
  }

  setPaused(paused) {
    this.paused = paused;
  }

  reset(population = this.params.startingPopulation) {
    this.creatures = [];
    this.food = [];
    this.events = [];
    this.nextCreatureId = 1;
    this.nextFoodId = 1;
    this.foodAccumulator = 0;
    this.tickCount = 0;
    this.selectedId = null;
    this.hoverId = null;
    this.statsHistory = [];

    const count = Math.max(1, Math.floor(population));
    for (let i = 0; i < count; i += 1) {
      this.spawnCreature(
        Math.random() * this.width,
        Math.random() * this.height,
        null,
        0
      );
    }

    const foodCount = Math.min(MAX_FOOD, Math.floor(count * 2.5));
    for (let i = 0; i < foodCount; i += 1) {
      this.spawnFood(Math.random() * this.width, Math.random() * this.height);
    }

    this.events.push({ type: 'reset', x: this.width / 2, y: this.height / 2, t: 0 });
    this.recordStats();
  }

  spawnCreature(x, y, parentGenes = null, generation = 0) {
    if (this.creatures.length >= MAX_CREATURES) {
      this.cullWeakest();
    }
    if (this.creatures.length >= MAX_CREATURES) return null;

    const genes = createGenes(parentGenes, this.params.mutationRate);
    const creature = createCreature(
      clamp(x, 0, this.width),
      clamp(y, 0, this.height),
      genes,
      generation,
      this.nextCreatureId
    );
    this.nextCreatureId += 1;
    this.creatures.push(creature);
    this.events.push({
      type: 'birth',
      x: creature.x,
      y: creature.y,
      hue: genes.hue,
      t: 0,
    });
    return creature;
  }

  spawnFood(x, y) {
    if (this.food.length >= MAX_FOOD) return null;
    const food = createFood(
      clamp(x, 0, this.width),
      clamp(y, 0, this.height),
      this.nextFoodId
    );
    this.nextFoodId += 1;
    this.food.push(food);
    return food;
  }

  sprinkleFood(x, y, amount = 3) {
    for (let i = 0; i < amount; i += 1) {
      const ox = (Math.random() - 0.5) * 28;
      const oy = (Math.random() - 0.5) * 28;
      this.spawnFood(x + ox, y + oy);
    }
  }

  cullWeakest() {
    if (this.creatures.length === 0) return;
    let weakestIndex = 0;
    let weakestScore = Infinity;
    for (let i = 0; i < this.creatures.length; i += 1) {
      const c = this.creatures[i];
      const score = c.energy - c.age * 0.01;
      if (score < weakestScore) {
        weakestScore = score;
        weakestIndex = i;
      }
    }
    const removed = this.creatures.splice(weakestIndex, 1)[0];
    if (removed && this.selectedId === removed.id) this.selectedId = null;
    if (removed && this.hoverId === removed.id) this.hoverId = null;
  }

  buildFoodGrid() {
    const cols = Math.ceil(this.width / CELL_SIZE) || 1;
    const rows = Math.ceil(this.height / CELL_SIZE) || 1;
    const grid = Array.from({ length: cols * rows }, () => []);

    for (let i = 0; i < this.food.length; i += 1) {
      const f = this.food[i];
      const cx = clamp(Math.floor(f.x / CELL_SIZE), 0, cols - 1);
      const cy = clamp(Math.floor(f.y / CELL_SIZE), 0, rows - 1);
      grid[cy * cols + cx].push(i);
    }

    return { grid, cols, rows };
  }

  findNearestFood(creature, foodGrid) {
    const { grid, cols, rows } = foodGrid;
    const sense = creature.genes.sense;
    const cellRadius = Math.ceil(sense / CELL_SIZE);
    const cx = clamp(Math.floor(creature.x / CELL_SIZE), 0, cols - 1);
    const cy = clamp(Math.floor(creature.y / CELL_SIZE), 0, rows - 1);

    let bestIndex = -1;
    let bestDist = sense * sense;

    for (let dy = -cellRadius; dy <= cellRadius; dy += 1) {
      const ny = cy + dy;
      if (ny < 0 || ny >= rows) continue;
      for (let dx = -cellRadius; dx <= cellRadius; dx += 1) {
        const nx = cx + dx;
        if (nx < 0 || nx >= cols) continue;
        const bucket = grid[ny * cols + nx];
        for (let b = 0; b < bucket.length; b += 1) {
          const fi = bucket[b];
          const food = this.food[fi];
          if (!food) continue;
          const ddx = food.x - creature.x;
          const ddy = food.y - creature.y;
          const dist = ddx * ddx + ddy * ddy;
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = fi;
          }
        }
      }
    }

    return bestIndex;
  }

  findCreatureAt(x, y, radiusPad = 8) {
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < this.creatures.length; i += 1) {
      const c = this.creatures[i];
      const dx = c.x - x;
      const dy = c.y - y;
      const hitR = c.genes.size + radiusPad;
      const dist = dx * dx + dy * dy;
      if (dist <= hitR * hitR && dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    return best;
  }

  selectAt(x, y) {
    const hit = this.findCreatureAt(x, y);
    this.selectedId = hit ? hit.id : null;
    return hit;
  }

  hoverAt(x, y) {
    const hit = this.findCreatureAt(x, y);
    this.hoverId = hit ? hit.id : null;
    return hit;
  }

  getSelected() {
    if (this.selectedId == null) return null;
    return this.creatures.find((c) => c.id === this.selectedId) || null;
  }

  recordStats() {
    let genSum = 0;
    let maxGen = 0;
    for (let i = 0; i < this.creatures.length; i += 1) {
      genSum += this.creatures[i].generation;
      if (this.creatures[i].generation > maxGen) {
        maxGen = this.creatures[i].generation;
      }
    }
    const avgGen =
      this.creatures.length > 0 ? genSum / this.creatures.length : 0;

    this.statsHistory.push({
      t: this.tickCount,
      population: this.creatures.length,
      food: this.food.length,
      avgGeneration: Number(avgGen.toFixed(2)),
      maxGeneration: maxGen,
    });

    if (this.statsHistory.length > STATS_HISTORY_LENGTH) {
      this.statsHistory.shift();
    }
  }

  getStatsSnapshot() {
    const latest = this.statsHistory[this.statsHistory.length - 1] || {
      population: this.creatures.length,
      food: this.food.length,
      avgGeneration: 0,
      maxGeneration: 0,
    };
    return {
      ...latest,
      history: this.statsHistory.slice(),
      selected: this.getSelected(),
    };
  }

  consumeEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  tick(dt) {
    if (this.paused) return;

    const steps = Math.max(1, Math.round(this.params.simSpeed));
    const stepDt = dt * (this.params.simSpeed / steps);

    for (let s = 0; s < steps; s += 1) {
      this.simulateStep(stepDt);
    }

    if (this.tickCount % 8 === 0) {
      this.recordStats();
    }
  }

  simulateStep(dt) {
    this.tickCount += 1;
    const foodGrid = this.buildFoodGrid();
    const eaten = new Set();
    const births = [];
    const deaths = [];

    this.foodAccumulator += this.params.foodSpawnRate * dt * 0.016;
    while (this.foodAccumulator >= 1 && this.food.length < MAX_FOOD) {
      this.foodAccumulator -= 1;
      this.spawnFood(Math.random() * this.width, Math.random() * this.height);
    }

    for (let i = 0; i < this.creatures.length; i += 1) {
      const creature = this.creatures[i];
      creature.age += dt;

      const foodIndex = this.findNearestFood(creature, foodGrid);
      let ax = 0;
      let ay = 0;

      if (foodIndex >= 0 && !eaten.has(foodIndex)) {
        const food = this.food[foodIndex];
        const dx = food.x - creature.x;
        const dy = food.y - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        ax = (dx / dist) * creature.genes.speed * 0.35;
        ay = (dy / dist) * creature.genes.speed * 0.35;

        const eatDist = creature.genes.size + FOOD_RADIUS + EAT_PADDING;
        if (dist < eatDist) {
          eaten.add(foodIndex);
          creature.energy += FOOD_ENERGY;
          this.events.push({
            type: 'eat',
            x: food.x,
            y: food.y,
            hue: creature.genes.hue,
            t: 0,
          });
        }
      } else {
        ax += (Math.random() - 0.5) * creature.genes.speed * 0.2;
        ay += (Math.random() - 0.5) * creature.genes.speed * 0.2;
      }

      creature.vx = creature.vx * 0.92 + ax;
      creature.vy = creature.vy * 0.92 + ay;

      const speed = Math.sqrt(creature.vx * creature.vx + creature.vy * creature.vy);
      const maxSpeed = creature.genes.speed;
      if (speed > maxSpeed && speed > 0) {
        creature.vx = (creature.vx / speed) * maxSpeed;
        creature.vy = (creature.vy / speed) * maxSpeed;
      }

      creature.x += creature.vx * dt;
      creature.y += creature.vy * dt;

      if (creature.x < 0) {
        creature.x = 0;
        creature.vx *= -1;
      } else if (creature.x > this.width) {
        creature.x = this.width;
        creature.vx *= -1;
      }
      if (creature.y < 0) {
        creature.y = 0;
        creature.vy *= -1;
      } else if (creature.y > this.height) {
        creature.y = this.height;
        creature.vy *= -1;
      }

      const moveCost =
        creature.genes.metabolism *
        (0.6 + speed * 0.25 + creature.genes.size * 0.04);
      creature.energy -= moveCost * dt;

      creature.trail.push({ x: creature.x, y: creature.y });
      if (creature.trail.length > 10) creature.trail.shift();

      if (creature.energy >= REPRODUCE_ENERGY) {
        creature.energy = BIRTH_ENERGY;
        births.push({
          x: creature.x + (Math.random() - 0.5) * 12,
          y: creature.y + (Math.random() - 0.5) * 12,
          genes: creature.genes,
          generation: creature.generation + 1,
        });
      }

      if (creature.energy <= 0) {
        deaths.push(i);
        this.events.push({
          type: 'death',
          x: creature.x,
          y: creature.y,
          hue: creature.genes.hue,
          t: 0,
        });
      }
    }

    if (eaten.size > 0) {
      const remaining = [];
      for (let i = 0; i < this.food.length; i += 1) {
        if (!eaten.has(i)) remaining.push(this.food[i]);
      }
      this.food = remaining;
    }

    for (let d = deaths.length - 1; d >= 0; d -= 1) {
      const idx = deaths[d];
      const dead = this.creatures[idx];
      if (dead && this.selectedId === dead.id) this.selectedId = null;
      if (dead && this.hoverId === dead.id) this.hoverId = null;
      this.creatures.splice(idx, 1);
    }

    for (let b = 0; b < births.length; b += 1) {
      const birth = births[b];
      this.spawnCreature(birth.x, birth.y, birth.genes, birth.generation);
    }

    while (this.creatures.length > MAX_CREATURES) {
      this.cullWeakest();
    }
  }
}
