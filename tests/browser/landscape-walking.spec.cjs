const {test, expect} = require('@playwright/test');

test.use({viewport: {width: 844, height: 390}, isMobile: true, hasTouch: true});

test('landscape walking keeps health, the objective and touch controls within reach', async ({page}) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/game-v2762.html');
  await page.locator('#introSkipChoiceV2898').check();
  await page.locator('#xiantuSafeBootButton').click();
  await page.locator('#playerName').fill('横屏行走');
  await page.getByRole('button', {name: '开始修仙', exact: true}).click();
  await page.evaluate(() => {
    closeWorldOverlay();
    player.tutorial.skipped = true;
    closeTutorialBubble();
    tutorialState.active = false;
    player.firstJourneyV28687 = {step: 5};
    updateWorldHUD();
  });

  const hud = page.locator('.world-hud');
  const mini = page.locator('#worldMinimap');
  const quest = page.locator('#xtQuestBar');
  const joystick = page.locator('#virtualJoystick');
  const interact = page.locator('#touchAction');
  await expect(mini).toBeVisible();
  await expect(quest).toBeVisible();
  const pad = await joystick.boundingBox();
  const button = await interact.boundingBox();
  const session = await page.context().newCDPSession(page);
  const x = await page.evaluate(() => FLAT_WORLD.player.x);
  await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [
    {x: pad.x + pad.width * .70, y: pad.y + pad.height / 2}
  ]});
  await expect.poll(() => page.evaluate(() => FLAT_WORLD.player.x)).toBeGreaterThan(x);
  await expect(mini).toBeHidden();
  await expect(hud).toHaveText(/^\s*气血\s*\d+\s*\/\s*\d+\s*$/u, {useInnerText: true});
  expect((await hud.boundingBox()).width).toBeLessThanOrEqual(200);
  expect((await hud.boundingBox()).height).toBeLessThanOrEqual(40);
  await expect(quest.locator('.xt-questbar__step')).toBeVisible();
  expect(await joystick.boundingBox()).toEqual(pad);
  expect(await interact.boundingBox()).toEqual(button);
  await interact.tap({trial: true});
  await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});

  await expect(mini).toBeVisible();
  await expect(page.locator('#worldMpText')).toBeVisible();
  // A classic-theme character still has a current goal while walking.
  await page.evaluate(() => XT_UI.setTheme(false));
  await page.keyboard.down('a');
  await expect(mini).toBeHidden();
  const classicGoal = page.locator('#firstPathV2901:visible, #taskTrackerCompact .task-track-step:visible');
  await expect(classicGoal).toHaveCount(1);
  await page.keyboard.up('a');
  await expect(mini).toBeVisible();
  await page.locator('#panelToggleBtn').tap();
  await expect(page.locator('#characterPanel')).toBeVisible();
  await page.getByRole('button', {name: '关闭角色面板'}).tap();

  // Keep the on-map interaction wired to the gate, including when tapped in mid-stride.
  await page.evaluate(() => {
    const gate = FLAT_WORLD.pois.find(p => p.id === 'travel_gate');
    FLAT_WORLD.player.x = gate.x;
    FLAT_WORLD.player.y = gate.y + 5;
  });
  await page.waitForFunction(() => FLAT_WORLD.nearby?.id === 'travel_gate');
  await page.keyboard.down('d');
  await expect(mini).toBeHidden();
  await interact.tap();
  await page.keyboard.up('d');
  await expect(page.locator('#worldTravelMenuV2880')).toBeVisible();
  await page.evaluate(() => closeWorldOverlay());

  // Rotating to portrait restores its usual HUD even during movement.
  await page.setViewportSize({width: 390, height: 844});
  await page.keyboard.down('d');
  await expect.poll(() => page.evaluate(() => FLAT_WORLD.moving)).toBe(true);
  await expect(mini).toBeVisible();
  await expect(page.locator('#panelToggleBtn')).toBeVisible();
  await page.keyboard.up('d');
});
