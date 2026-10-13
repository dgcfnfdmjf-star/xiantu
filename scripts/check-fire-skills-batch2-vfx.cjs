const assert=require('node:assert/strict'),fs=require('node:fs');
const {sampleFireBatch2:sample}=require('../art/fire-skills-batch2/sampler.js');
const defs=JSON.parse(fs.readFileSync('art/fire-skills-batch2/preview/effect-manifest.json')).effects;
const active=Object.freeze({burnTurns:3,burnStacks:100,_burnHealBlockV286818:true});
let checks=0;
for(const d of defs)for(const at of [180,310,520])for(const hit of [null,at])for(const reduced of [false,true])for(const light of [false,true]){
 const j=Object.freeze({from:Object.freeze({x:260,y:205}),to:Object.freeze({x:493,y:210}),toGround:Object.freeze({x:493,y:278}),hitAt:hit,arriveAt:at,reduced,light,burn:active});
 const seen=new Map();
 for(let age=0;age<2500;age+=5){
  const parts=sample(d,j,age);assert.deepEqual(sample(d,j,age),parts);
  for(const p of parts){
   assert(p.opacity>0&&p.opacity<=1);assert(Number.isInteger(p.frame)&&p.frame>=0&&p.frame<d.layers[p.layer].frames);assert(Number.isFinite(p.x+p.y+p.width));assert(['origin','target','moving'].includes(p.anchor));
   if(!seen.has(p.layer))seen.set(p.layer,new Set());seen.get(p.layer).add(p.frame);
   if(['impact','residue','status'].includes(p.layer)||d.visualArchetype==='ground-eruption'&&p.layer==='body')assert(hit!==null&&age>=hit,'authoritative hit');
   if(p.layer==='body')assert.equal(p.width,d.display.body,'fixed travel size');
   if(p.layer==='status')assert(d.key==='karmic_lotus'&&age>=hit+d.timing.aftermathMs,'one persistent owner after short outro');
  }
  const get=k=>parts.find(p=>p.layer===k),body=get('body'),tele=get('telegraph'),impact=get('impact'),residue=get('residue');
  if(tele&&body)assert(tele.opacity+body.opacity<=1.001,'tele/body complementary');
  if(d.visualArchetype==='projectile'&&body&&impact)assert(body.opacity+impact.opacity<=1.001,'contact crossfade');
  if(d.visualArchetype==='ground-eruption'&&body&&residue)assert(body.opacity+residue.opacity<=1.001,'body/outro crossfade');
  if(d.visualArchetype==='projectile'&&impact&&residue)assert(impact.opacity+residue.opacity<=1.001,'impact/outro crossfade');
  checks++;
 }
 if(hit!==null&&!reduced&&!light)for(const [k,L]of Object.entries(d.layers))assert(seen.get(k)?.has(L.frames-1),d.key+' '+k+' last frame reachable');
 const late=sample(d,j,5000);assert(late.every(p=>p.layer==='status'),'one-shot layers expire');
 if(d.key==='karmic_lotus'&&hit!==null){
  assert.equal(late.length,1,'real burn is not a fixed seconds timer');
  for(const burn of [{...active,burnTurns:0},{...active,burnStacks:0},{...active,_burnHealBlockV286818:false}])assert.deepEqual(sample(d,{...j,burn},5000),[]);
  for(const flags of [{alive:false},{sameTarget:false},{hidden:true},{exited:true}])assert.deepEqual(sample(d,{...j,...flags},1000),[]);
  assert.deepEqual(sample(d,{...j,burn:{...active,burnTurns:5,burnStacks:200}},5000),late,'refresh retains current loop phase');
 }
}
assert.equal(fs.readFileSync('art/fire-skills-batch2/sampler.js','utf8'),fs.readFileSync('art/fire-skills-batch2/preview/choreography.js','utf8'));
console.log(JSON.stringify({passed:true,samples:checks,effects:defs.length}));
