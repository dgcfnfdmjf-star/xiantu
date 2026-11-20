'use strict';

const assert = require('node:assert/strict');
const f = require('./cat-models-fixture.cjs');
const journey = 'healingGarden.journey.v1', cats = 'healingGarden.kittens.v1';

(async () => {
  const server = await f.server(), browser = await f.browser(), errors = [];
  async function setup(saved, disableLocks = false) {
    const context = await browser.newContext({viewport:{width:800,height:680},reducedMotion:'reduce'});
    await context.route('**/*', r => new URL(r.request().url()).origin === new URL(server.url).origin ? r.continue() : r.abort());
    context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
    await context.addInitScript(({seed, disableLocks}) => {
      if (disableLocks) Object.defineProperty(navigator, 'locks', {value:undefined});
      if (location.protocol !== 'http:' || localStorage.getItem('test-seeded')) return;
      for (const [key, value] of Object.entries(seed)) localStorage.setItem(key,value);
      localStorage.setItem('test-seeded','yes');
    }, {seed:saved, disableLocks});
    return context;
  }
  async function open(context) {
    const p = await context.newPage();
    await p.goto(server.url);
    await p.waitForFunction(() => window.GardenJourney?.ready);
    return p;
  }
  async function settled(page) {
    await page.evaluate(() => navigator.locks.request('healingGarden.progress', () => {}));
  }
  async function stored(page, key) {
    return page.evaluate(k => [localStorage.getItem(k),localStorage.getItem(k+'.bak')],key);
  }
  try {
    const legacy = JSON.stringify({completed:[1,2,3], lamps:[true,true,true], chimes:{round:2,step:3}});
    const context = await setup({
      [journey]:legacy,
      [cats]:JSON.stringify({level:4,ended:true,total:20}), hg_level2_unlocked:'1'
    });
    const a = await open(context), b = await open(context);
    await settled(a); await settled(b);
    assert.deepEqual(await stored(a,journey),[legacy,null], 'normalizing a legacy save does not rotate a backup');
    await a.locator('#start').click(); await b.locator('#start').click();
    // Hold both writes behind the same lock, so neither tab can notice the
    // other's revision via storage events until after both inputs are queued.
    await a.evaluate(() => new Promise(ready => {
      navigator.locks.request('healingGarden.progress', () => new Promise(release => {
        window.releaseTestLock = release; ready();
      }));
    }));
    await a.locator('#chimeKey5').click();
    await b.locator('#chimeKey0').click();
    await a.evaluate(() => window.releaseTestLock());
    await settled(a);
    const win = await stored(a,journey);
    assert.deepEqual(win.map(raw => JSON.parse(raw).chimes.round), [3,2]);
    await b.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    // A stale tab attempts a real change as well as both lifecycle callbacks.
    await b.locator('#chimeKey0').click();
    await b.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    await settled(b);
    assert.deepEqual(await stored(b,journey), win);
    await b.goto('about:blank'); await b.close();
    await a.reload(); await a.waitForFunction(() => window.GardenJourney?.ready);
    assert.equal(await a.evaluate(() => __journey.state().progress.chimes.round),3);
    assert.deepEqual(await stored(a,journey),win);
    const stale = await open(context);
    await a.locator('#start').click();
    await a.locator('#kitLevelBtn').click();
    a.once('dialog', dialog => dialog.accept());
    await a.getByRole('button', {name:'重新开始',exact:true}).click();
    await a.waitForFunction(() => window.GardenJourney?.ready && __kittens.state().level === 1);
    await stale.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new PageTransitionEvent('pagehide')); });
    await settled(stale); await stale.close();
    assert.deepEqual(await stored(a,journey),[null,null]);
    assert.deepEqual(await stored(a,cats),[null,null]);
    await context.close();
    console.log('PASS fourth-chapter clear, stale tab navigation/close and reload, reset barrier');

    const handoff = await setup({[journey]:JSON.stringify({completed:[1,2,3],lamps:[true,true,true],
      memories:['lamp0','lamp1','lamp2','voyage'],chimes:{round:2,step:3}}), [cats]:'{"level":4,"total":20,"ended":true}', hg_level2_unlocked:'1'});
    const writer = await open(handoff), keeper = await handoff.newPage();
    await keeper.route('**/hold', r => r.fulfill({contentType:'text/html',body:'<title>lock holder</title>'}));
    await keeper.goto(server.url+'hold');
    await keeper.evaluate(() => new Promise(ready => {
      navigator.locks.request('healingGarden.progress', () => new Promise(release => {
        window.releaseTestLock = release; ready();
      }));
    }));
    await writer.locator('#start').click(); await writer.locator('#chimeKey5').click();
    assert.equal(await writer.evaluate(() => __journey.state().progress.chimes.round), 3);
    assert.equal(JSON.parse((await stored(writer,journey))[0]).chimes.round, 2);
    await writer.goto('about:blank'); await writer.close();
    const resumed = await open(handoff);
    assert.equal(await resumed.evaluate(() => __journey.state().progress.chimes.round), 3);
    await keeper.evaluate(() => window.releaseTestLock());
    await settled(resumed);
    assert.deepEqual((await stored(resumed,journey)).map(raw => JSON.parse(raw).chimes.round),[3,2]);
    assert.equal(await resumed.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('healingGarden.pending.')).length),0);
    await handoff.close();
    console.log('PASS close while a commit is waiting for a lock, then resume in a new tab');

    const bad = '{"total":19,';
    const corrupt = await setup({[cats]:bad});
    const kitten = await open(corrupt);
    await kitten.locator('#start').click();
    await kitten.goto('about:blank'); await kitten.goto(server.url); await kitten.waitForFunction(() => window.GardenJourney?.ready);
    assert.deepEqual(await stored(kitten,cats),[bad,null]);
    assert.equal(await kitten.evaluate(({key, raw}) => Object.keys(localStorage).filter(k => k.startsWith(key+'.corrupt-') && localStorage.getItem(k) === raw).length,{key:cats, raw:bad}),1);
    await corrupt.close();
    console.log('PASS damaged cat text survives initialization, navigation and reload');
    const fallback = await setup({[cats]:'{"level":1,"total":19}', hg_level2_unlocked:'1'},true);
    const one = await open(fallback);
    await one.locator('#start').click(); await one.locator('#kitLevelBtn').click(); await one.locator('[data-jr-go="2"]').click();
    await one.waitForFunction(k => JSON.parse(localStorage.getItem(k)).level === 2,cats);
    assert.deepEqual((await stored(one,cats)).map(raw => JSON.parse(raw).level),[2,1]);
    await fallback.close();
    console.log('PASS IndexedDB write serialization when Web Locks are unavailable');
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); await server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
