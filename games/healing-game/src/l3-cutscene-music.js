/* l3-cutscene-music.js: 「星灯摇篮曲」, the original score for the level-3 clear cutscene.
 * A night lullaby in F major, 6/8 (two rocking beats a bar, one bar = 2 s, 25 bars = 50 s), in the manner of a
 * hand-drawn film score: a solo felt-piano tune in a long-short cradle rhythm over a rocking left hand, warm
 * sustained strings under it, harp for the night air, and a soft celesta (its own small voice, see celesta()) for the lamps and
 * the star fireflies. No samples and no quoted melody; every note below was written for this scene.
 * Bars follow the picture: 0-10 s dusk (strings + a slow harp rock, the motif hinted), 10-20 s lamps (the tune,
 * piano alone, one bell note as each lamp warms), 20-32 s fireflies (the lift: harp eighths, the tune an octave
 * up, a rising run of sparkles as they are let go), 32-44 s boat (the tune again in octaves over the fullest
 * strings, peak at 40 s, then the dominant; the lower octave only on the two beats of the bar), 44-50 s title (the cadence lands on F as the title fades in).
 * Same engine and same playing rules as l1-cutscene-music.js (kept separate so that file stays byte-identical):
 * music-lush voices through a registered GardenAudio track, so the music switch, the volume slider and the
 * bus/reverb apply unchanged, and the level's own track (夜航) is handed back on stop().
 * Plain ES5. Exposes window.__l3Score. Never touches a save. */
(function (window) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit, M = window.__music2, V = M && M.voices;
  if (!K || !V || !V.felt || !V.harp || !V.padTone || !M.register) return;

  var BAR = 2, STEPS = 6, SD = BAR / STEPS, BARS = 25, TOTAL = BARS * STEPS, LIFT_AT = 20, SWELL_AT = 32, SETTLE_AT = 44;
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
  // kind: n = night air (slow harp rock over strings), r = rocking left hand, f = fireflies (harp eighths), c = coda
  var SCORE = [];
  function bar(kind, dyn, bass, chord, mel, extra) {
    SCORE.push({ kind: kind, dyn: dyn, bass: midi(bass), chord: notes(chord), mel: line(mel), harp: extra && extra.harp ? notes(extra.harp) : null, double: !!(extra && extra.double), strings: extra && extra.strings || 0 });
  }
  // 0-10 s: dusk. Strings hold, the harp rocks twice a bar, the piano tries the first three notes of the tune.
  bar('n', 0.8, 'F2', 'F3 C4 G4', '', { harp: 'F3 C4 G4 C4', strings: 0.045 });
  bar('n', 0.8, 'D3', 'F3 A3 E4', '-:3 A4:2 C5:1', { harp: 'D3 A3 F4 A3', strings: 0.048 });
  bar('n', 0.85, 'Bb2', 'F3 Bb3 D4', 'D5:6', { harp: 'Bb2 F3 D4 F3', strings: 0.05 });
  bar('n', 0.85, 'C3', 'G3 C4 E4', 'E5:3 G5:3', { harp: 'C3 G3 E4 G3', strings: 0.05 });
  bar('n', 0.9, 'C3', 'G3 C4 F4', '-:3 C5:2 G4:1', { harp: 'C3 G3 F4 G3', strings: 0.048 });
  // 10-20 s: the lamps warm one by one. The tune, solo piano, long-short like a cradle; strings slip in halfway.
  bar('r', 0.92, 'F2', 'C4 A3 F4', 'A4:2 C5:1 F5:3');
  bar('r', 0.92, 'D3', 'A3 F3 D4', 'E5:2 D5:1 A4:3');
  bar('r', 0.95, 'Bb2', 'F3 D4 Bb3', 'D5:2 F5:1 G5:2 F5:1', { strings: 0.036 });
  bar('r', 0.96, 'C3', 'G3 E4 C4', 'E5:3 C5:2 D5:1', { strings: 0.04 });
  bar('r', 0.94, 'C3', 'G3 Bb3 E4', 'C5:2 E5:1 G5:2 Bb5:1', { strings: 0.042 });
  // 20-32 s: the fireflies are let go and climb. Subdominant side, harp eighths rising, the tune an octave higher.
  bar('f', 1.02, 'Bb2', 'Bb3 D4 F4', 'A5:2 Bb5:1 D6:3', { harp: 'Bb3 F4 Bb4 D5 F5 Bb5', strings: 0.052 });
  bar('f', 1.03, 'C3', 'C4 E4 G4', 'E6:2 D6:1 C6:2 E6:1', { harp: 'C4 G4 C5 E5 G5 C6', strings: 0.054 });
  bar('f', 1.04, 'A2', 'A3 C4 E4', 'G6:3 E6:2 C6:1', { harp: 'A3 E4 A4 C5 E5 A5', strings: 0.054 });
  bar('f', 1.05, 'D3', 'A3 D4 F4', 'F6:2 E6:1 D6:3', { harp: 'D4 A4 D5 F5 A5 D6', strings: 0.056 });
  bar('f', 1.06, 'G2', 'G3 Bb3 D4', 'Bb5:2 D6:1 G6:2 F6:1', { harp: 'G3 D4 G4 Bb4 D5 G5', strings: 0.058 });
  bar('f', 1.08, 'C3', 'G3 C4 F4', 'F6:2 E6:1 D6:2 C6:1', { harp: 'C4 G4 C5 F5 G5 C6', strings: 0.06 });
  // 32-44 s: the paper boat sails. The tune comes home in octaves over the fullest strings, climbs to its top
  // note at 40 s on the subdominant, then leans on the dominant.
  bar('r', 1.1, 'F2', 'C4 A3 F4', 'A5:2 C6:1 F6:3', { strings: 0.064, double: true });
  bar('r', 1.12, 'D3', 'A3 F3 D4', 'E6:2 D6:1 A5:3', { strings: 0.066, double: true });
  bar('r', 1.14, 'Bb2', 'F3 D4 Bb3', 'D6:2 F6:1 G6:2 F6:1', { strings: 0.068, double: true });
  bar('r', 1.16, 'C3', 'G3 E4 C4', 'E6:3 G6:2 E6:1', { strings: 0.07, double: true });
  bar('r', 1.18, 'Bb2', 'F3 D4 Bb3', 'A6:3 G6:2 F6:1', { strings: 0.07, double: true });
  bar('r', 1, 'C3', 'G3 Bb3 E4', 'D6:2 C6:1 G5:3', { strings: 0.056 });
  // 44-50 s: the title. Home on F: the first bar of the tune as an echo, a plagal sigh with a harp roll, one last chord.
  bar('c', 0.62, 'F2', 'C4 A3 F4', 'A4:2 C5:1 F5:3', { strings: 0.044 });
  bar('c', 0.54, 'F2', 'Bb3 D4 F4', 'D5:2 Bb4:1 C5:3', { strings: 0.04, harp: 'F4 Bb4 D5 F5 Bb5 D6' });
  bar('c', 0.46, 'F2', 'C4 F4 A4', 'F5:6', { strings: 0.03 });
  /* Celesta notes, on the film clock rather than the bar grid: one bell as each lamp warms
   * (10.6 s, 2.7 s apart, each a third higher), a rising pentatonic run while the fireflies are released (20.6 s on),
   * a few late stars as they settle in the sky, and one last star over the final chord. */
  var SPARKS = [];
  notes('F5 A5 C6').forEach(function (m, i) { SPARKS.push({ at: 11.3 + i * 2.7, m: m, v: 0.07 }); });
  notes('C6 D6 F6 G6 A6 C7 D7 F7').forEach(function (m, i) { SPARKS.push({ at: 20.7 + i * 0.95, m: m, v: 0.05 - i * 0.002 }); });
  notes('A6 F7 C7').forEach(function (m, i) { SPARKS.push({ at: 28.9 + i * 1.15, m: m, v: 0.034 }); });
  SPARKS.push({ at: 48.9, m: midi('C7'), v: 0.03 });

  /* Celesta: the sparkle voice. Adapted from the game's own K.musicBox (a sine with a short upper-partial strike): a
   * celesta is steel bars over wooden resonators, so the tone is nearly all fundamental - a felt-soft 5 ms attack, a
   * warm octave partial from the box and one quick "tink" two octaves up; the music box's inharmonic 5.93x tine
   * shimmer is left out, and high notes ring shorter. Three sine oscillators a note, 16 notes in the whole film.
   * Without oscillators in the kit it falls back to the music box, then the harp. */
  function celesta(t, m, v, out) {
    if (!K.osc || !K.mtof) { (K.musicBox || V.harp)(t, m, v, out); return; }
    var f = K.mtof(m), len = Math.max(1.1, Math.min(2.6, 2.6 - (m - 72) * 0.045)), peak = v * 0.9;
    var g = K.gain(0, out), h = K.gain(0, out), k = K.gain(0, out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(peak * 0.4, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    h.gain.setValueAtTime(0.0001, t);
    h.gain.linearRampToValueAtTime(peak * 0.2, t + 0.005);
    h.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.45);
    k.gain.setValueAtTime(peak * 0.26, t);
    k.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    K.osc('sine', f, t, t + len + 0.05, g, 0, [g]);
    K.osc('sine', f * 2, t, t + len * 0.45 + 0.05, h, 3, [h]);
    K.osc('sine', Math.min(f * 4.02, 15000), t, t + 0.2, k, 0, [k]);
  }

  /* ----------------------------- Playing ---------------------------- */
  var def, cur = null, gen = null, origin = null, active = false, free = false, held = false, prev = -1, played = 0, lastStep = -1;
  function scene() { return window.__l3Cutscene || null; }
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
      V.felt(t + K.rnd(0, 0.012), m, (s === 0 ? 0.25 : s === 3 ? 0.225 : 0.2) * d, out);
      // The tune in octaves, the lower one soft and only on the two beats of the bar (long tails: keeps the phone's voice count down).
      if (b.double && s % 3 === 0) V.felt(t + 0.015, m - 12, 0.11 * d, out);
    }
    if (s === 0) strings(t, b, out);
    if (b.kind === 'r') {
      // Cradle rock: bass on the first beat, three chord notes swaying up and back, the second beat leaned on a little.
      if (s === 0) V.felt(t, b.bass + 12, 0.13 * d, out);
      if (s === 2) V.felt(t + K.rnd(0.004, 0.014), b.chord[0], 0.06 * d, out);
      if (s === 3) V.felt(t + 0.01, b.chord[1], 0.075 * d, out);
      if (s === 5 && !b.double) V.felt(t + K.rnd(0.004, 0.016), b.chord[2], 0.05 * d, out);
      if (b.double && s === 4) V.harp(t + K.rnd(0, 0.014), b.chord[2] + 12, 0.055 * d, out); // one harp note answers each bar
    } else if (b.kind === 'f') {
      if (s === 0) V.felt(t, b.bass + 12, 0.11 * d, out);
      V.harp(t + K.rnd(0, 0.014), b.harp[s], (s === 0 ? 0.095 : s === 3 ? 0.08 : 0.06) * d, out);
    } else if (b.kind === 'n') {
      if (s === 0) V.felt(t, b.bass + 12, 0.07 * d, out);
      if (s !== 1 && s !== 4) V.harp(t + K.rnd(0, 0.014), b.harp[s === 0 ? 0 : s === 2 ? 1 : s === 3 ? 2 : 3], (s === 0 ? 0.13 : s === 3 ? 0.11 : 0.085) * d, out);
    } else {
      if (s === 0) { V.felt(t, b.bass + 12, 0.1 * d, out); V.felt(t + 0.03, b.chord[0], 0.06 * d, out); V.felt(t + 0.06, b.chord[1], 0.055 * d, out); }
      if (b.harp && s === 1) for (i = 0; i < b.harp.length; i++) V.harp(t + i * 0.2, b.harp[i], (0.09 - i * 0.008) * d, out);
    }
    for (i = 0; i < SPARKS.length; i++) {
      var at = SPARKS[i].at - k * SD;
      if (at >= 0 && at < SD) celesta(t + at, SPARKS[i].m, SPARKS[i].v, out);
    }
    played++; lastStep = k;
  }
  def = { id: 'l3lullaby', name: '星灯摇篮曲', key: 65, bpm: 60 / SD / 4, swing: 0, delay: 0.1, level: 1.3, prog: [[0, 'maj']], mel: ['........'],
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
  window.__l3Score = {
    id: def.id, bars: BARS, barSeconds: BAR, duration: BARS * BAR, liftAt: LIFT_AT, swellAt: SWELL_AT, settleAt: SETTLE_AT,
    // Called from a user gesture (the tap that lights the third lamp or skips the finale, or the first tap of the preview).
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
    score: function () { return SCORE.map(function (b) { return { kind: b.kind, dyn: b.dyn, strings: b.strings, bass: b.bass, chord: b.chord.slice(), double: b.double, mel: b.mel.map(function (n) { return n.slice(); }) }; }); },
    sparkleVoice: 'celesta', celesta: celesta,
    sparkles: function () { return SPARKS.map(function (g) { return { at: g.at, m: g.m, v: g.v }; }); }
  };
})(window);
