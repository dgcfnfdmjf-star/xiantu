/* l1-cutscene-music.js: 「蝶归晚风」, the original score for the level-1 clear cutscene.
 * A slow D-major waltz (3/4, one bar = 2 s, 25 bars = 50 s) in the manner of a hand-drawn film score:
 * a solo felt-piano tune that leans on the subdominant (IV - V - iii - vi), warm strings under it, harp
 * for the wind and a soft flute in the dance. No samples and no quoted melody; every note below was
 * written for this scene.
 * Bars follow the picture: 0-10 s meadow (harp + strings, a few piano notes), 10-20 s release (the tune,
 * piano alone), 20-32 s dance (harp eighths + flute), 32-44 s ribbon (the tune again, doubled, strings
 * swelling to the peak at 40 s), 44-50 s title (the cadence lands on D as the title fades in).
 * Same engine and same playing rules as l2-cutscene-music.js (kept separate so that file stays byte-identical):
 * music-lush voices through a registered GardenAudio track, so the music switch, the volume slider and
 * the bus/reverb apply unchanged, and the level's own track is handed back on stop().
 * Plain ES5. Exposes window.__l1Score. Never touches a save. */
(function (window) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit, M = window.__music2, V = M && M.voices;
  if (!K || !V || !V.felt || !V.harp || !V.padTone || !M.register) return;

  var BAR = 2, STEPS = 6, SD = BAR / STEPS, BARS = 25, TOTAL = BARS * STEPS, SWELL_AT = 32, SETTLE_AT = 44;
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
  // 0-10 s: wind over the meadow. Harp ripples over a slow string swell; the piano drops in a few single notes.
  bar('i', 0.8, 'D3', 'D3 A3 E4', '', { harp: 'D3 A3 D4 E4 F#4 A4', strings: 0.045 });
  bar('i', 0.8, 'G2', 'G3 B3 D4', '-:2 A4:2 B4:2', { harp: 'G3 D4 G4 A4 B4 D5', strings: 0.05 });
  bar('i', 0.85, 'D3', 'F#3 A3 D4', 'F#5:6', { harp: 'D3 A3 F#4 A4 D5 F#5', strings: 0.052 });
  bar('i', 0.85, 'A2', 'A3 D4 E4', 'E5:6', { harp: 'A3 E4 A4 D5 E5 A5', strings: 0.052 });
  bar('i', 0.9, 'A2', 'A3 C#4 E4', '-:3 A4:1 D5:1 E5:1', { harp: 'A3 E4 A4 C#5 E5 A5', strings: 0.05 });
  // 10-20 s: the net opens. The tune, solo piano over a waltz left hand; strings slip in under its second half.
  bar('w', 0.92, 'G2', 'B3 D4', 'F#5:3 E5:1 D5:2');
  bar('w', 0.92, 'A2', 'C#4 E4', 'E5:4 C#5:1 E5:1');
  bar('w', 0.96, 'F#2', 'A3 C#4', 'A5:3 F#5:1 C#5:2', { strings: 0.036 });
  bar('w', 0.96, 'B2', 'B3 D4', 'D5:4 B4:1 D5:1', { strings: 0.04 });
  bar('w', 0.94, 'A2', 'C#4 G4', 'G5:2 F#5:2 E5:2', { strings: 0.042 });
  // 20-32 s: the dance round the blossoms. Home key, harp eighths, a flute holding the line underneath.
  bar('h', 1.04, 'D3', 'F#4 A4 D5', 'F#5:2 A5:2 D6:2', { harp: 'D4 A4 F#5 A4 D5 A4', flute: 'A4:6', strings: 0.054 });
  bar('h', 1.04, 'B2', 'D4 F#4 B4', 'C#6:4 B5:2', { harp: 'B3 F#4 D5 F#4 B4 F#4', flute: 'D5:6', strings: 0.054 });
  bar('h', 1.06, 'G2', 'D4 G4 B4', 'B5:2 G5:2 D5:2', { harp: 'G3 D4 B4 D4 G4 D4', flute: 'B4:4 D5:2', strings: 0.056 });
  bar('h', 1.06, 'F#2', 'D4 F#4 A4', 'A5:4 F#5:1 A5:1', { harp: 'F#3 D4 A4 D4 F#4 D4', flute: 'A4:6', strings: 0.056 });
  bar('h', 1.08, 'E3', 'E4 G4 B4', 'B5:2 G5:2 E5:2', { harp: 'E4 B4 G5 B4 D5 B4', flute: 'G4:6', strings: 0.058 });
  bar('h', 1.1, 'A2', 'C#4 E4 A4', 'D5:2 E5:2 A5:2', { harp: 'A3 E4 C#5 E4 A4 C#5', flute: 'A4:3 C#5:3', strings: 0.06 });
  // 32-44 s: the ribbon rises. The tune comes back with the harp an octave above it and climbs to its top
  // note at 40 s over the fullest strings, then leans on the dominant.
  bar('w', 1.1, 'G2', 'B3 D4', 'F#5:3 E5:1 D5:2', { strings: 0.064, double: true });
  bar('w', 1.12, 'A2', 'C#4 E4', 'E5:4 C#5:1 E5:1', { strings: 0.066, double: true });
  bar('w', 1.14, 'F#2', 'A3 C#4', 'A5:3 F#5:1 A5:2', { strings: 0.068, double: true });
  bar('w', 1.16, 'B2', 'B3 D4', 'D6:4 B5:1 D6:1', { strings: 0.07, double: true });
  bar('w', 1.18, 'G2', 'B3 D4', 'E6:2 D6:2 B5:2', { strings: 0.07, double: true });
  bar('w', 1, 'A2', 'C#4 G4', 'A5:2 G5:2 E5:2', { strings: 0.056 });
  // 44-50 s: the title. The cadence lands on D; a lullaby echo of the tune, a harp roll, one last low chord.
  bar('c', 0.62, 'D3', 'A3 F#4', 'F#5:4 D5:2', { strings: 0.044 });
  bar('c', 0.54, 'D3', 'G3 B3', 'E5:4 B4:2', { strings: 0.04, harp: 'D4 F#4 A4 D5 F#5 A5' });
  bar('c', 0.46, 'D2', 'A3 D4', 'D5:6', { strings: 0.03 });
  // Small harp glints as the first butterflies settle on their blossoms (landings at 21.6 s, 0.5 s apart).
  var GLINTS = notes('A5 D6 E6 F#6 A6 B6').map(function (m, i) { return { at: 21.6 + i * 1 + (i > 2 ? 1.1 : 0), m: m }; });

  /* ----------------------------- Playing ---------------------------- */
  var def, cur = null, gen = null, origin = null, active = false, free = false, held = false, prev = -1, played = 0, lastStep = -1;
  function scene() { return window.__l1Cutscene || null; }
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
  def = { id: 'l1waltz', name: '蝶归晚风', key: 62, bpm: 60 / SD / 4, swing: 0, delay: 0.1, level: 1.3, prog: [[0, 'maj']], mel: ['........'],
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
  window.__l1Score = {
    id: def.id, bars: BARS, barSeconds: BAR, duration: BARS * BAR, swellAt: SWELL_AT, settleAt: SETTLE_AT,
    // Called from a user gesture (the catch that fills the net, or the first tap of the preview).
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
    // skip(): let the running phrase fade, then play the last three bars so the title gets its cadence.
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
    score: function () { return SCORE.map(function (b) { return { kind: b.kind, dyn: b.dyn, strings: b.strings, bass: b.bass, chord: b.chord.slice(), mel: b.mel.map(function (n) { return n.slice(); }) }; }); }
  };
})(window);
