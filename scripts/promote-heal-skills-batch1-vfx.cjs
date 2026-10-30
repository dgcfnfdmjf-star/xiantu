#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const R=path.resolve(__dirname,'..'),A=path.join(R,'art/heal-skills-batch1'),G=path.join(R,'xiantu-v2831-scroll'),P=path.join(A,'preview'),dest=path.join(G,'heal-skills-batch1'),h=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const unchanged={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(p===dest)continue;if(e.isDirectory())walk(p);else if(/\.(png|jpg|webp)$/.test(p))unchanged[path.relative(G,p)]=h(p)}}walk(G);
fs.mkdirSync(dest,{recursive:true});const files=fs.readdirSync(P).filter(n=>n.endsWith('.png')||n==='effect-manifest.json');for(const n of files){fs.copyFileSync(path.join(P,n),path.join(dest,n));if(h(path.join(P,n))!==h(path.join(dest,n)))throw Error(n)}
const defs=JSON.parse(fs.readFileSync(path.join(P,'effect-manifest.json'))).effects;
let sampler=fs.readFileSync(path.join(A,'sampler.js'),'utf8');sampler=sampler.slice(sampler.indexOf('function sampleHealBatch'),sampler.indexOf("if(typeof module"));
const block='  // BEGIN HEAL BATCH1 GENERATED\n  const HEAL_BATCH1='+JSON.stringify(defs)+';\n'+sampler+'  // END HEAL BATCH1 GENERATED\n';
const file=path.join(G,'xiantu-v2855-skill-fx.js');let code=fs.readFileSync(file,'utf8');if(code.includes('// BEGIN HEAL BATCH1 GENERATED'))code=code.replace(/  \/\/ BEGIN HEAL BATCH1 GENERATED\n[\s\S]*?  \/\/ END HEAL BATCH1 GENERATED\n/,()=>block);else code=code.replace('  const fireBatchTextures=new Map();',block+'  const fireBatchTextures=new Map();');fs.writeFileSync(file,code);
for(const [n,v] of Object.entries(unchanged))if(h(path.join(G,n))!==v)throw Error('Unrelated art changed: '+n);
fs.writeFileSync(path.join(A,'runtime-promotion-audit.json'),JSON.stringify({command:'node scripts/promote-heal-skills-batch1-vfx.cjs',status:'user approved preview and integration; runtime checks recorded separately',sha256:Object.fromEntries(files.map(n=>[n,h(path.join(dest,n))])),unchangedArt:unchanged},null,2)+'\n');console.log('PASS identical promotion:',files.length,'files; unchanged art:',Object.keys(unchanged).length);
