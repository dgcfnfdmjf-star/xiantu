'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
function game(){const f=fixture(root);f.c.console.log=()=>{};f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.storage.set('xiantu_battle_presentation_v2756','report');for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.run('startGame();closeWorldOverlay();player.level=16;player.hp=getMaxHp();player.mp=getMaxMp();MONSTER_JEV_V2844.enabled=false;completedAchievements=new Set(Object.keys(ACHIEVEMENTS));player.worldTime.totalDays=GAME_DAYS_PER_YEAR*100;player.sectTournament.secretQualifiedCentury=getGameDate().year;');f.timers.clear();return f;}
(async()=>{
const f=game();f.run('for(let n=0;n<20;n++)RANDOM_EVENTS["低阶样本"+n]={type:"npc",weight:1,minLevel:0,effect:()=>({text:"low"})};for(let n=0;n<3;n++)RANDOM_EVENTS["高阶样本"+n]={type:"cultivation",weight:10,minLevel:16,effect:()=>({text:"high"})};RANDOM_EVENTS["未解锁"]={type:"npc",weight:10,minLevel:17};');
a.equal(f.run('secretEventsV2886().length'),16);a.equal(f.run('secretEventsV2886().slice(0,3).every(([k])=>k.startsWith("高阶样本"))'),true);a.equal(f.run('secretEventsV2886().some(([k])=>k==="未解锁")'),false);f.run('player.level=2');a.equal(f.run('secretEventsV2886().every(([,e])=>e.minLevel<=2)'),true);
a.equal(f.run('secretFallbackV2886([["a",{type:"cultivation",weight:10}],["b",{type:"npc",weight:1}]],.8)'),0);a.equal(f.run('secretFallbackV2886([["a",{type:"cultivation",weight:10}],["b",{type:"npc",weight:1}]],.99)'),1);
// Real route keeps the 40% gate and 30-day cost; no fabricated fallback-to-first.
const r=game();let calls=0,fallback='';r.c.Math.random=()=>.99;r.c.jevDecideV2846=async(state,key)=>{calls++;fallback=key;return {choice:key};};const day=r.run('discipleDayV2815()');await r.run('jevSecretV2846()');a.equal(calls,0);a.equal(r.run('discipleDayV2815()'),day+30);
let draw=0;r.c.Math.random=()=>draw++===0?.1:.99;await r.run('jevSecretV2846()');a.equal(calls,1);a.equal(Number(fallback.slice(1)),r.run('secretEventsV2886().length-1'));a.equal(r.run('discipleDayV2815()'),day+60);
// Cancelled / stale async decisions cannot advance time or run event effects.
for(const change of ['closeJevWorldV2846()','player.level=15','player={...player}']){
 const c=game();c.c.Math.random=()=>.1;let resolve;c.c.jevDecideV2846=()=>new Promise(done=>resolve=done);const pending=c.run('jevSecretV2846()');c.run(change);const old=c.run('JSON.stringify(player)');resolve({choice:'o0'});await pending;a.equal(c.run('JSON.stringify(player)'),old);
}
// Actual HP loss only. Overkill, pets, DOT and damage animations cannot inflate the peak.
const p=game();p.run('startCombat({name:"野狼",hp:1000,maxHp:1000,atk:1,def:1,gold:0,exp:0});currentEnemy.hp=currentEnemy.maxHp=500');p.timers.clear();a.equal(p.run('combatPeakV2886()'),null);
p.run('dealEnemyDamageV2882(currentEnemy,120,false,"direct","普通攻击");showDamageNumber(99999,"enemy",false,true,false,false,"幻影");dealEnemyDamageV2882(currentEnemy,100,false,"pet");dealEnemyDamageV2882(currentEnemy,50,false,"passive")');a.equal(p.run('combatPeakV2886().peakHit'),120);a.equal(p.run('combatPeakV2886().directHits'),1);
p.run('dealEnemyDamageV2882(currentEnemy,10000,true,"direct","御剑术")');a.equal(p.run('combatPeakV2886().peakHit'),230);a.equal(p.run('combatPeakV2886().directHits'),2);a.equal(p.run('combatPeakV2886().peakSkill'),'御剑术');a(p.run('BattleClarityV2856.read().chips.some(c=>c.text.includes("最高直击 230"))'));
p.run('beginCombatFinishV2764("victory")');a.equal(p.run('combatPeakV2886().peakHit'),230);p.run('completeCombatFinishV2764()');a.equal(p.run('player.lastBattleReviewV2878.peakHit'),230);a.equal(p.run('loadGame().player.lastBattleReviewV2878.directHits'),2);
p.run('startCombat({name:"野狼",hp:1000,maxHp:1000,atk:1,def:1,gold:0,exp:0});player.activePet=null;currentEnemy.hp=1e6;combat("attack")');p.flush(150);a.equal(p.run('combatPeakV2886().directHits'),1);a.equal(p.run('combatPeakV2886().peakSkill'),'普通攻击');p.run('player={...player}');a.equal(p.run('combatPeakV2886()'),null);
const e=game();e.run('showEliteBoardV2883();launchEliteV2883("ape");currentEnemy.hp=currentEnemy.maxHp=1000;dealEnemyDamageV2882(currentEnemy,100,false,"direct","雷法")');a.equal(e.run('combatPeakV2886().peakHit'),35,'post-shield loss');
e.run('resetRuntimeState();player.hp=getMaxHp();showEliteBoardV2883();launchEliteV2883("general");currentEnemy.hp=100;dealEnemyDamageV2882(currentEnemy,10000,true,"direct","天地一剑")');a(e.run('currentEnemy.hp')>0);a.equal(e.run('combatPeakV2886().peakHit'),100,'damage before undying restoration, capped to available HP');
a.equal(e.run('normalizeBattleReviewV2878({kind:"victory"}).peakHit'),0,'old review remains valid');
console.log('PASS high-realm candidate cap/weights/gates, 40% event split, 30-day single settlement, async cancellation; post-shield real peak, overkill/source exclusions, undying, actual basic attack, new battle/owner isolation and persisted review');
})().catch(e=>{console.error(e);process.exitCode=1;});
