/* ==================================================================
 * level3fx.js — touch and light for level 3 (星灯夜航).
 * - Every caught 星萤 sends a spark along a curve to the next unlit lamp,
 *   which brightens in 4 stages and breathes once it is full.
 * - 星萤 orbit and fade back in; lamps fade on; empty taps ripple.
 * - Swipes gather 星萤, pedestals are tappable, lamps carry number labels
 *   matching the HUD buttons. Mobile layout and level 3 wording live here.
 * Loaded after journey.js, which calls in through window.__level3fx.
 * Plain ES5. No external resources.
 * ================================================================== */
(function (window, document) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit;
  var SPARK_TIME = 0.8, FADE_IN = 0.9, WISP_HIT_PX = 44, LAMP_HIT_PX = 36, SWIPE_PX = 9, STEP_PX = 14, CATCHABLE_FADE = 0.3;
  var CORE_Y = 0.91, RING_R = 0.31, LABEL_Y = 1.62, READY_Y = 2.45, STAGES = 4;
  var INK = ['#ffb3cd', '#a9efd8', '#89d7ff'];
  var H, T, J, group, sparks = [], lampFx = [], active = false, inflight = 0;
  var temp, temp2, scr, dimCol, warmCol, dustCol, originalCard = null;

  /* ---------------------------- Layout ----------------------------- */
  function addStyle() {
    var st = document.createElement('style');
    st.textContent = [
      // Toast sits just above the mode bar, clear of the toggle column and its 旅程手账 button
      '#toast{top:auto;bottom:calc(env(safe-area-inset-bottom,0px) + 112px)}',
      '#starSaveWarning{bottom:calc(env(safe-area-inset-bottom,0px) + 214px)}',
      '#starHud{width:172px}',
      '#starHud strong{display:block;white-space:nowrap}',
      '#starHint{font-size:13px;line-height:1.5}',
      '#starLampButtons button{min-height:44px;color:var(--ink);border-color:var(--ink)}',
      '#starLamp0{--ink:' + INK[0] + '}#starLamp1{--ink:' + INK[1] + '}#starLamp2{--ink:' + INK[2] + '}',
      '#starLampButtons button.lit{color:var(--ink);border-color:var(--ink)}',
      '#starLampButtons button.ready{animation:l3Breathe 2.6s ease-in-out infinite}',
      '@keyframes l3Breathe{0%,100%{box-shadow:0 0 2px var(--ink)}50%{box-shadow:0 0 14px var(--ink)}}',
      '.l3-ripple{position:fixed;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;pointer-events:none;z-index:4;',
      'border:1.5px solid rgba(255,240,214,.75);box-shadow:0 0 12px rgba(255,226,170,.35);animation:l3Ripple 1s ease-out forwards}',
      '@keyframes l3Ripple{from{transform:scale(.2);opacity:.85}to{transform:scale(1);opacity:0}}',
      '@media (prefers-reduced-motion:reduce){#starLampButtons button.ready{animation:none;box-shadow:0 0 10px var(--ink)}}'
    ].join('\n');
    document.body.appendChild(st); // after journey's stylesheet in the body, which sets the same rules
  }
  var LV3_ITEMS = ['✦ 轻点或划过彩色星萤，所有颜色每只都 +1', '🕯 每集满 4 点，轻点任一未亮星灯或上方编号；点亮三盏就完成', '彩色小圆点只表示灯的偏爱，遇见时多一份欢喜，星光仍是 +1', '🌷 种花 · 🏮 许愿 · ✨ 唤萤 · 📖 星萤', '👆 双指旋转 / 缩放视角 · 没有时间限制'];
  var CARDS = {
    5: { p: '月色落在一湾静水里，六朵莲花在等光。<br>找回月露、倒影和光路，陪一叶小舟归航。<br>不用赶路，也不用担心做错。', items: ['☾ 六朵月莲，各有一种温柔的小目标', '接月露、转月镜、引光与合奏；没有限时', '📖 六朵月莲会收入收藏手账', '完成后可留下来，听听月色'] },
    4: { p: '星灯歇下，晨风带来了六枚风铃。<br>听一遍，再按编号奏回三段旋律，<br>把早安送给醒来的小岛。', items: ['♪ 先听旋律，再点风铃或底部编号', '📖 可查看乐谱，静音也有编号提示', '✧ 三段旋律与六枚音符可存档续玩', '没有限时，错音可以慢慢重来'] },
    2: { p: '小猫们在花丛里等你，<br>丢个毛线球，再轻轻抱抱它们，<br>收集 20 点，就能去往星灯湾。',
      items: ['🐱 轻点小猫丢毛线球，再点一下抱抱它', '✨ 稀有的小猫值更多点数', '🌷 种花 · 🏮 放灯 · 📖 猫谱', '👆 双指旋转 / 缩放视角'] },
    3: { p: '夜色落在云海上，三座星灯还在沉睡。<br>先轻点彩色星萤收集 4 点星光，<br>再轻点发亮的灯，把三盏依次点亮。', items: LV3_ITEMS },
    done: { p: '三座星灯都亮着，云海有了归途。<br>星萤还在岛上慢慢飞，<br>留下来，陪它们看一会儿夜色吧。',
      items: ['✦ 轻点或划过星萤，把它们记进图鉴', LV3_ITEMS[3], LV3_ITEMS[4]] }
  };
  function startCard(level) {
    var card = document.querySelector('#start .card'), p = card && card.querySelector('p'), ul = card && card.querySelector('ul');
    if (!p || !ul) return;
    if (!originalCard) originalCard = { p: p.innerHTML, ul: ul.innerHTML };
    var copy = level === 3 && J.allLit() ? CARDS.done : CARDS[level];
    p.innerHTML = copy ? copy.p : originalCard.p;
    ul.innerHTML = copy ? '<li>' + copy.items.join('</li><li>') + '</li>' : originalCard.ul;
  }
  // 放灯 and 萤火 name other things in level 3, where the lamps and 星萤 are the story
  function modeLabels(on) {
    var lantern = document.querySelector('#modes button[data-mode="lantern"] span'), firefly = document.querySelector('#modes button[data-mode="firefly"] span');
    if (lantern) lantern.textContent = on ? '许愿' : '放灯';
    if (firefly) firefly.textContent = on ? '唤萤' : '萤火';
  }
  function term(msg) {
    return window.__kittens && window.__kittens.state().level === 3 ? String(msg).replace(/萤火虫/g, '星萤') : msg;
  }

  /* ---------------------------- Hit tests -------------------------- */
  function toScreen(v) { // false when v is behind the camera
    v.project(H.camera);
    scr.x = (v.x + 1) * window.innerWidth / 2; scr.y = (1 - v.y) * window.innerHeight / 2;
    return v.z < 1;
  }
  function screenOf(ray) {
    temp.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 10);
    toScreen(temp);
    return { x: scr.x, y: scr.y };
  }
  function wispAt(x, y) {
    var best = null, distance = WISP_HIT_PX;
    J.wisps.forEach(function (w) {
      if (!w.g.visible || w.cooldown > 0 || w.fade < CATCHABLE_FADE) return;
      w.g.getWorldPosition(temp);
      if (!toScreen(temp)) return;
      var d = Math.hypot(scr.x - x, scr.y - y);
      if (d < distance) { distance = d; best = w; }
    });
    return best;
  }
  // Distance to the on-screen line from pedestal foot to number label, so the whole lamp answers at any zoom or angle
  function lampAt(x, y) {
    var best = -1, distance = LAMP_HIT_PX;
    J.lamps.forEach(function (l, i) {
      l.g.getWorldPosition(temp);
      if (!toScreen(temp)) return;
      var ax = scr.x, ay = scr.y;
      var ready = !J.lit(i) && J.charge() >= STAGES;
      temp.set(0, ready ? READY_Y : LABEL_Y, 0); l.g.localToWorld(temp);
      if (!toScreen(temp)) return;
      var bx = scr.x - ax, by = scr.y - ay, len = bx * bx + by * by;
      var u = len ? Math.max(0, Math.min(1, ((x - ax) * bx + (y - ay) * by) / len)) : 0;
      var d = Math.hypot(ax + bx * u - x, ay + by * u - y);
      if (d < distance) { distance = d; best = i; }
    });
    return best;
  }

  /* ---------------------------- Sound ------------------------------ */
  function note(m, v, delay) {
    var out = K && GA.sfxOut();
    if (out) K.musicBox(GA.context().currentTime + 0.01 + (delay || 0), m, v, out);
  }
  function arriveSound(stage) {
    note(GA.pent(stage + 3), 0.03);
    if (stage === STAGES) note(GA.pent(stage + 5), 0.035, 0.16);
  }

  /* ---------------------------- Ripple ----------------------------- */
  function ripple(ray) {
    var p = screenOf(ray), el = document.createElement('div');
    el.className = 'l3-ripple'; el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1100);
    if (GA && GA.pent) note(GA.pent(Math.floor(Math.random() * 3) - 3), 0.018);
  }

  /* ---------------------------- Sparks ----------------------------- */
  function nextLamp() { for (var i = 0; i < 3; i++) if (!J.lit(i)) return i; return -1; }
  function lampLocal(i, out) { var p = J.lamps[i].g.position; return out.set(p.x, p.y + CORE_Y, p.z); }
  function sendLight(worldPos, hex, wispType) {
    var s = null, target = nextLamp();
    for (var n = 0; n < sparks.length && !s; n++) if (!sparks[n].on) s = sparks[n];
    if (!s) return;
    // In free play the light still travels, just to a lamp already lit
    s.lamp = target >= 0 ? target : (window.__voyage ? window.__voyage.lampOf(wispType) : wispType % 3);
    s.counted = target >= 0;
    if (s.counted) inflight++;
    H.island.worldToLocal(s.from.copy(worldPos));
    lampLocal(s.lamp, s.to);
    // Lift the middle of the path and push it sideways, so each flight arcs differently
    var side = Math.random() < 0.5 ? -1 : 1, dx = s.to.x - s.from.x, dz = s.to.z - s.from.z, len = Math.hypot(dx, dz) || 1;
    s.ctrl.copy(s.from).add(s.to).multiplyScalar(0.5);
    s.ctrl.x += -dz / len * side * 0.9; s.ctrl.z += dx / len * side * 0.9; s.ctrl.y += 1.2 + Math.random() * 0.5;
    s.on = true; s.time = 0; s.dust = 0;
    s.col.setHex(hex); s.sprite.material.color.setHex(hex); s.sprite.visible = true;
  }
  function land(s) {
    s.on = false; s.sprite.visible = false;
    if (s.counted) { inflight = Math.max(0, inflight - 1); arriveSound(shownCharge()); }
    lampFx[s.lamp].pulse = 1;
    H.island.localToWorld(temp.copy(s.to));
    for (var i = 0; i < 7; i++) {
      var a = i / 7 * Math.PI * 2;
      H.emitSpark(temp.x, temp.y, temp.z, Math.cos(a) * 0.35, 0.2 + Math.random() * 0.3, Math.sin(a) * 0.35, 0.8, 0.07, s.col);
    }
  }
  function updateSparks(dt) {
    sparks.forEach(function (s) {
      if (!s.on) return;
      s.time += dt;
      var u = Math.min(1, s.time / SPARK_TIME);
      if (u === 1) { land(s); return; }
      var e = u * u * (3 - 2 * u), m = 1 - e, p = s.sprite.position;
      p.set(0, 0, 0).addScaledVector(s.from, m * m).addScaledVector(s.ctrl, 2 * m * e).addScaledVector(s.to, e * e);
      s.sprite.material.opacity = Math.min(1, u * 8);
      var size = 0.55 + Math.sin(u * Math.PI) * 0.25; s.sprite.scale.set(size, size, 1);
      s.dust -= dt;
      if (s.dust <= 0) {
        s.dust = 0.05;
        H.island.localToWorld(temp.copy(p));
        H.emitSpark(temp.x, temp.y, temp.z, 0, -0.05, 0, 0.55, 0.06, s.col);
      }
    });
  }
  function clearSparks() {
    sparks.forEach(function (s) { s.on = false; s.sprite.visible = false; });
    inflight = 0;
  }
  // Starlight that has reached its lamp; the save counts a catch at once, the lamp when the spark lands
  function shownCharge() { return Math.max(0, J.charge() - inflight); }

  /* ----------------------------- Lamps ----------------------------- */
  function makeLabel(i) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(32,30,58,.78)'; g.beginPath(); g.arc(32, 32, 27, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK[i]; g.lineWidth = 4; g.stroke();
    g.fillStyle = INK[i]; g.font = '600 36px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(i + 1), 32, 34);
    var label = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false, fog: false }));
    label.position.y = LABEL_Y; label.scale.set(0.64, 0.64, 1); label.renderOrder = 5;
    return label;
  }
  function makeReadyLabel() {
    var c = document.createElement('canvas'); c.width = 192; c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(51,38,34,.94)'; g.fillRect(2, 2, 188, 60);
    g.strokeStyle = '#ffe6aa'; g.lineWidth = 3; g.strokeRect(3, 3, 186, 58);
    g.fillStyle = '#fff5d8'; g.font = '600 32px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('点我点亮', 96, 33);
    var label = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false, fog: false }));
    label.position.y = READY_Y; label.scale.set(2.1, 0.7, 1); label.renderOrder = 6; label.visible = false;
    return label;
  }
  function buildLamps() {
    J.lamps.forEach(function (l, i) {
      var fx = { on: 0, fill: 0, breath: 0, pulse: 0, pips: [], label: makeLabel(i), readyLabel: makeReadyLabel() };
      l.g.add(fx.label); l.g.add(fx.readyLabel);
      for (var k = 0; k < STAGES; k++) {
        var pip = new T.Sprite(new T.SpriteMaterial({ map: H.glowTex, color: new T.Color(INK[i]), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        var a = Math.PI / 2 - k / STAGES * Math.PI * 2; // clockwise from the top of the ring
        pip.position.set(Math.cos(a) * RING_R, CORE_Y + Math.sin(a) * RING_R, 0); pip.scale.set(0.26, 0.26, 1);
        l.g.add(pip); fx.pips.push(pip);
      }
      lampFx.push(fx);
    });
    settleLamps();
  }
  function fillGoal(i, next) { return i === next ? shownCharge() / STAGES : 0; }
  function settleLamps() {
    var next = nextLamp();
    lampFx.forEach(function (fx, i) { fx.on = J.lit(i) ? 1 : 0; fx.fill = fillGoal(i, next); });
    updateLamps(0, 0);
  }
  function updateLamps(dt, t) {
    var next = nextLamp(), allLit = next < 0;
    lampFx.forEach(function (fx, i) {
      var l = J.lamps[i], lit = J.lit(i), goal = fillGoal(i, next), ready = !lit && J.charge() >= STAGES;
      fx.on += ((lit ? 1 : 0) - fx.on) * Math.min(1, dt * 2.2);
      fx.fill += (goal - fx.fill) * Math.min(1, dt * 5);
      fx.breath += ((ready ? 1 : 0) - fx.breath) * Math.min(1, dt * 3);
      fx.pulse = Math.max(0, fx.pulse - dt * 1.8);
      var wave = fx.breath * (0.5 + 0.5 * Math.sin(t * 1.8)), mix = ready ? 1 : Math.max(fx.on, fx.fill * 0.8 + wave * 0.2);
      l.core.material.color.copy(dimCol).lerp(warmCol, mix);
      var coreSize = ready ? 1.65 + wave * 0.25 : 1;
      l.core.scale.set(coreSize, coreSize, coreSize);
      var opacity = ready ? 0.78 + wave * 0.22 : 0.1 + fx.fill * 0.4;
      l.halo.material.opacity = Math.min(1, opacity + (0.8 - opacity) * fx.on + fx.pulse * 0.25);
      // Once every lamp is lit level3plus.js sets the halo's size each frame, so only scale on top of it
      if (!allLit) { var size = ready ? 3.3 + wave * 0.7 : 2 + fx.fill * 0.3; l.halo.scale.set(size, size, 1); }
      l.halo.scale.multiplyScalar(1 + fx.pulse * 0.22);
      fx.pips.forEach(function (pip, k) { pip.material.opacity = Math.max(0, Math.min(1, fx.fill * STAGES - k)) * (1 - fx.on) * 0.95; });
      fx.label.material.opacity = 0.95 - fx.on * 0.35;
      fx.readyLabel.visible = ready;
      fx.readyLabel.material.opacity = 0.9 + wave * 0.1;
    });
  }

  /* ---------------------------- 星萤 ------------------------------- */
  function prepareWisps() {
    J.wisps.forEach(function (w) {
      w.fade = 1;
      w.wings[0].material.transparent = true; // gem and wings share this material
      w.wings[0].material.needsUpdate = true;
      // Enlarge the visible glow independently; solid wings keep their existing collision clearance.
      w.glow.scale.set(2.23, 2.23, 1);
    });
  }
  function moveWisp(w, dt, t) {
    var dir = w.slot % 2 ? -1 : 1; // slot, not type: voyage.js may change a wisp's species mid-flight
    // A full orbit whose radius breathes, plus a small loop on top so no two paths look alike
    var flight = t * 0.55;
    var a = w.phase + dir * flight * (0.2 + w.slot * 0.018) + Math.sin(flight * 0.43 + w.phase) * 0.35;
    var r = 2.35 + Math.sin(flight * 0.31 + w.phase * 2) * 0.85;
    w.g.position.set(Math.cos(a) * r + Math.cos(flight * 1.2 + w.phase) * 0.22, H.TOP_Y + 1.55 + Math.sin(flight * 0.9 + w.phase) * 0.38, Math.sin(a) * r + Math.sin(flight * 1.05 + w.phase) * 0.22);
    window.GardenClip.settleWisp(w, J.wisps);
    w.g.rotation.y = t * 0.7;
    w.wings[0].rotation.z = Math.sin(t * 8) * 0.4; w.wings[1].rotation.z = -w.wings[0].rotation.z;
    if (w.cooldown > 0) { w.fade = 0; return; }
    w.fade = Math.min(1, w.fade + dt / FADE_IN);
    var e = w.fade * w.fade * (3 - 2 * w.fade), size = 0.35 + 0.65 * e;
    w.g.scale.set(size, size, size);
    w.wings[0].material.opacity = e;
    w.glow.material.opacity = (0.82 + Math.sin(t * 1.8 + w.phase) * 0.13) * e;
  }

  /* ---------------------------- Swipes ----------------------------- */
  function dust(x, y) {
    temp.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.5).unproject(H.camera);
    temp.sub(H.camera.position).normalize();
    temp2.copy(H.camera.position).addScaledVector(temp, H.camera.position.length() * 0.8);
    H.emitSpark(temp2.x, temp2.y, temp2.z, 0, 0.08, 0, 0.5, 0.05, dustCol);
  }
  function bindSwipes() {
    var cvs = document.querySelector('canvas:not(#bfTrail)'), downs = {}, stroke = null;
    if (!cvs) return;
    cvs.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      downs[e.pointerId] = true;
      if (Object.keys(downs).length > 1) { stroke = null; return; } // pinch / two-finger rotate
      if (J.canPlay()) stroke = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, steps: 0, caught: false };
    });
    cvs.addEventListener('pointermove', function (e) {
      if (!stroke || stroke.id !== e.pointerId || e.buttons === 2 || !J.canPlay()) return;
      var dx = e.clientX - stroke.x, dy = e.clientY - stroke.y, len = Math.hypot(dx, dy);
      if (!stroke.moved && len <= SWIPE_PX) return; // still a tap as far as index.html is concerned
      stroke.moved = true;
      var steps = Math.min(80, Math.max(1, Math.ceil(len / STEP_PX)));
      for (var i = 1; i <= steps; i++) {
        var x = stroke.x + dx * i / steps, y = stroke.y + dy * i / steps, w = wispAt(x, y);
        if (w && J.collect(w)) stroke.caught = true;
        if (++stroke.steps % 2 === 0) dust(x, y);
      }
      stroke.x = e.clientX; stroke.y = e.clientY;
    });
    function up(e) {
      delete downs[e.pointerId];
      if (e.type === 'pointerup' && stroke && stroke.id === e.pointerId && stroke.moved && !stroke.caught && J.canPlay() && J.miss) J.miss();
      if (stroke && stroke.id === e.pointerId) stroke = null;
    }
    cvs.addEventListener('pointerup', up);
    cvs.addEventListener('pointercancel', up);
    cvs.addEventListener('lostpointercapture', up);
    window.addEventListener('blur', function () { downs = {}; stroke = null; });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { downs = {}; stroke = null; } });
  }

  window.__level3fx = {
    // journey: { wisps, lamps, lit(i), charge(), allLit(), canPlay(), collect(w) }
    init: function (hooks, journey) {
      H = hooks; T = hooks.THREE; J = journey;
      temp = new T.Vector3(); temp2 = new T.Vector3(); scr = { x: 0, y: 0 };
      dimCol = new T.Color(0x706b8b); warmCol = new T.Color(0xffdf9a); dustCol = new T.Color(0xfff0cc);
      // Lives beside journey.js's world group, whose child count the regression tests read
      group = new T.Group(); group.visible = false; H.island.add(group);
      for (var i = 0; i < 8; i++) {
        var sprite = new T.Sprite(new T.SpriteMaterial({ map: H.glowTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
        sprite.visible = false; group.add(sprite);
        sparks.push({ sprite: sprite, on: false, time: 0, dust: 0, lamp: 0, counted: false, from: new T.Vector3(), ctrl: new T.Vector3(), to: new T.Vector3(), col: new T.Color() });
      }
      addStyle(); prepareWisps(); buildLamps(); bindSwipes();
      return this;
    },
    screenOf: screenOf, wispAt: wispAt, lampAt: lampAt, moveWisp: moveWisp, sendLight: sendLight, ripple: ripple, term: term,
    // The lamp spends all the starlight in flight too, so those sparks arrive as a flourish only
    onLamp: function (i) {
      sparks.forEach(function (s) { s.counted = false; });
      inflight = 0; lampFx[i].pulse = 1;
    },
    onLevel: function (isActive, level, started) {
      active = isActive; group.visible = active;
      modeLabels(active);
      if (!started) startCard(level);
      clearSparks();
      if (active) settleLamps();
    },
    update: function (dt, t) {
      if (!active) return;
      updateSparks(dt);
      updateLamps(dt, t);
    },
    // Read-only inspection for regression tests
    state: function () { return { wispFade: J.wisps.map(function (w) { return w.fade; }), inflight: inflight, shown: shownCharge(), sparks: sparks.filter(function (s) { return s.on; }).length, lamps: lampFx.map(function (f) { return { on: f.on, fill: f.fill, breath: f.breath }; }) }; }
  };
})(window, document);
