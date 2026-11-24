const {test, expect} = require('@playwright/test');

test.use({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});

async function openMap(page) {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/game-v2762.html');
  await page.locator('#introSkipChoiceV2898').check();
  await page.locator('#xiantuSafeBootButton').tap();
  await page.locator('#playerName').fill('双指测试');
  await page.getByRole('button', {name: '开始修仙', exact: true}).tap();
  await page.evaluate(() => {
    closeWorldOverlay();
    player.tutorial.skipped = true;
    closeTutorialBubble();
    tutorialState.active = false;
    player.firstJourneyV28687 = {step: 5};
  });
  await page.waitForFunction(() => wildSceneReadyV286898());
  const session = await page.context().newCDPSession(page);
  return (type, ...touchPoints) => session.send('Input.dispatchTouchEvent', {type, touchPoints});
}

async function contact(locator, id, fractionX = .5) {
  const rect = await locator.boundingBox();
  return {id, x: rect.x + rect.width * fractionX, y: rect.y + rect.height / 2};
}

async function expectStopped(page) {
  expect(await page.evaluate(() => {
    const keys = FLAT_WORLD.keys;
    return !keys.joystick && !keys.w && !keys.s && !keys.a && !keys.d && !FLAT_WORLD.target;
  })).toBe(true);
  await expect(page.locator('#virtualJoystick')).not.toHaveClass(/\bactive\b/);
  const position = () => page.evaluate(() => [FLAT_WORLD.player.x, FLAT_WORLD.player.y]);
  const atRelease = await position();
  await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    function next() { if (++frames === 6) resolve(); else requestAnimationFrame(next); }
    requestAnimationFrame(next);
  }));
  expect(await position()).toEqual(atRelease);
}

test('a second finger can interact at the gate while the joystick is held', async ({page}) => {
  const touch = await openMap(page);
  const pad = page.locator('#virtualJoystick');
  const move = await contact(pad, 1, .7);
  for (const end of ['touchEnd', 'touchCancel']) {
    await touch('touchStart', move);
    expect(await page.evaluate(() => FLAT_WORLD.keys.joystick.x)).toBeGreaterThan(0);
    await page.evaluate(type => {
      window.stickRelease = new Promise(resolve => {
        window.addEventListener(type, () => resolve(!FLAT_WORLD.keys.joystick), {once: true});
      });
    }, end === 'touchEnd' ? 'pointerup' : 'pointercancel');
    await touch(end);
    expect(await page.evaluate(() => window.stickRelease)).toBe(true);
    await expectStopped(page);
  }

  await page.evaluate(() => {
    const gate = FLAT_WORLD.pois.find(p => p.id === 'travel_gate');
    FLAT_WORLD.player.x = gate.x;
    FLAT_WORLD.player.y = gate.y + 5;
    window.gateClicks = 0;
    document.querySelector('#touchAction').addEventListener('click', () => window.gateClicks++, true);
  });
  await page.waitForFunction(() => FLAT_WORLD.nearby?.id === 'travel_gate');
  const right = await contact(page.locator('#touchAction'), 2);
  const left = await contact(pad, 1);
  await touch('touchStart', left);
  await touch('touchStart', left, right);
  await touch('touchMove', left, {...right, x: right.x - 60});
  await touch('touchMove', left, right);
  await touch('touchEnd', right);
  expect(await page.evaluate(() => window.gateClicks)).toBe(0);
  await expect(pad).toHaveClass(/\bactive\b/);

  await touch('touchMove', move);
  await touch('touchStart', move, right);
  await touch('touchEnd', right);
  expect(await page.evaluate(() => window.gateClicks)).toBe(1);
  await expect(page.locator('#worldTravelMenuV2880')).toBeVisible();
  await touch('touchEnd');
  await expectStopped(page);
  expect(await page.evaluate(() => window.gateClicks)).toBe(1);
});

test('a held map contact allows one skill tap after a walking encounter', async ({page}) => {
  const touch = await openMap(page);
  // Place a synthetic target in reach of the normal movement/encounter handler.
  await page.evaluate(() => {
    localStorage.setItem('xiantu_battle_presentation_v2756', 'report');
    const p = FLAT_WORLD.player;
    FLAT_WORLD.monsters = [{id: 'touch-wolf', x: p.x + 65, y: p.y, radius: 22, speed: 0,
      enemy: {name: '野狼', hp: 200, maxHp: 200, _realmLevel: 0, _realmPhase: 0, atk: 3, def: 1, gold: 1, exp: 1},
      regionId: currentRegion, dir: {x: 1, y: 0}, dirTimer: 6, alive: true, inCombat: false, battleCooldown: 0}];
  });
  const left = await contact(page.locator('#virtualJoystick'), 1, .82);
  await touch('touchStart', left);
  // The loaded duel canvas changes the vertical position of the skill bar.
  await expect(page.locator('#combatPanel')).toHaveClass(/duel25-panel/);
  const skill = page.locator('#combatChoices .quick-skill-v286816').filter({has: page.getByText('御剑术', {exact: true})});
  await expect(skill).toBeVisible();
  const right = await contact(skill, 2);
  const cost = await page.evaluate(() => player.skills.find(s => s.name === '御剑术').mpCost);
  const before = await page.evaluate(() => player.mp);
  await touch('touchStart', left, right);
  await touch('touchEnd', right);
  expect(await page.evaluate(() => player.mp)).toBe(before - cost);
  await touch('touchEnd');
});
