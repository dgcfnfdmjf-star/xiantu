'use strict';

// Exercise the shipped mixer/clone code with the same Three r128 implementation,
// without a WebGL context. Browser tests separately inspect the exported cat skins.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const THREE = require('../assets/cats/vendor/three-r128/three.min.js');
const source = fs.readFileSync(path.join(__dirname, '../src/cat-models.js'), 'utf8');
const geometrySource = fs.readFileSync(path.join(__dirname, '../assets/cats/cat-geometry.js'), 'utf8');

// r128's CPU readers do not normalize integer attributes. Test the padded,
// interleaved format used by the actual GLBs, including corrective positions.
{
  const window = { THREE };
  vm.runInNewContext(geometrySource, { window, Set, Float32Array, Int16Array, Uint16Array, Int8Array, Uint8Array });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(new Int16Array([32767, 0, -32767, 0, 0, 16384, 0, 0]), 4), 3, 0, true));
  geometry.setAttribute('skinWeight', new THREE.Uint8BufferAttribute([128, 127, 0, 0, 255, 0, 0, 0], 4, true));
  geometry.morphAttributes.position = [new THREE.Int16BufferAttribute([16384, 0, 0, 0, 0, 0], 3, true)];
  geometry.morphTargetsRelative = true;
  const scene = new THREE.Group(); scene.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()));
  window.GardenCatGeometry.prepare(scene);
  assert.deepEqual(Array.from(geometry.attributes.position.array).slice(0, 3), [1, 0, -1]);
  assert(Math.abs(geometry.attributes.skinWeight.getX(0) - 128 / 255) < 1e-7);
  assert(Math.abs(geometry.morphAttributes.position[0].getX(0) - 16384 / 32767) < 1e-7);
  assert.equal(geometry.attributes.position.normalized, false);
  const prepared = geometry.attributes.position;
  window.GardenCatGeometry.prepare(scene);
  assert.equal(geometry.attributes.position, prepared, 'preparation is idempotent and shared per template');
  assert.equal(window.GardenCatGeometry.seatedBounds(scene).max.x, 1, 'normalization bounds exclude dormant corrective extremes');
  const mesh = scene.children[0];
  mesh.morphTargetDictionary = { 'Walk surface completion': 0 };
  mesh.material.morphTargets = true; mesh.material.morphNormals = true;
  window.GardenCatGeometry.specialize(scene);
  assert.equal(mesh.material.morphTargets, false, 'fixed completion uses the non-morph shader in r128');
  assert.equal(mesh.material.morphNormals, false);
  const restGeometry = mesh.geometry, clone = scene.clone(true);
  window.GardenCatGeometry.setWalk(clone, true);
  assert.equal(mesh.geometry, restGeometry, 'one actor changing pose does not change its sibling');
  assert.notEqual(clone.children[0].geometry, restGeometry);
  assert(Math.abs(clone.children[0].geometry.attributes.position.getX(0) - (1 + 16384 / 32767)) < 1e-7);
  assert.equal(Object.keys(clone.children[0].geometry.morphAttributes).length, 0, 'constant completion has no per-frame GPU morph work');
  window.GardenCatGeometry.setWalk(scene, true);
  assert.equal(mesh.geometry, clone.children[0].geometry, 'same-coat actors share the precomputed walking surface');
  window.GardenCatGeometry.setWalk(scene, false);
  assert.equal(mesh.geometry, restGeometry, 'sitting restores the original surface without rebuilding it');
}

function template() {
  const scene = new THREE.Group(), root = new THREE.Bone(), leg = new THREE.Bone(), tail = new THREE.Bone();
  scene.name = 'CatScene'; root.name = 'Rig'; root.userData.catWalkStride = .56; root.userData.catWalkRadius = .7;
  leg.name = 'Foreleg'; leg.position.set(.1, .4, .03);
  tail.name = 'Tail'; tail.position.set(-.1, .2, -.2);
  root.add(leg, tail); scene.add(root); scene.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton([root, leg, tail]);
  const geometry = new THREE.BoxGeometry(.2, 1, .3).translate(0, .5, 0);
  const joints = [], weights = [];
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    joints.push(i % 2 ? 1 : 2, 0, 0, 0); weights.push(1, 0, 0, 0);
  }
  geometry.setAttribute('skinIndex', new THREE.Uint8BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.morphTargetsRelative = true;
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(
    Array.from({ length: geometry.attributes.position.count * 3 }, (_, i) => i % 3 === 0 ? .02 : 0), 3)];
  const material = new THREE.MeshStandardMaterial({ skinning: true });
  for (const name of ['Coat', 'Details']) {
    const mesh = new THREE.SkinnedMesh(geometry, material); mesh.name = name;
    scene.add(mesh); mesh.bind(skeleton);
  }
  const rotations = [];
  for (const angle of [0, .45, 0, -.45, 0]) {
    rotations.push(...new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle).toArray());
  }
  const clip = new THREE.AnimationClip('Walk', 1.6, [
    new THREE.NumberKeyframeTrack('Coat.morphTargetInfluences[0]', [0, 1.6], [1, 1]),
    new THREE.QuaternionKeyframeTrack('Foreleg.quaternion', [0, .4, .8, 1.2, 1.6], rotations),
    new THREE.VectorKeyframeTrack('Tail.position', [0, .4, .8, 1.2, 1.6], [-.1, .2, -.2, -.08, .21, -.2, -.1, .2, -.2, -.12, .21, -.2, -.1, .2, -.2])
  ]);
  return { scene, animations: [clip] };
}

function harness(options = {}) {
  const requests = [], pending = [], assets = {}, decoders = [];
  class Loader {
    setMeshoptDecoder(decoder) { decoders.push(decoder); return this; }
    load(url, loaded, progress, failed) {
      const kind = /([^/]+)-cat\.glb$/.exec(url)[1]; requests.push(kind);
      const respond = () => {
        if (options.fail === kind) return failed();
        const asset = assets[kind] = template();
        if (options.static === kind) asset.animations = [];
        if (options.badRig === kind) asset.scene.remove(asset.scene.getObjectByName('Rig'));
        if (options.badClip === kind) asset.animations[0].tracks = [null];
        if (options.noExtent === kind) delete asset.scene.getObjectByName('Rig').userData.catWalkRadius;
        if (options.smallExtent === kind) asset.scene.getObjectByName('Rig').userData.catWalkRadius = .01;
        loaded(asset);
      };
      if (options.held) pending.push(respond); else queueMicrotask(respond);
    }
  }
  const window = { THREE: { ...THREE, GLTFLoader: Loader }, MeshoptDecoder: options.decoder };
  vm.runInNewContext(geometrySource, { window, Map, Set, WeakMap, WeakSet, Float32Array, Int16Array, Uint16Array, Int8Array, Uint8Array });
  vm.runInNewContext(source, { window, Map, Array, Promise, isFinite, Math }, { filename: 'cat-models.js' });
  const island = new THREE.Group();
  function kitten(kind = 'orange', phase = .7) {
    const root = new THREE.Group(), inner = new THREE.Group(); root.add(inner); island.add(root);
    root.position.set(1, .25, 2); root.rotation.y = 1.3;
    return { root, inner, x:1, z:2, kind: { id: kind }, size: 1.3, phase, dead: false, state: 'idle', moving: false, crouch: 0, curl: 0 };
  }
  return { api: window.GardenCatModels, requests, pending, assets, island, kitten, decoders };
}

function transforms(model) {
  const values = [];
  model.traverse(n => values.push([n.name, n.position.toArray(), n.quaternion.toArray(), n.scale.toArray()]));
  return values;
}
const settle = () => new Promise(resolve => setImmediate(resolve));
function moving(api, k, speed = .55) {
  k.state = 'roam'; k.moving = true; k.catWalkSpeed = speed;
  for (let i = 0; i < 8; i++) { k.z += speed * .05; api.pose(k, 1 + i * .05, .05); }
}

(async () => {
  const decoder = { supported: true }, h = harness({ decoder }), a = h.kitten(), b = h.kitten('orange', 3.2);
  const rootTransform = transforms(a.root);
  h.api.setLevel(1, [a, b]); await settle();
  assert.equal(h.requests.length, 0, 'other chapters do not load the Walk assets');
  h.api.setLevel(2, [a, b]);
  assert(a.inner.visible && b.inner.visible, 'procedural fallback remains during load');
  await settle();
  assert.deepEqual(h.requests, ['orange'], 'same-coat actors share one template request');
  assert.deepEqual(h.decoders, [decoder], 'one shared loader uses the bundled lossless decoder');
  assert(a.catMixer && b.catMixer && !a.inner.visible && !b.inner.visible);
  const aMesh = a.catModel.getObjectByName('Coat'), bMesh = b.catModel.getObjectByName('Coat');
  const originalMesh = h.assets.orange.scene.getObjectByName('Coat');
  assert.equal(aMesh.geometry, bMesh.geometry); assert.equal(aMesh.material, bMesh.material);
  assert.notEqual(aMesh.morphTargetInfluences, bMesh.morphTargetInfluences);
  assert.equal(aMesh.morphTargetInfluences[0], 0, 'new inner-leg fullness stays hidden in the seated rest');
  assert.notEqual(aMesh.skeleton, bMesh.skeleton); assert.notEqual(aMesh.skeleton, originalMesh.skeleton);
  assert.equal(aMesh.material.skinning, false, 'seated rest skips an identity skinning shader');
  assert.equal(aMesh.skeleton, a.catModel.getObjectByName('Details').skeleton, 'one instance reuses its own skeleton across meshes');
  aMesh.skeleton.bones.forEach((bone, i) => {
    assert.equal(bone, a.catModel.getObjectByName(originalMesh.skeleton.bones[i].name));
    assert.notEqual(bone, bMesh.skeleton.bones[i]);
    assert.notEqual(bone, originalMesh.skeleton.bones[i]);
  });
  assert.equal(aMesh.frustumCulled, false, 'moving skins are not cut against stale seated bounds');
  const rest = transforms(a.catModel), untouchedB = transforms(b.catModel), untouchedTemplate = transforms(h.assets.orange.scene);
  const restFootprint = a.catFootprint;
  assert.equal(restFootprint, a.catRestRadius * a.catWalkScale * a.size, 'initial footprint matches the seated mesh');
  a.state = 'roam'; a.moving = true; a.catWalkSpeed = .55;
  const beforePrepare = { mixerTime: a.catMixer.time, weight: a.catWalkWeight, pose: transforms(a.catModel) };
  h.api.prepareWalk(a, .05);
  const preparedFootprint = a.catFootprint;
  assert(preparedFootprint > restFootprint, 'push-out receives the upcoming larger footprint before the pose changes');
  assert.equal(a.catMixer.time, beforePrepare.mixerTime); assert.equal(a.catWalkWeight, beforePrepare.weight);
  assert.deepEqual(transforms(a.catModel), beforePrepare.pose, 'pre-resolve footprint preparation does not tick or deform the model');
  h.api.pose(a, 1, .05);
  assert.equal(a.catFootprint, preparedFootprint, 'rendered Walk uses the footprint already reserved for this frame');
  assert.equal(a.catWalkWeight, 1, 'whole gait avoids unsupported partial corrective poses');
  assert.equal(a.catFootprint, (a.catRestRadius + (.7 - a.catRestRadius) * a.catWalkWeight) * a.catWalkScale * a.size, 'footprint follows actual model/actor scale');
  moving(h.api, a);
  assert.equal(aMesh.material.skinning, true, 'Walk uses real skinning');
  assert.equal(bMesh.material.skinning, false, 'another seated actor retains the cheap material');
  assert.equal(aMesh.morphTargetInfluences[0], 1, 'Walk applies the local inner-leg fullness corrective');
  assert.equal(bMesh.morphTargetInfluences[0], 0, 'another cat keeps its independent seated corrective');
  assert.equal(originalMesh.morphTargetInfluences[0], 0, 'the cached template remains in the original rest');
  assert.equal(a.catFootprint, .7 * a.catWalkScale * a.size, 'full walk uses the exported animated extent');
  assert.notDeepEqual(transforms(a.catModel), rest, 'Walk drives articulated nodes');
  assert.deepEqual(transforms(b.catModel), untouchedB, 'moving one actor never poses another');
  assert.deepEqual(transforms(h.assets.orange.scene), untouchedTemplate, 'cached template stays seated');
  assert.equal(a.catWalkAction.loop, THREE.LoopRepeat);
  assert(Math.abs(a.catWalkAction.getEffectiveTimeScale() - .55 * 1.6 / (.56 * .708 * a.size)) < 1e-10);
  const orientation = a.root.rotation.y, position = a.root.position.toArray();
  for (const speed of [.55, 1.1, .75, 1]) {
    a.catWalkSpeed = speed; a.z += speed * .05; h.api.pose(a, 2, .05);
    assert(Math.abs(a.catWalkAction.getEffectiveTimeScale() - speed * 1.6 / (.56 * .708 * a.size)) < 1e-10);
  }
  a.catWalkSpeed = 1.1; a.z += .012; h.api.pose(a, 2.1, .05);
  assert(Math.abs(a.catWalkActualSpeed - .24) < 1e-10, 'push-out shortens actual travel without changing the requested speed');
  assert(Math.abs(a.catWalkAction.getEffectiveTimeScale() - .24 * 1.6 / (.56 * .708 * a.size)) < 1e-10);
  const planted = a.catWalkAction.time;
  h.api.pose(a, 2.15, .05);
  assert.equal(a.catWalkAction.time, planted, 'completely blocked movement does not march or slide in place');
  assert.equal(a.catWalkAction.getEffectiveTimeScale(), 0);
  assert.equal(a.catWalkSpeed, 1.1, 'gameplay speed is untouched');
  for (let i=0;i<5;i++) h.api.pose(a,2.2+i*.05,.05);
  assert(!a.catWalkActive, 'a blocked cat settles into its seated rest instead of freezing with a raised paw');
  assert.equal(a.catFootprint,.7*a.catWalkScale*a.size,'blocked pose keeps the gameplay collision reservation stable');
  assert.equal(a.root.rotation.y, orientation, '+Z heading remains owned by gameplay');
  assert.deepEqual(a.root.position.toArray(), position, 'animation never translates the game actor');
  assert.deepEqual(rootTransform[0].slice(1), [a.root.position.toArray(), a.root.quaternion.toArray(), a.root.scale.toArray()]);

  a.moving = false; a.state = 'idle';
  h.api.pose(a, 3, .05);
  assert.equal(a.catWalkWeight, 0, 'stopping immediately restores the seated pose');
  assert.equal(a.catFootprint, restFootprint);
  for (let i = 0; i < 4; i++) h.api.pose(a, 3 + i * .05, .05);
  assert(!a.catWalkActive && !a.catWalkAction.isRunning());
  assert.deepEqual(transforms(a.catModel), rest, 'ordinary stop restores exact seated transforms');
  assert.equal(aMesh.morphTargetInfluences[0], 0, 'ordinary stop restores hidden seated inner-leg geometry');
  assert.equal(a.catFootprint, restFootprint, 'ordinary stop restores exact original footprint');
  for (const state of ['hop', 'hug', 'sleep', 'play']) {
    moving(h.api, a); a.state = state; a.moving = false; h.api.pose(a, 4, .05);
    assert(!a.catWalkActive && !a.catWalkAction.isRunning(), state + ' never runs Walk');
    assert.deepEqual(transforms(a.catModel), rest, state + ' restores seated bind pose immediately');
    assert.equal(aMesh.morphTargetInfluences[0], 0, state + ' clears the Walk-only corrective immediately');
    assert.equal(a.catFootprint, restFootprint, state + ' restores seated footprint immediately');
  }
  moving(h.api, a); h.api.setLevel(3, [a, b]);
  assert.deepEqual(transforms(a.catModel), rest, 'chapter exit restores rest and stops the action');
  assert.equal(a.catFootprint, restFootprint, 'chapter exit restores original footprint');
  h.api.prepareWalk(a, .05);
  assert.equal(a.catFootprint, restFootprint, 'inactive chapter cannot reserve a walking footprint');
  const stoppedTime = a.catMixer.time; h.api.pose(a, 900, .05);
  assert.equal(a.catMixer.time, stoppedTime, 'inactive chapter cannot tick its mixer');
  h.api.setLevel(2, [a, b]); await settle(); moving(h.api, a);
  assert.equal(h.requests.length, 1, 'chapter reentry uses the same cached asset');
  const mixer = a.catMixer, skeleton = aMesh.skeleton;
  let disposed = 0, geometryDisposed = 0, materialDisposed = 0;
  skeleton.boneTexture = new THREE.DataTexture(new Float32Array(64), 4, 4, THREE.RGBAFormat, THREE.FloatType);
  skeleton.boneTexture.addEventListener('dispose', () => disposed++);
  aMesh.geometry.addEventListener('dispose', () => geometryDisposed++);
  aMesh.material.addEventListener('dispose', () => materialDisposed++);
  h.api.remove(a);
  assert.equal(a.catMixer, null); assert.equal(a.catWalkAction, null);
  assert.equal(mixer.stats.actions.inUse, 0); assert.equal(mixer.stats.actions.total, 0);
  assert.equal(disposed, 1); assert.equal(geometryDisposed, 0); assert.equal(materialDisposed, 0);
  moving(h.api, b);
  assert(b.catWalkAction.isRunning(), 'removing a clone leaves its sibling animated');

  for (const options of [{ fail: 'black' }, { static: 'black' }, { badRig: 'black' }, { badClip: 'black' }, { noExtent: 'black' }]) {
    const f = harness(options), k = f.kitten('black');
    f.api.setLevel(2, [k]); await settle();
    assert(k.inner.visible && !k.catVisual && !k.catMixer && k.root.children.length === 1, 'download/static/broken-rig/broken-clip failure keeps only procedural fallback');
    assert.equal(f.api.pose(k, 1, .05), false, 'fallback pose remains owned by original game code');
    f.api.prepareWalk(k, .05);
    assert.equal(k.catFootprint, undefined, 'fallback retains its original procedural clearance');
  }
  const small = harness({ smallExtent: 'orange' }), seated = small.kitten();
  small.api.setLevel(2, [seated]); await settle();
  const seatedFootprint = seated.catFootprint;
  moving(small.api, seated);
  assert.equal(seated.catFootprint, seatedFootprint, 'metadata cannot shrink the measured seated extent');
  const late = harness({ held: true }), k = late.kitten();
  late.api.setLevel(2, [k]); late.api.setLevel(1, [k]);
  late.pending.shift()(); await settle();
  assert(k.inner.visible && !k.catMixer && !k.catVisual, 'late response after exit creates no mixer');
  late.api.setLevel(2, [k]); await settle();
  assert(k.catMixer && !k.inner.visible && late.requests.length === 1, 'reentry safely clones completed cached rig');
  console.log('PASS cat Walk runtime: private skeletons, exact rest, speed cadence, state/exit cleanup, shared resources and load fallback');
})().catch(error => { console.error(error); process.exitCode = 1; });
