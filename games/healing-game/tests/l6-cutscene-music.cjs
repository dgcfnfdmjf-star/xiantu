'use strict';

// Level-6 cutscene score 「雪窗归途」 on a fake engine (no browser): node games/healing-game/tests/l6-cutscene-music.cjs
// The score table (Ab major, 3/4 waltz, 120 bpm, one bar = 1.5 s = two beats of the film's 80 bpm cue grid), its sync
// with the picture (celesta on each lantern, the window swell, each kitten home, the title), originality against the
// level-1..5 scores, the voice budget and loudness (measured against the level-3/4/5 scores on the same fake engine),
// and start / seek / pause / skip / stop with the level track (雪灯摇篮) handed back. Sparkles are the level-3 celesta.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.resolve(__dirname, '../src', f), 'utf8');
const cs = require(path.resolve(__dirname, '../src/l6-cutscene.js'));

// One fake GardenAudio + music2 + music-lush voice set; every voice call is logged as [voice, time, midi, level].
// files: scripts loaded in order into the same window (the level-5 score borrows the level-3 score's celesta()).
function engine(files, cutsceneName, kit) {
  const log = [], ducks = [], tracks = [{ name: '花园晨曲' }, { name: '雪灯摇篮' }];
  const ctx = { currentTime: 100 };
  const gainNode = () => ({ gain: { value: 1, cancelScheduledValues() {}, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime(v, t) { ducks.push(+(t - ctx.currentTime).toFixed(2)); } }, disconnect() {} });
  const voice = name => (t, m, v) => { log.push([name, t, m, v]); };
  const state = { track: 1, musicOn: true, setTrack: [], started: 0 };
  const scene = { s: 'idle', t: 0, state: () => scene.s, time: () => scene.t };
  const window = {
    setTimeout() {}, [cutsceneName]: scene,
    GardenAudio: {
      kit: Object.assign({ gain: gainNode, rnd: (a, b) => (a + b) / 2 }, kit || {}),
      context: () => ctx, unlock() {}, startMusic() { state.started++; }, isMusicOn: () => state.musicOn,
      trackNames: () => tracks.map(t => t.name), currentTrackName: () => tracks[state.track].name,
      setTrack(i, fade) { state.setTrack.push([i, fade]); state.track = i; }
    },
    __music2: {
      voices: { felt: voice('felt'), harp: voice('harp'), flute: voice('flute'), padTone: (kind, t, m, v) => { log.push(['pad', t, m, v]); }, bus: () => ({}) },
      register(def) { def.index = tracks.length; tracks.push(def); }
    }
  };
  for (const f of [].concat(files)) vm.runInNewContext(read(f), { window, setTimeout() {} });
  const def = tracks[tracks.length - 1];
  const tick = (t, p) => { ctx.currentTime = t - 0.1; def.play(t, 0, 0, null, 1 / 3, p || tick); };
  return { window, ctx, log, ducks, state, scene, def, tick, tracks };
}
// A kit with oscillators and a music box, each logged as a voice ('osc' = one celesta partial).
const fullKit = log => ({ mtof: m => 440 * Math.pow(2, (m - 69) / 12), osc: (type, f, t0) => { log.push(['osc', t0, Math.round(f), type]); }, musicBox: (t, m, v) => { log.push(['musicBox', t, m, v]); } });

/* ---- the score as data ---- */
const L6 = ['l3-cutscene-music.js', 'l6-cutscene-music.js'];
const l6 = engine(L6, '__l6Cutscene'), S = l6.window.__l6Score;
assert(S, 'score registers on the engine');
assert.equal(S.id, 'l6snowwaltz'); assert.equal(l6.def.name, '雪窗归途'); assert.equal(l6.def.key % 12, 8, 'Ab major');
const BEAT = 0.5, BAR = 1.5, SD = 0.25;
assert.equal(S.beatSeconds, BEAT); assert.equal(S.meter, 3); assert(Math.abs(S.barSeconds - BAR) < 1e-9, '3/4: a bar is three beats'); assert.equal(S.stepSeconds, SD);
assert(Math.abs(60 / S.beatSeconds - 120) < 1e-9, '120 bpm waltz, felt in one');
// Not the level-5 lullaby's key, tempo or meter (Bb major, 80 bpm, 4/4), nor the level-1..4 keys (D, G, F, D).
assert.notEqual(l6.def.key % 12, 10); assert.notEqual(60 / S.beatSeconds, 80); assert.notEqual(S.meter, 4);
[2, 7, 5].forEach(k => assert.notEqual(l6.def.key % 12, k));
assert.equal(S.duration, cs.duration(), 'score is as long as the film');
assert(S.bars * S.barSeconds >= cs.duration() && (S.bars - 1) * S.barSeconds < cs.duration(), 'the last bar is the held chord under the end of the film');
const grid = cs.grid(), lay = cs.layout(), beats = Object.fromEntries(cs.beats().map(b => [b.id, b]));
assert.equal(grid.scoreBpm, 120); assert.equal(grid.meter, 3); assert(Math.abs(grid.bar - 2 * grid.beat) < 1e-9, 'a score bar is two film beats');
const near = (a, b, d) => Math.abs(a - b) <= d, onBar = x => near(x / BAR, Math.round(x / BAR), 1e-9), onBeat = x => near(x / BEAT, Math.round(x / BEAT), 1e-9), onStep = x => near(x / SD, Math.round(x / SD), 1e-9);
assert(near(S.lanternAt, beats.lanterns.t0, 1) && near(S.cabinAt, beats.cabin.t0, 1e-9) && near(S.islandAt, beats.island.t0, 1) && near(S.settleAt, beats.title.t0, 1e-9), 'sections follow the picture');
[S.lanternAt, S.cabinAt, S.islandAt, S.settleAt].forEach(t => assert(onBar(t), 'sections start on a barline: ' + t));
assert.equal(lay.titleAt, S.settleAt, 'the title fades in on the barline of the title bars');
for (let i = 0; i < 6; i++) assert(onBar(cs.lantern(i, 0).on), 'lantern ' + i + ' lights on a barline');
lay.arrive.forEach((t, i) => { assert(onBeat(t), 'kitten ' + i + ' arrives on a beat: ' + t); assert(onBar(cs.kitten(i, 0).start), 'kitten ' + i + ' sets off on a barline'); assert.equal(cs.kitten(i, t).home, true); assert.equal(cs.kitten(i, t - 0.05).home, false); });
lay.swell.forEach(t => assert(onBeat(t), 'window swell on beats'));
const score = JSON.parse(JSON.stringify(S.score()));
assert.equal(score.length, 34);
const pc = m => ((m % 12) + 12) % 12, AB_MAJOR = [8, 10, 0, 1, 3, 5, 7];
score.forEach((b, i) => {
  assert(b.mel.reduce((n, x) => Math.max(n, x[0] + x[2]), 0) <= 6, 'bar ' + i + ' fits three beats');
  b.mel.forEach(n => assert(n[1] >= 65 && n[1] <= 89, 'tune stays in the piano\'s singing range'));
  [b.bass].concat(b.chord, b.mel.map(n => n[1])).forEach(m => assert(Number.isInteger(m) && m >= 34 && AB_MAJOR.includes(pc(m)), 'bar ' + i + ' is diatonic Ab major: ' + m));
  assert.equal(b.chord.length, 3);
  b.mel.filter(n => n[0] === 0).forEach(n => assert([b.bass].concat(b.chord).map(pc).includes(pc(n[1])) || (i === 30 && pc(n[1]) === 0), 'bar ' + i + ' downbeat is consonant'));
});
const allNotes = score.flatMap(b => b.mel);
assert(allNotes.filter(n => n[0] % 2 === 0).length / allNotes.length >= 0.7, 'a calm tune: mostly on the beat');
assert(allNotes.filter(n => n[2] === 1).length / allNotes.length <= 0.25, 'few short notes (the waltz dotted-quarter + eighth lilt only)');
const at = (b0, b1) => score.slice(b0, b1);
const peak = bars => Math.max(...bars.map(b => b.dyn)), str = bars => Math.max(...bars.map(b => b.strings));
assert(peak(at(21, 29)) > peak(at(14, 21)) && peak(at(14, 21)) > peak(at(7, 14)) && peak(at(7, 14)) > peak(at(0, 7)) && peak(at(0, 7)) > peak(at(29, 34)), 'dynamic arc: snow, lanterns, cabin, island, soft title');
assert(score.every(b => b.strings > 0), 'strings hold under everything');
// the strings swell with the window (bars 14-18 = 21-28.5 s), never falling back while it swells
for (let i = 15; i <= 18; i++) assert(score[i].strings > score[i - 1].strings, 'strings swell with the window at bar ' + i);
assert(str(at(21, 29)) > str(at(0, 21)), 'fullest strings over the whole island');
assert(at(21, 27).every(b => b.double) && at(0, 21).concat(at(27, 34)).every(b => !b.double), 'tune in octaves only over the island');
const top = Math.max(...allNotes.map(n => n[1])), topBar = score.findIndex(b => b.mel.some(n => n[1] === top));
assert(topBar === 25 && score[25].dyn === peak(score), 'top note (F6) in the loudest bar, ~39 s');
assert.equal(pc(score[28].bass), 3, 'dominant before the title');
assert(pc(score[33].bass) === 8 && pc(score[33].mel[score[33].mel.length - 1][1]) === 8, 'home on Ab at the end');
assert.equal(JSON.stringify(score[29].mel), JSON.stringify(score[7].mel), 'the title echoes the first bar of the tune');

/* ---- celesta: exactly what the picture shows ---- */
const sp = Array.from(S.sparkles());
sp.forEach(g => { assert(onStep(g.at) || g.kind === 'window', 'sparkle on the eighth grid: ' + g.at); assert([8, 10, 0, 3, 5].includes(pc(g.m)), 'Ab pentatonic'); assert(g.v > 0.02 && g.v <= 0.07, 'soft'); assert(g.at < cs.duration()); });
const lan = sp.filter(g => g.kind === 'lantern');
assert.equal(lan.length, 6);
lan.forEach((g, i) => {
  const L = cs.lantern(i, 0);
  assert(near(g.at, L.on, 1e-9) && onBar(g.at), 'lantern ' + i + ' bell on its ignition barline');
  assert(cs.lantern(i, g.at - 0.05).flare === 0 && cs.lantern(i, g.at + 0.15).flare > 0.5, 'the flare follows the bell');
  assert(i === 0 || g.m > lan[i - 1].m, 'lantern bells climb along the path');
});
const home = sp.filter(g => g.kind === 'home');
assert.deepEqual(home.map(g => g.at), lay.arrive, 'a bell for each kitten home');
const win = sp.filter(g => g.kind === 'window');
assert.equal(win.length, 4); assert(near(win[0].at, lay.swell[0], 1e-9) && onBeat(win[0].at), 'window roll starts on the swell beat');
assert(cs.frame(win[0].at + 3).cabin.window > cs.frame(win[0].at).cabin.window, 'the window warms after the roll');
const snow = sp.filter(g => g.kind === 'snow');
assert(snow.length >= 4 && snow.every(g => g.at < beats.snow.t1), 'snowflake bells only in the snow beat');
assert.deepEqual(sp.filter(g => g.kind === 'title').map(g => g.at), [S.settleAt]);
assert.equal(S.sparkleVoice, 'celesta');
{
  const log = [], e = engine(L6, '__l6Cutscene', fullKit([]));
  Object.assign(e.window.GardenAudio.kit, fullKit(log));
  e.window.__l6Score.celesta(5, 92, 0.05, {});
  assert.deepEqual(log.map(n => [n[0], n[3]]), [['osc', 'sine'], ['osc', 'sine'], ['osc', 'sine']], 'celesta = fundamental + octave + strike');
  const alone = engine('l6-cutscene-music.js', '__l6Cutscene', fullKit(log)); log.length = 0;
  assert.equal(alone.window.__l6Score.sparkleVoice, 'musicBox'); alone.window.__l6Score.celesta(5, 92, 0.05, {});
  assert.deepEqual(log.map(n => n[0]), ['musicBox']); assert.equal(alone.log.length, 0, 'no harp stand-in');
}
const src = read('l6-cutscene-music.js');
assert(!/V\.harp|K\.harp|voices\.harp/.test(src), 'the score never calls the harp');

/* ---- original: not the other five cutscene tunes ---- */
const l1 = engine('l1-cutscene-music.js', '__l1Cutscene'), S1 = l1.window.__l1Score;
const l2 = engine('l2-cutscene-music.js', '__l2Cutscene'), S2 = l2.window.__l2Score;
const l3 = engine('l3-cutscene-music.js', '__l3Cutscene'), S3 = l3.window.__l3Score;
const l4 = engine(['l3-cutscene-music.js', 'l4-cutscene-music.js'], '__l4Cutscene'), S4 = l4.window.__l4Score;
const l5 = engine(['l3-cutscene-music.js', 'l5-cutscene-music.js'], '__l5Cutscene'), S5 = l5.window.__l5Score;
const ivs = sc => sc.flatMap(b => b.mel.map(n => n[1])).map((m, i, a) => i ? m - a[i - 1] : 0).slice(1);
// 6-note phrases (5 intervals), as strict as the level-5 test.
const grams = sc => { const v = ivs(sc), set = new Set(); for (let i = 0; i + 5 <= v.length; i++) set.add(v.slice(i, i + 5).join(',')); return set; };
const others = new Set([S1, S2, S3, S4, S5].flatMap(o => [...grams(o.score())])), mine = ivs(score);
for (let i = 0; i + 5 <= mine.length; i++) assert(!others.has(mine.slice(i, i + 5).join(',')), 'shares a 6-note phrase with another score at note ' + i);
const rhythm = sc => sc.flatMap(b => b.mel.map(n => n[0] + ':' + n[2])).join(' ');
[S1, S2, S3, S4, S5].forEach(o => assert.notEqual(rhythm(score), rhythm(o.score())));
assert.equal(new Set([l1, l2, l3, l4, l5, l6].map(e => e.def.id)).size, 6); assert.equal(new Set([l1, l2, l3, l4, l5, l6].map(e => e.def.name)).size, 6);

/* ---- voice budget and loudness: a whole free run of each score on the same engine ---- */
function freeRun(e, steps, sd) { for (let k = 0; k < steps; k++) e.tick(200 + k * sd); return e.log.splice(0); }
function budget(log) {
  let shots = 0, pads = 0;
  for (let t = 200; t < 262; t += 0.125) {
    const w = log.filter(n => n[1] >= t - 1e-6 && n[1] < t + 2 - 1e-6);
    shots = Math.max(shots, w.filter(n => n[0] !== 'pad').length); pads = Math.max(pads, w.filter(n => n[0] === 'pad').length);
  }
  const lv = log.filter(n => n[0] !== 'osc'), pad = log.filter(n => n[0] === 'pad');
  return { shots, pads, total: log.length, loud: Math.max(...lv.map(n => n[3])), padLoud: Math.max(...pad.map(n => n[3])) };
}
const b6 = budget(freeRun(l6, 204, SD)), b5 = budget(freeRun(l5, 136, 0.375)), b4 = budget(freeRun(l4, 114, 0.45)), b3 = budget(freeRun(l3, 150, 1 / 3));
assert(b6.shots <= Math.max(b5.shots, b4.shots, b3.shots) && b6.pads <= Math.max(b5.pads, b4.pads, b3.pads), 'no denser than the level-3/4/5 scores: ' + JSON.stringify([b6, b5, b4, b3]));
assert(b6.shots <= 20 && b6.pads <= 4, 'phone-safe voice count: ' + JSON.stringify(b6));
assert(b6.loud <= b5.loud + 0.005 && b6.loud >= b5.loud * 0.85, 'peak level in line with the level-5 score: ' + JSON.stringify([b6.loud, b5.loud]));
assert(b6.padLoud <= b5.padLoud * 1.15, 'strings no louder than level 5: ' + JSON.stringify([b6.padLoud, b5.padLoud]));
{
  const log = [], e = engine(L6, '__l6Cutscene', fullKit(log));
  for (let k = 0; k < 204; k++) e.tick(200 + k * SD);
  assert.equal(log.length, sp.length * 3, 'three partials a sparkle, every sparkle once');
  assert.equal(e.log.filter(n => n[0] === 'harp').length, 0, 'no harp anywhere in the film');
  assert.deepEqual(log.filter((n, i) => i % 3 === 0).map(n => +(n[1] - 200).toFixed(3)), sp.map(g => g.at), 'each sparkle at its film time');
}

/* ---- start / follow the clock / seek / pause / skip / stop ---- */
const e = engine(L6, '__l6Cutscene'), sc = e.window.__l6Score;
assert.equal(sc.stop(), false); assert.equal(sc.sync(), false); assert.equal(sc.settle(), false, 'nothing to do before start');
assert.equal(e.state.setTrack.length, 0, 'loading the score does not change the track');
assert.equal(sc.start(), true);
assert.deepEqual(e.state.setTrack, [[e.def.index, 1.2]], 'takes the music bus (雪灯摇篮 fades out)');
assert.equal(e.state.started, 1); assert.equal(sc.state().track, '雪窗归途');
assert.equal(e.window.__l3Score.state().active, false, 'the level-3 score is only lent its celesta');
e.scene.s = 'playing';
const film = t => { e.scene.t = t - 0.1; return 300 + t; };
for (let k = 0; k < 12; k++) e.tick(film(k * SD));
assert.equal(sc.state().lastStep, 11);
assert(e.log.every(n => n[1] >= 300 - 1e-6 && n[1] < 303.5), 'notes on the film clock');
// the lantern bars: waltz left hand = bass on one, two chord notes on two and three; a bell on the downbeat
e.log.length = 0; sc.sync();
for (let k = 0; k < 6; k++) e.tick(film(12 + k * SD));
const lh = e.log.filter(n => n[0] === 'felt' && n[2] < 72).map(n => Math.round((n[1] - 312) / BEAT));
assert.deepEqual(lh, [0, 1, 1, 2, 2], 'waltz: ' + JSON.stringify(lh));
assert(e.log.some(n => n[0] === 'felt' && n[2] === 84 && near(n[1], 312, 0.02)), 'the tune (C6 over F minor) on the downbeat');
// seek to the island: the octave tune starts exactly at 31.5 s
e.log.length = 0; e.ducks.length = 0;
assert.equal(sc.sync(), true);
for (let k = 0; k < 6; k++) e.tick(film(31.5 + k * SD));
assert.equal(sc.state().lastStep, 21 * 6 + 5);
assert(e.ducks.length >= 1 && e.ducks.every(d => d <= 0.31), 'seek fades what was ringing');
assert(Math.abs(Math.min(...e.log.map(n => n[1])) - 331.5) < 0.02, 'island downbeat at 31.5 s');
// a stalled tab (clock jumps 3 s) re-anchors instead of chasing
e.log.length = 0; e.tick(film(36));
assert.equal(sc.state().lastStep, 144); assert(e.log.every(n => n[1] >= 336 - 1e-6));
// pause: one fade, nothing scheduled
e.scene.s = 'paused'; e.log.length = 0; e.ducks.length = 0;
for (let k = 1; k < 5; k++) e.tick(film(36) + k * SD);
assert.equal(e.log.length, 0); assert.equal(e.ducks.length, 1, 'one fade on pause');
e.scene.s = 'playing';
for (let k = 0; k < 3; k++) { e.ctx.currentTime = 400 + k * SD; e.scene.t = 36.4 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
assert(e.log.length > 0 && Math.abs(sc.state().position - e.scene.t) < 0.05, 'resumes on the clock');
// skip: fade, then only the title bars, then silence; an early tick inside the lead-in plays nothing
e.scene.s = 'ended'; e.scene.t = 50; e.log.length = 0; e.ducks.length = 0; e.ctx.currentTime = 399.6;
assert.equal(sc.settle(), true); assert.deepEqual(e.ducks, [1.4]);
e.ctx.currentTime = 399.62; e.def.play(399.65, 0, 0, null, SD, e.tick);
assert.equal(e.log.length, 0, 'an early tick after skip stays silent (skip drops future notes)');
e.def.play(399.8, 0, 0, null, SD, e.tick); e.log.length = 0;
for (let k = 0; k < 40; k++) { e.ctx.currentTime = 400 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
const steps = sc.state().steps;
assert.equal(sc.state().lastStep, 203, 'the closing reaches the last eighth');
assert(e.log.length > 0 && e.log.length <= 40, 'only the title bars: ' + e.log.length);
assert(pc(e.log.filter(n => n[0] === 'felt').pop()[2]) === 8, 'ends on Ab');
assert(Math.abs(Math.min(...e.log.map(n => n[1])) - 400.1) < 0.02, 'the title bars start 0.5 s after skip, on their downbeat');
for (let k = 40; k < 60; k++) { e.ctx.currentTime = 400 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
assert.equal(sc.state().steps, steps, 'silent after the last bar while the end card waits');
assert.equal(sc.stop(), true);
assert.deepEqual(e.state.setTrack[e.state.setTrack.length - 1], [1, 3], 'level track restored');
assert.equal(sc.state().track, '雪灯摇篮'); assert.equal(sc.stop(), false);
sc.start(); e.state.track = 0; const n = e.state.setTrack.length; sc.stop();
assert.equal(e.state.setTrack.length, n, 'a track the player picked meanwhile is left alone');
{
  const q = engine(L6, '__l6Cutscene'); q.state.musicOn = false;
  assert.equal(q.window.__l6Score.start(), true); assert.equal(q.window.__l6Score.state().musicOn, false); assert.equal(q.log.length, 0);
  assert.equal(q.window.__l6Score.stop(), true);
}

/* ---- cutscene wiring: play starts it, mute skips it, seek/skip/close reach it ---- */
const calls = [];
globalThis.__l6Score = { start: () => (calls.push('start'), true), sync: () => calls.push('sync'), settle: () => calls.push('settle'), stop: () => calls.push('stop') };
let now = 0; cs._setClock(() => now);
cs.play({ muted: true }); assert.equal(cs.scored(), false); cs.seek(10); cs.skip(); cs.close();
assert.deepEqual(calls, [], 'a muted run never touches the score');
cs.play({ muted: false }); assert.equal(cs.scored(), true); cs.seek(20); cs.skip(); now += 700; cs.proceed();
assert.deepEqual(calls, ['start', 'sync', 'settle', 'stop']); assert.equal(cs.scored(), false);
cs.play({ muted: false }); cs.close(); cs.close();
assert.deepEqual(calls.slice(4), ['start', 'stop'], 'close mid-film stops the score once');
delete globalThis.__l6Score;

assert(!/localStorage|sessionStorage|indexedDB|\.cookie/.test(src), 'no storage access');
console.log(JSON.stringify({ pass: true, bars: S.bars, sparkles: sp.length, l6: b6, l5: b5, l4: b4, l3: b3 }));
