'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run("startGame();tutorialState.active=false;closeWorldOverlay();player.level=5;ensureTaskState();player.tasks.active={};player.tasks.completed=MAIN_TASKS.slice(0,16).map(t=>t.id);player.tasks.legacyMainV286823=[];checkTaskTriggers()");
a.equal(f.run("getTrackedTasks()[0].id"),'journey_01');a.equal(f.run("getTaskStatus('journey_01')"),'locked');
f.run('showTaskPanel()');a.match(f.ids.get('taskListContainer').innerHTML,/达到炼虚初期/);a.match(f.ids.get('taskListContainer').innerHTML,/previewMainCultivationV2868103\('journey_01'\)/);
const progress=f.run('JSON.stringify(player.tasks)'),day=f.run('player.worldTime.totalDays'),gold=f.run('player.gold');
f.run("previewMainCultivationV2868103('journey_01')");a.equal(f.run('JSON.stringify(player.tasks)'),progress);a.equal(f.run('player.worldTime.totalDays'),day);a.equal(f.run('player.gold'),gold);
f.run('player.level=6;checkTaskTriggers()');a.equal(f.run("getTaskStatus('journey_01')"),'active');a.equal(f.run("getTrackedTasks()[0].id"),'journey_01');
// Later realm gates remain visible and preserve legacy migration choices.
for(const [id,level,need] of [['main_17',9,'地仙'],['main_18',14,'准圣'],['main_19',15,'圣人']]){
 f.c.id=id;f.c.level=level;f.run("player.level=level;player.tasks.active={};player.tasks.completed=MAIN_TASKS.slice(0,MAIN_TASKS.findIndex(t=>t.id===id)).map(t=>t.id);checkTaskTriggers()");
 a.equal(f.run('getTrackedTasks()[0].id'),id);a.equal(f.run('getTaskStatus(id)'),'locked');a.match(f.run('mainTaskLockV2822(getTaskData(id))'),new RegExp(need));
}
f.run("player.level=5;player.tasks.active={};player.tasks.completed=MAIN_TASKS.slice(0,16).map(t=>t.id);player.tasks.legacyMainV286823=['main_17'];player.level=10;checkTaskTriggers()");a.equal(f.run('getTrackedTasks()[0].id'),'main_17');
f.run("player.tasks.active={};player.tasks.completed=MAIN_TASKS.map(t=>t.id);checkTaskTriggers()");a.equal(f.run('getTrackedTasks().length'),0);
// All three task-combat entry paths warn once per attempted low-HP fight.
for(const [id,step,action] of [['main_07',1,'combat_puppet'],['main_04',1,'kill_enemies'],['main_08',2,'gather_guard_v2823']]){
 f.c.id=id;f.c.step=step;f.c.action=action;
 f.run("gameState='exploring';COMBAT_FINISH_V2764.settling=false;player.tasks.completed=[];player.tasks.active={};player.tasks.active[id]=createTaskInstance(getTaskData(id));player.tasks.active[id].currentStep=step;player.hp=1;player.gold=1500;if(action==='gather_guard_v2823')mainGatherStateV2823(getTaskInstance(id)).pending=true;globalThis.launch=()=>action==='kill_enemies'?launchNextKillTaskBattle(id):launchSpecialTaskBattle(id,action);launch()");
 a.equal(f.run('gameState'),'exploring',id);a.equal(f.run('player.gold'),1500);a(f.ids.get('taskBattlePromptV2868103'),id);
 f.run('globalThis.promptSeq=taskBattlePromptV2868103.seq;showTaskSuppliesV2868103();confirmTaskBattleV2868103(promptSeq)');a.equal(f.run('gameState'),'exploring');a.equal(f.run('player.hp'),1);a.equal(f.run('player.gold'),1500);
 f.run('launch();globalThis.promptSeq=taskBattlePromptV2868103.seq;confirmTaskBattleV2868103(promptSeq)');a.equal(f.run('gameState'),'combat',id);const token=f.run('COMBAT_FINISH_V2764.token');f.run('confirmTaskBattleV2868103(promptSeq);launch()');a.equal(f.run('COMBAT_FINISH_V2764.token'),token,'no duplicate fight');
}
f.run("gameState='exploring';COMBAT_FINISH_V2764.settling=false;id='main_07';action='combat_puppet';player.tasks.active[id]=createTaskInstance(getTaskData(id));player.tasks.active[id].currentStep=1;player.hp=1;launch();globalThis.promptSeq=taskBattlePromptV2868103.seq;player.tasks.active[id].currentStep=2;confirmTaskBattleV2868103(promptSeq)");a.equal(f.run('gameState'),'exploring','stale step rejected');
f.run("player.tasks.active[id].currentStep=1;launch();globalThis.promptSeq=taskBattlePromptV2868103.seq;player={...player};confirmTaskBattleV2868103(promptSeq)");a.equal(f.run('gameState'),'exploring','stale owner rejected');
f.run("player.hp=getMaxHp();launch()");a.equal(f.run('gameState'),'combat','healthy combat unchanged');
f.run("gameState='exploring';COMBAT_FINISH_V2764.settling=false;player.sectTournament.active=null;player.sectTournament.pending=[];player.worldTime.totalDays=7000;player.exp=0;showSectTournament()");a(f.run("currentChoices.some(c=>c.action==='tournament_retreat_preview_v2868103')"));const before=f.run('player.worldTime.totalDays');f.run('previewTournamentRetreatV2868103()');a.equal(f.run('player.worldTime.totalDays'),before);a.equal(f.run('retreatPlanV2782.home'),false);a.equal(f.run('retreatPlanV2782.maxYears'),10);a(f.run('retreatPlanV2782.days<=retreatPlanV2782.safeDays'));
console.log('PASS locked next-main tracker/preview, late realm gates/legacy progress, low-HP cancel/confirm/stale/duplicate guards, gathering retry, tournament preview without spending time');
