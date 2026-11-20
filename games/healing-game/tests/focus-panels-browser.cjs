'use strict';
const assert = require('node:assert/strict');
const f = require('./cat-models-fixture.cjs');

async function tabTo(page, id) {
  for (let n = 0; n < 30; n++) {
    if (await page.evaluate(() => document.activeElement.id) === id) return;
    await page.keyboard.press('Tab');
  }
  throw Error('Could not reach #' + id + ' by Tab');
}

(async () => {
  const server = await f.server();
  const browser = await f.browser();
  try {
    const test = await f.fresh(browser, { save: {level:1, total:4, caught:{orange:4}}, progress:{completed:[1]} });
    const page = test.page;
    assert.deepEqual(page.viewportSize(), {width:390, height:844});
    await test.context.addInitScript(() => {
      localStorage.setItem('healingGarden.butterflies.v1', JSON.stringify({total:9, caught:{pink:9}}));
    });
    await page.goto(process.env.FOCUS_TEST_URL || server.url);
    await page.waitForFunction(() => window.GardenJourney?.ready);
    await tabTo(page, 'startButton');
    assert.equal(await page.getByRole('button', {name:'轻触开始 ♪'}).count(), 1);
    const cdp = await test.context.newCDPSession(page);
    const ax = await cdp.send('Accessibility.getFullAXTree');
    const axButtons = ax.nodes.filter(n => !n.ignored && n.role.value === 'button').map(n => n.name.value);
    assert.deepEqual(axButtons, ['轻触开始 ♪'], 'the native accessibility tree excludes background controls');
    await cdp.detach();
    assert.equal(await page.getByRole('button', {name:'重新种一座花园'}).count(), 0);
    await page.keyboard.press('Shift+Tab');
    await tabTo(page, 'startButton');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('#start').inert);

    await tabTo(page, 'kitLevelBtn');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement.id === 'journeyClose');
    assert.equal(await page.getByRole('dialog', {name:'浮岛手账'}).count(), 1);
    await page.keyboard.press('Shift+Tab');
    assert(await page.evaluate(() => document.querySelector('#journeyPanel').contains(document.activeElement)));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement.id === 'kitLevelBtn');

    const protectedProgress = await page.evaluate(() => {
      __garden.plantRandom();
      function state() {
        return [__bf.state().total, __kittens.state().total, __garden.count()];
      }
      const before = state();
      for (const id of ['btnRestart', 'bfAgain', 'kitAgain']) document.getElementById(id).click();
      return {before, after:state()};
    });
    assert(protectedProgress.before.every(n => n > 0), 'seeded progress must be nonempty');
    assert.deepEqual(protectedProgress.before, protectedProgress.after, 'hidden replay must not alter progress');
    await page.evaluate(() => __l5Cutscene.play({source:'preview', muted:true}));
    await page.waitForFunction(() => document.activeElement.id === 'l5csSkip');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement.id === 'l5csGo');
    await page.waitForTimeout(750); // The separate Continue press has an intentional guard.
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.activeElement.id === 'kitLevelBtn');
    assert.deepEqual(test.errors, []);
    console.log('PASS 390x844 keyboard start, journal focus/return, hidden replays, cutscene skip/continue');
  } finally {
    await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
