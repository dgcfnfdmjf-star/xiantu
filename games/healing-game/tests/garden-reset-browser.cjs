'use strict';
const assert = require('node:assert/strict');
const f = require('./cat-models-fixture.cjs');
const out = f.path.join(f.repo, 'output/playwright/garden-reset');
f.fs.mkdirSync(out, { recursive: true });
(async () => {
  const server = await f.server(), browser = await f.browser();
  const reports = [];
  try {
    for (const viewport of [{width:1200,height:900}, {width:390,height:844}, {width:844,height:390}]) {
      const test = await f.fresh(browser, { mobile: viewport.width !== 1200,
        save: { level:2, total:22, ended:true, caught:{orange:7}, companions:{orange:4} },
        progress: { completed:[1,2,3], stars:42, seen:{kittens:['orange']} } });
      const page = test.page; await page.setViewportSize(viewport);
      try {
        await test.context.addInitScript(() => {
          if (sessionStorage.getItem('reset-legacy-fixture')) return;
          sessionStorage.setItem('reset-legacy-fixture','1');
          localStorage.setItem('healingGarden.butterflies.v1', JSON.stringify({total:30,ended:true,caught:{}}));
        });
        await f.start(test, server.url + '?level=2&v=keep-cache-query');
        await page.evaluate(() => {
          localStorage.setItem('healingGarden.future.v8', 'must disappear');
          localStorage.setItem('healingGarden.journey.v1.corrupt-999', 'broken');
          localStorage.setItem('another.garden.settings', 'keep unrelated garden');
          localStorage.setItem('healingGardeners.settings', 'not our namespace');
        });
        await page.locator('#kitLevelBtn').click();
        const reset = page.getByRole('button', { name:'重新开始', exact:true });
        await reset.waitFor({state:'visible'});
        const box = await reset.boundingBox();
        assert(box && box.y >= 0 && box.y + box.height <= viewport.height && box.x >= 0 && box.x + box.width <= viewport.width, 'reset is visible immediately on opening the journal');
        await page.waitForTimeout(700);
        const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
        page.once('dialog', async dialog => {
          assert.equal(dialog.type(), 'confirm');
          assert.match(dialog.message(), /清除全部进度、回到第一关/);
          await dialog.dismiss();
        });
        await reset.click();
        assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))), before, 'cancel preserves every stored byte');
        assert.equal(await page.evaluate(() => GardenReset.pending()), false);
        await page.screenshot({path:f.path.join(out, `${viewport.width}x${viewport.height}-menu.png`)});
        if (viewport.width === 1200) {
          await page.evaluate(() => {
            window.resetStorageRemove = Storage.prototype.removeItem;
            Storage.prototype.removeItem = function(key) {
              if (key === 'healingGarden.kittens.v1') throw new DOMException('denied','SecurityError');
              return resetStorageRemove.call(this,key);
            };
          });
          page.once('dialog',dialog=>dialog.accept());await reset.click();
          assert.match(await page.locator('#journeyResetStatus').textContent(),/未能清除进度/);
          assert.equal(await page.evaluate(()=>GardenReset.pending()),false);
          assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))),before,'failure restores stored progress');
          await page.evaluate(()=>{Storage.prototype.removeItem=resetStorageRemove;delete window.resetStorageRemove;});
        }
        // Queue a real garden save while old cat/journey progress is in memory.
        // The actual pagehide/visibility handlers must not revive either one.
        await page.evaluate(() => {
          if (!__garden.plantRandom()) throw Error('test could not queue a flower save');
        });
        page.once('dialog', dialog => dialog.accept());
        await Promise.all([page.waitForURL(url => !url.searchParams.has('level')), reset.click()]);
        await page.waitForFunction(() => window.GardenJourney && GardenJourney.ready);
        await page.locator('#start').click();
        await page.waitForTimeout(650);
        const fresh = await page.evaluate(() => ({ level:__kittens.state().level, cats:__kittens.state(), bf:__bf.state(),
          flowers:GardenPlay.collection(), unlocks:[2,3,4,5].map(n=>GardenJourney.unlocked(n)),
          keys:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])), query:location.search }));
        assert.equal(fresh.level, 1); assert.equal(fresh.cats.total, 0); assert.equal(fresh.cats.ended, false);
        assert.equal(fresh.bf.total, 0); assert.equal(fresh.bf.ended, false);
        assert.deepEqual(fresh.flowers, []); assert.deepEqual(fresh.unlocks, [false,false,false,false]);
        for (const k of ['hg_level2_unlocked', 'healingGarden.future.v8', 'healingGarden.journey.v1.corrupt-999']) assert.equal(fresh.keys[k], undefined, k);
        assert.equal(fresh.keys.xiantu_save, 'CAT_TEST_UNRELATED_SAVE');
        assert.equal(fresh.keys['another.garden.settings'], 'keep unrelated garden');
        assert.equal(fresh.keys['healingGardeners.settings'], 'not our namespace');
        assert.match(fresh.query, /v=keep-cache-query/);
        for (const [key,value] of Object.entries(fresh.keys)) if (key.startsWith('healingGarden.')) {
          assert(!value.includes('"total":22') && !value.includes('"orange":7') && !value.includes('"stars":42'), 'no old save or backup resurrected: '+key);
        }
        await page.reload(); await page.locator('#start').click();
        assert.equal(await page.evaluate(() => __kittens.state().level), 1, 'second reload stays fresh');
        await page.waitForTimeout(900);
        await page.screenshot({path:f.path.join(out, `${viewport.width}x${viewport.height}-fresh.png`)});
        assert.deepEqual(test.errors, []); assert.deepEqual(test.external, []);
        reports.push({viewport,pass:true});
      } finally { await test.context.close(); }
    }
    console.log(JSON.stringify(reports));
  } finally { await browser.close(); await server.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
