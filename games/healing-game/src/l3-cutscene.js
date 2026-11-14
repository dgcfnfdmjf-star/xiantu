/* l3-cutscene.js: level-3 clear cutscene (the lamps' light sails home).
 * A seekable 50s timeline shown when the third star lamp is lit, before the #starEnding card. Every visual is a
 * pure function of the timeline second, so seek(t) reproduces any frame. Storyboard: docs/l3-cutscene-storyboard.md.
 * Same architecture as l1-cutscene.js: a pure model (camera, sky, moon, wind, lamps, fireflies, boat as numbers), a
 * three.js stage that poses display-only actors on the live island from that model, and a DOM layer (bars,
 * captions, title). This file never reads or writes a save; the caller's onContinue decides what happens afterwards. */
(function (root) {
  'use strict';
  var DURATION = 50;
  // Clock times are seconds from play(); beats are contiguous and end at DURATION.
  var BEATS = [
    { id: 'dusk', t0: 0, t1: 10, caption: '暮色落下来，风吹过草尖和花' },
    { id: 'lamps', t0: 10, t1: 20, caption: '三盏星灯，一盏一盏暖了起来' },
    { id: 'fireflies', t0: 20, t1: 31, caption: '你接住的星萤，飞回了星星里' },
    { id: 'boat', t0: 31, t1: 43.5, caption: '纸船载着灯火，送晚归的人回家' },
    { id: 'title', t0: 43.5, t1: 50, caption: '' }
  ];
  var TITLE_AT = 44, TITLE_FADE = 3, CONTINUE_GUARD_MS = 600;
  var TITLE = '第三关 · 完成', SUBTITLE = '暮色浮岛', CONTINUE = '轻触继续', SKIP = '跳过';

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
  /* Wind: a primary wave along the wind direction, a slower cross wave and a fine ripple, under a slow gust envelope
   * (the layout used by stylised-grass shaders). The grass shader evaluates the same formula in GLSL. */
  function windAt(x, z, t) {
    var a = x * 0.86 + z * 0.5, b = -x * 0.5 + z * 0.86;
    return (0.6 + 0.4 * Math.sin(t * 0.31 + 0.7 + a * 0.12)) * (0.6 * Math.sin(a * 1.2 - t * 1.5) + 0.25 * Math.sin(b * 2.0 - t * 1.1 + a * 0.6) + 0.15 * Math.sin(a * 3.3 - t * 2.9));
  }
  // Sky: blue-violet dusk -> starry night. The moon climbs a little the whole time.
  function skyAt(t) { var n = ease(ramp(t, 3, 24)); return { dusk: 1 - n, night: n, stars: ease(ramp(t, 7, 27)) }; }
  // Kept low and a little left of the lens axis, so it sits inside a narrow portrait frame in the wide shots.
  function moonAt(t) { return { x: -0.17, y: 0.155 + 0.04 * ease(ramp(t, 0, 48)), z: -1 }; }
  // The three star lamps stand where the game's do. They warm up one by one in the second beat, then breathe.
  var LAMPS = [[-3.7, 0.7], [0, 3.8], [3.7, 0.7]], LAMP_Y = 0.91, LAMP_T = 10.6, LAMP_STEP = 2.7;
  function lampAt(i, t) {
    var on = ease(ramp(t, LAMP_T + i * LAMP_STEP, LAMP_T + i * LAMP_STEP + 2.6));
    // A slow breath with a small candle flicker on top (two incommensurate sines, so it never visibly loops).
    return (0.3 + 0.7 * on) * (0.935 + soft * (0.045 * Math.sin(t * 1.3 + i * 2.1) + 0.02 * Math.sin(t * 6.7 + i * 4.3) * Math.sin(t * 2.9 + i)));
  }
  /* Star fireflies. Each one (1) comes out over the meadow at dusk and wanders on a curl-noise style drift, (2) is
   * drawn to its lamp when that lamp warms up and circles it, (3) is let go in turn, climbs in a slow widening spiral
   * and (4) recedes to a fixed place high in the night sky, where it shrinks to a twinkling point among the stars.
   * Closed-form in t (no integration), so seek(t) lands every one exactly where straight playback would. */
  var N = 24, REL = 20.6, REL_STEP = 0.3, CLIMB = 11, STAR_Z = -62;
  var KINDS = [['dew', 0xa9efd8], ['peach', 0xffb3cd], ['amber', 0xffd58a], ['moon', 0xe9f6ff], ['violet', 0xc5adff], ['tide', 0x89d7ff]];
  function hsh(j, k) { var s = Math.sin(j * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }
  /* Drift: the curl of a smooth vector potential (sums of sines), sampled at the firefly's home. A curl field has no
   * divergence, so neighbours swirl together instead of bunching up or scattering - the look of curl noise without a
   * noise texture or a velocity integration. */
  var cv = { x: 0, y: 0, z: 0 };
  function curlAt(x, y, z, t) {
    cv.x = 0.95 * Math.cos(1.9 * y - 0.4 * t) - 0.8 * Math.cos(0.8 * z + 0.5 * t + 4.1);
    cv.y = 0.85 * Math.cos(1.7 * z - 0.43 * t) - Math.cos(x + 0.55 * t + 2.6);
    cv.z = 0.75 * Math.cos(1.5 * x + 0.37 * t) - 0.9 * Math.cos(0.9 * y + 0.6 * t + 1.3);
    return cv;
  }
  // Release order: lamp by lamp (the first lamp's fireflies go first), one every REL_STEP seconds.
  function relAt(j) { return REL + ((j % 3) * (N / 3) + Math.floor(j / 3)) * REL_STEP; }
  function flyAt(j, t, out) {
    var li = j % 3, L = LAMPS[li], k = 0.5 + 0.5 * soft, rel = relAt(j), u = ramp(t, rel, rel + CLIMB);
    out = out || {};
    // (1) meadow drift
    var ha = hsh(j, 7) * TAU, hr = 1.2 + 3.0 * Math.sqrt(hsh(j, 8)), hx = Math.cos(ha) * hr, hz = Math.sin(ha) * hr, hy = 0.85 + 1.0 * hsh(j, 9);
    var c = curlAt(hx, hy, hz, t), x = hx + 0.34 * k * c.x, y = hy + 0.16 * k * c.y, z = hz + 0.34 * k * c.z;
    // (2) gathered round the lamp
    var g0 = LAMP_T + li * LAMP_STEP + 0.6 + 1.6 * hsh(j, 10), g = ease(ramp(t, g0, g0 + 4.5));
    var dir = j % 2 ? -1 : 1, oa = j * 2.4 + dir * t * (0.45 + 0.3 * hsh(j, 11)) * k, or = 0.6 + 0.55 * hsh(j, 1);
    var e1 = ease(ramp(u, 0, 0.62)), rr = or + 1.5 * e1, pull = 1 - 0.55 * e1;
    var ox = L[0] * pull + Math.cos(oa) * rr + 0.1 * k * c.x, oz = L[1] * pull + Math.sin(oa) * rr + 0.1 * k * c.z;
    var oy = LAMP_Y + 0.12 + 0.5 * hsh(j, 12) + 0.16 * soft * Math.sin(t * 0.8 + j * 1.7) + (5.5 + 2.5 * hsh(j, 3)) * e1;
    x = lerp(x, ox, g); y = lerp(y, oy, g); z = lerp(z, oz, g);
    // (3)+(4) up, and away to its place in the sky (kept clear of the moon's disc)
    var e2 = ramp(u, 0.38, 1); e2 = e2 * e2 * (3 - 2 * e2);
    var sx = -26 + 38 * hsh(j, 2), sy = 27 + 21 * hsh(j, 4), dm = Math.sqrt((sx + 11) * (sx + 11) + (sy - 31) * (sy - 31));
    if (dm < 7) { sx += (sx + 11.01) / (dm + 0.01) * (7 - dm); sy += (sy - 31) / (dm + 0.01) * (7 - dm) + 2; }
    out.x = lerp(x, sx, e2); out.y = lerp(y, sy, e2); out.z = lerp(z, STAR_Z + 8 * (hsh(j, 5) - 0.5), e2);
    out.alpha = ease(ramp(t, 2.5 + 5 * hsh(j, 13), 5 + 5 * hsh(j, 13)));
    // A firefly's slow blink; as a star it keeps only a faint twinkle.
    var blink = 0.5 + 0.5 * Math.sin(t * (1.1 + 1.3 * hsh(j, 6)) + j * 1.9); blink = blink * blink * (3 - 2 * blink);
    out.twinkle = lerp(0.55 + 0.45 * blink, 0.72 + 0.28 * Math.sin(t * (2 + 3 * hsh(j, 5)) + j * 1.9), e2);
    out.star = e2;
    out.size = lerp(0.72, 0.8, e2) * (0.85 + 0.3 * hsh(j, 6));
    // The little winged body (the game's wisp) is shown near the ground and folds away into pure light on the climb.
    out.body = 1 - ease(ramp(u, 0.2, 0.55));
    out.yaw = t * 0.7 + j * 1.3; out.flap = 0.4 * Math.sin(t * 8 + j * 2.2);
    out.lamp = li; out.rel = rel;
    return out;
  }
  function fliesAt(t) { var out = []; for (var j = 0; j < N; j++) out.push(flyAt(j, t, {})); return out; }
  /* The cast: which colour each of the N fireflies wears. `caught` is the player's { id: count } (read-only, in
   * memory); colours appear in proportion to the counts, every caught colour at least once. Nothing caught (or a
   * preview) shows all six. */
  function castFor(caught) {
    var own = [], total = 0, i, j, out = [];
    for (i = 0; i < KINDS.length; i++) { var c = caught ? +caught[KINDS[i][0]] || 0 : 0; if (c > 0) { own.push([i, c, 1]); total += c; } }
    if (!own.length) { for (j = 0; j < N; j++) out.push(KINDS[j % KINDS.length][0]); return out; }
    for (i = 0; i < own.length; i++) own[i][2] = 1 + Math.floor((N - own.length) * own[i][1] / total);
    var left = N; for (i = 0; i < own.length; i++) left -= own[i][2];
    for (i = 0; left > 0; i = (i + 1) % own.length, left--) own[i][2]++;
    // interleave, so neighbours in the release order differ
    for (j = 0; out.length < N; j++) { var o = own[j % own.length]; if (o[2] > 0) { o[2]--; out.push(KINDS[o[0]][0]); } }
    return out;
  }
  /* The paper boat: slips off the front of the island, rounds its right side and sails out over the cloud sea towards
   * the moon. Position, heading, bob, roll and pitch are closed-form in t; the wake is the same path sampled at
   * earlier times, so it lies exactly where the boat has been and fades with age. */
  var BOAT_SCALE = 2.1, BOAT = [[-4.4, -0.35, 5.6], [3.5, -1.0, 12.5], [13.5, -0.9, 4.5], [1.5, 0.5, -19]], BOAT_T0 = 30.5, WAKE_AGE = 5.5, WAKE_SEG = 22, GLINTS = 8;
  function boatPath(s, out) { // one cubic Bezier: round the front of the island, well clear of its rim, then away
    var m = 1 - s, a = m * m * m, b = 3 * m * m * s, c = 3 * m * s * s, d = s * s * s, k;
    out.x = a * BOAT[0][0] + b * BOAT[1][0] + c * BOAT[2][0] + d * BOAT[3][0]; out.y = a * BOAT[0][1] + b * BOAT[1][1] + c * BOAT[2][1] + d * BOAT[3][1]; out.z = a * BOAT[0][2] + b * BOAT[1][2] + c * BOAT[2][2] + d * BOAT[3][2];
    // tangent (analytic), for the heading and for the width of the wake
    a = 3 * m * m; b = 6 * m * s; c = 3 * s * s; k = 0;
    out.tx = a * (BOAT[1][k] - BOAT[0][k]) + b * (BOAT[2][k] - BOAT[1][k]) + c * (BOAT[3][k] - BOAT[2][k]); k = 2;
    out.tz = a * (BOAT[1][k] - BOAT[0][k]) + b * (BOAT[2][k] - BOAT[1][k]) + c * (BOAT[3][k] - BOAT[2][k]);
    return out;
  }
  function boatS(t) { var u = ramp(t, BOAT_T0, DURATION + 1); return u * (0.55 + 0.4 * u); } // casts off gently, keeps a steady pace
  function boatAt(t, out) {
    var s = boatS(t);
    out = out || {};
    boatPath(s, out);
    out.yaw = Math.atan2(-out.tz, out.tx); // the hull's long axis is x, as in the game
    out.y += 0.055 * soft * Math.sin(t * 1.3) + 0.03 * soft * Math.sin(t * 0.7);
    out.roll = 0.07 * soft * Math.sin(t * 1.1 + 0.6);
    out.pitch = 0.05 * soft * Math.sin(t * 0.8 + 1);
    out.alpha = ease(ramp(t, BOAT_T0 - 0.5, BOAT_T0 + 1.8));
    out.glow = out.alpha * (0.86 + 0.1 * Math.sin(t * 1.9) + 0.04 * Math.sin(t * 6.3));
    out.s = s;
    return out;
  }
  // A point of the wake `age` seconds behind the boat (flat on the sea: no bob), with its half-width and strength.
  function wakeAt(t, age, out) {
    out = out || {};
    var a = clamp(age / WAKE_AGE, 0, 1), tt = t - age;
    boatPath(boatS(tt), out);
    out.y -= 0.1; out.age = a;
    out.half = 0.14 + 1.0 * Math.sqrt(a);
    out.alpha = tt > BOAT_T0 ? (1 - a) * (1 - a) * ramp(tt, BOAT_T0, BOAT_T0 + 1.5) : 0;
    return out;
  }
  /* Camera keys: look-at point, azimuth th (PI/2 = the gameplay side), polar phi, half-width w that
   * must stay in frame, and lift = how far above the look-at the frame centre sits (in half-screens). */
  // Wide dusk shot, a glide down to the lamps, a crane up after the fireflies, a drift after the boat, a wide night sky.
  var CAM = [
    { t: 0, x: 0, y: 1.6, z: 0, th: 1.34, phi: 1.45, w: 9.0, lift: 0.3 },
    { t: 10, x: 0, y: 1.0, z: 1.2, th: 1.5, phi: 1.37, w: 6.4, lift: 0.14 },
    { t: 15.5, x: 0.3, y: 0.9, z: 2.0, th: 1.64, phi: 1.34, w: 5.0, lift: 0.08 },
    { t: 20, x: 0, y: 1.1, z: 1.6, th: 1.6, phi: 1.37, w: 5.2, lift: 0.1 },
    { t: 27, x: -0.2, y: 2.6, z: 0.6, th: 1.52, phi: 1.5, w: 6.4, lift: 0.2 },
    { t: 32, x: 1.2, y: 1.7, z: 1.8, th: 1.44, phi: 1.44, w: 6.4, lift: 0.14 },
    { t: 40, x: 3.2, y: 1.5, z: 0.2, th: 1.37, phi: 1.45, w: 7.4, lift: 0.18 },
    { t: 44, x: 2.0, y: 2.3, z: -1.6, th: 1.4, phi: 1.48, w: 8.4, lift: 0.24 },
    { t: 50, x: 0.6, y: 3.1, z: -3, th: 1.43, phi: 1.5, w: 9.4, lift: 0.28 }
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
      look: 'painterly-night', sky: sk, moon: moonAt(t), wind: windAt(0, 0, t),
      veil: 0.03 + 0.05 * sk.night, light: 1 - 0.45 * sk.night,
      lamps: [lampAt(0, t), lampAt(1, t), lampAt(2, t)],
      bars: ease(ramp(t, 0, 2.5)),
      title: ease(ramp(t, TITLE_AT, TITLE_AT + TITLE_FADE)),
      canContinue: t >= DURATION,
      flies: lite ? null : fliesAt(t), boat: boatAt(t, {}), camera: cameraAt(t)
    };
  }

  /* ------------------------------ Stage ------------------------------
   * Display-only actors on the live island. The game's own level-3 objects (wisps, lamps, boat, beams, sky) are
   * hidden and frozen while it is up (journey.js checks staged()); nothing here feeds back into rewards or saves. */
  var H = null, T = null, st = null, staged = false, kept = null;
  var PAL = {
    dusk: { top: 0x2c2f74, mid: 0x6c5cac, hor: 0xdc9aa6, low: 0x7e6ea8, lit: 0xf4dce4, shade: 0x6a5f9e, key: 0xc8a8d8, keyI: 0.5, hemiA: 0xb8a8e0, hemiB: 0x5a4a78, hemiI: 0.78, grass: [0.62, 0.7, 0.95], fog: 0x8a78b0 },
    night: { top: 0x0b1238, mid: 0x1b2964, hor: 0x46569a, low: 0x263270, lit: 0xdde5ff, shade: 0x2a3364, key: 0x9fb4ff, keyI: 0.42, hemiA: 0x7f92d8, hemiB: 0x2a2c58, hemiI: 0.64, grass: [0.38, 0.52, 0.84], fog: 0x202a5c }
  };
  var MOON_COL = 0xffe6b0, WARM = 0xffc878;
  var ramp4 = null, toons = {}, painted = [], tmpB = null, sA = {}, sB = {};
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
      if (!o.isMesh || o.isSkinnedMesh || o.l3cs || !o.material || o.material.length !== undefined || !o.material.isMeshLambertMaterial) return;
      o.l3cs = true; painted.push([o, o.material]); o.material = toonFor(o.material);
    });
  }
  function unpaint() {
    for (var i = 0; i < painted.length; i++) { painted[i][0].material = painted[i][1]; painted[i][0].l3cs = false; }
    painted = [];
  }
  var NOISE_GLSL = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }' +
    'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; } return s; }';
  var WIND_GLSL = 'float windF(vec2 p, float t){ float a = p.x * 0.86 + p.y * 0.5; float b = -p.x * 0.5 + p.y * 0.86;' +
    ' return (0.6 + 0.4 * sin(t * 0.31 + 0.7 + a * 0.12)) * (0.6 * sin(a * 1.2 - t * 1.5) + 0.25 * sin(b * 2.0 - t * 1.1 + a * 0.6) + 0.15 * sin(a * 3.3 - t * 2.9)); }';
  function buildStage() {
    if (st || !H || !T) return !!st;
    var g = new T.Group(), i;
    g.visible = false; H.island.add(g);
    st = { g: g, lamps: [], v: new T.Vector3(), tick: 0, kinds: '', pose: {} };
    tmpB = new T.Color();
    ramp4 = new T.DataTexture(new Uint8Array([96, 160, 218, 255]), 4, 1, T.LuminanceFormat);
    ramp4.minFilter = ramp4.magFilter = T.NearestFilter; ramp4.generateMipmaps = false; ramp4.needsUpdate = true;
    /* Watercolour night sky in one shader: a washed dusk-to-night gradient, hashed stars that twinkle, a cream-gold
     * moon with a halo, heaped moonlit clouds with silver rims, and below the horizon a drifting sea of clouds with a
     * path of moonlight on it. */
    st.skyU = { uTime: { value: 0 }, uStars: { value: 0 }, uMoon: { value: new T.Vector3() } };
    var names = ['Top', 'Mid', 'Hor', 'Low', 'Lit', 'Shade', 'MoonCol'];
    for (i = 0; i < names.length; i++) st.skyU['u' + names[i]] = { value: new T.Color() };
    st.skyU.uMoonCol.value.setHex(MOON_COL);
    st.sky = new T.Mesh(new T.SphereGeometry(110, 32, 20), new T.ShaderMaterial({ uniforms: st.skyU, side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uMoonCol; uniform vec3 uMoon;' +
        'uniform float uTime; uniform float uStars; varying vec3 vDir;' + NOISE_GLSL +
        'void main(){ vec3 d = normalize(vDir); float h = d.y; float wash = fbm(d.xz * 2.2 + d.y * 3.0 + 3.1); float hh = h + (wash - 0.5) * 0.2;' +
        ' vec3 col = mix(uHor, uMid, smoothstep(-0.04, 0.17, hh)); col = mix(col, uTop, smoothstep(0.1, 0.56, hh));' +
        ' col *= 0.93 + 0.14 * wash; float s = max(dot(d, uMoon), 0.0);' +
        // Stars: one per hashed cell, small soft dabs of white gouache; they come out as uStars rises.
        ' float starL = 0.0; vec3 starC = vec3(1.0);' +
        ' if (h > -0.02 && uStars > 0.0) { vec2 sp = d.xz / (abs(h) + 0.42) * 15.0; vec2 c = floor(sp); float r = hash(c);' +
        '  if (r > 0.7) { vec2 o = (vec2(hash(c + 3.1), hash(c + 7.7)) - 0.5) * 0.6; float dist = length(fract(sp) - 0.5 - o); float sz = 0.035 + 0.06 * hash(c + 1.3);' +
        '   starL = smoothstep(sz, 0.0, dist) * (0.62 + 0.38 * sin(uTime * (1.0 + 3.0 * r) + r * 40.0)) * uStars * smoothstep(-0.02, 0.12, h) * smoothstep(1.0, 0.7 + 0.3 * (1.0 - uStars), r * 0.3 + 0.7 * hash(c + 5.5));' +
        '   starC = mix(vec3(1.0, 0.93, 0.8), vec3(0.82, 0.9, 1.0), hash(c + 9.2)); } }' +
        // The moon: a cream-gold disc with faint grey-gold seas and a soft brushed edge, inside a wide warm halo.
        ' col += uMoonCol * (pow(s, 5.0) * 0.14 + pow(s, 50.0) * 0.2 + pow(s, 420.0) * 0.16);' +
        ' float disc = smoothstep(0.99855, 0.99915, s + (wash - 0.5) * 0.0003);' +
        ' vec3 moonPaint = mix(vec3(1.0, 0.94, 0.76), vec3(0.93, 0.83, 0.62), smoothstep(0.45, 0.7, noise(d.xy * 46.0 + 3.0)) * 0.55);' +
        ' col = mix(col + starC * starL * (1.0 - disc), moonPaint, disc);' +
        // Cumulus heaped along the horizon (lower under the moon so it stays clear), three flat tones and a silver rim.
        ' if (h > -0.3 && h < 0.6) { float az = atan(d.x, -d.z) + uTime * 0.005; vec2 p = vec2(az * 1.5, h * 3.4);' +
        '  float big = noise(vec2(az * 1.25 + 7.0, 2.5)); float mid = noise(vec2(az * 3.1 + 1.7, 9.5));' +
        '  float top = -0.1 + 0.46 * smoothstep(0.25, 0.8, big) + 0.08 * mid - 0.3 * smoothstep(0.86, 0.985, s); float bil = fbm(p * 2.6 + 4.0);' +
        '  float e = top - h + (bil - 0.5) * 0.3; float wet = 0.012 + 0.07 * smoothstep(0.35, 0.75, noise(p * 1.7 + 11.0)); float mask = smoothstep(0.0, wet, e);' +
        '  float rim = 1.0 - smoothstep(0.0, 0.11, e);' +
        '  float lite = rim * 0.85 + smoothstep(0.5, 0.75, bil) * 0.35 - smoothstep(0.2, 0.5, e) * 0.2;' +
        '  lite = clamp(lite, 0.0, 1.0) * 3.0 + 0.5; lite = clamp((floor(lite) + smoothstep(0.0, 0.35, fract(lite)) - 1.0) / 3.0, 0.0, 1.0);' +
        '  vec3 cloud = mix(uShade, uLit, lite) * (0.95 + 0.1 * wash); cloud += uMoonCol * (pow(s, 4.0) * 0.22 * rim + pow(s, 9.0) * 0.1);' +
        '  col = mix(col, cloud, mask * 0.96); }' +
        // The sea of clouds: billows on a plane far below, drifting; silver tops, violet troughs, moonlight along the moon's bearing.
        ' if (hh < 0.03) { vec2 uv = d.xz / (0.1 - min(h, 0.0)) * 0.55 + vec2(uTime * 0.012, uTime * 0.004); float n = fbm(uv); float n2 = noise(uv * 2.7 + 5.0);' +
        '  float bill = smoothstep(0.34, 0.68, n); float tone = clamp(floor((bill * (0.55 + 0.45 * n2)) * 3.0 + 0.5) / 3.0, 0.0, 1.0);' +
        '  vec3 sea = mix(mix(uLow, uShade, 0.5), uLit, tone * 0.85) * (0.94 + 0.12 * wash);' +
        '  float path = pow(max(dot(normalize(d.xz), normalize(uMoon.xz)), 0.0), 14.0); sea += uMoonCol * path * (0.1 + 0.26 * bill);' +
        '  sea = mix(sea, uHor, smoothstep(-0.2, 0.02, h) * 0.55); col = mix(col, sea, smoothstep(0.03, -0.05, hh)); }' +
        ' col *= 0.975 + 0.05 * hash(floor(gl_FragCoord.xy * 0.5)); gl_FragColor = vec4(col, 1.0); }' }));
    st.sky.renderOrder = -10; st.sky.frustumCulled = false; st.sky.visible = false; H.scene.add(st.sky);
    // Tall grass and wildflowers: instanced blades bent by the travelling wind wave; moon-silver crests, warm near a lit lamp.
    var seed = 31, n = H.IS_MOBILE ? 1500 : 2400, off = [], dim = [], hoff = [], hdim = [], k;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < n; i++) {
      var a = rnd() * TAU, r = Math.sqrt(rnd()) * 4.8, x = Math.cos(a) * r, z = Math.sin(a) * r;
      var hgt = 0.26 + 0.3 * rnd() + (r > 3.4 ? 0.22 * rnd() : 0), flower = i % 8 === 0, skipIt = false;
      if (H.POND && Math.sqrt((x - H.POND.x) * (x - H.POND.x) + (z - H.POND.z) * (z - H.POND.z)) < 1.45) continue;
      for (k = 0; k < 3; k++) if (Math.abs(x - LAMPS[k][0]) < 0.5 && Math.abs(z - LAMPS[k][1]) < 0.5) skipIt = true;
      if (skipIt) continue;
      if (flower) { hgt = 0.42 + 0.24 * rnd(); hoff.push(x, z, 0); hdim.push(hgt, 0.07 + 0.035 * rnd(), rnd()); }
      off.push(x, z, rnd() * TAU); dim.push(hgt, flower ? 0.022 : 0.05 + 0.03 * rnd(), rnd());
    }
    st.grassU = { uTime: { value: 0 }, uSoft: { value: soft }, uTopY: { value: H.TOP_Y }, uLight: { value: new T.Vector3(1, 1, 1) },
      uRoot: { value: new T.Color(0x5fae6a) }, uTip: { value: new T.Color(0xcdea96) },
      uLamps: { value: [new T.Vector3(LAMPS[0][0], LAMPS[0][1], 0), new T.Vector3(LAMPS[1][0], LAMPS[1][1], 0), new T.Vector3(LAMPS[2][0], LAMPS[2][1], 0)] } };
    function field(basePos, index, o, d, head) {
      var geo = new T.InstancedBufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(basePos, 3)); geo.setIndex(index);
      geo.setAttribute('aOff', new T.InstancedBufferAttribute(new Float32Array(o), 3)); geo.setAttribute('aDim', new T.InstancedBufferAttribute(new Float32Array(d), 3));
      geo.instanceCount = o.length / 3;
      var mesh = new T.Mesh(geo, new T.ShaderMaterial({ uniforms: st.grassU, side: T.DoubleSide, defines: head ? { HEAD: 1 } : {},
        vertexShader: 'attribute vec3 aOff; attribute vec3 aDim; uniform float uTime; uniform float uSoft; uniform float uTopY; uniform vec3 uLamps[3]; varying float vH; varying float vW; varying float vR; varying float vWarm;' + WIND_GLSL +
          'void main(){ float w = windF(aOff.xy, uTime); float lean = 0.2 + 0.52 * uSoft * w;\n#ifdef HEAD\n float h = 1.0; vec3 p = vec3(position.x, (1.0 - length(position.xy)) * 0.45, position.y) * aDim.y; p.y += aDim.x;\n' +
          '#else\n float h = position.y; float px = position.x * aDim.y * (1.0 - h * 0.82); vec3 p = vec3(px * cos(aOff.z), h * aDim.x, px * sin(aOff.z));\n#endif\n' +
          ' float k = lean * h * h * aDim.x; p.x += 0.86 * k; p.z += 0.5 * k; p.y -= 0.4 * lean * lean * h * h * aDim.x; vH = h; vW = w; vR = aDim.z; vWarm = 0.0;' +
          ' for (int i = 0; i < 3; i++) { vec2 dl = aOff.xy - uLamps[i].xy; vWarm += uLamps[i].z * exp(-dot(dl, dl) * 0.5); }' +
          ' gl_Position = projectionMatrix * modelViewMatrix * vec4(aOff.x + p.x, uTopY + p.y, aOff.y + p.z, 1.0); }',
        fragmentShader: 'uniform vec3 uRoot; uniform vec3 uTip; uniform vec3 uLight; varying float vH; varying float vW; varying float vR; varying float vWarm;' +
          'void main(){\n#ifdef HEAD\n vec3 col = vR < 0.3 ? vec3(1.0, 0.97, 0.9) : vR < 0.55 ? vec3(1.0, 0.76, 0.84) : vR < 0.8 ? vec3(1.0, 0.88, 0.5) : vec3(0.82, 0.76, 1.0); col *= mix(uLight, vec3(1.0), 0.35);\n' +
          '#else\n vec3 col = mix(uRoot, uTip, clamp(floor(vH * 3.0 + vR * 0.7) / 3.0, 0.0, 1.0)) * (0.92 + 0.16 * vR) * uLight; col += vec3(0.2, 0.25, 0.34) * smoothstep(0.25, 0.7, vW) * vH;\n#endif\n' +
          ' col += vec3(0.85, 0.5, 0.16) * vWarm * (0.22 + 0.4 * vH); gl_FragColor = vec4(col, 1.0); }' }));
      mesh.frustumCulled = false; mesh.l3cs = true; g.add(mesh);
      return mesh;
    }
    st.grass = field([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.34, 0, 0.5, 0.34, 0, -0.5, 0.67, 0, 0.5, 0.67, 0, 0, 1, 0], [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6], off, dim, false);
    var disc = [0, 0, 0], di = [];
    for (i = 0; i < 6; i++) { disc.push(Math.cos(i * TAU / 6), Math.sin(i * TAU / 6), 0); di.push(0, 1 + i, 1 + (i + 1) % 6); }
    st.heads = field(disc, di, hoff, hdim, true);
    st.blades = off.length / 3; st.blooms = hoff.length / 3;
    // The three star lamps (display-only copies of the game's pedestals): stone foot, gold ring, a warm core, a halo and a pool of light.
    var stone = new T.MeshLambertMaterial({ color: 0xa4b9bd }), gold = new T.MeshLambertMaterial({ color: 0xd5bb86, emissive: 0x6a4a1c, emissiveIntensity: 0 });
    st.gold = gold;
    var baseGeo = new T.CylinderGeometry(0.38, 0.48, 0.16, 8), stemGeo = new T.CylinderGeometry(0.12, 0.2, 0.55, 8), ringGeo = new T.TorusGeometry(0.31, 0.04, 4, 16), gemGeo = new T.OctahedronGeometry(0.17), poolGeo = new T.PlaneGeometry(1, 1);
    poolGeo.rotateX(-Math.PI / 2);
    for (i = 0; i < 3; i++) {
      var lg = new T.Group(); lg.position.set(LAMPS[i][0], H.TOP_Y, LAMPS[i][1]);
      part(baseGeo, stone, lg, 0, 0.08, 0).l3cs = true; part(stemGeo, stone, lg, 0, 0.42, 0).l3cs = true; part(ringGeo, gold, lg, 0, LAMP_Y, 0).l3cs = true;
      var core = part(gemGeo, new T.MeshBasicMaterial({ color: 0x706b8b }), lg, 0, LAMP_Y, 0); core.l3cs = true;
      var halo = sprite(H.glowTex, WARM, true); halo.position.y = LAMP_Y; lg.add(halo);
      var aura = sprite(H.glowTex, 0xffb870, true); aura.position.y = LAMP_Y + 0.1; lg.add(aura);
      var pool = part(poolGeo, new T.MeshBasicMaterial({ map: H.glowTex, color: 0xffb060, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }), lg, 0, 0.05, 0);
      pool.l3cs = true; pool.scale.set(3.4, 1, 3.4);
      g.add(lg); st.lamps.push({ g: lg, core: core, halo: halo, aura: aura, pool: pool });
    }
    st.dim = new T.Color(0x706b8b); st.warm = new T.Color(0xffdf9a);
    /* Fireflies. Glow: one small Points cloud (soft round dabs, additive), coloured like the player's catch. Body: the
     * game's wisp (a gem and two flapping wings) as one instanced draw; yaw, flap and scale ride in per-instance
     * attributes, so a frame only rewrites two small typed arrays. */
    st.fPos = new Float32Array(N * 3); st.fA = new Float32Array(N * 2); st.fCol = new Float32Array(N * 3); st.fRot = new Float32Array(N * 3);
    var aPos = new T.InstancedBufferAttribute(st.fPos, 3), aCol = new T.InstancedBufferAttribute(st.fCol, 3);
    var fg = new T.BufferGeometry();
    fg.setAttribute('position', new T.BufferAttribute(st.fPos, 3)); fg.setAttribute('aA', new T.BufferAttribute(st.fA, 2)); fg.setAttribute('aCol', new T.BufferAttribute(st.fCol, 3));
    st.flyU = { uPx: { value: 800 } };
    st.flies = new T.Points(fg, new T.ShaderMaterial({ uniforms: st.flyU, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: 'attribute vec2 aA; attribute vec3 aCol; uniform float uPx; varying float vA; varying vec3 vCol;' +
        'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aA.x; vCol = aCol; gl_PointSize = clamp(aA.y * uPx / max(-mv.z, 0.1), 2.0, 64.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; varying vec3 vCol; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = 1.0 - smoothstep(0.0, 1.0, d); gl_FragColor = vec4(mix(vCol, vec3(1.0), smoothstep(0.4, 0.0, d) * 0.75), a * a * vA); }' }));
    st.flies.frustumCulled = false; st.flies.renderOrder = 3; g.add(st.flies);
    var bp = [], bpart = [];
    function addPart(geo, sx, sy, sz, id) {
      var src = geo.index ? geo.toNonIndexed() : geo, pa = src.attributes.position;
      for (var q = 0; q < pa.count; q++) { bp.push(pa.getX(q) * sx, pa.getY(q) * sy, pa.getZ(q) * sz); bpart.push(id); }
    }
    var wingGeo = new T.SphereGeometry(0.13, 6, 4);
    addPart(gemGeo, 1, 1, 1, 0); addPart(wingGeo, 1.5, 0.22, 1, -1); addPart(wingGeo, 1.5, 0.22, 1, 1);
    var bg = new T.InstancedBufferGeometry();
    bg.setAttribute('position', new T.Float32BufferAttribute(bp, 3)); bg.setAttribute('aPart', new T.Float32BufferAttribute(bpart, 1));
    bg.setAttribute('aPos', aPos); bg.setAttribute('aCol', aCol); bg.setAttribute('aRot', new T.InstancedBufferAttribute(st.fRot, 3));
    bg.instanceCount = N;
    st.bodies = new T.Mesh(bg, new T.ShaderMaterial({
      vertexShader: 'attribute float aPart; attribute vec3 aPos; attribute vec3 aCol; attribute vec3 aRot; varying vec3 vCol;' +
        'void main(){ vec3 p = position; float f = aRot.y * aPart; float c = cos(f), s = sin(f); p = vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z); p.x += 0.26 * aPart;' +
        ' c = cos(aRot.x); s = sin(aRot.x); p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s) * aRot.z;' +
        ' vCol = mix(aCol, vec3(1.0), 0.18 + 0.3 * clamp(position.y / 0.17, -0.4, 1.0) * (1.0 - abs(aPart)));' +
        ' gl_Position = projectionMatrix * modelViewMatrix * vec4(aPos + p, 1.0); }',
      fragmentShader: 'varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.0); }' }));
    st.bodies.frustumCulled = false; st.bodies.l3cs = true; g.add(st.bodies);
    // The paper boat: the game's folded hull (one flat shade per face), lit from inside, on a little cloud.
    var bL = 0.66, bW = 0.32, B = [bL, 0.2, 0], S2 = [-bL, 0.2, 0], KF = [0.26, -0.12, 0], KB = [-0.26, -0.12, 0], A = [0, 0.05, bW], C = [0, 0.05, -bW], F = [0.24, 0.05, 0], G = [-0.24, 0.05, 0], P = [0, 0.44, 0];
    var faces = [[B, A, KF, 0xfff4dd], [A, KB, KF, 0xf4e6c9], [S2, KB, A, 0xfff4dd], [B, KF, C, 0xe6d6b6], [C, KF, KB, 0xdccaa8], [S2, C, KB, 0xe6d6b6],
      [B, F, A, 0xfffaf0], [B, C, F, 0xeadbbd], [S2, A, G, 0xfffaf0], [S2, G, C, 0xeadbbd], [P, A, F, 0xffffff], [P, G, A, 0xf8ecd4], [P, F, C, 0xeee0c4], [P, C, G, 0xe2d2b2]];
    var hp = [], hc = [];
    for (i = 0; i < faces.length; i++) { tmpB.setHex(faces[i][3]); for (k = 0; k < 3; k++) { hp.push(faces[i][k][0], faces[i][k][1], faces[i][k][2]); hc.push(tmpB.r, tmpB.g, tmpB.b); } }
    var hull = new T.BufferGeometry();
    hull.setAttribute('position', new T.Float32BufferAttribute(hp, 3)); hull.setAttribute('color', new T.Float32BufferAttribute(hc, 3));
    st.boatMat = new T.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: 0, side: T.DoubleSide, fog: false });
    st.boat = new T.Group(); st.boat.scale.set(BOAT_SCALE, BOAT_SCALE, BOAT_SCALE);
    st.boatBody = part(hull, st.boatMat, st.boat); st.boatBody.l3cs = true;
    st.boatGlow = sprite(H.glowTex, 0xffd9a0, true); st.boatGlow.position.y = 0.22; st.boatGlow.scale.set(2.3, 2.3, 1); st.boat.add(st.boatGlow);
    st.boatLamp = sprite(H.glowTex, 0xfff4cc, true); st.boatLamp.position.y = 0.48; st.boatLamp.scale.set(0.42, 0.42, 1); st.boat.add(st.boatLamp);
    st.puffs = [];
    var pd = [[-0.34, 0.8], [0.3, 0.72], [0, 1.05]];
    for (i = 0; i < 3; i++) { var pf = sprite(H.glowTex, 0xe6ecff, false); pf.position.set(pd[i][0], -0.2, 0); st.boat.add(pf); st.puffs.push(pf); }
    st.boat.visible = false; g.add(st.boat);
    /* The wake: one ribbon laid along where the boat has been (rebuilt in place each frame from wakeAt), widening and
     * fading with age, broken up like a dry brush stroke; plus a few glints that stay where they were dropped. */
    var wn = WAKE_SEG + 1, wuv = new Float32Array(wn * 4), widx = [];
    st.wPos = new Float32Array(wn * 6);
    for (i = 0; i < wn; i++) { wuv[i * 4] = i / WAKE_SEG; wuv[i * 4 + 1] = -1; wuv[i * 4 + 2] = i / WAKE_SEG; wuv[i * 4 + 3] = 1; if (i < WAKE_SEG) widx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    var wg = new T.BufferGeometry();
    wg.setAttribute('position', new T.BufferAttribute(st.wPos, 3)); wg.setAttribute('aUv', new T.BufferAttribute(wuv, 2)); wg.setIndex(widx);
    st.wakeU = { uTime: { value: 0 }, uAlpha: { value: 0 }, uStart: { value: 0 } };
    st.wakeMesh = new T.Mesh(wg, new T.ShaderMaterial({ uniforms: st.wakeU, transparent: true, depthWrite: false, side: T.DoubleSide,
      vertexShader: 'attribute vec2 aUv; varying vec2 vUv; void main(){ vUv = aUv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uTime; uniform float uAlpha; uniform float uStart; varying vec2 vUv;' + NOISE_GLSL +
        'void main(){ float a = vUv.x, v = abs(vUv.y); float fade = (1.0 - a) * (1.0 - a) * smoothstep(0.0, 0.04, a) * (1.0 - smoothstep(uStart - 0.2, uStart, a));' +
        ' float prof = pow(1.0 - v, 1.4) * 0.7 + smoothstep(0.4, 0.7, v) * (1.0 - smoothstep(0.78, 1.0, v)) * 0.55 * (0.3 + a);' +
        ' float n = noise(vec2(a * 16.0 - uTime * 0.35, vUv.y * 2.4 + 3.0)); float brush = 0.55 + 0.45 * smoothstep(0.25, 0.7, n);' +
        ' vec3 col = mix(vec3(1.0, 0.8, 0.46), vec3(1.0, 0.9, 0.74), smoothstep(0.0, 0.8, a));' +
        ' gl_FragColor = vec4(col, uAlpha * fade * prof * brush * (1.0 - smoothstep(0.88, 1.0, v))); }' }));
    st.wakeMesh.frustumCulled = false; st.wakeMesh.l3cs = true; st.wakeMesh.renderOrder = 2; g.add(st.wakeMesh);
    st.wake = [];
    for (i = 0; i < GLINTS; i++) { var ws = sprite(H.glowTex, 0xffe6b8, true); g.add(ws); st.wake.push(ws); }
    st.canvas = doc.querySelector('canvas');
    // The game's own sky and lights: borrowed while staged, handed back untouched.
    for (i = 0; i < H.scene.children.length; i++) {
      var ch = H.scene.children[i];
      if (ch.isHemisphereLight) st.hemi = ch; else if (ch.isDirectionalLight) st.sun = ch;
    }
    return true;
  }
  function buildCast() {
    var S3 = root.__l3Stage, caught = null;
    try { caught = S3 && S3.caught ? S3.caught() : null; } catch (e) { caught = null; }
    var cast = castFor(caught), key = cast.join(','), i, k;
    if (st.kinds === key) return;
    st.kinds = key; st.cast = cast;
    for (i = 0; i < N; i++) {
      for (k = 0; k < KINDS.length; k++) if (KINDS[k][0] === cast[i]) tmpB.setHex(KINDS[k][1]);
      st.fCol[i * 3] = tmpB.r; st.fCol[i * 3 + 1] = tmpB.g; st.fCol[i * 3 + 2] = tmpB.b;
    }
    st.flies.geometry.attributes.aCol.needsUpdate = true;
  }
  function hide(o) { if (o && o.visible) { o.visible = false; kept.hidden.push(o); } }
  function mix2(key, sk, out) { out.setHex(PAL.dusk[key]).multiplyScalar(sk.dusk); tmpB.setHex(PAL.night[key]).multiplyScalar(sk.night); return out.add(tmpB); }
  function mixS(a, b, sk) { return a * sk.dusk + b * sk.night; }
  function enterStage() {
    if (staged || !buildStage()) return;
    buildCast();
    kept = { hidden: [], sun: st.sun ? st.sun.color.getHex() : 0, hemi: st.hemi ? [st.hemi.color.getHex(), st.hemi.groundColor.getHex()] : null,
      fog: H.scene.fog ? H.scene.fog.color.getHex() : 0 };
    /* Off the set while the film runs (all come back on close): the game's sky dome, star points, moon sprites, the
     * orbiting islets and cloud puffs, and every level-3 gameplay object (wisps, lamps, beams, boat, constellations). */
    var i, ch, ud;
    for (i = 0; i < H.scene.children.length; i++) {
      ch = H.scene.children[i]; ud = ch.userData;
      if (ch === st.sky) continue;
      if (ch.isPoints || ch.isSprite) hide(ch);
      else if (ch.isMesh && ch.geometry && ch.geometry.parameters && ch.geometry.parameters.radius === 120) hide(ch);
      else if (ch.isGroup && ud && typeof ud.sp === 'number' && typeof ud.r === 'number' && typeof ud.a === 'number') hide(ch);
    }
    var S3 = root.__l3Stage, extra = S3 && S3.groups ? S3.groups() : [];
    for (i = 0; i < extra.length; i++) hide(extra[i]);
    extra = root.__l3Hide || [];
    for (i = 0; i < extra.length; i++) hide(extra[i]);
    if (root.GardenClip && root.GardenClip.boat) hide(root.GardenClip.boat);
    st.sky.visible = true; st.g.visible = true; st.tick = 0; paint();
    if (doc.body) doc.body.classList.add('l3cs-on');
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
    if (doc.body) doc.body.classList.remove('l3cs-on');
    staged = false; kept = null;
    // The game recomputes its own day/night target (and the camera is its own again from the next frame).
    try { if (H.refresh) H.refresh(); } catch (e) { /* keep closing */ }
  }
  function applyStage(t) {
    var f = frame(t, true), sk = f.sky, u = st.skyU, i, cam = H.camera, top = H.TOP_Y;
    if (H.setNightTarget) H.setNightTarget(1);
    if (H.setDeepNight) H.setDeepNight(0);
    // Other levels' catchable butterflies (preview on level 1) keep their own state; they are only kept out of the picture.
    var wild = root.__bf && root.__bf.butterflies ? root.__bf.butterflies : [];
    for (i = 0; i < wild.length; i++) if (wild[i].g) hide(wild[i].g);
    // Lamps: a warm core, a tight halo and a wide soft one, a pool of light on the grass.
    for (i = 0; i < 3; i++) {
      var L = st.lamps[i], gl = f.lamps[i], hs = 1.5 + 1.3 * gl, cs2 = 1 + 0.35 * gl;
      L.core.material.color.copy(st.dim).lerp(st.warm, clamp((gl - 0.3) / 0.6, 0, 1));
      L.core.scale.set(cs2, cs2, cs2); L.core.rotation.y = t * 0.5 + i;
      L.halo.material.opacity = 0.14 + 0.72 * gl; L.halo.scale.set(hs, hs, 1);
      L.aura.material.opacity = 0.34 * clamp((gl - 0.3) / 0.7, 0, 1); L.aura.scale.set(2.6 + 2.6 * gl, 2.6 + 2.6 * gl, 1);
      L.pool.material.opacity = 0.5 * gl;
      st.grassU.uLamps.value[i].z = gl;
    }
    st.gold.emissiveIntensity = clamp((f.lamps[1] - 0.3) / 0.7, 0, 1);
    // Fireflies
    var P = st.fPos, A = st.fA, R = st.fRot, b = st.pose;
    for (i = 0; i < N; i++) {
      flyAt(i, t, b);
      P[i * 3] = b.x; P[i * 3 + 1] = top + b.y; P[i * 3 + 2] = b.z;
      A[i * 2] = b.alpha * b.twinkle; A[i * 2 + 1] = b.size;
      R[i * 3] = b.yaw; R[i * 3 + 1] = b.flap; R[i * 3 + 2] = 0.8 * b.body * b.alpha;
    }
    st.flies.geometry.attributes.position.needsUpdate = true; st.flies.geometry.attributes.aA.needsUpdate = true;
    st.bodies.geometry.attributes.aPos.needsUpdate = true; st.bodies.geometry.attributes.aRot.needsUpdate = true;
    if (st.canvas) st.flyU.uPx.value = st.canvas.height / (2 * Math.tan(cam.fov * Math.PI / 360));
    // Boat and wake
    var bo = f.boat, on = bo.alpha > 0.01, W = st.wPos;
    st.boat.visible = on; st.wakeMesh.visible = on;
    st.boat.position.set(bo.x, top + bo.y, bo.z); st.boat.rotation.y = bo.yaw;
    st.boatBody.rotation.set(bo.roll, 0, bo.pitch);
    st.boatMat.opacity = bo.alpha; st.boatGlow.material.opacity = 0.8 * bo.glow; st.boatLamp.material.opacity = bo.glow;
    for (i = 0; i < 3; i++) { var ps = (i === 2 ? 1.05 : 0.76) + 0.08 * Math.sin(t * 0.9 + i * 2); st.puffs[i].scale.set(ps, ps * 0.62, 1); st.puffs[i].material.opacity = 0.34 * bo.alpha; }
    if (on) {
      for (i = 0; i <= WAKE_SEG; i++) {
        wakeAt(t, i / WAKE_SEG * WAKE_AGE, sA);
        var tl = Math.sqrt(sA.tx * sA.tx + sA.tz * sA.tz) || 1, nx = -sA.tz / tl * sA.half, nz = sA.tx / tl * sA.half;
        W[i * 6] = sA.x - nx; W[i * 6 + 1] = top + sA.y; W[i * 6 + 2] = sA.z - nz; W[i * 6 + 3] = sA.x + nx; W[i * 6 + 4] = top + sA.y; W[i * 6 + 5] = sA.z + nz;
      }
      st.wakeMesh.geometry.attributes.position.needsUpdate = true;
      st.wakeU.uTime.value = t; st.wakeU.uAlpha.value = 0.95 * bo.alpha; st.wakeU.uStart.value = clamp((t - BOAT_T0) / WAKE_AGE, 0, 1) + 0.2;
    }
    for (i = 0; i < GLINTS; i++) {
      var ws = st.wake[i], age = (t + i * WAKE_AGE / GLINTS) % WAKE_AGE, side = (hsh(i, 21) - 0.5) * 1.4;
      wakeAt(t, age, sA);
      ws.visible = on && sA.alpha > 0.01;
      if (!ws.visible) continue;
      var tl2 = Math.sqrt(sA.tx * sA.tx + sA.tz * sA.tz) || 1, gs = 0.4 + 0.4 * sA.age;
      ws.position.set(sA.x - sA.tz / tl2 * sA.half * side, top + sA.y + 0.04, sA.z + sA.tx / tl2 * sA.half * side); ws.scale.set(gs, gs, 1);
      ws.material.opacity = 0.8 * bo.alpha * sA.alpha * (0.6 + 0.4 * Math.sin(t * 3.1 + i * 2.3));
    }
    // Camera: overrides the gameplay orbit for this frame only; the game takes it back when we stop.
    var c = f.camera, halfH = Math.tan(cam.fov * Math.PI / 360), halfW = halfH * cam.aspect;
    var r = Math.max(c.w / halfW, c.w * 0.9 / halfH), v3 = st.v;
    v3.set(c.x, top + c.y + c.lift * r * halfH, c.z); H.island.localToWorld(v3);
    cam.position.set(v3.x + r * Math.sin(c.phi) * Math.cos(c.th), v3.y + r * Math.cos(c.phi), v3.z + r * Math.sin(c.phi) * Math.sin(c.th));
    cam.lookAt(v3);
    // Look: sky palette, moon, light and grass tint.
    mix2('top', sk, u.uTop.value); mix2('mid', sk, u.uMid.value); mix2('hor', sk, u.uHor.value); mix2('low', sk, u.uLow.value);
    mix2('lit', sk, u.uLit.value); mix2('shade', sk, u.uShade.value);
    u.uTime.value = t; u.uStars.value = sk.stars; u.uMoon.value.set(f.moon.x, f.moon.y, f.moon.z).normalize();
    st.sky.position.copy(cam.position);
    if (H.scene.fog) mix2('fog', sk, H.scene.fog.color);
    if (st.sun) { mix2('key', sk, st.sun.color); st.sun.intensity = mixS(PAL.dusk.keyI, PAL.night.keyI, sk); }
    if (st.hemi) { mix2('hemiA', sk, st.hemi.color); mix2('hemiB', sk, st.hemi.groundColor); st.hemi.intensity = mixS(PAL.dusk.hemiI, PAL.night.hemiI, sk); }
    st.grassU.uTime.value = t; st.grassU.uSoft.value = soft;
    st.grassU.uLight.value.set(mixS(PAL.dusk.grass[0], PAL.night.grass[0], sk), mixS(PAL.dusk.grass[1], PAL.night.grass[1], sk), mixS(PAL.dusk.grass[2], PAL.night.grass[2], sk));
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
    '#l3cs{position:fixed;top:0;left:0;right:0;bottom:0;z-index:60;overflow:hidden;color:#fff;touch-action:none;',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '#l3cs.hidden{display:none}',
    // The veil cools the live island instead of hiding it.
    '#l3csVeil{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;',
    'background:linear-gradient(180deg,#141a52 0%,#3a3c8c 50%,#6a5aa0 100%)}',
    // Paper grain and a deepened, uneven edge: the frame reads as night watercolour on cold-pressed paper.
    // Both sit beside #l3cs (not inside it) so their blend modes reach the game canvas underneath.
    '#l3csPaper{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;opacity:.75;mix-blend-mode:multiply;background-size:240px 240px}',
    '#l3csEdge{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;mix-blend-mode:multiply;',
    'background:radial-gradient(ellipse at 50% 44%,rgba(120,124,190,0) 50%,rgba(60,62,130,.5) 100%);box-shadow:inset 0 0 80px rgba(40,40,110,.45)}',
    '.l3cs-bar{position:absolute;left:0;right:0;height:7%;background:#0c0e26;pointer-events:none}',
    '#l3csTop{top:0;transform-origin:50% 0}#l3csBottom{bottom:0;transform-origin:50% 100%}',
    '#l3csCaption{position:absolute;left:5%;right:5%;bottom:14.5%;text-align:center;font-size:17px;line-height:1.7;letter-spacing:1.5px;white-space:nowrap;',
    'padding:14px 0 12px;color:#fffdf6;text-shadow:0 1px 2px rgba(10,12,44,.9),0 0 10px rgba(16,18,60,.8);pointer-events:none;',
    'background:radial-gradient(ellipse at 50% 50%,rgba(14,16,54,.46) 0%,rgba(14,16,54,.28) 45%,rgba(14,16,54,0) 72%)}',
    '#l3csSkip{position:absolute;top:12px;top:calc(12px + env(safe-area-inset-top));right:12px;right:calc(12px + env(safe-area-inset-right));',
    'min-width:64px;min-height:44px;padding:0 16px;border-radius:22px;font:inherit;font-size:14px;letter-spacing:3px;color:#fffaf0;cursor:pointer;',
    'background:rgba(90,100,170,.3);border:1px solid rgba(226,232,255,.46);box-shadow:0 4px 18px rgba(10,12,44,.3);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#l3csSkip:active{background:rgba(130,140,210,.44)}',
    // Everything but the canvas and the cutscene steps aside, so the island reads as a film frame.
    'body.l3cs-on>:not(canvas):not(#l3cs):not(.l3cs-paint){visibility:hidden!important}',
    '.l3cs-paint.hidden{display:none}',
    '#l3csEnd{position:absolute;left:0;right:0;top:28%;text-align:center;pointer-events:none}',
    '#l3csTitle{font-family:"Songti SC","Noto Serif CJK SC","Source Han Serif SC",STSong,serif;font-size:32px;font-weight:600;letter-spacing:8px;text-indent:8px;',
    'text-shadow:0 1px 3px rgba(10,12,44,.85),0 0 22px rgba(255,226,170,.55),0 2px 12px rgba(16,18,60,.7)}',
    '#l3csRule{width:132px;height:1px;margin:16px auto 0;background:linear-gradient(90deg,transparent,rgba(255,236,196,.9),transparent)}',
    '#l3csSub{margin-top:14px;font-size:17px;letter-spacing:14px;text-indent:14px;opacity:.96;text-shadow:0 1px 2px rgba(10,12,44,.85),0 1px 10px rgba(16,18,60,.7)}',
    '#l3csGo{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);min-width:168px;min-height:44px;padding:0 26px;border-radius:24px;font:inherit;font-size:15px;letter-spacing:5px;color:#fffaf0;',
    'cursor:pointer;pointer-events:auto;background:rgba(40,44,110,.55);border:1px solid rgba(255,236,196,.6);text-shadow:0 1px 2px rgba(10,12,44,.8);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:l3csPulse 2.4s ease-in-out infinite}',
    '#l3csGo.hidden,#l3csSkip.hidden{display:none}',
    '@keyframes l3csPulse{0%,100%{opacity:.62}50%{opacity:1}}',
    '#l3csClock{position:absolute;left:12px;left:calc(12px + env(safe-area-inset-left));bottom:10px;bottom:calc(10px + env(safe-area-inset-bottom));',
    'font-size:11px;letter-spacing:1px;opacity:.55;pointer-events:none;font-variant-numeric:tabular-nums}',
    '#l3csClock.hidden{display:none}',
    '@media (orientation:landscape) and (max-height:480px){#l3csCaption{bottom:13%;font-size:14px}#l3csTitle{font-size:24px}',
    '#l3csEnd{top:13%}#l3csRule{margin-top:8px}#l3csSub{margin-top:8px;font-size:14px}#l3csGo{bottom:11%;left:auto;right:5%;transform:none}.l3cs-bar{height:9%}}',
    '@media (prefers-reduced-motion:reduce){#l3csGo{animation:none}}'
  ].join('');

  // Procedural paper: speckle, a few fibres and soft brush streaks; drawn once, tiled by CSS.
  function paperTexture() {
    try {
      var c = doc.createElement('canvas'), S = 240, g, i, seed = 13;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      c.width = c.height = S; g = c.getContext('2d');
      g.fillStyle = '#eef0f8'; g.fillRect(0, 0, S, S);
      for (i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '70,74,120,' : '255,255,255,') + (0.05 + 0.1 * rnd()).toFixed(3) + ')'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
      for (i = 0; i < 26; i++) {
        var x = rnd() * S, y = rnd() * S, a = rnd() * 6.283, l = 8 + rnd() * 22;
        g.strokeStyle = 'rgba(84,88,140,' + (0.06 + 0.08 * rnd()).toFixed(3) + ')'; g.lineWidth = 0.6 + rnd() * 0.5;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5 - 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      for (i = 0; i < 9; i++) { g.fillStyle = 'rgba(90,94,150,' + (0.012 + 0.016 * rnd()).toFixed(3) + ')'; g.fillRect(0, rnd() * S, S, 5 + rnd() * 16); }
      el.Paper.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { el.Paper.style.display = 'none'; }
  }
  function stop(e) { if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }
  function build() {
    if (el || !doc || !doc.body) return;
    var style = doc.createElement('style'); style.id = 'l3csStyle'; style.textContent = CSS;
    doc.head.appendChild(style);
    var box = doc.createElement('div'); box.id = 'l3cs'; box.className = 'hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', TITLE);
    box.innerHTML = '<div id="l3csVeil"></div>' +
      '<div id="l3csTop" class="l3cs-bar"></div><div id="l3csBottom" class="l3cs-bar"></div>' +
      '<div id="l3csCaption"></div>' +
      '<div id="l3csEnd"><div id="l3csTitle">' + TITLE + '</div><div id="l3csRule"></div><div id="l3csSub">' + SUBTITLE + '</div></div>' +
      '<button id="l3csGo" class="hidden" type="button">' + CONTINUE + '</button>' +
      '<button id="l3csSkip" type="button" aria-label="跳过过场动画">' + SKIP + '</button>' +
      '<div id="l3csClock"></div>';
    doc.body.appendChild(box);
    el = { box: box };
    var layers = ['Edge', 'Paper'];
    for (var p = 0; p < layers.length; p++) { var layer = doc.createElement('div'); layer.id = 'l3cs' + layers[p]; layer.className = 'l3cs-paint hidden'; doc.body.insertBefore(layer, box); el[layers[p]] = layer; }
    var ids = ['Veil', 'Top', 'Bottom', 'Caption', 'End', 'Go', 'Skip', 'Clock'];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = doc.getElementById('l3cs' + ids[i]);
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
    el.Paper.className = el.Edge.className = open ? 'l3cs-paint' : 'l3cs-paint hidden';
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
  // The score will live in l3-cutscene-music.js (window.__l3Score); muted runs (headless capture) never start it.
  function score() { return root.__l3Score || null; }
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
    // True from play() until close(): journey.js treats the film like an open dialog (no gameplay input).
    busy: function () { time(); return isOpen(); },
    // True while the stage owns the island: journey.js freezes the wisps, lamps and boat for that time.
    staged: function () { return staged; },
    stage: function () {
      return { staged: staged, reduced: soft < 1, toon: painted.length, blades: st ? st.blades : 0, blooms: st ? st.blooms : 0,
        flies: st ? N : 0, cast: st && st.cast ? st.cast.slice() : [], lamps: st ? st.lamps.length : 0, boat: !!(st && st.boat.visible),
        sky: !!(st && st.sky.visible), hidden: kept ? kept.hidden.length : 0,
        camera: H ? H.camera.position.toArray().map(function (v) { return +v.toFixed(3); }) : null };
    },
    pause: pause, resume: resume, close: close, proceed: proceed,
    state: function () { time(); return state; },
    beat: function () { return beatAt(time()).id; },
    beats: function () { return BEATS.map(function (b) { return { id: b.id, t0: b.t0, t1: b.t1, caption: b.caption }; }); },
    frame: function (t) { return frame(t === undefined ? time() : clamp(+t || 0, 0, DURATION)); },
    text: function () { return { title: TITLE, subtitle: SUBTITLE, cont: CONTINUE, skip: SKIP }; },
    layout: function () { return { lamps: LAMPS, lampY: LAMP_Y, count: N, kinds: KINDS.map(function (k) { return k[0]; }), boat: BOAT, boatT0: BOAT_T0, wakeAge: WAKE_AGE, release: REL, releaseStep: REL_STEP, climb: CLIMB }; },
    // Pose of one firefly at t (the stage uses exactly this), and the colours the cast wears for a given catch.
    fly: function (j, t) { return flyAt(clamp(j | 0, 0, N - 1), +t || 0, {}); },
    boat: function (t) { return boatAt(+t || 0, {}); },
    wake: function (t, age) { return wakeAt(+t || 0, +age || 0, {}); },
    // What is actually on stage this frame (island-local; y above the grass): for the seek/determinism checks.
    probe: function () {
      if (!st || !staged) return null;
      var out = { flies: [], bodies: [], boat: [st.boat.position.x, st.boat.position.y - H.TOP_Y, st.boat.position.z, st.boat.rotation.y], wake: [] }, i;
      for (i = 0; i < N; i++) { out.flies.push([st.fPos[i * 3], st.fPos[i * 3 + 1] - H.TOP_Y, st.fPos[i * 3 + 2], st.fA[i * 2]]); out.bodies.push(st.fRot[i * 3 + 2]); }
      if (st.wakeMesh.visible) for (i = 0; i < st.wPos.length; i += 6) out.wake.push([st.wPos[i], st.wPos[i + 2]]); // the ribbon's left edge
      return out;
    },
    castFor: castFor,
    muted: function () { return muted; },
    scored: function () { return scored; },
    // In-game hook switch; session-only, never saved. On by default, ?l3cutscene=0 goes straight to the card.
    enabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; return enabled; },
    _setClock: function (fn) { clock = fn; }
  };
  root.__l3Cutscene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  enabled = query('l3cutscene') !== '0';
  muted = query('mute') === '1';
  if (!doc) return;
  function boot() {
    build();
    if (query('cutscene') !== 'l3') return;
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
