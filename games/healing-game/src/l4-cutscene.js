/* l4-cutscene.js: level-4 clear cutscene (the morning wind carries the song home).
 * A seekable 50s timeline shown when the last note of the third melody is played, before the #chimeEnding card; it
 * replaces the old 3.2s finale. Every visual is a pure function of the timeline second, so seek(t) reproduces any
 * frame. Storyboard: docs/l4-cutscene-storyboard.md.
 * Same architecture as l3-cutscene.js: a pure model (camera, sky, sun, wind, chimes, notes, petals as numbers), a
 * three.js stage that poses display-only actors on the live island from that model, and a DOM layer (bars,
 * captions, title). This file never reads or writes a save; the caller's onContinue decides what happens afterwards. */
(function (root) {
  'use strict';
  var DURATION = 50;
  // Clock times are seconds from play(); beats are contiguous and end at DURATION.
  var BEATS = [
    { id: 'predawn', t0: 0, t1: 10, caption: '天还没亮，风先醒了' },
    { id: 'chimes', t0: 10, t1: 21, caption: '晨光漫过山谷，风铃一枚枚醒来' },
    { id: 'notes', t0: 21, t1: 32, caption: '音符和花瓣，乘上了晨风' },
    { id: 'send', t0: 32, t1: 43.5, caption: '风把早安，送过了云海' },
    { id: 'title', t0: 43.5, t1: 50, caption: '' }
  ];
  var TITLE_AT = 44, TITLE_FADE = 3, CONTINUE_GUARD_MS = 600;
  var TITLE = '第四关 · 完成', SUBTITLE = '暮色浮岛', CONTINUE = '轻触继续', SKIP = '跳过';

  var doc = root.document || null;
  var clock = function () {
    return root.performance && root.performance.now ? root.performance.now() : Date.now();
  };
  // idle -> playing <-> paused -> ended -> closed
  var state = 'idle', base = 0, anchor = 0, done = false, endedAt = 0;
  var opts = {}, enabled = true, muted = false, scored = false, ready = !doc;
  var el = null, raf = 0, ticker = 0, showClock = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(u) { return u * u * (3 - 2 * u); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function query(name) {
    var s = root.location && root.location.search ? String(root.location.search) : '';
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(s);
    return m ? m[1] : null;
  }

  function reach() { state = 'ended'; base = DURATION; done = true; endedAt = clock(); }
  function time() {
    if (state !== 'playing') return base;
    var t = base + (clock() - anchor) / 1000;
    if (t >= DURATION) { reach(); return DURATION; }
    return t < 0 ? 0 : t;
  }
  function beatAt(t) {
    for (var i = BEATS.length - 1; i > 0; i--) if (t >= BEATS[i].t0) return BEATS[i];
    return BEATS[0];
  }

  /* ------------------------------ Model ------------------------------
   * Island-local metres; y is height above the grass. Nothing here keeps state between calls. */
  var TAU = 6.28318530718, soft = 1; // soft = 0.3 under prefers-reduced-motion: same story, smaller movement
  /* Wind: a primary wave along the wind direction (0.86, 0.5 in x/z), a slower cross wave and a fine ripple, under a
   * slow gust envelope (the layout used by stylised-grass shaders). The grass shader evaluates the same formula in GLSL. */
  var WX = 0.86, WZ = 0.5;
  function windAt(x, z, t) {
    var a = x * WX + z * WZ, b = -x * WZ + z * WX;
    return (0.6 + 0.4 * Math.sin(t * 0.31 + 0.7 + a * 0.12)) * (0.6 * Math.sin(a * 1.2 - t * 1.5) + 0.25 * Math.sin(b * 2.0 - t * 1.1 + a * 0.6) + 0.15 * Math.sin(a * 3.3 - t * 2.9));
  }
  // Sky: cool blue-grey-rose before dawn -> peach-gold sunrise.
  function skyAt(t) { var w = ease(ramp(t, 4, 30)); return { cool: 1 - w, warm: w, glow: ease(ramp(t, 1, 14)) }; }
  // The sun comes up out of the cloud sea a little left of the lens axis and stays low (inside a narrow portrait frame).
  function sunAt(t) { return { x: -0.17, y: -0.035 + 0.215 * ease(ramp(t, 1, 42)), z: -1 }; }
  // The edge of the first sunlight crossing the valley, far side (z < 0) to near side: grass with z < front is lit.
  function frontAt(t) { return lerp(-7, 7, ease(ramp(t, 9, 20.5))); }
  /* The six wind chimes stand where the game's do, in the six tone colours. The cue is a fixed strike table on a 0.9 s
   * beat grid: they wake one by one in the second beat (a first clear strike each, two beats apart), then play the
   * last song of the level, 把早安送回家 = chimes [0, 3, 2, 5] one beat apart, answered five beats later by all six
   * together (a soft roll); the phrase comes three times, and all six ring once more under the title. Every pose is
   * closed-form: a sum over the strikes at or before t (a damped pendulum for the swing, a decaying pulse for the glow). */
  var CHIMES = [[-2.8, 1.2], [-2.4, -1.6], [0, -2.9], [2.5, -1.5], [2.9, 1.2], [0, 2.8]];
  var TONES = [['sprout', 0xa4dfb6], ['dewbell', 0x9bdce6], ['feather', 0xf5d794], ['breeze', 0xf4b3bc], ['cloudsong', 0xc7b7ef], ['home', 0xf0e4b8]];
  var BEAT = 0.9, CHIME_T = 11.7, CHIME_STEP = 2 * BEAT, SONG = [0, 3, 2, 5], PHRASES = [21.6, 29.7, 37.8], TOGETHER = 5 * BEAT, ROLL = 0.07, LAST_T = 45.9, CHIME_SCALE = 1.3, CHIME_WIDE = 1.34;
  var STRIKES = [], BY = [[], [], [], [], [], []]; // kind 0 = waking, 1 = a song note, 2 = all six together
  (function () {
    var i, k;
    function hit(t, c, s, kind) { var e = { t: +t.toFixed(3), c: c, s: s, k: kind }; STRIKES.push(e); BY[c].push(e); }
    for (i = 0; i < 6; i++) hit(CHIME_T + i * CHIME_STEP, i, 1, 0);
    for (k = 0; k < PHRASES.length; k++) {
      for (i = 0; i < SONG.length; i++) hit(PHRASES[k] + i * BEAT, SONG[i], 1, 1);
      for (i = 0; i < 6; i++) hit(PHRASES[k] + TOGETHER + i * ROLL, i, 0.7, 2);
    }
    for (i = 0; i < 6; i++) hit(LAST_T + i * ROLL, i, 0.6, 2);
  })();
  var SWING_W = 5.4, SWING_AMP = 0.36; // a 1.16 s pendulum, about 20 degrees on a full strike
  function chimeAt(i, t, out) {
    out = out || {};
    var L = BY[i], first = L[0].t, pulse = 0, sw = 0, tail = 0, last = -1, power = 0, k, a, p, C = CHIMES[i], w = windAt(C[0], C[1], t);
    for (k = 0; k < L.length; k++) {
      a = t - L[k].t; if (a < 0) break;
      last = L[k].t; power = L[k].s;
      p = L[k].s * Math.exp(-a * 1.3); if (p > pulse) pulse = p;
      sw += L[k].s * SWING_AMP * Math.exp(-a * 0.85) * Math.sin(a * SWING_W);
      if (a > 0.18) tail += L[k].s * 0.5 * Math.exp(-a * 0.6) * Math.sin((a - 0.18) * SWING_W); // the paper tail follows a little late and longer
    }
    out.wake = ease(ramp(t, first - 0.5, first + 1.2));
    out.pulse = pulse;
    // Struck: the pendulum. Always: the wind leans it, and a small idle sway once awake.
    out.swing = soft * (sw + 0.07 * w + (0.012 + 0.028 * out.wake) * Math.sin(t * 1.6 + i));
    out.sway = soft * 0.06 * windAt(C[0] + 1.3, C[1], t); // across the bar, so it is not a flat swing
    out.tail = soft * (tail + 0.24 * windAt(C[0] + 0.5, C[1] + 0.3, t) + 0.09 * Math.sin(t * 3.1 + i * 2.1));
    out.glow = Math.min(1, 0.1 + 0.2 * out.wake + 0.7 * pulse + 0.16 * ease(ramp(t, 28, 40)));
    // In the wide sunrise shots the chimes grow a little (slowly, with the crane up), so they still read on a phone.
    out.scale = CHIME_SCALE * (1 + (CHIME_WIDE - 1) * ease(ramp(t, 27, 41)));
    out.strike = last; out.power = power;
    return out;
  }
  function hsh(j, k) { var s = Math.sin(j * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }
  // How far the wind carries things: further in the fourth beat, when the song goes out across the cloud sea.
  function reachAt(t) { return 1 + 0.9 * ease(ramp(t, 29, 38)); }
  /* Notes: every strike sends up its own (two for a song note, one otherwise), in the chime's colour. A note pops out
   * of the shell, lifts, then rides the wind downwind (right and towards the lens, away from the sun) on a closed-form
   * flutter, out past the island's edge over the cloud sea, and fades. One life each; a pure function of t. Each
   * note also leaves two small sparks behind it: the same path, a moment earlier. */
  var NOTE_LIST = [], PETAL_LIST = [], AMBIENT = 18, SPARKS = 2, SPARK_LAG = 0.3;
  (function () {
    for (var e = 0; e < STRIKES.length; e++) for (var m = 0, n = STRIKES[e].k === 1 ? 2 : 1; m < n; m++) {
      NOTE_LIST.push({ t: STRIKES[e].t + 0.04 + 0.3 * m, c: STRIKES[e].c, e: e });
      PETAL_LIST.push({ t: STRIKES[e].t + 0.1 + 0.35 * m, c: STRIKES[e].c, e: e });
    }
  })();
  var NOTES = NOTE_LIST.length, PETALS = AMBIENT + PETAL_LIST.length, NOTE_Y = 1.75;
  function noteAt(j, t, out) {
    out = out || {};
    var N = NOTE_LIST[j], C = CHIMES[N.c], age = t - N.t, life = 8.5 + 1.5 * hsh(j, 5), on = age >= 0 && age <= life, u = clamp(age / life, 0, 1);
    var d = (5.5 + 3 * hsh(j, 2)) * reachAt(N.t + 4) * (0.22 * u + 0.78 * u * u), free = ramp(u, 0, 0.18);
    var sw = (hsh(j, 6) - 0.5) * 2.6 * u + soft * free * (0.45 * Math.sin(age * 1.1 + j * 1.7) + 0.2 * Math.sin(age * 2.3 + j * 0.9));
    d += soft * free * 0.45 * windAt(C[0], C[1], t - 0.6); // carried a little further on each gust
    out.x = C[0] + WX * d - WZ * sw; out.z = C[1] + WZ * d + WX * sw;
    out.y = NOTE_Y + (2.2 + 2.0 * hsh(j, 3)) * ease(ramp(u, 0, 0.7)) + soft * free * 0.22 * Math.sin(age * 1.5 + j * 2.3);
    out.alpha = on ? ramp(u, 0, 0.04) * (1 - ramp(u, 0.82, 1)) : 0;
    out.size = (0.52 + 0.16 * hsh(j, 4)) * (0.55 + 0.45 * ease(ramp(age, 0, 0.6)));
    out.tilt = soft * 0.35 * Math.sin(age * 0.9 + j);
    out.tone = N.c; out.glyph = j % 3 === 1 ? 1 : 0; out.born = N.t;
    return out;
  }
  /* Petals: the first eighteen loosen from the meadow on their own (a few on the first wind before dawn, the rest once
   * the chimes ring, again and again); the others are shaken loose round a chime by each strike. Each lifts and
   * tumbles downwind: drift along the wind + a two-sine flutter across it + a tumble (spin in the picture plane, flip
   * through it), the stateless layout of shader petal systems. Closed-form in t. */
  var PETAL_T = 19.5;
  function petalAt(j, t, out) {
    out = out || {};
    var ha = hsh(j, 7) * TAU, life = 7 + 3 * hsh(j, 9), age, u, x0, z0, on, b, kick = 0;
    if (j < AMBIENT) {
      var hr = 0.8 + 3.6 * Math.sqrt(hsh(j, 8));
      b = (j % 3 === 0 ? 3 : PETAL_T) + 8 * hsh(j, 10); age = t - b; on = age >= 0; u = on ? (age % life) / life : 0;
      x0 = Math.cos(ha) * hr; z0 = Math.sin(ha) * hr;
    } else {
      var P = PETAL_LIST[j - AMBIENT], C = CHIMES[P.c];
      b = P.t + 0.4 * hsh(j, 10); age = t - b; on = age >= 0 && age <= life; u = clamp(age / life, 0, 1);
      kick = 0.5 + 0.6 * hsh(j, 8); // shaken loose: a short hop outwards from the foot of the chime
      x0 = C[0] + Math.cos(ha) * kick * (0.6 + 0.9 * ease(ramp(u, 0, 0.12))); z0 = C[1] + Math.sin(ha) * kick * (0.6 + 0.9 * ease(ramp(u, 0, 0.12)));
    }
    var d = (6 + 5 * hsh(j, 11)) * reachAt(b + 3) * Math.pow(u, 1.35), sw = soft * (0.35 * Math.sin(t * 1.3 + j * 2.1) + 0.15 * Math.sin(t * 2.9 + j)) * ramp(u, 0, 0.1);
    out.x = x0 + WX * d - WZ * sw; out.z = z0 + WZ * d + WX * sw;
    out.y = 0.34 + (1.2 + 2.6 * hsh(j, 12)) * ease(ramp(u, 0, 0.6)) + soft * 0.2 * Math.sin(t * 1.7 + j * 1.3) * ramp(u, 0, 0.1);
    out.alpha = on ? ramp(u, 0, 0.06) * (1 - ramp(u, 0.82, 1)) : 0;
    out.spin = j * 1.9 + soft * t * (1.2 + 1.8 * hsh(j, 13)); out.flip = j * 0.7 + soft * t * (2.0 + 2.2 * hsh(j, 15));
    out.size = 0.26 + 0.12 * hsh(j, 14); out.kind = j % 3;
    return out;
  }
  function listAt(fn, n, t) { var out = []; for (var j = 0; j < n; j++) out.push(fn(j, t, {})); return out; }
  /* Camera keys: look-at point, azimuth th (PI/2 = the gameplay side), polar phi, half-width w that
   * must stay in frame, and lift = how far above the look-at the frame centre sits (in half-screens). */
  // Wide pre-dawn shot, a glide down to the waking chimes, a crane up after the notes, a drift downwind, a wide sunrise.
  var CAM = [
    { t: 0, x: 0, y: 1.6, z: 0, th: 1.36, phi: 1.45, w: 9.0, lift: 0.3 },
    { t: 10, x: 0, y: 1.3, z: 0.6, th: 1.5, phi: 1.38, w: 6.8, lift: 0.16 },
    { t: 15.5, x: 0.2, y: 1.3, z: 0.6, th: 1.63, phi: 1.35, w: 5.2, lift: 0.1 },
    { t: 21, x: 0.2, y: 1.6, z: 0.4, th: 1.6, phi: 1.38, w: 5.4, lift: 0.12 },
    { t: 27, x: 0.8, y: 2.6, z: 0.4, th: 1.52, phi: 1.47, w: 6.4, lift: 0.18 },
    { t: 32, x: 1.6, y: 2.2, z: 1.0, th: 1.45, phi: 1.45, w: 6.8, lift: 0.16 },
    { t: 40, x: 2.8, y: 2.0, z: 0.4, th: 1.38, phi: 1.46, w: 7.6, lift: 0.2 },
    { t: 44, x: 2.0, y: 2.4, z: -0.8, th: 1.4, phi: 1.48, w: 8.3, lift: 0.25 },
    { t: 50, x: 1.0, y: 2.9, z: -2, th: 1.43, phi: 1.5, w: 9.0, lift: 0.29 }
  ];
  var CAM_KEYS = ['x', 'y', 'z', 'th', 'phi', 'w', 'lift'];
  // One continuous move: a cubic Hermite through the keys (C1, so the camera never stops and restarts at a key).
  function camSlope(i, key) {
    if (i <= 0 || i >= CAM.length - 1) return 0;
    var a = CAM[i - 1], b = CAM[i], c = CAM[i + 1], d0 = (b[key] - a[key]) / (b.t - a.t), d1 = (c[key] - b[key]) / (c.t - b.t);
    if (d0 * d1 <= 0) return 0;
    var m = (c[key] - a[key]) / (c.t - a.t), lim = 3 * Math.min(Math.abs(d0), Math.abs(d1));
    return Math.abs(m) > lim ? (m < 0 ? -lim : lim) : m;
  }
  function cameraAt(t) {
    var i = 0;
    while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
    var a = CAM[i], b = CAM[i + 1], h = b.t - a.t, u = ramp(t, a.t, b.t), u2 = u * u, u3 = u2 * u, out = {};
    var h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = 3 * u2 - 2 * u3, h11 = u3 - u2;
    for (var k = 0; k < CAM_KEYS.length; k++) {
      var key = CAM_KEYS[k];
      out[key] = h00 * a[key] + h10 * h * camSlope(i, key) + h01 * b[key] + h11 * h * camSlope(i + 1, key);
    }
    return out;
  }
  // Everything the renderer needs, derived from t alone.
  function frame(t, lite) {
    var b = beatAt(t), local = t - b.t0, len = b.t1 - b.t0, sk = skyAt(t);
    return {
      t: t, beat: b.id, caption: b.caption,
      captionAlpha: b.caption ? Math.min(ramp(local, 0.4, 1.8), 1 - ramp(local, len - 1.4, len - 0.2)) : 0,
      look: 'painterly-dawn', sky: sk, sun: sunAt(t), wind: windAt(0, 0, t), front: frontAt(t),
      veil: 0.07 - 0.04 * sk.warm, light: 0.6 + 0.4 * sk.warm,
      chimes: listAt(chimeAt, 6, t),
      bars: ease(ramp(t, 0, 2.5)),
      title: ease(ramp(t, TITLE_AT, TITLE_AT + TITLE_FADE)),
      canContinue: t >= DURATION,
      notes: lite ? null : listAt(noteAt, NOTES, t), petals: lite ? null : listAt(petalAt, PETALS, t), camera: cameraAt(t)
    };
  }

  /* ------------------------------ Stage ------------------------------
   * Display-only actors on the live island. The game's own level-4 chimes (and HUD, dock, sky) are hidden and frozen
   * while it is up (journey.js checks staged()); nothing here feeds back into rewards or saves. */
  var H = null, T = null, st = null, staged = false, kept = null;
  var PAL = {
    cool: { top: 0x2f3d66, mid: 0x6a7494, hor: 0xc79aa4, low: 0x6e7896, lit: 0xdccfd8, shade: 0x626a8c, key: 0xa8b0d0, keyI: 0.5, hemiA: 0xa9b4d6, hemiB: 0x5a5f78, hemiI: 0.76, grass: [0.6, 0.72, 0.88], fog: 0x8088a6 },
    warm: { top: 0x74a6d6, mid: 0xf4cdb0, hor: 0xffd292, low: 0xdc9c8a, lit: 0xfff0d2, shade: 0xc98c96, key: 0xffd096, keyI: 0.6, hemiA: 0xffe2b4, hemiB: 0x8e9a62, hemiI: 0.6, grass: [0.9, 0.9, 0.6], fog: 0xf0c6a6 }
  };
  var SUN_COL = 0xffc888, SUN_DISC = 0.064, SUN_KEEP = 0.095, MAX_PR = 1.5; // sines of the disc's angular radius and of the angle kept clear round it
  var ramp4 = null, toons = {}, painted = [], tmpB = null;
  function sprite(map, color, additive) {
    var m = new T.SpriteMaterial({ map: map, color: color, transparent: true, opacity: 0, depthWrite: false, fog: false });
    if (additive) m.blending = T.AdditiveBlending;
    return new T.Sprite(m);
  }
  function part(geo, mat, parent, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); parent.add(m); return m; }
  // Flat gouache shading: the island's Lambert materials are swapped for a 4-step toon ramp while staged.
  function toonFor(m) {
    var out = toons[m.uuid];
    if (out) return out;
    out = new T.MeshToonMaterial({ color: m.color, map: m.map, gradientMap: ramp4, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity,
      transparent: m.transparent, opacity: m.opacity, side: m.side, vertexColors: m.vertexColors, alphaTest: m.alphaTest, depthWrite: m.depthWrite, fog: m.fog });
    toons[m.uuid] = out;
    return out;
  }
  function paint() {
    H.island.traverse(function (o) {
      if (!o.isMesh || o.isSkinnedMesh || o.l4cs || !o.material || o.material.length !== undefined || !o.material.isMeshLambertMaterial) return;
      o.l4cs = true; painted.push([o, o.material]); o.material = toonFor(o.material);
    });
  }
  function unpaint() {
    for (var i = 0; i < painted.length; i++) { painted[i][0].material = painted[i][1]; painted[i][0].l4cs = false; }
    painted = [];
  }
  var NOISE_GLSL = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }' +
    'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; } return s; }';
  var WIND_GLSL = 'float windF(vec2 p, float t){ float a = p.x * 0.86 + p.y * 0.5; float b = -p.x * 0.5 + p.y * 0.86;' +
    ' return (0.6 + 0.4 * sin(t * 0.31 + 0.7 + a * 0.12)) * (0.6 * sin(a * 1.2 - t * 1.5) + 0.25 * sin(b * 2.0 - t * 1.1 + a * 0.6) + 0.15 * sin(a * 3.3 - t * 2.9)); }';
  /* Three painted glyphs side by side: an eighth note, a beamed pair and a four-point music-box spark.
   * R = body, G = dark outline, B = soft glow behind (the Points shader composes them in the tone colour). */
  function noteTexture() {
    var c = doc.createElement('canvas'), g, k; c.width = 192; c.height = 64; g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 192, 64); g.globalCompositeOperation = 'lighter';
    for (k = 0; k < 3; k++) {
      var rg = g.createRadialGradient(32 + k * 64, 32, 2, 32 + k * 64, 32, 31); rg.addColorStop(0, 'rgba(0,0,255,1)'); rg.addColorStop(0.5, 'rgba(0,0,255,.62)'); rg.addColorStop(1, 'rgba(0,0,255,0)');
      g.fillStyle = rg; g.fillRect(k * 64, 0, 64, 64);
    }
    function head(x, y, grow) { g.save(); g.translate(x, y); g.rotate(-0.38); g.beginPath(); g.ellipse(0, 0, 8 + grow, 5.8 + grow, 0, 0, TAU); g.fill(); g.restore(); }
    function line(w, x0, y0, x1, y1) { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    function shapes(color, grow) {
      g.fillStyle = g.strokeStyle = color; g.lineJoin = g.lineCap = 'round';
      head(25, 44, grow); line(4 + grow * 2, 32, 42, 32, 15);
      g.lineWidth = 5 + grow * 2; g.beginPath(); g.moveTo(32, 16); g.quadraticCurveTo(44, 19, 43, 31); g.stroke();
      head(64 + 17, 46, grow - 1); head(64 + 41, 42, grow - 1);
      line(3.6 + grow * 2, 64 + 23, 44, 64 + 23, 20); line(3.6 + grow * 2, 64 + 47, 40, 64 + 47, 16); line(6 + grow * 2, 64 + 23, 20, 64 + 47, 16);
    }
    shapes('rgb(0,255,0)', 2.6); shapes('rgb(255,0,0)', 0);
    function star(color, grow) {
      g.fillStyle = color; g.beginPath();
      for (k = 0; k < 8; k++) { var a = k * TAU / 8, r = (k % 2 ? 5 : 19) + grow; g.lineTo(160 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
      g.closePath(); g.fill(); g.beginPath(); g.arc(160, 32, 7 + grow, 0, TAU); g.fill();
    }
    star('rgb(0,255,0)', 3); star('rgb(255,0,0)', 0);
    var tex = new T.CanvasTexture(c); tex.needsUpdate = true;
    return tex;
  }
  // The ring of light a struck chime throws: a soft annulus, drawn once and shared by the six.
  function ringTexture() {
    var c = doc.createElement('canvas'), g; c.width = c.height = 128; g = c.getContext('2d');
    var rg = g.createRadialGradient(64, 64, 20, 64, 64, 63);
    rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(0.55, 'rgba(255,255,255,.16)'); rg.addColorStop(0.8, 'rgba(255,255,255,1)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    var tex = new T.CanvasTexture(c); tex.needsUpdate = true;
    return tex;
  }
  function buildStage() {
    if (st || !H || !T) return !!st;
    var g = new T.Group(), i, k;
    g.visible = false; H.island.add(g);
    st = { g: g, chimes: [], v: new T.Vector3(), eye: new T.Vector3(), sunDir: new T.Vector3(), tick: 0, pose: {}, q: { x: 0, y: 0, z: 0, d: 9 }, sunMin: 9 };
    tmpB = new T.Color();
    ramp4 = new T.DataTexture(new Uint8Array([96, 160, 218, 255]), 4, 1, T.LuminanceFormat);
    ramp4.minFilter = ramp4.magFilter = T.NearestFilter; ramp4.generateMipmaps = false; ramp4.needsUpdate = true;
    /* Watercolour dawn sky in one shader: a washed gradient (blue-grey over rose before dawn, soft blue over peach and
     * gold at sunrise), a warm band along the horizon on the sun's side, a gold-peach sun with a wide halo, heaped
     * dawn clouds with warm rims, and below the horizon a drifting sea of clouds with a path of sunlight on it. */
    st.skyU = { uTime: { value: 0 }, uDawn: { value: 0 }, uGlow: { value: 0 }, uSun: { value: new T.Vector3() } };
    var names = ['Top', 'Mid', 'Hor', 'Low', 'Lit', 'Shade', 'SunCol'];
    for (i = 0; i < names.length; i++) st.skyU['u' + names[i]] = { value: new T.Color() };
    st.skyU.uSunCol.value.setHex(SUN_COL);
    st.sky = new T.Mesh(new T.SphereGeometry(110, 32, 20), new T.ShaderMaterial({ uniforms: st.skyU, side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uSunCol; uniform vec3 uSun;' +
        'uniform float uTime; uniform float uDawn; uniform float uGlow; varying vec3 vDir;' + NOISE_GLSL +
        'void main(){ vec3 d = normalize(vDir); float h = d.y; float wash = fbm(d.xz * 2.2 + d.y * 3.0 + 3.1); float hh = h + (wash - 0.5) * 0.2;' +
        ' vec3 col = mix(uHor, uMid, smoothstep(-0.04, 0.2, hh)); col = mix(col, uTop, smoothstep(0.1, 0.46, hh));' +
        ' col *= 0.93 + 0.14 * wash; float s = max(dot(d, uSun), 0.0); float up = smoothstep(-0.06, 0.04, uSun.y);' +
        // First light: a warm band low on the sun's side, there before the sun itself.
        ' float az = max(dot(normalize(d.xz), normalize(uSun.xz)), 0.0);' +
        ' col = mix(col, mix(vec3(1.0, 0.62, 0.5), vec3(1.0, 0.8, 0.52), uDawn), pow(az, 5.0) * smoothstep(0.36, 0.0, abs(hh)) * (0.2 + 0.5 * uGlow) * (1.0 - 0.45 * uDawn));' +
        // The sun: a gold core shading to peach at a soft brushed edge, inside a wide warm halo (mixed, never added to white).
        ' vec3 haloC = mix(vec3(1.0, 0.66, 0.46), vec3(1.0, 0.8, 0.5), uDawn);' +
        ' col = mix(col, haloC, clamp(pow(s, 7.0) * 0.3 + pow(s, 48.0) * 0.4 + pow(s, 320.0) * 0.34, 0.0, 0.9) * (0.3 + 0.7 * up));' +
        ' float disc = smoothstep(0.99795, 0.99862, s + (wash - 0.5) * 0.0003);' +
        ' vec3 sunPaint = mix(mix(vec3(1.0, 0.56, 0.34), vec3(1.0, 0.7, 0.38), uDawn), mix(vec3(1.0, 0.8, 0.52), vec3(1.0, 0.9, 0.6), uDawn), smoothstep(0.9982, 0.99985, s));' +
        ' col = mix(col, sunPaint, disc);' +
        // Dawn cumulus heaped along the horizon (lower under the sun so it stays clear), three flat tones and a warm rim.
        ' if (h > -0.3 && h < 0.62) { float a2 = atan(d.x, -d.z) + uTime * 0.006; vec2 p = vec2(a2 * 1.5, h * 3.4);' +
        '  float big = noise(vec2(a2 * 1.25 + 4.0, 2.5)); float mid = noise(vec2(a2 * 3.1 + 1.7, 9.5));' +
        '  float da = atan(d.x, -d.z) - atan(uSun.x, -uSun.z) + uTime * 0.0012; float bank = 0.17 * exp(-pow((da - 0.25) / 0.15, 2.0)) + 0.12 * exp(-pow((da + 0.27) / 0.13, 2.0)) + 0.2 * exp(-pow((da - 0.62) / 0.16, 2.0)); float top = -0.1 + 0.5 * smoothstep(0.25, 0.8, big) * smoothstep(0.3, 0.6, abs(da)) + bank * (0.75 + 0.5 * mid) + 0.06 * mid - 0.4 * smoothstep(0.972, 0.993, s); float bil = fbm(p * 2.6 + 4.0);' +
        '  float e = top - h + (bil - 0.5) * 0.3; float wet = 0.012 + 0.07 * smoothstep(0.35, 0.75, noise(p * 1.7 + 11.0)); float mask = smoothstep(0.0, wet, e);' +
        '  float rim = 1.0 - smoothstep(0.0, 0.11, e);' +
        '  float lite = rim * 0.85 + smoothstep(0.5, 0.75, bil) * 0.35 - smoothstep(0.2, 0.5, e) * 0.2;' +
        '  lite = clamp(lite, 0.0, 1.0) * 3.0 + 0.5; lite = clamp((floor(lite) + smoothstep(0.0, 0.35, fract(lite)) - 1.0) / 3.0, 0.0, 1.0);' +
        '  vec3 cloud = mix(uShade, uLit, lite) * (0.95 + 0.1 * wash);' +
        '  cloud = mix(cloud, mix(vec3(1.0, 0.7, 0.58), vec3(1.0, 0.84, 0.56), uDawn), rim * (0.3 + 0.45 * pow(az, 2.0)) * (0.35 + 0.65 * uGlow));' +
        '  col = mix(col, cloud, mask * 0.96); }' +
        // The sea of clouds: billows on a plane far below, drifting with the wind; lit tops, rose troughs, sunlight along the sun's bearing.
        ' if (hh < 0.03) { vec2 uv = d.xz / (0.1 - min(h, 0.0)) * 0.55 + vec2(uTime * 0.016, uTime * 0.009); float n = fbm(uv); float n2 = noise(uv * 2.7 + 5.0);' +
        '  float bill = smoothstep(0.34, 0.68, n); float tone = clamp(floor((bill * (0.55 + 0.45 * n2)) * 3.0 + 0.5) / 3.0, 0.0, 1.0);' +
        '  vec3 sea = mix(mix(uLow, uShade, 0.5), uLit, tone * 0.85) * (0.94 + 0.12 * wash);' +
        '  float path = pow(az, 12.0); sea = mix(sea, haloC, path * (0.12 + 0.4 * bill) * (0.35 + 0.65 * uGlow));' +
        '  sea = mix(sea, uHor, smoothstep(-0.2, 0.02, h) * 0.55); col = mix(col, sea, smoothstep(0.03, -0.05, hh)); }' +
        ' col *= 0.975 + 0.05 * hash(floor(gl_FragCoord.xy * 0.5)); gl_FragColor = vec4(col, 1.0); }' }));
    st.sky.renderOrder = -10; st.sky.frustumCulled = false; st.sky.visible = false; H.scene.add(st.sky);
    // Tall grass and wildflowers: instanced blades bent by the travelling wind wave; pale crests, gold where the sunlight has reached.
    var seed = 47, n = H.IS_MOBILE ? 1500 : 2400, off = [], dim = [], hoff = [], hdim = [];
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < n; i++) {
      var a = rnd() * TAU, r = Math.sqrt(rnd()) * 4.8, x = Math.cos(a) * r, z = Math.sin(a) * r;
      var hgt = 0.26 + 0.3 * rnd() + (r > 3.4 ? 0.22 * rnd() : 0), flower = i % 6 === 0, skipIt = false;
      if (H.POND && Math.sqrt((x - H.POND.x) * (x - H.POND.x) + (z - H.POND.z) * (z - H.POND.z)) < 1.45) continue;
      for (k = 0; k < 6; k++) if (Math.abs(x - CHIMES[k][0]) < 0.55 && Math.abs(z - CHIMES[k][1]) < 0.55) skipIt = true;
      if (skipIt) continue;
      if (flower) { hgt = 0.42 + 0.24 * rnd(); hoff.push(x, z, 0); hdim.push(hgt, 0.075 + 0.04 * rnd(), rnd()); }
      off.push(x, z, rnd() * TAU); dim.push(hgt, flower ? 0.022 : 0.05 + 0.03 * rnd(), rnd());
    }
    st.grassU = { uTime: { value: 0 }, uSoft: { value: soft }, uTopY: { value: H.TOP_Y }, uLight: { value: new T.Vector3(1, 1, 1) }, uFront: { value: -7 },
      uRoot: { value: new T.Color(0x4c9a58) }, uTip: { value: new T.Color(0xb2d870) } };
    function field(basePos, index, o, d, head) {
      var geo = new T.InstancedBufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(basePos, 3)); geo.setIndex(index);
      geo.setAttribute('aOff', new T.InstancedBufferAttribute(new Float32Array(o), 3)); geo.setAttribute('aDim', new T.InstancedBufferAttribute(new Float32Array(d), 3));
      geo.instanceCount = o.length / 3;
      var mesh = new T.Mesh(geo, new T.ShaderMaterial({ uniforms: st.grassU, side: T.DoubleSide, defines: head ? { HEAD: 1 } : {},
        vertexShader: 'attribute vec3 aOff; attribute vec3 aDim; uniform float uTime; uniform float uSoft; uniform float uTopY; uniform float uFront; varying float vH; varying float vW; varying float vR; varying float vWarm;' + WIND_GLSL +
          'void main(){ float w = windF(aOff.xy, uTime); float lean = 0.24 + 0.58 * uSoft * w;\n#ifdef HEAD\n float h = 1.0; vec3 p = vec3(position.x, (1.0 - length(position.xy)) * 0.45, position.y) * aDim.y; p.y += aDim.x;\n' +
          '#else\n float h = position.y; float px = position.x * aDim.y * (1.0 - h * 0.82); vec3 p = vec3(px * cos(aOff.z), h * aDim.x, px * sin(aOff.z));\n#endif\n' +
          ' float k = lean * h * h * aDim.x; p.x += 0.86 * k; p.z += 0.5 * k; p.y -= 0.4 * lean * lean * h * h * aDim.x; vH = h; vW = w; vR = aDim.z;' +
          ' vWarm = smoothstep(uFront + 1.3, uFront - 1.3, aOff.y + (aDim.z - 0.5) * 0.8);' +
          ' gl_Position = projectionMatrix * modelViewMatrix * vec4(aOff.x + p.x, uTopY + p.y, aOff.y + p.z, 1.0); }',
        fragmentShader: 'uniform vec3 uRoot; uniform vec3 uTip; uniform vec3 uLight; varying float vH; varying float vW; varying float vR; varying float vWarm;' +
          'void main(){\n#ifdef HEAD\n vec3 col = vR < 0.3 ? vec3(1.0, 0.97, 0.9) : vR < 0.55 ? vec3(1.0, 0.72, 0.8) : vR < 0.8 ? vec3(1.0, 0.86, 0.46) : vec3(0.8, 0.74, 1.0); col *= mix(uLight, vec3(1.0), 0.35);\n' +
          '#else\n vec3 col = mix(uRoot, uTip, clamp(floor(vH * 3.0 + vR * 0.7) / 3.0, 0.0, 1.0)) * (0.92 + 0.16 * vR) * uLight; col += vec3(0.14, 0.17, 0.08) * smoothstep(0.25, 0.7, vW) * vH;\n#endif\n' +
          ' col += vec3(0.3, 0.17, 0.0) * vWarm * (0.08 + 0.3 * vH); gl_FragColor = vec4(col, 1.0); }' }));
      mesh.frustumCulled = false; mesh.l4cs = true; g.add(mesh);
      return mesh;
    }
    st.grass = field([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.34, 0, 0.5, 0.34, 0, -0.5, 0.67, 0, 0.5, 0.67, 0, 0, 1, 0], [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6], off, dim, false);
    var disc = [0, 0, 0], di = [];
    for (i = 0; i < 6; i++) { disc.push(Math.cos(i * TAU / 6), Math.sin(i * TAU / 6), 0); di.push(0, 1 + i, 1 + (i + 1) % 6); }
    st.heads = field(disc, di, hoff, hdim, true);
    st.blades = off.length / 3; st.blooms = hoff.length / 3;
    /* The six wind chimes: display-only copies of the game's (stone foot, wooden post and bar, a swinging shell with a
     * bead and a paper tail in the tone colour), a little larger so they read in the wide shots, without the number
     * labels; each has a glow in its colour and a ring of light that opens when it is struck. */
    var wood = new T.MeshLambertMaterial({ color: 0x8a6444 }), stone = new T.MeshLambertMaterial({ color: 0xdce6d1 });
    var poleGeo = new T.CylinderGeometry(0.045, 0.06, 1.9, 6), barGeo = new T.BoxGeometry(0.85, 0.07, 0.07);
    var shellGeo = new T.CylinderGeometry(0.19, 0.33, 0.48, 8, 1, true), cordGeo = new T.CylinderGeometry(0.012, 0.012, 0.36, 4);
    var leafGeo = new T.PlaneGeometry(0.18, 0.36), beadGeo = new T.SphereGeometry(0.065, 6, 4), baseGeo = new T.CylinderGeometry(0.38, 0.47, 0.12, 8);
    var ringTex = ringTexture(), inkMat = new T.MeshBasicMaterial({ color: 0x4a3350, side: T.BackSide, fog: false });
    for (i = 0; i < 6; i++) {
      var cg = new T.Group(); cg.position.set(CHIMES[i][0], H.TOP_Y, CHIMES[i][1]); cg.scale.setScalar(CHIME_SCALE);
      part(baseGeo, stone, cg, 0, 0.06, 0); part(poleGeo, wood, cg, -0.34, 0.97, 0); part(barGeo, wood, cg, 0, 1.9, 0);
      var swing = new T.Group(); swing.position.set(0, 1.86, 0); cg.add(swing);
      part(cordGeo, wood, swing, 0, -0.17, 0);
      // Shell: the tone colour deepened (richer, darker) so it holds against the sunlit meadow, inside a dark brushed outline (an inverted hull).
      tmpB.setHex(TONES[i][1]).offsetHSL(0, 0.14, -0.11);
      var mat = new T.MeshLambertMaterial({ color: tmpB.getHex(), emissive: tmpB.getHex(), emissiveIntensity: 0.1, side: T.DoubleSide });
      part(shellGeo, mat, swing, 0, -0.59, 0).l4cs = true; var ink = part(shellGeo, inkMat, swing, 0, -0.59, 0); ink.scale.set(1.16, 1.08, 1.16); ink.l4cs = true; part(beadGeo, wood, swing, 0, -0.84, 0);
      // The paper tail hangs from the bead on its own pivot, so it can trail behind the swing and flutter in the wind.
      var tail = new T.Group(); tail.position.set(0, -0.9, 0); swing.add(tail); part(leafGeo, mat, tail, 0, -0.18, 0).l4cs = true;
      // Halo: a soft body in the tone colour (painted over the picture, so it reads on the bright dawn sky as well), a warm
      // additive core, and a ring in the tone colour that opens on each strike.
      var glow = sprite(H.glowTex, TONES[i][1], false); glow.position.y = 1.3; cg.add(glow);
      var core = sprite(H.glowTex, 0xffe2b0, true); core.position.y = 1.27; cg.add(core);
      tmpB.setHex(TONES[i][1]).lerp(new T.Color(0xfff0c8), 0.3);
      var ring = sprite(ringTex, tmpB.getHex(), true); ring.position.y = 1.27; cg.add(ring);
      g.add(cg); st.chimes.push({ g: cg, swing: swing, tail: tail, mat: mat, glow: glow, core: core, ring: ring });
    }
    /* Notes (with their sparks) and petals: two small Points clouds (one draw each). A frame only rewrites two small
     * typed arrays apiece; nothing is allocated. Slots 0..NOTES-1 are the glyphs, the sparks follow. */
    var NP = NOTES * (1 + SPARKS);
    st.nPos = new Float32Array(NP * 3); st.nA = new Float32Array(NP * 4); st.nCol = new Float32Array(NP * 3);
    for (i = 0; i < NP; i++) { tmpB.setHex(TONES[NOTE_LIST[i % NOTES].c][1]); st.nCol[i * 3] = tmpB.r; st.nCol[i * 3 + 1] = tmpB.g; st.nCol[i * 3 + 2] = tmpB.b; }
    st.ptU = { uPx: { value: 800 }, uMap: { value: noteTexture() } };
    var ng = new T.BufferGeometry();
    ng.setAttribute('position', new T.BufferAttribute(st.nPos, 3)); ng.setAttribute('aA', new T.BufferAttribute(st.nA, 4)); ng.setAttribute('aCol', new T.BufferAttribute(st.nCol, 3));
    var PT_VERT = 'attribute vec4 aA; attribute vec3 aCol; uniform float uPx; varying float vA; varying float vRot; varying float vK; varying vec3 vCol;' +
      'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aA.x; vRot = aA.z; vK = aA.w; vCol = aCol; gl_PointSize = aA.x > 0.003 ? clamp(aA.y * uPx / max(-mv.z, 0.1), 2.0, 120.0) : 0.0; gl_Position = projectionMatrix * mv; }';
    var PT_ROT = ' vec2 q = gl_PointCoord - 0.5; float c = cos(vRot), s = sin(vRot); q = vec2(q.x * c - q.y * s, q.x * s + q.y * c);';
    st.notes = new T.Points(ng, new T.ShaderMaterial({ uniforms: st.ptU, transparent: true, depthWrite: false,
      vertexShader: PT_VERT,
      fragmentShader: 'uniform sampler2D uMap; varying float vA; varying float vRot; varying float vK; varying vec3 vCol; void main(){' + PT_ROT +
        ' if (abs(q.x) > 0.5 || abs(q.y) > 0.5) discard; vec4 m = texture2D(uMap, vec2((q.x + 0.5 + floor(vK + 0.5)) / 3.0, 0.5 - q.y));' +
        // a halo in the tone colour, a dark brushed outline, a pale body tinted by the tone
        ' vec3 halo = mix(vCol, vec3(1.0, 0.96, 0.84), 0.35); vec3 body = mix(vCol, vec3(1.0), vK > 1.5 ? 0.7 : 0.3);' +
        ' vec3 col = mix(halo, mix(vec3(0.27, 0.19, 0.33), body, m.r), max(m.r, m.g));' +
        ' gl_FragColor = vec4(col, max(max(m.r, m.g), m.b * 0.8) * vA); }' }));
    st.notes.frustumCulled = false; st.notes.renderOrder = 3; g.add(st.notes);
    st.pPos = new Float32Array(PETALS * 3); st.pA = new Float32Array(PETALS * 4); st.pCol = new Float32Array(PETALS * 3);
    var petalCols = [0xffb9c6, 0xfff1e4, 0xffd0a2];
    for (i = 0; i < PETALS; i++) { tmpB.setHex(petalCols[i % 3]); st.pCol[i * 3] = tmpB.r; st.pCol[i * 3 + 1] = tmpB.g; st.pCol[i * 3 + 2] = tmpB.b; }
    var pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(st.pPos, 3)); pg.setAttribute('aA', new T.BufferAttribute(st.pA, 4)); pg.setAttribute('aCol', new T.BufferAttribute(st.pCol, 3));
    // A petal: an oval with a notch at the tip, squashed by its flip (vK = cos of the flip angle) so it tumbles, two tones and a dark edge.
    st.petals = new T.Points(pg, new T.ShaderMaterial({ uniforms: st.ptU, transparent: true, depthWrite: false,
      vertexShader: PT_VERT,
      fragmentShader: 'varying float vA; varying float vRot; varying float vK; varying vec3 vCol; void main(){' + PT_ROT +
        ' vec2 p = q * 2.0; p.x /= 0.3 + 0.7 * abs(vK); float e = length(p * vec2(1.55, 1.0));' +
        ' float a = (1.0 - smoothstep(0.84, 1.0, e)) * smoothstep(0.0, 0.2, length(p - vec2(0.0, 0.97)));' +
        ' vec3 col = mix(mix(vCol, vec3(1.0), 0.3), vCol * vec3(0.93, 0.72, 0.78), smoothstep(0.3, -0.9, p.y)) * (vK > 0.0 ? 1.0 : 0.9);' +
        ' col = mix(col, vCol * vec3(0.7, 0.46, 0.54), smoothstep(0.72, 0.94, e) * 0.5); gl_FragColor = vec4(col, a * vA); }' }));
    st.petals.frustumCulled = false; st.petals.renderOrder = 3; g.add(st.petals);
    st.canvas = doc.querySelector('canvas');
    // The game's own sky and lights: borrowed while staged, handed back untouched.
    for (i = 0; i < H.scene.children.length; i++) {
      var ch = H.scene.children[i];
      if (ch.isHemisphereLight) st.hemi = ch; else if (ch.isDirectionalLight) st.sun = ch;
    }
    return true;
  }
  function hide(o) { if (o && o.visible) { o.visible = false; kept.hidden.push(o); } }
  function mix2(key, sk, out) { out.setHex(PAL.cool[key]).multiplyScalar(sk.cool); tmpB.setHex(PAL.warm[key]).multiplyScalar(sk.warm); return out.add(tmpB); }
  function mixS(a, b, sk) { return a * sk.cool + b * sk.warm; }
  function enterStage() {
    if (staged || !buildStage()) return;
    kept = { hidden: [], sun: st.sun ? st.sun.color.getHex() : 0, hemi: st.hemi ? [st.hemi.color.getHex(), st.hemi.groundColor.getHex()] : null,
      fog: H.scene.fog ? H.scene.fog.color.getHex() : 0, pr: 0 };
    // Light on a phone GPU: the painted look does not need full resolution (captions and title are DOM, so stay sharp).
    // (__l3Render is the renderer handle the level-3 cutscene hook already exposes; only its pixel ratio is touched.)
    var rr = root.__l3Render;
    try { if (rr && rr.getPixelRatio && rr.getPixelRatio() > MAX_PR) { kept.pr = rr.getPixelRatio(); rr.setPixelRatio(MAX_PR); } } catch (e) { kept.pr = 0; }
    /* Off the set while the film runs (all come back on close): the game's sky dome, star points, sun/moon sprites, the
     * orbiting islets and cloud puffs, the gameplay chimes (with their number labels, gates and halo), and anything
     * another chapter left visible. */
    var i, ch, ud;
    for (i = 0; i < H.scene.children.length; i++) {
      ch = H.scene.children[i]; ud = ch.userData;
      if (ch === st.sky) continue;
      if (ch.isPoints || ch.isSprite) hide(ch);
      else if (ch.isMesh && ch.geometry && ch.geometry.parameters && ch.geometry.parameters.radius === 120) hide(ch);
      else if (ch.isGroup && ud && typeof ud.sp === 'number' && typeof ud.r === 'number' && typeof ud.a === 'number') hide(ch);
    }
    var extra = (root.__l4Hide || []).concat(root.__l3Hide || [], root.__l3Stage && root.__l3Stage.groups ? root.__l3Stage.groups() : []);
    for (i = 0; i < extra.length; i++) hide(extra[i]);
    if (root.GardenClip && root.GardenClip.boat) hide(root.GardenClip.boat);
    st.sky.visible = true; st.g.visible = true; st.tick = 0; paint();
    if (doc.body) doc.body.classList.add('l4cs-on');
    staged = true;
  }
  function exitStage() {
    if (!staged) return;
    for (var i = 0; i < kept.hidden.length; i++) kept.hidden[i].visible = true;
    st.g.visible = false; st.sky.visible = false;
    unpaint();
    if (st.sun) st.sun.color.setHex(kept.sun);
    if (st.hemi) { st.hemi.color.setHex(kept.hemi[0]); st.hemi.groundColor.setHex(kept.hemi[1]); }
    if (H.scene.fog) H.scene.fog.color.setHex(kept.fog);
    try { if (kept.pr && root.__l3Render) root.__l3Render.setPixelRatio(kept.pr); } catch (e) { /* keep closing */ }
    if (doc.body) doc.body.classList.remove('l4cs-on');
    staged = false; kept = null;
    // The game recomputes its own day/night target (and the camera is its own again from the next frame).
    try { if (H.refresh) H.refresh(); } catch (e) { /* keep closing */ }
  }
  /* Seen near the sun, a particle is slid round the rim instead of across the disc: a continuous push away from the
   * sun's centre, zero from a little outside the rim on, so nothing jumps. The ring kept clear is widened by the
   * particle's own radius on screen, so not even its edge or halo touches the disc. In: the lens-to-particle vector in
   * st.q, the particle's world size and the smallest size it may have on screen (as a tangent). Out: st.q.s = its size. */
  function keepOffSun(size, least) {
    var q = st.q, md = st.sunDir, fd = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z) || 1, along = (q.x * md.x + q.y * md.y + q.z * md.z) / fd;
    q.d = fd; q.s = Math.max(size, least * fd);
    if (along <= 0.86) return;
    var rad = 0.5 * q.s / fd, K = SUN_KEEP + rad;
    var qx = q.x / fd - md.x * along, qy = q.y / fd - md.y * along, qz = q.z / fd - md.z * along, dq = Math.sqrt(qx * qx + qy * qy + qz * qz);
    if (dq < K * 2.2) {
      var wq = 1 - ease(ramp(dq, K * 1.3, K * 2.2)), dn = lerp(dq, Math.sqrt(dq * dq + K * K * 1.5), wq), kq;
      if (dq < 1e-5) { qx = 1; qy = 0; qz = 0; dq = 1; dn = K * 1.25; }
      kq = dn / dq;
      q.x = (md.x * along + qx * kq) * fd; q.y = (md.y * along + qy * kq) * fd; q.z = (md.z * along + qz * kq) * fd; dq = dn;
    }
    if (dq - rad < st.sunMin) st.sunMin = dq - rad; // the nearest edge of anything to the sun's centre this frame
  }
  function applyStage(t) {
    var f = frame(t, true), sk = f.sky, u = st.skyU, i, cam = H.camera, top = H.TOP_Y;
    if (H.setNightTarget) H.setNightTarget(0.12);
    if (H.setDeepNight) H.setDeepNight(0);
    // Other levels' catchable butterflies (preview on level 1) keep their own state; they are only kept out of the picture.
    var wild = root.__bf && root.__bf.butterflies ? root.__bf.butterflies : [];
    for (i = 0; i < wild.length; i++) if (wild[i].g) hide(wild[i].g);
    // Chimes: the shell swings and brightens in its colour; a glow breathes round it and a ring of light opens on each strike.
    for (i = 0; i < 6; i++) {
      var C = st.chimes[i], cm = f.chimes[i], age = cm.strike < 0 ? 9 : t - cm.strike, gs = 1.7 + 1.0 * cm.wake + 1.3 * cm.pulse, rs = 0.8 + 3.8 * ease(ramp(age, 0, 1.7));
      C.g.scale.setScalar(cm.scale); C.swing.rotation.z = cm.swing; C.swing.rotation.x = cm.sway; C.tail.rotation.z = cm.tail - cm.swing * 0.35;
      C.mat.emissiveIntensity = 0.06 + 0.14 * cm.wake + 0.5 * cm.pulse;
      C.glow.material.opacity = clamp(cm.glow, 0, 1) * 0.85; C.glow.scale.set(gs, gs, 1);
      C.core.material.opacity = clamp(0.12 * cm.wake + 0.75 * cm.pulse, 0, 1); C.core.scale.set(0.9 + 0.9 * cm.pulse, 0.9 + 0.9 * cm.pulse, 1);
      C.ring.material.opacity = cm.strike < 0 ? 0 : cm.power * (1 - ramp(age, 0.15, 1.7)); C.ring.scale.set(rs, rs, 1);
    }
    // Camera: overrides the gameplay orbit for this frame only; the game takes it back when we stop.
    var c = f.camera, halfH = Math.tan(cam.fov * Math.PI / 360), halfW = halfH * cam.aspect;
    var r = Math.max(c.w / halfW, c.w * 0.9 / halfH), v3 = st.v;
    v3.set(c.x, top + c.y + c.lift * r * halfH, c.z); H.island.localToWorld(v3);
    cam.position.set(v3.x + r * Math.sin(c.phi) * Math.cos(c.th), v3.y + r * Math.cos(c.phi), v3.z + r * Math.sin(c.phi) * Math.sin(c.th));
    cam.lookAt(v3);
    /* The lens and the sun in stage coordinates: used to keep notes and petals off the sun's disc and to hold them at
     * a readable size in the wide shots. Island coordinates straight from the camera key (not through the island's
     * live bob), so they depend on t alone. */
    var eye = st.eye, md = st.sunDir, q = st.q, b = st.pose;
    eye.set(c.x + r * Math.sin(c.phi) * Math.cos(c.th), top + c.y + c.lift * r * halfH + r * Math.cos(c.phi), c.z + r * Math.sin(c.phi) * Math.sin(c.th));
    md.set(f.sun.x, f.sun.y, f.sun.z).normalize();
    var cvH = st.canvas ? st.canvas.height : 844, px = cvH / (2 * halfH), P = st.nPos, A = st.nA, k, o, lag, near;
    st.sunMin = 9;
    // Glyphs, then their sparks (the same path a moment earlier). World size, but never smaller on screen than a readable
    // glyph (wide shots); and nothing brushes the lens: anything drifting very close fades instead of filling the frame.
    for (k = 0; k <= SPARKS; k++) for (i = 0; i < NOTES; i++) {
      o = k * NOTES + i; lag = k * SPARK_LAG;
      noteAt(i, t - lag, b);
      q.x = b.x - eye.x; q.y = top + b.y - eye.y; q.z = b.z - eye.z;
      keepOffSun(k ? b.size * (0.62 - 0.14 * k) : b.size, (k ? 0.052 - 0.01 * k : 0.09) * halfH);
      near = ramp(q.d, 3, 7);
      P[o * 3] = eye.x + q.x; P[o * 3 + 1] = eye.y + q.y; P[o * 3 + 2] = eye.z + q.z;
      A[o * 4] = (k ? b.alpha * (0.95 - 0.2 * k) * (0.7 + 0.3 * Math.sin(t * 7 + o * 2.4)) : b.alpha) * near; A[o * 4 + 1] = q.s;
      A[o * 4 + 2] = k ? t * 0.8 + o : b.tilt; A[o * 4 + 3] = k ? 2 : b.glyph;
    }
    st.notes.geometry.attributes.position.needsUpdate = true; st.notes.geometry.attributes.aA.needsUpdate = true;
    P = st.pPos; A = st.pA;
    for (i = 0; i < PETALS; i++) {
      petalAt(i, t, b);
      q.x = b.x - eye.x; q.y = top + b.y - eye.y; q.z = b.z - eye.z; keepOffSun(b.size, 0.046 * halfH);
      P[i * 3] = eye.x + q.x; P[i * 3 + 1] = eye.y + q.y; P[i * 3 + 2] = eye.z + q.z;
      A[i * 4] = b.alpha * ramp(q.d, 3, 7); A[i * 4 + 1] = q.s; A[i * 4 + 2] = b.spin; A[i * 4 + 3] = Math.cos(b.flip);
    }
    st.petals.geometry.attributes.position.needsUpdate = true; st.petals.geometry.attributes.aA.needsUpdate = true;
    st.ptU.uPx.value = px;
    // Look: sky palette, sun, light and grass tint.
    mix2('top', sk, u.uTop.value); mix2('mid', sk, u.uMid.value); mix2('hor', sk, u.uHor.value); mix2('low', sk, u.uLow.value);
    mix2('lit', sk, u.uLit.value); mix2('shade', sk, u.uShade.value);
    u.uTime.value = t; u.uDawn.value = sk.warm; u.uGlow.value = sk.glow; u.uSun.value.copy(md);
    st.sky.position.copy(cam.position);
    if (H.scene.fog) mix2('fog', sk, H.scene.fog.color);
    if (st.sun) { mix2('key', sk, st.sun.color); st.sun.intensity = mixS(PAL.cool.keyI, PAL.warm.keyI, sk); }
    if (st.hemi) { mix2('hemiA', sk, st.hemi.color); mix2('hemiB', sk, st.hemi.groundColor); st.hemi.intensity = mixS(PAL.cool.hemiI, PAL.warm.hemiI, sk); }
    st.grassU.uTime.value = t; st.grassU.uSoft.value = soft; st.grassU.uFront.value = f.front;
    st.grassU.uLight.value.set(mixS(PAL.cool.grass[0], PAL.warm.grass[0], sk), mixS(PAL.cool.grass[1], PAL.warm.grass[1], sk), mixS(PAL.cool.grass[2], PAL.warm.grass[2], sk));
    if (++st.tick % 30 === 1) paint(); // anything planted or loaded since the last pass
  }
  function isOpen() { return state === 'playing' || state === 'paused' || state === 'ended'; }
  function stageTick() {
    if (!isOpen()) { exitStage(); return; }
    var t = time();
    enterStage();
    if (staged) applyStage(t);
  }
  // Chain onto gameplay.js the way the other modules do: the hooks arrive once, then one call per frame.
  var GP = root.GardenPlay;
  if (GP && doc) {
    var gpInit = GP.init, gpUpdate = GP.update;
    GP.init = function (hooks) { gpInit.apply(GP, arguments); H = hooks; T = hooks.THREE; };
    GP.update = function () { gpUpdate.apply(GP, arguments); if (H) stageTick(); };
  }
  try { if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) soft = 0.3; } catch (e) { soft = 1; }

  /* ------------------------------- DOM ------------------------------- */
  var CSS = [
    '#l4cs{position:fixed;top:0;left:0;right:0;bottom:0;z-index:60;overflow:hidden;color:#fff;touch-action:none;',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '#l4cs.hidden{display:none}',
    // The veil washes the live island with dawn colour instead of hiding it.
    '#l4csVeil{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;',
    'background:linear-gradient(180deg,#4a5a8c 0%,#b08aa0 55%,#f0b890 100%)}',
    // Paper grain and a warm, uneven edge: the frame reads as dawn watercolour on cold-pressed paper.
    // Both sit beside #l4cs (not inside it) so their blend modes reach the game canvas underneath.
    '#l4csPaper{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;opacity:.75;mix-blend-mode:multiply;background-size:240px 240px}',
    '#l4csEdge{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;mix-blend-mode:multiply;',
    'background:radial-gradient(ellipse at 50% 44%,rgba(190,150,140,0) 52%,rgba(122,84,96,.42) 100%);box-shadow:inset 0 0 80px rgba(96,64,84,.36)}',
    '.l4cs-bar{position:absolute;left:0;right:0;height:7%;background:#1d1826;pointer-events:none}',
    '#l4csTop{top:0;transform-origin:50% 0}#l4csBottom{bottom:0;transform-origin:50% 100%}',
    '#l4csCaption{position:absolute;left:5%;right:5%;bottom:14.5%;text-align:center;font-size:17px;line-height:1.7;letter-spacing:1.5px;white-space:nowrap;',
    'padding:14px 0 12px;color:#fffdf6;text-shadow:0 1px 2px rgba(44,24,40,.9),0 0 10px rgba(58,34,50,.8);pointer-events:none;',
    'background:radial-gradient(ellipse at 50% 50%,rgba(52,32,50,.5) 0%,rgba(52,32,50,.3) 45%,rgba(52,32,50,0) 72%)}',
    '#l4csSkip{position:absolute;top:12px;top:calc(12px + env(safe-area-inset-top));right:12px;right:calc(12px + env(safe-area-inset-right));',
    'min-width:64px;min-height:44px;padding:0 16px;border-radius:22px;font:inherit;font-size:14px;letter-spacing:3px;color:#fffaf0;cursor:pointer;',
    'background:rgba(120,84,100,.34);border:1px solid rgba(255,238,214,.5);box-shadow:0 4px 18px rgba(44,24,40,.3);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#l4csSkip:active{background:rgba(170,120,130,.46)}',
    // Everything but the canvas and the cutscene steps aside, so the island reads as a film frame.
    'body.l4cs-on>:not(canvas):not(#l4cs):not(.l4cs-paint){visibility:hidden!important}',
    '.l4cs-paint.hidden{display:none}',
    '#l4csEnd{position:absolute;left:0;right:0;top:33%;text-align:center;pointer-events:none}',
    '#l4csTitle{font-family:"Songti SC","Noto Serif CJK SC","Source Han Serif SC",STSong,serif;font-size:32px;font-weight:600;letter-spacing:8px;text-indent:8px;',
    'text-shadow:0 1px 3px rgba(44,24,40,.85),0 0 22px rgba(255,214,150,.6),0 2px 12px rgba(58,34,50,.7)}',
    '#l4csRule{width:132px;height:1px;margin:16px auto 0;background:linear-gradient(90deg,transparent,rgba(255,236,196,.9),transparent)}',
    '#l4csSub{margin-top:14px;font-size:17px;letter-spacing:14px;text-indent:14px;opacity:.96;text-shadow:0 1px 2px rgba(44,24,40,.85),0 1px 10px rgba(58,34,50,.7)}',
    '#l4csGo{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);min-width:168px;min-height:44px;padding:0 26px;border-radius:24px;font:inherit;font-size:15px;letter-spacing:5px;color:#fffaf0;',
    'cursor:pointer;pointer-events:auto;background:rgba(96,62,80,.58);border:1px solid rgba(255,236,196,.66);text-shadow:0 1px 2px rgba(44,24,40,.8);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:l4csPulse 2.4s ease-in-out infinite}',
    '#l4csGo.hidden,#l4csSkip.hidden{display:none}',
    '@keyframes l4csPulse{0%,100%{opacity:.62}50%{opacity:1}}',
    '#l4csClock{position:absolute;left:12px;left:calc(12px + env(safe-area-inset-left));bottom:10px;bottom:calc(10px + env(safe-area-inset-bottom));',
    'font-size:11px;letter-spacing:1px;opacity:.55;pointer-events:none;font-variant-numeric:tabular-nums}',
    '#l4csClock.hidden{display:none}',
    '@media (orientation:landscape) and (max-height:480px){#l4csCaption{bottom:13%;font-size:14px}#l4csTitle{font-size:24px}',
    '#l4csEnd{top:13%}#l4csRule{margin-top:8px}#l4csSub{margin-top:8px;font-size:14px}#l4csGo{bottom:11%;left:auto;right:5%;transform:none}.l4cs-bar{height:9%}}',
    '@media (prefers-reduced-motion:reduce){#l4csGo{animation:none}}'
  ].join('');

  // Procedural paper: speckle, a few fibres and soft brush streaks; drawn once, tiled by CSS.
  function paperTexture() {
    try {
      var c = doc.createElement('canvas'), S = 240, g, i, seed = 13;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      c.width = c.height = S; g = c.getContext('2d');
      g.fillStyle = '#f8f1e6'; g.fillRect(0, 0, S, S);
      for (i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '122,92,84,' : '255,255,255,') + (0.05 + 0.1 * rnd()).toFixed(3) + ')'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
      for (i = 0; i < 26; i++) {
        var x = rnd() * S, y = rnd() * S, a = rnd() * 6.283, l = 8 + rnd() * 22;
        g.strokeStyle = 'rgba(132,98,90,' + (0.06 + 0.08 * rnd()).toFixed(3) + ')'; g.lineWidth = 0.6 + rnd() * 0.5;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5 - 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      for (i = 0; i < 9; i++) { g.fillStyle = 'rgba(140,104,92,' + (0.012 + 0.016 * rnd()).toFixed(3) + ')'; g.fillRect(0, rnd() * S, S, 5 + rnd() * 16); }
      el.Paper.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { el.Paper.style.display = 'none'; }
  }
  function stop(e) { if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }
  function build() {
    if (el || !doc || !doc.body) return;
    var style = doc.createElement('style'); style.id = 'l4csStyle'; style.textContent = CSS;
    doc.head.appendChild(style);
    var box = doc.createElement('div'); box.id = 'l4cs'; box.className = 'hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', TITLE);
    box.innerHTML = '<div id="l4csVeil"></div>' +
      '<div id="l4csTop" class="l4cs-bar"></div><div id="l4csBottom" class="l4cs-bar"></div>' +
      '<div id="l4csCaption"></div>' +
      '<div id="l4csEnd"><div id="l4csTitle">' + TITLE + '</div><div id="l4csRule"></div><div id="l4csSub">' + SUBTITLE + '</div></div>' +
      '<button id="l4csGo" class="hidden" type="button">' + CONTINUE + '</button>' +
      '<button id="l4csSkip" type="button" aria-label="跳过过场动画">' + SKIP + '</button>' +
      '<div id="l4csClock"></div>';
    doc.body.appendChild(box);
    el = { box: box };
    var layers = ['Edge', 'Paper'];
    for (var p = 0; p < layers.length; p++) { var layer = doc.createElement('div'); layer.id = 'l4cs' + layers[p]; layer.className = 'l4cs-paint hidden'; doc.body.insertBefore(layer, box); el[layers[p]] = layer; }
    var ids = ['Veil', 'Top', 'Bottom', 'Caption', 'End', 'Go', 'Skip', 'Clock'];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = doc.getElementById('l4cs' + ids[i]);
    paperTexture();
    showClock = query('csclock') === '1';
    if (!showClock) el.Clock.className = 'hidden';
    // The box is an input shield: nothing underneath is tappable while the cutscene is up.
    var kinds = ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'wheel'];
    for (i = 0; i < kinds.length; i++) box.addEventListener(kinds[i], function (e) { e.stopPropagation(); });
    box.addEventListener('click', function (e) { stop(e); proceed(); });
    el.Skip.addEventListener('click', function (e) { stop(e); skip(); });
    el.Go.addEventListener('click', function (e) { stop(e); proceed(); });
    ready = true;
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function render() {
    var t = time();
    if (!el) return;
    var open = isOpen();
    el.box.className = open ? '' : 'hidden';
    el.Paper.className = el.Edge.className = open ? 'l4cs-paint' : 'l4cs-paint hidden';
    if (!open) return;
    var f = frame(t, true);
    el.Veil.style.opacity = f.veil.toFixed(3);
    el.Top.style.transform = el.Bottom.style.transform = 'scaleY(' + f.bars.toFixed(3) + ')';
    if (el.Caption.textContent !== f.caption) el.Caption.textContent = f.caption;
    el.Caption.style.opacity = f.captionAlpha.toFixed(3);
    el.End.style.opacity = f.title.toFixed(3);
    el.End.style.transform = 'translateY(' + ((1 - f.title) * 10).toFixed(1) + 'px)';
    el.Go.className = f.canContinue ? '' : 'hidden';
    el.Skip.className = f.canContinue ? 'hidden' : '';
    var s = Math.floor(t);
    if (showClock) el.Clock.textContent = two(Math.floor(s / 60)) + ':' + two(s % 60) + ' / ' + two(Math.floor(DURATION / 60)) + ':' + two(DURATION % 60) + ' · ' + f.beat;
  }
  function loop() {
    raf = 0;
    render();
    if (state === 'playing' && root.requestAnimationFrame) raf = root.requestAnimationFrame(loop);
  }
  function run() {
    render();
    if (!doc) return;
    if (!raf && root.requestAnimationFrame) raf = root.requestAnimationFrame(loop);
    // Background tabs throttle rAF; the timer still lands the end card on time.
    if (!ticker && root.setInterval) ticker = root.setInterval(function () {
      render();
      if (state !== 'playing') { root.clearInterval(ticker); ticker = 0; }
    }, 250);
  }

  /* ------------------------------- API ------------------------------- */
  // The score lives in l4-cutscene-music.js (window.__l4Score); muted runs (headless capture) never start it.
  function score() { return root.__l4Score || null; }
  function play(o) {
    opts = o || {};
    if (opts.muted !== undefined) muted = !!opts.muted;
    scored = !muted && !!score() && !!score().start();
    build();
    base = clamp(+opts.from || 0, 0, DURATION); anchor = clock(); done = false; state = 'playing';
    run();
    return true;
  }
  function seek(t) {
    t = clamp(+t || 0, 0, DURATION);
    build();
    var running = state === 'playing' || state === 'ended';
    base = t; anchor = clock();
    if (t >= DURATION) reach();
    else state = running ? 'playing' : 'paused'; // seeking a closed cutscene shows a still frame
    if (scored && score().sync) score().sync();
    run();
    return t;
  }
  function skip() {
    if (state !== 'playing' && state !== 'paused') return false;
    reach();
    if (scored && score().settle) score().settle();
    render();
    return true;
  }
  function pause() { if (state !== 'playing') return false; base = time(); if (state === 'playing') state = 'paused'; render(); return true; }
  function resume() { if (state !== 'paused') return false; anchor = clock(); state = 'playing'; run(); return true; }
  function close() {
    if (state === 'idle' || state === 'closed') return false;
    state = 'closed'; opts = {};
    if (scored) { scored = false; if (score().stop) score().stop(); }
    if (doc) exitStage();
    render();
    return true;
  }
  // Tap-to-continue: only from the end card, and not from the same tap that skipped.
  function proceed(force) {
    if (state !== 'ended') return false;
    if (!force && clock() - endedAt < CONTINUE_GUARD_MS) return false;
    var cb = opts.onContinue;
    close();
    if (typeof cb === 'function') cb();
    return true;
  }

  var api = {
    play: play, skip: skip, seek: seek, time: time,
    duration: function () { return DURATION; },
    playing: function () { time(); return state === 'playing'; },
    finished: function () { time(); return done; },
    ready: function () { return ready; },
    prewarm: build,
    // True from play() until close(): journey.js treats the film like an open dialog (no gameplay input).
    busy: function () { time(); return isOpen(); },
    // True while the stage owns the island: journey.js freezes the gameplay chimes for that time.
    staged: function () { return staged; },
    stage: function () {
      return { staged: staged, reduced: soft < 1, toon: painted.length, blades: st ? st.blades : 0, blooms: st ? st.blooms : 0,
        chimes: st ? st.chimes.length : 0, notes: st ? NOTES : 0, sparks: st ? NOTES * SPARKS : 0, petals: st ? PETALS : 0,
        sky: !!(st && st.sky.visible), hidden: kept ? kept.hidden.length : 0,
        camera: H ? H.camera.position.toArray().map(function (v) { return +v.toFixed(3); }) : null };
    },
    pause: pause, resume: resume, close: close, proceed: proceed,
    state: function () { time(); return state; },
    beat: function () { return beatAt(time()).id; },
    beats: function () { return BEATS.map(function (b) { return { id: b.id, t0: b.t0, t1: b.t1, caption: b.caption }; }); },
    frame: function (t) { return frame(t === undefined ? time() : clamp(+t || 0, 0, DURATION)); },
    text: function () { return { title: TITLE, subtitle: SUBTITLE, cont: CONTINUE, skip: SKIP }; },
    layout: function () { return { chimes: CHIMES, tones: TONES.map(function (k) { return k[0]; }), colors: TONES.map(function (k) { return k[1]; }), chimeT: CHIME_T, chimeStep: CHIME_STEP, beat: BEAT, song: SONG.slice(), phrases: PHRASES.slice(), together: TOGETHER, roll: ROLL, lastT: LAST_T,
        strikes: STRIKES.map(function (e) { return [e.t, e.c, e.s, e.k]; }), chimeScale: CHIME_SCALE, notes: NOTES, petals: PETALS, ambient: AMBIENT, sparks: SPARKS, noteY: NOTE_Y, wind: [WX, WZ], sunDisc: SUN_DISC }; },
    // Pose of one chime, note or petal at t (the stage uses exactly these).
    chime: function (i, t) { return chimeAt(clamp(i | 0, 0, 5), +t || 0, {}); },
    note: function (j, t) { return noteAt(clamp(j | 0, 0, NOTES - 1), +t || 0, {}); },
    petal: function (j, t) { return petalAt(clamp(j | 0, 0, PETALS - 1), +t || 0, {}); },
    // What is actually on stage this frame (island-local; y above the grass): for the seek/determinism checks.
    probe: function () {
      if (!st || !staged) return null;
      var out = { sunClear: st.sunMin, sunDisc: SUN_DISC, notes: [], sparks: [], petals: [], chimes: [] }, i;
      // [x, y, z, alpha, size]; notes first, then their sparks
      for (i = 0; i < NOTES * (1 + SPARKS); i++) (i < NOTES ? out.notes : out.sparks).push([st.nPos[i * 3], st.nPos[i * 3 + 1] - H.TOP_Y, st.nPos[i * 3 + 2], st.nA[i * 4], st.nA[i * 4 + 1]]);
      for (i = 0; i < PETALS; i++) out.petals.push([st.pPos[i * 3], st.pPos[i * 3 + 1] - H.TOP_Y, st.pPos[i * 3 + 2], st.pA[i * 4], st.pA[i * 4 + 1]]);
      // [swing, halo opacity, ring opacity, tail angle, core opacity]
      for (i = 0; i < 6; i++) out.chimes.push([st.chimes[i].swing.rotation.z, st.chimes[i].glow.material.opacity, st.chimes[i].ring.material.opacity, st.chimes[i].tail.rotation.z, st.chimes[i].core.material.opacity]);
      return out;
    },
    muted: function () { return muted; },
    scored: function () { return scored; },
    // In-game hook switch; session-only, never saved. On by default, ?l4cutscene=0 keeps the old 3.2s finale and card.
    enabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; return enabled; },
    _setClock: function (fn) { clock = fn; }
  };
  root.__l4Cutscene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  enabled = query('l4cutscene') !== '0';
  muted = query('mute') === '1';
  if (!doc) return;
  function boot() {
    ready = true;
    if (query('cutscene') !== 'l4') return;
    // Standalone preview: muted starts at once (headless capture), otherwise on the first gesture.
    if (muted) { play({ source: 'preview', muted: true }); return; }
    var kinds = ['pointerdown', 'touchstart', 'keydown'];
    function first() {
      for (var i = 0; i < kinds.length; i++) doc.removeEventListener(kinds[i], first, true);
      if (state === 'idle') play({ source: 'preview' });
    }
    for (var i = 0; i < kinds.length; i++) doc.addEventListener(kinds[i], first, true);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
