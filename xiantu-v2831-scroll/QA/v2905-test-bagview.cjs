'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};f.El.prototype.before=function(el){this.parentNode?.insertBefore(el,this);};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run('player=createDefaultPlayer();gameState="exploring";player.level=10;player.equipmentInventory=Object.keys(EQUIPMENT_DB).slice(0,73);showEquipmentInventory()');
a(f.ids.has('bagSearchV2905'));a(f.ids.get('bagListV2905').innerHTML.includes('aria-expanded="false"'));
const rows=json('equipPassV2905(bagRowsV2905,null,[])'),prefs=json('bagPrefsV2905()');a.equal(rows.length,73);
for(const [group,slots] of Object.entries(json('BAGVIEW_V2905.groups'))){const out=run(`bagFilterSortV2905(bagRowsV2905(),{...bagPrefsV2905(),group:${JSON.stringify(group)}},'')`);if(slots.slots)a(out.every(r=>slots.slots.includes(r.d.slot)));}
const weapon=rows.find(r=>r.d.slot==='weapon');a(weapon);
a(run(`bagFilterSortV2905(bagRowsV2905(),bagPrefsV2905(),${JSON.stringify(weapon.name)}).some(r=>r.name===${JSON.stringify(weapon.name)})`));
run('bagPrefsSetV2905({sort:"power",wearable:true});');const sorted=run('bagFilterSortV2905(bagRowsV2905(),bagPrefsV2905(),"")');a(sorted.every(r=>r.check.ok));for(let i=1;i<sorted.length;i++)a(sorted[i-1].score>=sorted[i].score);
run(`BAG_RT_V2905.open=${JSON.stringify(weapon.name)};bagRenderListV2905()`);a(f.ids.get('bagListV2905').innerHTML.includes('data-bv="equip"'));a(!f.ids.get('bagListV2905').innerHTML.includes('onclick="equipItemFromEncoded'));
// No persistent loadout cache: changing inventory, equipped slots, locks or a definition is visible next render.
const score=run(`equipPassV2905(()=>getEquipItemScore(${JSON.stringify(weapon.name)}),null,[])`);
run(`EQUIPMENT_DB[${JSON.stringify(weapon.name)}].stats.atk+=100;`);
a(run(`equipPassV2905(()=>getEquipItemScore(${JSON.stringify(weapon.name)}),null,[])`)>score);
a.equal(run('EQC_V2905.pass'),0);a.equal(run('EQC_V2905.memo'),null);
run('player.equipmentInventory=["木剑"];showEquipmentInventory()');a.equal(run('bagRowsV2905().length'),1);
run('player.equipmentInventory.push("未识别的旧装备");showEquipmentInventory()');a(run('bagRowsV2905().some(r=>r.name==="未识别的旧装备"&&!r.check.ok&&r.safe===0)'));
// View ordering never changes inventory order or saves the character, even if storage rejects preferences.
run('player.inventory=["聚灵丹","小还丹","聚灵丹","未知物品"];showMobileInventory();');const before=run('JSON.stringify(player.inventory)');let saves=0;f.c.saveGame=()=>{saves++;return false;};
a(run('sortAndConsolidateBagV2870()'));a.equal(run('JSON.stringify(player.inventory)'),before);a.equal(run('bagItemOrderV2905(groupInventoryItems())[0].name'),'小还丹');a.equal(saves,0);
a(run('sortAndConsolidateBagV2870()'));a.equal(run('bagItemOrderV2905(groupInventoryItems())[0].name'),'聚灵丹');
const set=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('blocked')};run('bagPrefsSetV2905({group:"armor"})');a.equal(run('bagPrefsV2905().group'),'armor');f.c.localStorage.setItem=set;
run('player.petMaterials={"兽魂晶":3};setMobileInventoryTab("materials")');a(f.ids.get('mobileInventoryCard').innerHTML.includes('兽魂晶'));a(f.ids.get('mobileInventoryCard').innerHTML.includes('灵宠材料'));
run('BAG_RT_V2905.search="木剑";BAG_RT_V2905.open="木剑";player=createDefaultPlayer();gameState="exploring";showEquipmentInventory()');a.equal(run('BAG_RT_V2905.search'),'');a.equal(run('BAG_RT_V2905.open'),null);
a(!run('JSON.stringify(player)').includes('bag_view'));a(!run('JSON.stringify(player)').includes('autoSalvage'));
console.log('PASS compact expandable rows, search/filter/sort, no cross-render stale caches, unknown equipment retention, view-only order, blocked preference storage, pet materials and owner reset');
