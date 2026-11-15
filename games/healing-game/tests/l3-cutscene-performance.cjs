'use strict';
// Frame time of the level-3 cutscene on a slowed-down CPU (CDP throttling x4, software GL): the stage's own per-frame
// JS cost (applyStage through seek) and the rAF interval while it plays, next to the same page's gameplay frames.
// node tests/l3-cutscene-performance.cjs   (PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, NODE_PATH as for the other tests)
const assert = require('node:assert/strict'), fs = require('node:fs'), http = require('node:http'), path = require('node:path');
const { chromium } = require('playwright');
const SITE = path.resolve(__dirname, '../site/healing-game');
(async () => {
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://x').pathname), file = path.resolve(SITE, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(SITE + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], report = {};
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    const frames = ms => page.evaluate(ms => new Promise(done => {
      const dt = []; let last = performance.now(), t0 = last;
      (function step() { requestAnimationFrame(now => { dt.push(now - last); last = now; if (now - t0 < ms) step(); else { dt.sort((a, b) => a - b); done({ n: dt.length, median: +dt[dt.length >> 1].toFixed(1), p95: +dt[Math.floor(dt.length * 0.95)].toFixed(1) }); } }); })();
    }), ms);
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base + '/?mute=1&l3cutscene=0');
    await page.waitForFunction(() => window.GardenClip && window.GardenClip.world, null, { timeout: 60000 });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.waitForTimeout(1500);
    report.gameplay = await frames(3000);
    await page.goto(base + '/?cutscene=l3&mute=1');
    await page.waitForFunction(() => window.__l3Cutscene && window.__l3Cutscene.stage().staged, null, { timeout: 60000 });
    report.dpr = await page.evaluate(() => { const c = document.querySelector('canvas'); return +(c.width / c.clientWidth).toFixed(2); });
    for (const [name, t] of [['dusk', 5], ['fireflies', 23], ['boat', 37]]) {
      await page.evaluate(t => window.__l3Cutscene.seek(t), t);
      report[name] = await frames(3000);
    }
    // The stage's own work per frame (model + buffers + uniforms), without the draw: 200 seeks.
    report.stageMs = await page.evaluate(() => { const cs = window.__l3Cutscene; cs.pause(); const t0 = performance.now(); for (let i = 0; i < 200; i++) cs.seek(20 + i * 0.1); return +((performance.now() - t0) / 200).toFixed(3); });
    report.draw = await page.evaluate(() => { const r = window.__l3Render; return r && r.info ? { calls: r.info.render.calls, triangles: r.info.render.triangles, points: r.info.render.points } : null; });
    assert(report.stageMs < 4, 'stage work per frame stays small on a x4-throttled CPU: ' + report.stageMs + ' ms');
    assert.equal(report.dpr, 1.5, 'the film renders at a capped pixel ratio');
    // Software GL on a x4-throttled CPU is far slower than any phone GPU; this only guards against the film getting heavier.
    assert(report.boat.median <= 90 && report.fireflies.median <= 90, 'frame time under software GL: ' + JSON.stringify(report));
    assert.deepEqual(errors, []);
    report.pass = true;
    console.log(JSON.stringify(report));
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
