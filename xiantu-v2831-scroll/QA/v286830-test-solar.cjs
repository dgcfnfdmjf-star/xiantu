'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root);
const images=[],BaseImage=f.c.Image;
f.c.Image=class extends BaseImage{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const solar=f.c.InkSkillFxV2854.solar;
assert.ok(solar,'solar renderer must expose the shared resource/timing definition for preview');
const profile=f.c.InkSkillFxV2854.profile('太阳真火');
const job={id:1,profile,from:{x:260,y:225},to:{x:493,y:225},fromGround:{x:242,y:305},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,light:false,reduced:false,duration:900,arriveAt:310,hitAt:null};
const state=f.run('JSON.stringify([player,currentEnemy])');
const timeline=[0,60,108,170,240,309];
const bodies=timeline.map(t=>solar.sample(job,t).find(x=>x.layer==='body'));
assert(bodies.every(Boolean));
assert.equal(new Set(bodies.map(b=>b.width)).size,1,'travel must never stretch the solar body');
assert.equal(bodies[1].x,job.from.x,'anticipation stays at caster');
assert(bodies[3].x>job.from.x&&bodies[3].x<job.to.x);
for(const age of [0,309,310,350,450,850])assert(!solar.sample(job,age).some(x=>x.layer==='impact'),'misses never invent an impact');
assert.equal(solar.sample(job,600).length,0,'missed solar expires');
const hit={...job,hitAt:310};
assert(!solar.sample(hit,309).some(x=>x.layer==='impact'));
assert(solar.sample(hit,310).some(x=>x.layer==='impact'));
assert(!solar.sample(hit,310).some(x=>x.layer==='body'),'one silhouette at impact');
for(const age of [430,445,460,475,489]){
 const parts=solar.sample(hit,age),impact=parts.find(x=>x.layer==='impact'),residue=parts.find(x=>x.layer==='residue');
 if(impact&&residue){assert.equal(impact.x,residue.x);assert.equal(impact.y,residue.y);assert.equal(impact.pivotY,residue.pivotY);assert(impact.opacity+residue.opacity<=1.000001);}
}
for(const layer of ['telegraph','impact','residue']){
 const sampled=new Set(Array.from({length:900},(_,age)=>solar.sample(hit,age).filter(p=>p.layer===layer).map(p=>p.frame)).flat());
 assert(sampled.has(solar.definition.layers[layer].frames-1),layer+' terminal frame must be reachable');
}
assert.equal(solar.sample(hit,850).length,0);assert.equal(solar.sample(hit,900).length,0);
assert(solar.sample({...hit,reduced:true},100).every(p=>p.x===job.from.x&&p.rotation===0));
assert(solar.sample({...hit,reduced:true},400).every(p=>p.x===job.toGround.x&&p.rotation===0));
assert(solar.sample({...hit,light:true},200).some(p=>p.layer==='body'),'light quality retains solar body');
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];
ctx.drawImage=(im,...args)=>draws.push([im.src,...args]);
solar.prepare();
const textures=images.filter(i=>(i.src||'').includes('solar-fire-v286830/'));
assert.equal(textures.length,4,'bounded shared textures');
for(const im of textures){const layer=Object.values(solar.definition.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=layer.frames*layer.frameWidth;im.naturalHeight=layer.frameHeight;im.onload();}
assert(solar.ready());
let random=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{random++;return .5};
for(let age=0;age<=950;age+=17)f.c.InkSkillFxV2854.draw(ctx,hit,age);
assert.equal(random,0,'art must not consume gameplay RNG');
assert.equal(f.run('JSON.stringify([player,currentEnemy])'),state);
assert(draws.some(d=>d[0].includes('solar_impact.png')));
const manifest=JSON.parse(fs.readFileSync(root+'/solar-fire-v286830/effect-manifest.json','utf8'));
assert.equal(JSON.stringify(manifest.effects[0]),JSON.stringify(solar.definition),'runtime and preview export agree');
for(let i=0;i<100;i++)solar.prepare();assert.equal(images.filter(i=>(i.src||'').includes('solar-fire-v286830/')).length,4);
textures[0].onerror();assert(!solar.ready());assert.doesNotThrow(()=>f.c.InkSkillFxV2854.draw(ctx,hit,400),'asset failure retains legacy fallback');
console.log('PASS solar fixed-size travel, real-hit gate, miss expiry, registered crossfade, terminal frames, reduced/light modes, shared cache, no state/RNG changes and manifest parity');
// Execute the real equipped skill in fresh worlds, including the real 300ms
// callback. Compare gameplay and random-stream consumption with visuals disabled.
function actual(suppress){
 const g=require('./v2858-dom-fixture.cjs')(root);let rng=0;
 g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return .5};
 for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))g.load(file);
 g.run('startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.gold=1000;player.skills=[{...SKILLS.find(s=>s.name==="太阳真火")}];player.skillLoadoutV212={fire:["太阳真火"]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756("report");startCombat({name:"血狐",hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});');
 g.timers.clear();
 if(suppress)g.run('playInkSkillV2854=()=>true;InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{}');
 const mana=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mana-88);assert.equal(g.run('currentEnemy.hp'),50000);
 g.flush(300);assert(g.run('currentEnemy.hp')<50000);assert.equal(g.run('currentEnemy.burnTurns'),4);
 assert.equal(g.run('SKILLS.find(s=>s.name==="太阳真火").damage'),5.3);
 const data=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,player.inventory,currentEnemy.hp,currentEnemy.def,currentEnemy.burnTurns,currentEnemy.burnStacks,isPlayerTurn])');
 assert.equal(g.errors.length,0,JSON.stringify(g.errors));
 return {data,rng};
}
assert.deepEqual(actual(false),actual(true));
console.log('PASS actual solar cast: 88 MP, 5.3 base multiplier, four burn turns, identical gameplay and RNG with/without visuals');
// Backgrounding drops the solar visual owner, including its queued and tail jobs.
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));
ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();
let seq=0;const frames=new Map();
f.c.requestAnimationFrame=cb=>{frames.set(++seq,cb);return seq};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>1000;
f.run('var solarHost=document.createElement("div");document.body.appendChild(solarHost);var solarScene=XiantuDuel25D.create(solarHost,()=>({active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100}));solarScene.act("player","fire","太阳真火");solarScene.hit("enemy",10)');
const seen=[];const oldDraw=f.c.InkSkillFxV2854.draw;f.c.InkSkillFxV2854.draw=(c,j,t)=>seen.push(j.profile.name);
function tick(t){const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(t)}
tick(1050);assert(seen.includes('太阳真火'));seen.length=0;
f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);
f.c.performance.now=()=>2000;f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();
for(let t=2040;t<2300;t+=40)tick(t);assert(!seen.includes('太阳真火'),'hidden solar must not replay');
f.run('solarScene.destroy()');assert.equal(frames.size,0);f.c.InkSkillFxV2854.draw=oldDraw;
console.log('PASS solar background/resume never replays expired action; destroy clears the only RAF');
