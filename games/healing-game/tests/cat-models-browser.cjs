'use strict';

// Real chapter-two integration checks; no external services or real player saves.
// Run after python3 games/healing-game/scripts/build.py:
// node games/healing-game/tests/cat-models-browser.cjs
const assert = require('node:assert/strict');
const f = require('./cat-models-fixture.cjs');
const report = { checks: [], scenes: [] };
let browser;

async function ready(page, except) {
  await page.waitForFunction(except => window.GardenCatModels && window.__kittens.list.length &&
    __kittens.list.filter(k => ['orange', 'calico', 'black', 'tabby'].includes(k.kind.id) && k.kind.id !== except)
      .every(k => k.catModel && k.catVisual && !k.inner.visible), except, { timeout: 30000 });
}

async function choose(page, id, uuid) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = await page.evaluate(({ id, uuid }) => {
      const all = __kittens.list.filter(k => !k.dead && k.state !== 'hug' && k.fade >= .9)
        .map(k => ({ ...__kittens.screenOf(k), uuid: k.root.uuid, id: k.kind.id, state: k.state }));
      return all.filter(k => (!id || k.id === id) && (!uuid || k.uuid === uuid) && k.x > 22 && k.x < innerWidth - 22 && k.y > 230 && k.y < innerHeight - 140 &&
        document.elementFromPoint(k.x, k.y)?.tagName === 'CANVAS')
        .sort((a, b) => b.y - a.y)[0] || null;
    }, { id, uuid });
    if (candidate) return candidate;
    await page.waitForTimeout(150);
  }
  throw Error('No visible canvas target for ' + (id || 'any coat'));
}

async function tap(test, point) {
  if (test.mobile) await test.page.touchscreen.tap(point.x, point.y);
  else await test.page.mouse.click(point.x, point.y);
}

async function twoTap(test, id, uuid) {
  const { page } = test, point = await choose(page, id, uuid);
  const before = await page.evaluate(() => __kittens.state().total);
  await tap(test, point);
  const first = await page.evaluate(uuid => {
    const k = __kittens.list.find(k => k.root.uuid === uuid);
    return { state: k?.state, yarn: !!k?.yarn, total: __kittens.state().total, actual: __kittens.list.filter(k => ['lure', 'play'].includes(k.state)).map(k => k.kind.id) };
  }, point.uuid);
  assert.equal(first.total, before, 'first canvas tap only invites, without score');
  assert(['lure', 'play'].includes(first.state), 'projected model center selects intended kitten: ' + JSON.stringify({ point, first }));
  assert(first.yarn, 'first tap creates yarn');
  const secondPoint = await page.evaluate(uuid => __kittens.screenOf(__kittens.list.find(k => k.root.uuid === uuid)), point.uuid);
  // No timing-window wait: the immediate next input must hug this same cat.
  await tap(test, secondPoint);
  const second = await page.evaluate(uuid => {
    const k = __kittens.list.find(k => k.root.uuid === uuid);
    return { state: k?.state, total: __kittens.state().total, value: k?.kind.value, save: JSON.parse(localStorage.getItem('healingGarden.kittens.v1')) };
  }, point.uuid);
  assert.equal(second.state, 'hug', 'immediate second canvas tap hugs');
  assert.equal(second.total, before + second.value, 'hug grants exactly the original coat value');
  return { point, first, secondPoint, second };
}

async function repeatTapNoScore(test, action) {
  await tap(test, action.secondPoint);
  assert.equal(await test.page.evaluate(() => __kittens.state().total), action.second.total, 'repeated tap cannot score the hugged actor twice');
  // A repeated tap can invite a different overlapping actor. Clear that invitation by
  // leaving/re-entering through the existing chapter lifecycle before the next case.
}

async function chapter(page, n) {
  await page.locator('#kitLevelBtn').click();
  await page.locator('[data-jr-go="' + n + '"]').click();
  await page.waitForFunction(n => __kittens.state().level === n, n);
}

async function clean(test) {
  assert.deepEqual(test.errors, [], 'no uncaught browser errors');
  assert.deepEqual(test.external, [], 'no external requests');
  assert.equal(await test.page.evaluate(() => localStorage.getItem('xiantu_save')), 'CAT_TEST_UNRELATED_SAVE', 'unrelated save retained');
  await test.context.close();
}

async function inspectBounds(page) {
  return page.evaluate(() => __kittens.list.filter(k => k.catModel).map(k => {
    const rootInverse = new THREE.Matrix4().copy(k.root.matrixWorld).invert();
    const point = new THREE.Vector3(), min = new THREE.Vector3(Infinity, Infinity, Infinity), max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    k.root.updateMatrixWorld(true);
    rootInverse.copy(k.root.matrixWorld).invert();
    const meshes = [];
    k.catModel.traverse(node => {
      if (!node.isMesh) return;
      meshes.push({ geometry: node.geometry.uuid, material: node.material.uuid });
      const position = node.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld).applyMatrix4(rootInverse);
        min.min(point); max.max(point);
      }
    });
    return { kind: k.kind.id, min: min.toArray(), max: max.toArray(), size: k.size, rootY: k.root.position.y, jumpY: k.y, footprint: k.catFootprint, meshes };
  }));
}

async function basicAndCache(server, mobile) {
  console.log('Checking ' + (mobile ? 'phone' : 'desktop') + ' models and cache');
  const test = await f.fresh(browser, { mobile, save: { level: 1, total: 0, ended: false, caught: {}, companions: {} } });
  const { page } = test;
  await f.start(test, server.url);
  assert.equal(test.requests.filter(url => /-cat\.glb$/.test(url)).length, 0, 'chapter one does not download cat models');
  await chapter(page, 2);
  await ready(page);
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => __kittens.list.length), mobile ? 6 : 8, 'original live cat population');
  assert.deepEqual([...new Set(test.requests.filter(url => /-cat\.glb$/.test(url)).map(url => url.split('/').at(-1)))].sort(), f.kinds.map(k => k + '-cat.glb').sort(), 'all four and only four model assets requested');
  for (const kind of f.kinds) assert.equal(test.requests.filter(url => url.endsWith('/' + kind + '-cat.glb')).length, 1, 'single cold request per kind, including ambient orange');
  const bounds = await inspectBounds(page);
  for (const cat of bounds) {
    assert(cat.min[1] >= -.002, 'model geometry stays above floor: ' + cat.kind);
    assert(cat.max[1] >= .65 && cat.max[1] <= .75, 'normalized model height: ' + cat.kind);
    assert(cat.rootY >= .25 - .001 && cat.footprint > .1 && cat.footprint < 1.2, 'finite footprint and original ground plane');
  }
  assert(await page.evaluate(() => __catTestAmbient.catModel && !__catTestAmbient.body.visible && __catTestAmbient.root.visible), 'ambient orange replaced in chapter two');
  assert(await page.evaluate(() => {
    const orange = __kittens.list.find(k => k.kind.id === 'orange'), a = [], b = [];
    orange.catModel.traverse(n => { if (n.isMesh) a.push(n); });
    __catTestAmbient.catModel.traverse(n => { if (n.isMesh) b.push(n); });
    return a.length > 0 && a.length === b.length && a.every((node, i) => node !== b[i] && node.geometry === b[i].geometry && node.material === b[i].material);
  }), 'ambient and interactive orange clone the graph and share cached GPU resources');
  const image = f.path.join(f.output, mobile ? 'phone-390x844.png' : 'desktop-1200x900.png');
  await page.screenshot({ path: image });
  const actions = [];
  for (const kind of mobile ? f.kinds : ['orange']) {
    assert(await page.evaluate(kind => __kittens.list.some(k => k.kind.id === kind && k.catModel), kind), 'tested input target uses its loaded GLB');
    const action = await twoTap(test, kind);
    actions.push(action); await repeatTapNoScore(test, action);
    if (mobile && kind !== f.kinds.at(-1)) { await chapter(page, 1); await chapter(page, 2); await ready(page); }
  }
  console.log('  exact two-tap interaction passed');
  await page.waitForTimeout(1400);
  await page.waitForFunction(() => __kittens.list.some(k => k.catVisual && k.state !== 'hug'));
  const posedBefore = await page.evaluate(() => __kittens.list.filter(k => k.catVisual && k.state !== 'hug').map(k => ({ id: k.root.uuid, scaleY: k.catVisual.scale.y, offsetY: k.catVisual.position.y })));
  const scene = await f.scene(page);
  assert(await page.evaluate(before => before.some(old => {
    const k = __kittens.list.find(k => k.root.uuid === old.id);
    return k?.catVisual && (Math.abs(k.catVisual.scale.y - old.scaleY) > .00001 || Math.abs(k.catVisual.position.y - old.offsetY) > .00001);
  }), posedBefore), 'running game changes the actual loaded model transform');
  for (const cat of await inspectBounds(page)) assert(cat.min[1] >= -.002 && cat.rootY >= .249, 'animated model remains above the ground plane');
  scene.intervals = f.summarize(scene.frames.map(x => x.interval));
  scene.drawDurations = f.summarize(scene.frames.map(x => x.draw));
  report.scenes.push({ mobile, bounds, actions, scene, image });

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const frozen = await page.evaluate(() => ({ draws: __catTestDraws, actors: __kittens.list.map(k => ({ id: k.root.uuid, root: k.root.matrix.toArray(), model: k.catVisual?.matrix.toArray(), state: k.state, timer: k.timer })) }));
  await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => ({ draws: __catTestDraws, actors: __kittens.list.map(k => ({ id: k.root.uuid, root: k.root.matrix.toArray(), model: k.catVisual?.matrix.toArray(), state: k.state, timer: k.timer })) })), frozen, 'background freezes draws, actual model transforms and behavior timers');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300);
  assert(await page.evaluate(n => __catTestDraws > n, frozen.draws), 'foreground resumes renderer');
  console.log('  hidden/resume freeze passed');

  const requests = test.requests.filter(url => /-cat\.glb$/.test(url)).length;
  for (let i = 0; i < 3; i++) {
    await chapter(page, 1);
    assert(await page.evaluate(() => !__catTestAmbient.root.visible && __kittens.list.every(k => !k.root.parent.visible)), 'chapter exit hides all cat models');
    await chapter(page, 2);
    await ready(page);
  }
  assert.equal(test.requests.filter(url => /-cat\.glb$/.test(url)).length, requests, 'three re-entries reuse cached model assets');
  const shared = await page.evaluate(() => {
    const kinds = {};
    __kittens.list.filter(k => k.catModel).forEach(k => { (kinds[k.kind.id] ||= []).push(k.catModel); });
    return Object.values(kinds).every(cats => cats.slice(1).every(cat => {
      const a = [], b = [];
      cats[0].traverse(n => { if (n.isMesh) a.push(n); }); cat.traverse(n => { if (n.isMesh) b.push(n); });
      return a.length === b.length && a.every((n, i) => n.geometry === b[i].geometry && n.material === b[i].material && n !== b[i]);
    }));
  });
  assert(shared, 'cloned actors share template geometry/material resources');
  await clean(test);
  console.log('  three cache reentries passed');
  report.checks.push((mobile ? 'phone' : 'desktop') + ': lazy four-coat load, normalized floor bounds, immediate two-tap input, hidden freeze, repeated chapter cache reuse');
}

async function rulesAndFallback() {
  console.log('Checking failed GLB fallback and exact cap/goal/save rules');
  const server = await f.server({ spawnSequence: ['black', 'black', 'orange', 'calico', 'white', 'tabby'] });
  const caught = { orange: 100, calico: 100, black: 100, white: 100, tabby: 100, glow: 100 };
  const test = await f.fresh(browser, { randomSeed: 129771998, save: { level: 2, total: 18, ended: false, caught, companions: { black: 3 } } });
  await test.context.route('**/black-cat.glb', route => route.abort('failed'));
  try {
    await f.start(test, server.url); await ready(test.page, 'black'); await test.page.waitForTimeout(1000);
    assert(await test.page.evaluate(() => __kittens.list.filter(k => k.kind.id === 'black').every(k => !k.catModel && k.inner.visible)), 'failed GLB keeps original interactive cat');
    // Keep the cap fixture visible and stationary. The close black pair reproduces
    // the old helper's third-tap bug: after the first hugs, that ray can hit the second.
    const pair = await test.page.evaluate(() => {
      const positions = [[0, 2], [0, 1.35], [-3, 1.6], [-.5, -2.2], [2.8, 1.3], [-1.4, -3.2]];
      __kittens.list.forEach((k, i) => {
        k.x = positions[i][0]; k.z = positions[i][1]; k.y = 0;
        k.tx = k.x; k.tz = k.z; k.state = 'idle'; k.timer = 1000; k.fade = 1;
      });
      const black = __kittens.list.filter(k => k.kind.id === 'black');
      window.__catTestFifth = black[1];
      return black.map(k => k.root.uuid);
    });
    assert.equal(pair.length, 2, 'cap fixture has two distinct black actors');
    await test.page.waitForFunction(() => __kittens.list.every(k => Math.hypot(k.x - k.root.position.x, k.z - k.root.position.z) < .001));
    const fourth = await twoTap(test, 'black', pair[0]);
    assert.equal(fourth.second.total, 19, 'fourth companion earns its original point');
    assert.equal(fourth.second.save.caught.black, 101, 'legacy lifetime collection is additive');
    assert.equal(fourth.second.save.companions.black, 4, 'fourth companion reaches cap');
    assert(await test.page.evaluate(() => !__catTestFifth.dead && __catTestFifth.state === 'idle'), 'reserved fifth actor remains available after exactly two taps');
    const fifth = await choose(test.page, 'black', pair[1]); await tap(test, fifth);
    assert.notEqual(fifth.uuid, fourth.point.uuid, 'fifth cap check targets the other black actor');
    assert.equal(await test.page.evaluate(() => __catTestFifth.state), 'hug', 'explicit fifth tap reaches the capped actor');
    assert.equal(await test.page.evaluate(() => __kittens.state().total), 19, 'fifth same-coat interaction cannot score');
    assert.match(await test.page.locator('#toast').textContent(), /4次|休息/, 'cap has visible feedback');
    await chapter(test.page, 1); await chapter(test.page, 2);
    const last = await twoTap(test, 'white');
    await repeatTapNoScore(test, last);
    assert.equal(last.second.total, 20, 'unchanged twenty-point goal');
    assert(await test.page.evaluate(() => __kittens.state().ended), 'goal completion persisted');
    await test.page.waitForFunction(() => GardenJourney.unlocked(3));
    await test.page.waitForFunction(() => !document.getElementById('kitEnding').classList.contains('hidden'), null, { timeout: 20000 });
    for (const cat of await inspectBounds(test.page)) assert(cat.min[1] >= -.002 && cat.rootY >= .249, 'gather/sleep finale model remains above the ground plane');
    await test.page.locator('#kitAgain').click();
    const replay = await test.page.evaluate(() => JSON.parse(localStorage.getItem('healingGarden.kittens.v1')));
    assert.equal(replay.total, 0, 'explicit replay resets run points');
    assert.deepEqual(replay.companions, {}, 'explicit replay resets per-coat cap');
    assert.deepEqual(replay.caught, last.second.save.caught, 'replay preserves all six lifetime coats');
    report.rules = { fourth, fifth, last, replay };
    await clean(test);
    report.checks.push('failed GLB playable fallback; fourth/fifth same-coat cap; legacy six-coat saves; goal20/chapter3 unlock/replay');
  } finally { await test.context.close(); await server.close(); }
}

async function rareValues() {
  console.log('Checking unchanged white/glow visuals and values');
  const server = await f.server({ spawnSequence: ['glow', 'white', 'orange', 'calico', 'black', 'tabby'] });
  const test = await f.fresh(browser, { save: { level: 2, total: 0, ended: false, caught: { glow: 70, white: 50 }, companions: {} } });
  try {
    await f.start(test, server.url); await ready(test.page); await test.page.waitForTimeout(1000);
    assert(await test.page.evaluate(() => __kittens.list.filter(k => ['white', 'glow'].includes(k.kind.id)).every(k => !k.catModel && k.inner.visible)), 'white and rare glow retain original visuals');
    const glow = await twoTap(test, 'glow');
    await repeatTapNoScore(test, glow);
    assert.equal(glow.second.total, 3, 'rare glow still gives three points');
    await chapter(test.page, 1); await chapter(test.page, 2);
    const white = await twoTap(test, 'white');
    await repeatTapNoScore(test, white);
    assert.equal(white.second.total, 4, 'white still gives one point');
    assert.equal(white.second.save.caught.glow, 71); assert.equal(white.second.save.caught.white, 51);
    report.rare = { glow, white };
    await clean(test); report.checks.push('white +1 and rare glow +3 with legacy counts retained');
  } finally { await test.context.close(); await server.close(); }
}

async function lateResponses(server) {
  console.log('Checking late async response cleanup and cache reentry');
  const test = await f.fresh(browser, { save: { level: 1, total: 0, ended: false, caught: {}, companions: {} } });
  let release;
  const gate = new Promise(resolve => { release = resolve; }), held = [], finished = [];
  await test.context.route('**/*-cat.glb', async route => {
    held.push(route.request().url()); await gate;
    await route.continue(); finished.push(route.request().url());
  });
  try {
    await f.start(test, server.url);
    await test.page.evaluate(() => {
      window.__catTestDecodeComplete = [];
      const load = THREE.GLTFLoader.prototype.load;
      THREE.GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
        return load.call(this, url, function (gltf) {
          const value = onLoad.apply(this, arguments);
          Promise.resolve().then(() => __catTestDecodeComplete.push(url));
          return value;
        }, onProgress, onError);
      };
    });
    await chapter(test.page, 2);
    for (let i = 0; i < 100 && held.length < 4; i++) await test.page.waitForTimeout(20);
    assert.equal(held.length, 4, 'four cold loads held in flight');
    await chapter(test.page, 1);
    release();
    await test.page.waitForFunction(() => __catTestDecodeComplete.length === 4, null, { timeout: 30000 });
    assert(await test.page.evaluate(() => __kittens.list.every(k => !k.catModel) && !__catTestAmbient.catModel), 'stale async completion after exit attaches no model');
    await chapter(test.page, 2); await ready(test.page);
    assert.equal(held.length, 4, 'reentry reuses completed in-flight cache');
    const victim = await test.page.evaluate(() => {
      const k = __kittens.list.find(k => k.catModel); window.__catTestRemoved = k;
      k.state = 'hug'; k.hugT = 1.3; return k.root.uuid;
    });
    await test.page.waitForFunction(uuid => !__kittens.list.some(k => k.root.uuid === uuid), victim);
    assert(await test.page.evaluate(() => __catTestRemoved.dead && !__catTestRemoved.root.parent), 'removed actor and its model graph leave scene');
    await clean(test); report.checks.push('delayed model responses after chapter exit do not attach; reentry cache; removed actor detaches');
  } finally { release(); await test.context.close(); }
}

(async () => {
  const server = await f.server(); browser = await f.browser();
  try {
    report.browser = await browser.version();
    await basicAndCache(server, false); await basicAndCache(server, true);
    await rulesAndFallback(); await rareValues(); await lateResponses(server);
    f.fs.writeFileSync(f.path.join(f.output, 'browser-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ checks: report.checks, scenes: report.scenes.map(s => ({ mobile: s.mobile, count: s.scene.count, render: s.scene.render, renderer: s.scene.renderer })), report: f.path.join(f.output, 'browser-results.json') }, null, 2));
  } finally { await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
