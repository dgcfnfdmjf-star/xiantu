// Manual measurements in a disposable profile. Start the local game with npm start first.
const {chromium} = require('@playwright/test');
const origin = 'http://127.0.0.1:8765';

function frameStats(samples) {
  function percentiles(values) {
    const sorted = values.sort((a, b) => a - b);
    const at = fraction => +sorted[Math.ceil(sorted.length * fraction) - 1].toFixed(2);
    return {median: at(.5), p95: at(.95)};
  }
  const draws = samples.flatMap(frames => frames.map(([, cost]) => cost));
  const intervals = samples.flatMap(frames => frames.slice(1).map(([t], i) => t - frames[i][0]));
  return {frames: draws.length, drawMs: percentiles(draws), intervalMs: percentiles(intervals)};
}

async function measureMaps(page, switches) {
  const cdp = await page.context().newCDPSession(page);
  await page.evaluate(() => {
    window.probeDraw = drawFlatWorld;
    window.probeFrames = null;
    drawFlatWorld = function(...args) {
      const start = performance.now();
      const result = window.probeDraw.apply(this, args);
      if (window.probeFrames) window.probeFrames.push([start, performance.now() - start]);
      return result;
    };
  });
  const rows = [];
  try {
    for (let i = 0; i <= switches; i++) {
      const region = i % 2 ? 'north' : 'south';
      const released = await page.evaluate(({i, region}) => {
        const old = PERF_CONFIG.staticWorldCanvas;
        if (i) travelToWorldMap(region);
        return i && old ? [old.width, old.height] : null;
      }, {i, region});
      await page.waitForFunction(id => currentRegion === id && wildSceneReadyV286898() && PERF_CONFIG.staticWorldReady, region);
      await page.evaluate(() => { window.probeFrames = []; });
      await page.waitForFunction(() => window.probeFrames.length >= 32);
      const sample = await page.evaluate(() => {
        const frames = window.probeFrames.slice(0, 32);
        window.probeFrames = null;
        const art = Object.values(SCROLL_ART_V2831.wildScenes);
        const world = document.querySelector('#worldCanvas'), terrain = PERF_CONFIG.staticWorldCanvas;
        const requests = performance.getEntriesByType('resource');
        return {frames, canvas2D: world.getContext('2d') instanceof CanvasRenderingContext2D,
          world: [world.width, world.height], terrain: [terrain.width, terrain.height], dpr: world._dpr,
          canvasCount: document.querySelectorAll('canvas').length, buildingCache: BUILDING_ART_V2813.size,
          sceneCount: art.length, sceneRequests: requests.filter(r => art.some(img => img.src === r.name)).length,
          requests: requests.length, places: FLAT_WORLD.pois.length, monsters: FLAT_WORLD.monsters.length};
      });
      await cdp.send('HeapProfiler.collectGarbage');
      const heap = await cdp.send('Runtime.getHeapUsage');
      rows.push({region, released, jsHeapMiB: +(heap.usedSize / 1024 ** 2).toFixed(2), ...sample});
    }
  } finally {
    await page.evaluate(() => { drawFlatWorld = window.probeDraw; delete window.probeDraw; delete window.probeFrames; });
    await cdp.detach();
  }
  const warm = {};
  for (const region of ['north', 'south']) {
    warm[region] = frameStats(rows.slice(1).filter(row => row.region === region).map(row => row.frames));
  }
  return {visits: rows.map(({frames, ...visit}) => ({...visit, ...frameStats([frames])})), warm};
}

async function measureTrails(page) {
  await page.evaluate(() => showAlchemy());
  await page.waitForFunction(() => !!ALCHEMY_STAGE_V2868110.instance);
  // Observe the real trail buffer as the game mounts the stage. Leave the stage code intact.
  await page.evaluate(() => {
    const add = THREE.Scene.prototype.add;
    THREE.Scene.prototype.add = function(...objects) {
      const trail = objects.find(o => o.isPoints && o.material.vertexColors && o.geometry.attributes.position.count === 40);
      if (trail) { window.probeTrail = trail; THREE.Scene.prototype.add = add; }
      return add.apply(this, objects);
    };
    alchemyStageOpenV2868110(false);
  });
  await page.waitForFunction(() => window.probeTrail && ALCHEMY_STAGE_V2868110.instance);
  return page.evaluate(() => {
    const stage = ALCHEMY_STAGE_V2868110.instance;
    const result = {attempted: 5, success: 3, pills: 3, materials: ['灵草', '仙果']};
    const realRAF = window.requestAnimationFrame;
    const oldNow = Object.getOwnPropertyDescriptor(performance, 'now');
    let now = performance.now(), next;
    Object.defineProperty(performance, 'now', {configurable: true, value: () => now});
    window.requestAnimationFrame = callback => { next = callback; return -1; };
    function colored() {
      const colors = window.probeTrail.geometry.attributes.color.array;
      let count = 0;
      for (let i = 0; i < colors.length; i += 3) if (colors[i] || colors[i + 1] || colors[i + 2]) count++;
      return count;
    }
    function advance(ms) { now += ms; next(now); return colored(); }
    try {
      stage.play(result);
      for (let i = 0; i < 30; i++) advance(50);
      const smooth1500 = colored();
      stage.play(result);
      const at500 = advance(500), at1500 = advance(1000), at5200 = advance(3700);
      stage.play(result);
      return {smooth1500, at500, at1500, at5200, replay0: colored(), replay500: advance(500)};
    } finally {
      window.requestAnimationFrame = realRAF;
      if (oldNow) Object.defineProperty(performance, 'now', oldNow);
      else delete performance.now;
    }
  });
}

(async () => {
  const switches = Number(process.argv[2] ?? 12);
  if (!Number.isSafeInteger(switches) || switches < 2) throw Error('Use at least two map switches');
  const browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
    await context.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
    const page = await context.newPage();
    await page.goto(origin + '/game-v2762.html');
    await page.locator('#introSkipChoiceV2898').check();
    await page.locator('#xiantuSafeBootButton').tap();
    await page.locator('#playerName').fill('测量临时');
    await page.getByRole('button', {name: '开始修仙', exact: true}).tap();
    await page.evaluate(() => {
      closeWorldOverlay(); closeTutorialBubble();
      player.tutorial.skipped = true; tutorialState.active = false;
      player.firstJourneyV28687 = {step: 5}; player.level = 3;
    });
    const maps = await measureMaps(page, switches);
    const trails = await measureTrails(page);
    console.log(JSON.stringify({chromium: browser.version(), maps, trails}, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
