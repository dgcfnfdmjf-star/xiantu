/* l2-cutscene-music.js: 「猫团圆舞曲」, the original score for the level-2 clear cutscene.
 * A slow G-major waltz (3/4, one bar = 2 s, 30 bars = 60 s): felt-piano tune over an oom-pah-pah
 * left hand, warm string pads, harp, and a soft flute line in the middle strain. No samples and
 * no quoted melody; every note below was written for this scene.
 * Sound comes from the game's own engine: the music-lush voices (felt / harp / padTone) and the
 * music2 flute, played through a registered GardenAudio track, so the music switch, the music
 * volume slider and the engine's bus/reverb all apply unchanged.
 * The score is a table keyed by score time (the Tone.Transport idea): the engine's lookahead tick
 * asks "which eighth is due" against an origin, so seek() is just a new origin.
 * Outside the cutscene the track simply loops as one more piece in the track list.
 * Plain ES5. Exposes window.__l2Score. Never touches a save. */
(function (window) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit, M = window.__music2, V = M && M.voices;
  if (!K || !V || !V.felt || !V.harp || !V.padTone || !M.register) return;

  var BAR = 2, STEPS = 6, SD = BAR / STEPS, BARS = 30, TOTAL = BARS * STEPS, SETTLE_AT = 56;
  var NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(n) {
    var sharp = n.charAt(1) === '#', oct = +n.charAt(sharp ? 2 : 1);
    return 12 * (oct + 1) + NAMES[n.charAt(0)] + (sharp ? 1 : 0);
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
  // kind: i = intro (harp over strings), w = waltz left hand, h = harp eighths + flute, c = coda
  var SCORE = [];
  function bar(kind, dyn, bass, chord, mel, extra) {
    SCORE.push({ kind: kind, dyn: dyn, bass: midi(bass), chord: notes(chord), mel: line(mel), flute: line(extra && extra.flute), harp: extra && extra.harp ? notes(extra.harp) : null, double: !!(extra && extra.double), strings: extra && extra.strings || 0 });
  }
  // 0-8 s: the island settles. Harp alone over a slow string swell; the piano only picks up into bar 5.
  bar('i', 0.8, 'G2', 'G3 B3 D4', '', { harp: 'G3 D4 G4 A4 B4 D5', strings: 0.05 });
  bar('i', 0.8, 'G2', 'G3 C4 E4', '', { harp: 'G3 E4 G4 C5 E5 G5', strings: 0.05 });
  bar('i', 0.85, 'G2', 'G3 B3 D4', '', { harp: 'G3 D4 B4 D5 G5 B5', strings: 0.055 });
  bar('i', 0.85, 'D3', 'A3 D4 G4', '-:4 A4:1 B4:1', { harp: 'D3 A3 D4 G4 A4 D5', strings: 0.055 });
  // 8-24 s: kittens gather. The tune, solo piano; strings slip in under its second half.
  bar('w', 0.9, 'G2', 'B3 D4', 'D5:4 B4:2');
  bar('w', 0.9, 'E2', 'B3 D4', 'G5:4 E5:2');
  bar('w', 0.92, 'C3', 'B3 E4', 'E5:2 D5:1 C5:1 E5:2');
  bar('w', 0.92, 'D3', 'A3 D4', 'D5:4 A4:1 B4:1');
  bar('w', 1, 'B2', 'D4 G4', 'D5:4 G5:2', { strings: 0.04 });
  bar('w', 1, 'E3', 'B3 E4', 'B5:4 A5:2', { strings: 0.04 });
  bar('w', 1, 'A2', 'C4 E4', 'G5:2 E5:2 C5:2', { strings: 0.045 });
  bar('w', 0.96, 'D3', 'A3 D4', 'E5:2 D5:4', { strings: 0.045 });
  // 24-40 s: play. Middle strain on the subdominant: harp eighths, fuller strings, a flute answering below.
  bar('h', 1.08, 'C3', 'E4 G4 B4', 'C6:4 B5:2', { harp: 'C4 G4 E5 G4 C5 G4', flute: 'E5:6', strings: 0.06 });
  bar('h', 1.08, 'B2', 'D4 F#4 A4', 'A5:2 F#5:2 D5:2', { harp: 'B3 F#4 D5 F#4 A4 F#4', flute: 'D5:6', strings: 0.06 });
  bar('h', 1.1, 'E3', 'E4 G4 B4', 'G5:4 E5:1 F#5:1', { harp: 'E4 B4 G5 B4 E5 B4', flute: 'B4:6', strings: 0.062 });
  bar('h', 1.1, 'D3', 'D4 G4 B4', 'G5:4 D5:2', { harp: 'D4 B4 G5 B4 D5 B4', flute: 'B4:4 D5:2', strings: 0.062 });
  bar('h', 1.14, 'C3', 'E4 G4 C5', 'E5:2 G5:2 C6:2', { harp: 'C4 G4 E5 G4 C5 E5', flute: 'C5:6', strings: 0.066 });
  bar('h', 1.14, 'B2', 'D4 G4 B4', 'B5:4 D6:2', { harp: 'B3 G4 D5 G4 B4 D5', flute: 'D5:6', strings: 0.066 });
  bar('h', 1.1, 'A2', 'E4 G4 C5', 'C6:2 A5:2 E5:2', { harp: 'A3 E4 C5 E4 A4 E4', flute: 'E5:4 C5:2', strings: 0.064 });
  bar('h', 1.04, 'D3', 'D4 F#4 C5', 'F#5:4 A5:2', { harp: 'D4 A4 F#5 A4 C5 A4', flute: 'D5:3 C5:3', strings: 0.06 });
  // 40-52 s: the book lights up. The tune comes home, harp doubling it an octave up.
  bar('w', 1.15, 'G2', 'B3 D4', 'D5:4 B4:2', { strings: 0.066, double: true });
  bar('w', 1.15, 'E2', 'B3 D4', 'G5:4 E5:2', { strings: 0.066, double: true });
  bar('w', 1.12, 'C3', 'B3 E4', 'E5:2 D5:1 C5:1 E5:2', { strings: 0.064, double: true });
  bar('w', 1.08, 'D3', 'B3 D4', 'D5:4 G5:2', { strings: 0.06, double: true });
  bar('w', 1, 'A2', 'C4 E4', 'C6:2 B5:2 A5:2', { strings: 0.056, double: true });
  bar('w', 0.8, 'G2', 'B3 D4', 'G5:6', { strings: 0.05 });
  // 52-60 s: sleep pile and title. A lullaby echo of the opening, then one last low chord.
  bar('c', 0.58, 'G2', 'G3 D4', 'D5:4 B4:2', { strings: 0.042 });
  bar('c', 0.54, 'G2', 'G3 E4', 'E5:4 C5:2', { strings: 0.042 });
  bar('c', 0.5, 'G2', 'G3 D4', 'D5:6', { strings: 0.04, harp: 'G4 B4 D5 G5 B5 D6' });
  bar('c', 0.46, 'G2', 'D3 B3', 'G4:6', { strings: 0.03 });
  // Small harp glints as the six book cards light (38.8 s, then every 0.9 s).
  var GLINTS = notes('D6 E6 G6 A6 B6 D7').map(function (m, i) { return { at: 38.8 + i * 0.9, m: m }; });

  /* ----------------------------- Playing ---------------------------- */
  var def, cur = null, gen = null, origin = null, active = false, free = false, held = false, prev = -1, played = 0, lastStep = -1;
  function scene() { return window.__l2Cutscene || null; }
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
    if (b.chord.length < 3) V.padTone('warm', t + 0.15, b.chord[1] + 12, b.strings * 0.55, BAR, 0.9, 0.9, out);
    V.padTone('warm', t, b.bass + 12, b.strings * 1.1, BAR, 0.6, 0.9, out);
  }
  function playStep(k, t, p) {
    var b = SCORE[Math.floor(k / STEPS)], s = k % STEPS, out = output(p), d = b.dyn, i;
    // Tune first: if the phone is busy the engine drops later voices, never the melody.
    for (i = 0; i < b.mel.length; i++) {
      if (b.mel[i][0] !== s) continue;
      var m = b.mel[i][1];
      V.felt(t + K.rnd(0, 0.012), m, (s === 0 ? 0.25 : 0.21) * d, out);
      if (b.double) V.harp(t + 0.02, m + 12, 0.06 * d, out);
    }
    for (i = 0; i < b.flute.length; i++) if (b.flute[i][0] === s && V.flute) V.flute(t, b.flute[i][1], 0.034 * d, b.flute[i][2] * SD, out);
    if (s === 0) strings(t, b, out);
    if (b.kind === 'w') {
      // Oom-pah-pah: bass on one, a soft dyad on two, its upper note alone on three.
      if (s === 0) V.felt(t, b.bass + 12, 0.13 * d, out);
      if (s === 2) { V.felt(t + 0.01, b.chord[0], 0.07 * d, out); V.felt(t + 0.024, b.chord[1], 0.065 * d, out); }
      if (s === 4) V.felt(t + K.rnd(0.004, 0.016), b.chord[1], 0.055 * d, out);
    } else if (b.kind === 'h') {
      if (s === 0) V.felt(t, b.bass + 12, 0.12 * d, out);
      V.harp(t + K.rnd(0, 0.014), b.harp[s], (s === 0 ? 0.1 : s % 2 ? 0.06 : 0.075) * d, out);
    } else if (b.kind === 'i') {
      V.harp(t + K.rnd(0, 0.014), b.harp[s], (0.13 - s * 0.008) * d, out);
      if (s === 0) V.felt(t, b.bass + 12, 0.07 * d, out);
    } else {
      if (s === 0) { V.felt(t, b.bass + 12, 0.1 * d, out); V.felt(t + 0.03, b.chord[0], 0.06 * d, out); V.felt(t + 0.06, b.chord[1], 0.055 * d, out); }
      if (b.harp && s === 1) for (i = 0; i < b.harp.length; i++) V.harp(t + i * 0.2, b.harp[i], (0.09 - i * 0.008) * d, out);
    }
    for (i = 0; i < GLINTS.length; i++) {
      var at = GLINTS[i].at - k * SD;
      if (at >= 0 && at < SD) V.harp(t + at, GLINTS[i].m, 0.05, out);
    }
    played++; lastStep = k;
  }
  def = { id: 'l2waltz', name: '猫团圆舞曲', key: 67, bpm: 60 / SD / 4, swing: 0, delay: 0.1, level: 1.3, prog: [[0, 'maj']], mel: ['........'],
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
  window.__l2Score = {
    id: def.id, bars: BARS, barSeconds: BAR, duration: BARS * BAR,
    // Called from a user gesture (the 20th hug, or the first tap of the preview).
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
    // skip(): let the running phrase fade, then play the last two bars so the title gets its cadence.
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
    score: function () { return SCORE.map(function (b) { return { kind: b.kind, dyn: b.dyn, bass: b.bass, chord: b.chord.slice(), mel: b.mel.map(function (n) { return n.slice(); }) }; }); }
  };
})(window);
