/* l5-cutscene.js: level-5 (final chapter) clear cutscene (a little boat crosses the lotus bay home by moonlight).
 * A seekable 50s timeline shown when the last note of 晓信莲 is played, before the #lotusEnding card; it replaces the
 * old 7s 归航演出. Every visual is a pure function of the timeline second, so seek(t) reproduces any frame.
 * Storyboard: docs/l5-cutscene-storyboard.md.
 * Same architecture as l4-cutscene.js: a pure model (camera, sky, moon, wind, bay, lotuses, dew, light path, boat,
 * fireflies, lanterns as numbers), a three.js stage that poses display-only actors on the live island from that model,
 * and a DOM layer (bars, captions, title). This file never reads or writes a save; the caller's onContinue decides
 * what happens afterwards. */
(function (root) {
  'use strict';
  var DURATION = 50;
  // Clock times are seconds from play(); beats are contiguous and end at DURATION.
  var BEATS = [
    { id: 'bay', t0: 0, t1: 10, caption: '月色落在莲湾上' },
    { id: 'lotus', t0: 10, t1: 21, caption: '花心里亮起月露' },
    { id: 'path', t0: 21, t1: 32, caption: '倒影把路轻轻铺开' },
    { id: 'boat', t0: 32, t1: 43.5, caption: '小舟沿着光，走回家' },
    { id: 'title', t0: 43.5, t1: 50, caption: '' }
  ];
  var TITLE_AT = 44, TITLE_FADE = 3, CONTINUE_GUARD_MS = 600;
  var TITLE = '第五关 · 完成', SUBTITLE = '暮色浮岛', CONTINUE = '轻触继续', SKIP = '跳过';

  var doc = root.document || null;
  var clock = function () {
    return root.performance && root.performance.now ? root.performance.now() : Date.now();
  };
  // idle -> playing <-> paused -> ended -> closed
  var state = 'idle', base = 0, anchor = 0, done = false, endedAt = 0;
  var opts = {}, enabled = true, muted = false, scored = false, ready = !doc;
  var el = null, raf = 0, ticker = 0, showClock = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(u) { return u * u * (3 - 2 * u); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function query(name) {
    var s = root.location && root.location.search ? String(root.location.search) : '';
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(s);
    return m ? m[1] : null;
  }

  function reach() { state = 'ended'; base = DURATION; done = true; endedAt = clock(); }
  function time() {
    if (state !== 'playing') return base;
    var t = base + (clock() - anchor) / 1000;
    if (t >= DURATION) { reach(); return DURATION; }
    return t < 0 ? 0 : t;
  }
  function beatAt(t) {
    for (var i = BEATS.length - 1; i > 0; i--) if (t >= BEATS[i].t0) return BEATS[i];
    return BEATS[0];
  }

  /* ------------------------------ Model ------------------------------
   * Island-local metres; y is height above the grass (the bay's still water lies at WATER_Y, below the grass edge, so
   * the island stands in the bay like a green shore). Nothing here keeps state between calls. */
  var TAU = 6.28318530718, soft = 1; // soft = 0.3 under prefers-reduced-motion: same story, smaller movement
  var WATER_Y = -0.2;
  // Wind: the travelling-wave layout of L4 (primary wave, cross wave, fine ripple under a gust envelope), blowing
  // across the bay; the grass, the lotus leaves and the water's ripple streaks all read the same formula.
  var WX = 0.6, WZ = 0.8;
  function windAt(x, z, t) {
    var a = x * WX + z * WZ, b = -x * WZ + z * WX;
    return (0.6 + 0.4 * Math.sin(t * 0.27 + 0.4 + a * 0.1)) * (0.6 * Math.sin(a * 1.1 - t * 1.3) + 0.25 * Math.sin(b * 1.9 - t * 1.0 + a * 0.6) + 0.15 * Math.sin(a * 3.1 - t * 2.6));
  }
  // Night: blue-violet dusk deepening to moonlit night; warmth gathers round the moon and the path as the boat goes home.
  function skyAt(t) { return { night: ease(ramp(t, 0, 16)), warm: ease(ramp(t, 20, 44)), stars: ease(ramp(t, 1.5, 12)), glow: ease(ramp(t, 0.5, 8)) }; }
  // The moon hangs over the far end of the bay, a little right of the lens, and climbs a touch.
  function moonAt(t) { return { x: 0.39, y: 0.15 + 0.03 * ease(ramp(t, 0, 48)), z: -0.88 }; }
  /* The path home: a straight line on the water from the island's shore towards the moon's bearing, so the moon's own
   * glitter on the bay and the path of light lie on top of each other. s = metres along it. */
  var P0 = [5.5, 2.6], PD = (function () { var m = moonAt(0), l = Math.sqrt(m.x * m.x + m.z * m.z); return [m.x / l, m.z / l]; })(), PN = [-PD[1], PD[0]], PATH_LEN = 22;
  function onPath(s, side, out) { out.x = P0[0] + PD[0] * s + PN[0] * side; out.z = P0[1] + PD[1] * s + PN[1] * side; return out; }
  // How much of the path is lit: it spreads out from the shore across the reflections in the third beat.
  function pathAt(t) { return { reach: PATH_LEN * ease(ramp(t, 21.5, 30.5)), glow: ease(ramp(t, 21, 25)) * (0.8 + 0.2 * ease(ramp(t, 30, 44))) }; }
  /* The six lotuses (月珠莲 潮璃莲 霞梦莲 愿灯莲 紫憩莲 晓信莲, in the game's petal colours) float either side of the
   * path, near the shore first. They wake one by one in the second beat. */
  var BLOOMS = [['月珠莲', 0xe9edff], ['潮璃莲', 0x90e6e1], ['霞梦莲', 0xf4b8d1], ['愿灯莲', 0xffd79b], ['紫憩莲', 0xc6b5f4], ['晓信莲', 0xb3e3c6]];
  // The game's lotus-rules.js palette wins when it is on the page (same values; this keeps them in step).
  (function () { var R = root.LotusRules; if (R && R.blooms && R.blooms.length === 6) for (var i = 0; i < 6; i++) if (R.blooms[i].name === BLOOMS[i][0]) BLOOMS[i][1] = R.blooms[i].color; })();
  // All six answer together twice: when the path of light reaches the moon, and when the boat passes the last flower.
  // Cue times sit on the score's beat grid (one beat = 0.75 s, l5-cutscene-music.js): each lotus's warm pulse peaks on a
  // beat (wake + 1.2 s = 12, 13.5 ... 19.5 s), the chorus rolls start on beats, and the dew lands on eighth notes.
  var CHORUS = [30.75, 40.5];
  var LOTUS = [[1.5, 1.2], [2.8, -1.0], [4.2, 1.3], [5.6, -1.3], [7.0, 1.4], [8.5, -1.4]], LOTUS_T = 10.8, LOTUS_STEP = 1.5, LOTUS_SCALE = 1.5;
  function lotusAt(i, t, out) {
    out = out || {};
    var L = LOTUS[i], p = onPath(L[0], L[1], out), w = windAt(p.x, p.z, t), wake = LOTUS_T + i * LOTUS_STEP;
    // Bloom (the game's lotus: 8 outer + 5 inner petals on hinges, closed bud -> open cup), a warm pulse in its colour
    // as it opens, and a ripple ring that runs out over the water from the leaf.
    out.open = ease(ramp(t, wake, wake + 2.4));
    out.outer = lerp(-1.32, -0.34, out.open) + soft * 0.04 * Math.sin(t * 0.9 + i * 2.1) * out.open;
    out.inner = lerp(-1.42, -0.86, ease(ramp(t, wake + 0.5, wake + 2.8)));
    out.pulse = ramp(t, wake + 0.4, wake + 1.2) * Math.exp(-Math.max(0, t - wake - 1.2) * 0.75);
    var ch = 0; for (var c = 0; c < CHORUS.length; c++) { var dc = t - CHORUS[c] - 0.12 * i; ch = Math.max(ch, dc > -0.6 ? Math.exp(-dc * dc * (dc < 0 ? 6 : 0.5)) : 0); }
    out.chorus = ch;
    out.glow = Math.min(1.25, 0.1 + 0.5 * out.open + 0.55 * out.pulse + 0.15 * ease(ramp(t, 24, 30)) + 0.45 * ch);
    var ru = ramp(t, wake + 0.6, wake + 3.6), rc = ramp(t, CHORUS[0] + 0.12 * i, CHORUS[0] + 0.12 * i + 3);
    out.ringR = ru > 0 && ru < 1 ? 0.35 + 1.5 * ease(ru) : rc > 0 && rc < 1 ? 0.35 + 1.8 * ease(rc) : 0;
    out.ringA = ru > 0 && ru < 1 ? (1 - ru) * ramp(ru, 0, 0.1) : rc > 0 && rc < 1 ? 0.8 * (1 - rc) * ramp(rc, 0, 0.1) : 0;
    // The leaf rocks and dips as the wind crosses the bay; the bloom bobs a little after it.
    out.tilt = soft * 0.07 * w; out.roll = soft * 0.05 * windAt(p.x + 0.7, p.z - 0.4, t);
    out.y = WATER_Y + 0.02 + soft * 0.025 * Math.sin(t * 1.1 + i * 1.7);
    out.yaw = i * 1.1 + soft * 0.05 * Math.sin(t * 0.4 + i);
    out.scale = LOTUS_SCALE * (1 + 0.18 * ease(ramp(t, 30, 42))); // a little larger in the wide shots
    out.wake = wake;
    return out;
  }
  function hsh(j, k) { var s = Math.sin(j * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }
  /* Moon-dew: four beads per lotus, in its petal colour. Each is born in the opening flower's heart, lifts in a slow
   * spiral and hovers over the flower; in the third beat, as the path of light reaches its spot, it drifts down in a
   * soft arc and settles on the water as one of the stepping lights of the path home (nearest flowers -> nearest
   * steps), alternating either side of the ribbon. It keeps breathing there and brightens with the lotus chorus. */
  var DEWS = 24, DEW_PER = 4;
  var STEP = {}, LP = {};
  function dewStep(j) { var i = j % 6, k = (j / 6) | 0, n = i * DEW_PER + k; STEP.s = 0.8 + n * (PATH_LEN - 2.6) / (DEWS - 1); STEP.side = (n % 2 ? 1 : -1) * (0.62 + 0.04 * n); return STEP; }
  // The moment a bead lands on the path, snapped to the score's eighth-note grid (0.375 s) so its celesta note rings with it.
  function dewLand(j) { var st = dewStep(j); return Math.round((22.6 + 7.4 * Math.sqrt(st.s / PATH_LEN)) / 0.375) * 0.375; }
  function dewAt(j, t, out) {
    out = out || {};
    var i = j % 6, k = (j / 6) | 0, L = lotusAt(i, t, LP), born = L.wake + 0.7 + 0.35 * k, up = ease(ramp(t, born, born + 2.2));
    var a = k * TAU / DEW_PER + i + soft * (0.35 * t + 0.6 * up), rad = (0.12 + 0.3 * up) * L.scale;
    var hx = L.x + Math.cos(a) * rad, hz = L.z + Math.sin(a) * rad;
    var hy = L.y + 0.35 * L.scale + (0.25 + 0.75 * hsh(j, 1)) * up * L.scale * 0.8 + soft * 0.07 * Math.sin(t * 1.5 + j);
    var st = dewStep(j), tS = dewLand(j), d = ease(ramp(t, tS - 2.4, tS));
    var sx = P0[0] + PD[0] * st.s + PN[0] * st.side, sz = P0[1] + PD[1] * st.s + PN[1] * st.side;
    out.x = lerp(hx, sx, d); out.z = lerp(hz, sz, d); out.y = lerp(hy, WATER_Y + 0.08, d) + 4 * d * (1 - d) * 0.5;
    var breathe = 0.85 + 0.15 * Math.sin(t * 2.0 + j * 1.3);
    out.alpha = up * breathe; out.settled = d; out.tone = i;
    // Settled beads grow for the wide shots so the stepping lights stay readable on a phone.
    out.size = (0.3 + 0.08 * hsh(j, 2)) * (1 + 0.35 * up) * (1 + d * (0.5 + 0.6 * ease(ramp(t, 32, 46)))) * (1 + 0.35 * L.chorus);
    return out;
  }
  /* The little boat: a lamp at its bow, it slips out from the shore at the start of the fourth beat and glides along
   * the path towards the moon, slow and steady; its wake is the same path at earlier times. */
  var BOAT_T0 = 31.5, BOAT_SCALE = 2.6;
  function boatS(t) { var u = ramp(t, BOAT_T0, DURATION + 2); return -0.6 + 15.5 * (0.35 * u + 0.65 * u * u * (1.6 - 0.6 * u)); }
  function boatAt(t, out) {
    out = out || {};
    var s = boatS(t);
    onPath(s, 0, out);
    out.y = WATER_Y + 0.02 + soft * 0.03 * Math.sin(t * 1.4);
    out.yaw = Math.atan2(PD[0], PD[1]);
    out.roll = soft * 0.05 * Math.sin(t * 1.1 + 0.4); out.pitch = soft * 0.03 * Math.sin(t * 0.9);
    out.alpha = ease(ramp(t, BOAT_T0 - 1.2, BOAT_T0 + 0.6)); out.glow = out.alpha * (0.75 + 0.25 * Math.sin(t * 2.1) * soft);
    // Drawn larger as it sails away and the camera pulls out (L3's lesson), so the hull still reads on a 390-wide phone.
    out.scale = BOAT_SCALE * (1 + 0.35 * ease(ramp(t, 34, 40)) + 0.5 * ease(ramp(t, 40, 49)));
    out.s = s;
    return out;
  }
  var WAKE = 14, WB = {};
  function wakeAt(j, t, out) {
    out = out || {};
    // Foam dabs on the two arms of the V (Kelvin half-angle 19.47 deg: the arms spread tan = 0.354 per metre behind).
    var age = 0.3 + (j >> 1) * 0.55, s = boatS(t - age), b = boatAt(t, WB), back = b.s - s, side = (j & 1 ? 1 : -1) * (0.2 * b.scale / BOAT_SCALE + 0.354 * back);
    onPath(s, side, out); out.y = WATER_Y + 0.04;
    out.alpha = b.alpha * (1 - 0.8 * (j >> 1) / (WAKE >> 1)) * (s > -0.5 ? 1 : 0) * ramp(t - age, BOAT_T0 - 0.5, BOAT_T0 + 1);
    out.size = (0.45 + 0.1 * (j >> 1)) * b.scale / BOAT_SCALE;
    return out;
  }
  /* Fireflies (earlier chapters' 星萤) and lanterns (the star lamps' light) come back to see the boat off: fireflies
   * over the lotuses and along the path, lanterns lifting from the shore and drifting out over the water. */
  var FLIES = 22, LANTERNS = 6;
  function flyAt(j, t, out) {
    out = out || {};
    var b = 33 + 4 * hsh(j, 1), s = 0.5 + 10 * hsh(j, 2), side = (hsh(j, 3) - 0.5) * 4.2, p = onPath(s, side, {}), a = t * (0.4 + 0.5 * hsh(j, 4)) * soft + j;
    out.x = p.x + 0.45 * Math.cos(a); out.z = p.z + 0.45 * Math.sin(a * 1.3);
    out.y = 0.4 + 1.4 * hsh(j, 5) + soft * 0.25 * Math.sin(t * 0.9 + j * 1.7);
    var blink = 0.5 + 0.5 * Math.sin(t * (1.3 + 1.2 * hsh(j, 6)) + j * 2.1);
    out.alpha = ease(ramp(t, b, b + 2.5)) * (0.6 + 0.4 * blink * blink); out.size = (0.4 + 0.12 * hsh(j, 7)) * (1 + 0.4 * ease(ramp(t, 40, 48)));
    return out;
  }
  function lanternAt(j, t, out) {
    out = out || {};
    var b = 34.5 + 1.1 * j, u = ramp(t, b, b + 15), s = -1.2 + 0.8 * j * 0.5 + 7 * ease(u), side = (j % 2 ? 1 : -1) * (1.6 + 0.35 * j);
    var p = onPath(s, side, {});
    out.x = p.x + soft * 0.15 * Math.sin(t * 0.5 + j); out.z = p.z;
    out.y = 0.6 + 3.2 * ease(u) + soft * 0.1 * Math.sin(t * 0.8 + j * 1.9);
    out.alpha = ease(ramp(t, b, b + 1.5)); out.size = (0.9 + 0.12 * hsh(j, 3)) * (1 + 0.35 * ease(ramp(t, 40, 48)));
    out.tone = j;
    return out;
  }
  function listAt(fn, n, t) { var out = []; for (var j = 0; j < n; j++) out.push(fn(j, t, {})); return out; }
  /* Camera keys: look-at point, azimuth th, polar phi, half-width w that must stay in frame, and lift = how far above
   * the look-at the frame centre sits (in half-screens). th = 2.0 looks straight down the path towards the moon. */
  // Wide establishing shot over the shore, a glide down to the waking lotuses, along the path as it lights,
  // behind the boat, then a slow crane up into the wide moonlit bay for the title.
  var CAM = [
    { t: 0, x: 6.7, y: 0.8, z: -0.1, th: 2.1, phi: 1.44, w: 7.6, lift: 0.18 },
    { t: 10, x: 6.9, y: 0.5, z: -0.6, th: 2.03, phi: 1.41, w: 5.4, lift: 0.1 },
    { t: 16, x: 7.3, y: 0.4, z: -1.5, th: 1.97, phi: 1.38, w: 4.4, lift: 0.07 },
    { t: 21, x: 7.7, y: 0.4, z: -2.4, th: 1.95, phi: 1.39, w: 4.8, lift: 0.08 },
    { t: 27, x: 8.6, y: 0.5, z: -4.2, th: 1.98, phi: 1.42, w: 6.0, lift: 0.12 },
    { t: 32, x: 7.0, y: 0.5, z: -1.0, th: 2.02, phi: 1.42, w: 5.2, lift: 0.1 },
    { t: 38, x: 7.6, y: 0.6, z: -2.4, th: 2.0, phi: 1.43, w: 5.6, lift: 0.12 },
    { t: 44, x: 9.2, y: 0.9, z: -5.9, th: 1.98, phi: 1.46, w: 7.2, lift: 0.18 },
    { t: 50, x: 10.4, y: 1.3, z: -8.5, th: 1.99, phi: 1.49, w: 8.6, lift: 0.22 }
  ];
  var CAM_KEYS = ['x', 'y', 'z', 'th', 'phi', 'w', 'lift'];
  // One continuous move: a cubic Hermite through the keys (C1, so the camera never stops and restarts at a key).
  function camSlope(i, key) {
    if (i <= 0 || i >= CAM.length - 1) return 0;
    var a = CAM[i - 1], b = CAM[i], c = CAM[i + 1], d0 = (b[key] - a[key]) / (b.t - a.t), d1 = (c[key] - b[key]) / (c.t - b.t);
    if (d0 * d1 <= 0) return 0;
    var m = (c[key] - a[key]) / (c.t - a.t), lim = 3 * Math.min(Math.abs(d0), Math.abs(d1));
    return Math.abs(m) > lim ? (m < 0 ? -lim : lim) : m;
  }
  function cameraAt(t) {
    var i = 0;
    while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
    var a = CAM[i], b = CAM[i + 1], h = b.t - a.t, u = ramp(t, a.t, b.t), u2 = u * u, u3 = u2 * u, out = {};
    var h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = 3 * u2 - 2 * u3, h11 = u3 - u2;
    for (var k = 0; k < CAM_KEYS.length; k++) {
      var key = CAM_KEYS[k];
      out[key] = h00 * a[key] + h10 * h * camSlope(i, key) + h01 * b[key] + h11 * h * camSlope(i + 1, key);
    }
    return out;
  }
  // Everything the renderer needs, derived from t alone.
  function frame(t, lite) {
    var b = beatAt(t), local = t - b.t0, len = b.t1 - b.t0, sk = skyAt(t);
    return {
      t: t, beat: b.id, caption: b.caption,
      captionAlpha: b.caption ? Math.min(ramp(local, 0.4, 1.8), 1 - ramp(local, len - 1.4, len - 0.2)) : 0,
      look: 'painterly-moonlit-night', sky: sk, moon: moonAt(t), wind: windAt(0, 0, t), path: pathAt(t),
      veil: 0.08 - 0.03 * sk.warm, light: 0.55 + 0.25 * sk.warm,
      lotuses: listAt(lotusAt, 6, t), boat: boatAt(t, {}),
      bars: ease(ramp(t, 0, 2.5)),
      title: ease(ramp(t, TITLE_AT, TITLE_AT + TITLE_FADE)),
      canContinue: t >= DURATION,
      dew: lite ? null : listAt(dewAt, DEWS, t), flies: lite ? null : listAt(flyAt, FLIES, t), lanterns: lite ? null : listAt(lanternAt, LANTERNS, t),
      camera: cameraAt(t)
    };
  }

  /* ------------------------------ Stage ------------------------------
   * Display-only actors on the live island. The game's own level-5 lotus group (flowers, stations, the short finale's
   * boat and lanterns, the moon ring), HUD, dock and sky are hidden and frozen while it is up (journey.js checks
   * staged()); nothing here feeds back into rewards or saves. */
  var H = null, T = null, st = null, staged = false, kept = null;
  var PAL = {
    dusk: { top: 0x2a2f5e, mid: 0x5a5a8e, hor: 0xa58cb0, low: 0x2c3462, lit: 0xc9c4e0, shade: 0x5a5888, key: 0x9aa6d8, keyI: 0.45, hemiA: 0x8e9ad0, hemiB: 0x3a3c60, hemiI: 0.7, grass: [0.5, 0.6, 0.86], fog: 0x4a4f7e },
    night: { top: 0x141a3e, mid: 0x2e3a70, hor: 0x6a6aa0, low: 0x1c2450, lit: 0xd8dcf0, shade: 0x3a4072, key: 0xc8d0f0, keyI: 0.5, hemiA: 0x7c88c4, hemiB: 0x262a4c, hemiI: 0.64, grass: [0.46, 0.58, 0.9], fog: 0x2a3060 }
  };
  var MOON_COL = 0xffe4a8, MOON_DISC = 0.055, MOON_KEEP = 0.085, MAX_PR = 1.5; // sines of the disc's angular radius and of the angle kept clear round it
  var ramp4 = null, toons = {}, painted = [], tmpB = null, PETALS = 13;
  function sprite(map, color, additive) {
    var m = new T.SpriteMaterial({ map: map, color: color, transparent: true, opacity: 0, depthWrite: false, fog: false });
    if (additive) m.blending = T.AdditiveBlending;
    return new T.Sprite(m);
  }
  function part(geo, mat, parent, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); parent.add(m); return m; }
  // Flat gouache shading: the island's Lambert materials are swapped for a 4-step toon ramp while staged.
  function toonFor(m) {
    var out = toons[m.uuid];
    if (out) return out;
    out = new T.MeshToonMaterial({ color: m.color, map: m.map, gradientMap: ramp4, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity,
      transparent: m.transparent, opacity: m.opacity, side: m.side, vertexColors: m.vertexColors, alphaTest: m.alphaTest, depthWrite: m.depthWrite, fog: m.fog });
    toons[m.uuid] = out;
    return out;
  }
  function paint() {
    H.island.traverse(function (o) {
      if (!o.isMesh || o.isSkinnedMesh || o.l5cs || !o.material || o.material.length !== undefined || !o.material.isMeshLambertMaterial) return;
      o.l5cs = true; painted.push([o, o.material]); o.material = toonFor(o.material);
    });
  }
  function unpaint() {
    for (var i = 0; i < painted.length; i++) { painted[i][0].material = painted[i][1]; painted[i][0].l5cs = false; }
    painted = [];
  }
  var NOISE_GLSL = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }' +
    'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; } return s; }';
  var WIND_GLSL = 'float windF(vec2 p, float t){ float a = p.x * 0.6 + p.y * 0.8; float b = -p.x * 0.8 + p.y * 0.6;' +
    ' return (0.6 + 0.4 * sin(t * 0.27 + 0.4 + a * 0.1)) * (0.6 * sin(a * 1.1 - t * 1.3) + 0.25 * sin(b * 1.9 - t * 1.0 + a * 0.6) + 0.15 * sin(a * 3.1 - t * 2.6)); }';
  /* The moon (borrowed from the L3 night sky and the Godot simple-sky moon: an angular disc with a soft blurred edge,
   * stars hidden behind it): a cream-gold disc with faint warm-grey seas and a brushed rim inside a two-layer halo. */
  var MOON_GLSL =
    ' float s = max(dot(d, uMoon), 0.0);' +
    ' vec3 haloC = mix(vec3(1.0, 0.86, 0.6), vec3(1.0, 0.8, 0.52), uWarm);' +
    ' col = mix(col, haloC, clamp(pow(s, 6.0) * 0.16 + pow(s, 60.0) * 0.3 + pow(s, 600.0) * 0.36, 0.0, 0.85) * (0.6 + 0.4 * uGlow));' +
    ' float disc = smoothstep(0.99842, 0.99895, s + (wash - 0.5) * 0.0003);' +
    ' float seas = smoothstep(0.45, 0.72, noise(d.xy * 52.0 + 3.0)) * 0.5 + smoothstep(0.6, 0.8, noise(d.xy * 120.0 + 9.0)) * 0.2;' +
    ' vec3 moonPaint = mix(vec3(1.0, 0.93, 0.72), vec3(0.9, 0.78, 0.55), seas); moonPaint = mix(moonPaint, vec3(1.0, 0.84, 0.56), smoothstep(0.9989, 0.99848, s) * 0.6);';
  // Procedural paper/brush: speckle, fibres and streaks (drawn once on a canvas and tiled by CSS).
  function buildStage() {
    if (st || !H || !T) return !!st;
    var g = new T.Group(), i, k;
    g.visible = false; H.island.add(g);
    st = { g: g, lotuses: [], v: new T.Vector3(), eye: new T.Vector3(), moonDir: new T.Vector3(), tick: 0, pose: {}, q: { x: 0, y: 0, z: 0, d: 9 }, moonMin: 9 };
    tmpB = new T.Color();
    ramp4 = new T.DataTexture(new Uint8Array([96, 160, 218, 255]), 4, 1, T.LuminanceFormat);
    ramp4.minFilter = ramp4.magFilter = T.NearestFilter; ramp4.generateMipmaps = false; ramp4.needsUpdate = true;
    /* Watercolour night sky in one shader: a washed blue-violet gradient, hashed stars that twinkle (never on the moon),
     * the cream-gold moon with its halo, big night clouds with silver rims (kept low under the moon), and below the
     * horizon the far bay: dark water with the moon's glitter path. */
    st.skyU = { uTime: { value: 0 }, uStars: { value: 0 }, uWarm: { value: 0 }, uGlow: { value: 0 }, uMoon: { value: new T.Vector3() } };
    var names = ['Top', 'Mid', 'Hor', 'Low', 'Lit', 'Shade'];
    for (i = 0; i < names.length; i++) st.skyU['u' + names[i]] = { value: new T.Color() };
    st.sky = new T.Mesh(new T.SphereGeometry(110, 32, 20), new T.ShaderMaterial({ uniforms: st.skyU, side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uMoon;' +
        'uniform float uTime; uniform float uStars; uniform float uWarm; uniform float uGlow; varying vec3 vDir;' + NOISE_GLSL +
        'void main(){ vec3 d = normalize(vDir); float h = d.y; float wash = fbm(d.xz * 2.2 + d.y * 3.0 + 3.1); float hh = h + (wash - 0.5) * 0.18;' +
        ' vec3 col = mix(uHor, uMid, smoothstep(-0.03, 0.18, hh)); col = mix(col, uTop, smoothstep(0.12, 0.6, hh));' +
        ' col *= 0.93 + 0.14 * wash;' +
        // the sky warms round the moon (a broad blush, wider as the night goes on)
        ' float sm = max(dot(d, uMoon), 0.0); col = mix(col, vec3(0.98, 0.8, 0.62), pow(sm, 10.0 - 4.0 * uWarm) * (0.18 + 0.2 * uWarm));' +
        // stars: one per hashed cell, small soft dabs of white gouache
        ' float starL = 0.0; vec3 starC = vec3(1.0);' +
        ' if (h > -0.02 && uStars > 0.0) { vec2 sp = d.xz / (abs(h) + 0.42) * 15.0; vec2 c = floor(sp); float r = hash(c);' +
        '  if (r > 0.72) { vec2 o = (vec2(hash(c + 3.1), hash(c + 7.7)) - 0.5) * 0.6; float dist = length(fract(sp) - 0.5 - o); float sz = 0.035 + 0.06 * hash(c + 1.3);' +
        '   starL = smoothstep(sz, 0.0, dist) * (0.62 + 0.38 * sin(uTime * (1.0 + 3.0 * r) + r * 40.0)) * uStars * smoothstep(-0.02, 0.14, h) * (1.0 - smoothstep(0.985, 0.996, sm));' +
        '   starC = mix(vec3(1.0, 0.93, 0.8), vec3(0.82, 0.9, 1.0), hash(c + 9.2)); } }' +
        MOON_GLSL +
        ' col = mix(col + starC * starL * (1.0 - disc), moonPaint, disc);' +
        // Big night cumulus heaped along the horizon (lower under the moon so the disc stays clear), three flat tones,
        // a silver rim brightest on the moon's side, and a darker pigment edge where the wash dried.
        ' if (h > -0.3 && h < 0.66) { float az = atan(d.x, -d.z) + uTime * 0.004; vec2 p = vec2(az * 1.4, h * 3.2);' +
        '  float big = noise(vec2(az * 1.1 + 2.0, 2.5)); float mid = noise(vec2(az * 2.9 + 1.7, 9.5));' +
        '  float dAz = az - atan(uMoon.x, -uMoon.z); float bank = smoothstep(0.1, 0.3, dAz) * smoothstep(1.3, 0.75, dAz) + 0.8 * smoothstep(-0.12, -0.3, dAz) * smoothstep(-1.3, -0.75, dAz);' +
        '  float top = -0.01 + 0.36 * smoothstep(0.2, 0.8, big) + 0.24 * bank * (0.6 + 0.4 * mid) + 0.1 * mid - 0.12 * smoothstep(0.97, 0.995, sm); float bil = fbm(p * 2.6 + 4.0);' +
        '  float e = top - h + (bil - 0.5) * 0.3; float wet = 0.012 + 0.07 * smoothstep(0.35, 0.75, noise(p * 1.7 + 11.0)); float mask = smoothstep(0.0, wet, e);' +
        '  float rim = 1.0 - smoothstep(0.0, 0.1, e);' +
        '  float lite = rim * 0.85 + smoothstep(0.5, 0.75, bil) * 0.35 - smoothstep(0.2, 0.5, e) * 0.2;' +
        '  lite = clamp(lite, 0.0, 1.0) * 3.0 + 0.5; lite = clamp((floor(lite) + smoothstep(0.0, 0.35, fract(lite)) - 1.0) / 3.0, 0.0, 1.0);' +
        '  vec3 cloud = mix(uShade, uLit, lite * 0.8) * (0.95 + 0.1 * wash); cloud = mix(cloud, uShade * 0.8, smoothstep(0.02, 0.0, abs(e - 0.03)) * 0.25);' +
        '  cloud = mix(cloud, vec3(0.94, 0.95, 1.0), rim * (0.25 + 0.6 * pow(sm, 4.0))); cloud = mix(cloud, vec3(1.0, 0.88, 0.66), rim * pow(sm, 12.0) * 0.5);' +
        '  col = mix(col, cloud, mask * 0.95 * (1.0 - smoothstep(0.972, 0.993, sm))); }' +
        // The far bay below the horizon: dark still water, the sky's colour faintly mirrored, the moon's glitter path.
        ' if (hh < 0.03) { float az2 = max(dot(normalize(d.xz), normalize(uMoon.xz)), 0.0); vec2 uv = d.xz / (0.08 - min(h, 0.0)) * 0.6;' +
        '  float rip = noise(vec2(uv.x * 0.6, uv.y * 4.0) + vec2(0.0, uTime * 0.15));' +
        '  vec3 sea = mix(uLow, uHor, 0.25 + 0.2 * rip) * (0.95 + 0.1 * wash);' +
        '  sea = mix(sea, vec3(1.0, 0.88, 0.62), pow(az2, 60.0) * smoothstep(0.35, 0.75, rip) * 0.8);' +
        '  col = mix(col, sea, smoothstep(0.03, -0.04, hh)); }' +
        ' col *= 0.975 + 0.05 * hash(floor(gl_FragCoord.xy * 0.5)); gl_FragColor = vec4(col, 1.0); }' }));
    st.sky.renderOrder = -10; st.sky.frustumCulled = false; st.sky.visible = false; H.scene.add(st.sky);
    /* The bay: one large still-water disc just below the grass edge (it hides the island's earth and rock, so the
     * island reads as a green shore in the bay). One shader: the sky's colours mirrored by a Fresnel term, wind ripple
     * streaks, the moon's glitter (the view ray reflected off a gently rippled surface), the path of light along the
     * route home revealed from the shore outwards, and soft pigment pooling (a darker drying edge) at the shoreline. */
    st.waterU = { uTime: { value: 0 }, uMoon: { value: new T.Vector3() }, uReach: { value: 0 }, uPathGlow: { value: 0 }, uWarm: { value: 0 }, uSoft: { value: soft },
      uP0: { value: new T.Vector2(P0[0], P0[1]) }, uPD: { value: new T.Vector2(PD[0], PD[1]) }, uBoat: { value: new T.Vector4(0, 0, 0, 1) },
      uLot: { value: [] }, uLotC: { value: [] }, uRingA: { value: [0, 0, 0, 0, 0, 0] } };
    for (i = 0; i < 6; i++) { st.waterU.uLot.value.push(new T.Vector4(0, 0, 0, 0)); st.waterU.uLotC.value.push(new T.Color(BLOOMS[i][1])); }
    names = ['Top', 'Hor', 'Low'];
    for (i = 0; i < names.length; i++) st.waterU['u' + names[i]] = st.skyU['u' + names[i]];
    var wg = new T.CircleGeometry(60, 64); wg.rotateX(-Math.PI / 2);
    st.water = new T.Mesh(wg, new T.ShaderMaterial({ uniforms: st.waterU, fog: false,
      vertexShader: 'varying vec3 vW; varying vec2 vL; void main(){ vL = position.xz; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uMoon; uniform vec2 uP0; uniform vec2 uPD; uniform vec4 uBoat; uniform vec4 uLot[6]; uniform vec3 uLotC[6]; uniform float uRingA[6];' +
        'uniform float uTime; uniform float uReach; uniform float uPathGlow; uniform float uWarm; uniform float uSoft; varying vec3 vW; varying vec2 vL;' + NOISE_GLSL + WIND_GLSL +
        'void main(){ vec3 v = normalize(vW - cameraPosition); float dist = length(vW.xz - cameraPosition.xz);' +
        ' float w = windF(vL, uTime); float rip = noise(vec2(vL.x * 0.9 + vL.y * 0.3, vL.y * 3.2 - vL.x * 0.4) + vec2(uTime * 0.12, uTime * 0.3) * uSoft);' +
        ' vec3 n = normalize(vec3((rip - 0.5) * 0.09 + 0.02 * w * uSoft, 1.0, (noise(vL * 2.3 + uTime * 0.2 * uSoft) - 0.5) * 0.12));' +
        ' vec3 r = reflect(v, n); float fres = 0.25 + 0.75 * pow(1.0 - max(r.y, 0.0), 3.0);' +
        ' vec3 col = mix(uLow * 0.85, mix(uHor, uTop, clamp(r.y * 2.5, 0.0, 1.0)), fres * 0.7);' +
        ' col *= 0.92 + 0.12 * fbm(vL * 0.35 + 2.0);' +
        // wind streaks: pale cat's-paws running across the bay with the gusts
        ' col += vec3(0.2, 0.22, 0.32) * smoothstep(0.62, 0.95, noise(vec2(dot(vL, vec2(0.6, 0.8)) * 0.7 - uTime * 0.5 * uSoft, dot(vL, vec2(-0.8, 0.6)) * 3.5))) * (0.3 + 0.4 * w) * 0.5;' +
        // the moon mirrored: a glitter column that breaks up on the ripples
        ' float g = max(dot(r, uMoon), 0.0); float glit = pow(g, 300.0) * 1.1 + pow(g, 60.0) * 0.2 * smoothstep(0.5, 0.85, rip) + pow(g, 14.0) * 0.035;' +
        ' col += vec3(1.0, 0.86, 0.58) * glit;' +
        // the path of light home: lit from the shore out to uReach, warm gold, softly broken by the ripples
        ' vec2 q = vL - uP0; float along = dot(q, uPD); float across = abs(q.x * uPD.y - q.y * uPD.x); float hw = 0.62 + 0.045 * along;' +
        ' float lane = smoothstep(hw, hw * 0.25, across) * smoothstep(-0.8, 0.2, along) * smoothstep(uReach + 0.2, uReach - 1.6, along);' +
        ' float br = 0.55 + 0.45 * smoothstep(0.3, 0.75, noise(vec2(along * 2.4 - uTime * 0.6 * uSoft, across * 6.0)));' +
        ' float skirt = smoothstep(hw * 2.4, hw * 0.6, across) * smoothstep(-0.8, 0.2, along) * smoothstep(uReach + 0.6, uReach - 2.5, along);' +
        ' col += vec3(0.32, 0.22, 0.1) * skirt * uPathGlow * 0.6;' +
        ' col = mix(col, vec3(1.0, 0.85, 0.56), lane * uPathGlow * br * 0.82); col += vec3(0.5, 0.36, 0.16) * lane * uPathGlow * 0.3;' +
        // each lotus pools its colour on the water under it (moonlight on the leaves), and sends a ripple ring out as it opens
        ' for (int i = 0; i < 6; i++) { vec4 L = uLot[i]; float dl = length(vL - L.xy);' +
        '  col += uLotC[i] * (exp(-dl * dl * 0.8) * L.z * 0.3 + smoothstep(0.12, 0.0, abs(dl - L.w)) * uRingA[i] * 0.7); }' +
        // the boat's wake: a pale V spreading behind it
        ' vec2 bq = vL - uBoat.xy; float ba = -dot(bq, uPD); float bc = abs(bq.x * uPD.y - bq.y * uPD.x); float wk = smoothstep(0.0, 0.5, ba) * smoothstep(6.5 * uBoat.w, 0.4, ba) * (smoothstep(0.16 * uBoat.w, 0.0, abs(bc - ba * 0.354 - 0.2 * uBoat.w)) + 0.45 * smoothstep(0.35 * uBoat.w, 0.0, bc)) * uBoat.z;' +
        ' col = mix(col, vec3(0.86, 0.9, 1.0), clamp(wk * 0.55, 0.0, 0.7));' +
        // the bow lamp mirrored: a warm streak on the water from the boat towards the lens
        ' vec2 tc = normalize(cameraPosition.xz - uBoat.xy); vec2 lq = vL - uBoat.xy - uPD * 0.5 * uBoat.w; float la = dot(lq, tc); float lc = abs(lq.x * tc.y - lq.y * tc.x);' +
        ' col += vec3(1.0, 0.72, 0.38) * smoothstep(0.22 * uBoat.w, 0.0, lc) * smoothstep(-0.2, 0.3, la) * smoothstep(3.0 * uBoat.w, 0.2, la) * (0.6 + 0.4 * rip) * uBoat.z * 0.7;' +
        // pigment pooled at the shore (the island rim at r = 5) and the far water melting into the sky's far bay
        ' float shore = length(vL); col = mix(col, uLow * 0.55, smoothstep(5.7, 5.02, shore) * 0.55);' +
        ' col = mix(col, mix(uLow, uHor, 0.3), smoothstep(30.0, 58.0, dist));' +
        ' col *= 0.975 + 0.05 * hash(floor(gl_FragCoord.xy * 0.5)); gl_FragColor = vec4(col, 1.0); }' }));
    st.water.position.y = H.TOP_Y + WATER_Y; st.water.renderOrder = -2; st.water.l5cs = true; g.add(st.water);
    // Tall grass and wildflowers: instanced blades bent by the travelling wind wave; moon-silver crests.
    var seed = 59, n = H.IS_MOBILE ? 1400 : 2200, off = [], dim = [], hoff = [], hdim = [];
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 0; i < n; i++) {
      var a = rnd() * TAU, r = Math.sqrt(rnd()) * 4.85, x = Math.cos(a) * r, z = Math.sin(a) * r;
      var hgt = 0.26 + 0.3 * rnd() + (r > 3.4 ? 0.26 * rnd() : 0), flower = i % 7 === 0;
      if (H.POND && Math.sqrt((x - H.POND.x) * (x - H.POND.x) + (z - H.POND.z) * (z - H.POND.z)) < 1.45) continue;
      if (flower) { hgt = 0.42 + 0.24 * rnd(); hoff.push(x, z, 0); hdim.push(hgt, 0.07 + 0.04 * rnd(), rnd()); }
      off.push(x, z, rnd() * TAU); dim.push(hgt, flower ? 0.022 : 0.05 + 0.03 * rnd(), rnd());
    }
    st.grassU = { uTime: { value: 0 }, uSoft: { value: soft }, uTopY: { value: H.TOP_Y }, uLight: { value: new T.Vector3(1, 1, 1) },
      uRoot: { value: new T.Color(0x2c5a58) }, uTip: { value: new T.Color(0x8fb8a8) } };
    function field(basePos, index, o, d, head) {
      var geo = new T.InstancedBufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(basePos, 3)); geo.setIndex(index);
      geo.setAttribute('aOff', new T.InstancedBufferAttribute(new Float32Array(o), 3)); geo.setAttribute('aDim', new T.InstancedBufferAttribute(new Float32Array(d), 3));
      geo.instanceCount = o.length / 3;
      var mesh = new T.Mesh(geo, new T.ShaderMaterial({ uniforms: st.grassU, side: T.DoubleSide, defines: head ? { HEAD: 1 } : {},
        vertexShader: 'attribute vec3 aOff; attribute vec3 aDim; uniform float uTime; uniform float uSoft; uniform float uTopY; varying float vH; varying float vW; varying float vR;' + WIND_GLSL +
          'void main(){ float w = windF(aOff.xy, uTime); float lean = 0.22 + 0.6 * uSoft * w;\n#ifdef HEAD\n float h = 1.0; vec3 p = vec3(position.x, (1.0 - length(position.xy)) * 0.45, position.y) * aDim.y; p.y += aDim.x;\n' +
          '#else\n float h = position.y; float px = position.x * aDim.y * (1.0 - h * 0.82); vec3 p = vec3(px * cos(aOff.z), h * aDim.x, px * sin(aOff.z));\n#endif\n' +
          ' float k = lean * h * h * aDim.x; p.x += 0.6 * k; p.z += 0.8 * k; p.y -= 0.4 * lean * lean * h * h * aDim.x; vH = h; vW = w; vR = aDim.z;' +
          ' gl_Position = projectionMatrix * modelViewMatrix * vec4(aOff.x + p.x, uTopY + p.y, aOff.y + p.z, 1.0); }',
        fragmentShader: 'uniform vec3 uRoot; uniform vec3 uTip; uniform vec3 uLight; varying float vH; varying float vW; varying float vR;' +
          'void main(){\n#ifdef HEAD\n vec3 col = vR < 0.35 ? vec3(0.96, 0.95, 1.0) : vR < 0.6 ? vec3(0.86, 0.8, 1.0) : vR < 0.82 ? vec3(1.0, 0.9, 0.62) : vec3(0.7, 0.86, 1.0); col *= mix(uLight, vec3(1.0), 0.3);\n' +
          '#else\n vec3 col = mix(uRoot, uTip, clamp(floor(vH * 3.0 + vR * 0.7) / 3.0, 0.0, 1.0)) * (0.92 + 0.16 * vR) * uLight; col += vec3(0.16, 0.18, 0.26) * smoothstep(0.25, 0.7, vW) * vH;\n#endif\n' +
          ' gl_FragColor = vec4(col, 1.0); }' }));
      mesh.frustumCulled = false; mesh.l5cs = true; g.add(mesh);
      return mesh;
    }
    st.grass = field([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.34, 0, 0.5, 0.34, 0, -0.5, 0.67, 0, 0.5, 0.67, 0, 0, 1, 0], [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6], off, dim, false);
    var discP = [0, 0, 0], di = [];
    for (i = 0; i < 6; i++) { discP.push(Math.cos(i * TAU / 6), Math.sin(i * TAU / 6), 0); di.push(0, 1 + i, 1 + (i + 1) % 6); }
    st.heads = field(discP, di, hoff, hdim, true);
    st.blades = off.length / 3; st.blooms = hoff.length / 3;
    /* The six lotuses, in the game's own look (lotus-chapter.js: a jade leaf pad, petals = stretched spheres on hinges
     * round the stem that fold from a bud to an open cup, a gold seed head, a soft halo in the petal colour), as
     * display-only copies. Three instanced draws for all six (pads, 8 outer + 5 inner petals each, seeds) plus six
     * halo sprites; a frame only rewrites instance matrices and colours. */
    var petGeo = new T.SphereGeometry(1, 10, 6), pp = petGeo.attributes.position;
    for (i = 0; i < pp.count; i++) {
      // a pointed petal: stretched sphere, tapering to a tip that curls up a little
      var px = pp.getX(i) * 0.1, py = pp.getY(i) * 0.05, pz = pp.getZ(i) * 0.27, tip = Math.max(0, pz / 0.27);
      pp.setXYZ(i, px * (1 - 0.6 * tip * tip), py + 0.07 * tip * tip, pz + 0.29);
    }
    petGeo.computeVertexNormals();
    var padGeo = new T.CylinderGeometry(0.62, 0.6, 0.035, 24, 1, false, 0.22, TAU - 0.44), seedGeo = new T.SphereGeometry(0.11, 10, 6);
    seedGeo.scale(1, 0.6, 1);
    st.petals = new T.InstancedMesh(petGeo, new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x3a3048, side: T.DoubleSide }), 6 * PETALS);
    st.pads = new T.InstancedMesh(padGeo, new T.MeshLambertMaterial({ color: 0x64a7a1, emissive: 0x16302e }), 6);
    st.seeds = new T.InstancedMesh(seedGeo, new T.MeshBasicMaterial({ color: 0xffffff, fog: false }), 6);
    var im = [st.pads, st.petals, st.seeds];
    for (i = 0; i < im.length; i++) { im[i].l5cs = true; im[i].frustumCulled = false; im[i].instanceMatrix.setUsage(T.DynamicDrawUsage); g.add(im[i]); }
    for (i = 0; i < 6 * PETALS; i++) st.petals.setColorAt(i, tmpB.setHex(BLOOMS[(i / PETALS) | 0][1]));
    for (i = 0; i < 6; i++) { st.seeds.setColorAt(i, tmpB.setHex(0xffe7ad)); st.pads.setColorAt(i, tmpB.setHex(0xffffff)); }
    st.m0 = new T.Matrix4(); st.m1 = new T.Matrix4(); st.m2 = new T.Matrix4(); st.qn = new T.Quaternion(); st.eu = new T.Euler(); st.sc = new T.Vector3(); st.ps = new T.Vector3();
    st.lotusC = [];
    for (i = 0; i < 6; i++) {
      var halo = sprite(H.glowTex, BLOOMS[i][1], true); g.add(halo);
      st.lotuses.push({ halo: halo, open: 0, x: 0 }); st.lotusC.push(new T.Color(BLOOMS[i][1]));
    }
    /* Dew, fireflies, lanterns and the boat's wake dabs share one Points cloud (one draw). A frame only rewrites two small
     * typed arrays; nothing is allocated. Slots: dew, fireflies, lanterns, wake. */
    var NP = DEWS + FLIES + LANTERNS + WAKE;
    st.np = NP; st.pPos = new Float32Array(NP * 3); st.pA = new Float32Array(NP * 4); st.pCol = new Float32Array(NP * 3);
    for (i = 0; i < NP; i++) {
      var hex = i < DEWS ? BLOOMS[i % 6][1] : i < DEWS + FLIES ? (i % 3 ? 0xd8ff9a : 0xfff0a8) : i < DEWS + FLIES + LANTERNS ? 0xffb862 : 0xdfe6ff;
      tmpB.setHex(hex); st.pCol[i * 3] = tmpB.r; st.pCol[i * 3 + 1] = tmpB.g; st.pCol[i * 3 + 2] = tmpB.b;
    }
    st.ptU = { uPx: { value: 800 } };
    var pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(st.pPos, 3)); pg.setAttribute('aA', new T.BufferAttribute(st.pA, 4)); pg.setAttribute('aCol', new T.BufferAttribute(st.pCol, 3));
    // aA = alpha, world size, unused, kind (0 dew, 1 firefly, 2 lantern, 3 wake)
    st.points = new T.Points(pg, new T.ShaderMaterial({ uniforms: st.ptU, transparent: true, depthWrite: false,
      vertexShader: 'attribute vec4 aA; attribute vec3 aCol; uniform float uPx; varying float vA; varying float vK; varying vec3 vCol;' +
        'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aA.x; vK = aA.w; vCol = aCol; gl_PointSize = aA.x > 0.003 ? clamp(aA.y * uPx / max(-mv.z, 0.1), 2.0, 140.0) : 0.0; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; varying float vK; varying vec3 vCol; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; if (r > 1.0) discard;' +
        ' float core = smoothstep(0.34, 0.12, r), halo = pow(1.0 - r, 2.2); vec3 col; float a;' +
        // a lantern: a warm paper body (rounded box) with a bright heart, inside a wide glow
        ' if (vK > 1.5 && vK < 2.5) { float body = smoothstep(0.24, 0.2, length(q * vec2(1.25, 0.95))); float rib = 0.85 + 0.15 * cos(q.y * 60.0);' +
        '  col = mix(vCol * 1.1, vec3(1.0, 0.96, 0.82), smoothstep(0.2, 0.0, length(q)) * 0.8) * mix(1.0, rib, body); a = max(body * 0.97, halo * 0.9); }' +
        ' else if (vK > 2.5) { col = vCol; a = halo * 0.5; }' +
        ' else { col = mix(vCol, vec3(1.0, 0.98, 0.92), core * 0.8) * (1.0 + 0.3 * halo); a = max(core, min(1.0, halo * 1.1)); }' +
        ' gl_FragColor = vec4(col, a * vA); }' }));
    st.points.frustumCulled = false; st.points.renderOrder = 3; g.add(st.points);
    /* The little boat (the game's small gold finale boat, grown into a readable canoe): a wooden hull with raised bow
     * and stern, a dark ink outline (an inflated back-face shell) so it reads against the bright path, a cream gunwale
     * inside, a mast with a pale sail, a bow lamp with a warm glow. Its reflection is the same hull and sail mirrored in
     * the water line and then projected along the view ray onto the water plane in the vertex shader, so it lies on the
     * water (depth-tested against the shore like the water itself) instead of being hidden under it. */
    st.boat = new T.Group(); g.add(st.boat); st.boat.visible = false;
    var hullGeo = new T.SphereGeometry(1, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), hp = hullGeo.attributes.position;
    for (i = 0; i < hp.count; i++) { var hz = hp.getZ(i), e = Math.abs(hz); hp.setXYZ(i, hp.getX(i) * 0.2 * (1 - 0.55 * e * e * e), hp.getY(i) * 0.16 + 0.13 * Math.pow(e, 4), hz * 0.62); }
    hullGeo.computeVertexNormals();
    var deckGeo = new T.CircleGeometry(1, 16); deckGeo.rotateX(-Math.PI / 2); deckGeo.scale(0.16, 1, 0.5);
    var sailGeo = new T.BufferGeometry(); sailGeo.setAttribute('position', new T.Float32BufferAttribute([-0.24, 0.3, -0.02, 0.24, 0.3, -0.02, -0.2, 0.8, 0.02, 0.24, 0.3, -0.02, 0.2, 0.8, 0.02, -0.2, 0.8, 0.02], 3)); sailGeo.computeVertexNormals();
    var mastGeo = new T.CylinderGeometry(0.014, 0.018, 0.86, 5); mastGeo.translate(0, 0.43, 0.0);
    st.boatMat = new T.MeshBasicMaterial({ color: 0x9a6440, fog: false, transparent: true, opacity: 0 });
    st.inkMat = new T.MeshBasicMaterial({ color: 0x120f26, side: T.BackSide, fog: false, transparent: true, opacity: 0 });
    st.deckMat = new T.MeshBasicMaterial({ color: 0xe8c890, fog: false, transparent: true, opacity: 0 });
    st.sailMat = new T.MeshBasicMaterial({ color: 0xf6eedc, side: T.DoubleSide, fog: false, transparent: true, opacity: 0 });
    st.mastMat = new T.MeshBasicMaterial({ color: 0x3a2a30, fog: false, transparent: true, opacity: 0 });
    var ink = part(hullGeo, st.inkMat, st.boat, 0, 0.0, 0); ink.scale.set(1.16, 1.2, 1.07);
    st.boatHull = part(hullGeo, st.boatMat, st.boat, 0, 0.0, 0);
    part(deckGeo, st.deckMat, st.boat, 0, 0.012, 0);
    part(mastGeo, st.mastMat, st.boat, 0, 0, 0); part(sailGeo, st.sailMat, st.boat, 0, 0, 0);
    st.boatShade = sprite(H.glowTex, 0x10142e, false); st.boatShade.scale.set(1.6, 0.6, 1); st.boatShade.position.y = 0.0; st.boat.add(st.boatShade);
    st.boatGlow = sprite(H.glowTex, 0xffb866, true); st.boatGlow.position.set(0, 0.3, 0.52); st.boatGlow.scale.set(1.5, 1.5, 1); st.boat.add(st.boatGlow);
    st.boatLamp = sprite(H.glowTex, 0xfff4cc, true); st.boatLamp.position.set(0, 0.3, 0.52); st.boatLamp.scale.set(0.38, 0.38, 1); st.boat.add(st.boatLamp);
    var lampGeo = new T.SphereGeometry(0.045, 8, 6); part(lampGeo, st.deckMat, st.boat, 0, 0.3, 0.52); part(lampGeo, st.deckMat, st.boat, 0, 0.26, -0.5);
    st.boatStern = sprite(H.glowTex, 0xffc070, true); st.boatStern.position.set(0, 0.26, -0.5); st.boatStern.scale.set(0.9, 0.9, 1); st.boat.add(st.boatStern);
    // reflection (one shader: projected onto the water along the view ray, gently wobbled by the ripples)
    st.refU = { uWater: { value: 0 }, uTime: { value: 0 }, uA: { value: 0 } };
    function refMat(col, op) {
      return new T.ShaderMaterial({ uniforms: { uWater: st.refU.uWater, uTime: st.refU.uTime, uA: st.refU.uA, uCol: { value: new T.Color(col) }, uOp: { value: op } },
        transparent: true, depthWrite: false, side: T.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: 'uniform float uWater; uniform float uTime; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vec3 dir = w.xyz - cameraPosition;' +
          ' vD = uWater - w.y; float k = (uWater + 0.004 - cameraPosition.y) / min(dir.y, -1e-3); w.xyz = cameraPosition + dir * k; w.x += sin(w.z * 7.0 + uTime * 2.4) * 0.025 * min(vD * 4.0, 1.0); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: 'uniform vec3 uCol; uniform float uOp; uniform float uA; varying float vD; void main(){ gl_FragColor = vec4(uCol, uOp * uA * (1.0 - smoothstep(0.1, 0.9, vD) * 0.6)); }' });
    }
    st.boatRef = new T.Group(); g.add(st.boatRef); st.boatRef.visible = false; st.boatRef.renderOrder = 2;
    var rh = part(hullGeo, refMat(0x140f22, 0.72), st.boatRef, 0, 0, 0); rh.scale.set(1.12, 1.15, 1.06); rh.renderOrder = 2;
    var rs = part(sailGeo, refMat(0xc8c0d8, 0.4), st.boatRef, 0, 0, 0); rs.renderOrder = 2;
    st.canvas = doc.querySelector('canvas');
    for (i = 0; i < H.scene.children.length; i++) {
      var ch = H.scene.children[i];
      if (ch.isHemisphereLight) st.hemi = ch; else if (ch.isDirectionalLight) st.sun = ch;
    }
    return true;
  }
  function hide(o) { if (o && o.visible) { o.visible = false; kept.hidden.push(o); } }
  function mix2(key, sk, out) { out.setHex(PAL.dusk[key]).multiplyScalar(1 - sk.night); tmpB.setHex(PAL.night[key]).multiplyScalar(sk.night); return out.add(tmpB); }
  function mixS(a, b, sk) { return a * (1 - sk.night) + b * sk.night; }
  function enterStage() {
    if (staged || !buildStage()) return;
    var cam = H.camera;
    kept = { hidden: [], sun: st.sun ? st.sun.color.getHex() : 0, sunI: st.sun ? st.sun.intensity : 0, hemi: st.hemi ? [st.hemi.color.getHex(), st.hemi.groundColor.getHex(), st.hemi.intensity] : null,
      fog: H.scene.fog ? H.scene.fog.color.getHex() : 0, pr: 0, zoom: cam.zoom, view: cam.view && cam.view.enabled ? JSON.parse(JSON.stringify(cam.view)) : null };
    // The lotus chapter frames the pond with a view offset and zoom; the film frames itself, and gives them back on close.
    if (kept.view) cam.clearViewOffset();
    if (cam.zoom !== 1) { cam.zoom = 1; cam.updateProjectionMatrix(); }
    // Light on a phone GPU (QQ's in-app browser): the painted look does not need full resolution.
    var rr = root.__l3Render;
    try { if (rr && rr.getPixelRatio && rr.getPixelRatio() > MAX_PR) { kept.pr = rr.getPixelRatio(); rr.setPixelRatio(MAX_PR); } } catch (e) { kept.pr = 0; }
    /* Off the set while the film runs (all come back on close): the game's sky dome, star points, sun/moon sprites, the
     * orbiting islets and cloud puffs, the gameplay lotus group (flowers, stations, the short finale's boat and
     * lanterns, the moon ring), and anything another chapter left visible. */
    var i, ch, ud;
    for (i = 0; i < H.scene.children.length; i++) {
      ch = H.scene.children[i]; ud = ch.userData;
      if (ch === st.sky) continue;
      if (ch.isPoints || ch.isSprite) hide(ch);
      else if (ch.isMesh && ch.geometry && ch.geometry.parameters && ch.geometry.parameters.radius === 120) hide(ch);
      else if (ch.isGroup && ud && typeof ud.sp === 'number' && typeof ud.r === 'number' && typeof ud.a === 'number') hide(ch);
    }
    var extra = (root.__l5Hide || []).concat(root.__l4Hide || [], root.__l3Hide || [], root.__l3Stage && root.__l3Stage.groups ? root.__l3Stage.groups() : []);
    for (i = 0; i < extra.length; i++) hide(extra[i]);
    if (root.GardenClip && root.GardenClip.boat) hide(root.GardenClip.boat);
    st.sky.visible = true; st.g.visible = true; st.tick = 0; paint();
    if (doc.body) doc.body.classList.add('l5cs-on');
    staged = true;
  }
  function exitStage() {
    if (!staged) return;
    for (var i = 0; i < kept.hidden.length; i++) kept.hidden[i].visible = true;
    st.g.visible = false; st.sky.visible = false;
    unpaint();
    if (st.sun) { st.sun.color.setHex(kept.sun); st.sun.intensity = kept.sunI; }
    if (st.hemi) { st.hemi.color.setHex(kept.hemi[0]); st.hemi.groundColor.setHex(kept.hemi[1]); st.hemi.intensity = kept.hemi[2]; }
    if (H.scene.fog) H.scene.fog.color.setHex(kept.fog);
    var cam = H.camera, v = kept.view;
    try {
      if (v) cam.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
      if (cam.zoom !== kept.zoom) { cam.zoom = kept.zoom; cam.updateProjectionMatrix(); }
    } catch (e) { /* keep closing */ }
    try { if (kept.pr && root.__l3Render) root.__l3Render.setPixelRatio(kept.pr); } catch (e) { /* keep closing */ }
    if (doc.body) doc.body.classList.remove('l5cs-on');
    staged = false; kept = null;
    // The game recomputes its own day/night target (and the camera is its own again from the next frame).
    try { if (H.refresh) H.refresh(); } catch (e) { /* keep closing */ }
  }
  /* Seen near the moon, a particle is slid round the rim instead of across the disc (the L4 sun rule): a continuous
   * push away from the moon's centre, zero from a little outside the rim on, so nothing jumps; the ring kept clear is
   * widened by the particle's own radius on screen. In: the lens-to-particle vector in st.q, its world size and the
   * smallest size it may have on screen (as a tangent). Out: st.q.s = its size. */
  function keepOffMoon(size, least) {
    var q = st.q, md = st.moonDir, fd = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z) || 1, along = (q.x * md.x + q.y * md.y + q.z * md.z) / fd;
    q.d = fd; q.s = Math.max(size, least * fd);
    if (along <= 0.86) return;
    var rad = 0.5 * q.s / fd, K = MOON_KEEP + rad;
    var qx = q.x / fd - md.x * along, qy = q.y / fd - md.y * along, qz = q.z / fd - md.z * along, dq = Math.sqrt(qx * qx + qy * qy + qz * qz);
    if (dq < K * 2.2) {
      var wq = 1 - ease(ramp(dq, K * 1.3, K * 2.2)), dn = lerp(dq, Math.sqrt(dq * dq + K * K * 1.5), wq), kq;
      if (dq < 1e-5) { qx = 1; qy = 0; qz = 0; dq = 1; dn = K * 1.25; }
      kq = dn / dq;
      q.x = (md.x * along + qx * kq) * fd; q.y = (md.y * along + qy * kq) * fd; q.z = (md.z * along + qz * kq) * fd; dq = dn;
    }
    if (dq - rad < st.moonMin) st.moonMin = dq - rad; // the nearest edge of anything to the moon's centre this frame
  }
  function applyStage(t) {
    var f = frame(t, true), sk = f.sky, u = st.skyU, i, cam = H.camera, top = H.TOP_Y;
    if (H.setNightTarget) H.setNightTarget(0.9);
    if (H.setDeepNight) H.setDeepNight(0);
    if (cam.view && cam.view.enabled) cam.clearViewOffset(); // a resize under the film must not re-frame it
    if (cam.zoom !== 1) { cam.zoom = 1; cam.updateProjectionMatrix(); }
    var wild = root.__bf && root.__bf.butterflies ? root.__bf.butterflies : [];
    for (i = 0; i < wild.length; i++) if (wild[i].g) hide(wild[i].g);
    // Lotuses: the leaf rocks on the wind, the petals fold open on their hinges, colour and halo pulse with the glow.
    var m0 = st.m0, m1 = st.m1, m2 = st.m2, wl = st.waterU;
    for (i = 0; i < 6; i++) {
      var L = st.lotuses[i], lp = f.lotuses[i], gs = (0.75 + 0.75 * lp.glow) * lp.scale * (1 + 0.08 * Math.sin(t * 1.7 + i)), k;
      st.ps.set(lp.x, top + lp.y, lp.z); st.eu.set(lp.tilt, lp.yaw, lp.roll); st.qn.setFromEuler(st.eu); st.sc.setScalar(lp.scale);
      m0.compose(st.ps, st.qn, st.sc);
      st.pads.setMatrixAt(i, m0);
      for (k = 0; k < PETALS; k++) {
        var inner = k >= 8, ang = inner ? (k - 8) * TAU / 5 + 0.3 : k * TAU / 8;
        m1.makeRotationY(ang); m2.makeTranslation(0, inner ? 0.12 : 0.08, 0); m1.multiply(m2);
        m2.makeRotationX(inner ? lp.inner : lp.outer); m1.multiply(m2);
        if (inner) { m2.makeScale(0.68, 0.9, 0.68); m1.multiply(m2); }
        m2.multiplyMatrices(m0, m1); st.petals.setMatrixAt(i * PETALS + k, m2);
        tmpB.copy(st.lotusC[i]).multiplyScalar((inner ? 1.08 : 0.9) * (0.7 + 0.55 * lp.glow)); st.petals.setColorAt(i * PETALS + k, tmpB);
      }
      m1.makeTranslation(0, 0.1 + 0.08 * lp.open, 0); m2.multiplyMatrices(m0, m1); m1.makeScale(0.3 + 0.7 * lp.open, 0.3 + 0.7 * lp.open, 0.3 + 0.7 * lp.open); m2.multiply(m1);
      st.seeds.setMatrixAt(i, m2);
      L.halo.position.set(lp.x, top + lp.y + 0.38 * lp.scale, lp.z); L.halo.material.opacity = clamp(0.12 + 0.38 * lp.glow, 0, 0.6) * ramp(t, lp.wake - 1.5, lp.wake); L.halo.scale.set(gs, gs, 1);
      L.open = lp.open; L.x = lp.x;
      wl.uLot.value[i].set(lp.x, lp.z, lp.glow, lp.ringR); wl.uRingA.value[i] = lp.ringA;
    }
    st.pads.instanceMatrix.needsUpdate = true; st.petals.instanceMatrix.needsUpdate = true; st.seeds.instanceMatrix.needsUpdate = true;
    if (st.petals.instanceColor) st.petals.instanceColor.needsUpdate = true;
    // Camera: overrides the gameplay orbit for this frame only; the game takes it back when we stop.
    var c = f.camera, halfH = Math.tan(cam.fov * Math.PI / 360), halfW = halfH * cam.aspect;
    var r = Math.max(c.w / halfW, c.w * 0.9 / halfH), v3 = st.v;
    v3.set(c.x, top + c.y + c.lift * r * halfH, c.z); H.island.localToWorld(v3);
    cam.position.set(v3.x + r * Math.sin(c.phi) * Math.cos(c.th), v3.y + r * Math.cos(c.phi), v3.z + r * Math.sin(c.phi) * Math.sin(c.th));
    cam.lookAt(v3);
    // The lens and the moon in stage coordinates (from the camera key, not the island's live bob: t alone).
    var eye = st.eye, md = st.moonDir, q = st.q, b = st.pose, P = st.pPos, A = st.pA, o = 0;
    eye.set(c.x + r * Math.sin(c.phi) * Math.cos(c.th), top + c.y + c.lift * r * halfH + r * Math.cos(c.phi), c.z + r * Math.sin(c.phi) * Math.sin(c.th));
    md.set(f.moon.x, f.moon.y, f.moon.z).normalize();
    var cvH = st.canvas ? st.canvas.height : 844, px = cvH / (2 * halfH);
    st.moonMin = 9;
    function put(kind, alpha, size, least) {
      q.x = b.x - eye.x; q.y = top + b.y - eye.y; q.z = b.z - eye.z; keepOffMoon(size, least * halfH);
      P[o * 3] = eye.x + q.x; P[o * 3 + 1] = eye.y + q.y; P[o * 3 + 2] = eye.z + q.z;
      A[o * 4] = alpha * ramp(q.d, 2.5, 6); A[o * 4 + 1] = q.s; A[o * 4 + 2] = 0; A[o * 4 + 3] = kind; o++;
    }
    for (i = 0; i < DEWS; i++) { dewAt(i, t, b); put(0, b.alpha, b.size, 0.045); }
    for (i = 0; i < FLIES; i++) { flyAt(i, t, b); put(1, b.alpha, b.size, 0.055); }
    for (i = 0; i < LANTERNS; i++) { lanternAt(i, t, b); put(2, b.alpha, b.size, 0.1); }
    for (i = 0; i < WAKE; i++) { wakeAt(i, t, b); put(3, b.alpha * 0.9, b.size, 0.035); }
    st.points.geometry.attributes.position.needsUpdate = true; st.points.geometry.attributes.aA.needsUpdate = true;
    st.ptU.uPx.value = px;
    // The boat.
    var bo = f.boat, on = bo.alpha > 0.01;
    st.boat.visible = on;
    st.boat.position.set(bo.x, top + bo.y, bo.z); st.boat.rotation.set(bo.pitch, bo.yaw, bo.roll); st.boat.scale.setScalar(bo.scale);
    st.boatMat.opacity = st.sailMat.opacity = st.inkMat.opacity = st.deckMat.opacity = st.mastMat.opacity = bo.alpha; st.boatShade.material.opacity = 0.5 * bo.alpha;
    // the reflection: the boat mirrored in the water line (then laid on the water by its shader)
    var wy = top + WATER_Y; st.boatRef.visible = on;
    st.boatRef.position.set(bo.x, 2 * wy - (top + bo.y), bo.z); st.boatRef.rotation.set(-bo.pitch, bo.yaw, -bo.roll); st.boatRef.scale.set(bo.scale, -bo.scale, bo.scale);
    st.ps.set(0, wy, 0); H.island.localToWorld(st.ps); st.refU.uWater.value = st.ps.y; st.refU.uTime.value = t; st.refU.uA.value = bo.alpha;
    st.boatGlow.material.opacity = 0.9 * bo.glow; st.boatLamp.material.opacity = bo.glow; st.boatStern.material.opacity = 0.85 * bo.glow;
    // Look: sky palette, moon, water, light and grass tint.
    mix2('top', sk, u.uTop.value); mix2('mid', sk, u.uMid.value); mix2('hor', sk, u.uHor.value); mix2('low', sk, u.uLow.value);
    mix2('lit', sk, u.uLit.value); mix2('shade', sk, u.uShade.value);
    u.uTime.value = t; u.uStars.value = sk.stars; u.uWarm.value = sk.warm; u.uGlow.value = sk.glow; u.uMoon.value.copy(md);
    st.sky.position.copy(cam.position);
    var wu = st.waterU;
    wu.uTime.value = t; wu.uMoon.value.copy(md); wu.uReach.value = f.path.reach; wu.uPathGlow.value = f.path.glow; wu.uWarm.value = sk.warm; wu.uSoft.value = soft;
    wu.uBoat.value.set(bo.x, bo.z, bo.alpha, bo.scale / BOAT_SCALE);
    if (H.scene.fog) mix2('fog', sk, H.scene.fog.color);
    if (st.sun) { mix2('key', sk, st.sun.color); st.sun.intensity = mixS(PAL.dusk.keyI, PAL.night.keyI, sk); }
    if (st.hemi) { mix2('hemiA', sk, st.hemi.color); mix2('hemiB', sk, st.hemi.groundColor); st.hemi.intensity = mixS(PAL.dusk.hemiI, PAL.night.hemiI, sk); }
    st.grassU.uTime.value = t; st.grassU.uSoft.value = soft;
    st.grassU.uLight.value.set(mixS(PAL.dusk.grass[0], PAL.night.grass[0], sk), mixS(PAL.dusk.grass[1], PAL.night.grass[1], sk), mixS(PAL.dusk.grass[2], PAL.night.grass[2], sk));
    if (++st.tick % 30 === 1) paint(); // anything planted or loaded since the last pass
  }
  function isOpen() { return state === 'playing' || state === 'paused' || state === 'ended'; }
  function stageTick() {
    if (!isOpen()) { exitStage(); return; }
    var t = time();
    enterStage();
    if (staged) applyStage(t);
  }
  // Chain onto gameplay.js the way the other modules do: the hooks arrive once, then one call per frame.
  var GP = root.GardenPlay;
  if (GP && doc) {
    var gpInit = GP.init, gpUpdate = GP.update;
    GP.init = function (hooks) { gpInit.apply(GP, arguments); H = hooks; T = hooks.THREE; };
    GP.update = function () { gpUpdate.apply(GP, arguments); if (H) stageTick(); };
  }
  try { if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) soft = 0.3; } catch (e) { soft = 1; }

  /* ------------------------------- DOM ------------------------------- */
  var CSS = [
    '#l5cs{position:fixed;top:0;left:0;right:0;bottom:0;z-index:60;overflow:hidden;color:#fff;touch-action:none;',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '#l5cs.hidden{display:none}',
    // The veil washes the live island with night colour instead of hiding it.
    '#l5csVeil{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;',
    'background:linear-gradient(180deg,#1c2050 0%,#4a4a86 55%,#c0a080 100%)}',
    // Paper grain and a cool, uneven edge: the frame reads as night watercolour on cold-pressed paper.
    // Both sit beside #l5cs (not inside it) so their blend modes reach the game canvas underneath.
    '#l5csPaper{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;opacity:.7;mix-blend-mode:multiply;background-size:240px 240px}',
    '#l5csEdge{position:fixed;top:0;left:0;right:0;bottom:0;z-index:59;pointer-events:none;mix-blend-mode:multiply;',
    'background:radial-gradient(ellipse at 50% 44%,rgba(150,150,190,0) 52%,rgba(60,56,110,.45) 100%);box-shadow:inset 0 0 80px rgba(36,34,80,.4)}',
    '.l5cs-bar{position:absolute;left:0;right:0;height:7%;background:#12142a;pointer-events:none}',
    '#l5csTop{top:0;transform-origin:50% 0}#l5csBottom{bottom:0;transform-origin:50% 100%}',
    '#l5csCaption{position:absolute;left:5%;right:5%;bottom:14.5%;text-align:center;font-size:17px;line-height:1.7;letter-spacing:1.5px;white-space:nowrap;',
    'padding:14px 0 12px;color:#fffdf6;text-shadow:0 1px 2px rgba(20,18,44,.9),0 0 10px rgba(30,28,64,.8);pointer-events:none;',
    'background:radial-gradient(ellipse at 50% 50%,rgba(24,24,58,.5) 0%,rgba(24,24,58,.3) 45%,rgba(24,24,58,0) 72%)}',
    '#l5csSkip{position:absolute;top:12px;top:calc(12px + env(safe-area-inset-top));right:12px;right:calc(12px + env(safe-area-inset-right));',
    'min-width:64px;min-height:44px;padding:0 16px;border-radius:22px;font:inherit;font-size:14px;letter-spacing:3px;color:#fffaf0;cursor:pointer;',
    'background:rgba(70,70,120,.34);border:1px solid rgba(255,238,214,.5);box-shadow:0 4px 18px rgba(20,18,44,.3);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#l5csSkip:active{background:rgba(110,110,160,.46)}',
    // Everything but the canvas and the cutscene steps aside, so the island reads as a film frame.
    'body.l5cs-on>:not(canvas):not(#l5cs):not(.l5cs-paint){visibility:hidden!important}',
    '.l5cs-paint.hidden{display:none}',
    '#l5csEnd{position:absolute;left:0;right:0;top:40%;text-align:center;pointer-events:none}',
    '#l5csTitle{font-family:"Songti SC","Noto Serif CJK SC","Source Han Serif SC",STSong,serif;font-size:32px;font-weight:600;letter-spacing:8px;text-indent:8px;',
    'text-shadow:0 1px 3px rgba(20,18,44,.85),0 0 22px rgba(255,214,150,.6),0 2px 12px rgba(30,28,64,.7)}',
    '#l5csRule{width:132px;height:1px;margin:16px auto 0;background:linear-gradient(90deg,transparent,rgba(255,236,196,.9),transparent)}',
    '#l5csSub{margin-top:14px;font-size:17px;letter-spacing:14px;text-indent:14px;opacity:.96;text-shadow:0 1px 2px rgba(20,18,44,.85),0 1px 10px rgba(30,28,64,.7)}',
    '#l5csGo{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);min-width:168px;min-height:44px;padding:0 26px;border-radius:24px;font:inherit;font-size:15px;letter-spacing:5px;color:#fffaf0;',
    'cursor:pointer;pointer-events:auto;background:rgba(56,56,104,.58);border:1px solid rgba(255,236,196,.66);text-shadow:0 1px 2px rgba(20,18,44,.8);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:l5csPulse 2.4s ease-in-out infinite}',
    '#l5csGo.hidden,#l5csSkip.hidden{display:none}',
    '@keyframes l5csPulse{0%,100%{opacity:.62}50%{opacity:1}}',
    '#l5csClock{position:absolute;left:12px;left:calc(12px + env(safe-area-inset-left));bottom:10px;bottom:calc(10px + env(safe-area-inset-bottom));',
    'font-size:11px;letter-spacing:1px;opacity:.55;pointer-events:none;font-variant-numeric:tabular-nums}',
    '#l5csClock.hidden{display:none}',
    '@media (orientation:landscape) and (max-height:480px){#l5csCaption{bottom:13%;font-size:14px}#l5csTitle{font-size:24px}',
    '#l5csEnd{top:16%}#l5csRule{margin-top:8px}#l5csSub{margin-top:8px;font-size:14px}#l5csGo{bottom:11%;left:auto;right:5%;transform:none}.l5cs-bar{height:9%}}',
    '@media (prefers-reduced-motion:reduce){#l5csGo{animation:none}}'
  ].join('');

  // Procedural paper (borrowing the cold-pressed "tooth" idea: fine speckle, fibres, faint brush streaks); drawn once, tiled by CSS.
  function paperTexture() {
    try {
      var c = doc.createElement('canvas'), S = 240, g, i, seed = 29;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      c.width = c.height = S; g = c.getContext('2d');
      g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, S, S);
      for (i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '96,92,124,' : '255,255,255,') + (0.05 + 0.1 * rnd()).toFixed(3) + ')'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
      for (i = 0; i < 26; i++) {
        var x = rnd() * S, y = rnd() * S, a = rnd() * 6.283, l = 8 + rnd() * 22;
        g.strokeStyle = 'rgba(104,98,132,' + (0.06 + 0.08 * rnd()).toFixed(3) + ')'; g.lineWidth = 0.6 + rnd() * 0.5;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5 - 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      for (i = 0; i < 9; i++) { g.fillStyle = 'rgba(110,104,140,' + (0.012 + 0.016 * rnd()).toFixed(3) + ')'; g.fillRect(0, rnd() * S, S, 5 + rnd() * 16); }
      el.Paper.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { el.Paper.style.display = 'none'; }
  }
  function stop(e) { if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }
  function build() {
    if (el || !doc || !doc.body) return;
    var style = doc.createElement('style'); style.id = 'l5csStyle'; style.textContent = CSS;
    doc.head.appendChild(style);
    var box = doc.createElement('div'); box.id = 'l5cs'; box.className = 'hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', TITLE);
    box.innerHTML = '<div id="l5csVeil"></div>' +
      '<div id="l5csTop" class="l5cs-bar"></div><div id="l5csBottom" class="l5cs-bar"></div>' +
      '<div id="l5csCaption"></div>' +
      '<div id="l5csEnd"><div id="l5csTitle">' + TITLE + '</div><div id="l5csRule"></div><div id="l5csSub">' + SUBTITLE + '</div></div>' +
      '<button id="l5csGo" class="hidden" type="button">' + CONTINUE + '</button>' +
      '<button id="l5csSkip" type="button" aria-label="跳过过场动画">' + SKIP + '</button>' +
      '<div id="l5csClock"></div>';
    doc.body.appendChild(box);
    el = { box: box };
    var layers = ['Edge', 'Paper'];
    for (var p = 0; p < layers.length; p++) { var layer = doc.createElement('div'); layer.id = 'l5cs' + layers[p]; layer.className = 'l5cs-paint hidden'; doc.body.insertBefore(layer, box); el[layers[p]] = layer; }
    var ids = ['Veil', 'Top', 'Bottom', 'Caption', 'End', 'Go', 'Skip', 'Clock'];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = doc.getElementById('l5cs' + ids[i]);
    paperTexture();
    showClock = query('csclock') === '1';
    if (!showClock) el.Clock.className = 'hidden';
    // The box is an input shield: nothing underneath is tappable while the cutscene is up.
    var kinds = ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'wheel'];
    for (i = 0; i < kinds.length; i++) box.addEventListener(kinds[i], function (e) { e.stopPropagation(); });
    box.addEventListener('click', function (e) { stop(e); proceed(); });
    el.Skip.addEventListener('click', function (e) { stop(e); skip(); });
    el.Go.addEventListener('click', function (e) { stop(e); proceed(); });
    ready = true;
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function render() {
    var t = time();
    if (!el) return;
    var open = isOpen();
    el.box.className = open ? '' : 'hidden';
    el.Paper.className = el.Edge.className = open ? 'l5cs-paint' : 'l5cs-paint hidden';
    if (!open) return;
    var f = frame(t, true);
    el.Veil.style.opacity = f.veil.toFixed(3);
    el.Top.style.transform = el.Bottom.style.transform = 'scaleY(' + f.bars.toFixed(3) + ')';
    if (el.Caption.textContent !== f.caption) el.Caption.textContent = f.caption;
    el.Caption.style.opacity = f.captionAlpha.toFixed(3);
    el.End.style.opacity = f.title.toFixed(3);
    el.End.style.transform = 'translateY(' + ((1 - f.title) * 10).toFixed(1) + 'px)';
    el.Go.className = f.canContinue ? '' : 'hidden';
    el.Skip.className = f.canContinue ? 'hidden' : '';
    var s = Math.floor(t);
    if (showClock) el.Clock.textContent = two(Math.floor(s / 60)) + ':' + two(s % 60) + ' / ' + two(Math.floor(DURATION / 60)) + ':' + two(DURATION % 60) + ' · ' + f.beat;
  }
  function loop() {
    raf = 0;
    render();
    if (state === 'playing' && root.requestAnimationFrame) raf = root.requestAnimationFrame(loop);
  }
  function run() {
    render();
    if (!doc) return;
    if (!raf && root.requestAnimationFrame) raf = root.requestAnimationFrame(loop);
    // Background tabs throttle rAF; the timer still lands the end card on time.
    if (!ticker && root.setInterval) ticker = root.setInterval(function () {
      render();
      if (state !== 'playing') { root.clearInterval(ticker); ticker = 0; }
    }, 250);
  }

  /* ------------------------------- API ------------------------------- */
  // The score will live in l5-cutscene-music.js (window.__l5Score, a later item); muted runs never start it.
  function score() { return root.__l5Score || null; }
  function play(o) {
    opts = o || {};
    if (opts.muted !== undefined) muted = !!opts.muted;
    scored = !muted && !!score() && !!score().start();
    build();
    base = clamp(+opts.from || 0, 0, DURATION); anchor = clock(); done = false; state = 'playing';
    run();
    return true;
  }
  function seek(t) {
    t = clamp(+t || 0, 0, DURATION);
    build();
    var running = state === 'playing' || state === 'ended';
    base = t; anchor = clock();
    if (t >= DURATION) reach();
    else state = running ? 'playing' : 'paused'; // seeking a closed cutscene shows a still frame
    if (scored && score().sync) score().sync();
    run();
    return t;
  }
  function skip() {
    if (state !== 'playing' && state !== 'paused') return false;
    reach();
    if (scored && score().settle) score().settle();
    render();
    return true;
  }
  function pause() { if (state !== 'playing') return false; base = time(); if (state === 'playing') state = 'paused'; render(); return true; }
  function resume() { if (state !== 'paused') return false; anchor = clock(); state = 'playing'; run(); return true; }
  function close() {
    if (state === 'idle' || state === 'closed') return false;
    state = 'closed'; opts = {};
    if (scored) { scored = false; if (score().stop) score().stop(); }
    if (doc) exitStage();
    render();
    return true;
  }
  // Tap-to-continue: only from the end card, and not from the same tap that skipped.
  function proceed(force) {
    if (state !== 'ended') return false;
    if (!force && clock() - endedAt < CONTINUE_GUARD_MS) return false;
    var cb = opts.onContinue;
    close();
    if (typeof cb === 'function') cb();
    return true;
  }

  var api = {
    play: play, skip: skip, seek: seek, time: time,
    duration: function () { return DURATION; },
    playing: function () { time(); return state === 'playing'; },
    finished: function () { time(); return done; },
    ready: function () { return ready; },
    // True from play() until close(): journey.js treats the film like an open dialog (no gameplay input).
    busy: function () { time(); return isOpen(); },
    // True while the stage owns the island: journey.js freezes the gameplay lotus chapter for that time.
    staged: function () { return staged; },
    stage: function () {
      return { staged: staged, reduced: soft < 1, toon: painted.length, blades: st ? st.blades : 0, blooms: st ? st.blooms : 0,
        lotuses: st ? st.lotuses.length : 0, dew: st ? DEWS : 0, flies: st ? FLIES : 0, lanterns: st ? LANTERNS : 0, wake: st ? WAKE : 0,
        boat: !!(st && st.boat.visible), water: !!(st && st.water.visible && st.g.visible), sky: !!(st && st.sky.visible), hidden: kept ? kept.hidden.length : 0,
        camera: H ? H.camera.position.toArray().map(function (v) { return +v.toFixed(3); }) : null };
    },
    pause: pause, resume: resume, close: close, proceed: proceed,
    state: function () { time(); return state; },
    beat: function () { return beatAt(time()).id; },
    beats: function () { return BEATS.map(function (b) { return { id: b.id, t0: b.t0, t1: b.t1, caption: b.caption }; }); },
    frame: function (t) { return frame(t === undefined ? time() : clamp(+t || 0, 0, DURATION)); },
    text: function () { return { title: TITLE, subtitle: SUBTITLE, cont: CONTINUE, skip: SKIP }; },
    layout: function () { return { lotus: LOTUS, blooms: BLOOMS.map(function (k) { return k[0]; }), colors: BLOOMS.map(function (k) { return k[1]; }), lotusT: LOTUS_T, lotusStep: LOTUS_STEP, chorus: CHORUS.slice(), dewLand: (function () { var a = []; for (var j = 0; j < DEWS; j++) a.push(dewLand(j)); return a; })(),
        p0: P0.slice(), pd: PD.slice(), pathLen: PATH_LEN, waterY: WATER_Y, boatT0: BOAT_T0, dew: DEWS, flies: FLIES, lanterns: LANTERNS, wake: WAKE, wind: [WX, WZ], moonDisc: MOON_DISC }; },
    // Pose of one actor at t (the stage uses exactly these).
    lotus: function (i, t) { return lotusAt(clamp(i | 0, 0, 5), +t || 0, {}); },
    dew: function (j, t) { return dewAt(clamp(j | 0, 0, DEWS - 1), +t || 0, {}); },
    fly: function (j, t) { return flyAt(clamp(j | 0, 0, FLIES - 1), +t || 0, {}); },
    lantern: function (j, t) { return lanternAt(clamp(j | 0, 0, LANTERNS - 1), +t || 0, {}); },
    boat: function (t) { return boatAt(+t || 0, {}); },
    // What is actually on stage this frame (island-local; y above the grass): for the seek/determinism checks.
    probe: function () {
      if (!st || !staged) return null;
      var out = { moonClear: st.moonMin, moonDisc: MOON_DISC, points: [], lotuses: [], boat: null }, i;
      // [x, y, z, alpha, size, kind]
      for (i = 0; i < st.np; i++) out.points.push([st.pPos[i * 3], st.pPos[i * 3 + 1] - H.TOP_Y, st.pPos[i * 3 + 2], st.pA[i * 4], st.pA[i * 4 + 1], st.pA[i * 4 + 3]]);
      for (i = 0; i < 6; i++) out.lotuses.push([st.lotuses[i].x, st.lotuses[i].open, st.lotuses[i].halo.material.opacity]);
      out.boat = [st.boat.visible, st.boat.position.x, st.boat.position.z, st.boat.scale.x];
      return out;
    },
    muted: function () { return muted; },
    scored: function () { return scored; },
    // In-game hook switch; session-only, never saved. On by default, ?l5cutscene=0 keeps the old 7s 归航演出 and card.
    enabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; return enabled; },
    _setClock: function (fn) { clock = fn; }
  };
  root.__l5Cutscene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  enabled = query('l5cutscene') !== '0';
  muted = query('mute') === '1';
  if (!doc) return;
  function boot() {
    build();
    if (query('cutscene') !== 'l5') return;
    // Standalone preview: muted starts at once (headless capture), otherwise on the first gesture.
    if (muted) { play({ source: 'preview', muted: true }); return; }
    var kinds = ['pointerdown', 'touchstart', 'keydown'];
    function first() {
      for (var i = 0; i < kinds.length; i++) doc.removeEventListener(kinds[i], first, true);
      if (state === 'idle') play({ source: 'preview' });
    }
    for (var i = 0; i < kinds.length; i++) doc.addEventListener(kinds[i], first, true);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
