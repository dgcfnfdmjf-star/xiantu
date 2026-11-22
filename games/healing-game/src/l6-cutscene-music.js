/* l6-cutscene-music.js: 「雪窗归途」, the original score for the level-6 clear cutscene 「雪灯归林」.
 * A slow snowy-night waltz in Ab major, 3/4, one beat = 0.5 s (120 bpm, felt in one: a bar is 1.5 s), so the film is
 * 34 bars (51 s, the last a held chord under the end of the picture). The film's cues sit on this grid (l6-cutscene.js):
 * each snow lantern lights on a barline (10.5, 12 ... 18 s: bars 7-12), the kittens set off on barlines (21-25.5 s,
 * bars 14-17) and arrive on beats (24, 26, 28, 30 s), the window starts to swell on a beat (22 s), the title on a
 * barline (43.5 s, bar 29). The 80 bpm grid of the picture is the same clock: one bar here = two of its beats.
 * In the manner of a hand-drawn film score: a felt-piano tune over a gentle waltz left hand and warm sustained
 * strings, and the celesta for the falling snow, the lanterns, the kittens coming home and the window. No samples and
 * no quoted melody; every note was written for this scene, and it shares no phrase with the level-1..5 scores (the
 * unit test checks).
 * Form: 0-10.5 s snow (low strings, a few piano notes, single snowflake bells), 10.5-21 s the lanterns (A: the tune
 * over the waltz, one celesta bell per lantern on its barline), 21-31.5 s the cabin (A': the tune climbs, strings swell
 * with the window, a bell for each kitten home), 31.5-43.5 s the whole island (B: the tune in octaves over flowing
 * eighths, top note F6 at 39 s, then the dominant), 43.5 s on the title (the first bar as an echo, IV with its major
 * seventh, home on a held Ab).
 * Sparkle voice: the level-3 score's celesta() (window.__l3Score.celesta), reused as is; without it the game's music
 * box. The harp is not used in this score at all.
 * Same engine and playing rules as l5-cutscene-music.js (kept separate so that file stays byte-identical): music-lush
 * voices through a registered GardenAudio track, so the music switch, the volume slider and the bus/reverb apply
 * unchanged, and the level's own track (雪灯摇篮) is handed back on stop().
 * Plain ES5. Exposes window.__l6Score. Never touches a save. */
(function (window) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit, M = window.__music2, V = M && M.voices;
  if (!K || !V || !V.felt || !V.padTone || !M.register) return;

  var BEAT = 0.5, STEPS = 6, SD = BEAT / 2, BAR = 3 * BEAT, BARS = 34, TOTAL = BARS * STEPS, FILM = 50;
  var LANTERN_AT = 7 * BAR, CABIN_AT = 14 * BAR, ISLAND_AT = 21 * BAR, SETTLE_AT = 29 * BAR;
  var NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  // "Ab4", "F#5", "C5"
  function midi(n) {
    var acc = n.charAt(1) === '#' ? 1 : n.charAt(1) === 'b' ? -1 : 0, oct = +n.charAt(acc ? 2 : 1);
    return 12 * (oct + 1) + NAMES[n.charAt(0)] + acc;
  }
  // "Eb5:3 F5:1" -> [[step, midi, steps]] in eighths, "-" is a rest
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
  // kind: p = falling snow (strings, a bare left hand), w = waltz left hand (bass, chord, chord), f = flowing eighths, c = coda
  var SCORE = [];
  function bar(kind, dyn, bass, chord, mel, strings, double) {
    SCORE.push({ kind: kind, dyn: dyn, bass: midi(bass), chord: notes(chord), mel: line(mel), strings: strings || 0, double: !!double, roll: false });
  }
  // 0-10.5 s: snow falls on the island. Low strings; the piano tries a few notes between the snowflakes.
  bar('p', 0.7, 'Ab2', 'Eb3 Ab3 C4', '', 0.036);
  bar('p', 0.72, 'Db2', 'F3 Ab3 Db4', '-:2 Eb5:2 F5:2', 0.038);
  bar('p', 0.74, 'Ab2', 'Eb3 Ab3 C4', 'Eb5:6', 0.04);
  bar('p', 0.76, 'F2', 'F3 Ab3 C4', '-:2 Ab4:2 C5:2', 0.04);
  bar('p', 0.78, 'Db2', 'F3 Ab3 Db4', 'Db5:4 C5:2', 0.042);
  bar('p', 0.8, 'Eb2', 'G3 Bb3 Eb4', 'Bb4:6', 0.044);
  bar('p', 0.8, 'Eb2', 'G3 Bb3 Db4', '', 0.044);
  // 10.5-21 s: the lanterns light, one on every barline. A: the tune leaps up and walks home down the scale.
  bar('w', 0.88, 'Ab2', 'Eb3 Ab3 C4', 'Eb5:3 F5:1 Ab5:2', 0.03);
  bar('w', 0.9, 'F2', 'F3 Ab3 C4', 'C6:4 Bb5:1 Ab5:1', 0.032);
  bar('w', 0.9, 'Db2', 'F3 Ab3 Db4', 'F5:3 Eb5:1 Db5:2', 0.034);
  bar('w', 0.92, 'Eb2', 'G3 Bb3 Eb4', 'Eb5:4 -:2', 0.036);
  bar('w', 0.93, 'C2', 'G3 C4 Eb4', 'Eb5:3 F5:1 G5:2', 0.038);
  bar('w', 0.94, 'Db2', 'F3 Ab3 Db4', 'F5:2 Ab5:2 Db6:2', 0.04);
  bar('w', 0.96, 'Eb2', 'G3 Bb3 Db4', 'Bb5:4 Ab5:1 G5:1', 0.042);
  // 21-31.5 s: the cabin. A': the tune climbs higher as the kittens come home; the strings swell with the window.
  bar('w', 0.98, 'Ab2', 'Eb3 Ab3 C4', 'Eb5:3 F5:1 Ab5:2', 0.044);
  bar('w', 1.0, 'F2', 'F3 Ab3 C4', 'C6:4 Bb5:1 Ab5:1', 0.048);
  bar('w', 1.02, 'Db2', 'F3 Ab3 Db4', 'Db6:3 C6:1 Bb5:2', 0.052);
  bar('w', 1.03, 'C2', 'Eb3 Ab3 C4', 'Ab5:4 -:2', 0.056);
  bar('w', 1.04, 'Bb1', 'F3 Bb3 Db4', 'Db5:3 Eb5:1 F5:2', 0.06);
  bar('w', 1.05, 'Eb2', 'G3 Bb3 Eb4', 'Bb5:2 Ab5:2 G5:2', 0.06);
  bar('w', 1.06, 'Ab2', 'Eb3 Ab3 C4', 'Ab5:6', 0.06);
  // 31.5-43.5 s: the whole island asleep in the snow. B: the tune in octaves over flowing eighths, the top note at 39 s.
  bar('f', 1.08, 'Db2', 'F3 Ab3 Db4', 'Ab5:2 Db6:2 C6:2', 0.062, true);
  bar('f', 1.09, 'Eb2', 'G3 Bb3 Eb4', 'Bb5:4 G5:2', 0.064, true);
  bar('f', 1.1, 'C2', 'G3 C4 Eb4', 'C6:3 Bb5:1 Ab5:2', 0.066, true);
  bar('f', 1.11, 'F2', 'F3 Ab3 C4', 'Ab5:4 F5:2', 0.066, true);
  bar('f', 1.14, 'Db2', 'F3 Ab3 Db4', 'Db6:2 Eb6:2 F6:2', 0.07, true);
  bar('f', 1.12, 'Eb2', 'Ab3 C4 Eb4', 'Eb6:2 C6:2 Ab5:2', 0.068, true);
  bar('f', 1.0, 'Eb2', 'G3 Bb3 Db4', 'Bb5:3 Ab5:1 G5:2', 0.058);
  bar('f', 0.9, 'Eb2', 'G3 Bb3 Db4', 'Eb5:6', 0.05);
  // 43.5 s on: the title. The tune's first bar as an echo, IV with C on top (its major seventh), then home on Ab.
  bar('c', 0.62, 'Ab2', 'Eb3 Ab3 C4', 'Eb5:3 F5:1 Ab5:2', 0.044);
  bar('c', 0.58, 'Db2', 'F3 Ab3 Db4', 'C6:4 Bb5:2', 0.04);
  bar('c', 0.54, 'Ab2', 'Eb3 Ab3 C4', 'Ab5:6', 0.036);
  bar('c', 0.5, 'Db2', 'F3 Ab3 C4', '', 0.032);
  bar('c', 0.46, 'Ab2', 'Eb3 Ab3 C4', 'Ab4:6', 0.03);

  /* Celesta notes on the film clock, each one a thing the picture shows (the unit test compares them with
   * l6-cutscene.js): six snowflake bells while the snow settles in, one bell per lantern on its barline (Ab pentatonic,
   * low to high along the path), a soft roll when the window starts to swell, one bell for each kitten arriving home,
   * and one last note under the title. All on the eighth-note grid (rolls start on a beat, 0.12 s apart). */
  var LANTERN_T = 10.5, LANTERN_STEP = 1.5, LANT_PITCH = [80, 82, 84, 87, 89, 92];
  var SNOW = [[1.5, 92], [3.25, 87], [4.5, 89], [6.25, 84], [7.5, 87], [9.25, 80]];
  var ARRIVE = [24, 26, 28, 30], HOME_PITCH = [84, 87, 89, 92], WINDOW_T = 22, WINDOW_ROLL = [80, 84, 87, 92], SPARKS = [];
  (function () {
    var i;
    function ring(at, c, m, v, kind) { SPARKS.push({ at: +at.toFixed(3), c: c, m: m, v: v, kind: kind }); }
    for (i = 0; i < SNOW.length; i++) ring(SNOW[i][0], i, SNOW[i][1], 0.028, 'snow');
    for (i = 0; i < 6; i++) ring(LANTERN_T + i * LANTERN_STEP, i, LANT_PITCH[i], 0.06, 'lantern');
    for (i = 0; i < WINDOW_ROLL.length; i++) ring(WINDOW_T + i * 0.12, i, WINDOW_ROLL[i], 0.036 - i * 0.002, 'window');
    for (i = 0; i < ARRIVE.length; i++) ring(ARRIVE[i], i, HOME_PITCH[i], 0.05, 'home');
    ring(SETTLE_AT, 0, 92, 0.032, 'title');
    SPARKS.sort(function (a, b) { return a.at - b.at || a.c - b.c; });
    SCORE[Math.floor(WINDOW_T / BAR)].roll = true;
  })();
  var shared = window.__l3Score && window.__l3Score.celesta;
  function sparkle(t, m, v, out) {
    if (shared) shared(t, m, v, out);
    else if (K.musicBox) K.musicBox(t, m, v, out);
  }

  /* ----------------------------- Playing ---------------------------- */
  var def, cur = null, gen = null, origin = null, active = false, free = false, held = false, prev = -1, played = 0, lastStep = -1;
  function scene() { return window.__l6Cutscene || null; }
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
    // Two string voices a bar (the bass an octave up and the chord's top), each ringing into the next bar: with a
    // 1.5 s waltz bar this keeps the pad count the same as the 3 s bars of the level-5 score.
    V.padTone('warm', t, b.bass + 12, b.strings * 1.1, BAR * 1.6, 0.6, 0.9, out);
    V.padTone('warm', t + 0.05, b.chord[2], b.strings, BAR * 1.6, 0.7, 0.9, out);
  }
  function playStep(k, t, p) {
    var b = SCORE[Math.floor(k / STEPS)], s = k % STEPS, out = output(p), d = b.dyn, i;
    // Tune first: if the phone is busy the engine drops later voices, never the melody.
    for (i = 0; i < b.mel.length; i++) {
      if (b.mel[i][0] !== s) continue;
      var m = b.mel[i][1];
      V.felt(t + K.rnd(0, 0.012), m, (s === 0 ? 0.23 : s % 2 === 0 ? 0.2 : 0.175) * d, out);
      // The tune in octaves, the lower one soft and only on the downbeat.
      if (b.double && s === 0) V.felt(t + 0.015, m - 12, 0.1 * d, out);
    }
    if (s === 0) strings(t, b, out);
    if (b.kind === 'w') {
      // Waltz: bass on one, the upper two chord notes on two and three (softer on three).
      if (s === 0) V.felt(t, b.bass + 12, 0.12 * d, out);
      // Where the window's celesta roll sounds (bar 14) the left hand lifts after the bass, so the bells have the air.
      else if ((s === 2 || s === 4) && !b.roll) {
        V.felt(t + K.rnd(0.004, 0.012), b.chord[1], (s === 2 ? 0.055 : 0.045) * d, out);
        V.felt(t + K.rnd(0.008, 0.016), b.chord[2], (s === 2 ? 0.05 : 0.04) * d, out);
      }
    } else if (b.kind === 'f') {
      // Flowing eighths: bass, then the chord up through the first two beats; beat three is left to the tune.
      if (s === 0) V.felt(t, b.bass + 12, 0.12 * d, out);
      else if (s < 4) V.felt(t + K.rnd(0.003, 0.012), b.chord[s - 1], (s === 2 ? 0.062 : 0.05) * d, out);
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
  def = { id: 'l6snowwaltz', name: '雪窗归途', key: 56, bpm: 60 / SD / 4, swing: 0, delay: 0.1, level: 1.3, prog: [[0, 'maj']], mel: ['........'],
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
      // After a skip only the title bars sound: an engine tick inside the 0.5 s lead-in must not play the bar before.
      if (free && k < Math.round(SETTLE_AT / SD)) return;
      playStep(k % TOTAL, at, p);
    } };
  M.register(def);

  function indexOfCurrent() {
    var names = GA.trackNames(), name = GA.currentTrackName();
    for (var i = 0; i < names.length; i++) if (names[i] === name) return i;
    return -1;
  }
  window.__l6Score = {
    id: def.id, bars: BARS, meter: 3, barSeconds: BAR, beatSeconds: BEAT, stepSeconds: SD, duration: FILM,
    lanternAt: LANTERN_AT, cabinAt: CABIN_AT, islandAt: ISLAND_AT, settleAt: SETTLE_AT,
    // Called from a user gesture (the last kitten home, 「重看雪灯归林」, or the first tap of the preview).
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
    // skip(): let the running phrase fade, then play the title bars (the echo, the last bell, the held Ab).
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
    sparkles: function () { return SPARKS.map(function (g) { return { at: g.at, c: g.c, m: g.m, v: g.v, kind: g.kind }; }); }
  };
})(window);
