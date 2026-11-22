'use strict';
const assert = require('node:assert/strict');
const { create, owned } = require('../src/garden-reset.js');
function storage(entries) {
  const data = new Map(Object.entries(entries));
  return { data, get length() { return data.size; }, key: i => [...data.keys()][i],
    getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k) };
}
const saves = {
  'healingGarden.v3': '{"flowers":[1]}', 'healingGarden.butterflies.v1': '{"total":30}',
  'healingGarden.kittens.v1': '{"total":20}', 'healingGarden.journey.v1': '{"completed":[1,2,3,4,5]}',
  'healingGarden.journey.v1.bak': '{"completed":[1,2]}', 'healingGarden.journey.v1.corrupt-12': 'broken',
  'healingGarden.future.v2': 'future save', hg_level2_unlocked: '1',
  xiantu_save: 'unrelated', 'another.garden': 'keep', 'my.healingGarden.v3': 'keep too',
  'healingGardeners.settings': 'not this app', hg_unrelated: 'also keep'
};
{
  const s = storage(saves); let navigated = 0, reset;
  reset = create(() => s, () => { assert(reset.pending(), 'save writes already blocked before navigating'); navigated++; });
  assert.equal(reset.pending(), false);
  assert.equal(reset.reset(), true);
  assert.deepEqual(Object.fromEntries(s.data), Object.fromEntries(Object.entries(saves).filter(([k]) => !owned(k))));
  assert.equal(navigated, 1);
  assert.equal(reset.reset(), false, 'double activation does not navigate twice');
}
{
  const s = storage(saves), remove = s.removeItem; let navigated = false;
  s.removeItem = k => { if (k === 'healingGarden.kittens.v1') throw Error('storage denied'); remove(k); };
  const reset = create(() => s, () => { navigated = true; });
  assert.equal(reset.reset(), false);
  assert.equal(reset.pending(), false, 'failed reset leaves the current game saveable');
  assert.equal(navigated, false);
  assert.deepEqual(Object.fromEntries(s.data), saves, 'partial removal is rolled back');
  s.removeItem = remove;
  assert.equal(reset.reset(), true, 'player can retry after permissions are restored');
}
{
  const reset = create(() => { throw Error('localStorage unavailable'); }, () => assert.fail('must not navigate'));
  assert.equal(reset.reset(), false);
  assert.equal(reset.pending(), false);
}
console.log('garden reset: namespace isolation, backup removal, save barrier, rollback and retry OK');
