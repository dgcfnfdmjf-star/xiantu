"""Level-2 clear cutscene hooks (V9.6 working build only), applied after the V9.5 release HTML is frozen."""

# The cutscene plays by default and hands the same card back through onContinue; ?l2cutscene=0 keeps the 7s card.
replace("    setTimeout(function () { $('kitEnding').classList.remove('hidden'); }, 7000);",
        "    var showCard = function () { $('kitEnding').classList.remove('hidden'); };\n"
        "    if (window.__l2Cutscene && window.__l2Cutscene.enabled()) window.__l2Cutscene.play({ source: 'level2', onContinue: showCard });\n"
        "    else setTimeout(showCard, 7000);")
replace("    $('kitEnding').classList.add('hidden');\n    endingUp = false;",
        "    $('kitEnding').classList.add('hidden');\n    if (window.__l2Cutscene) window.__l2Cutscene.close();\n    endingUp = false;")
replace('<script>/* kittens.js', '<script>\n' + (ROOT / 'src/l2-cutscene.js').read_text() + '\n</script>\n<script>/* kittens.js')
replace('<meta name="garden-version" content="9.5.0">', '<meta name="garden-version" content="9.5.0">\n<meta name="garden-working" content="9.6-l2-cutscene">')

# Stage access for the cutscene's display-only actors: builders and read-only views, no save or reward paths.
replace('  window.__kittens = api;',
        "  window.__l2Stage = { build: buildKitten, kinds: KINDS, kind: function (id) { return byId[id]; }, kittens: function () { return kittens; }, group: function () { return group; }, level: function () { return level; }, caught: function () { return S.caught; }, icon: function (id) { if (!icons[id]) icons[id] = { on: iconURL(byId[id], false), off: iconURL(byId[id], true) }; return icons[id]; }, textures: function () { return { heart: texHeart, z: texZ }; } };\n"
        '  window.__kittens = api;')
# Gameplay kittens hold still (and stay hidden) while the stage is up.
replace('      if (level !== 2) return;\n      for (var i = kittens.length - 1;',
        '      if (level !== 2) return;\n      if (window.__l2Cutscene && window.__l2Cutscene.staged()) return;\n      for (var i = kittens.length - 1;')
# Blender coats for stage actors on any level; they never join the gameplay list.
replace('  function attach(k) {\n',
        '  function attachStage(k) { if (k.catVisual || !COATS[k.kind.id]) return; load(k.kind.id).then(function (template) { if (!template || k.dead || !k.root.parent || k.catVisual) return; createVisual(k, template, KITTEN_HEIGHT); k.inner.visible = false; }); } // __l2Stage\n'
        '  function attach(k) {\n')
replace('    attach: attach,\n', '    attach: attach,\n    attachStage: attachStage, // __l2Stage\n')
# The score needs the music-lush voices, so it loads right after them (before the main game script).
MAIN = "<script>\n(function () {\n  'use strict';\n\n  /* ------------------------------------------------------------------\n   * Config / caps"
replace(MAIN, '<script>\n' + (ROOT / 'src/l2-cutscene-music.js').read_text() + '\n</script>\n' + MAIN)
