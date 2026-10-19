'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),{sampleSwordBatch:sample}=require(root+'/art/sword-skills-batch2/sampler.js');
const defs=require(root+'/art/sword-skills-batch2/preview/effect-manifest.json').effects;
const base={from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:310};
for(const d of defs){
 for(const l of Object.values(d.layers)){const b=fs.readFileSync(root+'/art/sword-skills-batch2/preview/'+l.file);assert.equal(b.readUInt32BE(16),l.frames*l.frameWidth);assert.equal(b.readUInt32BE(20),l.frameHeight);assert.equal(b[25],6,'RGBA required')}
 const before=JSON.stringify(base);for(let t=0;t<1600;t+=10){const parts=sample(d,base,t);assert.equal(JSON.stringify(base),before);for(const p of parts){assert(p.frame>=0&&p.frame<d.layers[p.layer].frames);assert(p.opacity>0&&p.opacity<=1);for(const k of ['x','y','width','height','rotation'])assert(Number.isFinite(p[k]));}if(t<310)assert(!parts.some(p=>p.layer==='impact'));assert(!sample(d,{...base,hitAt:null},t).some(p=>['impact','residue'].includes(p.layer)));}
 assert.equal(sample(d,base,1600).length,0);
 for(const state of [{hidden:true},{exited:true},{alive:false},{sameTarget:false}])assert.equal(sample(d,{...base,...state},350).length,0);
 const widths=new Set();for(let t=100;t<300;t+=10)for(const p of sample(d,base,t).filter(p=>p.layer==='body'))widths.add(p.width);assert.equal(widths.size,1,'travel must never stretch sword');
}
for(const d of defs){
 const a=sample(d,base,140).find(p=>p.layer==='body'),b=sample(d,base,240).find(p=>p.layer==='body');assert(a.x<b.x);assert.equal(a.width,b.width);
 for(let t=0;t<1000;t+=10)assert(sample(d,base,t).filter(p=>p.layer==='body').length<=1);
 const reverse={...base,from:base.to,to:base.from};assert(sample(d,reverse,140).find(p=>p.layer==='body').x>sample(d,reverse,240).find(p=>p.layer==='body').x);
 for(const layer of Object.keys(d.layers)){const frames=new Set();for(let t=0;t<1050;t++)for(const p of sample(d,base,t))if(p.layer===layer)frames.add(p.frame);assert.equal(frames.size,d.layers[layer].frames);}
}
console.log('PASS three effects: RGBA dimensions, complete frame playback, bidirectional fixed-size travel, single body, hit gating, read-only input and cleanup');
