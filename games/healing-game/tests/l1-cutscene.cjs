'use strict';

// Pure-model checks for the level-1 clear cutscene (no browser): node games/healing-game/tests/l1-cutscene.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const cs = require(path.resolve(__dirname, '../src/l1-cutscene.js'));
let now = 0;
cs._setClock(() => now);

// Timeline: ~45-60 s, five contiguous beats, short Chinese captions on all but the title beat.
const D = cs.duration();
assert(D >= 45 && D <= 60, 'duration ' + D);
const beats = cs.beats();
assert.equal(beats.length, 5);
assert.deepEqual(beats.map(b => b.id), ['meadow', 'release', 'dance', 'ribbon', 'title']);
assert.equal(beats[0].t0, 0);
assert.equal(beats[beats.length - 1].t1, D);
for (let i = 1; i < beats.length; i++) assert.equal(beats[i].t0, beats[i - 1].t1, 'beats contiguous at ' + i);
for (const b of beats.slice(0, -1)) assert(b.caption.length >= 8 && b.caption.length <= 22 && /[一-鿿]/.test(b.caption), 'caption ' + b.id);
assert.equal(beats[4].caption, '');
assert.deepEqual(cs.text(), { title: '第一关 · 完成', subtitle: '暮色浮岛', cont: '轻触继续', skip: '跳过' });

// frame(t) is a pure function of t: same input, same output, in any order; all numbers finite.
const finite = (v, where) => {
  if (typeof v === 'number') assert(Number.isFinite(v), where);
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) finite(v[k], where + '.' + k);
};
const marks = [];
for (let t = 0; t <= D; t += 0.25) marks.push(t);
const first = marks.map(t => JSON.stringify(cs.frame(t)));
marks.slice().reverse().forEach(t => assert.equal(JSON.stringify(cs.frame(t)), first[marks.indexOf(t)], 'frame(' + t + ') repeats'));
marks.forEach(t => finite(cs.frame(t), 'frame(' + t + ')'));
assert.equal(cs.frame(-5).t, 0);
assert.equal(cs.frame(999).t, D);

// Continuity: no jump in camera, light or butterfly position between neighbouring frames (1/30 s).
const lay = cs.layout();
for (let t = 0; t < D; t += 1 / 30) {
  const a = cs.frame(t), b = cs.frame(t + 1 / 30);
  for (const k of ['x', 'y', 'z', 'th', 'phi', 'w', 'lift']) assert(Math.abs(a.camera[k] - b.camera[k]) < 0.05, 'camera.' + k + ' at ' + t.toFixed(2));
  assert(Math.abs(a.night - b.night) < 0.01 && Math.abs(a.sky.rose - b.sky.rose) < 0.01, 'light at ' + t.toFixed(2));
  assert.equal(a.flies.length, lay.count);
  a.flies.forEach((f, j) => {
    const g = b.flies[j], d = Math.hypot(f.x - g.x, f.y - g.y, f.z - g.z);
    assert(d < 0.2, 'butterfly ' + j + ' moves ' + d.toFixed(3) + ' at ' + t.toFixed(2));
    assert(f.y > 0.3, 'butterfly ' + j + ' above the grass at ' + t.toFixed(2));
    assert(f.alpha >= 0 && f.alpha <= 1 && Math.abs(f.flap) <= 1);
  });
}

// Story: nothing out of the net in the establishing shot, everyone out for the dance, some settle on flowers,
// and the ribbon climbs towards the sunset (the sun sits at -z) with the title over it.
const f5 = cs.frame(5), f12 = cs.frame(12), f25 = cs.frame(25), f42 = cs.frame(42), f49 = cs.frame(49);
assert.equal(f5.beat, 'meadow'); assert(f5.flies.every(f => f.alpha === 0) && f5.net === 0 && f5.title === 0);
assert.equal(f12.beat, 'release'); assert(f12.net === 1 && f12.flies.some(f => f.alpha === 1) && f12.flies.some(f => f.alpha === 0), 'released one by one');
assert.equal(f25.beat, 'dance'); assert(f25.flies.every(f => f.alpha === 1));
let perched = 0;
for (let t = 19; t < 32; t += 0.25) cs.frame(t).flies.forEach(f => {
  if (f.perch > 0.99) { perched++; const F = lay.flowers[f.flower]; assert(Math.hypot(f.x - F[0], f.z - F[1]) < 0.2 && f.y < 0.8, 'perched on its flower'); }
});
assert(perched >= lay.count, 'butterflies settle on flowers: ' + perched);
const mean = (f, k) => f.flies.reduce((s, q) => s + q[k], 0) / f.flies.length;
assert(mean(f42, 'y') > mean(f25, 'y') + 1.5 && mean(f49, 'y') > mean(f42, 'y') + 1, 'ribbon rises');
assert(mean(f49, 'z') < -3, 'ribbon heads for the sunset');
assert(f5.sky.gold === 1 && f49.sky.rose === 1 && f49.sun.y < f5.sun.y && f49.sun.y > 0, 'golden light to sunset, sun still up');
assert(cs.frame(0).camera.w > 8 && f12.camera.w < f5.camera.w && f49.camera.w > 7, 'wide - close - wide');
assert(f49.title === 1 && cs.frame(43).title === 0 && f5.bars > 0.9 && cs.frame(0).bars === 0);
assert(marks.every(t => cs.frame(t).canContinue === (t >= D)));
assert(Math.abs(f5.wind) <= 1.01 && marks.some(t => cs.frame(t).wind > 0.3) && marks.some(t => cs.frame(t).wind < -0.3), 'wind gusts both ways');

// State machine on a fake clock: play -> skip -> guarded continue -> onContinue exactly once -> closed.
assert.equal(cs.state(), 'idle'); assert.equal(cs.enabled(), true); assert.equal(cs.staged(), false);
let continued = 0;
cs.play({ source: 'test', muted: true, onContinue: () => continued++ });
assert.equal(cs.state(), 'playing');
now = 12000; assert.equal(cs.time(), 12); assert.equal(cs.beat(), 'release');
assert.equal(cs.proceed(), false, 'no continue before the end');
assert.equal(cs.pause(), true); now = 20000; assert.equal(cs.time(), 12); assert.equal(cs.resume(), true);
now = 21000; assert.equal(cs.time(), 13);
assert.equal(cs.seek(30), 30); assert.equal(cs.beat(), 'dance');
assert.equal(cs.skip(), true); assert.equal(cs.state(), 'ended'); assert.equal(cs.time(), D); assert.equal(cs.finished(), true);
assert.equal(cs.skip(), false);
assert.equal(cs.proceed(), false, 'the skipping tap cannot also continue'); assert.equal(continued, 0);
now += 700; assert.equal(cs.proceed(), true); assert.equal(continued, 1); assert.equal(cs.state(), 'closed');
assert.equal(cs.proceed(), false); assert.equal(cs.close(), false); assert.equal(continued, 1);
// Natural end, then close() without continuing (the game closing the card) never fires onContinue.
cs.play({ muted: true, onContinue: () => continued++ });
now += D * 1000 + 10; assert.equal(cs.state(), 'ended'); assert.equal(cs.close(), true); assert.equal(continued, 1);
assert.equal(cs.setEnabled(false), false); assert.equal(cs.setEnabled(true), true);

// The file never touches a save, and the preview gate is its own line (a pack script swaps it out).
const src = fs.readFileSync(path.resolve(__dirname, '../src/l1-cutscene.js'), 'utf8');
assert(!/localStorage|sessionStorage|indexedDB|\.cookie/.test(src), 'no storage access');
assert.equal(src.split("if (query('cutscene') !== 'l1') return;").length, 2, 'one preview gate');
assert(!src.includes("if (query('cutscene') !== '1') return;"), 'distinct from the level-2 gate');
console.log(JSON.stringify({ pass: true, duration: D, beats: beats.map(b => b.id), perched }));
