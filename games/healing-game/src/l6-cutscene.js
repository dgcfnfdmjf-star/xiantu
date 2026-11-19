/* l6-cutscene.js: level-6 clear cutscene 「雪灯归林」 (a snowy night on the same floating island: the lit lantern path
 * winds to the little cabin, the camera pulls slowly back until the whole snowy island floats in the night).
 * A seekable 50s timeline shown when the last kitten is home, before the #snowEnding card; it replaces the short 7s
 * finale. Every visual is a pure function of the timeline second, so seek(t) reproduces any frame.
 * Storyboard: docs/l6-cutscene-storyboard.md.
 * Same architecture as l5-cutscene.js: a pure model (camera, sky, moon, snowfall, lantern light, window warmth as
 * numbers), a three.js stage that poses display-only actors on the live island (H.island) from that model, reusing the
 * snow chapter's own set (SnowChapter.stage: tinted island, pines, path, cabin), and a DOM layer (bars, captions,
 * title). This file never reads or writes a save; the caller's onContinue decides what happens afterwards.
 * Item 3 (this file's first cut): stage, world, camera, captions, title, trigger. Actor animation (lantern ignition
 * sequence, kittens, chimney smoke, window glow) and the score arrive in later items. */
(function (root) {
  'use strict';
  var DURATION = 50;
  // Clock times are seconds from play(); beats are contiguous and end at DURATION.
  var BEATS = [
    { id: 'snow', t0: 0, t1: 10, caption: '雪轻轻落在浮岛上' },
    { id: 'lanterns', t0: 10, t1: 21, caption: '小路边的雪灯亮了' },
    { id: 'cabin', t0: 21, t1: 32, caption: '小木屋的窗，暖暖的' },
    { id: 'island', t0: 32, t1: 43.5, caption: '整座岛都睡在雪里' },
    { id: 'title', t0: 43.5, t1: 50, caption: '' }
  ];
  var TITLE_AT = 44, TITLE_FADE = 3, CONTINUE_GUARD_MS = 600;
  var TITLE = '第六关 · 完成', SUBTITLE = '暮色浮岛', CONTINUE = '轻触继续', SKIP = '跳过';

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
   * Island-local metres; y is height above the grass (TOP_Y). Nothing here keeps state between calls. */
  var soft = 1; // 0.3 under prefers-reduced-motion: same story, smaller movement
  // Night: a blue snowy dusk deepening to a clear starry night; warmth gathers round the lanterns and the cabin.
  function skyAt(t) { return { night: ease(ramp(t, 0, 14)), warm: ease(ramp(t, 12, 34)), stars: ease(ramp(t, 1, 10)), glow: ease(ramp(t, 0.5, 8)) }; }
  // The moon hangs high behind the cabin, a little left, so it sits in frame above the island in the wide shots.
  function moonAt(t) { return { x: -0.3, y: 0.42 + 0.03 * ease(ramp(t, 0, 48)), z: -0.86 }; }
  // Snowfall: heavier at first, then thinning to a few slow flakes for the title (the shader reads these numbers).
  function snowAt(t) { return { amount: 1 - 0.45 * ease(ramp(t, 34, 48)), speed: 0.42 - 0.1 * ease(ramp(t, 30, 48)), drift: 0.3 * soft }; }
  /* The lantern path: the six lanterns are found lit one by one from the front of the island to the cabin door in the
   * second beat (the ignition flourish itself is item 4: here each simply warms on its cue), then they stay lit. */
  var LANTERNS = 6, LANT_T = 10.5, LANT_STEP = 1.5;
  function lanternAt(i, t, out) {
    out = out || {};
    var on = LANT_T + i * LANT_STEP;
    out.lit = ease(ramp(t, on, on + 1.2));
    out.glow = out.lit * (0.86 + 0.14 * Math.sin(t * 1.7 + i * 1.3) * soft);
    // larger halos in the wide shots, so each lamp reads as a warm dot on a 390-wide phone
    out.size = (0.9 + 0.35 * out.lit) * (1 + 0.9 * ease(ramp(t, 32, 46)));
    out.on = on;
    return out;
  }
  // How far along the path (0..1) the warm light has spread: it follows the lanterns as they light.
  function pathAt(t) { return { reach: ease(ramp(t, LANT_T, LANT_T + LANTERNS * LANT_STEP + 1)), glow: ease(ramp(t, LANT_T, LANT_T + 3)) }; }
  // The cabin window: always warm; it swells in the cabin beat (item 4 animates the kittens and smoke against it).
  function cabinAt(t) { return { window: 0.65 + 0.35 * ease(ramp(t, 22, 28)), halo: (1.4 + 0.8 * ease(ramp(t, 22, 28))) * (1 + 0.8 * ease(ramp(t, 32, 46))) }; }
  /* Camera keys: look-at point, azimuth th, polar phi, half-width w that must stay in frame, and lift = how far above
   * the look-at the frame centre sits (in half-screens). th = PI/2 looks from the island's front (+z) towards the cabin.
   * Low over the snow at the front of the path, along the lanterns as they light, close on the cabin window, then
   * one slow continuous pull-back and rise until the whole snowy island floats in the night for the title. */
  var CAM = [
    { t: 0, x: 0.5, y: 0.5, z: 3.0, th: 1.78, phi: 1.3, w: 2.6, lift: 0.1 },
    { t: 10, x: 0.2, y: 0.5, z: 1.2, th: 1.68, phi: 1.26, w: 3.0, lift: 0.1 },
    { t: 16, x: 0.0, y: 0.5, z: -0.4, th: 1.6, phi: 1.24, w: 3.0, lift: 0.1 },
    { t: 21, x: -0.4, y: 0.65, z: -2.3, th: 1.52, phi: 1.26, w: 2.3, lift: 0.08 },
    { t: 27, x: -0.45, y: 0.7, z: -2.5, th: 1.48, phi: 1.24, w: 2.1, lift: 0.08 },
    { t: 32, x: -0.3, y: 0.6, z: -1.6, th: 1.5, phi: 1.2, w: 3.4, lift: 0.1 },
    { t: 38, x: 0.0, y: 0.1, z: -0.4, th: 1.55, phi: 1.14, w: 5.4, lift: 0.16 },
    { t: 44, x: 0.0, y: -0.3, z: 0.0, th: 1.6, phi: 1.1, w: 6.6, lift: 0.22 },
    { t: 50, x: 0.0, y: -0.4, z: 0.0, th: 1.64, phi: 1.08, w: 7.4, lift: 0.24 }
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
    // a slow breathing sway, smaller under reduced motion
    out.th += soft * 0.012 * Math.sin(t * 0.21);
    return out;
  }
  function listAt(fn, n, t) { var out = []; for (var j = 0; j < n; j++) out.push(fn(j, t, {})); return out; }
  // Everything the renderer needs, derived from t alone.
  function frame(t, lite) {
    var b = beatAt(t), local = t - b.t0, len = b.t1 - b.t0, sk = skyAt(t);
    return {
      t: t, beat: b.id, caption: b.caption,
      captionAlpha: b.caption ? Math.min(ramp(local, 0.4, 1.8), 1 - ramp(local, len - 1.4, len - 0.2)) : 0,
      look: 'painterly-snowy-night', sky: sk, moon: moonAt(t), snow: snowAt(t), path: pathAt(t), cabin: cabinAt(t),
      veil: 0.1 - 0.04 * sk.warm,
      bars: ease(ramp(t, 0, 2.5)),
      title: ease(ramp(t, TITLE_AT, TITLE_AT + TITLE_FADE)),
      canContinue: t >= DURATION,
      lanterns: lite ? null : listAt(lanternAt, LANTERNS, t),
      camera: cameraAt(t)
    };
  }

  /* ------------------------------ Stage ------------------------------
   * Display-only actors on the live island. The snow chapter's set (tinted island, pines, path, cabin) is borrowed
   * through SnowChapter.stage(); its gameplay lanterns, kittens, markers, sky wash and clouds are hidden while the
   * film owns the island (journey.js checks staged() and freezes the chapters); nothing here feeds back into saves. */
  var H = null, T = null, st = null, staged = false, kept = null;
  var PAL = {
    dusk: { top: 0x26305e, mid: 0x4a5a92, hor: 0x9aa8cc, low: 0x34406e, lit: 0xdfe6f6, shade: 0x6a76a6, key: 0xb4c2ec, keyI: 0.5, hemiA: 0xb6c6ec, hemiB: 0x4a5688, hemiI: 0.72, fog: 0x56679a },
    night: { top: 0x0f1636, mid: 0x26346a, hor: 0x5e6c9e, low: 0x1a2350, lit: 0xd6dff2, shade: 0x46507e, key: 0xc8d4f6, keyI: 0.5, hemiA: 0xa8b8e6, hemiB: 0x323c6e, hemiI: 0.66, fog: 0x34406e }
  };
  var MAX_PR = 1.5, WARM = 0xffc46a;
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
      if (!o.isMesh || o.isSkinnedMesh || o.l6cs || !o.material || o.material.length !== undefined || !o.material.isMeshLambertMaterial) return;
      o.l6cs = true; painted.push([o, o.material]); o.material = toonFor(o.material);
    });
  }
  function unpaint() {
    for (var i = 0; i < painted.length; i++) { painted[i][0].material = painted[i][1]; painted[i][0].l6cs = false; }
    // The snow tint changes the Lambert colours between visits: the toon copies are rebuilt on the next entry.
    painted = []; for (var k in toons) if (toons[k].dispose) toons[k].dispose(); toons = {};
  }
  var NOISE_GLSL = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }' +
    'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; } return s; }';
  // Soft round glow (the game's glowTex when present).
  function glowTex() {
    if (H.glowTex) return H.glowTex;
    var c = doc.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
  }
  function buildStage() {
    if (st || !H || !T) return !!st;
    var g = new T.Group(), i;
    g.visible = false; g.name = 'l6cs-stage'; H.island.add(g);
    st = { g: g, v: new T.Vector3(), lanterns: [], tick: 0, pathCols: null };
    tmpB = new T.Color();
    ramp4 = new T.DataTexture(new Uint8Array([104, 168, 222, 255]), 4, 1, T.LuminanceFormat);
    ramp4.minFilter = ramp4.magFilter = T.NearestFilter; ramp4.generateMipmaps = false; ramp4.needsUpdate = true;
    /* Watercolour winter night in one shader: a washed blue gradient, hashed stars that twinkle (never on the moon), a
     * pale silver moon with a soft halo, big soft cumulus across the middle of the sky lit on the moon's side, and below
     * the horizon a sea of cloud banks the island floats over (no water: the island hangs in the night). */
    st.skyU = { uTime: { value: 0 }, uStars: { value: 0 }, uWarm: { value: 0 }, uGlow: { value: 0 }, uMoon: { value: new T.Vector3() } };
    var names = ['Top', 'Mid', 'Hor', 'Low', 'Lit', 'Shade'];
    for (i = 0; i < names.length; i++) st.skyU['u' + names[i]] = { value: new T.Color() };
    st.sky = new T.Mesh(new T.SphereGeometry(110, 32, 20), new T.ShaderMaterial({ uniforms: st.skyU, side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uMoon;' +
        'uniform float uTime; uniform float uStars; uniform float uWarm; uniform float uGlow; varying vec3 vDir;' + NOISE_GLSL +
        'void main(){ vec3 d = normalize(vDir); float h = d.y; float wash = fbm(d.xz * 2.2 + d.y * 3.0 + 7.1); float hh = h + (wash - 0.5) * 0.16;' +
        ' vec3 col = mix(uHor, uMid, smoothstep(-0.05, 0.2, hh)); col = mix(col, uTop, smoothstep(0.16, 0.7, hh));' +
        ' col *= 0.93 + 0.14 * wash;' +
        ' float sm = max(dot(d, uMoon), 0.0); col = mix(col, vec3(0.78, 0.84, 0.98), pow(sm, 8.0) * 0.22);' +
        // stars: small soft dabs of white gouache, one per hashed cell
        ' float starL = 0.0; vec3 starC = vec3(1.0);' +
        ' if (h > -0.02 && uStars > 0.0) { vec2 sp = d.xz / (abs(h) + 0.42) * 15.0; vec2 c = floor(sp); float r = hash(c);' +
        '  if (r > 0.7) { vec2 o = (vec2(hash(c + 3.1), hash(c + 7.7)) - 0.5) * 0.6; float dist = length(fract(sp) - 0.5 - o); float sz = 0.035 + 0.06 * hash(c + 1.3);' +
        '   starL = smoothstep(sz, 0.0, dist) * (0.62 + 0.38 * sin(uTime * (1.0 + 3.0 * r) + r * 40.0)) * uStars * smoothstep(-0.02, 0.16, h) * (1.0 - smoothstep(0.985, 0.996, sm));' +
        '   starC = mix(vec3(1.0, 0.95, 0.86), vec3(0.84, 0.9, 1.0), hash(c + 9.2)); } }' +
        // big soft mid-sky cumulus: a projected fbm field with a wet edge, lit on the moon's side, parting round the moon
        ' float cmask = 0.0;' +
        ' if (h > -0.02 && h < 0.92) { vec2 drift = vec2(uTime * 0.01, 0.0); vec2 cp = d.xz / (h + 0.34) * 0.85 + drift; vec2 mp = uMoon.xz / (uMoon.y + 0.34) * 0.85 + drift;' +
        '  float den = fbm(cp * 1.1 + vec2(2.2, 6.3)) + 0.2 * (noise(cp * 4.1 + 3.0) - 0.5);' +
        '  float thr = 0.47 + 0.4 * smoothstep(0.985, 0.997, sm) + 0.1 * smoothstep(0.55, 0.88, h) + 0.06 * smoothstep(0.08, 0.0, h);' +
        '  vec2 ld = normalize(mp - cp + vec2(1e-4)); float dl = fbm((cp + ld * 0.1) * 1.1 + vec2(2.2, 6.3)); float lit = clamp((den - dl) * 5.0 + 0.5, 0.0, 1.0);' +
        '  float m = smoothstep(thr, thr + 0.02 + 0.05 * noise(cp * 2.0 + 5.0), den); float edge = 1.0 - smoothstep(thr, thr + 0.1, den);' +
        '  vec3 cb = mix(uShade * 0.95, uLit * 0.82, lit * 0.7 + 0.1 * smoothstep(0.6, 0.8, den)) * (0.93 + 0.14 * wash);' +
        '  cb = mix(cb, uShade * 0.72, smoothstep(thr + 0.04, thr + 0.008, den) * (1.0 - lit) * 0.6);' +
        '  cb = mix(cb, vec3(0.94, 0.96, 1.0), edge * lit * (0.4 + 0.45 * pow(sm, 6.0)));' +
        '  cmask = m * 0.88 * (1.0 - smoothstep(0.9935, 0.998, sm)); col = mix(col, cb, cmask); starL *= 1.0 - cmask; }' +
        // the moon: a pale silver disc with faint grey seas and a soft blurred edge, inside a two-layer halo
        ' col = mix(col, vec3(0.86, 0.9, 1.0), clamp(pow(sm, 60.0) * 0.3 + pow(sm, 600.0) * 0.4, 0.0, 0.8) * (0.6 + 0.4 * uGlow));' +
        ' float disc = smoothstep(0.99842, 0.99895, sm + (wash - 0.5) * 0.0003);' +
        ' float seas = smoothstep(0.45, 0.72, noise(d.xy * 52.0 + 3.0)) * 0.45;' +
        ' vec3 moonPaint = mix(vec3(0.98, 0.98, 0.94), vec3(0.8, 0.83, 0.9), seas);' +
        ' col = mix(col + starC * starL * (1.0 - disc), moonPaint, disc);' +
        // below the horizon: a sea of soft cloud banks in three flat tones, rims silvered on the moon's side
        ' if (hh < 0.06) { float az = atan(d.x, -d.z) + uTime * 0.003; vec2 p = vec2(az * 2.2, h * 6.0);' +
        '  float banks = fbm(vec2(az * 1.6, h * 9.0 + 2.0)) ; float lift = -0.05 - 0.1 * banks + 0.04 * noise(vec2(az * 6.0, 1.0));' +
        '  float e = lift - h + (fbm(p * 2.4 + 4.0) - 0.5) * 0.12; float mask = smoothstep(-0.01, 0.03, e);' +
        '  float l2 = clamp(1.0 - e * 4.0, 0.0, 1.0) * 3.0; l2 = floor(l2) / 3.0;' +
        '  vec3 cl = mix(uLow, uShade * 1.05, 0.35 + 0.5 * l2) * (0.95 + 0.1 * wash);' +
        '  cl = mix(cl, uLit, (1.0 - smoothstep(0.0, 0.05, e)) * (0.25 + 0.35 * pow(max(dot(normalize(d.xz), normalize(uMoon.xz)), 0.0), 3.0)));' +
        '  col = mix(col, mix(uLow, cl, mask), smoothstep(0.06, -0.02, hh));' +
        '  if (h < -0.08) { vec2 sp2 = d.xz / (-h + 0.05) * 0.5 + vec2(uTime * 0.006, 0.0); float sd = fbm(sp2 * 1.3 + 9.0); float sth = 0.5 - 0.06 * smoothstep(-0.1, -0.6, h);' +
        '   float sm2 = smoothstep(sth, sth + 0.06, sd) * smoothstep(-0.08, -0.2, h); float sl = clamp((sd - fbm((sp2 + vec2(0.06, -0.04)) * 1.3 + 9.0)) * 6.0 + 0.5, 0.0, 1.0);' +
        '   vec3 sc = mix(uShade * 0.9, uLit * 0.78, 0.25 + 0.5 * sl) * (0.94 + 0.12 * wash); sc = mix(sc, uLit * 0.92, (1.0 - smoothstep(sth, sth + 0.1, sd)) * sl * 0.5);' +
        '   col = mix(col, sc, sm2 * 0.85); } }' +
        ' col *= 0.975 + 0.05 * hash(floor(gl_FragCoord.xy * 0.5)); gl_FragColor = vec4(col, 1.0); }' }));
    st.sky.name = 'l6cs-sky'; st.sky.renderOrder = -10; st.sky.frustumCulled = false; st.sky.visible = false; H.scene.add(st.sky);
    /* Falling snow: one Points draw call. Each flake's position is a pure function of the film time (wrapped fall,
     * slow side sway) so seek(t) shows the same flakes; positions are seeded once with a fixed LCG. A near and a far
     * layer by size: larger soft flakes close to the lens read as the painterly foreground snow. */
    var count = H.IS_MOBILE ? 420 : 700, pos = new Float32Array(count * 3), aS = new Float32Array(count), aP = new Float32Array(count), seed = 61;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < count; i++) {
      var rr = Math.sqrt(rnd()) * 11, aa = rnd() * 6.283;
      pos[i * 3] = Math.cos(aa) * rr; pos[i * 3 + 1] = rnd() * 14; pos[i * 3 + 2] = Math.sin(aa) * rr;
      aS[i] = rnd() < 0.15 ? 0.11 + rnd() * 0.06 : 0.05 + rnd() * 0.05; aP[i] = rnd() * 6.283;
    }
    var sg = new T.BufferGeometry();
    sg.setAttribute('position', new T.BufferAttribute(pos, 3)); sg.setAttribute('aSize', new T.BufferAttribute(aS, 1)); sg.setAttribute('aPhase', new T.BufferAttribute(aP, 1));
    st.snowU = { uTime: { value: 0 }, uScale: { value: 600 }, uSpeed: { value: 0.42 }, uDrift: { value: 0.3 }, uAmount: { value: 1 } };
    st.snow = new T.Points(sg, new T.ShaderMaterial({ uniforms: st.snowU, transparent: true, depthWrite: false, fog: false,
      vertexShader: 'attribute float aSize; attribute float aPhase; uniform float uTime; uniform float uScale; uniform float uSpeed; uniform float uDrift; uniform float uAmount; varying float vA;' +
        'void main(){ vec3 p = position; float sp = uSpeed * (0.8 + fract(aPhase * 7.3) * 0.5); p.y = mod(p.y - uTime * sp, 14.0) - 2.5;' +
        ' p.x += sin(uTime * 0.45 + aPhase) * uDrift * 1.2; p.z += cos(uTime * 0.37 + aPhase * 1.7) * uDrift; vec4 mv = modelViewMatrix * vec4(p, 1.0);' +
        ' gl_PointSize = clamp(aSize * uScale / max(-mv.z, 0.5), 1.5, 26.0); gl_Position = projectionMatrix * mv;' +
        ' vA = smoothstep(-2.5, -1.2, p.y) * smoothstep(11.5, 9.5, p.y) * step(fract(aPhase * 3.17), uAmount); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.12, d); gl_FragColor = vec4(0.94, 0.96, 1.0, a * 0.9 * vA); }' }));
    st.snow.name = 'l6cs-snow'; st.snow.frustumCulled = false; g.add(st.snow);
    st.tex = glowTex();
    return true;
  }
  /* The film's own lanterns, at the gameplay lanterns' spots (copied on entry): a snow-lantern body (base + dome),
   * a warm window that lerps from cold to amber, and a halo sprite sized for the wide shots. */
  function buildLanterns(spots) {
    if (st.lanterns.length || !spots || !spots.length) return;
    var white = new T.MeshLambertMaterial({ color: 0xf4f7fd, emissive: 0x1c2440 }), dome = new T.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      base = new T.CylinderGeometry(0.24, 0.27, 0.12, 12), hole = new T.CircleGeometry(0.075, 10);
    for (var i = 0; i < spots.length && i < LANTERNS; i++) {
      var L = new T.Group(); L.position.copy(spots[i].position); L.rotation.copy(spots[i].rotation); L.scale.copy(spots[i].scale); st.g.add(L);
      part(base, white, L, 0, 0.06, 0); part(dome, white, L, 0, 0.12, 0);
      var hm = new T.MeshBasicMaterial({ color: 0x3a2a30 }), h = part(hole, hm, L, 0, 0.2, 0.17); h.rotation.x = -0.25;
      var halo = sprite(st.tex, WARM, true); halo.position.set(0, 0.2, 0.2); L.add(halo);
      var pool = sprite(st.tex, 0xffb860, true); pool.position.set(0, 0.03, 0); L.add(pool); // the light pooled on the snow
      st.lanterns.push({ g: L, hole: hm, halo: halo, pool: pool });
    }
  }
  function hide(o) { if (o && o.visible) { o.visible = false; if (kept.hidden.indexOf(o) < 0) kept.hidden.push(o); } }
  function mix2(key, sk, out) { out.setHex(PAL.dusk[key]).multiplyScalar(1 - sk.night); tmpB.setHex(PAL.night[key]).multiplyScalar(sk.night); return out.add(tmpB); }
  function mixS(a, b, sk) { return a * (1 - sk.night) + b * sk.night; }
  function enterStage() {
    if (staged || !buildStage()) return;
    var cam = H.camera, i, ch, ud;
    for (i = 0; i < H.scene.children.length; i++) {
      ch = H.scene.children[i];
      if (ch.isHemisphereLight) st.hemi = ch; else if (ch.isDirectionalLight && !st.sun) st.sun = ch;
    }
    kept = { hidden: [], sun: st.sun ? st.sun.color.getHex() : 0, sunI: st.sun ? st.sun.intensity : 0, hemi: st.hemi ? [st.hemi.color.getHex(), st.hemi.groundColor.getHex(), st.hemi.intensity] : null,
      fog: H.scene.fog ? H.scene.fog.color.getHex() : 0, pr: 0, zoom: cam.zoom, view: cam.view && cam.view.enabled ? JSON.parse(JSON.stringify(cam.view)) : null, patch: null };
    if (kept.view) cam.clearViewOffset();
    if (cam.zoom !== 1) { cam.zoom = 1; cam.updateProjectionMatrix(); }
    var rr = root.__l3Render;
    try { if (rr && rr.getPixelRatio && rr.getPixelRatio() > MAX_PR) { kept.pr = rr.getPixelRatio(); rr.setPixelRatio(MAX_PR); } } catch (e) { kept.pr = 0; }
    // The snow chapter's set: tinted island, pines, path and cabin (on any level; given back on close).
    var SCh = root.SnowChapter, set = null;
    try { set = SCh && SCh.stage ? SCh.stage(true) : null; } catch (e) { set = null; }
    st.set = set;
    /* Off the set while the film runs (all come back on close): the game's sky dome, star points, sun/moon sprites,
     * orbiting islets and cloud puffs, the gameplay groups other chapters registered, and from the snow set its
     * gameplay lanterns, kittens, paw markers, falling snow (game clock) and the sky wash. */
    for (i = 0; i < H.scene.children.length; i++) {
      ch = H.scene.children[i]; ud = ch.userData;
      if (ch === st.sky) continue;
      if (ch.isPoints || ch.isSprite) hide(ch);
      else if (ch.isMesh && ch.geometry && ch.geometry.parameters && (ch.geometry.parameters.radius === 120 || ch.name === 'snow-sky-wash')) hide(ch);
      else if (ch.isGroup && ud && typeof ud.sp === 'number' && typeof ud.r === 'number' && typeof ud.a === 'number') hide(ch);
    }
    var extra = (root.__l6Hide || []).concat(root.__l5Hide || [], root.__l4Hide || [], root.__l3Hide || [], root.__l3Stage && root.__l3Stage.groups ? root.__l3Stage.groups() : []);
    for (i = 0; i < extra.length; i++) hide(extra[i]);
    if (root.GardenClip && root.GardenClip.boat) hide(root.GardenClip.boat);
    if (set) {
      buildLanterns(set.lanterns);
      for (i = 0; i < set.lanterns.length; i++) hide(set.lanterns[i]);
      for (i = 0; i < set.cats.length; i++) hide(set.cats[i]);
      for (i = 0; i < set.markers.length; i++) hide(set.markers[i]);
      hide(set.snow); hide(set.dome);
      for (i = 0; i < set.clouds.length; i++) hide(set.clouds[i]);
      // the path's lamplight colour is the film's while staged; the gameplay colours come back on close
      if (set.patch && set.patch.instanceColor) { kept.patch = set.patch.instanceColor.array.slice(); st.patchN = set.patch.count; }
    }
    st.sky.visible = true; st.g.visible = true; st.tick = 0; paint();
    if (doc.body) doc.body.classList.add('l6cs-on');
    staged = true;
  }
  function exitStage() {
    if (!staged) return;
    for (var i = 0; i < kept.hidden.length; i++) kept.hidden[i].visible = true;
    st.g.visible = false; st.sky.visible = false;
    unpaint();
    if (st.set && st.set.patch && kept.patch) { st.set.patch.instanceColor.array.set(kept.patch); st.set.patch.instanceColor.needsUpdate = true; }
    if (st.sun) { st.sun.color.setHex(kept.sun); st.sun.intensity = kept.sunI; }
    if (st.hemi) { st.hemi.color.setHex(kept.hemi[0]); st.hemi.groundColor.setHex(kept.hemi[1]); st.hemi.intensity = kept.hemi[2]; }
    if (H.scene.fog) H.scene.fog.color.setHex(kept.fog);
    try { if (root.SnowChapter && root.SnowChapter.stage) root.SnowChapter.stage(false); } catch (e) { /* keep closing */ }
    st.set = null;
    var cam = H.camera, v = kept.view;
    try {
      if (v) cam.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
      if (cam.zoom !== kept.zoom) { cam.zoom = kept.zoom; cam.updateProjectionMatrix(); }
    } catch (e) { /* keep closing */ }
    try { if (kept.pr && root.__l3Render) root.__l3Render.setPixelRatio(kept.pr); } catch (e) { /* keep closing */ }
    if (doc.body) doc.body.classList.remove('l6cs-on');
    staged = false; kept = null;
    try { if (H.refresh) H.refresh(); } catch (e) { /* keep closing */ }
  }
  function applyStage(t) {
    var f = frame(t), sk = f.sky, u = st.skyU, i, cam = H.camera, top = H.TOP_Y;
    if (H.setNightTarget) H.setNightTarget(0.9);
    if (H.setDeepNight) H.setDeepNight(0);
    if (cam.view && cam.view.enabled) cam.clearViewOffset();
    if (cam.zoom !== 1) { cam.zoom = 1; cam.updateProjectionMatrix(); }
    var wild = root.__bf && root.__bf.butterflies ? root.__bf.butterflies : [];
    for (i = 0; i < wild.length; i++) if (wild[i].g) hide(wild[i].g);
    // Camera: overrides the gameplay orbit for this frame only; the game takes it back when we stop.
    var c = f.camera, halfH = Math.tan(cam.fov * Math.PI / 360), halfW = halfH * cam.aspect;
    var r = Math.max(c.w / halfW, c.w * 0.9 / halfH), v3 = st.v;
    v3.set(c.x, top + c.y + c.lift * r * halfH, c.z); H.island.localToWorld(v3);
    cam.position.set(v3.x + r * Math.sin(c.phi) * Math.cos(c.th), v3.y + r * Math.cos(c.phi), v3.z + r * Math.sin(c.phi) * Math.sin(c.th));
    cam.lookAt(v3);
    // Lanterns: cold -> amber window, halo and a pool of light on the snow; sized up for the wide shots.
    for (i = 0; i < st.lanterns.length; i++) {
      var L = st.lanterns[i], lp = f.lanterns[i];
      L.hole.color.setHex(0x3a2a30).lerp(tmpB.setHex(0xffc566), lp.lit);
      L.halo.material.opacity = clamp(0.1 + 0.75 * lp.glow, 0, 0.9); L.halo.scale.setScalar(0.55 * lp.size);
      L.pool.material.opacity = 0.35 * lp.glow; L.pool.scale.set(1.1 * lp.size, 1.1 * lp.size, 1);
    }
    // The path's pressed-snow patches warm from the front edge towards the cabin as the lanterns light.
    var set = st.set;
    if (set && set.patch && set.patch.instanceColor) {
      var n = st.patchN, reach = f.path.reach * 1.05;
      for (i = 0; i < n; i++) {
        var w = clamp((reach - i / (n - 1)) / 0.08 + 1, 0, 1) * f.path.glow;
        tmpB.setHex(0xaebbe0).lerp(st.warmC || (st.warmC = new T.Color(0xffd08a)), w); set.patch.setColorAt(i, tmpB);
      }
      set.patch.instanceColor.needsUpdate = true;
    }
    // The cabin window: warm from the start, swelling in the cabin beat (item 4 animates it further).
    if (set && set.windowGlow) { set.windowGlow.material.opacity = clamp(0.4 + 0.5 * f.cabin.window, 0, 1); set.windowGlow.scale.setScalar(f.cabin.halo); }
    // Snowfall.
    var su = st.snowU, pr = Math.min(MAX_PR, root.devicePixelRatio || 1);
    su.uTime.value = t; su.uSpeed.value = f.snow.speed; su.uDrift.value = f.snow.drift; su.uAmount.value = f.snow.amount;
    su.uScale.value = (st.canvas ? st.canvas.height : root.innerHeight * pr) / (2 * halfH);
    // Look: sky palette, moon, lights and fog.
    var md = st.md || (st.md = new T.Vector3());
    md.set(f.moon.x, f.moon.y, f.moon.z).normalize();
    mix2('top', sk, u.uTop.value); mix2('mid', sk, u.uMid.value); mix2('hor', sk, u.uHor.value); mix2('low', sk, u.uLow.value);
    mix2('lit', sk, u.uLit.value); mix2('shade', sk, u.uShade.value);
    u.uTime.value = t; u.uStars.value = sk.stars; u.uWarm.value = sk.warm; u.uGlow.value = sk.glow; u.uMoon.value.copy(md);
    st.sky.position.copy(cam.position);
    if (H.scene.fog) mix2('fog', sk, H.scene.fog.color);
    if (st.sun) { mix2('key', sk, st.sun.color); st.sun.intensity = mixS(PAL.dusk.keyI, PAL.night.keyI, sk); }
    if (st.hemi) { mix2('hemiA', sk, st.hemi.color); mix2('hemiB', sk, st.hemi.groundColor); st.hemi.intensity = mixS(PAL.dusk.hemiI, PAL.night.hemiI, sk); }
    if (!st.canvas) st.canvas = doc.querySelector('canvas');
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
    '#l6cs{position:fixed;top:0;left:0;right:0;bottom:0;z-index:60;overflow:hidden;color:#fff;touch-action:none;',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '#l6cs.hidden{display:none}',
    // The veil washes the live island with a cold night colour; warm only near the bottom (the lamplit snow).
    '#l6csVeil{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;',
    'background:linear-gradient(180deg,#141c48 0%,#3c4c88 55%,#b49a84 100%)}',
    // Paper grain and a cool uneven edge: the frame reads as winter watercolour on cold-pressed paper.
    '#l6csPaper{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;opacity:.68;mix-blend-mode:multiply;background-size:240px 240px}',
    '#l6csEdge{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;mix-blend-mode:multiply;',
    'background:radial-gradient(ellipse at 50% 44%,rgba(150,160,200,0) 52%,rgba(52,62,112,.45) 100%);box-shadow:inset 0 0 80px rgba(30,38,84,.4)}',
    '.l6cs-bar{position:absolute;left:0;right:0;height:7%;background:#10162c;pointer-events:none}',
    '#l6csTop{top:0;transform-origin:50% 0}#l6csBottom{bottom:0;transform-origin:50% 100%}',
    '#l6csCaption{position:absolute;left:5%;right:5%;bottom:14.5%;text-align:center;font-size:17px;line-height:1.7;letter-spacing:1.5px;white-space:nowrap;',
    'padding:14px 0 12px;color:#fffdf6;text-shadow:0 1px 2px rgba(16,20,48,.9),0 0 10px rgba(24,30,70,.8);pointer-events:none;',
    'background:radial-gradient(ellipse at 50% 50%,rgba(20,26,60,.5) 0%,rgba(20,26,60,.3) 45%,rgba(20,26,60,0) 72%)}',
    '#l6csSkip{position:absolute;top:12px;top:calc(12px + env(safe-area-inset-top));right:12px;right:calc(12px + env(safe-area-inset-right));',
    'min-width:64px;min-height:44px;padding:0 16px;border-radius:22px;font:inherit;font-size:14px;letter-spacing:3px;color:#fffaf0;cursor:pointer;',
    'background:rgba(62,74,124,.34);border:1px solid rgba(255,238,214,.5);box-shadow:0 4px 18px rgba(16,20,48,.3);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#l6csSkip:active{background:rgba(100,112,164,.46)}',
    // Everything but the canvas and the cutscene steps aside, so the island reads as a film frame.
    'body.l6cs-on>:not(canvas):not(#l6cs):not(.l6cs-paint){visibility:hidden!important}',
    '.l6cs-paint.hidden{display:none}',
    '#l6csEnd{position:absolute;left:0;right:0;top:17%;text-align:center;pointer-events:none}',
    '#l6csTitle{font-family:"Songti SC","Noto Serif CJK SC","Source Han Serif SC",STSong,serif;font-size:32px;font-weight:600;letter-spacing:8px;text-indent:8px;',
    'text-shadow:0 1px 3px rgba(16,20,48,.85),0 0 22px rgba(255,214,150,.6),0 2px 12px rgba(24,30,70,.7)}',
    '#l6csRule{width:132px;height:1px;margin:16px auto 0;background:linear-gradient(90deg,transparent,rgba(255,236,196,.9),transparent)}',
    '#l6csSub{margin-top:14px;font-size:17px;letter-spacing:14px;text-indent:14px;opacity:.96;text-shadow:0 1px 2px rgba(16,20,48,.85),0 1px 10px rgba(24,30,70,.7)}',
    '#l6csGo{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);min-width:168px;min-height:44px;padding:0 26px;border-radius:24px;font:inherit;font-size:15px;letter-spacing:5px;color:#fffaf0;',
    'cursor:pointer;pointer-events:auto;background:rgba(48,58,108,.58);border:1px solid rgba(255,236,196,.66);text-shadow:0 1px 2px rgba(16,20,48,.8);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:l6csPulse 2.4s ease-in-out infinite}',
    '#l6csGo.hidden,#l6csSkip.hidden{display:none}',
    '@keyframes l6csPulse{0%,100%{opacity:.62}50%{opacity:1}}',
    '#l6csClock{position:absolute;left:12px;left:calc(12px + env(safe-area-inset-left));bottom:10px;bottom:calc(10px + env(safe-area-inset-bottom));',
    'font-size:11px;letter-spacing:1px;opacity:.55;pointer-events:none;font-variant-numeric:tabular-nums}',
    '#l6csClock.hidden{display:none}',
    '@media (orientation:landscape) and (max-height:480px){#l6csCaption{bottom:13%;font-size:14px}#l6csTitle{font-size:24px}',
    '#l6csEnd{top:12%}#l6csRule{margin-top:8px}#l6csSub{margin-top:8px;font-size:14px}#l6csGo{bottom:11%;left:auto;right:5%;transform:none}.l6cs-bar{height:9%}}',
    '@media (orientation:portrait) and (max-width:370px){#l6csTitle{font-size:29px;letter-spacing:7px;text-indent:7px}#l6csSub{margin-top:10px;font-size:16px}}',
    '@media (prefers-reduced-motion:reduce){#l6csGo{animation:none}}'
  ].join('');

  // Procedural paper (cold-pressed "tooth": fine speckle, fibres, faint brush streaks); drawn once, tiled by CSS.
  function paperTexture() {
    try {
      var c = doc.createElement('canvas'), S = 240, g, i, seed = 37;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      c.width = c.height = S; g = c.getContext('2d');
      g.fillStyle = '#f4f3ee'; g.fillRect(0, 0, S, S);
      for (i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '90,98,130,' : '255,255,255,') + (0.05 + 0.1 * rnd()).toFixed(3) + ')'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
      for (i = 0; i < 26; i++) {
        var x = rnd() * S, y = rnd() * S, a = rnd() * 6.283, l = 8 + rnd() * 22;
        g.strokeStyle = 'rgba(98,104,138,' + (0.06 + 0.08 * rnd()).toFixed(3) + ')'; g.lineWidth = 0.6 + rnd() * 0.5;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5 - 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      for (i = 0; i < 9; i++) { g.fillStyle = 'rgba(104,110,144,' + (0.012 + 0.016 * rnd()).toFixed(3) + ')'; g.fillRect(0, rnd() * S, S, 5 + rnd() * 16); }
      el.Paper.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { el.Paper.style.display = 'none'; }
  }
  function stop(e) { if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }
  function build() {
    if (el || !doc || !doc.body) return;
    var style = doc.createElement('style'); style.id = 'l6csStyle'; style.textContent = CSS;
    doc.head.appendChild(style);
    var box = doc.createElement('div'); box.id = 'l6cs'; box.className = 'hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', TITLE);
    box.innerHTML = '<div id="l6csVeil"></div>' +
      '<div id="l6csTop" class="l6cs-bar"></div><div id="l6csBottom" class="l6cs-bar"></div>' +
      '<div id="l6csCaption"></div>' +
      '<div id="l6csEnd"><div id="l6csTitle">' + TITLE + '</div><div id="l6csRule"></div><div id="l6csSub">' + SUBTITLE + '</div></div>' +
      '<button id="l6csGo" class="hidden" type="button">' + CONTINUE + '</button>' +
      '<button id="l6csSkip" type="button" aria-label="跳过过场动画">' + SKIP + '</button>' +
      '<div id="l6csClock"></div>';
    doc.body.appendChild(box);
    el = { box: box };
    var layers = ['Edge', 'Paper'];
    for (var p = 0; p < layers.length; p++) { var layer = doc.createElement('div'); layer.id = 'l6cs' + layers[p]; layer.className = 'l6cs-paint hidden'; doc.body.insertBefore(layer, box); el[layers[p]] = layer; }
    var ids = ['Veil', 'Top', 'Bottom', 'Caption', 'End', 'Go', 'Skip', 'Clock'];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = doc.getElementById('l6cs' + ids[i]);
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
    el.Paper.className = el.Edge.className = open ? 'l6cs-paint' : 'l6cs-paint hidden';
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
  // The score will live in l6-cutscene-music.js (window.__l6Score, a later item); muted runs never start it.
  function score() { return root.__l6Score || null; }
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
    // True while the stage owns the island: journey.js freezes the gameplay chapters for that time.
    staged: function () { return staged; },
    stage: function () {
      return { staged: staged, reduced: soft < 1, toon: painted.length, set: !!(st && st.set), lanterns: st ? st.lanterns.length : 0,
        snow: st ? st.snow.geometry.attributes.position.count : 0, sky: !!(st && st.sky.visible), hidden: kept ? kept.hidden.length : 0,
        camera: H ? H.camera.position.toArray().map(function (v) { return +v.toFixed(3); }) : null };
    },
    pause: pause, resume: resume, close: close, proceed: proceed,
    state: function () { time(); return state; },
    beat: function () { return beatAt(time()).id; },
    beats: function () { return BEATS.map(function (b) { return { id: b.id, t0: b.t0, t1: b.t1, caption: b.caption }; }); },
    frame: function (t) { return frame(t === undefined ? time() : clamp(+t || 0, 0, DURATION)); },
    text: function () { return { title: TITLE, subtitle: SUBTITLE, cont: CONTINUE, skip: SKIP }; },
    layout: function () { return { lanterns: LANTERNS, lanternT: LANT_T, lanternStep: LANT_STEP, cam: CAM.map(function (k) { return k.t; }), titleAt: TITLE_AT }; },
    lantern: function (i, t) { return lanternAt(clamp(i | 0, 0, LANTERNS - 1), +t || 0, {}); },
    camera: function (t) { return cameraAt(clamp(+t || 0, 0, DURATION)); },
    // What is actually on stage this frame: for the seek/determinism checks.
    probe: function () {
      if (!st || !staged) return null;
      // the camera in island coordinates (the island itself bobs on the game clock; the film rides on it)
      return { camera: H.island.worldToLocal(H.camera.position.clone()).toArray().map(function (v) { return +v.toFixed(4); }), snowTime: st.snowU.uTime.value, lanterns: st.lanterns.map(function (L) { return [L.halo.material.opacity, L.hole.color.getHex()]; }),
        window: st.set && st.set.windowGlow ? st.set.windowGlow.material.opacity : null };
    },
    muted: function () { return muted; },
    scored: function () { return scored; },
    // In-game hook switch; session-only, never saved. On by default, ?l6cutscene=0 keeps the old 7s finale and card.
    enabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; return enabled; },
    _setClock: function (fn) { clock = fn; }
  };
  root.__l6Cutscene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  enabled = query('l6cutscene') !== '0';
  muted = query('mute') === '1';
  if (!doc) return;
  function boot() {
    build();
    if (query('cutscene') !== 'l6') return;
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
