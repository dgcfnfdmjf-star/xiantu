'use strict';
const {test, expect} = require('@playwright/test');

test('slow map frames preserve travel, collision and wild contact', async ({page}) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/game-v2762.html');
  await page.locator('#introSkipChoiceV2898').check();
  await page.locator('#xiantuSafeBootButton').click();
  await page.locator('#playerName').fill('行走回归');
  await page.getByRole('button', {name: '开始修仙', exact: true}).click();

  const result = await page.evaluate(() => {
    closeWorldOverlay();
    player.tutorial.skipped = true;
    player.firstJourneyV28687 = {step: 5};
    closeTutorialBubble();
    tutorialState.active = false;
    player.hp = getMaxHp();

    // Use controlled RAF timestamps with the actual world update, hit tests and combat entry.
    const world = FLAT_WORLD;
    cancelAnimationFrame(world.raf);
    let renders = 0;
    drawFlatWorld = () => { renders++; };
    world.colliders = [];
    world.pois = [];
    world.monsters = [];
    world._regionSpawnPending = 0;
    world.monsterSpawnTimer = 0;
    const start = performance.now();
    const reset = () => {
      world.player.x = world.player.y = 500;
      world.keys = {d: true};
      world.lastTime = world._lastMobileFrame = start;
      renders = 0;
    };
    function frame(time) {
      flatWorldLoop(time);
      cancelAnimationFrame(world.raf);
      world.raf = null;
    }
    function walk(fps) {
      reset();
      for (let i = 1; i <= fps; i++) frame(start + 1000 * i / fps);
      return {distance: world.player.x - 500, renders};
    }

    PERF_CONFIG.mobile = false;
    const normal = walk(60);
    PERF_CONFIG.mobile = true;
    const slow = walk(20);
    swordFlightV2896 = true;
    const fast = walk(20);
    world.colliders = [{x: 590, y: 500, radius: 5}];
    const wall = walk(20);
    world.colliders = [];

    // Dropped seconds in the foreground are bounded. A background interval is discarded entirely.
    reset();
    frame(start + 8000);
    const stalled = world.player.x - 500;
    pauseVisualsV2767();
    world.lastTime -= 15000;
    resumeVisualsV2767();
    const resumedAt = world.lastTime;
    cancelAnimationFrame(world.raf);
    world.keys = {d: true};
    const beforeResume = world.player.x;
    frame(resumedAt + 50);
    const resumed = world.player.x - beforeResume;

    // First 25 ms reaches the 60-unit encounter radius. Stop moving as soon as combat opens.
    reset();
    const monster = {id: 'frame-contact', x: 565, y: 500, radius: 22, speed: 0,
      enemy: {name: '野狼', hp: 60, maxHp: 60, atk: 3, def: 1, gold: 1, exp: 1},
      regionId: currentRegion, dir: {x: 1, y: 0}, dirTimer: 6, alive: true, inCombat: false, battleCooldown: 0};
    world.monsters = [monster];
    world.monsterSpawnTimer = 0;
    frame(start + 50);
    return {normal, slow, fast, wall, stalled, resumed, encounter: {
      state: gameState, selected: currentMonsterRef === monster, x: world.player.x,
      elapsed: world.monsterSpawnTimer, renders
    }};
  });

  expect(result.normal.distance).toBeCloseTo(250);
  expect(result.normal.renders).toBe(60);
  expect(result.slow.distance).toBeCloseTo(250);
  expect(result.slow.renders).toBe(20);
  expect(result.fast.distance).toBeCloseTo(400);
  expect(result.wall.distance).toBeGreaterThan(67.9);
  expect(result.wall.distance).toBeLessThanOrEqual(68);
  expect(result.stalled).toBeCloseTo(40);
  expect(result.resumed).toBeCloseTo(20);
  expect(result.encounter).toMatchObject({state: 'combat', selected: true, renders: 1});
  expect(result.encounter.x).toBeCloseTo(510);
  expect(result.encounter.elapsed).toBeCloseTo(.025);
});
