"""Level-6 clear cutscene hooks (V9.6 working build only), applied after the V9.5 release HTML is frozen and after the
level-6 chapter hook (l6-chapter-v96.py). Every hook is an added line that names __l6Cutscene, so tests can strip them."""

# The last kitten home has already run J.complete(6) + J.changed() (the save is written first) before startFinale().
# The film then REPLACES the short 7 s finale (lantern wave, window flare, #snowSkip): startFinale is rebound once, so
# the first clear and 「重看雪灯归林」 both play the film instead, and its onContinue opens the original #snowEnding card
# through the unchanged showEnding. Reduced motion keeps today's behaviour (card at once), and ?l6cutscene=0 falls
# through to the old startFinale.
replace("  function showEnding(){finale=0;elapsed=FIN;render();lastFocus=document.activeElement;$('snowEnding').hidden=false;$('snowStay').focus();}\n",
        "  function showEnding(){finale=0;elapsed=FIN;render();lastFocus=document.activeElement;$('snowEnding').hidden=false;$('snowStay').focus();}\n"
        "  var l6Finale=startFinale;startFinale=function(){if(!reduced&&window.__l6Cutscene&&window.__l6Cutscene.enabled()){finale=0;elapsed=0;render();window.__l6Cutscene.play({source:'level6',onContinue:showEnding});return;}l6Finale();}; // for __l6Cutscene\n")
# While the film is open it counts as an open dialog: no lantern or kitten taps, journal or level switch underneath.
replace("    if (window.__l5Cutscene && window.__l5Cutscene.busy()) return true;\n",
        "    if (window.__l5Cutscene && window.__l5Cutscene.busy()) return true;\n"
        "    if (window.__l6Cutscene && window.__l6Cutscene.busy()) return true;\n")
# The gameplay chapters (the snow chapter's lanterns, kittens, fog and snowfall) hold still while the stage is up.
replace("    if (window.__l5Cutscene && window.__l5Cutscene.staged()) return;\n",
        "    if (window.__l5Cutscene && window.__l5Cutscene.staged()) return;\n"
        "    if (window.__l6Cutscene && window.__l6Cutscene.staged()) return;\n")
# Loads beside the other cutscenes, before kittens.js; it chains onto GardenPlay like the other modules.
# (The preview gate inside it, `if (query('cutscene') !== 'l6') return;`, appears exactly once in the build.)
replace('<script>/* kittens.js', '<script>\n' + (ROOT / 'src/l6-cutscene.js').read_text() + '\n</script>\n<script>/* kittens.js')
