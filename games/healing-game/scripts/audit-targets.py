"""Connect named controls to the working site's normal chapter actions after the release freeze."""
target_ui = (ROOT / 'src/keyboard-targets.js').read_text()
target_css = (ROOT / 'src/keyboard-targets.css').read_text()
replace('<script>/* butterflies.js', '<style>\n' + target_css + '\n</style>\n<script>\n' + target_ui + '\n</script>\n<script>/* butterflies.js')

# Keep the same availability checks for pointer hit tests and named controls.
replace("if (b.dead || !b.g.visible || b.state === 'release' || b.fade < 0.4) continue;", "if (!catchableButterfly(b)) continue;")
replace('  function catchAt(x, y) {', '''  function catchableButterfly(b) { return !b.dead && b.g.visible && b.state !== 'release' && b.fade >= 0.4; }
  if (window.GardenTargets) window.GardenTargets.register(1, SPECIES, {
    ready: function () { return canCatch() && netMode(); },
    pick: function (sp) { return bfs.find(function (b) { return b.sp === sp && catchableButterfly(b); }); },
    label: function (sp) { return '捕捉' + sp.name; },
    use: function (b) {
      tmp2.copy(b.g.position).project(H.camera);
      onCaught(b, (tmp2.x + 1) * innerWidth / 2, (1 - tmp2.y) * innerHeight / 2);
      return '已捕到' + b.sp.name + '，心动共 ' + S.total + ' 点';
    }
  });
  function catchAt(x, y) {''')

replace("if (k.dead || k.state === 'hug' || k.fade < 0.3) continue;", "if (!catchableKitten(k)) continue;")
replace('  function pickFromRay(ray, radius) {', '''  function catchableKitten(k) { return !k.dead && k.state !== 'hug' && k.fade >= 0.3; }
  if (window.GardenTargets) window.GardenTargets.register(2, KINDS, {
    ready: function () { return H && H.isStarted() && level === 2 && !endingUp; },
    pick: function (kind) {
      if (invitedKitten) return invitedKitten.kind === kind && catchableKitten(invitedKitten) ? invitedKitten : null;
      return kittens.find(function (k) { return k.kind === kind && catchableKitten(k); });
    },
    label: function (kind) {
      if (invitedKitten && invitedKitten.kind === kind) return '抱抱' + kind.name;
      return coatResting(kind) ? '让' + kind.name + '休息' : '邀请' + kind.name + '玩毛线球';
    },
    use: function (k) { kitInteracted = true; tapKitten(k); return $('toast').textContent; }
  });
  function pickFromRay(ray, radius) {''')

replace("      if (!w.g.visible || w.cooldown > 0 || w.fade < CATCHABLE_FADE) return;",
        "      if (!catchableWisp(w)) return;")
replace('  function wispAt(x, y) {', '''  function catchableWisp(w) { return w.g.visible && !w.cooldown && w.fade >= CATCHABLE_FADE; }
  function wispAt(x, y) {''')
replace('    screenOf: screenOf, wispAt: wispAt,', '    catchableWisp: catchableWisp, screenOf: screenOf, wispAt: wispAt,')
replace('  function canPlay() { return active && H.isStarted() && !blocked(); }', '''  function canPlay() { return active && H.isStarted() && !blocked(); }
  if (window.GardenTargets) window.GardenTargets.register(3, TYPES, {
    ready: canPlay,
    pick: function (sp) { return wisps.find(function (w) { return TYPES[w.type] === sp && FX && FX.catchableWisp(w); }); },
    label: function (sp) { return '拾取' + sp.name; },
    use: function (w) { collect(w); return $('toast').textContent; }
  });''')
replace("    document.body.setAttribute('data-garden-level', n);", "    document.body.setAttribute('data-garden-level', n);\n    if (window.GardenTargets) window.GardenTargets.onLevel(n);")
replace('    if (t >= poll) { poll = t + .5; sync(false); }', '    if (t >= poll) { poll = t + .5; sync(false); if (window.GardenTargets) window.GardenTargets.refresh(); }')
