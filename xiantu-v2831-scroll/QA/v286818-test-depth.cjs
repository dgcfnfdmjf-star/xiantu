const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root),images=[],BaseImage=f.c.Image;
f.c.Image=class extends BaseImage{constructor(){super();images.push(this)}};
f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay()');
function fresh(){f.run('resetRuntimeState();player=createDefaultPlayer();player.hp=250;player.mp=100;player.gold=1000;startCombat({name:"血狐",hp:50000,maxHp:50000,atk:1,def:100,gold:1,exp:1,_realmLevel:0,_realmPhase:0});currentEnemy.atk=10;currentEnemy.def=100;');f.timers.clear();}
fresh();f.run('applyElementHitV286818(SKILLS.find(s=>s.name==="玄冰刺"),100)');
a.equal(f.run('skipEnemyTurn'),false);a.equal(f.run('enemyAttackV286818()'),8.5);a.equal(f.run('currentEnemy._chillTurnsV286818'),2);
f.run('isPlayerTurn=false;resolveEnemyTurnV2844({choice:"attack",source:"local"})');f.flush(150);a.equal(f.run('currentEnemy._chillTurnsV286818'),1);
f.run('isPlayerTurn=false;resolveEnemyTurnV2844({choice:"attack",source:"local"})');f.flush(150);a.equal(f.run('enemyAttackV286818()'),10);
f.run('applyElementHitV286818(SKILLS.find(s=>s.name==="冰爆术"),100)');a.equal(f.run('enemyDefenseV286818()'),75);
fresh();f.run('applyElementHitV286818(SKILLS.find(s=>s.name==="烈焰斩"),100)');a.equal(f.run('enemyDefenseV286818()'),85);
f.run('applyElementHitV286818(SKILLS.find(s=>s.name==="烈焰斩"),100)');a.equal(f.run('currentEnemy.burnStacks'),20,'burn refresh never sums unbounded');
f.run('applyElementHitV286818(SKILLS.find(s=>s.name==="红莲业火"),100)');a(!f.run('monsterAvailableV2844().includes("heal")'));
const before=f.run('currentEnemy.hp');f.run('applyElementHitV286818(SKILLS.find(s=>s.name==="炎爆术"),50)');a.equal(f.run('currentEnemy.hp'),before-60);a.equal(f.run('currentEnemy.burnTurns'),0);a.equal(f.run('enemyDefenseV286818()'),100);
fresh();f.run('applyElementGuardV286818({element:"ice"})');const pool=f.run('Math.floor(getMaxHp()*.2)');a.equal(f.run('absorbElementGuardV286818(20)'),0);a.equal(f.run('elementGuardsV286818.get(currentEnemy).pool'),pool-20);
f.run('applyElementGuardV286818({element:"ice"})');a.equal(f.run('elementGuardsV286818.get(currentEnemy).pool'),pool);
f.run('for(let i=0;i<3;i++)finishEnemyElementsV286818(currentEnemy,player)');a.equal(f.run('elementGuardsV286818.has(currentEnemy)'),false);
for(const name of ['寒冰掌','冰甲护身','炎阳护盾','霜寒结界','炎爆术']){
 fresh();f.c.skillName=name;f.run('player.skills=[{...SKILLS.find(s=>s.name===skillName)}];player.skillLoadoutV212={[player.skills[0].element]:[skillName]};player.skillLoadoutInitializedV212=true;combat("skill",0)');
 f.flush(300);if(name.includes('护')){a(f.run('elementGuardsV286818.has(currentEnemy)'));a.equal(f.run('currentEnemy.hp'),50000,'shield must not attack');}
 if(name==='寒冰掌'){a.equal(f.run('skipEnemyTurn'),false);a.equal(f.run('currentEnemy._chillTurnsV286818'),2);}
 if(name==='霜寒结界')a.equal(f.run('currentEnemy._frostTurnsV286818'),3);
}
console.log('PASS real ice/fire casts, chill duration, armor, bounded burn/detonation, no-heal and shield pool');
fresh();a.equal(f.run('fleeChanceV286818()'),.6);f.run('player.equipment.boots="草鞋"');a(f.run('fleeChanceV286818()')>.6);
f.run('player.equipment={};currentEnemy._chillTurnsV286818=2;currentEnemy._chillV286818=.3');a(f.run('fleeChanceV286818()')>.6);
f.run('currentEnemy._chillTurnsV286818=0;currentEnemy._realmLevel=10');a.equal(f.run('fleeChanceV286818()'),.15);
f.run('currentEnemy._realmLevel=0;player.level=10');a.equal(f.run('fleeChanceV286818()'),.95);
for(const flag of ['isBossFight=true','isTribulation=true','currentEnemy.tournamentFight=true','currentEnemy._warV2839=true','currentEnemy._isTaskBattle=true','currentEnemy._isTutorial=true']){
 fresh();f.run('player.inventory=["神行符"];'+flag);a.equal(f.run('fleeChanceV286818()'),0);f.run('combat("escapeScroll")');a.equal(f.run('player.inventory.length'),1);a.equal(f.run('isPlayerTurn'),true);
}
fresh();f.run('player.inventory=["神行符","神行符"];combat("escapeScroll");combat("escapeScroll")');a.equal(f.run('player.inventory.length'),1);a.equal(f.run('loadGame().player.inventory.length'),1);a.equal(f.run('loadGame().interruptedBattleV286812'),undefined);
fresh();f.c.Math.random=()=>.999;f.run('combat("flee")');a.equal(f.run('COMBAT_FINISH_V2764.settling'),false);f.flush(500);f.flush(150);a.equal(f.run('isPlayerTurn'),true);f.c.Math.random=()=>.5;
console.log('PASS speed/realm/chill escape odds, bounds, forbidden battles, single scroll consumption and failed-escape turn');
function encounter(kind='traveler'){
 f.run('resetRuntimeState();player=createDefaultPlayer();gameState="exploring";currentRegion="south";player.materials={"灵草":2};player.inventory=[];player.gold=100;player.mp=100;player.roamingV286818={maps:{}};');
 f.c.kind=kind;f.run('roamingStateV286818().pending=kind;saveGame();openRoamingV286818()');
}
encounter();a.equal(f.run('resolveRoamingV286818("aid")'),true);a.equal(f.run('player.materials["灵草"]'),0);a.equal(f.run('player.inventory.filter(n=>n==="神行符").length'),1);a.equal(f.run('resolveRoamingV286818("aid")'),false);
f.run('loadAndStart()');a.equal(f.run('roamingStateV286818().resolved.traveler'),'aid');a.equal(f.run('player.inventory.filter(n=>n==="神行符").length'),1);
encounter('ruins');a.equal(f.run('resolveRoamingV286818("channel")'),true);a.equal(f.run('player.mp'),80);a.equal(f.run('player.gold'),180);
encounter();f.run('player.materials["灵草"]=1');a.equal(f.run('resolveRoamingV286818("aid")'),false);a.equal(f.run('player.inventory.length'),0);
encounter();f.run('closeWorldOverlay()');a.equal(f.run('resolveRoamingV286818("guide")'),false);
encounter();f.run('currentRegion="north"');a.equal(f.run('resolveRoamingV286818("guide")'),false);
encounter();f.run('player={...player}');a.equal(f.run('resolveRoamingV286818("guide")'),false);
encounter();const originalSet=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(f.run('resolveRoamingV286818("aid")'),false);a.equal(f.run('player.materials["灵草"]'),2);a.equal(f.run('player.inventory.length'),0);a.equal(f.run('roamingStateV286818().pending'),'traveler');f.c.localStorage.setItem=originalSet;
a.equal(f.run('resolveRoamingV286818("aid")'),true);a.equal(f.run('player.inventory.length'),1);
a.equal(f.run('JSON.stringify(normalizePlayer(createDefaultPlayer()).roamingV286818)'),'{"maps":{}}');
console.log('PASS one-time encounters, reload, insufficient payment, stale UI/region/player, failed-write rollback and legacy saves');
fresh();a.equal(f.run('XiantuDuel25D.petKey({type:"灵狐",name:"灵纹野兔"})'),'rabbit');a.equal(f.run('XiantuDuel25D.petKey({type:"雷鹰",name:"魔渊蝙蝠"})'),'bat');a.equal(f.run('XiantuDuel25D.petKey({type:"灵狐",name:"小白",speciesV286818:"灵纹野兔"})'),'rabbit');a.equal(f.run('XiantuDuel25D.petKey({type:"仙鹤",name:"云归"})'),'crane');
const art=images.find(i=>(i.src||'').includes('duel-ink-poses'));art.naturalWidth=1536;art.naturalHeight=1024;art.onload();
let frame;f.c.requestAnimationFrame=cb=>(frame=cb,1);f.c.cancelAnimationFrame=()=>{};f.c.performance.now=()=>1000;
f.run('var petView={playerHp:100,playerMax:100,enemyHp:100,enemyMax:100,pet:{name:"碧水灵龟",type:"玄龟"}};var petScene=XiantuDuel25D.create(document.body,()=>petView)');
frame(1100);for(const im of images.filter(i=>/duel-(beasts|wings|fighters|bosses)-/.test(i.src||''))){im.naturalWidth=1024;im.naturalHeight=1536;im.onload();}
const painted=[],ctx=f.run('petScene.canvas.getContext("2d")');ctx.drawImage=im=>painted.push(im.src);const snapshot=f.run('JSON.stringify(petView)');frame(1200);a(painted.some(src=>src?.includes('duel-wings')));
f.run('petScene.hit("enemy",8,false,false,true)');frame(1300);a.equal(f.run('JSON.stringify(petView)'),snapshot);
f.run('petView.pet={type:"仙鹤",name:"云归"}');frame(1400);f.run('petScene.reset();petScene.destroy()');
console.log('PASS species identity, captured rename, crane fallback, same-stage atlas draw and read-only pet hit');
// Discovery is tied to distinct visited cells, not a frame timer or repeated clicks.
f.run('resetRuntimeState();player=createDefaultPlayer();gameState="exploring";currentRegion="south";closeWorldOverlay();player.roamingV286818={maps:{}};');
f.run('autoNavigationV2830={};for(let i=0;i<100;i++)discoverRoamingV286818(i+",0");autoNavigationV2830=null;');
a.equal(f.run('roamingStateV286818().steps'),0,'explicit navigation never triggers encounters');
f.run('for(let i=0;i<200&&!roamingStateV286818().pending;i++)discoverRoamingV286818(i+",0")');a.equal(f.run('roamingStateV286818().pending'),'traveler');
a.equal(f.run('loadGame().player.roamingV286818.maps.south.pending'),'traveler');
f.run('resolveRoamingV286818("guide");closeWorldOverlay();for(let i=200;i<400&&!roamingStateV286818().pending;i++)discoverRoamingV286818(i+",0")');a.equal(f.run('roamingStateV286818().pending'),'ruins');
f.run('resolveRoamingV286818("copy");closeWorldOverlay();for(let i=0;i<100;i++)discoverRoamingV286818("400,0")');a.equal(f.run('roamingStateV286818().restSeen.length'),1);
f.run('for(let i=401;i<435;i++)discoverRoamingV286818(i+",0")');a.equal(f.run('roamingStateV286818().restSeen.length'),35);a.equal(f.run('Object.keys(roamingStateV286818().resolved).length'),2);
f.run('saveGame();player=normalizePlayer(loadGame().player)');a.equal(f.run('roamingStateV286818().restSeen.length'),35);
const setBeforeCycle=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};f.run('discoverRoamingV286818("435,0")');a.equal(f.run('Object.keys(roamingStateV286818().resolved).length'),2);f.c.localStorage.setItem=setBeforeCycle;
f.run('discoverRoamingV286818("435,0")');a.equal(f.run('roamingStateV286818().cycle'),1);a.equal(f.run('Object.keys(roamingStateV286818().resolved).length'),0);
f.run('for(let i=500;i<800&&!roamingStateV286818().pending;i++)discoverRoamingV286818(i+",0")');a.equal(f.run('roamingStateV286818().pending'),'traveler');
f.run('globalThis.roamGold=player.gold;resolveRoamingV286818("guide");resolveRoamingV286818("guide")');a.equal(f.run('player.gold-roamGold'),30);
console.log('PASS distinct-cell cooldown, save/reload, failed cycle reset rollback, repeated rounds and single claim');
