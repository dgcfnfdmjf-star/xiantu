/* ==================================================================
 * voyage.js — lamp wishes and the night voyage for level 3 (星灯夜航).
 * - Each lamp softly prefers two 星萤. Any species counts; a match adds
 *   a flourish. Species are dealt so a 12-catch run finds all six.
 * - A paper boat drifts between lit lamps and loops them in the finale.
 * - Each catch adds a star (cap 60); the journal keeps counts and memories.
 * Loaded after journey.js, which calls in through window.__voyage.
 * Plain ES5. No external resources.
 * ================================================================== */
(function (window, document) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit;
  var RUN_CATCHES = 12, STAR_CAP = 60, FLY_TIME = 1.1, LAND_TIME = 0.8, DRIFT_SPEED = 0.5, LOOP_TIME = 6, HOVER_Y = 0.62, FLOWER_CLEAR = 1.05;
  // Lamp index -> species index in TYPES: warm, clear, dreaming. Together they cover all six.
  var WISHES = [[1, 2], [0, 3], [4, 5]];
  var MEMORY = {
    lamp0: '一号灯亮了，暖暖的，像谁家窗口留着的晚饭香。',
    lamp1: '二号灯亮了，清清的光落在云上，像一场刚停的雨。',
    lamp2: '三号灯亮了，云海深处有人翻了个身，继续做好梦。',
    voyage: '纸船绕着三盏灯走了一圈，把今晚收进了船舱。',
    dew: '露珠萤停在指尖，说早晨还会再来。',
    peach: '桃霞萤把晚霞分了你一小片，不用还。',
    amber: '琥珀萤落在掌心，暖得像一杯刚好入口的茶。',
    moon: '月白萤飞过时，月亮的倒影轻轻晃了晃。',
    violet: '紫梦萤说，那个梦还没醒，你可以慢慢来。',
    tide: '潮蓝萤带来很远的回声，像有人轻轻说：到了。'
  };
  var H, T, J, S, TYPES, active = false, clock = 0;
  var boat, body, puffs = [], route = null, routeKey = '', u = 0, heading = 0, appear = 0, wake = 0, announce = 0, loop = null;
  var lift = 0;
  var offset, p, tan, wp, tint, cream;
  var sky, skyGeo, skyUni, shown = 0, flights = [], flightGroup, landings = [], dots = [];

  function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function short(sp) { return sp.name.replace('萤', ''); }
  function litCount() { return S.lamps.filter(Boolean).length; }
  function allLit() { return litCount() === 3; }
  function nextLamp() { return S.lamps.indexOf(false); }
  function emitRing(pos, col, count, speed, size) {
    for (var i = 0; i < count; i++) {
      var a = i / count * Math.PI * 2;
      H.emitSpark(pos.x, pos.y, pos.z, Math.cos(a) * speed, 0.3 + Math.random() * 0.6, Math.sin(a) * speed, 1.4, size, col);
    }
  }

  /* -------------------------- Dealing species ---------------------- */
  // Lamps never reset, so "this run" and "this save" are the same thing; old saves resume where they were
  function unseen() {
    var list = [];
    TYPES.forEach(function (sp, i) { if (!S.caught[sp.id]) list.push(i); });
    return list;
  }
  function leastPresent(list, w) {
    var best = [], low = Infinity;
    list.forEach(function (type) {
      var n = J.wisps.filter(function (o) { return o !== w && o.type === type; }).length;
      if (n < low) { low = n; best = []; }
      if (n === low) best.push(type);
    });
    return best[Math.floor(Math.random() * best.length)];
  }
  // What a wisp comes back as: someone not met yet, else whoever the next lamp is waiting for, else whoever is rarest
  function deal(w) {
    var missing = unseen(), next = nextLamp(), all = TYPES.map(function (sp, i) { return i; });
    function absent(type) { return !J.wisps.some(function (o) { return o !== w && o.type === type; }); }
    var fresh = missing.filter(absent), wish = next >= 0 ? WISHES[next].filter(absent) : [];
    return leastPresent(fresh.length ? fresh : (wish.length ? wish : all), w);
  }
  // Once the catches left only just cover the species left, every wisp must be a new friend.
  // type changes at once so the guarantee holds; the colour follows softly in tintWisps.
  function balance() {
    var missing = unseen();
    if (allLit() || !missing.length || RUN_CATCHES - litCount() * 4 - S.charge > missing.length) return;
    J.wisps.forEach(function (w) {
      if (missing.indexOf(w.type) >= 0) return;
      w.type = leastPresent(missing, w);
      if (w.cooldown > 0) return;
      w.g.getWorldPosition(wp); tint.setHex(TYPES[w.type].color);
      emitRing(wp, tint, 5, 0.2, 0.06);
    });
  }
  function tintWisps(dt, snap) {
    J.wisps.forEach(function (w) {
      var mat = w.wings[0].material, glow = w.glow.material, k = snap || w.cooldown > 0 ? 1 : Math.min(1, dt * 3);
      tint.setHex(TYPES[w.type].color);
      mat.color.lerp(tint, k); glow.color.lerp(tint, k);
    });
  }

  /* ----------------------------- Wishes ---------------------------- */
  function harmony(lit) {
    var out = K && GA.sfxOut();
    if (!out) return;
    var t = GA.context().currentTime + 0.32;
    K.musicBox(t, GA.pent(lit + 4), 0.05, out);
    K.musicBox(t + 0.09, GA.pent(lit + 6), 0.045, out);
  }
  function makeWishSign(i) {
    var c = document.createElement('canvas'); c.width = 96; c.height = 48;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(32,30,58,.72)'; g.beginPath(); g.arc(24, 24, 22, Math.PI / 2, Math.PI * 1.5); g.arc(72, 24, 22, -Math.PI / 2, Math.PI / 2); g.fill();
    WISHES[i].forEach(function (type, k) {
      g.fillStyle = hex(TYPES[type].color); g.beginPath(); g.arc(28 + k * 40, 24, 14, 0, Math.PI * 2); g.fill();
    });
    var sign = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false, fog: false }));
    sign.position.y = 1.98; sign.scale.set(0.5, 0.25, 1); sign.renderOrder = 5;
    return sign;
  }
  function renderHud() {
    var next = nextLamp(), row = document.getElementById('vgWish');
    [0, 1, 2].forEach(function (n) {
      var b = document.getElementById('starLamp' + n), html = '<span class="vg-dots">';
      WISHES[n].forEach(function (type) { html += '<i style="background:' + hex(TYPES[type].color) + '"></i>'; });
      b.insertAdjacentHTML('beforeend', html + '</span>');
      b.setAttribute('aria-label', b.getAttribute('aria-label') + '，偏爱' + TYPES[WISHES[n][0]].name + '和' + TYPES[WISHES[n][1]].name);
    });
    row.hidden = next < 0;
    if (next < 0) return;
    row.innerHTML = '灯心偏爱' + WISHES[next].map(function (type) { return ' <i style="background:' + hex(TYPES[type].color) + '"></i>' + short(TYPES[type]); }).join('');
  }

  /* ----------------------------- Stars ----------------------------- */
  function buildSky() {
    var pos = new Float32Array(STAR_CAP * 3), col = new Float32Array(STAR_CAP * 3), sz = new Float32Array(STAR_CAP), ph = new Float32Array(STAR_CAP), idx = new Float32Array(STAR_CAP), c = new T.Color();
    for (var i = 0; i < STAR_CAP; i++) {
      // A low-discrepancy sequence: the seats are fixed, and any number of stars looks evenly scattered
      var r = Math.sqrt((i * 0.7549 + 0.3) % 1), a = i * 2.39996;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (i * 0.5698 + 0.2) % 1; pos[i * 3 + 2] = Math.sin(a) * r;
      c.setHex(TYPES[i % 6].color).lerp(cream, 0.35);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      sz[i] = 3.4 + (i * 0.381 % 1) * 2.4; ph[i] = i * 1.7; idx[i] = i;
    }
    skyGeo = new T.BufferGeometry();
    skyGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
    skyGeo.setAttribute('aColor', new T.BufferAttribute(col, 3));
    skyGeo.setAttribute('aSize', new T.BufferAttribute(sz, 1));
    skyGeo.setAttribute('aPhase', new T.BufferAttribute(ph, 1));
    skyGeo.setAttribute('aIndex', new T.BufferAttribute(idx, 1));
    skyUni = { uTime: { value: 0 }, uPR: { value: Math.min(window.devicePixelRatio || 1, 2) }, uNew: { value: -1 }, uFlash: { value: 0 } };
    sky = new T.Points(skyGeo, new T.ShaderMaterial({
      uniforms: skyUni, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
      vertexShader: 'attribute vec3 aColor; attribute float aSize; attribute float aPhase; attribute float aIndex; uniform float uTime; uniform float uPR; uniform float uNew; uniform float uFlash; varying vec3 vC; varying float vA;' +
        'void main(){ float f = step(abs(aIndex - uNew), 0.5) * uFlash; vC = aColor; vA = min(1.0, 0.62 + 0.38 * sin(uTime * 1.1 + aPhase) + f);' +
        ' gl_PointSize = aSize * uPR * (1.0 + f * 2.4); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC, a * a * vA); }'
    }));
    sky.frustumCulled = false; sky.visible = false;
    H.scene.add(sky);
    flightGroup = new T.Group(); flightGroup.visible = false; H.scene.add(flightGroup);
    for (i = 0; i < 6; i++) {
      var sprite = new T.Sprite(new T.SpriteMaterial({ map: H.glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      sprite.visible = false; sprite.scale.set(0.34, 0.34, 1); flightGroup.add(sprite);
      flights.push({ sprite: sprite, on: false, time: 0, from: new T.Vector3(), to: new T.Vector3() });
    }
  }
  // At the default camera the real horizon sits above the screen, so the stars hang over the island instead
  // and this fits them into the upper part of the view at any zoom, tilt and screen shape
  function fitSky() {
    var c = H.camera, D = Math.hypot(c.position.x, c.position.z), v = Math.tan(c.fov * Math.PI / 360), center = Math.atan2(c.position.y - 0.4, D);
    function yAt(f) { return c.position.y - D * Math.tan(center - Math.atan(f * v)); }
    var low = yAt(0.42), rho = D * v * c.aspect * 0.95;
    sky.position.y = low; sky.scale.set(rho, yAt(0.9) - low, rho);
  }
  function launchStar(from, color) {
    var f = null;
    for (var n = 0; n < flights.length && !f; n++) if (!flights[n].on) f = flights[n];
    if (!f) { shown = S.stars; return; } // the pool is busy: the star just appears
    fitSky(); sky.updateMatrixWorld();
    f.index = S.stars - 1; f.on = true; f.time = 0; f.from.copy(from);
    f.to.fromBufferAttribute(skyGeo.attributes.position, f.index); sky.localToWorld(f.to);
    f.sprite.material.color.setHex(color); f.sprite.visible = true;
  }
  function updateStars(dt, t) {
    fitSky();
    skyUni.uTime.value = t;
    skyUni.uFlash.value = Math.max(0, skyUni.uFlash.value - dt * 0.9);
    flights.forEach(function (f) {
      if (!f.on) return;
      f.time += dt;
      var e = Math.min(1, f.time / FLY_TIME); e = e * e * (3 - 2 * e);
      f.sprite.position.copy(f.from).lerp(f.to, e);
      f.sprite.position.y += Math.sin(e * Math.PI) * 0.8;
      f.sprite.material.opacity = 1 - e * 0.3;
      if (e === 1) { f.on = false; f.sprite.visible = false; shown = Math.max(shown, f.index + 1); skyUni.uNew.value = f.index; skyUni.uFlash.value = 1; }
    });
    skyGeo.setDrawRange(0, shown);
  }

  /* ----------------------------- Boat ------------------------------ */
  function buildBoat() {
    var L = 0.66, W = 0.32, B = [L, 0.2, 0], S2 = [-L, 0.2, 0], KF = [0.26, -0.12, 0], KB = [-0.26, -0.12, 0], A = [0, 0.05, W], C = [0, 0.05, -W], F = [0.24, 0.05, 0], G = [-0.24, 0.05, 0], P = [0, 0.44, 0];
    // Each face gets one shade, which is what makes it read as folded paper. Unlit so it glows at night.
    var faces = [
      [B, A, KF, 0xfff4dd], [A, KB, KF, 0xf4e6c9], [S2, KB, A, 0xfff4dd], [B, KF, C, 0xe6d6b6], [C, KF, KB, 0xdccaa8], [S2, C, KB, 0xe6d6b6],
      [B, F, A, 0xfffaf0], [B, C, F, 0xeadbbd], [S2, A, G, 0xfffaf0], [S2, G, C, 0xeadbbd],
      [P, A, F, 0xffffff], [P, G, A, 0xf8ecd4], [P, F, C, 0xeee0c4], [P, C, G, 0xe2d2b2]
    ], pos = [], col = [], c = new T.Color();
    faces.forEach(function (f) {
      c.setHex(f[3]);
      for (var i = 0; i < 3; i++) { pos.push(f[i][0], f[i][1], f[i][2]); col.push(c.r, c.g, c.b); }
    });
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    boat = new T.Group(); boat.visible = false; H.island.add(boat);
    window.GardenClip.boat = boat;
    body = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, fog: false }));
    boat.add(body);
    function glow(x, y, size, color, opacity) {
      var s = new T.Sprite(new T.SpriteMaterial({ map: H.glowTex, color: color, transparent: true, opacity: opacity, depthTest: false, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      s.position.set(x, y, 0); s.scale.set(size, size, 1); s.userData.opacity = opacity; boat.add(s);
      return s;
    }
    glow(0, 0.22, 1.9, 0xffd9a0, 0.5); glow(0, 0.48, 0.3, 0xfff4cc, 1);
    // A small cloud carries it across the grass: the sea itself is out of frame on a phone
    [[-0.34, 0.8], [0.3, 0.72], [0, 1.05]].forEach(function (d) { puffs.push(glow(d[0], -0.2, d[1], 0xfff3ea, 0.3)); });
  }
  function around(i, list, radius) {
    var l = J.lamps[i].g.position, a0 = Math.atan2(l.z, l.x), steps = list === null ? 5 : 3;
    var out = list || [];
    for (var k = 0; k < steps; k++) {
      var a = list === null ? a0 - k / 5 * Math.PI * 2 : a0 + (1 - k) * 1.2;
      out.push(new T.Vector3(l.x + Math.cos(a) * radius, H.TOP_Y + HOVER_Y, l.z + Math.sin(a) * radius));
    }
    return out;
  }
  function makeRoute() {
    var lit = [0, 1, 2].filter(function (i) { return S.lamps[i]; }), pts;
    if (lit.length === 1) pts = around(lit[0], null, 1.05);
    else if (lit.length === 2) {
      var a = J.lamps[lit[0]].g.position, b = J.lamps[lit[1]].g.position, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, len = Math.hypot(mx, mz) || 1;
      pts = around(lit[0], [], 1);
      pts.push(new T.Vector3(mx + mx / len * 1.1, H.TOP_Y + HOVER_Y, mz + mz / len * 1.1));
      around(lit[1], pts, 1);
      pts.push(new T.Vector3(mx - mx / len * 1.1, H.TOP_Y + HOVER_Y, mz - mz / len * 1.1));
    } else {
      pts = around(0, [], 1); around(1, pts, 1); around(2, pts, 1);
      pts.push(new T.Vector3(0, H.TOP_Y + HOVER_Y, -0.3));
    }
    return new T.CatmullRomCurve3(pts, true, 'centripetal');
  }
  // A new route starts at its nearest point; offset fades out so the boat never jumps
  function setRoute(keepPlace) {
    var key = S.lamps.join();
    if (key === routeKey || !litCount()) return;
    routeKey = key;
    var hadBoat = keepPlace && route;
    if (hadBoat) offset.copy(p);
    route = makeRoute();
    var best = 0, dist = Infinity;
    if (hadBoat) for (var i = 0; i < 64; i++) {
      route.getPointAt(i / 64, tan);
      var d = tan.distanceToSquared(p);
      if (d < dist) { dist = d; best = i / 64; }
    }
    u = best;
    if (hadBoat) offset.sub(route.getPointAt(u, tan)); else offset.set(0, 0, 0);
  }
  function updateBoat(dt, t) {
    if (!route) return;
    if (loop) {
      loop.time = Math.min(LOOP_TIME, loop.time + dt);
      var x = loop.time / LOOP_TIME;
      u = (loop.start + 0.12 * x + 0.88 * x * x * (3 - 2 * x)) % 1; // leaves and rejoins at about drift speed
      if (x === 1) loop = null;
    } else u = (u + DRIFT_SPEED * dt / route.getLength()) % 1;
    appear = Math.min(1, appear + dt / 1.4);
    offset.multiplyScalar(Math.max(0, 1 - dt * 1.2));
    route.getPointAt(u, p); route.getTangentAt(u, tan);
    p.add(offset);
    // Rise over flower heads (tallest about TOP_Y + 1.08) so the keel, at -0.12 with up to -0.105 of bob and tilt, never cuts them
    var wantLift = 0;
    H.flowers.forEach(function (f) {
      var fp = f.root.position, d = Math.hypot(fp.x - p.x, fp.z - p.z);
      if (d < FLOWER_CLEAR) wantLift = Math.max(wantLift, Math.min(1, (FLOWER_CLEAR - d) / 0.25));
    });
    lift += (wantLift * (1.08 + 0.225 - HOVER_Y) - lift) * Math.min(1, dt * (loop ? 14 : 4));
    boat.position.copy(p); boat.position.y += lift + Math.sin(t * 1.3) * 0.055 + Math.sin(t * 0.7) * 0.03;
    // Shortest way round, so it swings gently instead of spinning
    var want = Math.atan2(-tan.z, tan.x), turn = Math.atan2(Math.sin(want - heading), Math.cos(want - heading));
    heading += turn * Math.min(1, dt * 2.5);
    boat.rotation.y = heading;
    body.rotation.x = Math.sin(t * 1.1) * 0.07; body.rotation.z = Math.sin(t * 0.8 + 1) * 0.05;
    var e = appear * appear * (3 - 2 * appear); boat.scale.set(e, e, e);
    puffs.forEach(function (s, i) {
      var size = (i === 2 ? 1.05 : 0.76) + Math.sin(t * 0.9 + i * 2) * 0.08;
      s.scale.set(size, size * 0.62, 1);
    });
    wake -= dt;
    if (wake <= 0 && e > 0.5) {
      wake = loop ? 0.07 : 0.3;
      boat.getWorldPosition(wp);
      H.emitSpark(wp.x, wp.y - 0.05, wp.z, 0, 0.06, 0, loop ? 1 : 1.4, 0.07, cream);
    }
  }

  /* ---------------------------- Journal ---------------------------- */
  function remember(id) {
    if (S.memories.indexOf(id) >= 0) return false;
    S.memories.push(id); return true;
  }
  // Old saves have the catches and lamps but none of these fields, so they are worked out from what is there
  function reconcile() {
    var before = JSON.stringify([S.stars, S.memories]), total = 0;
    S.memories = S.memories.filter(function (id, i, list) { return Object.prototype.hasOwnProperty.call(MEMORY, id) && list.indexOf(id) === i; });
    S.lamps.forEach(function (on, i) { if (on) remember('lamp' + i); });
    if (allLit()) remember('voyage');
    TYPES.forEach(function (sp) { total += S.caught[sp.id] || 0; if (S.caught[sp.id]) remember(sp.id); });
    S.stars = Math.max(S.stars, Math.min(STAR_CAP, total));
    return before !== JSON.stringify([S.stars, S.memories]);
  }
  function journal() {
    var html = '<section class="jr-row vg-log"><h3>夜航记事</h3><p>' + (S.stars ? '天上多了 ' + S.stars + ' 颗星' + (S.stars >= STAR_CAP ? '，夜空已经满满当当了' : '，都是你接住的光') : '接住一只星萤，天上就多一颗星') + (S.joys ? ' · 灯心欢喜 ' + S.joys + ' 次' : '') + '</p><div class="vg-counts">';
    TYPES.forEach(function (sp) {
      var n = S.caught[sp.id] || 0;
      html += '<div class="vg-count' + (n ? '' : ' locked') + '"><i style="background:' + hex(sp.color) + '"></i>' + (n ? sp.name + '<b>' + n + '</b>' : '尚未遇见') + '</div>';
    });
    html += '</div>';
    var lines = S.memories.filter(function (id) { return MEMORY[id]; });
    html += lines.length ? '<ul class="vg-memories"><li>' + lines.map(function (id) { return MEMORY[id]; }).join('</li><li>') + '</li></ul>' : '<p class="jr-note">这里还是空白的。第一只星萤，会写下第一句话。</p>';
    return html + '</section>';
  }
  function addUI() {
    var st = document.createElement('style');
    st.textContent = [
      '#vgWish{font-size:12px;line-height:1.5;color:#e0d9e8;margin-bottom:6px;white-space:nowrap}',
      '#vgWish[hidden]{display:none}',
      '#vgWish i,.vg-dots i,.vg-count i{display:inline-block;width:8px;height:8px;border-radius:50%;box-shadow:0 0 5px currentColor}',
      '#vgWish i{margin:0 2px 0 4px}',
      '.vg-dots{display:flex;justify-content:center;gap:4px;margin-top:3px;pointer-events:none}',
      '.vg-counts{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 12px;font-size:13px;color:#e0d9e8}',
      '.vg-count{display:flex;align-items:center;gap:6px}.vg-count b{margin-left:auto;font-weight:500;color:#ffe2a4}.vg-count.locked{opacity:.55}',
      '.vg-memories{margin:12px 0 0;padding:0;list-style:none;font-size:13px;line-height:1.7;color:#d1ccdd}',
      '.vg-memories li{padding:5px 0;border-top:1px solid #ffffff12}'
    ].join('\n');
    document.body.appendChild(st);
    var row = document.createElement('div'); row.id = 'vgWish';
    var buttons = document.getElementById('starLampButtons');
    buttons.parentNode.insertBefore(row, buttons);
  }

  window.__voyage = {
    // journey: { progress, types, wisps, lamps, save(), canPlay() }
    init: function (hooks, journey) {
      H = hooks; T = hooks.THREE; J = journey; S = journey.progress; TYPES = journey.types;
      offset = new T.Vector3(); p = new T.Vector3(); tan = new T.Vector3(); wp = new T.Vector3(); tint = new T.Color(); cream = new T.Color(0xfff0d0);
      addUI(); buildSky(); buildBoat();
      J.lamps.forEach(function (l, i) {
        var sign = makeWishSign(i); l.g.add(sign);
        dots.push({ sign: sign, pulse: 0 });
      });
      if (reconcile()) J.save();
      shown = S.stars;
      balance(); tintWisps(0, true);
      return this;
    },
    // After the species sound and spark, which read w.type. Returns true when the next lamp was waiting for it.
    onCatch: function (w, pos) {
      var type = w.type, next = nextLamp(), wish = next >= 0 && WISHES[next].indexOf(type) >= 0;
      remember(TYPES[type].id);
      if (S.stars < STAR_CAP) { S.stars++; launchStar(pos, TYPES[type].color); }
      if (wish) {
        S.joys = Math.min(99999, S.joys + 1);
        tint.setHex(TYPES[type].color);
        emitRing(pos, tint, 22, 1.05, 0.2);
        harmony(litCount());
        landings.push({ time: LAND_TIME, lamp: next, hex: TYPES[type].color });
      }
      w.type = deal(w);
      balance();
      return wish;
    },
    onLamp: function (index) {
      var first = !route;
      remember('lamp' + index);
      setRoute(true);
      if (first) { appear = 0; heading = 0; announce = 3; boat.visible = active; }
      if (allLit()) {
        remember('voyage');
        loop = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? null : { time: 0, start: u };
      }
      balance();
    },
    onLevel: function (isActive) {
      active = isActive; loop = null; landings = []; announce = 0;
      sky.visible = flightGroup.visible = active;
      flights.forEach(function (f) { f.on = false; f.sprite.visible = false; });
      shown = S.stars; skyUni.uFlash.value = 0; skyGeo.setDrawRange(0, shown);
      if (active) { setRoute(false); if (route) { appear = 1; offset.set(0, 0, 0); } tintWisps(0, true); }
      boat.visible = active && !!route;
    },
    update: function (dt, t) {
      if (!active) return;
      clock = t;
      tintWisps(dt, false);
      updateStars(dt, t);
      updateBoat(dt, t);
      for (var i = landings.length - 1; i >= 0; i--) {
        landings[i].time -= dt;
        if (landings[i].time > 0) continue;
        J.lamps[landings[i].lamp].core.getWorldPosition(wp);
        tint.setHex(landings[i].hex);
        emitRing(wp, tint, 12, 0.6, 0.12);
        dots[landings[i].lamp].pulse = 1;
        landings.splice(i, 1);
      }
      dots.forEach(function (d) {
        d.pulse = Math.max(0, d.pulse - dt * 1.5);
        var s = 1 + d.pulse * 0.5; d.sign.scale.set(0.5 * s, 0.25 * s, 1);
      });
      if (announce > 0) {
        announce -= dt;
        if (announce <= 0 && J.canPlay()) H.toast('一只小纸船，从云里漂了出来', 2800);
      }
    },
    renderHud: renderHud,
    journal: journal,
    lampOf: function (type) { for (var i = 0; i < 3; i++) if (WISHES[i].indexOf(type) >= 0) return i; return type % 3; },
    wishes: WISHES,
    // Read-only inspection for regression tests
    state: function () {
      return { stars: S.stars, shown: shown, boat: boat.visible, looping: !!loop, u: u, appear: appear, route: route ? route.points.length : 0, skyVisible: sky.visible, flights: flights.filter(function (f) { return f.on; }).length,
        pos: boat.position.toArray(), clock: clock };
    },
    // Where a star seat lands on screen, to check they stay in view
    starScreen: function (i) {
      var v = new T.Vector3().fromBufferAttribute(skyGeo.attributes.position, i); sky.updateMatrixWorld(); sky.localToWorld(v); v.project(H.camera);
      return { x: v.x, y: v.y };
    },
    routeSample: function () { var out = [], v = new T.Vector3(); for (var i = 0; i < 200; i++) { route.getPointAt(i / 200, v); out.push([v.x, v.z]); } return out; }
  };
})(window, document);
