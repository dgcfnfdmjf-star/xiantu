const fs=require('node:fs'),assert=require('node:assert/strict');
const {sampleThunderBatch:sample}=require('../art/thunder-skills-batch3/sampler.js');
const {effects}=require('../art/thunder-skills-batch3/preview/effect-manifest.json');
let samples=0;
for(const D of effects){
 const saved=JSON.stringify(D),chain=D.key==='chain_lightning',mantle=D.key==='thunder_mantle';
 for(const arrival of [180,D.timing.arrivalMs,520])for(const direction of [1,-1])for(const quality of ['rich','light','reduced'])for(const hit of [true,false])for(const active of [true,false]){
  const j={from:{x:direction===1?260:493,y:205},fromGround:{x:direction===1?260:493,y:278},to:{x:direction===1?493:260,y:210},toGround:{x:direction===1?493:260,y:278},hitAt:hit?arrival:null,arriveAt:arrival,light:quality==='light',reduced:quality==='reduced',stateActive:active,stateEndAt:2600,events:[{id:'one',at:1100,type:mantle?'reflect':'tick'},{id:'two',at:1900,type:mantle?'reflect':'tick'}]},before=JSON.stringify(j),frames={};
  for(let age=0;age<3500;age+=2){
   const parts=sample(D,j,age);samples++;
   assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
   for(const p of parts){
    assert(['origin','target','moving'].includes(p.anchor));assert(p.opacity>0&&p.opacity<=1);
    assert(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.rotation));assert(p.frame>=0&&p.frame<D.layers[p.layer].frames);
    assert.equal(p.width,p.height);assert.equal(p.width,chain&&p.layer==='body'?Math.hypot(j.to.x-j.from.x,j.to.y-j.from.y)/.58:p.id.startsWith('reflect-hit:')?D.display.reflectImpact:D.display[p.layer]);
    (frames[p.layer]??=new Set()).add(p.frame);
    if(!hit)assert(!['impact','residue'].includes(p.layer)&&!p.id.startsWith('tick:')&&!p.id.startsWith('reflect'));
    if(p.layer==='impact'&&p.id==='impact')assert(age>=arrival);
    if(p.layer==='body'&&!chain){assert.equal(p.x,mantle?j.from.x:j.toGround.x);if(quality==='reduced')assert.equal(p.frame,0)}
    if(quality==='light'||quality==='reduced')assert.notEqual(p.layer,'residue');
   }
   if(!hit&&age>=arrival+D.timing.crossfadeMs)assert.equal(parts.length,0);
   if(age>=2900)assert.equal(parts.length,0);
  }
  if(hit&&active&&!chain&&quality==='rich')assert.equal(frames.body.size,8,'persistent loop must reach all eight frames');
  assert.equal(JSON.stringify(j),before);assert.equal(JSON.stringify(D),saved);
 }
 const j={from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:D.timing.arrivalMs,stateActive:true,stateEndAt:2600,events:[]};
 const loop=sample(D,j,1400);
 if(!chain)assert(loop.some(p=>p.layer==='body'),'state remains visible without events');
 assert(loop.every(p=>!p.id.startsWith('tick:')&&!p.id.startsWith('reflect')),'no fake recurring damage');
 assert.deepEqual(sample(D,{...j,destroyed:true},500),[]);
 assert.deepEqual(sample(D,{...j,duration:400},400),[]);
 if(!chain){
  assert(sample(D,{...j,stateEndAt:Infinity},50000).some(p=>p.layer==='body'),'loop survives long state');
  assert.deepEqual(sample(D,{...j,stateEndAt:900},1300),[],'early expiry clears all layers');
 }
 if(mantle){
  const one={id:'r',at:1100,type:'reflect'};
  assert.equal(sample(D,{...j,events:[one,one]},1180).filter(p=>p.id==='reflect:r').length,1);
  assert.equal(sample(D,{...j,stateEndAt:900,events:[one]},1180).filter(p=>p.id.startsWith('reflect')).length,0);
  assert(sample(D,{...j,events:[{id:'last',at:2600,type:'reflect'}]},2960).some(p=>p.id==='reflect-hit:last'),'last accepted reflect contact finishes after armor expires');
  assert(sample(D,{...j,events:[{id:'last',at:2600,type:'reflect'}]},2960).every(p=>p.layer!=='body'),'last reflection never revives armor');
  assert.deepEqual(sample(D,{...j,events:[{id:'last',at:2600,type:'reflect'}]},3020),[]);
 }
 if(!chain&&!mantle){
  assert(sample(D,{...j,events:[{id:'last',at:2600,type:'tick'}]},2650).some(p=>p.id==='tick:last'),'last acknowledged tick survives as short contact');
  assert(sample(D,{...j,events:[{id:'late',at:2601,type:'tick'}]},2650).every(p=>p.id!=='tick:late'));
 }
 const old=Math.random;try{Math.random=()=>{throw Error('visual RNG use')};sample(D,j,800)}finally{Math.random=old}
}
assert.deepEqual(fs.readFileSync('art/thunder-skills-batch3/sampler.js'),fs.readFileSync('art/thunder-skills-batch3/preview/choreography.js'));
console.log(`PASS ${samples} pure samples; four skills, real-event contract, finite/infinite state, last tick, death/exit, direction, quality and immutable inputs`);
