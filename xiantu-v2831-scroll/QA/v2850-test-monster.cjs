'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),fixture=require('./v2850-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||'release-v2850/xiantu-v2831-scroll';
const {createHandler,validState}=require(path.resolve(root,'../tencent-jev-function/index.js'));
const token='test_monster_access_not_a_real_key',origin='https://example.test';
const env={JEV_API_KEY:'test_key',JEV_ACCESS_TOKEN:token,JEV_ALLOWED_ORIGINS:origin};
const sample={task:'monster',version:1,round:1,phase:1,enemyHp:60,enemyMp:100,playerHp:70,playerMp:60,playerGuard:false,enemyWeakened:false,spellPower:0,available:['attack','heavy','guard']};
const response=(state,choice='heavy',confidence=.9)=>({answers:{monster:{type:'choice',choice,confidence,probabilities:Object.fromEntries(state.available.map(k=>[k,k===choice?1:0]))}}});
const event=body=>({httpMethod:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Xiantu-Access':token},body:JSON.stringify(body)});
function game(name='野狼',boss=false){
 const f=fixture(root);f.c.AbortController=AbortController;f.storage.set('xiantu_battle_presentation_v2756','report');
 for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
 f.run('startGame();closeWorldOverlay();');
 f.run(`startCombat({name:${JSON.stringify(name)},hp:50000,maxHp:50000,atk:2,def:2,gold:1,exp:1},${boss});player.hp=getMaxHp();player.mp=getMaxMp();`);
 f.timers.clear();return f;
}
const run=f=>f.run('isPlayerTurn=false;enemyTurn()');
const mp=f=>f.run('monsterStateV2844().mp');
const round=f=>f.run('monsterStateV2844().round');
function enable(f){f.run('setJevRememberV2845(false)');f.ids.get('monsterAccessV2844').value=token;f.run('enableMonsterJevV2844()');}
const reply=(choice,confidence=.9)=>({ok:true,status:200,json:async()=>({source:'jev',task:'monster',choice,confidence})});
const tick=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
(async()=>{
 let upstream=0,seen;
 const h=createHandler({env,call:async b=>{upstream++;seen=b;return response(b.state)}});
 const r=await h(event({...sample,playerName:'DO_NOT_FORWARD',prompt:'IGNORE_ALL_RULES'}));
 a.equal(r.statusCode,200);a.equal(JSON.parse(r.body).task,'monster');a.equal(JSON.parse(r.body).choice,'heavy');
 a.equal(seen.model,'jev-latest');a.deepEqual(Object.keys(seen.questions.monster.criteria),sample.available);
 a(!JSON.stringify(seen).includes('DO_NOT_FORWARD'));a(!JSON.stringify(seen).includes('IGNORE_ALL_RULES'));
 for(const patch of [{task:'unknown'},{available:['attack','__proto__']},{enemyMp:0},{round:-1},{playerHp:101},{enemyHp:'60'},{playerGuard:'true'},{spellPower:Infinity},{available:['attack','heavy','heavy']},{available:['attack','heal'],enemyHp:100},{available:['attack','recover'],enemyMp:100}]) {
  a.throws(()=>validState({...sample,...patch}));
 }
 const bad=createHandler({env,call:async()=>response({available:['attack','heal']},'heal')});
 a.equal((await bad(event(sample))).statusCode,502,'provider cannot invent unavailable healing');
 a.equal(upstream,1);
 console.log('PASS monster endpoint whitelist, dynamic allowed choices, strict bounds, rejected unavailable moves');
 // Local actions use real enemy resolver and a single scheduled hit.
 const f=game();a.equal(f.run('MONSTER_JEV_V2844.enabled'),false);
 const before=f.run('player.hp');run(f);a.equal(mp(f),82);a.equal(round(f),1);run(f);a.equal(mp(f),82);a.equal(round(f),1);
 f.flush(150);a.equal(f.run('isPlayerTurn'),true);a(f.run('player.hp')<before);a.equal(f.run('monsterStateV2844().locked'),false);
 a(!f.run('monsterAvailableV2844().includes("heavy")'));
 f.run('monsterStateV2844().mp=0;player.hp=getMaxHp()');run(f);a.equal(mp(f),22);a.equal(f.run('isPlayerTurn'),true);a.equal(round(f),2);
 const frozen=game();frozen.run('skipEnemyTurn=true');run(frozen);a.equal(mp(frozen),100);a.equal(round(frozen),0);a.equal(frozen.run('isPlayerTurn'),true);
 frozen.run('currentEnemy._pressureStun=true');run(frozen);a.equal(mp(frozen),100);a.equal(round(frozen),0);
 f.run('monsterStateV2844().guard=true');a.equal(f.run('monsterGuardDamageV2844(100)'),70);a.equal(f.run('monsterGuardDamageV2844(100)'),100);
 const healer=game('血狐');healer.run('currentEnemy.hp=currentEnemy.maxHp*.3;monsterStateV2844().mp=100');
 let old=healer.run('currentEnemy.hp');run(healer);a.equal(healer.run('currentEnemy.hp'),old+Math.floor(healer.run('currentEnemy.maxHp')*.08));a.equal(mp(healer),72);
 healer.run('monsterStateV2844().round=5;monsterStateV2844().mp=100;commitMonsterActionV2844({choice:"heal",source:"local"})');
 healer.run('monsterStateV2844().round=10;monsterStateV2844().mp=100');a(!healer.run('monsterAvailableV2844().includes("heal")'));
 const phase=game('宗门试炼守将',true);phase.run('currentEnemy.phases=2;currentBossPhase=1');
 a.equal(phase.run('monsterSpellV2844().name'),'宗门剑阵');phase.run('currentBossPhase=2');a.equal(phase.run('monsterSpellV2844().name'),'破军斩');
 for(const patch of ['isTribulation=true','currentEnemy._isTutorial=true','currentEnemy.tournamentFight=true']){const x=game();x.run(patch+';initMonsterAiV2844()');a.equal(x.run('monsterEligibleV2844()'),false);}
 console.log('PASS real local turns, no double damage, mana/cooldown, freeze/stun, guard consumption, heal cap, boss phase skills');
 // Real client through actual server handler; simulated provider only.
 const remote=game();enable(remote);let sent=0;
 const integrated=createHandler({env,call:async b=>response(b.state,'guard')});
 remote.c.fetch=async(url,opt)=>{sent++;a.match(url,/\/api\/jev-forge$/);a.equal(opt.headers['X-Xiantu-Access'],token);const body=JSON.parse(opt.body);a.equal(body.task,'monster');a(!opt.body.includes(token));const result=await integrated({...event(body),headers:{...opt.headers,Origin:origin}});return {ok:result.statusCode===200,status:result.statusCode,json:async()=>JSON.parse(result.body)};};
 await run(remote);a.equal(mp(remote),90);a.equal(remote.run('monsterStateV2844().guard'),true);a.match(remote.ids.get('monsterAiSourceV2844').textContent,/Jev 决策/);a.equal(remote.run('isPlayerTurn'),true);
 a(!JSON.stringify([...remote.storage]).includes(token));a(!remote.run('JSON.stringify(player)').includes(token));
 run(remote);remote.flush(150);a.equal(sent,1,'nearby rounds do not call again');
 const cap=game();enable(cap);cap.run('monsterStateV2844().requests=3');let capCalls=0;cap.c.fetch=async()=>{capCalls++;return reply('guard')};await run(cap);a.equal(capCalls,1);a.equal(cap.run('monsterStateV2844().requests'),4);
 // Slow JSON body resolves to local action once, late success is ignored.
 const slow=game();enable(slow);let late;slow.c.fetch=async()=>({ok:true,json:()=>new Promise(r=>late=r)});
 const waiting=run(slow);await tick();slow.flush(1500);await waiting;a.equal(mp(slow),82);a.match(slow.run('monsterStateV2844().status'),/响应超时/);slow.flush(150);const hp=slow.run('player.hp');late({source:'jev',task:'monster',choice:'heavy',confidence:.99});await tick();slow.flush(150);a.equal(slow.run('player.hp'),hp);a.equal(mp(slow),82);a.equal(slow.run('FORGE_ADVICE_V2842.busy'),null);
 const unavailable=game();enable(unavailable);unavailable.c.fetch=async()=>reply('heal');await run(unavailable);unavailable.flush(150);a.equal(mp(unavailable),82);a.equal(unavailable.run('monsterStateV2844().heals'),0);
 const low=game();enable(low);low.c.fetch=async()=>reply('guard',.3);await run(low);low.flush(150);a.equal(mp(low),82);a.match(low.run('monsterStateV2844().status'),/把握不足/);
 // Old results cannot act after finish, player change, or a new encounter (even the same enemy object).
 for(const mutation of ["beginCombatFinishV2764('victory')","player={...player}","COMBAT_FINISH_V2764.token++;initMonsterAiV2844()"]){
  const stale=game();enable(stale);let done;stale.c.fetch=()=>new Promise(r=>done=r);const promise=run(stale);stale.run(mutation);const playerHp=stale.run('player.hp');done(reply('heavy'));await promise;stale.flush(150);a.equal(stale.run('player.hp'),playerHp);
 }
 const off=game();enable(off);off.c.fetch=()=>new Promise(()=>{});const pending=run(off);off.run('disableMonsterJevV2844()');await pending;off.flush(150);a.equal(mp(off),82);a.match(off.run('monsterStateV2844().status'),/已关闭/);a.equal(off.run('isPlayerTurn'),true);
 for(const x of [f,frozen,healer,phase,remote,cap,slow,unavailable,low,off])a.equal(x.errors.length,0,JSON.stringify(x.errors));
 const cinema=game();cinema.run('setBattlePresentationV2756("cinema")');
 run(cinema);cinema.flush(150);a.equal(cinema.run('isPlayerTurn'),true);a.equal(cinema.ids.get('monsterMpV2844').textContent,'82 / 100');
 a(cinema.ids.get('combatPanel').classList.contains('cinema-mode-v2756'));a(!cinema.ids.get('monsterAiV2844').hidden);a.equal(cinema.errors.length,0);
 console.log('PASS real client/server with mock Jev, bounded calls, no persistent credentials, timeout/low-confidence/unavailable fallback, stale battle rejection, disable while pending');
})().catch(e=>{console.error(e);process.exitCode=1});
