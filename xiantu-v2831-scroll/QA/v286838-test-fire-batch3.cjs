'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.fireBatch3;assert(b,'approved fire batch must be integrated');
const manifest=JSON.parse(fs.readFileSync(root+'/fire-skills-batch3/effect-manifest.json'));
assert.deepEqual(JSON.parse(JSON.stringify(b.definitions)),manifest.effects);
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push([im.src,...args]);
for(const D of b.definitions){
 b.prepare(D.name);b.prepare(D.name);const textures=images.filter(i=>(i.src||'').includes('fire-skills-batch3/'+D.key));assert.equal(textures.length,Object.keys(D.layers).length);
 for(const im of textures){const spec=Object.values(D.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=spec.frames*spec.frameWidth;im.naturalHeight=spec.frameHeight;im.onload()}
 assert(b.ready(D.name));const j={profile:fx.profile(D.name,'fire'),from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,light:false,reduced:false,duration:1100,arriveAt:310,hitAt:310,domainConfirmed:true,burn:{burnTurns:3,burnStacks:10,_burnHealBlockV286818:false}};
 const before=f.run('JSON.stringify([player,currentEnemy])');let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};
 for(let age=0;age<1200;age+=5)fx.draw(ctx,j,age);assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);
 for(const [layer,L] of Object.entries(D.layers))assert(Array.from({length:2600},(_,age)=>b.sample(j,age)).flat().some(p=>p.layer===layer&&p.frame===L.frames-1),D.name+' '+layer+' final frame');
 assert(!b.sample({...j,hitAt:null},430).some(p=>['impact','status','residue'].includes(p.layer)));
 assert.equal(b.sample({...j,duration:200},210).length,0,'owner expiry wins');
 textures[0].onerror();assert(!b.ready(D.name));assert.doesNotThrow(()=>fx.draw(ctx,j,400));textures[0].onload();
}
assert(draws.some(d=>d[0].endsWith('wildfire_domain_status.png'))||b.drawStatus(ctx,493,278,1000,false));
assert(b.statusActive({enemyHp:10,burnTurns:3,burnDamage:10,burnHealBlock:false,domainConfirmed:true}));
for(const patch of [{enemyHp:0},{burnTurns:0},{burnDamage:0},{domainConfirmed:false}])assert(!b.statusActive({enemyHp:10,burnTurns:3,burnDamage:10,burnHealBlock:false,domainConfirmed:true,...patch}));
console.log('PASS three fire assets, lazy cache, final frames, event gating, expiry, fallback, read-only draw');
function actual(name,suppress,turns,randomValue){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return randomValue};for(const file of files)g.load(file);
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={fire:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'血狐',hp:50000,maxHp:50000,atk:1,def:100,gold:1,exp:1,_realmLevel:0,_realmPhase:0});`);g.timers.clear();g.run(`currentEnemy.burnTurns=${turns};currentEnemy.burnStacks=10;currentEnemy._burnHealBlockV286818=${turns>0}`);
 if(suppress)g.run('playInkSkillV2854=()=>true;InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{}');
 const mp=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mp-({燎原火域:72,赤焰龙息:58,天火焚世:75}[name]));g.flush(300);
 assert.equal(g.run('currentEnemy.burnTurns'),name==='天火焚世'?2:3);
 assert.equal(g.run('!!currentEnemy._burnHealBlockV286818'),turns>1,'expired burn clears old heal-block; active burn refresh retains it');
 assert.equal(g.run(`SKILLS.find(s=>s.name===${JSON.stringify(name)}).damage`),({燎原火域:4.4,赤焰龙息:3.9,天火焚世:4.5}[name]));
 const state=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,player.inventory,currentEnemy.hp,currentEnemy.def,currentEnemy.burnTurns,currentEnemy.burnStacks,currentEnemy._burnWeakV286818,currentEnemy._burnHealBlockV286818,skipEnemyTurn,isPlayerTurn])');assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {state,rng};
}
for(const name of ['燎原火域','赤焰龙息','天火焚世'])for(const turns of [0,1,3])for(const random of [.1,.9])assert.deepEqual(actual(name,false,turns,random),actual(name,true,turns,random));
console.log('PASS real equipped casts: 72/58/75 MP, 4.4/3.9/4.5 damage, burn refresh, unchanged state/RNG');
// A domain is a scene-local provenance record, never inferred from arbitrary burn.
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();let serial=0,clock=1000;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>clock;
f.run('var data3={active:true,targetToken:1,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100,burnTurns:3,burnDamage:10,burnHealBlock:false};var host3=document.createElement("div");document.body.appendChild(host3);var scene3=XiantuDuel25D.create(host3,()=>data3);');
let marks=[],lotus=0;b.drawStatus=(...args)=>{marks.push(args);return true};fx.fireBatch2.drawStatus=()=>{lotus++;return true};
function tick(ms=40){clock+=ms;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(clock)}
function advance(ms){for(let t=0;t<ms;t+=40)tick()}
advance(1200);assert.equal(marks.length,0,'ordinary burn on scene construction cannot create a domain');
f.run('scene3.act("player","fire","燎原火域")');advance(500);assert.equal(marks.length,0,'unconfirmed cast cannot create a domain');
f.run('scene3.hit("enemy",10)');advance(520);assert.equal(marks.length,0,'short domain retains ownership');advance(600);assert(marks.length>0,'confirmed domain hands off to live burn');assert(marks.some(a=>a[6]>0&&a[6]<1),'60ms crossfade');
marks=[];f.run('scene3.act("player","fire","天火焚世");scene3.hit("enemy",10)');advance(1600);assert(marks.length>0,'continuous burn refresh retains domain provenance');
f.run('data3.burnHealBlock=true');marks=[];advance(200);assert.equal(marks.length,0);assert(lotus>0,'lotus has priority');f.run('data3.burnHealBlock=false');
f.run('data3.burnTurns=0;scene3.act("player","fire","天火焚世");data3.burnTurns=2;scene3.hit("enemy",10)');marks=[];advance(1600);assert.equal(marks.length,0,'expiry and ordinary reapplication within one frame cannot resurrect a domain');
function castDomain(){f.run('Object.assign(data3,{active:true,enemyHp:100,burnTurns:3,burnDamage:10,burnHealBlock:false});scene3.act("player","fire","燎原火域");scene3.hit("enemy",10)');advance(1500);assert(marks.length>0);marks=[]}
for(const patch of [{burnTurns:0},{burnDamage:0},{enemyHp:0},{targetToken:2}]){castDomain();f.run('Object.assign(data3,'+JSON.stringify(patch)+')');advance(200);assert.equal(marks.length,0,'state removal/target change clears source');}
castDomain();f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);f.run('data3.burnTurns=0');f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();advance(200);assert.equal(marks.length,0,'expired while hidden');
castDomain();f.run('scene3.reset()');advance(200);assert.equal(marks.length,0,'reset drops source even with burn still active');castDomain();f.run('data3.active=false');advance(200);assert.equal(marks.length,0);assert.equal(frames.size,0);
// Canvas must implement the exact local-space clipping used by the approved DOM sampler.
const rects=[];ctx.rect=(...a)=>rects.push(a);const dragon={profile:fx.profile('赤焰龙息'),from:{x:260,y:205},to:{x:493,y:250},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,duration:1100,hitAt:310};fx.draw(ctx,dragon,220);
for(const p of b.sample(dragon,220).filter(p=>p.clipStart!=null))assert(rects.some(r=>r.every((n,i)=>Math.abs(n-[(p.clipStart-p.pivotX)*p.width,-p.pivotY*p.height,(p.clipEnd-p.clipStart)*p.width,p.height][i])<1e-8)),'segment clipping must match sampler');
console.log('PASS domain provenance, refresh/expiry, one owner/crossfade, hidden/exit/target/reset and Canvas segment clipping');
