'use strict';
// V28.68.114 first ten minutes: full health for new characters, no wandering contact fights during the
// guided steps or while a tutorial card is open, low-health contact confirmation, receipt suppression by
// step id / removal on full panels / auto-collapse, light action-phase spotlight, achievement above receipt.
const fs=require('fs'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||require('path').resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
const run=s=>f.run(s);
run('document.body.classList[Symbol.iterator]=function(){return document.body._classes[Symbol.iterator]()}');
function fresh(setup=''){run(`resetRuntimeState();player=createDefaultPlayer();player.name='临时测试';player.level=0;player.phase=0;gameState='exploring';closeTutorialBubble();closeWorldOverlay();document.getElementById('gameScreen').classList.remove('hidden');document.getElementById('startScreen').classList.add('hidden');noticeResetV2901();ensureTaskState();document.getElementById('afterBattleV2838')?.remove();FLAT_WORLD.monsters=[];${setup}`);}
const DONE="player.tutorial.completedSteps=TUTORIAL_ORDER.slice();player.tutorial.activeStep=null";
// One wandering monster standing on the player, ready to touch.
const ADJ="var mm={id:'wm_t',x:FLAT_WORLD.player.x+5,y:FLAT_WORLD.player.y,radius:18,speed:0,enemy:{name:'山贼',hp:600,maxHp:600,atk:30,def:5,gold:10,exp:10,_realmLevel:0,_realmPhase:0},regionId:currentRegion||getPlayerRegion(),dir:{x:0,y:0},dirTimer:99,alive:true,inCombat:false,battleCooldown:0};FLAT_WORLD.monsters=[mm];";
let started=[];run('var __startCombat=startCombat');
f.c.startCombat=(e,...rest)=>{started.push(e.name);f.c.gameState='combat';};
run('startCombat=globalThis.startCombat');
const touch=()=>run('updateWorldMonsters(0.016)');

// --- G1: starting health (new characters only) ---
run("document.getElementById('playerName').value='临时测试'");
try{run('startGame()');}catch(e){/* fixture lacks some boot pieces; health is set before them */}
a.equal(run('player.name'),'临时测试');a.equal(run('player.hp'),run('getMaxHp()'),'new character starts at full health');
a(run('getMaxHp()')>100,'maximum is above the old base 100');
fresh("player.hp=100");const migrated=run('normalizePlayer(JSON.parse(JSON.stringify(player))).hp');a.equal(migrated,100,'loading an old save does not heal it');
console.log('PASS new character starts at full health; saved health is untouched on load');

// --- G1: guided steps block contact ---
for(const [why,setup] of [
 ['fresh tutorial',''],
 ['mid tutorial between steps',"player.tutorial.completedSteps=['welcome','movement','interaction','combat','combat_attack'];player.tutorial.activeStep=null"],
 ['journey before the mountain-pass fight',DONE+";player.firstJourneyV28687={step:2}"],
]){fresh(setup+';'+ADJ);started=[];touch();a.equal(started.length,0,why);a.equal(run('mm.inCombat'),false,why);a.equal(run("gameState"),'exploring',why);a(!run("document.getElementById('taskBattlePromptV2868103')"),why+': no prompt');}
// A tutorial card open blocks contact even for a seasoned character.
fresh("player.level=5;player.tutorial.skipped=true;"+ADJ+"var b=document.createElement('div');b.id='tutorialBubble';document.body.appendChild(b);tutorialState.bubble=b");started=[];touch();a.equal(started.length,0,'tutorial card open');
run("tutorialState.bubble.remove();tutorialState.bubble=null");run('mm.battleCooldown=0;player.hp=getMaxHp()');touch();a.deepEqual(started,['山贼'],'card closed: contact resumes');
console.log('PASS wandering monsters wait during guided steps and while a tutorial card is open');

// --- After the steps, contact behaves as before at healthy HP ---
for(const [why,setup] of [
 ['tutorial skipped',"player.tutorial.skipped=true"],
 ['steps done, journey past the pass',DONE+";player.firstJourneyV28687={step:4}"],
 ['journey paused',DONE+";player.firstJourneyV28687={step:1,paused:true}"],
 ['old save (no tutorial data → skipped)',"player=normalizePlayer((()=>{const p=JSON.parse(JSON.stringify(player));delete p.tutorial;return p;})())"],
]){fresh(setup+';'+ADJ);run('player.hp=getMaxHp()');started=[];touch();a.deepEqual(started,['山贼'],why);a.equal(run('mm.inCombat'),true,why);}
console.log('PASS contact fights start as before once the guided steps are done');

// --- Low-health contact asks first, reusing the task-battle prompt ---
fresh("player.tutorial.skipped=true;"+ADJ);run('player.hp=Math.floor(getMaxHp()*.3)');const gold=run('player.gold');started=[];touch();
a.equal(started.length,0,'no fight before confirmation');a.equal(run('mm.inCombat'),false);
const prompt=run("document.getElementById('taskBattlePromptV2868103')");a(prompt,'same low-health prompt');
a.equal(run("document.getElementById('taskBattlePromptV2868103').dataset.kind"),'wild');
const html=run("document.getElementById('storyText').innerHTML");a(html.includes('气血不足')&&html.includes('仍要出战')&&html.includes('先去补给'),'prompt offers supplies and fight');
a.equal(run('mm.battleCooldown'),8,'declining leaves a walk-away grace');
const seq=Number(run("document.getElementById('taskBattlePromptV2868103').dataset.prompt"));
a.equal(run(`confirmWildContactV2868114(${seq+1})`),false,'stale prompt ignored');a.equal(started.length,0);
a.equal(run(`confirmWildContactV2868114(${seq})`),true);a.deepEqual(started,['山贼'],'confirm starts that fight');
a.equal(run(`confirmWildContactV2868114(${seq})`),false,'double confirm runs once');a.equal(started.length,1);a.equal(run('player.gold'),gold);
// Monster gone by the time of confirmation: no fight.
fresh("player.tutorial.skipped=true;"+ADJ);run('player.hp=1');started=[];touch();const seq2=Number(run("document.getElementById('taskBattlePromptV2868103').dataset.prompt"));
run('mm.alive=false');a.equal(run(`confirmWildContactV2868114(${seq2})`),false);a.equal(started.length,0,'departed monster');
// Healthy at 50%: no prompt.
fresh("player.tutorial.skipped=true;"+ADJ);run('player.hp=Math.ceil(getMaxHp()*.5)');started=[];touch();a.deepEqual(started,['山贼'],'half health fights without prompt');
console.log('PASS low-health contact asks first with the shared prompt; stale and repeated confirms are ignored');

// --- G2: battle receipt ---
const receipt=()=>run("document.getElementById('afterBattleV2838')");
const showReceipt=()=>run("lastBattleV2838={owner:player,name:'山贼',gold:10,exp:12,taskType:'main'};showAfterBattleV2838(player)");
fresh("player.tutorial.completedSteps=['welcome','movement','interaction','combat','combat_attack'];tutorialState.active=false");showReceipt();
a(!receipt(),'suppressed while guided steps are unfinished even when the bubble flag is false');
fresh(DONE);showReceipt();a(receipt(),'shown once the steps are done');
a.equal(run("tickAfterBattleV2868114(document.getElementById('afterBattleV2838'),Date.now()+1000)"),'kept');
a.equal(run("tickAfterBattleV2868114(document.getElementById('afterBattleV2838'),Date.now()+7000)"),'collapsed','auto-collapses');
a(run("document.getElementById('afterBattleV2838').classList.contains('collapsed')"));
a.equal(run("document.getElementById('afterBattleV2838').children[0].querySelector('strong').getAttribute('aria-expanded')"),'false');
run("var ep=document.createElement('div');ep.id='equipmentPanel';document.body.appendChild(ep)");
a.equal(run("tickAfterBattleV2868114(document.getElementById('afterBattleV2838'))"),'removed','removed when a full panel opens');a(!receipt());
run("document.getElementById('equipmentPanel').remove()");
fresh(DONE);showReceipt();run("document.getElementById('afterBattleV2838')._watchV2868114.touched=true");
a.equal(run("tickAfterBattleV2868114(document.getElementById('afterBattleV2838'),Date.now()+60000)"),'kept','a receipt the player touched stays open');
fresh(DONE+";var ip=document.createElement('div');ip.className='mobile-inventory-overlay';document.body.appendChild(ip)");showReceipt();a(!receipt(),'not shown over an open panel');run("document.querySelector('.mobile-inventory-overlay').remove()");
fresh("player.tutorial.skipped=true");showReceipt();a(receipt(),'skipped tutorial keeps the receipt');
console.log('PASS receipt: suppressed by step id, removed by full panels, auto-collapses unless touched');

// --- A7: action-phase spotlight ---
fresh();run("tutorialState.compactStepId='movement';triggerTutorial('movement',true)");
a(run("document.querySelector('.tutorial-dim').classList.contains('acting')"),'action phase uses the light dim');
a(run("document.querySelector('.tutorial-spotlight-v2868114')"),'spotlight cut around the control');
run("tutorialState.compactStepId=null;triggerTutorial('welcome',true)");   // V28.68.121: simple steps always dock; the welcome card is an explanation card
a(!run("document.querySelector('.tutorial-dim').classList.contains('acting')"),'explanation card keeps the full dim');
a(!run("document.querySelector('.tutorial-spotlight-v2868114')"),'no spotlight while reading');
run('closeTutorialBubble()');a(!run("document.querySelector('.tutorial-spotlight-v2868114')"),'spotlight cleared with the bubble');
const css=fs.readFileSync(root+'/xiantu-v2762.css','utf8');
a(/\.tutorial-dim\.acting\{background:transparent!important;backdrop-filter:none/.test(css),'no blur in action phase');
a(/\.tutorial-spotlight-v2868114\{[^}]*rgba\(3,7,5,\.15\)/.test(css),'about 15% dim around the spotlight');
console.log('PASS action phase: no blur, light dim, spotlight; explanation card unchanged');

// --- A6: achievement popup ---
fresh(DONE);showReceipt();run("showAchievementPopup({id:'t',name:'初试锋芒',icon:'⚔️',desc:'测试'})");
const pop=run("document.querySelector('.achievement-popup')");a(pop,'popup shown');
a(run("document.querySelector('.achievement-popup').innerHTML").includes('achievement-name-v2868114'),'restyled markup');
a(!run("document.querySelector('.achievement-popup').innerHTML").includes('#ffd700'),'no inline brown/yellow styling');
a.equal(run("document.querySelector('.achievement-popup').style.top"),'704px','placed below the receipt, clamped inside the viewport');
const z=n=>Number((css.match(new RegExp(n+'\\{[^}]*z-index:(\\d+)'))||[])[1]);
a(z('\\.achievement-popup')>z('\\.after-battle-v2838'),'achievement stacks above the receipt');
f.storage.set('xiantu_map_fx_v2868104','off');run('noticeResetV2901()');run("showAchievementPopup({id:'t2',name:'静',icon:'',desc:''})");
a(run("document.querySelector('.achievement-popup').classList.contains('still-v2868114')"),'effects off: no pop animation');f.storage.delete('xiantu_map_fx_v2868104');
console.log('PASS achievement popup is jade/gold, above and below the receipt, static with effects off');

// A character past the starter realms who never finished the cards still gets receipts and wild fights.
fresh("player.level=4;player.tutorial.completedSteps=['welcome'];"+ADJ);run('player.hp=getMaxHp()');a.equal(run('guidedTutorialUnfinishedV2868114()'),false);
showReceipt();a(receipt(),'receipt for a level-4 character with stale tutorial data');started=[];touch();a.deepEqual(started,['山贼']);
console.log('PASS guided-step guards are limited to the starter realms');
