'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.c.Math=Object.create(Math);f.c.Math.random=()=>.999999;
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run('startGame();closeWorldOverlay();player.level=16;player.gold=100000');f.timers.clear();
for(const [quality,grade] of Object.entries({MORTAL:1,GOOD:1,FINE:1,LING_PIN:1,EXCELLENT:2,BAO_QI:2,SPIRIT:2,IMMORTAL:3,GOD:3})){
 a.equal(f.run(`forgeGradeV2825({quality:'${quality}'})`),grade);
 a.equal(f.run(`forgeGradeV2825({quality:'${quality}',gradeV2790:0})`),grade);
}
a.equal(f.run("forgeGradeV2825({quality:'IMMORTAL',gradeV2790:1})"),3);a.equal(f.run('forgeGradeV2825(null)'),1);
a.equal(f.run("forgeGradeV2825(getEquipData('太虚剑'))"),3);
for(const [grade,name] of [[1,'木剑'],[2,'番天印'],[3,'太虚剑']]){
 f.c.testName=name;f.run("player.equipmentInventory=[testName];selectForgeV2825('bag',0)");const gold=f.run('player.gold');f.run("mutateForgeV2825(forgeSelectionV2825.nonce,'wash')");
 a.equal(f.run('player.gold'),gold-grade*200);a.equal(f.run('player.forgeV2825.items[forgeSelectionV2825.name].pending.find(a=>a.stat==="hp").value'),grade*5);a.equal(f.run('player.forgeV2825.items[forgeSelectionV2825.name].pending.find(a=>a.stat==="mp").value'),grade*5);
 const money=f.run('player.gold');f.run("mutateForgeV2825(forgeSelectionV2825.nonce,'wash')");a.equal(f.run('player.gold'),money,'pending result blocks reroll');
 f.run('chooseForgeAffixesV2825(forgeSelectionV2825.nonce,true)');
 const key=f.run('forgeSelectionV2825.name');f.c.testKey=key;f.run('saveGame();forgeOwnerV2825=null;forgeRestoreV2825(player)');a.equal(f.run('player.forgeV2825.items[testKey].affixes.find(a=>a.stat==="hp").value'),grade*5);
}
f.c.Math.random=()=>0;f.run("player.equipmentInventory=['木剑'];selectForgeV2825('bag',0);mutateForgeV2825(forgeSelectionV2825.nonce,'wash')");a.equal(f.run('JSON.stringify(player.forgeV2825.items[forgeSelectionV2825.name].pending)'),JSON.stringify([{stat:'atk',unit:'percent',value:1},{stat:'def',unit:'percent',value:1}]));
f.run("player.forgeV2825.items[testKey].affixes=[{stat:'hp',value:180},{stat:'mp',value:60}];forgeRegisterV2825(testKey,player.forgeV2825.items[testKey])");
// Legacy flat max on a legacy immortal weapon applies once, independent of enhancement/quality multiplier.
f.run("player.equipment={weapon:'太虚剑'};player.hp=100;player.mp=30;globalThis.hpBefore24=getMaxHp();globalThis.mpBefore24=getMaxMp();player.equipment.weapon=testKey");
a.equal(f.run('getMaxHp()-hpBefore24'),180);a.equal(f.run('getMaxMp()-mpBefore24'),60);a.equal(f.run('player.hp'),100);a.equal(f.run('player.mp'),30);
f.run('player.forgeV2825.items[testKey].level=10;forgeRegisterV2825(testKey,player.forgeV2825.items[testKey])');a.equal(f.run('getMaxHp()-hpBefore24'),180);
// Old values below the new minimum, plus pending choices, remain exactly as saved.
f.run("player.forgeV2825.items[testKey].affixes=[{stat:'hp',value:19},{stat:'atk',value:2}];player.forgeV2825.items[testKey].pending=[{stat:'mp',value:5},{stat:'def',value:2}];saveGame();player=loadGame().player;forgeOwnerV2825=null;forgeRestoreV2825(player)");
a.equal(f.run('JSON.stringify(player.forgeV2825.items[testKey].affixes)'),JSON.stringify([{stat:'hp',value:19},{stat:'atk',value:2}]));a.equal(f.run('player.forgeV2825.items[testKey].pending[0].value'),5);
// Local preference normalizes against the new scales; client protocol carries exact values.
f.run("player.equipmentInventory=[testKey];gameState='exploring';selectForgeV2825('bag',0)");a.equal(f.run('forgeAdviceStateV2842(forgeSelectionV2825,player.forgeV2825.items[testKey]).version'),3);
a.match(f.run("forgeLocalAdviceV2842({grade:3,goal:'survival',before:{atk:0,def:0,hp:90,mp:0},after:{atk:0,def:0,hp:180,mp:0}})"),/提升/);
const {validState,createHandler}=require(path.resolve(root,'../tencent-jev-function/index.js'));
const state={version:2,grade:3,goal:'survival',before:{atk:0,def:0,hp:90,mp:36},after:{atk:0,def:0,hp:180,mp:60}};
a.deepEqual(validState(state),state);a.throws(()=>validState({...state,version:1}));a.equal(validState({...state,version:1,after:state.before}).version,1);
for(const [stat,max] of Object.entries({atk:27,def:24,hp:180,mp:60})){
 const after={atk:0,def:0,hp:0,mp:0,[stat]:max};a.equal(validState({...state,after}).after[stat],max);
 for(const bad of [max+1,1.5,-1,'1',null])a.throws(()=>validState({...state,after:{...after,[stat]:bad}}));
}
(async()=>{let received;const handler=createHandler({env:{JEV_API_KEY:'mock',JEV_ACCESS_TOKEN:'test_access_12345678',JEV_ALLOWED_ORIGINS:'https://example.test'},call:async body=>{received=body;return {answers:{forge:{type:'choice',choice:'replace',confidence:.9,probabilities:{keep:.05,replace:.9,consider:.05}}}}}});
 const result=await handler({httpMethod:'POST',headers:{origin:'https://example.test','content-type':'application/json','x-xiantu-access':'test_access_12345678'},body:JSON.stringify(state)});
 a.equal(result.statusCode,200);a.equal(received.state.rules.maximumAffixByStat.hp,180);a.equal(received.state.after.hp,180);
 console.log('PASS quality fallback/explicit floors, costs, max rolls, pending guards, save restoration, exact worn bonuses/no instant recovery/no enhancement multiplication, legacy low values, local scoring, v1 compatibility and strict v2 cloud validation with mocked provider');
})().catch(e=>{console.error(e);process.exitCode=1});
