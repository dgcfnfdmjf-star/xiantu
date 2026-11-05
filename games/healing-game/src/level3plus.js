/* ==================================================================
 * level3plus.js — sound and ending for level 3 (星灯夜航).
 * - 星灯夜曲: the level's own nocturne, registered through music2.js.
 * - One short phrase and timbre per firefly species; catches and lamps
 *   climb the pentatonic as more lamps are lit.
 * - The finale: beams link the lamps and the night deepens before the
 *   ending dialog opens. Once complete, a softer version stays on.
 * Loaded after journey.js, which calls in through window.__level3.
 * Plain ES5. No external resources.
 * ================================================================== */
(function (window, document) {
  'use strict';
  var GA = window.GardenAudio, K = GA && GA.kit, M = window.__music2, V = M && M.voices;

  /* ---------------------------- Nocturne --------------------------- */
  if (K && V) M.register({ id: 'nightvoyage', name: '星灯夜曲', key: 61, bpm: 58, swing: 0, delay: 0.34, level: 1,
    // Dbadd9 Bbm7 Gbadd9 Absus | Db6 Bbm7 Ebm7 Absus
    prog: [[0, 'add9'], [9, 'm7'], [5, 'add9'], [7, 'sus'], [0, 'six'], [9, 'm7'], [2, 'm7'], [7, 'sus']],
    // Degrees 1 2 3 5 6 only: the melody stays on the pentatonic the catches are drawn from
    mel: ['3---5---', '6---5-3-', '5---8---', '6---5-..', '3-5-6---', '8---6-5-', '6---2---', '5-----..'],
    play: function (t, s, bar, ch, sd, p) {
      var out = V.bus(p, 2000), n = ch.notes;
      if (s === 0) {
        K.pad(t, n, sd * 16, 0.026, out, 'triangle', 620);
        K.bass(t, ch.bass, 0.08, sd * 14, out);
      }
      // A slow broken chord in the left hand, leaving the downbeat to the pad
      if (s % 4 === 2) V.softPiano(t + K.rnd(0, 0.02), n[[1, 2, 3, 2][(s - 2) / 4]] + 12, K.rnd(0.03, 0.042), sd * 5, out);
      var mn = K.melNote(this, bar, s, sd);
      if (mn) {
        // Piano carries the tune; every third loop a far-off flute answers, so the long loop can rest
        if (p.loop % 3 === 2) V.flute(t, mn.m + 12, 0.045, mn.dur, out);
        else V.softPiano(t + K.rnd(0, 0.015), mn.m + 12, 0.085, mn.dur, out);
      }
      if (s === 14 && bar % 2 && Math.random() < 0.35) K.musicBox(t, K.degree(this.key, [1, 2, 3, 5, 6][Math.floor(K.rnd(0, 5))]) + 24, 0.018, out);
    } });

  /* ------------------------ Firefly phrases ------------------------ */
  // Glass bell: pure tone with an inharmonic ping on the attack
  function bell(t, m, v, dur, out) {
    var f = K.mtof(m), end = t + dur + 1.2, g = K.gain(0, out), h = K.gain(0, out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    h.gain.setValueAtTime(v * 0.3, t);
    h.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    K.osc('sine', f, t, end, g, 0, [g]);
    K.osc('sine', f * 2.76, t, t + 0.55, h, 0, [h]);
  }
  // Tide: a rounded swell under a little wash of noise
  function swell(t, m, v, dur, out) {
    var f = K.mtof(m), end = t + dur + 0.8, g = K.gain(0), lp = K.filt('lowpass', Math.min(1800, f * 2.5), 0.4, g);
    g.connect(out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    K.osc('triangle', f, t, end, lp, 0, [lp, g]);
    K.brush(t, v * 0.12, dur + 0.3, 1400, out);
  }
  function box(t, m, v, dur, out) { K.musicBox(t, m, v, out); }
  // Same order as TYPES in journey.js. deg are pent() steps, so every phrase fits whatever track is playing.
  var PHRASES = [
    { voice: box, deg: [6, 5, 3], gap: 0.11, v: 0.065, dur: 0.3 },           // 露珠: drops falling
    { voice: function (t, m, v, dur, out) { V.softPiano(t, m, v, dur, out); }, deg: [0, 2, 4], gap: 0.15, v: 0.1, dur: 0.5 }, // 桃霞: warm rise
    { voice: function (t, m, v, dur, out) { V.guitar(t, m, v, dur, out); }, deg: [1, 3, 2, 4], gap: 0.1, v: 0.1, dur: 0.3 },   // 琥珀: plucked
    { voice: bell, deg: [5, 2], gap: 0.28, v: 0.06, dur: 0.6 },              // 月白: two far bells
    { voice: function (t, m, v, dur, out) { V.flute(t, m, v, dur, out); }, deg: [2, 4, 3], gap: 0.2, v: 0.07, dur: 0.28 },     // 紫梦: drowsy flute
    { voice: swell, deg: [-3, -1, 1, 3], gap: 0.1, v: 0.07, dur: 0.4 }       // 潮蓝: a wave rolling in
  ];
  function catchSound(type, lit) {
    var out = K && V && GA.sfxOut(), ph = PHRASES[type];
    if (!out || !ph) return;
    var t = GA.context().currentTime + 0.01;
    // Each lit lamp lifts the phrase one pentatonic step
    for (var i = 0; i < ph.deg.length; i++) ph.voice(t + i * ph.gap, GA.pent(ph.deg[i] + lit), ph.v, ph.dur, out);
  }
  function lampSound(lit) {
    if (!GA || !GA.melody) return;
    var lift = (lit - 1) * 2;
    GA.melody([lift, lift + 2, lift + 4, lift + 6, lift + 8], 0.14, true);
  }

  /* ------------------------------ Beams ---------------------------- */
  var BEAM_START = 0.15, BEAM_STEP = 0.9, BEAM_TIME = 1.1, FINALE_TIME = 6.5;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SETTLED_DEEP = 0.4, SETTLED_GLOW = 0.55;
  var H, T, lamps, group, endingEl, beams = [], finish = null, announced = false, sounded = false, skip;
  var active = false, complete = false, running = false, clock = 0, deep = 0, glow = SETTLED_GLOW;
  var a, b, axis, facing, up, camLocal, basis, wp, sparkCol;

  // Bright core and soft edge across the width; plain texture so a beam can stretch to any length
  function beamTex() {
    var c = document.createElement('canvas'); c.width = 4; c.height = 64;
    var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.36, 'rgba(255,255,255,0.22)');
    gr.addColorStop(0.5, 'rgba(255,255,255,1)');
    gr.addColorStop(0.64, 'rgba(255,255,255,0.22)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 64);
    return new T.CanvasTexture(c);
  }
  function build() {
    a = new T.Vector3(); b = new T.Vector3(); axis = new T.Vector3(); facing = new T.Vector3(); up = new T.Vector3();
    camLocal = new T.Vector3(); wp = new T.Vector3(); basis = new T.Matrix4(); sparkCol = new T.Color(0xffd58a);
    // Lives beside journey.js's world group, whose child count the regression tests read
    group = new T.Group(); group.visible = false; H.island.add(group);
    var tex = beamTex(), geo = new T.PlaneGeometry(1, 1);
    geo.translate(0.5, 0, 0); // pivot on the start lamp, so scale.x draws the beam across
    for (var i = 0; i < 3; i++) {
      var mesh = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex, color: 0xffdca4, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
      var bead = new T.Sprite(new T.SpriteMaterial({ map: H.glowTex, color: 0xfff0cc, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      bead.scale.set(0.5, 0.5, 1);
      group.add(mesh); group.add(bead);
      beams.push({ mesh: mesh, bead: bead, from: i, to: (i + 1) % 3, grow: 1, sparked: true });
    }
  }
  function lampPoint(i, out) { var p = lamps[i].g.position; return out.set(p.x, p.y + lamps[i].core.position.y, p.z); }
  function arrive(i) {
    lamps[i].core.getWorldPosition(wp);
    for (var n = 0; n < 12; n++) {
      var ang = n / 12 * Math.PI * 2;
      H.emitSpark(wp.x, wp.y, wp.z, Math.cos(ang) * 0.5, 0.25 + Math.random() * 0.4, Math.sin(ang) * 0.5, 1.3, 0.1, sparkCol);
    }
  }
  function updateBeams(dt, t) {
    camLocal.copy(H.camera.position); H.island.worldToLocal(camLocal);
    beams.forEach(function (beam, k) {
      if (running) beam.grow = Math.min(1, Math.max(0, (clock - BEAM_START - k * BEAM_STEP) / BEAM_TIME));
      else beam.grow = 1;
      if (beam.grow === 1 && !beam.sparked) { beam.sparked = true; arrive(beam.to); }
      var ease = beam.grow * beam.grow * (3 - 2 * beam.grow);
      lampPoint(beam.from, a); lampPoint(beam.to, b);
      axis.copy(b).sub(a);
      var len = axis.length(); axis.divideScalar(len);
      // Spin the ribbon around its own axis to face the camera, so it never thins out to a line
      facing.copy(camLocal).sub(a); facing.addScaledVector(axis, -facing.dot(axis)).normalize();
      up.crossVectors(facing, axis);
      basis.makeBasis(axis, up, facing);
      beam.mesh.quaternion.setFromRotationMatrix(basis);
      beam.mesh.position.copy(a);
      beam.mesh.scale.set(Math.max(0.001, len * ease), 0.55, 1);
      beam.mesh.material.opacity = 0.8 * glow * ease * (0.85 + 0.15 * Math.sin(t * 1.1 + k * 2));
      // A bead of light keeps walking the beam from lamp to lamp
      var along = (t * 0.16 + k / 3) % 1;
      beam.bead.position.copy(a).addScaledVector(axis, len * along);
      beam.bead.material.opacity = glow * ease * Math.sin(along * Math.PI) * 0.9;
    });
    lamps.forEach(function (l, i) {
      var s = 2 + glow * 0.9 + Math.sin(t * 0.9 + i * 2) * 0.12;
      l.halo.scale.set(s, s, 1);
    });
  }
  function holding() { return running || !endingEl.hidden; }

  /* ----------------------------- Finale ---------------------------- */
  function cancel() { running = false; finish = null; if (skip) skip.hidden = true; }
  function finishFinale() {
    if (!running) return;
    var done = finish; cancel();
    beams.forEach(function (beam) { beam.grow = 1; beam.sparked = true; });
    if (active && done) done();
  }
  // index = the lamp just lit: the light starts there and comes back to it
  function startFinale(index, done) {
    cancel();
    complete = running = true; clock = 0; group.visible = active;
    finish = done; announced = sounded = false; skip.hidden = false;
    beams.forEach(function (beam, k) {
      beam.from = (index + k) % 3; beam.to = (index + k + 1) % 3;
      beam.grow = 0; beam.sparked = false;
    });
    if (reduced) finishFinale();
  }

  window.__level3 = {
    init: function (hooks, lampList) {
      H = hooks; T = hooks.THREE; lamps = lampList;
      endingEl = document.getElementById('starEnding');
      skip = document.createElement('button'); skip.id = 'starFinaleSkip'; skip.className = 'jr-action'; skip.hidden = true;
      skip.textContent = '跳过演出'; skip.onclick = finishFinale; document.body.appendChild(skip);
      build();
      return this;
    },
    catchSound: catchSound,
    lampSound: lampSound,
    startFinale: startFinale,
    isRunning: function () { return running; },
    night: function () { return holding() ? 1 : (complete ? 0.9 : 0.82); },
    onLevel: function (isActive, allLit) {
      active = isActive;
      if (!active) cancel(); // the save already holds the completion; only the dialog is skipped
      complete = allLit;
      group.visible = active && complete;
    },
    update: function (dt, t) {
      // Use the existing visible-page frame loop: backgrounding pauses the entire sequence.
      if (running && !document.hidden) {
        clock += dt;
        if (!announced && clock >= .2) { announced = true; H.toast('光，一盏一盏连起来了……', 2800); }
        if (!sounded && clock >= .8) { sounded = true; if (GA && GA.ending) GA.ending(); }
        if (clock >= FINALE_TIME) finishFinale();
      }
      var want = !active ? 0 : (holding() ? 1 : (complete ? SETTLED_DEEP : 0));
      deep += (want - deep) * Math.min(1, dt * 1.1);
      H.setDeepNight(deep < 0.001 ? 0 : deep);
      if (!group.visible) return;
      glow += ((holding() ? 1 : SETTLED_GLOW) - glow) * Math.min(1, dt * 1.1);
      updateBeams(dt, t);
    },
    // Read-only inspection for regression tests
    state: function () { return { running: running, complete: complete, deep: deep, glow: glow, grow: beams.map(function (x) { return x.grow; }), visible: group.visible }; }
  };
})(window, document);
