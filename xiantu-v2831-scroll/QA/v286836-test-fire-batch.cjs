'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.fireBatch;assert(b,'approved fire batch must be integrated');
const manifest=JSON.parse(fs.readFileSync(root+'/fire-skills-batch1/effect-manifest.json'));
assert.deepEqual(JSON.parse(JSON.stringify(b.definitions)),manifest.effects);
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push([im.src,...args]);
for(const D of b.definitions){
 b.prepare(D.name);b.prepare(D.name);const textures=images.filter(i=>(i.src||'').includes('fire-skills-batch1/'+D.key));assert.equal(textures.length,Object.keys(D.layers).length);
 for(const im of textures){const spec=Object.values(D.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=spec.frames*spec.frameWidth;im.naturalHeight=spec.frameHeight;im.onload()}
 assert(b.ready(D.name));const j={profile:fx.profile(D.name,'fire'),from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,light:false,reduced:false,duration:1100,arriveAt:310,hitAt:310,detonationAt:D.key==='flame_burst'?370:null};
 const before=f.run('JSON.stringify([player,currentEnemy])');let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};
 for(let age=0;age<1200;age+=5)fx.draw(ctx,j,age);assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);
 for(const [layer,L] of Object.entries(D.layers))assert(Array.from({length:1100},(_,age)=>b.sample(j,age)).flat().some(p=>p.layer===layer&&p.frame===L.frames-1),D.name+' '+layer+' final frame');
 assert(!b.sample({...j,hitAt:null,detonationAt:370},430).some(p=>['impact','detonation','residue'].includes(p.layer)));
 if(D.key==='flame_burst')assert(!b.sample({...j,detonationAt:null},430).some(p=>p.layer==='detonation'));
 assert.equal(b.sample({...j,duration:200},210).length,0,'owner expiry wins');
 textures[0].onerror();assert(!b.ready(D.name));assert.doesNotThrow(()=>fx.draw(ctx,j,400));textures[0].onload();
}
assert(draws.some(d=>d[0].endsWith('flame_burst_detonation.png')));
console.log('PASS three fire assets, lazy cache, final frames, event gating, expiry, fallback, read-only draw');
function actual(name,suppress,burnTurns,randomValue){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return randomValue};for(const file of files)g.load(file);
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={fire:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'血狐',hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0,burnTurns:${burnTurns},burnStacks:10});`);g.timers.clear();g.run(`currentEnemy.burnTurns=${burnTurns};currentEnemy.burnStacks=10`);
 const events=[];g.c.InkSkillFxV2854.fireBatch.detonate=side=>events.push(side);
 if(suppress)g.run('playInkSkillV2854=()=>true;InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{}');
 const mp=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mp-({烈焰斩:18,炎爆术:22,焚天烈焰:45}[name]));g.flush(300);
 if(name==='炎爆术'){assert.equal(g.run('currentEnemy.burnTurns'),0);assert.equal(g.run('currentEnemy.burnStacks'),0);assert.equal(events.length,burnTurns>1?1:0,'remaining burn only, after pre-action tick');}
 else assert.equal(g.run('currentEnemy.burnTurns'),name==='焚天烈焰'?3:2);
 const state=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,player.inventory,currentEnemy.hp,currentEnemy.def,currentEnemy.burnTurns,currentEnemy.burnStacks,currentEnemy._burnWeakV286818,skipEnemyTurn,isPlayerTurn])');assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {state,rng};
}
for(const name of ['烈焰斩','炎爆术','焚天烈焰'])for(const turns of [0,1,3])for(const random of [.1,.9])assert.deepEqual(actual(name,false,turns,random),actual(name,true,turns,random));
console.log('PASS real equipped casts: 18/22/45 MP, burn duration and detonation consumption, identical state/RNG with visuals disabled');
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();let serial=0;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>1000;
f.run('var fireHost=document.createElement("div");document.body.appendChild(fireHost);var fireScene=XiantuDuel25D.create(fireHost,()=>({active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100}));fireScene.act("player","fire","炎爆术");fireScene.hit("enemy",10);fireScene.hit("enemy",20,false,false,false,"灼烧引爆")');
const seen=[];fx.draw=(c,j,t)=>seen.push({j,t});function tick(t){const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(t)}
for(let t=1050;t<1550;t+=40)tick(t);assert(seen.some(v=>v.j.detonationAt!==null&&v.t>=v.j.detonationAt),'queued damage metadata reaches same action');
f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);seen.length=0;f.c.performance.now=()=>2000;f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();for(let t=2040;t<2400;t+=40)tick(t);assert(!seen.some(v=>v.j.profile.name==='炎爆术'));f.run('fireScene.destroy()');assert.equal(frames.size,0);
console.log('PASS queued detonation identity and hidden/resume/destroy cleanup');
