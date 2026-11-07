/* ==================================================================
 * music-lush.js — sample-free ambient score for chapters 1, 2 and 4.
 * - Instruments are rendered once into AudioBuffers, so each note costs
 *   one source and one gain: PADsynth pads/choir, Karplus-Strong harp,
 *   additive felt piano. See MUSIC-UPGRADE.md.
 * - Tracks keep the engine format (prog/mel per bar, play per 16th) and
 *   the old ids; the previous defs stay as <id>_classic.
 * Plain ES5. Exposes window.__musicLush.
 * ================================================================== */
(function (window) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit, M = window.__music2, V = M && M.voices;
  if (!K || !V || !M.theme) return;

  var LOW_SR = 22050, HARP_SR = 32000, TABLE_SIZE = 1 << 17, MAX_LIVE = 34;
  var cache = {}, live = 0, warmQueue = [], warmTimer = null;

  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  /* ---------------------------- PADsynth --------------------------- */
  function ifft(re, im) {
    var n = re.length, i, j = 0, bit, tmp;
    for (i = 1; i < n; i++) {
      bit = n >> 1;
      while (j & bit) { j ^= bit; bit >>= 1; }
      j |= bit;
      if (i < j) { tmp = re[i]; re[i] = re[j]; re[j] = tmp; tmp = im[i]; im[i] = im[j]; im[j] = tmp; }
    }
    var cosT = new Float64Array(n / 2), sinT = new Float64Array(n / 2);
    for (i = 0; i < n / 2; i++) { cosT[i] = Math.cos(2 * Math.PI * i / n); sinT[i] = Math.sin(2 * Math.PI * i / n); }
    for (var size = 2; size <= n; size *= 2) {
      var half = size / 2, step = n / size;
      for (i = 0; i < n; i += size) {
        for (var k = 0, w = 0; k < half; k++, w += step) {
          var a = i + k, b = a + half, tr = re[b] * cosT[w] - im[b] * sinT[w], ti = re[b] * sinT[w] + im[b] * cosT[w];
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }
  }
  // Positive frequencies only: real and imaginary parts become a wide stereo pair from one transform.
  function padTable(f0, count, cents, spread, ampOf, air, seed) {
    var N = TABLE_SIZE, binHz = LOW_SR / N, mags = new Float64Array(N / 2), rand = rng(seed), i;
    var bwBase = (Math.pow(2, cents / 1200) - 1) * f0;
    for (var n = 1; n <= count; n++) {
      var f = f0 * n;
      if (f > LOW_SR * 0.45) break;
      var sigma = Math.max(1, bwBase * Math.pow(n, spread) / binHz / 2), centre = f / binHz, amp = ampOf(n, f) / Math.sqrt(sigma);
      var from = Math.max(1, Math.floor(centre - 3 * sigma)), to = Math.min(N / 2 - 1, Math.ceil(centre + 3 * sigma));
      for (i = from; i <= to; i++) { var x = (i - centre) / sigma; mags[i] += amp * Math.exp(-x * x); }
    }
    var re = new Float64Array(N), im = new Float64Array(N);
    for (i = 1; i < N / 2; i++) {
      var mag = mags[i] + (air ? air(i * binHz) : 0), ph = rand() * 2 * Math.PI;
      re[i] = mag * Math.cos(ph); im[i] = mag * Math.sin(ph);
    }
    ifft(re, im);
    var sum = 0;
    for (i = 0; i < N; i++) sum += re[i] * re[i] + im[i] * im[i];
    var scale = 0.25 / Math.sqrt(sum / (2 * N)) || 0, buf = GA.context().createBuffer(2, N, LOW_SR), L = buf.getChannelData(0), R = buf.getChannelData(1);
    for (i = 0; i < N; i++) { L[i] = re[i] * scale; R[i] = im[i] * scale; }
    return buf;
  }
  function bump(f, centre, width) { var x = Math.log(f / centre) / width; return Math.exp(-x * x); }
  // Soft sung vowels: harmonic source shaped by formants, with a little breath between the harmonics.
  var VOWEL = {
    ah: { formants: [[800, 1], [1150, 0.62], [2850, 0.22], [3900, 0.1]], breath: 0.0009 },
    oo: { formants: [[360, 1], [820, 0.42], [2700, 0.07]], breath: 0.0005 }
  };
  function vowelTable(name, root) {
    var v = VOWEL[name], rootHz = K.mtof(root);
    function env(f) {
      var e = 0.02;
      for (var i = 0; i < v.formants.length; i++) e += v.formants[i][1] * bump(f, v.formants[i][0], 0.2);
      return e;
    }
    return padTable(rootHz, 26, 42, 0.95, function (n, f) { return env(f) / Math.pow(n, 0.55); },
      function (f) { return f > 500 ? v.breath * env(f) : 0; }, name === 'ah' ? root * 11 + 3 : root * 17 + 5);
  }
  function warmTable() {
    return padTable(K.mtof(45), 34, 26, 1.08, function (n) { return Math.pow(n, -1.35) * (n % 2 ? 1 : 0.72); }, null, 4517);
  }

  /* -------------------------- Felt piano --------------------------- */
  // Additive partials with stiffness and two slightly detuned strings; soft hammer, faint felt thump.
  function feltNote(root) {
    var f = K.mtof(root), len = Math.max(2.8, Math.min(6.5, 7.6 - (root - 36) * 0.09)), n = Math.floor(len * LOW_SR), sr = LOW_SR;
    var buf = GA.context().createBuffer(1, n, sr), d = buf.getChannelData(0), rand = rng(root * 31 + 7), P = [], i, j, s;
    var tau = Math.max(0.55, 2.3 - (root - 48) * 0.035), stiff = 0.00022 * Math.pow(2, (root - 48) / 18);
    for (j = 1; j <= 9; j++) {
      var fn = f * j * Math.sqrt(1 + stiff * j * j);
      if (fn > sr * 0.42) break;
      var amp = Math.pow(j, -1.9) * (j === 1 ? 0.85 : 1), t1 = tau / (1 + 0.5 * (j - 1));
      for (s = 0; s < 2; s++) {
        var w = 2 * Math.PI * fn * Math.pow(2, (s ? 0.9 : -0.9) / 1200) / sr, ph = rand() * 0.5;
        P.push({ c: Math.cos(w), s: Math.sin(w), x: Math.cos(ph), y: Math.sin(ph), a: amp * 0.72, da: Math.exp(-1 / (t1 * sr)), b: amp * 0.28, db: Math.exp(-1 / (t1 * 3.2 * sr)) });
      }
    }
    var attack = Math.floor(sr * Math.max(0.003, 0.011 - (root - 48) * 0.00015)), fade = Math.floor(sr * 0.25), lp = 0, peak = 0;
    for (i = 0; i < n; i++) {
      var out = 0;
      for (j = 0; j < P.length; j++) {
        var p = P[j], nx = p.x * p.c - p.y * p.s;
        p.y = p.x * p.s + p.y * p.c; p.x = nx;
        out += p.x * (p.a + p.b);
        p.a *= p.da; p.b *= p.db;
      }
      if (i < sr * 0.09) { lp += ((rand() * 2 - 1) - lp) * 0.09; out += lp * 0.5 * Math.exp(-i / (sr * 0.018)); }
      if (i < attack) out *= 0.5 - 0.5 * Math.cos(Math.PI * i / attack);
      if (i > n - fade) out *= (n - i) / fade;
      d[i] = out;
      if (Math.abs(out) > peak) peak = Math.abs(out);
    }
    for (i = 0; i < n; i++) d[i] *= 0.8 / peak;
    return buf;
  }

  /* -------------------------- Karplus-Strong ------------------------ */
  function harpNote(root) {
    var f = K.mtof(root), sr = HARP_SR, t60 = Math.max(1.4, 4.6 - (root - 48) * 0.075), n = Math.floor(sr * t60 * 0.95);
    var buf = GA.context().createBuffer(1, n, sr), d = buf.getChannelData(0), rand = rng(root * 13 + 1);
    // Loop delay: the two-point average adds half a sample, the allpass supplies the fraction
    var period = sr / f - 0.5, size = Math.floor(period - 0.2), frac = period - size, coef = (1 - frac) / (1 + frac);
    var line = new Float32Array(size), rho = Math.pow(10, -3 / (f * t60)), i, lp = 0;
    var pluck = Math.max(1, Math.floor(size * 0.27));
    for (i = 0; i < size; i++) { lp += ((rand() * 2 - 1) - lp) * 0.34; line[i] = lp; }
    for (i = size - 1; i >= pluck; i--) line[i] -= line[i - pluck]; // finger position notch
    var at = 0, prev = 0, apIn = 0, apOut = 0, peak = 0, fade = Math.floor(sr * 0.2), attack = Math.floor(sr * 0.0025), body = 0;
    for (i = 0; i < n; i++) {
      var cur = line[at], avg = 0.5 * (cur + prev);
      prev = cur;
      apOut = coef * avg + apIn - coef * apOut; apIn = avg;
      line[at] = apOut * rho;
      at = at + 1 === size ? 0 : at + 1;
      body += (cur - body) * 0.42;
      var out = body;
      if (i < attack) out *= i / attack;
      if (i > n - fade) out *= (n - i) / fade;
      d[i] = out;
      if (Math.abs(out) > peak) peak = Math.abs(out);
    }
    for (i = 0; i < n; i++) d[i] *= 0.8 / peak;
    return buf;
  }

  /* ---------------------------- Instruments ------------------------ */
  var ROOTS = { felt: [36, 42, 48, 54, 60, 66, 72, 78, 84], harp: [48, 55, 62, 69, 76, 83, 90], ah: [62, 72], oo: [62, 72], warm: [45] };
  function nearest(list, m) {
    var best = list[0];
    for (var i = 1; i < list.length; i++) if (Math.abs(list[i] - m) < Math.abs(best - m)) best = list[i];
    return best;
  }
  function bank(name, m) {
    var root = nearest(ROOTS[name], m), key = name + root;
    if (!cache[key]) {
      cache[key] = { root: root, buf: name === 'felt' ? feltNote(root) : name === 'harp' ? harpNote(root) : name === 'warm' ? warmTable() : vowelTable(name, root) };
    }
    return cache[key];
  }
  function source(entry, m, loop) {
    var src = GA.context().createBufferSource();
    src.buffer = entry.buf; src.loop = !!loop;
    src.playbackRate.value = Math.pow(2, (m - entry.root) / 12);
    return src;
  }
  // One-shot with its decay baked in; dropped rather than stacked when the phone is already busy.
  function shot(name, t, m, v, out) {
    if (live >= MAX_LIVE) return;
    var src = source(bank(name, m), m), g = K.gain(v, out);
    src.connect(g); src.start(t);
    live++;
    src.onended = function () { live--; src.disconnect(); g.disconnect(); };
  }
  function felt(t, m, v, out) { shot('felt', t, m, v, out); }
  function harp(t, m, v, out) { shot('harp', t, m, v, out); }
  // Sustained loop with a soft envelope. Random start point, so repeated chords never line up.
  function tone(name, t, m, v, dur, att, rel, out) {
    var entry = bank(name, m), src = source(entry, m, true), g = K.gain(0, out), end = t + dur + rel;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + att);
    g.gain.setValueAtTime(v, t + Math.max(att, dur));
    g.gain.linearRampToValueAtTime(0.0001, end);
    src.connect(g); src.start(t, Math.random() * entry.buf.duration); src.stop(end + 0.05);
    live++;
    src.onended = function () { live--; src.disconnect(); g.disconnect(); };
    return src;
  }
  function choir(t, notes, v, dur, att, rel, out, vowel) {
    for (var i = 0; i < notes.length; i++) tone(vowel || 'oo', t + i * 0.25, notes[i], v, dur, att, rel, out);
  }
  // A single wordless voice: scoops into the note, vibrato arrives late.
  function vocalise(t, m, v, dur, out, vowel) {
    var rel = 1.6, att = Math.min(0.7, dur * 0.4), end = t + dur + rel, src = tone(vowel || 'oo', t, m, v, dur, att, rel, out), rate = src.playbackRate.value;
    src.playbackRate.setValueAtTime(rate * 0.988, t);
    src.playbackRate.linearRampToValueAtTime(rate, t + 0.32);
    var vib = K.gain(0);
    vib.gain.setValueAtTime(0, t + 0.4);
    vib.gain.linearRampToValueAtTime(rate * 0.0055, t + 1.2);
    vib.connect(src.playbackRate);
    K.osc('sine', 4.6, t, end, vib, 0, [vib]);
  }
  function warmUp(list) {
    warmQueue = warmQueue.concat(list);
    if (warmTimer) return;
    warmTimer = setTimeout(function next() {
      var job = warmQueue.shift();
      if (job) bank(job[0], job[1]);
      warmTimer = warmQueue.length ? setTimeout(next, 60) : null;
    }, 60);
  }

  /* ------------------------------ Hall ----------------------------- */
  // Decaying noise that darkens as it fades (Moorer, as in reverbGen); one set per ear for width.
  function hallImpulse(ctx, t60) {
    var sr = ctx.sampleRate, n = Math.floor(sr * t60 * 1.15), buf = ctx.createBuffer(2, n, sr), rand = rng(90210);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c), pre = Math.floor(sr * (c ? 0.024 : 0.018)), rise = sr * 0.07, lp = 0, a = 1;
      for (var i = pre; i < n; i++) {
        if (!(i & 255)) a = 1 - Math.exp(-2 * Math.PI * (700 + 7800 * Math.pow(1 - i / n, 2.6)) / sr);
        lp += (rand() * 2 - 1 - lp) * a;
        d[i] = lp * Math.exp(-6.91 * (i - pre) / (sr * t60)) * Math.min(1, (i - pre) / rise);
      }
    }
    return buf;
  }
  var hallBuffer = null; // Lush only: leave the original engine reverb untouched.

  /* ----------------------------- Player ---------------------------- */
  function seat(pos, dest) {
    var ctx = GA.context();
    if (!ctx.createStereoPanner) return dest; // older WebViews: stereo tables still give width
    var pan = ctx.createStereoPanner();
    pan.pan.value = pos; pan.connect(dest);
    return pan;
  }
  // Per-player mix: seats -> section gain -> moving low-pass -> p.out -> (engine + extra reverb send)
  function rig(tr, p, t) {
    if (p.rig) return p.rig;
    var first = tr.span[0].sec, lp = V.bus(p, first.lp[0]), dyn = K.gain(first.dyn[0], lp);
    var ctx = GA.context(), hall = ctx.createConvolver();
    if (!hallBuffer) hallBuffer = hallImpulse(ctx, 4.2);
    hall.buffer = hallBuffer;
    var send = K.gain(tr.wet * 0.5, hall);
    // Wet and dry both return before the player fade and existing volume bus.
    lp.connect(send); hall.connect(p.out);
    p.lushCleanup = function () { send.disconnect(); hall.disconnect(); };
    lp.frequency.setValueAtTime(first.lp[0], t);
    dyn.gain.setValueAtTime(first.dyn[0], t);
    warmUp(tr.warm);
    p.rig = { lp: lp, dyn: dyn, C: dyn, L: seat(-0.38, dyn), R: seat(0.38, dyn) };
    return p.rig;
  }
  // Slow motion: per-bar ramps toward the section's targets with a drifting filter breath.
  function motion(tr, r, t, s, bar, sd, p) {
    if (s) return;
    var at = tr.span[bar % tr.span.length], sec = at.sec, x = at.x, end = t + sd * 16;
    var drift = 1 + 0.14 * Math.sin(bar * 0.61 + p.loop * 1.7) * Math.sin(bar * 0.23);
    r.lp.frequency.linearRampToValueAtTime((sec.lp[0] + (sec.lp[1] - sec.lp[0]) * x) * drift, end);
    r.dyn.gain.linearRampToValueAtTime(sec.dyn[0] + (sec.dyn[1] - sec.dyn[0]) * x, end);
  }
  // Pitch classes of the chord placed upward from `lo`, picked by index in the chord's own order
  function voicing(ch, lo, picks) {
    var out = [], n = ch.notes;
    for (var i = 0; i < picks.length; i++) {
      var note = n[Math.min(picks[i], n.length - 1)];
      out.push(lo + (((note - lo) % 12) + 12) % 12);
    }
    return out;
  }
  // Bars this chord lasts, or 0 when the previous bar already started it.
  function chordBars(tr, bar) {
    var len = tr.prog.length, b = bar % len, same = function (u, w) { return tr.prog[u][0] === tr.prog[w][0] && tr.prog[u][1] === tr.prog[w][1]; };
    if (b && same(b, b - 1)) return 0;
    var n = 1;
    while (b + n < len && same(b, b + n)) n++;
    return n;
  }
  function harmony(tr, t, bar, ch, sd, r, o) {
    var bars = chordBars(tr, bar);
    if (!bars) return;
    var sec = tr.span[bar % tr.span.length].sec, dur = bars * 16 * sd, i, pad = voicing(ch, o.padLo, o.pad);
    for (i = 0; i < pad.length; i++) tone('warm', t + i * 0.12, pad[i], o.padV, dur, o.att, o.rel, i % 2 ? r.R : r.L);
    tone('warm', t, ch.bass, o.bassV, dur, o.att * 0.7, o.rel, r.C);
    if (sec.choir) choir(t + 0.6, voicing(ch, o.choirLo, o.voices), sec.choir, dur, o.att * 1.3, o.rel, r.C, sec.vowel);
  }
  function ripple(t, notes, gap, v, out) {
    for (var i = 0; i < notes.length; i++) harp(t + i * gap + K.rnd(0, 0.018), notes[i], v * (1 - i * 0.07), out);
  }
  // Same degrees as the melody; a reply only ever plays in a bar the tune leaves empty
  function restBar(tr, bar) { return tr.mel[bar % tr.mel.length] === '........'; }

  // A form is sections of bars. span[] maps each bar to its section and progress through it.
  function track(def) {
    def.lush = true; def.swing = 0; def.prog = []; def.mel = []; def.span = [];
    def.form.forEach(function (sec) {
      for (var i = 0; i < sec.prog.length; i++) {
        def.prog.push(sec.prog[i]); def.mel.push(sec.mel[i]);
        def.span.push({ sec: sec, i: i, x: (i + 1) / sec.prog.length });
      }
    });
    return def;
  }
  function rep(chord, n) { var a = []; while (n--) a.push(chord); return a; }
  function pickOf(list, i) { return list[((i % list.length) + list.length) % list.length]; }

  /* ----------------------------- Scores ---------------------------- */
  var TRACKS = [];

  // 蝶梦: Eb, floating major 9ths; tune passes from piano to voice to harp over three loops.
  var DREAM_REPLY = [[5, 6, 8], [3, 5, 6], [6, 8, 9], [5, 3, 2], [8, 6, 5]];
  TRACKS.push(track({ id: 'dreamy', name: '蝶梦', key: 63, bpm: 60, delay: 0.12, level: 1.38, wet: 1.24,
    warm: [['warm', 45], ['oo', 62], ['oo', 72], ['ah', 72], ['felt', 66], ['felt', 72], ['harp', 76], ['harp', 83]],
    form: [
      { lp: [1500, 2300], dyn: [0.72, 0.95], choir: 0.018, vowel: 'oo',
        prog: rep([0, 'maj9'], 2).concat(rep([5, 'maj9'], 2), rep([9, 'm9'], 2), rep([7, 'sus'], 2)),
        mel: ['........', '3---5---', '6-------', '........', '5---3---', '2-------', '........', '........'] },
      { lp: [2200, 3000], dyn: [0.95, 1.12], choir: 0.026, vowel: 'oo',
        prog: rep([5, 'maj9'], 2).concat(rep([4, 'm7'], 2), rep([9, 'm9'], 2), [[2, 'm9'], [7, 'sus']]),
        mel: ['........', '6---8---', '7---5---', '........', '3---5---', '6---5---', '3-------', '........'] },
      { lp: [2900, 2100], dyn: [1.15, 0.8], choir: 0.032, vowel: 'ah',
        prog: rep([5, 'add9'], 2).concat(rep([0, 'maj9'], 2), rep([2, 'm9'], 2), rep([7, 'sus'], 2)),
        mel: ['8-------', '9---8---', '6---5---', '........', '5---6---', '8---6---', '5-------', '........'] }
    ],
    play: function (t, s, bar, ch, sd, p) {
      var r = rig(this, p, t), L = p.loop, sec = this.span[bar % this.span.length];
      motion(this, r, t, s, bar, sd, p);
      if (s === 0) harmony(this, t, bar, ch, sd, r, { padLo: 51, pad: [0, 1, 2, 3], padV: 0.075, bassV: 0.085, att: 2.6, rel: 4.5, choirLo: 67, voices: [1, 3, 4] });
      // Wings: a small rising ripple, left then right, on alternate bars
      if (s === 8 && bar % 2 === 1) ripple(t, voicing(ch, 72 + (L % 2) * 5, [0, 1, 2, 3, 4]), sd * (sec.sec.choir > 0.03 ? 0.75 : 1), 0.1, bar % 4 === 1 ? r.L : r.R);
      if (s === 4 && bar % 4 === 2) felt(t, voicing(ch, 60, [2])[0], 0.07, r.R);
      var mn = K.melNote(this, bar, s, sd);
      if (mn) {
        if (L % 3 === 1 && sec.sec.vowel === 'oo') vocalise(t, mn.m + 12, 0.075, mn.dur, r.C, 'oo');
        else if (L % 3 === 2) { harp(t, mn.m + 12, 0.2, r.C); felt(t + 0.03, mn.m, 0.08, r.C); }
        else felt(t + K.rnd(0, 0.02), mn.m + 12, 0.2, r.C);
      }
      if (s === 4 && restBar(this, bar)) {
        var reply = pickOf(DREAM_REPLY, bar + L);
        for (var i = 0; i < reply.length; i++) felt(t + i * sd * 3 + K.rnd(0, 0.03), K.degree(this.key, reply[i]) + 12, 0.1 - i * 0.015, i % 2 ? r.L : r.R);
      }
    } }));

  // 小猫午后: G, slower and warmer; fingerpicked harp under a close felt piano, no percussion.
  var COZY_PICK = [[0, 2, 1, 3, 2, 1, 3, 2], [0, 1, 2, 3, 2, 3, 1, 2], [0, 2, 3, 1, 2, 3, 2, 1]];
  TRACKS.push(track({ id: 'cozy', name: '小猫午后', key: 67, bpm: 72, delay: 0.1, level: 1.26, wet: 0.72,
    warm: [['warm', 45], ['felt', 54], ['felt', 60], ['felt', 66], ['harp', 62], ['harp', 69], ['oo', 62]],
    form: [
      { lp: [1700, 2200], dyn: [0.8, 0.95], picks: 0.075,
        prog: [[0, 'maj7'], [9, 'm9'], [5, 'maj9'], [7, 'sus'], [0, 'add9'], [9, 'm7'], [2, 'm9'], [7, 'sus']],
        mel: ['3-5-6---', '5---3---', '1-2-3---', '2-------', '3-5-8---', '7-6-5---', '6-5-4-2-', '5-------'] },
      { lp: [2100, 2500], dyn: [0.92, 1.06], picks: 0.085, choir: 0.018, vowel: 'oo',
        prog: [[5, 'maj9'], [4, 'm7'], [9, 'm9'], [2, 'm7'], [5, 'maj7'], [4, 'm7'], [2, 'm9'], [7, 'sus']],
        mel: ['6---5-3-', '5-------', '3-2-1---', '2---....', '6-8-6---', '5-3-2---', '3-------', '2---5---'] },
      { lp: [2500, 1800], dyn: [1.05, 0.78], picks: 0.06, choir: 0.012, vowel: 'oo',
        prog: [[9, 'm9'], [5, 'maj9'], [0, 'add9'], [7, 'sus'], [9, 'm7'], [2, 'm9'], [5, 'six'], [7, 'sus']],
        mel: ['1---3-5-', '6---5---', '3-5-6-5-', '2-------', '1-3-2---', '6-5-3---', '5---6---', '5-------'] }
    ],
    play: function (t, s, bar, ch, sd, p) {
      var r = rig(this, p, t), L = p.loop, sec = this.span[bar % this.span.length].sec;
      motion(this, r, t, s, bar, sd, p);
      if (s === 0) harmony(this, t, bar, ch, sd, r, { padLo: 50, pad: [0, 1, 3], padV: 0.062, bassV: 0.1, att: 1.1, rel: 2.4, choirLo: 62, voices: [1, 2] });
      if (s % 2 === 0) {
        var pat = pickOf(COZY_PICK, Math.floor(bar / 8) + L), lo = voicing(ch, 55, [pat[s / 2]])[0];
        if (s || bar % 2) harp(t + K.rnd(0, 0.016), lo, sec.picks * (s % 4 ? 0.72 : 1), s % 8 < 4 ? r.L : r.R);
      }
      var mn = K.melNote(this, bar, s, sd);
      if (mn && !(L % 3 === 2 && bar % 2 && s > 4)) {
        if (L % 2) harp(t, mn.m, 0.19, r.C);
        else felt(t + K.rnd(0, 0.014), mn.m - 12 + (sec.choir ? 12 : 0), 0.24, r.C);
      }
    } }));

  // 晨风来信: D, opens from mist to light: the filter climbs across the whole form, then settles back.
  // Bells stay high and faint so they never sound like the chapter's puzzle notes.
  TRACKS.push(track({ id: 'morningchimes', name: '晨风来信', key: 62, bpm: 66, delay: 0.14, level: 1.7, wet: 1.12,
    warm: [['warm', 45], ['oo', 62], ['ah', 72], ['felt', 66], ['felt', 72], ['harp', 69], ['harp', 76], ['harp', 83]],
    form: [
      { lp: [1050, 1800], dyn: [0.66, 0.86], choir: 0.012, vowel: 'oo', mist: 0.016, up: 0,
        prog: rep([0, 'add9'], 2).concat(rep([5, 'add9'], 2), rep([9, 'm9'], 2), rep([7, 'sus'], 2)),
        mel: ['........', '........', '5---6---', '........', '8-------', '........', '6---5---', '........'] },
      { lp: [1800, 2900], dyn: [0.86, 1.02], choir: 0.018, vowel: 'oo', mist: 0.008, up: 1,
        prog: [[5, 'maj9'], [7, 'sus'], [9, 'm9'], [4, 'm7'], [5, 'maj9'], [0, 'add9'], [2, 'm9'], [7, 'sus']],
        mel: ['3---5---', '6---5---', '8---6---', '5-------', '6-8-9---', '8---6---', '5---3---', '2-------'] },
      { lp: [2900, 4100], dyn: [1.02, 1.14], choir: 0.03, vowel: 'ah', mist: 0, up: 2,
        prog: [[0, 'add9'], [7, 'sus'], [9, 'm7'], [5, 'maj9'], [2, 'm9'], [5, 'add9'], [7, 'sus'], [0, 'add9']],
        mel: ['8---9---', '8---6---', '5---6---', '8-------', '9---8---', '6---5---', '6---8---', '5-------'] }
    ],
    play: function (t, s, bar, ch, sd, p) {
      var r = rig(this, p, t), L = p.loop, sec = this.span[bar % this.span.length].sec;
      motion(this, r, t, s, bar, sd, p);
      if (s === 0) harmony(this, t, bar, ch, sd, r, { padLo: 50, pad: [0, 2, 3], padV: 0.066, bassV: 0.075, att: 2.2, rel: 3.6, choirLo: 66, voices: [0, 2, 3] });
      if (s === 0 && sec.mist && bar % 2 === 0) K.brush(t, sec.mist, sd * 30, 1100, r.C, 'lowpass');
      // Light arriving: harp figures climb as the sections open up
      if (s === 8 && (sec.up || bar % 2)) {
        var fig = voicing(ch, 69 + sec.up * 3, sec.up > 1 ? [0, 1, 2, 3, 4] : [0, 2, 3]);
        fig.sort(function (a, b) { return a - b; });
        ripple(t, fig, sd * (sec.up > 1 ? 1 : 1.5), 0.085 + sec.up * 0.012, bar % 2 ? r.R : r.L);
      }
      var mn = K.melNote(this, bar, s, sd);
      if (mn) {
        if (L % 2 && !sec.up) harp(t, mn.m + 12, 0.16, r.C);
        else if (L % 3 === 2 && sec.up === 1) vocalise(t, mn.m + 12, 0.06, mn.dur, r.C, 'oo');
        else felt(t + K.rnd(0, 0.018), mn.m + 12, 0.17, r.C);
        if (sec.up > 1) harp(t + 0.05, mn.m + 24, 0.05, r.R);
      }
      if (s === 12 && sec.up && (bar + L) % 2 === 0) K.musicBox(t, K.degree(this.key, pickOf([1, 2, 3, 5, 6], bar + L)) + 36, 0.012, r.L);
    } }));

  /* ------------------------------ Setup ---------------------------- */
  function byId(id) {
    for (var i = 0; i < M.tracks.length; i++) if (M.tracks[i].id === id) return M.tracks[i];
    return null;
  }
  // The originals stay reachable under <id>_classic; the new scores take over their ids.
  TRACKS.forEach(function (def) {
    var old = byId(def.id);
    if (old) { old.id += '_classic'; old.name += '·经典'; }
    M.register(def);
  });
  var start = byId(M.theme[M.level()]);
  if (start) GA.setTrack(start.index);

  V.felt = felt; V.harp = harp; V.choir = choir; V.vocalise = vocalise; V.padTone = tone;

  var style = 'lush';
  window.__musicLush = {
    live: function () { return live; },
    style: function () { return style; },
    // Session-only A/B; nothing here touches a save.
    setStyle: function (next) {
      style = next === 'classic' ? 'classic' : 'lush';
      [1, 2, 4].forEach(function (level, i) { M.theme[level] = TRACKS[i].id + (style === 'classic' ? '_classic' : ''); });
      // A style change must not restart, rename or replace either MP3 chapter.
      if (M.level() === 3 || M.level() === 5) return true;
      return M.play(M.theme[M.level()]);
    }
  };
})(window);
