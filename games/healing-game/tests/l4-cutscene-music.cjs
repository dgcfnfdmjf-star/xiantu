'use strict';

// Level-4 cutscene score on a fake engine (no browser): node games/healing-game/tests/l4-cutscene-music.cjs
// The score table (D major, 3/4, one beat = the film's 0.9 s strike grid), its sync with the picture (one celesta note per
// chime strike), the voice budget (measured against the level-1/2/3 scores on the same fake engine), and
// start / seek / pause / skip / stop with the level track (晨风来信) handed back. Sparkles are the level-3 celesta, never the harp.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.resolve(__dirname, '../src', f), 'utf8');
const cs = require(path.resolve(__dirname, '../src/l4-cutscene.js'));

// One fake GardenAudio + music2 + music-lush voice set; every voice call is logged as [voice, time, midi, level].
// files: scripts loaded in order into the same window (the level-4 score borrows the level-3 score's celesta()).
function engine(files, cutsceneName, kit) {
  const log = [], ducks = [], tracks = [{ name: '花园晨曲' }, { name: '晨风来信' }];
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
const l4 = engine(['l3-cutscene-music.js', 'l4-cutscene-music.js'], '__l4Cutscene'), S = l4.window.__l4Score;
assert(S, 'score registers on the engine');
assert.equal(S.id, 'l4waltz'); assert.equal(l4.def.name, '晨铃圆舞曲'); assert.equal(l4.def.key, 62, 'D major');
const BEAT = 0.9, BAR = 2.7, SD = 0.45;
assert.equal(S.beatSeconds, BEAT, 'one beat = the film\'s strike grid'); assert(Math.abs(S.barSeconds - BAR) < 1e-9, '3/4: a bar is three beats'); assert.equal(S.stepSeconds, SD);
assert(Math.abs(60 / S.beatSeconds - 66.67) < 0.01, '66.7 bpm');
assert.equal(S.duration, cs.duration(), 'score is as long as the film');
assert(S.bars * S.barSeconds >= cs.duration() && (S.bars - 1) * S.barSeconds < cs.duration(), 'the last bar is the held chord under the end of the film');
const beats = Object.fromEntries(cs.beats().map(b => [b.id, b]));
const near = (a, b, d) => Math.abs(a - b) <= d;
assert(near(S.wakeAt, beats.chimes.t0, 1) && near(S.liftAt, beats.notes.t0, 1) && near(S.swellAt, beats.send.t0, 1) && near(S.settleAt, beats.title.t0, 1), 'sections follow the picture: ' + [S.wakeAt, S.liftAt, S.swellAt, S.settleAt]);
[S.wakeAt, S.liftAt, S.swellAt, S.settleAt].forEach(t => assert(near(t / BAR, Math.round(t / BAR), 1e-9), 'sections start on a barline'));
const score = JSON.parse(JSON.stringify(S.score()));
assert.equal(score.length, 19);
const pc = m => ((m % 12) + 12) % 12, D_MAJOR = [2, 4, 6, 7, 9, 11, 1];
score.forEach((b, i) => {
  assert(b.mel.reduce((n, x) => Math.max(n, x[0] + x[2]), 0) <= 6, 'bar ' + i + ' fits three beats');
  b.mel.forEach(n => assert(n[1] >= 57 && n[1] <= 93, 'tune stays in the piano\'s singing range'));
  [b.bass].concat(b.chord, b.mel.map(n => n[1])).forEach(m => assert(Number.isInteger(m) && m >= 38 && D_MAJOR.includes(pc(m)), 'bar ' + i + ' is diatonic D major: ' + m));
  assert.equal(b.chord.length, 3);
});
// A waltz: nearly every bar of the tune starts on the downbeat, the tune moves on beats (even steps) with only single
// passing eighths, and the left hand of the 'w' bars is bass - chord - chord (checked on the engine below).
const tuneBars = score.filter(b => b.mel.length);
assert(tuneBars.filter(b => b.mel[0][0] === 0).length >= tuneBars.length - 2, 'the tune sings from the downbeat');
const allNotes = score.flatMap(b => b.mel);
assert(allNotes.filter(n => n[0] % 2 === 0).length / allNotes.length >= 0.7, 'the tune moves on the three beats');
assert(score.every(b => b.mel.every((n, i) => n[2] !== 1 || !b.mel[i + 1] || b.mel[i + 1][2] !== 1 || !b.mel[i + 2] || b.mel[i + 2][2] !== 1)), 'never three eighths in a row');
// Dynamics follow the picture: it lightens as dawn spreads, is fullest while the song goes out over the cloud sea, softest at the title.
const at = (b0, b1) => score.slice(b0, b1);
const peak = bars => Math.max(...bars.map(b => b.dyn)), str = bars => Math.max(...bars.map(b => b.strings));
assert(peak(at(12, 16)) > peak(at(8, 12)) && peak(at(8, 12)) > peak(at(4, 8)) && peak(at(4, 8)) > peak(at(0, 4)) && peak(at(0, 4)) > peak(at(16, 19)), 'dynamic arc');
assert(str(at(12, 16)) > str(at(0, 12)) && str(at(12, 16)) > str(at(16, 19)), 'strings swell as the wind carries the song');
assert(score.every(b => b.strings > 0 || b.kind === 'w'), 'strings hold under everything but the first solo piano bars');
assert(at(12, 15).every(b => b.double) && at(0, 12).concat(at(15, 19)).every(b => !b.double), 'the tune is in octaves only in the swell');
const mean = bars => { const m = bars.flatMap(b => b.mel.map(n => n[1])); return m.reduce((a, b) => a + b, 0) / m.length; };
assert(mean(at(8, 12)) - mean(at(4, 8)) >= 5 && mean(at(12, 16)) > mean(at(8, 12)), 'the register lifts with the notes and petals: ' + [mean(at(4, 8)), mean(at(8, 12)), mean(at(12, 16))]);
const top = Math.max(...allNotes.map(n => n[1]));
assert(score[14].mel[0][1] === top && score[14].dyn === peak(score), 'top note at 37.8 s, as the chimes play the song for the last time');
assert.equal(pc(score[15].bass), 9, 'dominant before the title');
assert(pc(score[16].bass) === 2 && pc(score[18].bass) === 2 && pc(score[18].mel[score[18].mel.length - 1][1]) === 2 && score[18].mel[0][2] === 6, 'resolves on a held D at the title');
assert.equal(JSON.stringify(score[16].mel), JSON.stringify(score[4].mel), 'the title echoes the first bar of the tune');

/* ---- celesta: exactly the chime strikes in the picture, at the chimes' own pitches ---- */
const sp = Array.from(S.sparkles()), strikes = cs.layout().strikes;
assert.equal(sp.length, strikes.length); assert.equal(sp.length, 42);
const byTime = a => a.slice().sort((x, y) => x[0] - y[0] || x[1] - y[1]);
assert.deepEqual(byTime(sp.map(g => [g.at, g.c])), byTime(strikes.map(e => [+e[0].toFixed(3), e[1]])), 'one celesta note per chime strike, same time, same chime');
const CHIME = [74, 76, 78, 81, 83, 86]; // D5 E5 F#5 A5 B5 D6: the game's six chimes (chime-rules.js)
const rules = require(path.resolve(__dirname, '../src/chime-rules.js'));
if (rules.tones && rules.tones[0] && rules.tones[0].midi) assert.deepEqual(rules.tones.map(t => t.midi), CHIME);
sp.forEach(g => { assert.equal(g.m, CHIME[g.c] + 12, 'the chime\'s own note, an octave up'); assert(g.v > 0.02 && g.v <= 0.07, 'soft'); });
// The single strikes (waking, the song) land on beats of the score; the rolls start on a beat.
const single = strikes.filter(e => e[3] !== 2).map(e => e[0]);
single.forEach(t => assert(near(t / BEAT, Math.round(t / BEAT), 1e-6), 'strike at ' + t + ' is on a beat'));
[21.6, 29.7, 37.8].forEach(t => assert(near(t / BAR, Math.round(t / BAR), 1e-6), 'the song starts on a downbeat: ' + t));
// Every ringing strike is consonant with its bar: a chord tone or a note of the D pentatonic the chimes are tuned to.
assert(sp.every(g => [2, 4, 6, 9, 11].includes(pc(g.m))));
// Voice: the level-3 celesta (three sine partials a note through the kit), never the harp; music box only without the L3 score.
assert.equal(S.sparkleVoice, 'celesta');
{
  const log = [], e = engine(['l3-cutscene-music.js', 'l4-cutscene-music.js'], '__l4Cutscene', fullKit([]));
  Object.assign(e.window.GardenAudio.kit, fullKit(log));
  assert.equal(e.window.__l4Score.sparkleVoice, 'celesta');
  e.window.__l4Score.celesta(5, 86, 0.05, {});
  assert.deepEqual(log.map(n => [n[0], n[3], n[2]]), [['osc', 'sine', 1175], ['osc', 'sine', 2349], ['osc', 'sine', 4722]], 'celesta = fundamental + octave + strike');
  assert.equal(e.log.filter(n => n[0] === 'harp').length, 0);
  const alone = engine('l4-cutscene-music.js', '__l4Cutscene', fullKit(log)); log.length = 0;
  assert.equal(alone.window.__l4Score.sparkleVoice, 'musicBox'); alone.window.__l4Score.celesta(5, 86, 0.05, {});
  assert.deepEqual(log.map(n => n[0]), ['musicBox']); assert.equal(alone.log.length, 0, 'no harp stand-in');
}
const src = read('l4-cutscene-music.js');
assert(!/V\.harp|K\.harp|voices\.harp/.test(src), 'the score never calls the harp');

/* ---- original: not the other three cutscene tunes, nor the level's own songs ---- */
const l1 = engine('l1-cutscene-music.js', '__l1Cutscene'), S1 = l1.window.__l1Score;
const l2 = engine('l2-cutscene-music.js', '__l2Cutscene'), S2 = l2.window.__l2Score;
const l3 = engine('l3-cutscene-music.js', '__l3Cutscene'), S3 = l3.window.__l3Score;
const ivs = sc => sc.flatMap(b => b.mel.map(n => n[1])).map((m, i, a) => i ? m - a[i - 1] : 0).slice(1);
const grams = sc => { const v = ivs(sc), set = new Set(); for (let i = 0; i + 7 <= v.length; i++) set.add(v.slice(i, i + 7).join(',')); return set; };
const others = new Set([...grams(S1.score()), ...grams(S2.score()), ...grams(S3.score())]), mine = ivs(score);
for (let i = 0; i + 7 <= mine.length; i++) assert(!others.has(mine.slice(i, i + 7).join(',')), 'shares an 8-note phrase with another score at note ' + i);
const rhythm = sc => sc.flatMap(b => b.mel.map(n => n[0] + ':' + n[2])).join(' ');
[S1, S2, S3].forEach(o => assert.notEqual(rhythm(score), rhythm(o.score())));
assert.equal(new Set([l1.def.id, l2.def.id, l3.def.id, l4.def.id]).size, 4); assert.equal(new Set([l1.def.name, l2.def.name, l3.def.name, l4.def.name]).size, 4);

/* ---- voice budget: a whole free run of each score on the same engine (celesta partials counted one by one) ---- */
function freeRun(e, steps, sd) { for (let k = 0; k < steps; k++) e.tick(200 + k * sd); return e.log.splice(0); }
function budget(log) {
  // Most voices started in any 2 s window (shots ring ~2-3 s, pads one bar + release), and most pads in one.
  let shots = 0, pads = 0;
  for (let t = 200; t < 262; t += 0.15) {
    const w = log.filter(n => n[1] >= t - 1e-6 && n[1] < t + 2 - 1e-6);
    shots = Math.max(shots, w.filter(n => n[0] !== 'pad').length); pads = Math.max(pads, w.filter(n => n[0] === 'pad').length);
  }
  const lv = log.filter(n => n[0] !== 'osc');
  return { shots, pads, total: log.length, loud: Math.max(...lv.map(n => n[3])) };
}
const b4 = budget(freeRun(l4, 114, SD)), b3 = budget(freeRun(l3, 150, 1 / 3)), b1 = budget(freeRun(l1, 150, 1 / 3)), b2 = budget(freeRun(l2, 180, 1 / 3));
assert(b4.shots <= b3.shots && b4.shots <= b2.shots && b4.shots <= b1.shots && b4.pads <= b3.pads && b4.pads <= b2.pads && b4.pads <= b1.pads, 'no denser than the other scores: ' + JSON.stringify([b4, b3, b1, b2]));
assert(b4.shots <= 20 && b4.pads <= 4, 'phone-safe voice count: ' + JSON.stringify(b4));
assert(b4.loud <= b3.loud + 0.005 && b4.loud <= b2.loud + 0.02 && b4.loud <= b1.loud + 0.005, 'no louder than the other scores: ' + JSON.stringify([b4.loud, b3.loud, b1.loud, b2.loud]));
// With real oscillators the six-chime roll is the densest celesta moment: 18 short sine partials, never more in half a second.
{
  const log = [], e = engine(['l3-cutscene-music.js', 'l4-cutscene-music.js'], '__l4Cutscene', fullKit(log));
  for (let k = 0; k < 114; k++) e.tick(200 + k * SD);
  assert.equal(log.length, 42 * 3, 'three partials a strike, every strike once');
  let most = 0; for (let t = 200; t < 252; t += 0.05) most = Math.max(most, log.filter(n => n[1] >= t && n[1] < t + 0.5).length);
  assert(most <= 18, 'celesta partials in half a second: ' + most);
  assert.equal(e.log.filter(n => n[0] === 'harp').length, 0, 'no harp anywhere in the film');
  // Each strike sounds at its film time (free run anchored at 200).
  assert.deepEqual(log.filter((n, i) => i % 3 === 0).map(n => +(n[1] - 200).toFixed(3)), sp.map(g => g.at).sort((a, b) => a - b));
}

/* ---- start / follow the clock / seek / pause / skip / stop ---- */
const e = engine(['l3-cutscene-music.js', 'l4-cutscene-music.js'], '__l4Cutscene'), sc = e.window.__l4Score;
assert.equal(sc.stop(), false); assert.equal(sc.sync(), false); assert.equal(sc.settle(), false, 'nothing to do before start');
assert.equal(e.state.setTrack.length, 0, 'loading the score does not change the track');
assert.equal(sc.start(), true);
assert.deepEqual(e.state.setTrack, [[e.def.index, 1.2]], 'takes the music bus (晨风来信 fades out)');
assert.equal(e.state.started, 1); assert.equal(sc.state().active, true); assert.equal(sc.state().track, '晨铃圆舞曲');
assert.equal(e.window.__l3Score.state().active, false, 'the level-3 score is only lent its celesta');
// playing: steps land on the film clock (film t = audio time - 300)
e.scene.s = 'playing';
const film = t => { e.scene.t = t - 0.1; return 300 + t; };
for (let k = 0; k < 12; k++) e.tick(film(k * SD));
assert.equal(sc.state().lastStep, 11);
assert(e.log.every(n => n[1] >= 300 - 1e-6 && n[1] < 305.5), 'notes on the film clock');
assert(e.log.filter(n => n[0] === 'pad').length === 8 && e.log.filter(n => n[0] === 'felt').length <= 7 && !e.log.some(n => n[0] === 'harp'), 'opens on low strings, the piano only touched');
// the waking bars: waltz left hand = bass on one, chord on two and three
e.log.length = 0; sc.sync();
for (let k = 0; k < 6; k++) e.tick(film(10.8 + k * SD));
const lh = e.log.filter(n => n[0] === 'felt' && n[2] < 69).map(n => [Math.round((n[1] - 310.8) / BEAT), n[2]]);
assert.deepEqual(lh.map(n => n[0]), [0, 1, 1, 2], 'oom-pah-pah: ' + JSON.stringify(lh)); assert.equal(lh[0][1], 50, 'bass D on one');
assert.equal(e.log.filter(n => n[0] === 'pad').length, 0, 'piano alone as the first chime wakes');
// seek to the swell: one duck, then the swell bar starts exactly at 32.4 s of film time
e.log.length = 0; e.ducks.length = 0;
assert.equal(sc.sync(), true);
for (let k = 0; k < 6; k++) e.tick(film(32.4 + k * SD));
assert.equal(sc.state().lastStep, 12 * 6 + 5);
assert(e.ducks.length >= 1 && e.ducks.every(d => d <= 0.31), 'seek fades what was ringing instead of cutting or stacking');
assert(Math.abs(Math.min(...e.log.map(n => n[1])) - 332.4) < 0.02, 'swell downbeat at 32.4 s');
assert(e.log.filter(n => n[0] === 'pad').length === 4 && e.log.filter(n => n[0] === 'felt' && Math.abs(n[1] - 332.4) < 0.03).length >= 3, 'full strings + the tune in octaves');
// a stalled tab (clock jumps 3 s) re-anchors instead of chasing with a burst of late notes
e.log.length = 0;
e.tick(film(38.25));
assert.equal(sc.state().lastStep, 85); assert(e.log.every(n => n[1] >= 338.25 - 1e-6));
// pause: silence (one fade), nothing scheduled; resume picks the clock up again
e.scene.s = 'paused'; e.log.length = 0; e.ducks.length = 0;
for (let k = 1; k < 5; k++) e.tick(film(38.25) + k * SD);
assert.equal(e.log.length, 0); assert.equal(e.ducks.length, 1, 'one fade on pause');
e.scene.s = 'playing';
for (let k = 0; k < 3; k++) { e.ctx.currentTime = 400 + k * SD; e.scene.t = 38.6 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
assert(e.log.length > 0 && Math.abs(sc.state().position - e.scene.t) < 0.05, 'resumes on the clock');
// skip: the film is at its end; the score fades and plays only the closing bars, then stays silent
e.scene.s = 'ended'; e.scene.t = 50; e.log.length = 0; e.ducks.length = 0;
assert.equal(sc.settle(), true); assert.equal(sc.state().free, true);
assert.deepEqual(e.ducks, [1.4]);
for (let k = 0; k < 30; k++) { e.ctx.currentTime = 400 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
const steps = sc.state().steps;
assert.equal(sc.state().lastStep, 113, 'the closing reaches the last eighth');
assert(e.log.length > 0 && e.log.length <= 40, 'only the three closing bars: ' + e.log.length);
assert(e.log.filter(n => n[0] === 'felt' && n[2] >= 69).length >= 5 && pc(e.log.filter(n => n[0] === 'felt').pop()[2]) === 2, 'the tune\'s echo, ending on D');
for (let k = 30; k < 50; k++) { e.ctx.currentTime = 400 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
assert.equal(sc.state().steps, steps, 'silent after the last bar while the end card waits');
// stop: the level's own track comes back with a slow crossfade; a second stop is a no-op
assert.equal(sc.stop(), true);
assert.deepEqual(e.state.setTrack[e.state.setTrack.length - 1], [1, 3], 'level track restored');
assert.equal(sc.state().active, false); assert.equal(sc.state().track, '晨风来信');
assert.equal(sc.stop(), false); assert.equal(e.state.setTrack.length, 2);
// If the player picked another track meanwhile, stop() leaves their choice alone.
sc.start(); e.state.track = 0; const n = e.state.setTrack.length; sc.stop();
assert.equal(e.state.setTrack.length, n); assert.equal(e.state.track, 0);
// Music switch off: start() still marks the film as scored, but the engine never ticks, so nothing sounds; stop() hands back as usual.
{
  const q = engine(['l3-cutscene-music.js', 'l4-cutscene-music.js'], '__l4Cutscene'); q.state.musicOn = false;
  assert.equal(q.window.__l4Score.start(), true); assert.equal(q.window.__l4Score.state().musicOn, false); assert.equal(q.log.length, 0);
  assert.equal(q.window.__l4Score.stop(), true); assert.equal(q.window.__l4Score.state().track, '晨风来信');
}

/* ---- cutscene wiring: play starts it, mute skips it, seek/skip/close reach it ---- */
const calls = [];
globalThis.__l4Score = { start: () => (calls.push('start'), true), sync: () => calls.push('sync'), settle: () => calls.push('settle'), stop: () => calls.push('stop') };
let now = 0; cs._setClock(() => now);
cs.play({ muted: true }); assert.equal(cs.scored(), false); cs.seek(10); cs.skip(); cs.close();
assert.deepEqual(calls, [], 'a muted run never touches the score');
cs.play({ muted: false }); assert.equal(cs.scored(), true); cs.seek(20); cs.skip(); now += 700; cs.proceed();
assert.deepEqual(calls, ['start', 'sync', 'settle', 'stop']); assert.equal(cs.scored(), false);
cs.play({ muted: false }); cs.close(); cs.close();
assert.deepEqual(calls.slice(4), ['start', 'stop'], 'close mid-film stops the score once');
delete globalThis.__l4Score;

assert(!/localStorage|sessionStorage|indexedDB|\.cookie/.test(src), 'no storage access');
console.log(JSON.stringify({ pass: true, bars: S.bars, l4: b4, l3: b3, l1: b1, l2: b2 }));
