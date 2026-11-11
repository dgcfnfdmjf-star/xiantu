/* l2-cutscene.js: level-2 clear cutscene (scaffold).
 * A seekable ~60s timeline shown after the 20th kitten. Every visual is a pure function of the
 * timeline second, so seek(t) reproduces any frame. Storyboard: docs/l2-cutscene-storyboard.md.
 * This file never reads or writes a save; the caller's onContinue decides what happens afterwards.
 * Scaffold visuals only (dusk veil, stars, beat captions, clock chip); the real scene comes later. */
(function (root) {
  'use strict';
  var DURATION = 60;
  // Clock times are seconds from play(); beats are contiguous and end at DURATION.
  var BEATS = [
    { id: 'settle', t0: 0, t1: 8, caption: '暮色沉了下来，灯笼一盏盏亮起' },
    { id: 'gather', t0: 8, t1: 22, caption: '小猫们从花丛里探出头，一只只靠了过来' },
    { id: 'play', t0: 22, t1: 38, caption: '逗猫棒轻轻一晃，蝴蝶也来凑热闹' },
    { id: 'codex', t0: 38, t1: 50, caption: '图鉴一页页亮起，小猫蜷成一团' },
    { id: 'sleep', t0: 50, t1: 60, caption: '' }
  ];
  var TITLE_AT = 52, TITLE_FADE = 3, CONTINUE_GUARD_MS = 600;
  var TITLE = '第二关 · 完成', SUBTITLE = '暮色浮岛', CONTINUE = '轻触继续', SKIP = '跳过';

  var doc = root.document || null;
  var clock = function () {
    return root.performance && root.performance.now ? root.performance.now() : Date.now();
  };
  // idle -> playing <-> paused -> ended -> closed
  var state = 'idle', base = 0, anchor = 0, done = false, endedAt = 0;
  var opts = {}, enabled = false, muted = false, ready = !doc;
  var el = null, raf = 0, ticker = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(u) { return u * u * (3 - 2 * u); }
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
  // Everything the renderer needs, derived from t alone.
  function frame(t) {
    var b = beatAt(t), local = t - b.t0, len = b.t1 - b.t0;
    return {
      t: t, beat: b.id, caption: b.caption,
      captionAlpha: b.caption ? Math.min(ramp(local, 0.4, 1.8), 1 - ramp(local, len - 1.4, len - 0.2)) : 0,
      dusk: 0.18 + 0.3 * ease(ramp(t, 0, 8)) + 0.14 * ease(ramp(t, 38, 54)),
      stars: ease(ramp(t, 3, 12)),
      bars: ease(ramp(t, 0, 2.5)),
      title: ease(ramp(t, TITLE_AT, TITLE_AT + TITLE_FADE)),
      canContinue: t >= DURATION
    };
  }

  /* ------------------------------- DOM ------------------------------- */
  var CSS = [
    '#l2cs{position:fixed;top:0;left:0;right:0;bottom:0;z-index:60;overflow:hidden;color:#fff;touch-action:none;',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
    '#l2cs.hidden{display:none}',
    // The veil tints the live island instead of hiding it.
    '#l2csVeil{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;',
    'background:linear-gradient(180deg,#241a4a 0%,#4a3478 46%,#8a5a8e 78%,#d99a8c 100%)}',
    '#l2csStars{position:absolute;top:0;left:0;right:0;height:58%;pointer-events:none;background-image:',
    'radial-gradient(1.6px 1.6px at 12% 18%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 31% 9%,#ffeec8 50%,transparent 51%),',
    'radial-gradient(1.8px 1.8px at 47% 27%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 63% 13%,#d8e6ff 50%,transparent 51%),',
    'radial-gradient(1.6px 1.6px at 78% 31%,#fff 50%,transparent 51%),radial-gradient(1.2px 1.2px at 90% 8%,#ffeec8 50%,transparent 51%),',
    'radial-gradient(1.4px 1.4px at 22% 43%,#fff 50%,transparent 51%),radial-gradient(1.4px 1.4px at 70% 49%,#d8e6ff 50%,transparent 51%)}',
    '.l2cs-bar{position:absolute;left:0;right:0;height:7%;background:#120d26;pointer-events:none}',
    '#l2csTop{top:0;transform-origin:50% 0}#l2csBottom{bottom:0;transform-origin:50% 100%}',
    '#l2csCaption{position:absolute;left:5%;right:5%;bottom:17%;text-align:center;font-size:15px;line-height:1.8;letter-spacing:1.5px;',
    'text-shadow:0 1px 10px rgba(40,24,80,.75);pointer-events:none}',
    '#l2csSkip{position:absolute;top:12px;top:calc(12px + env(safe-area-inset-top));right:12px;right:calc(12px + env(safe-area-inset-right));',
    'min-width:64px;min-height:44px;padding:0 16px;border-radius:22px;font:inherit;font-size:14px;letter-spacing:3px;color:#f2fff8;cursor:pointer;',
    'background:rgba(110,170,150,.24);border:1px solid rgba(214,255,238,.42);box-shadow:0 4px 18px rgba(30,20,60,.25);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#l2csSkip:active{background:rgba(140,205,182,.36)}',
    '#l2csEnd{position:absolute;left:0;right:0;top:50%;transform:translateY(-58%);text-align:center;pointer-events:none}',
    '#l2csTitle{font-size:28px;font-weight:500;letter-spacing:8px;text-indent:8px;text-shadow:0 0 22px rgba(255,236,190,.7),0 2px 10px rgba(40,24,80,.6)}',
    '#l2csSub{margin-top:14px;font-size:17px;letter-spacing:12px;text-indent:12px;opacity:.9;text-shadow:0 1px 10px rgba(40,24,80,.7)}',
    '#l2csGo{margin-top:34px;min-width:168px;min-height:44px;padding:0 26px;border-radius:24px;font:inherit;font-size:15px;letter-spacing:5px;color:#f2fff8;',
    'cursor:pointer;pointer-events:auto;background:rgba(110,170,150,.24);border:1px solid rgba(214,255,238,.42);',
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:l2csPulse 2.4s ease-in-out infinite}',
    '#l2csGo.hidden,#l2csSkip.hidden{display:none}',
    '@keyframes l2csPulse{0%,100%{opacity:.62}50%{opacity:1}}',
    '#l2csClock{position:absolute;left:12px;left:calc(12px + env(safe-area-inset-left));bottom:10px;bottom:calc(10px + env(safe-area-inset-bottom));',
    'font-size:11px;letter-spacing:1px;opacity:.55;pointer-events:none;font-variant-numeric:tabular-nums}',
    '@media (orientation:landscape) and (max-height:480px){#l2csCaption{bottom:13%;font-size:14px}#l2csTitle{font-size:24px}',
    '#l2csSub{margin-top:8px}#l2csGo{margin-top:16px}.l2cs-bar{height:9%}}'
  ].join('');

  function stop(e) { if (e) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } }
  function build() {
    if (el || !doc || !doc.body) return;
    var style = doc.createElement('style'); style.id = 'l2csStyle'; style.textContent = CSS;
    doc.head.appendChild(style);
    var box = doc.createElement('div'); box.id = 'l2cs'; box.className = 'hidden';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', TITLE);
    box.innerHTML = '<div id="l2csVeil"></div><div id="l2csStars"></div>' +
      '<div id="l2csTop" class="l2cs-bar"></div><div id="l2csBottom" class="l2cs-bar"></div>' +
      '<div id="l2csCaption"></div>' +
      '<div id="l2csEnd"><div id="l2csTitle">' + TITLE + '</div><div id="l2csSub">' + SUBTITLE + '</div>' +
      '<button id="l2csGo" class="hidden" type="button">' + CONTINUE + '</button></div>' +
      '<button id="l2csSkip" type="button" aria-label="跳过过场动画">' + SKIP + '</button>' +
      '<div id="l2csClock"></div>';
    doc.body.appendChild(box);
    el = { box: box };
    var ids = ['Veil', 'Stars', 'Top', 'Bottom', 'Caption', 'End', 'Go', 'Skip', 'Clock'];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = doc.getElementById('l2cs' + ids[i]);
    // The box is an input shield: nothing underneath is tappable while the cutscene is up.
    var kinds = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'wheel'];
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
    var open = state === 'playing' || state === 'paused' || state === 'ended';
    el.box.className = open ? '' : 'hidden';
    if (!open) return;
    var f = frame(t);
    el.Veil.style.opacity = f.dusk.toFixed(3);
    el.Stars.style.opacity = f.stars.toFixed(3);
    el.Top.style.transform = el.Bottom.style.transform = 'scaleY(' + f.bars.toFixed(3) + ')';
    if (el.Caption.textContent !== f.caption) el.Caption.textContent = f.caption;
    el.Caption.style.opacity = f.captionAlpha.toFixed(3);
    el.End.style.opacity = f.title.toFixed(3);
    el.Go.className = f.canContinue ? '' : 'hidden';
    el.Skip.className = f.canContinue ? 'hidden' : '';
    var s = Math.floor(t);
    el.Clock.textContent = two(Math.floor(s / 60)) + ':' + two(s % 60) + ' / ' + two(Math.floor(DURATION / 60)) + ':' + two(DURATION % 60) + ' · ' + f.beat;
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
  function play(o) {
    opts = o || {};
    if (opts.muted !== undefined) muted = !!opts.muted;
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
    run();
    return t;
  }
  function skip() {
    if (state !== 'playing' && state !== 'paused') return false;
    reach();
    render();
    return true;
  }
  function pause() { if (state !== 'playing') return false; base = time(); if (state === 'playing') state = 'paused'; render(); return true; }
  function resume() { if (state !== 'paused') return false; anchor = clock(); state = 'playing'; run(); return true; }
  function close() {
    if (state === 'idle' || state === 'closed') return false;
    state = 'closed'; opts = {};
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
    pause: pause, resume: resume, close: close, proceed: proceed,
    state: function () { time(); return state; },
    beat: function () { return beatAt(time()).id; },
    beats: function () { return BEATS.map(function (b) { return { id: b.id, t0: b.t0, t1: b.t1, caption: b.caption }; }); },
    frame: function (t) { return frame(t === undefined ? time() : clamp(+t || 0, 0, DURATION)); },
    text: function () { return { title: TITLE, subtitle: SUBTITLE, cont: CONTINUE, skip: SKIP }; },
    muted: function () { return muted; },
    // Feature flag for the in-game hook; session-only, never saved. Off unless ?l2cutscene=1.
    enabled: function () { return enabled; },
    setEnabled: function (v) { enabled = !!v; return enabled; },
    _setClock: function (fn) { clock = fn; }
  };
  root.__l2Cutscene = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  enabled = query('l2cutscene') === '1';
  muted = query('mute') === '1';
  if (!doc) return;
  function boot() {
    build();
    if (query('cutscene') !== '1') return;
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
