/* Render the original instrument samples away from input and animation.
 * The build moves the frozen score's DSP functions into this worker body.
 * A reply only supplies PCM. The transport alone can start a note. */
(function (window) {
  'use strict';
  function renderSamples() {
    'use strict';
    var ctx = {
      sampleRate: 0,
      createBuffer: function (count, length, rate) {
        var channels = [];
        for (var i = 0; i < count; i++) channels.push(new Float32Array(length));
        return { rate: rate, channels: channels, getChannelData: function (i) { return channels[i]; } };
      }
    };
    var GA = { context: function () { return ctx; } };
    var K = { mtof: function (m) { return 440 * Math.pow(2, (m - 69) / 12); } };

    /* INSERT_SAMPLE_RENDERERS */

    self.onmessage = function (event) {
      var job = event.data, root = job.root, buffer;
      ctx.sampleRate = job.rate;
      switch (job.name) {
        case 'reverb': buffer = impulse(3.4, 2.8); break;
        case 'hall': buffer = hallImpulse(ctx, 4.2); break;
        case 'felt': buffer = feltNote(root); break;
        case 'harp': buffer = harpNote(root); break;
        case 'warm': buffer = warmTable(); break;
        default: buffer = vowelTable(job.name, root);
      }
      self.postMessage({ id: job.id, rate: buffer.rate, channels: buffer.channels },
        buffer.channels.map(function (channel) { return channel.buffer; }));
    };
  }

  var worker = null, workerURL = null, unavailable = false, nextId = 0;
  var pending = new Map(), contexts = new WeakMap();
  function releaseURL() {
    if (workerURL) { window.URL.revokeObjectURL(workerURL); workerURL = null; }
  }
  function failed(event) {
    if (event && event.preventDefault) event.preventDefault();
    unavailable = true;
    releaseURL();
    if (worker) { worker.terminate(); worker = null; }
    pending.forEach(function (finish) { finish(null); });
    pending.clear();
  }
  function request(job, finish) {
    if (unavailable) { finish(null); return; }
    pending.set(job.id, finish);
    try {
      if (!worker) {
        var code = '(' + renderSamples.toString() + ')();';
        workerURL = window.URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        worker = new window.Worker(workerURL);
        worker.onerror = failed;
        worker.onmessage = function (event) {
          releaseURL();
          var result = event.data, done = pending.get(result.id);
          pending.delete(result.id);
          if (done) done(result);
        };
      }
      worker.postMessage(job);
    } catch (e) { failed(); }
  }

  window.GardenAudioSamples = {
    get: function (ctx, name, root) {
      var cache = contexts.get(ctx);
      if (!cache) { cache = new Map(); contexts.set(ctx, cache); }
      var key = name + ':' + root;
      if (cache.has(key)) return cache.get(key);
      var entry = { root: root, buf: null };
      cache.set(key, entry);
      entry.ready = new Promise(function (resolve) {
        request({ id: ++nextId, name: name, root: root, rate: ctx.sampleRate }, function (result) {
          if (result && ctx.state !== 'closed') {
            try {
              var channels = result.channels, buf = ctx.createBuffer(channels.length, channels[0].length, result.rate);
              for (var i = 0; i < channels.length; i++) buf.getChannelData(i).set(channels[i]);
              entry.buf = buf;
            } catch (e) { /* The light voice remains available if allocation fails. */ }
          }
          resolve(entry.buf);
        });
      });
      return entry;
    }
  };
})(window);
