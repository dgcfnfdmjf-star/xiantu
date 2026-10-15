'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay()');f.timers.clear();const run=s=>f.run(s);
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();player.sect='凌霄宗';player.sectTotalContribution=600;player.level=4;player.phase=0;player.gold=10000;gameState='exploring';player.hp=getMaxHp();player.mp=getMaxMp();window.target=Object.keys(DEMON_FACTION_POWER)[0];player.warState.alliedSects=Object.keys(HUMAN_FACTION_POWER).filter(n=>n!==player.sect);discipleRosterV2815().members=[0,1,2,3].map((n)=>({id:n+1,name:'弟子'+n,level:6,specialty:0,job:null,traitsV2867:{aptitude:0,personality:n%3,loyalty:60}}))");f.timers.clear();}
function enter(){run('executeWar(target);window.cid=warCampaignV2839().id');}
function command(){run('chooseWarTacticV2775(warCampaignV2839().reports[warCampaignV2839().step],warCampaignV2839().step);commandWarStageV2839(cid,warCampaignV2839().step)');}
function finalDuel(){enter();command();command();run('chooseWarTacticV2775(0,2);startWarDuelV2839(cid,2)');a.equal(run('gameState'),'combat');}
function leave(){run('completeCombatFinishV2764()');f.flush(380);a.equal(run('gameState'),'exploring');}
function quotaOn(){run('window.oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("quota")}');}
function quotaOff(){run('localStorage.setItem=oldSet');}
// Reward snapshot covers all realm indices, old saves and post-departure growth.
fresh();enter();a.equal(run('warRewardScaleV286841(warCampaignV2839())'),1.8);run('player.level=16');a.equal(run('warRewardScaleV286841(warCampaignV2839())'),1.8);
for(let n=0;n<17;n++){a(run(`warRewardScaleV286841({rulesV286841:1,realm:${n}})>=1`));if(n)a(run(`warRewardScaleV286841({rulesV286841:1,realm:${n}})>=warRewardScaleV286841({rulesV286841:1,realm:${n-1}})`));}
a.equal(run('warRewardScaleV286841({rulesV286841:1,realm:16})'),10);a.equal(run('warRewardScaleV286841({realm:16})'),1);
run('delete warCampaignV2839().rulesV286841;saveGame();player=normalizePlayer(loadGame().player)');a.equal(run('warRewardScaleV286841(warCampaignV2839())'),1);
// Actual payout: fixed total victory and30 kills; currency scaling excludes merit/contribution.
fresh();run('player.level=16');enter();command();command();command();run('warCampaignV2839().killRoll=1/3;warCampaignV2839().our=warCampaignV2839().foe*10;settleWarV2775(target)');
a.equal(run('player.warState.history.at(-1).rewards.gold'),31200);a.equal(run('player.warState.history.at(-1).rewards.exp'),19500);a.equal(run('player.warState.history.at(-1).rewards.contribution'),338);a.equal(run('player.warState.history.at(-1).rewards.merit'),100);
// Real selection locks dispatch, train, trails and pre-existing batch confirmations.
fresh();enter();run('showDiscipleBatchV2866();window.batchToken=discipleBatchV2866.token');a.equal(run('assignWarOfficerV286841(cid,0,1)'),true);a.equal(run('assignWarOfficerV286841(cid,1,2)'),false);
run('assignDiscipleV2815(1,0,0);assignDiscipleV2815(1,"train");confirmDiscipleBatchV2866(batchToken)');a.equal(run('sectMembersReadV2868()[0].job'),null);
run('sectMembersReadV2868()[0].lifeV2868={trail:{state:"ready"}};closeWarPanelV2839();showDiscipleLifeV2868(1);startDiscipleTrailV2868(1)');a.equal(run('sectMembersReadV2868()[0].job'),null);
run('showDiscipleBatchV2866()');a.equal(run('discipleBatchV2866.entries.length'),3);a.equal(run('discipleBatchV2866.entries.some(e=>e.id===1)'),false);
run('sectMembersReadV2868()[1].job={type:"train",end:99}');a.equal(run('assignWarOfficerV286841(cid,0,2)'),false);
run('chooseWarTacticV2775(0,0);commandWarStageV2839(cid,0)');a.equal(run('assignWarOfficerV286841(cid,1,1)'),false);a.equal(run('lifeReadV2868(sectMembersReadV2868()[0]).counts.war_stage'),1);
run('commandWarStageV2839(cid,0)');a.equal(run('lifeReadV2868(sectMembersReadV2868()[0]).counts.war_stage'),1);
run('saveGame();player=normalizePlayer(loadGame().player)');a.equal(run('warDiscipleBusyV286841(1)'),true);run('retreatWarV2775()');a.equal(run('warDiscipleBusyV286841(1)'),false);
// Traits apply through stage resolution, counters persist and prosperity above100 is preserved.
fresh();enter();run('assignWarOfficerV286841(cid,0,1);warCampaignV2839().morale=0;warCampaignV2839().rolls[0]=.999;chooseWarTacticV2775(0,0);commandWarStageV2839(cid,0)');a(run('warFactorV286841(warCampaignV2839())>=1'));
run('assignWarOfficerV286841(cid,1,2);warCampaignV2839().reports[1]=2;warCampaignV2839().rolls[1]=0;chooseWarTacticV2775(2,1);window.score=warCampaignV2839().score;commandWarStageV2839(cid,1)');a.equal(run('warCampaignV2839().score-score'),4);a.equal(run('lifeReadV2868(sectMembersReadV2868()[1]).counts.war_victory'),1);
run('lifeAddV2868(sectMembersReadV2868()[1],"war_victory");lifeAddV2868(sectMembersReadV2868()[1],"war_victory")');a.equal(run('lifeTitlesV2868(sectMembersReadV2868()[1]).includes("破魔先锋")'),true);
run('sectMembersReadV2868()[2].lifeV2868={counts:{rescue:3}};assignWarOfficerV286841(cid,2,3)');command();run('warCampaignV2839().our=1;player.sectData.prosperity=200;settleWarV2775(target)');a.equal(run('player.warState.history.at(-1).penalty'),125);a.equal(run('player.sectData.prosperity'),196);a.equal(run('warDiscipleBusyV286841(3)'),false);
a.equal(run('warMercyV286841({rulesV286841:1,officersV286841:[{personality:2},{personality:2}],records:[{stage:0},{stage:1}]})'),.5);
// Eighth action: victory wins, timeout at <=30% gives15%, failure consumes one try.
for(const outcome of ['win','held','failed']){
 fresh();finalDuel();run('currentEnemy._warV2839.turns=7;currentEnemy._warV2839.awaitingAction=true;isPlayerTurn=false');
 if(outcome==='win')run('currentEnemy.hp=0;checkBattleEnd()');else run(`currentEnemy.hp=currentEnemy.maxHp*${outcome==='held'?'.30':'.31'};enemyTurn()`);
 a.equal(run('gameState'),'combat-ending',outcome);a.equal(run('warCampaignV2839().commanderV286841'),outcome);
 a.equal(run('warCampaignV2839().step'),outcome==='failed'?2:3);a.equal(run('warCampaignV2839().personalWins'),outcome==='win'?1:0);a.equal(run('player.gold'),10000);
 run('finishWarDuelV2839(true)');a.equal(run('warCampaignV2839().commanderV286841'),outcome);leave();
 if(outcome==='failed'){run('startWarDuelV2839(cid,2)');a.equal(run('gameState'),'exploring');command();}
 const factor=run('warFactorV286841(warCampaignV2839())');if(outcome!=='failed'){run('warCampaignV2839().commanderV286841=null');a(Math.abs(factor/run('warFactorV286841(warCampaignV2839())')-(outcome==='win'?1.3:1.15))<1e-9);}
 run('settleWarV2775(target);window.paid=player.gold;settleWarV2775(target)');a.equal(run('player.gold'),run('paid'));a.equal(run('player.warState.history.length'),1);
}
// Real action hook and no double tick; old campaigns do not time out.
fresh();finalDuel();run('currentEnemy.hp=currentEnemy.maxHp=1e8;combat("attack")');f.flush(150);a.equal(run('currentEnemy._warV2839.awaitingAction'),true);run('warDuelLimitV286841();warDuelLimitV286841()');a.equal(run('currentEnemy._warV2839.turns'),1);
run('warCampaignV2839().rulesV286841=0;currentEnemy._warV2839.awaitingAction=true;currentEnemy._warV2839.turns=8');a.equal(run('warDuelLimitV286841()'),false);
// Paid checkpoint reload and failed terminal persistence both retain the encounter.
fresh();finalDuel();const supplies=run('warCampaignV2839().supplies'),pending=run('warCampaignV2839().pending.id');run('saveGame();loadAndStart();startWarDuelV2839(cid,2)');a.equal(run('warCampaignV2839().supplies'),supplies);a.equal(run('warCampaignV2839().pending.id'),pending);
run('window.hpBefore=player.hp;player.hp=1');quotaOn();run('currentEnemy.hp=0;checkBattleEnd()');quotaOff();a.equal(run('warCampaignV2839().step'),2);a.equal(run('warCampaignV2839().pending.id'),pending);a.equal(run('player.hp'),run('hpBefore'));leave();run('startWarDuelV2839(cid,2)');a.equal(run('warCampaignV2839().supplies'),supplies);
// Every economic commit fails closed: departure, officer, stage, final reward, retreat and shop.
for(const action of ['entry','assign','stage','settle','retreat','shop']){
 fresh();if(action!=='entry'&&action!=='shop')enter();if(action==='stage')run('chooseWarTacticV2775(0,0)');if(action==='settle'){command();command();command();}if(action==='shop')run('player.warState.meritV2839=100');
 run('warStateV2839();window.before=JSON.stringify(player)');quotaOn();run(({entry:'executeWar(target)',assign:'assignWarOfficerV286841(cid,0,1)',stage:'commandWarStageV2839(cid,0)',settle:'settleWarV2775(target)',retreat:'retreatWarV2775()',shop:'exchangeWarMeritV2839(0)'})[action]);quotaOff();a.equal(run('JSON.stringify(player)'),run('before'),action);a.equal(run('miniSaveDeferredV286840'),false);
}
console.log('PASS realm snapshots; old saves; real officer/dispatch/trail/batch guards; traits and title; 8-action win/held/fail; paid resume; atomic reward/merit rollback');
