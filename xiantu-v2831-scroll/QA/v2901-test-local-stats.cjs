'use strict';
const fs=require('fs'),path=require('path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);for(const file of files)f.load(file);
const run=s=>f.run(s),j=s=>JSON.parse(run(`JSON.stringify(${s})`));
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();player.name='统计测试';player.level=4;player.gold=1000;player.exp=0;player.worldTime={totalDays:100};gameState='exploring';closeWorldOverlay();document.getElementById('gameScreen').classList.remove('hidden');document.getElementById('startScreen').classList.add('hidden');document.hidden=false;document.visibilityState='visible';STAT_RT_V2901.enabled=false;STAT_RT_V2901.data=null;localStorage.removeItem(STATS_V2901.key);statsResetRuntimeV2901()");}
fresh();run('statsSampleV2901();player.gold+=100;statsSampleV2901()');a.equal(run('STAT_RT_V2901.timer'),null);a.equal(run('localStorage.getItem(STATS_V2901.key)'),null,'disabled recorder never writes');
run('statsSetEnabledV2901(true)');const saved=run('JSON.stringify(player)');run('statsSampleV2901();statsSaveV2901()');a.equal(run('JSON.stringify(player)'),saved,'statistics never touch player save');
run("STAT_RT_V2901.ctx='market';player.gold-=50;statsSampleV2901();STAT_RT_V2901.ctx='other';player.gold+=80;player.exp+=30;statsSampleV2901()");a.equal(run('statsBucketV2901(4).goldOut.market'),50);a.equal(run('statsBucketV2901(4).goldIn.other'),80);a.equal(run('statsBucketV2901(4).exp.other'),30);
run("player.worldTime.totalDays+=30;player.exp+=40;statsSampleV2901()");a.equal(run('statsBucketV2901(4).exp.retreat'),40);
run("player.phase++;player.exp=0;statsSampleV2901();player.exp=50;statsSampleV2901();player.exp=10;player.breakthrough={cooldownDays:5};statsSampleV2901()");a.equal(run('statsBucketV2901(4).breakthroughs'),1);a.equal(run('statsBucketV2901(4).failures'),1);
// An actual guarded purchase scopes only successful deductions, including confirmation cancellation.
run("player.breakthrough={};player.gold=100000;statsResetRuntimeV2901();statsSampleV2901()");
const price=run('player.gold');f.c.confirm=()=>false;run('buyGeneralV2801(0,1)');a.equal(run('player.gold'),price);f.c.confirm=()=>true;run('buyGeneralV2801(0,1)');a(run('player.gold')<price);a(run('statsBucketV2901(4).goldOut.market')>50);
const sum=run('JSON.stringify(statsLoadV2901())');run("player={...player,gold:900000,exp:90000};statsSampleV2901()");a.equal(run('JSON.stringify(statsLoadV2901())'),sum,'same-name role replacement is not income');
run("statsResetRuntimeV2901();player.gold=1;statsSampleV2901()");a.equal(run('JSON.stringify(statsLoadV2901())'),sum,'load rollback is not spending');
// Active time excludes hidden, idle and the start screen; battle mode is captured when fight starts.
run('STAT_RT_V2901.lastTick=Date.now()-1000;STAT_RT_V2901.lastInput=Date.now();statsSampleV2901()');a(run('statsBucketV2901(4).activeSec')>=1);const sec=run('statsBucketV2901(4).activeSec');
run('document.hidden=true;STAT_RT_V2901.lastTick=Date.now()-1000;statsSampleV2901();document.hidden=false;STAT_RT_V2901.lastInput=Date.now()-70000;STAT_RT_V2901.lastTick=Date.now()-1000;statsSampleV2901()');a.equal(run('statsBucketV2901(4).activeSec'),sec);
run("localStorage.setItem('xiantu_battle_presentation_v2756','report');currentEnemy={hp:0};gameState='combat';statsFightStartV2901();STAT_RT_V2901.lastInput=Date.now();STAT_RT_V2901.lastTick=Date.now()-1000;statsSampleV2901();localStorage.setItem('xiantu_battle_presentation_v2756','cinema');COMBAT_FINISH_V2764.pending={kind:'victory'};statsFightEndV2901();statsFightEndV2901()");a.equal(run('statsBucketV2901(4).wins'),1);a.equal(run('statsBucketV2901(4).fightN.report'),1);a.equal(run('statsBucketV2901(4).fightN.cinema'),0);
run("statsFightStartV2901();COMBAT_FINISH_V2764.pending={kind:'flee'};statsFightEndV2901()");a.equal(run('statsBucketV2901(4).exits'),1);a.equal(run('statsBucketV2901(4).losses'),0);
const old=j('statsLoadV2901()');run("player.testAccount999=true;statsSampleV2901();statsFightStartV2901();statsFightEndV2901()");a.deepEqual(j('statsLoadV2901()'),old,'test roles excluded');
run('player.testAccount999=false;statsSetEnabledV2901(false)');a.equal(run('STAT_RT_V2901.timer'),null);const off=j('statsLoadV2901()');run('player.gold+=100;statsSampleV2901()');a.deepEqual(j('statsLoadV2901()'),off);
console.log('PASS opt-in, actual balance deltas, confirmation cancellation, save ownership, visible active time, fight results/mode and disable');
// Corrupted objects, unexpected labels and prototypes are normalized into bounded numeric data.
for(const raw of ['no json','{"v":1,"realms":null}','{"v":1,"realms":[]}','{"v":1,"realms":{"4":{"goldIn":{"market":"oops","<script>":99,"__proto__":33},"wins":-1,"fightN":null}}}']){
 f.storage.set('xiantu_stats_v2901',raw);run('STAT_RT_V2901.data=null');a.doesNotThrow(()=>run('statsRowsV2901();statsCsvV2901()'));a(!run('JSON.stringify(statsLoadV2901())').includes('<script>'));
}
run("gameState='exploring';closeWorldOverlay();statsSetEnabledV2901(true);STAT_RT_V2901.dirty=true");const set=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(run('statsSaveV2901()'),false);a(run('STAT_RT_V2901.dirty'),'failed local write remains retryable');f.c.localStorage.setItem=set;a(run('statsSaveV2901()'));
const csv=run('statsCsvV2901()');a(csv.startsWith('\ufefflevel,realm,metric,source,value\r\n'));a(csv.includes('goldIn')||csv.includes('wins'));
run('showSaveManagerV2768()');a(run("document.querySelector('.stats-entry-v2901')"));run("document.getElementById('saveManagerV2768').remove();showPacingStatsV2901()");a(run('isWorldOverlayOpen()'),'panel pauses movement');a(run("document.getElementById('pacingStatsV2901').innerHTML").includes('暂停记录'));
f.c.confirm=()=>false;a.equal(run('statsClearV2901()'),false);f.c.confirm=()=>true;a(run('statsClearV2901()'));a.deepEqual(j('statsLoadV2901().realms'),{});
const p=run('JSON.stringify(player)');run('resetRuntimeState()');a.equal(run('STAT_RT_V2901.fight'),null);a.equal(run("document.getElementById('pacingStatsV2901')"),null);
console.log('PASS malformed storage normalization, quota retry, CSV BOM, optional UI entry, clear confirmation and lifecycle cleanup');
// Enabling statistics must not consume RNG or alter real combat payouts/state.
function combatProbe(enabled){
 const g=require('./v2858-dom-fixture.cjs')(root);g.c.console.log=()=>{};for(const file of files)g.load(file);
 g.run(`resetRuntimeState();player=createDefaultPlayer();player.name='实战统计';player.level=4;player.gold=1000;player.exp=0;player.hp=getMaxHp();gameState='exploring';closeWorldOverlay();document.getElementById('gameScreen').classList.remove('hidden');document.getElementById('startScreen').classList.add('hidden');statsSetEnabledV2901(${enabled});let probeSeed=73;Math.random=()=>{probeSeed=(probeSeed*1664525+1013904223)>>>0;return probeSeed/4294967296;};startCombat({name:'统计对照敌人',hp:20,maxHp:20,atk:2,def:1,gold:30,exp:20,_realmLevel:4,_realmPhase:0,_isTaskBattle:true});currentEnemy.hp=0;checkBattleEnd();`);
 return {state:JSON.parse(g.run('JSON.stringify({gold:player.gold,exp:player.exp,hp:player.hp,seed:probeSeed,mode:gameState,inventory:player.inventory,materials:player.materials})')),income:g.run('statsLoadV2901().realms[4]?.goldIn.combat||0')};
}
const disabled=combatProbe(false),enabled=combatProbe(true);a.deepEqual(enabled.state,disabled.state,'same real victory, payout and RNG with recorder on/off');a(enabled.income>0,'real combat payout attributed to combat');
console.log('PASS real victory with recorder on/off: identical rewards, resources and RNG, combat attribution recorded');
