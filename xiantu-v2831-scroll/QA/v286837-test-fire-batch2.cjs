'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.fireBatch2;assert(b,'approved fire batch must be integrated');
const manifest=JSON.parse(fs.readFileSync(root+'/fire-skills-batch2/effect-manifest.json'));
assert.deepEqual(JSON.parse(JSON.stringify(b.definitions)),manifest.effects);
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push([im.src,...args]);
for(const D of b.definitions){
 b.prepare(D.name);b.prepare(D.name);const textures=images.filter(i=>(i.src||'').includes('fire-skills-batch2/'+D.key));assert.equal(textures.length,Object.keys(D.layers).length);
 for(const im of textures){const spec=Object.values(D.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=spec.frames*spec.frameWidth;im.naturalHeight=spec.frameHeight;im.onload()}
 assert(b.ready(D.name));const j={profile:fx.profile(D.name,'fire'),from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,light:false,reduced:false,duration:1100,arriveAt:310,hitAt:310,burn:{burnTurns:3,burnStacks:10,_burnHealBlockV286818:true}};
 const before=f.run('JSON.stringify([player,currentEnemy])');let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};
 for(let age=0;age<1200;age+=5)fx.draw(ctx,j,age);assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);
 for(const [layer,L] of Object.entries(D.layers))assert(Array.from({length:2600},(_,age)=>b.sample(j,age)).flat().some(p=>p.layer===layer&&p.frame===L.frames-1),D.name+' '+layer+' final frame');
 assert(!b.sample({...j,hitAt:null},430).some(p=>['impact','status','residue'].includes(p.layer)));
 assert.equal(b.sample({...j,duration:200},210).length,0,'owner expiry wins');
 textures[0].onerror();assert(!b.ready(D.name));assert.doesNotThrow(()=>fx.draw(ctx,j,400));textures[0].onload();
}
assert(draws.some(d=>d[0].endsWith('karmic_lotus_status.png'))||b.drawStatus(ctx,493,278,1000,false));
assert(b.statusActive({enemyHp:10,burnTurns:3,burnDamage:10,burnHealBlock:true}));
for(const patch of [{enemyHp:0},{burnTurns:0},{burnDamage:0},{burnHealBlock:false}])assert(!b.statusActive({enemyHp:10,burnTurns:3,burnDamage:10,burnHealBlock:true,...patch}));
console.log('PASS three fire assets, lazy cache, final frames, event gating, expiry, fallback, read-only draw');
function actual(name,suppress,turns,randomValue){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return randomValue};for(const file of files)g.load(file);
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={fire:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'血狐',hp:50000,maxHp:50000,atk:1,def:100,gold:1,exp:1,_realmLevel:0,_realmPhase:0});`);g.timers.clear();g.run(`currentEnemy.burnTurns=${turns};currentEnemy.burnStacks=10;currentEnemy._burnHealBlockV286818=${turns>0}`);
 if(suppress)g.run('playInkSkillV2854=()=>true;InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{}');
 const mp=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mp-({红莲业火:32,火墙术:28,三昧真火:42}[name]));g.flush(300);
 assert.equal(g.run('currentEnemy.burnTurns'),name==='三昧真火'?2:3);
 assert.equal(g.run('!!currentEnemy._burnHealBlockV286818'),name==='红莲业火'||turns>1,'expired burn clears old heal-block; active burn refresh retains it');
 assert.equal(g.run(`SKILLS.find(s=>s.name===${JSON.stringify(name)}).damage`),({红莲业火:2.6,火墙术:2.3,三昧真火:3.2}[name]));
 if(name==='红莲业火')assert(!g.run('monsterAvailableV2844({mp:999,cooldowns:{},round:1,heals:0}).includes("heal")'));
 const state=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,player.inventory,currentEnemy.hp,currentEnemy.def,currentEnemy.burnTurns,currentEnemy.burnStacks,currentEnemy._burnWeakV286818,currentEnemy._burnHealBlockV286818,skipEnemyTurn,isPlayerTurn])');assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {state,rng};
}
for(const name of ['红莲业火','火墙术','三昧真火'])for(const turns of [0,1,3])for(const random of [.1,.9])assert.deepEqual(actual(name,false,turns,random),actual(name,true,turns,random));
assert.equal(f.run('SKILLS.find(s=>s.name==="三昧真火").armorPierce'),.4);
console.log('PASS real equipped casts: 32/28/42 MP, 2.6/2.3/3.2 damage, burn/heal block and 40% pierce, unchanged state/RNG');
// Exercise the real scene owner with a changing read-only burn snapshot.
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();let serial=0;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>1000;
f.run('var fire2Data={active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100,burnTurns:3,burnDamage:10,burnHealBlock:true};var fire2Host=document.createElement("div");document.body.appendChild(fire2Host);var fire2Scene=XiantuDuel25D.create(fire2Host,()=>fire2Data);fire2Scene.act("player","fire","红莲业火");fire2Scene.hit("enemy",10)');
let mark=0;b.drawStatus=()=>{mark++;return true};
function tick(t){const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(t)}
for(let t=1050;t<1850;t+=40)tick(t);assert.equal(mark,0,'short lotus owns the target');
for(let t=1890;t<2450;t+=40)tick(t);assert(mark>0,'lotus status begins after the short outro');
for(const patch of [{burnTurns:0},{burnDamage:0},{burnHealBlock:false},{enemyHp:0}]){
 f.run('Object.assign(fire2Data,{active:true,enemyHp:100,burnTurns:3,burnDamage:10,burnHealBlock:true},'+JSON.stringify(patch)+')');mark=0;tick(2600+serial*100);assert.equal(mark,0,'state removal wins');
}
f.run('Object.assign(fire2Data,{enemyHp:100,burnTurns:3,burnDamage:10,burnHealBlock:true})');tick(3000+serial*100);assert(mark>0);
f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);mark=0;f.run('fire2Data.burnTurns=0');f.c.performance.now=()=>6000;f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();tick(6100);assert.equal(mark,0);
f.run('fire2Data.active=false');tick(6200);assert.equal(frames.size,0,'target change/exit destroys scene');f.run('fire2Scene.destroy()');assert.equal(frames.size,0);
console.log('PASS one burn owner, no early lotus mark, expiry/death/target/hidden cleanup, no extra RAF');
