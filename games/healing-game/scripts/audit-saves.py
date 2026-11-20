"""Wire the working site's existing save owners through the shared revision guard."""

def save_block(start, end, replacement):
    begin = html.index(start)
    finish = html.index(end, begin)
    replace(html[begin:finish], replacement)

play = '<script>/* gameplay.js'
replace(play, '<script>\n' + (ROOT / 'src/save-session.js').read_text() + '\n</script>\n' + play)

# Garden and butterfly state retain their old schema. Restoration during init cannot be a user edit.
for source in ('garden', 'butterflies'):
    owner_key = "var SAVE_KEY = 'healingGarden." + ('v3' if source == 'garden' else 'butterflies.v1') + "';"
    begin = html.index(owner_key)
    read_start = html.index('    try { raw = window.localStorage', begin)
    read_end = html.index('    if (!d || typeof d', read_start)
    html = html[:read_start] + '    d = window.GardenSaves.read(SAVE_KEY);\n' + html[read_end:]
    begin = html.index('  var saveTimer = null, saveDirty = false;', begin)
    end_marker = "  document.addEventListener('visibilitychange', flushSave);"
    end = html.index(end_marker, begin) + len(end_marker)
    html = html[:begin] + '''  function save() {
    if (window.GardenJourney && window.GardenJourney.ready) window.GardenSaves.write(SAVE_KEY, JSON.stringify(S));
  }''' + html[end:]

save_block('  var pendingKitWrites = {}, kitRetry = null;', '  var KINDS = [', '''  function store(k, v) {
    if (v === undefined) return window.GardenSaves.read(k);
    window.GardenSaves.write(k, v);
  }

''')
replace("    try { d = JSON.parse(store(SAVE_KEY) || 'null'); } catch (e) { d = null; }", '    d = store(SAVE_KEY);')
replace('    level = n; S.level = n; save();', '''    level = n;
    if (S.level !== n) { S.level = n; if (window.GardenJourney.ready || announce) save(); }''')
# A development URL explicitly selecting L2 opts in to that chapter. Retain its normal persisted selection.
replace('      if (want === 2 && m) store', '      var previousLevel = S.level;\n      if (want === 2 && m) store')
replace('      // Level 2 pauses the butterfly layer entirely;', '''      if (m && previousLevel !== level && want === level && level !== 1 && window.GardenSaves.status(SAVE_KEY).state !== 'corrupt') save();
      // Level 2 pauses the butterfly layer entirely;''')

replace("    try { guard = window.SaveGuard.create(window.localStorage, KEY); d = guard.read(); } catch (e) { return; }",
        "    d = window.GardenSaves.read(KEY);")
replace("  var guard = null, temp,", "  var savedJourney = null, temp,")
replace("failing = {}, retrySave = null;", "failing = {};")
save_block('  // auto=true for pagehide/visibility/startup writes;', '  load();', '''  function save() {
    if (!API || !API.ready || window.GardenReset.pending()) return false;
    var json = JSON.stringify(S);
    if (json === savedJourney) return true;
    savedJourney = json;
    window.GardenSaves.write(KEY, json);
    return true;
  }
''')
replace("    API.ready = true; onLevel(level());", "    savedJourney = JSON.stringify(S); API.ready = true; onLevel(level()); showSaveWarning();")
replace("saveStatus: function () { return guard ? guard.status() : null; },", "saveStatus: function () { return window.GardenSaves.status(KEY); },")
replace('saveWarning: saveWarning, saveOk: saveOk,', 'saveWarning: saveWarning, saveOk: saveOk, refreshSaveNotice: showSaveWarning,')
replace("    var el = $('starSaveWarning'); if (el) el.hidden = !retryWarning;", """    var el = $('starSaveWarning'), issue = window.GardenSaves.message();
    if (el) {
      el.textContent = issue || '浏览器未能保存进度，请先不要关闭页面；检查浏览器存储空间或隐私设置。';
      el.hidden = !issue && !retryWarning;
    }""")
# Preserve rollback on partial failure. The reset and ordinary writers take the same Web Lock.
replace('          if (owned(key)) saved.push([key, target.getItem(key)]);', '          if (key !== root.GardenSaves.headKey && owned(key)) saved.push([key, target.getItem(key)]);')
replace('        saved.forEach(function (entry) { target.removeItem(entry[0]); });',
        '        saved.forEach(function (entry) { target.removeItem(entry[0]); });\n        root.GardenSaves.nextGeneration();')
replace('  root.GardenReset = create(function () { return root.localStorage; }, function () {', '  var gardenReset = create(function () { return root.localStorage; }, function () {')
replace("  if (typeof module === 'object' && module.exports) module.exports = { create: create, owned: owned };", """  root.GardenReset = { pending: gardenReset.pending, reset: function (done) {
    root.GardenSaves.reset(gardenReset.reset, done || function () {});
  } };
  if (typeof module === 'object' && module.exports) module.exports = { create: create, owned: owned };""")
replace("""    if (!window.GardenReset.reset()) {
      $('journeyResetStatus').textContent = '未能清除进度。请检查浏览器存储权限后再试，当前旅程仍可继续。';
    }""", """    window.GardenReset.reset(function (ok) {
      if (!ok) $('journeyResetStatus').textContent = '未能清除进度。请检查存储权限或刷新以载入最新存档。';
    });""")

# Legacy animations, reduced-motion cards and chapter input locks still start synchronously.
# Wait for a pending save only at the boundary that actually opens a film.
for chapter in (1, 2):
    call = f"window.__l{chapter}Cutscene.play({{ source: 'level{chapter}', onContinue: showCard }});"
    replace(call, 'window.GardenSaves.afterWrite(function () { ' + call + ' });')
call = "cs.play({ source: 'level3', onContinue: starCard });"
replace(call, 'window.GardenSaves.afterWrite(function () { ' + call + ' });')
call = "window.__l4Cutscene.play({ source: 'level4', onContinue: showEnding });"
replace(call, 'window.GardenSaves.afterWrite(function () { ' + call + ' render(); }); render();')
call = "window.__l5Cutscene.play({source:'level5',onContinue:showEnding});"
replace(call, 'window.GardenSaves.afterWrite(function(){' + call + '});render();')

# Close the input gap while the origin lock is occupied, before the film has a dialog.
replace('    if (!API.ready) return false;', '    if (!API.ready) return false;\n    if (window.GardenSaves.waitingForFilm()) return true;')
replace('if (!API.ready || (L3 && L3.isRunning())) return;', 'if (!API.ready || window.GardenSaves.waitingForFilm() || (L3 && L3.isRunning())) return;')
replace("    $('chimeListen').disabled = !!preview || finale > 0;", """    var film = window.GardenSaves.waitingForFilm() || (window.__l4Cutscene && window.__l4Cutscene.busy());
    $('chimeListen').disabled = !!preview || finale > 0 || film;""")
replace("      $('chimeKey'+i).disabled = !!preview || finale>0;", "      $('chimeKey'+i).disabled = !!preview || finale>0 || film;")
replace("$('lotusReplay').hidden=!done||!!finale;$('lotusFinale').hidden=!done||!!finale;",
        "$('lotusReplay').hidden=$('lotusFinale').hidden=!done||!!finale||window.GardenSaves.waitingForFilm();")
