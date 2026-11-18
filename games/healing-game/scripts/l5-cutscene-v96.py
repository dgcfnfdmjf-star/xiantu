"""Level-5 (final chapter) clear cutscene hooks (V9.6 working build only), applied after the V9.5 release HTML is frozen.
Every hook is an added line that names __l5Cutscene (no released line is edited), so tests can strip them cleanly."""

# The last note of 晓信莲 has already run J.complete(5) + persist() (J.changed(): the save is written first) before
# startFinale(). The film then REPLACES the short 7 s 归航演出 (finale timer, #lotusSkip, toast, gameplay boat and
# lanterns): startFinale is rebound once, so the first clear and 「重看月汐归航」 both play the film instead, and its
# onContinue opens the original #lotusEnding card through the unchanged showEnding. Reduced motion keeps today's
# behaviour (card at once, no effect), and ?l5cutscene=0 falls through to the old startFinale.
replace("  function showEnding(){finale=0;elapsed=7;render();lastFocus=document.activeElement;$('lotusEnding').hidden=false;$('lotusStay').focus();}\n",
        "  function showEnding(){finale=0;elapsed=7;render();lastFocus=document.activeElement;$('lotusEnding').hidden=false;$('lotusStay').focus();}\n"
        "  var l5Finale=startFinale;startFinale=function(){if(!reduced&&window.__l5Cutscene&&window.__l5Cutscene.enabled()){drag=null;echo=null;elapsed=0;finale=0;render();window.__l5Cutscene.play({source:'level5',onContinue:showEnding});return;}l5Finale();}; // for __l5Cutscene\n")
# While the film is open it counts as an open dialog: no lotus taps, echo demo, journal or level switch underneath.
replace("    if (window.__l4Cutscene && window.__l4Cutscene.busy()) return true;\n",
        "    if (window.__l4Cutscene && window.__l4Cutscene.busy()) return true;\n"
        "    if (window.__l5Cutscene && window.__l5Cutscene.busy()) return true;\n")
# The gameplay lotuses (stations, boat, lanterns, moon ring) and the other chapters hold still while the stage is up.
replace("    if (window.__l4Cutscene && window.__l4Cutscene.staged()) return;\n",
        "    if (window.__l4Cutscene && window.__l4Cutscene.staged()) return;\n"
        "    if (window.__l5Cutscene && window.__l5Cutscene.staged()) return;\n")
# The gameplay lotus group (flowers, stations, ripples, the short finale's boat and lanterns, the moon ring) is
# registered so the stage can hide it and put it back.
replace("group.name='lotus-pond-garden';group.position.set(H.POND.x,0,H.POND.z);H.island.add(group);\n",
        "group.name='lotus-pond-garden';group.position.set(H.POND.x,0,H.POND.z);H.island.add(group);\n"
        "    (window.__l5Hide=window.__l5Hide||[]).push(group); // for __l5Cutscene\n")
# Loads beside the other cutscenes, before kittens.js; it chains onto GardenPlay like the other modules.
# (The preview gate inside it, `if (query('cutscene') !== 'l5') return;`, appears exactly once in the build.)
replace('<script>/* kittens.js', '<script>\n' + (ROOT / 'src/l5-cutscene.js').read_text() + '\n</script>\n<script>/* kittens.js')
