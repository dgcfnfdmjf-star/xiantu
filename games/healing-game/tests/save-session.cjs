'use strict';
const assert = require('node:assert/strict');
const {create, headKey} = require('../src/save-session.js');
const cat = 'healingGarden.kittens.v1', journey = 'healingGarden.journey.v1';
function fixture(entries = {}) {
  const rows = new Map(Object.entries(entries));
  const storage = { getItem:k => rows.get(k) ?? null, setItem:(k,v) => rows.set(k,v) };
  const host = () => ({document:{hidden:false, addEventListener() {}}, addEventListener() {}, localStorage:storage, navigator:{locks:{request:(_key,action)=>Promise.resolve(action())}}, setTimeout:() => 1});
  return {rows, storage, open:() => create(host())};
}
const old = JSON.stringify({total:9}), next = JSON.stringify({total:10});
{
  const f = fixture({[cat]:old});
  const a = f.open(), b = f.open();
  assert.equal(a.status(cat).state, 'loaded'); a.flush();
  assert.equal(f.rows.has(headKey), false);
  a.write(cat, next); const stamp = f.rows.get(headKey);
  assert.equal(f.rows.get(cat+'.bak'),old);
  a.write(cat,next); a.flush(); assert.equal(f.rows.get(headKey),stamp);
  assert.equal(f.rows.get(cat+'.bak'),old);
  b.write(journey,'{"completed":[]}'); assert(b.status(cat).stale);
  assert.equal(f.rows.has(journey),false);
  const restored = f.open(); assert.equal(restored.read(cat).total,10);
  a.nextGeneration(); restored.write(cat,'{"total":12}');
  assert(restored.status(cat).stale); assert.equal(f.rows.get(cat),next);
}
{
  const f = fixture(); const s = f.open();
  assert.equal(s.status(cat).state,'missing'); s.flush(); assert.equal(f.rows.size,0);
}
for (const damaged of ['{}','{"garbage":123}','{"bad', 'null', '[]', '{"caught":"bad"}', '{"total":-1}']) {
  const f = fixture({[cat]:damaged, [cat+'.bak']:old}); const s=f.open();
  assert.equal(s.status(cat).state,'corrupt'); assert.equal(s.status(cat).restored,true);
  assert.equal(s.read(cat).total,9); assert.equal(f.rows.get(s.status(cat).corruptKey),damaged);
  s.flush(); assert.equal(f.rows.get(cat),damaged);
  s.write(cat,next); assert.equal(f.rows.get(cat+'.bak'),old); assert.equal(f.rows.get(cat),next);
}
{
  const f=fixture({[cat]:old}); const get=f.storage.getItem;
  f.storage.getItem=k=>{ if(k===cat)throw Error('read denied'); return get(k); };
  const s=f.open(); assert.equal(s.status(cat).state,'unreadable');
  f.storage.getItem=get; s.write(cat,next); s.flush();
  assert.equal(f.rows.get(cat),old); assert.match(s.message(),/无法读取/);
}
{
  const f=fixture({[cat]:old}), s=f.open(), put=f.storage.setItem;
  f.storage.setItem=(k,v)=>{ if(k===cat)throw Error('quota');put(k,v); };
  s.write(cat,next); assert.equal(f.rows.get(cat),old); assert.equal(f.rows.has(cat+'.bak'),false);
  assert.match(s.message(),/未能保存/);
  f.storage.setItem=put; s.flush(); assert.equal(f.rows.get(cat),next);
  assert.equal(f.rows.get(cat+'.bak'),old); assert.equal(s.message(),'');
}
{
  // Reload an active writer before its asynchronous origin lock can run.
  const rows = new Map([[cat,old]]), staged = new Map(), locks = [];
  const store = m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
  const host = {localStorage:store(rows),sessionStorage:store(staged),document:{hidden:false,addEventListener(){}},
    addEventListener(){},navigator:{locks:{request:(_key,action)=>{locks.push(action);return Promise.resolve();}}}};
  const a = create(host); a.write(cat,next); assert.equal(rows.get(cat),old);
  let continued=false; a.afterWrite(()=>{continued=true;}); assert.equal(continued,false);
  locks.shift(); // document was discarded
  const reopened = create(host);
  assert.equal(reopened.read(cat).total,10,'reload can play from its staged update');
  locks.shift()();
  assert.equal(rows.get(cat),next); assert.equal(staged.size,0);
}
{
  const f=fixture({[cat]:'broken'}); const first=f.open(), second=f.open();
  assert.equal(first.status(cat).corruptKey,second.status(cat).corruptKey);
  assert.equal([...f.rows.keys()].filter(k=>k.startsWith(cat+'.corrupt-')).length,1);
}
{
  const f = fixture({[cat]:old}), queue = [];
  const host = {localStorage:f.storage,document:{hidden:false,addEventListener(){}},addEventListener(){},
    navigator:{locks:{request:(_key,action)=>{queue.push(action);return Promise.resolve();}}}};
  const a=create(host), b=create(host); let completed=false;
  a.write(cat,next); b.write(cat,'{"total":11}');
  a.afterWrite(()=>{ assert.equal(f.rows.get(cat),next);completed=true; });
  assert.equal(completed,false); queue.shift()(); queue.shift()();
  assert.equal(completed,true); assert(b.status(cat).stale);
  assert.equal(f.rows.get(cat),next); assert.equal(f.rows.get(cat+'.bak'),old);
}
{
  const f=fixture({[cat]:old});
  const s=create({localStorage:f.storage,document:{hidden:false,addEventListener(){}},
    addEventListener(){},setTimeout:()=>1});
  s.write(cat,next);
  assert.equal(f.rows.get(cat),old); assert.equal(f.rows.has(headKey),false);
  assert.match(s.message(),/协调/);
}
console.log('Save revisions, reset generation, unchanged backups, legacy/corrupt/unreadable slots and retry passed');
