'use strict';
// Companion Jev waits are bounded; offline/timeout/error/late/stale answers fall back or are discarded. No real network.
const fs=require('node:fs'),a=require('node:assert/strict'),fixture=require('./v2858-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const fixtures=[],tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function game(){const f=fixture(root);fixtures.push(f);f.c.AbortController=AbortController;f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.storage.set('xiantu_battle_presentation_v2756','report');for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.run('startGame();closeWorldOverlay();');f.timers.clear();
 f.run(`player.romance.partner='suwanqing';player.companionV2849='suwanqing';startCombat({name:'野狼',hp:50000,maxHp:50000,atk:2,def:2,gold:5,exp:5});player.hp=Math.floor(getMaxHp()*.5);player.mp=getMaxMp();isPlayerTurn=false;setCompanionCloudV2849(true);FORGE_ADVICE_V2842.access='synthetic_test_access_code';FORGE_ADVICE_V2842.nextAt=0;`);f.timers.clear();f.calls=0;return f;}
const guardAnswer=f=>({ok:true,status:200,json:async()=>({source:'jev',task:'ally',choice:'o'+f.run('companionActionsV2849(companionBattleV2849()).findIndex(o=>o.a===2)'),confidence:.95})});
(async()=>{
 a.equal(game().run('COMPANION_JEV_WAIT_V2868113'),1500);
 // Valid in-time answer is kept.
 const ok=game();ok.c.fetch=async()=>{ok.calls++;return guardAnswer(ok);};let nexted=0;await ok.run('runCompanionTurnV2849')(()=>nexted++);
 a.equal(ok.calls,1);a.equal(nexted,1);a.equal(ok.run('companionBattleV2849().guard'),true);a.match(ok.run('companionBattleV2849().status'),/天机推演 · 护卫/);
 // Offline: no request, no rate-limit reservation, local strategy immediately.
 const off=game();off.c.navigator.onLine=false;off.c.fetch=async()=>{off.calls++;return guardAnswer(off);};nexted=0;await off.run('runCompanionTurnV2849')(()=>nexted++);
 a.equal(off.calls,0);a.equal(nexted,1);a.equal(off.run('FORGE_ADVICE_V2842.nextAt'),0);a.match(off.run('companionBattleV2849().status'),/本地策略/);
 // Timeout: request never answers; turn continues at the bound with local strategy, and a late answer changes nothing.
 const slow=game();let late;slow.c.fetch=(url,o)=>{slow.calls++;return new Promise(r=>{late=r;});};nexted=0;const waiting=slow.run('runCompanionTurnV2849')(()=>nexted++);await tick();a.equal(nexted,0);
 slow.flush(1500);await waiting;a.equal(nexted,1);a.match(slow.run('companionBattleV2849().status'),/本地策略/);const after=slow.run('JSON.stringify([companionBattleV2849().mp,companionBattleV2849().guard,player.hp,currentEnemy.hp])');
 late(guardAnswer(slow));await tick();a.equal(slow.run('JSON.stringify([companionBattleV2849().mp,companionBattleV2849().guard,player.hp,currentEnemy.hp])'),after);a.equal(nexted,1);
 // Hard ceiling covers a decision path that stalls outside the request race.
 const stall=game();stall.run('jevDecideV2846=()=>new Promise(()=>{})');nexted=0;const stalled=stall.run('runCompanionTurnV2849')(()=>nexted++);await tick();stall.flush(1750);await stalled;a.equal(nexted,1);a.match(stall.run('companionBattleV2849().status'),/本地策略/);
 // Network/HTTP errors fall back locally.
 for(const failure of [()=>Promise.reject(Error('offline')),async()=>({ok:false,status:503,json:async()=>({})}),async()=>({ok:true,status:200,json:async()=>({source:'jev',task:'ally',choice:'o99',confidence:.9})})]){const e=game();e.c.fetch=failure;nexted=0;await e.run('runCompanionTurnV2849')(()=>nexted++);a.equal(nexted,1);a.match(e.run('companionBattleV2849().status'),/本地策略/);}
 // Stale: battle state changed while waiting, the in-flight answer is discarded and no support action is applied.
 const stale=game();let resolve;stale.c.fetch=()=>new Promise(r=>{resolve=r;});nexted=0;const before=stale.run('companionBattleV2849().mp');const pending=stale.run('runCompanionTurnV2849')(()=>nexted++);await tick();stale.run('player.hp-=1');resolve(guardAnswer(stale));await pending;
 a.equal(stale.run('companionBattleV2849().guard'),false);a.equal(stale.run('companionBattleV2849().mp'),before);a.equal(nexted,1);
 // Battle ended while waiting: neither the action nor the enemy turn runs.
 const ended=game();ended.c.fetch=()=>new Promise(()=>{});nexted=0;const hp=ended.run('player.hp');const gone=ended.run('runCompanionTurnV2849')(()=>nexted++);await tick();ended.run('beginCombatFinishV2764("flee")');await gone;a.equal(nexted,0);a.equal(ended.run('player.hp'),hp);
 // An exception in the support path never stalls the enemy turn and releases the lock.
 const broken=game();broken.run('jevWireStateV2846=()=>{throw Error("synthetic")}');nexted=0;await broken.run('runCompanionTurnV2849')(()=>nexted++);a.equal(nexted,1);a.equal(broken.run('companionBattleV2849().locked'),false);
 for(const f of fixtures)a.equal(f.errors.length,0,JSON.stringify(f.errors));
 console.log('PASS companion Jev wait bound, offline/timeout/error/ceiling local fallback, late and stale answers discarded, valid in-time answer kept, exception never stalls the enemy turn');
})().catch(e=>{console.error(e);process.exitCode=1});
