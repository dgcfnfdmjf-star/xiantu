'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{sampleHealBatch}=require('../art/heal-skills-batch2/sampler.js'),ds=require('../art/heal-skills-batch2/preview/effect-manifest.json').effects,audit=require('../art/heal-skills-batch2/asset-audit.json');
for(const d of ds){const j=Object.freeze({actualHeal:100,actualMpRestore:12,fromGround:Object.freeze({x:245,y:302})}),before=JSON.stringify([d,j]),frames=new Map();
 for(let t=0;t<=d.timing.durationMs;t++){const parts=sampleHealBatch(d,j,t);for(const p of parts){assert.equal(p.anchor,'origin');assert.equal(p.width,d.display[p.layer]);assert(p.opacity>=0&&p.opacity<=1);assert(p.frame>=0&&p.frame<d.layers[p.layer].frames);assert(p.x<400,'self only');const bounds=audit.effects[d.key].frames[p.layer][p.frame].bounds;assert(p.y+(bounds[1]/256-.5)*p.height>=155,'visible pixels exclude face and HUD');assert(p.x+(bounds[2]/256-.5)*p.width<380,'visible pixels stay away from enemy');if(!frames.has(p.layer))frames.set(p.layer,new Set());frames.get(p.layer).add(p.frame)}for(const channel of ['hp','mp'])assert(parts.filter(p=>p.channel===channel).reduce((s,p)=>s+p.opacity,0)<=1.00001,'per-channel crossfade opacity must not double');}
 for(const [k,l] of Object.entries(d.layers))assert(frames.get(k).has(l.frames-1),'terminal frame '+k);
 for(const heal of [0,-1,undefined,NaN])for(let t=0;t<d.timing.durationMs;t+=5)assert(!sampleHealBatch(d,{actualHeal:heal},t).some(p=>['body','impact'].includes(p.layer)),'no fake successful healing');
 for(const state of [{hidden:true},{exited:true},{alive:false},{sameActor:false},{sameTarget:false}])assert.deepEqual(sampleHealBatch(d,{...j,...state},200),[]);
 for(const t of [-1,NaN,Infinity,d.timing.durationMs,d.timing.durationMs+100])assert.deepEqual(sampleHealBatch(d,j,t),[]);
 assert.equal(JSON.stringify([d,j]),before);assert(sampleHealBatch(d,{...j,reduced:true},200).every(p=>p.frame<=2));
}
for(const d of ds){
 const t=(d.preview.layers.body.start+d.preview.layers.body.end)*.5*d.timing.durationMs;
 const both=sampleHealBatch(d,{actualHeal:100,actualMpRestore:12},t);
 const mpOnly=sampleHealBatch(d,{actualHeal:0,actualMpRestore:12},t);
 if(d.key==='spring_reflux'){
  assert.equal(both.length,2);assert.equal(mpOnly.length,1);assert.equal(mpOnly[0].channel,'mp');
  for(const bad of [undefined,NaN,Infinity,-1,0])assert.deepEqual(sampleHealBatch(d,{actualHeal:0,actualMpRestore:bad},t),[]);
 }else assert.equal(mpOnly.length,0);
 if(d.key==='fate_mend'){
  const emergency=sampleHealBatch(d,{actualHeal:100,emergency:true},t);
  assert.notEqual(both[0].file,emergency[0].file);
  assert.equal(both[0].frame,emergency[0].frame);assert.equal(both[0].width,emergency[0].width);
 }
}
console.log('PASS: 3 healing effects; self anchors, HP/MP gating, emergency branch, frame reachability, crossfades, cancel, reduced motion, read-only');
