'use strict';

// Level-1 cutscene score on a fake engine (no browser): node games/healing-game/tests/l1-cutscene-music.cjs
// The score table, its sync with the picture, the voice budget (measured against the level-2 score on the same fake
// engine), and start / seek / pause / skip / stop with the level track handed back.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.resolve(__dirname, '../src', f), 'utf8');
const cs = require(path.resolve(__dirname, '../src/l1-cutscene.js'));

// One fake GardenAudio + music2 + music-lush voice set; every voice call is logged as [voice, time, midi, level].
function engine(file, cutsceneName) {
  const log = [], ducks = [], tracks = [{ name: '花园晨曲' }, { name: '蝶舞' }];
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
const l1 = engine('l1-cutscene-music.js', '__l1Cutscene'), S = l1.window.__l1Score;
assert(S, 'score registers on the engine');
assert.equal(S.duration, cs.duration(), 'score is as long as the film');
assert.equal(S.bars * S.barSeconds, 50); assert.equal(S.barSeconds, 2, '3/4 at 2 s a bar');
const beats = Object.fromEntries(cs.beats().map(b => [b.id, b]));
assert.equal(S.swellAt, beats.ribbon.t0, 'swell starts with the ribbon');
assert(S.settleAt >= beats.title.t0 && S.settleAt - beats.title.t0 <= 1.5, 'cadence lands as the title fades in');
const score = S.score();
assert.equal(score.length, 25);
const tonic = m => m % 12 === 2; // D
score.forEach((b, i) => {
  assert.equal(b.mel.reduce((n, x) => Math.max(n, x[0] + x[2]), 0) <= 6, true, 'bar ' + i + ' fits 6 eighths');
  b.mel.forEach(n => assert(n[1] >= 57 && n[1] <= 88, 'tune stays in the piano\'s singing range'));
});
// Dynamics follow the picture: loudest and fullest in the ribbon (peak in its last bars), softest at the title.
const at = (t0, t1) => score.slice(t0 / 2, t1 / 2);
const peak = bars => Math.max(...bars.map(b => b.dyn)), str = bars => Math.max(...bars.map(b => b.strings));
assert(peak(at(32, 44)) > peak(at(20, 32)) && peak(at(20, 32)) > peak(at(10, 20)) && peak(at(10, 20)) > peak(at(44, 50)), 'dynamic arc');
assert(str(at(32, 44)) > str(at(0, 32)) && str(at(32, 44)) > str(at(44, 50)), 'strings swell in the ribbon');
const top = Math.max(...score.flatMap(b => b.mel.map(n => n[1])));
assert(score[20].mel.some(n => n[1] === top) && score[20].dyn === peak(score), 'top note at 40 s, inside the ribbon');
assert(tonic(score[22].bass) && tonic(score[24].bass) && tonic(score[24].mel[score[24].mel.length - 1][1]), 'resolves on D at the title');
assert.equal(score[21].bass % 12, 9, 'dominant before the title');
// Original: not the level-2 tune in another key.
const l2 = engine('l2-cutscene-music.js', '__l2Cutscene'), S2 = l2.window.__l2Score;
const shape = sc => sc.flatMap(b => b.mel.map(n => n[0] + ':' + n[2])).join(' ') + '|' + sc.flatMap(b => b.mel.map(n => n[1])).map((m, i, a) => i ? m - a[i - 1] : 0).join(' ');
assert.notEqual(shape(score).split('|')[1], shape(S2.score()).split('|')[1]);
assert.notEqual(l1.def.id, l2.def.id); assert.notEqual(l1.def.name, l2.def.name);

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
const b1 = budget(freeRun(l1, 150)), b2 = budget(freeRun(l2, 180));
assert(b1.shots <= b2.shots && b1.pads <= b2.pads, 'no denser than the level-2 score: ' + JSON.stringify([b1, b2]));
assert(b1.shots <= 20 && b1.pads <= 4, 'phone-safe voice count: ' + JSON.stringify(b1));
assert(b1.loud <= b2.loud + 0.02, 'no louder than the level-2 score: ' + JSON.stringify([b1.loud, b2.loud]));

/* ---- start / follow the clock / seek / pause / skip / stop ---- */
const e = engine('l1-cutscene-music.js', '__l1Cutscene'), sc = e.window.__l1Score;
assert.equal(sc.stop(), false); assert.equal(sc.sync(), false); assert.equal(sc.settle(), false, 'nothing to do before start');
assert.equal(e.state.setTrack.length, 0, 'loading the score does not change the track');
assert.equal(sc.start(), true);
assert.deepEqual(e.state.setTrack, [[e.def.index, 1.2]], 'takes the music bus');
assert.equal(e.state.started, 1); assert.equal(sc.state().active, true); assert.equal(sc.state().track, '蝶归晚风');
// playing: steps land on the film clock (film t = audio time - 300)
e.scene.s = 'playing';
const film = t => { e.scene.t = t - 0.1; return 300 + t; };
for (let k = 0; k < 12; k++) e.tick(film(k * SD));
assert.equal(sc.state().lastStep, 11);
assert(e.log.every(n => n[1] >= 300 - 1e-6 && n[1] < 304.1), 'notes on the film clock');
assert(e.log.filter(n => n[0] === 'harp').length === 12 && e.log.filter(n => n[0] === 'pad').length === 8 && e.log.filter(n => n[0] === 'felt').length <= 4, 'opens on harp and strings, the piano only touched');
// seek to the ribbon: one duck, then the swell bar starts exactly at 32 s of film time
e.log.length = 0; e.ducks.length = 0;
assert.equal(sc.sync(), true);
for (let k = 0; k < 6; k++) e.tick(film(32 + k * SD));
assert.equal(sc.state().lastStep, 16 * 6 + 5);
assert(e.ducks.length >= 1 && e.ducks.every(d => d <= 0.31), 'seek fades what was ringing instead of cutting or stacking');
assert(Math.abs(Math.min(...e.log.map(n => n[1])) - 332) < 0.02, 'swell downbeat at 32 s');
assert(e.log.filter(n => n[0] === 'pad').length === 4 && e.log.some(n => n[0] === 'harp'), 'full strings + doubled tune');
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
assert.equal(sc.state().active, false); assert.equal(sc.state().track, '蝶舞');
assert.equal(sc.stop(), false); assert.equal(e.state.setTrack.length, 2);
// If the player picked another track meanwhile, stop() leaves their choice alone.
sc.start(); e.state.track = 0; const n = e.state.setTrack.length; sc.stop();
assert.equal(e.state.setTrack.length, n); assert.equal(e.state.track, 0);

/* ---- cutscene wiring: play starts it, mute skips it, seek/skip/close reach it ---- */
const calls = [];
globalThis.__l1Score = { start: () => (calls.push('start'), true), sync: () => calls.push('sync'), settle: () => calls.push('settle'), stop: () => calls.push('stop') };
let now = 0; cs._setClock(() => now);
cs.play({ muted: true }); assert.equal(cs.scored(), false); cs.seek(10); cs.skip(); cs.close();
assert.deepEqual(calls, [], 'a muted run never touches the score');
cs.play({ muted: false }); assert.equal(cs.scored(), true); cs.seek(20); cs.skip(); now += 700; cs.proceed();
assert.deepEqual(calls, ['start', 'sync', 'settle', 'stop']); assert.equal(cs.scored(), false);
cs.play({ muted: false }); cs.close(); cs.close();
assert.deepEqual(calls.slice(4), ['start', 'stop'], 'close mid-film stops the score once');
delete globalThis.__l1Score;

const src = read('l1-cutscene-music.js');
assert(!/localStorage|sessionStorage|indexedDB|\.cookie/.test(src), 'no storage access');
console.log(JSON.stringify({ pass: true, bars: S.bars, l1: b1, l2: b2 }));
