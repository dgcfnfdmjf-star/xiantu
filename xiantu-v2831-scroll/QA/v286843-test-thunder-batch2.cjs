'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.thunderBatch2;assert(b,'dedicated thunder batch must be integrated');
for(const [name,mp,pierce] of [['紫霄落雷',52,.45],['无音神雷',60,.65],['九天神雷',85,undefined]]){const spec=f.run(`SKILLS.find(s=>s.name===${JSON.stringify(name)})`);assert.equal(spec.mpCost,mp);assert.equal(spec.armorPierce,pierce);if(name==='九天神雷')assert.equal(spec.statusChance,.68);}
const manifest=JSON.parse(fs.readFileSync(root+'/thunder-skills-batch2/effect-manifest.json'));
assert.deepEqual(JSON.parse(JSON.stringify(b.definitions)),manifest.effects);
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[],flips=[];ctx.drawImage=(im,...args)=>draws.push([im.src,...args]);ctx.scale=(x,y)=>flips.push([x,y]);
for(const D of b.definitions){
 assert.equal(fx.elementBatch.definition(D.name),undefined,'old shared family no longer owns this skill');
 b.prepare(D.name);b.prepare(D.name);const textures=images.filter(i=>(i.src||'').includes('thunder-skills-batch2/'+D.key));assert.equal(textures.length,4);
 const j={profile:fx.profile(D.name),from:{x:260,y:205},to:{x:493,y:210},fromGround:{x:242,y:305},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,light:false,reduced:false,duration:1100,arriveAt:310,hitAt:310};
 draws.length=0;fx.draw(ctx,j,400);assert(!draws.some(d=>d[0].includes('thunder-skills-batch2')),'procedural fallback before ready');
 for(const im of textures){const L=Object.values(D.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=L.frames*L.frameWidth;im.naturalHeight=L.frameHeight;im.onload()}
 assert(b.ready(D.name));const before=f.run('JSON.stringify([player,currentEnemy])');let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};
 draws.length=0;for(let t=0;t<1200;t+=5)fx.draw(ctx,j,t);assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);f.c.Math=Math;
 for(const [layer,L]of Object.entries(D.layers)){assert(draws.some(d=>d[0].endsWith(L.file)),layer+' drawn');assert(Array.from({length:1100},(_,t)=>b.sample(j,t)).flat().some(p=>p.layer===layer&&p.frame===L.frames-1),'terminal frame');}
 assert.equal(b.sample(j,800).length,0);assert.equal(b.sample({...j,duration:200},210).length,0);
 assert(!b.sample({...j,hitAt:null},350).some(p=>['impact','residue'].includes(p.layer)),'miss has no impact');
 if(D.visualArchetype==='falling'){const early=b.sample(j,220).find(p=>p.layer==='body'),late=b.sample(j,310).find(p=>p.layer==='body');assert(early.y<late.y);assert.equal(early.x,late.x);assert.equal(early.height,late.height);}
 if(D.visualArchetype==='moving-front')assert.equal(b.sample(j,310).find(p=>p.layer==='body').y,278,'ground contact');
 if(D.visualArchetype!=='falling'){flips.length=0;fx.draw(ctx,{...j,from:{x:493,y:210},to:{x:260,y:205},fromGround:{x:493,y:278},toGround:{x:242,y:305}},280);assert(flips.some(([x,y])=>x===-1&&y===1),'mirror horizontally, not upside down');}
 textures[0].onerror();assert(!b.ready(D.name));assert.doesNotThrow(()=>fx.draw(ctx,j,400));textures[0].onload();
}
for(const n of ['万雷噬狱','闪电链','雷神附体','九霄雷云'])assert.equal(fx.elementBatch.definition(n).key,'thunder_strike','other thunder skills unchanged');
console.log('PASS dedicated thunder textures, events, fixed dimensions, anchors, mirrored travel, fallback and pure rendering');
function actual(name,suppress,randomValue){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return randomValue};for(const file of files)g.load(file);
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={thunder:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'血狐',hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});`);g.timers.clear();
 if(suppress)g.run('playInkSkillV2854=()=>true;InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{}');
 g.run('var thunderSounds=[];playSound=kind=>thunderSounds.push(kind)');
 const mp=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mp-({紫霄落雷:52,无音神雷:60,九天神雷:85}[name]));g.flush(300);
 if(name==='九天神雷')assert.equal(g.run("currentEnemy._skipReason==='眩晕'"),randomValue<.68,'actual stun success/failure');
 if(name==='无音神雷')assert.equal(g.run("thunderSounds.includes('hit')"),false,'silent spell retains no hit sound');
 const state=g.run('JSON.stringify([player,currentEnemy,skipEnemyTurn,isPlayerTurn])');assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {state,rng};
}
for(const name of ['紫霄落雷','无音神雷','九天神雷'])for(const random of [.1,.9])assert.deepEqual(actual(name,false,random),actual(name,true,random));
console.log('PASS equipped thunder casts: 52/60/85 MP and identical combat state/RNG with visuals disabled');
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();let serial=0,clock=1000;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>clock;
const seen=[];fx.draw=(c,j,t)=>seen.push({j,t});function tick(t){clock=t;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(t)}
for(const name of ['紫霄落雷','无音神雷','九天神雷']){
 f.run(`var thunderHost=document.createElement('div');document.body.appendChild(thunderHost);var thunderScene=XiantuDuel25D.create(thunderHost,()=>({active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100}));thunderScene.act('player','thunder',${JSON.stringify(name)});thunderScene.hit('enemy',10)`);
 seen.length=0;const start=clock;for(let t=start+40;t<start+600;t+=40)tick(t);
 assert(seen.some(v=>v.j.profile.name===name&&v.j.hitAt!==null&&v.t>=v.j.hitAt),'confirmed hit reaches same action');
 assert(seen.every(v=>v.j.toGround.y===278),'wolf ground anchor');
 f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);seen.length=0;clock+=500;f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();tick(clock+40);assert.equal(seen.length,0,'no stale effects after returning');
 f.run(`thunderScene.act('player','thunder',${JSON.stringify(name)});thunderScene.hit('enemy',0)`);seen.length=0;const missStart=clock;for(let t=missStart+40;t<missStart+450;t+=40)tick(t);assert(seen.length>0);assert(seen.every(v=>v.j.hitAt===null),'zero damage does not create impact');
 f.run('thunderScene.reset()');seen.length=0;tick(clock+40);assert.equal(seen.length,0,'reset clears action');f.run('thunderScene.destroy()');assert.equal(frames.size,0,'destroy stops RAF');
}
console.log('PASS queued hits, torso/ground anchors, miss, hidden/resume/reset/destroy cleanup');

function lethalGame(){
 const f=fixture(root);let stamp=1000,rid=0,randomCalls=0;const frames=new Map();
 f.c.Math=Object.create(Math);f.c.Math.random=()=>{randomCalls++;return .5};f.c.performance.now=()=>stamp;
 f.c.requestAnimationFrame=fn=>{frames.set(++rid,fn);return rid};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.AbortController=AbortController;
 for(const name of files)f.load(name);f.storage.set('xiantu_battle_presentation_v2756','report');
 f.run("startGame();closeWorldOverlay();startCombat({name:'寒冰蛟龙',hp:50000,maxHp:50000,atk:2,def:2,gold:8,exp:10});");f.timers.clear();frames.clear();
 const rect=(x,y,w,h)=>({left:x,top:y,width:w,height:h,right:x+w,bottom:y+h});
 f.ids.get('skillEffect').getBoundingClientRect=()=>rect(0,0,390,330);
 f.ids.get('combatPlayerChar').getBoundingClientRect=()=>rect(24,60,108,180);
 f.ids.get('enemyChar').getBoundingClientRect=()=>rect(251,55,115,180);
 f.step=(dt)=>{stamp+=dt;const batch=[...frames];frames.clear();for(const [,cb] of batch)cb(stamp)};
 f.frames=frames;f.randomCalls=()=>randomCalls;return f;
}
for(const name of ['紫霄落雷','无音神雷','九天神雷'])for(const mode of ['report','cinema']){
 const t=lethalGame();t.run(`setBattlePresentationV2756('${mode}');player.mp=300;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={thunder:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;isPlayerTurn=true;currentEnemy.hp=1;combat('skill',0)`);
 t.flush(150);t.step(150);t.flush(300);const inspect=()=>t.run('InkSkillFxV2854.inspect()');
 assert.equal(t.run('gameState'),'combat-ending');assert(inspect().active>0);assert(inspect().finishing);assert(inspect().jobs[0].hitAt!==null);
 const settled=t.run('JSON.stringify([player.gold,player.exp,player.mp,currentEnemy.hp,COMBAT_FINISH_V2764.token])');t.step(150);assert(inspect().active>0);t.step(150);assert.equal(t.run('JSON.stringify([player.gold,player.exp,player.mp,currentEnemy.hp,COMBAT_FINISH_V2764.token])'),settled);
 t.step(300);assert.equal(inspect().active,0);assert.equal(inspect().pixels,0);t.flush(720);assert.equal(t.run('gameState'),'exploring');assert.equal(t.errors.length,0);
}
console.log('PASS three lethal casts in report/cinema: confirmed impact survives settlement, then expires; rewards unchanged');
