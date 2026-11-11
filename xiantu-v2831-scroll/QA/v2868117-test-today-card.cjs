'use strict';
// V28.68.117 今日修行 card (audit G6 phase 1): counts match the underlying daily/weekly task, trip and sect to-do state,
// the 任务 dot follows claimable state, buttons route through the existing guarded functions, no reward or save field is added.
const fs=require('fs'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||require('path').resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
const run=s=>f.run(s);
run("document.documentElement.classList.add('xiantu-v2762-ready')");
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
function fresh(setup=''){run(`resetRuntimeState();player=createDefaultPlayer();player.name='临时测试';player.tutorial.skipped=true;gameState='exploring';closeTutorialBubble();closeWorldOverlay();closeTaskPanel();document.getElementById('gameScreen').classList.remove('hidden');if(!document.getElementById('taskBtn')){const b=document.createElement('button');b.id='taskBtn';document.body.appendChild(b);}ensureTaskState();resetDailyTasks();resetWeeklyTasks();${setup}`);}
const read=()=>run('JSON.stringify(todayReadV2868117())'),R=()=>JSON.parse(read());
const dot=()=>run("syncTodayDotV2868117(),(()=>{const b=document.getElementById('taskBtn');return b.classList.contains('has-today-v2868117')&&Array.from(b.children).some(c=>c.className==='today-dot-v2868117'||String(c.className).startsWith('today-dot-v2868117'))})()");
const saveKeys=()=>run('JSON.stringify(Object.keys(player).sort())');

// --- Fresh character: 3 daily + 2 weekly, nothing claimable ---
fresh();let d=R();
a.equal(d.tasks.filter(t=>t.type==='daily').length,run("SIDE_TASKS.filter(t=>t.type==='daily').length"));
a.equal(d.tasks.filter(t=>t.type==='weekly').length,run("SIDE_TASKS.filter(t=>t.type==='weekly').length"));
a.equal(d.dailyTotal,3);a.equal(d.dailyDone,0);a.equal(d.trip.active,false);a.equal(d.claimable,false);a.equal(dot(),false,'no dot when nothing claimable');
for(const t of d.tasks)a.equal(t.status,run(`getTaskStatus('${t.id}')`),t.id+' status matches');
console.log('PASS fresh: task list mirrors SIDE_TASKS daily/weekly, no dot');

// --- Daily progress mirrors task instance ---
fresh("acceptTask('side_daily_01',true);player.tasks.active.side_daily_01.progress['灵草']=2");d=R();
let t=d.tasks.find(t=>t.id==='side_daily_01');a.equal(t.status,'active');a.equal(t.step,run("getCurrentStepDesc('side_daily_01')"));a.match(t.step,/2\/5/);
run("player.tasks.active.side_daily_02={currentStep:1,progress:{},completed:true,failed:false};player.tasks.completed.push('side_daily_02')");d=R();
a.equal(d.dailyDone,1);a.equal(d.tasks.find(t=>t.id==='side_daily_02').progress,100);a.equal(d.claimable,false,'completed dailies paid on completion, not claimable');
console.log('PASS daily: step text, progress and done count match task state');

// --- Trip: active without yield, then claimable ---
fresh("player.expeditionV286821={wins:{wolf:0},active:{key:'wolf',started:Date.now()-5*60000,level:0}}");d=R();
a.equal(d.trip.active,true);a.equal(d.trip.units,0);a.equal(d.trip.claimable,false);a.equal(dot(),false);
fresh("player.expeditionV286821={wins:{wolf:0},active:{key:'wolf',started:Date.now()-125*60000,level:0}}");d=R();
const y=JSON.parse(run('JSON.stringify(tripYieldV286821())'));a.equal(d.trip.units,y.units);a.equal(d.trip.gold,y.gold);a.equal(d.trip.herbs,y.herbs);a.equal(d.trip.units,12);
a.equal(d.claimable,true);a.equal(dot(),true,'dot when trip has yield');a.match(run("document.getElementById('taskBtn').getAttribute('aria-label')"),/可领取/);
console.log('PASS trip: units/gold/herbs equal tripYieldV286821, dot on when claimable');

// --- Card renders the same numbers and routes claim through claimTripV286821 ---
run("showTaskPanel('today')");
a.equal(run("document.querySelector('.task-tab.active').dataset.tab"),'today');
const html=run("document.getElementById('taskListContainer').innerHTML");
a.match(html,/已积累120\/480分钟/);a.match(html,new RegExp(`待领 ${y.gold} 灵石、${y.herbs} 灵草`));a.match(html,/日常 <em>0\/3<\/em>/);
run("globalThis.__calls=[];const o=claimTripV286821;claimTripV286821=function(...x){__calls.push('claim');return o.apply(this,x)};globalThis.__oc=o");
const gold0=run('player.gold'),keys0=saveKeys();
run("todayOpenV2868117('claimTrip')");
a.deepEqual(JSON.parse(run('JSON.stringify(__calls)')),['claim'],'claim goes through claimTripV286821');
a.equal(run('player.gold'),gold0+y.gold,'gold equals trip yield, no extra reward');a.equal(run('player.expeditionV286821.active'),null);
a.ok(!JSON.parse(saveKeys()).some(k=>/today|2868117/i.test(k))&&JSON.parse(saveKeys()).every(k=>k==='forgeV2825'||JSON.parse(keys0).includes(k)),'no new save field (forgeV2825 comes from the existing save normaliser)');a.equal(dot(),false,'dot clears after claim');
// Guarded: not exploring -> nothing happens
fresh("player.expeditionV286821={wins:{wolf:0},active:{key:'wolf',started:Date.now()-125*60000,level:0}};gameState='combat'");
const g1=run('player.gold');a.equal(run("todayOpenV2868117('claimTrip')"),false);a.equal(run('player.gold'),g1);a.equal(run('!!player.expeditionV286821.active'),true);
run('claimTripV286821=__oc');
console.log('PASS claim: existing guarded function only, gold delta = yield, blocked outside exploring');

// --- Accept routes through acceptTask; sect to-dos mirror sectTodoReadV2868 ---
fresh();run("showTaskPanel('today')");run("todayOpenV2868117('accept','side_daily_03')");a.equal(run("getTaskStatus('side_daily_03')"),'active');
a.match(run("document.getElementById('taskListContainer').innerHTML"),/data-task-id="side_daily_03" data-status="active"/);
fresh("player.sect='凌霄宗';player.sectTasks=[{template:{name:'测试委托',type:'gather',materials:{'灵草':2}},completed:false}];player.materials={'灵草':5}");d=R();
const todo=JSON.parse(run('JSON.stringify(sectTodoReadV2868())'));a.equal(d.todo.total,todo.total);a.equal(d.todo.tasks.length,todo.tasks.length);
a.equal(d.sectTasks.length,1);a.equal(d.sectTasks[0].ready,true);a.equal(d.claimable,todo.total>0);a.equal(dot(),todo.total>0);
console.log('PASS sect: to-do totals equal sectTodoReadV2868, sect task progress from getSectTaskProgressInfo');
