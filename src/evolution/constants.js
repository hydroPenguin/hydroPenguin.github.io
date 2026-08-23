export const MAX_CREATURES = 400;
export const MAX_FOOD = 280;
export const TRAIL_LOD_THRESHOLD = 220;
export const STATS_HISTORY_LENGTH = 60;

export const DEFAULT_PARAMS = {
  mutationRate: 0.12,
  foodSpawnRate: 18,
  startingPopulation: 40,
  simSpeed: 1,
};

export const GENE_RANGES = {
  speed: { min: 0.4, max: 3.2 },
  size: { min: 3.5, max: 14 },
  sense: { min: 28, max: 120 },
  hue: { min: 0, max: 360 },
  metabolism: { min: 0.012, max: 0.055 },
};

export const FOOD_ENERGY = 28;
export const REPRODUCE_ENERGY = 95;
export const BIRTH_ENERGY = 42;
export const START_ENERGY = 55;
export const FOOD_RADIUS = 3.2;
export const EAT_PADDING = 2;

export const WORLD_BG = '#0b1220';
export const FOOD_COLOR = '#7dffb3';
export const ACCENT = '#5eead4';

export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 3.5;
export const ZOOM_STEP = 1.15;
