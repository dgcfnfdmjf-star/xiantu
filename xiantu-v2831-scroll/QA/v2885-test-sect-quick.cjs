'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),run=s=>f.run(s);
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.c.console.log=()=>{};
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();player.level=6;player.sect='凌霄宗';player.sectRank='内门弟子';player.sectContribution=500;player.sectTotalContribution=500;player.gold=1000;player.materials={'灵草':10,'妖丹':2,'星辰砂':1};player.sectTasks=[];gameState='exploring';completedAchievements=new Set(Object.keys(ACHIEVEMENTS));");f.timers.clear();}
const state=()=>run('JSON.stringify(player)'),submit=()=>run('settleReadySectTasksV2885(expansionSessionV286827)');
fresh();const initial=state();run('showReadySectTasksV2885()');a.equal(state(),initial,'menu does not accept a task');a(f.ids.get('expansionV286827').innerHTML.includes('收集灵草'));a(!f.ids.get('expansionV286827').innerHTML.includes('捐献珍材'));a.equal(submit(),false,'no quote on picker');
run("showReadySectTasksV2885('collect_herb')");a.equal(state(),initial,'preview is free of mutations');a.match(f.ids.get('expansionV286827').innerHTML,/灵草×5/);run('globalThis.oldSession=expansionSessionV286827');a.equal(submit(),true);a.equal(run("player.materials['灵草']"),5);a.equal(run('player.gold'),1250);a.equal(run('player.exp'),30);a.equal(run('player.sectContribution'),520);a.equal(run('player.sectTasks.length'),1);a.equal(run('player.sectTasks[0].completed'),true);a.equal(run('player.sectTasks[0]._rewardClaimedV2768'),true);a.equal(run('settleReadySectTasksV2885(oldSession)'),false);a.equal(run('loadGame().player.gold'),1250);
// Explicit next selection can be repeated only by a new preview, never an automatic farming loop.
run("showReadySectTasksV2885('collect_herb')");a.equal(submit(),true);a.equal(run("player.materials['灵草']||0"),0);a.equal(run('player.gold'),1500);a.equal(run("sectReadyQuoteV2885('collect_herb')"),null);
// Existing donations disclose costs; combat tasks block fresh accept, no simulated kills.
fresh();run("player.sectTasks=[generateSectTask('donate_gold')];showReadySectTasksV2885()");a.match(f.ids.get('expansionV286827').innerHTML,/消耗：200灵石/);a.equal(submit(),true);a.equal(run('player.gold'),800);a.equal(run('player.sectContribution'),530);
fresh();run("player.sectTasks=[generateSectTask('combat_monster')];showReadySectTasksV2885()");a.equal(submit(),false);a.equal(run("sectReadyQuoteV2885('collect_herb')"),null);a.equal(run('player.sectTasks[0].progress'),0);
// Shared material budgets: legacy arrays must not double-spend the same inventory.
fresh();run("player.materials['灵草']=5;player.sectTasks=[generateSectTask('collect_herb'),generateSectTask('collect_herb')];showReadySectTasksV2885()");a.equal(run('expansionSessionV286827.quote.tasks.length'),1);a.equal(submit(),true);a.equal(run('player.sectTasks.filter(t=>t.completed).length'),1);a.equal(run("player.materials['灵草']||0"),0);a.equal(run('player.gold'),1250);
// Save rollback covers task acceptance, currencies, inventory, promotion and achievements.
fresh();run("showReadySectTasksV2885('collect_core')");const before=state(),save=f.c.saveGame;f.c.saveGame=()=>false;a.equal(submit(),false);a.equal(state(),before);f.c.saveGame=()=>{throw Error('quota')};a.equal(submit(),false);a.equal(state(),before);f.c.saveGame=save;a.equal(submit(),true);a.equal(run('player.gold'),1500);a.equal(run("player.materials['妖丹']||0"),0);
// Stale resources, actor, sect, panel and combat guards reject a visible old quote.
fresh();run("showReadySectTasksV2885('collect_herb');player.materials['灵草']=4");a.equal(submit(),false);a.equal(run('player.gold'),1000);a.equal(run('player.sectTasks.length'),0);
fresh();run("showReadySectTasksV2885('collect_herb');player.sect='天剑门'");a.equal(submit(),false);
fresh();run("showReadySectTasksV2885('collect_herb');globalThis.stale=expansionSessionV286827;showReadySectTasksV2885('collect_core')");a.equal(run('settleReadySectTasksV2885(stale)'),false);
fresh();run("showReadySectTasksV2885('collect_herb');gameState='combat'");a.equal(submit(),false);run("gameState='exploring';player=createDefaultPlayer()");a.equal(submit(),false);
fresh();run("player.sect='散修'");a.equal(run('showReadySectTasksV2885()'),false);
console.log('PASS explicit one-commission acceptance, real costs/rewards, donation disclosure, no combat skip, shared budgets, atomic retry, persisted payout and stale/actor/sect/phase guards');
