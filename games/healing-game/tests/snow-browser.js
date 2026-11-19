'use strict';
// Level 6 「雪灯归林」 gameplay on the built page with REAL touch taps on a 390x844 phone viewport: wrong taps only hint,
// lanterns light in order, kittens walk the lit path home, the save is written, the finale + #snowEnding card show once,
// reload keeps completion, 重看/再走一程 work, reduced motion is instant, and the card title fits one line at 360x780.
// Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/snow-browser.js [outDir]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(process.argv[2] || path.resolve(__dirname, '../../../output/playwright/snow-play'));
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.journey.v1';
const base = snow => ({ 'healingGarden.kittens.v1': { total: 20, ended: true, level: 6 },
  [KEY]: Object.assign({ completed: [1, 2, 3, 4, 5], lamps: [true, true, true], chimes: { round: 3 }, lotus: { light: [3, 3, 3, 3, 3, 3] } }, snow ? { snow } : {}) });

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
  const url = 'http://127.0.0.1:' + server.address().port + '/?level=6&l5cutscene=0';
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const open = async (saves, opts) => {
    opts = opts || {};
    const context = await browser.newContext({ viewport: opts.viewport || { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.addInitScript(saves => {
      if (sessionStorage.getItem('l6')) return; sessionStorage.setItem('l6', '1');
      localStorage.setItem('hg_level2_unlocked', '1');
      for (const k in saves) localStorage.setItem(k, JSON.stringify(saves[k]));
    }, saves);
    await page.goto(url); await page.locator('#start').click(); await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__journey.state().level), 6, 'level 6 opens');
    return { context, page };
  };
  const dbg = page => page.evaluate(() => window.SnowChapter.debug());
  const saved = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  const toast = page => page.evaluate(() => document.getElementById('toast').textContent);
  // Screen point of a lantern (kind 'lantern', i) or a waiting kitten (kind 'kitten', id); asserts it is tappable canvas.
  const point = (page, kind, i) => page.evaluate(([kind, i]) => {
    const W = GardenClip.world, v = new THREE.Vector3();
    const o = kind === 'lantern' ? W.island.getObjectByName('snow-lantern-' + i) : W.island.getObjectByName('snow-kitten-' + i);
    o.getWorldPosition(v); v.y += .25; v.project(W.camera);
    const x = (v.x + 1) * innerWidth / 2, y = (1 - v.y) * innerHeight / 2, el = document.elementFromPoint(x, y);
    return { x, y, tag: el && el.tagName };
  }, [kind, i]);
  const tap = async (page, kind, i) => {
    const p = await point(page, kind, i);
    assert.equal(p.tag, 'CANVAS', kind + ' ' + i + ' is not covered by UI at ' + Math.round(p.x) + ',' + Math.round(p.y));
    assert.ok(p.x > 8 && p.x < 382 && p.y > 60 && p.y < 800, kind + ' ' + i + ' on screen');
    await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(350);
  };
  const walkDone = async page => { for (let i = 0; i < 80; i++) { if (!(await dbg(page)).kittens.some(k => k.walking)) return; await page.waitForTimeout(250); } throw new Error('kitten walk never ended'); };
  try {
    // ---- 1. Full first play by touch.
    let { context, page } = await open(base(null));
    const xp0 = await page.evaluate(() => window.__journey.state().xp);
    let d = await dbg(page);
    assert.equal(d.kittens.length, 4); assert.deepEqual(d.lit, [false, false, false, false, false, false]);
    await page.waitForTimeout(2500); await page.screenshot({ path: path.join(OUT, 'snow-play-start-390x844.png') });
    // Readability: each lantern and kitten marker spans a real size on the phone.
    const sizes = await page.evaluate(() => { const W = GardenClip.world, a = new THREE.Vector3(), b = new THREE.Vector3(); const px = (o, h) => { o.getWorldPosition(a); b.copy(a); b.y += h; a.project(W.camera); b.project(W.camera); return Math.abs(a.y - b.y) * innerHeight / 2; };
      return { lantern: Math.min(...[0, 1, 2, 3, 4, 5].map(i => px(W.island.getObjectByName('snow-lantern-' + i), .4))), kitten: Math.min(...['orange', 'calico', 'black', 'tabby'].map(id => px(W.island.getObjectByName('snow-kitten-' + id), .46))) }; });
    assert.ok(sizes.lantern >= 10 && sizes.kitten >= 10, 'lanterns/kittens readable: ' + JSON.stringify(sizes));
    // Wrong taps: a far lantern and a kitten still in the dark only hint; nothing is lost or written.
    await tap(page, 'lantern', 3); assert.match(await toast(page), /先点亮/);
    await tap(page, 'kitten', 'tabby'); assert.match(await toast(page), /还暗着/);
    assert.deepEqual((await dbg(page)).lit.filter(Boolean).length, 0);
    for (let i = 0; i < 6; i++) {
      await tap(page, 'lantern', i);
      assert.equal((await dbg(page)).lit[i], true, 'lantern ' + i + ' lit by touch');
      if (i === 0) { await tap(page, 'lantern', 0); assert.equal((await saved(page)).snow.lit.length, 1, 'tapping a lit lantern again changes nothing'); }
      if (i === 1) { await tap(page, 'kitten', 'orange'); assert.match(await toast(page), /小橘/); await page.waitForTimeout(1200); await page.screenshot({ path: path.join(OUT, 'snow-play-walk-390x844.png') }); }
      if (i === 2) await tap(page, 'kitten', 'calico');
      if (i === 4) await tap(page, 'kitten', 'black');
    }
    let s = await saved(page);
    assert.deepEqual(s.snow.lit, [0, 1, 2, 3, 4, 5], 'save written through the journey path');
    assert.deepEqual(s.snow.home, ['orange', 'calico', 'black']);
    await walkDone(page);
    await page.screenshot({ path: path.join(OUT, 'snow-play-lit-390x844.png') });
    await tap(page, 'kitten', 'tabby');
    s = await saved(page); assert.ok(s.completed.includes(6), 'J.complete(6) saved at once'); assert.equal(s.snow.home.length, 4);
    await walkDone(page);
    assert.match(await toast(page), /虎斑回到小木屋了/);
    assert.ok((await dbg(page)).finale > 0, 'finale plays'); assert.equal(await page.isVisible('#snowSkip'), true);
    await page.waitForTimeout(3000); await page.screenshot({ path: path.join(OUT, 'snow-finale-390x844.png') });
    await page.waitForSelector('#snowEnding:not([hidden])', { timeout: 9000 });
    assert.match(await page.textContent('#snowEnding'), /CHAPTER 06 · COMPLETE/);
    assert.match(await page.textContent('#snowEndTitle'), /雪灯把小猫们都送回了家/);
    await page.screenshot({ path: path.join(OUT, 'snow-card-390x844.png') });
    const st = await page.evaluate(() => window.__journey.state());
    assert.ok(st.xp >= xp0 + 20 + 50, 'xp: +20 first completion and +5 per lantern/kitten (' + xp0 + ' -> ' + st.xp + ')');
    await page.click('#snowStay'); await page.waitForTimeout(2500);
    assert.equal(await page.isVisible('#snowEnding'), false, 'card shows once and stays closed');
    // 重看雪灯归林 replays the finale (skippable); 再走一程 is practice: progress shown fresh, save untouched.
    await page.click('#snowFinale'); await page.waitForTimeout(400); assert.ok((await dbg(page)).finale > 0);
    await page.click('#snowSkip'); await page.waitForSelector('#snowEnding:not([hidden])', { timeout: 2000 }); await page.click('#snowStay');
    const before = JSON.stringify(await saved(page));
    await page.click('#snowReplay'); await page.waitForTimeout(400);
    d = await dbg(page); assert.equal(d.practice, true); assert.deepEqual(d.lit, [false, false, false, false, false, false]); assert.ok(d.kittens.every(k => k.marker));
    await tap(page, 'lantern', 0); assert.equal((await dbg(page)).lit[0], true);
    await page.waitForTimeout(600); assert.equal(JSON.stringify(await saved(page)), before, 'practice never writes the save');
    // Collection book.
    await page.evaluate(() => window.GardenJourney.open('collection')); await page.waitForTimeout(300);
    assert.match(await page.textContent('#journeyPanel'), /雪灯手记\s*4 \/ 4/);
    await page.evaluate(() => document.querySelector('#journeyPanel [data-jr-close], #journeyPanel .jr-close') && document.querySelector('#journeyPanel [data-jr-close], #journeyPanel .jr-close').click());
    // Reload keeps completion; kittens sit at home; no card pops up again.
    await page.evaluate(() => dispatchEvent(new Event('pagehide')));
    await page.reload(); await page.locator('#start').click(); await page.waitForTimeout(1500);
    d = await dbg(page); assert.equal(d.practice, false); assert.ok(d.lit.every(Boolean)); assert.ok(d.kittens.every(k => !k.marker && Math.hypot(k.x - k.home[0], k.z - k.home[1]) < .01));
    assert.ok((await page.evaluate(() => window.__journey.state())).progress.completed.includes(6));
    assert.equal(await page.isVisible('#snowEnding'), false);
    await page.screenshot({ path: path.join(OUT, 'snow-home-390x844.png') });
    await context.close();

    // ---- 2. Reduced motion: the last kitten goes home at once and the card shows without a finale.
    ({ context, page } = await open(base({ lit: [0, 1, 2, 3, 4, 5], home: ['orange', 'calico', 'black'] }), { reduced: true }));
    await tap(page, 'kitten', 'tabby');
    assert.equal(await page.isVisible('#snowEnding'), true, 'reduced motion: card at once');
    assert.equal((await dbg(page)).finale, 0);
    await context.close();

    // ---- 3. 360x780: card title and HUD/dock prompt fit on one line.
    ({ context, page } = await open(base({ lit: [0, 1, 2, 3, 4, 5], home: ['orange', 'calico', 'black'] }), { viewport: { width: 360, height: 780 }, reduced: true }));
    const prompt = await page.evaluate(() => { const e = document.getElementById('snowPrompt'); return { h: e.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(e).lineHeight) }; });
    assert.ok(prompt.h < prompt.lh * 1.5, 'dock prompt one line at 360px');
    await tap(page, 'kitten', 'tabby');
    const card = await page.evaluate(() => ['snowEndTitle'].concat([...document.querySelectorAll('#snowEnding .jr-eyebrow, #snowEnding button')].map((e, i) => (e.id = e.id || 'snowCardPart' + i))).map(id => { const e = document.getElementById(id), r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { id, h: r.height, lh: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3, right: r.right, sw: e.scrollWidth, cw: e.clientWidth }; }));
    for (const c of card) { assert.ok(c.h < c.lh * 1.6 + 24, c.id + ' one line at 360px: ' + JSON.stringify(c)); assert.ok(c.right <= 360 && c.sw <= c.cw + 1, c.id + ' fits 360px'); }
    await page.screenshot({ path: path.join(OUT, 'snow-card-360x780.png') });
    await context.close();
    assert.deepEqual(errors, [], 'no page errors');
    console.log('snow-browser: PASS');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
