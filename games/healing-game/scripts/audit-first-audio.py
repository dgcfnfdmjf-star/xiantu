"""Move sample generation out of the working site's gesture and scheduler."""

def between(text, begin, end):
    start = text.index(begin)
    return text[start:text.index(end, start)]


lush = (ROOT / 'src/music-lush.js').read_text()
audio = (ROOT / 'src/async-audio.js').read_text()
instruments = between(lush, '  function rng(', '  /* ---------------------------- Instruments ')
hall = between(lush, '  function hallImpulse(', '  var hallBuffer')
impulse = between(html, '  function impulse(sec, decay)', '  function getNoise()')
rates = '  var LOW_SR = 22050, HARP_SR = 32000, TABLE_SIZE = 1 << 17'
assert audio.count('/* INSERT_SAMPLE_RENDERERS */') == 1
audio = audio.replace('/* INSERT_SAMPLE_RENDERERS */', '\n'.join((rates + ';', instruments, hall, impulse)))

# Keep one copy of the algorithms in the deliverable, inside the worker only.
replace(instruments, '')
replace(hall + '  var hallBuffer = null; // Lush only: leave the original engine reverb untouched.\n', '')
replace(impulse, '')
replace(rates + ', MAX_LIVE = 34;', '  var MAX_LIVE = 34;')
replace('  var cache = {}, live = 0, warmQueue', '  var live = 0, warmQueue')
replace(between(lush, '  function bank(', '  function source('), '''  function bank(name, m) {
    return window.GardenAudioSamples.get(GA.context(), name, nearest(ROOTS[name], m));
  }
''')
# The originals keep their onended cleanup. Expose their final oscillator so
# that a temporary piano/pluck occupies the same live-note budget as a sample.
for detune in (2, 0):
    line = f"    K.osc('sine', f * 2, t, t + len, h, {detune}, [h]);"
    replace(line, line.replace('    K.osc', '    return K.osc'))
replace('    var src = source(bank(name, m), m), g = K.gain(v, out);', '''    var entry = bank(name, m);
    if (!entry.buf) {
      var light = (name === 'felt' ? V.softPiano : V.guitar)(t, m, v * 0.6, 0.65, out);
      live++;
      light.addEventListener('ended', function () { live--; }, { once: true });
      return;
    }
    var src = source(entry, m), g = K.gain(v, out);''')
replace('    var entry = bank(name, m), src = source(entry, m, true), g = K.gain(0, out), end = t + dur + rel;', '''    var entry = bank(name, m);
    var src = entry.buf ? source(entry, m, true) : GA.context().createOscillator();
    if (!entry.buf) { src.type = 'sine'; src.frequency.value = K.mtof(m); v *= 0.35; }
    var g = K.gain(0, out), end = t + dur + rel;''')
replace('    src.connect(g); src.start(t, Math.random() * entry.buf.duration); src.stop(end + 0.05);', '''    src.connect(g);
    if (entry.buf) src.start(t, Math.random() * entry.buf.duration);
    else src.start(t);
    src.stop(end + 0.05);''')
replace("""    return src;
  }
  function choir""", """    return entry.buf ? src : null;
  }
  function choir""")
replace("out), rate = src.playbackRate.value;\n    src.playbackRate", """out);
    if (!src) return;
    var rate = src.playbackRate.value;
    src.playbackRate""")
replace('    if (!hallBuffer) hallBuffer = hallImpulse(ctx, 4.2);\n    hall.buffer = hallBuffer;', '''    window.GardenAudioSamples.get(ctx, 'hall', 0).ready.then(function (buf) {
      if (buf && hall) hall.buffer = buf;
    });''')
replace('send.disconnect(); hall.disconnect();',
        'if (hall) { send.disconnect(); hall.disconnect(); hall = null; }')
replace('    verb.buffer = impulse(3.4, 2.8);', '''    window.GardenAudioSamples.get(ctx, 'reverb', 0).ready.then(function (buf) {
      if (buf) verb.buffer = buf;
    });''')

# The silent buffer and resume() stay in the user gesture. Start the scheduler
# on its first 25 ms tick; its first note already has an 80 ms lead time.
replace('    if (!timer) timer = setInterval(schedule, TICK);\n    schedule();',
        '    if (!timer) timer = setInterval(schedule, TICK);')
replace('    if (!ctx) return;\n    var now = ctx.currentTime, horizon = now + LOOKAHEAD;',
        """    if (!ctx || !playing || document.hidden || ctx.state === 'interrupted') return;
    // OfflineAudioContext schedules while rendering is explicitly suspended.
    if (ctx.state === 'suspended' && !ctx.startRendering) return;
    var now = ctx.currentTime, horizon = now + LOOKAHEAD;""")
replace("    Sound.unlock();\n    Sound.startMusic();\n    $('start').classList.add('hidden');",
        "    $('start').classList.add('hidden');\n    Sound.unlock();\n    Sound.startMusic();")
audio_tag = '<script>/* ==================================================================\n * GardenAudio —'
replace(audio_tag, '<script>\n' + audio + '\n</script>\n' + audio_tag)
