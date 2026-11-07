const assert=require('node:assert/strict'),R=require('../src/lotus-rules.js');let checks=0;
function test(name,run){run();checks++;console.log('PASS '+name)}
test('old and malformed saves normalize without inventing collection',()=>{
 for(const raw of [undefined,null,{},[],{light:'bad'},{light:[-1,4,NaN,2.5,'3',Infinity],found:['moonpearl','__proto__']}])assert.deepEqual(R.normalize(raw),{light:[0,0,0,0,0,0],found:[]});
 assert.deepEqual(R.normalize({light:[3,2,1,0,3,0],found:['<img>']}),{light:[3,2,1,0,3,0],found:['moonpearl','violetrest']});
});
test('each gift survives serialization and never resets another flower',()=>{
 let s=R.normalize();R.give(s,2);R.give(s,2);R.give(s,0);s=R.normalize(JSON.parse(JSON.stringify(s)));assert.deepEqual(s.light,[1,0,2,0,0,0]);assert.equal(R.give(s,2).bloomed,true);assert.deepEqual(s.found,['rosecloud']);
});
test('any order completes exactly once; free play cannot farm rewards',()=>{
 const s=R.normalize();let finished=0,bloomed=0;for(const i of [5,3,1,4,0,2])for(let j=0;j<3;j++){const r=R.give(s,i);finished+=!!r.finished;bloomed+=!!r.bloomed;}assert.equal(finished,1);assert.equal(bloomed,6);const before=JSON.stringify(s);for(let i=0;i<100;i++)assert.equal(R.give(s,i%6).changed,false);assert.equal(JSON.stringify(s),before);
});
test('invalid inputs never mutate progress',()=>{const s=R.normalize(),before=JSON.stringify(s);for(const i of [undefined,null,-1,6,1.2,'1',NaN,Infinity])assert.equal(R.give(s,i).changed,false);assert.equal(JSON.stringify(s),before);});
console.log(checks+' lotus progression checks passed');
