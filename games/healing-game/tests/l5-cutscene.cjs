'use strict';

// Level-5 (final chapter) clear cutscene: the pure model and the state machine, no browser.
// node games/healing-game/tests/l5-cutscene.cjs
const assert = require('node:assert/strict');

let now = 0;
const cs = require('../src/l5-cutscene.js');
cs._setClock(() => now);
const D = cs.duration(), beats = cs.beats(), lay = cs.layout(), text = cs.text();

// Timeline: about 50 s, five contiguous beats, short one-line captions.
assert.equal(D, 50);
assert.deepEqual(beats.map(b => b.id), ['bay', 'lotus', 'path', 'boat', 'title']);
assert.equal(beats[0].t0, 0); assert.equal(beats[beats.length - 1].t1, D);
for (let i = 1; i < beats.length; i++) assert.equal(beats[i].t0, beats[i - 1].t1, 'beats are contiguous');
for (const b of beats) {
  assert(b.t1 - b.t0 >= 6, b.id + ' is long enough to read');
  // 17px + 1.5px tracking = 18.5px a glyph; 14 glyphs = 259px fits the 324px line of a 360px screen.
  assert(b.caption.length <= 14, b.caption + ' fits one line at 360px');
  if (b.id !== 'title') assert(b.caption.length >= 6 && /^[一-鿿，]+$/.test(b.caption), 'gentle Chinese, no stray glyphs: ' + b.caption);
}
assert.equal(beats[4].caption, '');
assert.deepEqual(text, { title: '第五关 · 完成', subtitle: '暮色浮岛', cont: '轻触继续', skip: '跳过' });

// frame(t) is a pure function of t: same answer whatever was asked before, and no NaN anywhere.
const marks = []; for (let t = 0; t <= D; t += 0.37) marks.push(+t.toFixed(2)); marks.push(D);
const snap = {}; for (const t of marks) snap[t] = JSON.stringify(cs.frame(t));
for (const t of marks.slice().reverse()) assert.equal(JSON.stringify(cs.frame(t)), snap[t], 'frame(' + t + ') is deterministic');
for (const t of marks) assert(!/null|NaN/.test(snap[t]), 'finite frame at ' + t);
for (const t of marks) { const f = cs.frame(t), b = beats.find(b => t >= b.t0 && (t < b.t1 || b.t1 === D)); assert.equal(f.beat, b.id); assert.equal(f.caption, b.caption); assert(f.captionAlpha >= 0 && f.captionAlpha <= 1); }
for (const b of beats) { assert(cs.frame(b.t0).captionAlpha < 0.01); assert(cs.frame(b.t1 - 0.01).captionAlpha < 0.05); if (b.caption) assert.equal(cs.frame((b.t0 + b.t1) / 2).captionAlpha, 1); }

// Look: dusk deepens to moonlit night and warms round the moon; the moon is a low disc ahead, over the path home.
const f1 = cs.frame(1), f30 = cs.frame(30), f49 = cs.frame(49);
assert.equal(f1.look, 'painterly-moonlit-night');
assert(f1.sky.night < 0.1 && f30.sky.night === 1 && f49.sky.warm > 0.99 && f1.sky.warm === 0, 'dusk -> moonlit night, warming');
for (const t of marks) { const m = cs.frame(t).moon; assert(m.y > 0.12 && m.y < 0.22 && m.z < 0, 'moon low ahead at ' + t); }
const m0 = cs.frame(0).moon, ml = Math.hypot(m0.x, m0.z);
assert(Math.abs(lay.pd[0] - m0.x / ml) < 1e-9 && Math.abs(lay.pd[1] - m0.z / ml) < 1e-9, 'the path home runs along the moon bearing');
assert(lay.moonDisc > 0.04 && lay.moonDisc < 0.07);

// Lotuses wake one by one in the second beat; all six open by its end; their colours are the game's six blooms.
assert.deepEqual(lay.blooms, ['月珠莲', '潮璃莲', '霞梦莲', '愿灯莲', '紫憩莲', '晓信莲']);
for (let i = 0; i < 6; i++) {
  assert.equal(cs.lotus(i, 9.9).open, 0, 'closed before the lotus beat');
  assert(cs.lotus(i, 21).open > 0.99, 'open by the path beat');
  const L = cs.lotus(i, 20); assert(Math.hypot(L.x, L.z) > 5.6, 'on the bay, off the island');
}
for (let i = 1; i < 6; i++) assert(cs.lotus(i, 0).wake > cs.lotus(i - 1, 0).wake);
// The path of light spreads in the third beat.
assert.equal(cs.frame(21).path.reach, 0); assert(cs.frame(31).path.reach >= lay.pathLen - 1e-9);
// Dew shows over the opened flowers, then settles on the path.
assert(cs.dew(0, 10).alpha === 0 && cs.dew(0, 18).alpha > 0.69 && cs.dew(0, 31).settled > 0.99);
// Item 2: actor motion is a pure function of t (asked in any order, the same pose), and reads the game's palette.
assert.deepEqual(lay.colors, [0xe9edff, 0x90e6e1, 0xf4b8d1, 0xffd79b, 0xc6b5f4, 0xb3e3c6], 'the six lotus colours of lotus-rules.js');
const poses = t => JSON.stringify([[0, 1, 2, 3, 4, 5].map(i => cs.lotus(i, t)), Array.from({ length: lay.dew }, (_, j) => cs.dew(j, t)), cs.boat(t),
  Array.from({ length: lay.flies }, (_, j) => cs.fly(j, t)), Array.from({ length: lay.lanterns }, (_, j) => cs.lantern(j, t)), cs.frame(t).path]);
const pz = {}; for (const t of marks) pz[t] = poses(t);
for (const t of marks.slice().reverse()) assert.equal(poses(t), pz[t], 'actor poses deterministic at ' + t);
for (const t of marks) assert(!/null|NaN/.test(pz[t]), 'finite poses at ' + t);
// Bloom: petals fold from bud (outer ~-1.3 rad) to open cup, with a warm pulse and a ripple ring as each wakes.
for (let i = 0; i < 6; i++) {
  const w = cs.lotus(i, 0).wake, bud = cs.lotus(i, w - 0.1), open = cs.lotus(i, w + 3);
  assert(bud.outer < -1.25 && open.outer > -0.45, 'lotus ' + i + ' opens'); assert(open.inner > bud.inner);
  assert(cs.lotus(i, w + 1.2).pulse > 0.9 && cs.lotus(i, w + 6).pulse < 0.1, 'warm pulse as it opens');
  assert(cs.lotus(i, w + 1.5).ringA > 0 && cs.lotus(i, w + 1.5).ringR > 0.35, 'ripple ring');
  assert(cs.lotus(i, 30.75 + 0.12 * i).chorus > 0.99, 'all six answer together when the path reaches the moon');
}
// Dew: born in its flower, lifts above it, then settles as a stepping light either side of the path, nearer flowers nearer.
for (let j = 0; j < lay.dew; j++) {
  const i = j % 6, L = cs.lotus(i, 19), d = cs.dew(j, 19.5);
  assert(Math.hypot(d.x - L.x, d.z - L.z) < 1.2 && d.y > L.y + 0.3, 'dew ' + j + ' hovers over its lotus');
  const e = cs.dew(j, 34), q = [e.x - lay.p0[0], e.z - lay.p0[1]], along = q[0] * lay.pd[0] + q[1] * lay.pd[1], across = Math.abs(q[0] * lay.pd[1] - q[1] * lay.pd[0]);
  assert(e.settled > 0.99 && Math.abs(e.y - lay.waterY) < 0.2 && along > 0 && along < lay.pathLen && across < 1.8, 'dew ' + j + ' settles on the path');
}
// Boat: on the path (across ~ 0), and large enough to read in the wide shots.
for (let t = 32; t <= 50; t += 1) { const b = cs.boat(t), q = [b.x - lay.p0[0], b.z - lay.p0[1]]; assert(Math.abs(q[0] * lay.pd[1] - q[1] * lay.pd[0]) < 1e-9); }
assert(cs.boat(38).scale >= 3 && cs.boat(46).scale > cs.boat(38).scale);
// Fireflies and lanterns read on a phone in the wide shots.
for (let j = 0; j < lay.flies; j++) assert(cs.fly(j, 45).size >= 0.5);
for (let j = 0; j < lay.lanterns; j++) assert(cs.lantern(j, 45).size >= 1.1);
// The boat appears for the fourth beat, moves only forward along the path, and is drawn larger as it sails away.
assert(cs.boat(30).alpha === 0 && cs.boat(33).alpha === 1);
let s = -9; for (let t = 31; t <= 50; t += 0.5) { const b = cs.boat(t); assert(b.s >= s, 'forward only'); s = b.s; }
assert(cs.boat(50).scale > cs.boat(35).scale);
for (const t of [34, 40, 46, 50]) { const b = cs.boat(t); assert(Math.hypot(b.x, b.z) > 5.4, 'the boat stays on the water'); }
// Fireflies and lanterns come back in the boat beat only.
for (let j = 0; j < lay.flies; j++) assert.equal(cs.fly(j, 30).alpha, 0);
for (let j = 0; j < lay.lanterns; j++) { assert.equal(cs.lantern(j, 33).alpha, 0); assert(cs.lantern(j, 49).alpha > 0.99); }

// Camera: one continuous move (no jumps between beats), always over the bay looking towards the moon.
let prev = cs.frame(0).camera;
for (let t = 0.05; t <= D; t += 0.05) {
  const c = cs.frame(t).camera;
  for (const k of ['x', 'y', 'z', 'w']) assert(Math.abs(c[k] - prev[k]) < 0.06, 'camera ' + k + ' continuous at ' + t.toFixed(2));
  assert(Math.abs(c.th - prev.th) < 0.003); assert(c.th > 1.9 && c.th < 2.15, 'looks down the path towards the moon');
  prev = c;
}

// State machine: play -> skip -> guarded continue -> onContinue exactly once; ?l5cutscene default on.
assert.equal(cs.enabled(), true);
let calls = 0;
now = 1000; cs.play({ source: 'test', muted: true, onContinue: () => calls++ });
assert.equal(cs.state(), 'playing'); assert.equal(cs.busy(), true);
now = 4000; assert(Math.abs(cs.time() - 3) < 1e-9);
assert.equal(cs.skip(), true); assert.equal(cs.state(), 'ended'); assert.equal(cs.finished(), true);
now = 4300; assert.equal(cs.proceed(), false, 'the tap that skipped cannot continue');
now = 4700; assert.equal(cs.proceed(), true); assert.equal(calls, 1); assert.equal(cs.state(), 'closed'); assert.equal(cs.busy(), false);
assert.equal(cs.proceed(), false); assert.equal(calls, 1);
// Natural end, seek and pause.
now = 0; cs.play({ muted: true, onContinue: () => calls++ });
now = 20000; assert.equal(cs.pause(), true); now = 90000; assert(Math.abs(cs.time() - 20) < 1e-9); assert.equal(cs.resume(), true);
assert.equal(cs.seek(42), 42); now += 9000; assert.equal(cs.time(), D); assert.equal(cs.state(), 'ended');
now += 700; assert.equal(cs.proceed(), true); assert.equal(calls, 2);
assert.equal(cs.frame(D).canContinue, true); assert.equal(cs.frame(49.9).canContinue, false);
console.log('l5-cutscene model: ok (' + marks.length + ' frames)');
