'use strict';
const fs=require('fs'),path=require('path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
const run=s=>f.run(s),j=s=>JSON.parse(run(`JSON.stringify(${s})`));
run('document.body.classList[Symbol.iterator]=function(){return document.body._classes[Symbol.iterator]()}');
function fresh(setup=''){run(`resetRuntimeState();player=createDefaultPlayer();player.name='临时测试';player.level=0;player.phase=0;gameState='exploring';closeTutorialBubble();closeWorldOverlay();document.getElementById('gameScreen').classList.remove('hidden');document.getElementById('startScreen').classList.add('hidden');noticeResetV2901();ensureTaskState();${setup}`);}
const bubble=()=>run("document.getElementById('tutorialBubble')?.innerHTML||''");
const ORDER6="['welcome','movement','interaction','combat','combat_attack','equipment']";

// A new mortal is not told about errands; the step id still counts as complete.
a(!run('TUTORIAL_STEPS.welcome.desc').includes('差事'),'welcome no longer promises errands');
a(run('TUTORIAL_STEPS.cultivation.desc').includes('踏入练气后'),'errands are introduced as a later step');
fresh(`player.tutorial.completedSteps=${ORDER6}`);const gold=run('player.gold');
run("triggerTutorial('tasks',true)");
a(bubble().includes('修炼与突破'));a(!bubble().includes('查看宗门任务'),'no dead-end errand button for a mortal');
a(run("player.tutorial.completedSteps.includes('tasks')"));a.equal(run('player.tutorial.activeStep'),'cultivation');a.equal(run('player.gold'),gold,'no reward change');
run("handleTutorialAction('finish','cultivation')");a.equal(run('player.tutorial.completedSteps.length'),run('TUTORIAL_ORDER.length'));a.equal(run('firstJourneyV28687().step'),0,'journey still follows the tutorial');a.equal(run('player.tutorial.skipped'),false);
console.log('PASS mortal tutorial defers errands, keeps completion count and journey hand-off');

// Saves stopped mid-tutorial resume, after JSON round trip through normalizePlayer.
for(const active of ['tasks','cultivation']){
 fresh(`player.tutorial.completedSteps=${active==='tasks'?ORDER6:ORDER6.replace(']',",'tasks']")};player.tutorial.activeStep='${active}';player=normalizePlayer(JSON.parse(JSON.stringify(player)))`);
 run(`triggerTutorial(player.tutorial.activeStep,true)`);a(bubble().includes('修炼与突破'),active);a.equal(run('player.tutorial.activeStep'),'cultivation');
 run("handleTutorialAction('finish','cultivation')");a.equal(run('player.tutorial.completedSteps.length'),8,active);
}
// A fully completed tutorial (old eight-step save) is not reopened.
fresh("player.tutorial.completedSteps=TUTORIAL_ORDER.slice();player.tutorial.activeStep=null");const doneBefore=j('player.tutorial');run('checkAndStartTutorial(false)');a.deepEqual(j('player.tutorial'),doneBefore);
// Practitioners replaying the tutorial keep the original errand step.
fresh(`player.level=1;player.tutorial.completedSteps=${ORDER6}`);run("triggerTutorial('tasks',true)");a(bubble().includes('查看宗门任务'));a.equal(run('player.tutorial.activeStep'),'tasks');
console.log('PASS mid-tutorial and completed saves, and original errand step from Qi Refining');

// A fresh character already carries sect='凌霄宗', so the gate must key on realm rather than sect.
fresh("player.tutorial.skipped=true;player.firstJourneyV28687={step:5}");a.equal(run('player.sect'),'凌霄宗');
a.deepEqual(j('PATH_STEPS_V2901.map(s=>s.id)').slice(-2),['break','task'],'breakthrough is listed first');a.equal(run('PATH_STEPS_V2901.length'),11);
a.equal(run("pathStatesV2901().find(s=>s.id==='task').state"),'locked');a.equal(run('pathNextV2901().id'),'break');a(run('pathTrackerVisibleV2901()'));
run('pathCheckDoneV2901()');a(!run("player.tutorial.readPopups.includes('path_v2901_done')"),'locked is not complete');
run('showFirstPathV2901()');const panel=run("document.getElementById('firstPathPanelV2901').innerHTML");a(panel.includes('踏入练气后开放'));a(!panel.includes('data-id="task"'),'locked step offers no go button');run("document.getElementById('firstPathPanelV2901').remove()");
run('player.level=1');a.equal(run('pathNextV2901().id'),'task');
fresh("player.sectTasks=[{completed:true}]");a.equal(run("pathStatesV2901().find(s=>s.id==='task').state"),'done','old mortal save keeps delivered errand');
fresh("player.level=1;player.tutorial.skipped=true;player.firstJourneyV28687={step:5};player.sectTasks=[{completed:true}]");run('pathTickV2901()');a(run("player.tutorial.readPopups.includes('path_v2901_done')"),'old save can still finish the path');
// Journey button numbering is unaffected by moving the last two steps.
fresh("player.firstJourneyV28687={step:2}");a.equal(run('PATH_STEPS_V2901[4+2].id'),'skill');
console.log('PASS realm-gated errand step, order, panel, completion and legacy delivered errands');

// One map prompt at a time for an unguided newcomer only.
fresh();const before=run('JSON.stringify(player)');a.equal(run('pathOwnsMapV2901()'),true);a.equal(run('JSON.stringify(player)'),before,'read-only');
for(const [why,setup] of [
 ['tutorial skipped without journey',"player.tutorial.skipped=true"],
 ['tracker hidden',"player.tutorial.readPopups.push('path_v2901_hidden')"],
 ['higher realm',"player.level=1"],
 ['high-level save',"player.level=9;delete player.tutorial"],
 ['main quest already advanced',"player.tasks.active.main_01={currentStep:1}"],
 ['main quest completed',"player.tasks.completed=['main_01']"],
 ['journey paused and tutorial skipped',"player.tutorial.skipped=true;player.firstJourneyV28687={step:2,paused:true}"],
 ['letter read',"player.tutorial.skipped=true;player.firstJourneyV28687={step:5}"]
]){fresh(setup);a.equal(run('pathOwnsMapV2901()'),false,why);}
fresh("player.tutorial.skipped=true;player.firstJourneyV28687={step:1}");a.equal(run('pathOwnsMapV2901()'),true,'active journey keeps the tracker');
console.log('PASS quest bar yields only while a newcomer follows the starter path');

// Text shown to a mortal must not point at errands as the way to gain exp.
fresh("player.tutorial.skipped=true;player.firstJourneyV28687={step:5};player.exp=0");
a(!run("PATH_STEPS_V2901.find(s=>s.id==='break').hint").includes('差事'));
a(j('guideNextStepsV2890(guideFactsV2890())').every(t=>!/^接宗门任务/.test(t)),'mortal default suggestion');
run("player.level=4");a(j('guideNextStepsV2890(guideFactsV2890())').join('').includes('接宗门任务'));
console.log('PASS mortal guidance no longer leads with errands');
