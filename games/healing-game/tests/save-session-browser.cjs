'use strict';
const assert = require('node:assert/strict');
const fixture = require('./cat-models-fixture.cjs');
const CAT = 'healingGarden.kittens.v1', JOURNEY = 'healingGarden.journey.v1', HEAD = 'healingGarden.saveHead.v1';
const finale = {[CAT]:JSON.stringify({level:5,total:20,ended:true}), hg_level2_unlocked:'1',
  [JOURNEY]:JSON.stringify({completed:[1,2,3,4],lamps:[true,true,true],chimes:{round:3},lotus:{light:[3,3,3,3,3,2]}})};

(async () => {
  const server = await fixture.server(), browser = await fixture.browser();
  async function context(seed, denyCat = false) {
    const c = await browser.newContext({viewport:{width:390,height:844}, reducedMotion:'reduce'});
    await c.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await c.addInitScript(({seed,denyCat}) => {
      if (!localStorage.getItem('test-seeded')) {
        localStorage.setItem('test-seeded','1'); Object.entries(seed).forEach(([k,v])=>localStorage.setItem(k,v));
      }
      if (denyCat) {
        const read = Storage.prototype.getItem;
        Storage.prototype.getItem = function(k) {
          if (k === 'healingGarden.kittens.v1') throw new DOMException('Unavailable','SecurityError');
          return read.call(this,k);
        };
        window.inspectOriginal = k => read.call(localStorage,k);
      }
    }, {seed,denyCat});
    return c;
  }
  async function page(c, query = '') {
    const p = await c.newPage(); await p.goto(server.url + query);
    await p.waitForFunction(()=>window.GardenJourney?.ready); return p;
  }
  const snap = p => p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),[HEAD,CAT,JOURNEY,JOURNEY+'.bak']);
  try {
    const c = await context(finale);
    const a = await page(c), b = await page(c);
    await a.locator('#start').click();
    await a.locator('#lotusNote1').click();
    await a.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).completed.includes(5), JOURNEY);
    const win = await snap(a);
    assert.equal(win[JOURNEY+'.bak'],finale[JOURNEY], 'the last real advance preserves the prior checkpoint');
    assert.equal(JSON.parse(win[HEAD]).revision > 0,true);
    await b.waitForFunction(()=>/另一页面/.test(document.querySelector('#starSaveWarning').textContent));
    await b.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));});
    await b.close(); assert.deepEqual(await snap(a),win,'closing stale tab preserves primary, backup and revision');
    await a.reload(); await a.waitForFunction(()=>window.GardenJourney?.ready);
    assert.equal(await a.evaluate(()=>__journey.state().progress.completed.includes(5)),true);
    assert.deepEqual(await snap(a),win,'reopening a completed game does not rotate backups');

    const stale = await page(c);
    await a.locator('#start').click(); await a.locator('#kitLevelBtn').click();
    a.once('dialog',d=>d.accept());
    await Promise.all([a.waitForNavigation(),a.locator('#journeyReset').click()]);
    await a.waitForFunction(()=>window.GardenJourney?.ready);
    await stale.waitForFunction(()=>window.GardenSaves.status('healingGarden.journey.v1').stale);
    await stale.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));});
    await stale.close(); await a.reload(); await a.waitForFunction(()=>window.GardenJourney?.ready);
    assert.equal(await a.evaluate(()=>__kittens.state().level),1);
    const fresh = await snap(a); assert.equal(fresh[JOURNEY],null); assert.equal(fresh[JOURNEY+'.bak'],null);
    assert.notEqual(JSON.parse(fresh[HEAD]).generation,JSON.parse(win[HEAD]).generation);
    await c.close();

    for (const [value,deny,expected] of [[null,false,'missing'],['{"total":19,',false,'corrupt'],[finale[CAT],true,'unreadable']]) {
      const isolated=await context(value===null?{}:{[CAT]:value},deny), p=await page(isolated, expected==='corrupt' ? '?level=2' : '');
      const got=await p.evaluate(k=>({status:GardenSaves.status(k),raw:window.inspectOriginal?window.inspectOriginal(k):localStorage.getItem(k),
        warning:document.querySelector('#starSaveWarning').textContent}),CAT);
      assert.equal(got.status.state,expected); assert.equal(got.raw,value,'boot preserves original bytes');
      if(expected==='corrupt')assert.equal(await p.evaluate(k=>localStorage.getItem(k),got.status.corruptKey),value);
      if(deny)assert.match(got.warning,/无法读取/);
      await isolated.close();
    }
    const fallback = await context(finale);
    await fallback.addInitScript(() => {Object.defineProperty(navigator,'locks',{value:undefined});});
    const first=await page(fallback), second=await page(fallback);
    await first.locator('#start').click(); await first.locator('#lotusNote1').click();
    await first.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).completed.includes(5),JOURNEY);
    await second.waitForFunction(k=>GardenSaves.status(k).stale,JOURNEY);
    await fallback.close();
    console.log('Chromium: L5 clear + stale-tab close/reload, reset invalidation, three kitten load outcomes and IndexedDB serialization passed');
  } finally { await browser.close(); await server.close(); }
})().catch(e=>{ console.error(e);process.exitCode=1; });
