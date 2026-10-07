'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run("startGame();closeWorldOverlay();player.level=10;player.phase=0;player.equipment={weapon:'太虚剑'};forgeRestoreV2825(player);globalThis.raw25={hp:getMaxHp(),mp:getMaxMp(),atk:getAtk(),def:getDef()};globalThis.key25='太虚剑〔铭器1〕';player.forgeV2825.items[key25]={base:'太虚剑',level:0,affixes:[{stat:'hp',value:15,unit:'percent'},{stat:'atk',value:9,unit:'percent'}],pending:null};forgeRegisterV2825(key25,player.forgeV2825.items[key25]);player.equipment.weapon=key25;player.hp=100;player.mp=30");
a.equal(f.run('getMaxHp()'),f.run('Math.floor(raw25.hp*1.15)'));a.equal(f.run('getAtk()'),f.run('Math.floor(raw25.atk*1.09)'));a.equal(f.run('getEquipHp()'),0);a.equal(f.run('player.hp'),100);
a.match(f.run('formatEquipItemStatsV286813(key25)'),/洗练气血\+15%/);a.match(f.run('forgeAffixTextV2825(player.forgeV2825.items[key25].affixes)'),/15%/);
f.run("globalThis.second25='火葫芦〔铭器2〕';player.forgeV2825.items[second25]={base:'火葫芦',level:0,affixes:[{stat:'hp',value:10,unit:'percent'}],pending:null};forgeRegisterV2825(second25,player.forgeV2825.items[second25]);player.equipment.artifact1=second25");
a.equal(f.run('getMaxHp()'),f.run('Math.floor(raw25.hp*1.25)'),'percentage points add instead of multiplying');
for(let i=0;i<10;i++)f.run("player.equipment.weapon=null;player.equipment.weapon=key25;forgeRegisterV2825(key25,player.forgeV2825.items[key25])");a.equal(f.run('getMaxHp()'),f.run('Math.floor(raw25.hp*1.25)'));
f.run('player.forgeV2825.items[key25].level=10;forgeRegisterV2825(key25,player.forgeV2825.items[key25])');a.equal(f.run('getEquipData(key25).forgePercentStatsV286825.hp'),15);
f.run('saveGame();player=loadGame().player;forgeOwnerV2825=null;forgeRestoreV2825(player)');a.equal(f.run('getMaxHp()'),f.run('Math.floor(raw25.hp*1.25)'));
// Compare legacy flat vs new percent as projected totals, including other gear. No mutation by preview.
f.run("player.forgeV2825.items[key25].affixes=[{stat:'hp',value:90}];player.forgeV2825.items[key25].pending=[{stat:'hp',value:15,unit:'percent'},{stat:'mp',value:15,unit:'percent'}];forgeRegisterV2825(key25,player.forgeV2825.items[key25]);selectForgeV2825('slot','weapon');globalThis.current25={hp:getMaxHp(),mp:getMaxMp()}");
const snapshot=f.run('JSON.stringify(player)'),data=f.run('JSON.stringify(getEquipData(key25))'),state=f.run('forgeAdviceStateV2842(forgeSelectionV2825,player.forgeV2825.items[key25])');
a.equal(state.version,3);a.equal(state.before.hp,f.run('current25.hp'));a.equal(state.after.hp,f.run('Math.floor(raw25.hp*1.25)'));a.equal(state.after.mp,f.run('Math.floor(raw25.mp*1.15)'));a.equal(f.run('JSON.stringify(player)'),snapshot);a.equal(f.run('JSON.stringify(getEquipData(key25))'),data);
// Even a failed stat computation must restore the real definition, slots and set state.
f.run('globalThis.originalAtk25=getAtk;getAtk=()=>{throw Error("probe")};');a.throws(()=>f.run('forgeAdviceStateV2842(forgeSelectionV2825,player.forgeV2825.items[key25])'));f.run('getAtk=originalAtk25');a.equal(f.run('JSON.stringify(player)'),snapshot);a.equal(f.run('JSON.stringify(getEquipData(key25))'),data);
f.run('chooseForgeAffixesV2825(forgeSelectionV2825.nonce,true)');a.equal(f.run('getMaxHp()'),state.after.hp);a.equal(f.run('getMaxMp()'),state.after.mp);a.equal(f.run('player.hp'),100);
// Backpacked comparison is an explicit same-slot trial and cannot equip the item.
f.run("player.equipment.weapon='太虚剑';player.equipmentInventory=[key25];player.forgeV2825.items[key25].pending=[{stat:'hp',value:12,unit:'percent'}];selectForgeV2825('bag',0)");const bag=f.run('JSON.stringify(player)');f.run('forgeAdviceStateV2842(forgeSelectionV2825,player.forgeV2825.items[key25])');a.equal(f.run('JSON.stringify(player)'),bag);
const {validState,createHandler}=require(path.resolve(root,'../tencent-jev-function/index.js'));
const plain=JSON.parse(JSON.stringify(state));a.deepEqual(validState(plain),plain);a.throws(()=>validState({...plain,after:{...plain.after,hp:1000000001}}));a.throws(()=>validState({...plain,after:{...plain.after,hp:1.5}}));a.throws(()=>validState({...plain,version:2}));
(async()=>{let seen;const handler=createHandler({env:{JEV_API_KEY:'mock',JEV_ACCESS_TOKEN:'test_access_12345678',JEV_ALLOWED_ORIGINS:'https://example.test'},call:async body=>{seen=body;return {answers:{forge:{type:'choice',choice:'replace',confidence:.9,probabilities:{keep:.05,replace:.9,consider:.05}}}}}});
 const result=await handler({httpMethod:'POST',headers:{origin:'https://example.test','content-type':'application/json','x-xiantu-access':'test_access_12345678'},body:JSON.stringify(plain)});a.equal(result.statusCode,200);a.match(seen.state.rules.basis,/projected whole-character/);a.equal(seen.state.rules.maximumAffixByStat,null);
 console.log('PASS percent applies once/adds across slots, no flat leakage/no instant recovery/no compounding, reload, mixed legacy comparison equals actual replacement, read-only slot/bag/exception restoration and strict v3 mocked cloud contract');
})().catch(e=>{console.error(e);process.exitCode=1});
