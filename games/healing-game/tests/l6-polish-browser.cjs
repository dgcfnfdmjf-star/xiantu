'use strict';
// Level-6 polish checks on the built page (synthetic saves only):
//  - the game's pink weather petals never fall on the snowy island (level 6), come back on other levels, and are
//    hidden by the l6 cutscene stage (no stray pink in the film's sky);
//  - the HUD pill does not run into the right-hand toggle column at 360x780 and stays one line;
//  - the film renders at pixel ratio <= 1.5 with a modest draw-call budget; gameplay stays within the same budget.
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l6-polish-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const KEY = 'healingGarden.journey.v1';
const SAVES = {
  'healingGarden.kittens.v1': { total: 20, ended: true, level: 6 },
  [KEY]: { completed: [1, 2, 3, 4, 5], lamps: [true, true, true], chimes: { round: 3 }, lotus: { light: [3, 3, 3, 3, 3, 3] }, snow: { lit: [0, 1, 2], home: ['orange'] } }
};
const PINK = 0xffc6da;
const pinkCount = page => page.evaluate(pink => {
  let n = 0;
  window.GardenClip.world.scene.traverseVisible(o => { if (o.isInstancedMesh && o.material && o.material.color && o.material.color.getHex() === pink) n += o.count; });
  return n;
}, PINK);

(async () => {
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.resolve(SITE, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(SITE + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await context.addInitScript(saves => {
      if (sessionStorage.getItem('seeded')) return;
      for (const k in saves) localStorage.setItem(k, JSON.stringify(saves[k]));
      sessionStorage.setItem('seeded', '1');
    }, SAVES);
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url + '?level=6&l6cutscene=0');
    await page.locator('#start').click(); await page.waitForTimeout(3000);
    assert.equal(await page.evaluate(() => window.__kittens.state().level), 6);
    assert.equal(await pinkCount(page), 0, 'no pink petals on the snowy island');
    const hud = await page.evaluate(() => {
      const h = document.getElementById('snowHud').getBoundingClientRect(), t = document.getElementById('toggles').getBoundingClientRect();
      return { right: h.right, left: t.left, height: h.height };
    });
    assert.ok(hud.right <= hud.left - 4, 'HUD clears the toggle column at 360px: ' + JSON.stringify(hud));
    assert.ok(hud.height < 40, 'HUD stays one line');
    const game = await page.evaluate(() => ({ calls: window.__l3Render.info.render.calls, pr: window.__l3Render.getPixelRatio() }));
    assert.ok(game.calls < 180, 'gameplay draw calls modest: ' + game.calls);
    // other levels keep their weather petals (a light drift even in clear weather), level 6 drops them at once
    await page.evaluate(() => window.__kittens.setLevel(1)); await page.waitForTimeout(6000);
    assert.ok(await pinkCount(page) > 0, 'level 1 keeps its petals');
    await page.evaluate(() => window.__kittens.setLevel(6)); await page.waitForTimeout(400);
    assert.equal(await pinkCount(page), 0, 'petals gone at once on level 6');
    await context.close();

    // the film, previewed from level 1 where petals are drifting: none in its sky; pixel ratio capped
    const c2 = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const p2 = await c2.newPage();
    p2.on('pageerror', e => errors.push(e.message));
    await p2.goto(url + '?cutscene=l6&mute=1'); await p2.waitForTimeout(3000);
    for (const t of [4, 15, 27.5, 31, 37, 48]) {
      await p2.evaluate(t => { window.__l6Cutscene.seek(t); window.__l6Cutscene.pause(); }, t); await p2.waitForTimeout(300);
      assert.equal(await pinkCount(p2), 0, 'no pink petals in the film at ' + t + ' s');
      const r = await p2.evaluate(() => ({ calls: window.__l3Render.info.render.calls, pr: window.__l3Render.getPixelRatio() }));
      assert.ok(r.pr <= 1.5, 'film pixel ratio <= 1.5: ' + r.pr);
      assert.ok(r.calls < 180, 'film draw calls modest at ' + t + ': ' + r.calls);
    }
    await c2.close();
    assert.deepEqual(errors, []);
    console.log('l6-polish-browser: PASS (gameplay calls ' + game.calls + ', pr ' + game.pr + ')');
  } finally {
    await browser.close(); server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
