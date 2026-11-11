"""Build V9.5 with its recording and four local Blender cat models."""
from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'source/healing-game-v5.html').read_text()

def replace(old, new):
    global html
    assert html.count(old) == 1, (old[:100], html.count(old))
    html = html.replace(old, new)

replace('<title>暮色浮岛 · 小小花园</title>', '<title>暮色浮岛 · 月汐莲湾 V9.5</title>\n<meta name="garden-version" content="9.5.0">')
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
replace('    S.level = d.level === 2 ? 2 : 1;', '    S.level = d.level === 4 ? 4 : (d.level === 3 ? 3 : (d.level === 2 ? 2 : 1));')
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
replace("    var lb = $('kitLevelBtn'); if (lb) lb.style.display = on ? 'block' : 'none';", "    var lb = $('kitLevelBtn'); if (lb) { lb.style.display = 'block'; lb.textContent = '🗺 选关'; lb.setAttribute('aria-label', '打开选关，切换章节并保留进度'); }")
replace('    if (endingUp) return;\n    if (n === 2 && !isUnlocked()) return;', '    if (endingUp || (n !== 1 && n !== 2 && n !== 3 && n !== 4)) return;\n    if (n === 2 && !isUnlocked()) return;\n    if (n === 3 && !level3Unlocked()) return;\n    if (n === 4 && (!window.GardenJourney || !window.GardenJourney.unlocked(4))) return;')
replace('    hideButterflies(two);', '    hideButterflies(n !== 1);')
replace("    if (bh) bh.style.display = two ? 'none' : '';", "    if (bh) bh.style.display = n !== 1 ? 'none' : '';")
replace("    if (nb) nb.innerHTML = two ? '🐱<span>抱猫</span>' : '🦋<span>捕蝶</span>';", "    if (nb) nb.innerHTML = n === 3 ? '✦<span>拾光</span>' : (two ? '🐱<span>抱猫</span>' : '🦋<span>捕蝶</span>');")
replace("    var bk = $('gpBookBtn'); if (bk) bk.textContent = two ? '📖 猫谱' : '📖 蝶谱';", "    var bk = $('gpBookBtn'); if (bk) bk.textContent = n === 3 ? '📖 星萤' : (two ? '📖 猫谱' : '📖 蝶谱');")
replace("    if (announce) H.toast(two ? '🐱 轻点小猫丢毛线球，再点一下抱抱它' : '🦋 回到第一关，蝴蝶们还在等你', 3000);", "    if (window.GardenJourney && window.GardenJourney.ready) window.GardenJourney.onLevel(n);\n    if (announce) H.toast(n === 3 ? '✦ 收集 4 点星光，再轻点一座引航灯' : (two ? '🐱 轻点小猫丢毛线球，再点一下抱抱它' : '🦋 回到第一关，蝴蝶们还在等你'), 3000);")
replace('      setLevel(want === 2 && isUnlocked() ? 2 : 1, false);', '      setLevel(want === 4 && window.GardenJourney && window.GardenJourney.unlocked(4) ? 4 : (want === 3 && level3Unlocked() ? 3 : (want === 2 && isUnlocked() ? 2 : 1)), false);')
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
# Clear the camera's touch table when capture or window focus is lost, as level3fx.js bindSwipes does.
replace("  cvs.addEventListener('pointercancel', function (e) { endPointer(e, true); });\n", "  cvs.addEventListener('pointercancel', function (e) { endPointer(e, true); });\n  cvs.addEventListener('lostpointercapture', function (e) { endPointer(e, true); });\n  window.addEventListener('blur', function () { pointers = {}; pCount = 0; pinchDist = 0; });\n")
# V7 audio, scene and interaction bridges.
replace('    kit: { gain: gain, filt: filt, osc: osc, mtof: mtof, rnd: rnd, pad: pad, bass: bass, brush: brush, degree: degree, melNote: melNote },\n', '    kit: { gain: gain, filt: filt, osc: osc, mtof: mtof, rnd: rnd, pad: pad, bass: bass, brush: brush, degree: degree, melNote: melNote, musicBox: musicBox },\n')
replace('    milestone: sfx.milestone, ending: sfx.ending, melody: sfx.melody,\n', '    milestone: sfx.milestone, ending: sfx.ending, melody: sfx.melody,\n    // For sound effects built outside this file (see level3plus.js). sfxOut is null when sfx are off.\n    pent: pent, sfxOut: function () { return ok() ? sfxBus : null; },\n')
replace("  var LEVEL_THEME = { 1: 'dreamy', 2: 'cozy' }, FADE = 3.5;\n", "  var LEVEL_THEME = { 1: 'dreamy', 2: 'cozy', 3: 'nightvoyage', 4: 'morningchimes', 5: 'moonlotus' }, FADE = 3.5;\n")
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
replace('    setNightTarget: function (v) { if (!ending) nightTarget = v; }, isStarted: function () { return started; }\n', '    setNightTarget: function (v) { if (!ending) nightTarget = v; }, setDeepNight: function (v) { deepNight = v; },\n    // Levels 4/5 hide #modes, so a mode left over from levels 1-3 must not keep planting or releasing lanterns.\n    resetMode: function () { mode = "net"; for (var j = 0; j < modeBtns.length; j++) modeBtns[j].classList.toggle("on", modeBtns[j].getAttribute("data-mode") === "net"); }, isStarted: function () { return started; }\n')
# Clipping fixes; helpers and footprints live in src/clipping.js (see CLIPPING-FIXES.md).
# Near plane: nothing ever gets closer than 0.5 (see keepFromCamera), and it gives 5x the depth precision of 0.1.
replace('new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300)', 'new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 300)')
# Pond disc sits 0.01 above the grass: offset it in depth so it cannot z-fight at long range or on low-precision GPUs.
replace('new THREE.MeshBasicMaterial({ color: 0xc4e8ff, transparent: true, opacity: 0.85 })', 'new THREE.MeshBasicMaterial({ color: 0xc4e8ff, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })')
replace('      if (Math.hypot(x - POND.x, z - POND.z) < 1.15) continue;\n', '      if (Math.hypot(x - POND.x, z - POND.z) < 1.15 || !window.GardenClip.groundClear(x, z, 0.06)) continue;\n')
replace('      var pa = rand(0, 6.28), pr = rand(3.8, 4.6);\n', '      var pa, pr, ptry = 0;\n      do { pa = rand(0, 6.28); pr = rand(3.8, 4.6); } while (ptry++ < 30 && !window.GardenClip.groundClear(Math.cos(pa) * pr, Math.sin(pa) * pr, 0.3));\n')
# Clouds reach 4.3 from their centre: stay clear of the rocks (r <= 9.15), keep rocks evenly spaced, and move aside for the camera.
replace("r: rand(11, 18), y: i % 3", "r: rand(13.5, 18), y: i % 3")
replace("emissive: 0x403048, transparent: true, opacity: 0.9 })", "emissive: 0x403048, transparent: true, opacity: 0.9, depthWrite: false })")
replace("sp: rand(0.03, 0.06) };", "sp: 0.045 };")
replace('      clouds[i].rotation.y = -cd.a;\n', '      window.GardenClip.keepFromCamera(clouds[i].position, camera.position, 5);\n      clouds[i].rotation.y = -cd.a;\n')
# Fireflies bob +-0.35: the lowest used to dip under the grass (top 0.25).
replace('y: rand(0.4, 3.6),', 'y: rand(0.8, 3.6),')
# Big additive sprites would be sliced in a straight line by the ground and by nearby meshes.
replace('    glow.scale.set(1.1, 1.1, 1); head.add(glow);\n', '    glow.material.depthTest = false; glow.scale.set(1.1, 1.1, 1); head.add(glow);\n')
replace('    glow.scale.set(1.5, 1.5, 1); g.add(glow);\n', '    glow.material.depthTest = false; glow.scale.set(1.5, 1.5, 1); g.add(glow);\n')
replace("m.halo = new T.SpriteMaterial({ map: H.glowTex, color: new T.Color(sp.c1), transparent: true, opacity: 0.7,\n        blending: T.AdditiveBlending, depthWrite: false });", "m.halo = new T.SpriteMaterial({ map: H.glowTex, color: new T.Color(sp.c1), transparent: true, opacity: 0.7,\n        blending: T.AdditiveBlending, depthTest: false, depthWrite: false });")
replace("m.halo = new T.SpriteMaterial({ map: H.glowTex, color: 0xfff0b0, transparent: true, opacity: 0.38,\n        blending: T.AdditiveBlending, depthWrite: false });", "m.halo = new T.SpriteMaterial({ map: H.glowTex, color: 0xfff0b0, transparent: true, opacity: 0.38,\n        blending: T.AdditiveBlending, depthTest: false, depthWrite: false });")
# Lanterns: cap seats on the body; spawn clear of flowers and canopy; steer round the tree and each other.
replace('cap.position.y = 0.19;', 'cap.position.y = 0.2;')
replace('    g.position.set(wx, wy + 0.25, wz); g.scale.set(0.01, 0.01, 0.01);\n', '    var clear = window.GardenClip.lanternSpawn(wx, wz, flowers);\n    g.position.set(clear.x, wy + 0.25, clear.z); g.scale.set(0.01, 0.01, 0.01);\n')
replace('      L.g.rotation.y += dt * 0.3;\n', '      window.GardenClip.settleLantern(L, lanterns);\n      if (window.LotusChapter) window.LotusChapter.carryLantern(L);\n      L.g.rotation.y += dt * 0.3;\n')
# Falling sparks settle on the grass instead of vanishing into it.
replace('      sp.pos[j] += spVel[j] * dt; sp.pos[j + 1] += spVel[j + 1] * dt; sp.pos[j + 2] += spVel[j + 2] * dt;\n', '      sp.pos[j] += spVel[j] * dt; sp.pos[j + 1] += spVel[j + 1] * dt; sp.pos[j + 2] += spVel[j + 2] * dt;\n      if (sp.pos[j + 1] < iy + TOP_Y + 0.03 && sp.pos[j] * sp.pos[j] + sp.pos[j + 2] * sp.pos[j + 2] < 25) { sp.pos[j + 1] = iy + TOP_Y + 0.03; spVel[j + 1] = 0; }\n')
replace('      var why = canPlant(lp.x, lp.z);\n', "      var why = canPlant(lp.x, lp.z) || window.GardenClip.plantBlocked(lp.x, lp.z, window.__kittens ? window.__kittens.state().level : 1, flowers);\n")
# Cat breathing, bird perches (were inside the canopy) and bird orbit (grazed the top blob).
replace('body.scale.set(1.25, 0.62, 0.9); body.position.y = 0.2; root.add(body);', 'body.scale.set(1.25, 0.62, 0.9); body.position.y = 0.212; root.add(body);')
replace('var perches = [[0.1, 3.0, -0.1], [0.62, 2.2, 0.32]]', 'var perches = [[0.1, 3.18, -0.1], [0.78, 2.35, 0.4]]')
replace('r = 3.6 + i * 0.5;', 'r = 4 + i * 0.5;')
# Petals and rain stop on the island instead of passing through it.
replace('      if (p.y < -1.5 || p.x > 7) respawnPetal(p, false);\n', '      if (p.y < -1.5 || p.x > 7 || (p.y < H.island.position.y + H.TOP_Y + 0.04 && p.x * p.x + p.z * p.z < 25)) respawnPetal(p, false);\n')
replace('      if (d.y < -2) { d.y = rand(8, 10);', '      if (d.y < -2 || (d.y < H.island.position.y + H.TOP_Y && d.x * d.x + d.z * d.z < 25)) { d.y = rand(8, 10);')
# Butterflies: wing tips reach 0.53 below the body on the downstroke; flower heads top out near 1.08.
replace('f.root.getWorldPosition(out); out.y += 0.85;', 'f.root.getWorldPosition(out); out.y += 1.35;')
replace('    var floor = islandY() + 0.3;\n', '    window.GardenClip.settleButterfly(b.pos, bfs, b, H.island.position.y, H.flowers);\n    var floor = islandY() + 0.65;\n')
replace('    b.g.position.copy(b.pos); b.g.position.y += flap * 0.04 * (1 - gl);\n', '    b.g.position.copy(b.pos); b.g.position.y += flap * 0.04 * (1 - gl);\n    window.GardenClip.keepFromCamera(b.g.position, H.camera.position, 1.6);\n')
# Kittens: torso above the ground when curled, and real separation from props and each other.
replace('k.body.position.y = 0.24 - c * 0.11 + stride', 'k.body.position.y = 0.24 - c * 0.03 + stride')
replace('    var GP = window.GardenPlay;\n    return !(GP && GP.blocked && GP.blocked(x, z));\n', '    var GP = window.GardenPlay;\n    if (!window.GardenClip.kittenFree(x, z, H.flowers)) return false;\n    return !(GP && GP.blocked && GP.blocked(x, z));\n')
replace('gap = c.small ? 0.34 : 0.52;', 'gap = c.small ? 0.54 : 0.9;')
replace('    var r = Math.sqrt(k.x * k.x + k.z * k.z);\n    if (r > EDGE_R)', '    window.GardenClip.settleKitten(k, kittens, H.flowers);\n    var r = Math.sqrt(k.x * k.x + k.z * k.z);\n    if (r > EDGE_R)')
replace('    k.x += dx / d * m; k.z += dz / d * m;\n    resolve(k);\n    turnTo(k, Math.atan2(dx, dz), 7, dt);\n    k.moving = true;\n    return false;\n', '    var wx = k.x + dx / d * m, wz = k.z + dz / d * m;\n    k.x = wx; k.z = wz;\n    resolve(k);\n    turnTo(k, Math.atan2(dx, dz), 7, dt);\n    k.moving = true;\n    // Target now sits inside something solid: close enough counts as arrived, so lure and gather still finish\n    return (Math.abs(k.x - wx) + Math.abs(k.z - wz) > 1e-4) && Math.hypot(k.tx - k.x, k.tz - k.z) < 0.5;\n')
replace('setTarget(k, x + Math.cos(a + Math.PI) * 0.3, z + Math.sin(a + Math.PI) * 0.3);', 'setTarget(k, x + Math.cos(a + Math.PI) * 0.55, z + Math.sin(a + Math.PI) * 0.55);')
replace('ring = i < 3 ? 0.42 : 0.95,', 'ring = i < 3 ? 0.5 : 1,')
replace('      for (var i = kittens.length - 1; i >= 0; i--) if (kittens[i]) updateOne(kittens[i], dt, t);\n', "      for (var i = kittens.length - 1; i >= 0; i--) if (kittens[i]) updateOne(kittens[i], dt, t);\n      for (i = 0; i < kittens.length; i++) if (kittens[i].state !== 'hug') resolve(kittens[i]); // idle ones get nudged too\n")
replace('  onFlowerCountChanged();\n  frame();\n', '  window.GardenClip.world = { scene: scene, island: island, camera: camera, flowers: flowers };\n  onFlowerCountChanged();\n  frame();\n')
# Level 3 recording uses the existing transport, player bus and volume controls.
replace('  function schedule() {\n    if (!ctx) return;', (ROOT / 'src/nightvoyage-audio.js').read_text() + '\n  function schedule() {\n    if (!ctx) return;')
replace('      if (now > p.until) { players.splice(k, 1); continue; }', '      if (now > p.until) { players.splice(k, 1); continue; }\n      if (tr.recording && recordedMusic(p)) continue;')
replace('    if (p.until !== Infinity) return;', '    if (p.until !== Infinity) return;\n    stopRecording(p);')
replace('    playing = false;\n    setMusicGain(0, 0.8);', '    playing = false;\n    players.forEach(stopRecording);\n    setMusicGain(0, 0.8);')

# PR #62 instruments, scoped to lush players: original MP3/fallback graph stays intact.
replace('    tracks: defs,\n    voices:', '    tracks: defs,\n    theme: LEVEL_THEME,\n    level: function () { return curLevel; },\n    voices:')
replace('    out.gain.linearRampToValueAtTime(tr.level, now + fade);', '    if (tr.lush || equalPower) fadeCurve(out.gain, tr.level, now, 7, Math.sin);\n    else out.gain.linearRampToValueAtTime(tr.level, now + fade);')
replace('    ramp(p.out.gain, 0.0001, fade);', '''    if (p.track.lush || equalPower) {
      var from = p.out.gain.value;
      p.out.gain.cancelScheduledValues(now); p.out.gain.setValueAtTime(from, now);
      fadeCurve(p.out.gain, from, now, fade, Math.cos);
    } else ramp(p.out.gain, 0.0001, fade);''')
replace('  function makePlayer(idx, fade) {', '''  function fadeCurve(param, level, start, fade, shape) {
    for (var i = 1; i <= 12; i++) param.linearRampToValueAtTime(Math.max(0.0001, level * shape(i / 12 * Math.PI / 2)), start + fade * i / 12);
  }
  function makePlayer(idx, fade, equalPower) {''')
replace('  function retire(p, fade) {', '  function retire(p, fade, equalPower) {')
replace('      if (cur) retire(cur, fade);\n      cur = makePlayer(trackIdx, fade);', '''      var equalPower = !TRACKS[trackIdx].recording && !(cur && cur.track.recording) && (TRACKS[trackIdx].lush || (cur && cur.track.lush));
      if (equalPower) fade = 7;
      if (cur) retire(cur, fade, equalPower);
      cur = makePlayer(trackIdx, fade, equalPower);''')
replace('p.out.disconnect(); p.send.disconnect();', 'p.out.disconnect(); p.send.disconnect(); if (p.lushCleanup) p.lushCleanup();')
replace('players[i].out.disconnect(); players[i].send.disconnect();', 'players[i].out.disconnect(); players[i].send.disconnect(); if (players[i].lushCleanup) players[i].lushCleanup();')

replace('if (performance.now() - cam.lastInput > 4000)', 'if (performance.now() - cam.lastInput > 4000 && !(window.LotusChapter && window.LotusChapter.cameraBusy()))')

# Chapter 5 extends the level gate. Its own score uses the existing synth transport.
replace('S.level = d.level === 4 ? 4 :', 'S.level = d.level === 5 ? 5 : d.level === 4 ? 4 :')
replace('n !== 3 && n !== 4', 'n !== 3 && n !== 4 && n !== 5')
replace('    if (n === 4 && (!window.GardenJourney || !window.GardenJourney.unlocked(4))) return;', '    if (n === 5 && (!window.GardenJourney || !window.GardenJourney.unlocked(5))) return;\n    if (n === 4 && (!window.GardenJourney || !window.GardenJourney.unlocked(4))) return;')
replace('setLevel(want === 4 &&', 'setLevel(want === 5 && window.GardenJourney && window.GardenJourney.unlocked(5) ? 5 : want === 4 &&')

# Fourth chapter labels and start-page guidance.
replace("nb.innerHTML = n === 3 ?", "nb.innerHTML = n === 4 ? '♪<span>奏铃</span>' : n === 3 ?")
replace("bk.textContent = n === 3 ?", "bk.textContent = n === 4 ? '📖 音符' : n === 3 ?")
replace("H.toast(n === 3 ? '✦ ' + window.GardenJourney.hint()", "H.toast(n === 4 ? window.ChimeChapter.hint() : n === 3 ? '✦ ' + window.GardenJourney.hint()")
replace("toast(lv === 3 ? '欢迎回到星灯湾", "toast(lv === 4 ? '欢迎来到晨风铃谷，先听一遍风里的旋律 ♪' : lv === 3 ? '欢迎回到星灯湾")
replace("window.__kittens.state().level === 3 ? window.GardenJourney.hint()", "window.__kittens.state().level === 4 ? window.ChimeChapter.hint() : window.__kittens.state().level === 3 ? window.GardenJourney.hint()")
replace("nb.innerHTML = n === 4 ?", "nb.innerHTML = n === 5 ? '☾<span>送光</span>' : n === 4 ?")
replace("bk.textContent = n === 4 ?", "bk.textContent = n === 5 ? '📖 月莲' : n === 4 ?")
replace("H.toast(n === 4 ? window.ChimeChapter.hint()", "H.toast(n === 5 ? window.LotusChapter.hint() : n === 4 ? window.ChimeChapter.hint()")
replace("toast(lv === 4 ?", "toast(lv === 5 ? '欢迎来到月汐莲湾，循着六朵月莲找回归途 ☾' : lv === 4 ?")
replace("window.__kittens.state().level === 4 ? window.ChimeChapter.hint()", "window.__kittens.state().level === 5 ? window.LotusChapter.hint() : window.__kittens.state().level === 4 ? window.ChimeChapter.hint()")
exec((ROOT / 'scripts/feedback-v94.py').read_text())
exec((ROOT / 'scripts/butterfly-v94.py').read_text())
exec((ROOT / 'scripts/cats-v95.py').read_text())
# Pin the loader locally and keep the model adapter ready before kitten init.
replace('<script>/* kittens.js', '<script>\n' + (ROOT / 'assets/cats/vendor/three-r128/GLTFLoader.js').read_text() + '\n</script>\n<script>\n' + (ROOT / 'src/cat-models.js').read_text() + '\n</script>\n<script>/* kittens.js')
replace("<script>\n(function () {\n  'use strict';\n\n  /* ------------------------------------------------------------------\n   * Config / caps", '<style>\n' + (ROOT / 'src/journey.css').read_text() + '\n' + (ROOT / 'src/chime-chapter.css').read_text() + '\n' + (ROOT / 'src/lotus-chapter.css').read_text() + '\n</style>\n<script>\n' + '\n</script>\n<script>\n'.join('\n'.join((ROOT / ('src/' + part + '.js')).read_text() for part in name.split('+')) for name in ['clipping', 'chime-rules', 'lotus-rules', 'save-guard+journey', 'level3plus', 'level3fx', 'voyage', 'chime-chapter', 'lotus-chapter', 'music-lush']) + "\n</script>\n<script>\n(function () {\n  'use strict';\n\n  /* ------------------------------------------------------------------\n   * Config / caps")
# The V9.5 package is frozen here: later hooks reach only the working site, never the released ZIP.
release_html = html
exec((ROOT / 'scripts/l2-cutscene-v96.py').read_text())
baseline = ROOT / 'site/healing-game-v9.5-baseline/index.html'
baseline.parent.mkdir(parents=True, exist_ok=True)
baseline.write_text(release_html)
out = ROOT / 'site/healing-game/index.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html)
asset = (ROOT / 'assets/nightvoyage-bgm.mp3').read_bytes()
assert len(asset) == 2161729
assert hashlib.sha256(asset).hexdigest() == '19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31'
(out.parent / 'nightvoyage-bgm.mp3').write_bytes(asset)
package_files = [('index.html', release_html.encode()), ('nightvoyage-bgm.mp3', asset)]
for kind in ('orange', 'calico', 'black', 'tabby'):
    name = 'cats/' + kind + '-cat.glb'
    data = (ROOT / 'assets' / name).read_bytes()
    assert data[:4] == b'glTF', name
    target = out.parent / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    package_files.append((name, data))
archive = ROOT / 'releases/healing-game-v9.5-tencent.zip'
archive.parent.mkdir(parents=True, exist_ok=True)
# Stable timestamps and bytes make the downloadable release reproducible.
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, data in package_files:
        entry = zipfile.ZipInfo('healing-game/' + name, (2026, 11, 5, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        z.writestr(entry, data)
archive.with_name('healing-game-v9.5-SHA256SUMS.txt').write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + archive.name + '\n')
print(f'Built V9.5 package + V9.6 working site: {len(out.read_bytes())} bytes; cats: {sum(len(data) for _, data in package_files[2:])} bytes; ZIP: {archive.stat().st_size} bytes')
