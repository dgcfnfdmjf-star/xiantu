"""Level-3 clear cutscene hooks (V9.6 working build only), applied after the V9.5 release HTML is frozen.
Every hook is an added line that names __l3Cutscene (no released line is edited), so tests can strip them cleanly."""

# The finale (or its skip button, or reduced motion) calls showEnding. It is wrapped here: the cutscene plays first and
# hands the original card back through onContinue. ?l3cutscene=0 goes straight to the card as before.
replace("  function showEnding() { setModal('starEnding', true); }\n",
        "  function showEnding() { setModal('starEnding', true); }\n"
        "  var starCard = showEnding; showEnding = function () { var cs = window.__l3Cutscene; if (cs && cs.enabled()) cs.play({ source: 'level3', onContinue: starCard }); else starCard(); };\n")
# While the film is open it counts as an open dialog: no catching, lighting, journal or level switch underneath.
replace("    if (L3 && L3.isRunning()) return true;\n    if (CH && CH.isModalOpen()) return true;",
        "    if (L3 && L3.isRunning()) return true;\n    if (window.__l3Cutscene && window.__l3Cutscene.busy()) return true;\n    if (CH && CH.isModalOpen()) return true;")
# Gameplay wisps, lamp effects, beams and the boat hold still (and stay hidden) while the stage is up.
replace("    if (L3) L3.update(dt, t);\n    if (CH) CH.update(dt, t);",
        "    if (window.__l3Cutscene && window.__l3Cutscene.staged()) return;\n    if (L3) L3.update(dt, t);\n    if (CH) CH.update(dt, t);")
# Read-only stage access for the cutscene: the gameplay groups it hides, and a copy of the in-memory catch counts.
replace("  window.__journey = {\n    saveStatus:",
        "  window.__l3Stage = { groups: function () { return [world]; }, caught: function () { var o = {}; for (var k in S.caught) o[k] = S.caught[k]; return o; } }; // for __l3Cutscene\n"
        "  window.__journey = {\n    saveStatus:")
# level3plus.js (beams) and level3fx.js (sparks, lamp effects) each keep a group on the island: registered so the stage can hide it.
HIDE = "(window.__l3Hide = window.__l3Hide || []).push(group); // for __l3Cutscene\n"
replace("whose child count the regression tests read\n    group = new T.Group(); group.visible = false; H.island.add(group);\n",
        "whose child count the regression tests read\n    group = new T.Group(); group.visible = false; H.island.add(group);\n    " + HIDE)
replace("\n      group = new T.Group(); group.visible = false; H.island.add(group);\n",
        "\n      group = new T.Group(); group.visible = false; H.island.add(group);\n      " + HIDE)
# Loads after the level-1 cutscene and before kittens.js; it chains onto GardenPlay like the other modules.
replace('<script>/* kittens.js', '<script>\n' + (ROOT / 'src/l3-cutscene.js').read_text() + '\n</script>\n<script>/* kittens.js')
# The score needs the music-lush voices: it loads after them (and after the other two scores), before the main game script.
MAIN = "<script>\n(function () {\n  'use strict';\n\n  /* ------------------------------------------------------------------\n   * Config / caps"
replace(MAIN, '<script>\n' + (ROOT / 'src/l3-cutscene-music.js').read_text() + '\n</script>\n' + MAIN)
