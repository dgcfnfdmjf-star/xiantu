'use strict';

// Actual Three.js skinning and chapter-two movement; synthetic saves, local assets only.
// Run after scripts/build.py: node games/healing-game/tests/cat-walk-browser.cjs
const assert = require('node:assert/strict');
const f = require('./cat-models-fixture.cjs');
const output = f.path.join(f.repo, 'output/playwright/cat-walk');
f.fs.mkdirSync(output, { recursive: true });
const report = { checks: [], scenes: [] };
// Skeleton matrices are Float32 on the GPU. A microunit covers matrix roundoff
// when breathing/play offsets change while the bone pose returns to rest.
const REST_EPSILON = 1e-6;

function sampleModel(kind) {
  const boundsOnly = typeof kind === 'object' && kind.boundsOnly;
  if (boundsOnly) kind = kind.kind;
  const k = __kittens.list.find(k => k.kind.id === kind && k.catModel);
  __catTestScene.updateMatrixWorld(true);
  k.catModel.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(k.catModel.matrixWorld).invert();
  const vertex = new THREE.Vector3(), meshes = [], bones = [];
  let minY = Infinity, maxRadius = 0;
  k.catModel.traverse(node => {
    if (node.isBone && !boundsOnly) bones.push({ name: node.name, uuid: node.uuid, p: node.position.toArray(), q: node.quaternion.toArray(), s: node.scale.toArray() });
    if (!node.isMesh) return;
    if (node.isSkinnedMesh) node.skeleton.update();
    const attr = node.geometry.attributes.position, positions = [], pawSides = [];
    for (let i = 0; i < attr.count; i++) {
      let pawSide = -1;
      if (node.isSkinnedMesh && !boundsOnly) {
        const weights = node.geometry.attributes.skinWeight, joints = node.geometry.attributes.skinIndex;
        for (const get of ['getX', 'getY', 'getZ', 'getW']) {
          const name = node.skeleton.bones[joints[get](i)].name;
          if (weights[get](i) > .9 && /^FrontPaw[.]?[LR]$/.test(name)) pawSide = name.endsWith('L') ? 0 : 1;
        }
      }
      if (!boundsOnly) pawSides.push(pawSide);
      vertex.fromBufferAttribute(attr, i);
      if (node.isSkinnedMesh) __catTestSkinVertex(node, i, vertex);
      vertex.applyMatrix4(node.matrixWorld).applyMatrix4(inverse);
      minY = Math.min(minY, vertex.y); maxRadius = Math.max(maxRadius, Math.hypot(vertex.x, vertex.z));
      if (!boundsOnly) positions.push(...vertex.toArray());
    }
    meshes.push({ name: node.name, skinned: !!node.isSkinnedMesh, positions, pawSides });
  });
  return { kind, x: k.x, z: k.z, moving: k.moving, state: k.state, yaw: k.root.rotation.y, speed: k.catWalkSpeed,
    active: k.catWalkActive, weight: k.catWalkWeight, actionTime: k.catWalkAction.time, timeScale: k.catWalkAction.getEffectiveTimeScale(),
    actualSpeed: k.catWalkActualSpeed, duration: k.catWalkAction.getClip().duration, stride: k.catWalkStride, scale: k.catWalkScale, size: k.size, footprint: k.catFootprint, minY, maxRadius, meshes, bones };
}
function maxDifference(a, b) {
  assert.equal(a.meshes.length, b.meshes.length);
  let difference = 0;
  a.meshes.forEach((mesh, i) => {
    assert.equal(mesh.name, b.meshes[i].name);
    assert.equal(mesh.positions.length, b.meshes[i].positions.length);
    mesh.positions.forEach((v, n) => { difference = Math.max(difference, Math.abs(v - b.meshes[i].positions[n])); });
  });
  return difference;
}
function pawMarkers(rest, pose) {
  const fur = rest.meshes.findIndex(m => /Fur|articulated_contact_surfaces$/.test(m.name));
  assert(fur >= 0, 'fur surface exists');
  const before = rest.meshes[fur].positions, after = pose.meshes[fur].positions;
  const paw = [{ sum: [0, 0, 0], count: 0 }, { sum: [0, 0, 0], count: 0 }];
  for (let i = 0; i < before.length; i += 3) {
    if (before[i + 1] > .085 || before[i + 2] < .115 || Math.abs(before[i]) < .025 || Math.abs(before[i]) > .13) continue;
    // The seated tail curls beside the right front paw. Exclude that surface
    // from the paw landmark instead of mistaking its tail motion for a footstep.
    const side = rest.meshes[fur].pawSides[i / 3];
    if (side < 0) continue;
    const p = paw[side]; p.count++;
    for (let j = 0; j < 3; j++) p.sum[j] += after[i + j];
  }
  paw.forEach(p => assert(p.count >= 8, 'visible front paw has enough independently sampled skin vertices'));
  return paw.map(p => p.sum.map(v => v / p.count));
}
async function poseAt(page, kind, phase, boundsOnly = false) {
  await page.evaluate(({ kind, phase }) => {
    const k = __kittens.list.find(k => k.kind.id === kind && k.catModel);
    k.state = 'roam'; k.moving = true; k.catWalkSpeed = .55;
    k.catWalkX = k.x; k.catWalkZ = k.z - .055;
    GardenCatModels.pose(k, 0, .1);
    k.catWalkAction.setEffectiveWeight(1); k.catWalkAction.time = phase * k.catWalkAction.getClip().duration;
    k.catMixer.update(0); k.catModel.updateWorldMatrix(true, true);
  }, { kind, phase });
  return page.evaluate(sampleModel, boundsOnly ? { kind, boundsOnly: true } : kind);
}
async function stop(page, kind, state = 'idle') {
  await page.evaluate(({ kind, state }) => {
    const k = __kittens.list.find(k => k.kind.id === kind && k.catModel);
    k.state = state; k.moving = false;
    GardenCatModels.pose(k, 0, .1); GardenCatModels.pose(k, .1, .1);
  }, { kind, state });
  return page.evaluate(sampleModel, kind);
}
async function hidden(page, value) {
  await page.evaluate(value => {
    if (value) Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    else delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  }, value);
}
async function checkScene(browser, server, mobile) {
  const test = await f.fresh(browser, { mobile, randomSeed: 638471 });
  const { page } = test, label = mobile ? 'phone' : 'desktop';
  try {
    await f.start(test, server.url);
    await page.waitForFunction(() => __kittens.list.every(k => k.catModel && k.catMixer && k.catWalkAction));
    const savedBefore = await page.evaluate(() => localStorage.getItem('healingGarden.kittens.v1'));
    const ownership = await page.evaluate(() => __kittens.list.map(k => {
      const bones = []; k.catModel.traverse(n => { if (n.isBone) bones.push(n.uuid); });
      return { id: k.root.uuid, kind: k.kind.id, mixerRoot: k.catMixer.getRoot().uuid, model: k.catModel.uuid, bones };
    }));
    const ids = ownership.flatMap(k => k.bones);
    assert.equal(new Set(ids).size, ids.length, 'each clone owns independent bone objects');
    ownership.forEach(k => assert.equal(k.mixerRoot, k.model, 'each actor mixer controls its own model'));
    await page.evaluate(() => {
      const spots = [[0, .8], [-2.5, 0], [2.5, 0], [-2.5, 2], [2.5, 2], [0, -2.4], [-2.4, -2], [2.4, -2]];
      __kittens.list.forEach((k, i) => { k.state = 'idle'; k.timer = 1000; k.fade = 1; k.y = 0; k.x = k.tx = spots[i][0]; k.z = k.tz = spots[i][1]; });
      const k = __kittens.list.find(k => k.kind.id === 'orange');
      k.x = 0; k.z = .8; k.tx = 0; k.tz = 2.4; k.yaw = 0; k.state = 'roam'; k.timer = 10;
    });
    await page.waitForFunction(() => {
      const k = __kittens.list.find(k => k.kind.id === 'orange'); return k.moving && k.catWalkWeight === 1;
    });
    const movingA = await page.evaluate(sampleModel, 'orange');
    await page.waitForFunction(before => {
      const k = __kittens.list.find(k => k.kind.id === 'orange');
      const phase = (k.catWalkAction.time - before.actionTime + before.duration) % before.duration;
      return k.moving && Math.hypot(k.x - before.x, k.z - before.z) > .07 && phase > before.duration * .2 && phase < before.duration * .45;
    }, { x: movingA.x, z: movingA.z, actionTime: movingA.actionTime, duration: movingA.duration });
    const movingB = await page.evaluate(sampleModel, 'orange');
    assert(movingB.moving && Math.hypot(movingB.x - movingA.x, movingB.z - movingA.z) > .04, 'original roam movement still advances');
    assert.equal(movingB.speed, .55, 'existing roam speed drives cadence');
    assert(Math.abs(movingB.timeScale - movingB.actualSpeed * movingB.duration / (movingB.stride * movingB.scale * movingB.size)) < 1e-8, 'cadence follows distance actually traveled without changing movement');
    assert(maxDifference(movingA, movingB) > .008, 'loaded GLB surface genuinely articulates while moving');
    assert(Math.abs(movingB.yaw) < .03 && movingB.z > movingA.z, 'unchanged +Z model front follows +Z movement');
    await page.screenshot({ path: f.path.join(output, label + '-moving.png') });
    await hidden(page, true);
    const paused = await page.evaluate(sampleModel, 'orange');
    await page.waitForTimeout(250);
    const stillPaused = await page.evaluate(sampleModel, 'orange');
    assert.equal(stillPaused.actionTime, paused.actionTime, 'background freezes mixer time');
    assert.equal(maxDifference(paused, stillPaused), 0, 'background freezes actual skinned surface');
    for (const kind of f.kinds) await stop(page, kind);
    const rest = {};
    for (const kind of f.kinds) rest[kind] = await page.evaluate(sampleModel, kind);
    const phases = [];
    for (const kind of f.kinds) {
      const first = await poseAt(page, kind, .25), second = await poseAt(page, kind, .75);
      const leftA = pawMarkers(rest[kind], first), leftB = pawMarkers(rest[kind], second);
      const contrastA = leftA[0][2] - leftA[1][2], contrastB = leftB[0][2] - leftB[1][2];
      assert(contrastA * contrastB < 0 && Math.abs(contrastA - contrastB) > .025, `${kind}: front paws alternate fore/aft positions ${JSON.stringify({leftA,leftB,contrastA,contrastB,meshes:rest[kind].meshes.map(m=>m.name)})}`);
      const seamA = await poseAt(page, kind, 0), seamB = await poseAt(page, kind, 1 - 1e-6);
      assert(maxDifference(seamA, seamB) < .0001, `${kind}: actual skinned geometry closes the loop`);
      let minimum = Infinity, radius = 0;
      for (let phase = 0; phase < 96; phase++) {
        const pose = await poseAt(page, kind, phase / 96, true);
        minimum = Math.min(minimum, pose.minY); radius = Math.max(radius, pose.maxRadius);
        assert(pose.maxRadius * pose.scale * pose.size <= pose.footprint + .002, `${kind}: actual walk fits its derived collision footprint`);
      }
      assert(minimum >= -.002, `${kind}: actual animated skin remains above ground, minimum ${minimum}`);
      // Ordinary starts and special-state stops use complete poses; partial
      // action weights are intentionally unsupported for these corrective skins.
      for (const phase of [.125, .375, .625, .875]) {
        await stop(page, kind);
        const pose = await poseAt(page, kind, phase);
        assert.equal(pose.weight, 1);
        assert(pose.minY >= -.002, `${kind}: starting full Walk remains above ground`);
        const seated = await stop(page, kind);
        assert.equal(seated.weight, 0);
        assert(maxDifference(seated, rest[kind]) < REST_EPSILON);
      }
      const otherKind = f.kinds.find(x => x !== kind);
      assert(maxDifference(rest[otherKind], await page.evaluate(sampleModel, otherKind)) < REST_EPSILON, 'animating one actor never deforms another');
      const arrived = await stop(page, kind);
      assert(!arrived.active && maxDifference(arrived, rest[kind]) < REST_EPSILON, `${kind}: ordinary stop restores exact seated rest`);
      for (const state of ['hop', 'hug', 'sleep', 'play']) {
        await poseAt(page, kind, .2);
        const special = await stop(page, kind, state);
        assert(!special.active && maxDifference(special, rest[kind]) < REST_EPSILON, `${kind}: ${state} never retains walking articulation; active=${special.active}, maxDelta=${maxDifference(special,rest[kind])}`);
      }
      await stop(page, kind);
      phases.push({ kind, minY: minimum, maxRadius: radius, pawQuarter: leftA, pawThreeQuarter: leftB, seamDifference: maxDifference(seamA, seamB), surfaceChange: maxDifference(first, second) });
      console.log('  ' + label + ' ' + kind + ': loop, floor, stop and special states passed');
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('healingGarden.kittens.v1')), savedBefore, 'visual animation tests do not write gameplay saves');
    assert.equal(await page.evaluate(() => localStorage.getItem('xiantu_save')), 'CAT_TEST_UNRELATED_SAVE');
    await hidden(page, false);
    await page.evaluate(() => {
      __kittens.list.forEach(k => { k.state = 'idle'; k.timer = 1000; k.y = 0; });
      const k = __kittens.list.find(k => k.kind.id === 'orange');
      k.x = 0; k.z = .8; k.tx = 0; k.tz = 2.4; k.yaw = 0; k.state = 'roam'; k.timer = 10;
    });
    await page.waitForFunction(() => __kittens.list.find(k => k.kind.id === 'orange').catWalkWeight === 1);
    async function headPoint() {
      return page.evaluate(() => {
        const k = __kittens.list.find(k => k.kind.id === 'orange');
        k.catModel.updateWorldMatrix(true, true);
        let nose; k.catModel.traverse(n => { if (n.isMesh && /nose/i.test(n.name)) nose = n; });
        if (!nose) throw Error('Actual visible nose mesh is required for input test');
        const point = new THREE.Vector3(), vertex = new THREE.Vector3(), a = nose.geometry.attributes.position;
        if (nose.isSkinnedMesh) nose.skeleton.update();
        for (let i = 0; i < a.count; i++) { vertex.fromBufferAttribute(a, i); if (nose.isSkinnedMesh) __catTestSkinVertex(nose, i, vertex); point.add(vertex.applyMatrix4(nose.matrixWorld)); }
        point.multiplyScalar(1 / a.count).project(__catTestCamera);
        return { x: (point.x + 1) / 2 * innerWidth, y: (1 - point.y) / 2 * innerHeight, uuid: k.root.uuid };
      });
    }
    const walkingHead = await headPoint();
    assert.equal(await page.evaluate(p => document.elementFromPoint(p.x, p.y)?.tagName, walkingHead), 'CANVAS', 'moving cat head is visibly clickable');
    const tap = async p => mobile ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y);
    await tap(walkingHead);
    await page.waitForFunction(uuid => { const k = __kittens.list.find(k => k.root.uuid === uuid); return k && ['play', 'lure'].includes(k.state); }, walkingHead.uuid);
    assert.equal(await page.evaluate(() => __kittens.state().total), 0, 'first moving-head canvas tap only invites');
    await page.waitForFunction(uuid => !__kittens.list.find(k => k.root.uuid === uuid).catWalkActive, walkingHead.uuid);
    await tap(await headPoint());
    assert.equal(await page.evaluate(() => __kittens.state().total), 1, 'second actual head tap hugs with unchanged score');
    await page.waitForFunction(uuid => { const k = __kittens.list.find(k => k.root.uuid === uuid); return k && k.state === 'hug' && !k.catWalkActive; }, walkingHead.uuid);
    if (mobile) {
      await page.locator('#kitLevelBtn').tap(); await page.locator('[data-jr-go="1"]').tap();
    } else {
      await page.locator('#kitLevelBtn').click(); await page.locator('[data-jr-go="1"]').click();
    }
    assert(await page.evaluate(() => __kittens.list.every(k => !k.catWalkActive)), 'chapter exit stops all Walk actions');
    assert.deepEqual(test.errors, [], 'no browser errors'); assert.deepEqual(test.external, [], 'no external requests');
    report.scenes.push({ label, viewport: mobile ? '390x844 DPR2' : '1200x900 DPR1', ownership, phases, movement: { before: [movingA.x, movingA.z], after: [movingB.x, movingB.z], speed: movingB.speed, actionTimeScale: movingB.timeScale } });
    report.checks.push(label + ': actual roam articulation/+Z; independent skin clones; opposite paw steps; exact loop/rest; 96 ground samples per coat; special-state/background/exit stop; untouched saves before real moving-head two-tap input');
    console.log('PASS ' + label + ' animated cats');
  } finally { await test.context.close(); }
}
(async () => {
  const server = await f.server({ spawnSequence: ['orange', 'calico', 'black', 'tabby', 'orange', 'calico', 'black', 'tabby'] });
  const browser = await f.browser();
  try {
    report.browser = await browser.version();
    await checkScene(browser, server, false); await checkScene(browser, server, true);
    f.fs.writeFileSync(f.path.join(output, 'browser-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ checks: report.checks, report: f.path.join(output, 'browser-results.json') }, null, 2));
  } finally { await browser.close(); await server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
