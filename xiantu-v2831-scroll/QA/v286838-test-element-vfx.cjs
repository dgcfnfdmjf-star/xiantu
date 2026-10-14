'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.elementBatch;assert(b,'element batch must be integrated');
const families={thunder_strike:'thunder',sword_qi:'sword',jade_lotus_heal:'heal',frost_palm:'ice',ice_spike:'ice',ice_burst:'ice',frost_dragon_breath:'ice',frozen_expanse:'ice',frost_barrier:'ice',glacier_prison:'ice',abyss_domain:'ice',soul_seal:'ice',eternal_crystal:'ice',frost_armor:'ice',solar_aegis:'fire',flame_bind:'fire',mountain_quake:'earth',sun_spear:'spear'};
assert.deepEqual(JSON.parse(JSON.stringify(b.definitions.map(d=>d.key))),Object.keys(families));
const known=new Set(fx.catalog().map(p=>p.name));
for(const D of b.definitions){
 for(const layer of ['telegraph','body','impact','residue']){
  const L=D.layers[layer],file=root+'/element-skills-v286838/'+L.file;assert(fs.existsSync(file),file);
  const png=fs.readFileSync(file);assert.equal(png.readUInt32BE(16),L.frames*L.frameWidth,file+' width');assert.equal(png.readUInt32BE(20),L.frameHeight,file+' height');
 }
 for(const name of D.skills){
  assert(known.has(name),name+' is a real skill');
  const p=fx.profile(name);assert.equal(p.family,families[D.key],name+' family');
  assert.equal(fx.elementBatch.definition(name),D);assert.equal(fx.authoredDuration(name),1100);
 }
}
const all=b.definitions.flatMap(d=>d.skills);
for(const D of b.definitions.filter(d=>d.element==='ice'))assert.equal(D.skills.length,1,D.key+' is dedicated to one ice skill');assert.equal(new Set(all).size,all.length,'each skill has one owner');
for(const name of ['雷法','惊雷闪','裂地奔雷','紫霄落雷','万雷噬狱','九天神雷','闪电链','雷神附体','无音神雷','御剑术','剑气纵横','万剑归宗','天地一剑','清风剑诀','破甲剑罡','追魂一剑','饮血剑诀','玄罡护体剑','回春术','生生不息','起死回生','凝露诀','青莲护心','灵泉归元','逆命回元','莲华济世','寒冰掌','玄冰刺','冰爆术','霜龙吐息','冰封千里','霜寒结界','冰河葬狱','寒渊领域','冰魄封魂','万载寒晶','冰甲护身','炎阳护盾','流火飞索','镇岳山河震','穿云贯日'])assert(all.includes(name),name+' covered');
assert.equal(fx.authoredDuration('雷神附体·反噬'),0);for(const name of ['绝对零度','冰蝶幻舞','太阳真火','焚心炎'])assert.equal(b.definition(name),undefined,name+' keeps its own dedicated path');
for(const name of ['冰甲护身','炎阳护盾'])assert(fx.profile(name).self,name+' is a self cast');
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push(im.src);
for(const D of b.definitions){
 const name=D.skills[1]??D.skills[0];
 const j={profile:fx.profile(name),from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,light:false,reduced:false,duration:1100,arriveAt:310,hitAt:null};
 draws.length=0;fx.draw(ctx,j,200);assert(!draws.some(s=>s.includes('element-skills')),'procedural fallback until textures load');
 for(const other of D.skills)b.prepare(other);
 const textures=images.filter(i=>(i.src||'').includes('element-skills-v286838/'+D.key+'_'));assert.equal(textures.length,4,'one shared texture set per family');
 for(const im of textures){const L=Object.values(D.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=L.frames*L.frameWidth;im.naturalHeight=L.frameHeight;im.onload()}
 for(const other of D.skills)assert(b.ready(other),other+' ready');
 if(fx.profile(name).self){j.to=j.from;j.toGround={x:260,y:305};j.hitAt=170}
 assert(!b.sample(j,430).some(p=>['impact','residue'].includes(p.layer))||j.hitAt!==null,'no impact before the hit event');
 j.hitAt=j.hitAt??310;
 const before=f.run('JSON.stringify([player,currentEnemy])');let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};
 draws.length=0;for(let age=0;age<1200;age+=5)fx.draw(ctx,j,age);assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);f.c.Math=Math;
 for(const layer of ['telegraph','body','impact','residue'])assert(draws.some(s=>s.endsWith(D.key+'_'+layer+'.png')),D.key+' draws '+layer);
 for(const [layer,L] of Object.entries(D.layers))assert(Array.from({length:1200},(_,age)=>b.sample(j,age)).flat().some(p=>p.layer===layer&&p.frame===L.frames-1),D.key+' '+layer+' final frame');
 assert.equal(b.sample(j,1150).length,0,'expires within the job');assert.equal(b.sample({...j,duration:200},210).length,0,'owner expiry wins');
 textures[0].onerror();assert(!b.ready(name));assert.doesNotThrow(()=>fx.draw(ctx,j,400));textures[0].onload();
}
const heal=b.sample({profile:fx.profile('回春术'),from:{x:260,y:205},to:{x:260,y:205},toGround:{x:260,y:305},duration:1100,arriveAt:310,hitAt:170,scale:1},400);
assert(heal.length&&heal.every(p=>p.x===260&&p.y===305),'heal anchors on the caster foot');
const ward=b.sample({profile:fx.profile('冰甲护身'),from:{x:260,y:205},to:{x:260,y:205},toGround:{x:260,y:305},duration:1100,arriveAt:310,hitAt:170,scale:1},400);
assert(ward.length&&ward.every(p=>p.x===260&&p.y===305),'ice armor anchors on the caster foot');
console.log('PASS element sprite VFX: '+b.definitions.length+' families, '+all.length+' skills, lazy textures, hit gating, final frames, expiry, read-only draw');
