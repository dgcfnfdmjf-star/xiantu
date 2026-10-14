'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay()');f.timers.clear();
const run=s=>f.run(s),read=s=>JSON.parse(run(`JSON.stringify(${s})`));
const low='万象玄霆·九霄玄霆杖·灵品',next='万象玄霆·九霄玄霆杖·宝器';f.c.low=low;f.c.nextBase=next;
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();player.level=16;player.gold=1000000;player.equipment=createEmptyEquipmentSlots();player.equipmentInventory=[low];player.hp=73;player.mp=29;gameState='exploring';forgeRestoreV2825(player);window.confirm=()=>true");}
function open(){run('showGradeUpgradePanelV2869();globalThis.ticket=gradeUpgradeSessionV2869.nonce');}
function exec(source='bag:0'){return run(`executeGradeUpgradeV2869(${JSON.stringify(source)},ticket)`);}
function forge(){run("selectForgeV2825('bag',0);mutateForgeV2825(forgeSelectionV2825.nonce,'enhance');globalThis.oldKey=forgeSelectionV2825.name;var rec=player.forgeV2825.items[oldKey];rec.level=7;rec.affixes=[{stat:'hp',value:19},{stat:'atk',unit:'percent',value:2}];rec.pending=[{stat:'mp',unit:'percent',value:3},{stat:'def',value:2}];forgeRegisterV2825(oldKey,rec);closeWorldOverlay()");}
// Every authored family/piece advances exactly one grade at the actual shop difference.
fresh();const catalogue=read('Object.entries(EQUIPMENT_DB).filter(([n,d])=>d.familyV2790&&d.gradeV2790&&d.gradeV2790<6).map(([n])=>n)');
for(const name of catalogue){f.c.testName=name;const row=read('findNextGradeEquipV2869(testName)');a(row,name);a.equal(row.nextBaseData.gradeV2790,row.baseData.gradeV2790+1);a.equal(row.nextBaseData.familyV2790,row.baseData.familyV2790);a.equal(row.nextBaseData.pieceV2790,row.baseData.pieceV2790);a.equal(row.nextBaseData.slot,row.baseData.slot);a.equal(row.goldDiff,row.nextBaseData.priceV2790-row.baseData.priceV2790);}
a.deepEqual(read("GRADES_V2790.slice(1).map((g,i)=>g.cost-GRADES_V2790[i].cost)"),[1800,7200,28800,115200,460800]);
a.equal(run("findNextGradeEquipV2869('木剑')"),null);a.equal(run("findNextGradeEquipV2869('万象玄霆·九霄玄霆杖·道器')"),null);
const state=run('JSON.stringify(player)');run('findNextGradeEquipV2869(low)');a.equal(run('JSON.stringify(player)'),state,'quote is read-only');
// One plain copy changes; name-based locks remain on other copies and follow the upgraded copy.
run('player.equipmentInventory=[low,low];player.equipmentLocks=[low]');open();a(exec());a.deepEqual(read('player.equipmentInventory'),[next,low]);a.equal(run('player.gold'),998200);a(run('player.equipmentLocks.includes(low)&&player.equipmentLocks.includes(nextBase)'));a.equal(exec(),false,'same ticket cannot pay twice');
// Fodder before source: correct index is upgraded. Locked or forged higher-tier items are never fodder.
fresh();run('player.equipmentInventory=[nextBase,low];player.gold=0');open();a(exec('bag:1'));a.deepEqual(read('player.equipmentInventory'),[next]);a.equal(run('player.gold'),0);
fresh();run('player.equipmentInventory=[low,nextBase];player.equipmentLocks=[nextBase]');open();a(exec());a.deepEqual(read('player.equipmentInventory'),[next,next]);a.equal(run('player.gold'),998200);
fresh();run("player.equipmentInventory=[nextBase,low];selectForgeV2825('bag',0);mutateForgeV2825(forgeSelectionV2825.nonce,'enhance');player.equipmentLocks=[]");a.equal(run('findNextGradeEquipV2869(low).hasBagFodder'),false);
// Insufficient funds, cancellation, equipment realm gates; bag upgrading does not equip early.
fresh();run('player.gold=1799');open();a.equal(exec(),false);a.equal(run('player.gold'),1799);
fresh();run('window.confirm=()=>false');open();const cancelled=run('JSON.stringify(player)');a.equal(exec(),false);a.equal(run('JSON.stringify(player)'),cancelled);
fresh();run('player.level=2;player.equipment.weapon=low;player.equipmentInventory=[]');open();a.equal(exec('slot:weapon'),false);a.equal(run('player.equipment.weapon'),low);
fresh();run('player.level=2');open();a(exec());a.equal(run('player.equipment.weapon'),null);a.equal(run('canEquipItem(player.equipmentInventory[0]).ok'),false);
// Inherit current + pending affixes exactly; flat bonuses are not multiplied by the new quality.
fresh();forge();const inherited=read('player.forgeV2825.items[oldKey]');open();const gold=run('player.gold');a(exec());const key=run('player.equipmentInventory[0]');f.c.newKey=key;a(key.startsWith(next+'〔铭器'));a.notEqual(key,run('oldKey'));
a.deepEqual(read('player.forgeV2825.items[newKey]'),{...inherited,base:next});a.equal(run('player.gold'),gold-1800);a.equal(run('getEquipData(oldKey)'),null);a(run('player.equipmentLocks.includes(newKey)'));a.equal(run('player.equipmentLocks.includes(oldKey)'),false);
a.equal(run('player.hp'),73);a.equal(run('player.mp'),29);
run('player.equipment.weapon=newKey;player.equipmentInventory=[];saveGame();player=normalizePlayer(loadGame().player)');a(run('getEquipData(newKey)'));a.equal(run('getEquipData(newKey).forgeLevelV2825'),7);a.equal(run('player.equipment.weapon'),key);a.deepEqual(read('player.forgeV2825.items[newKey].affixes'),inherited.affixes);a.deepEqual(read('player.forgeV2825.items[newKey].pending'),inherited.pending);
const maxHp=run('getMaxHp()');run('player.equipment.weapon=nextBase');a.equal(maxHp-run('getMaxHp()'),19,'legacy flat HP survives once');run('player.equipment.weapon=newKey');a.equal(run('getEquipData(newKey).forgePercentStatsV286825.atk'),2);
run("selectForgeV2825('slot','weapon');chooseForgeAffixesV2825(forgeSelectionV2825.nonce,true)");a.deepEqual(read('player.forgeV2825.items[newKey].affixes'),inherited.pending);a.equal(run('player.forgeV2825.items[newKey].pending'),null);
// Pre-unified set names in old forged records still resolve to the same family/piece.
fresh();run("globalThis.legacyBase=OLD_SET_VERSIONS_V2792['青云'][0];globalThis.legacyKey=legacyBase+'〔铭器99〕';player.forgeV2825.items[legacyKey]={base:legacyBase,level:3,affixes:[{stat:'hp',value:7}],pending:null};forgeRegisterV2825(legacyKey,player.forgeV2825.items[legacyKey]);player.equipmentInventory=[legacyKey];player.forgeV2825.next=Number.MAX_SAFE_INTEGER");open();a(exec());a(run('player.equipmentInventory[0].includes("宝器〔铭器")'));a.equal(run('player.forgeV2825.next'),1);a.equal(run('player.forgeV2825.items[player.equipmentInventory[0]].level'),3);run('saveGame();player=normalizePlayer(loadGame().player)');a(run('!!getEquipData(player.equipmentInventory[0])'));
// Equipped upgrade retains slot and full mixed-grade set identity, does not heal.
fresh();forge();run('player.equipment.weapon=oldKey;player.equipmentInventory=[]');open();a(exec('slot:weapon'));a.equal(run('player.equipmentInventory.length'),0);a(run('player.equipment.weapon.startsWith(nextBase)'));a.equal(run('player.hp'),73);a.equal(run('player.mp'),29);
// Unlocked forged state is also retained; duplicate instance keys are refused.
fresh();forge();run('player.equipmentLocks=[]');open();a(exec());a.deepEqual(read('player.equipmentLocks'),[]);
fresh();forge();run('player.equipmentInventory.push(oldKey)');open();a.equal(exec(),false);
// Stale page, source, lock, prices, balance and player changes cannot spend resources.
for(const mutate of ["player.equipmentInventory.reverse()","player.equipmentLocks.push(nextBase)","player.gold--","player=normalizePlayer(JSON.parse(JSON.stringify(player)))","gameState='combat'","gameState='combat-ending'","player.breakthrough={isAnimating:true}","closeWorldOverlay()","showStory('其他面板',[])","showEquipmentPanel()","toggleCharacterPanel(true)"]){
 fresh();run('player.equipmentInventory=[low,nextBase]');open();f.c.changeCode=mutate;run('window.confirm=()=>{eval(changeCode);return true}');a.equal(exec(),false,mutate);a.equal(run('player.equipmentInventory.length'),2,mutate);
}
fresh();open();run('window.confirm=()=>{globalThis.reentrant=executeGradeUpgradeV2869("bag:0",ticket);return true}');a(exec());a.equal(run('reentrant'),false);a.equal(run('player.gold'),998200);
// Save failure rolls back consumed fodder, money, record keys, stats and locks.
for(const forged of [false,true]){
 fresh();if(forged)forge();run('player.equipmentInventory.push(nextBase)');open();const snapshot=run('JSON.stringify(player)');run('globalThis.originalSave=saveGame;saveGame=()=>false');a.equal(exec(),false);run('saveGame=originalSave');a.equal(run('JSON.stringify(player)'),snapshot);if(forged)a(run('!!EQUIPMENT_DB[oldKey]&&FORGE_KEYS_V2825.has(oldKey)'));
 a(exec(),'retry succeeds after storage recovers');
}
// Registration exceptions do not leave a partial replacement or spend resources.
fresh();forge();open();const before=run('JSON.stringify(player)');run('globalThis.registerOriginal=forgeRegisterV2825;forgeRegisterV2825=()=>{throw Error("test register") }');a.equal(exec(),false);run('forgeRegisterV2825=registerOriginal');a.equal(run('JSON.stringify(player)'),before);a(run('!!EQUIPMENT_DB[oldKey]'));
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log(`PASS ${catalogue.length} set-grade transitions; exact shop prices; fodder/locks/indices; per-item inheritance + pending affixes; reload + continued forge; no healing; realm gates; stale/reentrant calls; save/registration rollback`);
