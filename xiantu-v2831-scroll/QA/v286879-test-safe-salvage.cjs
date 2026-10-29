'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.El.prototype.before=function(el){this.parentNode?.insertBefore(el,this);};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`)),save=f.c.saveGame;
function fresh(code=''){
 f.c.saveGame=save;f.c.confirm=()=>true;
 run(`player=createDefaultPlayer();initAchievements();player.name='分解测试';player.level=10;player.gold=1000;player.equipment=createEmptyEquipmentSlots();player.equipmentInventory=[];gameState='exploring';COMBAT_FINISH_V2764.settling=false;equipmentDismantleQuality='EXCELLENT';forgeRestoreV2825(player);closeWorldOverlay();${code}`);
 f.timers.clear();
}
// Two empty ring slots need two identical rings, not one. Both dismantle entry points agree.
fresh("player.equipmentInventory=['铁戒','铁戒']");
a.equal(run("getProtectedBagCount('铁戒')"),2);a.equal(run("getSafeDismantleCountForName('铁戒')"),0);
a.equal(run('getBulkDismantlePreview().count'),0);a.equal(run('bulkDismantleEquipment()'),false);
a.equal(run("dismantleOneEquipmentEncoded(encodeURIComponent('铁戒'))"),false);a.equal(run('player.equipmentInventory.length'),2);
// Extra copies remain salvageable at the existing price; both useful copies survive a real save.
fresh("player.equipmentInventory=Array(5).fill('铁戒')");
const ringsScore=run('getBestEquipmentLoadout().score'),each=run("getDismantleValue('铁戒')");
a.equal(run('getBulkDismantlePreview().count'),3);a.equal(run('getBulkDismantlePreview().gold'),each*3);
a.equal(run("dismantleOneEquipmentEncoded(encodeURIComponent('铁戒'))"),true);a.equal(run('player.equipmentInventory.length'),4);
a.equal(run('bulkDismantleEquipment()'),true);a.deepEqual(json('player.equipmentInventory'),['铁戒','铁戒']);
a.equal(run('player.gold'),1000+each*3);a.equal(run('getBestEquipmentLoadout().score'),ringsScore);
a.deepEqual(JSON.parse(f.storage.get('xiantu_save')).player.equipmentInventory,['铁戒','铁戒']);
// Three artifact slots also retain three copies, including a copy already equipped.
fresh("player.equipmentInventory=Array(5).fill('火葫芦')");
a.equal(run("getProtectedBagCount('火葫芦')"),3);a.equal(run('getBulkDismantlePreview().count'),2);
a.equal(run('bulkDismantleEquipment()'),true);a.equal(run('player.equipmentInventory.length'),3);
fresh("player.equipment.artifact1='火葫芦';player.equipmentInventory=Array(4).fill('火葫芦')");
a.equal(run("getProtectedBagCount('火葫芦')"),2);a.equal(run('getBulkDismantlePreview().count'),2);
a.equal(run('bulkDismantleEquipment()'),true);a.equal(run('player.equipmentInventory.length'),2);a.equal(run('player.equipment.artifact1'),'火葫芦');
// Equipped duplicates count toward the desired loadout; fully equipped slots need no extra copy.
fresh("player.equipment.ring1='铁戒';player.equipmentInventory=Array(3).fill('铁戒')");
a.equal(run("getProtectedBagCount('铁戒')"),1);a.equal(run('getBulkDismantlePreview().count'),2);
run("player.equipment.ring2='铁戒'");a.equal(run("getProtectedBagCount('铁戒')"),0);a.equal(run('getBulkDismantlePreview().count'),3);
// Preserve the best mixed loadout instead of reserving every possible slot for every name.
fresh("player.equipmentInventory=['银戒','银戒','银戒','铁戒','铁戒']");
a.equal(run("getProtectedBagCount('银戒')"),2);a.equal(run("getProtectedBagCount('铁戒')"),1,'retain the existing one-copy upgrade protection');
a.equal(run('getBulkDismantlePreview().count'),2);
fresh("player.equipment.ring1='银戒';player.equipmentLocks=['银戒'];player.equipmentInventory=['铁戒','铁戒','铁戒']");
a.equal(run("getProtectedBagCount('铁戒')"),1,'the locked stronger ring occupies one slot');
// Locked, forged, future-realm, set and unknown item protections remain intact.
fresh("player.equipmentInventory=Array(4).fill('铁戒');player.equipmentLocks=['铁戒']");a.equal(run("getSafeDismantleCountForName('铁戒')"),0);
fresh("player.forgeV2825.items['铁戒〔铭器1〕']={base:'铁戒',level:1,affixes:[]};forgeRegisterV2825('铁戒〔铭器1〕',player.forgeV2825.items['铁戒〔铭器1〕']);player.equipmentInventory=['铁戒〔铭器1〕']");
a.equal(run('getBulkDismantlePreview().count'),0);
fresh("player.level=1;player.equipmentInventory=['金戒','金戒']");a.equal(run("getProtectedBagCount('金戒')"),1);
fresh("globalThis.setPieceTest=Object.keys(EQUIPMENT_DB).find(n=>isEquipmentSetPiece(n)&&canEquipItem(n).ok&&getEquipData(n).slot==='weapon');player.equipment.weapon=Object.keys(EQUIPMENT_DB).filter(n=>canEquipItem(n).ok&&getEquipData(n).slot==='weapon').sort((a,b)=>getEquipItemScore(b)-getEquipItemScore(a))[0];player.equipmentInventory=[setPieceTest,setPieceTest]");
a.equal(run('isEquipmentSetPiece(setPieceTest)'),true);a.equal(run('isInventoryEquipUpgrade(setPieceTest)'),false);a.equal(run('getProtectedBagCount(setPieceTest)'),1);
fresh("player.equipmentInventory=['未识别旧装备','未识别旧装备']");a.equal(run('getBulkDismantlePreview().count'),0);a.equal(run("getSafeDismantleCountForName('未识别旧装备')"),0);
// Real write failure still rolls back the salvage mutation, without losing protected or surplus gear.
fresh("player.equipmentInventory=Array(5).fill('铁戒');saveGame()");
const before=run('JSON.stringify(player)'),disk=f.storage.get('xiantu_save'),set=f.c.localStorage.setItem;
f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(run('bulkDismantleEquipment()'),false);f.c.localStorage.setItem=set;
a.equal(run('JSON.stringify(player)'),before);a.equal(f.storage.get('xiantu_save'),disk);
// The expensive loadout solver runs once per complete quote and once per render, not once per row.
fresh("player.equipmentInventory=Object.keys(EQUIPMENT_DB).slice(0,73)");
let solves=0;const best=f.c.getBestEquipmentLoadout;f.c.getBestEquipmentLoadout=function(...args){solves++;return best.apply(this,args);};
run('getBulkDismantlePreview()');a.equal(solves,1);solves=0;
run('equipPassV2905(bagRowsV2905,null,[])');a.equal(solves,1);solves=0;
run('bagRowsV2905()');a.equal(solves,1,'direct bag rows also share one protection table');f.c.getBestEquipmentLoadout=best;
// No quote persists across renders: replacing the bag immediately changes its protected counts.
run("player.equipmentInventory=['铁戒'];player.equipment=createEmptyEquipmentSlots()");a.equal(run("getProtectedBagCount('铁戒')"),1);
console.log('PASS safe salvage preserves two rings / three artifacts, subtracts equipped copies, retains existing protections, saves only surplus, rolls back write failure and solves once per quote/render');
