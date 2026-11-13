"""Level-1 clear cutscene hooks (V9.6 working build only), applied after the V9.5 release HTML is frozen."""

# The cutscene plays by default and hands the same card back through onContinue; ?l1cutscene=0 keeps the 5.2s card.
replace("    setTimeout(function () { $('bfEnding').classList.remove('hidden'); }, 5200);",
        "    var showCard = function () { $('bfEnding').classList.remove('hidden'); };\n"
        "    if (window.__l1Cutscene && window.__l1Cutscene.enabled()) window.__l1Cutscene.play({ source: 'level1', onContinue: showCard });\n"
        "    else setTimeout(showCard, 5200);")
replace("    $('bfEnding').classList.add('hidden');\n    endingUp = false;",
        "    $('bfEnding').classList.add('hidden');\n    if (window.__l1Cutscene) window.__l1Cutscene.close();\n    endingUp = false;")
# Gameplay butterflies hold still (and stay hidden) while the stage is up; their clock keeps running.
replace('      now = t;\n      for (var i = bfs.length - 1; i >= 0; i--) if (bfs[i]) updateOne(bfs[i], dt, t);',
        '      now = t;\n      if (window.__l1Cutscene && window.__l1Cutscene.staged()) return;\n      for (var i = bfs.length - 1; i >= 0; i--) if (bfs[i]) updateOne(bfs[i], dt, t);')
# Read-only look for the cutscene's display-only copies: the game's own wing material and shared meshes. One added
# line (it names __l1Cutscene, so the "working site == release outside the cutscenes" check keeps holding).
replace("    species: SPECIES\n  };\n})(window, document);",
        "    species: SPECIES\n  };\n"
        "  window.__bf.look = function (sp) { var m = wingGeo && sp && byId[sp.id] ? matsFor(byId[sp.id]) : null; /* for __l1Cutscene */ return m && { wingGeo: wingGeo, bodyGeo: bodyGeo, headGeo: headGeo, bodyMat: bodyMat, wing: m.wing, glowWing: m.glowWing || null }; };\n"
        "})(window, document);")
# Loads after the level-2 cutscene and before kittens.js; it chains onto GardenPlay like the other modules.
replace('<script>/* kittens.js', '<script>\n' + (ROOT / 'src/l1-cutscene.js').read_text() + '\n</script>\n<script>/* kittens.js')
