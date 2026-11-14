'use strict';

// Level-3 clear cutscene: the pure model and the state machine, no browser.
// node games/healing-game/tests/l3-cutscene.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let now = 0;
const cs = require('../src/l3-cutscene.js');
cs._setClock(() => now);
const D = cs.duration(), beats = cs.beats(), lay = cs.layout(), text = cs.text();

// Timeline: about 50 s, five contiguous beats, short one-line captions.
assert.equal(D, 50);
assert.deepEqual(beats.map(b => b.id), ['dusk', 'lamps', 'fireflies', 'boat', 'title']);
assert.equal(beats[0].t0, 0); assert.equal(beats[beats.length - 1].t1, D);
for (let i = 1; i < beats.length; i++) assert.equal(beats[i].t0, beats[i - 1].t1, 'beats are contiguous');
for (const b of beats) {
  assert(b.t1 - b.t0 >= 6, b.id + ' is long enough to read');
  // 17px + 1.5px tracking = 18.5px a glyph; 16 glyphs = 296px fits the 324px line of a 360px screen.
  assert(b.caption.length <= 16, b.caption + ' fits one line at 360px');
  if (b.id !== 'title') assert(b.caption.length >= 8 && /^[一-鿿，]+$/.test(b.caption), 'gentle Chinese, no stray glyphs: ' + b.caption);
}
assert.equal(beats[4].caption, '');
assert.deepEqual(text, { title: '第三关 · 完成', subtitle: '暮色浮岛', cont: '轻触继续', skip: '跳过' });

// frame(t) is a pure function of t: same answer whatever was asked before, and no NaN anywhere.
const marks = []; for (let t = 0; t <= D; t += 0.37) marks.push(+t.toFixed(2)); marks.push(D);
const snap = {}; for (const t of marks) snap[t] = JSON.stringify(cs.frame(t));
for (const t of marks.slice().reverse()) assert.equal(JSON.stringify(cs.frame(t)), snap[t], 'frame(' + t + ') is deterministic');
for (const t of marks) assert(!/null|NaN/.test(snap[t].replace(/"caption":""/, '')), 'finite frame at ' + t);
for (const t of marks) { const f = cs.frame(t), b = beats.find(b => t >= b.t0 && (t < b.t1 || b.t1 === D)); assert.equal(f.beat, b.id); assert.equal(f.caption, b.caption); assert(f.captionAlpha >= 0 && f.captionAlpha <= 1); }
// Captions fade in and out inside their beat; nothing pops at a boundary.
for (const b of beats) { assert(cs.frame(b.t0).captionAlpha < 0.01); assert(cs.frame(b.t1 - 0.01).captionAlpha < 0.05); if (b.caption) assert.equal(cs.frame((b.t0 + b.t1) / 2).captionAlpha, 1); }

// Look: blue-violet dusk turns into a starry night; the moon stays up, low enough for a portrait frame.
const f1 = cs.frame(1), f30 = cs.frame(30), f49 = cs.frame(49);
assert.equal(f1.look, 'painterly-night');
assert(f1.sky.dusk === 1 && f1.sky.stars === 0 && f30.sky.night === 1 && f30.sky.stars === 1, 'dusk -> starry night');
for (const t of marks) { const s = cs.frame(t).sky; assert(Math.abs(s.dusk + s.night - 1) < 1e-9); }
assert(f1.moon.y > 0.1 && f49.moon.y > f1.moon.y && f49.moon.y < 0.3 && f1.moon.z < 0, 'moon low in front, rising slowly');
assert(Math.abs(f1.wind) <= 1.01 && marks.some(t => cs.frame(t).wind > 0.3) && marks.some(t => cs.frame(t).wind < -0.3), 'wind gusts both ways');
assert(f49.title === 1 && cs.frame(43.9).title === 0 && f1.bars > 0 && cs.frame(5).bars === 1 && cs.frame(0).bars === 0);
assert(marks.every(t => cs.frame(t).canContinue === (t >= D)));
// Camera: wide - close - wide, and continuous (no jump between any two frames, including across beat boundaries).
assert(cs.frame(0).camera.w > 8 && cs.frame(15.5).camera.w < 5.5 && f49.camera.w > 8, 'wide - close - wide');
let prev = cs.frame(0).camera;
for (let t = 0.05; t <= D; t += 0.05) {
  const c = cs.frame(t).camera;
  for (const k of Object.keys(c)) assert(Math.abs(c[k] - prev[k]) < 0.06, 'camera ' + k + ' jumps at ' + t.toFixed(2));
  prev = c;
}
// Lamps: dim at dusk, warming one after another in the second beat, all warm from then on.
assert(f1.lamps.every(g => g < 0.36), 'dim at dusk');
const at13 = cs.frame(13).lamps; assert(at13[0] > 0.6 && at13[2] < 0.36, 'one by one');
for (const t of marks.filter(t => t >= 20)) assert(cs.frame(t).lamps.every(g => g > 0.85 && g <= 1.001), 'all three warm after the lamps beat');
// Fireflies: out over the meadow at dusk (curl drift, blinking), gathered round their lamp, released lamp by lamp,
// up in a spiral and away into the sky, where they settle as twinkling stars. Never in the ground, never teleporting.
assert.equal(lay.count, 24); assert.equal(lay.lamps.length, 3); assert.equal(lay.kinds.length, 6);
assert(cs.frame(2).flies.every(f => f.alpha === 0), 'none before dusk settles');
assert(cs.frame(10.5).flies.every(f => f.alpha === 1 && f.body === 1 && f.star === 0), 'all out by the lamps beat');
const rels = [];
for (let j = 0; j < lay.count; j++) {
  const L = lay.lamps[j % 3], home = cs.fly(j, 9), rel = home.rel; rels.push(rel);
  assert(rel >= lay.release && rel <= lay.release + lay.count * lay.releaseStep);
  assert(Math.hypot(home.x, home.z) < 5 && home.y > 0.5 && home.y < 2.2, 'firefly ' + j + ' drifts over the meadow');
  // drifting, not parked: it moves between two moments, and blinks
  const later = cs.fly(j, 10.2); assert(Math.hypot(later.x - home.x, later.y - home.y, later.z - home.z) > 0.03, 'firefly ' + j + ' drifts');
  let lo = 1, hi = 0; for (let t = 5; t < 12; t += 0.1) { const w = cs.fly(j, t).twinkle; lo = Math.min(lo, w); hi = Math.max(hi, w); }
  assert(lo < 0.7 && hi > 0.9 && lo > 0.3, 'firefly ' + j + ' blinks softly');
  const a = cs.fly(j, rel - 0.05), ring = Math.hypot(a.x - L[0], a.z - L[1]);
  assert(a.alpha === 1 && ring > 0.4 && ring < 1.6 && a.y > lay.lampY - 0.2 && a.y < lay.lampY + 1.1 && a.body === 1, 'firefly ' + j + ' circles its lamp before release');
  const mid = cs.fly(j, rel + lay.climb * 0.35); assert(mid.y > a.y + 1 && mid.y < 12 && mid.star === 0, 'firefly ' + j + ' spirals up first');
  const z = cs.fly(j, 42), z2 = cs.fly(j, 49);
  assert(z.y > 20 && z.z < -50 && z.star === 1 && z.alpha === 1 && z.body === 0, 'firefly ' + j + ' ends as a star');
  assert(Math.hypot(z.x - z2.x, z.y - z2.y, z.z - z2.z) < 1e-9, 'a star stays put');
  assert.equal(JSON.stringify(cs.fly(j, 27.3)), JSON.stringify(cs.frame(27.3).flies[j]));
  let p = cs.fly(j, 2);
  for (let t = 2.05; t < 45; t += 0.05) {
    const q = cs.fly(j, t), step = Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z);
    assert(step < (q.star > 0 ? 1 : 0.2), 'firefly ' + j + ' never teleports (' + step.toFixed(2) + ' at ' + t.toFixed(2) + ')');
    assert(q.y > 0.5, 'firefly ' + j + ' stays above the grass at ' + t.toFixed(2));
    p = q;
  }
}
assert.equal(new Set(rels).size, lay.count, 'released one at a time');
assert(Math.max(...rels.filter((r, j) => j % 3 === 0)) < Math.min(...rels.filter((r, j) => j % 3 === 1)), 'lamp by lamp');
// Determinism: asking in any order gives the same pose (no hidden state).
const order = [33.3, 8.1, 21.7, 44, 15.2], seen = order.map(t => JSON.stringify(cs.frame(t).flies) + JSON.stringify(cs.boat(t)));
order.slice().reverse().forEach((t, i) => assert.equal(JSON.stringify(cs.frame(t).flies) + JSON.stringify(cs.boat(t)), seen[order.length - 1 - i]));
// The cast wears the player's colours in proportion; an empty catch shows all six.
assert.deepEqual([...new Set(cs.castFor(null))].sort(), lay.kinds.slice().sort());
assert.deepEqual([...new Set(cs.castFor({}))].sort(), lay.kinds.slice().sort());
const cast = cs.castFor({ dew: 30, tide: 10, moon: 1, bogus: 9, peach: 0 });
assert.equal(cast.length, 24); assert.deepEqual([...new Set(cast)].sort(), ['dew', 'moon', 'tide']);
const count = id => cast.filter(c => c === id).length;
assert(count('dew') > count('tide') && count('tide') > count('moon') && count('moon') >= 1);
assert.equal(cs.castFor({ amber: 2 }).every(c => c === 'amber'), true);
// The boat: unseen before its beat; then round the front of the island on the cloud sea (never over the grass),
// and away behind it towards the moon, without a jump, bobbing and rolling gently, its light on.
assert.equal(cs.frame(29).boat.alpha, 0);
const b33 = cs.frame(33).boat, b49 = cs.frame(49.9).boat;
assert(b33.alpha === 1 && b33.glow > 0.6 && b33.z > 5 && b49.z < -8 && Math.hypot(b49.x - b33.x, b49.z - b33.z) > 15, 'sails round and out towards the moon');
let pb = cs.frame(30).boat, rollLo = 0, rollHi = 0;
for (let t = 30.05; t <= D; t += 0.05) {
  const q = cs.frame(t).boat;
  assert(Math.hypot(q.x - pb.x, q.y - pb.y, q.z - pb.z) < 0.25, 'boat is continuous at ' + t.toFixed(2));
  assert(Math.abs(q.yaw - pb.yaw) < 0.05, 'boat turns smoothly at ' + t.toFixed(2));
  assert(Math.hypot(q.x, q.z) > 6.6, 'boat keeps clear of the island at ' + t.toFixed(2));
  assert(Math.abs(q.roll) <= 0.08 && Math.abs(q.pitch) <= 0.06 && q.y < 1, 'gentle bob and roll');
  rollLo = Math.min(rollLo, q.roll); rollHi = Math.max(rollHi, q.roll); pb = q;
}
assert(rollLo < -0.05 && rollHi > 0.05, 'the boat rolls both ways');
assert.equal(JSON.stringify(cs.boat(37.7)), JSON.stringify(cs.frame(37.7).boat));
// The wake lies where the boat has been, widens and fades with age, and is gone before the boat set out.
for (const t of [34, 39, 46]) {
  const w0 = cs.wake(t, 0), w2 = cs.wake(t, 2), w5 = cs.wake(t, lay.wakeAge), was = cs.boat(t - 2), here = cs.boat(t);
  assert(Math.hypot(w0.x - here.x, w0.z - here.z) < 1e-9 && Math.hypot(w2.x - was.x, w2.z - was.z) < 1e-9, 'wake follows the path');
  assert(w0.alpha > w2.alpha && w2.alpha > 0 && w5.alpha === 0 && w0.half < w2.half && w2.half < w5.half, 'wake widens and fades');
}
assert.equal(cs.wake(31, 2).alpha, 0);

// State machine on a fake clock: play -> skip -> guarded continue -> onContinue exactly once -> closed.
assert.equal(cs.state(), 'idle'); assert.equal(cs.enabled(), true); assert.equal(cs.staged(), false); assert.equal(cs.busy(), false);
let continued = 0;
cs.play({ source: 'test', muted: true, onContinue: () => continued++ });
assert.equal(cs.state(), 'playing'); assert.equal(cs.busy(), true); assert.equal(cs.scored(), false);
now = 12000; assert.equal(cs.time(), 12); assert.equal(cs.beat(), 'lamps');
assert.equal(cs.proceed(), false, 'no continue before the end');
assert.equal(cs.pause(), true); now = 20000; assert.equal(cs.time(), 12); assert.equal(cs.resume(), true);
now = 21000; assert.equal(cs.time(), 13);
assert.equal(cs.seek(33), 33); assert.equal(cs.beat(), 'boat');
assert.equal(cs.skip(), true); assert.equal(cs.state(), 'ended'); assert.equal(cs.time(), D); assert.equal(cs.finished(), true);
assert.equal(cs.skip(), false);
assert.equal(cs.proceed(), false, 'the skipping tap cannot also continue'); assert.equal(continued, 0);
now += 700; assert.equal(cs.proceed(), true); assert.equal(continued, 1); assert.equal(cs.state(), 'closed'); assert.equal(cs.busy(), false);
assert.equal(cs.proceed(), false); assert.equal(cs.close(), false); assert.equal(continued, 1);
// Natural end, then close() without continuing never fires onContinue.
cs.play({ muted: true, onContinue: () => continued++ });
now += D * 1000 + 10; assert.equal(cs.state(), 'ended'); assert.equal(cs.close(), true); assert.equal(continued, 1);
assert.equal(cs.setEnabled(false), false); assert.equal(cs.setEnabled(true), true);

// The file never touches a save, and the preview gate is its own line (a pack script swaps it out).
const src = fs.readFileSync(path.resolve(__dirname, '../src/l3-cutscene.js'), 'utf8');
assert(!/localStorage|sessionStorage|indexedDB|\.cookie/.test(src), 'no storage access');
assert.equal(src.split("if (query('cutscene') !== 'l3') return;").length, 2, 'one preview gate');
console.log(JSON.stringify({ pass: true, duration: D, beats: beats.map(b => b.id), captions: beats.map(b => b.caption.length) }));
