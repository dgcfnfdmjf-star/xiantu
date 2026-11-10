'use strict';
// V28.68.116 breakthrough-ready cue (audit G4) and success card (audit A5): chip states, hiding rules,
// opening the existing screen without changing state, count-up data, effects-off still path.
const fs=require('fs'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||require('path').resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
const run=s=>f.run(s);
// The fixture's MutationObserver never fires: mark the page ready before the UI module loads so it starts.
run("document.documentElement.classList.add('xiantu-v2762-ready')");
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
run('document.body.classList[Symbol.iterator]=function(){return document.body._classes[Symbol.iterator]()}');
run("document.body.classList.add('flat-world-active')");
function fresh(setup=''){run(`resetRuntimeState();player=createDefaultPlayer();player.name='临时测试';player.level=1;player.phase=2;player.tutorial.skipped=true;gameState='exploring';closeTutorialBubble();closeWorldOverlay();document.getElementById('gameScreen').classList.remove('hidden');document.getElementById('startScreen').classList.add('hidden');${setup}`);}
const cue=()=>run('breakthroughCueV2868116.state().state');
const chip=()=>{run('breakthroughCueV2868116.render()');return run("(()=>{const c=document.getElementById('xtBreakChipV2868116');return c&&!c.hidden?c.dataset.state+'|'+c.textContent:'none'})()");};
const glow=()=>run("!!document.getElementById('worldExpBar').closest('.world-bar-row').classList.contains('xt-exp-ready-v2868116')");

// --- Four states, derived from existing fields only ---
fresh('player.exp=Math.floor(getCurrentExpNeed()/2)');a.equal(cue(),'below');a.equal(chip(),'none');a.equal(glow(),false);
fresh('player.exp=getCurrentExpNeed()');a.equal(cue(),'ready');const next=run('getNextCultivationName()');a.equal(chip(),'ready|可突破 · '+next,'chip names the next realm');a.equal(glow(),true,'bar shimmer when ready');
a(run("(()=>{const c=document.getElementById('xtBreakChipV2868116'),k=Array.from(c.parentNode.children);return k[k.indexOf(c)-1]?.id})()")==='worldRealm','chip sits beside the realm line');
fresh('player.exp=getCurrentExpNeed()+5;player.breakthrough.cooldownDays=4.2');a.equal(cue(),'cooling');a.equal(chip(),'cooling|调息 5天');a.equal(glow(),false,'no shimmer while cooling');
fresh('player.level=CULTIVATION_REALMS.length-1;player.phase=3;player.exp=1e9');a.equal(cue(),'max');a.equal(chip(),'none');a.equal(glow(),false);
fresh('player.exp=getCurrentExpNeed();player.breakthrough.isAnimating=true');a.equal(cue(),'hidden','animating');a.equal(chip(),'none');
fresh('player.level=9;player.phase=3;player.exp=getCurrentExpNeed()');a.equal(cue(),'tribulation');a.equal(chip(),'tribulation|待渡天劫');
console.log('PASS chip states: below need, ready (next realm), cooling down, max, animating, tribulation');

// --- Hidden in battle, interiors, tutorial and dialogs ---
for(const [why,setup] of [['combat',"gameState='combat'"],['interior',"interiorV286886={id:'t'}"],['story dialog',"showStory('<p>测试</p>',[{text:'好',action:'close'}])"],['character panel',"toggleCharacterPanel(true)"],['tutorial',"tutorialState.active=true"]]){
 fresh('player.exp=getCurrentExpNeed()+1;'+setup);a.equal(chip(),'none',why);a.equal(glow(),false,why+': no shimmer');
 run("interiorV286886=null;tutorialState.active=false;gameState='exploring';closeWorldOverlay();toggleCharacterPanel(false)");
}
console.log('PASS chip and shimmer hidden in battle, interiors, tutorial and dialogs');

// --- Opens the existing screen, changes nothing ---
fresh('player.exp=getCurrentExpNeed()+7');chip();
const snap=()=>run('JSON.stringify([player.exp,player.level,player.phase,player.breakthrough.cooldownDays,player.gold,player.age])');const before=snap();
run("var __opened=0,__orig=showRetreatBreakthroughV2798;showRetreatBreakthroughV2798=function(){__opened++;return __orig.apply(this,arguments)}");
a.equal(run('breakthroughCueV2868116.open()'),true);a.equal(run('__opened'),1);a(run("document.getElementById('storyText').innerHTML").includes('闭关突破'),'existing breakthrough screen');
a.equal(run('breakthroughCueV2868116.open()'),false,'second tap while busy/dialog open does nothing');a.equal(run('__opened'),1);a.equal(snap(),before,'opening changes no state');
run('closeWorldOverlay()');fresh('player.exp=1');chip();a.equal(run('breakthroughCueV2868116.open()'),false,'stale chip after exp drop');
run('showRetreatBreakthroughV2798=__orig');
console.log('PASS chip opens the existing breakthrough screen once and changes no state');

// --- Success card: the DOM fixture cannot parse innerHTML; behaviour is covered by tests/browser/breakthrough-cue.spec.cjs.
const core=fs.readFileSync(root+'/xiantu-v2762-core.js','utf8');
a(/closeBreakthroughSuccess\(true\)\},5200\)/.test(core),'five-second auto-dismiss kept');
a(/animateBreakthroughSuccessV2868116\(panel\);\s*setTimeout/.test(core),'card animation starts before the auto-dismiss timer');
a(/xiantu_map_fx_v2868104'\)==='off'/.test(core.slice(core.indexOf('function breakthroughFxStillV2868116'))),'card honours effects off');
console.log('PASS success card keeps the five-second auto-dismiss and checks effects off');
