  // Injected inside GardenAudio: no separate context, clock, toggle or save key.
  var voyageBuffer = null, voyageLoad = null, voyageFailed = false;
  function stopRecording(p) {
    if (!p.recordingSource) return;
    p.recordingSource.stop(); p.recordingSource.disconnect();
    p.recordingGain.disconnect(); p.recordingSource = p.recordingGain = null;
  }
  function recordedMusic(p) {
    // Manual track selection outside level 3 keeps the original synthesized track.
    if (window.__kittens && window.__kittens.state().level !== 3) {
      stopRecording(p); p.send.gain.value = p.track.delay; return false;
    }
    // A retired player must never start again after an asynchronous decode.
    if (!playing || !unlocked || p.until !== Infinity || p !== cur) return true;
    if (voyageFailed) return false; // original 星灯夜曲 scheduler remains intact
    if (!voyageBuffer) {
      if (!voyageLoad) {
        voyageLoad = true;
        var controller = new AbortController();
        var timeout = setTimeout(function () { controller.abort(); voyageFailed = true; }, 15000);
        fetch('nightvoyage-bgm.mp3', { signal: controller.signal }).then(function (res) {
          if (!res.ok) throw new Error('Night voyage audio HTTP ' + res.status);
          return res.arrayBuffer();
        }).then(function (bytes) {
          return ctx.decodeAudioData(bytes);
        }).then(function (buffer) {
          if (!voyageFailed) voyageBuffer = buffer;
          clearTimeout(timeout);
        }).catch(function () { clearTimeout(timeout); voyageFailed = true; });
      }
      return true;
    }
    if (!p.recordingSource) {
      try {
        var source = ctx.createBufferSource(), level = ctx.createGain();
        // +8 dB compensates the supplied -22 LUFS recording toward -14 LUFS.
        // Peak 0.29 * 2.512 = 0.728 before the existing music/master buses.
        level.gain.value = 2.512;
        source.buffer = voyageBuffer; source.loop = true;
        source.loopStart = 0; source.loopEnd = voyageBuffer.duration;
        source.connect(level); level.connect(p.out);
        // The recording already has ambience; avoid the synth delay send.
        p.send.gain.value = 0;
        source.start(); p.recordingSource = source; p.recordingGain = level;
      } catch (e) { voyageFailed = true; p.send.gain.value = p.track.delay; return false; }
    }
    return true;
  }
