"""Connect the working site's existing save consumers to one page-scoped writer."""
def save_section(anchor, start, end, new):
    assert html.count(anchor) == 1, anchor
    first = html.index(start, html.index(anchor))
    last = html.index(end, first) + len(end)
    # Garden and butterfly share parts of the historical loader.
    global_prefix = html[html.index(anchor):first]
    replace(global_prefix + html[first:last], global_prefix + new)


replace('</head>', '<script>\n' + (ROOT / 'src/save-progress.js').read_text() + '\n</script>\n</head>')
replace((ROOT / 'src/save-guard.js').read_text(), '')

for key, extra in [('healingGarden.v3', ', k'), ('healingGarden.butterflies.v1', '')]:
    anchor = "  var SAVE_KEY = '" + key + "';"
    save_section(anchor, '  function load() {', "    if (!d || typeof d !== 'object') return;",
        '''  var slot = window.GardenSaves.open(SAVE_KEY);
  function load() {
    var d = slot.data''' + extra + ''';
    if (!d) return;''')
    save_section(anchor, '  var saveTimer = null, saveDirty = false;',
        "  document.addEventListener('visibilitychange', flushSave);",
        '  function save() { slot.write(S); }')
replace('      load(); buildUI();', '      load(); slot.remember(S); buildUI();')
replace('      load(); buildShared(); buildUI(); bindInput();', '      load(); slot.remember(S); buildShared(); buildUI(); bindInput();')

# The unlock flag remains the original scalar "1"; it shares the reset/write barrier.
cats = "  var SAVE_KEY = 'healingGarden.kittens.v1', UNLOCK_KEY = 'hg_level2_unlocked';"
save_section(cats, '  var pendingKitWrites = {}, kitRetry = null;',
    "  document.addEventListener('visibilitychange', flushKitWrites);",
    '''  var slot = window.GardenSaves.open(SAVE_KEY, window.GardenSaves.kittenSave);
  var unlockSlot = window.GardenSaves.open(UNLOCK_KEY, null, true);''')
replace("    var d = null;\n    try { d = JSON.parse(store(SAVE_KEY) || 'null'); } catch (e) { d = null; }",
        '    var d = slot.data;')
replace("  function isUnlocked() { return store(UNLOCK_KEY) === '1'; }", "  function isUnlocked() { return unlockSlot.flagValue() === '1'; }")
replace("    store(UNLOCK_KEY, '1');", "    unlockSlot.write('1');")
replace("if (want === 2 && m) store(UNLOCK_KEY, '1');", "if (want === 2 && m) unlockSlot.write('1');")
replace('  function save() { store(SAVE_KEY, JSON.stringify(S)); }', '  function save() { slot.write(S); }')
replace('  function setLevel(n, announce) {', '  function setLevel(n, announce, initial) {')
replace('    level = n; S.level = n; save();',
        '    level = n; S.level = n;\n    if (initial) slot.remember(S); else save();')
replace('(want === 2 && isUnlocked() ? 2 : 1)), false);', '(want === 2 && isUnlocked() ? 2 : 1)), false, true);')

journey = "  var KEY = 'healingGarden.journey.v1', H,"
replace('failing = {}, retrySave = null;', 'failing = {};')
replace('    var d;\n    try { guard = window.SaveGuard.create(window.localStorage, KEY); d = guard.read(); } catch (e) { return; }',
        '    guard = window.GardenSaves.open(KEY);\n    var d = guard.data;')
save_section(journey, '  // auto=true for pagehide/', '  load();',
    '''  function save(auto) { return API && API.ready ? guard.write(S, auto === true) : false; }
  load();''')
replace("    var el = $('starSaveWarning'); if (el) el.hidden = !retryWarning;",
    """    var msg = window.GardenSaves.message(), el = $('starSaveWarning');
    if (el) {
      el.hidden = !retryWarning && !msg;
      el.textContent = msg || '浏览器未能保存进度，请检查存储空间或隐私设置。';
    }""")
replace('    API.ready = true; onLevel(level());', '    guard.remember(S); API.ready = true; showSaveWarning(); onLevel(level());')

# Serialize explicit reset with ordinary writes. A new epoch also invalidates
# tabs that originally loaded an empty garden and therefore compare equal to it.
replace('        saved.forEach(function (entry) { target.removeItem(entry[0]); });',
    """        saved.forEach(function (entry) { target.removeItem(entry[0]); });
        target.setItem(root.GardenSaves.generation, Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));""")
replace('    if (!window.GardenReset.reset()) {',
        '    function resetFailed() {')
replace("当前旅程仍可继续。';\n    }", "当前旅程仍可继续。';\n    }\n    window.GardenSaves.exclusive(window.GardenReset.reset).then(function (ok) { if (!ok) resetFailed(); }, resetFailed);")
