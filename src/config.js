/** @typedef {'D' | 'B'} VisualQuality */

export const FIXED_DT = 1 / 60;
export const MAX_SUBSTEPS = 5;

export const WORLD = {
  groundSize: 2400,
  runwayLength: 420,
  runwayWidth: 28,
  fogNear: 180,
  fogFar: 1400,
};

export const SPAWN = {
  /** Body origin so fuselage rests on runway (~y 0.2); near threshold facing +Z */
  position: { x: 0, y: 0.18, z: -160 },
  yaw: 0,
};

export const AIRCRAFT = {
  mass: 900,
  wingArea: 18,
  dragArea: 1.35,
  maxThrust: 11000,
  maxPitchTorque: 4800,
  maxRollTorque: 4200,
  autoYawGain: 0.4,
  stallAoA: 0.3,
  crashSpeed: 32,
  softLandingSpeed: 14,
  gearHeight: 0.9,
};

/** meters/sec → knots */
export const MS_TO_KT = 1.94384;
/** meters → feet */
export const M_TO_FT = 3.28084;

/** @type {VisualQuality} */
export let visualQuality = 'D';

/** @param {VisualQuality} q */
export function setVisualQuality(q) {
  visualQuality = q;
}
