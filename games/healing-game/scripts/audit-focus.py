"""Native start and modal controls in the working game, after freezing the V9.5 release."""
replace('<div class="startbtn">轻触开始 ♪</div>',
        '<button type="button" id="startButton" class="startbtn">轻触开始 ♪</button>')

# Install after the shell and before the first game module.
replace('<script>/**', '<script>\n' + (ROOT / 'src/focus-panels.js').read_text() + '\n</script>\n<script>/**')

replace("  $('btnRestart').addEventListener('click', function () {",
        "  $('btnRestart').addEventListener('click', function () {\n"
        "    if (!started || !ended || !window.GardenFocus.isCurrent('ending')) return;")
for panel, chapter in [('bfEnding', 1), ('kitEnding', 2)]:
    old = f"  function closeEnding(again) {{\n    $('{panel}').classList.add('hidden');"
    replace(old, "  function closeEnding(again) {\n"
            f"    if (!H.isStarted() || !endingUp || !S.ended || +document.body.dataset.gardenLevel !== {chapter}"
            f" || !window.GardenFocus.isCurrent('{panel}')) return;\n"
            f"    $('{panel}').classList.add('hidden');")

# The original fallback level menu has its own two-step replay action. Give
# it a direct path to the same run reset instead of clicking a hidden button.
old_reset = "S.total = 0; S.ended = false; H.toast('新的一程，慢慢来 🦋', 2400);"
replace("    if (again) { " + old_reset + " }",
        "    if (again) resetButterflyRun();")
replace("  var BF = window.ButterflyCatch = {",
        "  function resetButterflyRun() { " + old_reset + " }\n"
        "  var BF = window.ButterflyCatch = {\n"
        "    replayFromLevels: function () {\n"
        "      if (!H.isStarted() || !window.GardenFocus.isCurrent('kitLevels')) return;\n"
        "      resetButterflyRun(); renderHud(false); save();\n"
        "    },")
replace("    setLevels(false);\n    if (rs === 1) { var ag = $('bfAgain'); if (ag) ag.click(); }",
        "    if (rs === 1) window.ButterflyCatch.replayFromLevels();")
replace("    setLevel(rs, true);", "    setLevels(false);\n    setLevel(rs, true);")
replace("  function onLevelClick(e) {", "  function onLevelClick(e) {\n"
        "    if (!H.isStarted() || !window.GardenFocus.isCurrent('kitLevels')) return;")
replace("  function restartJourney() {", "  function restartJourney() {\n"
        "    if (!H.isStarted() || !window.GardenFocus.isCurrent('journeyPanel')) return;")
