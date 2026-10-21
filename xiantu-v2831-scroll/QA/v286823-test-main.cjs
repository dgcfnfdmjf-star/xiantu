'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const f=fixture(root);f.c.console.log=()=>{};for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run('startGame();closeWorldOverlay()');f.timers.clear();
a.equal(f.run('MAIN_TASKS.length'),27);a.equal(f.run('new Set(MAIN_TASKS.map(t=>t.id)).size'),27);
a.equal(f.run('new Set(MAIN_TASKS.map(t=>t.unlockRealm)).size'),17);
a(f.run('MAIN_TASKS.every((t,i)=>i===0||t.unlockRealm>=MAIN_TASKS[i-1].unlockRealm)'));
a(f.run('MAIN_TASKS.every((t,i)=>t.nextTask===(MAIN_TASKS[i+1]?.id||null))'));
f.run("player.tasks={active:{},completed:[],failed:[],choices:{}};ensureTaskState();player.level=16;player.tasks.completed=MAIN_TASKS.slice(0,16).map(t=>t.id)");
a.equal(f.run("getTaskStatus('main_17')"),'locked');f.run('checkTaskTriggers()');a.equal(f.run("getTaskStatus('journey_01')"),'active');
f.run("showTaskPanel('main')");a.match(f.ids.get('taskListContainer').innerHTML,/27 章/);a.equal(f.run("mainTaskGuideV2822(getTaskData('main_17'))"),'仙门 · 宿敌纪事');
// Every chapter preserves its four saved indices, gates combat, persists preparation, and rewards once.
for(let n=1;n<=8;n++)for(const plan of ['guard','breach']){
 const id='journey_'+String(n).padStart(2,'0');f.c.testId=id;f.c.testPlan=plan;
 f.run("resetRuntimeState();player=createDefaultPlayer();player.level=16;ensureTaskState();player.tasks.completed=MAIN_TASKS.slice(0,MAIN_TASKS.findIndex(t=>t.id===testId)).map(t=>t.id);acceptTask(testId,true);completeTaskStep(testId,testId+'_open');player.hp=getMaxHp();player.mp=getMaxMp()");f.timers.clear();
 a.equal(f.run("setJourneyPrepV286823(testId,'plan',testPlan)"),false);
 a.equal(f.run("setJourneyPrepV286823(testId,'clue',0)"),true);a.equal(f.run("setJourneyPrepV286823(testId,'clue',0)"),false);
 a.equal(f.run("setJourneyPrepV286823(testId,'clue',1)"),true);a.equal(f.run("setJourneyPrepV286823(testId,'plan',testPlan)"),true);
 a.equal(f.run('journeyPrepV286823(testId).plan'),plan);
 a.equal(f.run('JSON.parse(localStorage.getItem(SAVE_KEY)).player.tasks.active[testId].progress.investigationV286823.plan'),plan);
 const gold=f.run('player.gold');f.run('launchJourneyBattleV2838(testId)');const el=f.ids.get('journeyPrepareV2838');el.onclick({target:{closest:()=>({dataset:{journey:'fight'}})}});
 a.equal(f.run('gameState'),'combat');if(plan==='guard')a.equal(f.run('elementGuardsV286818.get(currentEnemy).pool'),f.run('Math.floor(getMaxHp()*.12)'));
 a.equal(f.run("setJourneyPrepV286823(testId,'plan','guard')"),false);
 f.run("onBattleVictory({name:'unrelated'});");a.equal(f.run('getTaskInstance(testId).currentStep'),1);
 f.run("currentEnemy.hp=0;onBattleVictory(currentEnemy);onBattleVictory(currentEnemy)");a.equal(f.run('getTaskInstance(testId).currentStep'),2);
 f.run("gameState='exploring';COMBAT_FINISH_V2764.settling=false;battleCheckpointV286812=null;completeTaskStep(testId,testId+'_end');onChoiceMade(testId,getTaskData(testId).steps[3].options[0][0])");
 a.equal(f.run('getTaskInstance(testId).completed'),true);a.equal(f.run('player.gold'),gold+f.run('getTaskData(testId).rewards.gold'));
 const saved=f.run('JSON.stringify([player.gold,player.inventory,player.tasks])');f.run('completeTask(testId);onChoiceMade(testId,getTaskData(testId).steps[3].options[1][0])');a.equal(f.run('JSON.stringify([player.gold,player.inventory,player.tasks])'),saved);
 a.match(f.run("scenePagesV2838(testId,testId+'_end').at(-1)[1]"),/。/);
}
// Old waiting/active/completed milestones and previously completed journeys remain intact.
f.run("resetRuntimeState();player.tasks={active:{main_17:{currentStep:1,progress:{},completed:false}},completed:Array.from({length:16},(_,i)=>'main_'+String(i+1).padStart(2,'0')),choices:{journey_01:'home'},failed:[]};ensureTaskState();checkTaskTriggers()");
a.equal(f.run("preferredMainV286823(MAIN_TASKS.filter(t=>!player.tasks.completed.includes(t.id))).id"),'main_17');a.equal(f.run("getTaskInstance('main_17').currentStep"),1);
f.run("player.tasks.completed.push('main_17');delete player.tasks.active.main_17;ensureTaskState()");a.equal(f.run("player.tasks.legacyMainV286823.includes('main_18')"),true);
// A current-version character never acquires a later legacy exemption by progressing.
f.run("player.tasks={active:{},completed:[],choices:{},failed:[]};ensureTaskState();player.tasks.completed.push('main_16','main_17');ensureTaskState()");a.equal(f.run('player.tasks.legacyMainV286823.length'),0);
f.run("player.tasks={active:{journey_01:{currentStep:4,progress:{},completed:true}},completed:['main_16','journey_01'],choices:{journey_01:'home'},failed:[]};ensureTaskState()");
const before=f.run('player.gold');a.equal(f.run("acceptTask('journey_01',true)"),false);a.equal(f.run('player.gold'),before);a.equal(f.run("player.tasks.choices.journey_01"),'home');
a.match(f.run("scenePagesV2838('journey_02','journey_02_open')[0][1]"),/遗物/);
// Storage failure retains the previous investigation and permits retry.
f.run("player.tasks.active.journey_02={currentStep:1,progress:{},completed:false};gameState='exploring'");const write=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(f.run("setJourneyPrepV286823('journey_02','clue',0)"),false);a.equal(f.run("journeyPrepV286823('journey_02').clues.length"),0);f.c.localStorage.setItem=write;
a.equal(f.run("setJourneyPrepV286823('journey_02','clue',0)"),true);
f.run("launchJourneyBattleV2838('journey_02')");const stale=f.ids.get('journeyPrepareV2838');f.run("launchJourneyBattleV2838('journey_02')");stale.onclick({target:{closest:()=>({dataset:{journey:'clue1'}})}});a.equal(f.run("journeyPrepV286823('journey_02').clues.length"),1);
console.log('PASS 27 chapters/17 realms, order and gate, 16 chapter-plan paths, persistent investigation, battle aid, victory guard, reward once, legacy progress/choices, branch callback, save rollback and stale panel');
f.run('resetRuntimeState();player=createDefaultPlayer();player.level=16;ensureTaskState();player.tasks.completed=MAIN_TASKS.slice(0,MAIN_TASKS.findIndex(t=>t.id==="journey_01")).map(t=>t.id);acceptTask("journey_01",true);completeTaskStep("journey_01","journey_01_open");player.hp=getMaxHp();getTaskInstance("journey_01").progress.investigationV286823={clues:[0],plan:"guard"}');
a.equal(f.run('journeyPrepV286823("journey_01").plan'),null,'incomplete imported investigation cannot unlock battle');
a.match(f.run('investigationPanelV286823("journey_01")'),/已完成 1\/2/);
f.run('setJourneyPrepV286823("journey_01","clue",1)');
a.match(f.run('investigationPanelV286823("journey_01")'),/请选择下方战术/);
f.run('setJourneyPrepV286823("journey_01","plan","guard")');
a.match(f.run('investigationPanelV286823("journey_01")'),/战术已选定/);
console.log('PASS investigation hints reflect progress; incomplete imported plan stays locked');
