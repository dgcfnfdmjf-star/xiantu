'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),{sampleSwordBatch:sample}=require(root+'/art/sword-skills-batch1/sampler.js');
const defs=require(root+'/art/sword-skills-batch1/preview/effect-manifest.json').effects;
const base={from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:310};
for(const d of defs){
 for(const l of Object.values(d.layers)){const b=fs.readFileSync(root+'/art/sword-skills-batch1/preview/'+l.file);assert.equal(b.readUInt32BE(16),l.frames*l.frameWidth);assert.equal(b.readUInt32BE(20),l.frameHeight);assert.equal(b[25],6,'RGBA required')}
 const before=JSON.stringify(base);for(let t=0;t<1600;t+=10){const parts=sample(d,base,t);assert.equal(JSON.stringify(base),before);for(const p of parts){assert(p.frame>=0&&p.frame<d.layers[p.layer].frames);assert(p.opacity>0&&p.opacity<=1);for(const k of ['x','y','width','height','rotation'])assert(Number.isFinite(p[k]));}if(t<310)assert(!parts.some(p=>p.layer==='impact'));assert(!sample(d,{...base,hitAt:null},t).some(p=>['impact','residue'].includes(p.layer)));}
 assert.equal(sample(d,base,1600).length,0);
 for(const state of [{hidden:true},{exited:true},{alive:false},{sameTarget:false}])assert.equal(sample(d,{...base,...state},350).length,0);
 const widths=new Set();for(let t=100;t<300;t+=10)for(const p of sample(d,base,t).filter(p=>p.layer==='body'))widths.add(p.width);assert.equal(widths.size,1,'travel must never stretch sword');
}
const volley=defs[1];assert.equal(sample(volley,base,260).filter(p=>p.layer==='body').length,7);assert.equal(sample(volley,{...base,light:true},260).filter(p=>p.layer==='body').length,3);
const gold=defs[2],a=sample(gold,base,140).find(p=>p.layer==='body'),b=sample(gold,base,240).find(p=>p.layer==='body');assert.equal(a.x,b.x);assert(a.y<b.y);assert.equal(a.height,b.height);
console.log('PASS 3 effects: RGBA dimensions, frames, fixed-size travel, staggered volley, downward sword, hit gating, read-only input and cleanup');
