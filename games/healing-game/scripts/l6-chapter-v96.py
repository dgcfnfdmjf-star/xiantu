"""Level-6 chapter 「雪灯归林」 (V9.6 working build only), applied after the V9.5 release HTML is frozen.
Snowy winter night on the SAME shared floating island; see src/snow-chapter.js. Uses the strict replace() of build.py."""

# Rules load with the other rules modules (journey.js reads window.SnowRules at load time).
replace("/* Journey save guard. A save that cannot be read is kept aside",
        (ROOT / 'src/snow-rules.js').read_text() + "\n/* Journey save guard. A save that cannot be read is kept aside")
# Journey: save field, completion, unlock after level 5, xp, chapters list, level switching, taps, update.
replace("lotus: window.LotusRules.normalize(null) };", "lotus: window.LotusRules.normalize(null), snow: window.SnowRules.normalize(null) };")
replace("    S.lotus = window.LotusRules.normalize(d.lotus);\n",
        "    S.lotus = window.LotusRules.normalize(d.lotus);\n    S.snow = window.SnowRules.normalize(d.snow);\n")
replace("    if (S.lotus.found.length === 6) S.completed.push(5);\n",
        "    if (S.lotus.found.length === 6) S.completed.push(5);\n    if (window.SnowRules.finished(S.snow)) S.completed.push(6);\n")
replace("    if (n === 5) return done(4);\n", "    if (n === 5) return done(4);\n    if (n === 6) return done(5);\n")
replace("S.chimes.found.length + S.lotus.found.length) * 5", "S.chimes.found.length + S.lotus.found.length + S.snow.lit.length + S.snow.home.length) * 5")
replace("L3 = null, FX = null, VG = null, CH = null, LC = null,", "L3 = null, FX = null, VG = null, CH = null, LC = null, SC = null,")
replace("    if (LC && LC.isModalOpen()) return true;\n", "    if (LC && LC.isModalOpen()) return true;\n    if (SC && SC.isModalOpen()) return true;\n")
replace("    if (LC && LC.beforeLevel) LC.beforeLevel(n);\n", "    if (LC && LC.beforeLevel) LC.beforeLevel(n);\n    if (SC && SC.beforeLevel) SC.beforeLevel(n);\n")
replace("    if ((n === 4 || n === 5) && H.resetMode) H.resetMode();\n", "    if ((n === 4 || n === 5 || n === 6) && H.resetMode) H.resetMode();\n")
replace("    if (LC) LC.onLevel(n);\n", "    if (LC) LC.onLevel(n);\n    if (SC) SC.onLevel(n);\n")
replace("    if (n === 5 && LC) H.toast(LC.hint(), 3500);\n", "    if (n === 5 && LC) H.toast(LC.hint(), 3500);\n    if (n === 6 && SC) H.toast(SC.hint(), 3500);\n")
replace("        ['月汐莲湾', '接月露、转月镜、引光、合光、铺叶舟、回应晚安，连成一条月光归途。', S.lotus.found.length + ' / 6 朵莲花']\n",
        "        ['月汐莲湾', '接月露、转月镜、引光、合光、铺叶舟、回应晚安，连成一条月光归途。', S.lotus.found.length + ' / 6 朵莲花'],\n"
        "        ['雪灯归林', '雪夜的浮岛上，点亮小路边的雪灯，送迷路的小猫回到亮着窗的小木屋。', window.SnowRules.progressText(S.snow)]\n")
replace("切换关卡保留所有进度；收藏与成长永久累计。V9.5 · 月汐莲湾", "切换关卡保留所有进度；收藏与成长永久累计。V9.6 · 雪灯归林")
replace("if (active || level() === 4 || level() === 5) { e.stopImmediatePropagation(); open('collection'); }",
        "if (active || level() === 4 || level() === 5 || level() === 6) { e.stopImmediatePropagation(); open('collection'); }")
replace("    if (LC) LC.update(dt, t);\n", "    if (LC) LC.update(dt, t);\n    if (SC) SC.update(dt, t);\n")
replace("    API.ready = true; onLevel(level());\n",
        "    if (window.SnowChapter) SC = window.SnowChapter.init(hooks, { progress: S, blocked: blocked, complete: complete, open: open, go: go,\n"
        "      changed: function () { save(); updateRewards(); if (!$('journeyPanel').hidden) render(); } });\n"
        "    API.ready = true; onLevel(level());\n")
replace("    if (LC && level() === 5) { LC.tap(ray); return true; }\n",
        "    if (LC && level() === 5) { LC.tap(ray); return true; }\n    if (SC && level() === 6) { SC.tap(ray); return true; }\n")
# Kittens' level gate (S.level, setLevel whitelist, unlock check, ?level= start) accepts 6 once level 5 is complete.
replace("S.level = d.level === 5 ? 5 :", "S.level = d.level === 6 ? 6 : d.level === 5 ? 5 :")
replace("n !== 3 && n !== 4 && n !== 5)", "n !== 3 && n !== 4 && n !== 5 && n !== 6)")
replace("    if (n === 5 && (!window.GardenJourney || !window.GardenJourney.unlocked(5))) return;\n",
        "    if (n === 6 && (!window.GardenJourney || !window.GardenJourney.unlocked(6))) return;\n"
        "    if (n === 5 && (!window.GardenJourney || !window.GardenJourney.unlocked(5))) return;\n")
replace("setLevel(want === 5 &&", "setLevel(want === 6 && window.GardenJourney && window.GardenJourney.unlocked(6) ? 6 : want === 5 &&")
# Labels, toasts and the BGM theme.
replace("nb.innerHTML = n === 5 ?", "nb.innerHTML = n === 6 ? '❄<span>点灯</span>' : n === 5 ?")
replace("bk.textContent = n === 5 ?", "bk.textContent = n === 6 ? '📖 雪灯' : n === 5 ?")
replace("H.toast(n === 5 ? window.LotusChapter.hint()", "H.toast(n === 6 ? window.SnowChapter.hint() : n === 5 ? window.LotusChapter.hint()")
replace("toast(lv === 5 ?", "toast(lv === 6 ? '欢迎来到雪灯归林 ❄ 小屋亮着灯' : lv === 5 ?")
replace("window.__kittens.state().level === 5 ? window.LotusChapter.hint()", "window.__kittens.state().level === 6 ? window.SnowChapter.hint() : window.__kittens.state().level === 5 ? window.LotusChapter.hint()")
replace("5: 'moonlotus' }", "5: 'moonlotus', 6: 'snowlantern' }")
# The chapter script registers its BGM through window.__music2 and must exist before GardenPlay.init runs.
MAIN6 = "<script>\n(function () {\n  'use strict';\n\n  /* ------------------------------------------------------------------\n   * Config / caps"
replace(MAIN6, '<style>\n' + (ROOT / 'src/snow-chapter.css').read_text() + '\n</style>\n<script>\n' + (ROOT / 'src/snow-chapter.js').read_text() + '\n</script>\n' + MAIN6)
# Level-6 kittens reuse the four local Blender cats and their Walk clip (cat-models.js). Two small post-freeze
# entry points: snowCat(kind, root, height) -> Promise<owner|null>, and snowWalk(owner, moving, speed, dt).
replace("    registerAmbient: function (cat) { ambient = cat; attachAmbient(); },\n",
        "    registerAmbient: function (cat) { ambient = cat; attachAmbient(); },\n"
        "    snowCat: function (kind, root, height) {\n"
        "      if (!COATS[kind]) return Promise.resolve(null);\n"
        "      return load(kind).then(function (template) {\n"
        "        if (!template || !root.parent) return null;\n"
        "        var owner = { root: root, size: 1, phase: Math.random() * 6.28, state: 'walk', moving: false, crouch: 0, curl: 0 };\n"
        "        try { createVisual(owner, template, height, true); return owner; } catch (e) { return null; }\n"
        "      });\n"
        "    },\n"
        "    snowWalk: function (owner, moving, speed, dt) { if (!owner || !owner.catMixer) return; owner.moving = moving; owner.catWalkSpeed = speed; poseWalk(owner, dt); },\n")
# Collection book: 雪灯手记 lists the four kittens brought home.
replace("        ['月莲手记', window.LotusRules.blooms, S.lotus.found, '☾'],\n",
        "        ['雪灯手记', window.SnowRules.kittens, S.snow.home, '❄'],\n        ['月莲手记', window.LotusRules.blooms, S.lotus.found, '☾'],\n")
replace("(book[0] === '月莲手记' ? '月汐莲湾中等你发现'", "(book[0] === '雪灯手记' ? '雪灯归林中等你回家' : book[0] === '月莲手记' ? '月汐莲湾中等你发现'")
