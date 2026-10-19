'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),intervals=new Map();let sequence=100000;
f.c.setInterval=(fn,delay)=>{const id=++sequence;intervals.set(id,{fn,delay});return id};f.c.clearInterval=id=>intervals.delete(id);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.c.document.body.classList[Symbol.iterator]=()=>f.c.document.body._classes.values();
const run=s=>f.run(s);run('startGame();closeWorldOverlay()');const save=f.c.saveGame;
function fresh(){f.c.saveGame=save;f.c.confirm=()=>true;run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.level=7;player.gold=100000;updateStats=()=>{};updateWorldHUD=()=>{};updatePetPanel=()=>{};");f.timers.clear();}
const snapshot=()=>run('JSON.stringify(player)');
// Completed / paused / beyond-intro saves must not recreate the persistent entry.
for(const state of [{step:5},{step:2,paused:true},{step:1}]){
 fresh();run(`player.level=${state.step===1?2:0};player.firstJourneyV28687=${JSON.stringify(state)};syncFirstJourneyV28687()`);a.equal(f.ids.has('firstJourneyV28687'),false);
}
fresh();run("player.level=0;player.firstJourneyV28687={step:2};syncFirstJourneyV28687()");a(f.ids.has('firstJourneyV28687'));
run('leaveFirstJourneyV28687();syncFirstJourneyV28687();showHelpManual()');a(!f.ids.has('firstJourneyV28687'));a(f.ids.get('helpManual').innerHTML.includes('继续初入仙途'));
run('beginFirstJourneyV28687()');a.equal(run('player.firstJourneyV28687.paused'),false);a.equal(run('player.firstJourneyV28687.step'),2);a(f.ids.has('firstJourneyV28687'));
run('player.firstJourneyV28687.step=4;actFirstJourneyV28687(4)');a(!f.ids.has('firstJourneyV28687'));
fresh();run("player.level=0;player.firstJourneyV28687={step:0};finishFirstJourneyBattleV28687({hp:0,_firstJourneyStepV28687:0});leaveFirstJourneyV28687()");
const showJourney=f.c.showFirstJourneyV28687;let reopened=0;f.c.showFirstJourneyV28687=()=>{reopened++};f.flush(1800);a.equal(reopened,0,'pausing cancels pending victory prompt');f.c.showFirstJourneyV28687=showJourney;
// Every recipe batch equals repeated original-sized operations; all means all, even >999.
for(const id of ['basic','high','immortal'])for(const count of [1,5,1001]){
 fresh();run(`player.materials=Object.fromEntries(Object.entries(PET_MATERIAL_RECIPES.${id}.materials).map(([n,c])=>[n,c*${count}]));player.petMaterials={}`);
 a.equal(run(`craftPetMaterialBatchV286846('${id}',${count===1001?"'all'":count})`),true);
 a.equal(run(`player.petMaterials[PET_MATERIAL_RECIPES.${id}.output]`),count);a.equal(run('Object.keys(player.materials).length'),0);
}
fresh();run("player.materials={'灵草':8,'兽骨':4};player.petMaterials={}");let before=snapshot();a.equal(run("craftPetMaterialBatchV286846('basic',5)"),false);a.equal(snapshot(),before);
for(const mode of ['-1','2','1.5','NaN','Infinity',"'5'"]){before=snapshot();a.equal(run(`craftPetMaterialBatchV286846('basic',${mode})`),false);a.equal(snapshot(),before)}
a.equal(run("craftPetMaterialBatchV286846('__proto__',1)"),false);
for(const state of ['combat','combat-ending','start']){run(`gameState='${state}'`);before=snapshot();a.equal(run("craftPetMaterialRecipe('basic')"),false);a.equal(snapshot(),before)}
// Prices remain below all actual shop catalogue purchase prices; upper tiers now increase.
fresh();a.equal(run('Object.entries(EQUIPMENT_DB).filter(([n,d])=>d.priceV2790&&getDismantleValue(n)>=d.priceV2790).length'),0);
const prices=run("['IMMORTAL','TIAN_QI','SHENG_QI','DAO_QI'].map(q=>getDismantleValue(Object.keys(EQUIPMENT_DB).find(n=>EQUIPMENT_DB[n].quality===q)))");for(let i=1;i<prices.length;i++)a(prices[i]>prices[i-1]);
run("player.level=0");a.equal(run("setEquipmentDismantleQuality('LING_PIN')"),false);
run("player.level=3");a.equal(run("setEquipmentDismantleQuality('LING_PIN')"),true);a.equal(run("setEquipmentDismantleQuality('BAO_QI')"),false);
run("player.level=7");a.equal(run("setEquipmentDismantleQuality('BAO_QI')"),true);
run("globalThis.gear=newGearNameV2790('万象玄霆',0,2);player.equipmentInventory=[gear,gear,gear];player.equipmentLocks=[];ensureEquipmentManagerState()");
a.equal(run('getBulkDismantlePreview().count'),2,'one better/set piece protected');const gold=run('player.gold');a.equal(run('bulkDismantleEquipment()'),true);a.equal(run('player.equipmentInventory.length'),1);a.equal(run('player.gold')-gold,run('getDismantleValue(gear)')*2);
run('player.equipmentInventory=[gear,gear];player.equipmentLocks=[gear]');a.equal(run('getBulkDismantlePreview().count'),0);
run("player.equipmentLocks=[];gameState='combat'");before=snapshot();a.equal(run('bulkDismantleEquipment()'),false);a.equal(snapshot(),before);
// Ledger tracks spent food, not XP or captured quality; survives normalization and cannot pay twice.
fresh();run("player.pets=[{_petId:'refund',name:'灵狐',type:'灵狐',level:1,growthStage:5}];ensureAllPetGrowthV210();player.activePet=player.pets[0];player.petMaterials={'灵兽丹':10};feedPetMaxByIdV286845('refund','灵兽丹')");
a.equal(run("player.pets[0].investmentV286846['灵兽丹']"),10);a.equal(run("getPetReleaseRefundV286846(player.pets[0])['灵兽丹']"),8);
run('player=normalizePlayer(JSON.parse(JSON.stringify(player)));gameState="exploring"');a.equal(run("player.pets[0].investmentV286846['灵兽丹']"),10);a.equal(run('player.activePet===player.pets[0]'),true);
f.c.confirm=()=>false;before=snapshot();a.equal(run("releasePetById('refund')"),false);a.equal(snapshot(),before);
f.c.confirm=()=>true;f.c.saveGame=()=>false;before=snapshot();a.equal(run("releasePetById('refund')"),false);a.equal(snapshot(),before,'failed save restores pet, active link, HP and resources');
f.c.saveGame=save;a.equal(run("releasePetById('refund')"),true);a.equal(run('player.pets.length'),0);a.equal(run('player.activePet'),null);a.equal(run("player.petMaterials['灵兽丹']"),8);before=snapshot();a.equal(run("releasePetById('refund')"),false);a.equal(snapshot(),before);
fresh();run("player.pets=[{_petId:'legacy',name:'灵狐',type:'灵狐',level:80,growthStage:5,exp:2000,mutationCount:5}];ensureAllPetGrowthV210();grantPetExpV210(player.pets[0],1000)");a.equal(run('Object.keys(getPetReleaseRefundV286846(player.pets[0])).length'),0);
run("player.pets[0].bondType='soul';player.activePet=player.pets[0]");a.equal(run("releasePetById('legacy')"),true);a.equal(run('player.hp'),run('Math.max(1,Math.floor(getMaxHp()*.30))'));
// Failed cultivation spends are recorded, failed ancestry persistence restores the ledger too.
fresh();run("player.pets=[{_petId:'growth',name:'灵狐',type:'灵狐',level:30,growthStage:2}];ensureAllPetGrowthV210();player.petMaterials={'变异灵晶':5,'纯净灵髓':5};globalThis.originalRandom=Math.random;Math.random=()=>.99");
for(let i=0;i<5;i++)run("mutatePetByIdV210('growth')");a.equal(run("getPetReleaseRefundV286846(player.pets[0])['变异灵晶']"),4);a.equal(run("getPetReleaseRefundV286846(player.pets[0])['纯净灵髓']"),4);run('Math.random=originalRandom');
run("player.pets[0].growthStage=5;player.pets[0].level=getPetLevelCapV210(player.pets[0]);player.pets[0].growthValue=100;player.pets[0].proficiency=100;player.pets[0].intimacy=100;player.petMaterials['上古返祖灵珠']=5");
f.c.saveGame=()=>false;before=run('JSON.stringify([getPetInvestmentV286846(player.pets[0]),player.petMaterials])');a.equal(run("ancestryPetByIdV210('growth')"),false);a.equal(run('JSON.stringify([getPetInvestmentV286846(player.pets[0]),player.petMaterials])'),before);
// Real progress callbacks are owned by the original player and enemy through the final 220ms.
function capture(){fresh();run("player.inventory=['灵兽绳'];startCombat({name:'灵纹野兔',hp:5,maxHp:100,atk:1,def:0,gold:0,exp:0});isPlayerTurn=true;attemptCapture(currentEnemy)");const id=run('captureRunV286846.timer');return {id,tick:intervals.get(id).fn};}
for(const mutate of ['resetRuntimeState()','currentEnemy={...currentEnemy}',"gameState='exploring'",'player=createDefaultPlayer()',"document.getElementById('captureProgressV29').remove()"]){
 const {id,tick}=capture();run('globalThis.captureOwner=player');run(mutate);tick();f.flush(220);a(!intervals.has(id));a.equal(run('captureRunV286846'),null);a(!f.ids.has('captureProgressV29'));a.equal(run('captureOwner.pets.length'),0);a.equal(run('captureOwner.inventory.length'),1);a.equal(run('captureOwner.petCapture.isCapturing'),false);
}
let {tick}=capture();for(let i=0;i<50;i++)tick();a(run('captureRunV286846.finishTimer')!=null);run('resetRuntimeState()');f.flush(220);a.equal(run('player.pets.length'),0);a.equal(run('player.inventory.length'),1);
({tick}=capture());for(let i=0;i<50;i++)tick();run('originalRandom=Math.random;Math.random=()=>0');f.flush(220);run('Math.random=originalRandom');a.equal(run('player.pets.length'),1);a.equal(run('player.inventory.length'),0);a.equal(run('gameState'),'exploring');a.equal(run('captureRunV286846'),null);f.flush(220);a.equal(run('player.pets.length'),1);
// Failed captures consume exactly one item and retain the existing enemy-turn path.
({tick}=capture());for(let i=0;i<50;i++)tick();run('originalRandom=Math.random;Math.random=()=>.999');f.flush(220);run('Math.random=originalRandom');a.equal(run('player.pets.length'),0);a.equal(run('player.inventory.length'),0);a.equal(run('player.petCapture.isCapturing'),false);a.equal(run('gameState'),'combat');a([...f.timers.values()].some(t=>t.delay===650));
// Bonding survives capture-state normalization while the progress bar is running.
fresh();run("player.inventory=['神兽结缘印'];player.heartDemon.attachment=0;startCombat({name:'九尾灵狐',hp:5,maxHp:100,atk:1,def:0,gold:0,exp:0});isPlayerTurn=true;attemptCapture(currentEnemy);ensurePetCaptureState()");
tick=intervals.get(run('captureRunV286846.timer')).fn;for(let i=0;i<50;i++)tick();f.flush(220);a.equal(run('player.pets.length'),1);a.equal(run('player.petCapture.isCapturing'),false);a(run("player.petCapture.bondedBeasts.includes('九尾灵狐')"));a.equal(run('player.activePet===player.pets[0]'),true);
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS cultivation safety: guide lifecycle, 9 batch recipes, catalogue economics, salvage gates/protection, recorded refunds/save rollback, capture timer ownership and completion');
