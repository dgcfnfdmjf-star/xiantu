'use strict';

// Level-6 clear cutscene 「雪灯归林」: the pure model, the state machine and the build hooks (no browser).
// node games/healing-game/tests/l6-cutscene.cjs   (after python3 games/healing-game/scripts/build.py)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let now = 0;
const cs = require('../src/l6-cutscene.js');
cs._setClock(() => now);
const D = cs.duration(), beats = cs.beats(), lay = cs.layout(), text = cs.text();

// Timeline: about 50 s, five contiguous beats, short one-line gentle Chinese captions.
assert.equal(D, 50);
assert.deepEqual(beats.map(b => b.id), ['snow', 'lanterns', 'cabin', 'island', 'title']);
assert.equal(beats[0].t0, 0); assert.equal(beats[beats.length - 1].t1, D);
for (let i = 1; i < beats.length; i++) assert.equal(beats[i].t0, beats[i - 1].t1, 'beats are contiguous');
for (const b of beats) {
  assert(b.t1 - b.t0 >= 6, b.id + ' is long enough to read');
  assert(b.caption.length <= 14, b.caption + ' fits one line at 360px');
  if (b.id !== 'title') assert(b.caption.length >= 6 && /^[一-鿿，]+$/.test(b.caption), 'gentle Chinese, no stray glyphs: ' + b.caption);
}
assert.equal(beats[4].caption, '');
assert.deepEqual(text, { title: '第六关 · 完成', subtitle: '暮色浮岛', cont: '轻触继续', skip: '跳过' });

// frame(t) is a pure function of t, finite everywhere.
const marks = []; for (let t = 0; t <= D; t += 0.37) marks.push(+t.toFixed(2)); marks.push(D);
const snap = {}; for (const t of marks) snap[t] = JSON.stringify(cs.frame(t));
for (const t of marks.slice().reverse()) assert.equal(JSON.stringify(cs.frame(t)), snap[t], 'frame(' + t + ') is deterministic');
for (const t of marks) assert(!/null|NaN/.test(snap[t]), 'finite frame at ' + t);
for (const b of beats) { assert(cs.frame(b.t0).captionAlpha < 0.01); if (b.caption) assert.equal(cs.frame((b.t0 + b.t1) / 2).captionAlpha, 1); }

// Look: snowy dusk deepens to a starry night; snow keeps falling but thins for the title; the moon stays up in the sky.
const f1 = cs.frame(1), f30 = cs.frame(30), f49 = cs.frame(49);
assert.equal(f1.look, 'painterly-snowy-night');
assert(f1.sky.night < 0.1 && f30.sky.night === 1 && f49.sky.stars === 1, 'dusk -> starry night');
assert(f1.snow.amount === 1 && f49.snow.amount > 0.4 && f49.snow.amount < 0.7, 'snow thins for the title');
for (const t of marks) { const m = cs.frame(t).moon; assert(m.y > 0.35 && m.z < 0, 'moon high behind the cabin at ' + t); }

// The lantern path lights from the front of the island to the cabin in the second beat, in order, and stays lit.
assert.equal(lay.lanterns, 6);
for (let i = 0; i < 6; i++) {
  assert.equal(cs.lantern(i, 9.9).lit, 0, 'dark before the lantern beat');
  assert(cs.lantern(i, 21).lit > 0.99 && cs.lantern(i, 49).lit > 0.99, 'lit by the cabin beat and kept');
  if (i) assert(cs.lantern(i, 0).on > cs.lantern(i - 1, 0).on, 'one by one');
}
assert.equal(cs.frame(10).path.reach, 0); assert(cs.frame(21).path.reach > 0.99);
assert(cs.frame(28).cabin.window > cs.frame(15).cabin.window, 'the cabin window swells');

// Item 4 actors, all pure functions of t on a beat grid (80 bpm).
const grid = cs.grid(); assert.equal(grid.bpm, 80);
const onGrid = x => Math.abs(x / grid.beat - Math.round(x / grid.beat)) < 1e-9;
for (let i = 0; i < 6; i++) {
  const on = cs.lantern(i, 0).on; assert(onGrid(on), 'lantern ' + i + ' lights on the beat grid');
  assert.equal(cs.lantern(i, on - 0.01).flare, 0); assert(cs.lantern(i, on + 0.2).flare > 0.5, 'ignition flare'); assert(cs.lantern(i, on + 3).flare < 0.01, 'flare settles');
  for (let k = 0; k < 6; k++) { assert.equal(cs.spark(i, k, on - 0.05).a, 0, 'no spark before the cue'); assert.equal(cs.spark(i, k, on + 2).a, 0, 'sparks fade'); }
  assert(Math.max(...[0, 1, 2, 3, 4, 5].map(k => cs.spark(i, k, on + 0.35).a)) > 0.3, 'sparks rise at the cue');
}
assert.deepEqual(lay.kittens, ['orange', 'calico', 'black', 'tabby']);
for (let i = 0; i < 4; i++) {
  const k0 = cs.kitten(i, 0); assert(onGrid(k0.start), 'kitten ' + i + ' sets off on the beat grid');
  assert(k0.start >= 21 && k0.arrive <= 31, 'walks home in the cabin beat');
  assert.equal(cs.kitten(i, 20).u, 0); assert.equal(cs.kitten(i, 20).walking, false);
  assert.equal(cs.kitten(i, (k0.start + k0.arrive) / 2).walking, true);
  assert.equal(cs.kitten(i, 32).u, 1); assert(cs.kitten(i, 33).curl > 0.99, 'curled up under the window');
  let pu = 0; for (let t = 0; t <= D; t += 0.25) { const u = cs.kitten(i, t).u; assert(u >= pu - 1e-12, 'never walks back'); pu = u; }
  if (i) assert(k0.start > cs.kitten(i - 1, 0).start, 'one after another');
}
let pw = 0; for (let t = 20; t <= 32; t += 0.25) { const w = cs.frame(t).cabin.window; assert(w >= pw - 1e-9 && w <= 1, 'window swells'); pw = w; }
assert(cs.frame(32).cabin.window - cs.frame(21).cabin.window > 0.3 && cs.frame(32).cabin.home > 3.99, 'window warms as each kitten arrives');
for (const t of marks) {
  const f = cs.frame(t);
  for (const s of f.smoke) assert(s.a >= 0 && s.a <= 0.62 && s.y >= 0 && s.x >= -0.08, 'smoke curls up and away from the moon (+x)');
  for (const q of f.flies) assert(q.a >= -1e-9 && (t >= 33 || q.a === 0), 'fireflies return only in the wide shots');
  for (const q of f.skyLanterns) assert(q.x > 4 && (t >= 34 || q.a === 0), 'sky lanterns rise off the island right edge, late');
}
assert(cs.frame(40).smoke.some(s => s.a > 0.3) && cs.frame(40).flies.some(q => q.a > 0.3), 'smoke and fireflies visible in the wide shots');

// Camera: one continuous move (no jumps), a slow pull-back: the framed half-width grows from the cabin to the title.
let prev = cs.camera(0);
for (let t = 0.1; t <= D; t += 0.1) {
  const c = cs.camera(t);
  for (const k of ['x', 'y', 'z', 'th', 'phi', 'w']) assert(Math.abs(c[k] - prev[k]) < 0.12, 'camera ' + k + ' continuous at ' + t.toFixed(1));
  prev = c;
}
for (let t = 27; t < 49.8; t += 0.5) assert(cs.camera(t + 0.5).w >= cs.camera(t).w - 1e-9, 'pull-back never pushes in at ' + t);
assert(cs.camera(49).w > 2.5 * cs.camera(25).w, 'the whole island in frame for the title');

// State machine: play -> skip -> guarded proceed -> onContinue once; reduced to the l5 shape.
let calls = 0;
assert.equal(cs.state(), 'idle'); assert.equal(cs.enabled(), true);
cs.play({ source: 'test', muted: true, onContinue: () => calls++ });
assert.equal(cs.state(), 'playing'); assert.equal(cs.busy(), true); assert.equal(cs.staged(), false);
now += 5000; assert(Math.abs(cs.time() - 5) < 1e-9); assert.equal(cs.beat(), 'snow');
assert.equal(cs.pause(), true); now += 3000; assert(Math.abs(cs.time() - 5) < 1e-9); assert.equal(cs.resume(), true);
assert.equal(cs.seek(30), 30); assert.equal(cs.beat(), 'cabin');
assert.equal(cs.skip(), true); assert.equal(cs.state(), 'ended'); assert.equal(cs.finished(), true);
assert.equal(cs.proceed(), false, 'the 600 ms guard'); now += 650;
assert.equal(cs.proceed(), true); assert.equal(calls, 1); assert.equal(cs.state(), 'closed'); assert.equal(cs.busy(), false);
assert.equal(cs.proceed(true), false, 'never twice');
cs.play({ muted: true, onContinue: () => calls++ }); now += 51000; assert.equal(cs.state(), 'ended'); now += 700; cs.proceed(); assert.equal(calls, 2, 'natural end continues too');
for (const k of ['enabled', 'ready', 'play', 'close', 'playing', 'state', 'time', 'finished', 'pause', 'resume', 'seek', 'stage', 'scored', 'busy', 'staged', 'skip', 'proceed', 'frame', 'beats', 'probe', 'muted', 'setEnabled'])
  assert.equal(typeof cs[k], 'function', 'API ' + k);

// Build: hooks after the frozen release, preview gate once, the film never touches saves.
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src/l6-cutscene.js'), 'utf8');
assert(!/localStorage|sessionStorage|GardenJourney|__journey|complete\(/.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), 'the film never reads or writes saves');
assert.equal(src.split("if (query('cutscene') !== 'l6') return;").length, 2);
const build = fs.readFileSync(path.join(ROOT, 'scripts/build.py'), 'utf8');
const iFreeze = build.indexOf('release_html = html'), iL5 = build.indexOf("scripts/l5-cutscene-v96.py"), iCh = build.indexOf("scripts/l6-chapter-v96.py"), iCs = build.indexOf("scripts/l6-cutscene-v96.py");
assert(iFreeze > 0 && iFreeze < iL5 && iL5 < iCh && iCh < iCs, 'l6-cutscene hook runs after the freeze, after l5-cutscene and l6-chapter');
const hook = fs.readFileSync(path.join(ROOT, 'scripts/l6-cutscene-v96.py'), 'utf8');
for (const line of hook.split('\n').filter(l => /^\s+"/.test(l) && !/showEnding\(\)\{finale=0|__l5Cutscene/.test(l))) assert(/__l6Cutscene/.test(line), 'every added line names __l6Cutscene: ' + line);
const site = path.join(ROOT, 'site/healing-game/index.html');
if (fs.existsSync(site)) {
  const html = fs.readFileSync(site, 'utf8');
  assert.equal(html.split("if (query('cutscene') !== 'l6') return;").length, 2, 'exactly one l6 preview gate in the build');
  for (const id of ['l1', 'l3', 'l4', 'l5']) assert.equal(html.split("if (query('cutscene') !== '" + id + "') return;").length, 2, id + ' gate once');
  assert.equal(html.split('var l6Finale=startFinale;').length, 2, 'startFinale rebound once');
  assert.equal(html.split('window.__l6Cutscene.busy()').length, 2); assert.equal(html.split('window.__l6Cutscene.staged()) return;').length, 2);
  assert(html.indexOf('root.__l6Cutscene = api') > html.indexOf('root.__l5Cutscene = api'), 'loads after the level-5 film');
  const base = path.join(ROOT, 'site/healing-game-v9.5-baseline/index.html');
  if (fs.existsSync(base)) assert(!/__l6Cutscene|SnowChapter/.test(fs.readFileSync(base, 'utf8')), 'the frozen V9.5 release has no level-6 code');
}
console.log('l6-cutscene: ok');
