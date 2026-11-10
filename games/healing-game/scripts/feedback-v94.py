"""Targeted V5 hooks for V9.4; keep the preserved upload immutable."""

replace('重新抱 20 只', '重新收集 20 点陪伴')
replace("return '小猫在这里打盹呢';", "return window.__kittens && window.__kittens.state().level === 2 ? '小猫在这里打盹呢' : '这里暂时留空，换个地方种花吧';")
# Delayed welcomes and weather are passive: they must not replace an action's guidance.
replace('setTimeout(function () { var lv = window.__kittens ? window.__kittens.state().level : 1; toast(', 'setTimeout(function () { if (window.GardenJourney && window.GardenJourney.feedbackBusy()) return; var lv = window.__kittens ? window.__kittens.state().level : 1; toast(')
replace('    W.cur = w;\n    if (WEATHER_MSG[w])', '    W.cur = w;\n    if (window.GardenJourney && window.GardenJourney.feedbackBusy()) return;\n    if (WEATHER_MSG[w])')
replace("setTimeout(function () { H.toast((sp.rare ? '✨ 稀有发光花！'", "setTimeout(function () { if (window.GardenJourney && window.GardenJourney.feedbackBusy()) return; H.toast((sp.rare ? '✨ 稀有发光花！'")
replace('setTimeout(function () { toast(MILESTONES[n], 2800); }, 600);', 'setTimeout(function () { if (!window.GardenJourney || !window.GardenJourney.feedbackBusy()) toast(MILESTONES[n], 2800); }, 600);')
replace("Sound.ending(); toast('小岛开满了花……', 3000);", "Sound.ending(); if (!window.GardenJourney || !window.GardenJourney.feedbackBusy()) toast('小岛开满了花……', 3000);")

replace('  var S = { caught: {}, total: 0, ended: false, level: 1 };', '  var S = { caught: {}, total: 0, ended: false, level: 1, companions: {} };')
replace('    S.level = d.level === 5 ? 5 :', '''    if (d.companions && typeof d.companions === 'object') KINDS.forEach(function (kind) {
      var n = d.companions[kind.id]; if (typeof n === 'number' && isFinite(n)) S.companions[kind.id] = Math.max(0, Math.min(4, Math.floor(n)));
    });
    S.level = d.level === 5 ? 5 :''')
replace("    if (again) { S.total = 0; S.ended = false; H.toast('新的一天，小猫们又醒啦 🐾', 2400); }", "    if (again) { S.total = 0; S.ended = false; S.companions = {}; H.toast('新的一天，小猫们又醒啦 🐾', 2400); }")
replace("    else { S.total = 0; S.ended = false; renderHud(false); renderCodex(); save(); }", "    else { S.total = 0; S.ended = false; S.companions = {}; renderHud(false); renderCodex(); save(); }")
replace('  var yarns = [];', '''  var yarns = [], invitedKitten = null, kitInteracted = false;
  function coatResting(kind) { return !S.ended && (S.companions[kind.id] || 0) >= 4; }
  function kittenGuide() {
    if (!H) return;
    var guide = $('kitGuide'), bubble = $('kitBubble');
    if (!guide) {
      guide = document.createElement('div'); guide.id = 'kitGuide'; guide.setAttribute('aria-live', 'polite'); $('kitHud').appendChild(guide);
      bubble = document.createElement('div'); bubble.id = 'kitBubble'; bubble.hidden = true; document.body.appendChild(bubble);
    }
    var k = invitedKitten;
    if (k && (k.dead || (k.state !== 'lure' && k.state !== 'play'))) invitedKitten = k = null;
    var msg = k ? k.kind.name + '在玩毛线球，再点它抱抱' : '轻点小猫玩毛线球 → 再点同一只抱抱';
    msg += S.ended ? ' · 慢慢陪玩' : ' · 每种最多4次，换个朋友吧';
    if (guide.textContent !== msg) guide.textContent = msg;
    bubble.hidden = level !== 2 || !k || !H.isStarted() || endingUp || (window.GardenJourney && window.GardenJourney.blocked());
    if (!bubble.hidden) {
      k.root.getWorldPosition(tmp2); tmp2.y += .9; tmp2.project(H.camera);
      bubble.hidden = tmp2.z < -1 || tmp2.z > 1;
      bubble.textContent = k.kind.name + ' · 再点抱抱 ♡';
      bubble.style.left = Math.max(96, Math.min(innerWidth - 96, (tmp2.x + 1) * innerWidth / 2)) + 'px';
      bubble.style.top = Math.max(172, Math.min(innerHeight - 145, (1 - tmp2.y) * innerHeight / 2)) + 'px';
    }
  }''')
replace("    k.state = 'lure'; k.timer = 16;", "    k.state = 'lure'; k.timer = 16; invitedKitten = k;\n    H.toast(k.kind.name + '在玩毛线球，随时再点它抱抱 ♡', 3200); kittenGuide();")
replace("    k.state = 'hug'; k.hugT = 0; k.moving = false;", "    if (k.dead || k.state === 'hug') return;\n    if (coatResting(k.kind)) { k.state = 'hug'; k.hugT = .9; H.toast(k.kind.name + '已陪玩4次，换一种毛色认识新朋友吧 ♡', 3000); return; }\n    if (invitedKitten === k) invitedKitten = null;\n    S.companions[k.kind.id] = Math.min(4, (S.companions[k.kind.id] || 0) + 1);\n    k.state = 'hug'; k.hugT = 0; k.moving = false;")
replace('''  function tapKitten(k) {
    if (k.state === 'lure' || k.state === 'play') hug(k);
    else lure(k);
  }''', '''  function tapKitten(k) {
    if (coatResting(k.kind)) { k.state = 'hug'; k.hugT = .9; H.toast(k.kind.name + '已陪玩4次，休息一下，别的朋友会来 ♡', 2800); return; }
    if (invitedKitten && invitedKitten !== k && !invitedKitten.dead) {
      H.toast(invitedKitten.kind.name + '还在等你，点它头上的「再点抱抱」提示下方 ♡', 3000); kittenGuide(); return;
    }
    if (k.state === 'lure' || k.state === 'play') hug(k);
    else lure(k);
    kittenGuide();
  }''')
replace("      if (stepTo(k, 1.1, dt)) { k.state = 'play'; k.timer = 11; }\n      if (k.timer <= 0) { dropYarn(k); k.state = 'idle'; k.timer = 1; }", "      if (stepTo(k, 1.1, dt) || k.timer <= 0) { k.state = 'play'; k.timer = Infinity; } // Ready until hugged; there is no hidden timing window.")
replace("    if (!hasGlow && Math.random() < (pity ? 0.3 : RARE_CHANCE)) return GLOW;", "    if (!hasGlow && !coatResting(GLOW) && Math.random() < (pity ? 0.3 : RARE_CHANCE)) return GLOW;")
replace('''    for (var i = 0; i < COMMON.length; i++) {
      var n = 0;''', '''    for (var i = 0; i < COMMON.length; i++) {
      if (coatResting(COMMON[i])) continue;
      var n = S.ended ? 0 : (S.companions[COMMON[i].id] || 0) * 3;''')
replace('    return best[Math.floor(Math.random() * best.length)];', '    return best.length ? best[Math.floor(Math.random() * best.length)] : GLOW;')
replace("      if (level !== 2) return;\n      for (var i = kittens.length - 1;", "      kittenGuide();\n      if (level !== 2) return;\n      for (var i = kittens.length - 1;")
replace('      var k = pickFromRay(ray.ray, 0.8);', '      kitInteracted = true;\n      var k = pickFromRay(ray.ray, 0.8);')
replace("setTimeout(function () { if (level === 2) H.toast('🐱 轻点小猫丢毛线球，再点一下抱抱它', 3200); }, 4400);", "setTimeout(function () { if (level === 2 && !kitInteracted) H.toast('🐱 轻点小猫玩毛线球，随时再点同一只抱抱', 3200); }, 4400);")
replace("      if (mode === 'net') { // a near miss makes the closest one bounce a little", "      if (mode === 'net') { // Give a useful response even when the tap misses a moving kitten.\n        H.toast(invitedKitten ? '点「再点抱抱」下方的' + invitedKitten.kind.name + '，它在等你 ♡' : '轻点小猫的身体玩毛线球，再点同一只抱抱 ♡', 2400);")
replace("    if (k.kind.rare) H.toast('✨ 星光猫窝进了怀里！算作 3 只', 2800);\n    else if (isNew) H.toast('图鉴新发现：' + k.kind.name, 2400);", "    H.toast((isNew ? '新朋友 · ' : '抱到啦 · ') + k.kind.name + '，陪伴 +' + k.kind.value + ' 点' + (coatResting(k.kind) ? ' · 它休息啦，换一种毛色吧' : ' ♡'), 3000);")
replace("' 种 · 进度 ' + S.total + ' 只 · 发光的小猫值 3 只'", "' 种 · 陪伴 ' + S.total + ' 点 · 星光猫 +3点 · 每种最多4次后换朋友'")
replace("'🐱 ' + S.total + ' · 自由陪玩' : '🐱 ' + Math.min(S.total, GOAL) + ' / ' + GOAL", "'🐱 ' + S.total + ' 点 · 自由陪玩' : '🐱 陪伴 ' + Math.min(S.total, GOAL) + ' / ' + GOAL + ' 点'")
# The original sleeping orange cat belongs to chapter two, including its invisible hit proxy.
replace('  function updateCat(dt, t) {', '''  function setAmbientLevel(n) {
    if (cat) cat.root.visible = n === 2;
    if (n !== 2) { W.rain = 0; if (rain) { rain.visible = false; rain.geometry.setDrawRange(0, 0); } }
  }
  function updateCat(dt, t) {
    setAmbientLevel(window.__kittens ? window.__kittens.state().level : 1);
    if (!cat.root.visible) return;''')
replace('    flowerSpecies: SPECIES,', '    flowerSpecies: SPECIES,\n    setAmbientLevel: setAmbientLevel,')
replace("    var two = n === 2, bh = $('bfHud'), kh = $('kitHud'), nb = netButton();", "    var two = n === 2, bh = $('bfHud'), kh = $('kitHud'), nb = netButton();\n    if (window.GardenPlay.setAmbientLevel) window.GardenPlay.setAmbientLevel(n);\n    invitedKitten = null;\n    kittens.forEach(function (k) { if (k.state === 'lure' || k.state === 'play') { dropYarn(k); k.state = 'idle'; k.timer = 1; } });\n    kittenGuide();")
replace('    var hits = ray.intersectObjects(hitList, false);', "    var hits = ray.intersectObjects(hitList.filter(function (o) { return !o.userData.gp || o.userData.gp.kind !== 'cat' || (window.__kittens && window.__kittens.state().level === 2); }), false);")
replace("    unlockAch('cat');\n  }", "    unlockAch('cat');\n    H.toast('这只小橘猫在休息，找会走动的小猫玩毛线球、再点抱抱 ♡', 3200);\n  }")
replace('  function setWeather(w) {\n    W.cur = w;', "  function setWeather(w) {\n    if (w === 'rain' && (!window.__kittens || window.__kittens.state().level !== 2)) w = 'clear';\n    W.cur = w;")
replace("    var pt = W.cur === 'petals' ? 1 : (W.cur === 'clear' ? 0.2 : 0), rt = W.cur === 'rain' ? 1 : 0;", "    var rainChapter = window.__kittens && window.__kittens.state().level === 2;\n    if (!rainChapter) W.rain = 0;\n    var pt = W.cur === 'petals' ? 1 : (W.cur === 'clear' ? 0.2 : 0), rt = rainChapter && W.cur === 'rain' ? .55 : 0;")
replace("    if (W.cur === 'rain' && W.rain > 0.8) unlockAch('rain');", "    if (rainChapter && W.cur === 'rain' && W.rain > 0.4) unlockAch('rain');")
