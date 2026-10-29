'use strict';
// Exercise the actual attempt/animation/recovery path with isolated saves. DAO
// planning is a small deterministic probe here; its gameplay tables have their own suite.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.Math=Object.create(Math);f.c.console.log=()=>{};f.c.console.warn=()=>{};f.c.confirm=()=>true;
f.c.Image.prototype.removeAttribute=function(){};f.El.prototype.removeAttribute=function(k){delete this.attributes[k];};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`)),save=f.c.saveGame;
const realDao={plan:f.c.planDaoBreakthroughV2905,validate:f.c.validateDaoPlanV286883,apply:f.c.applyDaoBreakthroughV2905};
run(`globalThis.txShown=[];globalThis.txDraws=0;
 showBreakthroughSuccess=r=>txShown.push({ok:true,id:r.attemptIdV2905});
 showBreakthroughFailure=r=>txShown.push({ok:false,id:r.attemptIdV2905});
 planDaoBreakthroughV2905=(r,ok)=>({v:999,ok,roll:Math.random()});
 validateDaoPlanV286883=p=>p&&p.v===999?p:null;
 applyDaoBreakthroughV2905=(r,ok)=>{if(r.daoV2905)player.txDaoApplications=(player.txDaoApplications||0)+1;};`);
function fresh(extra=''){
 f.c.saveGame=save;run(`resetRuntimeState();player=createDefaultPlayer();initAchievements();gameState='exploring';COMBAT_FINISH_V2764.settling=false;miniSaveDeferredV286840=false;
 player.level=2;player.phase=3;player.name='突破事务';player.inventory=['破障丹'];player.breakthrough={isAnimating:false,cooldownDays:0,pillV28683:'破障丹'};
 player.exp=getCurrentExpNeed();player.hp=getMaxHp();txShown=[];txDraws=0;Math.random=()=>{txDraws++;return 0;};${extra}`);f.timers.clear();
}
// If the attempt cannot be persisted, neither consumption nor animation survives.
fresh();const original=run('JSON.stringify(player)'),owner=run('player');f.c.saveGame=()=>false;
a.equal(run('triggerBreakthrough(false)'),false);a.equal(run('JSON.stringify(player)'),original);a.equal(run('player'),owner);a.equal(run('breakthroughRunV2781'),null);a.equal(run('txShown.length'),0);

// Once the pending attempt is durable, a failed result commit restores the exact
// pending state and achievements. Retrying uses its locked outcome and RNG plan.
fresh();run('triggerBreakthrough(false)');a.equal(run('player.inventory.length'),0);
const disk=f.storage.get('xiantu_save'),pending=json('player.breakthrough.pendingV28683'),draws=run('txDraws'),ach=run('JSON.stringify([achievementProgress,[...completedAchievements]])');
run('globalThis.oldRun=breakthroughRunV2781;globalThis.oldResult=breakthroughRunV2781.result;');
f.c.saveGame=()=>run('miniSaveDeferredV286840')?true:false;
run('settleBreakthroughV2781(oldRun.success,oldResult)');
a.equal(run('player.level'),2);a.equal(run('player.phase'),3);a.deepEqual(json('player.breakthrough.pendingV28683'),pending);a.equal(run('player.breakthrough.isAnimating'),false);
a.equal(run('JSON.stringify([achievementProgress,[...completedAchievements]])'),ach);a.equal(run('player.txDaoApplications||0'),0);a.equal(run('txShown.length'),0);a.equal(f.storage.get('xiantu_save'),disk);
f.c.saveGame=save;run('Math.random=()=>{throw Error("recovery must not redraw")};');
a.equal(run('recoverPendingBreakthroughV28683()'),true);a.equal(run('player.level'),3);a.equal(run('player.phase'),0);a.equal(run('player.txDaoApplications'),1);a.equal(run('txShown.length'),1);a.equal(run('txDraws'),draws);
const settled=run('JSON.stringify(player)'),settledAchievements=run('JSON.stringify([achievementProgress,[...completedAchievements]])');
a.equal(run('recoverPendingBreakthroughV28683()'),false);run('settleBreakthroughV2781(oldRun.success,oldResult);applyBreakthroughSuccess(oldResult)');
a.equal(run('JSON.stringify(player)'),settled);a.equal(run('JSON.stringify([achievementProgress,[...completedAchievements]])'),settledAchievements);a.equal(run('txShown.length'),1);

// A refresh restores the same unsuccessful branch and cooldown, even while the
// load setup suppresses ordinary saves. The recovery still performs a real write.
fresh('Math.random=()=>{txDraws++;return .9999;}');run('triggerBreakthrough(false)');
const failPending=json('player.breakthrough.pendingV28683');
run('resetRuntimeState();player=normalizePlayer(JSON.parse(localStorage.getItem(SAVE_KEY)).player);miniSaveDeferredV286840=true;Math.random=()=>{throw Error("reload must not redraw")};');
const failDraws=run('txDraws');
let writes=0;const set=f.c.localStorage.setItem;f.c.localStorage.setItem=(key,value)=>{if(key==='xiantu_save')writes++;return set(key,value);};
a.equal(run('recoverPendingBreakthroughV28683()'),true);f.c.localStorage.setItem=set;
a.equal(writes,1);a.equal(run('miniSaveDeferredV286840'),true);a.equal(run('player.level'),2);a.equal(run('player.breakthrough.cooldownDays'),failPending.result.cooldownDaysV2905);a.equal(run('player.breakthrough.protectionV28683.failures'),1);a.equal(run('player.txDaoApplications'),1);a.equal(run('txDraws'),failDraws);a.equal(run('txShown.length'),1);

// An old pending attempt gets a durable cooldown/identity, without gaining the
// newly introduced quality or failure mechanism after upgrading the client.
fresh();run(`player.inventory=[];player.breakthrough.pendingV28683={key:'2:3',success:false,result:{snapshot:createBreakthroughSnapshot(),expNeed:getCurrentExpNeed(),rate:.5}};`);
a.equal(run('recoverPendingBreakthroughV28683()'),true);a.equal(run('player.txDaoApplications||0'),0);a.equal(run('player.breakthrough.protectionV28683.failures'),1);a.equal(run('txShown.length'),1);

// Real quota errors preserve the on-disk attempt and allow retrying the whole
// settlement; unlocked achievements and their rewards never escape a failed save.
fresh();run('triggerBreakthrough(false)');const beforeQuota=f.storage.get('xiantu_save');
const originalSet=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};run('settleBreakthroughV2781(breakthroughRunV2781.success,breakthroughRunV2781.result)');f.c.localStorage.setItem=originalSet;
a.equal(f.storage.get('xiantu_save'),beforeQuota);a.equal(run('player.level'),2);a.equal(run('txShown.length'),0);a.equal(run('player.txDaoApplications||0'),0);
a.equal(run('recoverPendingBreakthroughV28683()'),true);a.equal(run('player.level'),3);a.equal(run('player.txDaoApplications'),1);

// Reset cancels old animation callbacks; changing characters cannot advance the
// replacement, and combat/start/settlement states cannot begin a new attempt.
fresh();run('triggerBreakthrough(false);globalThis.stale=breakthroughRunV2781;resetRuntimeState();player=createDefaultPlayer();');const replacement=run('JSON.stringify(player)');
run('settleBreakthroughV2781(stale.success,stale.result)');a.equal(run('JSON.stringify(player)'),replacement);a.equal(run('breakthroughRunV2781'),null);a.equal(f.timers.has(run('stale.timer')),false);
for(const state of ['start','combat','combat-ending','pets']){fresh(`gameState=${JSON.stringify(state)}`);const raw=run('JSON.stringify(player)');run('triggerBreakthrough(true)');a.equal(run('JSON.stringify(player)'),raw);}
fresh('COMBAT_FINISH_V2764.settling=true');const busy=run('JSON.stringify(player)');run('triggerBreakthrough(true)');a.equal(run('JSON.stringify(player)'),busy);

// The ascension result is a display/commit of the already earned realm. It must
// neither advance again nor invoke the new random quality mechanism.
fresh(`player.level=10;player.phase=0;player.inventory=[];player.breakthrough={cooldownDays:0};Math.random=()=>{throw Error('forced ascension must not roll quality')};`);
a.equal(run('playForcedAscensionBreakthrough({name:"渡劫圆满",level:9,phase:3,atk:1,def:1,hp:1,lifespan:1,skills:[],unlockedRegions:[]})'),true);
run('settleBreakthroughV2781(true,breakthroughRunV2781.result)');a.equal(run('player.level'),10);a.equal(run('player.phase'),0);a.equal(run('player.txDaoApplications||0'),0);a.equal(run('txShown.length'),1);

// Repeat the transaction probes with the production quality/failure helpers.
// No test-only plan or multiplier participates in these persisted outcomes.
f.c.planDaoBreakthroughV2905=realDao.plan;f.c.validateDaoPlanV286883=realDao.validate;f.c.applyDaoBreakthroughV2905=realDao.apply;
fresh(`player.level=6;player.phase=3;player.inventory=[];player.breakthrough={cooldownDays:0};player.exp=getCurrentExpNeed();player.hp=getMaxHp();(()=>{let n=0;Math.random=()=>n++===0?0:.99999;})();`);
run('triggerBreakthrough(false)');a.equal(run('player.breakthrough.pendingV28683.result.daoV2905.kind'),'perfect');
const qualityPlan=json('player.breakthrough.pendingV28683.result.daoV2905');f.c.saveGame=()=>run('miniSaveDeferredV286840')?true:false;
run('settleBreakthroughV2781(true,breakthroughRunV2781.result)');a.equal(run('player.level'),6);a.deepEqual(json('player.breakthrough.pendingV28683.result.daoV2905'),qualityPlan);a.equal(run('Object.keys(daoStateV286883().awards).length'),0);
f.c.saveGame=save;run('Math.random=()=>{throw Error("production quality must stay locked")};');a.equal(run('recoverPendingBreakthroughV28683()'),true);
a.equal(run('player.level'),7);a.equal(run('daoStateV286883().awards["6:3"]'),'perfect');a.equal(run('Object.keys(daoStateV286883().awards).length'),1);a.equal(run('recoverPendingBreakthroughV28683()'),false);
fresh(`player.level=6;player.phase=3;player.inventory=[];player.breakthrough={cooldownDays:0};player.exp=getCurrentExpNeed();player.hp=getMaxHp();(()=>{const values=[.99999,.5,.885];Math.random=()=>values.shift()??.5;})();`);
run('triggerBreakthrough(false)');a.equal(run('player.breakthrough.pendingV28683.result.daoV2905.kind'),'severe');
const severePlan=json('player.breakthrough.pendingV28683.result.daoV2905');
run('resetRuntimeState();player=normalizePlayer(JSON.parse(localStorage.getItem(SAVE_KEY)).player);Math.random=()=>{throw Error("production failure must stay locked")};');
a.deepEqual(json('player.breakthrough.pendingV28683.result.daoV2905'),severePlan);a.equal(run('recoverPendingBreakthroughV28683()'),true);
a.equal(run('player.phase'),2);a.deepEqual(json('daoStateV286883().heldProtection'),{key:'6:3',failures:1});a.equal(run('player.exp'),0);
run(`player.exp=getCurrentExpNeed();player.breakthrough.cooldownDays=0;Math.random=()=>0;triggerBreakthrough(true);`);
a.equal(run('player.phase'),3);a.equal(run('player.breakthrough.protectionV28683.key'),'6:3');a.equal(run('player.breakthrough.protectionV28683.failures'),1);a.equal(run('daoFailOddsV286883().severe'),0);
const ledger=run('JSON.stringify(daoStateV286883().awards)');
run(`player.phase=2;player.exp=getCurrentExpNeed();player.breakthrough.cooldownDays=0;triggerBreakthrough(true);`);
a.equal(run('JSON.stringify(daoStateV286883().awards)'),ledger,'retraining a previously awarded phase never duplicates quality rewards');

// Pill selection and recovery days are also persistent actions. Rolling back the
// latter restores elapsed time, status durations and any time-triggered rewards.
fresh();const beforeSelection=run('JSON.stringify(player)');f.c.saveGame=()=>run('miniSaveDeferredV286840')?true:false;
a.equal(run('selectBreakthroughPillV28683(null)'),false);a.equal(run('JSON.stringify(player)'),beforeSelection);
f.c.saveGame=save;a.equal(run('selectBreakthroughPillV28683(null)'),true);a.equal(run('player.breakthrough.pillV28683'),null);
fresh(`player.breakthrough.cooldownDays=30;player.statusEffects=[{...STATUS_TEMPLATES['经脉暗伤'],remainingDays:60}];`);
const beforeRest=run('JSON.stringify(player)'),day=run('player.worldTime.totalDays');f.c.saveGame=()=>run('miniSaveDeferredV286840')?true:false;
a.equal(run('restBreakthroughV2798(30)'),false);a.equal(run('JSON.stringify(player)'),beforeRest);
f.c.saveGame=save;a.equal(run('restBreakthroughV2798(30)'),true);a.equal(run('player.worldTime.totalDays'),day+30);a.equal(run('player.breakthrough.cooldownDays'),0);a.equal(run('player.statusEffects.find(e=>e.id==="jingmai").remainingDays'),30,'cooldown recovery does not prematurely cure a 60-day injury');

// A mismatched snapshot may not borrow another realm's quality award. Malformed
// forced flags likewise cannot bypass the real 9:3 -> 10:0 ascension contract.
fresh(`player.level=6;player.phase=3;player.breakthrough.pendingV28683={key:'6:3',success:true,result:{snapshot:{level:7,phase:3},attemptIdV2905:'wrong',daoV2905:{v:1,kind:'perfect',fromLevel:7,fromPhase:3}}};`);
a.equal(run('recoverPendingBreakthroughV28683()'),false);a.equal(run('player.level'),6);a.equal(run('player.breakthrough.pendingV28683'),null);a.equal(run('Object.keys(daoStateV286883().awards).length'),0);a.equal(run('txShown.length'),0);
fresh(`player.breakthrough.pendingV28683={key:'2:3',success:true,result:{snapshot:{level:2,phase:3},attemptIdV2905:'wrong-force',forced:true,noAdvance:true}};`);
a.equal(run('recoverPendingBreakthroughV28683()'),false);a.equal(run('player.level'),2);a.equal(run('txShown.length'),0);

// The existing combat exit callback has already released its busy guard before
// it launches the earned ascension animation.
fresh(`player.level=10;player.phase=0;player.inventory=[];player.breakthrough={cooldownDays:0};`);
run(`beginCombatFinishV2764('victory',{skipReturn:true,afterReturn:()=>playForcedAscensionBreakthrough({name:'渡劫圆满',level:9,phase:3,skills:[],unlockedRegions:[]})});completeCombatFinishV2764(COMBAT_FINISH_V2764.pending.token);`);
a.equal(run('gameState'),'exploring');a.equal(run('COMBAT_FINISH_V2764.settling'),false);f.flush(380);a.equal(run('!!breakthroughRunV2781'),true);a.equal(run('player.breakthrough.pendingV28683.result.ascension'),true);
run('settleBreakthroughV2781(true,breakthroughRunV2781.result)');a.equal(run('player.level'),10);a.equal(run('Object.keys(daoStateV286883().awards).length'),0);

// Completing a real realm-gated main quest schedules its successor. A failed
// settlement must cancel that delayed acceptance as well as restore the rewards.
fresh(`player.level=1;player.phase=2;player.inventory=[];player.breakthrough={cooldownDays:0};player.exp=getCurrentExpNeed();player.tasks.completed=['main_01','main_02','main_03','main_04'];player.tasks.active.main_05={...createTaskInstance(getTaskData('main_05')),currentStep:1};`);
run('triggerBreakthrough(false)');const questPending=run('JSON.stringify(player)');f.c.saveGame=()=>run('miniSaveDeferredV286840')?true:false;
run('settleBreakthroughV2781(true,breakthroughRunV2781.result)');a.equal(run('JSON.stringify({...player,breakthrough:{...player.breakthrough,isAnimating:true}})'),questPending);f.flush(400);
a.equal(run('!!player.tasks.active.main_06'),false);a.equal(run('player.tasks.completed.includes("main_05")'),false);
f.c.saveGame=save;a.equal(run('recoverPendingBreakthroughV28683()'),true);a.equal(run('player.tasks.completed.includes("main_05")'),true);const questStats=json('[player.maxHp,player.baseAtk,player.baseDef]');f.flush(400);
a.equal(run('!!player.tasks.active.main_06'),true);a.equal(run('recoverPendingBreakthroughV28683()'),false);a.deepEqual(json('[player.maxHp,player.baseAtk,player.baseDef]'),questStats);
console.log('PASS breakthrough attempt/result atomic saves, locked RNG and legacy recovery, quota rollback, one-time achievements, busy/stale/reset guards and unchanged forced ascension');
