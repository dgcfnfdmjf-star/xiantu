'use strict';
// Record the shipped GLBs through the real Three.js preview. Keep screenshots in
// a separate context: locator screenshots can resize Chromium's screencast.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), repo = path.resolve(root, '../../../..');
const out = path.resolve(process.env.CAT_EVIDENCE_DIR || path.join(repo, 'output/playwright/cat-walk/evidence'));
fs.mkdirSync(out, { recursive: true });
let html = fs.readFileSync(path.join(root, 'preview-cat-orange.html'), 'utf8');
html = html.replace('// Read-only diagnostics for this standalone review page;',
  "Object.defineProperty(window,'__catReview',{get:()=>({renderer,scene,model,mixer,walkAction,walkClip,camera,controls})});\n  // Read-only diagnostics for this standalone review page;");
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.cjs': 'text/javascript', '.png': 'image/png' };
const server = http.createServer((q, r) => {
  const name = new URL(q.url, 'http://localhost').pathname, file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + '/')) { r.writeHead(403); return r.end(); }
  if (name === '/preview-cat-orange.html') { r.setHeader('Content-Type', 'text/html'); return r.end(html); }
  fs.readFile(file, (error, bytes) => {
    r.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    r.end(error ? 'missing' : bytes);
  });
});
const kinds = [['orange', '橘猫'], ['calico', '三花'], ['black', '小煤球'], ['tabby', '狸花']];
const viewport = { width: 1000, height: 900 };
async function capture(page, frames) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/preview-cat-orange.html`);
  for (const [kind, label] of kinds) {
    await page.locator(`[data-cat="${kind}"]`).click();
    await page.waitForFunction(k => __catPreview.state === 'ready' && __catPreview.loadedCat === k, kind);
    await page.locator('[data-motion="sit"]').click();
    await page.evaluate(label => { document.querySelector('.stage-label').textContent = label + ' · 坐姿'; }, label);
    await page.locator('[data-view="front"]').click();
    if (frames) await page.locator('canvas').screenshot({ path: path.join(out, kind + '-sit-front.png') });
    else await page.waitForTimeout(900);
    await page.locator('[data-view="side"]').click();
    if (frames) await page.locator('canvas').screenshot({ path: path.join(out, kind + '-sit-side.png') });
    else await page.waitForTimeout(900);
    await page.locator('[data-motion="walk"]').click();
    await page.evaluate(label => { document.querySelector('.stage-label').textContent = label + ' · Walk · 连续播放'; }, label);
    await page.waitForTimeout(frames ? 100 : 3400);
    for (const phase of [0, .25, .5, .75]) {
      await page.evaluate(({ phase, label }) => {
        const { walkAction, mixer, walkClip, renderer, scene, camera } = __catReview;
        walkAction.paused = true; walkAction.time = phase * walkClip.duration;
        mixer.update(0); scene.updateMatrixWorld(true); renderer.render(scene, camera);
        document.querySelector('.stage-label').textContent = label + ' · Walk · ' + Math.round(phase * 100) + '%';
      }, { phase, label });
      if (frames) await page.locator('canvas').screenshot({ path: path.join(out, kind + '-walk-' + String(Math.round(phase * 100)).padStart(2, '0') + '.png') });
      else await page.waitForTimeout(650);
    }
    await page.locator('[data-motion="sit"]').click();
    await page.evaluate(label => { document.querySelector('.stage-label').textContent = label + ' · 坐姿'; }, label);
    if (!frames) await page.waitForTimeout(650);
  }
  if (errors.length) throw new Error(errors.join('\n'));
}
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
    const stills = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await capture(await stills.newPage(), true); await stills.close();
    const videoContext = await browser.newContext({ viewport, deviceScaleFactor: 1, recordVideo: { dir: out, size: viewport } });
    const page = await videoContext.newPage();
    await capture(page, false);
    const video = page.video(); await videoContext.close();
    await video.saveAs(path.join(out, 'four-cats-walk-browser.webm'));
    console.log('Browser evidence: ' + out);
  } finally {
    if (browser) await browser.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
