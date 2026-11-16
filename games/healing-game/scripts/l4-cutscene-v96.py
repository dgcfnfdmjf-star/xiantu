"""Level-4 clear cutscene hooks (V9.6 working build only), applied after the V9.5 release HTML is frozen.
Every hook is an added line that names __l4Cutscene (no released line is edited), so tests can strip them cleanly."""

# The last note of the third melody has already run J.complete(4) + J.changed() (the save is written first). The film
# then REPLACES the short 3.2 s finale (finale timer, #chimeSkip, toast): it plays instead of it, and its onContinue
# opens the original #chimeEnding card through the unchanged showEnding. Reduced motion keeps today's behaviour (card
# at once, no effect), and ?l4cutscene=0 falls through to the old finale below.
replace("    if (result.finished) {\n      if (reduced) showEnding(); else {",
        "    if (result.finished) {\n"
        "      if (!reduced && window.__l4Cutscene && window.__l4Cutscene.enabled()) { window.__l4Cutscene.play({ source: 'level4', onContinue: showEnding }); return; }\n"
        "      if (reduced) showEnding(); else {")
# While the film is open it counts as an open dialog: no chime taps, melody preview, journal or level switch underneath.
replace("    if (L3 && L3.isRunning()) return true;\n    if (window.__l3Cutscene && window.__l3Cutscene.busy()) return true;\n",
        "    if (L3 && L3.isRunning()) return true;\n    if (window.__l3Cutscene && window.__l3Cutscene.busy()) return true;\n"
        "    if (window.__l4Cutscene && window.__l4Cutscene.busy()) return true;\n")
# The gameplay chimes (and the other chapters) hold still while the stage is up.
replace("    if (window.__l3Cutscene && window.__l3Cutscene.staged()) return;\n",
        "    if (window.__l3Cutscene && window.__l3Cutscene.staged()) return;\n"
        "    if (window.__l4Cutscene && window.__l4Cutscene.staged()) return;\n")
# The gameplay chime group (bells, number labels, gates, halo) is registered so the stage can hide it and put it back.
replace("    group = new T.Group(); H.island.add(group);\n    var wood = new T.MeshLambertMaterial({ color: 0xc9b292 })",
        "    group = new T.Group(); H.island.add(group);\n"
        "    (window.__l4Hide = window.__l4Hide || []).push(group); // for __l4Cutscene\n"
        "    var wood = new T.MeshLambertMaterial({ color: 0xc9b292 })")
# Loads beside the other cutscenes, before kittens.js; it chains onto GardenPlay like the other modules.
# (The preview gate inside it, `if (query('cutscene') !== 'l4') return;`, appears exactly once in the build.)
replace('<script>/* kittens.js', '<script>\n' + (ROOT / 'src/l4-cutscene.js').read_text() + '\n</script>\n<script>/* kittens.js')
# The score needs the music-lush voices and the level-3 score's celesta(): it loads after the level-3 score, before the main game script.
MAIN = "<script>\n(function () {\n  'use strict';\n\n  /* ------------------------------------------------------------------\n   * Config / caps"
replace(MAIN, '<script>\n' + (ROOT / 'src/l4-cutscene-music.js').read_text() + '\n</script>\n' + MAIN)
