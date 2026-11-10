'use strict';

// Focused checks for all four isolated cat samples; fresh contexts, no saves.
// Run from the repository root:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/assets/cats/tests/preview-cat-orange.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createHash } = require('node:crypto');
const { chromium } = require('playwright');
const { auditFurUV } = require('./cat-uv-overlap.cjs');

const assetRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(assetRoot, '../../../..');
const output = path.join(repoRoot, 'output/playwright/cat-variants');
fs.mkdirSync(output, { recursive: true });
const cats = ['orange', 'calico', 'black', 'tabby'];
const previewSource = fs.readFileSync(path.join(assetRoot, 'preview-cat-orange.html'), 'utf8');
const embeddedModels = [...previewSource.matchAll(/<script type="application\/octet-stream" id="cat-model-(orange|calico|black|tabby)" data-sha256="([0-9a-f]{64})">([A-Za-z0-9+/=\s]+)<\/script>/g)];
assert.equal(embeddedModels.length, cats.length, 'four model snapshots are embedded in the page');
const assets = Object.fromEntries(cats.map(id => {
  const matches = embeddedModels.filter(match => match[1] === id);
  assert.equal(matches.length, 1, `${id} has exactly one embedded snapshot`);
  const base64 = matches[0][3].trim();
  const glb = Buffer.from(base64, 'base64');
  assert.equal(createHash('sha256').update(glb).digest('hex'), matches[0][2], `${id} embedded hash matches`);
  assert(glb.equals(fs.readFileSync(path.join(assetRoot, `${id}-cat.glb`))), `${id} viewer snapshot matches the actual accepted GLB`);
  assert.equal(glb.readUInt32LE(0), 0x46546c67, `${id} GLB magic`);
  assert.equal(glb.readUInt32LE(4), 2, `${id} glTF 2`);
  assert.equal(glb.readUInt32LE(8), glb.length, `${id} GLB byte length`);
  assert.equal(glb.readUInt32LE(16), 0x4e4f534a, `${id} JSON chunk`);
  const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'));
  assert(gltf.images.length > 0, `${id} baked texture exists`);
  gltf.images.forEach(image => assert(Number.isInteger(image.bufferView) || /^data:/.test(image.uri || ''), `${id} all textures embedded`));
  (gltf.buffers || []).forEach(buffer => assert(!buffer.uri || /^data:/.test(buffer.uri), `${id} all buffers embedded`));
  let expectedTriangles = 0;
  function visit(index) {
    const node = gltf.nodes[index];
    if (node.mesh !== undefined) gltf.meshes[node.mesh].primitives.forEach(primitive => {
      assert.equal(primitive.mode ?? 4, 4, `${id} triangle topology`);
      const accessor = primitive.indices === undefined ? primitive.attributes.POSITION : primitive.indices;
      expectedTriangles += gltf.accessors[accessor].count / 3;
    });
    (node.children || []).forEach(visit);
  }
  gltf.scenes[gltf.scene || 0].nodes.forEach(visit);
  assert(expectedTriangles > 0 && expectedTriangles <= 50000, `${id} within 50k triangles`);
  const uv = auditFurUV(glb, { resolution: 1024, tolerance: 1e-4 });
  assert.equal(uv.conflictingTexels, 0, `${id} fur UVs must not assign distant surfaces to the same atlas texel`);
  assert.equal(uv.degenerateTriangles, 0, `${id} fur triangles must retain nonzero UV area`);
  return [id, { gltf, base64, uv, triangles: expectedTriangles, images: gltf.images.length, bytes: glb.length }];
}));
const gltf = assets.orange.gltf, expectedTriangles = assets.orange.triangles;

const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  const file = path.resolve(assetRoot, '.' + new URL(request.url, 'http://localhost').pathname);
  if (!file.startsWith(assetRoot + path.sep)) { response.writeHead(403); response.end(); return; }
  // Published preview must work without separately published GLB files.
  if (path.extname(file) === '.glb') { response.writeHead(404); response.end('No external model fixture'); return; }
  fs.readFile(file, (error, bytes) => {
    response.writeHead(error ? 404 : 200, { 'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(error ? 'Missing fixture' : bytes);
  });
});
const report = { assets: Object.fromEntries(cats.map(id => [id, { triangles: assets[id].triangles, embeddedImages: assets[id].images, bytes: assets[id].bytes, uv: assets[id].uv }])), checks: [], views: [] };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
const snapshot = page => page.evaluate(() => window.__catPreview);
async function ready(page, id) {
  await page.waitForFunction(id => window.__catPreview?.state === 'ready' && (!id || window.__catPreview.loadedCat === id), id);
  await page.waitForFunction(() => window.__catPreview.renderedFrames > 0 && !window.__catPreview.pendingFrame);
}
async function selectCat(page, id) {
  await page.locator(`[data-cat="${id}"]`).click();
  await ready(page, id);
  const info = await snapshot(page);
  assert.equal(info.selectedCat, id);
  assert.equal(info.triangles, assets[id].triangles, `${id} renders actual geometry`);
  assert.equal(info.textures, assets[id].gltf.textures.length, `${id} actual embedded atlas loaded`);
  assert.equal(info.gpuTextures, info.textures + 1, `${id} retains only current GPU atlas and shadow`);
  assert.equal(info.gpuGeometries, assets[id].gltf.meshes.length + 1, `${id} retains only current meshes and shadow`);
  assert.equal(info.view, 'front', 'switch resets view');
  return info;
}
async function captureViews(page, label, id) {
  for (const [view, name] of [['front', '正面'], ['side', '侧面'], ['back', '背面']]) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.screenshot({ path: path.join(output, `${id}-${label}-${view}.png`), scale: 'css' });
  }
  await page.getByRole('button', { name: '重置视角', exact: true }).click();
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
    window.__bitmapStats = { created: 0, closed: 0 };
    window.__blobURLStats = { created: 0, revoked: 0, live: 0 };
    const createURL = URL.createObjectURL, revokeURL = URL.revokeObjectURL, blobURLs = new Set();
    URL.createObjectURL = (...args) => {
      const url = createURL(...args); blobURLs.add(url);
      window.__blobURLStats.created++; window.__blobURLStats.live++;
      return url;
    };
    URL.revokeObjectURL = url => {
      if (blobURLs.delete(url)) { window.__blobURLStats.revoked++; window.__blobURLStats.live--; }
      return revokeURL(url);
    };
    const create = window.createImageBitmap;
    const close = ImageBitmap.prototype.close;
    const tracked = new WeakSet(), closed = new WeakSet();
    window.createImageBitmap = async (...args) => {
      if (window.__rejectNextBitmap) { window.__rejectNextBitmap = false; throw new Error('Controlled atlas decode failure'); }
      const image = await create(...args);
      window.__bitmapStats.created++; tracked.add(image);
      if (window.__holdNextBitmap) {
        window.__holdNextBitmap = false;
        await new Promise(resolve => { window.__releaseBitmap = resolve; });
      }
      return image;
    };
    ImageBitmap.prototype.close = function () {
      if (tracked.has(this) && !closed.has(this)) { window.__bitmapStats.closed++; closed.add(this); }
      return close.call(this);
    };
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, external, requests, errors };
}
async function verifyIsolation(test) {
  assert.deepEqual(test.external, [], 'no external service requests');
  assert.deepEqual(test.errors, [], 'no uncaught browser errors');
  assert.equal(await test.page.evaluate(() => window.__storageTouches), 0, 'no storage access');
  assert(test.requests.every(url => /^\/(preview-cat-orange\.html|(orange|calico|black|tabby)-cat-preview\.png|vendor\/three-r128\/(three\.min\.js|GLTFLoader\.js|OrbitControls\.js))$/.test(url)), 'only preview, PNGs and committed vendor files requested; no external GLBs');
}
async function corruptEmbeddedModels(context, ids) {
  let source = previewSource;
  for (const id of ids) {
    // A decoded one-byte payload cannot be a GLB. Keep the page and fallback intact.
    const block = new RegExp(`(<script type="application/octet-stream" id="cat-model-${id}"[^>]*>)[A-Za-z0-9+/=\\s]+(</script>)`);
    assert(block.test(source), `${id} corruption fixture targets an actual embedded model`);
    source = source.replace(block, '$1AA==$2');
  }
  await context.route('**/preview-cat-orange.html', route => route.fulfill({ contentType: 'text/html', body: source }));
}
async function restoreEmbeddedModels(page, ids) {
  await page.evaluate(payloads => {
    for (const [id, value] of Object.entries(payloads)) document.getElementById(`cat-model-${id}`).textContent = value;
  }, Object.fromEntries(ids.map(id => [id, assets[id].base64])));
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/preview-cat-orange.html`;
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--no-sandbox'] });
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
  for (const id of cats) {
    const info = await selectCat(page, id);
    report.views.push({ label: `${id} desktop`, viewport: { width: 1200, height: 900 }, ...info });
    await captureViews(page, 'desktop', id);
    const beforeDrag = await canvas.screenshot();
    await page.mouse.move(box.x + box.width * .4, box.y + box.height * .48);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .67, box.y + box.height * .52, { steps: 8 });
    await page.mouse.up();
    assert(!beforeDrag.equals(await canvas.screenshot()), `${id} drag changes actual rendered image`);
    const beforeZoom = (await snapshot(page)).distance;
    await page.mouse.wheel(0, -180);
    await page.waitForFunction(distance => window.__catPreview.distance < distance, beforeZoom);
    await page.getByRole('button', { name: '重置视角', exact: true }).click();
    assert(Math.abs((await snapshot(page)).distance - info.distance) < 1e-6, `${id} reset restores fitted distance`);
  }
  for (let round = 0; round < 3; round++) for (const id of cats) await selectCat(page, id);
  await page.waitForFunction(() => window.__catPreview.pendingLoads === 0);
  const bitmap = await page.evaluate(() => window.__bitmapStats);
  assert.equal(bitmap.created - bitmap.closed, assets.tabby.gltf.textures.length, 'repeated switches close all replaced decoded image bitmaps');
  assert.equal(await page.evaluate(() => window.__blobURLStats.live), 0, 'all encoded atlas object URLs are revoked');
  report.checks.push('all four cats front/side/back, drag, wheel, fitted reset', 'three complete switch cycles retain only current model textures and six model geometries', 'all replaced decoded ImageBitmaps are closed');
  await verifyIsolation(desktop);
  report.views.push({ label: 'desktop', viewport: { width: 1200, height: 900 }, ...initial });
  report.checks.push('embedded GLB bytes match accepted files, scene triangle counts and zero fur UV conflicts', 'actual rendered drag image changes', 'front/side/back/reset', 'wheel min/max and keyboard controls', 'idle rendering stops', 'simulated document.hidden cancels rendering; resume renders once', 'real WebGL context loss/restoration', 'no external requests, external GLBs or storage access');
  await desktop.context.close();

  const earlyLoss = await freshContext();
  await earlyLoss.context.addInitScript(() => { window.__holdNextBitmap = true; });
  await earlyLoss.page.goto(url);
  await earlyLoss.page.waitForFunction(() => typeof window.__releaseBitmap === 'function');
  await earlyLoss.page.evaluate(() => {
    const canvas = document.getElementById('cat-canvas');
    window.__loseContext = (canvas.getContext('webgl2') || canvas.getContext('webgl')).getExtension('WEBGL_lose_context');
    window.__loseContext.loseContext();
  });
  await earlyLoss.page.waitForFunction(() => window.__catPreview.contextLost);
  await earlyLoss.page.evaluate(() => window.__releaseBitmap());
  await earlyLoss.page.waitForFunction(() => window.__catPreview.triangles > 0);
  await earlyLoss.page.evaluate(() => window.__loseContext.restoreContext());
  await ready(earlyLoss.page);
  assert(Math.abs((await snapshot(earlyLoss.page)).distance - initial.distance) < 1e-6, 'model is framed when loaded during context loss');
  await verifyIsolation(earlyLoss);
  await earlyLoss.context.close();
  report.checks.push('context loss during initial embedded atlas decode restores fitted view');

  const stale = await freshContext();
  await stale.page.goto(url);
  await ready(stale.page, 'orange');
  await stale.page.evaluate(() => { window.__holdNextBitmap = true; });
  await stale.page.locator('[data-cat="calico"]').click();
  await stale.page.waitForFunction(() => typeof window.__releaseBitmap === 'function');
  await selectCat(stale.page, 'tabby');
  await stale.page.evaluate(() => window.__releaseBitmap());
  await stale.page.waitForFunction(() => window.__catPreview.pendingLoads === 0);
  assert.equal((await snapshot(stale.page)).loadedCat, 'tabby', 'late decoded GLB cannot replace current selection');
  assert.equal((await snapshot(stale.page)).gpuTextures, assets.tabby.gltf.textures.length + 1, 'late result allocates no persistent GPU atlas');
  const lateBitmaps = await stale.page.evaluate(() => window.__bitmapStats);
  assert.equal(lateBitmaps.created - lateBitmaps.closed, assets.tabby.gltf.textures.length, 'late decoded atlas is closed');
  assert.equal(await stale.page.evaluate(() => window.__blobURLStats.live), 0, 'late decoded atlas object URL is revoked');
  await stale.page.evaluate(() => { window.__rejectNextBitmap = true; });
  await stale.page.locator('[data-cat="calico"]').click();
  await stale.page.waitForFunction(() => window.__catPreview.state === 'error' && window.__catPreview.pendingLoads === 0);
  assert.equal(await stale.page.evaluate(() => window.__blobURLStats.live), 0, 'failed atlas decode releases encoded object URL');
  await stale.page.getByRole('button', { name: '重新加载', exact: true }).click();
  await ready(stale.page, 'calico');
  await verifyIsolation(stale);
  await stale.context.close();
  report.checks.push('late embedded texture decode preserves latest cat and releases replaced resources; decode failure retries');

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
  for (const [label, width, height] of [['phone-portrait', 390, 844], ['phone-landscape', 844, 390]]) {
    await phone.page.setViewportSize({ width, height });
    for (const id of cats) {
      const info = await selectCat(phone.page, id);
      assert.equal(info.dpr, 2);
      assert.equal(await phone.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${id} ${label} has no horizontal overflow`);
      await captureViews(phone.page, label, id);
      report.views.push({ label: `${id} ${label}`, viewport: { width, height }, ...info });
    }
  }
  await verifyIsolation(phone);
  await phone.context.close();
  report.checks.push('phone portrait/landscape resize', 'DPR 3 capped to 2', 'real CDP touch pinch', 'reduced motion has no idle animation');

  const failure = await freshContext();
  await corruptEmbeddedModels(failure.context, ['orange']);
  await failure.page.goto(url);
  await failure.page.waitForFunction(() => window.__catPreview?.state === 'error');
  await failure.page.locator('#fallback-image').waitFor({ state: 'visible' });
  assert(await failure.page.getByText('静态预览 · 暂不可旋转').isVisible(), 'fallback is explicitly static');
  const captionBox = await failure.page.locator('.fallback figcaption').boundingBox();
  const errorBox = await failure.page.locator('.error-box').boundingBox();
  assert(captionBox.y + captionBox.height <= errorBox.y, 'static caption is not covered by error card');
  assert(await failure.page.getByRole('button', { name: '侧面', exact: true }).isDisabled());
  await failure.page.screenshot({ path: path.join(output, 'load-failure.png') });
  await restoreEmbeddedModels(failure.page, ['orange']);
  await failure.page.getByRole('button', { name: '重新加载', exact: true }).click();
  await ready(failure.page);
  assert(await failure.page.locator('#fallback').isHidden(), 'retry restores actual 3D view');
  await verifyIsolation(failure);
  await failure.context.close();
  report.checks.push('corrupt embedded GLB displays labeled static PNG and disables 3D controls; restored snapshot retry succeeds');

  const fallbacks = await freshContext();
  await corruptEmbeddedModels(fallbacks.context, cats);
  await fallbacks.page.goto(url);
  for (const id of cats) {
    if (id !== 'orange') await fallbacks.page.locator(`[data-cat="${id}"]`).click();
    await fallbacks.page.waitForFunction(id => window.__catPreview?.state === 'error' && window.__catPreview.selectedCat === id, id);
    await fallbacks.page.waitForFunction(id => {
      const image = document.getElementById('fallback-image');
      return !document.getElementById('fallback').hidden && image.complete && image.naturalWidth > 0 && image.currentSrc.endsWith(`/${id}-cat-preview.png`);
    }, id);
    assert(await fallbacks.page.getByText('静态预览 · 暂不可旋转').isVisible());
    assert(await fallbacks.page.getByRole('button', { name: '侧面', exact: true }).isDisabled());
    await fallbacks.page.screenshot({ path: path.join(output, `${id}-load-failure.png`), scale: 'css' });
  }
  await fallbacks.page.setViewportSize({ width: 390, height: 844 });
  let fallbackCaption = await fallbacks.page.locator('.fallback figcaption').boundingBox();
  let fallbackError = await fallbacks.page.locator('.error-box').boundingBox();
  assert(fallbackCaption.y + fallbackCaption.height <= fallbackError.y, 'phone portrait keeps static label clear of error');
  await fallbacks.page.setViewportSize({ width: 844, height: 390 });
  const fallbackImage = await fallbacks.page.locator('#fallback-image').boundingBox();
  fallbackError = await fallbacks.page.locator('.error-box').boundingBox();
  assert(fallbackImage.height > 20 && fallbackImage.x + fallbackImage.width <= fallbackError.x, 'phone landscape displays corresponding PNG beside error card');
  await fallbacks.page.screenshot({ path: path.join(output, 'phone-landscape-load-failure.png'), scale: 'css' });
  await restoreEmbeddedModels(fallbacks.page, cats);
  await fallbacks.page.getByRole('button', { name: '重新加载', exact: true }).click();
  await ready(fallbacks.page, 'tabby');
  await selectCat(fallbacks.page, 'orange');
  await verifyIsolation(fallbacks);
  await fallbacks.context.close();
  report.checks.push('each failed selection shows its own PNG; selected-cat retry and later switches recover');

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
  await noWebGL.page.locator('[data-cat="black"]').click();
  await noWebGL.page.waitForFunction(() => document.getElementById('fallback-image').currentSrc.endsWith('/black-cat-preview.png') && !document.getElementById('fallback').hidden);
  await noWebGL.page.getByRole('button', { name: '重新加载', exact: true }).click();
  await noWebGL.page.waitForFunction(() => window.__catPreview?.selectedCat === 'black' && window.__catPreview.state === 'error');
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
