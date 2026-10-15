'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay()');f.timers.clear();const run=s=>f.run(s);
function fresh(kind='normal'){run(`resetRuntimeState();player=createDefaultPlayer();player.level=16;gameState='pets';player.worldTime.totalDays=10;player.petMaterials={'上古返祖灵珠':10,'深渊魔核':10,'魔魂晶':30};player.pets=[{_petId:'pity-test',name:'灵狐',type:'灵狐',level:80,growthStage:${kind==='divine'?5:4},isDemon:${kind==='demon'},intimacy:100,growthValue:100,proficiency:100,evolutionStage:2,perfectEvolution:true,mutationPerfect:true,mutationCount:1,mutationTier:'supreme',mutationTraits:[{name:'测试词条',key:'damage',value:.35}],baseStatMultiplier:2,skillDamageBonus:.4}];ensureAllPetGrowthV210();player.activePet=player.pets[0];globalThis.pet=player.pets[0];Math.random=()=>.999;showPetGrowthResultV210=()=>{};flashPetCardV210=()=>{};updatePetPanel=()=>{};updateStats=()=>{}`)}
const attempt=()=>run("ancestryPetByIdV210('pity-test')");
for(const kind of ['normal','divine','demon']){
 fresh(kind);const traits=run('JSON.stringify(pet.mutationTraits)'),mult=run('getPetGrowthCombatMultiplierV210(pet)');
 for(let i=0;i<3;i++){
  a.equal(run('getPetAncestryRateV210(pet)'),[.2,.45,.7][i]);a.equal(attempt(),true);
  a.equal(run('pet.ancestryPity'),i+1);a.equal(run('getPetCultivationLockV210(pet)'),3);a.equal(run('JSON.stringify(pet.mutationTraits)'),traits);a.equal(run('getPetGrowthCombatMultiplierV210(pet)'),mult);a.equal(run('pet.evolutionStage'),2);
  a.equal(attempt(),false,'cooldown prevents duplicate spend');
  run('player=normalizePlayer(loadGame().player);globalThis.pet=player.pets[0]');a.equal(run('pet.ancestryPity'),i+1);a.equal(run('player.activePet===pet'),true);
  run('player.worldTime.totalDays+=3');
 }
 a.equal(run('getPetAncestryRateV210(pet)'),1);a(run('renderPetGrowthMenuV210(pet).includes("本次必成")'));a.equal(attempt(),true);a.equal(run('pet.ancestryPity'),0);a.equal(run(kind==='demon'?'pet.abyssForm':'pet.ancestralAwakened'),true);a.equal(run('pet.baseStatMultiplier'),3.1);a.equal(attempt(),false);
 a.equal(run(`player.petMaterials['${kind==='demon'?'深渊魔核':'上古返祖灵珠'}']`),6);if(kind==='demon')a.equal(run("player.petMaterials['魔魂晶']"),18);
}
for(const pity of [0,1,2,3]){
 fresh();run(`pet.ancestryPity=${pity};globalThis.savedSave=saveGame;saveGame=()=>false`);const before=run('JSON.stringify(player)');a.equal(attempt(),false);a.equal(run('JSON.stringify(player)'),before);a.equal(run('player.activePet===pet'),true);run('saveGame=savedSave');a.equal(attempt(),true);
}
fresh();run("player.petMaterials={}");a.equal(attempt(),false);a.equal(run('pet.ancestryPity'),0);
for(const state of ['combat','combat-ending','start']){fresh();run(`gameState='${state}'`);const before=run('JSON.stringify(player)');a.equal(attempt(),false);a.equal(run('JSON.stringify(player)'),before)}
for(const [raw,expected] of [['undefined',0],['NaN',0],['Infinity',0],['-2',0],['2.8',2],['99',3]]){fresh();run(`pet.ancestryPity=${raw};ensurePetGrowthStateV210(pet)`);a.equal(run('pet.ancestryPity'),expected)}
fresh();run('globalThis.savedSave=saveGame;saveGame=()=>{globalThis.nested=ancestryPetByIdV210("pity-test");return savedSave()}');a.equal(attempt(),true);a.equal(run('nested'),false);run('saveGame=savedSave');
console.log('PASS pet ancestry pity: normal/divine/demon; four-attempt guarantee; protection; reload; costs; cooldown; rollback; reentry; legacy normalization');
