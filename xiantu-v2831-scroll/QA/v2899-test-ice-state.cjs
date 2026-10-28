'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const ice=f.c.InkSkillFxV2854.iceFinale;assert(ice,'ice states must outlive the cast and follow real combat state');
let time=0;const d={active:true,ownerToken:1,targetToken:2,playerHp:100,enemyHp:100,frozen:true,frostTurns:3,frostDamage:10,sealTurns:1,guardElement:'ice',guardPool:20,guardTurns:3};
const c=ice.createState(()=>d,()=>time);
assert.equal(c.collect().length,0,'unconfirmed generic counters cannot create ice provenance');
c.notify('apply',{name:'万载寒晶',freeze:true,frost:true});c.notify('apply',{name:'冰魄封魂',seal:true});c.notify('guard',{name:'冰甲护身'});
time=1400;assert.deepEqual(Array.from(c.collect(),r=>r.kind).sort(),['freeze','frost','guard','seal']);
c.notify('tick');d.frostTurns=0;time+=60;let records=c.collect();assert(records.find(r=>r.kind==='frost').pulse>0,'last real tick survives expiry');
time+=300;assert(!c.collect().some(r=>r.kind==='frost'));
d.frostTurns=3;assert(!c.collect().some(r=>r.kind==='frost'),'expired state never resurrects from unrelated counters');
c.notify('apply',{name:'寒渊领域',frost:true});c.notify('apply',{name:'霜寒结界',frost:true});assert.equal(c.collect().filter(r=>r.kind==='frost').length,1,'refresh replaces visual owner');
d.guardPool=0;time+=20;assert(c.collect().some(r=>r.kind==='guard'&&r.ending));time+=250;assert(!c.collect().some(r=>r.kind==='guard'));
d.guardPool=20;c.notify('guard');d.guardElement='fire';assert(!c.collect().some(r=>r.kind==='guard'),'replacement does not show an ice shatter');
c.notify('seal-clear');assert(!c.collect().some(r=>r.kind==='seal'),'thunder seal replaces ice provenance');
c.pause();d.frozen=false;time+=500;assert(!c.collect().some(r=>r.kind==='freeze'),'hidden expiry does not replay');
d.targetToken=3;assert.equal(c.collect().length,0);c.notify('apply',{frost:true});d.playerHp=0;assert.equal(c.collect().length,0);
console.log('PASS ice provenance, final tick, refresh, shield replacement, seal ownership, hidden/target/death cleanup');
// Every ice spell still pays exactly once and consumes the same random stream.
function actual(name,disabled,random){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return random};for(const file of files)g.load(file);
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=1000;player.hp=1000;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={ice:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'苍山野狼',hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});`);g.timers.clear();
 const events=[],b=g.c.InkSkillFxV2854.iceFinale,notify=b.notify;b.notify=(k,d)=>{events.push({k,...d});if(!disabled)notify(k,d)};
 const before=g.run('player.mp'),cost=g.run('player.skills[0].mpCost');g.run('combat("skill",0)');g.flush(150);g.flush(300);assert.equal(before-g.run('player.mp'),cost,name+' MP');
 const view=g.run('XiantuDuel25D.readCombatElements(currentEnemy,player)');
 if(name==='冰甲护身'){
  assert.equal(view.guardPool,g.run('Math.floor(getMaxHp()*.2)'));assert.equal(view.guardTurns,3);assert.equal(view.guardElement,'ice');assert.equal(g.run('currentEnemy.hp'),50000);
  assert(events.some(e=>e.k==='guard'));if(!disabled)assert(g.c.InkSkillFxV2854.inspect().iceStates.includes('guard'),'report shield owns a live record');g.run('absorbElementGuardV286818(12);finishEnemyElementsV286818(currentEnemy,player)');
 }else{
  const apply=events.find(e=>e.k==='apply');assert(apply,name+' acknowledged hit');
  assert.equal(!!apply.freeze,view.frozen);assert.equal(!!apply.frost,view.frostTurns>0);assert.equal(!!apply.seal,name==='冰魄封魂');
  if(apply.frost){g.run('isPlayerTurn=true;combat("attack")');assert(events.some(e=>e.k==='tick'));assert.equal(g.run('currentEnemy._frostTurnsV286818'),2);}
 }
 const result=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,currentEnemy.hp,currentEnemy._chillV286818,currentEnemy._chillTurnsV286818,currentEnemy._frostTurnsV286818,currentEnemy._frostDamageV286818,currentEnemy._spellSealTurnsV286817,elementGuardsV286818.get(currentEnemy),skipEnemyTurn,isPlayerTurn])');
 assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {result,rng};
}
const names=Array.from(f.run('SKILLS.filter(s=>s.element==="ice").map(s=>s.name)'));assert.equal(names.length,13);
for(const name of names)for(const random of [.1,.99])assert.deepEqual(actual(name,false,random),actual(name,true,random),name+' gameplay/RNG parity');
console.log('PASS 13 real ice casts, both RNG outcomes, exact MP, frost ticks and 20% shield; visual observer cannot change combat');
// Actual scene loop, not just controller calls. Failed textures must still be safe.
const atlas=images.find(i=>i.src?.includes('duel-ink-poses'));atlas.naturalWidth=1536;atlas.naturalHeight=1024;atlas.onload();
let serial=0,clock=1000;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>clock;
f.run('var iceData={active:true,ownerToken:1,targetToken:2,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100,frozen:true,frostTurns:3,frostDamage:10,sealTurns:1,guardElement:"ice",guardPool:30,guardTurns:3};var iceHost=document.createElement("div");document.body.appendChild(iceHost);var iceScene=XiantuDuel25D.create(iceHost,()=>iceData);');
const marks=[],draw=ice.drawStatus;ice.drawStatus=function(ctx,r,p,opt){const ok=draw.apply(this,arguments);if(ok)marks.push({kind:r.kind,ending:r.ending,pulse:r.pulse,x:p.x,y:p.y});return ok};
function advance(ms){for(let i=0;i<ms;i+=40){clock+=40;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(clock);assert(frames.size<=1,'one scene RAF');}}
f.run('iceScene.iceEvent("apply",{name:"万载寒晶",freeze:true,frost:true});iceScene.iceEvent("apply",{name:"冰魄封魂",seal:true});iceScene.iceEvent("guard");');advance(1600);
for(const kind of ['freeze','frost','seal','guard'])assert(marks.some(m=>m.kind===kind),kind+' visible');
assert(marks.find(m=>m.kind==='seal').y<marks.find(m=>m.kind==='freeze').y,'seal is above the target, frost follows its feet');
marks.length=0;f.run('iceData.guardPool=10');advance(80);assert(marks.some(m=>m.kind==='guard'&&m.pulse>0));
marks.length=0;f.run('iceData.guardElement="fire"');advance(80);assert(!marks.some(m=>m.kind==='guard'));
f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);marks.length=0;
f.run('iceData.frozen=false;iceData.frostTurns=0;iceData.sealTurns=0');f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();advance(200);assert.equal(marks.length,0,'returning cannot replay expired ice');
f.run('iceData.frostTurns=3;iceScene.iceEvent("apply",{name:"寒渊领域",frost:true});iceScene.reset()');marks.length=0;advance(160);assert.equal(marks.length,0);
f.run('iceScene.iceEvent("apply",{name:"寒渊领域",frost:true});iceData.enemyHp=0');marks.length=0;advance(160);assert.equal(marks.length,0);
f.run('iceScene.destroy()');assert.equal(frames.size,0);assert.equal(f.errors.length,0,JSON.stringify(f.errors));
console.log('PASS live scene rendering, fallback, anchors, absorption, replacement, hidden/reset/death cleanup and single RAF');
// Existing sheets are reused as slow ping-pong loops and bounded expiry sheets.
for(const name of ['冰甲护身','冰河葬狱','冰魄封魂','万载寒晶']){
 const def=f.c.InkSkillFxV2854.elementBatch.definition(name);f.c.InkSkillFxV2854.elementBatch.prepare(name);
 for(const im of images){const layer=Object.values(def.layers).find(l=>im.src?.endsWith('/'+l.file));if(layer){im.naturalWidth=layer.frames*layer.frameWidth;im.naturalHeight=layer.frameHeight;im.onload();}}
 const kind={'冰甲护身':'guard','冰河葬狱':'freeze','冰魄封魂':'seal','万载寒晶':'frost'}[name];
 const samples=[],ctx=f.ids.get('combatPlayerChar').getContext('2d');ctx.drawImage=(...args)=>samples.push({frame:args[1]/256,composite:ctx.globalCompositeOperation});
 for(let endAge=0;endAge<220;endAge+=10)draw(ctx,{kind,name,age:1600+endAge,ending:true,endAge,opacity:1-endAge/220,pulse:0},{x:493,y:278},{});
 assert(samples.some(s=>s.frame===def.layers.residue.frames-1),name+' expiry terminal frame');assert(samples.every(s=>s.composite==='source-over'));
 samples.length=0;for(let age=1200;age<3200;age+=40)draw(ctx,{kind,name,age,ending:false,opacity:1,pulse:0},{x:493,y:278},{reduced:true});
 assert.equal(new Set(samples.map(s=>s.frame)).size,1,'reduced motion holds one loop frame');
}
assert.equal(f.c.InkSkillFxV2854.elementBatch.sample({profile:f.c.InkSkillFxV2854.profile('冰甲护身'),guardActive:false},200).length,0,'depleted armor cancels formation');
console.log('PASS expiry terminal frames, source-over, reduced-motion stability and early armor cancellation');
const reduced=fixture(root);reduced.c.matchMedia=q=>({matches:q.includes('prefers-reduced-motion'),addEventListener(){}});for(const file of files)reduced.load(file);
reduced.run('gameState="combat";document.getElementById("combatPanel").classList.remove("hidden");currentEnemy={hp:100,maxHp:100};player.hp=100;playInkSkillV2854("寒冰掌","ice")');
const cleanup=[...reduced.timers.entries()].filter(([,t])=>t.delay===440);assert.equal(cleanup.length,1);
reduced.run('InkSkillFxV2854.iceFinale.notify("apply",{name:"寒冰掌",freeze:false,frost:false,seal:false,owner:player,target:currentEnemy})');
assert(reduced.timers.has(cleanup[0][0]),'an ice hit without a lasting state must retain reduced-motion cast cleanup');
reduced.flush(440);assert.equal(reduced.c.InkSkillFxV2854.inspect().active,0);
console.log('PASS reduced-motion ordinary ice hit retains finite cleanup timer');
