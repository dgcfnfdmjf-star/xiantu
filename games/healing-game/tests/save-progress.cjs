'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { create, kittenSave, generation } = require('../src/save-progress.js');
const key = 'healingGarden.kittens.v1';
function fixture(initial = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: k => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v))
  };
  return { storage, data, page: () => create(() => storage, null, () => {}, () => true) };
}
test('dirty changes advance revisions; a repeated snapshot and failed main write leave the backup alone', () => {
  const original = '{"total":19}', f = fixture({ [key]: original }), s = f.page().open(key, kittenSave);
  s.remember({total:19});
  s.write({total:19}, true);
  assert.equal(f.data.size, 1);
  assert.equal(f.data.get(key), original);
  s.write({total:20});
  const saved = f.data.get(key);
  assert.deepEqual(JSON.parse(saved), {total:20, saveRevision:1});
  const set = f.storage.setItem;
  f.storage.setItem = (k,v) => { if (k === key) throw Error('quota'); set(k,v); };
  s.write({total:21});
  assert.equal(f.data.get(key), saved);
  assert.equal(f.data.get(key+'.bak'), original);
  f.storage.setItem = set;
  s.write({total:21});
  assert.equal(JSON.parse(f.data.get(key)).saveRevision, 2);
  assert.equal(f.data.get(key+'.bak'), saved);
});
test('missing, unreadable and invalid cat saves stay distinct; a real change requires a durable quarantine', () => {
  const bad = '{"total":19,', f = fixture({[key]:bad}), get = f.storage.getItem, set = f.storage.setItem;
  const missing = f.page().open('other', kittenSave);
  assert.equal(missing.data, null);
  assert.equal(missing.status().loadFailed, false);
  f.storage.getItem = k => { if (k===key) throw Error('denied'); return get(k); };
  const unread = f.page().open(key, kittenSave);
  f.storage.getItem = get;
  assert.equal(unread.status().readError, true);
  assert.equal(unread.write({total:1}), false);
  f.storage.setItem = (k,v) => { if (k.includes('.corrupt-')) throw Error('quota'); set(k,v); };
  const corrupt = f.page().open(key, kittenSave);
  assert.equal(corrupt.status().readError, false);
  assert.equal(corrupt.status().loadFailed, true);
  corrupt.remember({total:0});
  corrupt.write({total:0}, true);
  corrupt.write({total:1});
  assert.equal(f.data.get(key), bad);
  f.storage.setItem = set;
  corrupt.write({total:1});
  assert.equal(f.data.get(corrupt.status().corruptKey), bad);
  assert.equal(JSON.parse(f.data.get(key)).total, 1);
  assert.equal(f.data.has(key+'.bak'), false);
  for (const raw of ['null','[]','{"total":"x"}','{"caught":[]}']) {
    const backup = fixture({[key]:raw, [key+'.bak']:'{"total":19}'});
    const restored = backup.page().open(key, kittenSave);
    assert.deepEqual(restored.data,{total:19});
    assert.equal(restored.status().restored,true);
    restored.write({total:20});
    assert.equal(backup.data.get(key+'.bak'),'{"total":19}');
    assert.equal(backup.data.get(restored.status().corruptKey),raw);
  }
});
test('other-tab write and reset invalidate pending saves even before delivery of storage events', () => {
  const f = fixture({[key]:'{"total":19}'}), old = f.page();
  old.open(key, kittenSave);
  const butterfly = old.open('butterflies');
  f.page().open(key, kittenSave).write({total:20});
  butterfly.write({total:1});
  assert.equal(butterfly.status().stale,true);
  assert.equal(f.data.has('butterflies'),false);
  const fresh = fixture(), empty = fresh.page().open(key, kittenSave);
  fresh.data.set(generation,'new journey');
  empty.write({total:1});
  assert.equal(empty.status().stale,true);
  assert.equal(fresh.data.has(key),false);
});
