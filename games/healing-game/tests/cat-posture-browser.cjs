'use strict';

// Run against the working site produced by scripts/build.py. Observe the actual chapter actors.
// A second camera renders just the fur into an alpha target, fixed to the visual's local frame:
// moving the whole actor, moving only the face decals, or changing a bone under unskinned fur cannot pass.
const assert = require('node:assert/strict');
const f = require('./cat-models-fixture.cjs');

function installFurProbe() {
  const T = THREE, size = 192, renderer = __catTestRenderer, scene = GardenClip.world.scene;
  const target = new T.WebGLRenderTarget(size, size, { format: T.RGBAFormat });
  window.furMask = function (visual) {
    let fur;
    visual.traverse(mesh => {
      if (mesh.isSkinnedMesh && mesh.visible && (!fur || mesh.geometry.index.count > fur.geometry.index.count)) fur = mesh;
    });
    const camera = new T.OrthographicCamera(-.49, .49, .49, -.49, .1, 10);
    camera.position.set(1.45, .78, 2.1);
    camera.lookAt(0, .35, 0);
    camera.updateMatrix();
    visual.updateWorldMatrix(true, true);
    camera.matrix.premultiply(visual.matrixWorld);
    camera.matrixAutoUpdate = false;
    camera.layers.set(31);
    const layers = fur.layers.mask, bg = scene.background, previous = renderer.getRenderTarget();
    const color = renderer.getClearColor(new T.Color()), alpha = renderer.getClearAlpha();
    const pixels = new Uint8Array(size * size * 4);
    try {
      fur.layers.enable(31);
      scene.background = null;
      renderer.setClearColor(0, 0);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
    } finally {
      fur.layers.mask = layers;
      renderer.setRenderTarget(previous);
      renderer.setClearColor(color, alpha);
      scene.background = bg;
    }
    return pixels.filter((_, i) => i % 4 === 3);
  };
  window.maskDiff = (a, b) => {
    let changed = 0;
    for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 127) changed++;
    return changed;
  };
}

(async () => {
  const server = await f.server(), browser = await f.browser();
  try {
    const test = await f.fresh(browser, { mobile: false, randomSeed: 7331,
      save: { total: 20, ended: true, level: 5 }, progress: { completed: [1, 2, 3, 4, 5],
        lamps: [true, true, true], chimes: { round: 3 }, lotus: { light: [3, 3, 3, 3, 3, 3] }, snow: { lit: [0, 1], home: [] } } });
    const page = test.page;
    await f.start(test, server.url + '?level=6&l6cutscene=0');
    await page.waitForFunction(() => SnowChapter.debug().kittens.length === 4 && SnowChapter.debug().kittens.every(k => k.model));
    await page.evaluate(installFurProbe);
    const snow = await page.evaluate(() => {
      const world = GardenClip.world;
      const actors = SnowChapter.debug().kittens.map(k => world.island.getObjectByName('snow-kitten-' + k.id));
      const visuals = actors.map(a => a.getObjectByName('BlenderCatVisual'));
      const masks = visuals.map(furMask), changed = masks.map(() => 0);
      const headYaw = visuals.map(() => []);
      for (let frame = 1; frame <= 900; frame++) {
        SnowChapter.update(1 / 60, frame / 60);
        if (frame % 15) continue;
        visuals.forEach((v, i) => {
          headYaw[i].push(v.getObjectByName('Head').rotation.y);
          if (frame % 90 === 0) changed[i] = Math.max(changed[i], maskDiff(masks[i], furMask(v)));
        });
      }
      // Select the waiting orange kitten using the chapter's normal ray hit-test.
      const a = actors[0], point = a.getWorldPosition(new THREE.Vector3());
      point.y += .25;
      point.project(world.camera);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(point, world.camera);
      SnowChapter.tap(ray);
      const start = a.position.clone(), walk = [], rise = [], settle = [];
      let owner;
      const snowWalk = GardenCatModels.snowWalk;
      GardenCatModels.snowWalk = function (cat, ...args) {
        if (cat.root === a) owner = cat;
        return snowWalk.call(this, cat, ...args);
      };
      const weight = () => owner.catStand ?? owner.catWalkWeight;
      const paw = visuals[0].getObjectByName('FrontPawL');
      const tailTip = visuals[0].getObjectByName('TailTip'), tailMid = visuals[0].getObjectByName('TailMid');
      for (let i = 1; i <= 120; i++) {
        SnowChapter.update(1 / 60, 15 + i / 60);
        rise.push(weight());
        if (i > 30) walk.push({ paw: paw.position.z,
          bend: tailMid.quaternion.angleTo(tailTip.quaternion) });
      }
      const traveled = start.distanceTo(a.position);
      for (let i = 1; i <= 30 * 60; i++) {
        SnowChapter.update(1 / 60, 17 + i / 60);
        settle.push(weight());
      }
      GardenCatModels.snowWalk = snowWalk;
      const span = values => Math.max(...values) - Math.min(...values);
      return { visiblePixels: masks.map(m => m.filter(p => p > 127).length), changed,
        headYaw: headYaw.map(span), traveled, rise: rise.filter(w => w > 0 && w < 1).length / 60,
        settle: settle.filter(w => w > 0 && w < 1).length / 60, finalWeight: settle.at(-1), pawRange: span(walk.map(x => x.paw)),
        tailBendRange: span(walk.map(x => x.bend)) };
    });
    assert.deepEqual(test.errors, []);
    assert.deepEqual(test.external, []);
    await test.context.close();
    const stage = await f.fresh(browser, { mobile: false });
    await stage.page.goto(server.url + '?cutscene=1&mute=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await stage.page.waitForFunction(() => window.__l2Cutscene?.stage().blender === 5, null, { timeout: 90000 });
    await stage.page.evaluate(installFurProbe);
    const l2 = await stage.page.evaluate(() => {
      const cs = __l2Cutscene;
      cs.pause();
      const fur = [];
      GardenClip.world.island.traverse(o => { if (o.l2cat && o.getObjectByName('BlenderCatVisual')) fur.push(o.getObjectByName('BlenderCatVisual')); });
      let base, changed = 0;
      for (const t of [18.5, 19, 19.5, 20, 20.5, 21, 21.5]) {
        cs.seek(t);
        GardenPlay.update(0, t, .4);
        if (cs.frame().cats[0].stand > 0) throw Error('orange cat must already be seated');
        const image = furMask(fur[0]);
        if (!base) base = image;
        changed = Math.max(changed, maskDiff(base, image));
      }
      return { visiblePixels: base.filter(p => p > 127).length, changed };
    });
    console.log(JSON.stringify({ snow, l2 }));
    assert.deepEqual(stage.errors, []);
    assert.deepEqual(stage.external, []);
    assert(snow.visiblePixels.every(n => n > 1000) && l2.visiblePixels > 1000, 'actual fur drawn in every probe');
    assert(snow.traveled > .4, 'cat travels down the lit path');
    for (const duration of [snow.rise, snow.settle]) assert(duration >= .3 - 1 / 60 && duration <= .5 + 1 / 60,
      'the snow cat blends both ways in 0.3–0.5 s: ' + JSON.stringify(snow));
    assert.equal(snow.finalWeight, 0, 'the returned cat sits down');
    assert(snow.pawRange > .025, 'Walk advances while the snow cat is traveling');
    assert(snow.tailBendRange > .01, 'walking tail mid and tip bend relative to each other');
    assert(snow.headYaw.every(n => n > .18 && n < .45), 'each seated head turns independently through its resting glance');
    assert(snow.changed.every(n => n > 30), 'every waiting coat moves inside the stationary root');
    assert(l2.changed > 30, 'the seated cutscene fur moves together with the articulated face');
  } finally {
    await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
