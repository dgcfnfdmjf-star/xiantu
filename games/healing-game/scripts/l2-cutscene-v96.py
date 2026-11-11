"""Level-2 clear cutscene hooks (V9.6 working build only), applied after the V9.5 release HTML is frozen."""

# The 7s card stays the default; the cutscene path hands the same card back through onContinue.
replace("    setTimeout(function () { $('kitEnding').classList.remove('hidden'); }, 7000);",
        "    var showCard = function () { $('kitEnding').classList.remove('hidden'); };\n"
        "    if (window.__l2Cutscene && window.__l2Cutscene.enabled()) window.__l2Cutscene.play({ source: 'level2', onContinue: showCard });\n"
        "    else setTimeout(showCard, 7000);")
replace("    $('kitEnding').classList.add('hidden');\n    endingUp = false;",
        "    $('kitEnding').classList.add('hidden');\n    if (window.__l2Cutscene) window.__l2Cutscene.close();\n    endingUp = false;")
replace('<script>/* kittens.js', '<script>\n' + (ROOT / 'src/l2-cutscene.js').read_text() + '\n</script>\n<script>/* kittens.js')
replace('<meta name="garden-version" content="9.5.0">', '<meta name="garden-version" content="9.5.0">\n<meta name="garden-working" content="9.6-l2-cutscene-scaffold">')
