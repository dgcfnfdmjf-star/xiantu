'use strict';
// In-game dialog: Node sandbox falls back to (stubbed) native dialogs synchronously; converted sites keep confirm/cancel semantics.
const fs=require('node:fs'),a=require('node:assert/strict'),fixture=require('./v2858-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const src=f=>fs.readFileSync(root+'/'+f,'utf8');
// Converted call sites no longer use native dialogs.
a.match(src('game-v2762.html'),/buildBadge\.onclick=function\(\)\{window\.gameAlertV2868114\(/);
a.doesNotMatch(src('xiantu-v2762-04-tutorial-guide-script.js'),/\bconfirm\(/);
a.doesNotMatch(src('xiantu-v2849-npc-jev.js'),/window\.confirm\(/);
a.doesNotMatch(src('xiantu-v2762-15-petgrowthsystemv210.js'),/\bprompt\(`/);
a.doesNotMatch(src('xiantu-v2768-systems.js'),/(^|[^\w.])(alert|confirm|prompt)\(/m,'save manager and boss abandon use the in-game dialog');
a.doesNotMatch(src('xiantu-v2762-core.js').split('V28.68.114 青绿鎏金 in-game dialog')[1],/innerHTML/);
for(const file of ['xiantu-v2839-war.js','xiantu-v2838-journey.js'])a.doesNotMatch(src(file),/(^|[^\w.])(alert|confirm|prompt)\(/m,file+' uses the in-game dialog');
const f=fixture(root);for(const file of JSON.parse(src('game-v2762.html').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay();');f.timers.clear();
// Fallback: confirm result is delivered synchronously; cancel runs no action.
let asked=[];f.c.confirm=m=>{asked.push(m);return false;};
a.equal(f.run('let hit=0;gameConfirmV2868114("测试",()=>hit++);hit'),0);a.deepEqual(asked,['测试']);
f.c.confirm=()=>true;a.equal(f.run('hit=0;gameConfirmV2868114("测试",()=>hit++);hit'),1);
f.c.prompt=()=>null;a.equal(f.run('gamePromptV2868114("名",\'旧\',v=>v)'),null);
// Tutorial skip: cancel keeps tutorial state, accept skips once.
f.run('clearTutorialStepClasses=()=>{};ensureTutorialState().skipped=false;ensureTutorialState().completedSteps=[];');
f.c.confirm=()=>false;f.run('skipAllTutorial()');a.equal(f.run('ensureTutorialState().skipped'),false);
const gold=f.run('player.gold');f.c.confirm=()=>true;f.run('skipAllTutorial()');a.equal(f.run('ensureTutorialState().skipped'),true);a.equal(f.run('player.gold'),gold+120);
// Keyed one-shot confirm: sandbox cancel runs nothing, accept runs once and returns the callback result.
f.c.confirm=()=>false;a.equal(f.run('hit=0;gameConfirmOnceV2868114("k","测试",()=>++hit)'),false);a.equal(f.run('hit'),0);
f.c.confirm=()=>true;a.equal(f.run('gameConfirmOnceV2868114("k","测试",()=>++hit)'),1);a.equal(f.run('gameConfirmOnceV2868114("k","测试",()=>++hit)'),2,'the key is released after each answer');
// Pet rename via gamePromptV2868114 is covered by v2870-test-pet-contract (cancel, invalid, save failure, success).
console.log('PASS in-game dialog fallback, cancel/no-action, tutorial skip');
