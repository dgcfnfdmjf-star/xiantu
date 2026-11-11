'use strict';
// V28.68.121 tutorial pacing (audit G5): move, interact and first attack open straight on the compact
// reminder with the action-phase spotlight (no 「开始操作」 tap); the 起步之路 counter advances per card;
// step ids and saved progress resolve unchanged.
const fs=require('fs'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||require('path').resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
const run=s=>f.run(s);
run('document.body.classList[Symbol.iterator]=function(){return document.body._classes[Symbol.iterator]()}');
function fresh(setup=''){run(`resetRuntimeState();player=createDefaultPlayer();player.name='临时测试';player.level=0;player.phase=0;gameState='exploring';closeTutorialBubble();closeWorldOverlay();tutorialState.compactStepId=null;document.getElementById('gameScreen').classList.remove('hidden');document.getElementById('startScreen').classList.add('hidden');noticeResetV2901();ensureTaskState();${setup}`);}
const bubble=()=>run("(function(){var b=document.getElementById('tutorialBubble');if(!b)return null;return {docked:b.classList.contains('tutorial-docked'),buttons:b.querySelectorAll('button').length,text:b.innerHTML,counter:b.querySelector('.tutorial-counter')?.textContent||null,mini:b.querySelector('.tutorial-mini-progress')?.textContent||null}})()");

// Step ids are unchanged, so saved progress (completedSteps / activeStep) still resolves.
a.deepEqual(JSON.parse(run('JSON.stringify(TUTORIAL_ORDER)')),['welcome','movement','interaction','combat','combat_attack','equipment','tasks','cultivation']);
a.deepEqual(JSON.parse(run('JSON.stringify(Object.keys(TUTORIAL_STEPS))')),JSON.parse(run('JSON.stringify(TUTORIAL_ORDER)')));

// Simple steps: docked straight away, no 开始操作, spotlight on, light dim.
for(const id of ['movement','interaction','combat_attack']){
 fresh();a(run(`triggerTutorial('${id}',true)`),id+' opens');const b=bubble();
 a(b.docked,id+' opens as the compact reminder');a.equal(b.buttons,0,id+' has no 开始操作 tap');a(!/开始操作/.test(b.text));
 a.equal(run(`TUTORIAL_STEPS['${id}'].compact`).length>0,true);a(b.text.includes(run(`TUTORIAL_STEPS['${id}'].compact`)),id+' shows its compact hint');
 a(run("document.querySelector('.tutorial-dim').classList.contains('acting')"),id+' uses the light action dim');
 a(run("!!document.querySelector('.tutorial-spotlight-v2868114')"),id+' spotlights its control');
 a.equal(run('player.tutorial.activeStep'),id,'active step id saved as before');
}
// Explanation cards keep their buttons and full dim.
for(const id of ['welcome','combat','equipment','tasks','cultivation']){
 fresh(id==='tasks'?'player.level=1':'');run(`triggerTutorial('${id}',true)`);const b=bubble();
 a(!b.docked,id+' stays an explanation card');a(b.buttons>0,id+' keeps its action buttons');
 a(!run("!!document.querySelector('.tutorial-spotlight-v2868114')"),id+' has no spotlight');
}
console.log('PASS simple steps open on the compact reminder with the spotlight; explanation cards unchanged');

// Counter advances per card: no two consecutive cards share a label.
const labels=[];
for(const id of ['welcome','movement','interaction','combat','combat_attack','equipment','tasks','cultivation']){
 fresh('player.level=1');run(`triggerTutorial('${id}',true)`);const b=bubble();labels.push({id,label:b.counter||b.mini});
}
a.deepEqual(labels.map(x=>x.label),[
 '起步之路 1 / 11 · 本段 1/3','1/11 · 2/3','1/11 · 3/3',
 '起步之路 2 / 11 · 本段 1/2','2/11 · 2/2',
 '起步之路 3 / 11',
 '起步之路 4 / 11 · 本段 1/2','起步之路 4 / 11 · 本段 2/2']);
for(let i=1;i<labels.length;i++)a.notEqual(labels[i].label.replace(/^起步之路 | /g,''),labels[i-1].label.replace(/^起步之路 | /g,''),'counter moves between '+labels[i-1].id+' and '+labels[i].id);
fresh();run("triggerTutorial('welcome',true)");
const PIPS="document.getElementById('tutorialBubble').querySelector('.tutorial-counter').querySelector('.tutorial-pips-v2868121')";
a.equal(run(PIPS+".querySelectorAll('i').length"),3,'three pips for the first path row');
a.equal(run(PIPS+".querySelectorAll('i')[0].className"),'cur','first pip marks the current card');
fresh();run("triggerTutorial('combat',true)");a.equal(run(PIPS+".querySelectorAll('i').length"),2,'two pips for the 演武 row');
fresh();run("triggerTutorial('equipment',true)");a(!run(PIPS),'single-card row has no pips');
console.log('PASS 起步之路 counter advances per card (row n/11 plus card i/of)');

// Old saves resume on the same id; a save parked on the old 开始操作 card now resumes docked.
fresh("player.tutorial.completedSteps=['welcome'];player.tutorial.activeStep='movement'");
const before=run('JSON.stringify(player.tutorial)');run('checkAndStartTutorial(false)');
f.flush?.();run("triggerTutorial(player.tutorial.activeStep,true)");
a.equal(run('tutorialState.currentStepId'),'movement');a(bubble().docked,'resumed simple step is docked');
a.deepEqual(JSON.parse(run('JSON.stringify(player.tutorial.completedSteps)')),JSON.parse(before).completedSteps,'saved progress unchanged');
// The legacy dock action still works (no stale button left behind, but the handler is kept).
fresh();run("handleTutorialAction('dock','interaction')");a.equal(run('tutorialState.compactStepId'),'interaction');
// Skipped tutorials never open cards.
fresh('player.tutorial.skipped=true');a.equal(run("triggerTutorial('movement')"),false);
console.log('PASS step ids, saved progress and skip unchanged');

// Styling: 青绿鎏金 tokens, at least 12px, no animation added.
const css=fs.readFileSync(root+'/xiantu-v2762.css','utf8'),blk=css.slice(css.indexOf('/* V28.68.121 tutorial pacing'));
a(blk.length>0&&/--xt-gold-300/.test(blk)&&/--xt-jade-500/.test(blk),'jade/gold tokens');
a(![...blk.matchAll(/font-size:(\d+)px/g)].some(m=>+m[1]<12),'no text below 12px');
a(!/animation|transition/.test(blk),'pips and counter are static (effects off / reduced motion safe)');
console.log('PASS v2868121 tutorial pacing');
