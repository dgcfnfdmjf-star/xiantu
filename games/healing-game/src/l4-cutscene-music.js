/* l4-cutscene-music.js: 「晨铃圆舞曲」, the original score for the level-4 clear cutscene.
 * A morning waltz in D major (the key of the level's six chimes: D5 E5 F#5 A5 B5 D6), 3/4, one beat = 0.9 s - the
 * film's own strike grid - so a bar is 2.7 s and the film is 18 bars and a last held chord. In the manner of a
 * hand-drawn film score: a solo felt-piano tune over warm sustained strings, and the celesta for the wind chimes.
 * No samples and no quoted melody; every note below was written for this scene.
 * Bars follow the picture: 0-10.8 s before dawn (low strings, the piano only tries three notes), 10.8-21.6 s the
 * chimes wake (the tune, piano alone over a waltz left hand, one celesta note as each chime is first struck),
 * 21.6-32.4 s notes and petals lift (flowing eighths, the tune a sixth higher, strings in), 32.4-43.2 s the song goes
 * out over the cloud sea (the tune doubled an octave down on each downbeat over the fullest strings, top note at 37.8 s, then the dominant),
 * 43.2 s on the title (home on D: the first two bars of the tune as an echo, a plagal bar, the last chord).
 * The celesta plays exactly what the picture shows: every strike in the film's table (layout().strikes) is one
 * celesta note at that chime's own pitch an octave up - the six waking notes, the level's last song 把早安送回家
 * (D A F# D) three times, and the soft six-note roll when all six ring together.
 * Sparkle voice: the level-3 score's celesta() (window.__l3Score.celesta), reused as is; without it the game's
 * music box. The harp is not used in this score at all.
 * Same engine and same playing rules as l3-cutscene-music.js (kept separate so that file stays byte-identical):
 * music-lush voices through a registered GardenAudio track, so the music switch, the volume slider and the
 * bus/reverb apply unchanged, and the level's own track (晨风来信) is handed back on stop().
 * Plain ES5. Exposes window.__l4Score. Never touches a save. */
(function (window) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit, M = window.__music2, V = M && M.voices;
  if (!K || !V || !V.felt || !V.padTone || !M.register) return;

  var BEAT = 0.9, STEPS = 6, SD = BEAT / 2, BAR = 3 * BEAT, BARS = 19, TOTAL = BARS * STEPS, FILM = 50;
  var WAKE_AT = 4 * BAR, LIFT_AT = 8 * BAR, SWELL_AT = 12 * BAR, SETTLE_AT = 16 * BAR;
  var NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  // "Bb4", "F#5", "A4"
  function midi(n) {
    var acc = n.charAt(1) === '#' ? 1 : n.charAt(1) === 'b' ? -1 : 0, oct = +n.charAt(acc ? 2 : 1);
    return 12 * (oct + 1) + NAMES[n.charAt(0)] + acc;
  }
  // "D5:4 B4:2" -> [[step, midi, steps]], "-" is a rest
  function line(text) {
    var out = [], at = 0, parts = text ? text.split(' ') : [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].split(':'), len = +p[1];
      if (p[0] !== '-') out.push([at, midi(p[0]), len]);
      at += len;
    }
    return out;
  }
  function notes(text) { return text.split(' ').map(midi); }

  /* ------------------------------ Score ----------------------------- */
  // kind: p = before dawn (strings, a bare left hand), w = waltz left hand, a = flowing eighths, c = coda
  var SCORE = [];
  function bar(kind, dyn, bass, chord, mel, strings, double) {
    SCORE.push({ kind: kind, dyn: dyn, bass: midi(bass), chord: notes(chord), mel: line(mel), strings: strings || 0, double: !!double, roll: false });
  }
  // 0-10.8 s: before dawn. Low strings hold; the piano tries the first three notes of the tune and waits.
  bar('p', 0.74, 'D2', 'A3 D4 E4', '', 0.042);
  bar('p', 0.76, 'D2', 'G3 B3 D4', '-:2 A4:2 D5:2', 0.044);
  bar('p', 0.8, 'B2', 'A3 D4 F#4', 'E5:6', 0.046);
  bar('p', 0.84, 'A2', 'G3 D4 E4', '-:2 F#5:2 E5:2', 0.046);
  // 10.8-21.6 s: the chimes wake one by one. The tune, solo piano, over a waltz left hand; strings slip back in halfway.
  bar('w', 0.92, 'D2', 'A3 D4 F#4', 'F#5:3 E5:1 D5:2');
  bar('w', 0.92, 'C#3', 'A3 C#4 E4', 'E5:4 A4:2');
  bar('w', 0.95, 'B2', 'A3 D4 F#4', 'D5:3 E5:1 F#5:2', 0.036);
  bar('w', 0.96, 'G2', 'G3 B3 D4', 'G5:3 F#5:1 E5:2', 0.04);
  // 21.6-32.4 s: notes and petals lift on the wind. Flowing eighths in the left hand, the tune a sixth higher.
  bar('a', 1.02, 'D2', 'A3 D4 F#4', 'A5:2 F#5:1 A5:1 D6:2', 0.052);
  bar('a', 1.03, 'B2', 'F#3 A3 D4', 'B5:3 A5:1 F#5:2', 0.054);
  bar('a', 1.04, 'G2', 'G3 B3 D4', 'G5:2 A5:1 B5:1 A5:2', 0.056);
  bar('a', 1.06, 'F#2', 'A3 D4 F#4', 'D6:3 A5:1 F#5:2', 0.058);
  // 32.4-43.2 s: the song goes out over the cloud sea. IV - V - vi under the tune in octaves, top note at 37.8 s
  // (the last time the chimes play the song), then a suspended dominant.
  bar('a', 1.1, 'G2', 'G3 B3 D4', 'B5:2 D6:2 E6:2', 0.064, true);
  bar('a', 1.14, 'A2', 'A3 C#4 E4', 'C#6:3 E6:1 G6:2', 0.068, true);
  bar('a', 1.18, 'B2', 'A3 D4 F#4', 'A6:3 F#6:1 D6:2', 0.07, true);
  bar('a', 1, 'A2', 'G3 B3 D4', 'B5:3 D6:1 E6:2', 0.056);
  // 43.2 s on: the title. Home on D: the first two bars of the tune as an echo (over I, then IV), one last chord.
  bar('c', 0.62, 'D2', 'A3 D4 F#4', 'F#5:3 E5:1 D5:2', 0.044);
  bar('c', 0.54, 'D2', 'G3 B3 D4', 'E5:4 A4:2', 0.04);
  bar('c', 0.46, 'D2', 'A3 D4 F#4', 'D5:6', 0.03);

  /* Celesta notes on the film clock, one per chime strike in the picture (the same table as l4-cutscene.js
   * layout().strikes; the unit test compares them): c = chime 0..5, pitched like the game's chimes, an octave up. */
  var PITCH = [74, 76, 78, 81, 83, 86], SONG = [0, 3, 2, 5], PHRASES = [21.6, 29.7, 37.8], SPARKS = [];
  (function () {
    var i, k;
    function ring(at, c, v) { SPARKS.push({ at: +at.toFixed(3), c: c, m: PITCH[c] + 12, v: v }); }
    for (i = 0; i < 6; i++) ring(11.7 + i * 2 * BEAT, i, 0.066);                 // waking, one every two beats
    for (k = 0; k < PHRASES.length; k++) {
      for (i = 0; i < SONG.length; i++) ring(PHRASES[k] + i * BEAT, SONG[i], 0.062); // 把早安送回家
      for (i = 0; i < 6; i++) ring(PHRASES[k] + 5 * BEAT + i * 0.07, i, 0.04 - i * 0.002); // all six, a soft roll
    }
    for (i = 0; i < 6; i++) ring(45.9 + i * 0.07, i, 0.034 - i * 0.002);          // once more under the title
    for (k = 0; k < PHRASES.length; k++) SCORE[Math.round((PHRASES[k] + 3 * BEAT) / BAR)].roll = true; // the bar whose third beat is the roll
  })();
  var shared = window.__l3Score && window.__l3Score.celesta;
  function sparkle(t, m, v, out) {
    if (shared) shared(t, m, v, out);
    else if (K.musicBox) K.musicBox(t, m, v, out);
  }

  /* ----------------------------- Playing ---------------------------- */
  var def, cur = null, gen = null, origin = null, active = false, free = false, held = false, prev = -1, played = 0, lastStep = -1;
  function scene() { return window.__l4Cutscene || null; }
  function output(p) {
    if (!gen) gen = K.gain(1, V.bus(p, 3600));
    return gen;
  }
  // Fade whatever is ringing (pads, tails, notes already queued) and start a fresh group.
  function duck(fade) {
    var ctx = GA.context(), g = gen;
    gen = null;
    if (!ctx || !g) return;
    var now = ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0.0001, now + fade);
    setTimeout(function () { g.disconnect(); }, (fade + 0.3) * 1000);
  }
  function strings(t, b, out) {
    if (!b.strings) return;
    // Short releases: each bar's chord overlaps the next by a beat, which keeps the voice count phone-safe.
    for (var i = 0; i < b.chord.length; i++) V.padTone('warm', t + i * 0.05, b.chord[i], b.strings, BAR, 0.7, 0.9, out);
    V.padTone('warm', t, b.bass + 12, b.strings * 1.1, BAR, 0.6, 0.9, out);
  }
  function playStep(k, t, p) {
    var b = SCORE[Math.floor(k / STEPS)], s = k % STEPS, out = output(p), d = b.dyn, i;
    // Tune first: if the phone is busy the engine drops later voices, never the melody.
    for (i = 0; i < b.mel.length; i++) {
      if (b.mel[i][0] !== s) continue;
      var m = b.mel[i][1];
      V.felt(t + K.rnd(0, 0.012), m, (s === 0 ? 0.25 : s % 2 === 0 ? 0.215 : 0.19) * d, out);
      // The tune in octaves, the lower one soft and only on the downbeat (long tails: keeps the phone's voice count down).
      if (b.double && s === 0) V.felt(t + 0.015, m - 12, 0.11 * d, out);
    }
    if (s === 0) strings(t, b, out);
    if (b.kind === 'w') {
      // Waltz: bass on one, two chord notes together on two, the top one alone on three.
      if (s === 0) V.felt(t, b.bass + 12, 0.13 * d, out);
      if (s === 2) { V.felt(t + K.rnd(0.004, 0.012), b.chord[0], 0.06 * d, out); V.felt(t + 0.02, b.chord[1], 0.055 * d, out); }
      if (s === 4) V.felt(t + K.rnd(0.004, 0.014), b.chord[2], 0.05 * d, out);
    } else if (b.kind === 'a') {
      // Flowing eighths: bass, then the chord up and back; the bar's last eighth is left to the tune. Where all six
      // chimes ring together on the third beat the left hand lifts after the second, so the chimes have the air.
      if (s === 0) V.felt(t, b.bass + 12, 0.125 * d, out);
      else if (s < (b.roll ? 3 : 5)) V.felt(t + K.rnd(0.003, 0.012), b.chord[s === 1 ? 0 : s === 2 ? 1 : s === 3 ? 2 : 1], (s === 2 ? 0.07 : 0.055) * d, out);
    } else if (b.kind === 'p') {
      if (s === 0) V.felt(t, b.bass + 12, 0.08 * d, out);
      if (s === 4) V.felt(t + 0.01, b.chord[1], 0.045 * d, out);
    } else if (s === 0) {
      V.felt(t, b.bass + 12, 0.1 * d, out); V.felt(t + 0.03, b.chord[0], 0.06 * d, out); V.felt(t + 0.06, b.chord[1], 0.055 * d, out);
    }
    for (i = 0; i < SPARKS.length; i++) {
      var at = SPARKS[i].at - k * SD;
      if (at >= -1e-6 && at < SD - 1e-6) sparkle(t + Math.max(0, at), SPARKS[i].m, SPARKS[i].v, out);
    }
    played++; lastStep = k;
  }
  def = { id: 'l4waltz', name: '晨铃圆舞曲', key: 62, bpm: 60 / SD / 4, swing: 0, delay: 0.1, level: 1.3, prog: [[0, 'maj']], mel: ['........'],
    play: function (t, s, barIndex, ch, sd, p) {
      var ctx = GA.context(), now = ctx.currentTime, cs = scene(), state = active && cs ? cs.state() : '';
      if (p !== cur) { cur = p; gen = null; origin = null; }
      if (state === 'paused') { if (!held) { held = true; duck(0.4); } return; }
      if (held) { held = false; origin = null; }
      if (state === 'playing' && !free) {
        // Follow the cutscene clock; a jump (seek, stalled tab) re-anchors instead of chasing.
        var want = cs.time();
        if (origin === null || Math.abs(now - origin - want) > 0.4) { duck(0.3); origin = now - want; }
      } else if (origin === null) origin = t;
      var k = Math.ceil((t - origin) / SD - 1e-6), at = origin + k * SD;
      if (k < 0 || (active && k >= TOTAL)) return;
      playStep(k % TOTAL, at, p);
    } };
  M.register(def);

  function indexOfCurrent() {
    var names = GA.trackNames(), name = GA.currentTrackName();
    for (var i = 0; i < names.length; i++) if (names[i] === name) return i;
    return -1;
  }
  window.__l4Score = {
    id: def.id, bars: BARS, barSeconds: BAR, beatSeconds: BEAT, stepSeconds: SD, duration: FILM, wakeAt: WAKE_AT, liftAt: LIFT_AT, swellAt: SWELL_AT, settleAt: SETTLE_AT,
    // Called from a user gesture (the tap on the last chime of the third song, or the first tap of the preview).
    start: function () {
      var at = indexOfCurrent();
      if (!active) prev = at === def.index ? -1 : at;
      active = true; free = false; held = false; origin = null;
      duck(0.3);
      GA.setTrack(def.index, 1.2);
      GA.unlock(); GA.startMusic(); // no-op while the player's music switch is off
      return true;
    },
    // seek(): the next tick re-anchors on the cutscene clock.
    sync: function () { if (!active) return false; free = false; origin = null; duck(0.25); return true; },
    // skip(): let the running phrase fade, then play the closing bars (the echo of the tune, the last soft roll of all six chimes, the final chord).
    settle: function () {
      var ctx = GA.context();
      if (!active || !ctx) return false;
      duck(1.4);
      free = true; origin = ctx.currentTime + 0.5 - SETTLE_AT;
      return true;
    },
    // Hand the level's own music back with a slow crossfade.
    stop: function () {
      if (!active) return false;
      active = false; free = false; held = false;
      if (prev >= 0 && indexOfCurrent() === def.index) GA.setTrack(prev, 3);
      prev = -1;
      return true;
    },
    state: function () {
      var ctx = GA.context();
      return { active: active, free: free, current: indexOfCurrent() === def.index, steps: played, lastStep: lastStep,
        position: ctx && origin !== null ? +(ctx.currentTime - origin).toFixed(2) : null, musicOn: GA.isMusicOn(), track: GA.currentTrackName() };
    },
    // Offline listening/tests: the score as plain data.
    score: function () { return SCORE.map(function (b) { return { kind: b.kind, dyn: b.dyn, strings: b.strings, bass: b.bass, chord: b.chord.slice(), double: b.double, roll: b.roll, mel: b.mel.map(function (n) { return n.slice(); }) }; }); },
    // 'celesta' = the level-3 score's celesta() voice; 'musicBox' only if that score is missing. Never the harp.
    sparkleVoice: shared ? 'celesta' : 'musicBox', celesta: sparkle,
    sparkles: function () { return SPARKS.map(function (g) { return { at: g.at, c: g.c, m: g.m, v: g.v }; }); }
  };
})(window);
