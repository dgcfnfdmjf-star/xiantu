const assert=require('node:assert/strict'),fs=require('node:fs');
const {sampleFireBatch3:sample}=require('../art/fire-skills-batch3/sampler.js');
const defs=JSON.parse(fs.readFileSync('art/fire-skills-batch3/preview/effect-manifest.json')).effects;
const state=Object.freeze({burnTurns:3,burnStacks:100,_burnHealBlockV286818:false});let checks=0;
for(const D of defs)for(const arrival of [180,310,520])for(const hit of [null,arrival])for(const reduced of [false,true])for(const light of [false,true]){
 const j=Object.freeze({from:Object.freeze({x:290,y:205}),to:Object.freeze({x:493,y:250}),toGround:Object.freeze({x:493,y:278}),hitAt:hit,arriveAt:arrival,domainConfirmed:true,burn:state,reduced,light});
 const seen=new Map();let oldY=-Infinity;
 for(let age=0;age<2600;age+=5){
  const parts=sample(D,j,age);assert.deepEqual(sample(D,j,age),parts);
  for(const p of parts){assert(p.opacity>0&&p.opacity<=1);assert(Number.isFinite(p.x+p.y+p.width+p.height+p.rotation));assert(['origin','target','moving'].includes(p.anchor));assert(p.frame>=0&&p.frame<D.layers[p.layer].frames);assert.equal(p.width,D.display[p.layer]);
   if(!seen.has(p.layer))seen.set(p.layer,new Set());seen.get(p.layer).add(p.frame);
   if(['impact','residue','status'].includes(p.layer)||D.key==='wildfire_domain'&&p.layer==='body')assert(hit!==null&&age>=hit);
   if(D.key==='heaven_meteor'&&p.layer==='body'){assert(p.y>=oldY);oldY=p.y;assert(p.y<=j.toGround.y);}
   if(p.clipEnd!==undefined){assert(p.clipStart>=0&&p.clipEnd<=1&&p.clipEnd>p.clipStart);assert(D.key==='dragon_breath');}
  }
  const get=k=>parts.find(p=>p.layer===k),body=get('body'),tele=get('telegraph'),impact=get('impact'),residue=get('residue'),source=get('source'),status=get('status');
  if(D.key==='dragon_breath'&&tele&&source)assert(tele.opacity+source.opacity<=1.001);
  if(D.key==='wildfire_domain'&&tele&&body)assert(tele.opacity+body.opacity<=1.001);
  if(D.key==='wildfire_domain'&&body&&residue)assert(body.opacity+residue.opacity<=1.001);
  if(residue&&status)assert(residue.opacity+status.opacity<=1.001,'one crossfaded state owner');
  if(D.key!=='wildfire_domain'&&body&&impact)assert(body.opacity+impact.opacity<=1.001);
  if(D.key!=='wildfire_domain'&&impact&&residue)assert(impact.opacity+residue.opacity<=1.001);
  checks++;
 }
 if(hit!==null&&!reduced&&!light)for(const [layer,L]of Object.entries(D.layers))assert(seen.get(layer)?.has(L.frames-1),D.key+' '+layer+' last frame');
 const late=sample(D,j,5000);assert(late.every(p=>p.layer==='status'));
 for(const flags of [{hidden:true},{exited:true},{alive:false},{sameTarget:false}])assert.deepEqual(sample(D,{...j,...flags},arrival+100),[]);
 if(D.key==='wildfire_domain'&&hit!==null){
  assert.equal(late.length,1);
  for(const burn of [{...state,burnTurns:0},{...state,burnStacks:0},{...state,_burnHealBlockV286818:true}])assert.deepEqual(sample(D,{...j,burn},5000),[]);
  assert.deepEqual(sample(D,{...j,domainConfirmed:false},5000),[]);
  assert.deepEqual(sample(D,{...j,burn:{...state,burnTurns:5,burnStacks:200}},5000),late);
 }
 // Every visible part obeys caller scaling and offset, not gameplay geometry writes.
 const inspectAt=hit===null?arrival/3:arrival+70;
 const a=sample(D,j,inspectAt),b=sample(D,{...j,scale:1.2,offsetX:10,offsetY:15},inspectAt);
 assert(a.length>0&&b.length>0);for(const p of b)assert.equal(p.width,D.display[p.layer]*1.2);
}
assert.equal(fs.readFileSync('art/fire-skills-batch3/sampler.js','utf8'),fs.readFileSync('art/fire-skills-batch3/preview/choreography.js','utf8'));
console.log(JSON.stringify({passed:true,samples:checks,effects:defs.length,checks:'determinism, events, fixed size, falling path, crossfades, final frames, burn ownership and cleanup'}));
