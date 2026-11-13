/* l1-cutscene.js: level-1 clear cutscene (the butterflies go back to the sky).
 * A seekable 50s timeline shown when the 30th point of 心动 is collected. Every visual is a pure function of the
 * timeline second, so seek(t) reproduces any frame. Storyboard: docs/l1-cutscene-storyboard.md.
 * Same architecture as l2-cutscene.js: a pure model (camera, sky, wind, butterflies as numbers), a three.js stage
 * that poses display-only actors on the live island from that model, and a DOM layer (bars, captions, title).
 * This file never reads or writes a save; the caller's onContinue decides what happens afterwards. */
(function (root) {
  'use strict';
  var DURATION = 50;
  // Clock times are seconds from play(); beats are contiguous and end at DURATION.
  var BEATS = [
    { id: 'meadow', t0: 0, t1: 9, caption: '风从云下吹来，草浪一层层漫过小岛' },
    { id: 'release', t0: 9, t1: 19, caption: '你轻轻打开网，三十份心动回到风里' },
    { id: 'dance', t0: 19, t1: 32, caption: '它们绕着花丛打转，在花心上歇一歇' },
    { id: 'ribbon', t0: 32, t1: 43, caption: '然后一起飞起来，像一条丝带，飘向晚霞' },
    { id: 'title', t0: 43, t1: 50, caption: '' }
  ];
  var TITLE_AT = 43.5, TITLE_FADE = 3, CONTINUE_GUARD_MS = 600;
  var TITLE = '第一关 · 完成', SUBTITLE = '暮色浮岛', CONTINUE = '轻触继续', SKIP = '跳过';

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
  /* Wind: one travelling-wave field shared by the grass shader (same formula in GLSL) and the flowers. */
  var WIND = { x: 0.86, z: 0.5 };
  function windAt(x, z, t) {
    var a = x * WIND.x + z * WIND.z;
    return (0.65 + 0.35 * Math.sin(t * 0.37 + 1)) * (0.55 * Math.sin(a * 1.3 - t * 1.6) + 0.3 * Math.sin(a * 2.9 - t * 2.7 + z * 1.1) + 0.15 * Math.sin((-0.4 * x + 0.9 * z) * 4.1 - t * 3.3));
  }
  // Sky palette weights: golden afternoon -> rose sunset. The sun sinks the whole time; it never becomes night.
  function skyAt(t) { var rose = ease(ramp(t, 16, 44)); return { gold: 1 - rose, rose: rose }; }
  function sunAt(t) { return { x: -0.34, y: 0.21 - 0.15 * ease(ramp(t, 0, 46)), z: -1 }; }
  // Where the net opens (front of the island, clear of the pond and the tree), and the blossoms the butterflies visit.
  var NET = { x: 0.5, z: 2.6 }, N = 18, REL = 10, REL_STEP = 0.42, RISE = 32, FLY_SCALE = 0.6, FLOOR_Y = 0.5;
  var FLOWERS = [[-1.6, 1.5], [-0.4, 2.2], [1.4, 1.8], [2.7, 0.8], [-3.0, 0.4], [0.3, 0.6], [-1.2, -0.5], [1.0, -0.1]];
  var HEAD_Y = 0.58, TRAIL = 5, FLECK = 3, PER = TRAIL + FLECK;
  function netAt(t) { return ease(ramp(t, 8.6, 10.2)) * (1 - ease(ramp(t, 17.5, 20))); }
  /* Butterflies (item 2). Everything is closed-form in t (no integration, no stored velocity), so seek(t) lands every
   * butterfly exactly where straight playback would. Per-butterfly character comes from a fixed hash table. */
  function hsh(j, k) { var s = Math.sin(j * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }
  var HK = 12, HS = [], sA = { x: 0, y: 0, z: 0 }, sB = { x: 0, y: 0, z: 0 }, sH = { x: 0, y: 0, z: 0, lean: 0 };
  (function () { for (var j = 0; j < N; j++) for (var k = 0; k < HK; k++) HS.push(hsh(j + 1, k + 1)); })();
  function hv(j, k) { return HS[j * HK + k]; }
  // A visited blossom's head: the stem leans with the wind, and a perched butterfly rides it.
  function headAt(i, t, out) {
    var F = FLOWERS[i], lean = 0.06 + 0.2 * soft * windAt(F[0], F[1], t);
    out.x = F[0] + HEAD_Y * Math.sin(lean); out.y = HEAD_Y * Math.cos(lean); out.z = F[1]; out.lean = lean;
    return out;
  }
  // Landings come in three waves, so a blossom only ever holds one butterfly.
  function perchT(j) { return 20.4 + (j % FLOWERS.length) * 0.5 + Math.floor(j / FLOWERS.length) * 4.1; }
  function perchAt(j, t) { var p0 = perchT(j); return ease(ramp(t, p0, p0 + 1.2)) * (1 - ease(ramp(t, p0 + 3, p0 + 4))); }
  function riseAt(j, t) { return ease(ramp(t, RISE + j * 0.12, RISE + 4 + j * 0.12)); }
  /* Wing beat with a natural rhythm: bursts of fast beats, then a short glide with the wings held in a shallow V.
   * The phase is piecewise linear in t (it simply stops during a glide), so it needs no stored state. */
  function beatAtJ(j, t, out) {
    var P = 2.4 + 1.8 * hv(j, 7), g = 0.3 + 0.3 * hv(j, 8), tt = t + 7 * hv(j, 9), n = Math.floor(tt / P), u = tt - n * P;
    out.x = (11 + 3 * hv(j, 6)) * (0.4 + 0.6 * soft) * (n * (P - g) + Math.min(u, P - g)) + j * 1.7; // phase
    out.y = ease(ramp(u, P - g, P - g + 0.1)) * (1 - ease(ramp(u, P - 0.1, P)));                      // glide 0..1
    return out;
  }
  // The ribbon: one rising spiral that drifts towards the sun; three lanes wide, each butterfly a little behind the last,
  // so the line reaches from the meadow up to the clouds.
  function ribbonAt(j, t, out) {
    // Before its turn to climb (s < 0) a butterfly circles low over the island; the line peels upward from the front.
    var q = (t - RISE - 0.5) * 0.085 - j * 0.042, s = Math.max(0, q), lane = (j % 3 - 1) * 0.17, a = 2.4 - q * 4.2;
    var r = 2.3 * (1 - 0.6 * Math.min(s, 1)) + lane + 0.1 * Math.sin(j * 1.3);
    out.x = -1.6 * s * s + Math.cos(a) * r; out.z = -5.5 * s * s + Math.sin(a) * r;
    out.y = 1.15 + 2.2 * s + 2.6 * s * s + 0.3 * lane + 0.24 * soft * Math.sin(7 * s - 1.2 * t + j * 0.5);
    return out;
  }
  /* Position of butterfly j at t, written into out (no allocation: the trail samples this many times a frame).
   * Free flight is a loose flock: everyone circles a shared, wandering centre on its own tilted orbit (cohesion and
   * a common swirl, as in boids, but solved rather than simulated), with a small divergence-free flutter on top
   * (sines in quadrature per axis, i.e. the curl of a sine potential). Each butterfly peels off towards its blossom
   * before its landing, sits on the swaying head, lifts off, and finally joins the ribbon. */
  function flyPos(j, t, out) {
    var rel = REL + j * REL_STEP, k = 0.5 + 0.5 * soft, dir = j % 2 ? -1 : 1, fi = j % FLOWERS.length, F = FLOWERS[fi];
    // flock
    var a = dir * (0.5 + 0.35 * hv(j, 0)) * t * k + hv(j, 1) * TAU, r = 0.7 + 0.9 * hv(j, 2) + 0.3 * Math.sin(0.5 * t + j);
    var x = 0.2 + 1.3 * Math.sin(0.23 * t + 0.6) + Math.cos(a) * r, z = 1.3 + 0.8 * Math.sin(0.17 * t + 2) + Math.sin(a) * r * 0.8;
    var y = 1.55 + 0.2 * Math.sin(0.31 * t) + 0.8 * (hv(j, 3) - 0.5) + 0.28 * Math.sin(0.7 * t + j * 1.9) + 0.25 * Math.sin(a + hv(j, 4) * TAU);
    // its own blossom: a breathing orbit just above the flower head
    var p0 = perchT(j), near = ease(ramp(t, p0 - 2.6, p0 - 0.4)) * (1 - ease(ramp(t, p0 + 4, p0 + 6.2)));
    if (near > 0) {
      var oa = dir * (0.9 + 0.1 * (j % 5)) * t * k + j * 2.4, or = 0.5 + 0.18 * Math.sin(0.6 * t + j * 1.7);
      x = lerp(x, F[0] + Math.cos(oa) * or, near); z = lerp(z, F[1] + Math.sin(oa) * or * 0.85, near);
      y = lerp(y, 1.0 + 0.2 * Math.sin(0.8 * t + j * 1.9), near);
    }
    // out of the net: a widening corkscrew
    var out01 = ease(ramp(t, rel, rel + 3.2));
    if (out01 < 1) {
      var sw = Math.sin(Math.PI * out01) * 0.6, sa = t * 2.2 + j;
      x = lerp(NET.x, x, out01) + sw * Math.cos(sa); y = lerp(0.75, y, out01) + sw * 0.5; z = lerp(NET.z, z, out01) + sw * Math.sin(sa);
    }
    // settle on the flower head
    var L = perchAt(j, t);
    if (L > 0) { headAt(fi, t, sH); x = lerp(x, sH.x, L); y = lerp(y, sH.y + 0.06, L); z = lerp(z, sH.z, L); }
    // the ribbon
    var up = riseAt(j, t);
    if (up > 0) { ribbonAt(j, t, sH); x = lerp(x, sH.x, up); y = lerp(y, sH.y, up); z = lerp(z, sH.z, up); }
    // flutter: never while perched, gentler in formation; the body also bobs with each wing beat
    var f1 = 1.9 + 1.2 * hv(j, 5), w = soft * (1 - L) * (1 - 0.55 * up);
    beatAtJ(j, t, sH);
    x += w * (0.14 * Math.sin(f1 * t + j * 2.1) + 0.06 * Math.sin(2.7 * f1 * t + j));
    y += w * (0.11 * Math.cos(f1 * t + j * 2.1) + 0.035 * Math.sin(sH.x) * (1 - sH.y));
    z += w * (0.14 * Math.cos(0.9 * f1 * t + j * 1.3) - 0.06 * Math.cos(2.7 * f1 * t + j));
    out.x = x; out.y = y < FLOOR_Y ? FLOOR_Y : y; out.z = z;
    return out;
  }
  function turn(a, b, u) { var d = b - a; d -= TAU * Math.floor(d / TAU + 0.5); return a + d * u; }
  // Full pose of butterfly j at t, written into out.
  function flyAt(j, t, out) {
    var rel = REL + j * REL_STEP, L = perchAt(j, t), up = riseAt(j, t), dt = 0.08;
    flyPos(j, t, sA); flyPos(j, t + dt, sB);
    var vx = (sB.x - sA.x) / dt, vy = (sB.y - sA.y) / dt, vz = (sB.z - sA.z) / dt, vh = Math.sqrt(vx * vx + vz * vz);
    beatAtJ(j, t, sB);
    var beat = (Math.sin(sB.x) * 1.05 + 0.2) * (1 - sB.y) + 0.45 * sB.y;
    // At rest the wings open and close slowly, from folded upright to almost flat.
    var wing = lerp(beat, 0.74 + 0.56 * Math.sin(1.5 * t + j * 2.3), L);
    out = out || {};
    out.x = sA.x; out.y = sA.y; out.z = sA.z;
    out.alpha = ease(ramp(t, rel - 0.1, rel + 0.7));
    out.yaw = turn(Math.atan2(vx, vz), hv(j, 10) * TAU, L);
    out.pitch = clamp(Math.atan2(vy, vh + 0.4), -0.7, 0.7) * 0.7 * (1 - L);
    out.perch = L; out.rise = up; out.flower = j % FLOWERS.length;
    out.wing = wing; out.flap = clamp((wing - 0.2) / 1.05, -1, 1); out.glide = sB.y * (1 - L);
    out.scale = FLY_SCALE * (0.88 + 0.26 * hv(j, 11)) * (1 + 1.1 * ease(ramp(t, RISE + 2, 46)));
    // How strongly it sheds its soft trail: a little in the dance, most in the ribbon, none at rest.
    out.trail = out.alpha * (1 - L) * (0.4 + 0.6 * up);
    return out;
  }
  function fliesAt(t) { var out = []; for (var j = 0; j < N; j++) out.push(flyAt(j, t, {})); return out; }
  function headsAt(t) { var out = []; for (var i = 0; i < FLOWERS.length; i++) out.push(headAt(i, t, { x: 0, y: 0, z: 0, lean: 0 })); return out; }
  /* Camera keys: look-at point, azimuth th (PI/2 = the gameplay side), polar phi, half-width w that
   * must stay in frame, and lift = how far above the look-at the frame centre sits (in half-screens). */
  // Slow and wide: a far establishing shot under the big sky, a glide down to the net, a drift across the flowers, a crane up.
  var CAM = [
    { t: 0, x: 0, y: 1.4, z: 0, th: 1.3, phi: 1.46, w: 8.6, lift: 0.26 },
    { t: 9, x: 0.1, y: 0.9, z: 0.5, th: 1.5, phi: 1.36, w: 6.0, lift: 0.1 },
    { t: 14, x: NET.x - 0.1, y: 0.8, z: NET.z - 0.6, th: 1.68, phi: 1.3, w: 3.2, lift: 0.04 },
    { t: 19, x: 0.2, y: 0.9, z: 1.5, th: 1.6, phi: 1.3, w: 3.6, lift: 0.05 },
    { t: 26, x: -0.5, y: 0.75, z: 1.5, th: 1.78, phi: 1.3, w: 2.8, lift: 0.03 },
    { t: 32, x: 0.2, y: 0.9, z: 0.9, th: 1.62, phi: 1.32, w: 4.2, lift: 0.08 },
    { t: 38, x: 0, y: 2.2, z: 0, th: 1.52, phi: 1.46, w: 5.6, lift: 0.16 },
    { t: 43, x: -0.4, y: 3.4, z: -1.2, th: 1.47, phi: 1.52, w: 6.4, lift: 0.2 },
    { t: 50, x: -0.8, y: 4.4, z: -2.4, th: 1.44, phi: 1.54, w: 7.4, lift: 0.26 }
  ];
  var CAM_KEYS = ['x', 'y', 'z', 'th', 'phi', 'w', 'lift'];
  function cameraAt(t) {
    var i = 0;
    while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
    var a = CAM[i], b = CAM[i + 1], u = ease(ramp(t, a.t, b.t)), out = {};
    for (var k = 0; k < CAM_KEYS.length; k++) out[CAM_KEYS[k]] = lerp(a[CAM_KEYS[k]], b[CAM_KEYS[k]], u);
    return out;
  }
  // Everything the renderer needs, derived from t alone.
  function frame(t, lite) {
    var b = beatAt(t), local = t - b.t0, len = b.t1 - b.t0, sk = skyAt(t);
    return {
      t: t, beat: b.id, caption: b.caption,
      captionAlpha: b.caption ? Math.min(ramp(local, 0.4, 1.8), 1 - ramp(local, len - 1.4, len - 0.2)) : 0,
      look: 'painterly', sky: sk, sun: sunAt(t), wind: windAt(0, 0, t),
      // Warm light: night is the game's own day/night mix (kept low: this is sunset, not night); veil is the DOM tint.
      night: 0.36 + 0.22 * sk.rose, veil: 0.02 + 0.07 * sk.rose, light: 1 - 0.25 * sk.rose,
      bars: ease(ramp(t, 0, 2.5)),
      title: ease(ramp(t, TITLE_AT, TITLE_AT + TITLE_FADE)),
      canContinue: t >= DURATION,
      net: netAt(t), flies: lite ? null : fliesAt(t), flowers: lite ? null : headsAt(t), camera: cameraAt(t)
    };
  }

  /* ------------------------------ Stage ------------------------------
   * Display-only actors on the live island. The catchable butterflies are hidden and frozen while it is up
   * (butterfly.js checks staged()); nothing here feeds back into rewards, counts or saves. */
  var H = null, T = null, st = null, staged = false, kept = null, sky = null;
  var PAL = {
    gold: { top: 0x3f84d8, mid: 0x7fbcee, hor: 0xe4f0ea, low: 0xbfd8e6, lit: 0xfffdf2, shade: 0xc6c2d8, sun: 0xffd698, key: 0xffb45e, keyI: 0.85, hemiA: 0xfff0d0, hemiB: 0xb8946f, hemiI: 0.72, grass: [1.08, 1.0, 0.8], fog: 0xf2e6cc },
    rose: { top: 0x5a6cb4, mid: 0xd29ab0, hor: 0xffb574, low: 0xdc9278, lit: 0xffd49e, shade: 0x9a769e, sun: 0xff9a5c, key: 0xff9a70, keyI: 0.62, hemiA: 0xf6ccd0, hemiB: 0x86689a, hemiI: 0.7, grass: [1.04, 0.86, 0.76], fog: 0xeaae90 }
  };
  var ramp4 = null, toons = {}, painted = [], tmpB = null;
  function sprite(map, color, additive) {
    var m = new T.SpriteMaterial({ map: map, color: color, transparent: true, opacity: 0, depthWrite: false });
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
      if (!o.isMesh || o.isSkinnedMesh || o.l1cs || !o.material || o.material.length !== undefined || !o.material.isMeshLambertMaterial) return;
      o.l1cs = true; painted.push([o, o.material]); o.material = toonFor(o.material);
    });
  }
  function unpaint() {
    for (var i = 0; i < painted.length; i++) { painted[i][0].material = painted[i][1]; painted[i][0].l1cs = false; }
    painted = [];
  }
  var NOISE_GLSL = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }' +
    'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; } return s; }';
  var WIND_GLSL = 'float windF(vec2 p, float t){ float a = p.x * 0.86 + p.y * 0.5; return (0.65 + 0.35 * sin(t * 0.37 + 1.0)) * (0.55 * sin(a * 1.3 - t * 1.6) + 0.3 * sin(a * 2.9 - t * 2.7 + p.y * 1.1) + 0.15 * sin((-0.4 * p.x + 0.9 * p.y) * 4.1 - t * 3.3)); }';
  function buildStage() {
    if (st || !H || !T) return !!st;
    var g = new T.Group(), i;
    g.visible = false; H.island.add(g);
    st = { g: g, flies: [], flowers: [], v: new T.Vector3(), tick: 0, kinds: '' };
    tmpB = new T.Color();
    ramp4 = new T.DataTexture(new Uint8Array([96, 160, 218, 255]), 4, 1, T.LuminanceFormat);
    ramp4.minFilter = ramp4.magFilter = T.NearestFilter; ramp4.generateMipmaps = false; ramp4.needsUpdate = true;
    /* Watercolour sky: a washed gradient with pigment blooms, and big cumulus heaped along the horizon. The clouds
     * are thresholded noise with a hard painted edge, a sunlit side, a cool belly and a warm glow under the sun. */
    st.skyU = { uTime: { value: 0 }, uRose: { value: 0 }, uSun: { value: new T.Vector3() } };
    var names = ['Top', 'Mid', 'Hor', 'Low', 'Lit', 'Shade', 'SunCol'];
    for (i = 0; i < names.length; i++) st.skyU['u' + names[i]] = { value: new T.Color() };
    st.sky = new T.Mesh(new T.SphereGeometry(110, 32, 20), new T.ShaderMaterial({ uniforms: st.skyU, side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uSunCol; uniform vec3 uSun;' +
        'uniform float uTime; uniform float uRose; varying vec3 vDir;' + NOISE_GLSL +
        'void main(){ vec3 d = normalize(vDir); float h = d.y; float wash = fbm(d.xz * 2.2 + d.y * 3.0 + 3.1); float hh = h + (wash - 0.5) * 0.22;' +
        ' vec3 col = mix(uLow, uHor, smoothstep(-0.55, -0.03, hh)); col = mix(col, uMid, smoothstep(-0.06, 0.1, hh)); col = mix(col, uTop, smoothstep(0.08, 0.46, hh));' +
        ' col *= 0.94 + 0.12 * wash; float s = max(dot(d, uSun), 0.0);' +
        ' col += uSunCol * (pow(s, 4.0) * 0.18 + pow(s, 48.0) * 0.22 + smoothstep(0.9986, 0.9992, s) * 0.9);' +
        // Cumulus: towers heaped up from a soft base along the horizon (az = compass angle, seam behind the camera), with
        // billowed edges, a sunlit rim, a cool belly and three flat tones like poster paint.
        ' if (h > -0.4 && h < 0.75) { float az = atan(d.x, -d.z) + uTime * 0.004; vec2 p = vec2(az * 1.5, h * 3.4);' +
        '  float big = noise(vec2(az * 1.25 + 7.0, 2.5)); float mid = noise(vec2(az * 3.1 + 1.7, 9.5));' +
        '  float top = -0.12 + 0.7 * smoothstep(0.25, 0.8, big) + 0.1 * mid; float bil = fbm(p * 2.6 + 4.0);' +
        '  float e = top - h + (bil - 0.5) * 0.3; float mask = smoothstep(0.0, 0.012, e) * smoothstep(-0.4, -0.2, h);' +
        '  float e2 = 0.5 * (noise(vec2(az * 2.3 + 30.0, 1.0)) - 0.62) - abs(h - 0.5) * 1.6 + (bil - 0.5) * 0.16; mask = max(mask, smoothstep(0.0, 0.012, e2)); e = max(e, e2 * 2.0);' +
        '  float sunSide = fbm(p * 2.6 + 4.0 + vec2(uSun.x > 0.0 ? 0.16 : -0.16, 0.12)) - bil;' +
        '  float lite = (1.0 - smoothstep(0.0, 0.2, e)) * 0.75 + smoothstep(-0.02, 0.05, -sunSide) * 0.45 - smoothstep(0.2, 0.5, e) * 0.2;' +
        '  lite = floor(clamp(lite, 0.0, 1.0) * 3.0 + 0.5) / 3.0;' +
        '  vec3 cloud = mix(uShade, uLit, lite) * (0.95 + 0.1 * wash); cloud += uSunCol * pow(s, 5.0) * (0.12 + 0.25 * uRose);' +
        '  col = mix(col, cloud, mask * 0.97); }' +
        ' col *= 0.975 + 0.05 * hash(floor(gl_FragCoord.xy * 0.5)); gl_FragColor = vec4(col, 1.0); }' }));
    st.sky.renderOrder = -10; st.sky.frustumCulled = false; st.sky.visible = false; H.scene.add(st.sky);
    // Tall grass and wildflowers: instanced blades bent by the travelling wind wave (three bands of colour, lighter crests).
    var seed = 23, n = H.IS_MOBILE ? 1700 : 2600, off = [], dim = [], hoff = [], hdim = [];
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < n; i++) {
      var a = rnd() * TAU, r = Math.sqrt(rnd()) * 4.8, x = Math.cos(a) * r, z = Math.sin(a) * r;
      var hgt = 0.26 + 0.3 * rnd() + (r > 3.4 ? 0.24 * rnd() : 0), flower = i % 9 === 0;
      if (H.POND && Math.sqrt((x - H.POND.x) * (x - H.POND.x) + (z - H.POND.z) * (z - H.POND.z)) < 1.45) continue;
      if (flower) { hgt = 0.44 + 0.24 * rnd(); hoff.push(x, z, 0); hdim.push(hgt, 0.07 + 0.035 * rnd(), rnd()); }
      off.push(x, z, rnd() * TAU); dim.push(hgt, flower ? 0.022 : 0.05 + 0.03 * rnd(), rnd());
    }
    st.grassU = { uTime: { value: 0 }, uSoft: { value: soft }, uTopY: { value: H.TOP_Y }, uLight: { value: new T.Vector3(1, 1, 1) },
      uRoot: { value: new T.Color(0x5fae6a) }, uTip: { value: new T.Color(0xcdea96) } };
    function field(basePos, index, o, d, head) {
      var geo = new T.InstancedBufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(basePos, 3)); geo.setIndex(index);
      geo.setAttribute('aOff', new T.InstancedBufferAttribute(new Float32Array(o), 3)); geo.setAttribute('aDim', new T.InstancedBufferAttribute(new Float32Array(d), 3));
      geo.instanceCount = o.length / 3;
      var mesh = new T.Mesh(geo, new T.ShaderMaterial({ uniforms: st.grassU, side: T.DoubleSide, defines: head ? { HEAD: 1 } : {},
        vertexShader: 'attribute vec3 aOff; attribute vec3 aDim; uniform float uTime; uniform float uSoft; uniform float uTopY; varying float vH; varying float vW; varying float vR;' + WIND_GLSL +
          'void main(){ float w = windF(aOff.xy, uTime); float lean = 0.18 + 0.5 * uSoft * w;\n#ifdef HEAD\n float h = 1.0; vec3 p = vec3(position.x, (1.0 - length(position.xy)) * 0.45, position.y) * aDim.y; p.y += aDim.x;\n' +
          '#else\n float h = position.y; float px = position.x * aDim.y * (1.0 - h * 0.82); vec3 p = vec3(px * cos(aOff.z), h * aDim.x, px * sin(aOff.z));\n#endif\n' +
          ' float k = lean * h * h * aDim.x; p.x += 0.86 * k; p.z += 0.5 * k; p.y -= 0.4 * lean * lean * h * h * aDim.x; vH = h; vW = w; vR = aDim.z;' +
          ' gl_Position = projectionMatrix * modelViewMatrix * vec4(aOff.x + p.x, uTopY + p.y, aOff.y + p.z, 1.0); }',
        fragmentShader: 'uniform vec3 uRoot; uniform vec3 uTip; uniform vec3 uLight; varying float vH; varying float vW; varying float vR;' +
          'void main(){\n#ifdef HEAD\n vec3 col = vR < 0.3 ? vec3(1.0, 0.97, 0.9) : vR < 0.55 ? vec3(1.0, 0.72, 0.8) : vR < 0.8 ? vec3(1.0, 0.86, 0.45) : vec3(0.8, 0.74, 1.0);\n' +
          '#else\n vec3 col = mix(uRoot, uTip, clamp(floor(vH * 3.0 + vR * 0.7) / 3.0, 0.0, 1.0)) * (0.92 + 0.16 * vR); col += vec3(0.24, 0.2, 0.06) * smoothstep(0.25, 0.7, vW) * vH;\n#endif\n' +
          ' gl_FragColor = vec4(col * uLight, 1.0); }' }));
      mesh.frustumCulled = false; mesh.l1cs = true; g.add(mesh);
      return mesh;
    }
    st.grass = field([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.34, 0, 0.5, 0.34, 0, -0.5, 0.67, 0, 0.5, 0.67, 0, 0, 1, 0], [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6], off, dim, false);
    var disc = [0, 0, 0], di = [];
    for (i = 0; i < 6; i++) { disc.push(Math.cos(i * TAU / 6), Math.sin(i * TAU / 6), 0); di.push(0, 1 + i, 1 + (i + 1) % 6); }
    st.heads = field(disc, di, hoff, hdim, true);
    st.blades = off.length / 3; st.blooms = hoff.length / 3;
    // The blossoms the butterflies visit: display-only, at fixed spots, swaying with the same wind.
    var stem = new T.CylinderGeometry(0.014, 0.02, 1, 5), petal = new T.SphereGeometry(0.09, 6, 4), core = new T.SphereGeometry(0.05, 6, 4);
    stem.translate(0, 0.5, 0);
    var green = new T.MeshBasicMaterial({ color: 0x6fae6a }), gold = new T.MeshBasicMaterial({ color: 0xffe9a8 }), cols = [0xffb3c8, 0xc8b6ff, 0xfff0b0, 0xffd0a0, 0xffc0e8];
    for (i = 0; i < FLOWERS.length; i++) {
      var f = new T.Group(), pm = new T.MeshBasicMaterial({ color: cols[i % 5] }), head = new T.Group();
      part(stem, green, f).scale.set(1, HEAD_Y, 1); head.position.y = HEAD_Y; f.add(head);
      for (var p = 0; p < 5; p++) { var pe = part(petal, pm, head, Math.cos(p * TAU / 5) * 0.1, 0, Math.sin(p * TAU / 5) * 0.1); pe.scale.set(1.1, 0.32, 0.6); pe.rotation.set(0, -p * TAU / 5, 0.38); }
      part(core, gold, head);
      f.position.set(FLOWERS[i][0], H.TOP_Y, FLOWERS[i][1]); g.add(f); st.flowers.push(f);
    }
    // The open net, lying in the grass with its mouth turned up to the sky, and a warm glow where the butterflies come out.
    var hoop = new T.TorusGeometry(0.34, 0.017, 5, 18), bag = new T.ConeGeometry(0.34, 0.62, 10, 3, true), pole = new T.CylinderGeometry(0.02, 0.02, 1, 5);
    hoop.rotateX(Math.PI / 2); bag.rotateX(Math.PI); bag.translate(0, -0.31, 0); pole.rotateZ(Math.PI / 2); pole.translate(0.84, 0, 0);
    st.netWood = new T.MeshBasicMaterial({ color: 0xb48a5c, transparent: true, opacity: 0 });
    st.netMesh = new T.MeshBasicMaterial({ color: 0xfff7e4, wireframe: true, transparent: true, opacity: 0, depthWrite: false });
    st.netG = new T.Group(); part(hoop, st.netWood, st.netG); part(pole, st.netWood, st.netG); part(bag, st.netMesh, st.netG);
    st.netG.position.set(NET.x, H.TOP_Y + 0.42, NET.z); st.netG.rotation.set(0.9, 0, -0.25); g.add(st.netG);
    st.net = sprite(H.glowTex, 0xfff0c8, true); st.net.scale.set(1.5, 1.5, 1); st.net.position.set(NET.x, H.TOP_Y + 0.7, NET.z + 0.2); g.add(st.net);
    /* Trails: one small Points cloud. Per butterfly, TRAIL soft dabs along the path it has just flown and FLECK
     * slow-falling flecks of light; all positions come from flyPos at earlier times, so the trail is seekable too.
     * Normal blending in pale, warm pigment (white gouache over the wash), not additive neon. */
    var np = N * PER;
    st.tPos = new Float32Array(np * 3); st.tA = new Float32Array(np * 2); st.tCol = new Float32Array(np * 3);
    var tg = new T.BufferGeometry();
    tg.setAttribute('position', new T.BufferAttribute(st.tPos, 3)); tg.setAttribute('aA', new T.BufferAttribute(st.tA, 2)); tg.setAttribute('aCol', new T.BufferAttribute(st.tCol, 3));
    st.trailU = { uPx: { value: 800 } };
    st.trail = new T.Points(tg, new T.ShaderMaterial({ uniforms: st.trailU, transparent: true, depthWrite: false,
      vertexShader: 'attribute vec2 aA; attribute vec3 aCol; uniform float uPx; varying float vA; varying vec3 vCol;' +
        'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aA.x; vCol = aCol; gl_PointSize = clamp(aA.y * uPx / max(-mv.z, 0.1), 1.0, 64.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; varying vec3 vCol; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = 1.0 - smoothstep(0.15, 1.0, d); gl_FragColor = vec4(vCol, a * a * vA); }' }));
    st.trail.frustumCulled = false; st.trail.renderOrder = 3; g.add(st.trail);
    st.pose = {}; st.canvas = doc.querySelector('canvas');
    // The game's own sky and lights: borrowed while staged, handed back untouched.
    for (i = 0; i < H.scene.children.length; i++) {
      var ch = H.scene.children[i];
      if (ch.isHemisphereLight) st.hemi = ch; else if (ch.isDirectionalLight) st.sun = ch;
      else if (ch.isMesh && ch.geometry && ch.geometry.parameters && ch.geometry.parameters.radius === 120) sky = ch;
    }
    return true;
  }
  /* The cast: display-only copies of the game's own butterflies (same wing textures, wing and body meshes, shared
   * through the read-only __bf.look hook), in the species the player has caught (every species on an empty preview
   * save). Without the hook they fall back to flat wings in the species colour. */
  function buildFlies() {
    var bf = root.__bf, species = bf && bf.species ? bf.species : [], caught = bf && bf.state ? bf.state().caught || {} : {}, own = [], i, k;
    for (i = 0; i < species.length; i++) if (caught[species[i].id] > 0) own.push(species[i]);
    if (!own.length) own = species.length ? species : [{ id: 'a', c1: 0xffb3d1, c2: 0xffd3e0 }, { id: 'b', c1: 0xa8d8ff, c2: 0xd8ecff }, { id: 'c', c1: 0xfff0a0, c2: 0xfff6cf }];
    var key = own.map(function (s) { return s.id; }).join(',');
    if (st.kinds === key) return;
    for (i = 0; i < st.flies.length; i++) st.g.remove(st.flies[i].g);
    st.flies = []; st.kinds = key; st.look = 'game';
    var cream = new T.Color(0xfff4d6);
    for (i = 0; i < N; i++) {
      var sp = own[i % own.length], look = null, bg = new T.Group(), wl = new T.Group(), wr = new T.Group();
      try { look = bf && bf.look ? bf.look(sp) : null; } catch (e) { look = null; }
      if (!look) {
        st.look = 'flat';
        if (!st.wingGeo) {
          st.wingGeo = new T.PlaneGeometry(0.62, 0.62); st.wingGeo.translate(0.31, 0, 0); st.wingGeo.rotateX(Math.PI / 2);
          st.bodyGeo = new T.CylinderGeometry(0.018, 0.012, 0.24, 6); st.bodyGeo.rotateX(Math.PI / 2);
          st.bodyMat = new T.MeshBasicMaterial({ color: 0x3b2f3f });
        }
        look = { wingGeo: st.wingGeo, bodyGeo: st.bodyGeo, headGeo: null, bodyMat: st.bodyMat, glowWing: null,
          wing: new T.MeshBasicMaterial({ color: sp.c1, side: T.DoubleSide }) };
      }
      bg.rotation.order = 'YXZ';
      part(look.bodyGeo, look.bodyMat, bg);
      if (look.headGeo) part(look.headGeo, look.bodyMat, bg, 0, 0, 0.13);
      wl.add(new T.Mesh(look.wingGeo, look.wing)); wr.add(new T.Mesh(look.wingGeo, look.wing));
      if (look.glowWing) { for (k = 0; k < 2; k++) { var gw = new T.Mesh(look.wingGeo, look.glowWing); gw.renderOrder = 2; (k ? wr : wl).add(gw); } }
      wl.scale.x = -1; bg.add(wl); bg.add(wr); bg.visible = false;
      st.g.add(bg); st.flies.push({ g: bg, wl: wl, wr: wr, sp: sp.id });
      // Trail pigment: the species' lighter tone washed out with warm cream; the flecks are almost pure cream.
      tmpB.setHex(sp.c2 !== undefined ? sp.c2 : sp.c1).lerp(cream, 0.45);
      for (k = 0; k < PER; k++) {
        var o = (i * PER + k) * 3, m = k < TRAIL ? 1 : 0.25;
        st.tCol[o] = lerp(cream.r, tmpB.r, m); st.tCol[o + 1] = lerp(cream.g, tmpB.g, m); st.tCol[o + 2] = lerp(cream.b, tmpB.b, m);
      }
    }
    st.trail.geometry.attributes.aCol.needsUpdate = true;
  }
  function shed(j, ts) { var rel = REL + j * REL_STEP; return ease(ramp(ts, rel - 0.1, rel + 0.7)) * (1 - perchAt(j, ts)) * (0.4 + 0.6 * riseAt(j, ts)); }
  function poseFlies(t) {
    var i, k, b = st.pose, P = st.tPos, A = st.tA, top = H.TOP_Y, big = 1 + 1.1 * ease(ramp(t, RISE + 2, 46));
    for (i = 0; i < st.flies.length; i++) {
      var fl = st.flies[i]; flyAt(i, t, b);
      var s = b.scale * b.alpha;
      fl.g.visible = b.alpha > 0.01;
      fl.g.position.set(b.x, top + b.y, b.z); fl.g.rotation.set(-b.pitch, b.yaw, 0); fl.g.scale.set(s, s, s);
      fl.wr.rotation.z = b.wing; fl.wl.rotation.z = -b.wing;
      var gap = 0.07 + 0.11 * b.rise, o = i * PER, q, age, ts;
      for (k = 0; k < TRAIL; k++) {
        ts = t - (k + 1) * gap; flyPos(i, ts, sA); q = o + k;
        P[q * 3] = sA.x; P[q * 3 + 1] = top + sA.y; P[q * 3 + 2] = sA.z;
        A[q * 2] = shed(i, ts) * 0.85 * (1 - k / (TRAIL + 1)); A[q * 2 + 1] = FLY_SCALE * big * (0.62 - 0.07 * k);
      }
      for (k = 0; k < FLECK; k++) {
        var ph = hv(i, 2), nb = Math.floor(t / 0.4 + ph) - k; ts = (nb - ph) * 0.4; age = t - ts; q = o + TRAIL + k;
        flyPos(i, ts, sA);
        P[q * 3] = sA.x + 0.1 * Math.sin(nb * 12.3 + i); P[q * 3 + 1] = Math.max(top + 0.2, top + sA.y - 0.14 * age); P[q * 3 + 2] = sA.z + 0.1 * Math.cos(nb * 7.1 + i);
        A[q * 2] = shed(i, ts) * Math.min(1, age / 0.15) * Math.max(0, 1 - age / (0.4 * FLECK)) * (0.62 + 0.38 * Math.sin(t * 9 + nb * 5 + i));
        A[q * 2 + 1] = FLY_SCALE * big * 0.24;
      }
    }
    st.trail.geometry.attributes.position.needsUpdate = true; st.trail.geometry.attributes.aA.needsUpdate = true;
    if (st.canvas) st.trailU.uPx.value = st.canvas.height / (2 * Math.tan(H.camera.fov * Math.PI / 360));
  }
  function mix2(key, sk, out) { out.setHex(PAL.gold[key]).multiplyScalar(sk.gold); tmpB.setHex(PAL.rose[key]).multiplyScalar(sk.rose); return out.add(tmpB); }
  function mixS(a, b, sk) { return a * sk.gold + b * sk.rose; }
  function enterStage() {
    if (staged || !buildStage()) return;
    buildFlies();
    kept = { flies: [], sky: sky ? sky.visible : false, sun: st.sun ? st.sun.color.getHex() : 0,
      hemi: st.hemi ? [st.hemi.color.getHex(), st.hemi.groundColor.getHex()] : null };
    if (sky) sky.visible = false;
    st.sky.visible = true; st.g.visible = true; st.tick = 0; paint();
    if (doc.body) doc.body.classList.add('l1cs-on');
    staged = true;
  }
  function exitStage() {
    if (!staged) return;
    for (var i = 0; i < kept.flies.length; i++) kept.flies[i].visible = true;
    st.g.visible = false; st.sky.visible = false;
    unpaint();
    if (sky) sky.visible = kept.sky;
    if (st.sun) st.sun.color.setHex(kept.sun);
    if (st.hemi) { st.hemi.color.setHex(kept.hemi[0]); st.hemi.groundColor.setHex(kept.hemi[1]); }
    if (doc.body) doc.body.classList.remove('l1cs-on');
    staged = false; kept = null;
    // The game recomputes its own day/night target (and the camera is its own again from the next frame).
    try { if (H.refresh) H.refresh(); } catch (e) { /* keep closing */ }
  }
  function applyStage(t) {
    var f = frame(t, true), sk = f.sky, u = st.skyU, i, cam = H.camera;
    if (H.setNightTarget) H.setNightTarget(f.night);
    // The catchable butterflies keep their own state; they are only kept out of the picture.
    var wild = root.__bf && root.__bf.butterflies ? root.__bf.butterflies : [];
    for (i = 0; i < wild.length; i++) if (wild[i].g && wild[i].g.visible) { wild[i].g.visible = false; kept.flies.push(wild[i].g); }
    poseFlies(t);
    for (i = 0; i < st.flowers.length; i++) st.flowers[i].rotation.z = -headAt(i, t, sH).lean;
    st.net.material.opacity = f.net * (0.5 + 0.12 * Math.sin(t * 2.1));
    st.netG.visible = f.net > 0.01; st.netWood.opacity = f.net; st.netMesh.opacity = f.net * 0.7;
    // Camera: overrides the gameplay orbit for this frame only; the game takes it back when we stop.
    var c = f.camera, halfH = Math.tan(cam.fov * Math.PI / 360), halfW = halfH * cam.aspect;
    var r = Math.max(c.w / halfW, c.w * 0.9 / halfH), v3 = st.v;
    v3.set(c.x, H.TOP_Y + c.y + c.lift * r * halfH, c.z); H.island.localToWorld(v3);
    cam.position.set(v3.x + r * Math.sin(c.phi) * Math.cos(c.th), v3.y + r * Math.cos(c.phi), v3.z + r * Math.sin(c.phi) * Math.sin(c.th));
    cam.lookAt(v3);
    // Look: sky palette, sun, light and grass tint.
    mix2('top', sk, u.uTop.value); mix2('mid', sk, u.uMid.value); mix2('hor', sk, u.uHor.value); mix2('low', sk, u.uLow.value);
    mix2('lit', sk, u.uLit.value); mix2('shade', sk, u.uShade.value); mix2('sun', sk, u.uSunCol.value);
    u.uTime.value = t; u.uRose.value = sk.rose; u.uSun.value.set(f.sun.x, f.sun.y, f.sun.z).normalize();
    st.sky.position.copy(cam.position);
    if (H.scene.fog) mix2('fog', sk, H.scene.fog.color);
    if (st.sun) { mix2('key', sk, st.sun.color); st.sun.intensity = mixS(PAL.gold.keyI, PAL.rose.keyI, sk); }
    if (st.hemi) { mix2('hemiA', sk, st.hemi.color); mix2('hemiB', sk, st.hemi.groundColor); st.hemi.intensity = mixS(PAL.gold.hemiI, PAL.rose.hemiI, sk); }
    st.grassU.uTime.value = t; st.grassU.uSoft.value = soft;
    st.grassU.uLight.value.set(mixS(PAL.gold.grass[0], PAL.rose.grass[0], sk), mixS(PAL.gold.grass[1], PAL.rose.grass[1], sk), mixS(PAL.gold.grass[2], PAL.rose.grass[2], sk));
    if (++st.tick % 30 === 1) paint(); // anything planted or loaded since the last pass
  }
  function stageTick() {
    var open = state === 'playing' || state === 'paused' || state === 'ended';
    if (!open) { exitStage(); return; }
    var t = time();
    enterStage();
    if (staged) applyStage(t);
  }
  // Chain onto gameplay.js the way butterfly.js does: the hooks arrive once, then one call per frame.
  var GP = root.GardenPlay;
  if (GP && doc) {
    var gpInit = GP.init, gpUpdate = GP.update;
    GP.init = function (hooks) { gpInit.apply(GP, arguments); H = hooks; T = hooks.THREE; };
    GP.update = function () { gpUpdate.apply(GP, arguments); if (H) stageTick(); };
  }
  try { if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) soft = 0.3; } catch (e) { soft = 1; }

  /* ------------------------------- DOM ------------------------------- */
  var CSS = [
    '#l1cs{position:fixed;top:0;left:0;right:0;bottom:0;z-index:60;overflow:hidden;color:#fff;touch-action:none;',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '#l1cs.hidden{display:none}',
    // The veil warms the live island instead of hiding it.
    '#l1csVeil{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;',
    'background:linear-gradient(180deg,#5a6ab0 0%,#c890a8 46%,#ffb880 80%,#ffd8a0 100%)}',
    // Paper grain and a bleached, uneven edge: the frame reads as watercolour on cold-pressed paper.
    // Both sit beside #l1cs (not inside it) so their blend modes reach the game canvas underneath.
    '#l1csPaper{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;opacity:.8;mix-blend-mode:multiply;background-size:240px 240px}',
    '#l1csEdge{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;mix-blend-mode:soft-light;',
    'background:radial-gradient(ellipse at 50% 46%,rgba(255,246,224,0) 52%,rgba(255,238,200,.6) 100%);box-shadow:inset 0 0 70px rgba(255,236,200,.5)}',
    '.l1cs-bar{position:absolute;left:0;right:0;height:7%;background:#2a1f2a;pointer-events:none}',
    '#l1csTop{top:0;transform-origin:50% 0}#l1csBottom{bottom:0;transform-origin:50% 100%}',
    '#l1csCaption{position:absolute;left:5%;right:5%;bottom:17%;text-align:center;font-size:15px;line-height:1.8;letter-spacing:1.5px;',
    'text-shadow:0 1px 10px rgba(70,36,50,.8);pointer-events:none}',
    '#l1csSkip{position:absolute;top:12px;top:calc(12px + env(safe-area-inset-top));right:12px;right:calc(12px + env(safe-area-inset-right));',
    'min-width:64px;min-height:44px;padding:0 16px;border-radius:22px;font:inherit;font-size:14px;letter-spacing:3px;color:#fffaf0;cursor:pointer;',
    'background:rgba(200,150,110,.26);border:1px solid rgba(255,238,210,.46);box-shadow:0 4px 18px rgba(60,30,40,.25);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#l1csSkip:active{background:rgba(226,176,130,.4)}',
    // Everything but the canvas and the cutscene steps aside, so the island reads as a film frame.
    'body.l1cs-on>:not(canvas):not(#l1cs):not(.l1cs-paint){visibility:hidden!important}',
    '.l1cs-paint.hidden{display:none}',
    '#l1csEnd{position:absolute;left:0;right:0;top:21%;text-align:center;pointer-events:none}',
    '#l1csTitle{font-family:"Songti SC","Noto Serif CJK SC","Source Han Serif SC",STSong,serif;font-size:30px;font-weight:500;letter-spacing:9px;text-indent:9px;',
    'text-shadow:0 0 22px rgba(255,226,170,.75),0 2px 10px rgba(90,40,50,.6)}',
    '#l1csRule{width:132px;height:1px;margin:16px auto 0;background:linear-gradient(90deg,transparent,rgba(255,240,205,.9),transparent)}',
    '#l1csSub{margin-top:14px;font-size:16px;letter-spacing:14px;text-indent:14px;opacity:.92;text-shadow:0 1px 10px rgba(90,40,50,.7)}',
    '#l1csGo{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);min-width:168px;min-height:44px;padding:0 26px;border-radius:24px;font:inherit;font-size:15px;letter-spacing:5px;color:#fffaf0;',
    'cursor:pointer;pointer-events:auto;background:rgba(200,150,110,.26);border:1px solid rgba(255,238,210,.46);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:l1csPulse 2.4s ease-in-out infinite}',
    '#l1csGo.hidden,#l1csSkip.hidden{display:none}',
    '@keyframes l1csPulse{0%,100%{opacity:.62}50%{opacity:1}}',
    '#l1csClock{position:absolute;left:12px;left:calc(12px + env(safe-area-inset-left));bottom:10px;bottom:calc(10px + env(safe-area-inset-bottom));',
    'font-size:11px;letter-spacing:1px;opacity:.55;pointer-events:none;font-variant-numeric:tabular-nums}',
    '#l1csClock.hidden{display:none}',
    '@media (orientation:landscape) and (max-height:480px){#l1csCaption{bottom:13%;font-size:14px}#l1csTitle{font-size:24px}',
    '#l1csEnd{top:13%}#l1csRule{margin-top:8px}#l1csSub{margin-top:8px;font-size:14px}#l1csGo{bottom:11%;left:auto;right:5%;transform:none}.l1cs-bar{height:9%}}',
    '@media (prefers-reduced-motion:reduce){#l1csGo{animation:none}}'
  ].join('');

  // Procedural paper: speckle, a few fibres and soft brush streaks; drawn once, tiled by CSS.
  function paperTexture() {
    try {
      var c = doc.createElement('canvas'), S = 240, g, i, seed = 9;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      c.width = c.height = S; g = c.getContext('2d');
      g.fillStyle = '#f7efe0'; g.fillRect(0, 0, S, S);
      for (i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '124,96,68,' : '255,255,255,') + (0.05 + 0.1 * rnd()).toFixed(3) + ')'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
      for (i = 0; i < 26; i++) {
        var x = rnd() * S, y = rnd() * S, a = rnd() * 6.283, l = 8 + rnd() * 22;
        g.strokeStyle = 'rgba(144,112,80,' + (0.06 + 0.08 * rnd()).toFixed(3) + ')'; g.lineWidth = 0.6 + rnd() * 0.5;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5 - 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      for (i = 0; i < 9; i++) { g.fillStyle = 'rgba(156,120,92,' + (0.01 + 0.014 * rnd()).toFixed(3) + ')'; g.fillRect(0, rnd() * S, S, 5 + rnd() * 16); }
      el.Paper.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { el.Paper.style.display = 'none'; }
  }
  function stop(e) { if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }
  function build() {
    if (el || !doc || !doc.body) return;
    var style = doc.createElement('style'); style.id = 'l1csStyle'; style.textContent = CSS;
    doc.head.appendChild(style);
    var box = doc.createElement('div'); box.id = 'l1cs'; box.className = 'hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', TITLE);
    box.innerHTML = '<div id="l1csVeil"></div>' +
      '<div id="l1csTop" class="l1cs-bar"></div><div id="l1csBottom" class="l1cs-bar"></div>' +
      '<div id="l1csCaption"></div>' +
      '<div id="l1csEnd"><div id="l1csTitle">' + TITLE + '</div><div id="l1csRule"></div><div id="l1csSub">' + SUBTITLE + '</div></div>' +
      '<button id="l1csGo" class="hidden" type="button">' + CONTINUE + '</button>' +
      '<button id="l1csSkip" type="button" aria-label="跳过过场动画">' + SKIP + '</button>' +
      '<div id="l1csClock"></div>';
    doc.body.appendChild(box);
    el = { box: box };
    var layers = ['Edge', 'Paper'];
    for (var p = 0; p < layers.length; p++) { var layer = doc.createElement('div'); layer.id = 'l1cs' + layers[p]; layer.className = 'l1cs-paint hidden'; doc.body.insertBefore(layer, box); el[layers[p]] = layer; }
    var ids = ['Veil', 'Top', 'Bottom', 'Caption', 'End', 'Go', 'Skip', 'Clock'];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = doc.getElementById('l1cs' + ids[i]);
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
    var open = state === 'playing' || state === 'paused' || state === 'ended';
    el.box.className = open ? '' : 'hidden';
    el.Paper.className = el.Edge.className = open ? 'l1cs-paint' : 'l1cs-paint hidden';
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
  // The score lives in l1-cutscene-music.js; muted runs (headless capture) never start it.
  function score() { return root.__l1Score || null; }
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
    // True while the stage owns the island: butterfly.js freezes its own butterflies for that time.
    staged: function () { return staged; },
    stage: function () {
      return { staged: staged, reduced: soft < 1, toon: painted.length, blades: st ? st.blades : 0, blooms: st ? st.blooms : 0,
        flies: st ? st.flies.filter(function (f) { return f.g.visible; }).length : 0, cast: st ? st.flies.length : 0, look: st ? st.look : null, kinds: st ? st.kinds : '', trail: st ? N * PER : 0,
        // Island-local [x, height above the grass, z] of every visible butterfly mesh, as posed this frame.
        cast3: st ? st.flies.filter(function (f) { return f.g.visible; }).map(function (f) { return [+f.g.position.x.toFixed(3), +(f.g.position.y - H.TOP_Y).toFixed(3), +f.g.position.z.toFixed(3)]; }) : [],
        sky: !!(st && st.sky.visible), gameSky: sky ? sky.visible : null,
        camera: H ? H.camera.position.toArray().map(function (v) { return +v.toFixed(3); }) : null };
    },
    pause: pause, resume: resume, close: close, proceed: proceed,
    state: function () { time(); return state; },
    beat: function () { return beatAt(time()).id; },
    beats: function () { return BEATS.map(function (b) { return { id: b.id, t0: b.t0, t1: b.t1, caption: b.caption }; }); },
    frame: function (t) { return frame(t === undefined ? time() : clamp(+t || 0, 0, DURATION)); },
    text: function () { return { title: TITLE, subtitle: SUBTITLE, cont: CONTINUE, skip: SKIP }; },
    layout: function () { return { net: [NET.x, NET.z], flowers: FLOWERS, count: N, floor: FLOOR_Y, headY: HEAD_Y }; },
    // Pose of one butterfly at t (the stage uses exactly this).
    fly: function (j, t) { return flyAt(clamp(j | 0, 0, N - 1), +t || 0, {}); },
    muted: function () { return muted; },
    scored: function () { return scored; },
    // In-game hook switch; session-only, never saved. On by default, ?l1cutscene=0 keeps the old 5.2s card.
    enabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; return enabled; },
    _setClock: function (fn) { clock = fn; }
  };
  root.__l1Cutscene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  enabled = query('l1cutscene') !== '0';
  muted = query('mute') === '1';
  if (!doc) return;
  function boot() {
    build();
    if (query('cutscene') !== 'l1') return;
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
