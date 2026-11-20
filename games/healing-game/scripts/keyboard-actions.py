"""Keyboard and screen reader controls for the working site, after the V9.5 freeze."""
replace('<div class="startbtn">轻触开始 ♪</div>',
        '<button id="startButton" class="startbtn" type="button">轻触开始 ♪</button>')
replace('<div id="start" class="overlay">',
        '<div id="start" class="overlay" role="dialog" aria-modal="true" aria-label="暮色浮岛">')
replace('<div id="topbar">', '<div id="topbar" inert aria-hidden="true">')
replace('<div id="modes" class="glass">', '<div id="modes" class="glass" inert aria-hidden="true">')
for dock in ['chimeDock', 'lotusDock']:
    init = f"dock.id='{dock}';dock.hidden=true;"
    replace(init, init + "dock.inert=true;dock.ariaHidden='true';")
replace('<div id="toast" class="glass">', '<div id="toast" class="glass" role="status">')
replace("$('start').classList.add('hidden');", """$('start').classList.add('hidden');
    var keyboardStart = document.activeElement === $('startButton');
    $('start').inert = true; $('start').ariaHidden = 'true';
    ['topbar', 'modes', 'chimeDock', 'lotusDock'].forEach(function (id) {
      var controls = $(id); controls.inert = false; controls.ariaHidden = null;
    });
    if (keyboardStart) (document.querySelector('#sceneTargets summary') || $('kitLevelBtn')).focus();""")

# Keep the legacy opacity transitions and synchronously remove closed panels
# from keyboard navigation and the accessibility tree.
replace('<div id="ending" class="overlay hidden">', '<div id="ending" class="overlay hidden" inert aria-hidden="true">')
for panel, variable, classes in [('gpBook', 'book', 'hidden'), ('bfCodex', 'cx', 'hidden'),
                                 ('bfEnding', 'en', 'overlay hidden'), ('kitEnding', 'en', 'overlay hidden'),
                                 ('kitLevels', 'lv', 'hidden')]:
    init = f"{variable}.id = '{panel}'; {variable}.className = '{classes}';"
    replace(init, init + f" {variable}.inert = true; {variable}.ariaHidden = 'true';")
for panel, flag in [('gpBook', 'bookOpen'), ('bfCodex', 'codexOpen'), ('kitLevels', 'open')]:
    toggle = f"$('{panel}').classList.toggle('hidden', !{flag});"
    replace(toggle, toggle + f" $('{panel}').inert = !{flag}; $('{panel}').ariaHidden = String(!{flag});")
for panel, stay in [('ending', 'btnStay'), ('bfEnding', 'bfStay'), ('kitEnding', 'kitStay')]:
    show = f"$('{panel}').classList.remove('hidden');"
    replace(show, show + f" $('{panel}').inert = false; $('{panel}').ariaHidden = null; $('{stay}').focus();")

# Guard the actual state-changing handlers as well as the DOM. The original
# chapter selector has its own confirmed reset and mustn't click a hidden card.
for button in ['btnStay', 'btnRestart']:
    handler = f"$('{button}').addEventListener('click', function () {{\n    $('ending').classList.add('hidden');"
    replace(handler, f"""$('{button}').addEventListener('click', function () {{
    if (!started || !ended || $('ending').inert || $('ending').classList.contains('hidden')) return;
    $('ending').inert = true; $('ending').ariaHidden = 'true'; $('ending').classList.add('hidden');""")
for panel, level_check in [('bfEnding', "window.__kittens.state().level !== 1"), ('kitEnding', 'level !== 2')]:
    close = f"  function closeEnding(again) {{\n    $('{panel}').classList.add('hidden');"
    replace(close, f"""  function closeEnding(again) {{
    if (!H.isStarted() || !endingUp || !S.ended || {level_check} || $('{panel}').inert || $('{panel}').classList.contains('hidden')) return;
    $('{panel}').inert = true; $('{panel}').ariaHidden = 'true'; $('{panel}').classList.add('hidden');""")
replace("  function onLevelClick(e) {", """  function onLevelClick(e) {
    if (!H.isStarted() || endingUp || $('kitLevels').inert || $('kitLevels').classList.contains('hidden')) return;""")
replace("    setLevels(false);\n    if (rs === 1) { var ag = $('bfAgain'); if (ag) ag.click(); }",
        "    if (rs === 1) window.ButterflyCatch.replayFromLevels();")
replace('    setLevel(rs, true);', '    setLevels(false); setLevel(rs, true);')
replace('  var BF = window.ButterflyCatch = {', '''  var BF = window.ButterflyCatch = {
    replayFromLevels: function () {
      if (!H.isStarted() || endingUp || $('kitLevels').inert || $('kitLevels').classList.contains('hidden')) return;
      S.total = 0; S.ended = false; renderHud(false); save();
    },''')
replace('  function restartJourney() {', '''  function restartJourney() {
    if (!H.isStarted() || $('journeyPanel').hidden) return;''')

# These registrations live beside the existing creature arrays and scored actions.
replace('<script>/* butterflies.js', '<style>\n' + (ROOT / 'src/scene-targets.css').read_text() +
        '\n</style>\n<script>\n' + (ROOT / 'src/scene-targets.js').read_text() + '\n</script>\n<script>/* butterflies.js')
replace('  function catchAt(x, y) {', '''  function catchable(b) {
    return !b.dead && b.g.visible && b.state !== 'release' && b.fade >= 0.4;
  }
  window.GardenTargets.register(1, {
    hud: 'bfHud', kinds: SPECIES,
    enabled: function () { return canCatch() && netMode(); },
    find: function (sp) { return bfs.find(function (b) { return b.sp === sp && catchable(b); }); },
    label: function (sp) { return '捕捉' + sp.name; },
    act: function (b) {
      tmp2.copy(b.g.position).project(H.camera);
      onCaught(b, (tmp2.x + 1) * innerWidth / 2, (1 - tmp2.y) * innerHeight / 2);
    }
  });
  function catchAt(x, y) {''')
replace("if (b.dead || !b.g.visible || b.state === 'release' || b.fade < 0.4) continue;", 'if (!catchable(b)) continue;')
replace('  function pickFromRay(ray, radius) {', '''  function availableKitten(k) { return !k.dead && k.state !== 'hug' && k.fade >= 0.3; }
  window.GardenTargets.register(2, {
    hud: 'kitHud', kinds: KINDS,
    enabled: function () { return H && H.isStarted() && level === 2 && !endingUp; },
    find: function (kind) {
      if (invitedKitten) return invitedKitten.kind === kind && availableKitten(invitedKitten) && invitedKitten;
      return kittens.find(function (k) { return k.kind === kind && availableKitten(k); });
    },
    label: function (kind, k) { return (k.state === 'lure' || k.state === 'play' ? '抱抱' : '邀请') + kind.name; },
    act: function (k) { kitInteracted = true; tapKitten(k); }
  });
  function pickFromRay(ray, radius) {''')
replace("if (k.dead || k.state === 'hug' || k.fade < 0.3) continue;", 'if (!availableKitten(k)) continue;')
replace('  function wispAt(x, y) {', '''  function availableWisp(w) { return w.g.visible && w.cooldown <= 0 && w.fade >= CATCHABLE_FADE; }
  function wispAt(x, y) {''')
replace('if (!w.g.visible || w.cooldown > 0 || w.fade < CATCHABLE_FADE) return;', 'if (!availableWisp(w)) return;')
replace('    screenOf: screenOf, wispAt: wispAt,', '    availableWisp: availableWisp, screenOf: screenOf, wispAt: wispAt,')
replace('  function collect(w) {', '''  window.GardenTargets.register(3, {
    hud: 'starHud', kinds: TYPES, enabled: canPlay,
    find: function (sp) { return wisps.find(function (w) { return TYPES[w.type] === sp && FX && FX.availableWisp(w); }); },
    label: function (sp) { return '拾取' + sp.name; },
    act: collect
  });
  function collect(w) {''')
replace("    document.body.setAttribute('data-garden-level', n);",
        "    document.body.setAttribute('data-garden-level', n);\n    window.GardenTargets.mount(n);")
