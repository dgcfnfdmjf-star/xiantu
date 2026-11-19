/* l6-cutscene.js: level-6 clear cutscene 「雪灯归林」 (a snowy night on the same floating island: the lit lantern path
 * winds to the little cabin, the camera pulls slowly back until the whole snowy island floats in the night).
 * A seekable 50s timeline shown when the last kitten is home, before the #snowEnding card; it replaces the short 7s
 * finale. Every visual is a pure function of the timeline second, so seek(t) reproduces any frame.
 * Storyboard: docs/l6-cutscene-storyboard.md.
 * Same architecture as l5-cutscene.js: a pure model (camera, sky, moon, snowfall, lantern light, window warmth as
 * numbers), a three.js stage that poses display-only actors on the live island (H.island) from that model, reusing the
 * snow chapter's own set (SnowChapter.stage: tinted island, pines, path, cabin), and a DOM layer (bars, captions,
 * title). This file never reads or writes a save; the caller's onContinue decides what happens afterwards.
 * Item 3: stage, world, camera, captions, title, trigger. Item 4: actors on an 80 bpm beat grid (lantern ignition
 * flare + sparks, the four Blender kittens walking the last stretch home and curling up under the window, window
 * swell per arrival, chimney smoke, flakes that catch the lamplight, returning fireflies and paper sky lanterns), all
 * pure functions of t; particles fade out before they reach the moon. The score arrives in item 5. */
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
    out.flare = flareAt(t - on);
    return out;
  }
  // How far along the path (0..1) the warm light has spread: it follows the lanterns as they light.
  function pathAt(t) { return { reach: ease(ramp(t, LANT_T, LANT_T + LANTERNS * LANT_STEP + 1)), glow: ease(ramp(t, LANT_T, LANT_T + 3)) }; }
  /* Beat grid (item 5 scores to it): 80 bpm, one beat = 0.75 s. Lanterns light every two beats from beat 14 (10.5 s);
   * the kittens set off every two beats from beat 28 (21 s). */
  var BPM = 80, BEAT = 60 / BPM;
  // Ignition flourish: the halo flares and settles, a few sparks rise and fade (age = seconds since the lantern's cue).
  function flareAt(age) { return age < 0 ? 0 : Math.exp(-age * 2.6) * ease(ramp(age, 0, 0.12)); }
  var SPARKS = 6;
  function sparkAt(i, k, t, out) {
    out = out || {};
    var age = t - (LANT_T + i * LANT_STEP) - k * 0.07, life = 1.5, u = age / life, a = (k * 2.39996 + i * 0.7) % 6.283;
    out.a = u > 0 && u < 1 ? Math.sin(Math.PI * Math.min(1, u * 3)) * (1 - u) * 1.4 : 0; out.a = clamp(out.a, 0, 1);
    u = clamp(u, 0, 1);
    out.x = Math.cos(a) * (0.08 + 0.22 * u); out.z = Math.sin(a) * (0.08 + 0.22 * u) * 0.6 + 0.12; out.y = 0.25 + 0.75 * u - 0.25 * u * u;
    out.s = 0.7 + 0.3 * Math.sin(k * 1.7 + i);
    return out;
  }
  /* The four kittens (the gameplay coats, same Blender models) walk the last stretch of the lit path home in file
   * and curl up together under the cabin window. route u = 0..1 along their own walk (the stage maps it onto the path). */
  var KITS = ['orange', 'calico', 'black', 'tabby'], KIT_T = 21, KIT_STEP = 2 * BEAT * 1, KIT_U0 = [0.86, 0.8, 0.74, 0.68];
  function kitDur(i) { return 3.2 + 0.6 * i; }
  function kittenAt(i, t, out) {
    out = out || {};
    var s = KIT_T + i * KIT_STEP, d = kitDur(i), u = ramp(t, s, s + d);
    // gentle start and arrive: smoothstep in time, so the walk cadence follows the true distance covered
    out.id = KITS[i]; out.start = s; out.arrive = s + d;
    out.u = ease(u); out.walking = t > s && t < s + d;
    out.home = t >= s + d;
    out.curl = ease(ramp(t, s + d + 0.2, s + d + 1.6));
    out.breath = Math.sin(t * 1.6 + i * 1.9) * 0.5 + 0.5;
    out.look = ease(ramp(t, s - 1.2, s)); // turns its head up the path just before it goes
    return out;
  }
  function homeCount(t) { var n = 0; for (var i = 0; i < KITS.length; i++) n += ease(ramp(t, KIT_T + i * KIT_STEP + kitDur(i) - 0.4, KIT_T + i * KIT_STEP + kitDur(i) + 0.8)); return n; }
  // The cabin window: always warm; it swells in the cabin beat, a step brighter as each kitten arrives under it.
  function cabinAt(t) {
    var n = homeCount(t), sw = ease(ramp(t, 22, 28));
    return { window: clamp(0.6 + 0.15 * sw + 0.0625 * n, 0, 1), home: n, flicker: 0.04 * Math.sin(t * 2.3) * Math.sin(t * 0.7 + 1.0) * soft,
      halo: (1.3 + 0.35 * sw + 0.15 * n) * (1 + 0.8 * ease(ramp(t, 32, 46))), pool: 0.25 + 0.1 * sw + 0.06 * n };
  }
  /* Chimney smoke: a slow curl of soft puffs, each a pure function of t (age = fract(t * rate + j / N)); it leans
   * away from the moon (to +x) as it rises, the way the Coffee-Smoke shader leans with height (wind * h^3). */
  var SMOKE = 9;
  function smokeAt(j, t, out) {
    out = out || {};
    var age = (t * 0.075 + j / SMOKE) % 1, h = age * 2.1;
    out.x = 0.55 * Math.pow(age, 1.8) * 2 + 0.07 * Math.sin(t * 0.5 + j * 2.1) * soft * age;
    out.y = h; out.z = 0.05 * Math.sin(j * 1.3);
    out.s = 0.22 + 0.75 * age;
    out.a = 0.62 * ease(ramp(age, 0, 0.08)) * (1 - ease(ramp(age, 0.45, 1))) * ease(ramp(t, 0, 1.5));
    out.warm = 1 - ease(ramp(age, 0, 0.18));
    return out;
  }
  /* Lights from earlier chapters return softly in the wide shots: a few fireflies (the moon bay) drift round the island
   * and three paper sky lanterns rise beyond its right edge, away from the moon. */
  var FLIES = 14, SKYL = 3;
  function flyAt(j, t, out) {
    out = out || {};
    var seed = j * 2.39996, r = 2.4 + 1.8 * ((j * 0.618) % 1), a0 = seed % 6.283, w = (j % 2 ? 1 : -1) * (0.05 + 0.02 * (j % 3));
    var a = a0 + w * t;
    out.x = Math.cos(a) * r; out.z = Math.sin(a) * r * 0.9 + 0.4; out.y = 0.6 + 0.9 * ((j * 0.37) % 1) + 0.25 * Math.sin(t * 0.6 + seed) * soft;
    out.a = ease(ramp(t, 33 + (j % 5) * 0.6, 36 + (j % 5) * 0.6)) * (0.55 + 0.45 * Math.sin(t * (1.1 + 0.2 * (j % 4)) + seed * 3));
    out.s = 0.7 + 0.3 * ((j * 0.53) % 1);
    return out;
  }
  function skyLanternAt(j, t, out) {
    out = out || {};
    var s = 34 + j * 2.25, u = ramp(t, s, s + 16);
    out.x = 4.6 + 1.2 * j + 0.15 * Math.sin(t * 0.4 + j) * soft; out.z = 1.4 - 1.6 * j; out.y = -1.2 + 5.2 * u;
    out.a = ease(ramp(t, s, s + 2)) * 0.95; out.s = 0.55 - 0.08 * j;
    return out;
  }
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
      kittens: lite ? null : listAt(kittenAt, KITS.length, t),
      smoke: lite ? null : listAt(smokeAt, SMOKE, t),
      flies: lite ? null : listAt(flyAt, FLIES, t),
      skyLanterns: lite ? null : listAt(skyLanternAt, SKYL, t),
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
  /* Particles never cross the moon disc: uMoon = (ndc x, ndc y, guard radius in ndc-y units, viewport height px); a
   * point fades to nothing before its own disc reaches the guard ring round the moon. */
  var MOON_GLSL = 'uniform vec4 uMoon; uniform float uAspect;' +
    'float moonFade(vec4 cp, float ps){ if (cp.w <= 0.0) return 1.0; vec2 n = cp.xy / cp.w; float dm = length((n - uMoon.xy) * vec2(uAspect, 1.0)); float r = uMoon.z + ps / uMoon.w;' +
    ' return smoothstep(r, r * 1.35 + 0.02, dm); }';
  // Additive glow points (sparks, fireflies): positions/alpha/size written from the pure model each frame.
  function glowPoints(n, color, name) {
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aAlpha', new T.BufferAttribute(new Float32Array(n), 1));
    geo.setAttribute('aSize', new T.BufferAttribute(new Float32Array(n), 1));
    var u = { uColor: { value: new T.Color(color) }, uScale: { value: 600 }, uMoon: st.moonU, uAspect: st.aspectU };
    var pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: 'attribute float aAlpha; attribute float aSize; uniform float uScale; varying float vA;' + MOON_GLSL +
        'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;' +
        ' gl_PointSize = clamp(aSize * uScale / max(-mv.z, 0.5), 2.0, 40.0); vA = aAlpha * moonFade(gl_Position, gl_PointSize); }',
      fragmentShader: 'uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float core = smoothstep(0.18, 0.0, d); float halo = smoothstep(0.5, 0.0, d);' +
        ' gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.98, 0.9), core) * (halo * 0.7 + core), 1.0) * vA; }' }));
    pts.name = name; pts.frustumCulled = false; pts.renderOrder = 4; pts.userData.u = u;
    return pts;
  }
  // Soft painterly smoke puff: a few overlapping washes, drawn once.
  function smokeTex() {
    var c = doc.createElement('canvas'), S = 96, g, i, seed = 23; c.width = c.height = S; g = c.getContext('2d');
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (i = 0; i < 7; i++) {
      var x = S / 2 + (rnd() - 0.5) * S * 0.32, y = S / 2 + (rnd() - 0.5) * S * 0.26, r = S * (0.2 + 0.14 * rnd()), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(0.6, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
    }
    return new T.CanvasTexture(c);
  }
  // A small paper sky lantern (warm paper, darker rims), as the earlier chapters' lights.
  function paperLanternTex() {
    var c = doc.createElement('canvas'); c.width = 48; c.height = 64; var g = c.getContext('2d'), gr = g.createLinearGradient(0, 8, 0, 58);
    gr.addColorStop(0, '#ffe2a6'); gr.addColorStop(0.6, '#ffb45c'); gr.addColorStop(1, '#e8823e');
    g.fillStyle = gr; g.beginPath(); g.moveTo(10, 8); g.quadraticCurveTo(24, 2, 38, 8); g.quadraticCurveTo(46, 34, 36, 56); g.lineTo(12, 56); g.quadraticCurveTo(2, 34, 10, 8); g.fill();
    g.strokeStyle = 'rgba(150,72,40,.55)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,250,224,.75)'; g.beginPath(); g.ellipse(24, 48, 6, 4, 0, 0, 6.283); g.fill();
    return new T.CanvasTexture(c);
  }
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
    st.lampV = []; for (i = 0; i < 7; i++) st.lampV.push(new T.Vector4(0, -99, 0, 0));
    st.moonU = { value: new T.Vector4(0, 9, 0, 800) }; st.aspectU = { value: 1 };
    st.snowU = { uTime: { value: 0 }, uScale: { value: 600 }, uSpeed: { value: 0.42 }, uDrift: { value: 0.3 }, uAmount: { value: 1 }, uLamp: { value: st.lampV }, uMoon: st.moonU, uAspect: st.aspectU };
    st.snow = new T.Points(sg, new T.ShaderMaterial({ uniforms: st.snowU, transparent: true, depthWrite: false, fog: false,
      vertexShader: 'attribute float aSize; attribute float aPhase; uniform float uTime; uniform float uScale; uniform float uSpeed; uniform float uDrift; uniform float uAmount; uniform vec4 uLamp[7]; varying float vA; varying float vWarm;' + MOON_GLSL +
        'void main(){ vec3 p = position; float sp = uSpeed * (0.8 + fract(aPhase * 7.3) * 0.5); p.y = mod(p.y - uTime * sp, 14.0) - 2.5;' +
        ' p.x += sin(uTime * 0.45 + aPhase) * uDrift * 1.2; p.z += cos(uTime * 0.37 + aPhase * 1.7) * uDrift; vec4 mv = modelViewMatrix * vec4(p, 1.0);' +
        ' gl_PointSize = clamp(aSize * uScale / max(-mv.z, 0.5), 1.5, 26.0); gl_Position = projectionMatrix * mv;' +
        ' vA = smoothstep(-2.5, -1.2, p.y) * smoothstep(11.5, 9.5, p.y) * step(fract(aPhase * 3.17), uAmount);' +
        // flakes that drift through a lantern's or the window's light catch it: warm, a touch larger and brighter
        ' float w = 0.0; for (int k = 0; k < 7; k++) { vec3 q = p - uLamp[k].xyz; w += uLamp[k].w * smoothstep(1.1, 0.15, length(q * vec3(1.0, 0.8, 1.0))); }' +
        ' vWarm = clamp(w, 0.0, 1.0); gl_PointSize *= 1.0 + 0.35 * vWarm; vA *= moonFade(gl_Position, gl_PointSize); }',
      fragmentShader: 'varying float vA; varying float vWarm; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.12, d);' +
        ' vec3 c = mix(vec3(0.94, 0.96, 1.0), vec3(1.0, 0.8, 0.5), vWarm * 0.85); gl_FragColor = vec4(c, a * (0.9 + 0.1 * vWarm) * vA); }' }));
    st.snow.name = 'l6cs-snow'; st.snow.frustumCulled = false; g.add(st.snow);
    st.tex = glowTex();
    // Ignition sparks (6 per lantern) and the returning fireflies: one Points draw call each.
    st.sparks = glowPoints(LANTERNS * SPARKS, 0xffc46a, 'l6cs-sparks'); g.add(st.sparks);
    st.flies = glowPoints(FLIES, 0xe8f08a, 'l6cs-fireflies'); g.add(st.flies);
    // Chimney smoke puffs (sprites in normal blending: pale blue-grey, warm where they leave the chimney).
    var stex = smokeTex(); st.smoke = [];
    for (i = 0; i < SMOKE; i++) { var sp = sprite(stex, 0xd4dbee, false); sp.name = 'l6cs-smoke-' + i; sp.renderOrder = 2; g.add(sp); st.smoke.push(sp); }
    // Three paper sky lanterns with a warm halo each.
    var ltex = paperLanternTex(); st.skyL = [];
    for (i = 0; i < SKYL; i++) {
      var body = sprite(ltex, 0xffffff, false), lh = sprite(st.tex, 0xffb050, true); body.name = 'l6cs-skylantern-' + i;
      g.add(lh); g.add(body); st.skyL.push({ body: body, halo: lh });
    }
    // The window's light pooled on the snow where the kittens curl up.
    st.pool = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: st.tex, color: 0xffa040, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    st.pool.rotation.x = -Math.PI / 2; st.pool.name = 'l6cs-window-pool'; st.pool.renderOrder = 1; g.add(st.pool);
    st.kits = [];
    return true;
  }
  /* The four kittens: the gameplay cats' Blender models through GardenCatModels.snowCat (same coats, same Walk clip),
   * with a painterly stand-in in the same colour until (or if never) the model is ready. Routes are arc-length
   * polylines along the set's path: the last stretch from each kitten's waiting spot to the door, then under the
   * window. Home spots are offsets from the cabin (the window is at +0.28 on the cabin's front face). */
  var KIT_COL = { orange: 0xf2a65a, calico: 0xe8c9a0, black: 0x4a4658, tabby: 0xb98a5e };
  var KIT_HOME = [[0.3, 0.86], [0.56, 0.82], [0.04, 0.92], [0.2, 1.14]], KIT_H = 0.62;
  function standIn(parent, color) {
    var g = new T.Group(), m = new T.MeshLambertMaterial({ color: color }), ink = new T.MeshBasicMaterial({ color: 0x2a2230 });
    var sph = new T.SphereGeometry(1, 12, 8), cone = new T.ConeGeometry(0.05, 0.09, 6);
    var body = part(sph, m, g, 0, 0.15, -0.03); body.scale.set(0.15, 0.14, 0.2);
    var head = part(sph, m, g, 0, 0.36, 0.08); head.scale.set(0.12, 0.11, 0.11);
    part(cone, m, g, -0.065, 0.47, 0.08); part(cone, m, g, 0.065, 0.47, 0.08);
    var tail = part(sph, m, g, 0.12, 0.06, -0.14); tail.scale.set(0.05, 0.04, 0.14); tail.rotation.y = -0.8;
    part(sph, ink, g, -0.04, 0.38, 0.185).scale.setScalar(0.015); part(sph, ink, g, 0.04, 0.38, 0.185).scale.setScalar(0.015);
    g.scale.setScalar(KIT_H / 0.52); parent.add(g); return g;
  }
  function buildKittens(set) {
    if (st.kits.length || !set || !set.path || !set.cabinAt) return;
    var n = 240, pts = [], cum = [0], j;
    for (j = 0; j <= n; j++) { var q = set.path(j / n); pts.push([q[0], q[1]]); if (j) cum.push(cum[j - 1] + Math.hypot(q[0] - pts[j - 1][0], q[1] - pts[j - 1][1])); }
    var total = cum[n], top = set.top, CM = root.GardenCatModels;
    function at(d) { var k = 1; while (k < n && cum[k] < d) k++; var f = clamp((d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]), 0, 1); return [lerp(pts[k - 1][0], pts[k][0], f), lerp(pts[k - 1][1], pts[k][1], f)]; }
    KITS.forEach(function (id, i) {
      var home = [set.cabinAt.x + KIT_HOME[i][0], set.cabinAt.z + KIT_HOME[i][1]], d0 = KIT_U0[i] * total, d1 = 0.9 * total, route = [], m = 18;
      for (j = 0; j <= m; j++) route.push(at(lerp(d0, d1, j / m)));
      // the waiting spot sits a little to the side of the path, alternately left and right
      var a = route[0], b = route[1], dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1, side = i % 2 ? 1 : -1;
      route.unshift([a[0] - dz / dl * 0.16 * side, a[1] + dx / dl * 0.16 * side]); route.push(home);
      var rc = [0]; for (j = 1; j < route.length; j++) rc.push(rc[j - 1] + Math.hypot(route[j][0] - route[j - 1][0], route[j][1] - route[j - 1][1]));
      var r = new T.Group(); r.name = 'l6cs-kitten-' + id; r.position.set(route[0][0], top, route[0][1]); st.g.add(r);
      var inner = new T.Group(); r.add(inner);
      var K = { id: id, i: i, root: r, inner: inner, route: route, cum: rc, len: rc[rc.length - 1], home: home, owner: null, stand: standIn(inner, KIT_COL[id]) };
      st.kits.push(K);
      if (CM && CM.snowCat) CM.snowCat(id, inner, KIT_H).then(function (o) { if (o) { K.owner = o; K.stand.visible = false; } }).catch(function () { /* keep the stand-in */ });
    });
  }
  function routeAt(K, d) {
    var c = K.cum, k = 1; while (k < c.length - 1 && c[k] < d) k++;
    var a = K.route[k - 1], b = K.route[k], f = clamp((d - c[k - 1]) / Math.max(1e-6, c[k] - c[k - 1]), 0, 1);
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[0] - a[0], b[1] - a[1])];
  }
  // Every kitten from the frame alone: walk cadence = the distance covered / the clip's stride, so seek(t) repeats it.
  function poseKitten(K, k, top) {
    var d = k.u * K.len, p = routeAt(K, d), r = K.root, o = K.owner, CM = root.GardenCatModels;
    r.position.set(p[0], top, p[1]);
    var restYaw = Math.atan2(K.route[2][0] - K.route[0][0], K.route[2][1] - K.route[0][1]), n = K.route.length;
    var arriveYaw = Math.atan2(K.home[0] - K.route[n - 2][0], K.home[1] - K.route[n - 2][1]);
    // curled up facing the camera side (+z), turned a little towards each other
    var homeYaw = 0.35 - 0.6 * (K.i % 3) / 2;
    if (Math.abs(arriveYaw - homeYaw) > Math.PI) arriveYaw += arriveYaw < homeYaw ? 2 * Math.PI : -2 * Math.PI;
    r.rotation.y = k.walking ? p[2] : k.home ? lerp(arriveYaw, homeYaw, k.curl) : lerp(restYaw + 0.9, restYaw, k.look);
    // curled up: a little lower and rounder, breathing slowly
    var curl = k.curl, br = 1 + 0.018 * k.breath * soft;
    K.inner.scale.set(1 + 0.06 * curl, (1 - 0.12 * curl) * br, 1 + 0.04 * curl);
    if (o && CM && CM.snowWalk) {
      CM.snowWalk(o, k.walking, 0, 0);
      if (k.walking && o.catWalkAction) {
        var stride = (o.catWalkStride || 1) * (o.catWalkScale || 1), dur = o.catWalkAction.getClip().duration;
        o.catWalkAction.time = ((K.i * 0.23 + d / stride) % 1) * dur; o.catMixer.update(0);
      }
    }
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
      // amber washes in normal blending (additive light turns white over the pale snow), plus a small additive core
      var halo = sprite(st.tex, 0xffa63c, false); halo.position.set(0, 0.2, 0.2); L.add(halo);
      var core = sprite(st.tex, WARM, true); core.position.set(0, 0.2, 0.22); L.add(core);
      var pool = sprite(st.tex, 0xff9a36, false); pool.position.set(0, 0.03, 0); L.add(pool); // the light pooled on the snow
      st.lanterns.push({ g: L, hole: hm, halo: halo, core: core, pool: pool });
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
      buildKittens(set);
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
    (st.md || (st.md = new T.Vector3())).set(f.moon.x, f.moon.y, f.moon.z).normalize();
    var r = Math.max(c.w / halfW, c.w * 0.9 / halfH), v3 = st.v;
    v3.set(c.x, top + c.y + c.lift * r * halfH, c.z); H.island.localToWorld(v3);
    cam.position.set(v3.x + r * Math.sin(c.phi) * Math.cos(c.th), v3.y + r * Math.cos(c.phi), v3.z + r * Math.sin(c.phi) * Math.sin(c.th));
    cam.lookAt(v3);
    // Lanterns: cold -> amber window, halo and a pool of light on the snow; sized up for the wide shots.
    for (i = 0; i < st.lanterns.length; i++) {
      var L = st.lanterns[i], lp = f.lanterns[i];
      L.hole.color.setHex(0x3a2a30).lerp(tmpB.setHex(0xffc566), lp.lit);
      L.halo.material.opacity = clamp(0.1 + 0.75 * lp.glow + 0.25 * lp.flare, 0, 1); L.halo.scale.setScalar(0.55 * lp.size * (1 + 0.9 * lp.flare));
      L.core.material.opacity = clamp(0.55 * lp.glow + 0.4 * lp.flare, 0, 1); L.core.scale.setScalar(0.28 * lp.size * (1 + 1.2 * lp.flare));
      L.pool.material.opacity = 0.42 * lp.glow; L.pool.scale.set(1.1 * lp.size, 1.1 * lp.size, 1);
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
    if (set && set.windowGlow) { set.windowGlow.material.opacity = clamp(0.4 + 0.5 * f.cabin.window + f.cabin.flicker, 0, 1); set.windowGlow.scale.setScalar(f.cabin.halo); }
    applyActors(f, t, cam, halfH, top);
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
  // Screen-space moon guard for the sprite actors (the Points do the same in their shader).
  function moonGuard(cam, halfH) {
    var md = st.md, v = st.mv || (st.mv = new T.Vector3());
    v.copy(md).multiplyScalar(50).add(cam.position).project(cam);
    var r = Math.tan(0.075) / halfH, vh = st.canvas ? st.canvas.clientHeight || root.innerHeight : root.innerHeight;
    if (v.z > 1 || v.z < -1) { st.moonU.value.set(0, 9, 0, vh); return; }
    st.moonU.value.set(v.x, v.y, r, vh); st.aspectU.value = cam.aspect;
  }
  var wpos = null;
  function spriteFade(o, alpha, cam, halfH) {
    // returns alpha faded so the sprite's own disc never reaches the guard ring round the moon
    if (alpha <= 0.002) return 0;
    o.updateMatrixWorld(); o.getWorldPosition(wpos);
    var dist = wpos.distanceTo(cam.position); wpos.project(cam);
    var m = st.moonU.value, sr = Math.max(o.scale.x, o.scale.y) * 0.5 * (o.parent ? o.parent.matrixWorld.getMaxScaleOnAxis() : 1) / (Math.max(dist, 0.01) * halfH);
    var dm = Math.hypot((wpos.x - m.x) * cam.aspect, wpos.y - m.y), rr = m.z + sr, a = alpha * (m.z ? (dm <= rr ? 0 : ease(clamp((dm - rr) / (rr * 0.35 + 0.02), 0, 1))) : 1);
    if (a > 0.02 && m.z) st.moonGap = Math.min(st.moonGap, dm - rr);
    return a;
  }
  var tmpS = {};
  function applyActors(f, t, cam, halfH, top) {
    var i, k, set = st.set, cab = set && set.cabinAt;
    wpos = wpos || new T.Vector3();
    if (!st.md) return;
    moonGuard(cam, halfH); st.moonGap = 9;
    // lamplight the flakes catch: the lit lanterns and the window
    for (i = 0; i < 7; i++) {
      if (i < st.lanterns.length) { var Lp = st.lanterns[i].g.position; st.lampV[i].set(Lp.x, Lp.y + 0.3, Lp.z, f.lanterns[i].lit * 0.9); }
      else if (i === 6 && cab) st.lampV[i].set(cab.x + 0.28, top + 0.5, cab.z + 0.75, 0.6 + 0.4 * f.cabin.window);
      else st.lampV[i].w = 0;
    }
    // ignition sparks
    var sp = st.sparks.geometry.attributes, sc = (st.canvas ? st.canvas.height : root.innerHeight) / (2 * halfH);
    st.sparks.userData.u.uScale.value = st.flies.userData.u.uScale.value = sc;
    for (i = 0; i < st.lanterns.length; i++) {
      var LP = st.lanterns[i].g.position, ls = st.lanterns[i].g.scale.x;
      for (k = 0; k < SPARKS; k++) {
        var j = i * SPARKS + k; sparkAt(i, k, t, tmpS);
        sp.position.setXYZ(j, LP.x + tmpS.x * ls, LP.y + tmpS.y * ls, LP.z + tmpS.z * ls); sp.aAlpha.setX(j, tmpS.a); sp.aSize.setX(j, 0.07 * tmpS.s);
      }
    }
    sp.position.needsUpdate = sp.aAlpha.needsUpdate = sp.aSize.needsUpdate = true;
    // fireflies
    var fa = st.flies.geometry.attributes;
    for (i = 0; i < FLIES; i++) { var fl = f.flies[i]; fa.position.setXYZ(i, fl.x, top + fl.y, fl.z); fa.aAlpha.setX(i, fl.a); fa.aSize.setX(i, 0.16 * fl.s); }
    fa.position.needsUpdate = fa.aAlpha.needsUpdate = fa.aSize.needsUpdate = true;
    // chimney smoke (chimney top: cabin-local (.35, 1.48, -.15))
    for (i = 0; i < st.smoke.length; i++) {
      var sm = f.smoke[i], S = st.smoke[i];
      if (!cab) { S.visible = false; continue; }
      S.visible = true; S.position.set(cab.x + 0.35 + sm.x, top + 1.5 + sm.y, cab.z - 0.15 + sm.z); S.scale.set(sm.s * 1.15, sm.s, 1);
      S.material.color.setHex(0xd4dbee).lerp(tmpB.setHex(0xffd9a8), sm.warm * 0.6);
      S.material.opacity = spriteFade(S, sm.a, cam, halfH);
    }
    // sky lanterns from earlier chapters
    for (i = 0; i < st.skyL.length; i++) {
      var sl = f.skyLanterns[i], B = st.skyL[i];
      B.body.position.set(sl.x, top + sl.y, sl.z); B.body.scale.set(sl.s * 0.75, sl.s, 1);
      B.halo.position.copy(B.body.position); B.halo.scale.setScalar(sl.s * 2.6);
      var la = spriteFade(B.halo, sl.a, cam, halfH); B.body.material.opacity = la; B.halo.material.opacity = la * 0.55;
    }
    // the window's light on the snow, and the kittens curled up in it
    if (cab) { st.pool.position.set(cab.x + 0.2, top + 0.03, cab.z + 0.95); st.pool.scale.set(2.0, 1.3, 1); st.pool.material.opacity = f.cabin.pool; }
    for (i = 0; i < st.kits.length; i++) poseKitten(st.kits[i], f.kittens[i], top);
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
    layout: function () { return { kittens: KITS.slice(), kittenT: KIT_T, kittenStep: KIT_STEP, flies: FLIES, skyLanterns: SKYL, smoke: SMOKE, lanterns: LANTERNS, lanternT: LANT_T, lanternStep: LANT_STEP, cam: CAM.map(function (k) { return k.t; }), titleAt: TITLE_AT }; },
    lantern: function (i, t) { return lanternAt(clamp(i | 0, 0, LANTERNS - 1), +t || 0, {}); },
    kitten: function (i, t) { return kittenAt(clamp(i | 0, 0, KITS.length - 1), +t || 0, {}); },
    spark: function (i, k, t) { return sparkAt(i | 0, k | 0, +t || 0, {}); },
    smoke: function (j, t) { return smokeAt(j | 0, +t || 0, {}); },
    grid: function () { return { bpm: BPM, beat: BEAT }; },
    camera: function (t) { return cameraAt(clamp(+t || 0, 0, DURATION)); },
    // What is actually on stage this frame: for the seek/determinism checks.
    probe: function () {
      if (!st || !staged) return null;
      // the camera in island coordinates (the island itself bobs on the game clock; the film rides on it)
      return { camera: H.island.worldToLocal(H.camera.position.clone()).toArray().map(function (v) { return +v.toFixed(4); }), snowTime: st.snowU.uTime.value, lanterns: st.lanterns.map(function (L) { return [L.halo.material.opacity, L.hole.color.getHex()]; }),
        window: st.set && st.set.windowGlow ? st.set.windowGlow.material.opacity : null,
        kittens: st.kits.map(function (K) { return { id: K.id, model: !!K.owner, x: +K.root.position.x.toFixed(4), z: +K.root.position.z.toFixed(4), yaw: +K.root.rotation.y.toFixed(4),
          walk: K.owner && K.owner.catWalkAction && K.owner.catWalkActive ? +K.owner.catWalkAction.time.toFixed(4) : -1 }; }),
        smoke: st.smoke.map(function (S) { return +S.material.opacity.toFixed(4); }), moonGap: st.moonGap,
        sparks: Array.prototype.slice.call(st.sparks.geometry.attributes.aAlpha.array).map(function (v) { return +v.toFixed(4); }) };
    },
    // Screen boxes (CSS px) of the actors this frame, for readability checks: kittens, lanterns, cabin window, moon.
    actors: function () {
      if (!st || !staged) return null;
      var cam = H.camera, v = new T.Vector3(), W = root.innerWidth, Hh = root.innerHeight;
      function box(o, dy) {
        var b = new T.Box3().setFromObject(o), pts = [], x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        if (b.isEmpty()) { o.getWorldPosition(v); b.setFromCenterAndSize(v, new T.Vector3(0.1, dy || 0.1, 0.1)); }
        for (var q = 0; q < 8; q++) { v.set(q & 1 ? b.max.x : b.min.x, q & 2 ? b.max.y : b.min.y, q & 4 ? b.max.z : b.min.z).project(cam);
          var x = (v.x + 1) * W / 2, y = (1 - v.y) * Hh / 2; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        return { x: +x0.toFixed(1), y: +y0.toFixed(1), w: +(x1 - x0).toFixed(1), h: +(y1 - y0).toFixed(1), cx: +((x0 + x1) / 2).toFixed(1), cy: +((y0 + y1) / 2).toFixed(1) };
      }
      var m = st.moonU.value;
      return { kittens: st.kits.map(function (K) { var b = box(K.inner); b.id = K.id; b.visible = K.root.visible; return b; }),
        lanterns: st.lanterns.map(function (L) { var b = box(L.g); b.halo = +L.halo.material.opacity.toFixed(3); return b; }),
        window: st.set && st.set.windowGlow ? box(st.set.windowGlow) : null,
        moon: { x: (m.x + 1) * W / 2, y: (1 - m.y) * Hh / 2, r: m.z * Hh / 2 },
        calls: root.__l3Render && root.__l3Render.info ? root.__l3Render.info.render.calls : -1 };
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
