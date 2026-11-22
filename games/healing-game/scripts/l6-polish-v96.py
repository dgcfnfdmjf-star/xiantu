"""Level-6 polish (V9.6 working build only), applied after the V9.5 release HTML is frozen and after the l6 chapter and
cutscene hooks. Uses the strict replace() of build.py (each old string must occur exactly once)."""

# The game's weather petals (pink #ffc6da instanced planes, also a light 20% drift in 'clear' weather) do not belong in
# the snowy night: on level 6 they are switched off at once (no 风里飘来了花瓣 toast), and the cutscene stage hides
# them with its other off-set objects (window.__l6Hide). Every other level keeps its weather exactly as before.
replace("    H.scene.add(petals);\n",
        "    H.scene.add(petals); (window.__l6Hide = window.__l6Hide || []).push(petals);\n")
replace("    W.cur = w;\n    if (window.GardenJourney && window.GardenJourney.feedbackBusy()) return;",
        "    if (w === 'petals' && window.SnowChapter && window.SnowChapter.isActive && window.SnowChapter.isActive()) w = 'clear';\n"
        "    W.cur = w;\n    if (window.GardenJourney && window.GardenJourney.feedbackBusy()) return;")
replace("    var pt = W.cur === 'petals' ? 1 : (W.cur === 'clear' ? 0.2 : 0), rt = rainChapter",
        "    var snowy = !!(window.SnowChapter && window.SnowChapter.isActive && window.SnowChapter.isActive());\n"
        "    if (snowy) W.petal = 0;\n"
        "    var pt = snowy ? 0 : W.cur === 'petals' ? 1 : (W.cur === 'clear' ? 0.2 : 0), rt = rainChapter")
