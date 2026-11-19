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
check('act: lanterns light strictly in order; far, repeated and bad taps change nothing', () => {
  const s = R.normalize(null);
  assert.deepEqual(R.act(s, 'lantern', 2), { changed: false, progress: false, hint: 'far', finished: false });
  for (const bad of [-1, 1.5, '0', 99, null, NaN]) assert.equal(R.act(s, 'lantern', bad).hint, 'none');
  assert.equal(R.act(s, 'snowman', 0).hint, 'none');
  assert.deepEqual(s, R.normalize(null));
  const r = R.act(s, 'lantern', 0); assert.equal(r.changed, true); assert.equal(r.progress, true); assert.deepEqual(s.lit, [0]);
  const again = JSON.stringify(s); assert.equal(R.act(s, 'lantern', 0).hint, 'lit'); assert.equal(JSON.stringify(s), again);
  assert.equal(R.next(s), 1);
});
check('act: kittens wait in the dark until their lanterns are lit, then go home once', () => {
  const s = R.normalize(null);
  R.kittens.forEach((k, i) => assert.equal(R.act(s, 'kitten', i).hint, 'dark'));
  assert.equal(R.darkness(s, 0), R.kittens[0].lantern + 1);
  for (let i = 0; i <= R.kittens[0].lantern; i++) R.act(s, 'lantern', i);
  assert.equal(R.reachable(s, 0), true); assert.equal(R.reachable(s, 3), false);
  assert.equal(R.act(s, 'kitten', 0).progress, true); assert.deepEqual(s.home, ['orange']);
  assert.equal(R.act(s, 'kitten', 0).hint, 'home'); assert.deepEqual(s.home, ['orange']);
  assert.equal(R.act(s, 'kitten', 4).hint, 'none'); assert.equal(R.act(s, 'kitten', -1).hint, 'none');
});
check('act: a whole deterministic play reaches finished exactly on the last step; home order is canonical', () => {
  const s = R.normalize(null); let finishes = 0, steps = 0;
  for (let i = 0; i < R.LANTERNS; i++) { const r = R.act(s, 'lantern', i); steps++; if (r.finished) finishes++; }
  for (const i of [3, 1, 2, 0]) { const r = R.act(s, 'kitten', i); steps++; if (r.finished) finishes++; }
  assert.equal(finishes, 1); assert.equal(R.finished(s), true); assert.deepEqual(s.home, ['orange', 'calico', 'black', 'tabby']);
  assert.deepEqual(R.normalize(JSON.parse(JSON.stringify(s))), s);
  const r = R.act(s, 'lantern', 0); assert.equal(r.changed, false); assert.equal(r.finished, true);
  assert.equal(R.next(s), -1);
});
check('every kitten waits by a real lantern and the last needs the whole path', () => {
  R.kittens.forEach(k => assert.ok(Number.isInteger(k.lantern) && k.lantern >= 0 && k.lantern < R.LANTERNS));
  assert.equal(Math.max(...R.kittens.map(k => k.lantern)), R.LANTERNS - 1);
});
check('garbage saves still play (non-contiguous lit keeps the gap as next)', () => {
  const s = R.normalize({ lit: [0, 3, 'x'], home: ['black', 'black'] });
  assert.equal(R.next(s), 1); assert.equal(R.act(s, 'lantern', 4).hint, 'far'); assert.equal(R.act(s, 'lantern', 1).progress, true);
});
console.log(n + ' snow rules checks passed');
