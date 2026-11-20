'use strict';

// Run against the working site after building. All game input uses Tab, Enter,
// Space or Escape; evaluate only reads gameplay state. Each chapter gets a fresh save.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '../site/healing-game');
const target = '#gardenTargetsPanel button';
async function tabTo(page, selector) {
  for (let i = 0; i < 50; i++) {
    if (await page.evaluate(s => document.activeElement.matches(s), selector)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Keyboard could not reach ' + selector);
}

async function check(browser, chapter) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const errors = [];
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      const file = path.resolve(site, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      if (url.origin !== 'http://garden.test' || !file.startsWith(site + path.sep) || !fs.existsSync(file)) return route.abort();
      return route.fulfill({ path: file });
    });
    if (chapter > 1) await page.addInitScript(level => {
      localStorage.setItem('hg_level2_unlocked', '1');
      localStorage.setItem('healingGarden.butterflies.v1', JSON.stringify({ ended: true, total: 30 }));
      localStorage.setItem('healingGarden.kittens.v1', JSON.stringify({ level, total: level === 3 ? 20 : 0, ended: level === 3 }));
    }, chapter);
    await page.goto('http://garden.test/');
    await tabTo(page, '#startButton');
    await page.keyboard.press('Enter');
    await page.waitForFunction(n => document.body.dataset.gardenLevel === String(n) && document.querySelector('#start').classList.contains('hidden'), chapter);
    await tabTo(page, '#gardenTargetsToggle');
    await page.keyboard.press('Space');
    assert.equal(await page.getAttribute('#gardenTargetsToggle', 'aria-expanded'), 'true');

    const panel = page.getByRole('group', { name: '选择' + ['捕蝶', '猫咪', '拾萤'][chapter - 1] + '目标' });
    const bounds = await panel.boundingBox();
    assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390 && bounds.y + bounds.height <= 844);
    assert.match(await panel.ariaSnapshot(), /button "(捕捉|邀请|拾取)/, 'Named controls appear in the accessibility tree');
    if (chapter === 1) {
      await page.waitForSelector(target + '[aria-disabled="false"]', { timeout: 30000 });
      await tabTo(page, target + '[aria-disabled="false"]');
      const id = await page.locator(':focus').getAttribute('data-target-kind');
      const before = await page.evaluate(() => __bf.state().total);
      await page.keyboard.press('Enter');
      const { total, points, caught } = await page.evaluate(kind => ({
        total: __bf.state().total, points: __bf.species.find(b => b.id === kind).rare ? 3 : 1, caught: __bf.state().caught[kind]
      }), id);
      assert.equal(total, before + points);
      assert.equal(caught, 1);
    } else if (chapter === 2) {
      await page.waitForSelector(target + '[aria-disabled="false"]');
      await tabTo(page, target + '[aria-disabled="false"]');
      const id = await page.locator(':focus').getAttribute('data-target-kind');
      const k = await page.evaluate(kind => __kittens.kinds.find(s => s.id === kind), id);
      assert.match(await page.locator(':focus').textContent(), /邀请/);
      await page.keyboard.down('Enter');
      await page.keyboard.down('Enter');
      await page.keyboard.up('Enter');
      assert.equal(await page.evaluate(() => __kittens.state().total), 0, 'An invitation gives no points');
      assert.equal(await page.locator(':focus').textContent(), '抱抱' + k.name, 'Same named button follows the invitation');
      assert.equal(await page.locator(target + '[aria-disabled="false"]').count(), 1);
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => __kittens.state().total), k.value);
      assert.equal(await page.evaluate(kind => __kittens.state().caught[kind], id), 1);
    } else {
      const dew = target + '[data-target-kind="dew"][aria-disabled="false"]';
      const peach = target + '[data-target-kind="peach"][aria-disabled="false"]';
      await page.waitForSelector(dew);
      await tabTo(page, dew);
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => __journey.state().progress.charge), 0, 'Mismatched colour preserves the original rule');
      assert.match(await page.getByRole('status').filter({ hasText: '不加分' }).textContent(), /露珠萤/);
      await tabTo(page, peach);
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(() => __journey.state().progress.charge), 1);
      assert.equal(await page.evaluate(() => __journey.state().progress.caught.peach), 1);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.getAttribute('#gardenTargetsToggle', 'aria-expanded'), 'false');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'gardenTargetsToggle');
    assert.deepEqual(errors, []);
    console.log('Chapter ' + chapter + ' keyboard controls passed');
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  try { for (const chapter of [1, 2, 3]) await check(browser, chapter); }
  finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
