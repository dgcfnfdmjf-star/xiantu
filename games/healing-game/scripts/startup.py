"""Working-site startup: generate each film's paper near its own clear and keep the opening beat light."""

# Requests come from scoring events. Skip late idle work if the player has already left the chapter.
replace('  var GP = window.GardenPlay = {', '''  var paperRequested = {};
  function prewarmCutscene(level) {
    var film = window['__l' + level + 'Cutscene'];
    if (paperRequested[level] || !film || !film.enabled()) return;
    paperRequested[level] = true;
    function prepare() {
      if (document.hidden || !film.enabled() || window.__kittens.state().level !== level) {
        delete paperRequested[level];
        return;
      }
      film.prewarm();
    }
    if (window.requestIdleCallback) window.requestIdleCallback(prepare, { timeout: 1000 });
    else setTimeout(prepare, 0);
  }
  var GP = window.GardenPlay = {
    prewarmCutscene: prewarmCutscene,''')
replace('    S.total += value;', '''    S.total += value;
    if (!S.ended && S.total >= GOAL - 4 && S.total < GOAL) window.GardenPlay.prewarmCutscene(1);''')
replace('    S.total += k.kind.value;', '''    S.total += k.kind.value;
    if (!S.ended && S.total >= GOAL - 4 && S.total < GOAL) window.GardenPlay.prewarmCutscene(2);''')
replace('    S.charge -= 4; S.lamps[index] = true; if (FX) FX.onLamp(index);', '''    S.charge -= 4; S.lamps[index] = true; if (FX) FX.onLamp(index);
    if (litCount() === 2) window.GardenPlay.prewarmCutscene(3);''')
replace('    var result = R.press(progress(), index);', '''    var result = R.press(progress(), index);
    if (!reduced && progress().round === R.songs.length - 1) window.GardenPlay.prewarmCutscene(4);''')
replace('    var result=R.act(progress(),selected,kind,value);pulse=.7;', '''    var result=R.act(progress(),selected,kind,value);pulse=.7;
    if (!reduced && progress().found.length === R.blooms.length - 1) window.GardenPlay.prewarmCutscene(5);''')

# Generating and installing the convolver impulse is also expensive. The dry output, context resume
# and silent unlocking sample are immediately usable; populate the wet path after paint.
replace('  function build() {\n    ctx = new AC();', '  function build(deferReverb) {\n    ctx = new AC();')
replace('    verb.buffer = impulse(3.4, 2.8);', '''    function loadReverb() { verb.buffer = impulse(3.4, 2.8); }
    if (deferReverb) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { setTimeout(loadReverb, 0); });
      });
    } else loadReverb();''')
replace('  function unlock() {\n    if (!AC) return false;\n    if (!ctx) { try { build();',
        '  function unlock(deferReverb) {\n    if (!AC) return false;\n    if (!ctx) { try { build(deferReverb);')
replace("function onGesture() { if (!ctx || ctx.state !== 'running') unlock(); }",
        "function onGesture() { if (!ctx || ctx.state !== 'running') unlock(true); }")

# The silent buffer and context resume still happen inside the iOS activation. Give the
# browser one paint with the start layer dismissed before starting the music transport.
replace("""    Sound.unlock();
    Sound.startMusic();
    $('start').classList.add('hidden');""", """    $('start').classList.add('hidden');
    Sound.unlock();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { Sound.startMusic(true); });
    });""")
replace('  function startMusic() {\n    if (!ctx || !musicOn) return;',
        '  function startMusic(lightOpening) {\n    if (!ctx || !musicOn) return;')
replace('cur = makePlayer(trackIdx, 2); players.push(cur);',
        'cur = makePlayer(trackIdx, 2); cur.lightOpening = lightOpening; players.push(cur);')
replace('    def.lush = true; def.swing = 0;', '''    var fullScore = def.play;
    def.play = function (t, step, bar, chord, beat, player) {
      if (!player.lightOpening) return fullScore.call(this, t, step, bar, chord, beat, player);
      player.lightOpening = false;
      // The first chord uses oscillator voices. The regular player/voice cache takes over
      // on the next subdivision, preserving the score's harmony, tempo and track fade.
      var duration = chordBars(this, bar) * 16 * beat;
      K.pad(t, chord.notes, duration, 0.030, player.out, 'triangle', 800);
      K.bass(t, chord.bass, 0.075, duration, player.out);
      var melody = K.melNote(this, bar, step, beat);
      if (melody) K.musicBox(t, melody.m, 0.07, player.out);
    };
    def.lush = true; def.swing = 0;''')
