'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.c.console.warn=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`)),save=f.c.saveGame,setItem=f.c.localStorage.setItem;
function fresh(setup=''){
 f.c.saveGame=save;f.c.localStorage.setItem=setItem;f.c.confirm=()=>true;
 run(`resetRuntimeState();player=createDefaultPlayer();initAchievements();completedAchievements=new Set(Object.keys(ACHIEVEMENTS));player.name='道伤回归';player.level=3;player.exp=0;player.hp=getMaxHp();player.mp=getMaxMp();player.worldTime.totalDays=0;player.age=18;gameState='exploring';COMBAT_FINISH_V2764.settling=false;lastItemUseV2768=-1e9;closeWorldOverlay();${setup}`);
 f.timers.clear();
}
const injury="player.statusEffects=[{id:'daoshangV286883',name:'道心受损',remainingDays:60}]";
const meridians="player.inventory=Array(10).fill('玄玉护脉丹');player.statusEffects=[{id:'jingmai',name:'经脉暗伤',remainingDays:90},{id:'daoshangV286883',name:'道心受损',remainingDays:60}];player.breakthrough.cooldownDays=20";

// Real combat reward, with achievement and one-time rewards excluded from this probe.
for(const hurt of [false,true]){
 fresh(hurt?injury:'');
 run("startCombat({name:'野狼',hp:100,maxHp:100,atk:1,def:0,gold:1,exp:100,_realmLevel:3,_realmPhase:0})");
 a.equal(run('battleExpV28683(currentEnemy)'),100);
 run('currentEnemy.hp=0;checkBattleEnd()');a.equal(run('player.exp'),hurt?80:100);
}
fresh(injury+";player.activeArtifact={type:'聚灵珠',level:1}");
a(Math.abs(run('getExpBonus()')-1.17*.8)<1e-12,'injury multiplies the complete existing bonus');
run('advanceGameTime(59)');a.equal(run('daoInjuryDaysV286883()'),1);a(run('getExpBonus()')<1);
run('advanceGameTime(1)');a.equal(run('daoInjuryDaysV286883()'),0);a(Math.abs(run('getExpBonus()')-1.17)<1e-12);
fresh(injury+";player.inventory=Array(6).fill('悟道丹')");const pill=run('ITEMS["悟道丹"].value');
run('useItem("悟道丹")');a.equal(run('player.exp'),pill);
a.equal(run('useItemBatchV2905("悟道丹",5)'),true);a.equal(run('player.exp'),pill*6,'fixed pill rewards are unchanged');
console.log('PASS real battle -20%, multiplicative artifact bonus, exact status expiry, unchanged single/batch pill exp');

// Independent day-by-day expectation catches both the old minimum-1 clamp and recovery after day 60.
for(const home of [false,true])for(const hurtDays of [0,1,60])for(const missing of [1,23,24,50,1750]){
 fresh(`player.exp=1750-${missing};player.statusEffects=${JSON.stringify(hurtDays?[{id:'daoshangV286883',remainingDays:hurtDays}]:[])};player.home={level:2,furniture:[{name:'聚灵阵',type:'exp',value:.1,active:true}]}`);
 const plan=json(`computeRetreatV2782(${home},10)`),normalRate=1750/3600*(home?run('1+calculateFurnitureBonus().exp'):1);
 let days=0,exp=0;while(days<3600&&Math.floor(exp+1e-8)<missing){days++;exp+=normalRate*(days<=hurtDays?.8:1);}
 a.equal(plan.days,days,`days: home=${home} injury=${hurtDays} missing=${missing}`);
 a.equal(plan.gain,Math.min(missing,Math.floor(exp+1e-8)),`gain: home=${home} injury=${hurtDays} missing=${missing}`);
}
fresh(injury);a.equal(run('computeRetreatV2782(false,1).gain'),169,'60 days do not penalize an entire year');
run('showRetreatV2782(false,1);executeRetreatV2782(retreatPlanV2782.id)');
a.equal(run('player.exp'),169);a.equal(run('player.worldTime.totalDays'),360);a.equal(run('daoInjuryDaysV286883()'),0);
fresh(injury+';player.exp=1727');run('showRetreatV2782(false,10);executeRetreatV2782(retreatPlanV2782.id)');
a.equal(run('player.worldTime.totalDays'),60);a.equal(run('player.exp'),1750);a.equal(run('daoInjuryDaysV286883()'),0);
fresh(injury);run('currentChoices=[{action:"cultivate"}];handleChoice(0)');
a.equal(run('player.exp'),130);a.equal(run('player.worldTime.totalDays'),360);a.equal(run('daoInjuryDaysV286883()'),0);
// Changing the injury after preview must not execute the old quote.
fresh();run('showRetreatV2782(false,1);globalThis.oldPlan=retreatPlanV2782.id;'+injury+';executeRetreatV2782(oldPlan)');
a.equal(run('player.exp'),0);a.equal(run('player.worldTime.totalDays'),0);a.notEqual(run('retreatPlanV2782.id'),run('oldPlan'));
console.log('PASS 30 independent retreat boundaries, timed recovery, exact bottleneck stop, legacy one-year cultivation and stale quote rejection');

// Cure and item consumption share the existing transaction. Full-HP bulk cure uses only one pill.
for(const action of ['useItem("玄玉护脉丹")','useItemBatchV2905("玄玉护脉丹",5)','useItemBatchV2905("玄玉护脉丹",10)','useItemBatchV2905("玄玉护脉丹","full")']){
 fresh(meridians);a.equal(run('pillBatchCountV2905("玄玉护脉丹",10)'),1);
 let writes=0;f.c.localStorage.setItem=(k,v)=>{if(k==='xiantu_save')writes++;return setItem(k,v);};
 run(action);f.c.localStorage.setItem=setItem;
 a.equal(writes,1);a.equal(run('player.inventory.length'),9);a.equal(run('hasStatusEffect("jingmai")'),false);
 a.equal(run('daoInjuryDaysV286883()'),60);a.equal(run('player.breakthrough.cooldownDays'),20);
 a.equal(JSON.parse(f.storage.get('xiantu_save')).player.statusEffects.some(e=>e.id==='jingmai'),false);
 a.equal(run('pillBatchCountV2905("玄玉护脉丹",10)'),0,'no repeat cure at full HP');
 for(const failure of ['false','throw','quota']){
  fresh(meridians+';saveGame()');const before=run('JSON.stringify(player)'),disk=f.storage.get('xiantu_save');
  if(failure==='quota')f.c.localStorage.setItem=()=>{throw Error('QuotaExceededError');};
  else f.c.saveGame=()=>{if(run('miniSaveDeferredV286840'))return true;if(failure==='throw')throw Error('save failed');return false;};
  run(action);a.equal(run('JSON.stringify(player)'),before,action+'/'+failure);a.equal(f.storage.get('xiantu_save'),disk);
 }
}
fresh(meridians+';player.hp=getMaxHp()-301');a.equal(run('pillBatchCountV2905("玄玉护脉丹",10)'),3);
run('useItemBatchV2905("玄玉护脉丹",10)');a.equal(run('player.inventory.length'),7);a.equal(run('player.hp'),run('getMaxHp()'));a.equal(run('hasStatusEffect("jingmai")'),false);
fresh(meridians);f.c.confirm=()=>false;let before=run('JSON.stringify(player)');a.equal(run('useItemBatchV2905("玄玉护脉丹",5)'),false);a.equal(run('JSON.stringify(player)'),before);
f.c.confirm=()=>{run('player=createDefaultPlayer()');return true;};a.equal(run('useItemBatchV2905("玄玉护脉丹",5)'),false);a.equal(run('player.inventory.length'),0);
fresh(meridians);f.c.confirm=()=>{run('player.inventory.pop()');return true;};a.equal(run('useItemBatchV2905("玄玉护脉丹",5)'),false);a.equal(run('hasStatusEffect("jingmai")'),true);a.equal(run('player.inventory.length'),9);
for(const state of ['start','combat','combat-ending','animating','settling']){
 fresh(meridians);run(state==='animating'?'player.breakthrough.isAnimating=true':state==='settling'?'COMBAT_FINISH_V2764.settling=true':`gameState=${JSON.stringify(state)}`);
 before=run('JSON.stringify(player)');run('useItem("玄玉护脉丹");useItemBatchV2905("玄玉护脉丹",5)');a.equal(run('JSON.stringify(player)'),before);
}
console.log('PASS full-HP cure consumes one pill, injury/cooldown separation, one-save commit, false/throw/quota rollback, healing cap, cancel/stale owner/state guards');

// Both real battle medicine paths cure the same injury, without writing temporary battle state.
for(const automatic of [false,true]){
 fresh(meridians+(automatic?';player.hp=1;player.fieldAidV2870={heal:true}':''));
 run("startCombat({name:'野狼',hp:1000,maxHp:1000,atk:1,def:0,gold:1,exp:1,_realmLevel:3,_realmPhase:0},false,false,{})");
 if(!automatic){
  run('isPlayerTurn=true;toggleCombatMedicineDrawer(true)');
  a.equal(run('combatMedicineAvailabilityV2856("玄玉护脉丹").gain'),0);
  a.equal(run('combatMedicineAvailabilityV2856("玄玉护脉丹").curesMeridians'),true);
  a.match(f.ids.get('combatItemDrawer').innerHTML,/清除经脉暗伤/);
  run('useCombatBagItem("玄玉护脉丹")');a.equal(run('isPlayerTurn'),false,'cure still spends the turn');
  run('useCombatBagItem("玄玉护脉丹")');
 }
 a.equal(run('player.inventory.length'),9);a.equal(run('hasStatusEffect("jingmai")'),false);a.equal(run('daoInjuryDaysV286883()'),60);
 a.equal(run('player.breakthrough.cooldownDays'),20);
 run('saveGame()');const checkpoint=JSON.parse(f.storage.get('xiantu_save'));
 a.equal(checkpoint.interruptedBattleV286812,true);a.equal(checkpoint.player.inventory.length,10);
 a.equal(checkpoint.player.statusEffects.some(e=>e.id==='jingmai'),true,'reload restores both injury and consumed medicine');
}
fresh(meridians+";player.hp=1;player.fieldAidV2870={heal:true};player.inventory.push('小还丹')");
run("startCombat({name:'野狼',hp:1000,maxHp:1000,atk:1,def:0,gold:1,exp:1},false,false,{})");
a.equal(run('hasStatusEffect("jingmai")'),true);a.equal(run('player.inventory.filter(n=>n==="玄玉护脉丹").length'),10,'normal emergency heal retains its cheapest-pill choice');
console.log('PASS manual combat and emergency cure, turn consumption, unchanged cheapest-heal choice and interrupted-battle checkpoint integrity');
