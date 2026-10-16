'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),intervals=new Map();let intervalId=100000;
f.c.setInterval=(fn,delay)=>{const id=++intervalId;intervals.set(id,{fn,delay});return id};f.c.clearInterval=id=>intervals.delete(id);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.c.document.body.classList[Symbol.iterator]=()=>f.c.document.body._classes.values();
const run=s=>f.run(s);run('startGame();closeWorldOverlay()');
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();player.tutorial.skipped=false;player.level=4;player.phase=0;gameState='exploring';updatePetPanel=()=>{};updateArtifactPanel=()=>{};updateStats=()=>{};updateWorldHUD=()=>{};");f.timers.clear();}
function snapshot(){return run('JSON.stringify(player)')}
// Batch artifact costs equal repeating the existing +1 action, including the last affordable level.
for(const gold of [0,99,100,600,4500,100000]){
 fresh();run(`player.artifacts=[{name:'试炼飞剑',type:'飞剑',level:1}];player.gold=${gold};player.materials=Object.fromEntries(Object.keys(ARTIFACT_TYPES['飞剑'].upgradeCost).filter(n=>n!=='灵石').map(n=>[n,45]))`);const saved=snapshot();
 run('upgradeArtifactMaxV286845(0)');if(gold===600)a.equal(run('player.artifacts[0].level'),4);if(gold===100000)a.equal(run('player.artifacts[0].level'),10);const batch=run('JSON.stringify([player.gold,player.materials,player.artifacts])');
 run(`player=JSON.parse(${JSON.stringify(saved)});for(let i=0;i<12;i++){if(canUpgradeArtifact(player.artifacts[0]))upgradeArtifact(0);}`);
 a.equal(run('JSON.stringify([player.gold,player.materials,player.artifacts])'),batch);
}
for(const state of ['combat','combat-ending']){fresh();run(`player.artifacts=[{name:'飞剑',type:'飞剑',level:1}];player.gold=99999;player.materials={'星辰砂':99};gameState='${state}'`);const before=snapshot();a.equal(run('upgradeArtifactMaxV286845(0)'),false);a.equal(snapshot(),before);}
// Per-food growth, proficiency, intimacy, stats and cap overflow match individual feed actions.
for(const food of ['灵果','灵兽丹','高级灵兽丹','仙兽丹'])for(const realm of [0,4,16])for(const stage of [0,4,5]){
 fresh();run(`player.level=${realm};player.pets=[{_petId:'batch-pet',name:'灵狐',type:'灵狐',level:1,exp:0,growthStage:${stage}}];ensureAllPetGrowthV210();player.activePet=player.pets[0];player.petMaterials={${JSON.stringify(food)}:10000};globalThis.used=getPetFeedPlanV286845(player.pets[0],${JSON.stringify(food)}).count`);
 const saved=snapshot(),count=run('used');a(count>0);run(`feedPetMaxByIdV286845('batch-pet',${JSON.stringify(food)})`);const batch=run('JSON.stringify([player.pets,player.petMaterials])');
 run(`player=JSON.parse(${JSON.stringify(saved)});for(let i=0;i<used;i++)feedPet(0,${JSON.stringify(food)});`);a.equal(run('JSON.stringify([player.pets,player.petMaterials])'),batch);a.equal(run('player.pets[0].level'),run('getPetLevelCapV210(player.pets[0])'));
}
fresh();run("player.pets=[{_petId:'batch-pet',name:'灵狐',type:'灵狐',level:1}];ensureAllPetGrowthV210();player.petMaterials={'灵兽丹':2};");a.equal(run("feedPetMaxByIdV286845('missing','灵兽丹')"),false);
run("player.pets[0].cultivationLockUntilDay=petGameDayV210()+3");let before=snapshot();a.equal(run("feedPetMaxByIdV286845('batch-pet','灵兽丹')"),false);a.equal(snapshot(),before);
run("player.pets[0].cultivationLockUntilDay=0;gameState='combat'");before=snapshot();a.equal(run("feedPetMaxByIdV286845('batch-pet','灵兽丹')"),false);a.equal(snapshot(),before);
// Catalog prices and realm gates apply again at mutation time, independent of UI arguments.
fresh();run("player.gold=10000;player.petMaterials={}");for(const count of [1,5,10])a.equal(run(`buyPetGrowthBatchV286845('灵果',${count})`),true);a.equal(run('player.gold'),10000-16*80);a.equal(run("player.petMaterials['灵果']"),16);
for(const expr of ["buyPetGrowthBatchV286845('灵果',-1)","buyPetGrowthBatchV286845('灵果',1.5)","buyPetGrowthBatchV286845('上古返祖灵珠',1)","buyPetGrowthBatchV286845('深渊魔核',1)"]){before=snapshot();a.equal(run(expr),false);a.equal(snapshot(),before)}
run("player.level=0;player.maxRealm=0");before=snapshot();a.equal(run("buyPetGrowthBatchV286845('优质血脉精元',1)"),false);a.equal(snapshot(),before);
run('player.gold=799');before=snapshot();a.equal(run("buyPetGrowthBatchV286845('灵果',10)"),false);a.equal(snapshot(),before);
// Tutorial reset, enemy replacement, loaded-role replacement and delayed victory ownership.
function train(){fresh();run('startTutorialTraining()');return intervals.get(run('tutorialState.trainingWatcher')).fn;}
let tick=train();run('startTutorialTraining()');const newWatcher=run('tutorialState.trainingWatcher');tick();a.equal(run('tutorialState.trainingWatcher'),newWatcher,'stale watcher cannot cancel a newer run');run('resetRuntimeState()');a.equal(run('tutorialState.trainingWatcher'),null);a.equal(run('tutorialTrainingRunV286845'),null);
tick=train();run('currentEnemy={...currentEnemy}');tick();a.equal(run('tutorialState.trainingWatcher'),null);
tick=train();run('currentEnemy.hp=0');tick();run('player=createDefaultPlayer()');f.flush(900);a(!run("player.tutorial.readPopups.includes('training_reward')"));
tick=train();run("currentEnemy.hp=0;beginCombatFinishV2764('victory');completeCombatFinishV2764()");tick();f.flush(900);a(run("player.tutorial.readPopups.includes('training_reward')"));f.flush(760);a.equal(run('tutorialState.currentStepId'),'equipment');
const gold=run('player.gold'),exp=run('player.exp');run('restartTutorial();grantTutorialTrainingReward()');a.equal(run('player.gold'),gold);a.equal(run('player.exp'),exp);
// A cancelled premium capture keeps the turn, inventory, RNG and capture flags intact.
fresh();run("player.inventory=['御灵葫芦'];startCombat({name:'灵纹野兔',hp:5,maxHp:100,atk:1,def:0,gold:0,exp:0});isPlayerTurn=true;");let prompts=0;f.c.confirm=()=>{prompts++;return false};run('ensurePetCaptureState()');before=run('JSON.stringify([player.inventory,isPlayerTurn,player.petCapture.isCapturing,currentEnemy.hp])');a.equal(run('attemptCapture(currentEnemy)'),false);a.equal(prompts,1);a.equal(run('JSON.stringify([player.inventory,isPlayerTurn,player.petCapture.isCapturing,currentEnemy.hp])'),before);
f.c.confirm=()=>{prompts++;return true};run('attemptCapture(currentEnemy)');a.equal(run('player.petCapture.isCapturing'),true);a.equal(prompts,2);run('attemptCapture(currentEnemy)');a.equal(prompts,2,'in-flight capture does not prompt again');
fresh();run("player.inventory=['灵兽绳','御灵葫芦'];startCombat({name:'灵纹野兔',hp:5,maxHp:100,atk:1,def:0,gold:0,exp:0});isPlayerTurn=true;");run('attemptCapture(currentEnemy)');a.equal(prompts,2,'cheapest suitable item skips warning');a.equal(run('player.petCapture.usedItem'),'灵兽绳');
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS cultivation batch: original upgrade/feed parity, caps, stock/cost/realm guards, tutorial timers and once-only rewards, premium capture cancellation and item priority');
