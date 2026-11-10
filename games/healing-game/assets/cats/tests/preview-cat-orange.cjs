'use strict';

// Focused checks for the isolated sample; uses fresh browser contexts, no saves.
// Run from the repository root:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/assets/cats/tests/preview-cat-orange.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const assetRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(assetRoot, '../../../..');
const output = path.join(repoRoot, 'output/playwright/cat-orange');
fs.mkdirSync(output, { recursive: true });
const glb = fs.readFileSync(path.join(assetRoot, 'orange-cat.glb'));
assert.equal(glb.readUInt32LE(0), 0x46546c67, 'GLB magic');
assert.equal(glb.readUInt32LE(4), 2, 'glTF 2');
assert.equal(glb.readUInt32LE(8), glb.length, 'GLB byte length');
assert.equal(glb.readUInt32LE(16), 0x4e4f534a, 'JSON chunk');
const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'));
assert(gltf.images.length > 0, 'baked texture exists');
gltf.images.forEach(image => assert(Number.isInteger(image.bufferView) || /^data:/.test(image.uri || ''), 'all textures embedded'));
(gltf.buffers || []).forEach(buffer => assert(!buffer.uri || /^data:/.test(buffer.uri), 'all buffers embedded'));
let expectedTriangles = 0;
function visit(index) {
  const node = gltf.nodes[index];
  if (node.mesh !== undefined) gltf.meshes[node.mesh].primitives.forEach(primitive => {
    assert.equal(primitive.mode ?? 4, 4, 'triangle topology');
    const accessor = primitive.indices === undefined ? primitive.attributes.POSITION : primitive.indices;
    expectedTriangles += gltf.accessors[accessor].count / 3;
  });
  (node.children || []).forEach(visit);
}
gltf.scenes[gltf.scene || 0].nodes.forEach(visit);
assert(expectedTriangles > 0 && expectedTriangles <= 50000, 'one exported sample within 50k triangles');

const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  const file = path.resolve(assetRoot, '.' + new URL(request.url, 'http://localhost').pathname);
  if (!file.startsWith(assetRoot + path.sep)) { response.writeHead(403); response.end(); return; }
  fs.readFile(file, (error, bytes) => {
    response.writeHead(error ? 404 : 200, { 'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(error ? 'Missing fixture' : bytes);
  });
});
const report = { expectedTriangles, embeddedImages: gltf.images.length, glbBytes: glb.length, checks: [], views: [] };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
const snapshot = page => page.evaluate(() => window.__catPreview);
async function ready(page) {
  await page.waitForFunction(() => window.__catPreview?.state === 'ready');
  await page.waitForFunction(() => window.__catPreview.renderedFrames > 0 && !window.__catPreview.pendingFrame);
}
async function freshContext(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, ...options });
  const external = [], requests = [], errors = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') { external.push(url.href); return route.abort(); }
    requests.push(url.pathname);
    return route.continue();
  });
  await context.addInitScript(() => {
    window.__storageTouches = 0;
    for (const name of ['localStorage', 'sessionStorage', 'indexedDB']) Object.defineProperty(window, name, { get() { window.__storageTouches++; throw new Error('Sample must not access player storage'); } });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, external, requests, errors };
}
async function verifyIsolation(test) {
  assert.deepEqual(test.external, [], 'no external service requests');
  assert.deepEqual(test.errors, [], 'no uncaught browser errors');
  assert.equal(await test.page.evaluate(() => window.__storageTouches), 0, 'no storage access');
  assert(test.requests.every(url => /^\/(preview-cat-orange\.html|orange-cat\.(glb)|orange-cat-preview\.png|vendor\/three-r128\/(three\.min\.js|GLTFLoader\.js|OrbitControls\.js))$/.test(url)), 'only isolated sample files requested');
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/preview-cat-orange.html`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const desktop = await freshContext();
  const { page } = desktop;
  await page.goto(url);
  await ready(page);
  const initial = await snapshot(page);
  assert.equal(initial.triangles, expectedTriangles, 'browser renders actual scene triangle count');
  assert.equal(initial.textures, gltf.textures.length, 'actual GLB atlas loaded');
  assert(initial.drawCalls > 0 && initial.gpuTextures >= initial.textures + 1, 'GPU model textures plus generated floor shadow');
  await page.screenshot({ path: path.join(output, 'desktop-front.png') });
  const canvas = page.locator('#cat-canvas');
  const before = await canvas.screenshot();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * .4, box.y + box.height * .48);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .7, box.y + box.height * .51, { steps: 12 });
  await page.mouse.up();
  await pause(80);
  assert(!before.equals(await canvas.screenshot()), 'drag changes actual rendered image');
  await page.getByRole('button', { name: '重置视角', exact: true }).click();
  assert.equal((await snapshot(page)).view, 'front');
  assert(Math.abs((await snapshot(page)).distance - initial.distance) < 1e-6, 'reset restores camera distance');
  await page.getByRole('button', { name: '侧面', exact: true }).click();
  await page.screenshot({ path: path.join(output, 'desktop-side.png') });
  await page.getByRole('button', { name: '背面', exact: true }).click();
  await page.screenshot({ path: path.join(output, 'desktop-back.png') });
  await page.getByRole('button', { name: '重置视角', exact: true }).click();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 80; i++) await page.mouse.wheel(0, -500);
  await pause(80);
  let zoom = await snapshot(page);
  assert(Math.abs(zoom.distance - zoom.minDistance) < 1e-5, 'wheel minimum bound');
  for (let i = 0; i < 80; i++) await page.mouse.wheel(0, 500);
  await pause(80);
  zoom = await snapshot(page);
  assert(Math.abs(zoom.distance - zoom.maxDistance) < 1e-5, 'wheel maximum bound');
  await page.getByRole('button', { name: '重置视角', exact: true }).click();
  await canvas.focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal((await snapshot(page)).view, 'custom', 'keyboard orbit');
  await page.keyboard.press('Home');
  assert.equal((await snapshot(page)).view, 'front', 'keyboard reset');
  await pause(100);
  const idleFrames = (await snapshot(page)).renderedFrames;
  await pause(300);
  assert.equal((await snapshot(page)).renderedFrames, idleFrames, 'idle does not render continuously');
  // Simulate the browser visibility signal to exercise pending-frame cancellation.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('resize'));
  });
  await pause(100);
  assert.equal((await snapshot(page)).renderedFrames, idleFrames, 'hidden page does not render');
  assert.equal((await snapshot(page)).pendingFrame, false);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await pause(100);
  assert.equal((await snapshot(page)).renderedFrames, idleFrames + 1, 'resume schedules one frame');
  const contextExtension = await page.evaluate(() => {
    const canvas = document.getElementById('cat-canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    window.__loseContext = gl.getExtension('WEBGL_lose_context');
    if (window.__loseContext) window.__loseContext.loseContext();
    return Boolean(window.__loseContext);
  });
  assert(contextExtension, 'real WebGL context-loss extension available');
  await page.waitForFunction(() => window.__catPreview.contextLost && window.__catPreview.state === 'error');
  assert(await page.locator('#error').isVisible(), 'context loss is disclosed');
  await page.evaluate(() => window.__loseContext.restoreContext());
  await ready(page);
  await verifyIsolation(desktop);
  report.views.push({ label: 'desktop', viewport: { width: 1200, height: 900 }, ...initial });
  report.checks.push('GLB embedded assets/scene triangle count', 'actual rendered drag image changes', 'front/side/back/reset', 'wheel min/max and keyboard controls', 'idle rendering stops', 'simulated document.hidden cancels rendering; resume renders once', 'real WebGL context loss/restoration', 'no external requests or storage access');
  await desktop.context.close();

  const earlyLoss = await freshContext();
  let releaseGLB, glbRequested;
  const requestObserved = new Promise(resolve => { glbRequested = resolve; });
  await earlyLoss.context.route('**/orange-cat.glb', async route => {
    glbRequested();
    await new Promise(resolve => { releaseGLB = resolve; });
    await route.continue();
  });
  await earlyLoss.page.goto(url);
  await requestObserved;
  await earlyLoss.page.evaluate(() => {
    const canvas = document.getElementById('cat-canvas');
    window.__loseContext = (canvas.getContext('webgl2') || canvas.getContext('webgl')).getExtension('WEBGL_lose_context');
    window.__loseContext.loseContext();
  });
  await earlyLoss.page.waitForFunction(() => window.__catPreview.contextLost);
  releaseGLB();
  await earlyLoss.page.waitForFunction(() => window.__catPreview.triangles > 0);
  await earlyLoss.page.evaluate(() => window.__loseContext.restoreContext());
  await ready(earlyLoss.page);
  assert(Math.abs((await snapshot(earlyLoss.page)).distance - initial.distance) < 1e-6, 'model is framed when loaded during context loss');
  await verifyIsolation(earlyLoss);
  await earlyLoss.context.close();
  report.checks.push('context loss during initial GLB load restores fitted view');

  const phone = await freshContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await phone.page.goto(url);
  await ready(phone.page);
  let info = await snapshot(phone.page);
  assert.equal(info.dpr, 2, 'DPR capped on high density phone');
  assert.equal(await phone.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'portrait has no horizontal overflow');
  await phone.page.screenshot({ path: path.join(output, 'phone-portrait.png') });
  report.views.push({ label: 'phone portrait / reduced motion', viewport: { width: 390, height: 844 }, ...info });
  const cdp = await phone.context.newCDPSession(phone.page);
  const touchBox = await phone.page.locator('#cat-canvas').boundingBox();
  const tx = touchBox.x + touchBox.width / 2, ty = touchBox.y + touchBox.height / 2;
  const points = spread => [{ x: tx - spread, y: ty, id: 1 }, { x: tx + spread, y: ty, id: 2 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(35) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(80) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pause(100);
  const pinched = await snapshot(phone.page);
  assert(pinched.distance < info.distance && pinched.distance >= pinched.minDistance - 1e-5, 'touch pinch zooms within bounds');
  await phone.page.getByRole('button', { name: '重置视角', exact: true }).click();
  await phone.page.setViewportSize({ width: 844, height: 390 });
  await pause(100);
  info = await snapshot(phone.page);
  assert.equal(await phone.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'landscape has no horizontal overflow');
  assert.equal(info.dpr, 2);
  await phone.page.screenshot({ path: path.join(output, 'phone-landscape.png') });
  report.views.push({ label: 'phone landscape', viewport: { width: 844, height: 390 }, ...info });
  await verifyIsolation(phone);
  await phone.context.close();
  report.checks.push('phone portrait/landscape resize', 'DPR 3 capped to 2', 'real CDP touch pinch', 'reduced motion has no idle animation');

  const failure = await freshContext();
  await failure.context.route('**/orange-cat.glb', route => route.abort('failed'));
  await failure.page.goto(url);
  await failure.page.waitForFunction(() => window.__catPreview?.state === 'error');
  await failure.page.locator('#fallback-image').waitFor({ state: 'visible' });
  assert(await failure.page.getByText('静态预览 · 暂不可旋转').isVisible(), 'fallback is explicitly static');
  const captionBox = await failure.page.locator('.fallback figcaption').boundingBox();
  const errorBox = await failure.page.locator('.error-box').boundingBox();
  assert(captionBox.y + captionBox.height <= errorBox.y, 'static caption is not covered by error card');
  assert(await failure.page.getByRole('button', { name: '侧面', exact: true }).isDisabled());
  await failure.page.screenshot({ path: path.join(output, 'load-failure.png') });
  await failure.context.unroute('**/orange-cat.glb');
  await failure.page.getByRole('button', { name: '重新加载', exact: true }).click();
  await ready(failure.page);
  assert(await failure.page.locator('#fallback').isHidden(), 'retry restores actual 3D view');
  await verifyIsolation(failure);
  await failure.context.close();
  report.checks.push('failed GLB displays labeled static PNG and disables 3D controls; retry succeeds');

  const noWebGL = await freshContext();
  await noWebGL.context.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : getContext.call(this, type, ...args);
    };
  });
  await noWebGL.page.goto(url);
  await noWebGL.page.waitForFunction(() => window.__catPreview?.state === 'error');
  assert(await noWebGL.page.getByText(/此浏览器暂时无法显示三维模型/).isVisible());
  await noWebGL.page.locator('#fallback-image').waitFor({ state: 'visible' });
  await verifyIsolation(noWebGL);
  await noWebGL.context.close();
  report.checks.push('WebGL unavailable shows explicit static fallback');
  report.browser = browser.version();
  report.environment = 'Headless Chromium on cloud Linux; viewport/touch emulation, not a physical phone or FPS benchmark.';
  fs.writeFileSync(path.join(output, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
