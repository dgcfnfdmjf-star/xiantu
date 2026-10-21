'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s);run("startGame();closeWorldOverlay();player=createDefaultPlayer();gameState='exploring';player.level=4;player.pets=[{_petId:'pet_test',type:'灵狐',name:'小狐',level:1,bondType:'blood'}];player.activePet=player.pets[0];ensureAllPetGrowthV210();player.inventory=['平等契约符','平等契约符','本命契约石'];");
let confirms=0;f.c.confirm=()=>{confirms++;return false;};const inv=run('JSON.stringify(player.inventory)');a.equal(run("changePetBondById('pet_test','equal')"),false);a.equal(run('JSON.stringify(player.inventory)'),inv);
f.c.confirm=()=>{confirms++;return true;};a.equal(run("changePetBondById('pet_test','equal')"),true);a.equal(run('player.inventory.length'),2);const n=confirms;
a.equal(run("changePetBondById('pet_test','equal')"),false);a.equal(run("changePetBondById('pet_test','blood')"),false);a.equal(confirms,n);a.equal(run('player.inventory.length'),2);
const save=f.c.saveGame;f.c.saveGame=()=>false;a.equal(run("changePetBondById('pet_test','soul')"),false);a.equal(run('player.activePet.bondType'),'equal');a.equal(run('player.inventory.length'),2);f.c.saveGame=save;
a.equal(run("changePetBondById('pet_test','soul')"),true);a.equal(run('loadGame().player.activePet.bondType'),'soul');a.equal(run("changePetBondById('pet_test','equal')"),false);
for(const raw of [null,'','超过八个字的测试名字',"O'Brien",'<b>小狐</b>']){f.c.prompt=()=>raw;a.equal(run("renamePetByIdV2870('pet_test')"),false);a.equal(run('player.activePet.name'),'小狐');}
f.c.prompt=()=> '雪团';f.c.saveGame=()=>false;a.equal(run("renamePetByIdV2870('pet_test')"),false);a.equal(run('player.activePet.name'),'小狐');f.c.saveGame=save;
a.equal(run("renamePetByIdV2870('pet_test')"),true);a.equal(run('player.activePet.name'),'雪团');a.equal(run('player.activePet.speciesV286818'),'小狐');a.equal(run('loadGame().player.activePet.name'),'雪团');
run("showPets();petContractOpenIdV29='pet_test';updatePetPanel()");a(f.ids.get('petList').innerHTML.includes('renamePetByIdV2870'));a(f.ids.get('petList').querySelectorAll('.pet-contract-btn-v29').every(b=>b.disabled));
run("gameState='combat';setPetCaptureCooldown(30)");a(run('syncCaptureCooldown()')>0);f.c.dispatchEvent(new f.c.CustomEvent('xiantu:combat-finishing'));a.equal(run('syncCaptureCooldown()'),0);
run("setPetCaptureCooldown(30);currentCombatReturnMode='world';endCombatAfterCapture()");a.equal(run('syncCaptureCooldown()'),0);
run("gameState='exploring';player.gold=2000;player.materials={'灵木':3,'兽骨':2,'星辰砂':1};player.equipmentInventory=['灵剑'];player.equipment.weapon='灵剑'");a.equal(run("getOwnedEquipTotalV2870('灵剑')"),2);
let msg='';f.c.confirm=m=>{msg=m;return false;};const before=run('JSON.stringify(player)');a.equal(run("forgeMaterialEquipment('spirit_sword')"),false);a.equal(run('JSON.stringify(player)'),before);a(msg.includes('2 件'));a(msg.includes('1600'));
f.c.confirm=()=>true;f.c.saveGame=()=>false;a.equal(run("forgeMaterialEquipment('spirit_sword')"),false);a.equal(run('JSON.stringify(player)'),before);f.c.saveGame=save;
a.equal(run("forgeMaterialEquipment('spirit_sword')"),true);a.equal(run('player.gold'),1600);a.equal(run('player.equipmentInventory.length'),2);
for(const state of ['combat','combat-ending','start']){run(`gameState='${state}'`);const before=run('JSON.stringify(player)');a.equal(run("renamePetByIdV2870('pet_test')"),false);a.equal(run("changePetBondById('pet_test','equal')"),false);a.notEqual(run("forgeMaterialEquipment('spirit_sword')"),true);a.equal(run('JSON.stringify(player)'),before);}
run("gameState='exploring';player.breakthrough.isAnimating=true");a.equal(run("renamePetByIdV2870('pet_test')"),false);a.equal(run("changePetBondById('pet_test','soul')"),false);run('player.breakthrough.isAnimating=false');
run("player.equipmentInventory=['玄冰法袍·灵品'];player.equipment={}");a.equal(run("getOwnedEquipTotalV2870('玄冰法袍')"),1);
f.c.confirm=()=>{throw Error('must not confirm without resources');};run("player.gold=0;forgeMaterialEquipment('spirit_sword')");
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS contract duplicate/downgrade/cancel/rollback, safe rename/persistence/species, disabled buttons, capture cooldown lifetime, forge cost/owned count/cancel/rollback and combat guards');
