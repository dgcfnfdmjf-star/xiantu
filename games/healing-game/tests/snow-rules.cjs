'use strict';
// Level-6 「雪灯归林」 save normalisation. Run: node games/healing-game/tests/snow-rules.cjs
const assert = require('node:assert/strict');
const R = require('../src/snow-rules.js');
let n = 0; const check = (name, fn) => { fn(); n++; console.log('PASS ' + name); };
check('defaults for a missing field (old level 1-5 saves)', () => {
  for (const v of [undefined, null, 0, 'x', [], true, NaN]) assert.deepEqual(R.normalize(v), { version: 1, lit: [], home: [] });
});
check('constants: 5-7 lanterns and the four local cat coats', () => {
  assert.ok(R.LANTERNS >= 5 && R.LANTERNS <= 7);
  assert.deepEqual(R.kittens.map(k => k.id), ['orange', 'calico', 'black', 'tabby']);
});
check('garbage entries are dropped, duplicates removed, order fixed', () => {
  const s = R.normalize({ lit: [3, 3, -1, 1.5, '2', 99, null, 0, R.LANTERNS - 1, Infinity], home: ['tabby', 'tabby', 'dog', 7, 'orange', {}], extra: 1 });
  assert.deepEqual(s, { version: 1, lit: [0, 3, R.LANTERNS - 1], home: ['orange', 'tabby'] });
});
check('non-array fields normalise safely', () => {
  assert.deepEqual(R.normalize({ lit: { 0: 1 }, home: 'orange' }), { version: 1, lit: [], home: [] });
});
check('normalize is idempotent and does not mutate input', () => {
  const raw = { lit: [2, 0], home: ['black'] }, copy = JSON.parse(JSON.stringify(raw)), once = R.normalize(raw);
  assert.deepEqual(raw, copy); assert.deepEqual(R.normalize(once), once);
});
check('finished and progress text', () => {
  const all = R.normalize({ lit: [...Array(R.LANTERNS).keys()], home: R.kittens.map(k => k.id) });
  assert.equal(R.finished(all), true); assert.equal(R.finished(R.normalize({ lit: [0] })), false);
  assert.equal(R.progressText(R.normalize({ lit: [1, 2], home: ['calico'] })), '2 / ' + R.LANTERNS + ' 盏雪灯 · 1 / 4 只小猫');
});
console.log(n + ' snow rules checks passed');
