'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),fixture=require('./v2858-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function setup(old=false){const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};for(const name of files){const before=path.join(root,'../art/heal-skills-batch3/runtime-before',name);if(old&&fs.existsSync(before))f.run(fs.readFileSync(before,'utf8'));else f.load(name)}return {f,images,rng:()=>rng};}
const {f,images}=setup(),fx=f.c.InkSkillFxV2854,b=fx.healBatch3;assert(b,'two approved healing guard animations must be integrated');
const manifest=JSON.parse(fs.readFileSync(root+'/heal-skills-batch3/effect-manifest.json'));assert.deepEqual(JSON.parse(JSON.stringify(b.definitions)),manifest.effects);
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push({src:im.src,args});
for(const d of b.definitions){
 assert.equal(fx.elementBatch.definition(d.name),undefined);assert.equal(fx.authoredDuration(d.name),d.timing.durationMs);b.prepare(d.name);b.prepare(d.name);
 const textures=images.filter(i=>i.src?.includes('heal-skills-batch3/'+d.key));assert.equal(textures.length,6);
 for(const im of textures){const l=Object.values(d.layers).find(l=>im.src.endsWith(l.file)),png=fs.readFileSync(root+'/heal-skills-batch3/'+l.file);assert.equal(png.readUInt32BE(16),l.frames*l.frameWidth);assert.equal(png.readUInt32BE(20),l.frameHeight);im.naturalWidth=l.frames*l.frameWidth;im.naturalHeight=l.frameHeight;im.onload()}assert(b.ready(d.name));
 const j={profile:fx.profile(d.name),from:{x:245,y:200},to:{x:245,y:200},fromGround:{x:245,y:302},width:720,clipBottom:355,duration:d.timing.durationMs,scale:1,actualHeal:25};
 const before=f.run('JSON.stringify([player,currentEnemy])');draws.length=0;for(let t=0;t<d.timing.durationMs;t+=5)fx.draw(ctx,j,t);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);
 for(const k of ['telegraph','body','impact','residue']){assert(draws.some(x=>x.src.endsWith(d.layers[k].file)));assert(Array.from({length:d.timing.durationMs},(_,t)=>b.sample(j,t)).flat().some(p=>p.layer===k&&p.frame===d.layers[k].frames-1));}
 assert(!b.sample(j,1000).length,'cast never owns continuing guard');
 for(let t=0;t<d.timing.durationMs;t+=5)assert(!b.sample({...j,actualHeal:0},t).some(p=>['body','impact'].includes(p.layer)));
 for(const flag of [{alive:false},{sameActor:false},{sameTarget:false},{hidden:true},{exited:true}])assert.equal(b.sample({...j,...flag},180).length,0);
 textures[0].onerror();draws.length=0;fx.draw(ctx,{...j,actualHeal:0},180);assert.equal(draws.length,0,'fallback cannot invent a full-HP heal');textures[0].onload();
}
let clock=0;const data={active:true,ownerToken:1,targetToken:2,playerHp:100,enemyHp:100,swordGuardRatio:.3},guard=fx.swordFinale.createState(()=>data,()=>clock);
assert.equal(guard.collect().length,0,'ratio alone never invents a source');
for(const name of ['青莲护心','莲华济世']){
 guard.clear();clock=0;guard.notify('guard',{name});clock=1000;let r=guard.collect()[0];assert.equal(r.name,name);
 draws.length=0;fx.swordFinale.drawStatus(ctx,r,{x:245,y:302});assert(draws.some(x=>x.src.includes(b.definition(name).key+'_guard')));
 clock=100000;assert.equal(guard.collect().length,1,'no invented expiry');
 data.swordGuardRatio=0;guard.notify('consume');clock+=100;r=guard.collect()[0];draws.length=0;fx.swordFinale.drawStatus(ctx,r,{x:245,y:302});assert(draws.some(x=>x.src.includes('_consume')));clock+=120;assert.equal(guard.collect().length,0);data.swordGuardRatio=.4;
 guard.notify('guard',{name});clock+=100;guard.notify('consume');data.swordGuardRatio=0;clock+=1000;assert.equal(guard.collect().length,0,'early hit cannot regenerate at cast end');data.swordGuardRatio=.4;
}
guard.notify('guard',{name:'莲华济世'});guard.notify('guard',{name:'青莲护心',retain:true});assert.equal(guard.collect()[0].name,'莲华济世');
guard.notify('guard',{name:'玄罡护体剑'});assert.equal(guard.collect()[0].name,'玄罡护体剑');guard.notify('guard',{name:'青莲护心',retain:true});assert.equal(guard.collect()[0].name,'玄罡护体剑');guard.notify('guard',{name:'莲华济世'});assert.equal(guard.collect()[0].name,'莲华济世');
clock+=50;guard.notify('guard',{name:'莲华济世'});assert.equal(guard.collect()[0].at,clock,'same strength refresh owns newest source');
guard.pause();data.swordGuardRatio=0;clock+=1000;assert.equal(guard.collect().length,0,'hidden consumed state never replays');
for(const [key,value] of [['ownerToken',3],['targetToken',4],['playerHp',0],['enemyHp',0],['active',false]]){data.swordGuardRatio=.3;guard.notify('guard',{name:'青莲护心'});const previous=data[key];data[key]=value;assert.equal(guard.collect().length,0,key);data[key]=previous;}
assert.equal(f.errors.length,0,JSON.stringify(f.errors));
console.log('PASS heal guard resources, routing, lazy cache, true-state ownership, strongest replacement, early consumption, cleanup and read-only drawing');
function combat(name,hpRatio,previous,old){
 const s=setup(old),g=s.f;
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=1000;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={heal:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'血狐',hp:50000,maxHp:50000,atk:20,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});player.hp=getMaxHp()*${hpRatio};currentEnemy.atk=20;`);
 if(previous)g.run(`applyGuardV2785(SKILLS.find(s=>s.name===${JSON.stringify(previous)}))`);
 g.timers.clear();const hp=g.run('player.hp'),mp=g.run('player.mp'),events=[],raw=g.c.playSkillEffect;g.c.playSkillEffect=function(...a){events.push(a);return raw.apply(this,a)};
 g.run('combat("skill",0)');assert.equal(events.length,1);assert.equal(events[0][3].actualHeal,g.run('player.hp')-hp);assert.equal(mp-g.run('player.mp'),name==='青莲护心'?26:65);
 const ratio=Math.max(name==='青莲护心'?.3:.4,previous==='莲华济世'?.4:previous==='玄罡护体剑'?.35:0);
 assert.equal(g.run('guardsV2785.get(currentEnemy).ratio'),ratio);assert.equal(g.run('consumeGuardV2785(0)'),0);assert.equal(g.run('guardsV2785.get(currentEnemy).ratio'),ratio);
 if(!old)assert.equal(g.c.InkSkillFxV2854.inspect().swordStates.length,1);
 const hit=g.run('consumeGuardV2785(100)');assert.equal(hit,Math.floor(100*(1-ratio)));assert.equal(g.run('guardsV2785.has(currentEnemy)'),false);g.flush(500);assert.equal(g.errors.length,0,JSON.stringify(g.errors));
 return {state:g.run('JSON.stringify([player,currentEnemy,isPlayerTurn,skipEnemyTurn,guardsV2785.get(currentEnemy)])'),rng:s.rng(),hit};
}
let comparisons=0;for(const name of ['青莲护心','莲华济世'])for(const hp of [.2,1])for(const previous of [null,'青莲护心','莲华济世','玄罡护体剑']){assert.deepEqual(combat(name,hp,previous,false),combat(name,hp,previous,true));comparisons++;}
console.log('PASS '+comparisons+' old/new combat/HP/MP/guard/RNG comparisons, full-HP guard and zero-damage preservation');
// The real duel renderer reuses one RAF and the shared strongest-guard owner.
f.warmDuel();const atlas=images.find(i=>i.src?.includes('duel-ink-poses'));atlas.naturalWidth=1536;atlas.naturalHeight=1024;atlas.onload();let time=1000,id=0;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++id,cb);return id};f.c.cancelAnimationFrame=i=>frames.delete(i);f.c.performance.now=()=>time;
f.run('var hgOwner={},hgTarget={},hgData={active:true,ownerToken:hgOwner,targetToken:hgTarget,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100,swordGuardRatio:.3};var hgHost=document.createElement("div");document.body.appendChild(hgHost);var hgScene=XiantuDuel25D.create(hgHost,()=>hgData);');
const marks=[],casts=[],status=fx.swordFinale.drawStatus,draw=fx.draw;fx.swordFinale.drawStatus=function(c,r,p,o){marks.push({name:r.name,age:r.age,end:r.end,at:r.at,point:p});return status.apply(this,arguments)};fx.draw=function(c,j,t){if(b.definition(j.profile.name))casts.push({name:j.profile.name,parts:b.sample(j,t)});return draw.apply(this,arguments)};
function advance(ms){for(let i=0;i<ms;i+=40){time+=40;const callbacks=[...frames.values()];frames.clear();for(const cb of callbacks)cb(time);assert(frames.size<=1,'one RAF only')}}
for(const name of ['青莲护心','莲华济世']){
 f.run(`hgScene.reset();hgData.swordGuardRatio=.4;hgScene.swordEvent('guard',{name:${JSON.stringify(name)}});hgScene.act('player','heal',${JSON.stringify(name)},true,{actualHeal:25,owner:hgOwner,target:hgTarget});`);marks.length=0;casts.length=0;advance(1400);assert(casts.some(j=>j.name===name&&j.parts.some(p=>p.layer==='body')));assert(marks.some(r=>r.name===name&&r.age>1100));
 f.run('hgData.swordGuardRatio=0;hgScene.swordEvent("consume")');advance(250);marks.length=0;advance(500);assert.equal(marks.length,0);
 f.run(`hgData.swordGuardRatio=.4;hgScene.swordEvent('guard',{name:${JSON.stringify(name)}});hgScene.act('player','heal',${JSON.stringify(name)},true,{actualHeal:0,owner:hgOwner,target:hgTarget});`);advance(120);f.run('hgData.swordGuardRatio=0;hgScene.swordEvent("consume")');advance(250);marks.length=0;casts.length=0;advance(1000);assert.equal(marks.length,0,'no delayed guard rebuild');assert(!casts.some(j=>j.parts.some(p=>['body','impact'].includes(p.layer))),'no full HP healing');
}
f.run('hgData.swordGuardRatio=.4;hgScene.swordEvent("guard",{name:"莲华济世"});hgScene.swordEvent("guard",{name:"青莲护心",retain:true});');marks.length=0;advance(1000);assert(marks.length&&marks.every(r=>r.name==='莲华济世'));
f.c.document.hidden=true;for(const cb of f.events.visibilitychange||[])cb();assert.equal(frames.size,0);f.run('hgData.swordGuardRatio=0;hgScene.swordEvent("consume")');f.c.document.hidden=false;for(const cb of f.events.visibilitychange||[])cb();marks.length=0;advance(300);assert.equal(marks.length,0);
f.run('hgData.swordGuardRatio=.3;hgScene.swordEvent("guard",{name:"青莲护心"});hgData.ownerToken={};');marks.length=0;advance(300);assert.equal(marks.length,0);f.run('hgScene.destroy()');assert.equal(frames.size,0);assert.equal(f.errors.length,0,JSON.stringify(f.errors));
console.log('PASS actual scene cast/full-HP/status/replacement/early-hit/background/owner cleanup and single RAF');
