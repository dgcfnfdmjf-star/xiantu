'use strict';

const assert = require('node:assert/strict');
const fixture = require('./cat-models-fixture.cjs');

async function accessibleButtons(page) {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = await session.send('Accessibility.getFullAXTree');
    return nodes.filter(node => !node.ignored && node.role.value === 'button').map(node => node.name.value);
  } finally { await session.detach(); }
}

async function keyboardChapter(browser, url, level) {
  const { page, context, errors, external } = await fixture.fresh(browser, {
    save: { level, total: 0, ended: false, caught: {}, companions: {} },
    progress: { completed: [1, 2, 3].slice(0, level - 1), chimes: { round: level === 5 ? 3 : 0 } },
    randomSeed: 12345
  });
  try {
    if (level === 1) await page.addInitScript(() => {
      localStorage.setItem('healingGarden.v3', JSON.stringify({ flowers: [{ x: 2, z: 1, id: 'daisy' }] }));
    });
    await page.goto(url);
    await page.waitForFunction(() => window.GardenJourney?.ready);
    assert.equal(await page.evaluate(() => __kittens.state().level), level);
    assert.deepEqual(await accessibleButtons(page), ['轻触开始 ♪'], 'only Start is exposed above the loaded chapter');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'startButton');
    await page.keyboard.press(level % 2 ? 'Enter' : 'Space');
    assert.equal(await page.locator('#start').evaluate(el => el.inert), true);
    if (level > 3) return;

    assert.equal(await page.evaluate(() => document.activeElement.closest('details')?.id), 'sceneTargets');
    await page.keyboard.press('Enter');
    const actions = page.locator('#sceneTargets button:visible:not([aria-disabled="true"])');
    await actions.first().waitFor();
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const label = await focused.innerText();
    if (level === 1) {
      const flowers = page.locator('#pcount');
      const before = await flowers.textContent();
      assert.match(before, /1 \/ 20/);
      await page.locator('#btnRestart').evaluate(button => { button.focus(); button.click(); });
      assert.equal(await flowers.textContent(), before, 'a hidden flower replay cannot clear a garden');
      assert.equal(await focused.innerText(), label, 'a hidden replay cannot steal focus');
      const points = await page.evaluate(name => __bf.species.find(s => '捕捉' + s.name === name)?.rare ? 3 : 1, label);
      assert.match(label, /^捕捉/);
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => __bf.state().total), points);
      assert.equal(await page.evaluate(() => __bf.state().individuals), 1);
    } else if (level === 2) {
      assert.match(label, /^邀请/);
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => __kittens.state().total), 0);
      assert.equal(await focused.innerText(), label.replace('邀请', '抱抱'));
      const points = await page.evaluate(name => __kittens.kinds.find(k => '邀请' + k.name === name).value, label);
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => __kittens.state().total), points);
    } else {
      // The first lamp accepts peach and amber. A mismatch and a repeat during
      // cooldown must give the same result as hitting those wisps on the island.
      const miss = page.getByRole('button', { name: '拾取露珠萤' });
      const match = page.getByRole('button', { name: '拾取桃霞萤' });
      await miss.press('Enter');
      assert.equal(await page.evaluate(() => __journey.state().progress.charge), 0);
      await match.press('Space');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => __journey.state().progress.charge), 1);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#sceneTargets').evaluate(el => el.open), false);
    const names = await accessibleButtons(page);
    assert(!names.some(name => /重新收集|重新种一座|轻触开始/.test(name)), 'closed replay and start controls are excluded');
  } finally {
    await context.close();
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
  }
}

(async () => {
  const server = await fixture.server(), browser = await fixture.browser();
  try {
    for (let level = 1; level <= 5; level++) {
      await keyboardChapter(browser, server.url, level);
      console.log('PASS chapter ' + level + ' keyboard entry and accessible controls');
    }
  } finally { await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
