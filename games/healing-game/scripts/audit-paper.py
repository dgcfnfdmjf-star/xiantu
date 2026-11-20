"""Queue the working site's chapter paper textures from existing progress updates."""

film = (ROOT / 'src/l2-cutscene.js').read_text()
replace('<script>\n' + film, '<script>\n' + (ROOT / 'src/cutscene-paper.js').read_text() + '\n' + film)

# This sync already reads both catch totals every half-second. It also sees a
# near-complete restored save once the player starts, without another timer.
progress = '    var changed = false, bf = window.__bf.state(), cats = window.__kittens.state();\n'
replace(progress, progress +
        '    if (!quiet && H.isStarted()) window.GardenCutscenePaper.consider(bf, cats, S);\n')

# Replaying the bay uses its own temporary lotus state instead of the save.
line = "    $('lotusCount').textContent=practice?"
replace(line, '    if (active && practice && s.found.length === 5) window.GardenCutscenePaper.warm(5);\n' + line)
