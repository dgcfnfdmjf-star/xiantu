'use strict';

// Level-4 clear cutscene: the pure model and the state machine, no browser.
// node games/healing-game/tests/l4-cutscene.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let now = 0;
const cs = require('../src/l4-cutscene.js');
cs._setClock(() => now);
const D = cs.duration(), beats = cs.beats(), lay = cs.layout(), text = cs.text();

// Timeline: about 50 s, five contiguous beats, short one-line captions.
assert.equal(D, 50);
assert.deepEqual(beats.map(b => b.id), ['predawn', 'chimes', 'notes', 'send', 'title']);
assert.equal(beats[0].t0, 0); assert.equal(beats[beats.length - 1].t1, D);
for (let i = 1; i < beats.length; i++) assert.equal(beats[i].t0, beats[i - 1].t1, 'beats are contiguous');
for (const b of beats) {
  assert(b.t1 - b.t0 >= 6, b.id + ' is long enough to read');
  // 17px + 1.5px tracking = 18.5px a glyph; 14 glyphs = 259px fits the 324px line of a 360px screen with room to spare.
  assert(b.caption.length <= 14, b.caption + ' fits one line at 360px');
  if (b.id !== 'title') assert(b.caption.length >= 8 && /^[一-鿿，]+$/.test(b.caption), 'gentle Chinese, no stray glyphs: ' + b.caption);
}
assert.equal(beats[4].caption, '');
assert.deepEqual(text, { title: '第四关 · 完成', subtitle: '暮色浮岛', cont: '轻触继续', skip: '跳过' });

// frame(t) is a pure function of t: same answer whatever was asked before, and no NaN anywhere.
const marks = []; for (let t = 0; t <= D; t += 0.37) marks.push(+t.toFixed(2)); marks.push(D);
const snap = {}; for (const t of marks) snap[t] = JSON.stringify(cs.frame(t));
for (const t of marks.slice().reverse()) assert.equal(JSON.stringify(cs.frame(t)), snap[t], 'frame(' + t + ') is deterministic');
for (const t of marks) assert(!/null|NaN/.test(snap[t].replace(/"caption":""/, '')), 'finite frame at ' + t);
for (const t of marks) { const f = cs.frame(t), b = beats.find(b => t >= b.t0 && (t < b.t1 || b.t1 === D)); assert.equal(f.beat, b.id); assert.equal(f.caption, b.caption); assert(f.captionAlpha >= 0 && f.captionAlpha <= 1); }
// Captions fade in and out inside their beat; nothing pops at a boundary.
for (const b of beats) { assert(cs.frame(b.t0).captionAlpha < 0.01); assert(cs.frame(b.t1 - 0.01).captionAlpha < 0.05); if (b.caption) assert.equal(cs.frame((b.t0 + b.t1) / 2).captionAlpha, 1); }

// Look: cool pre-dawn warms into sunrise; the sun comes up from under the horizon and stays low for a portrait frame.
const f1 = cs.frame(1), f30 = cs.frame(30), f49 = cs.frame(49);
assert.equal(f1.look, 'painterly-dawn');
assert(f1.sky.cool === 1 && f1.sky.warm === 0 && f30.sky.warm === 1 && cs.frame(15).sky.warm > 0.1 && cs.frame(15).sky.warm < 0.9, 'pre-dawn -> sunrise');
for (const t of marks) { const s = cs.frame(t).sky; assert(Math.abs(s.cool + s.warm - 1) < 1e-9); }
assert(f1.sun.y < 0 && cs.frame(12).sun.y > 0 && f49.sun.y > 0.15 && f49.sun.y < 0.3 && f1.sun.z < 0, 'sun rises from below the horizon, in front, low');
let sy = -1; for (const t of marks) { const y = cs.frame(t).sun.y; assert(y >= sy, 'the sun never sinks'); sy = y; }
assert(f1.front < -6 && cs.frame(21).front > 6 && f1.light < f49.light && f1.veil > f49.veil, 'light crosses the valley and the frame brightens');
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
// Chimes: the game's six, in the game's tone colours and places; asleep before dawn, waking one after another in the
// second beat (a strike each), then ringing in turn on a slow round.
const rules = require('../src/chime-rules.js');
const tones = (rules.tones || globalThis.ChimeRules.tones);
assert.deepEqual(lay.tones, tones.map(t => t.id)); assert.deepEqual(lay.colors, tones.map(t => t.color));
assert.deepEqual(lay.chimes, [[-2.8, 1.2], [-2.4, -1.6], [0, -2.9], [2.5, -1.5], [2.9, 1.2], [0, 2.8]]);
assert(f1.chimes.length === 6 && f1.chimes.every(c => c.wake === 0 && c.pulse === 0 && c.strike === -1), 'asleep before dawn');
const firsts = [0, 1, 2, 3, 4, 5].map(i => lay.chimeT + i * lay.chimeStep);
firsts.forEach((t0, i) => {
  assert(t0 > 10 && t0 < 21, 'chime ' + i + ' wakes in the second beat');
  assert.equal(cs.chime(i, t0 - 0.6).pulse, 0); assert(cs.chime(i, t0 + 0.05).pulse > 0.9, 'chime ' + i + ' rings when it wakes');
  if (i < 5) assert(cs.chime(i + 1, t0 + 0.05).pulse === 0, 'in turn');
  const strikes = new Set(); for (let t = 22; t < 50; t += 0.1) strikes.add(cs.chime(i, t).strike);
  assert(strikes.size >= 5, 'chime ' + i + ' keeps ringing');
  for (let t = 0; t < 50; t += 0.1) { const c = cs.chime(i, t); assert(c.pulse >= 0 && c.pulse <= 1 && Math.abs(c.swing) < 0.4 && c.glow > 0.1 && c.glow <= 1.001); }
});
assert(cs.frame(22).chimes.every(c => c.wake === 1), 'all six awake after the chimes beat');
// Notes and petals (placeholders in this item): unseen before their time, above the grass, drifting downwind
// (away from the sun's side), each a pure function of t.
assert.equal(lay.notes, 18); assert.equal(lay.petals, 42);
assert(cs.frame(20).notes.every(n => n.alpha === 0), 'no notes before the chimes have rung');
assert(cs.frame(30).notes.filter(n => n.alpha > 0.5).length >= 10 && cs.frame(40).petals.filter(p => p.alpha > 0.5).length >= 20, 'plenty in the air');
assert(cs.frame(8).petals.some(p => p.alpha > 0.5) && cs.frame(8).petals.filter(p => p.alpha > 0).length < 20, 'a few petals on the first wind');
for (let j = 0; j < lay.notes; j++) for (let t = 21; t < 50; t += 0.25) {
  const n = cs.note(j, t), C = lay.chimes[n.tone];
  assert.equal(n.tone, j % 6); assert(n.y > 2 && n.y < 8 && n.alpha >= 0 && n.alpha <= 1, 'note ' + j + ' floats above its chime');
  assert((n.x - C[0]) * lay.wind[0] + (n.z - C[1]) * lay.wind[1] > -0.5, 'note ' + j + ' goes downwind');
}
for (let j = 0; j < lay.petals; j++) for (let t = 3; t < 50; t += 0.25) { const p = cs.petal(j, t); assert(p.y > 0.05 && p.y < 5 && p.alpha >= 0 && p.alpha <= 1, 'petal ' + j + ' stays in the air'); }
assert.equal(JSON.stringify(cs.note(7, 33.3)), JSON.stringify(cs.frame(33.3).notes[7]));
assert.equal(JSON.stringify(cs.petal(9, 41.2)), JSON.stringify(cs.frame(41.2).petals[9]));
assert.equal(JSON.stringify(cs.chime(4, 17.7)), JSON.stringify(cs.frame(17.7).chimes[4]));

// State machine on a fake clock: play -> skip -> guarded continue -> onContinue exactly once -> closed.
assert.equal(cs.state(), 'idle'); assert.equal(cs.enabled(), true); assert.equal(cs.staged(), false); assert.equal(cs.busy(), false);
let continued = 0;
cs.play({ source: 'test', muted: true, onContinue: () => continued++ });
assert.equal(cs.state(), 'playing'); assert.equal(cs.busy(), true); assert.equal(cs.scored(), false);
now = 12000; assert.equal(cs.time(), 12); assert.equal(cs.beat(), 'chimes');
assert.equal(cs.proceed(), false, 'no continue before the end');
assert.equal(cs.pause(), true); now = 20000; assert.equal(cs.time(), 12); assert.equal(cs.resume(), true);
now = 21000; assert.equal(cs.time(), 13);
assert.equal(cs.seek(33), 33); assert.equal(cs.beat(), 'send');
assert.equal(cs.skip(), true); assert.equal(cs.state(), 'ended'); assert.equal(cs.time(), D); assert.equal(cs.finished(), true);
assert.equal(cs.skip(), false);
assert.equal(cs.proceed(), false, 'the skipping tap cannot also continue'); assert.equal(continued, 0);
now += 599; assert.equal(cs.proceed(), false, '600 ms guard');
now += 101; assert.equal(cs.proceed(), true); assert.equal(continued, 1); assert.equal(cs.state(), 'closed'); assert.equal(cs.busy(), false);
assert.equal(cs.proceed(), false); assert.equal(cs.close(), false); assert.equal(continued, 1);
// Natural end, then close() without continuing never fires onContinue.
cs.play({ muted: true, onContinue: () => continued++ });
now += D * 1000 + 10; assert.equal(cs.state(), 'ended'); assert.equal(cs.close(), true); assert.equal(continued, 1);
assert.equal(cs.setEnabled(false), false); assert.equal(cs.setEnabled(true), true);

// The file never touches a save, and the preview gate is its own line (a pack script swaps it out).
const src = fs.readFileSync(path.resolve(__dirname, '../src/l4-cutscene.js'), 'utf8');
assert(!/localStorage|sessionStorage|indexedDB|\.cookie/.test(src), 'no storage access');
assert.equal(src.split("if (query('cutscene') !== 'l4') return;").length, 2, 'one preview gate');
// The hook script only adds lines that name __l4Cutscene (plus the module itself), after the L3 hooks in build.py.
const build = fs.readFileSync(path.resolve(__dirname, '../scripts/build.py'), 'utf8');
assert(build.indexOf('release_html = html') < build.indexOf("scripts/l3-cutscene-v96.py") && build.indexOf("scripts/l3-cutscene-v96.py") < build.indexOf("scripts/l4-cutscene-v96.py"), 'hooks run after the release is frozen, after L3');
console.log(JSON.stringify({ pass: true, duration: D, beats: beats.map(b => b.id), captions: beats.map(b => b.caption.length) }));
