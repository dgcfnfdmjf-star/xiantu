'use strict';

// Level-3 cutscene score on a fake engine (no browser): node games/healing-game/tests/l3-cutscene-music.cjs
// The score table, its sync with the picture, the voice budget (measured against the level-1 and level-2 scores on the same fake
// engine), and start / seek / pause / skip / stop with the level track handed back.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.resolve(__dirname, '../src', f), 'utf8');
const cs = require(path.resolve(__dirname, '../src/l3-cutscene.js'));

// One fake GardenAudio + music2 + music-lush voice set; every voice call is logged as [voice, time, midi, level].
function engine(file, cutsceneName) {
  const log = [], ducks = [], tracks = [{ name: '花园晨曲' }, { name: '夜航' }];
  const ctx = { currentTime: 100 };
  const gainNode = () => ({ gain: { value: 1, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime(v, t) { ducks.push(+(t - ctx.currentTime).toFixed(2)); } }, disconnect() {} });
  const voice = name => (t, m, v) => { log.push([name, t, m, v]); };
  const state = { track: 1, musicOn: true, setTrack: [], started: 0 };
  const scene = { s: 'idle', t: 0, state: () => scene.s, time: () => scene.t };
  const window = {
    setTimeout() {}, [cutsceneName]: scene,
    GardenAudio: {
      kit: { gain: gainNode, rnd: (a, b) => (a + b) / 2 },
      context: () => ctx, unlock() {}, startMusic() { state.started++; }, isMusicOn: () => state.musicOn,
      trackNames: () => tracks.map(t => t.name), currentTrackName: () => tracks[state.track].name,
      setTrack(i, fade) { state.setTrack.push([i, fade]); state.track = i; }
    },
    __music2: {
      voices: { felt: voice('felt'), harp: voice('harp'), flute: voice('flute'), padTone: (kind, t, m, v) => { log.push(['pad', t, m, v]); }, bus: () => ({}) },
      register(def) { def.index = tracks.length; tracks.push(def); }
    }
  };
  vm.runInNewContext(read(file), { window, setTimeout() {} });
  const def = tracks[tracks.length - 1];
  // The engine's lookahead tick: one call per eighth of the track's own grid.
  const tick = (t, p) => { ctx.currentTime = t - 0.1; def.play(t, 0, 0, null, 1 / 3, p || tick); };
  return { window, ctx, log, ducks, state, scene, def, tick, tracks };
}
const SD = 1 / 3;

/* ---- the score as data ---- */
const l3 = engine('l3-cutscene-music.js', '__l3Cutscene'), S = l3.window.__l3Score;
assert(S, 'score registers on the engine');
assert.equal(S.duration, cs.duration(), 'score is as long as the film');
assert.equal(S.bars * S.barSeconds, 50); assert.equal(S.barSeconds, 2, '6/8 at 2 s a bar');
const beats = Object.fromEntries(cs.beats().map(b => [b.id, b]));
assert.equal(S.liftAt, beats.fireflies.t0, 'lift starts with the fireflies');
assert(S.swellAt >= beats.boat.t0 && S.swellAt - beats.boat.t0 <= 1, 'swell starts as the boat sails');
assert(S.settleAt >= beats.title.t0 && S.settleAt - beats.title.t0 <= 1.5, 'cadence lands as the title fades in');
const score = S.score();
assert.equal(score.length, 25);
const tonic = m => m % 12 === 5; // F
score.forEach((b, i) => {
  assert.equal(b.mel.reduce((n, x) => Math.max(n, x[0] + x[2]), 0) <= 6, true, 'bar ' + i + ' fits 6 eighths');
  b.mel.forEach(n => assert(n[1] >= 57 && n[1] <= 93, 'tune stays in the piano\'s singing range'));
  [b.bass].concat(b.chord, b.mel.map(n => n[1])).forEach(m => assert(Number.isInteger(m) && m >= 29, 'bar ' + i + ' parses'));
  assert.equal(b.chord.length, 3);
});
// A lullaby: the tune rocks long-short (quarter + eighth) or holds a dotted quarter; it never runs in even eighths.
const lens = score.flatMap(b => b.mel.map(n => n[2]));
assert(lens.filter(n => n === 2 || n === 3).length / lens.length >= 0.58, 'cradle rhythm: ' + lens.join(''));
assert(score.every(b => b.mel.every((n, i) => n[2] !== 1 || (i > 0 && b.mel[i - 1][2] >= 2 && n[0] % 3 === 2))), 'every eighth is the short half of a long-short pair');
assert(score.every(b => b.mel.filter(n => n[2] === 1).length <= 2));
assert(score.filter(b => b.mel.some(n => n[0] === 3 || (n[0] < 3 && n[0] + n[2] === 3))).length >= 18, 'two beats to the bar (6/8)');
// Dynamics follow the picture: loudest and fullest while the boat sails (peak in its last bars), softest at the title.
const at = (t0, t1) => score.slice(t0 / 2, t1 / 2);
const peak = bars => Math.max(...bars.map(b => b.dyn)), str = bars => Math.max(...bars.map(b => b.strings));
assert(peak(at(32, 44)) > peak(at(20, 32)) && peak(at(20, 32)) > peak(at(10, 20)) && peak(at(10, 20)) > peak(at(0, 10)) && peak(at(0, 10)) > peak(at(44, 50)), 'dynamic arc');
assert(str(at(32, 44)) > str(at(0, 32)) && str(at(32, 44)) > str(at(44, 50)), 'strings swell with the boat');
assert(at(32, 42).every(b => b.double) && at(0, 32).concat(at(42, 50)).every(b => !b.double), 'the tune is in octaves only in the swell');
// The lift: when the fireflies rise the tune sits an octave above the lamps' tune.
const mean = bars => { const m = bars.flatMap(b => b.mel.map(n => n[1])); return m.reduce((a, b) => a + b, 0) / m.length; };
assert(mean(at(20, 32)) - mean(at(10, 20)) >= 9, 'fireflies lift the register: ' + [mean(at(10, 20)), mean(at(20, 32))]);
const top = Math.max(...score.flatMap(b => b.mel.map(n => n[1])));
assert(score[20].mel.some(n => n[1] === top) && score[20].dyn === peak(score), 'top note at 40 s, with the boat');
assert(tonic(score[22].bass) && tonic(score[24].bass) && tonic(score[24].mel[score[24].mel.length - 1][1]), 'resolves on F at the title');
assert.equal(score[21].bass % 12, 0, 'dominant before the title');
// The swell is the lamps' tune come home (same opening an octave up), and the title echoes its first bar.
assert.equal(JSON.stringify(score[16].mel.map(n => [n[0], n[1] - 12, n[2]])), JSON.stringify(score[5].mel)); assert.equal(JSON.stringify(score[22].mel), JSON.stringify(score[5].mel));
// Sparkles sit on the picture: one bell per lamp as it warms, a rising run while the fireflies are released.
const sp = S.sparkles(), L = cs.layout ? cs.layout() : {};
const lampBells = sp.filter(g => g.at >= beats.lamps.t0 && g.at < beats.lamps.t1), run = sp.filter(g => g.at >= 20.6 && g.at < 28);
assert.equal(lampBells.length, 3); assert(lampBells.every((g, i) => !i || (g.m > lampBells[i - 1].m && Math.abs(g.at - lampBells[i - 1].at - 2.7) < 1e-6)), 'one rising bell per lamp, 2.7 s apart');
assert(lampBells[0].at > 10.6 && lampBells[0].at < 13.2, 'first bell while the first lamp warms');
assert(run.length >= 6 && run.every((g, i) => !i || g.m > run[i - 1].m), 'the release run only climbs');
assert(sp.every(g => g.v <= 0.07 && g.m >= 77 && g.m <= 101 && g.at < 50), 'sparkles stay soft and high');
// Original: neither of the other two cutscene tunes in another key, and not their rhythm either.
const l1 = engine('l1-cutscene-music.js', '__l1Cutscene'), S1 = l1.window.__l1Score;
const l2 = engine('l2-cutscene-music.js', '__l2Cutscene'), S2 = l2.window.__l2Score;
const rhythm = sc => sc.flatMap(b => b.mel.map(n => n[0] + ':' + n[2])).join(' ');
const contour = sc => sc.flatMap(b => b.mel.map(n => n[1])).map((m, i, a) => i ? m - a[i - 1] : 0).join(' ');
assert.notEqual(contour(score), contour(S1.score())); assert.notEqual(contour(score), contour(S2.score()));
assert.notEqual(rhythm(score), rhythm(S1.score())); assert.notEqual(rhythm(score), rhythm(S2.score()));
// No 8-note run of the tune appears (transposed) in either of the other scores.
const ivs = sc => sc.flatMap(b => b.mel.map(n => n[1])).map((m, i, a) => i ? m - a[i - 1] : 0).slice(1);
const mine = ivs(score), grams = sc => { const v = ivs(sc), set = new Set(); for (let i = 0; i + 7 <= v.length; i++) set.add(v.slice(i, i + 7).join(',')); return set; };
const others = new Set([...grams(S1.score()), ...grams(S2.score())]);
for (let i = 0; i + 7 <= mine.length; i++) assert(!others.has(mine.slice(i, i + 7).join(',')), 'shares an 8-note phrase with another score at note ' + i);
assert.equal(new Set([l1.def.id, l2.def.id, l3.def.id]).size, 3); assert.equal(new Set([l1.def.name, l2.def.name, l3.def.name]).size, 3);

/* ---- voice budget: a whole free run of each score on the same engine ---- */
function freeRun(e, steps) { for (let k = 0; k < steps; k++) e.tick(200 + k * SD); return e.log.splice(0); }
function budget(log) {
  // Most voices started in any 2 s window (shots ring ~2-3 s, pads one bar + release), and most pads in one.
  let shots = 0, pads = 0;
  for (let t = 200; t < 262; t += SD) {
    const w = log.filter(n => n[1] >= t - 1e-6 && n[1] < t + 2 - 1e-6);
    shots = Math.max(shots, w.filter(n => n[0] !== 'pad').length); pads = Math.max(pads, w.filter(n => n[0] === 'pad').length);
  }
  return { shots, pads, total: log.length, loud: Math.max(...log.map(n => n[3])) };
}
const b3 = budget(freeRun(l3, 150)), b1 = budget(freeRun(l1, 150)), b2 = budget(freeRun(l2, 180));
assert(b3.shots <= b2.shots && b3.pads <= b2.pads && b3.shots <= b1.shots && b3.pads <= b1.pads, 'no denser than the other scores: ' + JSON.stringify([b3, b1, b2]));
assert(b3.shots <= 20 && b3.pads <= 4, 'phone-safe voice count: ' + JSON.stringify(b3));
assert(b3.loud <= b2.loud + 0.02 && b3.loud <= b1.loud + 0.005, 'no louder than the other scores: ' + JSON.stringify([b3.loud, b1.loud, b2.loud]));

/* ---- start / follow the clock / seek / pause / skip / stop ---- */
const e = engine('l3-cutscene-music.js', '__l3Cutscene'), sc = e.window.__l3Score;
assert.equal(sc.stop(), false); assert.equal(sc.sync(), false); assert.equal(sc.settle(), false, 'nothing to do before start');
assert.equal(e.state.setTrack.length, 0, 'loading the score does not change the track');
assert.equal(sc.start(), true);
assert.deepEqual(e.state.setTrack, [[e.def.index, 1.2]], 'takes the music bus');
assert.equal(e.state.started, 1); assert.equal(sc.state().active, true); assert.equal(sc.state().track, '星灯摇篮曲');
// playing: steps land on the film clock (film t = audio time - 300)
e.scene.s = 'playing';
const film = t => { e.scene.t = t - 0.1; return 300 + t; };
for (let k = 0; k < 12; k++) e.tick(film(k * SD));
assert.equal(sc.state().lastStep, 11);
assert(e.log.every(n => n[1] >= 300 - 1e-6 && n[1] < 304.1), 'notes on the film clock');
assert(e.log.filter(n => n[0] === 'harp').length === 8 && e.log.filter(n => n[0] === 'pad').length === 8 && e.log.filter(n => n[0] === 'felt').length <= 4, 'opens on harp and strings, the piano only touched');
// seek to the boat: one duck, then the swell bar starts exactly at 32 s of film time
e.log.length = 0; e.ducks.length = 0;
assert.equal(sc.sync(), true);
for (let k = 0; k < 6; k++) e.tick(film(32 + k * SD));
assert.equal(sc.state().lastStep, 16 * 6 + 5);
assert(e.ducks.length >= 1 && e.ducks.every(d => d <= 0.31), 'seek fades what was ringing instead of cutting or stacking');
assert(Math.abs(Math.min(...e.log.map(n => n[1])) - 332) < 0.02, 'swell downbeat at 32 s');
assert(e.log.filter(n => n[0] === 'pad').length === 4 && e.log.some(n => n[0] === 'harp') && e.log.filter(n => n[0] === 'felt' && Math.abs(n[1] - 332) < 0.03).length >= 3, 'full strings + the tune in octaves');
// a stalled tab (clock jumps 3 s) re-anchors instead of chasing with a burst of late notes
e.log.length = 0;
e.tick(film(37));
assert.equal(sc.state().lastStep, 18 * 6 + 3); assert(e.log.every(n => n[1] >= 337 - 1e-6));
// pause: silence (one fade), nothing scheduled; resume picks the clock up again
e.scene.s = 'paused'; e.log.length = 0; e.ducks.length = 0;
for (let k = 1; k < 5; k++) e.tick(film(37) + k * SD);
assert.equal(e.log.length, 0); assert.equal(e.ducks.length, 1, 'one fade on pause');
e.scene.s = 'playing';
for (let k = 0; k < 3; k++) { e.ctx.currentTime = 400 + k * SD; e.scene.t = 37.4 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
assert(e.log.length > 0 && Math.abs(sc.state().position - e.scene.t) < 0.05, 'resumes on the clock');
// skip: the film is at its end; the score fades and plays only the cadence bars, then stays silent
e.scene.s = 'ended'; e.scene.t = 50; e.log.length = 0; e.ducks.length = 0;
assert.equal(sc.settle(), true); assert.equal(sc.state().free, true);
assert.deepEqual(e.ducks, [1.4]);
for (let k = 0; k < 40; k++) { e.ctx.currentTime = 400 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
const steps = sc.state().steps;
assert.equal(sc.state().lastStep, 149, 'cadence reaches the last eighth');
assert(e.log.length > 0 && e.log.length <= 40, 'only the three closing bars');
for (let k = 40; k < 60; k++) { e.ctx.currentTime = 400 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
assert.equal(sc.state().steps, steps, 'silent after the last bar while the end card waits');
// stop: the level's own track comes back with a slow crossfade; a second stop is a no-op
assert.equal(sc.stop(), true);
assert.deepEqual(e.state.setTrack[e.state.setTrack.length - 1], [1, 3], 'level track restored');
assert.equal(sc.state().active, false); assert.equal(sc.state().track, '夜航');
assert.equal(sc.stop(), false); assert.equal(e.state.setTrack.length, 2);
// If the player picked another track meanwhile, stop() leaves their choice alone.
sc.start(); e.state.track = 0; const n = e.state.setTrack.length; sc.stop();
assert.equal(e.state.setTrack.length, n); assert.equal(e.state.track, 0);

/* ---- cutscene wiring: play starts it, mute skips it, seek/skip/close reach it ---- */
const calls = [];
globalThis.__l3Score = { start: () => (calls.push('start'), true), sync: () => calls.push('sync'), settle: () => calls.push('settle'), stop: () => calls.push('stop') };
let now = 0; cs._setClock(() => now);
cs.play({ muted: true }); assert.equal(cs.scored(), false); cs.seek(10); cs.skip(); cs.close();
assert.deepEqual(calls, [], 'a muted run never touches the score');
cs.play({ muted: false }); assert.equal(cs.scored(), true); cs.seek(20); cs.skip(); now += 700; cs.proceed();
assert.deepEqual(calls, ['start', 'sync', 'settle', 'stop']); assert.equal(cs.scored(), false);
cs.play({ muted: false }); cs.close(); cs.close();
assert.deepEqual(calls.slice(4), ['start', 'stop'], 'close mid-film stops the score once');
delete globalThis.__l3Score;

const src = read('l3-cutscene-music.js');
assert(!/localStorage|sessionStorage|indexedDB|\.cookie/.test(src), 'no storage access');
console.log(JSON.stringify({ pass: true, bars: S.bars, l3: b3, l1: b1, l2: b2 }));
