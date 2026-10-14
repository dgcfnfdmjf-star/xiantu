'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.fireFinale;assert(b,'fire bind and shield need live-state rendering');
const live={active:true,playerHp:100,enemyHp:100,chillTurns:1,bindConfirmed:true,guardElement:'fire',guardPool:30,guardTurns:3};
assert(b.bindActive(live));assert(b.guardActive(live));
for(const patch of [{active:false},{enemyHp:0},{chillTurns:0},{bindConfirmed:false}])assert(!b.bindActive({...live,...patch}));
for(const patch of [{active:false},{playerHp:0},{enemyHp:0},{guardPool:0},{guardTurns:0},{guardElement:'ice'}])assert(!b.guardActive({...live,...patch}));
const ctx=f.ids.get('combatPlayerChar').getContext('2d');
for(const name of ['流火飞索','炎阳护盾']){
 fx.elementBatch.prepare(name);const D=fx.elementBatch.definition(name);for(const im of images.filter(im=>Object.values(D.layers).some(l=>im.src?.endsWith(l.file)))){const L=Object.values(D.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=L.frames*256;im.naturalHeight=256;im.onload();}
 const j={profile:fx.profile(name),from:{x:250,y:205},to:{x:493,y:210},toGround:{x:493,y:278},fromGround:{x:242,y:305},width:720,clipBottom:355,scale:1,duration:1100,arriveAt:310,hitAt:310};
 const state=f.run('JSON.stringify([player,currentEnemy])');for(let age=0;age<1200;age+=5)fx.draw(ctx,j,age);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),state);
 for(const [key,L] of Object.entries(D.layers))assert(Array.from({length:1100},(_,age)=>fx.elementBatch.sample(j,age)).flat().some(p=>p.layer===key&&p.frame===L.frames-1),name+' '+key+' terminal frame');
 assert.equal(fx.elementBatch.sample({...j,exited:true},450).length,0);
 assert(!fx.elementBatch.sample({...j,hitAt:null},450).some(p=>['impact','residue'].includes(p.layer)));
}
assert.equal(fx.elementBatch.sample({profile:fx.profile('炎阳护盾'),from:{x:250,y:205},to:{x:250,y:205},toGround:{x:242,y:305},duration:1100,hitAt:310,guardActive:false},500).length,0,'depleted shield cancels formation');
console.log('PASS fire finale lifecycle and read-only rendering');
// Real combat remains authoritative, including the shared ice/fire shield pool.
function actual(name,suppress,randomValue){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return randomValue};for(const file of files)g.load(file);
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={fire:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'苍山野狼',hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});`);g.timers.clear();
 if(suppress)g.run('playInkSkillV2854=()=>true;InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{};InkSkillFxV2854.fireFinale.drawStatus=()=>{}');
 const mp=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mp-(name==='流火飞索'?35:30));g.flush(300);
 const view=g.run('XiantuDuel25D.readCombatElements(currentEnemy,player)');
 if(name==='流火飞索'){assert.equal(view.chillTurns,1);assert.equal(g.run('currentEnemy.burnTurns'),2);assert.equal(g.run('currentEnemy._chillV286818'),.3);assert.equal(g.run('enemyAttackV286818()/currentEnemy.atk'),.85);}
 else{
  assert.equal(view.guardPool,g.run('Math.floor(getMaxHp()*.2)'));assert.equal(view.guardTurns,3);assert.equal(view.guardElement,'fire');assert.equal(g.run('currentEnemy.hp'),50000,'shield deals no damage');
  view.guardPool=999;assert.notEqual(g.run('elementGuardsV286818.get(currentEnemy).pool'),999,'snapshot cannot mutate pool');
  assert.equal(g.run('XiantuDuel25D.readCombatElements(currentEnemy,{}).guardPool'),0,'owner isolation');
  const pool=g.run('elementGuardsV286818.get(currentEnemy).pool');assert.equal(g.run('absorbElementGuardV286818(12)'),0);assert.equal(g.run('elementGuardsV286818.get(currentEnemy).pool'),pool-12);
  g.run('applyElementGuardV286818(SKILLS.find(s=>s.name==="炎阳护盾"))');assert.equal(g.run('elementGuardsV286818.get(currentEnemy).pool'),pool,'refresh uses max, never sum');
  g.run('applyElementGuardV286818(SKILLS.find(s=>s.name==="冰甲护身"))');assert.equal(g.run('XiantuDuel25D.readCombatElements(currentEnemy,player).guardElement'),'ice');
  g.run('finishEnemyElementsV286818(currentEnemy,player);finishEnemyElementsV286818(currentEnemy,player);finishEnemyElementsV286818(currentEnemy,player)');assert.equal(g.run('XiantuDuel25D.readCombatElements(currentEnemy,player).guardPool'),0);
 }
 const state=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,player.inventory,currentEnemy.hp,currentEnemy.def,currentEnemy.burnTurns,currentEnemy.burnStacks,currentEnemy._chillV286818,XiantuDuel25D.readCombatElements(currentEnemy,player),skipEnemyTurn,isPlayerTurn])');assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {state,rng};
}
for(const name of ['流火飞索','炎阳护盾'])for(const random of [.1,.9])assert.deepEqual(actual(name,false,random),actual(name,true,random));
console.log('PASS real 35/30 MP casts, 2.4 damage/burn/slow, 20% shield, absorption/refresh/expiry/ice replacement and unchanged state/RNG');
// Exercise persistent drawing through the actual scene owner, with one RAF.
const ink=images.find(i=>i.src?.includes('duel-ink-poses'));ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();let serial=0,clock=1000;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>clock;
f.run('var finaleData={active:true,targetToken:1,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100,chillTurns:1,guardPool:0,guardTurns:0,guardElement:null};var finaleHost=document.createElement("div");document.body.appendChild(finaleHost);var finaleScene=XiantuDuel25D.create(finaleHost,()=>finaleData)');
let marks=[];const drawStatus=b.drawStatus;b.drawStatus=function(c,kind,x,y,age,reduced,scale,opacity,pulse){if(opacity>0)marks.push({kind,opacity,pulse,age});return drawStatus.apply(this,arguments)};
function tick(ms=40){clock+=ms;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(clock);assert(frames.size<=1,'one RAF');}
function advance(ms){for(let n=0;n<ms;n+=40)tick();}
advance(1200);assert(!marks.some(m=>m.kind==='bind'),'generic ice chill cannot become fire bind');
function castBind(){f.run('finaleData.chillTurns=1;finaleScene.act("player","fire","流火飞索");finaleScene.hit("enemy",10);finaleScene.elementApplied({element:"fire",effect:"fireBind"})');advance(1400);assert(marks.some(m=>m.kind==='bind'));marks=[];}
castBind();advance(600);assert(marks.some(m=>m.kind==='bind'),'bind survives short cast');marks=[];f.run('finaleScene.elementApplied({element:"ice"})');advance(160);assert(!marks.some(m=>m.kind==='bind'),'ice replaces shared chill provenance');
castBind();f.run('finaleData.chillTurns=0');advance(120);marks=[];f.run('finaleData.chillTurns=2');advance(200);assert(!marks.some(m=>m.kind==='bind'),'expired bind cannot reappear from generic slow');
castBind();f.run('finaleData.targetToken=2');marks=[];advance(120);assert(!marks.some(m=>m.kind==='bind'));
f.run('finaleScene.reset();Object.assign(finaleData,{chillTurns:0,guardPool:50,guardTurns:3,guardElement:"fire"});finaleScene.act("player","fire","炎阳护盾")');marks=[];advance(840);assert(!marks.some(m=>m.kind==='guard'),'formation owns shield');advance(600);assert(marks.some(m=>m.kind==='guard'));assert(marks.some(m=>m.kind==='guard'&&m.opacity<1),'crossfade into persistent dome');
marks=[];f.run('finaleData.guardPool=30');advance(120);assert(marks.some(m=>m.kind==='guard'&&m.pulse>0),'real pool loss pulses');
marks=[];f.run('finaleData.guardPool=0');advance(120);assert(!marks.some(m=>m.kind==='guard'));assert(marks.some(m=>m.kind==='break'));advance(240);marks=[];advance(200);assert.equal(marks.length,0,'break is one shot');
f.run('Object.assign(finaleData,{guardPool:50,guardTurns:3,guardElement:"fire"})');advance(160);marks=[];f.run('finaleData.guardElement="ice"');advance(160);assert.equal(marks.length,0,'ice shield replaces fire with no lingering fire');
f.run('finaleData.guardElement="fire"');advance(160);f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);marks=[];f.run('finaleData.guardTurns=0');f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();advance(240);assert.equal(marks.length,0,'hidden expiry never replays a break');
f.run('Object.assign(finaleData,{guardPool:50,guardTurns:3});finaleScene.act("player","fire","炎阳护盾")');advance(120);f.run('finaleData.guardPool=0');advance(1400);marks=[];advance(240);assert.equal(marks.length,0,'early shield break cannot resurrect after formation');
f.run('finaleData.active=false');advance(120);assert.equal(frames.size,0);assert.equal(f.errors.length,0,JSON.stringify(f.errors));
console.log('PASS persistent fire ownership, ice replacement, depletion/expiry, one-shot break, hidden/exit cleanup and one RAF');
