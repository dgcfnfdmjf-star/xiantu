'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.c.console.warn=()=>{};
const events=[],files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
// Observe real transaction effect wrappers, rather than replacing them after installation.
for(const file of files){
 if(file===files.at(-1))for(const name of ['showPetGrowthResultV210','flashPetCardV210','playSound','showFloatingText','updatePetPanel','updateArtifactPanel']){
  f.c[name]=(...args)=>events.push({name,args,persisted:f.storage.get('xiantu_save')});
 }
 f.load(file);
}
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`)),save=f.c.saveGame,setItem=f.c.localStorage.setItem;
function fresh(setup=''){
 f.c.saveGame=save;f.c.localStorage.setItem=setItem;f.c.confirm=()=>true;
 run(`resetRuntimeState();player=createDefaultPlayer();initAchievements();player.name='养成回归';player.level=16;player.gold=900000;gameState='pets';COMBAT_FINISH_V2764.settling=false;player.worldTime.totalDays=10;
 player.materials={'灵草':12,'兽骨':6,'星辰砂':100,'灵木':100};player.petMaterials={'灵兽丹':100,'变异灵晶':2,'纯净灵髓':2,'兽魂晶':10,'木灵液':10,'普通血脉精元':2};
 player.pets=[{_petId:'growth-tx',name:'灵狐',type:'灵狐',level:1,exp:0,growthStage:0,intimacy:40,growthValue:100,proficiency:100,vitality:100,baseStatMultiplier:1,skillDamageBonus:0,evolutionStage:0,mutationCount:0,mutationTraits:[]}];
 player.artifacts=[{name:'试炼飞剑',type:'飞剑',level:1}];player.activeArtifact=player.artifacts[0];ensureAllPetGrowthV210();player.activePet=player.pets[0];Math.random=()=>.2;${setup}
 ensureAllPetGrowthV210();globalThis.originalPet=player.pets[0];globalThis.originalArtifact=player.artifacts[0];saveGame();`);
 f.timers.clear();events.length=0;
}
const cases=[
 {name:'兽丹炼制',setup:'',action:"craftPetMaterialBatchV286846('basic',5)",check:()=>{a.equal(run("player.materials['灵草']"),2);a.equal(run("player.materials['兽骨']"),1);a.equal(run("player.petMaterials['灵兽丹']"),105);}},
 {name:'单次喂养',setup:'',action:"feedPetById('growth-tx','灵兽丹')",check:()=>{a.equal(run("player.petMaterials['灵兽丹']"),99);a.equal(run('player.pets[0].exp'),20);a.equal(run("player.pets[0].investmentV286846['灵兽丹']"),1);}},
 {name:'批量喂养',setup:'',action:"feedPetMaxByIdV286845('growth-tx','灵兽丹')",check:()=>{a.equal(run('player.pets[0].level'),10);a.equal(run("player.petMaterials['灵兽丹']"),32);a.equal(run("player.pets[0].investmentV286846['灵兽丹']"),68);}},
 {name:'进阶',setup:'player.pets[0].level=10;',action:"advancePetByIdV210('growth-tx')",check:()=>{a.equal(run('player.pets[0].growthStage'),1);a.equal(run('player.gold'),899700);a.equal(run("player.petMaterials['兽魂晶']"),9);a.equal(run("player.petMaterials['木灵液']"),9);}},
 {name:'变异',setup:'player.pets[0].growthStage=2;',action:"mutatePetByIdV210('growth-tx')",check:()=>{a.equal(run('player.pets[0].mutationCount'),1);a.equal(run('player.pets[0].mutationTraits.length'),1);a.equal(run("player.petMaterials['变异灵晶']"),1);a.equal(run("player.petMaterials['纯净灵髓']"),1);}},
 {name:'进化',setup:'player.pets[0].growthStage=3;player.pets[0].mutationCount=1;',action:"evolvePetByIdV210('growth-tx','普通血脉精元')",check:()=>{a.equal(run('player.pets[0].evolutionStage'),1);a.equal(run("player.petMaterials['普通血脉精元']"),1);a.equal(run("player.pets[0].investmentV286846['普通血脉精元']"),1);}},
 {name:'法宝强化',setup:'',action:'upgradeArtifact(0)',check:()=>{a.equal(run('player.artifacts[0].level'),2);a.equal(run('player.gold'),899900);a.equal(run("player.materials['星辰砂']"),99);a.equal(run("player.materials['灵木']"),99);}},
 {name:'法宝批量强化',setup:'',action:'upgradeArtifactMaxV286845(0)',check:()=>{a.equal(run('player.artifacts[0].level'),10);a.equal(run('player.gold'),895500);a.equal(run("player.materials['星辰砂']"),55);a.equal(run("player.materials['灵木']"),55);}}
];
for(const c of cases){
 for(const failure of ['false','throw','quota']){
  fresh(c.setup);const before=run('JSON.stringify(player)'),achievement=run('JSON.stringify([achievementProgress,[...completedAchievements]])'),disk=f.storage.get('xiantu_save');
  if(failure==='quota')f.c.localStorage.setItem=()=>{throw Error('QuotaExceededError');};
  else f.c.saveGame=()=>{if(run('miniSaveDeferredV286840'))return true;if(failure==='throw')throw Error('save unavailable');return false;};
  run(c.action);
  a.deepEqual(json('player'),JSON.parse(before),`${c.name}/${failure}: exact state restored`);
  a.equal(run('JSON.stringify([achievementProgress,[...completedAchievements]])'),achievement,`${c.name}/${failure}: achievements restored`);
  a.equal(run('player.pets[0]===originalPet&&player.activePet===originalPet'),true,`${c.name}/${failure}: active pet identity preserved`);
  a.equal(run('player.artifacts[0]===originalArtifact&&player.activeArtifact===originalArtifact'),true,`${c.name}/${failure}: equipped artifact identity preserved`);
  a.equal(f.storage.get('xiantu_save'),disk,`${c.name}/${failure}: last durable save unchanged`);
  a(!events.some(e=>['showPetGrowthResultV210','flashPetCardV210','playSound'].includes(e.name)),`${c.name}/${failure}: no result/animation/audio before persistence`);
  a(!events.some(e=>e.name==='showFloatingText'&&/🧪|🍖|强化成功|连续强化/.test(e.args[0])),`${c.name}/${failure}: no success toast`);
  a.equal(run('ITEM_ACTION_V2905.depth'),0);a.equal(run('miniSaveDeferredV286840'),false);
 }
 fresh(c.setup);let writes=0;f.c.localStorage.setItem=(key,value)=>{if(key==='xiantu_save')writes++;return setItem(key,value);};
 run(c.action);f.c.localStorage.setItem=setItem;c.check();a.equal(writes,1,c.name+': one durable commit');
 const persisted=JSON.parse(f.storage.get('xiantu_save')).player;
 a.deepEqual(persisted.pets,json('player.pets'));a.deepEqual(persisted.artifacts,json('player.artifacts'));a.equal(persisted.gold,run('player.gold'));
 for(const effect of events.filter(e=>['showPetGrowthResultV210','flashPetCardV210','playSound'].includes(e.name)))a.equal(effect.persisted,f.storage.get('xiantu_save'),c.name+': success UI follows durable commit');
 for(const state of ['start','combat','combat-ending','breakthrough','settling']){
  fresh(c.setup);run(state==='breakthrough'?'player.breakthrough={isAnimating:true}':state==='settling'?'COMBAT_FINISH_V2764.settling=true':`gameState=${JSON.stringify(state)}`);
  const raw=run('JSON.stringify(player)');events.length=0;run(c.action);a.equal(run('JSON.stringify(player)'),raw,c.name+': blocked in '+state);a.equal(events.length,0,c.name+': no effects in '+state);
 }
}
console.log('PASS eight cultivation actions: false/throw/quota rollback, original pet/artifact identity, durable save and success effect ordering, unchanged costs, and state guards');

// Failure of a random cultivation roll is a valid paid result, unlike failure to persist it.
fresh('player.pets[0].level=10;Math.random=()=>.999;');run("advancePetByIdV210('growth-tx')");a.equal(run('player.pets[0].growthStage'),0);a.equal(run('player.pets[0].level'),5);a.equal(run('player.pets[0].advanceCooldownUntilDay'),10.5);a.equal(run('player.gold'),899700);
fresh('player.pets[0].growthStage=2;Math.random=()=>.999;');run("mutatePetByIdV210('growth-tx')");a.equal(run('player.pets[0].mutationCount'),1);a.equal(run('player.pets[0].mutationTraits.length'),0);a.equal(run("player.petMaterials['变异灵晶']"),1);
fresh('player.pets[0].growthStage=3;player.pets[0].mutationCount=1;player.pets[0].evolutionStage=1;player.pets[0].bloodlineValue=100;Math.random=()=>.999;');run("evolvePetByIdV210('growth-tx','普通血脉精元')");a.equal(run('player.pets[0].evolutionStage'),0);a.equal(run('player.pets[0].evolutionCooldownUntilDay'),13);a.equal(run("player.petMaterials['普通血脉精元']"),1);
fresh();let reentered=false;f.c.saveGame=()=>{if(run('miniSaveDeferredV286840'))return true;reentered=run("craftPetMaterialBatchV286846('basic',1)");return save();};run('upgradeArtifact(0)');a.equal(reentered,false);a.equal(run("player.materials['灵草']"),12);a.equal(run("player.petMaterials['灵兽丹']"),100);a.equal(run('player.artifacts[0].level'),2);
// The low-level rollback also covers achievement changes and an exception after spending.
fresh();const raw=run('JSON.stringify(player)'),ach=run('JSON.stringify([achievementProgress,[...completedAchievements]])');
a.equal(run("itemActionV2905('异常养成',()=>{player.gold--;player.pets[0].level++;achievementProgress.auditGrowth=1;completedAchievements.add('auditGrowth');throw Error('interrupted')})"),false);
a.equal(run('JSON.stringify(player)'),raw);a.equal(run('JSON.stringify([achievementProgress,[...completedAchievements]])'),ach);a.equal(run('player.activePet===originalPet'),true);
console.log('PASS failed random rolls retain original costs/cooldowns, save-time reentry is rejected, and exceptions restore achievements with pet alias intact');
