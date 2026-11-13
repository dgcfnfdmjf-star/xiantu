'use strict';

// Level-1 clear cutscene on the built page (390x844 phone). Synthetic saves only.
//  A. real clear path: 30th point -> startEnding -> cutscene -> skip -> tap to continue -> the existing #bfEnding card
//     (exactly once) -> 第二关 button reaches level 2; zoom still works; saves match the ?l1cutscene=0 run.
//  B. ?l1cutscene=0 keeps the old 5.2 s card.   C. ?cutscene=l1 preview (muted starts at once), no save writes.
// Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l1-cutscene-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(__dirname, '../../../output/playwright/l1-cutscene');
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.butterflies.v1';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
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
  const fresh = async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) report.errors.push('console: ' + m.text()); });
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.addInitScript(([key, save]) => {
      if (sessionStorage.getItem('l1cs')) return;
      sessionStorage.setItem('l1cs', '1');
      localStorage.setItem(key, JSON.stringify(save));
    }, [KEY, { total: 29, ended: false, caught: { pieris: 12, colias: 9, monarch: 8 } }]);
    return { context, page };
  };
  // One real catch through the game's own catchAt (the same call a tap makes): 29 -> 30+ points.
  const clear = async page => {
    await page.locator('#start').click();
    await page.waitForTimeout(1500);
    for (let tries = 0; tries < 60; tries++) {
      const ended = await page.evaluate(() => {
        for (const b of window.__bf.butterflies) {
          if (window.__bf.state().ended) break;
          const s = window.__bf.screenOf(b);
          if (s.front) window.__bf.catchAt(s.x, s.y);
        }
        return window.__bf.state().ended;
      });
      if (ended) return;
      await page.waitForTimeout(200);
    }
    throw Error('could not catch the 30th point');
  };
  const cardHidden = page => page.evaluate(() => document.getElementById('bfEnding').classList.contains('hidden'));
  // Which butterfly is caught (species, +1 or +3) is random, so runs are compared on what the clear itself decides.
  const save = page => page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return { reached: d.total >= 30, ended: d.ended }; }, KEY);
  const rawSave = page => page.evaluate(key => localStorage.getItem(key), KEY);
  const toLevel2 = async page => {
    assert.equal(await page.locator('#kitNext').isVisible(), true, 'next-level button on the card');
    await page.locator('#kitNext').tap();
    await page.waitForFunction(() => window.__kittens.state().level === 2);
    assert.equal(await cardHidden(page), true);
    assert.equal(await page.evaluate(() => window.__bf.state().endingUp), false);
  };
  try {
    /* ---- B first: the old behaviour is the reference ---- */
    let { context, page } = await fresh();
    await page.goto(url + '?l1cutscene=0');
    assert.equal(await page.evaluate(() => window.__l1Cutscene.enabled()), false);
    await clear(page);
    await page.waitForTimeout(3000);
    assert.equal(await cardHidden(page), true, 'old card not before 5.2 s');
    assert.equal(await page.evaluate(() => window.__l1Cutscene.state()), 'idle', 'no cutscene with ?l1cutscene=0');
    assert.equal(await page.locator('#l1cs').isVisible(), false);
    await page.waitForFunction(() => !document.getElementById('bfEnding').classList.contains('hidden'), null, { timeout: 6000 });
    const oldSave = await save(page);
    assert.equal(oldSave.ended, true);
    await toLevel2(page);
    const oldAfter = await page.evaluate(() => JSON.stringify([localStorage.getItem('hg_level2_unlocked'), window.__kittens.state().level, window.__bf.state().ended]));
    await context.close();

    /* ---- A: cutscene on the real clear path ---- */
    ({ context, page } = await fresh());
    await page.goto(url);
    assert.equal(await page.evaluate(() => window.__l1Cutscene.enabled()), true);
    await page.evaluate(() => { // count how often the card is revealed
      window.__cardShows = 0; const en = document.getElementById('bfEnding');
      new MutationObserver(() => { const up = !en.classList.contains('hidden'); if (up && !window.__cardUp) window.__cardShows++; window.__cardUp = up; }).observe(en, { attributes: true, attributeFilter: ['class'] });
    });
    await clear(page);
    await page.waitForFunction(() => window.__l1Cutscene.playing() && window.__l1Cutscene.staged());
    assert.deepEqual(await save(page), oldSave, 'same save at clear');
    const rawAtClear = await rawSave(page);
    assert.equal(await page.evaluate(() => window.__l2Cutscene.state()), 'idle', 'level-2 cutscene untouched');
    assert.equal(await page.locator('#l1cs').isVisible(), true);
    assert.equal(await page.locator('#l1csPaper').isVisible(), true, 'paper overlay up');
    assert.equal(await page.locator('#modes').isVisible(), false, 'game UI steps aside');
    const skipBox = await page.locator('#l1csSkip').boundingBox();
    assert(skipBox.width >= 44 && skipBox.height >= 44 && skipBox.x + skipBox.width <= 390 && skipBox.y + skipBox.height < 211, 'skip in the top corner');
    // Gameplay butterflies: hidden, frozen, not catchable; taps on the island do nothing.
    const wild = () => page.evaluate(() => JSON.stringify(window.__bf.butterflies.map(b => [b.g.visible, +b.pos.x.toFixed(4), +b.pos.y.toFixed(4)])));
    await page.waitForTimeout(3500); // past the game's own staggered release spawns
    const w0 = await wild(), total0 = await page.evaluate(() => window.__bf.state().total);
    await page.touchscreen.tap(195, 500); await page.touchscreen.tap(120, 420);
    await page.waitForTimeout(600);
    assert.equal(await wild(), w0, 'gameplay butterflies frozen');
    assert(JSON.parse(w0).length > 0 && JSON.parse(w0).every(b => b[0] === false), 'gameplay butterflies hidden');
    assert.equal(await page.evaluate(() => window.__bf.catchAt(195, 500)), null);
    assert.equal(await page.evaluate(() => window.__bf.state().total), total0);
    assert.equal(await page.evaluate(() => window.__l1Cutscene.state()), 'playing', 'a tap mid-film does not continue');
    await page.waitForTimeout(1500);
    assert.equal(await cardHidden(page), true, 'card waits for the cutscene (old timer was 5.2 s)');
    // Painterly stage and seekable frames.
    const st = await page.evaluate(() => window.__l1Cutscene.stage());
    assert(st.sky && st.gameSky === false && st.toon > 20 && st.blades > 1000 && st.blooms > 80 && st.cast === 14, JSON.stringify(st));
    const shoot = async t => {
      await page.evaluate(t => { window.__l1Cutscene.pause(); window.__l1Cutscene.seek(t); }, t);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, 't' + t + '.png') });
      return page.evaluate(() => window.__l1Cutscene.stage());
    };
    const shots = {};
    for (const t of [4, 13, 25, 39, 48]) shots[t] = await shoot(t);
    assert.equal(shots[4].flies, 0); assert(shots[13].flies > 0 && shots[13].flies < 14); assert.equal(shots[25].flies, 14); assert.equal(shots[48].flies, 14);
    assert.notDeepEqual(shots[4].camera, shots[48].camera, 'camera moves');
    const again = await shoot(13);
    again.camera.forEach((v, i) => assert(Math.abs(v - shots[13].camera[i]) < 0.35, 'seek repeats the camera'));
    assert.equal(again.flies, shots[13].flies);
    assert.equal(await page.locator('#l1csCaption').innerText(), '你轻轻打开网，三十份心动回到风里');
    await shoot(48);
    assert.equal(await page.locator('#l1csEnd').evaluate(e => getComputedStyle(e).opacity), '1', 'title visible');
    assert.equal(await page.locator('#l1csGo').isVisible(), false);
    // Skip lands on the end card; the same tap must not dismiss it.
    await page.evaluate(() => { window.__l1Cutscene.seek(12); window.__l1Cutscene.resume(); });
    await page.locator('#l1csSkip').tap();
    assert.equal(await page.evaluate(() => window.__l1Cutscene.finished() && window.__l1Cutscene.time() === 50 && window.__l1Cutscene.state() === 'ended'), true);
    assert.equal(await page.locator('#l1csSkip').isVisible(), false);
    assert.equal(await page.locator('#l1csTitle').innerText(), '第一关 · 完成');
    assert.equal(await page.locator('#l1csSub').innerText(), '暮色浮岛');
    assert.equal(await page.locator('#l1csGo').innerText(), '轻触继续');
    await page.screenshot({ path: path.join(OUT, 'end.png') });
    assert.equal(await cardHidden(page), true);
    await page.waitForTimeout(700);
    await page.locator('#l1csGo').tap();
    assert.equal(await page.evaluate(() => window.__l1Cutscene.state()), 'closed');
    assert.equal(await cardHidden(page), false, 'the original card follows the cutscene');
    assert.equal(await page.locator('#l1cs').isVisible(), false);
    assert.equal(await page.locator('#l1csPaper').isVisible(), false);
    await page.waitForTimeout(400);
    const back = await page.evaluate(() => window.__l1Cutscene.stage());
    assert(!back.staged && back.toon === 0 && !back.sky && back.gameSky === true, 'island handed back: ' + JSON.stringify(back));
    assert.equal(await page.evaluate(() => window.__bf.butterflies.every(b => b.g.visible)), true, 'gameplay butterflies shown again');
    assert.notEqual(await wild(), w0, 'gameplay butterflies move again');
    assert.equal(await rawSave(page), rawAtClear, 'cutscene changed no save');
    await toLevel2(page);
    assert.equal(await page.evaluate(() => window.__cardShows), 1, 'continuation ran exactly once');
    assert.equal(await page.evaluate(() => JSON.stringify([localStorage.getItem('hg_level2_unlocked'), window.__kittens.state().level, window.__bf.state().ended])), oldAfter, 'same state as the old flow');
    // The camera is the game's again: wheel zoom moves it.
    const dist = () => page.evaluate(() => Math.hypot(...window.__l1Cutscene.stage().camera));
    await page.waitForTimeout(800);
    const d0 = await dist();
    await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: 400, bubbles: true })));
    await page.waitForTimeout(1500);
    const d1 = await dist();
    assert(Math.abs(d1 - d0) > 0.5, 'wheel zoom works after the cutscene: ' + d0.toFixed(2) + ' -> ' + d1.toFixed(2));
    // A reload of the ended save does not replay.
    await page.reload(); await page.locator('#start').click(); await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => window.__l1Cutscene.state()), 'idle');
    await context.close();

    /* ---- C: preview ---- */
    ({ context, page } = await fresh());
    const saves = () => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
    await page.goto(url + '?cutscene=l1&mute=1');
    await page.waitForFunction(() => window.__l1Cutscene.ready() && window.__l1Cutscene.playing() && window.__l1Cutscene.staged());
    const before = await saves();
    assert.equal(await page.evaluate(() => window.__l2Cutscene.state()), 'idle', '?cutscene=l1 does not start the level-2 preview');
    const t0 = await page.evaluate(() => window.__l1Cutscene.time());
    await page.waitForTimeout(1000);
    const dt = (await page.evaluate(() => window.__l1Cutscene.time())) - t0;
    assert(dt > 0.8 && dt < 1.6, 'real-time clock: ' + dt);
    await page.evaluate(() => { window.__l1Cutscene.skip(); window.__l1Cutscene.proceed(true); });
    assert.equal(await page.evaluate(() => window.__l1Cutscene.state()), 'closed');
    assert.equal(await page.locator('#start').isVisible(), true, 'game UI returns');
    assert.equal(await saves(), before, 'preview writes no save');
    await page.goto(url + '?cutscene=l1');
    await page.waitForFunction(() => window.__l1Cutscene.ready());
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__l1Cutscene.playing()), false, 'unmuted preview waits for a gesture');
    await page.touchscreen.tap(195, 760);
    await page.waitForFunction(() => window.__l1Cutscene.playing());
    await page.goto(url + '?cutscene=1&mute=1');
    await page.waitForFunction(() => window.__l2Cutscene.playing());
    assert.equal(await page.evaluate(() => window.__l1Cutscene.state()), 'idle', '?cutscene=1 is still the level-2 preview only');
    await context.close();

    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify({ pass: true, ...report, screenshots: OUT }));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
