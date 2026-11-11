'use strict';

// Standalone preview smoke for the level-2 clear cutscene (portrait and landscape phone).
// Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l2-cutscene-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(__dirname, '../../../output/playwright/l2-cutscene');
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };

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
  const report = { views: [], errors: [] };
  try {
    for (const [width, height] of [[390, 844], [844, 390]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      page.on('pageerror', e => report.errors.push(e.message));
      await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
      const saves = () => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));

      // Muted preview starts without a gesture.
      await page.goto(url + '?cutscene=1&mute=1');
      await page.waitForFunction(() => window.__l2Cutscene && window.__l2Cutscene.ready() && window.__l2Cutscene.playing());
      const before = await saves();
      assert.equal(await page.evaluate(() => window.__l2Cutscene.duration()), 60);
      const t0 = await page.evaluate(() => window.__l2Cutscene.time());
      await page.waitForTimeout(1000);
      const t1 = await page.evaluate(() => window.__l2Cutscene.time());
      assert(t1 - t0 > 0.8 && t1 - t0 < 1.6, 'real-time clock: ' + (t1 - t0));

      const skip = await page.locator('#l2csSkip').boundingBox();
      assert(skip.width >= 44 && skip.height >= 44, 'skip touch target');
      assert(skip.x + skip.width <= width && skip.y >= 0 && skip.y + skip.height < height * 0.25, 'skip sits in the top corner');

      // The stage owns the island: game UI hidden, display-only cast built, Blender coats attached.
      await page.waitForFunction(() => window.__l2Cutscene.stage().staged && window.__l2Cutscene.stage().blender >= 4);
      assert.equal(await page.locator('#start').isVisible(), false, 'start card steps aside');
      const shots = {};
      const shoot = async t => {
        await page.evaluate(t => { window.__l2Cutscene.pause(); window.__l2Cutscene.seek(t); }, t);
        await page.waitForTimeout(150);
        return page.evaluate(() => window.__l2Cutscene.stage().shot);
      };
      for (const t of [5, 20, 40, 58]) {
        shots[t] = await shoot(t);
        assert.equal(await page.evaluate(() => window.__l2Cutscene.time()), t);
        assert.equal(await page.locator('#l2csGo').isVisible(), false);
        await page.screenshot({ path: path.join(OUT, `${width}x${height}-t${t}.png`) });
        if (t === 40) {
          assert.equal(await page.locator('#l2csBook').evaluate(e => getComputedStyle(e).opacity), '1', 'book open at 40s');
          assert.equal(await page.locator('.l2cs-card').count(), 6);
          const book = await page.locator('#l2csBook').boundingBox();
          assert(book.x >= 0 && book.x + book.width <= width && book.y + book.height <= height, 'book fits the viewport');
        }
      }
      const actors = async t => { await shoot(t); return page.evaluate(() => window.__l2Cutscene.stage().actors); };
      assert.equal(await actors(5), 0, 'no kitten on stage at 5s');
      assert.equal(await actors(20), 7, 'full cast at 20s');
      assert(shots[5].lanterns >= 2 && shots[5].lanterns < 5 && !shots[5].teaser && shots[5].flies === 0);
      assert(shots[20].lanterns === 5 && shots[20].halo === 1 && shots[20].zs === 0, 'rare cat with halo at 20s');
      assert(shots[58].zs > 0 && shots[58].hearts === 0 && shots[58].cats.every(c => c[3] === 1), 'sleep pile at 58s');
      assert.notDeepEqual(shots[5].camera, shots[58].camera, 'camera moves');
      // Seeking is idempotent: any route to a mark gives the same picture, with nothing left over.
      assert.deepEqual(await shoot(30).then(s => [s.teaser, s.flies, s.hearts > 0]), [true, 3, true]);
      for (const t of [58, 20, 5, 40]) {
        const again = await shoot(t);
        // The island itself keeps bobbing (±0.12), so the world-space camera may differ by that much.
        again.camera.forEach((v, i) => assert(Math.abs(v - shots[t].camera[i]) < 0.35, 'camera repeats at ' + t));
        assert.deepEqual({ ...again, camera: 0 }, { ...shots[t], camera: 0 }, 'seek(' + t + ') repeats');
      }
      assert.equal(await page.evaluate(() => window.__kittens.list.length + ':' + window.__kittens.state().total), await page.evaluate(() => window.__kittens.list.length + ':0'), 'actors never join gameplay');
      await shoot(58);
      assert.equal(await page.locator('#l2csEnd').evaluate(e => getComputedStyle(e).opacity), '1', 'title visible at 58s');

      // Skip lands on the end card; the same tap must not dismiss it.
      await page.evaluate(() => { window.__l2Cutscene.seek(12); window.__l2Cutscene.resume(); });
      await page.locator('#l2csSkip').tap();
      assert.equal(await page.evaluate(() => window.__l2Cutscene.finished() && window.__l2Cutscene.time() === 60 && window.__l2Cutscene.state() === 'ended'), true);
      assert.equal(await page.locator('#l2csSkip').isVisible(), false);
      assert.equal(await page.locator('#l2csTitle').innerText(), '第二关 · 完成');
      assert.equal(await page.locator('#l2csSub').innerText(), '暮色浮岛');
      const go = await page.locator('#l2csGo').boundingBox();
      assert(go.width >= 44 && go.height >= 44 && go.y + go.height <= height, 'continue control on screen');
      await page.screenshot({ path: path.join(OUT, `${width}x${height}-end.png`) });
      await page.waitForTimeout(700);
      await page.locator('#l2csGo').tap();
      assert.equal(await page.evaluate(() => window.__l2Cutscene.state()), 'closed');
      assert.equal(await page.locator('#l2cs').isVisible(), false);
      assert.equal(await page.evaluate(() => window.__l2Cutscene.staged()), false);
      assert.equal(await page.locator('#start').isVisible(), true, 'game UI returns');
      assert.equal(await saves(), before, 'cutscene writes no save');

      // Unmuted preview waits for the first gesture.
      await page.goto(url + '?cutscene=1');
      await page.waitForFunction(() => window.__l2Cutscene && window.__l2Cutscene.ready());
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.__l2Cutscene.playing()), false);
      await page.touchscreen.tap(width / 2, height * 0.9);
      await page.waitForFunction(() => window.__l2Cutscene.playing());
      report.views.push(width + 'x' + height);
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify({ pass: true, ...report, screenshots: OUT }));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
