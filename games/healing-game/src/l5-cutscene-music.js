/* l5-cutscene-music.js: 「月汐晚安」, the original score for the level-5 (final chapter) clear cutscene.
 * A closing lullaby in Bb major, 4/4 andante, one beat = 0.75 s (80 bpm), so a bar is 3 s and the film is 17 bars
 * (51 s, the last a held chord under the end of the picture). The film's cues sit on this grid (l5-cutscene.js):
 * each lotus's warm pulse peaks on a beat (12, 13.5 ... 19.5 s: beats 1 and 3 of bars 5-7), the dew lands on eighth
 * notes (22.5-30 s), the two lotus choruses start on beats (30.75 s, 40.5 s), and the boat slips out on a beat (31.5 s).
 * In the manner of a hand-drawn film score: a felt-piano tune and a gentle left hand over warm sustained strings, and
 * the celesta for the moon-dew and the opening lotuses. No samples and no quoted melody; every note was written for
 * this scene, and it shares no phrase with the level-1..4 scores (the unit test checks).
 * Form (after LoopSmith's A A' B + cadence): 0-9 s the moonlit bay (low strings, three piano notes), 9-21 s the lotuses
 * open (the tune, A, over a lullaby left hand), 21-30 s the path of light (A' a third higher, strings in, the dew's
 * celesta on the eighths), 30-45 s the boat goes home (B: the tune in octaves over flowing eighths and the fullest
 * strings, top note Eb6 at 39 s, then the dominant), 45 s on the title (goodnight: the tune's first bar as an echo
 * over IV, then home on a held Bb).
 * Sparkle voice: the level-3 score's celesta() (window.__l3Score.celesta), reused as is; without it the game's music
 * box. The harp is not used in this score at all.
 * Same engine and playing rules as l4-cutscene-music.js (kept separate so that file stays byte-identical): music-lush
 * voices through a registered GardenAudio track, so the music switch, the volume slider and the bus/reverb apply
 * unchanged, and the level's own track (月汐摇光) is handed back on stop().
 * Plain ES5. Exposes window.__l5Score. Never touches a save. */
(function (window) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit, M = window.__music2, V = M && M.voices;
  if (!K || !V || !V.felt || !V.padTone || !M.register) return;

  var BEAT = 0.75, STEPS = 8, SD = BEAT / 2, BAR = 4 * BEAT, BARS = 17, TOTAL = BARS * STEPS, FILM = 50;
  var BLOOM_AT = 3 * BAR, PATH_AT = 7 * BAR, SWELL_AT = 10 * BAR, SETTLE_AT = 15 * BAR;
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
  // kind: p = the moonlit bay (strings, a bare left hand), l = lullaby left hand (quarters), a = flowing eighths, c = coda
  var SCORE = [];
  function bar(kind, dyn, bass, chord, mel, strings, double) {
    SCORE.push({ kind: kind, dyn: dyn, bass: midi(bass), chord: notes(chord), mel: line(mel), strings: strings || 0, double: !!double, roll: false });
  }
  // 0-9 s: the moonlit bay. Low strings hold; the piano tries three notes and waits.
  bar('p', 0.72, 'Bb2', 'F3 Bb3 D4', '', 0.04);
  bar('p', 0.75, 'Eb2', 'G3 Bb3 Eb4', '-:4 F5:2 D5:2', 0.042);
  bar('p', 0.8, 'F2', 'F3 Bb3 C4', 'C5:8', 0.044);
  // 9-21 s: the lotuses open, one on every other beat from 12 s. The tune (A) on the piano over a lullaby left hand.
  bar('l', 0.9, 'Bb2', 'F3 Bb3 D4', 'D5:3 Eb5:1 F5:4', 0.03);
  bar('l', 0.92, 'G2', 'G3 Bb3 D4', 'G5:2 F5:2 D5:4', 0.032);
  bar('l', 0.94, 'C2', 'G3 C4 Eb4', 'C5:3 D5:1 Eb5:2 G5:2', 0.036);
  bar('l', 0.96, 'F2', 'F3 A3 C4', 'F5:6 -:2', 0.04);
  // 21-30 s: the path of light spreads over the reflections and the dew settles on it. A', a third higher; the left hand
  // keeps rocking in quarters so the dew's celesta has the eighths to itself.
  bar('l', 1.0, 'Bb2', 'F3 Bb3 D4', 'F5:3 G5:1 Bb5:4', 0.05);
  bar('l', 1.02, 'D2', 'A3 D4 F4', 'A5:2 G5:2 F5:4', 0.052);
  bar('l', 1.04, 'Eb2', 'G3 Bb3 Eb4', 'G5:3 F5:1 Eb5:2 D5:2', 0.055);
  // 30-45 s: the lotuses answer together and the boat glides home. B: the tune in octaves over the fullest strings,
  // the top note at 39 s, then a soft dominant seventh that leans towards the title.
  bar('a', 1.08, 'C2', 'G3 C4 Eb4', 'C6:4 Bb5:2 G5:2', 0.06, true);
  bar('a', 1.12, 'F2', 'F3 A3 C4', 'A5:3 Bb5:1 C6:4', 0.064, true);
  bar('a', 1.15, 'G2', 'G3 Bb3 D4', 'D6:4 C6:2 Bb5:2', 0.068, true);
  bar('a', 1.18, 'Eb2', 'G3 Bb3 Eb4', 'Eb6:4 D6:2 Bb5:2', 0.07, true);
  bar('a', 0.98, 'F2', 'A3 C4 Eb4', 'C6:4 A5:2 F5:2', 0.054);
  // 45 s on: the title, goodnight. The tune's first bar as an echo over IV (D over Eb: a warm major seventh), then home.
  bar('c', 0.6, 'Eb2', 'G3 Bb3 Eb4', 'D5:3 Eb5:1 F5:4', 0.042);
  bar('c', 0.48, 'Bb2', 'F3 Bb3 D4', 'D5:4 Bb4:4', 0.032);

  /* Celesta notes on the film clock, each one a thing the picture shows (the unit test compares them with
   * l5-cutscene.js): a lotus opening (its pulse peak, wake + 1.2 s), a dew bead landing on the path (snapped to eighths;
   * beads landing together ring once), the two choruses of all six (a soft roll, 0.12 s apart like the picture), and one
   * last note under the title. Each lotus has its own note of the Bb pentatonic, low to high; its dew rings the same note. */
  var PITCH = [82, 84, 86, 89, 91, 94], LOTUS_T = 10.8, LOTUS_STEP = 1.5, CHORUS = [30.75, 40.5], PATH_LEN = 22, DEWS = 24, SPARKS = [];
  function dewLand(j) {
    var i = j % 6, k = (j / 6) | 0, n = i * 4 + k, s = 0.8 + n * (PATH_LEN - 2.6) / (DEWS - 1);
    return Math.round((22.6 + 7.4 * Math.sqrt(s / PATH_LEN)) / 0.375) * 0.375;
  }
  (function () {
    var i, j, k, seen = {};
    function ring(at, c, v, kind) { SPARKS.push({ at: +at.toFixed(3), c: c, m: PITCH[c], v: v, kind: kind }); }
    for (i = 0; i < 6; i++) ring(LOTUS_T + i * LOTUS_STEP + 1.2, i, 0.064, 'lotus');
    for (j = 0; j < DEWS; j++) { var at = dewLand(j); if (!seen[at]) { seen[at] = 1; ring(at, j % 6, 0.036, 'dew'); } }
    for (k = 0; k < CHORUS.length; k++) for (i = 0; i < 6; i++) ring(CHORUS[k] + i * 0.12, i, 0.042 - i * 0.002, 'chorus');
    ring(SETTLE_AT, 5, 0.032, 'title');
    SPARKS.sort(function (a, b) { return a.at - b.at || a.c - b.c; });
    for (k = 0; k < CHORUS.length; k++) SCORE[Math.floor(CHORUS[k] / BAR)].roll = true;
  })();
  var shared = window.__l3Score && window.__l3Score.celesta;
  function sparkle(t, m, v, out) {
    if (shared) shared(t, m, v, out);
    else if (K.musicBox) K.musicBox(t, m, v, out);
  }

  /* ----------------------------- Playing ---------------------------- */
  var def, cur = null, gen = null, origin = null, active = false, free = false, held = false, prev = -1, played = 0, lastStep = -1;
  function scene() { return window.__l5Cutscene || null; }
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
      V.felt(t + K.rnd(0, 0.012), m, (s === 0 ? 0.24 : s === 4 ? 0.215 : s % 2 === 0 ? 0.2 : 0.18) * d, out);
      // The tune in octaves, the lower one soft and only on the downbeat (long tails: keeps the phone's voice count down).
      if (b.double && s === 0) V.felt(t + 0.015, m - 12, 0.11 * d, out);
    }
    if (s === 0) strings(t, b, out);
    if (b.kind === 'l') {
      // Lullaby: bass on one, then the chord rocking up in quarters (fifth, root, third).
      if (s === 0) V.felt(t, b.bass + 12, 0.12 * d, out);
      else if (s === 2 || s === 4 || s === 6) V.felt(t + K.rnd(0.004, 0.012), b.chord[s === 2 ? 0 : s === 4 ? 1 : 2], (s === 4 ? 0.06 : 0.052) * d, out);
    } else if (b.kind === 'a') {
      // Flowing eighths: bass, then the chord up and back; the last two eighths are left to the tune. Where all six
      // lotuses answer together the left hand lifts after the second eighth, so the celesta roll has the air.
      if (s === 0) V.felt(t, b.bass + 12, 0.12 * d, out);
      else if (s < (b.roll ? 2 : 6)) V.felt(t + K.rnd(0.003, 0.012), b.chord[s === 1 ? 0 : s === 2 ? 1 : s === 3 ? 2 : s === 4 ? 1 : 0], (s === 2 ? 0.066 : 0.052) * d, out);
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
  def = { id: 'l5lullaby', name: '月汐晚安', key: 58, bpm: 60 / SD / 4, swing: 0, delay: 0.1, level: 1.3, prog: [[0, 'maj']], mel: ['........'],
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
      // After a skip only the goodnight bars sound: an engine tick that lands inside the 0.5 s lead-in must not play
      // the tail of the bar before them.
      if (free && k < Math.round(SETTLE_AT / SD)) return;
      playStep(k % TOTAL, at, p);
    } };
  M.register(def);

  function indexOfCurrent() {
    var names = GA.trackNames(), name = GA.currentTrackName();
    for (var i = 0; i < names.length; i++) if (names[i] === name) return i;
    return -1;
  }
  window.__l5Score = {
    id: def.id, bars: BARS, barSeconds: BAR, beatSeconds: BEAT, stepSeconds: SD, duration: FILM, bloomAt: BLOOM_AT, pathAt: PATH_AT, swellAt: SWELL_AT, settleAt: SETTLE_AT,
    // Called from a user gesture (the last note of 晓信莲, 「重看月汐归航」, or the first tap of the preview).
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
    // skip(): let the running phrase fade, then play the two goodnight bars (the tune's echo, the last celesta note, the held Bb).
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
