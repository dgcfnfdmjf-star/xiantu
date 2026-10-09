const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,z=fx.absoluteZero;assert(z,'absolute zero runtime missing');
const job={profile:fx.profile('绝对零度','ice'),from:{x:260,y:225},to:{x:493,y:225},fromGround:{x:242,y:305},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,duration:900,arriveAt:310,hitAt:310,freezeEnd:1600};
for(const hitAt of [null,120,310,520])for(const reduced of [false,true])for(const light of [false,true]){
 const j={...job,hitAt,reduced,light};
 for(let t=0;t<1950;t+=5){const parts=z.sample(j,t);
  for(const p of parts){assert(p.frame>=0&&p.frame<z.definition.layers[p.layer].frames);assert(p.opacity>0&&p.opacity<=1);if(p.anchor==='target'){assert(hitAt!==null&&t>=hitAt);assert.equal(p.x,493);assert.equal(p.y,278)}if(p.layer==='body')assert.equal(p.width,260);if(reduced)assert.notEqual(p.anchor,'moving')}
  assert(parts.filter(p=>['impact','sustain'].includes(p.layer)).reduce((s,p)=>s+p.opacity,0)<=1.000001);
 }
}
assert(z.sample({...job,freezeEnd:Infinity},12000).some(p=>p.layer==='sustain'));
assert.equal(z.sample({...job,targetPresent:false},800).length,0);
assert.equal(z.sample({...job,freezeEnd:420},720).length,0);
assert.equal(z.sample({...job,freezeEnd:310},500).length,0);
assert.equal(z.sample({...job,hitAt:null},600).length,0);
for(const layer of Object.keys(z.definition.layers))assert(Array.from({length:1900},(_,t)=>z.sample(job,t)).flat().some(p=>p.layer===layer&&p.frame===z.definition.layers[layer].frames-1),layer+' terminal frame');
console.log('PASS absolute zero state-owned lifetime, real-hit gate, terminal frames, early/late/missed hits and crossfade');
const textures=images.filter(i=>(i.src||'').includes('absolute-zero-v286832/'));assert.equal(textures.length,5);
for(const im of textures){const spec=Object.values(z.definition.layers).find(l=>im.src.endsWith(l.file));im.naturalWidth=spec.frames*spec.frameWidth;im.naturalHeight=spec.frameHeight;im.onload()}
assert(z.ready());for(let n=0;n<100;n++)z.prepare();assert.equal(images.filter(i=>(i.src||'').includes('absolute-zero-v286832/')).length,5);
assert.equal(JSON.stringify(JSON.parse(fs.readFileSync(root+'/absolute-zero-v286832/effect-manifest.json')).effects[0]),JSON.stringify(z.definition));
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push([im.src,...args]);let rng=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rng++;return .5};const before=f.run('JSON.stringify([player,currentEnemy])');
for(let t=0;t<1950;t+=17)fx.draw(ctx,{...job,zeroPhase:'full'},t);assert.equal(rng,0);assert.equal(f.run('JSON.stringify([player,currentEnemy])'),before);assert(draws.some(d=>d[0].endsWith('absolute_zero_sustain.png')));
textures[0].onerror();assert(!z.ready());assert.doesNotThrow(()=>fx.draw(ctx,{...job,zeroPhase:'cast'},400));textures[0].onload();
function actual(suppress,randomValue){
 const g=fixture(root);let rng=0;g.c.Math=Object.create(Math);g.c.Math.random=()=>{rng++;return randomValue};for(const file of files)g.load(file);
 g.run('startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=300;player.hp=200;player.gold=1000;player.skills=[{...SKILLS.find(s=>s.name==="绝对零度")}];player.skillLoadoutV212={ice:["绝对零度"]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756("report");startCombat({name:"血狐",hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});');g.timers.clear();
 if(suppress)g.run('playInkSkillV2854=()=>true;InkSkillFxV2854.draw=()=>{};InkSkillFxV2854.drawGround=()=>{}');
 const mp=g.run('player.mp');g.run('combat("skill",0)');assert.equal(g.run('player.mp'),mp-70);assert.equal(g.run('currentEnemy.hp'),50000);g.flush(300);assert(g.run('currentEnemy.hp')<50000);
 assert.equal(g.run('SKILLS.find(s=>s.name==="绝对零度").damage'),4);assert.equal(g.run('currentEnemy._chillTurnsV286818'),2);assert(g.run('skipEnemyTurn&&currentEnemy._skipReason==="冻结"'));
 const data=g.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp,player.inventory,currentEnemy.hp,currentEnemy.def,currentEnemy._chillTurnsV286818,currentEnemy._chillV286818,currentEnemy._skipReason,skipEnemyTurn,isPlayerTurn])');assert.equal(g.errors.length,0,JSON.stringify(g.errors));return {data,rng};
}
for(const value of [.1,.9])assert.deepEqual(actual(false,value),actual(true,value));
console.log('PASS five cached textures, export parity, missing-image fallback, read-only rendering and real 70 MP/4.0 damage/freeze/chill/RNG parity');
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();let serial=0,clock=1000;const frames=new Map();f.c.requestAnimationFrame=cb=>{frames.set(++serial,cb);return serial};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.performance.now=()=>clock;
f.run('var zeroHost=document.createElement("div");document.body.appendChild(zeroHost);var zeroState={active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100,enemyFrozen:true,enemyIdentity:{}};var zeroScene=XiantuDuel25D.create(zeroHost,()=>zeroState);');
const seen=[];fx.draw=(c,j,t)=>{seen.push({phase:j.zeroPhase,t,end:j.freezeEnd,parts:z.sample(j,t)});};
function tick(){clock+=40;const batch=[...frames.values()];frames.clear();seen.length=0;for(const fn of batch)fn(clock)}
function steps(n){for(let i=0;i<n;i++)tick()}
function cast(){f.run('zeroScene.reset();zeroState.enemyHp=100;zeroState.enemyFrozen=true;zeroScene.act("player","ice","绝对零度");zeroScene.hit("enemy",10)');steps(15)}
cast();assert(seen.some(x=>x.phase==='status'&&x.parts.some(p=>p.layer==='sustain')));steps(100);assert(seen.some(x=>x.phase==='status'),'shell survives cast job');assert.equal(frames.size,1);
f.run('zeroScene.act("player","ice","绝对零度");zeroScene.hit("enemy",10)');steps(15);assert(seen.some(x=>x.phase==='status'&&x.t>4000),'refresh preserves existing frozen silhouette');
f.run('zeroState.enemyFrozen=false');tick();assert(seen.some(x=>x.phase==='status'&&Number.isFinite(x.end)));steps(9);assert(!seen.some(x=>x.phase==='status'));
for(const change of ['zeroState.enemyHp=0','zeroState.enemyIdentity={}','zeroScene.reset()']){cast();f.run(change);tick();assert(!seen.some(x=>x.phase==='status'),change)}
cast();f.c.document.hidden=true;for(const fn of f.events.visibilitychange||[])fn();assert.equal(frames.size,0);f.c.document.hidden=false;for(const fn of f.events.visibilitychange||[])fn();steps(3);assert(!seen.some(x=>x.phase==='status'));assert.equal(frames.size,1);
cast();f.run('zeroScene.destroy()');assert.equal(frames.size,0);
console.log('PASS state-owned shell survives 4 seconds, releases once and clears on death/identity/reset/hidden/destroy with one animation loop');
// Legacy portrait fallback also keeps its frozen layer on the existing RAF.
f.run('gameState="combat";currentEnemy={name:"测试敌人",hp:100,maxHp:100,_skipReason:"冻结"};skipEnemyTurn=true;document.getElementById("combatPanel").classList.remove("hidden")');
fx.play('绝对零度','ice');steps(4);fx.hit('enemy');steps(40);assert(fx.inspect().active>0,'legacy frozen layer ended with cast');assert.equal(frames.size,1);
f.run('skipEnemyTurn=false;currentEnemy._skipReason=""');steps(10);assert.equal(fx.inspect().active,0);assert.equal(frames.size,0);
console.log('PASS legacy portrait frozen lifetime and single RAF cleanup');

const reversed={...job,from:job.to,to:job.from,fromGround:job.toGround,toGround:job.fromGround};assert(z.sample(reversed,220).find(p=>p.layer==='body').flipX);assert(z.sample(reversed,600).every(p=>p.x===242&&p.y===305));
console.log('PASS reverse travel and target anchor');
