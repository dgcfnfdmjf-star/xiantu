'use strict';

// Level-4 clear cutscene on the built page (390x844 phone). Synthetic saves only (third melody one note from done).
//  A. ?l4cutscene=0 reference: last note -> old 3.2 s finale (#chimeSkip, toast) -> #chimeEnding, no cutscene.
//  B. real clear path: last note -> save written -> cutscene INSTEAD of the 3.2 s finale (no #chimeSkip, gameplay chimes
//     hidden and frozen, no input) -> skip -> guarded tap to continue -> #chimeEnding exactly once, same save as A,
//     留下来 closes it, wheel zoom works, everything hidden is back.
//  B2. the film watched to its natural end -> 轻触继续 -> #chimeEnding exactly once.
//  R. prefers-reduced-motion: the card opens at once, no film, #chimeSkip hidden.
//  C. ?cutscene=l4&mute=1 preview: plays at once, frames are seekable, captions fit one line at 360x780, notes and
//     petals keep off the sun, no save writes. The L1/L2/L3 preview gates still start their own film only.
// Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l4-cutscene-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(__dirname, '../../../output/playwright/l4-cutscene');
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.journey.v1';
const SAVES = {
  'healingGarden.kittens.v1': { total: 20, ended: true, level: 4, caught: { orange: 20 } },
  [KEY]: { caught: { dew: 2, peach: 2, amber: 2, moon: 2, violet: 2, tide: 2 }, lamps: [true, true, true], completed: [1, 2, 3], decor: [false, true, false], chimes: { round: 2, step: 3, found: [] } }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  for (const id of ['l1', 'l3', 'l4']) assert.equal(html.split("if (query('cutscene') !== '" + id + "') return;").length, 2, 'exactly one ' + id + ' preview gate in the build');
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
  const fresh = async (viewport, saves, extra) => {
    const context = await browser.newContext(Object.assign({ viewport: viewport || { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, extra || {}));
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) report.errors.push('console: ' + m.text()); });
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.addInitScript(saves => {
      if (sessionStorage.getItem('l4cs')) return;
      sessionStorage.setItem('l4cs', '1');
      localStorage.setItem('hg_level2_unlocked', '1');
      for (const k in saves) localStorage.setItem(k, JSON.stringify(saves[k]));
    }, saves === undefined ? SAVES : saves);
    return { context, page };
  };
  // The real clear: start on level 4, then the last note (6 · 归音) of the third melody. Counts every time the card opens.
  const clear = async page => {
    await page.locator('#start').click(); await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__journey.state().level), 4);
    assert.deepEqual(await page.evaluate(() => { const c = window.__journey.state().progress.chimes; return [c.round, c.step]; }), [2, 3], 'fixture: one note from the clear');
    await page.evaluate(() => { window.__cardOpens = 0; const end = document.getElementById('chimeEnding'); let was = end.hidden;
      new MutationObserver(() => { if (was && !end.hidden) window.__cardOpens++; was = end.hidden; }).observe(end, { attributes: true, attributeFilter: ['hidden'] }); });
    await page.locator('#chimeKey5').click();
  };
  const cardShown = page => page.evaluate(() => !document.getElementById('chimeEnding').hidden);
  const opens = page => page.evaluate(() => new Promise(r => setTimeout(() => r(window.__cardOpens), 50)));
  const progress = page => page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return JSON.stringify({ chimes: d.chimes, completed: d.completed, caught: d.caught }); }, KEY);
  const csState = page => page.evaluate(() => window.__l4Cutscene.state());
  try {
    /* ---- A: the old behaviour is the reference ---- */
    let { context, page } = await fresh();
    await page.goto(url + '?l4cutscene=0');
    assert.equal(await page.evaluate(() => window.__l4Cutscene.enabled()), false);
    await clear(page);
    const savedA = await progress(page);
    assert(JSON.parse(savedA).completed.includes(4) && JSON.parse(savedA).chimes.round === 3, 'completion saved before the finale');
    assert.equal(await page.locator('#chimeSkip').isVisible(), true, '?l4cutscene=0: the old short finale runs');
    assert.equal(await cardShown(page), false); assert.equal(await page.locator('#chimeKey0').isDisabled(), true, 'input disabled during the old finale');
    await page.waitForFunction(() => !document.getElementById('chimeEnding').hidden, null, { timeout: 6000 });
    assert.equal(await page.locator('#chimeSkip').isHidden(), true);
    assert.equal(await csState(page), 'idle'); assert.equal(await opens(page), 1);
    await context.close();

    /* ---- B: the cutscene replaces the short finale ---- */
    ({ context, page } = await fresh());
    await page.goto(url);
    assert.equal(await page.evaluate(() => window.__l4Cutscene.enabled() && window.__l4Cutscene.ready()), true);
    await clear(page);
    assert.equal(await csState(page), 'playing', 'the film starts on the clearing note');
    assert.equal(await progress(page), savedA, 'same save as the old path, written before the film');
    await page.waitForFunction(() => window.__l4Cutscene.staged(), null, { timeout: 8000 });
    await page.waitForTimeout(3600); // longer than the old 3.2 s finale
    assert.equal(await page.locator('#chimeSkip').isHidden(), true, 'the old 3.2 s finale does not also run');
    assert.equal(await cardShown(page), false, 'no card under the film'); assert.equal(await opens(page), 0);
    assert.equal(await page.evaluate(() => document.getElementById('toast') ? getComputedStyle(document.getElementById('toast')).visibility : 'hidden'), 'hidden');
    const stage = await page.evaluate(() => window.__l4Cutscene.stage());
    assert(stage.staged && stage.sky && stage.chimes === 6 && stage.notes === 18 && stage.petals === 42 && stage.blades > 1000 && stage.blooms > 150 && stage.toon > 10 && stage.hidden > 3, 'stage is up: ' + JSON.stringify(stage));
    assert.equal(await page.evaluate(() => window.__l4Hide.length === 1 && window.__l4Hide.every(g => !g.visible)), true, 'gameplay chimes are off the set');
    assert.equal(await page.evaluate(() => window.GardenJourney.blocked() && window.__l4Cutscene.busy()), true, 'the film counts as an open dialog');
    assert.equal(await page.evaluate(() => ['chimeHud', 'chimeDock', 'chimeSkip', 'topbar'].every(id => getComputedStyle(document.getElementById(id)).visibility === 'hidden')), true, 'chime HUD and dock are out of the frame');
    // No gameplay input: keys, the melody preview and world taps do nothing while it is up.
    // (The echo label still holds the clearing note, 6 · 归音: the chapter is frozen under the film and clears it on close.)
    const echo = await page.evaluate(() => { document.getElementById('chimeKey0').click(); document.getElementById('chimeListen').click(); return document.getElementById('chimeEcho').textContent + '|' + document.getElementById('chimeListen').textContent; });
    assert(!/芽响/.test(echo) && /\|♪ 听一遍$/.test(echo), 'chime keys and preview are inert under the film: ' + echo);
    await page.touchscreen.tap(195, 500); await page.waitForTimeout(200);
    assert.equal(await csState(page), 'playing', 'a tap mid-film does not continue');
    assert.doesNotMatch(await page.evaluate(() => document.getElementById('chimeEcho').textContent), /芽响/);
    await page.screenshot({ path: path.join(OUT, 'ingame-film.png') });
    // Skip, and the same tap cannot also continue (600 ms guard).
    assert.equal(await page.locator('#l4csSkip').isVisible(), true); assert.equal(await page.locator('#l4csSkip').textContent(), '跳过');
    await page.locator('#l4csSkip').tap();
    assert.equal(await csState(page), 'ended');
    await page.evaluate(() => document.getElementById('l4cs').click());
    assert.equal(await csState(page), 'ended', 'the tap that skipped cannot also continue'); assert.equal(await cardShown(page), false);
    await page.waitForTimeout(750);
    assert.equal(await page.locator('#l4csGo').isVisible(), true); assert.equal(await page.locator('#l4csGo').textContent(), '轻触继续');
    assert.equal(await page.locator('#l4csTitle').textContent(), '第四关 · 完成'); assert.equal(await page.locator('#l4csSub').textContent(), '暮色浮岛');
    await page.screenshot({ path: path.join(OUT, 'ingame-end.png') });
    await page.locator('#l4csGo').tap();
    assert.equal(await csState(page), 'closed');
    assert.equal(await cardShown(page), true, 'the card follows the film'); assert.equal(await opens(page), 1, 'the card opens exactly once');
    assert.equal(await page.locator('#chimeEndTitle').textContent(), '风把早安送到了');
    assert.equal(await page.locator('#chimeSkip').isHidden(), true);
    assert.equal(await progress(page), savedA, 'the film wrote nothing');
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({ st: window.__l4Cutscene.stage(), on: document.body.classList.contains('l4cs-on'), group: window.__l4Hide.every(g => g.visible), box: getComputedStyle(document.getElementById('l4cs')).display, hud: getComputedStyle(document.getElementById('chimeHud')).visibility }));
    assert(!after.st.staged && !after.st.sky && after.st.toon === 0 && after.st.hidden === 0 && !after.on && after.group && after.box === 'none' && after.hud === 'visible', 'everything is handed back: ' + JSON.stringify(after));
    await page.locator('#chimeStay').click();
    assert.equal(await cardShown(page), false); assert.equal(await page.evaluate(() => window.GardenJourney.blocked()), false);
    // Free play works again, and nothing reopens the card or the film.
    await page.locator('#chimeKey2').click(); await page.waitForTimeout(100);
    assert.match(await page.evaluate(() => document.getElementById('chimeEcho').textContent), /晨羽/, 'free play rings again');
    await page.waitForTimeout(4000);
    assert.equal(await opens(page), 1); assert.equal(await csState(page), 'closed');
    // The camera is the game's again: wheel zoom moves it.
    const dist = () => page.evaluate(() => window.GardenClip.world.camera.position.length());
    const d0 = await dist();
    await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: 400, bubbles: true })));
    await page.waitForTimeout(1500);
    const d1 = await dist();
    assert(Math.abs(d1 - d0) > 0.5, 'wheel zoom works after the cutscene: ' + d0.toFixed(2) + ' -> ' + d1.toFixed(2));
    report.zoom = [d0, d1].map(v => +v.toFixed(2));
    await page.screenshot({ path: path.join(OUT, 'ingame-after.png') });
    await context.close();

    /* ---- B2: watched to its natural end (the clock runs out by itself), then 轻触继续 ---- */
    ({ context, page } = await fresh());
    await page.goto(url);
    await clear(page);
    await page.waitForFunction(() => window.__l4Cutscene.staged(), null, { timeout: 8000 });
    await page.evaluate(() => window.__l4Cutscene.seek(47.5)); // the last seconds play out in real time
    assert.equal(await csState(page), 'playing'); assert.equal(await page.locator('#l4csGo').isVisible(), false);
    await page.waitForFunction(() => window.__l4Cutscene.finished() && window.__l4Cutscene.state() === 'ended', null, { timeout: 8000 });
    assert.equal(await cardShown(page), false, 'the film waits for the tap'); assert.equal(await page.locator('#l4csSkip').isVisible(), false);
    await page.waitForTimeout(700);
    await page.locator('#l4csGo').tap();
    assert.equal(await csState(page), 'closed'); assert.equal(await cardShown(page), true); assert.equal(await opens(page), 1, 'exactly one card after the full film');
    assert.equal(await page.locator('#chimeSkip').isHidden(), true); assert.equal(await progress(page), savedA);
    await context.close();

    /* ---- R: reduced motion keeps today's behaviour: the card at once, no film, no lengthy effect ---- */
    ({ context, page } = await fresh(null, undefined, { reducedMotion: 'reduce' }));
    await page.goto(url);
    await clear(page);
    assert.equal(await cardShown(page), true, 'reduced motion: the card opens immediately'); assert.equal(await page.locator('#chimeSkip').isHidden(), true);
    assert.equal(await csState(page), 'idle'); assert.equal(await opens(page), 1); assert.equal(await progress(page), savedA);
    await context.close();

    /* ---- C: preview gate, seekable frames, one-line captions at 360x780, no save writes ---- */
    ({ context, page } = await fresh({ width: 360, height: 780 }, {}));
    await page.goto(url + '?cutscene=l4&mute=1');
    await page.waitForFunction(() => window.__l4Cutscene.playing() && window.__l4Cutscene.staged(), null, { timeout: 15000 });
    const before = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
    assert.deepEqual(await page.evaluate(() => [__l4Cutscene.scored(), __l1Cutscene.state(), __l2Cutscene.state(), __l3Cutscene.state()]), [false, 'idle', 'idle', 'idle']);
    assert.equal(await page.evaluate(() => window.__l4Cutscene.pause()), true);
    report.captions = [];
    for (const b of await page.evaluate(() => window.__l4Cutscene.beats())) {
      const t = (b.t0 + b.t1) / 2;
      await page.evaluate(t => window.__l4Cutscene.seek(t), t);
      await page.waitForTimeout(400);
      if (b.caption) {
        const m = await page.evaluate(() => { const c = document.getElementById('l4csCaption'), r = document.createRange(); r.selectNodeContents(c); const rects = r.getClientRects(), box = r.getBoundingClientRect();
          return { text: c.textContent, lines: new Set([...rects].map(q => Math.round(q.top))).size, left: box.left, right: box.right, size: getComputedStyle(c).fontSize, opacity: +c.style.opacity }; });
        assert.equal(m.text, b.caption); assert.equal(m.size, '17px'); assert.equal(m.lines, 1, b.caption + ' wraps at 360px');
        assert(m.left >= 8 && m.right <= 352, b.caption + ' overflows 360px: ' + m.left + '..' + m.right); assert(m.opacity > 0.99);
        report.captions.push([b.caption, Math.round(m.right - m.left)]);
      }
      await page.screenshot({ path: path.join(OUT, 'preview-360-' + b.id + '.png') });
    }
    // seek(t) reproduces the frame: same camera and the same actors whichever way it is reached.
    const probeAt = t => page.evaluate(async t => { const cs = window.__l4Cutscene; cs.seek(t); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return { p: cs.probe(), cam: cs.stage().camera, notes: cs.frame(t).notes, chimes: cs.frame(t).chimes }; }, t);
    for (const t of [12.4, 26, 38.2]) {
      const a = await probeAt(t), other = await probeAt(t === 38.2 ? 6 : 45), b = await probeAt(t);
      assert.equal(JSON.stringify(a.p), JSON.stringify(b.p), 'stage actors are a pure function of t at ' + t);
      assert(a.cam.every((v, i) => Math.abs(v - b.cam[i]) < 0.05) && a.cam.some((v, i) => Math.abs(v - other.cam[i]) > 0.5), 'seek is deterministic at ' + t);
      a.p.chimes.forEach((c, i) => assert(Math.abs(c[0] - a.chimes[i].swing) < 1e-6 && Math.abs(c[1] - Math.min(a.chimes[i].glow, 1)) < 1e-6, 'chime ' + i + ' is posed by the model at ' + t));
      a.p.notes.forEach((n, j) => assert(Math.abs(n[3] - a.notes[j].alpha) < 1e-6 && Math.hypot(n[0] - a.notes[j].x, n[1] - a.notes[j].y, n[2] - a.notes[j].z) < 4, 'note ' + j + ' is where the model puts it at ' + t));
    }
    // Glows are plainly visible when a chime is struck, and notes stay a readable size in the widest shot.
    const struck = await probeAt(11.3); assert(struck.p.chimes[0][1] > 0.6 && struck.p.chimes[0][2] > 0.5, 'a struck chime glows: ' + struck.p.chimes[0]);
    const wide = await page.evaluate(async () => { const cs = window.__l4Cutscene; cs.seek(46); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const cam = window.GardenClip.world.camera, h = document.querySelector('canvas').height, k = h / (2 * Math.tan(cam.fov * Math.PI / 360)), e = new THREE.Vector3();
      const px = (list, top) => list.filter(n => n[3] > 0.3).map(n => { e.set(n[0], n[1] + top, n[2]); return n[4] * k / e.distanceTo(cs.__eye ? cs.__eye : cam.position); });
      return { h, notes: px(cs.probe().notes, 0), petals: px(cs.probe().petals, 0) }; });
    assert(wide.notes.length >= 8 && Math.min(...wide.notes) > wide.h * 0.03, 'notes read in the wide shot: ' + Math.min(...wide.notes).toFixed(1) + 'px of ' + wide.h);
    assert(wide.petals.length >= 15 && Math.min(...wide.petals) > wide.h * 0.012, 'petals read in the wide shot: ' + Math.min(...wide.petals).toFixed(1) + 'px');
    // No note or petal is ever drawn on the sun's disc.
    let closest = 9;
    for (let t = 2; t <= 50; t += 0.5) { const p = (await probeAt(t)).p; closest = Math.min(closest, p.sunClear); assert(p.sunClear > p.sunDisc * 1.2, 'notes and petals keep off the sun at ' + t + ': ' + p.sunClear); }
    report.sunClear = +closest.toFixed(3);
    assert.equal(await page.evaluate(() => window.__l4Cutscene.seek(50) && window.__l4Cutscene.state()), 'ended');
    await page.waitForTimeout(700);
    assert.equal(await page.locator('#l4csGo').isVisible(), true);
    await page.screenshot({ path: path.join(OUT, 'preview-360-end.png') });
    await page.locator('#l4csGo').tap();
    assert.equal(await csState(page), 'closed');
    assert.equal(await cardShown(page), false, 'the preview has no card to show');
    assert.equal(await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]))), before, 'preview wrote no save');
    assert.equal(await page.locator('#start').isVisible(), true, 'the game is back');
    await context.close();

    // The other films' preview gates still start their own film, and only that one.
    for (const id of ['l1', 'l2', 'l3']) {
      ({ context, page } = await fresh({ width: 390, height: 844 }, {}));
      await page.goto(url + '?cutscene=' + (id === 'l2' ? '1' : id) + '&mute=1'); // the level-2 gate is ?cutscene=1
      await page.waitForFunction(id => window['__' + id + 'Cutscene'].playing(), id, { timeout: 15000 });
      assert.equal(await csState(page), 'idle', '?cutscene=' + id + ' leaves the level-4 film alone');
      await context.close();
    }
    report.gates = ['l1', 'l2', 'l3', 'l4'];

    // 390x844 stills for review.
    ({ context, page } = await fresh({ width: 390, height: 844 }, {}));
    await page.goto(url + '?cutscene=l4&mute=1');
    await page.waitForFunction(() => window.__l4Cutscene.staged(), null, { timeout: 15000 });
    await page.evaluate(() => window.__l4Cutscene.pause());
    for (const t of [1, 6, 12, 17, 24, 29, 35, 41, 47]) {
      await page.evaluate(t => window.__l4Cutscene.seek(t), t); await page.waitForTimeout(450);
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
