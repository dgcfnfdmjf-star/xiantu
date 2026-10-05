'use strict';
const fs = require('node:fs'), vm = require('node:vm'), a = require('node:assert/strict');
const root = process.env.XIANTU_TEST_ROOT || 'release-v2858/xiantu-v2831-scroll';
const endpoint = 'https://xiantu-game-d9gy5heze4b039bf1-1255918878.ap-shanghai.app.tcloudbase.com/api/jev-forge';
const origin = 'https://xiantu-game-d9gy5heze4b039bf1-1255918878.tcloudbaseapp.com';
const token = 'test_access_token_for_connection_only';
function page(protocol = 'https:', saved=[]) {
  const storage=new Map(saved);
  const elements = new Map(); let clock = 100000, submit, calls = 0;
  for (const id of ['jevCheckForm', 'access', 'testButton', 'result', 'pageOrigin', 'apiEndpoint', 'checkTask','jevDeviceControlsV2845','clearDeviceV2845']) {
    elements.set(id, { value: '', disabled: id === 'testButton', textContent: '', dataset: {}, addEventListener(name, fn) { if (name === 'submit') submit = fn; } });
  }
  const timers = new Map(); let serial = 0;
  const c = vm.createContext({ localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}, URL, AbortController, Date: { now: () => clock },
    document: { getElementById: id => elements.get(id), querySelectorAll:()=>[] }, window: { location: { protocol, origin, href: origin + '/xiantu-v2831-scroll/jev-check.html' } },
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); return id; }, clearTimeout(id) { timers.delete(id); },
    fetch: async () => { calls++; throw Error('network'); }
  });
  vm.runInContext(fs.readFileSync(root + '/xiantu-v2842-jev-forge.js', 'utf8'), c);
  vm.runInContext(fs.readFileSync(root + '/jev-check-v2843.js', 'utf8'), c);
  return { c, elements, timers, storage, calls: () => calls, advance: () => clock += 11000,
    submit: async (value=token) => { elements.get('access').value = value; return submit({ preventDefault() {} }); },
    result: () => elements.get('result').textContent };
}
function checkClean(p) {
  a.equal(p.elements.get('access').value, '');
  a.equal(p.elements.get('access').disabled, false);
  a.equal(p.elements.get('testButton').disabled, false);
  a(!p.result().includes(token));
  a.equal(p.timers.size, 0);
}
(async () => {
  const p = page();
  a.equal(p.calls(), 0, 'no automatic request');
  a.equal(p.elements.get('apiEndpoint').textContent, endpoint);
  a.equal(p.elements.get('pageOrigin').textContent, origin);
  a.equal(page('file:').elements.get('testButton').disabled, true, 'local files cannot make live calls');
  let calls = 0;
  p.c.fetch = async (url, opt) => {
    calls++; a.equal(url, endpoint); a.equal(opt.headers['X-Xiantu-Access'], token);
    a.equal(opt.method, 'POST'); a.equal(opt.credentials, 'omit'); a.equal(opt.redirect, 'error');
    const body = JSON.parse(opt.body); a.equal(body.goal, 'survival'); a.equal(body.after.hp, 30);
    a.deepEqual(Object.keys(body).sort(), ['after', 'before', 'goal', 'grade', 'version']);
    a(!opt.body.includes(token));
    return { ok: true, json: async () => ({ source: 'jev', choice: 'replace', confidence: .9 }) };
  };
  await p.submit(); a.match(p.result(), /连接成功/); checkClean(p);
  await p.submit(); a.equal(calls, 1, 'repeated click rate-gated');
  for (const code of [401, 403, 404, 429, 502, 503]) {
    const error = page(); error.c.fetch = async () => ({ ok: false, status: code });
    await error.submit(); a.match(error.result(), new RegExp('HTTP ' + code)); checkClean(error);
  }
  for (const body of [null, { source: 'jev', choice: 'replace', confidence: '0.9' }, { status: 'ok' }]) {
    const wrong = page(); wrong.c.fetch = async () => ({ ok: true, json: async () => body });
    await wrong.submit(); a.match(wrong.result(), /不是预期/); checkClean(wrong);
  }
  const monster = page(); monster.elements.get('checkTask').value='monster';
  monster.c.fetch=async(url,opt)=>{const state=JSON.parse(opt.body);a.equal(state.task,'monster');a.deepEqual(state.available,['attack','heavy','guard']);return {ok:true,json:async()=>({source:'jev',task:'monster',choice:'heavy',confidence:.9})};};
  await monster.submit();a.match(monster.result(),/蓄力重击/);checkClean(monster);
  const world=page();world.elements.get('checkTask').value='sect';world.c.fetch=async(url,opt)=>{a.equal(JSON.parse(opt.body).task,'sect');return {ok:true,json:async()=>({source:'jev',task:'sect',choice:'o0',confidence:.9})};};await world.submit();a.match(world.result(),/宗门经营接口可用/);checkClean(world);
  const npc=page();npc.elements.get('checkTask').value='mapnpc';npc.c.fetch=async(url,opt)=>{a.equal(JSON.parse(opt.body).task,'mapnpc');return {ok:true,json:async()=>({source:'jev',task:'mapnpc',choice:'o1',confidence:.9})};};await npc.submit();a.match(npc.result(),/NPC接口可用/);a.match(npc.result(),/谨慎交谈/);checkClean(npc);
  const oldServer=page();oldServer.elements.get('checkTask').value='monster';oldServer.c.fetch=async()=>({ok:false,status:400});
  await oldServer.submit();a.match(oldServer.result(),/更新为 V28.50/);
  const savedPage=page('https:',[...p.storage]);a.match(savedPage.result(),/已自动恢复/);a.equal(savedPage.calls(),0);
  savedPage.c.fetch=async(url,opt)=>{a.equal(opt.headers['X-Xiantu-Access'],token);return {ok:true,json:async()=>({source:'jev',choice:'keep',confidence:.9})};};
  await savedPage.submit('');a.match(savedPage.result(),/连接成功/);
  const cleared=page();let late;cleared.c.fetch=()=>new Promise(r=>late=r);const inflight=cleared.submit();
  cleared.elements.get('clearDeviceV2845').onclick();late({ok:true,json:async()=>({source:'jev',choice:'keep',confidence:.9})});await inflight;
  a(!cleared.storage.has('xiantu_jev_device_v1'));a.match(cleared.result(),/已清除/);checkClean(cleared);
  const html = page(); html.c.fetch = async () => ({ ok: true, json: async () => { throw Error('secret raw upstream text'); } });
  await html.submit(); a.match(html.result(), /不是预期/); a(!html.result().includes('secret')); checkClean(html);
  const offline = page(); await offline.submit(); a.match(offline.result(), /网络、跨域/); checkClean(offline);
  const slow = page(); slow.c.fetch = async () => ({ ok: true, json: () => new Promise(() => {}) });
  const wait = slow.submit(); await Promise.resolve(); await Promise.resolve();
  [...slow.timers.values()].find(t => t.ms === 10000).fn(); await wait;
  a.match(slow.result(), /超过 10 秒/); checkClean(slow);
  const twice = page(); let finish, count = 0;
  twice.c.fetch = () => { count++; return new Promise(resolve => finish = resolve); };
  const first = twice.submit(); await twice.submit(); a.equal(count, 1);
  finish({ ok: true, json: async () => ({ source: 'jev', choice: 'consider', confidence: .4 }) });
  await first; a.match(twice.result(), /暂无明确建议/);
  // A second submit event can occur programmatically despite the disabled input.
  a.equal(twice.elements.get('result').dataset.state, 'success');
  console.log('PASS configured endpoint, manual fixed-input request, no game state, masked credentials, local-file guard, error/format handling, JSON timeout, duplicate/rate gates');
})().catch(e => { console.error(e); process.exitCode = 1; });
