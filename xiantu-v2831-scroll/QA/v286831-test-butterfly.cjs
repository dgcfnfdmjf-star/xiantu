'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.butterfly;assert(b);
const job={id:1,profile:fx.profile('冰蝶幻舞'),from:{x:260,y:225},to:{x:493,y:225},fromGround:{x:242,y:305},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,light:false,reduced:false,duration:900,arriveAt:310,hitAt:310};
for(const reduced of [false,true])for(const light of [false,true])for(const hitAt of [null,120,310,420]){
 const j={...job,reduced,light,hitAt};
 for(let t=0;t<=950;t+=5){
  const parts=b.sample(j,t);if(t>=900)assert.equal(parts.length,0);
  for(const p of parts){
   assert(p.frame>=0&&p.frame<b.definition.layers[p.layer].frames);assert(p.opacity>0&&p.opacity<=1);
   if(p.layer==='body')assert.equal(p.width,b.definition.display.body);
   if(p.layer==='impact'||p.layer==='residue'){assert(hitAt!==null&&t>=hitAt);assert.equal(p.x,j.toGround.x);assert.equal(p.y,j.toGround.y)}
   if(reduced){assert.equal(p.rotation,0);assert.equal(p.trail,0);assert.notEqual(p.anchor,'moving')}
  }
  assert(parts.filter(p=>['impact','residue'].includes(p.layer)).reduce((s,p)=>s+p.opacity,0)<=1.000001);
 }
}
for(const layer of ['telegraph','body','impact','residue'])assert(Array.from({length:900},(_,t)=>b.sample(job,t)).flat().some(p=>p.layer===layer&&p.frame===b.definition.layers[layer].frames-1),layer+' terminal frame');
assert.equal(b.sample({...job,hitAt:null},500).length,0);
assert.equal(b.sample(job,830).length,0);
assert.equal(b.sample(job,310).filter(p=>p.layer==='body').length,0);
assert.equal(b.sample({...job,light:true},200).filter(p=>p.layer==='body').length,4);
assert.equal(b.sample(job,200).filter(p=>p.layer==='body').length,7);
assert.equal(JSON.stringify(b.sample({...job,reduced:true},60)),JSON.stringify(b.sample({...job,reduced:true},200)),'reduced body stays static');
const reversed={...job,from:job.to,to:job.from,fromGround:job.toGround,toGround:job.fromGround};assert(b.sample(reversed,400).every(p=>p.x===job.fromGround.x));
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push([im.src,...args]);b.prepare();
const textures=images.filter(i=>(i.src||'').includes('ice-butterfly-v286831/'));assert.equal(textures.length,4);
for(const im of textures){const spec=Object.values(b.definition.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=spec.frames*spec.frameWidth;im.naturalHeight=spec.frameHeight;im.onload()}
assert(b.ready());let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};const before=f.run('JSON.stringify([player,currentEnemy])');
for(let t=0;t<950;t+=17)fx.draw(ctx,job,t);assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);assert(draws.some(d=>d[0].endsWith('ice_butterfly_impact.png')));
for(let i=0;i<100;i++)b.prepare();assert.equal(images.filter(i=>(i.src||'').includes('ice-butterfly-v286831/')).length,4);
const manifest=JSON.parse(fs.readFileSync(root+'/ice-butterfly-v286831/effect-manifest.json'));assert.equal(JSON.stringify(manifest.effects[0]),JSON.stringify(b.definition));
textures[0].onerror();assert(!b.ready());assert.doesNotThrow(()=>fx.draw(ctx,job,400));
console.log('PASS butterfly real-hit gate, early/late/missed casts, anchors, terminal frames, static reduced mode, bounded cache, state/RNG read-only and fallback');
function actual(suppress,randomValue){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return randomValue};for(const file of files)g.load(file);
 g.run('startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.gold=1000;player.skills=[{...SKILLS.find(s=>s.name==="冰蝶幻舞")}];player.skillLoadoutV212={ice:["冰蝶幻舞"]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756("report");startCombat({name:"血狐",hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});');g.timers.clear();
 if(suppress)g.run('playInkSkillV2854=()=>true;InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{}');
 const mp=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mp-36);assert.equal(g.run('currentEnemy.hp'),50000);g.flush(300);assert(g.run('currentEnemy.hp')<50000);
 assert.equal(g.run('SKILLS.find(s=>s.name==="冰蝶幻舞").damage'),2.7);assert.equal(g.run('SKILLS.find(s=>s.name==="冰蝶幻舞").freezeChance'),.35);
 assert.equal(g.run('currentEnemy._chillTurnsV286818'),2);assert.equal(g.run('currentEnemy._skipReason==="冻结"'),randomValue<.35);
 const data=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,player.inventory,currentEnemy.hp,currentEnemy.def,currentEnemy._chillTurnsV286818,currentEnemy._chillV286818,currentEnemy._skipReason,skipEnemyTurn,isPlayerTurn])');assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {data,rng};
}
for(const value of [.1,.9])assert.deepEqual(actual(false,value),actual(true,value));
console.log('PASS real equipped butterfly skill: 36 MP, 2.7 multiplier, 35% freeze success/failure, chill and identical gameplay/RNG with visuals disabled');
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();let serial=0;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>1000;
f.run('var butterflyHost=document.createElement("div");document.body.appendChild(butterflyHost);var butterflyScene=XiantuDuel25D.create(butterflyHost,()=>({active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100}));butterflyScene.act("player","ice","冰蝶幻舞");butterflyScene.hit("enemy",10)');
const seen=[];fx.draw=(c,j,t)=>seen.push(j.profile.name);function tick(t){const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(t)}tick(1050);assert(seen.includes('冰蝶幻舞'));seen.length=0;
f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);f.c.performance.now=()=>2000;f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();for(let t=2040;t<2300;t+=40)tick(t);assert(!seen.includes('冰蝶幻舞'));f.run('butterflyScene.destroy()');assert.equal(frames.size,0);
console.log('PASS butterfly hidden/resume cleanup and destroy leaves no animation loop');
