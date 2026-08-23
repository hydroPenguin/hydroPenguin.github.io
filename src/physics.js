import RAPIER from '@dimforge/rapier3d-compat';
import { AIRCRAFT, SPAWN, WORLD } from './config.js';

/**
 * @typedef {Object} PhysicsWorld
 * @property {RAPIER.World} world
 * @property {RAPIER.RigidBody} aircraft
 * @property {() => void} resetAircraft
 * @property {() => void} step
 */

/** @returns {Promise<PhysicsWorld>} */
export async function createPhysics() {
  await RAPIER.init();

  const gravity = { x: 0.0, y: -9.81, z: 0.0 };
  const world = new RAPIER.World(gravity);

  // Infinite-ish ground collider
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(WORLD.groundSize / 2, 0.5, WORLD.groundSize / 2).setTranslation(
      0,
      -0.5,
      0,
    ),
    groundBody,
  );

  // Runway slightly raised for visual match
  const runwayBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(WORLD.runwayWidth / 2, 0.1, WORLD.runwayLength / 2).setTranslation(
      0,
      0.1,
      0,
    ),
    runwayBody,
  );

  const aircraft = createAircraftBody(world);

  return {
    world,
    aircraft,
    resetAircraft: () => resetAircraft(aircraft),
    step: () => world.step(),
  };
}

/** @param {RAPIER.World} world */
function createAircraftBody(world) {
  const desc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(SPAWN.position.x, SPAWN.position.y, SPAWN.position.z)
    .setLinearDamping(0.05)
    .setAngularDamping(1.2)
    .setCanSleep(false)
    .setAdditionalMassProperties(
      AIRCRAFT.mass,
      { x: 0, y: 0.4, z: 0 },
      // Principal inertia-ish for a light plane
      { x: 800, y: 1200, z: 600 },
      { x: 0, y: 0, z: 0, w: 1 },
    );

  const body = world.createRigidBody(desc);

  // Density 0 so mass comes only from setAdditionalMassProperties
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.55, 0.5, 2.6)
      .setTranslation(0, 0.55, 0)
      .setDensity(0)
      .setFriction(0.6)
      .setRestitution(0.05),
    body,
  );

  world.createCollider(
    RAPIER.ColliderDesc.cuboid(4.75, 0.1, 0.8)
      .setTranslation(0, 0.85, 0.2)
      .setDensity(0)
      .setFriction(0.4)
      .setRestitution(0.05),
    body,
  );

  return body;
}

/** @param {RAPIER.RigidBody} body */
function resetAircraft(body) {
  body.setTranslation(SPAWN.position, true);
  body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp();
}
