// Run against the local development server. Only the browser's ephemeral profile is used.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = new URL(process.argv[2] || 'http://127.0.0.1:8765');
assert.equal(base.hostname, '127.0.0.1');
const route = process.argv[3] || 'skipped';
assert.ok(['guided', 'skipped'].includes(route));
const samplesPerStrategy = 3;
const output = path.resolve(__dirname, `../output/balance/first-battles-${route}.json`);

async function enterWorld(page) {
  await page.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
  await page.goto(new URL('/game-v2762.html', base).href);
  await page.locator('#introSkipChoiceV2898').check();
  await page.locator('#xiantuSafeBootButton').click();
  await page.waitForSelector('html.xiantu-v2762-ready');
  await page.locator('#playerName').fill('首战实测');
  await page.getByRole('button', { name: '开始修仙', exact: true }).click();
  for (const name of [/握紧木牌/, /踏上仙途/]) {
    await page.getByRole('button', { name }).click();
  }
  if (route === 'guided') return finishGuide(page);
  await page.getByRole('button', { name: '略过新手引路' }).click();
  await page.locator('#xtDialogV2868114 [data-xt-dialog="ok"]').click();
}

async function finishGuide(page) {
  const click = name => page.getByRole('button', { name }).click();
  await click('开始引路');
  await page.waitForFunction(() => tutorialState.currentStepId === 'movement');
  const pad = await page.locator('#virtualJoystick').boundingBox();
  const x = pad.x + pad.width / 2;
  const y = pad.y + pad.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 24, y, { steps: 4 });
  await page.mouse.up();
  await page.waitForFunction(() => tutorialState.currentStepId === 'interaction');
  await page.evaluate(() => {
    const p = FLAT_WORLD.player;
    const distance = site => Math.hypot(site.x - p.x, site.y - p.y);
    const sites = [...FLAT_WORLD.pois].sort((a, b) => distance(a) - distance(b));
    sites.some(site => startPointNavigationV28685({ x: site.x, y: site.y, r: 0, silent: true }));
  });
  await page.waitForFunction(() => !!FLAT_WORLD.nearby);
  await page.locator('#touchAction').click();
  await click('开始演武');
  await page.waitForFunction(() => tutorialState.currentStepId === 'combat_attack');
  const choices = page.locator('#combatChoices');
  await choices.getByRole('button', { name: /普攻/ }).click();
  await finishGuideBattle(page);
  await click('打开装备栏');
  await click(/背包装备/);
  await page.locator('[data-bv="toggle"]').filter({ hasText: '布衣' }).click();
  await page.locator('[data-bv="equip"]').click();
  await click('我已明白');
  await page.locator('#equipmentPanel button[aria-label="关闭"]').click();
  await click('前往试手');
  await finishGuideBattle(page);
  await click('穿戴武器');
  await click('配置御剑术');
  await click('挑战山道壮狼');
  await finishGuideBattle(page);
  await click('收好来信');
  await click('返回地图 · 稍后继续');
  assert.ok(await page.evaluate(() => player.equipment.robe === '布衣' && player.equipment.weapon === '木剑' && player.firstJourneyV28687.step === 5));
}

async function finishGuideBattle(page) {
  while (await page.evaluate(() => gameState === 'combat')) {
    await page.waitForFunction(() => gameState !== 'combat' || isPlayerTurn);
    if (await page.evaluate(() => gameState !== 'combat')) break;
    await page.locator('#combatChoices .quick-skill-v286816').filter({ hasText: '御剑术' }).click();
  }
}

async function approachMonster(page, strategy) {
  await page.evaluate(strategy => {
    if (strategy !== 'default-auto') localStorage.setItem('xiantu_battle_presentation_v2756', 'report');
    const panel = document.getElementById('combatPanel');
    const observer = new MutationObserver(() => {
      if (gameState !== 'combat' || panel.classList.contains('hidden')) return;
      window.firstBattleSample = {
        actions: [], start: performance.now(), enemy: currentEnemy.name, enemyHp: currentEnemy.maxHp,
        enemyPhase: currentEnemy._realmPhase, enemyLevel: currentEnemy._realmLevel,
        normal: !!currentMonsterRef && !isBossFight && !isTribulation && !currentEnemy._isElite &&
          !currentEnemy._isTutorial && !currentEnemy._isTaskBattle,
        playerHp: player.hp, playerMp: player.mp, level: player.level, phase: player.phase,
        gear: Object.values(player.equipment).filter(Boolean), pet: player.activePet?.name || null
      };
      observer.disconnect();
      // Observe accepted inputs at the same entry point for automated and manual play.
      const combat = window.combat;
      window.combat = function (action, index) {
        const ready = gameState === 'combat' && isPlayerTurn;
        const name = action === 'skill' ? player.skills[index]?.name : action === 'attack' ? '普攻' : action;
        const result = combat.apply(this, arguments);
        if (ready && !isPlayerTurn) window.firstBattleSample.actions.push(name);
        return result;
      };
      window.addEventListener('xiantu:combat-finishing', () => {
        Object.assign(window.firstBattleSample, {
          elapsedMs: Math.round(performance.now() - window.firstBattleSample.start),
          result: COMBAT_FINISH_V2764.pending.kind, enemyHpAtFinish: currentEnemy.hp, hpAtFinish: player.hp, mpAtFinish: player.mp
        });
      }, { once: true });
    });
    observer.observe(panel, { attributes: true, attributeFilter: ['class'] });

    // Use point navigation and the map's normal collision/encounter processing.
    // Neither participant is teleported, spawned by the probe, or given gear or stats.
    window.sawOrdinaryTarget = false;
    const approach = () => {
      if (gameState !== 'exploring') return clearInterval(timer);
      if (isWorldOverlayOpen()) return;
      const p = FLAT_WORLD.player;
      const distance = m => Math.hypot(m.x - p.x, m.y - p.y);
      const targets = FLAT_WORLD.monsters.filter(m => m.alive && !m.enemy._isElite && m.regionId === currentRegion);
      if (targets.length) window.sawOrdinaryTarget = true;
      targets.sort((a, b) => distance(a) - distance(b));
      targets.some(m => startPointNavigationV28685({ x: m.x, y: m.y, exact: true, silent: true }));
    };
    const timer = setInterval(approach, 800);
    approach();
  }, strategy);
  const prompt = page.locator('#storyPanel:not(.hidden) #taskBattlePromptV2868103[data-kind="wild"]');
  try {
    await page.waitForFunction(() => window.firstBattleSample ||
      document.querySelector('#storyPanel:not(.hidden) #taskBattlePromptV2868103[data-kind="wild"]'), null, { timeout: 30000 });
  } catch (error) {
    if (error.name !== 'TimeoutError') throw error;
    return await page.evaluate(() => window.sawOrdinaryTarget ?
      'no contact with an ordinary target within 30 seconds' : 'no ordinary target appeared within 30 seconds');
  }
  if (await prompt.isVisible()) await prompt.getByRole('button', { name: '仍要出战' }).click();
  await page.waitForFunction(() => !!window.firstBattleSample);
  return null;
}

async function runBattle(browser, strategy) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await enterWorld(page);
    const excluded = await approachMonster(page, strategy);
    if (excluded) return { strategy, excluded };
    if (!await page.evaluate(() => window.firstBattleSample.normal)) {
      return { strategy, excluded: 'first contact was not an ordinary monster', enemy: await page.evaluate(() => window.firstBattleSample.enemy) };
    }

    const choices = page.locator('#combatChoices');
    const attack = choices.getByRole('button', { name: /普攻/ });
    const sword = choices.locator('.quick-skill-v286816:not(:disabled)').filter({ hasText: '御剑术' });
    if (strategy === 'default-auto') {
      await page.waitForFunction(() => !!window.firstBattleSample.result, null, { timeout: 150000 });
    } else {
      for (let turn = 0; turn < 60; turn++) {
        await page.waitForFunction(() => window.firstBattleSample.result || (gameState === 'combat' && isPlayerTurn));
        if (await page.evaluate(() => !!window.firstBattleSample.result)) break;
        const useSkill = strategy === 'sword-first' && await sword.isVisible();
        await (useSkill ? sword : attack).click();
        await page.waitForFunction(() => !isPlayerTurn || !!window.firstBattleSample.result);
      }
    }
    const sample = await page.evaluate(() => {
      const { start, ...data } = window.firstBattleSample;
      return data;
    });
    assert.ok(sample.result, 'Expected a settled combat outcome');
    assert.ok(sample.actions.length, 'Expected at least one resolved player turn');
    return { strategy, rounds: sample.actions.length, ...sample };
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const report = { route, browser: browser.version(), samples: [] };
    fs.mkdirSync(path.dirname(output), { recursive: true });
    for (let i = 0; i < samplesPerStrategy; i++) {
      for (const strategy of ['basic', 'sword-first', 'default-auto']) {
        for (let attempt = 1; ; attempt++) {
          const sample = await runBattle(browser, strategy);
          report.samples.push(sample);
          fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
          console.log(JSON.stringify(sample));
          if (!sample.excluded) break;
          assert.ok(attempt < 5, 'Could not reach an ordinary first opponent in five independent starts');
        }
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
