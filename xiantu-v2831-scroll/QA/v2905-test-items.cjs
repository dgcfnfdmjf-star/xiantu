'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.c.console.warn=()=>{};f.c.confirm=()=>true;
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`)),save=f.c.saveGame;
function fresh(setup=''){
 f.c.saveGame=save;f.c.confirm=()=>true;
 run(`player=createDefaultPlayer();initAchievements();player.name='背包测试';player.level=10;player.gold=9000000;player.hp=1;player.inventory=['小还丹','养元丹'];player.sectContribution=1000;gameState='exploring';COMBAT_FINISH_V2764.settling=false;lastItemUseV2768=-1e9;closeWorldOverlay();${setup}`);f.timers.clear();
}
const scenarios=[
 ['杂货购买','', 'buyGeneralV2801(0,5)'],
 ['御兽材料','', 'buyPetGrowthBatchV286845("灵果",5)'],
 ['批量分解',"player.equipmentInventory=['木剑','木剑','木剑'];equipmentDismantleQuality='GOOD'",'bulkDismantleEquipment()'],
 ['单件分解',"player.equipmentInventory=['木剑','木剑','木剑']",'dismantleOneEquipmentEncoded(encodeURIComponent("木剑"))'],
 ['炼丹',"player.materials={'灵草':80,'仙果':30};Math.random=()=>0",'craftPill("养元丹",5)'],
 ['用药','', 'useItem("小还丹")'],['延寿','', 'useItem("养元丹")'],['购买延寿','', 'buyLongevityPill("养元丹")'],
 ['购买突破','', 'buyBreakthroughPillV28683("破障丹")'],
 ['宗门丹药','', 'buySectItem("小还丹",10)'],['宗门材料','', 'buySectItem("灵草",8)'],
 ['新装商店','', 'buyNewGearV2790(Object.keys(NEW_SETS_V2790)[0],0,1)'],
 ['旧装商店','', 'buyOldGearV2792(Object.keys(OLD_SET_VERSIONS_V2792)[0],0,1)'],
 ['材料选项',"currentChoices=[{action:'buyMaterial',item:'灵草',cost:10}]",'handleChoice(0)']
];
for(const [label,setup,action] of scenarios){
 fresh(setup);const before=run('JSON.stringify(player)'),ach=run('JSON.stringify(achievementProgress)'),owner=run('player');
 f.c.saveGame=()=>run('miniSaveDeferredV286840')?true:false;run(action);
 a.equal(run('JSON.stringify(player)'),before,label+' failure restores all player fields');a.equal(run('JSON.stringify(achievementProgress)'),ach);a.equal(run('player'),owner);a.equal(run('ITEM_ACTION_V2905.depth'),0);a.equal(run('miniSaveDeferredV286840'),false);
 fresh(setup);const b=run('JSON.stringify(player)');let writes=0;const set=f.c.localStorage.setItem;f.c.localStorage.setItem=(k,v)=>{if(k==='xiantu_save')writes++;return set(k,v);};
 run(action);f.c.localStorage.setItem=set;a.notEqual(run('JSON.stringify(player)'),b,label+' actually executed');a.equal(writes,1,label+' saves once');
 a.equal(JSON.parse(f.storage.get('xiantu_save')).player.gold,run('player.gold'));
}
console.log('PASS 14 real inventory actions rollback on failed save and commit once on success, including nested longevity and achievements');
fresh();const before=run('JSON.stringify(player)');a.equal(run('itemActionV2905("异常",()=>{player.gold=1;throw Error("模拟异常")})'),false);a.equal(run('JSON.stringify(player)'),before);
fresh();f.c.confirm=()=>false;const noBuy=run('JSON.stringify(player)');run('buyGeneralV2801(0,5)');a.equal(run('JSON.stringify(player)'),noBuy);
fresh("player.inventory=Array(100000).fill('小还丹')");const g=run('player.gold');run('buyGeneralV2801(0,1)');a.equal(run('player.gold'),g);a.equal(run('player.inventory.length'),100000);a.equal(run('getAlchemyPlanV286850("养元丹",1).count'),0);
fresh("player.materials={'灵草':'999','负数':-1,'未知材料':10000000001};player.petMaterials={'灵果':'2'}");run('normalizeItemCountsV2905(player)');a.equal(run('player.materials["灵草"]'),999);a.equal(run('player.materials["负数"]'),0);a.equal(run('player.materials["未知材料"]'),10000000001);run('addStoredItemV2905("materials","灵草",1)');a.equal(run('player.materials["灵草"]'),1000);
a.equal(run('addStoredItemV2905("materials","__proto__",1)'),false);
run('player.materials=[]');a.equal(run('addStoredItemV2905("materials","灵草",1)'),false);
// Loader rejects invalid critical fields rather than turning them into a new valid save.
fresh();run('player.unknownFutureField={note:"保留"};player.equipmentInventory=["未来装备"];');const data=json('createSaveDataV2768()');for(const key of ['gold','exp','hp','mp']){const broken=structuredClone(data);broken.player[key]='bad';a.throws(()=>run(`parseSaveV2768(${JSON.stringify(JSON.stringify(broken))})`));}
run(`player=normalizePlayer(${JSON.stringify(data.player)})`);a.equal(run('player.unknownFutureField.note'),'保留');a(run('player.equipmentInventory.includes("未来装备")'));
// Batch healing stops at full; exp is capped at 999 per click. Cancellation/failure is all-or-nothing.
fresh("player.inventory=Array(10).fill('小还丹');player.hp=getMaxHp()-31");a.equal(run('pillBatchCountV2905("小还丹",10)'),2);a(run('useItemBatchV2905("小还丹",10)'));a.equal(run('player.inventory.length'),8);a.equal(run('player.hp'),run('getMaxHp()'));a.equal(run('pillBatchCountV2905("小还丹","full")'),0);
fresh("player.inventory=Array(10).fill('聚灵丹');player.mp=0");const batchBefore=run('JSON.stringify(player)');f.c.saveGame=()=>false;a.equal(run('useItemBatchV2905("聚灵丹",5)'),false);a.equal(run('JSON.stringify(player)'),batchBefore);
fresh("player.inventory=Array(1001).fill('悟道丹')");a.equal(run('pillBatchCountV2905("悟道丹","all")'),999);f.c.confirm=()=>false;a.equal(run('useItemBatchV2905("悟道丹","all")'),false);a.equal(run('player.inventory.length'),1001);
f.c.confirm=()=>{run('player=createDefaultPlayer()');return true;};a.equal(run('useItemBatchV2905("悟道丹","all")'),false);a.equal(run('player.inventory.length'),0);
for(const state of ['start','combat','combat-ending']){fresh();run(`gameState=${JSON.stringify(state)}`);const raw=run('JSON.stringify(player)');run('buyGeneralV2801(0,1);useItemBatchV2905("小还丹",5)');a.equal(run('JSON.stringify(player)'),raw);}
// Failed purchase must not create fake spending/refund in the optional local recorder.
fresh();run('document.getElementById("gameScreen").classList.remove("hidden");statsSetEnabledV2901(true);statsSampleV2901()');const stats=run('JSON.stringify([statsBucketV2901(10).goldIn,statsBucketV2901(10).goldOut])');f.c.saveGame=()=>false;run('buyGeneralV2801(0,1)');a.equal(run('JSON.stringify([statsBucketV2901(10).goldIn,statsBucketV2901(10).goldOut])'),stats);
console.log('PASS capacity/no-charge, safe counts, strict critical-field rejection, unknown data retention, batch limits/confirmation/state/owner guards and rollback statistics');

// Real quota failure leaves the last persisted character untouched and removes success effects.
fresh();run('saveGame();showShop()');const disk=f.storage.get('xiantu_save'),oldSet=f.c.localStorage.setItem,raw=run('JSON.stringify(player)'),html=f.ids.get('storyText').innerHTML;
f.c.localStorage.setItem=()=>{throw Error('quota')};run('buyGeneralV2801(0,5)');f.c.localStorage.setItem=oldSet;
a.equal(f.storage.get('xiantu_save'),disk);a.equal(run('JSON.stringify(player)'),raw);a.equal(f.ids.get('storyText').innerHTML,html);
console.log('PASS real storage failure preserves previous save, previous shop UI and live player');
