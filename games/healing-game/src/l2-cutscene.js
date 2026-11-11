/* l2-cutscene.js: level-2 clear cutscene.
 * A seekable ~60s timeline shown after the 20th kitten. Every visual is a pure function of the
 * timeline second, so seek(t) reproduces any frame. Storyboard: docs/l2-cutscene-storyboard.md.
 * This file never reads or writes a save; the caller's onContinue decides what happens afterwards.
 * Layers: a pure model (camera, cast, props as numbers), a three.js stage that poses display-only
 * actors on the live island from that model, and a DOM layer (bars, captions, book, title). */
(function (root) {
  'use strict';
  var DURATION = 60;
  // Clock times are seconds from play(); beats are contiguous and end at DURATION.
  var BEATS = [
    { id: 'settle', t0: 0, t1: 8, caption: '风吹过草浪，夕阳把云染成了金色' },
    { id: 'gather', t0: 8, t1: 22, caption: '小猫们从花丛里探出头，一只只靠了过来' },
    { id: 'play', t0: 22, t1: 38, caption: '逗猫棒轻轻一晃，蝴蝶也来凑热闹' },
    { id: 'codex', t0: 38, t1: 50, caption: '图鉴一页页亮起，小猫蜷成一团' },
    { id: 'sleep', t0: 50, t1: 60, caption: '' }
  ];
  var TITLE_AT = 52, TITLE_FADE = 3, CONTINUE_GUARD_MS = 600;
  var TITLE = '第二关 · 完成', SUBTITLE = '暮色浮岛', CONTINUE = '轻触继续', SKIP = '跳过';

  var doc = root.document || null;
  var clock = function () {
    return root.performance && root.performance.now ? root.performance.now() : Date.now();
  };
  // idle -> playing <-> paused -> ended -> closed
  var state = 'idle', base = 0, anchor = 0, done = false, endedAt = 0;
  var opts = {}, enabled = false, muted = false, ready = !doc;
  var el = null, raf = 0, ticker = 0, showClock = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(u) { return u * u * (3 - 2 * u); }
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
  // Everything the renderer needs, derived from t alone.
  function frame(t) {
    var b = beatAt(t), local = t - b.t0, len = b.t1 - b.t0;
    return {
      t: t, beat: b.id, caption: b.caption,
      captionAlpha: b.caption ? Math.min(ramp(local, 0.4, 1.8), 1 - ramp(local, len - 1.4, len - 0.2)) : 0,
      dusk: 0.02 + 0.03 * ease(ramp(t, 16, 34)) + 0.07 * ease(ramp(t, 40, 54)),
      night: 0.45 + 0.3 * ease(ramp(t, 0, 8)) + 0.15 * ease(ramp(t, 38, 54)),
      stars: ease(ramp(t, 38, 52)),
      // Painterly look: sky palette weights (golden hour -> dusk -> blue night), wind at the pile, drifting seeds.
      look: 'painterly', sky: skyAt(t), wind: windAt(PILE.x, PILE.z, t), seeds: SEEDS + PETALS, seed: heroSeedAt(t), chase: chaseEnv(t), chime: chimeAt(t),
      bars: ease(ramp(t, 0, 2.5)),
      title: ease(ramp(t, TITLE_AT, TITLE_AT + TITLE_FADE)),
      canContinue: t >= DURATION,
      lanterns: lanternsAt(t), book: bookAt(t), cards: cardsAt(t), teaser: teaserAt(t).alpha,
      butterflies: butterflyAt(0, t).alpha, landed: landingAt(t), hearts: t > 24 && t < 37, zs: t > 47.5,
      cats: castAt(t), camera: cameraAt(t)
    };
  }

  /* ------------------------------ Model ------------------------------
   * Island-local metres; y is height above the grass. Nothing here keeps state between calls. */
  // Half a metre off the gameplay pile (-0.6, 1.4) so the nearest bush never covers the outer ring.
  var PILE = { x: -0.2, z: 1.1 }, TAU = 6.28318530718;
  var BUSH = [[-1.2, 2.7], [3.3, 1.5], [-3.6, 0.9], [0.7, -3.3], [1.9, 3.3], [-1.5, -0.1]];
  var COMMON = ['orange', 'calico', 'black', 'white', 'tabby'];
  // ring 0 = three in the middle (the glowing cat in front), ring 1 = four around them.
  var CAST = [
    { kind: 'orange', bush: 0, enter: 8.6, ring: 0, slot: 1 },
    { kind: 'calico', bush: 4, enter: 10.0, ring: 1, slot: 0 },
    { kind: 'black', bush: 5, enter: 11.4, ring: 1, slot: 1 },
    { kind: 'white', bush: 2, enter: 12.6, ring: 0, slot: 2 },
    { kind: 'tabby', bush: 3, enter: 13.6, ring: 1, slot: 2 },
    { kind: 'orange', bush: 0, enter: 15.2, ring: 1, slot: 3 },
    { kind: 'glow', bush: 1, enter: 16.4, ring: 0, slot: 0 }
  ];
  var soft = 1; // 0.3 under prefers-reduced-motion: same story, smaller and slower movement
  (function () {
    for (var i = 0; i < CAST.length; i++) {
      var c = CAST[i], b = BUSH[c.bush];
      c.i = i;
      c.a = c.ring ? 0.4 + c.slot * TAU / 4 : TAU / 4 + c.slot * TAU / 3;
      c.r = c.ring ? 1.08 : 0.5; c.rs = c.ring ? 0.95 : 0.42;
      c.sx = PILE.x + Math.cos(c.a) * c.r; c.sz = PILE.z + Math.sin(c.a) * c.r;
      var dx = c.sx - b[0], dz = c.sz - b[1], d = Math.sqrt(dx * dx + dz * dz), bow = (i % 2 ? 0.45 : -0.45);
      c.walk = 1.6 + d / 1.05; // a trot, never a dash
      c.mx = (b[0] + c.sx) / 2 - dz / d * bow; c.mz = (b[1] + c.sz) / 2 + dx / d * bow;
      c.size = c.kind === 'glow' ? 1.43 : 1.26 + 0.03 * (i % 3);
      c.phase = i * 1.37;
    }
  })();
  function lerp(a, b, u) { return a + (b - a) * u; }
  /* Wind: one travelling-wave field shared by the grass shader (same formula in GLSL), flowers, bushes,
   * seeds and the chime. It blows along WIND; reduced motion scales what it moves, not the field. */
  var WIND = { x: 0.86, z: 0.5 }, SEEDS = 12, PETALS = 14;
  function windAt(x, z, t) {
    var a = x * WIND.x + z * WIND.z;
    return (0.65 + 0.35 * Math.sin(t * 0.37 + 1)) * (0.55 * Math.sin(a * 1.3 - t * 1.6) + 0.3 * Math.sin(a * 2.9 - t * 2.7 + z * 1.1) + 0.15 * Math.sin((-0.4 * x + 0.9 * z) * 4.1 - t * 3.3));
  }
  function skyAt(t) {
    var night = ease(ramp(t, 40, 52)), dusk = ease(ramp(t, 16, 34)) * (1 - night);
    return { gold: 1 - dusk - night, dusk: dusk, night: night };
  }
  function frac(v) { return v - Math.floor(v); }
  // Dandelion seeds (kind 0) and petals (kind 1) ride the wind across the island and wrap around.
  function drifterAt(j, kind, t) {
    var s = j * 12.9898 + kind * 78.233 + 1.7, r1 = frac(Math.sin(s) * 43758.5453), r2 = frac(Math.sin(s * 1.7) * 24634.6345), r3 = frac(Math.sin(s * 2.3) * 9631.117);
    var span = 13, u = frac(r1 + t * (0.4 + 0.6 * soft) * (0.5 + 0.3 * r2) / span), along = (u - 0.5) * span, across = (r3 - 0.5) * 9;
    return {
      x: WIND.x * along - WIND.z * across + 0.25 * Math.sin(t * 0.7 + j * 2.1), z: WIND.z * along + WIND.x * across,
      y: (kind ? 0.35 : 0.6) + 1.9 * r2 + 0.22 * Math.sin(t * 0.9 + j * 1.3) - (kind ? 0.5 * u : -0.3 * u),
      alpha: Math.sin(Math.PI * u), spin: (kind ? 1.6 : 0.4) * t * (r3 - 0.5) + j
    };
  }
  // One kitten leaves the ring to chase a single seed across the front of the pile, then trots back.
  var CHASER = 2;
  function chaseEnv(t) { return ease(ramp(t, 24.5, 26.5)) * (1 - ease(ramp(t, 29.5, 32))); }
  function chasePath(t) {
    var u = t - 24.5, a = 1.0 + 0.62 * soft * Math.sin(0.85 * u), r = 1.72 + 0.2 * soft * Math.sin(1.6 * u);
    return { x: PILE.x + Math.cos(a) * r, z: PILE.z + Math.sin(a) * r };
  }
  function heroSeedAt(t) {
    var p = chasePath(t + 0.5), far = 1 - ease(ramp(t, 23, 25)), out = ease(ramp(t, 29.6, 31.5));
    return {
      x: p.x + (out * 3.5 - far * 4) * WIND.x, z: p.z + (out * 3.5 - far * 4) * WIND.z,
      y: 0.62 + 0.12 * Math.sin(2.3 * t) + far * 0.8 + out * 1.6, alpha: ease(ramp(t, 23, 23.8)) * (1 - ease(ramp(t, 30.6, 31.5)))
    };
  }
  // Wind chime on a bamboo pole beside the pile: swing angle, paper-strip spin and a glint on gusts.
  var CHIME = { x: 1.6, z: 0.15 };
  function chimeAt(t) {
    var w = windAt(CHIME.x, CHIME.z, t);
    return { swing: (0.05 + 0.16 * w) * (0.3 + 0.7 * soft), spin: 0.9 * Math.sin(t * 1.3) + 1.4 * w * soft, ring: clamp((w - 0.35) * 2.2, 0, 1) };
  }
  function turnTo(a, b, u) { var d = (b - a) % TAU; if (d > TAU / 2) d -= TAU; if (d < -TAU / 2) d += TAU; return a + d * u; }
  function playEnv(t) { return ease(ramp(t, 22, 24.5)) * (1 - ease(ramp(t, 36.5, 38))); }
  function teaserAt(t) {
    var w = 0.7 * (t - 22), out = ease(ramp(t, 36.8, 38.4));
    return {
      alpha: ease(ramp(t, 21.4, 23)) * (1 - out),
      x: PILE.x + 0.34 * Math.sin(w), z: PILE.z + 0.2 * Math.sin(2 * w),
      y: 1.02 + 0.2 * Math.sin(1.5 * w) * soft + 1.6 * (1 - ease(ramp(t, 21.4, 23.4))) + 1.8 * out, sway: 0.3 * Math.cos(w)
    };
  }
  function ringAt(c, t) {
    var env = playEnv(t), turn = ease(ramp(t, 39, 45.5));
    var a = c.a + TAU * turn + env * 0.3 * soft * Math.sin(0.55 * (t - 22) + c.i * 1.9);
    var r = lerp(c.r, c.rs, ease(ramp(t, 39, 46))) * (1 + env * 0.1 * soft * Math.sin(0.8 * t + c.i * 2.3));
    var p = { x: PILE.x + Math.cos(a) * r, z: PILE.z + Math.sin(a) * r, a: a };
    if (c.i === CHASER) { var e = chaseEnv(t), q = chasePath(t); p.x = lerp(p.x, q.x, e); p.z = lerp(p.z, q.z, e); }
    return p;
  }
  function placeAt(c, t) {
    if (t >= c.enter + c.walk) return ringAt(c, t);
    var u = ease(ramp(t, c.enter, c.enter + c.walk)), v = 1 - u, b = BUSH[c.bush];
    return { x: v * v * b[0] + 2 * v * u * c.mx + u * u * c.sx, z: v * v * b[1] + 2 * v * u * c.mz + u * u * c.sz, a: c.a };
  }
  function catAt(i, t) {
    var c = CAST[i], p = placeAt(c, t), p0 = placeAt(c, t - 0.06), p1 = placeAt(c, t + 0.06);
    var vx = (p1.x - p0.x) / 0.12, vz = (p1.z - p0.z) / 0.12, speed = Math.sqrt(vx * vx + vz * vz);
    var te = teaserAt(t), look = ease(ramp(t, 21.5, 23.5)) * (1 - ease(ramp(t, 37, 38.5)));
    // Faces the viewer, then the teaser; curls along the ring; turns into its own path while walking.
    var yaw = Math.atan2(lerp(PILE.x * 0.4, te.x, look) - p.x, lerp(PILE.z + 8, te.z, look) - p.z);
    yaw = turnTo(yaw, Math.atan2(-Math.sin(p.a), Math.cos(p.a)), ease(ramp(t, 38.5, 40)));
    if (speed > 0.001) yaw = turnTo(yaw, Math.atan2(vx, vz), ease(ramp(speed, 0.08, 0.4)));
    var env = playEnv(t), hop = Math.max(0, Math.sin(t * 2.1 + i * 1.7));
    var roll = soft < 1 ? 0 : i === 1 ? ease(ramp(t, 27, 28.5)) : i === 4 ? ease(ramp(t, 31, 32.5)) : 0;
    var curl = ease(ramp(t, 45.6 + 0.25 * i, 48.4 + 0.2 * i)), chase = i === CHASER ? chaseEnv(t) : 0;
    // Ear flick: a short pulse every few seconds, out of phase per cat; stops once asleep.
    var eu = frac((t + c.phase * 1.3) / (3.1 + 0.4 * (i % 3))) * (3.1 + 0.4 * (i % 3)), ear = eu < 0.32 ? Math.sin(Math.PI * eu / 0.32) * (1 - 0.8 * curl) : 0;
    return {
      kind: c.kind, x: p.x, z: p.z, yaw: yaw, roll: roll * TAU,
      y: env * 0.15 * soft * hop * hop * hop * (1 - chase) + roll * (1 - roll) * 0.8 + chase * 0.11 * soft * Math.abs(Math.sin(t * 5)),
      ear: ear, tail: Math.sin(t * (1.1 + 0.8 * env) + c.phase) * (1 - 0.7 * curl), chase: chase,
      fade: ease(ramp(t, c.enter - 1.4, c.enter - 0.4)), crouch: 1 - ease(ramp(t, c.enter - 0.2, c.enter + 0.7)),
      curl: curl, moving: speed > 0.12, bat: Math.max(env * (1 - chase) * Math.max(0, Math.sin(t * 1.9 + i * 2.6)), chase * Math.abs(Math.sin(t * 4))),
      state: t < c.enter ? 'hide' : t < c.enter + c.walk ? 'gather' : t < 22 ? 'idle' : t < 38 ? 'play' : curl > 0.5 ? 'sleep' : t < 45.5 ? 'gather' : 'idle',
      rare: c.kind === 'glow', rustle: ease(ramp(t, c.enter - 1.6, c.enter - 0.6)) * (1 - ease(ramp(t, c.enter + 0.2, c.enter + 1.4)))
    };
  }
  function castAt(t) { var out = []; for (var i = 0; i < CAST.length; i++) out.push(catAt(i, t)); return out; }
  var LAND_CAT = 3;
  function landingAt(t) { return ease(ramp(t, 31.5, 33.2)) * (1 - ease(ramp(t, 35.2, 36.6))); }
  function butterflyPath(j, t) {
    var a = (0.42 + 0.06 * j) * (t - 22) * (j === 1 ? -1 : 1) + j * 2.1, r = 1.45 + 0.3 * Math.sin(0.5 * t + j);
    var p = { x: PILE.x + Math.cos(a) * r, z: PILE.z + Math.sin(a) * r * 0.8, y: 1.05 + 0.3 * Math.sin(0.9 * t + j * 2) };
    if (j === 0) {
      var L = landingAt(t), k = catAt(LAND_CAT, t), s = CAST[LAND_CAT].size;
      p.x = lerp(p.x, k.x + Math.sin(k.yaw) * 0.42 * s, L); p.z = lerp(p.z, k.z + Math.cos(k.yaw) * 0.42 * s, L);
      p.y = lerp(p.y, 0.5 * s + k.y, L);
    }
    return p;
  }
  function butterflyAt(j, t) {
    var env = ease(ramp(t, 23 + j * 0.8, 26 + j * 0.8)) * (1 - ease(ramp(t, 36.4, 38.2)));
    var p = butterflyPath(j, t), q = butterflyPath(j, t + 0.1), L = j === 0 ? landingAt(t) : 0;
    var away = (1 - env) * 5;
    return {
      alpha: ease(ramp(env, 0, 0.35)), x: p.x + away * (j === 1 ? -1 : 1), y: p.y + away * 0.5, z: p.z - away * 0.3,
      yaw: Math.atan2(q.x - p.x, q.z - p.z), flap: Math.sin(t * (13 - 9 * L) * (0.4 + 0.6 * soft) + j) * (0.95 - 0.5 * L)
    };
  }
  var LANTERN = [[-2.1, 1.7, 0.9], [1.0, 1.95, 0.7], [-0.7, 2.6, 0.1], [-2.7, 2.4, 2.1], [1.7, 2.7, 2.0]];
  function lanternsAt(t) { var out = []; for (var i = 0; i < LANTERN.length; i++) out.push(ease(ramp(t, 1.8 + i, 3.6 + i))); return out; }
  var CARD_AT = 38.8, CARD_STEP = 0.9;
  function bookAt(t) { return ease(ramp(t, 38.2, 39.2)) * (1 - ease(ramp(t, 48, 49.2))); }
  // Six cards in codex order; the rare card is last.
  function cardsAt(t) { var out = []; for (var i = 0; i < 6; i++) out.push(ease(ramp(t, CARD_AT + i * CARD_STEP, CARD_AT + 0.8 + i * CARD_STEP))); return out; }
  /* Camera keys: look-at point, azimuth th (PI/2 = the gameplay side), polar phi, half-width w that
   * must stay in frame, and lift = how far above the look-at the frame centre sits (in half-screens). */
  // Slow and wide: a far establishing shot under the big sky, a long glide in, one gentle arc, a crane up.
  var CAM = [
    { t: 0, x: 0, y: 1.3, z: 0, th: 1.36, phi: 1.43, w: 8.4, lift: 0.22 },
    { t: 8, x: -0.2, y: 0.9, z: 0.4, th: 1.6, phi: 1.32, w: 6.0, lift: 0.1 },
    { t: 15, x: -0.4, y: 0.5, z: 1.4, th: 1.76, phi: 1.3, w: 3.6, lift: 0.05 },
    { t: 22, x: 0.2, y: 0.5, z: 1.2, th: 1.3, phi: 1.3, w: 3.0, lift: 0.05 },
    // Around the pile the azimuth stays inside 0.9-1.5: a bush stands in front of it at ~2.0.
    { t: 31, x: PILE.x + 0.15, y: 0.5, z: PILE.z + 0.2, th: 1.08, phi: 1.28, w: 2.6, lift: 0.05 },
    { t: 35, x: PILE.x - 0.1, y: 0.55, z: PILE.z, th: 1.34, phi: 1.3, w: 2.0, lift: 0.05 },
    { t: 38, x: PILE.x, y: 0.5, z: PILE.z, th: 1.45, phi: 1.28, w: 2.3, lift: 0 },
    { t: 44, x: PILE.x, y: 0.3, z: PILE.z, th: 1.38, phi: 1.1, w: 2.3, lift: -0.38 },
    { t: 50, x: PILE.x, y: 0.3, z: PILE.z, th: 1.3, phi: 1.12, w: 2.4, lift: -0.15 },
    { t: 60, x: PILE.x, y: 0.3, z: PILE.z, th: 1.2, phi: 1.3, w: 3.4, lift: 0.46 }
  ];
  function cameraAt(t) {
    var i = 0;
    while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
    var a = CAM[i], b = CAM[i + 1], u = ease(ramp(t, a.t, b.t)), out = {}, keys = ['x', 'y', 'z', 'th', 'phi', 'w', 'lift'];
    for (var k = 0; k < keys.length; k++) out[keys[k]] = lerp(a[keys[k]], b[keys[k]], u);
    return out;
  }


  /* ------------------------------ Stage ------------------------------
   * Display-only actors on the live island. Gameplay kittens are hidden and frozen while it is up
   * (kittens.js checks staged()); nothing here feeds back into rewards, counts or saves. */
  var H = null, T = null, st = null, staged = false, kept = null, sky = null;
  function stageKit() { return root.__l2Stage || null; }
  function castKinds() {
    var kit = stageKit(), caught = kit ? kit.caught() : {}, own = [], i;
    for (i = 0; i < COMMON.length; i++) if (caught[COMMON[i]] > 0) own.push(COMMON[i]);
    if (!own.length) own = COMMON; // preview on an empty save shows every coat
    var n = 0;
    for (i = 0; i < CAST.length; i++) if (CAST[i].kind !== 'glow') CAST[i].kind = own[n++ % own.length];
  }
  function sprite(map, color, additive) {
    var m = new T.SpriteMaterial({ map: map, color: color, transparent: true, opacity: 0, depthWrite: false });
    if (additive) m.blending = T.AdditiveBlending;
    return new T.Sprite(m);
  }
  function part(geo, mat, parent, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); parent.add(m); return m; }
  /* ---- Painterly kit (cutscene only; every swap is undone in exitStage) ----
   * Toon ramp: MeshToonMaterial + a 4-step gradientMap replaces the island's Lambert materials; the Blender
   * coats keep their own material (cloned) and get the same banding injected after the light sum.
   * Outline: inverted hull, pushed along the view-space normal by a depth-scaled width. */
  var PAL = {
    gold: { top: 0x4f8fd2, mid: 0x8fc2ea, hor: 0xfff0c8, low: 0xc4d8e2, lit: 0xfffaf0, shade: 0xecd2c6, sun: 0xffd9a0, key: 0xffb866, keyI: 0.8, hemiA: 0xfff0d2, hemiB: 0xb89474, hemiI: 0.7, rim: [0.62, 0.42, 0.18], grass: [1.08, 1.0, 0.8], fog: 0xf2e6cc },
    dusk: { top: 0x4d5a9e, mid: 0xc691b6, hor: 0xffb07c, low: 0xd58a7a, lit: 0xffd0a4, shade: 0x8c709e, sun: 0xff9a6a, key: 0xff9c84, keyI: 0.55, hemiA: 0xf0c6dc, hemiB: 0x7c6aa6, hemiI: 0.7, rim: [0.42, 0.22, 0.2], grass: [0.98, 0.84, 0.84], fog: 0xe6a892 },
    night: { top: 0x121c48, mid: 0x29407e, hor: 0x6176b4, low: 0x2c386a, lit: 0xa6b8e4, shade: 0x3c4c88, sun: 0x000000, key: 0x93aaff, keyI: 0.34, hemiA: 0xa4b6ff, hemiB: 0x3c4484, hemiI: 0.74, rim: [0.16, 0.22, 0.42], grass: [0.52, 0.64, 0.94], fog: 0x4c5c9a }
  };
  var rimU = { value: null }, ramp4 = null, toons = {}, painted = [], hulls = [], hullMat = null, tmpA = null, tmpB = null;
  var RAMP_GLSL = 'vec3 l2d = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse; float l2l = dot(l2d, vec3(0.3333)) / max(dot(diffuseColor.rgb, vec3(0.3333)), 0.02);' +
    ' float l2q = (floor(l2l * 3.0) + smoothstep(0.35, 0.65, fract(l2l * 3.0))) / 3.0 + 0.14; float l2k = l2q / max(l2l, 0.02);' +
    ' reflectedLight.directDiffuse *= l2k; reflectedLight.indirectDiffuse *= l2k; reflectedLight.directSpecular *= 0.25; reflectedLight.indirectSpecular *= 0.25;\n';
  var RIM_GLSL = 'float l2f = 1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);' +
    ' reflectedLight.directDiffuse += diffuseColor.rgb * l2rim * smoothstep(0.52, 0.78, l2f) * clamp(normal.y * 0.6 + 0.55, 0.0, 1.0);\n';
  function patch(m, from, banded, rim) {
    var prev = from && from.hasOwnProperty('onBeforeCompile') ? from.onBeforeCompile : null;
    var key = from && from.hasOwnProperty('customProgramCacheKey') ? from.customProgramCacheKey() : '';
    m.onBeforeCompile = function (shader, renderer) {
      if (prev) prev.call(m, shader, renderer);
      shader.uniforms.l2rim = rimU;
      shader.fragmentShader = 'uniform vec3 l2rim;\n' + shader.fragmentShader.replace('#include <lights_fragment_end>',
        '#include <lights_fragment_end>\n' + (banded ? RAMP_GLSL : '') + (rim ? RIM_GLSL : ''));
    };
    m.customProgramCacheKey = function () { return key + '|l2cs' + (banded ? 'b' : '') + (rim ? 'r' : ''); };
  }
  function toonFor(m, rim) {
    var id = m.uuid + (rim ? 'r' : ''), out = toons[id];
    if (out) return out;
    if (m.isMeshLambertMaterial) {
      out = new T.MeshToonMaterial({ color: m.color, map: m.map, gradientMap: ramp4, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity,
        transparent: m.transparent, opacity: m.opacity, side: m.side, vertexColors: m.vertexColors, alphaTest: m.alphaTest, depthWrite: m.depthWrite, fog: m.fog });
      patch(out, null, false, rim);
    } else { out = m.clone(); patch(out, m, true, true); }
    toons[id] = out;
    return out;
  }
  // Repaints whatever is on the island right now; called again while the Blender coats are still arriving.
  function paint() {
    var kit = stageKit(), bushes = kit.group();
    H.island.traverse(function (o) {
      if (!o.isMesh || o.isSkinnedMesh || o.l2cs || !o.material || o.material.length !== undefined) return;
      var m = o.material, cat = false, bush = false, q = o;
      if (!m.isMeshLambertMaterial && !m.isMeshStandardMaterial) return;
      while (q && q !== H.island) { if (q.name === 'BlenderCatModel' || q.l2cat) cat = true; if (q === bushes) bush = true; q = q.parent; }
      if (m.isMeshStandardMaterial && !cat) return;
      o.l2cs = true;
      painted.push([o, m]);
      o.material = toonFor(m, o !== H.grassTop);
      if ((cat || bush) && o.geometry.attributes.normal) {
        var hull = new T.Mesh(o.geometry, hullMat);
        hull.l2cs = true; hull.frustumCulled = false; o.add(hull); hulls.push(hull);
      }
    });
  }
  function unpaint() {
    var i;
    for (i = 0; i < painted.length; i++) { painted[i][0].material = painted[i][1]; painted[i][0].l2cs = false; }
    for (i = 0; i < hulls.length; i++) if (hulls[i].parent) hulls[i].parent.remove(hulls[i]);
    painted = []; hulls = [];
  }
  function canvasTex(size, draw) {
    var c = doc.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
    return new T.CanvasTexture(c);
  }
  var NOISE_GLSL = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }' +
    'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; } return s; }';
  var WIND_GLSL = 'float windF(vec2 p, float t){ float a = p.x * 0.86 + p.y * 0.5; return (0.65 + 0.35 * sin(t * 0.37 + 1.0)) * (0.55 * sin(a * 1.3 - t * 1.6) + 0.3 * sin(a * 2.9 - t * 2.7 + p.y * 1.1) + 0.15 * sin((-0.4 * p.x + 0.9 * p.y) * 4.1 - t * 3.3)); }';
  function buildPainterly(g) {
    var i, kit = stageKit();
    ramp4 = new T.DataTexture(new Uint8Array([84, 150, 214, 255]), 4, 1, T.LuminanceFormat);
    ramp4.minFilter = ramp4.magFilter = T.NearestFilter; ramp4.generateMipmaps = false; ramp4.needsUpdate = true;
    rimU.value = new T.Vector3(); tmpA = new T.Color(); tmpB = new T.Color();
    hullMat = new T.ShaderMaterial({ side: T.BackSide, uniforms: { uW: { value: 0.0027 }, uCol: { value: new T.Color(0x4a3340) } },
      vertexShader: 'uniform float uW; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); mv.xyz += normalize(normalMatrix * normal) * min(-mv.z, 13.0) * uW; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.0); }' });
    // Gouache sky: washed gradient, crisp-edged cumulus in two tones lit from the sun side, low sun, moon.
    st.skyU = { uTime: { value: 0 }, uNight: { value: 0 }, uDisc: { value: 1 }, uSun: { value: new T.Vector3() }, uMoon: { value: new T.Vector3(0.42, 0.56, -0.71).normalize() } };
    var names = ['Top', 'Mid', 'Hor', 'Low', 'Lit', 'Shade', 'SunCol'];
    for (i = 0; i < names.length; i++) st.skyU['u' + names[i]] = { value: new T.Color() };
    st.sky = new T.Mesh(new T.SphereGeometry(110, 32, 20), new T.ShaderMaterial({ uniforms: st.skyU, side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uSunCol; uniform vec3 uSun; uniform vec3 uMoon;' +
        'uniform float uTime; uniform float uNight; uniform float uDisc; varying vec3 vDir;' + NOISE_GLSL +
        'void main(){ vec3 d = normalize(vDir); float h = d.y; float wash = fbm(d.xz * 2.6 + d.y * 3.0 + 3.1); float hh = h + (wash - 0.5) * 0.18;' +
        ' vec3 col = mix(uLow, uHor, smoothstep(-0.55, -0.03, hh)); col = mix(col, uMid, smoothstep(-0.05, 0.1, hh)); col = mix(col, uTop, smoothstep(0.1, 0.6, hh));' +
        ' col *= 0.95 + 0.1 * wash; float s = max(dot(d, uSun), 0.0);' +
        ' col += uSunCol * (pow(s, 5.0) * 0.24 + pow(s, 40.0) * 0.28 + smoothstep(0.9972, 0.9984, s) * uDisc);' +
        ' float m = max(dot(d, uMoon), 0.0); col += vec3(0.85, 0.9, 1.0) * uNight * (pow(m, 260.0) * 0.4 + smoothstep(0.9988, 0.9993, m) * 0.85);' +
        ' if (h > -0.3) { vec2 uv = d.xz / (h + 0.62) * 0.95 + vec2(uTime * 0.011, uTime * 0.004); float big = noise(uv * 0.45 + 5.0);' +
        '  float dens = fbm(uv) * 0.75 + big * 0.45; float band = smoothstep(-0.28, -0.1, h) * (1.0 - smoothstep(0.55, 0.9, h));' +
        '  float mask = smoothstep(0.67, 0.695, dens) * band; float d2 = fbm(uv + normalize(uSun.xz + vec2(0.001)) * 0.16 + vec2(0.0, 0.05)) * 0.75 + big * 0.45;' +
        '  float lite = smoothstep(-0.035, 0.015, dens - d2) * 0.8 + smoothstep(0.67, 0.71, dens) * (1.0 - smoothstep(0.71, 0.78, dens)) * 0.5;' +
        '  vec3 cloud = mix(uShade, uLit, clamp(lite, 0.0, 1.0)) * (0.94 + 0.12 * wash); col = mix(col, cloud, mask * (0.96 - 0.3 * uNight)); }' +
        ' col *= 0.975 + 0.05 * hash(floor(gl_FragCoord.xy * 0.5)); gl_FragColor = vec4(col, 1.0); }' }));
    st.sky.renderOrder = -10; st.sky.frustumCulled = false; st.sky.visible = false; H.scene.add(st.sky);
    // Tall grass and wildflowers: instanced blades bent by the travelling wind wave (three bands of colour, lighter crests).
    var seed = 11, n = H.IS_MOBILE ? 1500 : 2400, off = [], dim = [], hoff = [], hdim = [];
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < n; i++) {
      var a = rnd() * TAU, r = Math.sqrt(rnd()) * 4.8, x = Math.cos(a) * r, z = Math.sin(a) * r, pd = Math.sqrt((x - PILE.x) * (x - PILE.x) + (z - PILE.z) * (z - PILE.z));
      var hgt = 0.2 + 0.24 * rnd() + (r > 3.5 ? 0.22 * rnd() : 0), flower = i % 14 === 0 && pd > 1.3;
      if (H.POND && Math.sqrt((x - H.POND.x) * (x - H.POND.x) + (z - H.POND.z) * (z - H.POND.z)) < 1.45) continue;
      if (pd < 1.7) { if (rnd() < 0.55) continue; hgt *= 0.3 + 0.4 * pd / 1.7; }
      if (flower) { hgt = 0.42 + 0.22 * rnd(); hoff.push(x, z, 0); hdim.push(hgt, 0.07 + 0.03 * rnd(), rnd()); }
      off.push(x, z, rnd() * TAU); dim.push(hgt, flower ? 0.022 : 0.05 + 0.03 * rnd(), rnd());
    }
    st.grassU = { uTime: { value: 0 }, uSoft: { value: soft }, uTopY: { value: H.TOP_Y }, uLight: { value: new T.Vector3(1, 1, 1) },
      uRoot: { value: new T.Color(0x62b06e) }, uTip: { value: new T.Color(0xc6e896) } };
    function field(base, index, o, d, head) {
      var geo = new T.InstancedBufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(base, 3)); geo.setIndex(index);
      geo.setAttribute('aOff', new T.InstancedBufferAttribute(new Float32Array(o), 3)); geo.setAttribute('aDim', new T.InstancedBufferAttribute(new Float32Array(d), 3));
      geo.instanceCount = o.length / 3;
      var mesh = new T.Mesh(geo, new T.ShaderMaterial({ uniforms: st.grassU, side: T.DoubleSide, defines: head ? { HEAD: 1 } : {},
        vertexShader: 'attribute vec3 aOff; attribute vec3 aDim; uniform float uTime; uniform float uSoft; uniform float uTopY; varying float vH; varying float vW; varying float vR;' + WIND_GLSL +
          'void main(){ float w = windF(aOff.xy, uTime); float lean = 0.16 + 0.44 * uSoft * w;\n#ifdef HEAD\n float h = 1.0; vec3 p = vec3(position.x, (1.0 - length(position.xy)) * 0.45, position.y) * aDim.y; p.y += aDim.x;\n' +
          '#else\n float h = position.y; float px = position.x * aDim.y * (1.0 - h * 0.82); vec3 p = vec3(px * cos(aOff.z), h * aDim.x, px * sin(aOff.z));\n#endif\n' +
          ' float k = lean * h * h * aDim.x; p.x += 0.86 * k; p.z += 0.5 * k; p.y -= 0.4 * lean * lean * h * h * aDim.x; vH = h; vW = w; vR = aDim.z;' +
          ' gl_Position = projectionMatrix * modelViewMatrix * vec4(aOff.x + p.x, uTopY + p.y, aOff.y + p.z, 1.0); }',
        fragmentShader: 'uniform vec3 uRoot; uniform vec3 uTip; uniform vec3 uLight; varying float vH; varying float vW; varying float vR;' +
          'void main(){\n#ifdef HEAD\n vec3 col = vR < 0.34 ? vec3(1.0, 0.97, 0.9) : vR < 0.67 ? vec3(1.0, 0.7, 0.8) : vec3(1.0, 0.86, 0.45);\n' +
          '#else\n vec3 col = mix(uRoot, uTip, clamp(floor(vH * 3.0 + vR * 0.7) / 3.0, 0.0, 1.0)) * (0.92 + 0.16 * vR); col += vec3(0.2, 0.19, 0.08) * smoothstep(0.3, 0.7, vW) * vH;\n#endif\n' +
          ' gl_FragColor = vec4(col * uLight, 1.0); }' }));
      mesh.frustumCulled = false; mesh.l2cs = true; g.add(mesh);
      return mesh;
    }
    st.grass = field([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.34, 0, 0.5, 0.34, 0, -0.5, 0.67, 0, 0.5, 0.67, 0, 0, 1, 0], [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6], off, dim, false);
    var disc = [0, 0, 0], di = [];
    for (i = 0; i < 6; i++) { disc.push(Math.cos(i * TAU / 6), Math.sin(i * TAU / 6), 0); di.push(0, 1 + i, 1 + (i + 1) % 6); }
    st.heads = field(disc, di, hoff, hdim, true);
    st.blades = off.length / 3; st.blooms = hoff.length / 3;
    // Dandelion seeds and petals: small painted sprites, each with its own slow spin.
    var seedTex = canvasTex(64, function (c, S) {
      c.strokeStyle = 'rgba(255,252,240,.95)'; c.lineWidth = 1.6; c.lineCap = 'round';
      for (var q = 0; q < 11; q++) { var an = -Math.PI * (0.08 + 0.84 * q / 10); c.beginPath(); c.moveTo(S / 2, S * 0.52); c.lineTo(S / 2 + Math.cos(an) * S * 0.36, S * 0.52 + Math.sin(an) * S * 0.36); c.stroke(); }
      c.beginPath(); c.moveTo(S / 2, S * 0.52); c.lineTo(S / 2, S * 0.86); c.stroke();
      c.fillStyle = 'rgba(186,150,110,.95)'; c.beginPath(); c.ellipse(S / 2, S * 0.88, 2.4, 4.4, 0, 0, TAU); c.fill();
    });
    var petalTex = canvasTex(64, function (c, S) {
      var gr = c.createLinearGradient(0, S * 0.2, 0, S * 0.8); gr.addColorStop(0, 'rgba(255,236,240,.98)'); gr.addColorStop(1, 'rgba(255,170,196,.95)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(S / 2, S * 0.14); c.bezierCurveTo(S * 0.86, S * 0.3, S * 0.74, S * 0.8, S / 2, S * 0.88); c.bezierCurveTo(S * 0.26, S * 0.8, S * 0.14, S * 0.3, S / 2, S * 0.14); c.fill();
    });
    st.seedTex = seedTex; st.drift = [[], []];
    for (i = 0; i < SEEDS + PETALS; i++) {
      var ds = sprite(i < SEEDS ? seedTex : petalTex, 0xffffff, false), sz = i < SEEDS ? 0.2 : 0.13; ds.scale.set(sz, sz, 1); g.add(ds); st.drift[i < SEEDS ? 0 : 1].push(ds);
    }
    st.hero = sprite(seedTex, 0xffffff, false); st.hero.scale.set(0.34, 0.34, 1); g.add(st.hero);
    st.heroGlow = sprite(H.glowTex, 0xfff4d0, true); st.heroGlow.scale.set(0.6, 0.6, 1); g.add(st.heroGlow);
    // Wind chime: a glass bell with a paper strip on a leaning bamboo pole.
    var wood = new T.MeshLambertMaterial({ color: 0xb98f62, emissive: 0x1c120a }), glass = new T.MeshLambertMaterial({ color: 0xbfe6f2, emissive: 0x24343c, transparent: true, opacity: 0.82 });
    var cg = new T.Group(), hang = new T.Group(), strip = new T.Group();
    cg.position.set(CHIME.x, H.TOP_Y, CHIME.z);
    var pole = part(new T.CylinderGeometry(0.022, 0.032, 1.75, 6), wood, cg, 0, 0.87, 0); pole.rotation.z = 0.05;
    var arm = part(new T.CylinderGeometry(0.014, 0.018, 0.46, 5), wood, cg, -0.26, 1.66, 0); arm.rotation.z = 1.42;
    hang.position.set(-0.46, 1.62, 0); cg.add(hang);
    part(new T.CylinderGeometry(0.004, 0.004, 0.12, 4), new T.MeshBasicMaterial({ color: 0xfff2d8 }), hang, 0, -0.06, 0);
    var bell = part(new T.SphereGeometry(0.1, 12, 7, 0, TAU, 0, Math.PI * 0.62), glass, hang, 0, -0.2, 0);
    part(new T.TorusGeometry(0.086, 0.008, 5, 14), new T.MeshBasicMaterial({ color: 0xff9db8 }), hang, 0, -0.245, 0).rotation.x = Math.PI / 2;
    part(new T.CylinderGeometry(0.003, 0.003, 0.22, 4), new T.MeshBasicMaterial({ color: 0xfff2d8 }), hang, 0, -0.33, 0);
    strip.position.set(0, -0.44, 0); hang.add(strip);
    var paper = part(new T.PlaneGeometry(0.075, 0.24), new T.MeshBasicMaterial({ color: 0xfff4dc, side: T.DoubleSide }), strip, 0, -0.12, 0);
    part(new T.PlaneGeometry(0.075, 0.03), new T.MeshBasicMaterial({ color: 0xff9db8, side: T.DoubleSide }), paper, 0, 0.06, 0.001);
    var glint = sprite(H.glowTex, 0xfff6d8, true); glint.scale.set(0.5, 0.5, 1); glint.position.y = -0.2; hang.add(glint);
    var bh = new T.Mesh(bell.geometry, hullMat); bh.l2cs = true; bell.add(bh);
    g.add(cg); st.chime = { g: cg, hang: hang, strip: strip, glint: glint };
    // The game's own sky and lights: borrowed while staged, handed back untouched.
    for (i = 0; i < H.scene.children.length; i++) {
      var ch = H.scene.children[i];
      if (ch.isHemisphereLight) st.hemi = ch; else if (ch.isDirectionalLight) st.sun = ch;
      else if (ch.isMesh && ch.geometry && ch.geometry.parameters && ch.geometry.parameters.radius === 120) sky = ch;
    }
    return kit;
  }
  function mix3(key, sk, out) {
    out.setHex(PAL.gold[key]).multiplyScalar(sk.gold); tmpB.setHex(PAL.dusk[key]).multiplyScalar(sk.dusk); out.add(tmpB);
    tmpB.setHex(PAL.night[key]).multiplyScalar(sk.night); return out.add(tmpB);
  }
  function mixN(key, sk, j) { return PAL.gold[key][j] * sk.gold + PAL.dusk[key][j] * sk.dusk + PAL.night[key][j] * sk.night; }
  function mixS(key, sk) { return PAL.gold[key] * sk.gold + PAL.dusk[key] * sk.dusk + PAL.night[key] * sk.night; }
  function applyLook(f, t) {
    var sk = f.sky, u = st.skyU, i, cam = H.camera;
    mix3('top', sk, u.uTop.value); mix3('mid', sk, u.uMid.value); mix3('hor', sk, u.uHor.value); mix3('low', sk, u.uLow.value);
    mix3('lit', sk, u.uLit.value); mix3('shade', sk, u.uShade.value); mix3('sun', sk, u.uSunCol.value);
    u.uTime.value = t; u.uNight.value = sk.night; u.uDisc.value = 1 - ease(ramp(t, 22, 34));
    u.uSun.value.set(-0.36, 0.17 - 0.3 * ease(ramp(t, 0, 40)), -1).normalize();
    st.sky.position.copy(cam.position);
    if (H.scene.fog) mix3('fog', sk, H.scene.fog.color);
    if (st.sun) { mix3('key', sk, st.sun.color); st.sun.intensity = mixS('keyI', sk); }
    if (st.hemi) { mix3('hemiA', sk, st.hemi.color); mix3('hemiB', sk, st.hemi.groundColor); st.hemi.intensity = mixS('hemiI', sk); }
    rimU.value.set(mixN('rim', sk, 0), mixN('rim', sk, 1), mixN('rim', sk, 2));
    st.grassU.uTime.value = t; st.grassU.uSoft.value = soft; st.grassU.uLight.value.set(mixN('grass', sk, 0), mixN('grass', sk, 1), mixN('grass', sk, 2));
    for (var kind = 0; kind < 2; kind++) for (i = 0; i < st.drift[kind].length; i++) {
      var d = drifterAt(i, kind, t), sp = st.drift[kind][i];
      sp.position.set(d.x, H.TOP_Y + d.y, d.z); sp.material.rotation = d.spin; sp.material.opacity = d.alpha * (0.9 - 0.25 * sk.night);
    }
    var hs = f.seed;
    st.hero.visible = hs.alpha > 0.01; st.hero.position.set(hs.x, H.TOP_Y + hs.y, hs.z);
    st.hero.material.opacity = hs.alpha; st.hero.material.rotation = 0.35 * Math.sin(t * 1.7);
    st.heroGlow.visible = st.hero.visible; st.heroGlow.position.copy(st.hero.position); st.heroGlow.material.opacity = hs.alpha * 0.4;
    var c = f.chime;
    st.chime.hang.rotation.z = c.swing; st.chime.hang.rotation.x = c.swing * 0.5; st.chime.strip.rotation.y = c.spin; st.chime.strip.rotation.x = c.swing * 1.6;
    st.chime.glint.material.opacity = 0.15 + 0.55 * c.ring;
    if (++st.tick % 20 === 1) paint();
  }
  function buildStage() {
    var kit = stageKit();
    if (st || !H || !T || !kit) return !!st;
    var g = new T.Group(), far = new T.Group(), i, j;
    g.visible = far.visible = false; H.island.add(g); H.scene.add(far);
    st = { g: g, far: far, cats: [], lanterns: [], flies: [], hearts: [], zs: [], sparks: [], flowers: null, v: new T.Vector3(), kinds: '', tick: 0 };
    buildPainterly(g);
    // Lanterns: the same paper-lantern shape and colours as the ones the player releases.
    var bodyGeo = new T.CylinderGeometry(0.17, 0.12, 0.34, 8, 1), capGeo = new T.CylinderGeometry(0.09, 0.17, 0.05, 8, 1);
    for (i = 0; i < LANTERN.length; i++) {
      var lg = new T.Group(), bm = new T.MeshBasicMaterial({ color: 0xffc58c, transparent: true }), cm = new T.MeshBasicMaterial({ color: 0xd9846f, transparent: true });
      part(bodyGeo, bm, lg); part(capGeo, cm, lg, 0, 0.2, 0);
      var glow = sprite(H.glowTex, 0xffb870, true); glow.scale.set(1.7, 1.7, 1); lg.add(glow);
      g.add(lg); st.lanterns.push({ g: lg, mats: [bm, cm], glow: glow });
    }
    st.light = new T.PointLight(0xffc890, 0, 9, 1.6); st.light.position.set(PILE.x, H.TOP_Y + 1.7, PILE.z + 0.5); g.add(st.light);
    // Extra stars on a far dome; fixed pseudo-random layout so every seek shows the same sky.
    var seed = 7, pos = [];
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (j = 0; j < 2; j++) {
      pos = [];
      for (i = 0; i < 130; i++) {
        var az = rnd() * TAU, el = 0.12 + rnd() * 1.2, R = 95;
        pos.push(Math.cos(az) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(az) * Math.cos(el) * R);
      }
      var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      var sm = new T.PointsMaterial({ map: H.glowTex, color: j ? 0xfff0d0 : 0xdfe8ff, size: (j ? 5 : 7) * Math.min(root.devicePixelRatio || 1, 2), sizeAttenuation: false,
        transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false });
      var pts = new T.Points(sg, sm); pts.frustumCulled = false; far.add(pts); st['stars' + j] = sm;
    }
    // Cat teaser: a wand, a thread and a feathered pom in the yarn's pinks.
    var te = new T.Group(), pink = new T.MeshLambertMaterial({ color: 0xff9db8, emissive: 0x301018 }), cream = new T.MeshBasicMaterial({ color: 0xffe9c8 });
    var pom = part(new T.IcosahedronGeometry(0.1, 1), pink, te);
    var fgeo = new T.ConeGeometry(0.045, 0.24, 5);
    for (i = 0; i < 3; i++) { var f = part(fgeo, i === 1 ? cream : new T.MeshLambertMaterial({ color: i ? 0xa8ecff : 0xffd3e0, emissive: 0x202030 }), te, (i - 1) * 0.07, -0.14, 0); f.rotation.z = Math.PI + (i - 1) * 0.45; }
    var thread = part(new T.CylinderGeometry(0.006, 0.006, 0.7, 4), cream, te, 0, 0.4, 0);
    var wand = part(new T.CylinderGeometry(0.018, 0.024, 1.7, 6), new T.MeshLambertMaterial({ color: 0xc9a27a, emissive: 0x20140c }), te, 0.5, 1.42, 0.35);
    wand.rotation.set(0.42, 0, -0.62);
    var tg = sprite(H.glowTex, 0xffd3e0, true); tg.scale.set(0.8, 0.8, 1); te.add(tg);
    st.teaser = te; st.teaserGlow = tg; st.teaserParts = [pom, thread, wand]; g.add(te);
    // Three chapter-one style butterflies: flat pastel wings hinged at the body.
    var wingGeo = new T.PlaneGeometry(0.2, 0.17); wingGeo.translate(0.1, 0, 0); wingGeo.rotateX(-Math.PI / 2);
    var bGeo = new T.CylinderGeometry(0.012, 0.012, 0.15, 4); bGeo.rotateX(Math.PI / 2);
    var cols = [0xffb3d1, 0xa8d8ff, 0xfff0a0];
    for (i = 0; i < 3; i++) {
      var bg = new T.Group(), wm = new T.MeshBasicMaterial({ color: cols[i], transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false });
      var wl = new T.Group(), wr = new T.Group();
      wl.add(new T.Mesh(wingGeo, wm)); wl.scale.x = -1; wr.add(new T.Mesh(wingGeo, wm));
      bg.add(wl); bg.add(wr); part(bGeo, new T.MeshBasicMaterial({ color: 0x4a3a5a }), bg);
      var gl = sprite(H.glowTex, cols[i], true); gl.scale.set(0.55, 0.55, 1); bg.add(gl);
      bg.scale.set(1.5, 1.5, 1.5); g.add(bg); st.flies.push({ g: bg, wl: wl, wr: wr, mat: wm, glow: gl });
    }
    var tex = kit.textures ? kit.textures() : {};
    for (i = 0; i < 6; i++) { var hs = sprite(tex.heart || H.glowTex, 0xffffff, false); g.add(hs); st.hearts.push(hs); }
    for (i = 0; i < 4; i++) { var zs = sprite(tex.z || H.glowTex, 0xffffff, false); g.add(zs); st.zs.push(zs); }
    for (i = 0; i < 7; i++) { var sp = sprite(H.glowTex, i % 2 ? 0xffc8ec : 0xfff2b0, true); g.add(sp); st.sparks.push(sp); }
    return true;
  }
  // The cast follows the player's own book; rebuilt only when that set of coats changes.
  function buildCast() {
    var kit = stageKit(), i, key;
    castKinds();
    key = CAST.map(function (c) { return c.kind; }).join(',');
    if (st.kinds === key) return;
    for (i = 0; i < st.cats.length; i++) { st.cats[i].dead = true; st.g.remove(st.cats[i].root); }
    st.cats = []; st.kinds = key;
    for (i = 0; i < CAST.length; i++) {
      var k = kit.build(kit.kind(CAST[i].kind));
      k.kind = kit.kind(CAST[i].kind); k.cutscene = true; k.dead = false; k.size = CAST[i].size; k.phase = CAST[i].phase;
      k.state = 'hide'; k.crouch = 0; k.curl = 0; k.moving = false; k.root.l2cat = true;
      k.ears = k.head.children.filter(function (o) { return o.geometry && o.geometry.type === 'ConeGeometry'; });
      if (k.halo) { k.halo.material = k.halo.material.clone(); k.halo.material.opacity = 0.2; }
      st.g.add(k.root); st.cats.push(k);
      if (root.GardenCatModels && root.GardenCatModels.attachStage) root.GardenCatModels.attachStage(k);
    }
  }
  // A few blossoms around the pile when the island has almost none (standalone preview).
  function buildFlowers() {
    if (st.flowers || (H.flowers && H.flowers.length >= 8)) return;
    var fg = new T.Group(), stem = new T.CylinderGeometry(0.014, 0.02, 1, 5), petal = new T.SphereGeometry(0.09, 6, 4), core = new T.SphereGeometry(0.05, 6, 4);
    stem.translate(0, 0.5, 0);
    var green = new T.MeshLambertMaterial({ color: 0x6fae6a, emissive: 0x0c1a0c }), gold = new T.MeshBasicMaterial({ color: 0xffe9a8 });
    var cols = [0xffb3c8, 0xc8b6ff, 0xa8e0ff, 0xffd9a0, 0xffc0e8];
    for (var i = 0; i < 11; i++) {
      var a = 2.7 + i * 3.9 / 10, r = 1.9 + 0.45 * Math.sin(i * 2.7), // behind and beside the pile, never in front of it
        f = new T.Group(), h = 0.4 + 0.2 * Math.abs(Math.sin(i * 1.3));
      var pm = new T.MeshLambertMaterial({ color: cols[i % 5], emissive: new T.Color(cols[i % 5]).multiplyScalar(0.25) });
      part(stem, green, f).scale.set(1, h, 1);
      var head = new T.Group(); head.position.y = h; f.add(head);
      for (var p = 0; p < 5; p++) { var pe = part(petal, pm, head, Math.cos(p * TAU / 5) * 0.1, 0, Math.sin(p * TAU / 5) * 0.1); pe.scale.set(1.1, 0.32, 0.6); pe.rotation.set(0, -p * TAU / 5, 0.38); }
      part(core, gold, head);
      var gl = sprite(H.glowTex, cols[i % 5], true); gl.material.opacity = 0.5; gl.scale.set(1, 1, 1); head.add(gl);
      f.position.set(PILE.x + Math.cos(a) * r, H.TOP_Y, PILE.z + Math.sin(a) * r); f.scale.set(1.1, 1.1, 1.1);
      fg.add(f);
    }
    st.g.add(fg); st.flowers = fg;
  }
  function enterStage() {
    if (staged || !buildStage()) return;
    var kit = stageKit(), list = kit.kittens(), i;
    buildCast(); buildFlowers();
    kept = { group: kit.group().visible, cats: [], flies: [], sky: sky ? sky.visible : false,
      sun: st.sun ? st.sun.color.getHex() : 0, hemi: st.hemi ? [st.hemi.color.getHex(), st.hemi.groundColor.getHex()] : null };
    if (sky) sky.visible = false;
    st.sky.visible = true; st.tick = 0; paint();
    for (i = 0; i < list.length; i++) { kept.cats.push([list[i].root, list[i].root.visible]); list[i].root.visible = false; }
    kit.group().visible = true; // the flower bushes live in the level-2 group
    st.g.visible = st.far.visible = true;
    if (doc.body) doc.body.classList.add('l2cs-on');
    staged = true;
  }
  function exitStage() {
    if (!staged) return;
    var kit = stageKit(), bushes = kit.group().children, i;
    for (i = 0; i < kept.cats.length; i++) kept.cats[i][0].visible = kept.cats[i][1];
    for (i = 0; i < kept.flies.length; i++) kept.flies[i].visible = true;
    for (i = 0; i < BUSH.length && i < bushes.length; i++) bushes[i].rotation.z = 0;
    kit.group().visible = kit.level() === 2 ? true : kept.group;
    st.g.visible = st.far.visible = false; st.light.intensity = 0;
    unpaint(); st.sky.visible = false;
    if (sky) sky.visible = kept.sky;
    if (st.sun) st.sun.color.setHex(kept.sun);
    if (st.hemi) { st.hemi.color.setHex(kept.hemi[0]); st.hemi.groundColor.setHex(kept.hemi[1]); }
    if (doc.body) doc.body.classList.remove('l2cs-on');
    staged = false; kept = null;
  }
  // Same derived pose as kittens.js updateOne, driven by the model instead of a state machine.
  function poseCat(k, m, t) {
    var c = m.curl, wob = t * 9 + k.phase, stride = m.moving ? 1 : 0, breathe = Math.sin(t * (1.5 - c * 0.6) + k.phase), i;
    var sc = k.size * Math.max(0.01, m.fade);
    k.state = m.state; k.crouch = m.crouch; k.curl = c; k.moving = m.moving;
    k.root.visible = m.fade > 0.01;
    k.root.position.set(m.x, H.TOP_Y + m.y, m.z);
    k.root.rotation.set(0, m.yaw, m.roll);
    k.root.scale.set(sc, sc, sc);
    if (root.GardenCatModels && root.GardenCatModels.pose(k, t)) {
      // The Blender cats are one seated mesh: settle into a low loaf and lean on a neighbour.
      k.root.scale.set(sc * (1 + c * 0.05), sc * (1 - c * 0.2 - m.crouch * 0.18), sc * (1 + c * 0.05));
      // One seated mesh: the ear flick reads as a quick head shiver, the tail sway as a slow lean.
      k.catVisual.rotation.z = c * 0.16 * (k.phase % 2 > 1 ? 1 : -1) + m.bat * 0.07 * Math.sin(t * 5 + k.phase) + m.tail * 0.035 * soft;
      k.catVisual.rotation.x = -m.bat * 0.16 - m.chase * 0.2;
      k.catVisual.rotation.y = m.ear * 0.07 * soft * Math.sin(t * 38);
    } else {
      k.inner.scale.y = 1 - m.crouch * 0.28 - c * 0.3 + breathe * 0.012;
      k.inner.rotation.z = c * 0.22;
      k.body.position.y = 0.24 - c * 0.11 + stride * Math.abs(Math.sin(wob)) * 0.022;
      for (i = 0; i < 4; i++) {
        k.legs[i].rotation.x = stride * Math.sin(wob + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.65;
        k.legs[i].scale.y = 1 - c * 0.8;
      }
      if (m.bat > 0) k.legs[0].rotation.x = -m.bat * (1.1 + 0.3 * Math.sin(t * 5 + k.phase));
      k.head.position.set(c * 0.17, 0.2 - c * 0.2 - m.crouch * 0.09, 0.25 - c * 0.03);
      k.head.rotation.set(c * 0.45 - m.bat * 0.35, c + (1 - c) * Math.sin(t * 0.7 + k.phase) * 0.25, c * 0.3);
      k.tail.rotation.x = -0.75 - c * 0.85;
      k.tail.rotation.z = c * 0.9 + (1 - c) * Math.sin(t * (m.state === 'play' ? 4 : 2.4) + k.phase) * 0.4 + m.tail * 0.25;
      for (i = 0; i < k.ears.length; i++) k.ears[i].rotation.z = (i ? -1 : 1) * m.ear * 0.5 * Math.abs(Math.sin(t * 22));
      var ey = c > 0.5 ? 0.14 : ((t + k.phase) % 4.2 < 0.12 ? 0.2 : 1);
      k.eyes[0].scale.set(1, ey, 0.6); k.eyes[1].scale.set(1, ey, 0.6);
    }
    if (k.halo) { var hs = 1.5 + Math.sin(t * 2 + k.phase) * 0.2; k.halo.scale.set(hs, hs, hs); }
  }
  function drift(list, t, from, to, period, life, rise, size, cats, pick) {
    for (var j = 0; j < list.length; j++) {
      var s = list[j], local = t - from - j * period / list.length, u = (local - Math.floor(local / period) * period) / life;
      var on = local > 0 && t < to && u < 1, m = cats[pick(j)];
      s.visible = on;
      if (!on) continue;
      s.position.set(m.x + 0.22 * Math.sin(j * 2.3 + u * 2), H.TOP_Y + 0.75 + m.y + u * rise, m.z + 0.12 * Math.cos(j * 1.7));
      s.material.opacity = Math.sin(Math.PI * u) * 0.9;
      s.scale.set(size * (0.7 + 0.5 * u), size * (0.7 + 0.5 * u), 1);
    }
  }
  function applyStage(t) {
    var f = frame(t), cats = f.cats, i, kit = stageKit();
    if (H.setNightTarget) H.setNightTarget(f.night);
    // The catchable butterflies keep their own state; they are only kept out of the picture.
    var wild = root.__bf && root.__bf.butterflies ? root.__bf.butterflies : [];
    for (i = 0; i < wild.length; i++) if (wild[i].g && wild[i].g.visible) { wild[i].g.visible = false; kept.flies.push(wild[i].g); }
    for (i = 0; i < st.cats.length; i++) poseCat(st.cats[i], cats[i], t);
    var bushes = kit.group().children;
    for (i = 0; i < BUSH.length && i < bushes.length; i++) bushes[i].rotation.z = 0;
    for (i = 0; i < BUSH.length && i < bushes.length; i++) bushes[i].rotation.z = -0.05 * soft * windAt(BUSH[i][0], BUSH[i][1], t);
    for (i = 0; i < CAST.length; i++) if (bushes[CAST[i].bush]) bushes[CAST[i].bush].rotation.z += cats[i].rustle * 0.07 * soft * Math.sin(t * 13 + i);
    var lit = 0;
    for (i = 0; i < st.lanterns.length; i++) {
      var L = st.lanterns[i], v = f.lanterns[i], at = LANTERN[i];
      lit += v / st.lanterns.length;
      L.g.visible = v > 0.01;
      L.g.position.set(at[0] + 0.08 * Math.sin(t * 0.4 + i), H.TOP_Y + at[1] - (1 - v) * 0.9 + 0.07 * Math.sin(t * 0.7 + i * 2), at[2]);
      L.g.scale.set(0.3 + 0.7 * v, 0.3 + 0.7 * v, 0.3 + 0.7 * v);
      L.mats[0].opacity = L.mats[1].opacity = 0.95 * v;
      L.glow.material.opacity = v * (0.72 + 0.13 * Math.sin(t * 1.7 + i * 1.3));
    }
    st.light.intensity = 0.85 * lit;
    st.stars0.opacity = f.stars * (0.6 + 0.25 * Math.sin(t * 1.1)); st.stars1.opacity = f.stars * (0.6 + 0.25 * Math.sin(t * 0.8 + 2));
    var te = teaserAt(t);
    st.teaser.visible = te.alpha > 0.01;
    st.teaser.position.set(te.x, H.TOP_Y + te.y, te.z); st.teaser.rotation.z = te.sway * 0.5;
    st.teaserGlow.material.opacity = te.alpha * 0.5;
    for (i = 0; i < st.flies.length; i++) {
      var b = butterflyAt(i, t), fl = st.flies[i];
      fl.g.visible = b.alpha > 0.01;
      fl.g.position.set(b.x, H.TOP_Y + b.y, b.z); fl.g.rotation.y = b.yaw;
      fl.wr.rotation.z = 0.25 + b.flap * 0.75; fl.wl.rotation.z = -fl.wr.rotation.z;
      fl.mat.opacity = b.alpha * 0.95; fl.glow.material.opacity = b.alpha * 0.4;
    }
    drift(st.hearts, t, 24, 37.2, 2.8, 1.7, 0.7, 0.2, cats, function (j) { return (j * 3) % CAST.length; });
    drift(st.zs, t, 47.5, 99, 3.4, 2.4, 0.6, 0.2, cats, function (j) { return (j * 2 + 1) % CAST.length; });
    var glowCat = CAST.length - 1;
    for (i = 0; i < st.sparks.length; i++) {
      var sp = st.sparks[i], u = (t * 0.8 + i / st.sparks.length) % 1, past = catAt(glowCat, t - u * 0.9);
      sp.position.set(past.x + 0.28 * Math.sin(i * 2.1), H.TOP_Y + 0.25 + u * 0.75, past.z + 0.28 * Math.cos(i * 1.7));
      sp.material.opacity = Math.sin(Math.PI * u) * 0.85 * past.fade;
      sp.scale.set(0.16, 0.16, 1);
    }
    if (st.flowers) for (i = 0; i < st.flowers.children.length; i++) { var fw = st.flowers.children[i]; fw.rotation.z = -(0.06 + 0.2 * soft * windAt(fw.position.x, fw.position.z, t)); }
    // Camera: overrides the gameplay orbit for this frame only; the game takes it back when we stop.
    var c = f.camera, cam = H.camera, halfH = Math.tan(cam.fov * Math.PI / 360), halfW = halfH * cam.aspect;
    var r = Math.max(c.w / halfW, c.w * 0.9 / halfH), v3 = st.v;
    v3.set(c.x, H.TOP_Y + c.y + c.lift * r * halfH, c.z); H.island.localToWorld(v3);
    cam.position.set(v3.x + r * Math.sin(c.phi) * Math.cos(c.th), v3.y + r * Math.cos(c.phi), v3.z + r * Math.sin(c.phi) * Math.sin(c.th));
    cam.lookAt(v3);
    applyLook(f, t);
  }
  function stageTick() {
    var t = time(), open = state === 'playing' || state === 'paused' || state === 'ended';
    if (!open) { exitStage(); return; }
    enterStage();
    if (staged) applyStage(t);
  }
  // Chain onto gameplay.js the way kittens.js does: the hooks arrive once, then one call per frame.
  var GP = root.GardenPlay;
  if (GP && doc) {
    var gpInit = GP.init, gpUpdate = GP.update;
    GP.init = function (hooks) { gpInit.apply(GP, arguments); H = hooks; T = hooks.THREE; };
    GP.update = function () { gpUpdate.apply(GP, arguments); if (H) stageTick(); };
  }
  try { if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) soft = 0.3; } catch (e) { soft = 1; }

  /* ------------------------------- DOM ------------------------------- */
  var CSS = [
    '#l2cs{position:fixed;top:0;left:0;right:0;bottom:0;z-index:60;overflow:hidden;color:#fff;touch-action:none;',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '#l2cs.hidden{display:none}',
    // The veil tints the live island instead of hiding it.
    '#l2csVeil{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;',
    'background:linear-gradient(180deg,#2a3a78 0%,#5a5a9a 50%,#b98aa0 82%,#f0c8a0 100%)}',
    // Paper grain and a bleached, slightly uneven edge: the frame reads as gouache on cold-pressed paper.
    // Both sit beside #l2cs (not inside it) so their blend modes reach the game canvas underneath.
    '#l2csPaper{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;opacity:.8;mix-blend-mode:multiply;background-size:240px 240px}',
    '#l2csEdge{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;mix-blend-mode:soft-light;',
    'background:radial-gradient(ellipse at 50% 46%,rgba(255,246,224,0) 52%,rgba(255,240,208,.55) 100%);box-shadow:inset 0 0 70px rgba(255,238,205,.5)}',
    '.l2cs-bar{position:absolute;left:0;right:0;height:7%;background:#221a2c;pointer-events:none}',
    '#l2csTop{top:0;transform-origin:50% 0}#l2csBottom{bottom:0;transform-origin:50% 100%}',
    '#l2csCaption{position:absolute;left:5%;right:5%;bottom:17%;text-align:center;font-size:15px;line-height:1.8;letter-spacing:1.5px;',
    'text-shadow:0 1px 10px rgba(40,24,80,.75);pointer-events:none}',
    '#l2csSkip{position:absolute;top:12px;top:calc(12px + env(safe-area-inset-top));right:12px;right:calc(12px + env(safe-area-inset-right));',
    'min-width:64px;min-height:44px;padding:0 16px;border-radius:22px;font:inherit;font-size:14px;letter-spacing:3px;color:#f2fff8;cursor:pointer;',
    'background:rgba(110,170,150,.24);border:1px solid rgba(214,255,238,.42);box-shadow:0 4px 18px rgba(30,20,60,.25);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#l2csSkip:active{background:rgba(140,205,182,.36)}',
    // Everything but the canvas and the cutscene steps aside, so the island reads as a film frame.
    'body.l2cs-on>:not(canvas):not(#l2cs):not(.l2cs-paint){visibility:hidden!important}',
    '.l2cs-paint.hidden{display:none}',
    // Title sits in the sky above the sleep pile; the continue control sits below it.
    '#l2csEnd{position:absolute;left:0;right:0;top:19%;text-align:center;pointer-events:none}',
    '#l2csTitle{font-family:"Songti SC","Noto Serif CJK SC","Source Han Serif SC",STSong,serif;font-size:30px;font-weight:500;letter-spacing:9px;text-indent:9px;',
    'text-shadow:0 0 22px rgba(255,236,190,.7),0 2px 10px rgba(40,24,80,.6)}',
    '#l2csRule{width:132px;height:1px;margin:16px auto 0;background:linear-gradient(90deg,transparent,rgba(255,240,205,.85),transparent)}',
    '#l2csSub{margin-top:14px;font-size:16px;letter-spacing:14px;text-indent:14px;opacity:.9;text-shadow:0 1px 10px rgba(40,24,80,.7)}',
    '#l2csBook{position:absolute;left:50%;bottom:10%;width:86%;max-width:336px;margin:0;padding:12px 12px 10px;transform:translateX(-50%);border-radius:20px;pointer-events:none;',
    'background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.34);box-shadow:0 8px 30px rgba(30,20,60,.3);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}',
    '#l2csBook h3{margin:0 0 8px;font-size:14px;font-weight:500;letter-spacing:6px;text-indent:6px;text-align:center}',
    '#l2csCards{display:flex;flex-wrap:wrap;justify-content:center}',
    '.l2cs-card{position:relative;width:31%;margin:1%;padding:6px 0 5px;border-radius:12px;text-align:center;font-size:11px;letter-spacing:1px;background:rgba(40,28,80,.26)}',
    '.l2cs-card i{position:absolute;top:0;left:0;right:0;bottom:0;border-radius:12px;background:rgba(255,244,214,.3);box-shadow:0 0 14px rgba(255,236,190,.75)}',
    '.l2cs-card.rare i{background:rgba(255,232,150,.36);box-shadow:0 0 0 1px rgba(255,220,130,.95),0 0 18px rgba(255,226,140,.9)}',
    '.l2cs-card span{position:relative;display:block;width:60px;height:45px;margin:0 auto 2px}',
    '.l2cs-card img{position:absolute;top:0;left:0;width:60px;height:45px}',
    '.l2cs-card b{position:relative;font-weight:400}',
    '#l2cs.book #l2csCaption{bottom:auto;top:11%}',
    '#l2csGo{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);min-width:168px;min-height:44px;padding:0 26px;border-radius:24px;font:inherit;font-size:15px;letter-spacing:5px;color:#f2fff8;',
    'cursor:pointer;pointer-events:auto;background:rgba(110,170,150,.24);border:1px solid rgba(214,255,238,.42);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:l2csPulse 2.4s ease-in-out infinite}',
    '#l2csGo.hidden,#l2csSkip.hidden{display:none}',
    '@keyframes l2csPulse{0%,100%{opacity:.62}50%{opacity:1}}',
    '#l2csClock{position:absolute;left:12px;left:calc(12px + env(safe-area-inset-left));bottom:10px;bottom:calc(10px + env(safe-area-inset-bottom));',
    'font-size:11px;letter-spacing:1px;opacity:.55;pointer-events:none;font-variant-numeric:tabular-nums}',
    '#l2csClock.hidden{display:none}',
    '@media (orientation:landscape) and (max-height:480px){#l2csCaption{bottom:13%;font-size:14px}#l2csTitle{font-size:24px}',
    '#l2csEnd{top:13%}#l2csRule{margin-top:8px}#l2csSub{margin-top:8px;font-size:14px}#l2csGo{bottom:11%;left:auto;right:5%;transform:none}.l2cs-bar{height:9%}',
    '#l2csBook{max-width:560px;width:70%;bottom:11%;padding:8px 10px 6px}#l2csBook h3{display:none}.l2cs-card{width:14.6%}}',
    '@media (prefers-reduced-motion:reduce){#l2csGo{animation:none}}'
  ].join('');

  // Procedural paper: speckle, a few fibres and soft brush streaks; drawn once, tiled by CSS.
  function paperTexture() {
    try {
      var c = doc.createElement('canvas'), S = 240, g, i, seed = 5;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      c.width = c.height = S; g = c.getContext('2d');
      g.fillStyle = '#f6efe2'; g.fillRect(0, 0, S, S);
      for (i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '120,96,70,' : '255,255,255,') + (0.05 + 0.1 * rnd()).toFixed(3) + ')'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
      for (i = 0; i < 26; i++) {
        var x = rnd() * S, y = rnd() * S, a = rnd() * 6.283, l = 8 + rnd() * 22;
        g.strokeStyle = 'rgba(140,112,84,' + (0.06 + 0.08 * rnd()).toFixed(3) + ')'; g.lineWidth = 0.6 + rnd() * 0.5;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5 - 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      for (i = 0; i < 9; i++) { g.fillStyle = 'rgba(150,120,96,' + (0.01 + 0.014 * rnd()).toFixed(3) + ')'; g.fillRect(0, rnd() * S, S, 5 + rnd() * 16); }
      el.Paper.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { el.Paper.style.display = 'none'; }
  }
  function stop(e) { if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }
  function build() {
    if (el || !doc || !doc.body) return;
    var style = doc.createElement('style'); style.id = 'l2csStyle'; style.textContent = CSS;
    doc.head.appendChild(style);
    var box = doc.createElement('div'); box.id = 'l2cs'; box.className = 'hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', TITLE);
    box.innerHTML = '<div id="l2csVeil"></div>' +
      '<div id="l2csTop" class="l2cs-bar"></div><div id="l2csBottom" class="l2cs-bar"></div>' +
      '<div id="l2csCaption"></div>' +
      '<div id="l2csEnd"><div id="l2csTitle">' + TITLE + '</div><div id="l2csRule"></div><div id="l2csSub">' + SUBTITLE + '</div></div>' +
      '<div id="l2csBook"><h3>小猫图鉴</h3><div id="l2csCards"></div></div>' +
      '<button id="l2csGo" class="hidden" type="button">' + CONTINUE + '</button>' +
      '<button id="l2csSkip" type="button" aria-label="跳过过场动画">' + SKIP + '</button>' +
      '<div id="l2csClock"></div>';
    doc.body.appendChild(box);
    el = { box: box };
    var paint = ['Edge', 'Paper'];
    for (var p = 0; p < paint.length; p++) { var layer = doc.createElement('div'); layer.id = 'l2cs' + paint[p]; layer.className = 'l2cs-paint hidden'; doc.body.insertBefore(layer, box); el[paint[p]] = layer; }
    var ids = ['Veil', 'Top', 'Bottom', 'Caption', 'End', 'Book', 'Cards', 'Go', 'Skip', 'Clock'];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = doc.getElementById('l2cs' + ids[i]);
    paperTexture();
    showClock = query('csclock') === '1';
    if (!showClock) el.Clock.className = 'hidden';
    // The box is an input shield: nothing underneath is tappable while the cutscene is up.
    var kinds = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'wheel'];
    for (i = 0; i < kinds.length; i++) box.addEventListener(kinds[i], function (e) { e.stopPropagation(); });
    box.addEventListener('click', function (e) { stop(e); proceed(); });
    el.Skip.addEventListener('click', function (e) { stop(e); skip(); });
    el.Go.addEventListener('click', function (e) { stop(e); proceed(); });
    ready = true;
  }
  // Book cards mirror the real codex: a kind lights only if the player has hugged it (all six on an empty preview save).
  var cards = null;
  function buildCards() {
    var kit = stageKit(), kinds = kit ? kit.kinds : [], caught = kit ? kit.caught() : {}, any = false, html = '', i;
    for (i in caught) if (caught[i] > 0) any = true;
    cards = [];
    for (i = 0; i < kinds.length; i++) {
      var kd = kinds[i], got = !any || caught[kd.id] > 0, icon = kit.icon(kd.id);
      html += '<div class="l2cs-card' + (kd.rare ? ' rare' : '') + '"><i></i><span><img alt="" src="' + icon.off + '"><img alt="" src="' + icon.on + '"></span><b>' + (got ? kd.name : '？？？') + '</b></div>';
      cards.push(got);
    }
    el.Cards.innerHTML = html;
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function render() {
    var t = time();
    if (!el) return;
    var open = state === 'playing' || state === 'paused' || state === 'ended';
    el.box.className = open ? '' : 'hidden';
    el.Paper.className = el.Edge.className = open ? 'l2cs-paint' : 'l2cs-paint hidden';
    if (!open) return;
    var f = frame(t);
    el.Veil.style.opacity = f.dusk.toFixed(3);
    el.Top.style.transform = el.Bottom.style.transform = 'scaleY(' + f.bars.toFixed(3) + ')';
    if (el.Caption.textContent !== f.caption) el.Caption.textContent = f.caption;
    el.Caption.style.opacity = f.captionAlpha.toFixed(3);
    el.End.style.opacity = f.title.toFixed(3);
    el.End.style.transform = 'translateY(' + ((1 - f.title) * 10).toFixed(1) + 'px)';
    el.box.className = f.book > 0.01 ? 'book' : '';
    el.Book.style.opacity = f.book.toFixed(3);
    el.Book.style.marginBottom = ((f.book - 1) * 22).toFixed(1) + 'px';
    if (f.book > 0 && cards) for (var c = 0; c < cards.length; c++) {
      var cell = el.Cards.children[c], lit = cards[c] ? f.cards[c] : 0;
      cell.firstChild.style.opacity = (lit * (0.55 + 0.45 * (1 - ramp(t, CARD_AT + 0.8 + c * CARD_STEP, CARD_AT + 2.6 + c * CARD_STEP)))).toFixed(3);
      cell.children[1].lastChild.style.opacity = lit.toFixed(3);
    }
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
  function play(o) {
    opts = o || {};
    if (opts.muted !== undefined) muted = !!opts.muted;
    build();
    if (el && stageKit()) buildCards();
    base = clamp(+opts.from || 0, 0, DURATION); anchor = clock(); done = false; state = 'playing';
    run();
    return true;
  }
  function seek(t) {
    t = clamp(+t || 0, 0, DURATION);
    build();
    if (el && !cards && stageKit()) buildCards();
    var running = state === 'playing' || state === 'ended';
    base = t; anchor = clock();
    if (t >= DURATION) reach();
    else state = running ? 'playing' : 'paused'; // seeking a closed cutscene shows a still frame
    run();
    return t;
  }
  function skip() {
    if (state !== 'playing' && state !== 'paused') return false;
    reach();
    render();
    return true;
  }
  function pause() { if (state !== 'playing') return false; base = time(); if (state === 'playing') state = 'paused'; render(); return true; }
  function resume() { if (state !== 'paused') return false; anchor = clock(); state = 'playing'; run(); return true; }
  function close() {
    if (state === 'idle' || state === 'closed') return false;
    state = 'closed'; opts = {};
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
    // True while the stage owns the island: kittens.js freezes its own cats for that time.
    staged: function () { return staged; },
    stage: function () {
      return { staged: staged, cast: CAST.map(function (c) { return c.kind; }), blender: st ? st.cats.filter(function (k) { return !!k.catVisual; }).length : 0,
        actors: st ? st.cats.filter(function (k) { return k.root.visible; }).length : 0, reduced: soft < 1,
        toon: painted.length, outlines: hulls.length,
        // What is actually on the three.js objects right now (tests compare this across seeks).
        shot: st && staged ? {
          camera: H.camera.position.toArray().map(function (v) { return +v.toFixed(3); }),
          cats: st.cats.map(function (k) { return [+k.root.position.x.toFixed(3), +k.root.position.z.toFixed(3), +k.root.rotation.y.toFixed(3), +k.curl.toFixed(3)]; }),
          lanterns: st.lanterns.filter(function (l) { return l.g.visible; }).length, teaser: st.teaser.visible,
          flies: st.flies.filter(function (b) { return b.g.visible; }).length, zs: st.zs.filter(function (z) { return z.visible; }).length,
          hearts: st.hearts.filter(function (h) { return h.visible; }).length, hero: st.hero.visible,
          look: [st.sky.visible, +st.skyU.uNight.value.toFixed(3), +st.grassU.uTime.value.toFixed(3), st.blades > 500, st.blooms > 20, st.drift[0].length + st.drift[1].length, st.chime.g.visible], halo: st.cats.filter(function (k) { return k.halo && k.root.visible; }).length
        } : null };
    },
    pause: pause, resume: resume, close: close, proceed: proceed,
    state: function () { time(); return state; },
    beat: function () { return beatAt(time()).id; },
    beats: function () { return BEATS.map(function (b) { return { id: b.id, t0: b.t0, t1: b.t1, caption: b.caption }; }); },
    frame: function (t) { return frame(t === undefined ? time() : clamp(+t || 0, 0, DURATION)); },
    text: function () { return { title: TITLE, subtitle: SUBTITLE, cont: CONTINUE, skip: SKIP }; },
    muted: function () { return muted; },
    // Feature flag for the in-game hook; session-only, never saved. Off unless ?l2cutscene=1.
    enabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; return enabled; },
    _setClock: function (fn) { clock = fn; }
  };
  root.__l2Cutscene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  enabled = query('l2cutscene') === '1';
  muted = query('mute') === '1';
  if (!doc) return;
  function boot() {
    build();
    if (query('cutscene') !== '1') return;
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
