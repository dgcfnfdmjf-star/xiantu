'use strict';

// Level-3 clear cutscene on the built page (390x844 phone). Synthetic saves only.
//  A. ?l3cutscene=0 reference: third lamp -> finale -> #starEnding, no cutscene.
//  B. real clear path: third lamp -> finale -> cutscene (gameplay frozen and hidden) -> skip -> guarded tap to continue ->
//     #starEnding exactly once, same save as A, 留下来 closes it, wheel zoom works, everything hidden is back.
//  C. ?cutscene=l3&mute=1 preview: plays at once, frames are seekable, captions fit one line at 360x780, no save writes.
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
    await page.mouse.click(195, 500); // a tap on the film neither catches nor continues
    assert.equal(await page.evaluate(() => window.__l3Cutscene.state()), 'playing');
    assert.equal(await page.locator('#l3csSkip').isVisible(), true);
    assert.equal(await page.locator('#starHud').isVisible(), false, 'HUD steps aside');
    await page.screenshot({ path: path.join(OUT, 'ingame-playing.png') });
    await page.locator('#l3csSkip').tap();
    assert.equal(await page.evaluate(() => window.__l3Cutscene.state()), 'ended');
    assert.equal(await page.locator('#l3csGo').isVisible(), true);
    assert.equal(await page.locator('#l3csTitle').textContent(), '第三关 · 完成');
    assert.equal(await page.locator('#l3csSub').textContent(), '暮色浮岛');
    assert.equal(await page.evaluate(() => window.__l3Cutscene.proceed()), false, 'the skipping tap cannot also continue');
    assert.equal(await cardShown(page), false);
    await page.waitForTimeout(750);
    await page.locator('#l3csGo').tap();
    await page.waitForFunction(() => !document.getElementById('starEnding').hidden);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.__shown), 1, '#starEnding shown exactly once');
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
    report.zoom = [+d0.toFixed(2), +d1.toFixed(2)];
    await page.screenshot({ path: path.join(OUT, 'ingame-after.png') });
    await context.close();

    /* ---- C: preview gate, seekable frames, one-line captions at 360x780, no save writes ---- */
    ({ context, page } = await fresh({ width: 360, height: 780 }, {}));
    await page.goto(url + '?cutscene=l3&mute=1');
    await page.waitForFunction(() => window.__l3Cutscene.playing() && window.__l3Cutscene.staged(), null, { timeout: 15000 });
    const before = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
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
