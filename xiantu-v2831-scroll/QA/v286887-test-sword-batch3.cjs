'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.swordBatch3;assert(b,'independent sword resources must be integrated');
const manifest=JSON.parse(fs.readFileSync(root+'/sword-skills-batch3/effect-manifest.json'));assert.deepEqual(JSON.parse(JSON.stringify(b.definitions)),manifest.effects);
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push(im.src);
for(const D of b.definitions){
 assert.equal(fx.elementBatch.definition(D.name),undefined);const p=fx.profile(D.name);b.prepare(D.name);b.prepare(D.name);
 const textures=images.filter(i=>i.src?.includes('sword-skills-batch3/'+D.key));assert.equal(textures.length,Object.keys(D.layers).length,'cache once per layer');
 const j={profile:p,from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,duration:1100,arriveAt:310,hitAt:null,actualHeal:20,guardAt:310,guardEnd:800};
 draws.length=0;fx.draw(ctx,j,240);assert(!draws.some(s=>s.includes('sword-skills-batch3')),'fallback until complete');
 for(const im of textures){const L=Object.values(D.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=L.frames*L.frameWidth;im.naturalHeight=L.frameHeight;im.onload()}
 assert(b.ready(D.name));assert(!b.sample(j,430).some(p=>p.layer==='impact'));j.hitAt=310;
 const before=f.run('JSON.stringify([player,currentEnemy])');draws.length=0;let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};
 for(let t=0;t<1100;t+=5)fx.draw(ctx,j,t);assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);
 for(const [layer,L] of Object.entries(D.layers)){assert(draws.some(s=>s.endsWith(L.file)));assert(Array.from({length:1100},(_,t)=>b.sample(j,t)).flat().some(p=>p.layer===layer&&p.frame===L.frames-1),'terminal frame reachable');}
 assert.equal(b.sample({...j,duration:200},210).length,0);for(const state of [{hidden:true},{exited:true},{alive:false},{sameTarget:false}])assert.equal(b.sample({...j,...state},350).length,0);
 textures[0].onerror();assert(!b.ready(D.name));assert.doesNotThrow(()=>fx.draw(ctx,j,350));textures[0].onload();
}
function combat(name,old){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return .5};
 for(const file of files)if(old&&['xiantu-v2855-skill-fx.js','xiantu-v2762-core.js','xiantu-v28684-duel.js'].includes(file))g.run(fs.readFileSync(path.join(root,'../art/sword-skills-batch3/runtime-before',file),'utf8'));else g.load(file);
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=1000;player.hp=1000;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={sword:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'血狐',hp:50000,maxHp:50000,atk:20,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});currentEnemy.atk=20;currentEnemy.def=10;`);
 g.timers.clear();const mp=g.run('player.mp');g.run('combat("skill",0)');g.flush(150);g.flush(300);
 assert.equal(mp-g.run('player.mp'),{'追魂一剑':38,'饮血剑诀':42,'玄罡护体剑':50}[name]);assert.equal(g.errors.length,0,JSON.stringify(g.errors));
 return {state:g.run('JSON.stringify([player,currentEnemy,skipEnemyTurn,isPlayerTurn,guardsV2785.get(currentEnemy)])'),rng};
}
for(const name of ['追魂一剑','饮血剑诀','玄罡护体剑'])assert.deepEqual(combat(name,false),combat(name,true),name+' mechanics and RNG identical');
console.log('PASS sword resources, actual draw route, missing texture fallback, final frames, expiry, read-only rendering and original combat/MP/RNG parity');
const finale=fx.swordFinale;assert(finale);
let clock=0;const state={active:true,ownerToken:1,targetToken:2,playerHp:100,enemyHp:100,swordGuardRatio:.35};
const guard=finale.createState(()=>state,()=>clock);
assert.equal(guard.collect().length,0,'ratio alone must not invent provenance');
guard.notify('guard',{name:'玄罡护体剑'});clock=500;assert.equal(guard.collect().length,1);
guard.notify('guard',{name:'青莲护心',retain:true});assert.equal(guard.collect().length,1,'lower guard preserves source');
guard.notify('guard',{name:'莲华济世',retain:false});assert.equal(guard.collect().length,0,'higher other guard replaces source');
guard.notify('guard',{name:'玄罡护体剑'});state.swordGuardRatio=0;guard.notify('consume');clock+=219;assert.equal(guard.collect().length,1);clock++;assert.equal(guard.collect().length,0);
state.swordGuardRatio=.35;guard.notify('guard',{name:'玄罡护体剑'});guard.pause();state.swordGuardRatio=0;clock+=1000;assert.equal(guard.collect().length,0,'hidden consumption never replays');
state.swordGuardRatio=.35;guard.notify('guard',{name:'玄罡护体剑'});state.targetToken=3;assert.equal(guard.collect().length,0);
guard.notify('guard',{name:'玄罡护体剑'});state.playerHp=0;assert.equal(guard.collect().length,0);
function actualHeal(full,enemyHp){
 const g=fixture(root);for(const file of files)g.load(file);g.c.Math=Object.create(Math);g.c.Math.random=()=>.5;
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=1000;player.skills=[{...SKILLS.find(s=>s.name==='饮血剑诀')}];player.skillLoadoutV212={sword:['饮血剑诀']};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'血狐',hp:${enemyHp},maxHp:${enemyHp},atk:1,def:0,gold:1,exp:1,_realmLevel:0,_realmPhase:0});currentEnemy.hp=currentEnemy.maxHp=${enemyHp};player.hp=${full?'getMaxHp()':'Math.floor(getMaxHp()/2)'};`);
 g.timers.clear();const events=[],notify=g.c.InkSkillFxV2854.swordFinale.notify;
 g.c.InkSkillFxV2854.swordFinale.notify=(k,d)=>{events.push({k,amount:d.actualHeal});notify(k,d)};
 const hp=g.run('player.hp'),max=g.run('getMaxHp()');g.run('combat("skill",0)');g.flush(150);g.flush(300);
 const e=events.find(e=>e.k==='heal');assert(e);assert.equal(e.amount,g.run('player.hp')-hp);
 assert(e.amount<=Math.floor(max*.15));assert(e.amount<=Math.floor(enemyHp*.2));if(full)assert.equal(e.amount,0);else if(enemyHp>100)assert(e.amount>0);
 assert.equal(g.errors.length,0,JSON.stringify(g.errors));
}
actualHeal(true,50000);actualHeal(false,50000);actualHeal(false,3);
console.log('PASS actual healing amount/full HP/overkill caps; guard provenance, weaker refresh, stronger replacement, consumption/death/target/background cleanup');
// Exercise the actual scene, one existing RAF, source-over and attached status rendering.
const atlas=images.find(i=>i.src?.includes('duel-ink-poses'));atlas.naturalWidth=1536;atlas.naturalHeight=1024;atlas.onload();
let serial=0,time=1000;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>time;
f.run('var swordData={active:true,ownerToken:1,targetToken:2,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100,swordGuardRatio:.35};var swordHost=document.createElement("div");document.body.appendChild(swordHost);var swordScene=XiantuDuel25D.create(swordHost,()=>swordData);');
const marks=[],originalDraw=finale.drawStatus;finale.drawStatus=function(c,r,p,o){marks.push({age:r.age,point:p});return originalDraw.apply(this,arguments)};
function advance(ms){for(let i=0;i<ms;i+=40){time+=40;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(time);assert(frames.size<=1);}}
f.run('swordScene.swordEvent("guard",{name:"玄罡护体剑"})');advance(1300);assert(marks.length>0,'live status rendered beyond cast');
marks.length=0;f.run('swordData.swordGuardRatio=0;swordScene.swordEvent("consume")');advance(300);marks.length=0;advance(200);assert.equal(marks.length,0);
f.run('swordData.swordGuardRatio=.35;swordScene.swordEvent("guard",{name:"玄罡护体剑"})');f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);
f.run('swordData.swordGuardRatio=0');f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();marks.length=0;advance(200);assert.equal(marks.length,0);
f.run('swordData.swordGuardRatio=.35;swordScene.swordEvent("guard",{name:"玄罡护体剑"});swordScene.reset()');marks.length=0;advance(200);assert.equal(marks.length,0);
f.run('swordScene.destroy()');assert.equal(frames.size,0);assert.equal(f.errors.length,0,JSON.stringify(f.errors));
console.log('PASS actual scene status draw, one RAF, hidden/resume, expiry/reset/destroy');
