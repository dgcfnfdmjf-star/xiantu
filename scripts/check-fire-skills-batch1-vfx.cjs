const assert=require('node:assert/strict'),fs=require('node:fs');
const {sampleFireBatch:sample}=require('../art/fire-skills-batch1/sampler.js');
const defs=JSON.parse(fs.readFileSync('art/fire-skills-batch1/preview/effect-manifest.json')).effects;
let checks=0;
for(const d of defs)for(const at of [180,310,520])for(const hit of [null,at])for(const det of [null,at+60])for(const reduced of [false,true]){
 const j=Object.freeze({from:Object.freeze({x:260,y:205}),to:Object.freeze({x:493,y:210}),toGround:Object.freeze({x:493,y:278}),hitAt:hit,arriveAt:at,detonationAt:det,reduced});
 const seen=new Set();
 for(let age=0;age<1500;age+=5){const parts=sample(d,j,age);assert.deepEqual(sample(d,j,age),parts);
 for(const p of parts){assert(p.opacity>0&&p.opacity<=1);assert(p.frame>=0&&p.frame<d.layers[p.layer].frames);assert(Number.isFinite(p.x+p.y+p.width));seen.add(p.layer);
 if(['impact','residue','detonation'].includes(p.layer)||d.key==='flame_pillar'&&p.layer==='body')assert(hit!==null&&age>=hit,'hit is authoritative');
 if(p.layer==='detonation')assert(d.key==='flame_burst'&&det!==null&&age>=det);
 if(p.layer==='body')assert.equal(p.width,d.display.body,'fixed travel size');}
 const body=parts.find(p=>p.layer==='body'),impact=parts.find(p=>p.layer==='impact');if(d.key!=='flame_pillar'&&body&&impact)assert(body.opacity+impact.opacity<=1.001,'complementary contact');
 checks++;
 }
 assert.deepEqual(sample(d,j,1500),[]);if(hit===null)assert(!seen.has('impact')&&!seen.has('detonation'));
}
assert.equal(fs.readFileSync('art/fire-skills-batch1/sampler.js','utf8'),fs.readFileSync('art/fire-skills-batch1/preview/choreography.js','utf8'));
console.log(JSON.stringify({passed:true,samples:checks,effects:defs.length}));
