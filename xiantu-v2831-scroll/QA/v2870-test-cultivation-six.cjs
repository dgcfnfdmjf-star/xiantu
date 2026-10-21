const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),save=f.c.saveGame;
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.level=4;player.gold=10000");f.c.saveGame=save;f.c.confirm=()=>true;}
fresh();
for(const key of run('Object.keys(PET_SYNTH_RECIPES_V2870)')){
 f.c.recipeKey=key;run('player.petMaterials={...PET_SYNTH_RECIPES_V2870[recipeKey].inputs}');const gold=run('player.gold'),cost=run('PET_SYNTH_RECIPES_V2870[recipeKey].gold');
 a.equal(run('synthesizePetMatV2870(recipeKey)'),true);a.equal(run('player.gold'),gold-cost);a.equal(run('player.petMaterials[recipeKey]'),1);a.equal(run('synthesizePetMatV2870(recipeKey)'),false);
}
for(const key of run('Object.keys(MAT_REFINE_RECIPES_V2870)')){f.c.recipeKey=key;run('player.materials={...MAT_REFINE_RECIPES_V2870[recipeKey]}');a.equal(run('refineMaterialV2870(recipeKey)'),true);a.equal(run('player.materials[recipeKey]'),1);a.equal(run('refineMaterialV2870(recipeKey)'),false);}
run("player.petMaterials={'普通血脉精元':3};player.materials={'仙果':2,'灵草':5};ensurePetCaptureState();player.petCapture.killedBabyBeast=true;player.heartDemon.attachment=60");
let before=run('JSON.stringify(player)');f.c.saveGame=()=>false;
a.equal(run("synthesizePetMatV2870('优质血脉精元')"),false);a.equal(run("refineMaterialV2870('仙灵草')"),false);a.equal(run('cleanseBeastKarmaV2870()'),false);a.equal(run('JSON.stringify(player)'),before);f.c.saveGame=save;
f.c.confirm=()=>false;a.equal(run('cleanseBeastKarmaV2870()'),false);a.equal(run('JSON.stringify(player)'),before);f.c.confirm=()=>true;a.equal(run('cleanseBeastKarmaV2870()'),true);a.equal(run('player.heartDemon.attachment'),20);a.equal(run('player.petCapture.killedBabyBeast'),false);a.equal(run('cleanseBeastKarmaV2870()'),false);
fresh();run("player.equipment.weapon='铁剑';player.equipmentInventory=['灵剑'];ensureSkillLoadoutV212()");a.equal(run('saveLoadoutPresetV2870(0)'),true);
run("player.equipment.weapon='灵剑';player.equipmentInventory=['铁剑']");a.equal(run('applyLoadoutPresetV2870(0)'),true);a.equal(run('player.equipment.weapon'),'铁剑');a.equal(run('player.equipmentInventory[0]'),'灵剑');
run("player.equipment.weapon='灵剑';player.equipmentInventory=[]");before=run('JSON.stringify(player)');a.equal(run('applyLoadoutPresetV2870(0)'),false);a.equal(run('JSON.stringify(player)'),before);
run("player.equipmentInventory=['铁剑']");before=run('JSON.stringify(player)');f.c.saveGame=()=>false;a.equal(run('applyLoadoutPresetV2870(0)'),false);a.equal(run('JSON.stringify(player)'),before);f.c.saveGame=save;
run("player.loadoutPresetsV2870[0].equipment.robe='铁剑'");before=run('JSON.stringify(player)');a.equal(run('applyLoadoutPresetV2870(0)'),false);a.equal(run('JSON.stringify(player)'),before);
a.equal(run('saveLoadoutPresetV2870(-1)'),false);a.equal(run('applyLoadoutPresetV2870(3)'),false);
fresh();run("player.fieldAidV2870={mercy:true,heal:true};player.hp=1;player.inventory=['小还丹','大还丹'];currentEnemy={name:'火凤幼崽',hp:0,maxHp:100};currentMonsterRef={};gameState='combat';isPlayerTurn=false");a.equal(run('mercyBabyV2870()'),true);a.equal(run('currentEnemy.hp'),1);a.equal(run('isPlayerTurn'),true);run('currentEnemy.hp=0');a.equal(run('mercyBabyV2870()'),false);
run('currentEnemy._mercySavedV2870=false;isBossFight=true');a.equal(run('mercyBabyV2870()'),false);
fresh();run("player.fieldAidV2870={heal:true};player.hp=1;player.inventory=['小还丹'];startCombat({name:'野狼',hp:200,maxHp:200,atk:5,def:1},false,false,{})");a.equal(run('player.inventory.length'),0);a.equal(run('player.hp'),31);a.equal(run('JSON.parse(battleCheckpointV286812.raw).player.inventory.length'),1);a.equal(run('JSON.parse(battleCheckpointV286812.raw).player.hp'),1);a.equal(run('startCombat({name:"野狼"})'),false);
fresh();run("player.hp=1;player.inventory=['小还丹'];startCombat({name:'野狼',hp:200,maxHp:200,atk:5,def:1},false,false,{})");a.equal(run('player.inventory.length'),1);
for(const state of ['combat','combat-ending','start']){fresh();run(`gameState='${state}'`);before=run('JSON.stringify(player)');for(const cmd of ["synthesizePetMatV2870('优质血脉精元')","refineMaterialV2870('仙灵草')","cleanseBeastKarmaV2870()","saveLoadoutPresetV2870(0)","applyLoadoutPresetV2870(0)"])a.equal(run(cmd),false);a.equal(run('JSON.stringify(player)'),before);}
fresh();run("player.equipment.weapon='铁剑';player.equipmentInventory=['灵剑'];saveLoadoutPresetV2870(0);player.equipment.weapon='灵剑';player.equipmentInventory=['铁剑'];player.equipmentLocks=['灵剑']");before=run('JSON.stringify(player)');a.equal(run('applyLoadoutPresetV2870(0)'),false);a.equal(run('JSON.stringify(player)'),before);
run("player.equipmentLocks=[];player.loadoutPresetsV2870[0].skills={sword:['御剑术','御剑术','不存在'],fire:['御剑术']}");a.equal(run('applyLoadoutPresetV2870(0)'),true);a.equal(run('player.skillLoadoutV212.sword.join()'),'御剑术');a.equal(run('player.skillLoadoutV212.fire.length'),0);run('player=normalizePlayer(JSON.parse(JSON.stringify(player)))');a.equal(run('applyLoadoutPresetV2870(0)'),true);
fresh();run("player.fieldAidV2870={mercy:true};ensurePetCaptureState();player.hp=50;currentEnemy={name:'火凤幼崽',hp:0,maxHp:100};currentMonsterRef={};gameState='combat';isPlayerTurn=false;checkBattleEnd()");a.equal(run('currentEnemy.hp'),1);a.equal(run('player.petCapture.killedBabyBeast'),false);a.equal(run('gameState'),'combat');
fresh();run("player.breakthrough.isAnimating=true");a.equal(run('saveLoadoutPresetV2870(0)'),false);a.equal(run("synthesizePetMatV2870('优质血脉精元')"),false);
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS recipes/costs, karma cancellation/rollback, exact loadouts/count conservation/failure, field aids opt-in/exclusions, prebattle checkpoint and state guards');
