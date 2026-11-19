'use strict';
// Level 6 「雪灯归林」 on the built page: unlock only after level 5, the snowy night on the SAME shared island,
// exact restore when leaving (5 -> 6 -> 1 -> 6 -> 1 -> 5), clipping-safe placement, no console errors, phone screenshots.
// Test-only unlock: synthetic localStorage saves seeded below (no URL switch can unlock level 6; ?level=6 only works once
// level 5 is complete). Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/snow-chapter-browser.cjs [outDir]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(process.argv[2] || path.resolve(__dirname, '../../../output/playwright/snow-chapter'));
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.journey.v1';
const LOCKED = { 'healingGarden.kittens.v1': { total: 20, ended: true, level: 5 },
  [KEY]: { completed: [1, 2, 3, 4], lamps: [true, true, true], chimes: { round: 3 }, lotus: { light: [3, 3, 3, 3, 3, 2] } } };
const OPEN = { 'healingGarden.kittens.v1': { total: 20, ended: true, level: 5 },
  [KEY]: { completed: [1, 2, 3, 4], lamps: [true, true, true], chimes: { round: 3 }, lotus: { light: [3, 3, 3, 3, 3, 3] }, snow: { lit: [9, 'x'], home: 'garbage' } } };

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
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const fresh = async (saves, viewport) => {
    const context = await browser.newContext({ viewport: viewport || { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.addInitScript(saves => {
      if (sessionStorage.getItem('l6')) return; sessionStorage.setItem('l6', '1');
      localStorage.setItem('hg_level2_unlocked', '1');
      for (const k in saves) localStorage.setItem(k, JSON.stringify(saves[k]));
    }, saves);
    return { context, page };
  };
  const level = page => page.evaluate(() => window.__journey.state().level);
  // Every pre-existing scene object: material colours, visibility, transform; plus light colours and camera.
  const snap = page => page.evaluate(() => {
    const W = GardenClip.world, out = {};
    W.scene.traverse(o => {
      if (window.__preL6 && !window.__preL6.has(o.uuid)) return;
      const ms = o.material ? [].concat(o.material) : [];
      // Positions, scales and opacities animate every frame (bobbing island, fades, fireflies); colours and visibility do not.
      out[o.uuid] = [o.visible, ms.map(m => (m.color ? m.color.getHex() : '') + '/' + (m.emissive ? m.emissive.getHex() : '') + '/' + m.side + '/' + m.transparent).join(),
        o.isLight ? o.color.getHex() + '/' + (o.groundColor ? o.groundColor.getHex() : '') : ''].join('|');
    });
    // Static island landmarks must not have moved either.
    W.island.children.forEach(o => { if (out[o.uuid] && o.isMesh) out[o.uuid] += '|' + o.position.toArray().map(v => +v.toFixed(4)).join(); });
    out.__zoom = W.camera.zoom; out.__view = !!W.camera.view && W.camera.view.enabled;
    return out;
  });
  const diff = (a, b) => Object.keys(a).filter(k => a[k] !== b[k]).map(k => k + ': ' + a[k] + ' -> ' + b[k]);
  try {
    /* ---- locked: level 5 not complete ---- */
    let { context, page } = await fresh(LOCKED);
    await page.goto(url + '?level=6&l5cutscene=0');
    await page.locator('#start').click(); await page.waitForTimeout(800);
    assert.notEqual(await level(page), 6, '?level=6 ignored while level 5 is incomplete (falls back like ?level=5 does)');
    await page.evaluate(() => window.__kittens.setLevel(6));
    assert.notEqual(await level(page), 6, 'setLevel(6) refused while locked');
    await page.evaluate(() => window.GardenJourney.open('journey'));
    assert.equal(await page.locator('[data-jr-go="6"]').isDisabled(), true, 'journal button disabled while locked');
    const row = await page.locator('.jr-row').nth(5).innerText();
    assert.match(row, /06 · 雪灯归林/); assert.match(row, /0 \/ 6 盏雪灯 · 0 \/ 4 只小猫/);
    assert.equal(await page.evaluate(() => window.SnowChapter.debug().built), false, 'nothing built before level 6 is visited');
    await context.close();

    /* ---- open: level 5 complete; garbage level-6 field normalises ---- */
    ({ context, page } = await fresh(OPEN));
    await page.goto(url + '?l5cutscene=0');
    await page.locator('#start').click(); await page.waitForTimeout(1200);
    assert.equal(await level(page), 5);
    const st = await page.evaluate(() => window.__journey.state());
    assert.deepEqual(st.progress.snow, { version: 1, lit: [], home: [] }, 'garbage snow field normalised');
    assert.ok(st.progress.completed.includes(5) && !st.progress.completed.includes(6));
    await page.evaluate(() => { window.__preL6 = new Set(); GardenClip.world.scene.traverse(o => window.__preL6.add(o.uuid)); });
    const a5 = await snap(page);
    await page.evaluate(() => window.GardenJourney.open('journey'));
    await page.locator('[data-jr-go="6"]').click(); await page.waitForTimeout(1500);
    assert.equal(await level(page), 6, 'journal enters level 6');
    const d = await page.evaluate(() => { const D = window.SnowChapter.debug(), C = GardenClip.world; return Object.assign(D, {
      parentIsIsland: C.island.children.some(o => o.name === 'snow-lantern-night'), island: C.island.visible, theme: window.__music2.theme[6],
      registered: window.__music2.tracks.some(t => t.id === 'snowlantern'), modes: getComputedStyle(document.getElementById('modes')).display,
      hud: document.getElementById('snowHud').hidden, hudText: document.getElementById('snowHud').textContent, body: document.body.getAttribute('data-garden-level') }); });
    assert.ok(d.active && d.visible && d.parentIsIsland && d.island, 'snow group shown, parented to the shared island');
    assert.ok(d.tinted >= 6, 'island materials tinted: ' + d.tinted);
    assert.equal(d.theme, 'snowlantern'); assert.ok(d.registered, 'BGM registered');
    assert.equal(d.modes, 'none'); assert.equal(d.hud, false); assert.equal(d.body, '6');
    assert.ok(d.lanterns.length >= 5 && d.lanterns.length <= 7);
    assert.ok(d.snow > 100 && d.snow <= 700, 'one modest snow points system');
    // Placement: clear of the existing props (clipping.js footprints), the pond, the cabin and each other; on the island.
    const clip = await page.evaluate(d => {
      const C = GardenClip, P = { x: 2.3, z: -1.3 }, bad = [];
      const pts = d.lanterns.map((l, i) => ({ n: 'lantern' + i, x: l.x, z: l.z, r: .28 })).concat(d.pines.map((p, i) => ({ n: 'pine' + i, x: p.x, z: p.z, r: p.r * .8 })), [{ n: 'cabin', x: d.cabin.x, z: d.cabin.z, r: .8 }]);
      pts.forEach(p => {
        if (Math.hypot(p.x, p.z) + p.r > 4.95) bad.push(p.n + ' off island');
        if (Math.hypot(p.x - P.x, p.z - P.z) < 1.15 + p.r) bad.push(p.n + ' in pond');
        if (!C.groundClear(p.x, p.z, p.r * .5)) bad.push(p.n + ' clips a prop');
        pts.forEach(q => { if (q !== p && Math.hypot(p.x - q.x, p.z - q.z) < (p.r + q.r) * .9) bad.push(p.n + ' x ' + q.n); });
      });
      d.path.forEach((q, i) => { if (Math.hypot(q[0] - P.x, q[1] - P.z) < 1.3) bad.push('path' + i + ' in pond'); if (Math.hypot(q[0] + 2.5, q[1] + 1.7) < .5) bad.push('path' + i + ' at tree'); });
      return bad;
    }, d);
    assert.deepEqual(clip, [], 'no clipping');
    // Readability from the default camera at 390x844: every lantern and the cabin on screen and not tiny.
    const screen = await page.evaluate(() => { const W = GardenClip.world, T = THREE, out = [];
      W.island.getObjectByName('snow-lantern-night').traverse(o => { if (/^snow-(lantern-\d|cabin)$/.test(o.name)) {
        const a = o.getWorldPosition(new T.Vector3()), b = a.clone(); b.y += o.name === 'snow-cabin' ? 1.1 : .32;
        a.project(W.camera); b.project(W.camera); out.push({ n: o.name, x: (a.x + 1) * innerWidth / 2, y: (1 - a.y) * innerHeight / 2, h: Math.abs(a.y - b.y) * innerHeight / 2 }); } });
      return out; });
    screen.forEach(s => { assert.ok(s.x > 0 && s.x < 390 && s.y > 0 && s.y < 844, s.n + ' on screen'); assert.ok(s.h >= 8, s.n + ' readable: ' + s.h.toFixed(1) + 'px'); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, 'snow-390x844.png') });
    // Taps never plant flowers or catch things on level 6.
    const flowers = await page.evaluate(() => window.__garden.count());
    await page.touchscreen.tap(195, 560); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__garden.count()), flowers, 'tap on level 6 plants nothing');
    // Wheel zoom still works on level 6.
    const z0 = await page.evaluate(() => GardenClip.world.camera.position.length());
    await page.mouse.move(195, 420); await page.mouse.wheel(0, -600); await page.waitForTimeout(900);
    assert.ok(await page.evaluate(() => GardenClip.world.camera.position.length()) < z0 - .2, 'wheel zoom works on level 6');
    await page.mouse.wheel(0, 600); await page.waitForTimeout(900);

    /* ---- leave and come back: exact restore ---- */
    await page.evaluate(() => window.__kittens.setLevel(1)); await page.waitForTimeout(300);
    const a1 = await snap(page);
    assert.equal(await page.evaluate(() => window.SnowChapter.debug().tinted), 0);
    assert.equal(await page.evaluate(() => document.getElementById('snowHud').hidden), true);
    await page.evaluate(() => window.__kittens.setLevel(6)); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.SnowChapter.debug().visible), true, 're-entering 6 shows the snow again');
    await page.evaluate(() => window.__kittens.setLevel(1)); await page.waitForTimeout(300);
    const b1 = await snap(page);
    assert.deepEqual(diff(a1, b1), [], 'level 1 island identical after 6 -> 1 again');
    await page.evaluate(() => window.__kittens.setLevel(5)); await page.waitForTimeout(300);
    // Level 5 fits its own camera zoom to the layout over a few frames (lotus-chapter.js); compare the island, not that easing.
    const b5 = await snap(page); delete a5.__zoom; delete b5.__zoom;
    assert.deepEqual(diff(a5, b5), [], 'level 5 island identical after visiting 6');
    // ?level=6 opens level 6 directly once unlocked, and the level persists through a reload like other levels.
    await page.goto(url + '?level=6&l5cutscene=0'); await page.locator('#start').click(); await page.waitForTimeout(800);
    assert.equal(await level(page), 6, '?level=6 works once level 5 is complete');
    await context.close();

    /* ---- 360x780 screenshot and one-line HUD ---- */
    ({ context, page } = await fresh(OPEN, { width: 360, height: 780 }));
    await page.goto(url + '?level=6&l5cutscene=0'); await page.locator('#start').click(); await page.waitForTimeout(2200);
    assert.equal(await level(page), 6);
    const hud = await page.evaluate(() => { const r = document.getElementById('snowHud').getBoundingClientRect(); return { w: r.width, h: r.height }; });
    assert.ok(hud.w <= 360 && hud.h < 40, 'HUD fits one line at 360px: ' + JSON.stringify(hud));
    await page.screenshot({ path: path.join(OUT, 'snow-360x780.png') });
    await context.close();
    assert.deepEqual(errors, [], 'no console errors');
    console.log('snow chapter browser checks passed; screenshots in ' + OUT);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
