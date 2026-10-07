const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root),images=[];const ImageBase=f.c.Image;
f.c.Image=class extends ImageBase{constructor(){super();images.push(this)}};
f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay()');
function fresh(){f.run('resetRuntimeState();player=createDefaultPlayer();player.gold=1000;player.hp=80;player.mp=100;player.inventory=["大还丹","聚灵丹"];initAchievements();');f.timers.clear();}
const fields='({hp:player.hp,mp:player.mp,gold:player.gold,inventory:player.inventory})';
for(const action of ['combat("skill",0)','useCombatBagItem("大还丹")']){
 fresh();const before=f.run(`JSON.stringify(${fields})`);
 f.run('startCombat({...ENEMIES[0],_realmLevel:0,_realmPhase:0});');
 const initial=f.run('currentEnemy.hp');f.run(action);
 a.equal(f.run('currentEnemy.hp'),initial,'probe is before damage timer');
 a.notEqual(f.run(`JSON.stringify(${fields})`),before,'live action paid a cost');
 f.run('saveGame()');a.equal(f.run('loadGame().interruptedBattleV286812'),true);
 f.run('loadAndStart()');a.equal(f.run(`JSON.stringify(${fields})`),before);
 a.equal(f.run('gameState'),'exploring');a.equal(f.run('currentEnemy'),null);
 f.flush(300);f.flush(150);a.equal(f.run(`JSON.stringify(${fields})`),before,'old action cannot change restored character');
}
console.log('PASS paid skill/medicine interruption rolls back complete battle, stale callbacks isolated');
fresh();f.run('startCombat({...ENEMIES[0],_realmLevel:0,_realmPhase:0});');
const raw=f.storage.get('xiantu_save');const set=f.c.localStorage.setItem;
f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(f.run('saveGame()'),false);a.equal(f.storage.get('xiantu_save'),raw);f.c.localStorage.setItem=set;
f.run('currentEnemy.hp=0;checkBattleEnd();');const settled=f.run(`JSON.stringify(${fields})`);
a.equal(f.run('loadGame().interruptedBattleV286812'),undefined);a.equal(f.run('loadGame().player.gold'),f.run('player.gold'));
f.run('checkBattleEnd();loadAndStart()');a.equal(f.run(`JSON.stringify(${fields})`),settled,'won rewards retained exactly once');
fresh();f.run('startCombat({...Object.values(BOSSES).find(e=>e.name==="宗门试炼守将"),name:"宗门试炼守将"},true);currentEnemy.hp=0;checkBattleEnd()');
a(f.run('loadGame().player.bossesDefeated.includes("宗门试炼守将")'));
a(f.run('[...loadGame().player.inventory,...loadGame().player.equipmentInventory].includes("精钢剑")'));
fresh();f.run('startCombat({...ENEMIES[0],_realmLevel:0,_realmPhase:0});player.mp=71;beginCombatFinishV2764("flee");readyCombatFinishV2764({kind:"flee"})');
a.equal(f.run('loadGame().player.mp'),71);a.equal(f.run('loadGame().interruptedBattleV286812'),undefined);
fresh();f.run('startCombat({...ENEMIES[0],_realmLevel:0,_realmPhase:0});player.pets.push({type:Object.keys(PET_TYPES)[0],name:"捕获回归",level:1});endCombatAfterCapture();');
a(f.run('loadGame().player.pets.some(p=>p.name==="捕获回归")'),'capture persisted after rollback snapshot released');
fresh();f.run('startCombat({...ENEMIES[0],_realmLevel:0,_realmPhase:0});player.hp=1;currentEnemy.atk=1000000;isPlayerTurn=false;resolveEnemyTurnV2844()');f.flush(150);
a.equal(f.run('loadGame().player.gold'),800);a.equal(f.run('loadGame().player.hp'),1);a.equal(f.run('loadGame().interruptedBattleV286812'),undefined);
console.log('PASS quota preserves save; victory, boss drop, defeat, flee and capture commit instead of rollback');
// Preserve integer rounding at every existing bonus zone, rather than converting to additive bonuses.
fresh();f.run('startCombat({...ENEMIES[0],_realmLevel:0,_realmPhase:0});getDamageBonusWithSet=()=>.2;hasStatusEffect=()=>true;player.activeArtifact={type:"飞剑",level:3};currentEnemy.hp=1');
a.equal(f.run('playerDamageBonusesV286812(101,{element:"sword",executeBonus:.5})'),Math.floor(Math.floor(Math.floor(Math.floor(101*1.2)*1.15)*1.21)*1.5));
f.run('player.activeArtifact=null;var originalDamage=calculateFinalDamage;var observedSkill=null;prepareGearSkillV2790=()=>({damage:1,armorPierce:.3});calculateFinalDamage=function(o){observedSkill=o.skill;return originalDamage(o)};currentEnemy.hp=currentEnemy.maxHp;combat("attack")');f.flush(150);
a.equal(f.run('observedSkill.armorPierce'),.3);
console.log('PASS multiplicative zones and rounding retained; ordinary attacks pass gear penetration');
// Render observations at 30 FPS and delayed 4 FPS; no engine/player state is mutated.
const art=images.find(i=>(i.src||'').includes('duel-ink-poses'));art.naturalWidth=1536;art.naturalHeight=1024;art.onload();
let frame;f.c.performance.now=()=>1000;f.c.requestAnimationFrame=cb=>(frame=cb,1);f.c.cancelAnimationFrame=()=>{};
f.run('var probe=XiantuDuel25D.create(document.body,()=>({playerHp:100,playerMax:100,enemyHp:70,enemyMax:100}));probe.act("player","fire");probe.hit("enemy",30)');
const text=[],ctx=f.run('probe.canvas.getContext("2d")');ctx.fillText=t=>text.push(t);
function tick(t){text.length=0;frame(t);}
tick(1250);a(!text.includes('−30'),'projectile must arrive at 310ms before numeric hit');tick(1320);a(text.includes('−30'));
f.run('probe.reset();probe.act("player","sword");probe.hit("enemy",42);probe.act("enemy","sword");probe.hit("player",9)');
tick(1420);a(!text.includes('−42'));a(!text.includes('−9'));tick(1620);a(text.includes('−42'));a(!text.includes('−9'));tick(2120);a(text.includes('−9'),'queued counterattack owns its hit');
f.run('probe.reset();probe.act("player");probe.hit("enemy",77);probe.reset()');tick(2200);a(!text.includes('−77'));f.run('probe.destroy()');
console.log('PASS contact-gated projectile/lunge/counterattack feedback and pending-hit cleanup');
