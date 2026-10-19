'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root),images=[],Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};for(const file of files)f.load(file);
const fx=f.c.InkSkillFxV2854,b=fx.swordBatch;assert(b,'independent sword resources must be integrated');
const manifest=JSON.parse(fs.readFileSync(root+'/sword-skills-batch1/effect-manifest.json'));assert.deepEqual(JSON.parse(JSON.stringify(b.definitions)),manifest.effects);
const ctx=f.ids.get('combatPlayerChar').getContext('2d'),draws=[];ctx.drawImage=(im,...args)=>draws.push(im.src);
for(const D of b.definitions){
 assert.equal(fx.elementBatch.definition(D.name),undefined);const p=fx.profile(D.name);b.prepare(D.name);b.prepare(D.name);
 const textures=images.filter(i=>i.src?.includes('sword-skills-batch1/'+D.key));assert.equal(textures.length,4,'cache once per layer');
 const j={profile:p,from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},width:720,clipBottom:355,scale:1,duration:1100,arriveAt:310,hitAt:null};
 draws.length=0;fx.draw(ctx,j,240);assert(!draws.some(s=>s.includes('sword-skills-batch1')),'fallback until complete');
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
 for(const file of files)if(old&&file==='xiantu-v2855-skill-fx.js')g.run(fs.readFileSync(path.join(root,'../art/sword-skills-batch1/runtime-before',file),'utf8'));else g.load(file);
 g.run(`startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.mp=1000;player.hp=1000;player.skills=[{...SKILLS.find(s=>s.name===${JSON.stringify(name)})}];player.skillLoadoutV212={sword:[${JSON.stringify(name)}]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'血狐',hp:50000,maxHp:50000,atk:20,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});currentEnemy.atk=20;currentEnemy.def=10;`);
 g.timers.clear();const mp=g.run('player.mp');g.run('combat("skill",0)');g.flush(150);g.flush(300);
 assert.equal(mp-g.run('player.mp'),{'御剑术':10,'万剑归宗':50,'天地一剑':80}[name]);assert.equal(g.errors.length,0,JSON.stringify(g.errors));
 return {state:g.run('JSON.stringify([player,currentEnemy,skipEnemyTurn,isPlayerTurn])'),rng};
}
for(const name of ['御剑术','万剑归宗','天地一剑'])assert.deepEqual(combat(name,false),combat(name,true),name+' mechanics and RNG identical');
console.log('PASS sword resources, actual draw route, missing texture fallback, final frames, expiry, read-only rendering and original combat/MP/RNG parity');
