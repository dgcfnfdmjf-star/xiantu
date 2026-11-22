'use strict';

// Level-3 clear cutscene on the built page (390x844 phone). Synthetic saves only.
//  A. ?l3cutscene=0 reference: third lamp -> finale -> #starEnding, no cutscene.
//  B. real clear path: third lamp -> finale -> cutscene (gameplay frozen and hidden) -> skip -> guarded tap to continue ->
//     #starEnding exactly once, same save as A, 留下来 closes it, wheel zoom works, everything hidden is back.
//     The score (星灯摇篮曲) starts with the film, takes the music bus, follows the film clock through seeks, settles on skip
//     and hands the level theme back on close.
//  D. music switch off: the film runs silent and leaves the switch and the track alone.
//  C. ?cutscene=l3&mute=1 preview (never starts the score): plays at once, frames are seekable, captions fit one line at 360x780, no save writes.
// Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l3-cutscene-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(__dirname, '../../../output/playwright/l3-cutscene');
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.journey.v1';
const SAVES = {
  'healingGarden.kittens.v1': { total: 20, ended: true, level: 3, caught: { orange: 20 } },
  [KEY]: { caught: { dew: 6, amber: 3, violet: 1 }, charge: 4, lamps: [true, true, false], completed: [1, 2], decor: [true, true, true] }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  assert.equal(html.split("if (query('cutscene') !== 'l3') return;").length, 2, 'exactly one l3 preview gate in the build');
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.resolve(SITE, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(SITE + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const report = { errors: [] };
  const fresh = async (viewport, saves) => {
    const context = await browser.newContext({ viewport: viewport || { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) report.errors.push('console: ' + m.text()); });
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.addInitScript(saves => {
      if (sessionStorage.getItem('l3cs')) return;
      sessionStorage.setItem('l3cs', '1');
      localStorage.setItem('hg_level2_unlocked', '1');
      for (const k in saves) localStorage.setItem(k, JSON.stringify(saves[k]));
    }, saves === undefined ? SAVES : saves);
    return { context, page };
  };
  // The real clear: start, tap the third lamp's button, then the game's own 跳过演出 button ends the beam finale.
  const clear = async page => {
    await page.locator('#start').click(); await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__journey.state().level), 3);
    if (page.__beforeClear) await page.__beforeClear();
    await page.locator('#starLamp2').click();
    assert.equal(await page.evaluate(() => window.__level3.isRunning()), true, 'finale starts');
    await page.waitForTimeout(600);
    await page.locator('#starFinaleSkip').click();
  };
  const cardShown = page => page.evaluate(() => !document.getElementById('starEnding').hidden);
  const progress = page => page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return JSON.stringify({ lamps: d.lamps, charge: d.charge, completed: d.completed, caught: d.caught }); }, KEY);
  try {
    /* ---- A: the old behaviour is the reference ---- */
    let { context, page } = await fresh();
    await page.goto(url + '?l3cutscene=0');
    assert.equal(await page.evaluate(() => window.__l3Cutscene.enabled()), false);
    await clear(page);
    await page.waitForTimeout(300);
    assert.equal(await cardShown(page), true, '?l3cutscene=0: the card shows straight after the finale');
    assert.equal(await page.evaluate(() => window.__l3Cutscene.state()), 'idle');
    const refSave = await progress(page);
    assert.equal(await page.locator('#chimeNext, #starEnding button').count() >= 3, true, 'stay / journal / next chapter buttons');
    const buttons = await page.locator('#starEnding button').allTextContents();
    await context.close();

    /* ---- B: cutscene first, then the same card exactly once ---- */
    ({ context, page } = await fresh());
    await page.goto(url);
    await page.evaluate(() => {
      window.__shown = 0; const card = document.getElementById('starEnding');
      new MutationObserver(() => { if (!card.hidden) window.__shown++; }).observe(card, { attributes: true, attributeFilter: ['hidden'] });
    });
    let themeBefore = '';
    page.__beforeClear = async () => { themeBefore = await page.evaluate(() => GardenAudio.currentTrackName()); assert.equal(await page.evaluate(() => __l3Score.state().active), false, 'score idle before the clear'); };
    const visibleBefore = await page.evaluate(() => { let n = 0; window.GardenClip.world.scene.traverse(o => { if (o.visible) n++; }); return n; });
    await clear(page);
    await page.waitForFunction(() => window.__l3Cutscene.playing() && window.__l3Cutscene.staged(), null, { timeout: 8000 });
    assert.equal(await cardShown(page), false, 'card waits for the cutscene');
    assert.equal(await progress(page), refSave, 'the clear is saved before the cutscene, same as without it');
    const stage = await page.evaluate(() => window.__l3Cutscene.stage());
    assert(stage.sky && stage.blades > 800 && stage.lamps === 3 && stage.flies === 24 && stage.hidden > 3, JSON.stringify(stage));
    assert.deepEqual([...new Set(stage.cast)].sort(), ['amber', 'dew', 'violet'], 'cast wears the caught colours');
    assert(stage.cast.filter(c => c === 'dew').length > stage.cast.filter(c => c === 'violet').length, 'in proportion to the counts');
    assert.equal(await page.evaluate(() => window.GardenJourney.blocked()), true, 'gameplay input is blocked');
    // Gameplay is frozen: the boat and the wisps neither move nor show.
    const frozen = () => page.evaluate(() => JSON.stringify([window.__voyage.state().pos, window.__voyage.state().u, window.__level3.state(), window.__journey.targets().length]));
    const f0 = await frozen(); await page.waitForTimeout(700);
    assert.equal(await frozen(), f0, 'boat, beams and wisps hold still while staged');
    assert.equal(await page.evaluate(() => window.__l3Stage.groups().concat(window.__l3Hide, [window.GardenClip.boat]).some(g => g.visible)), false, 'gameplay wisps, lamps, beams and boat are off the set');
    // The score starts with the film, owns the music bus and follows the film clock (also through seeks).
    assert.equal(await page.evaluate(() => window.__l3Cutscene.scored()), true, 'score started with the cutscene');
    await page.waitForTimeout(900);
    let music = await page.evaluate(() => ({ s: __l3Score.state(), t: __l3Cutscene.time(), audio: GardenAudio.context().state, others: [__l1Score.state().active, __l2Score.state().active] }));
    assert.equal(music.audio, 'running');
    assert(music.s.active && music.s.current && music.s.musicOn && music.s.track === '星灯摇篮曲' && themeBefore && themeBefore !== '星灯摇篮曲', 'lullaby owns the music bus: ' + JSON.stringify([music.s, themeBefore]));
    assert(music.s.steps > 0 && Math.abs(music.s.position - music.t) < 0.45, 'score follows the film clock: ' + JSON.stringify(music));
    assert.deepEqual(music.others, [false, false], 'level-1 and level-2 scores untouched');
    await page.evaluate(() => window.__l3Cutscene.seek(33.4));
    let peakLive = 0;
    await page.waitForTimeout(2500); // tails from before the seek ring out
    for (let i = 0; i < 14; i++) { await page.waitForTimeout(250); peakLive = Math.max(peakLive, await page.evaluate(() => __musicLush.live())); }
    music = await page.evaluate(() => ({ s: __l3Score.state(), t: __l3Cutscene.time() }));
    assert(music.t > 36 && music.t < 43 && Math.abs(music.s.position - music.t) < 0.45 && music.s.lastStep >= 96, 'score jumped with seek: ' + JSON.stringify(music));
    // felt/harp stop at 34 live sources; a string chord adds four sustained voices on top (same bound as levels 1 and 2).
    assert(peakLive > 4 && peakLive <= 34 + 4, 'voice count in the swell: ' + peakLive);
    report.peakLive = peakLive;
    await page.evaluate(() => window.__l3Cutscene.seek(11));
    await page.waitForTimeout(1200);
    music = await page.evaluate(() => ({ s: __l3Score.state(), t: __l3Cutscene.time() }));
    assert(Math.abs(music.s.position - music.t) < 0.45 && music.t < 14, 'score follows a backward seek: ' + JSON.stringify(music));
    await page.evaluate(() => window.__l3Cutscene.pause()); await page.waitForTimeout(900);
    const heldSteps = await page.evaluate(() => __l3Score.state().steps); await page.waitForTimeout(900);
    assert.equal(await page.evaluate(() => __l3Score.state().steps), heldSteps, 'paused film, silent score');
    await page.evaluate(() => window.__l3Cutscene.resume()); await page.waitForTimeout(900);
    music = await page.evaluate(() => ({ s: __l3Score.state(), t: __l3Cutscene.time() }));
    assert(music.s.steps > heldSteps && Math.abs(music.s.position - music.t) < 0.45, 'resumes on the film clock: ' + JSON.stringify(music));
    await page.mouse.click(195, 500); // a tap on the film neither catches nor continues
    assert.equal(await page.evaluate(() => window.__l3Cutscene.state()), 'playing');
    assert.equal(await page.locator('#l3csSkip').isVisible(), true);
    assert.equal(await page.locator('#starHud').isVisible(), false, 'HUD steps aside');
    await page.screenshot({ path: path.join(OUT, 'ingame-playing.png') });
    // Observe the second activation while the real tap is still being dispatched.
    await page.evaluate(() => {
      document.getElementById('l3csSkip').addEventListener('click', () => {
        window.__continuedOnSkip = window.__l3Cutscene.proceed();
      }, { once: true });
    });
    await page.locator('#l3csSkip').tap();
    assert.equal(await page.evaluate(() => window.__continuedOnSkip), false, 'the skipping tap cannot also continue');
    assert.equal(await page.evaluate(() => window.__l3Cutscene.state()), 'ended');
    assert.equal(await page.locator('#l3csGo').isVisible(), true);
    assert.equal(await page.locator('#l3csTitle').textContent(), '第三关 · 完成');
    assert.equal(await page.locator('#l3csSub').textContent(), '暮色浮岛');
    music = await page.evaluate(() => __l3Score.state());
    assert(music.active && music.free, 'score settles into its cadence after skip');
    assert.equal(await cardShown(page), false);
    await page.waitForTimeout(750);
    await page.locator('#l3csGo').tap();
    await page.waitForFunction(() => !document.getElementById('starEnding').hidden);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.__shown), 1, '#starEnding shown exactly once');
    music = await page.evaluate(() => ({ s: __l3Score.state(), scored: __l3Cutscene.scored() }));
    assert(!music.s.active && !music.scored && music.s.musicOn && music.s.track === themeBefore, 'level music returns: ' + JSON.stringify(music.s));
    report.theme = themeBefore;
    assert.equal(await page.evaluate(() => window.__l3Cutscene.state()), 'closed');
    assert.equal(await page.evaluate(() => window.__l3Cutscene.staged()), false);
    assert.equal(await page.locator('#l3cs').isVisible(), false);
    assert.equal(await page.evaluate(() => document.body.classList.contains('l3cs-on')), false);
    assert.deepEqual(await page.locator('#starEnding button').allTextContents(), buttons, 'same buttons on the card (stay / journal / next chapter)');
    assert.equal(await progress(page), refSave, 'save identical to the ?l3cutscene=0 run');
    await page.screenshot({ path: path.join(OUT, 'ingame-card.png') });
    await page.locator('#starStay').click();
    assert.equal(await cardShown(page), false);
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => window.__shown), 1, 'still once');
    // Everything the stage hid is back, the game's boat sails again, and wisps can be caught.
    const visibleAfter = await page.evaluate(() => { let n = 0; window.GardenClip.world.scene.traverse(o => { if (o.visible && !o.l3cs) n++; }); return n; });
    assert(visibleAfter >= visibleBefore - 12, 'scene objects restored: ' + visibleBefore + ' -> ' + visibleAfter);
    assert.equal(await page.evaluate(() => window.GardenJourney.blocked()), false);
    const u0 = await page.evaluate(() => window.__voyage.state().clock); await page.waitForTimeout(500);
    assert.notEqual(await page.evaluate(() => window.__voyage.state().clock), u0, 'voyage runs again');
    assert.equal(await page.evaluate(() => window.__voyage.state().boat), true, 'the game boat is visible again');
    await page.waitForFunction(() => window.__journey.targets().length > 0, null, { timeout: 8000 });
    // The camera is the game's again: wheel zoom moves it.
    const dist = () => page.evaluate(() => window.GardenClip.world.camera.position.length());
    const d0 = await dist();
    await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: 400, bubbles: true })));
    await page.waitForTimeout(1500);
    const d1 = await dist();
    assert(Math.abs(d1 - d0) > 0.5, 'wheel zoom works after the cutscene: ' + d0.toFixed(2) + ' -> ' + d1.toFixed(2));
    // Pinch (two real touch points through CDP) zooms too, both ways.
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i })) });
    const pinch = async (from, to) => {
      await touch('touchStart', [[195 - from, 420], [195 + from, 420]]);
      for (let i = 1; i <= 8; i++) { const g = from + (to - from) * i / 8; await touch('touchMove', [[195 - g, 420], [195 + g, 420]]); await page.waitForTimeout(30); }
      await touch('touchEnd', []);
      await page.waitForTimeout(1500);
    };
    await pinch(40, 150);
    const d2 = await dist();
    await pinch(150, 40);
    const d3 = await dist();
    assert(d2 < d1 - 0.5 && d3 > d2 + 0.5, 'pinch zoom works after the cutscene: ' + [d1, d2, d3].map(v => v.toFixed(2)));
    report.zoom = [d0, d1, d2, d3].map(v => +v.toFixed(2));
    // The sparkle voice is the celesta (three sine oscillators a note through the kit), not the harp.
    const cel = await page.evaluate(() => {
      const GA = window.GardenAudio, K = GA.kit, V = window.__music2.voices, ctx = GA.context(), osc = K.osc, harp = V.harp, seen = { osc: [], harp: 0 };
      K.osc = function (type, f) { seen.osc.push([type, Math.round(f)]); return osc.apply(this, arguments); };
      V.harp = function () { seen.harp++; };
      try { window.__l3Score.celesta(ctx.currentTime + 0.05, 84, 0.0001, K.gain(0)); } finally { K.osc = osc; V.harp = harp; }
      return { seen, voice: window.__l3Score.sparkleVoice };
    });
    assert.equal(cel.voice, 'celesta');
    assert.deepEqual(cel.seen, { osc: [['sine', 1047], ['sine', 2093], ['sine', 4207]], harp: 0 }, 'celesta = fundamental + octave + strike');
    await page.screenshot({ path: path.join(OUT, 'ingame-after.png') });
    await context.close();

    /* ---- D: music switch off -> the film runs silent; the switch and the track are left as they were ---- */
    ({ context, page } = await fresh());
    await page.goto(url);
    let quietTheme = '';
    page.__beforeClear = async () => { quietTheme = await page.evaluate(() => { GardenAudio.setMusic(false); return GardenAudio.currentTrackName(); }); };
    await clear(page);
    await page.waitForFunction(() => window.__l3Cutscene.playing() && window.__l3Cutscene.staged(), null, { timeout: 8000 });
    await page.waitForTimeout(2500);
    let quiet = await page.evaluate(() => ({ s: __l3Score.state(), live: __musicLush.live() }));
    assert(quiet.s.active && quiet.s.musicOn === false && quiet.s.steps === 0, 'music switch off: nothing is played: ' + JSON.stringify(quiet));
    await page.evaluate(() => { window.__l3Cutscene.skip(); window.__l3Cutscene.proceed(true); });
    quiet = await page.evaluate(() => ({ s: __l3Score.state(), cs: __l3Cutscene.state() }));
    assert(quiet.cs === 'closed' && !quiet.s.active && quiet.s.musicOn === false && quiet.s.steps === 0 && quiet.s.track === quietTheme, 'closed with the film, switch still off: ' + JSON.stringify(quiet));
    assert.equal(await cardShown(page), true, 'the card still follows a silent film');
    await page.evaluate(() => GardenAudio.setMusic(true));
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => GardenAudio.currentTrackName()), quietTheme, 'switching music back on plays the level theme');
    await context.close();

    /* ---- C: preview gate, seekable frames, one-line captions at 360x780, no save writes ---- */
    ({ context, page } = await fresh({ width: 360, height: 780 }, {}));
    await page.goto(url + '?cutscene=l3&mute=1');
    await page.waitForFunction(() => window.__l3Cutscene.playing() && window.__l3Cutscene.staged(), null, { timeout: 15000 });
    const before = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
    assert.deepEqual(await page.evaluate(() => [__l3Cutscene.scored(), __l3Score.state().active]), [false, false], '&mute=1 never starts the score');
    assert.equal(await page.evaluate(() => window.__l3Cutscene.pause()), true);
    report.captions = [];
    for (const b of await page.evaluate(() => window.__l3Cutscene.beats())) {
      const t = (b.t0 + b.t1) / 2;
      await page.evaluate(t => window.__l3Cutscene.seek(t), t);
      await page.waitForTimeout(400);
      if (b.caption) {
        const m = await page.evaluate(() => { const c = document.getElementById('l3csCaption'), r = document.createRange(); r.selectNodeContents(c); const rects = r.getClientRects(), box = r.getBoundingClientRect();
          return { text: c.textContent, lines: new Set([...rects].map(q => Math.round(q.top))).size, left: box.left, right: box.right, size: getComputedStyle(c).fontSize, opacity: +c.style.opacity }; });
        assert.equal(m.text, b.caption); assert.equal(m.size, '17px'); assert.equal(m.lines, 1, b.caption + ' wraps at 360px');
        assert(m.left >= 8 && m.right <= 352, b.caption + ' overflows 360px: ' + m.left + '..' + m.right); assert(m.opacity > 0.99);
        report.captions.push([b.caption, Math.round(m.right - m.left)]);
      }
      await page.screenshot({ path: path.join(OUT, 'preview-360-' + b.id + '.png') });
    }
    // seek(t) reproduces the frame: same camera whichever way it is reached.
    const camAt = t => page.evaluate(async t => { window.__l3Cutscene.seek(t); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return JSON.stringify(window.__l3Cutscene.stage().camera); }, t);
    // (The live island bobs a few millimetres under the camera, hence the tolerance; the model itself is exact, see l3-cutscene.cjs.)
    const c1 = JSON.parse(await camAt(26)), c2 = JSON.parse(await camAt(41)), c3 = JSON.parse(await camAt(26));
    assert(c1.every((v, i) => Math.abs(v - c3[i]) < 0.05) && c1.some((v, i) => Math.abs(v - c2[i]) > 0.5), 'seek is deterministic: ' + [c1, c2, c3].join(' | '));
    // The actors on stage are exactly the model at that second, whichever way the frame is reached: fireflies (glow
    // points and wisp bodies), the boat and its wake ribbon.
    const probeAt = t => page.evaluate(async t => { const cs = window.__l3Cutscene; cs.seek(t); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const p = cs.probe(), n = cs.layout().count, model = []; for (let j = 0; j < n; j++) { const f = cs.fly(j, t); model.push([f.x, f.y, f.z, f.alpha * f.twinkle]); }
      return { p, model, boat: cs.boat(t), wake: cs.wake(t, cs.layout().wakeAge / 2), st: cs.stage() }; }, t);
    const near = (a, b, eps) => Math.abs(a - b) < (eps || 1e-3);
    for (const t of [12.4, 24.6, 38.2]) {
      const a = await probeAt(t); await probeAt(t === 38.2 ? 6 : 45); const b = await probeAt(t);
      assert.equal(JSON.stringify(a.p), JSON.stringify(b.p), 'stage actors are a pure function of t at ' + t);
      // where the model puts it, except that one seen near the moon is slid round the rim (a few metres at star distance)
      a.p.flies.forEach((f, j) => assert(f.every((v, k) => near(v, a.model[j][k], k < 3 && a.model[j][1] > 15 ? 9 : 1e-3)), 'firefly ' + j + ' is where the model puts it at ' + t));
      assert(a.p.flies.every(f => f[1] > 0.5), 'no firefly in the ground at ' + t);
      if (t > 31) {
        assert(near(a.p.boat[0], a.boat.x) && near(a.p.boat[1], a.boat.y) && near(a.p.boat[2], a.boat.z) && near(a.p.boat[3], a.boat.yaw) && a.st.boat, 'boat pose at ' + t);
        const mid = a.p.wake[(a.p.wake.length - 1) / 2]; assert(near(mid[0], a.wake.x, a.wake.half + 0.01) && near(mid[1], a.wake.z, a.wake.half + 0.01), 'wake lies on the path');
      } else assert.equal(a.st.boat, false);
    }
    // No firefly (or the star it becomes) is ever drawn on the moon's disc.
    for (let t = 8; t <= 50; t += 0.5) { const p = (await probeAt(t)).p; assert(p.moonClear > p.moonDisc * 1.2, 'fireflies keep off the moon at ' + t + ': ' + p.moonClear); }
    const bodies = (await probeAt(12.4)).p.bodies, stars = (await probeAt(44)).p;
    assert(bodies.every(v => v > 0.5) && stars.bodies.every(v => v === 0) && stars.flies.every(f => f[1] > 20 && f[2] < -50), 'wisp bodies near the ground, pure starlight in the sky');
    assert.equal(await page.evaluate(() => window.__l3Cutscene.seek(50) && window.__l3Cutscene.state()), 'ended');
    await page.waitForTimeout(700);
    assert.equal(await page.locator('#l3csGo').isVisible(), true);
    await page.screenshot({ path: path.join(OUT, 'preview-360-end.png') });
    await page.locator('#l3csGo').tap();
    assert.equal(await page.evaluate(() => window.__l3Cutscene.state()), 'closed');
    assert.equal(await cardShown(page), false, 'the preview has no card to show');
    assert.equal(await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]))), before, 'preview wrote no save');
    assert.equal(await page.locator('#start').isVisible(), true, 'the game is back');
    await context.close();

    // 390x844 stills for review.
    ({ context, page } = await fresh({ width: 390, height: 844 }, {}));
    await page.goto(url + '?cutscene=l3&mute=1');
    await page.waitForFunction(() => window.__l3Cutscene.staged(), null, { timeout: 15000 });
    await page.evaluate(() => window.__l3Cutscene.pause());
    for (const t of [1, 6, 13, 17, 24, 29, 35, 41, 47]) {
      await page.evaluate(t => window.__l3Cutscene.seek(t), t); await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(OUT, 'still-' + String(t).padStart(2, '0') + '.png') });
    }
    await context.close();
    assert.deepEqual(report.errors, [], 'no console errors');
    report.pass = true;
  } finally {
    await browser.close(); server.close();
    console.log(JSON.stringify(report));
  }
})().catch(e => { console.error(e); process.exit(1); });
