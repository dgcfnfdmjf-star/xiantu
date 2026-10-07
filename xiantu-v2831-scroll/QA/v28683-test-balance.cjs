const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.Image.prototype.removeAttribute=function(){};f.El.prototype.removeAttribute=function(k){if(this.attributes)delete this.attributes[k];};
f.c.Math=Object.create(Math);f.c.Math.random=()=>.999;
for(const s of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(s);
f.run('startGame();closeWorldOverlay();showBreakthroughSuccess=()=>{};showBreakthroughFailure=()=>{};');
f.run('player=createDefaultPlayer();player.level=10;player.phase=3;player.inventory=[];');
const rates=[];
for(let i=0;i<6;i++){
 f.run('player.exp=getCurrentExpNeed();player.breakthrough.cooldownDays=0;');rates.push(f.run('calculateBreakthroughSuccess().rate'));
 f.run('triggerBreakthrough(true)');
 if(i<5){a.equal(f.run('breakthroughProtectionV28683().failures'),i+1);f.run('player=normalizePlayer(JSON.parse(JSON.stringify(player)))');a.equal(f.run('breakthroughProtectionV28683().failures'),i+1);}
}
a.deepEqual(rates,[.05,.2,.35,.49999999999999994,.65,1]);a.equal(f.run('player.level'),11);a.equal(f.run('breakthroughProtectionV28683().failures'),0);
f.run("player=createDefaultPlayer();player.level=2;player.phase=3;player.gold=800;player.inventory=[];buyBreakthroughPillV28683('破障丹');");a.equal(f.run('player.gold'),500);a.equal(f.run('player.inventory.length'),1);
f.run("player.exp=getCurrentExpNeed();selectBreakthroughPillV28683('破障丹');");a.equal(f.run('player.inventory.length'),1);a.equal(f.run('calculateBreakthroughSuccess().pillBonus'),.15);
f.run('triggerBreakthrough(false)');a.equal(f.run('player.inventory.length'),0);f.run('triggerBreakthrough(false)');a.equal(f.run('player.inventory.length'),0);
f.run('player=normalizePlayer(JSON.parse(JSON.stringify(player)));recoverPendingBreakthroughV28683();');a.equal(f.run('breakthroughProtectionV28683().failures'),1);a.equal(f.run('recoverPendingBreakthroughV28683()'),false);
f.run("player.level=9;player.phase=3;player.exp=getCurrentExpNeed();player.breakthrough.cooldownDays=0;player.breakthrough.protectionV28683={key:'9:3',failures:5};");a.equal(f.run('canAttemptBreakthrough()'),false);a.equal(f.run('calculateBreakthroughSuccess().guaranteed'),false);
f.run('player.level=10;player.phase=0;isBossFight=false;isTribulation=false;');
a.equal(f.run('battleExpV28683({exp:50,_realmLevel:1,_realmPhase:0})'),50);
a.equal(f.run('battleExpV28683({exp:50,_realmLevel:10,_realmPhase:0})'),1700);
a.equal(f.run('battleExpV28683({exp:50,_realmLevel:10,_realmPhase:0,_isElite:true})'),2550);
a.equal(f.run('battleExpV28683({exp:0,_realmLevel:10})'),0);
for(const flag of ['_isTutorial','_isTaskBattle','_warV2839','tournamentFight'])a.equal(f.run(`battleExpV28683({exp:50,_realmLevel:10,${flag}:true})`),50);
console.log('PASS pity limit/reset/reload, pill purchase/selection/once-only consumption, interrupted attempt recovery, ascension exclusion, difficulty-based XP');
f.run("player=createDefaultPlayer();player.level=2;player.gold=0;player.tasks.completed=['main_01','main_02','main_03','main_04','main_05'];claimAllEarlyV2774();");a.equal(f.run('player.gold'),8000);f.run('claimAllEarlyV2774()');a.equal(f.run('player.gold'),8000);
f.run("player.level=10;player.phase=3;player.exp=getCurrentExpNeed();player.breakthrough={cooldownDays:0,protectionV28683:{key:'10:3',failures:5},pillV28683:'九转金丹'};player.inventory=['九转金丹'];triggerBreakthrough(true);");a.equal(f.run('player.inventory.filter(n=>n===\'九转金丹\').length'),1);
f.run("player.gold=10;buyBreakthroughPillV28683('破障丹');");a.equal(f.run('player.gold'),10);
console.log('PASS one-time grant idempotence, guaranteed attempt preserves pill, insufficient funds rejected');

f.run('isBossFight=false;isTribulation=false;');
a.equal(f.run('battleGoldV28683({gold:10,_realmLevel:2})'),120);
a.equal(f.run('battleGoldV28683({gold:10,_realmLevel:16,_isElite:true})'),600);
a.equal(f.run('battleGoldV28683({gold:10,_realmLevel:0})'),10);
a.equal(f.run('battleGoldV28683({gold:0,_realmLevel:16})'),0);
a.equal(f.run('battleGoldV28683({gold:10,_realmLevel:16,_isTaskBattle:true})'),10);
console.log('PASS bounded enemy-realm gold, low-realm/zero/task reward exclusions');

// Equipment display must use the same quality-scaled values across purchase,
// inventory, worn slots and forging, without multiplying actual stats twice.
f.run('resetRuntimeState();player=createDefaultPlayer();player.level=8;player.equipment=createEmptyEquipmentSlots();player.equipment.boots="天星履·仙器";player.equipmentInventory=["天星履·仙器"];');
const bootsText='防御+57.6 · 速度+144 · 闪避+48%';
a(f.run('renderEquipSlots(["boots"])').includes(bootsText));
a.equal(f.run('getEquipDef()'),57);a.equal(f.run('getEquipmentStat("speed")'),144);a.equal(f.run('getEquipDodge()'),48);a.equal(f.run('getDodgeRate()'),.30);a.equal(f.run('getItemPowerDisplay("天星履·仙器")'),252);
f.run('showMarketGearV2800("armor",3,"天星")');a(f.ids.get('storyText').innerHTML.includes(bootsText));
f.run('showEquipmentInventory()');a(f.ids.get('storyText').innerHTML.includes(bootsText));
f.run('showForgeV2825()');a(f.ids.get('storyText').innerHTML.includes(bootsText));
f.run('selectForgeV2825("slot","boots")');a(f.ids.get('storyText').innerHTML.includes('下级基础属性（未含词条）：防御+60.48'));
f.run('player.forgeV2825={next:2,items:{"天星履·仙器〔铭器1〕":{base:"天星履·仙器",level:1,affixes:[{stat:"def",value:6}]}}};forgeRegisterV2825("天星履·仙器〔铭器1〕",player.forgeV2825.items["天星履·仙器〔铭器1〕"]);player.equipment.boots="天星履·仙器〔铭器1〕";');
a(f.run('renderEquipSlots(["boots"])').includes('防御+66.48 · 速度+144 · 闪避+48%'));a.equal(f.run('getEquipDef()'),66);
f.run('saveGame();loadAndStart()');a(f.run('renderEquipSlots(["boots"])').includes('防御+66.48'));
a.equal(f.run('getEquipData("天星履·仙器").stats.def'),18,'render/forge must not mutate base stats');
console.log('PASS quality-scaled boots across shop/bag/slots/forge, unchanged totals and cap, affixes counted once, reload preserved');
