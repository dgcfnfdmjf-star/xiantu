'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,z=fx.absoluteZero;assert(z);assert.deepEqual(JSON.parse(JSON.stringify(z.definition)),JSON.parse(fs.readFileSync(root+'/absolute-zero-v286835/effect-manifest.json')).effects[0]);
const job={profile:fx.profile('绝对零度','ice'),from:{x:260,y:225},to:{x:493,y:225},toGround:{x:493,y:278},fromGround:{x:242,y:305},width:720,clipBottom:355,scale:1,light:false,reduced:false,duration:900,arriveAt:310,hitAt:310};
for(const hitAt of [null,120,310,420])for(const reduced of [true,false])for(const light of [true,false])for(let age=0;age<=950;age+=5){
 const parts=z.sample({...job,hitAt,reduced,light},age);if(age>=900)assert.equal(parts.length,0);
 assert(parts.reduce((sum,p)=>sum+p.opacity,0)<=1.00001,'no stacked full-opacity silhouettes');
 for(const p of parts){assert.equal(p.x,493);assert.equal(p.y,278);assert.equal(p.anchor,'target');assert.equal(p.width,340);assert.equal(p.height,340);assert(p.frame>=0&&p.frame<z.definition.layers[p.layer].frames);assert(p.opacity>0&&p.opacity<=1);if(['impact','residue'].includes(p.layer))assert(hitAt!==null&&age>=hitAt,'freeze art must await real hit');}
}
for(const layer of Object.keys(z.definition.layers))assert(Array.from({length:900},(_,age)=>z.sample(job,age)).flat().some(p=>p.layer===layer&&p.frame===z.definition.layers[layer].frames-1),layer+' terminal frame');
assert.equal(z.sample({...job,hitAt:null},500).length,0);assert.equal(z.sample(job,870).length,0);
const reverse=z.sample({...job,toGround:{x:242,y:305}},400);assert(reverse.every(p=>p.x===242&&p.y===305));
z.prepare();z.prepare();const textures=images.filter(i=>(i.src||'').includes('absolute-zero-v286835/'));assert.equal(textures.length,4);
for(const im of textures){const spec=Object.values(z.definition.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=spec.frames*spec.frameWidth;im.naturalHeight=spec.frameHeight;im.onload();}assert(z.ready());
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push([im.src,...args]);let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};const before=f.run('JSON.stringify([player,currentEnemy])');
for(let age=0;age<950;age+=17)fx.draw(ctx,job,age);assert(draws.some(d=>d[0].endsWith('absolute_zero_impact.png')));assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);
textures[0].onerror();assert(!z.ready());assert.doesNotThrow(()=>fx.draw(ctx,job,400));
console.log('PASS absolute-zero fixed ground, hit gating, complementary overlap, final frames, 4-image cache, fallback and read-only rendering');
function actual(suppress,randomValue){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return randomValue};for(const file of files)g.load(file);
 g.run('startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name==="绝对零度")}];player.skillLoadoutV212={ice:["绝对零度"]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756("report");startCombat({name:"血狐",hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});');g.timers.clear();
 if(suppress)g.run('InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{}');const mp=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mp-70);assert.equal(g.run('currentEnemy.hp'),50000);g.flush(300);
 assert(g.run('currentEnemy.hp')<50000);assert.equal(g.run('skipEnemyTurn'),true);assert.equal(g.run('currentEnemy._skipReason'),'冻结');assert.equal(g.run('currentEnemy._chillTurnsV286818'),2);assert.equal(g.run('SKILLS.find(s=>s.name==="绝对零度").damage'),4);
 const state=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,player.inventory,currentEnemy.hp,currentEnemy.def,currentEnemy._chillTurnsV286818,currentEnemy._chillV286818,skipEnemyTurn,isPlayerTurn])');assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {state,rng};
}
for(const r of [.1,.9])assert.deepEqual(actual(false,r),actual(true,r));
assert.match(f.c.XiantuBattleProseV286832.cast('你','绝对零度','ice'),/层层霜纹/);assert.doesNotMatch(f.c.XiantuBattleProseV286832.cast('你','绝对零度','ice'),/已冻结|无法行动/);
console.log('PASS actual skill preserves 70 MP, 4x multiplier, guaranteed freeze, chill, combat state and RNG');
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();let serial=0;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>1000;
f.run('var zeroHost=document.createElement("div");document.body.appendChild(zeroHost);var zeroScene=XiantuDuel25D.create(zeroHost,()=>({active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100}));zeroScene.act("player","ice","绝对零度");zeroScene.hit("enemy",10)');
const seen=[];fx.draw=(c,j,t)=>seen.push(j.profile.name);function tick(t){const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(t)}tick(1050);assert(seen.includes('绝对零度'));seen.length=0;
f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);f.c.performance.now=()=>2000;f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();for(let t=2040;t<2300;t+=40)tick(t);assert(!seen.includes('绝对零度'));f.run('zeroScene.destroy()');assert.equal(frames.size,0);
console.log('PASS hidden/resume and destroy never replay frozen absolute-zero one-shots');
