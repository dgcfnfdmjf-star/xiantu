'use strict';

// Level-6 clear cutscene 「雪灯归林」 on the built page (390x844 phone). Synthetic saves only (one kitten from done).
//  A. ?l6cutscene=0: last kitten home -> old 7 s finale (#snowSkip) -> #snowEnding once.
//  B. real clear: save written first -> film INSTEAD of the 7 s finale, on the same island (snow set staged, gameplay
//     kittens/lanterns hidden, no input) -> skip -> guarded tap -> #snowEnding exactly once, same save; zoom works after;
//     「重看雪灯归林」 plays the film again, card once more, no XP twice.
//  R. reduced motion: card at once, no film.
//  C. ?cutscene=l6&mute=1 preview at 360x780: plays at once, seekable/deterministic, captions one line, no save writes,
//     and the island is given back exactly on close.
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l6-cutscene-browser.cjs [shots dir]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(process.argv[2] || path.resolve(__dirname, '../../../output/playwright/l6-cutscene'));
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.journey.v1';
const SAVES = {
  'healingGarden.kittens.v1': { total: 20, ended: true, level: 6 },
  [KEY]: { completed: [1, 2, 3, 4, 5], lamps: [true, true, true], chimes: { round: 3 }, lotus: { light: [3, 3, 3, 3, 3, 3] }, snow: { lit: [0, 1, 2, 3, 4, 5], home: ['orange', 'calico', 'black'] } }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  assert.equal(html.split("if (query('cutscene') !== 'l6') return;").length, 2, 'exactly one l6 preview gate');
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
  const errors = [];
  const fresh = async (viewport, extra) => {
    const context = await browser.newContext(Object.assign({ viewport: viewport || { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, extra || {}));
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.addInitScript(saves => {
      if (sessionStorage.getItem('l6cs')) return;
      sessionStorage.setItem('l6cs', '1');
      localStorage.setItem('hg_level2_unlocked', '1');
      for (const k in saves) localStorage.setItem(k, JSON.stringify(saves[k]));
    }, SAVES);
    return { context, page };
  };
  // The real clear: level 6, the last kitten (虎斑) tapped by touch, its walk home; counts every time the card opens.
  const clear = async page => {
    await page.locator('#start').click(); await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__journey.state().level), 6);
    await page.evaluate(() => { window.__cardOpens = 0; const end = document.getElementById('snowEnding'); let was = end.hidden;
      new MutationObserver(() => { if (was && !end.hidden) window.__cardOpens++; was = end.hidden; }).observe(end, { attributes: true, attributeFilter: ['hidden'] }); });
    const p = await page.evaluate(() => { const W = GardenClip.world, v = new THREE.Vector3(); W.island.getObjectByName('snow-kitten-tabby').getWorldPosition(v); v.y += .25; v.project(W.camera);
      return { x: (v.x + 1) * innerWidth / 2, y: (1 - v.y) * innerHeight / 2 }; });
    await page.touchscreen.tap(p.x, p.y);
    await page.waitForFunction(() => !window.SnowChapter.debug().kittens.some(k => k.walking), null, { timeout: 30000 });
    await page.waitForTimeout(300);
  };
  const cardShown = page => page.evaluate(() => !document.getElementById('snowEnding').hidden);
  const opens = page => page.evaluate(() => new Promise(r => setTimeout(() => r(window.__cardOpens), 50)));
  const progress = page => page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return JSON.stringify({ snow: d.snow, completed: d.completed }); }, KEY);
  const csState = page => page.evaluate(() => window.__l6Cutscene.state());
  try {
    /* ---- A: the old behaviour is the reference ---- */
    let { context, page } = await fresh();
    await page.goto(url + '?l6cutscene=0');
    assert.equal(await page.evaluate(() => window.__l6Cutscene.enabled()), false);
    await clear(page);
    const savedA = await progress(page), xpA = await page.evaluate(() => __journey.state().xp);
    assert(JSON.parse(savedA).completed.includes(6) && JSON.parse(savedA).snow.home.length === 4, 'completion saved');
    assert.equal(await page.locator('#snowSkip').isVisible(), true, '?l6cutscene=0: the old 7 s finale runs');
    await page.locator('#snowSkip').click();
    assert.equal(await cardShown(page), true); assert.equal(await csState(page), 'idle'); assert.equal(await opens(page), 1);
    await context.close();

    /* ---- B: the film replaces the 7 s finale ---- */
    ({ context, page } = await fresh());
    await page.goto(url);
    assert.equal(await page.evaluate(() => window.__l6Cutscene.enabled() && window.__l6Cutscene.ready()), true);
    await clear(page);
    assert.equal(await csState(page), 'playing', 'the film starts when the last kitten is home');
    assert.equal(await progress(page), savedA, 'same save as the old path, written before the film');
    assert.equal(await page.evaluate(() => __journey.state().xp), xpA);
    await page.waitForFunction(() => window.__l6Cutscene.staged(), null, { timeout: 8000 });
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => document.getElementById('snowSkip').hidden), true, 'the old finale does not also run');
    assert.equal(await cardShown(page), false); assert.equal(await opens(page), 0);
    const stage = await page.evaluate(() => window.__l6Cutscene.stage());
    assert(stage.staged && stage.sky && stage.set && stage.lanterns === 6 && stage.snow > 300 && stage.toon > 10, 'stage is up: ' + JSON.stringify(stage));
    const onIsland = await page.evaluate(() => { const W = GardenClip.world, g = W.island.getObjectByName('l6cs-stage'), s = W.island.getObjectByName('snow-lantern-night');
      return { stage: !!g && g.parent === W.island && g.visible, set: !!s && s.parent === W.island && s.visible, kittens: ['orange', 'calico', 'black', 'tabby'].every(id => !W.island.getObjectByName('snow-kitten-' + id).visible),
        lanterns: [0, 1, 2, 3, 4, 5].every(i => !W.island.getObjectByName('snow-lantern-' + i).visible) }; });
    assert.deepEqual(onIsland, { stage: true, set: true, kittens: true, lanterns: true }, 'the film is staged on the shared island');
    assert.equal(await page.evaluate(() => window.GardenJourney.blocked() && window.__l6Cutscene.busy()), true, 'the film counts as an open dialog');
    assert.equal(await page.evaluate(() => ['snowHud', 'snowDock', 'topbar'].every(id => !document.getElementById(id) || getComputedStyle(document.getElementById(id)).visibility === 'hidden')), true, 'HUD/dock out of frame');
    await page.touchscreen.tap(195, 500); await page.waitForTimeout(200);
    assert.equal(await csState(page), 'playing', 'a tap mid-film does not continue');
    await page.screenshot({ path: path.join(OUT, 'l6-ingame-film.png') });
    const guard = await page.evaluate(() => { document.getElementById('l6csSkip').click(); const s1 = __l6Cutscene.state(); document.getElementById('l6csGo').click(); return [s1, __l6Cutscene.state()]; });
    assert.deepEqual(guard, ['ended', 'ended'], 'the tap that skipped cannot also continue');
    await page.screenshot({ path: path.join(OUT, 'l6-ingame-end.png') });
    await page.waitForTimeout(700); await page.locator('#l6csGo').click();
    assert.equal(await csState(page), 'closed'); assert.equal(await cardShown(page), true); assert.equal(await opens(page), 1, '#snowEnding exactly once');
    const back = await page.evaluate(() => { const W = GardenClip.world, g = W.island.getObjectByName('l6cs-stage'), d = SnowChapter.debug();
      return { stage: g.visible, set: d.visible, active: d.active, body: document.body.classList.contains('l6cs-on'), kittens: ['orange', 'calico', 'black', 'tabby'].every(id => W.island.getObjectByName('snow-kitten-' + id).visible) }; });
    assert.deepEqual(back, { stage: false, set: true, active: true, body: false, kittens: true }, 'the level-6 island is given back');
    await page.screenshot({ path: path.join(OUT, 'l6-card.png') });
    await page.locator('#snowStay').click(); await page.waitForTimeout(300);
    const dist = () => page.evaluate(() => GardenClip.world.camera.position.length());
    const z0 = await dist();
    await page.mouse.move(195, 420); for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(120); }
    await page.waitForTimeout(500);
    const z1 = await dist();
    assert(Math.abs(z1 - z0) > 0.05, 'wheel zoom works after the film: ' + z0 + ' -> ' + z1);
    // 「重看雪灯归林」 replays the film; card once more; nothing awarded twice.
    await page.locator('#snowFinale').click();
    assert.equal(await csState(page), 'playing', 'replay plays the film');
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.getElementById('snowSkip').hidden), true, 'replay does not run the old finale');
    await page.locator('#l6csSkip').click(); await page.waitForTimeout(700); await page.locator('#l6csGo').click();
    assert.equal(await opens(page), 2); assert.equal(await page.evaluate(() => __journey.state().xp), xpA, 'replay cannot award twice');
    await page.locator('#snowStay').click();
    await context.close();

    /* ---- R: reduced motion keeps the immediate card ---- */
    ({ context, page } = await fresh(null, { reducedMotion: 'reduce' }));
    await page.goto(url);
    await clear(page);
    assert.equal(await cardShown(page), true, 'reduced motion: card at once');
    assert.equal(await csState(page), 'idle');
    await context.close();

    /* ---- C: preview on another level, frames, captions at 360x780, no saves, island restored ---- */
    ({ context, page } = await fresh({ width: 360, height: 780 }));
    await page.goto(url + '?cutscene=l6&mute=1'); await page.waitForTimeout(2500);
    assert.equal(await csState(page), 'playing', 'preview gate plays at once');
    const before = await page.evaluate(k => localStorage.getItem(k), KEY);
    for (const t of [4, 11.4, 15, 26, 27.5, 31, 37, 41, 48]) {
      await page.evaluate(t => { __l6Cutscene.seek(t); __l6Cutscene.pause(); }, t); await page.waitForTimeout(500);
      const fit = await page.evaluate(() => { const c = document.getElementById('l6csCaption'); return { sw: c.scrollWidth, cw: c.clientWidth, h: c.getBoundingClientRect().height, text: c.textContent }; });
      assert(fit.sw <= fit.cw && fit.h < 60, 'caption on one line at 360px (t=' + t + '): ' + JSON.stringify(fit));
      await page.screenshot({ path: path.join(OUT, 'l6-preview-360-' + t + '.png') });
    }
    // Item 4 actors: readable subjects at 390x844-class frames, glows visible, particles clear of the moon, modest draws.
    await page.waitForFunction(() => __l6Cutscene.probe() && __l6Cutscene.probe().kittens.every(k => k.model), null, { timeout: 15000 });
    const W = 360, Hh = 780, onScreen = b => b.cx > 0 && b.cx < W && b.cy > Hh * 0.07 && b.cy < Hh * 0.93;
    const look = async t => { await page.evaluate(t => { __l6Cutscene.seek(t); __l6Cutscene.pause(); }, t); await page.waitForTimeout(400);
      return page.evaluate(() => Object.assign(__l6Cutscene.actors(), { probe: __l6Cutscene.probe() })); };
    let a = await look(12.35);
    assert(a.lanterns[0].halo > 0.5 && a.lanterns[1].halo > a.lanterns[2].halo && a.lanterns[5].halo < 0.2, 'lanterns light one by one: ' + a.lanterns.map(l => l.halo));
    assert(a.probe.sparks.some(v => v > 0.2), 'ignition sparks at 12.35 s');
    a = await look(27.5);
    for (const k of a.kittens) assert(onScreen(k) && k.h >= 22, 'kitten readable in the cabin beat: ' + JSON.stringify(k));
    assert(a.probe.kittens.some(k => k.walk >= 0), 'a kitten is mid-walk with the Walk clip');
    assert(a.window && onScreen(a.window) && a.probe.window > 0.8, 'warm window: ' + JSON.stringify(a.window) + ' ' + a.probe.window);
    assert(a.probe.smoke.some(v => v > 0.3), 'chimney smoke');
    a = await look(31);
    assert(a.probe.kittens.every(k => k.walk === -1), 'all home and curled by 31 s');
    const homes = a.probe.kittens;
    for (const t of [41, 47]) {
      a = await look(t);
      for (const l of a.lanterns) assert(onScreen(l) && l.halo > 0.6, 'lantern glow visible in the wide shot at ' + t + ': ' + JSON.stringify(l));
      assert(onScreen(a.window) && a.window.w >= 12, 'window glow readable wide');
      for (const k of a.kittens) assert(onScreen(k) && k.h >= 4, 'kittens in frame by the window at ' + t);
      assert(a.calls > 0 && a.calls < 220, 'modest draw calls: ' + a.calls);
      assert.deepEqual(a.probe.kittens.map(k => [k.x, k.z]), homes.map(k => [k.x, k.z]), 'kittens stay curled up');
    }
    for (const t of [5, 15, 27.5, 36, 44, 49]) { a = await look(t); assert(a.probe.moonGap >= 0, 'no sprite particle crosses the moon at ' + t + ': ' + a.probe.moonGap); }
    // Seek reproducibility of the actors: 27.5 s after a detour equals 27.5 s before.
    const r1 = JSON.stringify((await look(27.5)).probe.kittens); await look(44); await look(3);
    assert.equal(JSON.stringify((await look(27.5)).probe.kittens), r1, 'kittens reproduced by seek');
    await page.screenshot({ path: path.join(OUT, 'l6-actors-360-27.5.png') });
    const t1 = await page.evaluate(() => { const e = document.getElementById('l6csTitle'); return [e.scrollWidth, e.clientWidth, e.getBoundingClientRect().height]; });
    assert(t1[0] <= t1[1] && t1[2] < 60, 'title on one line at 360px: ' + t1);
    // Determinism: the same second twice gives the same staged frame (camera, lanterns, snow clock).
    await page.evaluate(() => { __l6Cutscene.seek(33); }); await page.waitForTimeout(300);
    const p1 = await page.evaluate(() => JSON.stringify(__l6Cutscene.probe()));
    await page.evaluate(() => __l6Cutscene.seek(12)); await page.waitForTimeout(300);
    await page.evaluate(() => __l6Cutscene.seek(33)); await page.waitForTimeout(300);
    const p2 = await page.evaluate(() => JSON.stringify(__l6Cutscene.probe()));
    // Camera within the island's own gentle live bob/tilt (game clock); everything the film draws is exact.
    const q1 = JSON.parse(p1), q2 = JSON.parse(p2);
    assert(q1.camera.every((v, i) => Math.abs(v - q2.camera[i]) < 0.2), 'camera reproduced: ' + p1 + ' / ' + p2);
    delete q1.camera; delete q2.camera; delete q1.moonGap; delete q2.moonGap; assert.deepEqual(q1, q2, 'seek reproduces the frame');
    // The preview runs on whatever level the save opened; on close the snow set and tint are put away again.
    const lvl = await page.evaluate(() => __journey.state().level);
    await page.evaluate(() => { __l6Cutscene.skip(); __l6Cutscene.proceed(true); }); await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({ cs: __l6Cutscene.state(), set: SnowChapter.debug().visible, tinted: SnowChapter.debug().tinted, active: SnowChapter.debug().active }));
    if (lvl !== 6) assert.deepEqual(after, { cs: 'closed', set: false, tinted: 0, active: false }, 'snow set removed after a preview on level ' + lvl);
    assert.equal(await page.evaluate(k => localStorage.getItem(k), KEY), before, 'the preview writes no save');
    await context.close();
    // Other preview gates start their own film only.
    for (const id of ['l4', 'l5']) {
      ({ context, page } = await fresh());
      await page.goto(url + '?cutscene=' + id + '&mute=1'); await page.waitForTimeout(2000);
      const s = await page.evaluate(id => ({ own: window['__' + id + 'Cutscene'].state(), l6: window.__l6Cutscene.state() }), id);
      assert(s.own === 'playing' && s.l6 === 'idle', id + ' preview: ' + JSON.stringify(s));
      await context.close();
    }
    assert.deepEqual(errors, [], 'no console errors');
    console.log('l6-cutscene browser: ok');
  } finally {
    await browser.close(); server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
