const fs=require('node:fs'),assert=require('node:assert/strict');
const {sampleThunderBatch:sample}=require('../art/thunder-skills-batch2/sampler.js');
const manifest=require('../art/thunder-skills-batch2/preview/effect-manifest.json');
let samples=0;
for(const D of manifest.effects){
 const initial=JSON.stringify(D);
 for(const arrival of [180,D.timing.arrivalMs,520])for(const direction of [1,-1])for(const quality of ['rich','light','reduced'])for(const hit of [true,false]){
  const j={from:{x:direction===1?260:493,y:205},fromGround:{x:direction===1?260:493,y:278},to:{x:direction===1?493:260,y:210},toGround:{x:direction===1?493:260,y:278},hitAt:hit?arrival:null,arriveAt:arrival,light:quality==='light',reduced:quality==='reduced'},before=JSON.stringify(j),frames={};
  for(let t=0;t<1500;t++){
   const parts=sample(D,j,t);samples++;
   for(const p of parts){
    assert(['origin','moving','target'].includes(p.anchor));assert(p.opacity>0&&p.opacity<=1);assert(Number.isFinite(p.x)&&Number.isFinite(p.y));
    assert(p.frame>=0&&p.frame<D.layers[p.layer].frames);assert.equal(p.width,D.display[p.layer]);assert.equal(p.height,D.display[p.layer]);
    (frames[p.layer]??=new Set()).add(p.frame);
    if(!hit)assert(!['impact','residue'].includes(p.layer));
    if(p.layer==='impact')assert(t>=arrival);
    if(p.layer==='body'&&t>=arrival)assert.equal(p.x,j.to.x);
    if(quality==='reduced')assert(!['body','residue'].includes(p.layer));
   }
   if(t>=arrival+(hit?D.timing.aftermathMs:D.timing.crossfadeMs))assert.equal(parts.length,0);
  }
  assert.equal(JSON.stringify(j),before);assert.equal(JSON.stringify(D),initial);
  if(hit&&quality==='rich')for(const k of Object.keys(D.layers))assert(frames[k].has(D.layers[k].frames-1),D.key+' '+k+' terminal frame');
 }
 // No presentation-only invocation may access randomness or mutate combat globals.
 const saved=Math.random;Math.random=()=>{throw Error('visual RNG use')};sample(D,{from:{x:0,y:0},to:{x:1,y:1},hitAt:360},200);Math.random=saved;
}
assert.deepEqual(fs.readFileSync('art/thunder-skills-batch2/sampler.js'),fs.readFileSync('art/thunder-skills-batch2/preview/choreography.js'));
console.log(`PASS ${samples} pure samples: three effects, hit/miss, timing, direction, quality, final frames and expiry`);
