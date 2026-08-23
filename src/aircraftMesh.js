import * as THREE from 'three';
import { visualQuality } from './config.js';

/**
 * Low-poly GA trainer-style mesh. Local +Z is nose-forward.
 * @returns {THREE.Group}
 */
export function createAircraftMesh() {
  const root = new THREE.Group();
  root.name = 'aircraft';

  const fuselageMat = mat(0xc9cfd6);
  const wingMat = mat(0xd6dde3);
  const accentMat = mat(0xc45c3a);
  const darkMat = mat(0x2a3038);
  const glassMat =
    visualQuality === 'D'
      ? new THREE.MeshStandardMaterial({
          color: 0x7eb6d4,
          roughness: 0.15,
          metalness: 0.4,
          transparent: true,
          opacity: 0.65,
        })
      : new THREE.MeshLambertMaterial({ color: 0x6a9bb0, flatShading: true });

  const fuse = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 5.2), fuselageMat);
  fuse.position.set(0, 0.55, 0);
  fuse.castShadow = true;
  root.add(fuse);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 1.2), accentMat);
  nose.position.set(0, 0.5, 2.9);
  nose.castShadow = true;
  root.add(nose);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 1.6), glassMat);
  cabin.position.set(0, 1.15, 0.6);
  root.add(cabin);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.18, 1.6), wingMat);
  wing.position.set(0, 0.85, 0.2);
  wing.castShadow = true;
  root.add(wing);

  const stab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.9), wingMat);
  stab.position.set(0, 0.7, -2.3);
  stab.castShadow = true;
  root.add(stab);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 1.1), accentMat);
  fin.position.set(0, 1.35, -2.35);
  fin.castShadow = true;
  root.add(fin);

  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.18), darkMat);
  prop.position.set(0, 0.5, 3.55);
  prop.name = 'prop';
  root.add(prop);

  const gearL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.15, 10), darkMat);
  gearL.rotation.z = Math.PI / 2;
  gearL.position.set(-1.1, 0.12, 0.4);
  root.add(gearL);

  const gearR = gearL.clone();
  gearR.position.x = 1.1;
  root.add(gearR);

  const gearN = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 10), darkMat);
  gearN.rotation.z = Math.PI / 2;
  gearN.position.set(0, 0.1, 2.2);
  root.add(gearN);

  return root;
}

function mat(color) {
  if (visualQuality === 'D') {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.12,
    });
  }
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}
