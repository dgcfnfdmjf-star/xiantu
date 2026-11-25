'use strict';
const assert = require('node:assert/strict');
const f = require('./cat-models-fixture.cjs');
const output = f.path.join(f.repo, 'output/playwright/codex-ui');

// Take a second frame with only the lettering transparent. Compare each ink
// pixel to the paper at the same position, including the locked card's alpha.
async function statusContrast(page, png) {
  const paper = await page.screenshot({scale:'css', style:'#kitSub, #kitGrid small { color: transparent !important; }'});
  return page.evaluate(async sources => {
    const frames = await Promise.all(sources.map(async src => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d', {willReadFrequently:true});
      ctx.drawImage(image, 0, 0);
      return ctx;
    }));
    function linear(x) {
      const s = x / 255;
      return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
    }
    return Array.from(document.querySelectorAll('#kitSub, #kitGrid small'), el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const ratios = Array.from(range.getClientRects(), rect => {
        const x = Math.ceil(rect.left), y = Math.ceil(rect.top);
        const [ink, paper] = frames.map(ctx =>
          ctx.getImageData(x, y, Math.floor(rect.right) - x, Math.floor(rect.bottom) - y).data);
        function luminance(pixels, i) {
          return .2126 * linear(pixels[i]) + .7152 * linear(pixels[i + 1]) + .0722 * linear(pixels[i + 2]);
        }
        const values = [];
        for (let i = 0; i < ink.length; i += 4) {
          const a = luminance(ink, i), b = luminance(paper, i);
          values.push((Math.max(a, b) + .05) / (Math.min(a, b) + .05));
        }
        values.sort((a, b) => a - b);
        return values[Math.floor(values.length * .95)]; // solid strokes, excluding isolated extrema
      });
      return { text: el.textContent, ratio: Math.min(...ratios) };
    });
  }, [png, paper].map(frame => 'data:image/png;base64,' + frame.toString('base64')));
}

async function scrollBook(page, mobile) {
  const box = await page.locator('#bfPages').boundingBox();
  const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height * .75);
  if (mobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x, y}]});
    for (let dy = 32; dy <= 256; dy += 32) {
      await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x, y:y - dy}]});
    }
    await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 750);
  }
  await page.waitForFunction(() => {
    const pages = document.getElementById('bfPages');
    return pages.scrollTop > 0 && pages.scrollHeight - pages.clientHeight - pages.scrollTop <= 1;
  });
}

async function check(browser, url, mobile) {
  const name = mobile ? 'phone' : 'desktop';
  const test = await f.fresh(browser, {
    mobile, randomSeed: 41,
    progress: {completed:[1, 2, 3], lamps:[true, true, true], chimes:{round:3}, lotus:{light:[3, 3, 3, 3, 3, 3]}},
    save: {level:1, total:3, caught:{orange:2, black:1}, companions:{orange:1}}
  });
  const page = test.page;
  const activate = selector => mobile ? page.locator(selector).tap() : page.locator(selector).click();
  const capture = stage => page.screenshot({path:f.path.join(output, name + '-' + stage + '.png'), scale:'css'});
  const dialog = title => page.getByRole('dialog', {name:title, exact:true}).waitFor();
  const focusReturns = () => page.waitForFunction(() => document.activeElement.id === 'gpBookBtn');
  async function chapter(n) {
    await activate('#kitLevelBtn');
    await activate('[data-jr-go="' + n + '"]');
    await page.waitForFunction(n => __kittens.state().level === n && !GardenJourney.blocked(), n);
  }
  try {
    if (!mobile) await page.setViewportSize({width:1440, height:900});
    await page.goto(url);
    await page.waitForFunction(() => window.GardenJourney?.ready);
    const hints = await page.locator('#start ul').innerText();
    assert.match(hints, mobile ? /双指旋转/ : /右键拖动旋转，滚轮缩放/);
    assert.doesNotMatch(hints, mobile ? /右键/ : /双指/);
    await capture('start');
    // The breathing button animates continuously around its stationary center.
    const start = await page.locator('#startButton').boundingBox();
    const center = [start.x + start.width / 2, start.y + start.height / 2];
    if (mobile) await page.touchscreen.tap(...center);
    else await page.mouse.click(...center);

    await activate('#gpBookBtn');
    await dialog('蝴蝶图鉴');
    assert.equal(await page.locator('#bfGrid .bf-cell').count(), 12);
    await activate('#bfFlowers');
    await dialog('花之图鉴');
    await activate('#gpClose');
    await activate('#gpBookBtn');
    await dialog('蝴蝶图鉴');
    await activate('#bfClose');
    await focusReturns();

    await chapter(2);
    await activate('#gpBookBtn');
    await dialog('小猫图鉴');
    const waitForBook = () => page.waitForFunction(() =>
      getComputedStyle(document.getElementById('bfCodex')).opacity === '1' &&
      document.activeElement.id === 'bfClose');
    await waitForBook();
    assert.match(await page.locator('#kitSub').textContent(), /已遇见 2 \/ 6 种/);
    assert.equal(await page.locator('#kitGrid .locked img').count(), 4);
    const ratios = await statusContrast(page, await capture('book'));
    assert.equal(ratios.length, 7);
    for (const item of ratios) assert.ok(item.ratio >= 4.5, name + ' ' + JSON.stringify(item));

    const close = page.locator('#bfClose');
    const firstBox = await close.boundingBox();
    await scrollBook(page, mobile);
    assert.deepEqual(await close.boundingBox(), firstBox, 'close stays beside the title while pages scroll');
    assert.equal(await close.evaluate(el => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
    }), true);
    await capture('scrolled');
    await activate('#bfClose');
    await focusReturns();
    await activate('#gpBookBtn');
    await dialog('小猫图鉴');
    await waitForBook();
    assert.equal(await page.locator('#bfPages').evaluate(el => el.scrollTop), 0);
    const progress = await page.locator('#kitSub').boundingBox(), pages = await page.locator('#bfPages').boundingBox();
    assert.ok(progress.y >= pages.y && progress.y + progress.height <= pages.y + pages.height);
    await capture('reopen');
    if (!mobile) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'bfPages');
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Enter');
    } else await activate('#bfClose');
    await focusReturns();

    // A semantic button activation need not move the browser's DOM focus.
    await page.locator('#kitLevelBtn').focus();
    await page.locator('#gpBookBtn').evaluate(button => button.click());
    await dialog('小猫图鉴');
    await waitForBook();
    await page.keyboard.press('Enter');
    await focusReturns();

    await chapter(1);
    await activate('#gpBookBtn');
    await dialog('蝴蝶图鉴');
    assert.equal(await page.locator('#kitSection h3').textContent(), '小猫图鉴');
    await activate('#bfClose');
    for (const [n, label] of [[3, '星萤'], [4, '音符'], [5, '月莲'], [6, '雪灯']]) {
      await chapter(n);
      assert.ok((await page.locator('#gpBookBtn').innerText()).includes(label));
      await activate('#gpBookBtn');
      await dialog('浮岛手账');
      assert.equal(await page.locator('[data-jr-tab="collection"]').getAttribute('aria-selected'), 'true');
      await activate('#journeyClose');
    }
    assert.deepEqual(test.errors, []);
    assert.deepEqual(test.external, []);
    console.log('PASS', name, ratios.map(item => item.text + ' ' + item.ratio.toFixed(2)).join(' | '));
  } finally {
    await test.context.close();
  }
}

(async () => {
  f.fs.mkdirSync(output, {recursive:true});
  const site = await f.server(), browser = await f.browser();
  try {
    for (const mobile of [false, true]) await check(browser, site.url, mobile);
  } finally {
    await browser.close();
    await site.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
