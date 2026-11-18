'use strict';

// Level-5 cutscene score on a fake engine (no browser): node games/healing-game/tests/l5-cutscene-music.cjs
// The score table (Bb major, 4/4 andante, one beat = 0.75 s, the grid the film's cues sit on), its sync with the picture
// (celesta on each lotus opening, dew landing, chorus), the voice budget (measured against the level-1..4 scores on the
// same fake engine), and start / seek / pause / skip / stop with the level track (月汐摇光) handed back. Sparkles are the
// level-3 celesta, never the harp.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.resolve(__dirname, '../src', f), 'utf8');
const cs = require(path.resolve(__dirname, '../src/l5-cutscene.js'));

// One fake GardenAudio + music2 + music-lush voice set; every voice call is logged as [voice, time, midi, level].
// files: scripts loaded in order into the same window (the level-5 score borrows the level-3 score's celesta()).
function engine(files, cutsceneName, kit) {
  const log = [], ducks = [], tracks = [{ name: '花园晨曲' }, { name: '月汐摇光' }];
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
const L5 = ['l3-cutscene-music.js', 'l5-cutscene-music.js'];
const l5 = engine(L5, '__l5Cutscene'), S = l5.window.__l5Score;
assert(S, 'score registers on the engine');
assert.equal(S.id, 'l5lullaby'); assert.equal(l5.def.name, '月汐晚安'); assert.equal(l5.def.key, 58, 'Bb major');
const BEAT = 0.75, BAR = 3, SD = 0.375;
assert.equal(S.beatSeconds, BEAT); assert(Math.abs(S.barSeconds - BAR) < 1e-9, '4/4: a bar is four beats'); assert.equal(S.stepSeconds, SD);
assert(Math.abs(60 / S.beatSeconds - 80) < 1e-9, '80 bpm, andante');
assert.equal(S.duration, cs.duration(), 'score is as long as the film');
assert(S.bars * S.barSeconds >= cs.duration() && (S.bars - 1) * S.barSeconds < cs.duration(), 'the last bar is the held chord under the end of the film');
const beats = Object.fromEntries(cs.beats().map(b => [b.id, b]));
const near = (a, b, d) => Math.abs(a - b) <= d;
const lay = cs.layout();
assert(near(S.bloomAt, beats.lotus.t0, 1) && near(S.pathAt, beats.path.t0, 1e-9) && near(S.settleAt, beats.title.t0, 1.5), 'sections follow the picture: ' + [S.bloomAt, S.pathAt, S.swellAt, S.settleAt]);
assert(near(S.swellAt, lay.chorus[0], 1) && S.swellAt <= lay.boatT0, 'the swell starts with the first chorus, before the boat leaves');
[S.bloomAt, S.pathAt, S.swellAt, S.settleAt].forEach(t => assert(near(t / BAR, Math.round(t / BAR), 1e-9), 'sections start on a barline'));
const score = JSON.parse(JSON.stringify(S.score()));
assert.equal(score.length, 17);
const pc = m => ((m % 12) + 12) % 12, BB_MAJOR = [10, 0, 2, 3, 5, 7, 9];
score.forEach((b, i) => {
  assert(b.mel.reduce((n, x) => Math.max(n, x[0] + x[2]), 0) <= 8, 'bar ' + i + ' fits four beats');
  b.mel.forEach(n => assert(n[1] >= 65 && n[1] <= 89, 'tune stays in the piano\'s singing range'));
  [b.bass].concat(b.chord, b.mel.map(n => n[1])).forEach(m => assert(Number.isInteger(m) && m >= 36 && BB_MAJOR.includes(pc(m)), 'bar ' + i + ' is diatonic Bb major: ' + m));
  assert.equal(b.chord.length, 3);
  // Every downbeat note of the tune is a chord tone or the bass (or the Eb-major-seventh colour of the goodnight bar).
  b.mel.filter(n => n[0] === 0).forEach(n => assert([b.bass].concat(b.chord).map(pc).includes(pc(n[1])) || (i === 15 && pc(n[1]) === 2), 'bar ' + i + ' downbeat is consonant'));
});
const tuneBars = score.filter(b => b.mel.length);
assert(tuneBars.filter(b => b.mel[0][0] === 0).length >= tuneBars.length - 1, 'the tune sings from the downbeat');
const allNotes = score.flatMap(b => b.mel);
assert(allNotes.filter(n => n[0] % 2 === 0).length / allNotes.length >= 0.7, 'a calm tune: mostly on the beat');
assert(allNotes.every(n => n[2] >= 1) && allNotes.filter(n => n[2] === 1).length <= 8, 'few short notes (andante)');
const at = (b0, b1) => score.slice(b0, b1);
const peak = bars => Math.max(...bars.map(b => b.dyn)), str = bars => Math.max(...bars.map(b => b.strings));
assert(peak(at(10, 15)) > peak(at(7, 10)) && peak(at(7, 10)) > peak(at(3, 7)) && peak(at(3, 7)) > peak(at(0, 3)) && peak(at(0, 3)) > peak(at(15, 17)), 'dynamic arc: quiet bay, lotuses, path, warm swell, soft goodnight');
assert(str(at(10, 15)) > str(at(0, 10)) && str(at(10, 15)) > str(at(15, 17)), 'warm strings swell as the boat glides home');
assert(score.every(b => b.strings > 0), 'strings hold under everything');
assert(at(10, 14).every(b => b.double) && at(0, 10).concat(at(14, 17)).every(b => !b.double), 'the tune is in octaves only in the swell');
const mean = bars => { const m = bars.flatMap(b => b.mel.map(n => n[1])); return m.reduce((a, b) => a + b, 0) / m.length; };
assert(mean(at(7, 10)) - mean(at(3, 7)) >= 2 && mean(at(10, 14)) > mean(at(7, 10)), 'the register lifts with the path and the boat');
const top = Math.max(...allNotes.map(n => n[1]));
assert(score[13].mel[0][1] === top && score[13].dyn === peak(score), 'top note at 39 s, as the boat passes the last lotus');
assert.equal(pc(score[14].bass), 5, 'dominant before the title');
assert(pc(score[16].bass) === 10 && pc(score[16].mel[score[16].mel.length - 1][1]) === 10, 'resolves home on Bb at the title');
assert.equal(JSON.stringify(score[15].mel), JSON.stringify(score[3].mel), 'the goodnight echoes the first bar of the tune');
// Not the keys of the level-3 (F major) or level-4 (D major) films.
assert.notEqual(l5.def.key % 12, 5); assert.notEqual(l5.def.key % 12, 2);

/* ---- celesta: exactly what the picture shows ---- */
const sp = Array.from(S.sparkles()), PITCH = [82, 84, 86, 89, 91, 94];
assert.deepEqual(lay.chorus, [30.75, 40.5]);
// Lotus openings: one note per flower at its pulse peak, which is on a beat of the score.
const opens = sp.filter(g => g.kind === 'lotus');
assert.equal(opens.length, 6);
opens.forEach((g, i) => {
  const L = cs.lotus(i, g.at), wake = lay.lotusT + i * lay.lotusStep;
  assert(near(g.at, wake + 1.2, 1e-6) && L.pulse > 0.99 && cs.lotus(i, g.at - 0.4).pulse < L.pulse && cs.lotus(i, g.at + 0.4).pulse < L.pulse, 'lotus ' + i + ' rings at its pulse peak');
  assert(near(g.at / BEAT, Math.round(g.at / BEAT), 1e-6), 'lotus ' + i + ' opens on a beat: ' + g.at);
  assert(L.open > 0.2 && L.open < 1, 'the flower is visibly opening');
  assert.equal(g.c, i); assert.equal(g.m, PITCH[i]);
});
// Dew: one note per landing moment (beads landing together ring once), on eighth notes, in the bead's flower's note.
const lands = lay.dewLand, dews = sp.filter(g => g.kind === 'dew');
assert.equal(lands.length, 24);
assert.deepEqual(dews.map(g => g.at), [...new Set(lands)].sort((a, b) => a - b), 'a dew note for every landing');
lands.forEach((tl, j) => {
  assert(near(tl / SD, Math.round(tl / SD), 1e-9), 'dew lands on an eighth');
  assert(cs.dew(j, tl).settled > 0.999 && cs.dew(j, tl - 0.3).settled < 0.999, 'dew ' + j + ' lands at ' + tl);
});
dews.forEach(g => { const j = lands.indexOf(g.at); assert.equal(g.c, j % 6); assert.equal(g.m, PITCH[j % 6]); });
// Chorus: all six in a soft roll exactly when the picture's chorus peaks; each roll starts on a beat.
const ch = sp.filter(g => g.kind === 'chorus');
assert.equal(ch.length, 12);
lay.chorus.forEach(c0 => { assert(near(c0 / BEAT, Math.round(c0 / BEAT), 1e-9)); for (let i = 0; i < 6; i++) { const g = ch.find(x => near(x.at, c0 + 0.12 * i, 1e-6) && x.c === i); assert(g && cs.lotus(i, g.at).chorus > 0.99, 'chorus ' + c0 + ' lotus ' + i); } });
assert(near(lay.boatT0 / BEAT, Math.round(lay.boatT0 / BEAT), 1e-9), 'the boat slips out on a beat');
assert.equal(sp.filter(g => g.kind === 'title').length, 1);
sp.forEach(g => { assert([10, 0, 2, 5, 7].includes(pc(g.m)), 'Bb pentatonic'); assert(g.v > 0.02 && g.v <= 0.07, 'soft'); assert(g.at < cs.duration()); });
assert.equal(S.sparkleVoice, 'celesta');
{
  const log = [], e = engine(L5, '__l5Cutscene', fullKit([]));
  Object.assign(e.window.GardenAudio.kit, fullKit(log));
  assert.equal(e.window.__l5Score.sparkleVoice, 'celesta');
  e.window.__l5Score.celesta(5, 94, 0.05, {});
  assert.deepEqual(log.map(n => [n[0], n[3]]), [['osc', 'sine'], ['osc', 'sine'], ['osc', 'sine']], 'celesta = fundamental + octave + strike');
  assert.equal(log[0][2], 1865, 'Bb6');
  const alone = engine('l5-cutscene-music.js', '__l5Cutscene', fullKit(log)); log.length = 0;
  assert.equal(alone.window.__l5Score.sparkleVoice, 'musicBox'); alone.window.__l5Score.celesta(5, 94, 0.05, {});
  assert.deepEqual(log.map(n => n[0]), ['musicBox']); assert.equal(alone.log.length, 0, 'no harp stand-in');
}
const src = read('l5-cutscene-music.js');
assert(!/V\.harp|K\.harp|voices\.harp/.test(src), 'the score never calls the harp');

/* ---- original: not the other four cutscene tunes ---- */
const l1 = engine('l1-cutscene-music.js', '__l1Cutscene'), S1 = l1.window.__l1Score;
const l2 = engine('l2-cutscene-music.js', '__l2Cutscene'), S2 = l2.window.__l2Score;
const l3 = engine('l3-cutscene-music.js', '__l3Cutscene'), S3 = l3.window.__l3Score;
const l4 = engine(['l3-cutscene-music.js', 'l4-cutscene-music.js'], '__l4Cutscene'), S4 = l4.window.__l4Score;
const ivs = sc => sc.flatMap(b => b.mel.map(n => n[1])).map((m, i, a) => i ? m - a[i - 1] : 0).slice(1);
// 6-note phrases (5 intervals): stricter than the level-4 test's 8-note check.
const grams = sc => { const v = ivs(sc), set = new Set(); for (let i = 0; i + 5 <= v.length; i++) set.add(v.slice(i, i + 5).join(',')); return set; };
const others = new Set([...grams(S1.score()), ...grams(S2.score()), ...grams(S3.score()), ...grams(S4.score())]), mine = ivs(score);
for (let i = 0; i + 5 <= mine.length; i++) assert(!others.has(mine.slice(i, i + 5).join(',')), 'shares a 6-note phrase with another score at note ' + i);
const rhythm = sc => sc.flatMap(b => b.mel.map(n => n[0] + ':' + n[2])).join(' ');
[S1, S2, S3, S4].forEach(o => assert.notEqual(rhythm(score), rhythm(o.score())));
assert.equal(new Set([l1.def.id, l2.def.id, l3.def.id, l4.def.id, l5.def.id]).size, 5); assert.equal(new Set([l1.def.name, l2.def.name, l3.def.name, l4.def.name, l5.def.name]).size, 5);

/* ---- voice budget: a whole free run of each score on the same engine ---- */
function freeRun(e, steps, sd) { for (let k = 0; k < steps; k++) e.tick(200 + k * sd); return e.log.splice(0); }
function budget(log) {
  let shots = 0, pads = 0;
  for (let t = 200; t < 262; t += 0.15) {
    const w = log.filter(n => n[1] >= t - 1e-6 && n[1] < t + 2 - 1e-6);
    shots = Math.max(shots, w.filter(n => n[0] !== 'pad').length); pads = Math.max(pads, w.filter(n => n[0] === 'pad').length);
  }
  const lv = log.filter(n => n[0] !== 'osc');
  return { shots, pads, total: log.length, loud: Math.max(...lv.map(n => n[3])) };
}
const b5 = budget(freeRun(l5, 136, SD)), b4 = budget(freeRun(l4, 114, 0.45)), b3 = budget(freeRun(l3, 150, 1 / 3)), b1 = budget(freeRun(l1, 150, 1 / 3)), b2 = budget(freeRun(l2, 180, 1 / 3));
assert(b5.shots <= Math.max(b4.shots, b3.shots) && b5.pads <= Math.max(b4.pads, b3.pads), 'no denser than the level-3/4 scores: ' + JSON.stringify([b5, b4, b3, b1, b2]));
assert(b5.shots <= 20 && b5.pads <= 4, 'phone-safe voice count: ' + JSON.stringify(b5));
assert(b5.loud <= b4.loud + 0.005 && b5.loud <= b3.loud + 0.005, 'no louder than the other scores: ' + JSON.stringify([b5.loud, b4.loud, b3.loud]));
{
  const log = [], e = engine(L5, '__l5Cutscene', fullKit(log));
  for (let k = 0; k < 136; k++) e.tick(200 + k * SD);
  assert.equal(log.length, sp.length * 3, 'three partials a sparkle, every sparkle once');
  let most = 0; for (let t = 200; t < 252; t += 0.05) most = Math.max(most, log.filter(n => n[1] >= t && n[1] < t + 0.5).length);
  assert(most <= 18, 'celesta partials in half a second: ' + most);
  assert.equal(e.log.filter(n => n[0] === 'harp').length, 0, 'no harp anywhere in the film');
  assert.deepEqual(log.filter((n, i) => i % 3 === 0).map(n => +(n[1] - 200).toFixed(3)), sp.map(g => g.at), 'each sparkle at its film time');
}

/* ---- start / follow the clock / seek / pause / skip / stop ---- */
const e = engine(L5, '__l5Cutscene'), sc = e.window.__l5Score;
assert.equal(sc.stop(), false); assert.equal(sc.sync(), false); assert.equal(sc.settle(), false, 'nothing to do before start');
assert.equal(e.state.setTrack.length, 0, 'loading the score does not change the track');
assert.equal(sc.start(), true);
assert.deepEqual(e.state.setTrack, [[e.def.index, 1.2]], 'takes the music bus (月汐摇光 fades out)');
assert.equal(e.state.started, 1); assert.equal(sc.state().active, true); assert.equal(sc.state().track, '月汐晚安');
assert.equal(e.window.__l3Score.state().active, false, 'the level-3 score is only lent its celesta');
// playing: steps land on the film clock (film t = audio time - 300)
e.scene.s = 'playing';
const film = t => { e.scene.t = t - 0.1; return 300 + t; };
for (let k = 0; k < 12; k++) e.tick(film(k * SD));
assert.equal(sc.state().lastStep, 11);
assert(e.log.every(n => n[1] >= 300 - 1e-6 && n[1] < 305.5), 'notes on the film clock');
assert(e.log.filter(n => n[0] === 'pad').length === 8 && e.log.filter(n => n[0] === 'felt').length <= 7 && !e.log.some(n => n[0] === 'harp'), 'opens on low strings, the piano only touched');
// the lotus bars: lullaby left hand = bass on one, then the chord rocking up on two, three and four
e.log.length = 0; sc.sync();
for (let k = 0; k < 8; k++) e.tick(film(9 + k * SD));
const lh = e.log.filter(n => n[0] === 'felt' && n[2] < 69).map(n => [Math.round((n[1] - 309) / BEAT), n[2]]);
assert.deepEqual(lh.map(n => n[0]), [0, 1, 2, 3], 'lullaby: ' + JSON.stringify(lh)); assert.equal(lh[0][1], 58, 'bass Bb on one');
assert(e.log.filter(n => n[0] === 'pad').every(n => n[3] <= 0.04 * 1.1), 'strings stay low under the tune');
// seek to the swell: one duck, then the swell bar starts exactly at 30 s of film time
e.log.length = 0; e.ducks.length = 0;
assert.equal(sc.sync(), true);
for (let k = 0; k < 8; k++) e.tick(film(30 + k * SD));
assert.equal(sc.state().lastStep, 10 * 8 + 7);
assert(e.ducks.length >= 1 && e.ducks.every(d => d <= 0.31), 'seek fades what was ringing instead of cutting or stacking');
assert(Math.abs(Math.min(...e.log.map(n => n[1])) - 330) < 0.02, 'swell downbeat at 30 s');
assert(e.log.filter(n => n[0] === 'pad').length === 4 && e.log.filter(n => n[0] === 'felt' && Math.abs(n[1] - 330) < 0.03).length >= 3, 'full strings + the tune in octaves');
// a stalled tab (clock jumps 3 s) re-anchors instead of chasing with a burst of late notes
e.log.length = 0;
e.tick(film(36.75));
assert.equal(sc.state().lastStep, 98); assert(e.log.every(n => n[1] >= 336.75 - 1e-6));
// pause: silence (one fade), nothing scheduled; resume picks the clock up again
e.scene.s = 'paused'; e.log.length = 0; e.ducks.length = 0;
for (let k = 1; k < 5; k++) e.tick(film(36.75) + k * SD);
assert.equal(e.log.length, 0); assert.equal(e.ducks.length, 1, 'one fade on pause');
e.scene.s = 'playing';
for (let k = 0; k < 3; k++) { e.ctx.currentTime = 400 + k * SD; e.scene.t = 37.1 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
assert(e.log.length > 0 && Math.abs(sc.state().position - e.scene.t) < 0.05, 'resumes on the clock');
// skip: the film is at its end; the score fades and plays only the closing bars, then stays silent
e.scene.s = 'ended'; e.scene.t = 50; e.log.length = 0; e.ducks.length = 0; e.ctx.currentTime = 399.6;
assert.equal(sc.settle(), true); assert.equal(sc.state().free, true);
assert.deepEqual(e.ducks, [1.4]);
for (let k = 0; k < 30; k++) { e.ctx.currentTime = 400 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
const steps = sc.state().steps;
assert.equal(sc.state().lastStep, 135, 'the closing reaches the last eighth');
assert(e.log.length > 0 && e.log.length <= 40, 'only the two goodnight bars: ' + e.log.length);
assert(e.log.filter(n => n[0] === 'felt' && n[2] >= 69).length >= 5 && pc(e.log.filter(n => n[0] === 'felt').pop()[2]) === 10, 'the tune\'s echo, ending on Bb');
assert(e.log.every(n => n[1] >= 400.1 - 1e-6) && Math.abs(Math.min(...e.log.map(n => n[1])) - 400.1) < 0.02, 'the goodnight starts 0.5 s after skip, on its downbeat');
for (let k = 30; k < 50; k++) { e.ctx.currentTime = 400 + k * SD; e.def.play(400.1 + k * SD, 0, 0, null, SD, e.tick); }
assert.equal(sc.state().steps, steps, 'silent after the last bar while the end card waits');
// stop: the level's own track comes back with a slow crossfade; a second stop is a no-op
assert.equal(sc.stop(), true);
assert.deepEqual(e.state.setTrack[e.state.setTrack.length - 1], [1, 3], 'level track restored');
assert.equal(sc.state().active, false); assert.equal(sc.state().track, '月汐摇光');
assert.equal(sc.stop(), false); assert.equal(e.state.setTrack.length, 2);
// If the player picked another track meanwhile, stop() leaves their choice alone.
sc.start(); e.state.track = 0; const n = e.state.setTrack.length; sc.stop();
assert.equal(e.state.setTrack.length, n); assert.equal(e.state.track, 0);
// Music switch off: start() still marks the film as scored, but the engine never ticks, so nothing sounds; stop() hands back as usual.
{
  const q = engine(L5, '__l5Cutscene'); q.state.musicOn = false;
  assert.equal(q.window.__l5Score.start(), true); assert.equal(q.window.__l5Score.state().musicOn, false); assert.equal(q.log.length, 0);
  assert.equal(q.window.__l5Score.stop(), true); assert.equal(q.window.__l5Score.state().track, '月汐摇光');
}

/* ---- cutscene wiring: play starts it, mute skips it, seek/skip/close reach it ---- */
const calls = [];
globalThis.__l5Score = { start: () => (calls.push('start'), true), sync: () => calls.push('sync'), settle: () => calls.push('settle'), stop: () => calls.push('stop') };
let now = 0; cs._setClock(() => now);
cs.play({ muted: true }); assert.equal(cs.scored(), false); cs.seek(10); cs.skip(); cs.close();
assert.deepEqual(calls, [], 'a muted run never touches the score');
cs.play({ muted: false }); assert.equal(cs.scored(), true); cs.seek(20); cs.skip(); now += 700; cs.proceed();
assert.deepEqual(calls, ['start', 'sync', 'settle', 'stop']); assert.equal(cs.scored(), false);
cs.play({ muted: false }); cs.close(); cs.close();
assert.deepEqual(calls.slice(4), ['start', 'stop'], 'close mid-film stops the score once');
delete globalThis.__l5Score;

assert(!/localStorage|sessionStorage|indexedDB|\.cookie/.test(src), 'no storage access');
console.log(JSON.stringify({ pass: true, bars: S.bars, sparkles: sp.length, l5: b5, l4: b4, l3: b3, l1: b1, l2: b2 }));
