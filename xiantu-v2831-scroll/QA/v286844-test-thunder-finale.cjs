'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.thunderBatch3;assert(b,'remaining thunder skills need dedicated textures and a real-state owner');
const manifest=JSON.parse(fs.readFileSync(root+'/thunder-skills-batch3/effect-manifest.json'));
assert.deepEqual(JSON.parse(JSON.stringify(b.definitions)),manifest.effects);
for(const D of b.definitions){
 assert.equal(fx.elementBatch.definition(D.name),undefined);b.prepare(D.name);b.prepare(D.name);
 const textures=images.filter(i=>i.src?.includes('thunder-skills-batch3/'+D.key));assert.equal(textures.length,5);
 for(const im of textures){const L=Object.values(D.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=L.frames*256;im.naturalHeight=256;im.onload()}
 assert(b.ready(D.name));const j={profile:fx.profile(D.name),from:{x:260,y:205},to:{x:493,y:210},fromGround:{x:242,y:305},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,duration:1100,arriveAt:310,hitAt:310};
 assert.equal(b.sample(j,1000).length,0,'cast alone cannot invent a persistent state');assert(!b.sample({...j,hitAt:null},350).some(p=>p.layer==='impact'));
 const ctx=f.ids.get('combatPlayerChar').getContext('2d'),before=f.run('JSON.stringify([player,currentEnemy])');for(let t=0;t<1100;t+=10)fx.draw(ctx,j,t);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);
 textures[0].onerror();assert(!b.ready(D.name));assert.doesNotThrow(()=>b.drawState(ctx,{...j,stateActive:true,stateEndAt:3000},500));textures[0].onload();
}
let time=0;const data={active:true,targetToken:1,ownerToken:2,playerHp:100,enemyHp:100,thunderDomainTurns:3,thunderDomainDamage:10,thunderArmorTurns:3};
const controller=b.createState(()=>data,()=>time);
const makeJob=name=>({profile:fx.profile(name),from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},fromGround:{x:242,y:305},arriveAt:310});
const action={name:'万雷噬狱',at:0,impactAt:310};controller.notify('domain',{name:'万雷噬狱'},action);assert(action.thunderOwned);
time=1800;let list=controller.collect(makeJob);assert.equal(list.length,1);assert(b.sample(list[0].job,list[0].age).some(p=>p.layer==='body'));
assert(b.sample(list[0].job,list[0].age).every(p=>!p.id.startsWith('tick:')),'no timer-generated thunder ticks');
controller.notify('domain',{name:'九霄雷云'},{at:1700,impactAt:310});assert.equal(controller.inspect().length,1,'shared domain has one visual owner');assert.equal(controller.inspect()[0].name,'九霄雷云');
controller.notify('armor',{name:'雷神附体'},{at:1700,impactAt:310});assert.equal(controller.inspect().length,2,'armor independent of domain');
time=2300;controller.notify('tick');controller.notify('reflect');data.thunderDomainTurns=0;data.thunderArmorTurns=0;list=controller.collect(makeJob);time+=100;list=controller.collect(makeJob);assert(list.some(x=>b.sample(x.job,x.age).some(p=>p.id.startsWith('tick:'))));
time=2660;list=controller.collect(makeJob);assert(list.some(x=>b.sample(x.job,x.age).some(p=>p.id.startsWith('reflect-hit:'))),'last reflection finishes after expiration');
time=2800;assert.equal(controller.collect(makeJob).length,0);
data.thunderDomainTurns=3;controller.notify('domain',{name:'万雷噬狱'},{at:2800,impactAt:310});time=3000;controller.pause();assert.equal(controller.inspect()[0].events,0);data.targetToken=3;assert.equal(controller.collect(makeJob).length,0,'target replacement clears provenance');
controller.notify('domain',{name:'万雷噬狱'});data.enemyHp=0;assert.equal(controller.collect(makeJob).length,0,'death wins over active turns');
console.log('PASS four resource sets, cast/state separation, one shared domain, last tick/reflection, texture fallback and target/death cleanup');
function actual(name,baseline,set=false){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return .5};
 for(const file of files){if(baseline&&file==='xiantu-v2762-core.js')g.run(fs.readFileSync(path.join(root,'../art/thunder-skills-batch3/runtime-before',file),'utf8'));else g.load(file)}
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=1000;player.hp=1000;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={thunder:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;`);
 if(name==='九霄雷云')g.run(set?`NEW_SETS_V2790['万象玄霆'].slots.forEach((slot,i)=>player.equipment[slot]=newGearNameV2790('万象玄霆',i,3))`:`player.equipment.weapon=newGearNameV2790('万象玄霆',0,1)`);
 g.run(`setBattlePresentationV2756('report');startCombat({name:'血狐',hp:50000,maxHp:50000,atk:20,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});currentEnemy.atk=20;currentEnemy.def=10;`);g.timers.clear();
 const events=[];const notify=g.c.InkSkillFxV2854.thunderBatch3.notify;g.c.InkSkillFxV2854.thunderBatch3.notify=function(kind,d){events.push(kind);return notify(kind,d)};
 const before=g.run('player.mp');g.run('combat("skill",0)');g.flush(150);g.flush(300);
 assert.equal(before-g.run('player.mp'),{闪电链:30,万雷噬狱:68,雷神附体:45,九霄雷云:55}[name]);
 if(name==='万雷噬狱'||set){assert(g.run('currentEnemy.thunderDomainTurns')>0);g.run('isPlayerTurn=true;combat("attack")');}
 if(name==='雷神附体'){assert.equal(g.run('player._thunderArmorTurns'),3);g.run('player._thunderArmorTurns=1;resolveEnemyTurnV2844()');g.flush(150);assert.equal(g.run('player._thunderArmorTurns'),0);}
 const state=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,currentEnemy.hp,currentEnemy.thunderDomainTurns,currentEnemy.thunderDomainDamage,player._thunderArmorTurns,player._thunderDamageBonus,player._thunderReflectRatio,skipEnemyTurn,isPlayerTurn])');
 assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {state,rng,events};
}
for(const name of ['闪电链','万雷噬狱','雷神附体','九霄雷云'])for(const set of name==='九霄雷云'?[false,true]:[false]){
 const old=actual(name,true,set),now=actual(name,false,set);assert.equal(now.state,old.state,name+' actual state unchanged');assert.equal(now.rng,old.rng,name+' RNG unchanged');
 if(name==='万雷噬狱'||set)assert(now.events.includes('domain')&&now.events.includes('tick'));
 if(name==='雷神附体')assert(now.events.includes('armor')&&now.events.includes('reflect'));
 if(name==='九霄雷云'&&!set)assert(!now.events.includes('domain'));
}
console.log('PASS original-core comparison: 30/68/45/55 MP, identical damage/states/RNG; actual domain/tick/armor events and ordinary/set cloud distinction');
