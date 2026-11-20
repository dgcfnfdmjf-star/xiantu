const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, reducedMotion: 'reduce' });

test('a touch player can pack and use the field kit in the landscape battle report', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/game-v2762.html');
  await page.locator('#introSkipChoiceV2898').check();
  await page.locator('#xiantuSafeBootButton').tap();
  await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
  await page.getByRole('button', { name: '开始修仙', exact: true }).tap();
  await page.evaluate(() => {
    player.tutorial.skipped = true;
    player.tutorial.completedSteps = TUTORIAL_ORDER.slice();
    tutorialState.active = false;
    closeTutorialBubble();
    closeWorldOverlay();
    player.inventory = ['小还丹', '聚灵丹'];
  });
  await page.locator('#inventoryToggleBtn').tap();
  const bag = page.locator('#mobileInventoryCard');
  await bag.getByRole('button', { name: /封装行药囊/ }).tap();
  expect(await page.evaluate(() => player.inventory.slice())).toEqual(['行药囊']);
  await bag.getByRole('button', { name: '关闭', exact: true }).tap();

  await page.evaluate(() => {
    startCombat({ name: '山贼', hp: 5000, maxHp: 5000, atk: 2, def: 2, gold: 1, exp: 1, _realmLevel: 0, _realmPhase: 0 });
    setBattlePresentationV2756('report');
    player.hp = getMaxHp() - 35;
    player.mp = getMaxMp() - 8;
    updateCombatUI();
  });
  await page.getByRole('button', { name: /战斗背包/ }).tap();
  const kit = page.locator('#combatItemDrawer').getByRole('button', { name: /行药囊/ });
  await expect(kit).toContainText('实际恢复 30 点气血、8 点灵力');
  // Observe the native tap after the item's handler, before the delayed enemy reply.
  await page.evaluate(() => window.addEventListener('click', () => {
    window.kitTapResult = [player.inventory.slice(), getMaxHp() - player.hp, getMaxMp() - player.mp, isPlayerTurn];
  }, { once: true }));
  await kit.tap();
  expect(await page.evaluate(() => window.kitTapResult)).toEqual([[], 5, 0, false]);
  await page.waitForFunction(() => gameState === 'combat' && isPlayerTurn);
});
