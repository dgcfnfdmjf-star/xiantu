'use strict';
const a=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),{sampleHealGuard}=require('../art/heal-skills-batch3/sampler.js');
const root=path.resolve(__dirname,'../art/heal-skills-batch3'),defs=require(root+'/preview/effect-manifest.json').effects,audit=require(root+'/asset-audit.json');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let checks=0;
for(const d of defs){
 const j=Object.freeze({actualHeal:100,guardOwned:true,fromGround:Object.freeze({x:245,y:302})}),before=JSON.stringify([d,j]),frames=new Map();
 for(let t=0;t<2500;t++){
  const parts=sampleHealGuard(d,j,t);for(const p of parts){a.equal(p.anchor,'origin');a.equal(p.width,d.display[p.layer]);a(p.opacity>=0&&p.opacity<=1);a(p.frame>=0&&p.frame<d.layers[p.layer].frames);const b=audit.effects[d.key].frames[p.layer][p.frame].bounds;a(p.y+(b[1]/256-.5)*p.height>155,'face/HUD readable');a(p.x+(b[2]/256-.5)*p.width<380,'self only');if(!frames.has(p.layer))frames.set(p.layer,new Set());frames.get(p.layer).add(p.frame)}
  a(parts.filter(p=>['telegraph','body','impact','residue'].includes(p.layer)).reduce((n,p)=>n+p.opacity,0)<=1.00001,'cast layers crossfade');
 }
 for(const name of ['telegraph','body','impact','residue','guard'])a(frames.get(name).has(d.layers[name].frames-1),'last frame reachable: '+name);checks+=6;
 a(sampleHealGuard(d,j,100000).some(p=>p.layer==='guard'),'no fabricated expiry');
 for(const heal of [0,undefined,NaN,-1,Infinity]){a(!sampleHealGuard(d,{...j,actualHeal:heal},180).some(p=>['body','impact'].includes(p.layer)));a(sampleHealGuard(d,{...j,actualHeal:heal},900).some(p=>p.layer==='guard'))}checks+=11;
 for(const consumed of [0,300,500,1600]){const seen=new Set();for(let t=consumed;t<consumed+220;t++){const p=sampleHealGuard(d,{...j,guardConsumedAt:consumed},t);a(!p.some(p=>p.layer==='guard'));for(const v of p)if(v.layer==='consume')seen.add(v.frame)}a(seen.has(5));for(const t of [consumed+220,900,2000,10000].filter(t=>t>=consumed+220))a(!sampleHealGuard(d,{...j,guardConsumedAt:consumed},t).some(p=>['guard','consume'].includes(p.layer)),'consumed guard never grows back');}checks+=4;
 for(const t of [1000,1500,3000])a(!sampleHealGuard(d,{...j,guardReplacedAt:1000,guardConsumedAt:1600},t).some(p=>['guard','consume'].includes(p.layer)),'replacement does not falsely shatter');
 a(!sampleHealGuard(d,{...j,guardOwned:false},900).length);a(sampleHealGuard(d,{...j,guardOwned:false},180).some(p=>p.layer==='body'),'weaker guard cast may still heal');checks+=5;
 for(const state of [{hidden:true},{exited:true},{alive:false},{sameActor:false},{sameTarget:false}])a.deepEqual(sampleHealGuard(d,{...j,...state},900),[]);for(const t of [-1,NaN,Infinity])a.deepEqual(sampleHealGuard(d,j,t),[]);checks+=8;
 const normal=sampleHealGuard(d,j,900)[0],shift=sampleHealGuard(d,{...j,fromGround:{x:345,y:402}},900)[0];a.equal(shift.x-normal.x,100);a.equal(shift.y-normal.y,100);a.equal(sampleHealGuard(d,{...j,scale:1.2},900)[0].width,normal.width*1.2);a.equal(sampleHealGuard(d,{...j,reduced:true},900)[0].frame,0);a.equal(sampleHealGuard(d,{...j,light:true},900)[0].frame%2,0);a.equal(JSON.stringify([d,j]),before);checks+=6;
 for(const [f,sha] of Object.entries(audit.effects[d.key].outputHashes))a.equal(hash(root+'/preview/'+f),sha,'current resource matches audit');for(const [f,sha] of Object.entries(audit.effects[d.key].inputs))a.equal(hash(root+'/source/'+d.key+'/'+(f==='master'?'master':'keyplates')+'-original.png'),sha,'current source matches audit');
}
console.log('PASS '+checks+' grouped checks: source hashes, self anchors, HP/guard independence, indefinite guard loop, early consumption, replacement, cancellation, last frames, crossfades and read-only sampling');
