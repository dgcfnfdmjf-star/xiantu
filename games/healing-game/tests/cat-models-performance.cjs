'use strict';

// Isolated diagnostics, not pass/fail FPS targets. Run with the cloud host idle.
// node games/healing-game/tests/cat-models-performance.cjs
// CAT_MODELS_SAMPLES=3 (default); CAT_MODELS_BASELINE_DIR=... enables paired baseline frames.
// CAT_MODELS_HIGH_DETAIL_DIR=... refreshes the approved high-detail frame/load comparison.
// CAT_MODELS_REFERENCE_LAYOUT=... reuses actor positions from a prior diagnostic report.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const f = require('./cat-models-fixture.cjs');
const profiles = [
  { name: 'local-unthrottled', latency: 0, downloadThroughput: -1, uploadThroughput: -1, description: 'Cold local HTTP, CDP throttling disabled' },
  { name: 'fast-4g', latency: 60, downloadThroughput: 9000000 / 8, uploadThroughput: 1500000 / 8, description: 'CDP emulation: 9 Mbps down, 1.5 Mbps up, 60 ms request latency' },
  { name: 'slow-4g', latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8, description: 'CDP emulation: 1.6 Mbps down, 750 kbps up, 150 ms request latency' }
];
const samples = Math.max(1, Number(process.env.CAT_MODELS_SAMPLES) || 3);
const report = { conditions: { samples, device: '390 × 844 CSS pixels, DPR 2, touch/mobile emulation', browserMode: 'Headless system Chromium', cache: 'Fresh browser context per sample; browser cache disabled by CDP; each GLB served with Cache-Control: no-store', clock: 'performance.now(): chapter-two entry to all live requested models plus ambient attached', decode: 'Attach time minus GLB responseEnd includes parse, image decode, normalization and JavaScript scheduling. The two-RAF checkpoint includes subsequent browser scheduling/rendering; it does not isolate GPU upload time.', limitation: 'Cloud SwiftShader/software rendering and emulated network; these are not physical iPhone timings or physical mobile FPS.' }, profiles, loads: [], scenes: [] };
let browser;

function assetManifest(root) {
  return f.kinds.map(kind => {
    const bytes = f.fs.readFileSync(f.path.join(root, 'cats', kind + '-cat.glb'));
    return { kind, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  });
}

async function oneLoad(server, profile, sample, variant = 'models') {
  const test = await f.fresh(browser, { save: { level: 1, total: 0, ended: false, caught: {}, companions: {} } });
  const { page } = test;
  try {
    await f.start(test, server.url);
    await page.waitForTimeout(500);
    const session = await test.context.newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Network.emulateNetworkConditions', { offline: false, latency: profile.latency, downloadThroughput: profile.downloadThroughput, uploadThroughput: profile.uploadThroughput, connectionType: 'cellular4g' });
    await page.evaluate(() => {
      performance.clearResourceTimings();
      window.__catTestReadyAt = {};
      const add = THREE.Object3D.prototype.add;
      THREE.Object3D.prototype.add = function (object) {
        const value = add.apply(this, arguments);
        if (object?.name === 'BlenderCatVisual') {
          const k = __kittens.list.find(k => k.root === this);
          const kind = k ? k.kind.id : 'ambient-orange';
          if (!__catTestReadyAt[kind]) __catTestReadyAt[kind] = performance.now();
        }
        return value;
      };
      window.__catTestEnterAt = performance.now();
      __kittens.setLevel(2);
    });
    await page.waitForFunction(() => ['orange', 'calico', 'black', 'tabby', 'ambient-orange'].every(k => __catTestReadyAt[k]) &&
      __kittens.list.filter(k => ['orange', 'calico', 'black', 'tabby'].includes(k.kind.id)).every(k => k.catModel), null, { timeout: 60000 });
    const result = await page.evaluate(() => {
      const start = __catTestEnterAt, last = Math.max(...Object.values(__catTestReadyAt));
      const assets = performance.getEntriesByType('resource').filter(r => /-cat\.glb$/.test(r.name)).map(r => {
        const kind = r.name.match(/\/([^/]+)-cat\.glb$/)[1];
        return { kind, encodedBytes: r.encodedBodySize, transferredBytes: r.transferSize, startAfterEntryMs: r.startTime - start, responseEndAfterEntryMs: r.responseEnd - start, downloadMs: r.responseEnd - r.startTime, attachAfterEntryMs: __catTestReadyAt[kind] - start, responseEndToAttachMs: __catTestReadyAt[kind] - r.responseEnd };
      });
      return { allAttachedMs: last - start, assets, ambientAttachedMs: __catTestReadyAt['ambient-orange'] - start, liveCats: __kittens.list.length };
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => { window.__catTestFirstFrameAt = performance.now(); resolve(); }))));
    result.twoAnimationFramesAfterReadyMs = await page.evaluate(() => __catTestFirstFrameAt - __catTestEnterAt);
    assert.equal(result.liveCats, 6, 'mobile original count');
    assert.deepEqual(result.assets.map(a => a.kind).sort(), f.kinds.slice().sort(), 'cold four-model resource timing');
    result.assets.forEach(asset => assert.equal(asset.encodedBytes, report.assetSets[variant].find(a => a.kind === asset.kind).bytes, 'downloaded bytes match the frozen served asset'));
    assert.deepEqual(test.errors, []); assert.deepEqual(test.external, []);
    report.loads.push({ variant, profile: profile.name, sample, ...result });
    console.log(JSON.stringify({ variant, profile: profile.name, sample, allAttachedMs: result.allAttachedMs, bytes: result.assets.reduce((n, a) => n + a.encodedBytes, 0) }));
  } finally { await test.context.close(); }
}

async function frameSample(server, mobile, label, layout) {
  // Model collision footprints settle first; their stationary layout is also safe
  // for the smaller original cats. Reuse it in the paired baseline scene.
  const test = await f.fresh(browser, { mobile, randomSeed: 528401 });
  try {
    await f.start(test, server.url);
    if (label !== 'baseline') await test.page.waitForFunction(() => __kittens.list.filter(k => ['orange', 'calico', 'black', 'tabby'].includes(k.kind.id)).every(k => k.catModel));
    await test.page.evaluate(layout => {
      __kittens.list.forEach((k, i) => {
        if (layout) { k.x = layout[i].x; k.z = layout[i].z; }
        if (k.catFootprint) k.catFootprint *= 1.3 / k.size;
        k.size = 1.3; k.phase = i * .5; k.fade = 1; k.y = 0;
        k.state = 'idle'; k.timer = 1000000; k.crouch = 0; k.curl = 0;
        k.tx = k.x; k.tz = k.z;
      });
    }, layout || null);
    await test.page.waitForTimeout(1800);
    const value = await f.scene(test.page, 5000);
    value.actorLayout = await test.page.evaluate(() => __kittens.list.map(k => ({ kind: k.kind.id, x: k.x, z: k.z, size: k.size, phase: k.phase, state: k.state })));
    if (layout) value.actorLayout.forEach((actor, i) => {
      assert.equal(actor.kind, layout[i].kind);
      assert(Math.hypot(actor.x - layout[i].x, actor.z - layout[i].z) < .005, 'paired actors retain matching positions');
    });
    value.frameIntervalsMs = f.summarize(value.frames.map(f => f.interval));
    value.renderSubmitMs = f.summarize(value.frames.map(f => f.draw));
    value.errors = test.errors; value.external = test.external;
    const image = f.path.join(f.output, label + '-' + (mobile ? 'phone' : 'desktop') + '-measured.png');
    await test.page.screenshot({ path: image });
    report.scenes.push({ label, mobile, image, ...value });
    assert.equal(value.count, mobile ? 6 : 8); assert.deepEqual(test.errors, []); assert.deepEqual(test.external, []);
    return value.actorLayout;
  } finally { await test.context.close(); }
}

(async () => {
  const fixedCoats = ['orange', 'calico', 'black', 'tabby', 'white', 'glow', 'orange', 'calico'];
  let server = null, baseline = null, high = null, highSite = null;
  try {
    server = await f.server({ spawnSequence: fixedCoats });
    const baselineRoot = process.env.CAT_MODELS_BASELINE_DIR;
    baseline = baselineRoot ? await f.server({ root: baselineRoot, spawnSequence: fixedCoats }) : null;
    const referencePath = process.env.CAT_MODELS_REFERENCE_LAYOUT;
    const reference = referencePath ? JSON.parse(f.fs.readFileSync(referencePath, 'utf8')) : null;
    const highAssets = process.env.CAT_MODELS_HIGH_DETAIL_DIR;
    report.assetSets = { models: assetManifest(f.site) };
    report.runtimeSha256 = crypto.createHash('sha256').update(f.fs.readFileSync(f.path.join(f.site, 'index.html'))).digest('hex');
    if (highAssets) {
      highSite = f.path.join(f.output, 'high-detail-current-site');
      f.fs.mkdirSync(highSite, { recursive: true });
      f.fs.cpSync(f.site, highSite, { recursive: true });
      for (const kind of f.kinds) f.fs.copyFileSync(f.path.join(highAssets, kind + '-cat.glb'), f.path.join(highSite, 'cats', kind + '-cat.glb'));
      assert.equal(crypto.createHash('sha256').update(f.fs.readFileSync(f.path.join(highSite, 'index.html'))).digest('hex'), report.runtimeSha256, 'high and final runtime bytes match');
      report.assetSets['high-detail-current'] = assetManifest(highSite);
      high = await f.server({ root: highSite, spawnSequence: fixedCoats });
    }
    browser = await f.browser();
    report.browser = await browser.version();
    report.conditions.frameScene = 'Seeded scenery, fixed coat sequence and size1.3; cats held idle by synthetic fixture. Final-model settled positions reused by baseline (asserted within0.005 island units). Five-second frame sample after1.8-second warmup. Unrelated world motion remains active.';
    if (reference) report.conditions.referenceLayout = 'Actor positions copied from ' + referencePath + ' for both final and baseline scenes; matching asserted within 0.005 island units.';
    report.conditions.coldDefinition = 'Browser HTTP cache cold; local server and operating-system file cache may already be warm.';
    report.conditions.poseLimit = 'Actor positions, sizes and coat order match; yaw and exact animation time are not reproduced. Chromium process/GPU caches may be warm.';
    for (const mobile of [false, true]) {
      const referenceScene = reference?.scenes.find(scene => scene.label === 'models' && scene.mobile === mobile);
      if (reference) assert(referenceScene?.actorLayout?.length === (mobile ? 6 : 8), 'reference layout has the expected actor population');
      const highLayout = high ? await frameSample(high, mobile, 'high-detail-current', referenceScene?.actorLayout) : null;
      const layout = await frameSample(server, mobile, 'models', referenceScene?.actorLayout || highLayout);
      if (baseline) await frameSample(baseline, mobile, 'baseline', layout);
    }
    for (const profile of profiles) for (let sample = 1; sample <= samples; sample++) {
      if (high) await oneLoad(high, profile, sample, 'high-detail-current');
      await oneLoad(server, profile, sample);
    }
    assert.deepEqual(assetManifest(f.site), report.assetSets.models, 'final assets remained unchanged throughout measurement');
    assert.equal(crypto.createHash('sha256').update(f.fs.readFileSync(f.path.join(f.site, 'index.html'))).digest('hex'), report.runtimeSha256, 'runtime remained frozen throughout measurement');
    if (highSite) {
      assert.deepEqual(assetManifest(highSite), report.assetSets['high-detail-current'], 'high-detail assets remained unchanged throughout measurement');
      assert.equal(crypto.createHash('sha256').update(f.fs.readFileSync(f.path.join(highSite, 'index.html'))).digest('hex'), report.runtimeSha256, 'high-detail runtime remained frozen throughout measurement');
    }
    report.summary = Object.keys(report.assetSets).flatMap(variant => profiles.map(profile => ({ variant, profile: profile.name, modelReadyMs: f.summarize(report.loads.filter(l => l.variant === variant && l.profile === profile.name).map(l => l.allAttachedMs)), twoAnimationFramesAfterReadyMs: f.summarize(report.loads.filter(l => l.variant === variant && l.profile === profile.name).map(l => l.twoAnimationFramesAfterReadyMs)) })));
    f.fs.writeFileSync(f.path.join(f.output, 'performance-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ summary: report.summary, scenes: report.scenes.map(s => ({ label: s.label, viewport: s.viewport, count: s.count, render: s.render, frameIntervalsMs: s.frameIntervalsMs, renderSubmitMs: s.renderSubmitMs, renderer: s.renderer })), report: f.path.join(f.output, 'performance-results.json') }, null, 2));
  } finally { if (browser) await browser.close(); if (server) await server.close(); if (baseline) await baseline.close(); if (high) await high.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
