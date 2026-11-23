const assert=require('node:assert/strict');
const fs=require('node:fs');
const samples=JSON.parse(fs.readFileSync(process.argv[2])).poseSamples;
const onset=samples.find(f=>f.walk).time;
const states={idle:samples.filter(f=>!f.walk),walking:samples.filter(f=>f.walk && f.time>onset+.6)};
const errors=[];
for(const [phase,frames] of Object.entries(states)){
 // Seated chest/tail run in the fur shader and the root anchors the tail. This trace only checks motion observed on articulated bones.
 for(const name of (phase==='idle'?['Head']:['Body','TailMid','TailTip'])){
  const values=frames.map(f=>f.bones[name]);const max=Math.max(...values[0].map((_,k)=>Math.max(...values.map(v=>v[k]))-Math.min(...values.map(v=>v[k]))));
  console.log(phase,name,frames.length,'frames; max local position/quaternion component range',max);
  if(max<.0001)errors.push(phase+'/'+name+' stayed fixed');
 }
}
assert.deepEqual(errors,[]);
