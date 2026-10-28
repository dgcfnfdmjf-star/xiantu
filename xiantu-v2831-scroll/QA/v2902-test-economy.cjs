'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.c.console.log=()=>{};f.c.confirm=()=>true;
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay();player=createDefaultPlayer();isBossFight=false;isTribulation=false;');
// Independent expected reward table, including unchanged early-game elite exception.
const normal=[10,10,120,160,320,380,450,550,650,750,900,1100,1350,1550,1800,2050,2300];
for(let level=0;level<=16;level++){
 f.run(`player.level=${level}`);
 a.equal(f.run(`battleGoldV28683({gold:10,_realmLevel:${level}})`),normal[level]);
 a.equal(f.run(`battleGoldV28683({gold:10,_realmLevel:${level},_isElite:true})`),level<2?10:level===2?280:normal[level]*1.5);
}
f.run('player.level=16');
a.equal(f.run('battleGoldV28683({gold:10,_realmLevel:3})'),160,'no low-level farming uplift');
f.run('player.level=4');
a.equal(f.run('battleGoldV28683({gold:10,_realmLevel:16})'),400,'cross-realm preserves old floor, no level-16 uplift');
f.run('player.level=16');
for(const flag of ['_isTutorial','_isTaskBattle','_taskId','_warV2839','tournamentFight'])a.equal(f.run(`battleGoldV28683({gold:10,_realmLevel:16,${flag}:true})`),10);
for(const flag of ['_nightRivalV2810','_rainChapterV286822','_miniRunV2778'])a.equal(f.run(`battleGoldV28683({gold:10,_realmLevel:16,${flag}:true})`),400);
a.equal(f.run('battleGoldV28683({name:"幽冥鬼王",gold:10,_realmLevel:16})'),400);
for(const state of ['isBossFight','isTribulation']){f.run(`${state}=true`);a.equal(f.run('battleGoldV28683({gold:10,_realmLevel:16})'),10);f.run(`${state}=false`);}
a.equal(f.run('battleGoldV28683({gold:0,_realmLevel:16})'),0);
a.equal(f.run('battleGoldV28683({gold:9999,_realmLevel:16})'),9999,'never reduce authored higher reward');
f.c.Math.random=()=>{throw Error('reward must not draw RNG')};f.run('battleGoldV28683({gold:10,_realmLevel:16})');f.c.Math.random=()=>.5;
const clone=s=>JSON.parse(f.run(`JSON.stringify(${s})`));
a.deepEqual(clone('GRADES_V2790.map(g=>g.cost)'),[600,2400,9600,19200,38400,76800]);
a.equal(f.run('Object.entries(EQUIPMENT_DB).filter(([n,d])=>d.priceV2790>0&&getDismantleValue(n)>=d.priceV2790).length'),0,'no shop-to-dismantle profit');
a.equal(f.run('100*forgeGradeV2825(getEquipData(newGearNameV2790("万象玄霆",0,6)))*55'),16500,'late +1..10 fee unchanged');
// Existing purchased/forged equipment survives normalization with no gold compensation.
f.run('player.gold=12345;player.equipmentInventory=[newGearNameV2790("万象玄霆",0,6)];globalThis.owned=player.equipmentInventory[0];player=normalizePlayer(JSON.parse(JSON.stringify(player)));');
a.equal(f.run('player.gold'),12345);a.equal(f.run('player.equipmentInventory.includes(owned)'),true);
// Bounties use the saved fight realm, even if the player levels before claiming.
a.equal(f.run('eliteRewardV2883({id:"ape",realm:10,first:true}).gold'),3600);
a.equal(f.run('eliteRewardV2883({id:"ape",realm:16,first:false}).gold'),2600);
f.run('player.level=16;player.gold=1000;player.hp=getMaxHp();player.mp=getMaxMp();player.worldTime.totalDays=10;MONSTER_JEV_V2844.enabled=false;completedAchievements=new Set(Object.keys(ACHIEVEMENTS));showEliteBoardV2883();');
a.equal(f.run('launchEliteV2883("ape")'),true);f.timers.clear();
f.run('dealEnemyDamageV2882(currentEnemy,1e12,false,"passive");checkBattleEnd();completeCombatFinishV2764();');f.timers.clear();
a.equal(f.run('player.eliteHuntV2883.pending.realm'),16);a.equal(f.run('player.gold'),1000);
f.run('saveGame();player=normalizePlayer(loadGame().player);showEliteBoardV2883()');
const before=f.run('JSON.stringify(player)');
f.run('globalThis.oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("quota")}');
a.equal(f.run('claimEliteV2883()'),false);a.equal(f.run('JSON.stringify(player)'),before);
f.run('localStorage.setItem=oldSet;showEliteBoardV2883()');a.equal(f.run('claimEliteV2883()'),true);a.equal(f.run('player.gold'),10200);
f.run('saveGame();player=normalizePlayer(loadGame().player);showEliteBoardV2883()');a.equal(f.run('claimEliteV2883()'),false);a.equal(f.run('player.gold'),10200);
// Annual seal rewards use tier; repeat-practice reward remains old limited income.
f.run('globalThis.seal=normalizeBossV2887(undefined,player);globalThis.fight={id:"xuanming",tier:1,round:30,flawless:false,missed:0,master:false,year:0,day:10};');
a.equal(f.run('bossRewardsV2887(fight,seal).gold'),3840);
f.run('player.level=4');a.equal(f.run('bossRewardsV2887(fight,seal).gold'),3840);
f.run('seal.seal.wonYears=[0];seal.rewardDay=-1');a.equal(f.run('bossRewardsV2887(fight,seal).gold'),150);
f.run('seal.rewardDay=player.worldTime.totalDays');a.equal(f.run('bossRewardsV2887(fight,seal).gold'),0);
console.log('PASS economy floors/exclusions, unchanged early game/forge, shop arbitrage, old ownership, bounty rollback/reload/idempotence and annual practice limits');
