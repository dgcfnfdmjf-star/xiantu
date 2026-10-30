'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{sampleHealBatch}=require('../art/heal-skills-batch1/sampler.js'),ds=require('../art/heal-skills-batch1/preview/effect-manifest.json').effects,audit=require('../art/heal-skills-batch1/asset-audit.json');
for(const d of ds){const j=Object.freeze({actualHeal:100,fromGround:Object.freeze({x:245,y:302})}),before=JSON.stringify([d,j]),frames=new Map();
 for(let t=0;t<=d.timing.durationMs;t++){const parts=sampleHealBatch(d,j,t);for(const p of parts){assert.equal(p.anchor,'origin');assert.equal(p.width,d.display[p.layer]);assert(p.opacity>=0&&p.opacity<=1);assert(p.frame>=0&&p.frame<d.layers[p.layer].frames);assert(p.x<400,'self only');const bounds=audit.effects[d.key].frames[p.layer][p.frame].bounds;assert(p.y+(bounds[1]/256-.5)*p.height>=85,'visible pixels exclude HUD');if(!frames.has(p.layer))frames.set(p.layer,new Set());frames.get(p.layer).add(p.frame)}assert(parts.reduce((s,p)=>s+p.opacity,0)<=1.00001,'crossfade opacity must not double');}
 for(const [k,l] of Object.entries(d.layers))assert(frames.get(k).has(l.frames-1),'terminal frame '+k);
 for(const heal of [0,-1,undefined,NaN])for(let t=0;t<d.timing.durationMs;t+=5)assert(!sampleHealBatch(d,{actualHeal:heal},t).some(p=>['body','impact'].includes(p.layer)),'no fake successful healing');
 for(const state of [{hidden:true},{exited:true},{alive:false},{sameActor:false}])assert.deepEqual(sampleHealBatch(d,{...j,...state},200),[]);
 for(const t of [-1,NaN,Infinity,d.timing.durationMs,d.timing.durationMs+100])assert.deepEqual(sampleHealBatch(d,j,t),[]);
 assert.equal(JSON.stringify([d,j]),before);assert(sampleHealBatch(d,{...j,reduced:true},200).every(p=>p.frame<=2));
}
console.log('PASS: 3 healing effects; self anchors, zero-heal gating, frame reachability, crossfades, cancel, reduced motion, read-only');
