'use strict';

// Sample the same seated fur vertices used by the asset regression, in metres.
// The browser regression independently checks the WebGL silhouette in both chapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const T = require('../assets/cats/vendor/three-r128/three.min.js');
const window = { THREE: T };
for (const name of ['cat-surface', 'cat-pose']) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src', name + '.js'), 'utf8'), { window });
}
const P = window.GardenCatPose;
const fixture = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, '../assets/cats/tests/cat-seated-surfaces.json.gz'))));
const bytes = Buffer.from(fixture.meshes.find(m => m.material.includes('Watercolor fur')).positions, 'base64');
const fur = new T.BufferAttribute(Float32Array.from({ length: bytes.length / 4 }, (_, i) => bytes.readFloatLE(i * 4)), 3);
const anatomy = P.weights(fur), vec = new T.Vector3();
function nearest(x, y, z) {
  const target = new T.Vector3(x, y, z);
  let iBest = 0, distance = Infinity;
  for (let i = 0; i < fur.count; i++) {
    const d = vec.fromBufferAttribute(fur, i).distanceToSquared(target);
    if (d < distance) { iBest = i; distance = d; }
  }
  return iBest;
}

const head = new T.Bone(); head.position.set(0, .681, .064); head.updateMatrix();
const pawBones = Object.fromEntries(['FrontPawL', 'FrontPawR', 'FrontLowerL', 'FrontLowerR'].map(n => [n, new T.Bone()]));
const pose = { head, body: new T.Bone(), bones: pawBones, capturedHead: new T.Object3D(), inverseBindHead: head.matrix.clone().invert(),
  uMotion: { value: new T.Vector4() }, uEars: { value: new T.Vector2() }, uHeadMatrix: { value: new T.Matrix4() } };
const markers = { left: nearest(-.077, .011, .177), right: nearest(.077, .011, .177),
  ribs: nearest(.14, .42, .02), back: nearest(0, .41, -.165), eye: nearest(-.071, .699, .17),
  tailRoot: nearest(.155, .137, -.113), tailTip: nearest(.111, .056, .239) };
const trail = Object.fromEntries(Object.keys(markers).map(name => [name, []]));
const holdLengths = [], phases = [.3, 1.2, 2.4, 3.1, 4, 5.1, 5.9];
const resting = phases.map(phase => P.sample(0, phase));
assert(new Set(resting.map(m => Math.sign(m.paw))).size === 2, 'different individuals lead with opposite forepaws');
assert(resting.every(m => Math.abs(m.earL + m.earR) > .002), 'left and right ears have distinct inclinations');
const phase = phases[0];
let prior, ticks = 0;
for (let i = 0; i < 40 * 45; i++) {
  const m = P.sample(i / 40, phase);
  if (prior !== m.tilt) {
    if (ticks > 20 && Math.abs(prior - resting[0].tilt) > .1) holdLengths.push(ticks / 40);
    prior = m.tilt; ticks = 0;
  }
  ticks++;
  head.quaternion.identity(); pose.body.scale.setScalar(1);
  Object.values(pawBones).forEach(b => b.position.set(0, 0, 0));
  P.seat(pose, m);
  for (const [name, index] of Object.entries(markers)) {
    const bind = new T.Vector3().fromBufferAttribute(fur, index);
    const posed = P.seatPoint(pose, bind.clone(), anatomy, index);
    if (name === 'eye') assert(posed.distanceTo(bind.clone().applyMatrix4(pose.uHeadMatrix.value)) < 1e-6,
      'fur beside the eye follows the same rigid head transform as the facial details');
    trail[name].push(posed.sub(bind));
  }
}
function range(name, axis) {
  const values = trail[name].map(p => p[axis]);
  return Math.max(...values) - Math.min(...values);
}
assert(holdLengths.length >= 3 && holdLengths.every(s => s >= 1 - 1/40 && s <= 2 + 1/40), 'head tilt holds for 1–2 s: ' + holdLengths);
assert(range('ribs', 'x') > .009 && range('back', 'z') > .012, 'breathing expands the ribs and curves the back');
const lead = trail.right[0].z - trail.left[0].z;
assert(Math.abs(lead) > .008, 'one forepaw is ahead of the other in the seated surface');
for (const paw of ['right', 'left']) assert(range(paw, 'y') < .001 && range(paw, 'z') < .001, 'planted ' + paw + ' paw stays put');
assert(range('tailTip', 'x') > .03 && range('tailRoot', 'x') < range('tailTip', 'x') * .2, 'tail sways more toward the tip');
console.log(JSON.stringify({ holdSeconds: holdLengths, ribsX: range('ribs','x'), backZ: range('back','z'), forepawLead: lead,
  seatedTailX: [range('tailRoot','x'), range('tailTip','x')], pawVerticalTravel: [range('left','y'), range('right','y')] }));
