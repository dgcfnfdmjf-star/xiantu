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
    { id: 'settle', t0: 0, t1: 8, caption: '暮色沉了下来，灯笼一盏盏亮起' },
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
      dusk: 0.05 + 0.1 * ease(ramp(t, 0, 8)) + 0.07 * ease(ramp(t, 38, 54)),
      night: 0.45 + 0.3 * ease(ramp(t, 0, 8)) + 0.15 * ease(ramp(t, 38, 54)),
      stars: ease(ramp(t, 3, 12)),
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
    return { x: PILE.x + Math.cos(a) * r, z: PILE.z + Math.sin(a) * r, a: a };
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
    var curl = ease(ramp(t, 45.6 + 0.25 * i, 48.4 + 0.2 * i));
    return {
      kind: c.kind, x: p.x, z: p.z, yaw: yaw, roll: roll * TAU,
      y: env * 0.15 * soft * hop * hop * hop + roll * (1 - roll) * 0.8,
      fade: ease(ramp(t, c.enter - 1.4, c.enter - 0.4)), crouch: 1 - ease(ramp(t, c.enter - 0.2, c.enter + 0.7)),
      curl: curl, moving: speed > 0.12, bat: env * Math.max(0, Math.sin(t * 1.9 + i * 2.6)),
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
  var CAM = [
    { t: 0, x: 0, y: 0.5, z: 0.2, th: 1.571, phi: 1.12, w: 5.7, lift: 0 },
    { t: 8, x: -0.3, y: 0.6, z: 0.8, th: 1.75, phi: 1.2, w: 5.0, lift: 0 },
    { t: 13, x: -0.9, y: 0.4, z: 1.9, th: 1.86, phi: 1.34, w: 2.9, lift: 0.05 },
    { t: 18, x: 0.9, y: 0.4, z: 1.5, th: 1.3, phi: 1.34, w: 2.7, lift: 0.05 },
    // Around the pile the azimuth stays inside 0.9-1.5: a bush stands in front of it at ~2.0.
    { t: 22.5, x: PILE.x, y: 0.5, z: PILE.z, th: 0.95, phi: 1.28, w: 2.25, lift: 0.05 },
    { t: 31, x: PILE.x, y: 0.5, z: PILE.z, th: 1.36, phi: 1.28, w: 2.25, lift: 0.05 },
    { t: 34, x: PILE.x - 0.1, y: 0.55, z: PILE.z, th: 1.42, phi: 1.3, w: 1.7, lift: 0.05 },
    { t: 38, x: PILE.x, y: 0.5, z: PILE.z, th: 1.5, phi: 1.28, w: 2.2, lift: 0 },
    { t: 44, x: PILE.x, y: 0.3, z: PILE.z, th: 1.38, phi: 1.1, w: 2.2, lift: -0.38 },
    { t: 50, x: PILE.x, y: 0.3, z: PILE.z, th: 1.3, phi: 1.08, w: 2.1, lift: -0.2 },
    { t: 60, x: PILE.x, y: 0.3, z: PILE.z, th: 1.22, phi: 1.22, w: 2.4, lift: 0.4 }
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
  function buildStage() {
    var kit = stageKit();
    if (st || !H || !T || !kit) return !!st;
    var g = new T.Group(), far = new T.Group(), i, j;
    g.visible = far.visible = false; H.island.add(g); H.scene.add(far);
    st = { g: g, far: far, cats: [], lanterns: [], flies: [], hearts: [], zs: [], sparks: [], flowers: null, v: new T.Vector3(), kinds: '' };
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
      for (i = 0; i < 90; i++) {
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
      k.state = 'hide'; k.crouch = 0; k.curl = 0; k.moving = false;
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
    kept = { group: kit.group().visible, cats: [], flies: [] };
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
      k.catVisual.rotation.z = c * 0.16 * (k.phase % 2 > 1 ? 1 : -1) + m.bat * 0.07 * Math.sin(t * 5 + k.phase);
      k.catVisual.rotation.x = -m.bat * 0.16;
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
      k.tail.rotation.z = c * 0.9 + (1 - c) * Math.sin(t * (m.state === 'play' ? 4 : 2.4) + k.phase) * 0.4;
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
    if (st.flowers) for (i = 0; i < st.flowers.children.length; i++) st.flowers.children[i].rotation.z = 0.06 * Math.sin(t * 1.1 + i);
    // Camera: overrides the gameplay orbit for this frame only; the game takes it back when we stop.
    var c = f.camera, cam = H.camera, halfH = Math.tan(cam.fov * Math.PI / 360), halfW = halfH * cam.aspect;
    var r = Math.max(c.w / halfW, c.w * 0.9 / halfH), v3 = st.v;
    v3.set(c.x, H.TOP_Y + c.y + c.lift * r * halfH, c.z); H.island.localToWorld(v3);
    cam.position.set(v3.x + r * Math.sin(c.phi) * Math.cos(c.th), v3.y + r * Math.cos(c.phi), v3.z + r * Math.sin(c.phi) * Math.sin(c.th));
    cam.lookAt(v3);
    if (!sky) for (i = 0; i < H.scene.children.length; i++) {
      var ch = H.scene.children[i];
      if (ch.isMesh && ch.geometry && ch.geometry.parameters && ch.geometry.parameters.radius === 120) sky = ch;
    }
    if (sky) sky.position.copy(cam.position);
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
    'background:linear-gradient(180deg,#241a4a 0%,#4a3478 46%,#8a5a8e 78%,#d99a8c 100%)}',
    '#l2csStars{position:absolute;top:0;left:0;right:0;height:58%;pointer-events:none;background-image:',
    'radial-gradient(1.6px 1.6px at 12% 18%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 31% 9%,#ffeec8 50%,transparent 51%),',
    'radial-gradient(1.8px 1.8px at 47% 27%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 63% 13%,#d8e6ff 50%,transparent 51%),',
    'radial-gradient(1.6px 1.6px at 78% 31%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 90% 8%,#ffeec8 50%,transparent 51%),',
    'radial-gradient(1.4px 1.4px at 22% 43%,#fff 50%,transparent 51%),radial-gradient(1.4px 1.4px at 70% 49%,#d8e6ff 50%,transparent 51%)}',
    '.l2cs-bar{position:absolute;left:0;right:0;height:7%;background:#120d26;pointer-events:none}',
    '#l2csTop{top:0;transform-origin:50% 0}#l2csBottom{bottom:0;transform-origin:50% 100%}',
    '#l2csCaption{position:absolute;left:5%;right:5%;bottom:17%;text-align:center;font-size:15px;line-height:1.8;letter-spacing:1.5px;',
    'text-shadow:0 1px 10px rgba(40,24,80,.75);pointer-events:none}',
    '#l2csSkip{position:absolute;top:12px;top:calc(12px + env(safe-area-inset-top));right:12px;right:calc(12px + env(safe-area-inset-right));',
    'min-width:64px;min-height:44px;padding:0 16px;border-radius:22px;font:inherit;font-size:14px;letter-spacing:3px;color:#f2fff8;cursor:pointer;',
    'background:rgba(110,170,150,.24);border:1px solid rgba(214,255,238,.42);box-shadow:0 4px 18px rgba(30,20,60,.25);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#l2csSkip:active{background:rgba(140,205,182,.36)}',
    // Everything but the canvas and the cutscene steps aside, so the island reads as a film frame.
    'body.l2cs-on>:not(canvas):not(#l2cs){visibility:hidden!important}',
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

  function stop(e) { if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }
  function build() {
    if (el || !doc || !doc.body) return;
    var style = doc.createElement('style'); style.id = 'l2csStyle'; style.textContent = CSS;
    doc.head.appendChild(style);
    var box = doc.createElement('div'); box.id = 'l2cs'; box.className = 'hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', TITLE);
    box.innerHTML = '<div id="l2csVeil"></div><div id="l2csStars"></div>' +
      '<div id="l2csTop" class="l2cs-bar"></div><div id="l2csBottom" class="l2cs-bar"></div>' +
      '<div id="l2csCaption"></div>' +
      '<div id="l2csEnd"><div id="l2csTitle">' + TITLE + '</div><div id="l2csRule"></div><div id="l2csSub">' + SUBTITLE + '</div></div>' +
      '<div id="l2csBook"><h3>小猫图鉴</h3><div id="l2csCards"></div></div>' +
      '<button id="l2csGo" class="hidden" type="button">' + CONTINUE + '</button>' +
      '<button id="l2csSkip" type="button" aria-label="跳过过场动画">' + SKIP + '</button>' +
      '<div id="l2csClock"></div>';
    doc.body.appendChild(box);
    el = { box: box };
    var ids = ['Veil', 'Stars', 'Top', 'Bottom', 'Caption', 'End', 'Book', 'Cards', 'Go', 'Skip', 'Clock'];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = doc.getElementById('l2cs' + ids[i]);
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
    if (!open) return;
    var f = frame(t);
    el.Veil.style.opacity = f.dusk.toFixed(3);
    el.Stars.style.opacity = f.stars.toFixed(3);
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
        // What is actually on the three.js objects right now (tests compare this across seeks).
        shot: st && staged ? {
          camera: H.camera.position.toArray().map(function (v) { return +v.toFixed(3); }),
          cats: st.cats.map(function (k) { return [+k.root.position.x.toFixed(3), +k.root.position.z.toFixed(3), +k.root.rotation.y.toFixed(3), +k.curl.toFixed(3)]; }),
          lanterns: st.lanterns.filter(function (l) { return l.g.visible; }).length, teaser: st.teaser.visible,
          flies: st.flies.filter(function (b) { return b.g.visible; }).length, zs: st.zs.filter(function (z) { return z.visible; }).length,
          hearts: st.hearts.filter(function (h) { return h.visible; }).length, halo: st.cats.filter(function (k) { return k.halo && k.root.visible; }).length
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
