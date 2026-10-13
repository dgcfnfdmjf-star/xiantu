'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run('startGame();closeWorldOverlay()');f.timers.clear();
function fresh(){f.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';COMBAT_FINISH_V2764.settling=false;COMBAT_FINISH_V2764.pending=null;currentEnemy=null;isBossFight=false;isTribulation=false;ensureTaskState();");f.timers.clear();}

fresh();f.run('player.level=16;player.phase=3');
const authored=f.run(`(()=>{
  const rows=[];
  for(const spec of [
    ['宗门试炼守将',true,false,250,22,8,300,500],
    ['幽冥鬼王',true,false,800,60,30,600,1000],
    ['血魔老祖',true,false,2000,100,50,1500,3000],
    ['天劫',false,true,1500,120,20,2000,5000]
  ]){
    const e=makeAuthoredBossV286835(spec[0]);
    balanceEnemyV2802(e,spec[1],spec[2]);
    balanceEnemyV2802(e,spec[1],spec[2]);
    rows.push([e.hp,e.maxHp,e.atk,e.def,e.gold,e.exp].concat(spec.slice(3)));
  }
  const generic={name:'野狼',hp:30,maxHp:30,atk:8,def:2,gold:10,exp:20,_realmLevel:9,_realmPhase:3};
  balanceEnemyV2802(generic,false,false);
  const once=JSON.stringify(generic);
  balanceEnemyV2802(generic,false,false);
  return {rows,scaled:generic.maxHp>30,stable:once===JSON.stringify(generic)};
})()`);
for(const row of authored.rows){a.deepEqual(row.slice(0,6),row.slice(6));}
a.equal(authored.scaled,true);a.equal(authored.stable,true);

fresh();f.run("player.level=16;player.phase=3;startCombat(makeAuthoredBossV286835('天劫'),false,true)");
a.equal(f.run('currentEnemy.hp'),1500);a.equal(f.run('currentEnemy.atk'),120);a.equal(f.run('currentEnemy.def'),20);a.equal(f.run('isTribulation'),true);a.equal(f.run('isBossFight'),false);

fresh();f.run('player.level=9;player.phase=3;ensureTaskState()');
const lockLow=f.run("mainTaskLockV2822(getTaskData('main_17'))");
a.match(lockLow,/青云村/);a.match(lockLow,/终章/);a.match(lockLow,/飞升天劫/);
f.run("showTaskPanel('main')");a.match(f.ids.get('taskListContainer').innerHTML,/飞升天劫/);
fresh();f.run("player.level=10;player.phase=0;ensureTaskState();player.tasks.completed=MAIN_TASKS.slice(0,MAIN_TASKS.findIndex(t=>t.id==='main_17')).map(t=>t.id)");
a.equal(f.run("mainTaskLockV2822(getTaskData('main_17')).includes('飞升天劫')"),false);

function enterVillage(progress,level){fresh();f.run(`player.level=${level};player.phase=0;player.storyProgress=${progress};showVillage()`);}
enterVillage(2,2);
a.match(f.run('currentChoices[0].text'),/宗门试炼守将/);a.equal(f.run('currentChoices[0].action'),'boss_fight');
f.run('handleChoice(0)');
a.equal(f.run('currentEnemy.name'),'宗门试炼守将');a.equal(f.run('currentEnemy.hp'),250);a.equal(f.run('currentEnemy.atk'),22);a.equal(f.run('currentEnemy.def'),8);
enterVillage(3,2);
a.match(f.run('currentChoices[0].text'),/幽冥鬼王/);a.equal(f.run("currentChoices.some(c=>c.action==='boss_fight'&&c.text.includes('宗门试炼守将'))"),false);
f.run('handleChoice(0)');
const ghostPrep=f.ids.get('storyBossPrepV286826');a(ghostPrep);ghostPrep.onclick({target:{closest:()=>({dataset:{prep:'none'}})}});
a.equal(f.run('currentEnemy.name'),'幽冥鬼王');a.equal(f.run('currentEnemy.hp'),800);a.equal(f.run('currentEnemy.atk'),60);a.equal(f.run('currentEnemy.def'),30);
enterVillage(5,6);
a.match(f.run('currentChoices[0].text'),/血魔老祖/);
f.run('handleChoice(0)');
const bloodPrep=f.ids.get('storyBossPrepV286826');a(bloodPrep);bloodPrep.onclick({target:{closest:()=>({dataset:{prep:'none'}})}});
a.equal(f.run('currentEnemy.name'),'血魔老祖');a.equal(f.run('currentEnemy.hp'),2000);a.equal(f.run('currentEnemy.atk'),100);a.equal(f.run('currentEnemy.def'),50);

fresh();f.run("player.level=6;player.storyProgress=3;startCombat(makeAuthoredBossV286835('宗门试炼守将'),true,false);currentEnemy.hp=0;checkBattleEnd()");
a.equal(f.run('player.storyProgress'),3);a.equal(f.run('player.bossesDefeated.includes("宗门试炼守将")'),true);a.equal(f.run('player.storyCompleted[3]'),false);
fresh();f.run("player.level=6;player.storyProgress=3;startCombat(makeAuthoredBossV286835('幽冥鬼王'),true,false);currentEnemy.hp=0;checkBattleEnd()");
a.equal(f.run('player.storyProgress'),4);a.equal(f.run('player.storyCompleted[3]'),true);
fresh();f.run("player.level=6;player.storyProgress=5;startCombat(makeAuthoredBossV286835('血魔老祖'),true,false);currentEnemy.hp=0;checkBattleEnd()");
a.equal(f.run('player.storyProgress'),6);
fresh();f.run("player.level=2;player.storyProgress=2;startCombat(makeAuthoredBossV286835('宗门试炼守将'),true,false);currentEnemy.hp=0;checkBattleEnd()");
a.equal(f.run('player.storyProgress'),3);

fresh();f.run('player.level=2;player.storyProgress=2;showSect()');
a.match(f.ids.get('storyText').innerHTML,/请点「挑战宗门试炼守将」/);
a.equal(f.run("currentChoices.some(c=>c.action==='boss_guardian'&&c.text.includes('宗门试炼守将'))"),true);
a.equal(f.run("currentChoices.some(c=>c.action==='sect_battle')"),true);
f.c.idx=f.run("currentChoices.findIndex(c=>c.action==='boss_guardian')");
f.run('handleChoice(idx)');
a.equal(f.run('currentEnemy.name'),'宗门试炼守将');a.equal(f.run('currentEnemy.hp'),250);a.equal(f.run('isBossFight'),true);
fresh();f.run('player.level=2;player.storyProgress=2;showSect()');
f.c.battleIdx=f.run("currentChoices.findIndex(c=>c.action==='sect_battle')");
f.run('handleChoice(battleIdx)');
a.equal(f.run('gameState'),'exploring');a.equal(f.run('currentEnemy'),null);
a.notEqual(f.run('currentChoices[0].enemy.name'),'宗门试炼守将');a.equal(f.run('currentChoices[0].action'),'fight');
console.log('PASS authored story bosses, chapter-21 tribulation lock, village boss routing, skip guard, sect hint match');
