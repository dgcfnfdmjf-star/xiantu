'use strict';

// Paired, cache-cold Fast 4G diagnostic against an immutable main build.
// Run on an otherwise idle host after build.py:
// CAT_WALK_BASELINE_DIR=/path/to/main/site node games/healing-game/tests/cat-walk-performance.cjs
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const f = require('./cat-models-fixture.cjs');
const baselineRoot = process.env.CAT_WALK_BASELINE_DIR;
assert(baselineRoot, 'CAT_WALK_BASELINE_DIR must identify the preserved main V9.5 six-file site');
const output = f.path.join(f.repo, 'output/playwright/cat-walk');
f.fs.mkdirSync(output, { recursive: true });
const report = {
  conditions: {
    samplesPerVariant: 3, viewport: '390×844 CSS pixels, DPR2, touch/mobile emulation',
    network: 'CDP Fast 4G: 9 Mbps down / 1.5 Mbps up / 60 ms latency',
    cache: 'Fresh browser contexts, CDP cache disabled, server Cache-Control:no-store; OS/process/GPU caches may be warm',
    timing: 'Chapter-two entry until all four requested coat graphs and ambient orange attach; excludes initial index.html download. Two-RAF checkpoint also includes rendering/scheduling, not isolated GPU upload.',
    limitation: 'Cloud headless Chromium software rendering and network emulation; not physical-phone timing or frame rate.'
  }, assetSets: {}, loads: [], scenes: []
};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function manifest(root) {
  return { html: hash(f.fs.readFileSync(f.path.join(root, 'index.html'))), assets: f.kinds.map(kind => {
    const bytes = f.fs.readFileSync(f.path.join(root, 'cats', kind + '-cat.glb'));
    return { kind, bytes: bytes.length, sha256: hash(bytes) };
  }) };
}
async function oneLoad(browser, server, variant, sample) {
  const test = await f.fresh(browser, { randomSeed: 638471, save: { level: 1, total: 0, ended: false, caught: {}, companions: {} } });
  const { page } = test;
  try {
    await f.start(test, server.url); await page.waitForTimeout(500);
    const cdp = await test.context.newCDPSession(page);
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 9000000 / 8, uploadThroughput: 1500000 / 8, connectionType: 'cellular4g' });
    await page.evaluate(() => {
      performance.clearResourceTimings(); window.__walkReady = {};
      const add = THREE.Object3D.prototype.add;
      THREE.Object3D.prototype.add = function (object) {
        const value = add.apply(this, arguments);
        if (object?.name === 'BlenderCatVisual') {
          const k = __kittens.list.find(k => k.root === this);
          __walkReady[k ? k.kind.id : 'ambient-orange'] ??= performance.now();
        }
        return value;
      };
      window.__walkLoadStart = performance.now(); __kittens.setLevel(2);
    });
    await page.waitForFunction(() => ['orange', 'calico', 'black', 'tabby', 'ambient-orange'].every(kind => __walkReady[kind]), null, { timeout: 60000 });
    const result = await page.evaluate(() => {
      const start = __walkLoadStart;
      const gl = __catTestRenderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { readyMs: Math.max(...Object.values(__walkReady)) - start, cats: __kittens.list.length,
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        models: __kittens.list.filter(k => k.catModel).map(k => ({ kind: k.kind.id, animated: !!k.catMixer })),
        resources: performance.getEntriesByType('resource').filter(r => /-cat\.glb$/.test(r.name)).map(r => ({
          kind: r.name.match(/\/([^/]+)-cat\.glb$/)[1], encodedBytes: r.encodedBodySize, transferredBytes: r.transferSize,
          startedMs: r.startTime - start, responseEndMs: r.responseEnd - start, downloadedMs: r.duration
        })) };
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => { window.__walkAfterFrames = performance.now(); resolve(); }))));
    result.twoFramesMs = await page.evaluate(() => __walkAfterFrames - __walkLoadStart);
    assert.equal(result.cats, 6);
    assert.deepEqual(result.resources.map(r => r.kind).sort(), f.kinds.slice().sort());
    result.resources.forEach(r => assert.equal(r.encodedBytes, report.assetSets[variant].assets.find(a => a.kind === r.kind).bytes, 'measured actual immutable GLB bytes'));
    if (variant === 'walk') assert(result.models.every(m => m.animated), 'all requested runtime models actually have their mixers');
    assert.deepEqual(test.errors, []); assert.deepEqual(test.external, []);
    report.loads.push({ variant, sample, ...result });
    console.log(JSON.stringify({ variant, sample, readyMs: result.readyMs, twoFramesMs: result.twoFramesMs }));
  } finally { await test.context.close(); }
}
async function frameScenes(browser, server, variant, layout) {
  const test = await f.fresh(browser, { randomSeed: 638471 });
  try {
    await f.start(test, server.url);
    await test.page.waitForFunction(() => __kittens.list.filter(k => ['orange', 'calico', 'black', 'tabby'].includes(k.kind.id)).every(k => k.catModel));
    await test.page.evaluate(layout => {
      __kittens.list.forEach((k, i) => {
        if (layout) { k.x = layout[i].x; k.z = layout[i].z; }
        if (k.catFootprint) k.catFootprint *= 1.3 / k.size;
        k.size = 1.3; k.phase = i * .5; k.fade = 1; k.y = 0;
        k.state = 'idle'; k.timer = 100000; k.tx = k.x; k.tz = k.z; k.crouch = 0; k.curl = 0;
      });
      window.__walkFrameMode = 'idle';
      const pose = GardenCatModels.pose;
      GardenCatModels.pose = function (k, t, dt) {
        const wasMoving = k.moving;
        k.moving = __walkFrameMode === 'walk'; k.catWalkSpeed = .55; k.root.rotation.y = 0;
        // Keep the paired rendering layout fixed while supplying a real-sized
        // travel sample to the distance-driven mixer (not a gameplay benchmark).
        if (k.moving) { k.catWalkX = k.x; k.catWalkZ = k.z - .55 * dt; }
        const value = pose.call(this, k, t, dt);
        k.moving = wasMoving; return value;
      };
    }, layout || null);
    await test.page.waitForTimeout(1800);
    const settled = await test.page.evaluate(() => __kittens.list.map(k => ({ kind: k.kind.id, x: k.x, z: k.z })));
    if (layout) settled.forEach((k, i) => { assert.equal(k.kind, layout[i].kind); assert(Math.hypot(k.x - layout[i].x, k.z - layout[i].z) < .005, 'paired model actors keep the same stationary layout'); });
    for (const mode of ['idle', 'walk']) {
      await test.page.evaluate(mode => { window.__walkFrameMode = mode; }, mode);
      await test.page.waitForTimeout(1800);
      if (mode === 'walk' && variant === 'walk') assert(await test.page.evaluate(() => __kittens.list.filter(k=>k.catModel).every(k=>k.catWalkActive)), 'benchmark renders the active Walk skin');
      const scene = await f.scene(test.page, 5000);
      scene.frameIntervalsMs = f.summarize(scene.frames.map(f => f.interval));
      scene.renderSubmitMs = f.summarize(scene.frames.map(f => f.draw));
      report.scenes.push({ variant, mode, actorLayout: settled, ...scene });
      await test.page.screenshot({ path: f.path.join(output, `performance-${variant}-${mode}.png`) });
      console.log(JSON.stringify({ variant, mode, frameIntervalsMs: scene.frameIntervalsMs, renderSubmitMs: scene.renderSubmitMs }));
    }
    assert.deepEqual(test.errors, []); assert.deepEqual(test.external, []);
    return settled;
  } finally { await test.context.close(); }
}
(async () => {
  const roots = { main: f.path.resolve(baselineRoot), walk: f.site };
  const servers = {}, browser = await f.browser();
  try {
    report.browser = await browser.version();
    for (const [name, root] of Object.entries(roots)) {
      report.assetSets[name] = manifest(root);
      servers[name] = await f.server({ root, spawnSequence: ['orange', 'calico', 'black', 'tabby', 'white', 'glow'] });
    }
    for (let sample = 1; sample <= 3; sample++) {
      const order = sample % 2 ? ['main', 'walk'] : ['walk', 'main'];
      for (const variant of order) await oneLoad(browser, servers[variant], variant, sample);
    }
    report.conditions.frames = 'Seeded phone scene, same six original actors/coats/positions/size1.3 and +Z yaw; five-second samples after1.8-second warmups. Fixture holds actors stationary and selects idle or existing moving display path at0.55; isolates skin/Walk render cost without different travel layouts. Other world animation continues. Not physical-phone FPS.';
    const layout = await frameScenes(browser, servers.main, 'main');
    await frameScenes(browser, servers.walk, 'walk', layout);
    for (const [name, root] of Object.entries(roots)) assert.deepEqual(manifest(root), report.assetSets[name], 'assets/runtime stayed immutable during measurement');
    report.summary = Object.keys(roots).map(variant => {
      const values = report.loads.filter(l => l.variant === variant);
      return { variant, totalBytes: report.assetSets[variant].assets.reduce((n, a) => n + a.bytes, 0),
        readyMs: f.summarize(values.map(v => v.readyMs)), readyRange: [Math.min(...values.map(v => v.readyMs)), Math.max(...values.map(v => v.readyMs))],
        twoFramesMs: f.summarize(values.map(v => v.twoFramesMs)) };
    });
    const before = report.summary.find(s => s.variant === 'main'), after = report.summary.find(s => s.variant === 'walk');
    report.change = { bytes: after.totalBytes - before.totalBytes, readyMs: after.readyMs.median - before.readyMs.median, readyRatio: after.readyMs.median / before.readyMs.median };
    f.fs.writeFileSync(f.path.join(output, 'fast-4g-comparison.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ summary: report.summary, change: report.change, report: f.path.join(output, 'fast-4g-comparison.json') }, null, 2));
  } finally { await browser.close(); for (const server of Object.values(servers)) await server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
