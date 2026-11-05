
/* 暮色浮岛 V8 — four chapters and a permanent collection journal.
 * Uses the existing scene, frame loop and audio bus. No external resources. */
(function (window, document) {
  'use strict';
  var KEY = 'healingGarden.journey.v1', H, T, world, decoration, wisps = [], lamps = [], ornaments = [];
  var time = 0, poll = 0, active = false, tab = 'journey', lastFocus = null, retryWarning = false;
  var temp, color, oldRank = 0, L3 = null, FX = null, VG = null, CH = null, failing = {}, retrySave = null;
  var TYPES = [
    { id: 'dew', name: '露珠萤', color: 0xa9efd8, note: '像清晨草叶上的露珠' },
    { id: 'peach', name: '桃霞萤', color: 0xffb3cd, note: '把最后一缕晚霞藏在翅间' },
    { id: 'amber', name: '琥珀萤', color: 0xffd58a, note: '暖暖的光，像一盏小灯' },
    { id: 'moon', name: '月白萤', color: 0xe9f6ff, note: '从月亮的倒影里飞来' },
    { id: 'violet', name: '紫梦萤', color: 0xc5adff, note: '载着一个尚未醒来的梦' },
    { id: 'tide', name: '潮蓝萤', color: 0x89d7ff, note: '带来云海深处的回声' }
  ];
  var RANKS = [
    { xp: 0, name: '初来访客' }, { xp: 20, name: '栽花的人' },
    { xp: 60, name: '云间旅伴' }, { xp: 120, name: '星灯守望' }, { xp: 190, name: '浮岛园主' }
  ];
  var S = { version: 1, caught: {}, charge: 0, lamps: [false, false, false], completed: [],
    seen: { flowers: [], butterflies: [], kittens: [] }, decor: [true, true, true], stars: 0, joys: 0, memories: [], chimes: window.ChimeRules.normalize(null) };
  function $(id) { return document.getElementById(id); }
  function finite(v, max) { return typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0; }
  function ids(list) { return list.map(function (item) { return item.id; }); }
  function validList(value, allowed) {
    if (!Array.isArray(value)) return [];
    return allowed.filter(function (v) { return value.indexOf(v) !== -1; });
  }
  function load() {
    var d;
    try { d = JSON.parse(window.localStorage.getItem(KEY) || 'null'); } catch (e) { return; }
    if (!d || typeof d !== 'object') return;
    TYPES.forEach(function (sp) { S.caught[sp.id] = finite(d.caught && d.caught[sp.id], 99999); });
    S.charge = finite(d.charge, 4);
    S.completed = validList(d.completed, [1, 2, 3]);
    S.chimes = window.ChimeRules.normalize(d.chimes);
    if (S.chimes.round === 3) S.completed.push(4);
    if (Array.isArray(d.lamps)) S.lamps = [0, 1, 2].map(function (n) { return d.lamps[n] === true; });
    if (S.lamps.every(Boolean) && S.completed.indexOf(3) < 0) S.completed.push(3);
    S.stars = finite(d.stars, 60); S.joys = finite(d.joys, 99999); // voyage.js fills in anything an old save lacks
    S.memories = validList(d.memories, ids(TYPES).concat(['lamp0', 'lamp1', 'lamp2', 'voyage']));
    if (Array.isArray(d.decor)) S.decor = [0, 1, 2].map(function (n) { return d.decor[n] !== false; });
    if (d.seen) {
      S.seen.flowers = validList(d.seen.flowers, ids(window.GardenPlay.flowerSpecies));
      S.seen.butterflies = validList(d.seen.butterflies, ids(window.__bf.species));
      S.seen.kittens = validList(d.seen.kittens, ids(window.__kittens.kinds));
    }
  }
  // Each save source reports for itself, so one succeeding doesn't hide another's failure
  function showSaveWarning() {
    retryWarning = Object.keys(failing).length > 0;
    var el = $('starSaveWarning'); if (el) el.hidden = !retryWarning;
  }
  function saveWarning(source) { failing[source || 'journey'] = true; showSaveWarning(); }
  function saveOk(source) { delete failing[source || 'journey']; showSaveWarning(); }
  function save() {
    if (retrySave !== null) { clearTimeout(retrySave); retrySave = null; }
    try { window.localStorage.setItem(KEY, JSON.stringify(S)); saveOk(); return true; }
    catch (e) { saveWarning(); if (!document.hidden) retrySave = setTimeout(save, 3000); return false; }
  }
  load();
  function done(n) { return S.completed.indexOf(n) !== -1; }
  function complete(n) { if (done(n)) return false; S.completed.push(n); return true; }
  function unlocked(n) {
    if (n === 1) return true;
    if (n === 2) return done(1) || window.__bf.state().ended || window.__kittens.state().unlocked;
    if (n === 4) return done(3);
    return n === 3 && (done(2) || done(3) || window.__kittens.state().ended || window.__kittens.state().total >= 20);
  }
  function starsSeen() { return TYPES.filter(function (sp) { return S.caught[sp.id] > 0; }).length; }
  function xp() { return (S.seen.flowers.length + S.seen.butterflies.length + S.seen.kittens.length + starsSeen() + S.chimes.found.length) * 5 + S.completed.length * 20; }
  function rank() { var x = xp(), n = 0; while (n < RANKS.length - 1 && x >= RANKS[n + 1].xp) n++; return n; }
  function litCount() { return S.lamps.filter(Boolean).length; }
  function level() { return window.__kittens.state().level; }
  function sync(quiet) {
    var changed = false, bf = window.__bf.state(), cats = window.__kittens.state();
    function merge(key, incoming) {
      incoming.forEach(function (id) { if (S.seen[key].indexOf(id) < 0) { S.seen[key].push(id); changed = true; } });
    }
    merge('flowers', window.GardenPlay.collection());
    merge('butterflies', ids(window.__bf.species).filter(function (id) { return bf.caught[id] > 0; }));
    merge('kittens', ids(window.__kittens.kinds).filter(function (id) { return cats.caught[id] > 0; }));
    if (bf.ended || bf.total >= 30 || cats.unlocked) changed = complete(1) || changed;
    if (cats.ended || cats.total >= 20) changed = complete(2) || changed;
    if (changed) { save(); updateRewards(); if ($('journeyPanel') && !$('journeyPanel').hidden) render(); }
    // Only move oldRank once the toast can show, so a rank gained behind a dialog waits for it to close.
    if (quiet || !H.isStarted() || blocked()) return;
    var r = rank();
    if (r > oldRank) H.toast('成长了 ✧ ' + RANKS[r].name + ' · 去手账看看新的收获', 3200);
    oldRank = r;
  }
  function blocked() {
    if (!API.ready) return false;
    if (L3 && L3.isRunning()) return true;
    if (CH && CH.isModalOpen()) return true;
    if (!$('journeyPanel').hidden || !$('starEnding').hidden) return true;
    var overlays = ['start', 'ending', 'bfEnding', 'kitEnding', 'bfCodex', 'gpBook', 'kitLevels'];
    return overlays.some(function (id) { var el = $(id); return el && !el.classList.contains('hidden'); });
  }
  function chime(big) {
    var a = window.GardenAudio;
    if (a && a.melody) a.melody(big ? [0, 2, 4, 7, 9] : [2, 4, 7], big ? .14 : .07, true);
  }
  function burst(pos, hex) {
    color.setHex(hex);
    for (var i = 0; i < 14; i++) {
      var a = i / 14 * Math.PI * 2;
      H.emitSpark(pos.x, pos.y, pos.z, Math.cos(a) * .6, .3 + Math.random() * .5, Math.sin(a) * .6, 1.2, .12, color);
    }
  }
  function makeWorld() {
    world = new T.Group(); H.island.add(world);
    decoration = new T.Group(); H.island.add(decoration);
    var gemGeo = new T.OctahedronGeometry(.17), wingGeo = new T.SphereGeometry(.13, 6, 4);
    TYPES.forEach(function (sp, i) {
      var g = new T.Group(), mat = new T.MeshBasicMaterial({ color: sp.color });
      var gem = new T.Mesh(gemGeo, mat); g.add(gem);
      var wings = [];
      [-1, 1].forEach(function (side) {
        var m = new T.Mesh(wingGeo, mat); m.scale.set(1.5, .22, 1); m.position.x = side * .26; g.add(m); wings.push(m);
      });
      var glow = new T.Sprite(new T.SpriteMaterial({ map: H.glowTex, color: sp.color, transparent: true, opacity: .8, depthWrite: false, blending: T.AdditiveBlending }));
      glow.scale.set(1.4, 1.4, 1); g.add(glow); world.add(g);
      wisps.push({ g: g, wings: wings, glow: glow, type: i, slot: i, phase: i * Math.PI / 3, cooldown: 0 });
    });
    var stone = new T.MeshLambertMaterial({ color: 0xa4b9bd }), gold = new T.MeshLambertMaterial({ color: 0xd5bb86 });
    var baseGeo = new T.CylinderGeometry(.38, .48, .16, 8), stemGeo = new T.CylinderGeometry(.12, .2, .55, 8);
    [[-3.7, .7], [0, 3.8], [3.7, .7]].forEach(function (p) {
      var g = new T.Group(); g.position.set(p[0], H.TOP_Y, p[1]);
      var base = new T.Mesh(baseGeo, stone); base.position.y = .08; g.add(base);
      var stem = new T.Mesh(stemGeo, stone); stem.position.y = .42; g.add(stem);
      var top = new T.Mesh(new T.TorusGeometry(.31, .04, 4, 16), gold); top.position.y = .91; g.add(top);
      var core = new T.Mesh(gemGeo, new T.MeshBasicMaterial({ color: 0x706b8b })); core.position.y = .91; g.add(core);
      var halo = new T.Sprite(new T.SpriteMaterial({ map: H.glowTex, color: 0xffdca4, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: T.AdditiveBlending }));
      halo.position.y = .91; halo.scale.set(2, 2, 1); g.add(halo); world.add(g);
      lamps.push({ g: g, core: core, halo: halo });
    });
    // Rewards are allocated once, then toggled. Replaying never adds more meshes.
    var wind = new T.Group(); wind.position.set(window.GardenClip.chime.x, H.TOP_Y + 1, window.GardenClip.chime.z); // 2-tall pole, foot on the grass and clear of the pond stones
    var pole = new T.Mesh(new T.CylinderGeometry(.035, .035, 2, 5), gold); wind.add(pole);
    var bar = new T.Mesh(new T.CylinderGeometry(.035, .035, 1, 5), gold); bar.rotation.z = Math.PI / 2; bar.position.y = .9; wind.add(bar);
    for (var j = 0; j < 3; j++) { var bell = new T.Mesh(gemGeo, new T.MeshBasicMaterial({ color: TYPES[j].color })); bell.position.set((j - 1) * .32, .55 - j * .12, j === 1 ? .22 : 0); wind.add(bell); }
    ornaments.push(wind); decoration.add(wind);
    var path = new T.Group(), pebble = new T.SphereGeometry(.1, 5, 3);
    for (j = 0; j < 10; j++) { var a = j / 10 * Math.PI, dot = new T.Mesh(pebble, gold); dot.scale.y = .35; dot.position.set(Math.cos(a) * 3.1, H.TOP_Y + .04, Math.sin(a) * 3.1); path.add(dot); }
    ornaments.push(path); decoration.add(path);
    var crown = new T.Group(); crown.position.set(0, H.TOP_Y + 3.2, 0);
    var hoop = new T.Mesh(new T.TorusGeometry(1.1, .025, 4, 40), new T.MeshBasicMaterial({ color: 0xd4cbff })); hoop.rotation.x = Math.PI / 2; crown.add(hoop);
    for (j = 0; j < 5; j++) { var star = new T.Mesh(gemGeo, gold), angle = j * Math.PI * 2 / 5; star.position.set(Math.cos(angle) * 1.1, 0, Math.sin(angle) * 1.1); star.scale.set(.45, .45, .45); crown.add(star); }
    ornaments.push(crown); decoration.add(crown); updateRewards(); updateLamps();
  }
  function updateRewards() {
    ornaments.forEach(function (g, i) { g.visible = rank() >= i + 1 && S.decor[i]; });
    if (ornaments[0]) window.GardenClip.chime.on = ornaments[0].visible; // sync() can run before makeWorld()
    if (API.ready) window.GardenClip.syncFlowers(H.flowers, level());
  }
  function updateLamps() {
    if (FX) return; // level3fx.js fades the lamps every frame
    lamps.forEach(function (l, i) { l.core.material.color.setHex(S.lamps[i] ? 0xffdf9a : 0x706b8b); l.halo.material.opacity = S.lamps[i] ? .8 : .1; });
  }
  function collect(w) {
    if (w.cooldown > 0 || !w.g.visible) return false;
    if (!done(3) && S.charge >= 4) { H.toast('星光装满了，轻点发亮的星灯把光送过去 ✦', 2200); return true; }
    var sp = TYPES[w.type], fresh = !S.caught[sp.id];
    S.caught[sp.id] = Math.min(99999, (S.caught[sp.id] || 0) + 1);
    if (!done(3)) S.charge++;
    w.cooldown = 2.2; w.g.visible = false;
    w.g.getWorldPosition(temp); burst(temp, sp.color); if (FX) FX.sendLight(temp, sp.color, w.type); if (L3) L3.catchSound(w.type, litCount()); else chime(false);
    var wish = VG && VG.onCatch(w, temp);
    save(); updateRewards(); renderHud();
    H.toast((wish ? '灯心欢喜 ✧ ' : '') + (fresh ? '新朋友 · ' + sp.name + '，已收入星萤图鉴' : (done(3) ? sp.name + '在掌心轻轻闪了闪' : (S.charge >= 4 ? '星光满了，轻点发亮的星灯 ✦' : '星光 +1 · ' + S.charge + ' / 4'))), 1800);
    return true;
  }
  function light(index) {
    if (!active || !H.isStarted() || blocked() || index < 0 || index > 2) return;
    if (S.lamps[index]) { H.toast(litCount() === 3 ? '三座星灯都亮着，云海有了归途 ✦' : '这座星灯已经亮了，去点亮下一座吧'); return; }
    if (S.charge < 4) { H.toast('还需要 ' + (4 - S.charge) + ' 点星光 · 轻点或划过星萤'); return; }
    S.charge -= 4; S.lamps[index] = true; if (FX) FX.onLamp(index);
    lamps[index].core.getWorldPosition(temp); burst(temp, 0xffd58a); if (L3) L3.lampSound(litCount()); else chime(true);
    if (litCount() === 3) complete(3);
    if (VG) VG.onLamp(index);
    save(); updateRewards(); updateLamps(); renderHud();
    if (done(3)) { if (L3) L3.startFinale(index, showEnding); else showEnding(); } else H.toast('第 ' + litCount() + ' 座星灯亮起来了 ✧', 2600);
  }
  function renderHud() {
    if (!$('starHud')) return;
    $('starCount').textContent = done(3) ? '星灯湾 · 自由拾光' : '星灯 ' + litCount() + ' / 3';
    $('starHint').textContent = done(3) ? '星萤图鉴 ' + starsSeen() + ' / 6' : '星光 ' + S.charge + ' / 4 · ' + (S.charge >= 4 ? '点 ' + (S.lamps.indexOf(false) + 1) + ' 号星灯' : '轻点或划过星萤');
    [0, 1, 2].forEach(function (n) { var b = $('starLamp' + n); b.classList.toggle('lit', S.lamps[n]); b.classList.toggle('ready', S.charge >= 4 && S.lamps.indexOf(false) === n); b.textContent = (n + 1) + (S.lamps[n] ? ' ✦' : ' ◇'); b.setAttribute('aria-label', (n + 1) + ' 号星灯' + (S.lamps[n] ? '已点亮' : '，需要4点星光')); });
    if (VG) VG.renderHud();
  }
  function setModal(id, open) {
    $(id).hidden = !open;
    if (open) { lastFocus = document.activeElement; $(id).querySelector('button').focus(); }
    else if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function open(next) { if (!API.ready || (L3 && L3.isRunning())) return; if (CH) CH.cancelPreview(); sync(true); tab = next || 'journey'; render(); setModal('journeyPanel', true); }
  function showEnding() { setModal('starEnding', true); }
  function nightLevel() { return L3 ? L3.night() : .82; }
  function onLevel(n) {
    active = n === 3; world.visible = active; $('starHud').hidden = !active;
    window.GardenClip.syncFlowers(H.flowers, n);
    document.body.setAttribute('data-garden-level', n);
    if (L3) L3.onLevel(active, litCount() === 3);
    if (FX) FX.onLevel(active, n, H.isStarted());
    if (VG) VG.onLevel(active);
    if (CH) CH.onLevel(n);
    if (active) H.setNightTarget(nightLevel()); else if (H.refresh) H.refresh();
    renderHud();
  }
  function go(n) {
    sync(true);
    if (!unlocked(n)) return;
    setModal('journeyPanel', false); window.__kittens.setLevel(n);
    if (n === 3) H.toast(hint(), 3500);
    if (n === 4 && CH) H.toast(CH.hint(), 3500);
  }
  function render() {
    if (!$('journeyContent')) return;
    var body = '', bf = window.__bf.state(), cats = window.__kittens.state(), r = rank(), experience = xp();
    document.querySelectorAll('[data-jr-tab]').forEach(function (el) { el.setAttribute('aria-selected', el.getAttribute('data-jr-tab') === tab ? 'true' : 'false'); });
    if (tab === 'journey') {
      body = '<p class="jr-note">每一程都留下一点温柔。完成上一关，下一座小岛便会亮起。</p>';
      var chapters = [
        ['蝴蝶来信', '轻点或划过花间的蝴蝶，收集 30 点，解锁猫咪伙伴。', Math.min(30, bf.total) + ' / 30'],
        ['猫咪午后', '先丢毛线球，再抱抱小猫。收集 20 点，解锁星灯湾。', Math.min(20, cats.total) + ' / 20'],
        ['星灯夜航', '轻点星萤积攒星光，每 4 点亮一座灯。让三盏灯照亮云海。', litCount() + ' / 3 座灯'],
        ['晨风铃谷', '听风铃、看编号，依次奏回三段旋律。可查看乐谱，没有限时。', S.chimes.round + ' / 3 乐章']
      ];
      chapters.forEach(function (c, i) {
        var n = i + 1, current = level() === n, allowed = unlocked(n);
        body += '<section class="jr-row' + (current ? ' current' : '') + '"><h3>0' + n + ' · ' + c[0] + '</h3><p>' + c[1] + '</p><p>' + (done(n) ? '✧ 已完成 · ' : '') + c[2] + '</p><button data-jr-go="' + n + '"' + (allowed ? '' : ' disabled') + '>' + (current ? '继续这一程' : (allowed ? '前往' : '完成上一关解锁')) + '</button></section>';
      });
      if (VG && unlocked(3)) body += VG.journal();
      body += '<p class="jr-note">切换关卡保留所有进度；收藏与成长永久累计。V8.0 · 晨风铃谷</p>';
    } else if (tab === 'collection') {
      var books = [
        ['风铃音符', window.ChimeRules.tones, S.chimes.found, '♪'],
        ['星萤图鉴', TYPES, TYPES.filter(function (sp) { return S.caught[sp.id] > 0; }).map(function (sp) { return sp.id; }), '✦'],
        ['花间手记', window.GardenPlay.flowerSpecies, S.seen.flowers, '✿'],
        ['蝴蝶来信', window.__bf.species, S.seen.butterflies, '🦋'],
        ['猫咪朋友', window.__kittens.kinds, S.seen.kittens, '🐾']
      ];
      books.forEach(function (book) {
        body += '<h3>' + book[0] + ' <small>' + book[2].length + ' / ' + book[1].length + '</small></h3><div class="jr-grid">';
        book[1].forEach(function (sp) { var got = book[2].indexOf(sp.id) >= 0; body += '<div class="jr-item' + (got ? '' : ' locked') + '" style="--ink:#' + ('000000' + (sp.color || sp.c1 || sp.fur || 0xffffff).toString(16)).slice(-6) + '"><span>' + (got ? book[3] : '·') + '</span>' + (got ? sp.name : '尚未遇见') + (sp.note ? '<br><small>' + (got ? sp.note : (book[0] === '风铃音符' ? '晨风铃谷中等你发现' : '星灯湾中等你发现')) + '</small>' : '') + '</div>'; });
        body += '</div>';
      });
    } else {
      var next = RANKS[r + 1], fraction = next ? (experience - RANKS[r].xp) / (next.xp - RANKS[r].xp) : 1;
      body = '<h2>Lv.' + (r + 1) + ' · ' + RANKS[r].name + '</h2><div class="jr-meter"><i style="width:' + Math.min(100, fraction * 100) + '%"></i></div><p>' + experience + ' 成长星光' + (next ? ' · 再收集 ' + (next.xp - experience) + ' 点成为「' + next.name + '」' : ' · 小岛已记住你的每一份温柔') + '</p><p class="jr-note">每发现一个新物种 +5；每关首次完成 +20。重复收集与重玩不会重复发放成长星光。</p>';
      ['贝壳风铃', '星砂小径', '云上星环'].forEach(function (name, i) { var owned = r >= i + 1; body += '<div class="jr-reward"><div>' + name + '<br><small class="jr-note">Lv.' + (i + 2) + ' · ' + (owned ? '已获得' : '尚未解锁') + '</small></div><label><input type="checkbox" data-jr-decor="' + i + '"' + (S.decor[i] && owned ? ' checked' : '') + (owned ? '' : ' disabled') + '>摆放</label></div>'; });
      body += '<p class="jr-note">老版本的花卉、蝴蝶与猫咪收藏会自动计入。所有奖励都来自游玩，无需付费或每日签到。</p>';
    }
    $('journeyContent').innerHTML = body;
  }
  function buildUI() {
    var panel = document.createElement('div'); panel.id = 'journeyPanel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'journeyTitle');
    panel.innerHTML = '<div class="jr-card"><div class="jr-head"><div><div class="jr-eyebrow">TWILIGHT ISLES · JOURNAL</div><h2 id="journeyTitle">浮岛手账</h2></div><button class="jr-close" id="journeyClose" aria-label="合上手账">×</button></div><div class="jr-tabs" role="tablist" aria-label="手账分类"><button role="tab" data-jr-tab="journey">旅程</button><button role="tab" data-jr-tab="collection">收藏</button><button role="tab" data-jr-tab="growth">成长</button></div><div id="journeyContent"></div></div>';
    document.body.appendChild(panel);
    $('journeyClose').onclick = function () { setModal('journeyPanel', false); };
    panel.addEventListener('click', function (e) {
      if (e.target === panel) setModal('journeyPanel', false);
      var key = e.target.getAttribute('data-jr-tab'), n = e.target.getAttribute('data-jr-go');
      if (key) { tab = key; render(); panel.querySelector('.jr-card').scrollTop = 0; }
      if (n) go(+n);
    });
    panel.addEventListener('change', function (e) {
      var n = e.target.getAttribute('data-jr-decor');
      if (n !== null && +n >= 0 && +n <= 2 && rank() >= +n + 1) { S.decor[+n] = e.target.checked; save(); updateRewards(); }
    });
    var hud = document.createElement('div'); hud.id = 'starHud'; hud.hidden = true; hud.className = 'glass';
    hud.innerHTML = '<strong id="starCount"></strong><div id="starHint"></div><div id="starLampButtons"><button id="starLamp0"></button><button id="starLamp1"></button><button id="starLamp2"></button></div>';
    $('topbar').insertBefore(hud, $('topbar').firstChild);
    [0, 1, 2].forEach(function (n) { $('starLamp' + n).onclick = function () { light(n); }; });
    var ending = document.createElement('div'); ending.id = 'starEnding'; ending.hidden = true;
    ending.setAttribute('role', 'dialog'); ending.setAttribute('aria-modal', 'true'); ending.setAttribute('aria-labelledby', 'starEndTitle');
    ending.innerHTML = '<div class="jr-card"><div class="jr-eyebrow">CHAPTER 03 · COMPLETE</div><h2 id="starEndTitle">为晚归的人留一盏灯</h2><p>三点暖光在云海中相望。<br>星萤安静下来，小岛有了归途。<br>今晚，你也是别人的一点光。</p><p class="jr-note">首次完成 +20 成长星光 · 星萤图鉴与灯火已保存</p><button class="jr-action" id="starStay">留下来，慢慢拾光</button><button class="jr-action" id="starJournal">翻开成长手账</button></div>';
    document.body.appendChild(ending);
    $('starStay').onclick = function () { setModal('starEnding', false); };
    $('starJournal').onclick = function () { setModal('starEnding', false); open('growth'); };
    var warning = document.createElement('div'); warning.id = 'starSaveWarning'; warning.hidden = !retryWarning; warning.setAttribute('role', 'status');
    warning.textContent = '浏览器未能保存进度，请先不要关闭页面；检查浏览器存储空间或隐私设置。'; document.body.appendChild(warning);
    var next = document.createElement('button'); next.className = 'btn'; next.id = 'starNext'; next.textContent = '第三关：星灯夜航';
    next.onclick = function () { $('kitStay').click(); go(3); };
    $('kitEnding').querySelector('.btns').insertBefore(next, $('kitStay'));
    $('gpBookBtn').addEventListener('click', function (e) { if (active || level() === 4) { e.stopImmediatePropagation(); open('collection'); } }, true);
    document.addEventListener('keydown', function (e) {
      var modal = !$('journeyPanel').hidden ? panel : (!$('starEnding').hidden ? ending : null);
      if (!modal) return;
      if (e.key === 'Escape') { e.preventDefault(); setModal(modal.id, false); }
      if (e.key === 'Tab') {
        var focusable = modal.querySelectorAll('button:not(:disabled),input:not(:disabled)'), first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) { first.focus(); e.preventDefault(); }
      }
    });
  }
  function update(dt, t) {
    time = t;
    if (t >= poll) { poll = t + .5; sync(false); }
    if (ornaments[0].visible) ornaments[0].rotation.z = Math.sin(t * .7) * .025;
    if (ornaments[2].visible) ornaments[2].rotation.y = t * .08;
    if (L3) L3.update(dt, t);
    if (CH) CH.update(dt, t);
    if (!active) return;
    H.setNightTarget(nightLevel());
    wisps.forEach(function (w) {
      w.cooldown = Math.max(0, w.cooldown - dt); w.g.visible = w.cooldown === 0;
      if (FX) FX.moveWisp(w, dt, t);
    });
    if (FX) FX.update(dt, t);
    if (VG) VG.update(dt, t);
  }
  function tap(ray, mode) {
    if (!FX || !canPlay()) return false;
    // Screen-space hit targets stay usable on narrow phones and at every zoom.
    var p = FX.screenOf(ray), lamp = FX.lampAt(p.x, p.y), wisp = FX.wispAt(p.x, p.y);
    if (wisp) return collect(wisp);
    if (lamp >= 0 && !S.lamps[lamp] && S.charge >= 4) { light(lamp); return true; }
    // Other modes keep their own use of the ground around a lamp that can't be lit yet
    if (lamp >= 0 && mode === 'net') { light(lamp); return true; }
    return false; // nothing here: let the cat and birds in gameplay.js answer
  }
  function canPlay() { return active && H.isStarted() && !blocked(); }
  function hint() {
    if (done(3)) return '三座星灯都亮着 · 留下来慢慢拾光';
    if (S.charge >= 4) return '星光满了 · 轻点发亮的星灯';
    return '轻点或划过星萤，集满 4 点星光点亮星灯 · 没有时间限制';
  }
  var API = window.GardenJourney = { ready: false, open: open, blocked: blocked, unlocked: unlocked, onLevel: onLevel, saveWarning: saveWarning, saveOk: saveOk, hint: hint };
  var GP = window.GardenPlay, baseInit = GP.init, baseUpdate = GP.update, baseTap = GP.onTap;
  GP.init = function (hooks) {
    baseInit.apply(GP, arguments); H = hooks; T = hooks.THREE;
    temp = new T.Vector3(); color = new T.Color();
    sync(true); oldRank = rank(); makeWorld(); buildUI();
    if (window.__level3) L3 = window.__level3.init(hooks, lamps);
    if (window.__level3fx) FX = window.__level3fx.init(hooks, { wisps: wisps, lamps: lamps, lit: function (i) { return S.lamps[i]; }, charge: function () { return S.charge; }, allLit: function () { return litCount() === 3; }, canPlay: canPlay, collect: collect });
    if (window.__voyage) VG = window.__voyage.init(hooks, { progress: S, types: TYPES, wisps: wisps, lamps: lamps, save: save, canPlay: canPlay });
    if (window.ChimeChapter) CH = window.ChimeChapter.init(hooks, { progress: S, blocked: blocked, complete: complete, open: open, go: go,
      changed: function () { save(); updateRewards(); if (!$('journeyPanel').hidden) render(); } });
    API.ready = true; onLevel(level());
  };
  GP.update = function (dt, t, night) { baseUpdate.apply(GP, arguments); update(dt, t); };
  GP.onTap = function (ray, hit, mode) {
    if (CH && level() === 4 && CH.tap(ray)) return true;
    if (tap(ray, mode)) return true;
    var used = baseTap.apply(GP, arguments);
    if (!used && FX && active && mode === 'net') FX.ripple(ray);
    return used;
  };
  window.addEventListener('pagehide', function () { if (API.ready) { sync(true); save(); } });
  document.addEventListener('visibilitychange', function () { if (API.ready) { sync(true); save(); } });
  // Read-only inspection for regression tests; rewards still require real input handlers.
  window.__journey = {
    state: function () { return JSON.parse(JSON.stringify({ progress: S, xp: xp(), rank: rank() + 1, level: level(), active: active, worldChildren: world ? world.children.length : 0 })); },
    targets: function () { return wisps.filter(function (w) { return w.g.visible && !w.cooldown; }).map(function (w) { w.g.getWorldPosition(temp); temp.project(H.camera); return { id: TYPES[w.type].id, x: (temp.x + 1) * innerWidth / 2, y: (1 - temp.y) * innerHeight / 2, front: temp.z < 1 }; }); }
  };
})(window, document);
