'use strict';

// Level-5 (final chapter) clear cutscene on the built page (390x844 phone). Synthetic saves only (晓信莲 one note from done).
//  A. ?l5cutscene=0 reference: last note -> old 7 s 归航演出 (#lotusSkip) -> #lotusEnding, no cutscene.
//  B. real clear: last note -> save written -> film INSTEAD of the 7 s 演出 (no #lotusSkip, gameplay lotus group hidden,
//     no input) -> skip -> guarded tap -> #lotusEnding exactly once, same save as A; wheel zoom works after close;
//     「重看月汐归航」 replays the film (not the old 演出) and its card opens once more, no XP twice.
//  B2. the film watched to its natural end -> 轻触继续 -> #lotusEnding exactly once.
//  R. prefers-reduced-motion: the card opens at once, no film, #lotusSkip hidden.
//  C. ?cutscene=l5&mute=1 preview: plays at once, seekable, captions fit one line at 360x780, dew/fireflies/lanterns keep
//     off the moon, no save writes. The L1/L2/L3/L4 preview gates still start their own film only.
// Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l5-cutscene-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(__dirname, '../../../output/playwright/l5-cutscene');
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.journey.v1';
const SAVES = {
  'healingGarden.kittens.v1': { total: 20, ended: true, level: 5 },
  [KEY]: { completed: [1, 2, 3, 4], lamps: [true, true, true], chimes: { round: 3 }, lotus: { light: [3, 3, 3, 3, 3, 2] } }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  for (const id of ['l1', 'l3', 'l4', 'l5']) assert.equal(html.split("if (query('cutscene') !== '" + id + "') return;").length, 2, 'exactly one ' + id + ' preview gate in the build');
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
  const fresh = async (viewport, extra) => {
    const context = await browser.newContext(Object.assign({ viewport: viewport || { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, extra || {}));
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) report.errors.push('console: ' + m.text()); });
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.addInitScript(saves => {
      if (sessionStorage.getItem('l5cs')) return;
      sessionStorage.setItem('l5cs', '1');
      localStorage.setItem('hg_level2_unlocked', '1');
      for (const k in saves) localStorage.setItem(k, JSON.stringify(saves[k]));
    }, SAVES);
    return { context, page };
  };
  // The real clear: start on level 5, then the last note of 晓信莲. Counts every time the card opens.
  const clear = async page => {
    await page.locator('#start').click(); await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__journey.state().level), 5);
    assert.deepEqual(await page.evaluate(() => window.__journey.state().progress.lotus.light), [3, 3, 3, 3, 3, 2], 'fixture: one note from the clear');
    await page.evaluate(() => { window.__cardOpens = 0; const end = document.getElementById('lotusEnding'); let was = end.hidden;
      new MutationObserver(() => { if (was && !end.hidden) window.__cardOpens++; was = end.hidden; }).observe(end, { attributes: true, attributeFilter: ['hidden'] }); });
    await page.locator('#lotusNote1').click();
  };
  const cardShown = page => page.evaluate(() => !document.getElementById('lotusEnding').hidden);
  const opens = page => page.evaluate(() => new Promise(r => setTimeout(() => r(window.__cardOpens), 50)));
  const progress = page => page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return JSON.stringify({ lotus: d.lotus, completed: d.completed }); }, KEY);
  const csState = page => page.evaluate(() => window.__l5Cutscene.state());
  try {
    /* ---- A: the old behaviour is the reference ---- */
    let { context, page } = await fresh();
    await page.goto(url + '?l5cutscene=0');
    assert.equal(await page.evaluate(() => window.__l5Cutscene.enabled()), false);
    await clear(page);
    const savedA = await progress(page), xpA = await page.evaluate(() => __journey.state().xp);
    assert(JSON.parse(savedA).completed.includes(5) && JSON.parse(savedA).lotus.light.every(x => x === 3), 'completion saved before the finale');
    assert.equal(await page.locator('#lotusSkip').isVisible(), true, '?l5cutscene=0: the old 7 s 归航演出 runs');
    assert.equal(await cardShown(page), false);
    await page.locator('#lotusSkip').click();
    assert.equal(await cardShown(page), true); assert.equal(await csState(page), 'idle'); assert.equal(await opens(page), 1);
    await context.close();

    /* ---- B: the cutscene replaces the 7 s 演出 ---- */
    ({ context, page } = await fresh());
    await page.goto(url);
    assert.equal(await page.evaluate(() => window.__l5Cutscene.enabled() && window.__l5Cutscene.ready()), true);
    await clear(page);
    assert.equal(await csState(page), 'playing', 'the film starts on the clearing note');
    assert.equal(await progress(page), savedA, 'same save as the old path, written before the film');
    assert.equal(await page.evaluate(() => __journey.state().xp), xpA, 'same reward as the old path');
    await page.waitForFunction(() => window.__l5Cutscene.staged(), null, { timeout: 8000 });
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => document.getElementById('lotusSkip').hidden), true, 'the old 7 s 演出 does not also run');
    assert.equal(await cardShown(page), false, 'no card under the film'); assert.equal(await opens(page), 0);
    const stage = await page.evaluate(() => window.__l5Cutscene.stage());
    assert(stage.staged && stage.sky && stage.water && stage.lotuses === 6 && stage.dew === 24 && stage.flies > 10 && stage.lanterns === 6 && stage.blades > 1000 && stage.toon > 10 && stage.hidden > 3, 'stage is up: ' + JSON.stringify(stage));
    assert.equal(await page.evaluate(() => window.__l5Hide.length === 1 && window.__l5Hide.every(g => !g.visible)), true, 'gameplay lotus group is off the set');
    assert.equal(await page.evaluate(() => window.GardenJourney.blocked() && window.__l5Cutscene.busy()), true, 'the film counts as an open dialog');
    assert.equal(await page.evaluate(() => ['lotusHud', 'lotusDock', 'topbar'].every(id => !document.getElementById(id) || getComputedStyle(document.getElementById(id)).visibility === 'hidden')), true, 'lotus HUD and dock are out of the frame');
    assert.equal(await page.evaluate(() => { const a = __journey.state().progress.lotus.light.join(); document.getElementById('lotusKey0').click(); document.getElementById('lotusFinale').click(); return a === __journey.state().progress.lotus.light.join() && __l5Cutscene.time() > 1; }), true, 'lotus keys and replay inert under the film');
    await page.touchscreen.tap(195, 500); await page.waitForTimeout(200);
    assert.equal(await csState(page), 'playing', 'a tap mid-film does not continue');
    await page.screenshot({ path: path.join(OUT, 'ingame-film.png') });
    // Skip, then the guarded continue.
    // Skip and the follow-up tap in one page call, so slow software-GL frames cannot stretch the gap past the guard.
    const guard = await page.evaluate(() => { document.getElementById('l5csSkip').click(); const s1 = __l5Cutscene.state(); document.getElementById('l5csGo').click(); return [s1, __l5Cutscene.state()]; });
    assert.equal(guard[0], 'ended'); assert.equal(await page.locator('#l5csGo').isVisible(), true);
    assert.equal(guard[1], 'ended', 'the tap that skipped cannot also continue');
    await page.waitForTimeout(700); await page.locator('#l5csGo').click();
    assert.equal(await csState(page), 'closed'); assert.equal(await cardShown(page), true); assert.equal(await opens(page), 1, '#lotusEnding exactly once');
    assert.equal(await page.evaluate(() => window.__l5Hide.every(g => g.visible) && !document.body.classList.contains('l5cs-on')), true, 'gameplay lotus group restored');
    assert.equal(await page.locator('#lotusSkip').isHidden(), true);
    // 留下来 closes the card; the wheel zoom still works.
    await page.locator('#lotusStay').click(); await page.waitForTimeout(300);
    const z0 = await page.evaluate(() => GardenClip.world.camera.position.distanceTo(GardenClip.world.camera.position.clone().set(0, 0, 0)));
    await page.mouse.move(195, 420); for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(120); }
    await page.waitForTimeout(500);
    const z1 = await page.evaluate(() => GardenClip.world.camera.position.distanceTo(GardenClip.world.camera.position.clone().set(0, 0, 0)));
    assert(Math.abs(z1 - z0) > 0.05, 'wheel zoom still works after the film: ' + z0 + ' -> ' + z1);
    // 「重看月汐归航」 replays the film, not the old 7 s 演出; its card opens once more and nothing is awarded twice.
    await page.locator('#lotusFinale').click();
    assert.equal(await csState(page), 'playing', 'replay plays the film');
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.getElementById('lotusSkip').hidden), true, 'replay does not run the old 演出');
    await page.locator('#l5csSkip').click(); await page.waitForTimeout(700); await page.locator('#l5csGo').click();
    assert.equal(await opens(page), 2); assert.equal(await page.evaluate(() => __journey.state().xp), xpA, 'replay cannot award twice');
    await page.locator('#lotusStay').click();
    await context.close();

    /* ---- B2: watched to the end ---- */
    ({ context, page } = await fresh());
    await page.goto(url);
    await clear(page);
    await page.waitForFunction(() => window.__l5Cutscene.staged(), null, { timeout: 8000 });
    await page.evaluate(() => window.__l5Cutscene.seek(48.5));
    await page.waitForFunction(() => window.__l5Cutscene.state() === 'ended', null, { timeout: 8000 });
    await page.waitForTimeout(700);
    await page.locator('#l5csGo').click();
    assert.equal(await cardShown(page), true); assert.equal(await opens(page), 1, 'natural end: #lotusEnding exactly once');
    await context.close();

    /* ---- R: reduced motion keeps the immediate card ---- */
    ({ context, page } = await fresh(null, { reducedMotion: 'reduce' }));
    await page.goto(url);
    await clear(page);
    assert.equal(await cardShown(page), true, 'reduced motion: card at once');
    assert.equal(await csState(page), 'idle'); assert.equal(await page.locator('#lotusSkip').isHidden(), true);
    await context.close();

    /* ---- C: preview, frames, captions at 360x780, moon kept clear ---- */
    ({ context, page } = await fresh({ width: 360, height: 780 }));
    await page.goto(url + '?cutscene=l5&mute=1'); await page.waitForTimeout(2500);
    assert.equal(await csState(page), 'playing', 'preview gate plays at once');
    const before = await page.evaluate(k => localStorage.getItem(k), KEY);
    for (const t of [5, 15, 26, 37, 47]) {
      await page.evaluate(t => { __l5Cutscene.seek(t); __l5Cutscene.pause(); }, t); await page.waitForTimeout(400);
      const fit = await page.evaluate(() => { const c = document.getElementById('l5csCaption'); return { sw: c.scrollWidth, cw: c.clientWidth, h: c.getBoundingClientRect().height }; });
      assert(fit.sw <= fit.cw && fit.h < 60, 'caption on one line at 360px (t=' + t + '): ' + JSON.stringify(fit));
      const pr = await page.evaluate(() => __l5Cutscene.probe());
      assert(pr.moonClear > pr.moonDisc, 'nothing crosses the moon at ' + t + ': ' + pr.moonClear);
      await page.screenshot({ path: path.join(OUT, 'preview-' + t + '.png') });
    }
    // Determinism: the same second twice gives the same staged frame.
    const p1 = await page.evaluate(() => { __l5Cutscene.seek(33); return JSON.stringify(__l5Cutscene.frame(33)); });
    await page.evaluate(() => __l5Cutscene.seek(12));
    const p2 = await page.evaluate(() => { __l5Cutscene.seek(33); return JSON.stringify(__l5Cutscene.frame(33)); });
    assert.equal(p1, p2);
    assert.equal(await page.evaluate(k => localStorage.getItem(k), KEY), before, 'the preview writes no save');
    await context.close();
    // The other preview gates still start their own film only.
    for (const id of ['l1', 'l2', 'l3', 'l4']) {
      ({ context, page } = await fresh());
      await page.goto(url + '?cutscene=' + (id === 'l2' ? '1' : id) + '&mute=1'); await page.waitForTimeout(2000);
      const s = await page.evaluate(id => ({ own: window['__' + id + 'Cutscene'].state(), l5: window.__l5Cutscene.state() }), id);
      assert(s.own === 'playing' && s.l5 === 'idle', id + ' preview: ' + JSON.stringify(s));
      await context.close();
    }
    assert.deepEqual(report.errors, [], 'no console errors');
    console.log('l5-cutscene browser: ok');
  } finally {
    await browser.close(); server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
