"""Build the single-file V7 game from the preserved V5 upload and small additions."""
from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'source/healing-game-v5.html').read_text()

def replace(old, new):
    global html
    assert html.count(old) == 1, (old[:100], html.count(old))
    html = html.replace(old, new)

replace('<title>暮色浮岛 · 小小花园</title>', '<title>暮色浮岛 · 星灯夜航 V7.0</title>\n<meta name="garden-version" content="7.0.0">')
# Flush existing debounced saves before the page can be frozen or discarded.
for comment, source in [('private mode / quota: ignore', 'garden'), ('ignore', 'butterflies')]:
    old = '''  var saveTimer = null;
  function save() {
    if (saveTimer) return;
    saveTimer = setTimeout(function () {
      saveTimer = null;
      try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* %s */ }
    }, 300);
  }''' % comment
    new = '''  var saveTimer = null, saveDirty = false;
  function flushSave() {
    if (!saveDirty) return;
    clearTimeout(saveTimer); saveTimer = null;
    try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(S)); saveDirty = false; if (window.GardenJourney) window.GardenJourney.saveOk('__SOURCE__'); } catch (e) {
      if (window.GardenJourney) window.GardenJourney.saveWarning('__SOURCE__');
      if (!document.hidden) saveTimer = setTimeout(flushSave, 3000);
    }
  }
  function save() {
    saveDirty = true;
    if (saveTimer === null) saveTimer = setTimeout(flushSave, 300);
  }
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', flushSave);'''
    replace(old, new.replace('__SOURCE__', source))
replace('    fireflyBonus: 0,', '    fireflyBonus: 0,\n    collection: function () { return Object.keys(S.disc); },\n    flowerSpecies: SPECIES,')
replace("  function canCatch() { return H && H.isStarted() && !codexOpen && !endingUp; }", "  function canCatch() { return H && H.isStarted() && !codexOpen && !endingUp &&\n    (!window.__kittens || window.__kittens.state().level === 1) &&\n    (!window.GardenJourney || !window.GardenJourney.blocked()); }")
replace("setTimeout(function () { H.toast('🦋 用手指划过蝴蝶，轻轻把它网住', 3200); }, 4300);", "setTimeout(function () { if (!window.__kittens || window.__kittens.state().level === 1) H.toast('🦋 用手指划过蝴蝶，轻轻把它网住', 3200); }, 4300);")
replace('    S.level = d.level === 2 ? 2 : 1;', '    S.level = d.level === 3 ? 3 : (d.level === 2 ? 2 : 1);')
replace('''  function store(k, v) {
    try {
      if (v === undefined) return window.localStorage ? window.localStorage.getItem(k) : null;
      window.localStorage.setItem(k, v);
    } catch (e) { /* private mode / quota: ignore */ }
    return null;
  }''', '''  var pendingKitWrites = {}, kitRetry = null;
  function flushKitWrites() {
    clearTimeout(kitRetry); kitRetry = null;
    Object.keys(pendingKitWrites).forEach(function (key) { store(key, pendingKitWrites[key]); });
  }
  function store(k, v) {
    if (v !== undefined) pendingKitWrites[k] = v;
    try {
      if (v === undefined) return Object.prototype.hasOwnProperty.call(pendingKitWrites, k) ? pendingKitWrites[k] : window.localStorage.getItem(k);
      window.localStorage.setItem(k, v); delete pendingKitWrites[k];
      if (!Object.keys(pendingKitWrites).length && window.GardenJourney) window.GardenJourney.saveOk('kittens');
    } catch (e) {
      if (v !== undefined) {
        if (window.GardenJourney) window.GardenJourney.saveWarning('kittens');
        if (!document.hidden && kitRetry === null) kitRetry = setTimeout(flushKitWrites, 3000);
      }
    }
    return null;
  }
  window.addEventListener('pagehide', flushKitWrites);
  document.addEventListener('visibilitychange', flushKitWrites);''')
replace('  function save() { store(SAVE_KEY, JSON.stringify(S)); }', "  function save() { store(SAVE_KEY, JSON.stringify(S)); }\n  function level3Unlocked() { return S.ended || S.total >= GOAL || (window.GardenJourney && window.GardenJourney.unlocked(3)); }")
replace('  function setLevels(open) {\n    if (open && endingUp) return;', "  function setLevels(open) {\n    if (open && endingUp) return;\n    if (open && window.GardenJourney && window.GardenJourney.ready) { window.GardenJourney.open('journey'); return; }")
replace("    var lb = $('kitLevelBtn'); if (lb) lb.style.display = on ? 'block' : 'none';", "    var lb = $('kitLevelBtn'); if (lb) { lb.style.display = 'block'; lb.textContent = '✧ 旅程手账'; }")
replace('    if (endingUp) return;\n    if (n === 2 && !isUnlocked()) return;', '    if (endingUp || (n !== 1 && n !== 2 && n !== 3)) return;\n    if (n === 2 && !isUnlocked()) return;\n    if (n === 3 && !level3Unlocked()) return;')
replace('    hideButterflies(two);', '    hideButterflies(n !== 1);')
replace("    if (bh) bh.style.display = two ? 'none' : '';", "    if (bh) bh.style.display = n !== 1 ? 'none' : '';")
replace("    if (nb) nb.innerHTML = two ? '🐱<span>抱猫</span>' : '🦋<span>捕蝶</span>';", "    if (nb) nb.innerHTML = n === 3 ? '✦<span>拾光</span>' : (two ? '🐱<span>抱猫</span>' : '🦋<span>捕蝶</span>');")
replace("    var bk = $('gpBookBtn'); if (bk) bk.textContent = two ? '📖 猫谱' : '📖 蝶谱';", "    var bk = $('gpBookBtn'); if (bk) bk.textContent = n === 3 ? '📖 星萤' : (two ? '📖 猫谱' : '📖 蝶谱');")
replace("    if (announce) H.toast(two ? '🐱 轻点小猫丢毛线球，再点一下抱抱它' : '🦋 回到第一关，蝴蝶们还在等你', 3000);", "    if (window.GardenJourney && window.GardenJourney.ready) window.GardenJourney.onLevel(n);\n    if (announce) H.toast(n === 3 ? '✦ 收集 4 点星光，再轻点一座引航灯' : (two ? '🐱 轻点小猫丢毛线球，再点一下抱抱它' : '🦋 回到第一关，蝴蝶们还在等你'), 3000);")
replace('      setLevel(want === 2 && isUnlocked() ? 2 : 1, false);', '      setLevel(want === 3 && level3Unlocked() ? 3 : (want === 2 && isUnlocked() ? 2 : 1), false);')
replace('if (level !== 2) bu.apply(B, arguments);', 'if (level === 1) bu.apply(B, arguments);')
replace("      if (level !== 2 || endingUp || !H.isStarted()) return false;", "      if (level !== 2 || endingUp || !H.isStarted() || (window.GardenJourney && window.GardenJourney.blocked())) return false;")
replace("    if (!started) return;\n    ndc.set", "    if (!started || (window.GardenJourney && window.GardenJourney.blocked())) return;\n    ndc.set")
replace("      toast(mode === 'net' ? '划过蝴蝶就能网住它 · 双指旋转视角'", "      toast(mode === 'net' ? (window.__kittens && window.__kittens.state().level === 3 ? '轻点发光的星萤 · 集满 4 点后点亮引航灯' : '划过蝴蝶就能网住它 · 双指旋转视角')")
replace("setTimeout(function () { var L2 = window.__kittens && window.__kittens.state().level === 2; toast(L2 ? '小猫们在花丛里等你呢 🐱' : '蝴蝶们在等你呢 🦋', 3200); }, 900);", "setTimeout(function () { var lv = window.__kittens ? window.__kittens.state().level : 1; toast(lv === 3 ? '欢迎回到星灯湾，点点星光正等着你 ✦' : (lv === 2 ? '小猫们在花丛里等你呢 🐱' : '蝴蝶们在等你呢 🦋'), 3200); }, 900);")
# Keep a single frame loop; backgrounding does not advance the new stage or use GPU.
replace('''  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.05);
    update(dt);
    renderer.render(scene, camera);
  }''', '''  var frameId = null;
  function frame() {
    frameId = null;
    if (document.hidden) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    update(dt);
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null; pointers = {}; pCount = 0;
    } else if (frameId === null) { clock.getDelta(); frame(); }
  });''')
# V7 audio, scene and interaction bridges.
replace('    kit: { gain: gain, filt: filt, osc: osc, mtof: mtof, rnd: rnd, pad: pad, bass: bass, brush: brush, degree: degree, melNote: melNote },\n', '    kit: { gain: gain, filt: filt, osc: osc, mtof: mtof, rnd: rnd, pad: pad, bass: bass, brush: brush, degree: degree, melNote: melNote, musicBox: musicBox },\n')
replace('    milestone: sfx.milestone, ending: sfx.ending, melody: sfx.melody,\n', '    milestone: sfx.milestone, ending: sfx.ending, melody: sfx.melody,\n    // For sound effects built outside this file (see level3plus.js). sfxOut is null when sfx are off.\n    pent: pent, sfxOut: function () { return ok() ? sfxBus : null; },\n')
replace("  var LEVEL_THEME = { 1: 'dreamy', 2: 'cozy' }, FADE = 3.5;\n", "  var LEVEL_THEME = { 1: 'dreamy', 2: 'cozy', 3: 'nightvoyage' }, FADE = 3.5;\n")
replace('    tracks: defs,\n', '    tracks: defs,\n    voices: { softPiano: softPiano, guitar: guitar, flute: flute, bus: bus },\n    // A track defined in another file. Register at load time, before the first onLevel.\n    register: function (def) { def.index = GA.addTrack(def); defs.push(def); return def.index; },\n')
replace("    if (announce) H.toast(n === 3 ? '✦ 收集 4 点星光，再轻点一座引航灯' : (two ? '🐱 轻点小猫丢毛线球，再点一下抱抱它' : '🦋 回到第一关，蝴蝶们还在等你'), 3000);\n", "    if (announce) H.toast(n === 3 ? '✦ ' + window.GardenJourney.hint() : (two ? '🐱 轻点小猫丢毛线球，再点一下抱抱它' : '🦋 回到第一关，蝴蝶们还在等你'), 3000);\n")
replace('    uMix: { value: 0 }, uSun: { value: new THREE.Vector3(-0.35, 0.06, -1).normalize() }\n', '    uMix: { value: 0 }, uDeep: { value: 0 }, uSun: { value: new THREE.Vector3(-0.35, 0.06, -1).normalize() }\n')
replace("      'uniform float uMix; uniform vec3 uSun; varying vec3 vDir;',\n", "      'uniform float uMix; uniform float uDeep; uniform vec3 uSun; varying vec3 vDir;',\n")
replace("      '  gl_FragColor = vec4(col, 1.0);',\n", "      '  gl_FragColor = vec4(col * (1.0 - uDeep * 0.5), 1.0);',\n")
replace('    toastEl.textContent = msg;\n', '    toastEl.textContent = window.__level3fx ? window.__level3fx.term(msg) : msg;\n')
replace("      toast(mode === 'net' ? (window.__kittens && window.__kittens.state().level === 3 ? '轻点发光的星萤 · 集满 4 点后点亮引航灯' : '划过蝴蝶就能网住它 · 双指旋转视角') : mode === 'plant' ? '轻触草地，种下一朵花' : (mode === 'lantern' ? '轻触任意处，放飞一盏灯笼' : '轻触一处，萤火虫会飞过去'), 1800);\n", "      toast(mode === 'net' ? (window.__kittens && window.__kittens.state().level === 3 ? window.GardenJourney.hint() : '划过蝴蝶就能网住它 · 双指旋转视角') : mode === 'plant' ? '轻触草地，种下一朵花' : (mode === 'lantern' ? '轻触任意处，放飞一盏灯笼' : '轻触一处，萤火虫会飞过去'), 1800);\n")
replace('  var nightTarget = 0, nightMix = 0, ending = null, ended = false;\n', '  var nightTarget = 0, nightMix = 0, deepNight = 0, ending = null, ended = false;\n')
replace('    starUniforms.uMix.value = nightMix;\n', '    // deepNight (0..1) goes past full night for the level 3 finale; it is 0 everywhere else\n    skyUniforms.uDeep.value = deepNight;\n    starUniforms.uMix.value = nightMix + deepNight * 0.9;\n    starUniforms.uPR.value = DPR * (1 + deepNight * 0.45);\n')
replace('    scene.fog.color.copy(fogDusk).lerp(fogNight, nightMix);\n    hemi.intensity = lerp(0.95, 0.6, nightMix);\n    sun.intensity = lerp(0.65, 0.2, nightMix);\n', '    scene.fog.color.copy(fogDusk).lerp(fogNight, nightMix).multiplyScalar(1 - deepNight * 0.5);\n    hemi.intensity = lerp(0.95, 0.6, nightMix) * (1 - deepNight * 0.4);\n    sun.intensity = lerp(0.65, 0.2, nightMix) * (1 - deepNight * 0.6);\n')
replace('    setNightTarget: function (v) { if (!ending) nightTarget = v; }, isStarted: function () { return started; }\n', '    setNightTarget: function (v) { if (!ending) nightTarget = v; }, setDeepNight: function (v) { deepNight = v; }, isStarted: function () { return started; }\n')
replace("<script>\n(function () {\n  'use strict';\n\n  /* ------------------------------------------------------------------\n   * Config / caps", '<style>\n' + (ROOT / 'src/journey.css').read_text() + '\n</style>\n<script>\n' + '\n</script>\n<script>\n'.join((ROOT / ('src/' + name + '.js')).read_text() for name in ['journey', 'level3plus', 'level3fx', 'voyage']) + "\n</script>\n<script>\n(function () {\n  'use strict';\n\n  /* ------------------------------------------------------------------\n   * Config / caps")
out = ROOT / 'site/healing-game/index.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html)
archive = ROOT.parents[1] / 'downloads/healing-game-v7-tencent.zip'
# Stable timestamps and bytes make the downloadable release reproducible.
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    entry = zipfile.ZipInfo('healing-game/index.html', (2026, 11, 5, 0, 0, 0))
    entry.compress_type = zipfile.ZIP_DEFLATED
    entry.external_attr = 0o100644 << 16
    z.writestr(entry, html.encode())
archive.with_name('healing-game-v7-SHA256SUMS.txt').write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + archive.name + '\n')
print(f'Built V7: {len(out.read_bytes())} bytes; ZIP: {archive.stat().st_size} bytes')
