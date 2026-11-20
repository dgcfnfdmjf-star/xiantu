'use strict';

// Run against the built working site. Only synthetic saves and local assets are used.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '../site/healing-game');
const origin = 'http://garden.test';

async function check(browser, level) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      const asset = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      return route.fulfill({ path: path.join(site, asset) });
    });
    await context.addInitScript(level => {
      if (level) {
        const done = Array.from({ length: level - 1 }, (_, i) => i + 1);
        if (level > 1) localStorage.setItem('hg_level2_unlocked', '1');
        localStorage.setItem('healingGarden.butterflies.v1', JSON.stringify({ total: level === 1 ? 24 : 30, ended: level > 1 }));
        localStorage.setItem('healingGarden.kittens.v1', JSON.stringify({ level, total: level > 2 ? 20 : level === 2 ? 16 : 0, ended: level > 2 }));
        localStorage.setItem('healingGarden.journey.v1', JSON.stringify({ completed: done, lamps: [level >= 3, level >= 3, level > 3],
          chimes: { round: level >= 5 ? 3 : level === 4 ? 2 : 0 }, lotus: { light: level === 5 ? [3, 3, 3, 3, 3, 0] : [] } }));
      }
      if (level === 2) window.requestIdleCallback = undefined;
      const encode = HTMLCanvasElement.prototype.toDataURL;
      window.paperEncodes = 0;
      HTMLCanvasElement.prototype.toDataURL = function () {
        if (this.width === 240 && this.height === 240) window.paperEncodes++;
        return encode.apply(this, arguments);
      };
    }, level);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.waitForFunction(() => window.GardenJourney && GardenJourney.ready && window.__l5Cutscene.ready());
    const papers = () => page.evaluate(() => [1, 2, 3, 4, 5].filter(n =>
      document.getElementById('l' + n + 'csPaper').style.backgroundImage.startsWith('url(')));
    assert.deepEqual(await papers(), [], 'no paper at startup, including near-complete saves');
    assert.equal(await page.evaluate(() => window.paperEncodes), 0);
    await page.locator('#start').click();
    if (level) {
      await page.waitForFunction(n => document.getElementById('l' + n + 'csPaper').style.backgroundImage !== '', level, { timeout: 20000 });
      assert.deepEqual(await papers(), [level], 'only the near-complete chapter prewarms');
    } else {
      await page.waitForTimeout(1500);
      assert.deepEqual(await papers(), [], 'fresh first chapter stays cold after first interaction');
    }
    const selected = level || 5;
    // Cold play and warm play/seek share the same generated bitmap.
    await page.evaluate(n => {
      const film = window['__l' + n + 'Cutscene'];
      film.play({ muted: true });
      film.seek(3);
      film.close();
    }, selected);
    assert.deepEqual(await papers(), [selected]);
    assert.equal(await page.evaluate(() => window.paperEncodes), 1);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
  try {
    for (const level of [0, 1, 2, 3, 4, 5]) {
      await check(browser, level);
      console.log(level ? 'Passed near-completion paper for chapter ' + level : 'Passed fresh start and cold playback');
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
