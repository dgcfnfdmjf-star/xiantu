'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),fixture=require('./v2858-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||'release-v2858/xiantu-v2831-scroll';
const key='xiantu_jev_device_v1',token='test_remembered_game_access_123';
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function page(saved=[],blocked=false){
 const f=fixture(root);f.c.AbortController=AbortController;f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;
 for(const [k,v] of saved)f.storage.set(k,v);
 if(blocked){f.c.localStorage.setItem=()=>{throw Error('blocked')};f.c.localStorage.removeItem=()=>{throw Error('blocked')};}
 for(const file of files)f.load(file);
 return f;
}
function begin(f){f.storage.set('xiantu_battle_presentation_v2756','report');f.run('startGame();closeWorldOverlay();startCombat({name:"野狼",hp:1000,maxHp:1000,atk:2,def:2,gold:1,exp:1});');f.timers.clear();}
function enable(f){f.ids.get('monsterAccessV2844').value=token;f.run('enableMonsterJevV2844()');}
(async()=>{
 const first=page();a.equal(first.run('FORGE_ADVICE_V2842.access'),'');a.equal(first.run('MONSTER_JEV_V2844.enabled'),false);begin(first);enable(first);
 const stored=JSON.parse(first.storage.get(key));a.equal(stored.access,token);a.equal(stored.monster,true);a.equal(stored.remember,true);
 a.equal(first.ids.get('monsterAccessV2844').value,'');a(!first.ids.get('monsterAiV2844').innerHTML.includes(token));a(!first.run('JSON.stringify(player)').includes(token));
 const refreshed=page([...first.storage]);a.equal(refreshed.run('FORGE_ADVICE_V2842.access'),token);a.equal(refreshed.run('MONSTER_JEV_V2844.enabled'),true);
 let network=0;refreshed.c.fetch=async()=>{network++;throw Error('not expected at boot')};begin(refreshed);a.equal(network,0);
 refreshed.run('disableMonsterJevV2844()');const off=page([...refreshed.storage]);a.equal(off.run('MONSTER_JEV_V2844.enabled'),false);a.equal(off.run('FORGE_ADVICE_V2842.access'),token);
 refreshed.run('setJevRememberV2845(false)');a(!refreshed.storage.get(key).includes(token));a.equal(refreshed.run('FORGE_ADVICE_V2842.access'),token);a.equal(page([...refreshed.storage]).run('FORGE_ADVICE_V2842.access'),'');
 first.storage.set('unrelated_save','keep_me');first.run('clearJevDeviceV2845()');a.equal(first.storage.has(key),false);a.equal(first.storage.get('unrelated_save'),'keep_me');a.equal(first.run('FORGE_ADVICE_V2842.access'),'');a.equal(first.run('MONSTER_JEV_V2844.enabled'),false);
 a.equal(page([...first.storage]).run('FORGE_ADVICE_V2842.access'),'');
 for(const raw of ['broken json',JSON.stringify({...stored,access:'short'}),JSON.stringify({...stored,endpoint:'https://untrusted.test/api'}),JSON.stringify({...stored,monster:'true'}),JSON.stringify({...stored,access:'apikey_'+token})])a.equal(page([[key,raw]]).run('FORGE_ADVICE_V2842.access'),'');
 const blocked=page([],true);begin(blocked);enable(blocked);a.equal(blocked.run('FORGE_ADVICE_V2842.access'),token);a.equal(blocked.run('JEV_DEVICE_V2845.saved'),false);a.match(blocked.run('jevDeviceStatusV2845()'),/未能保存/);
 const forge=page();forge.run('startGame();closeWorldOverlay();player.gold=10000;player.equipmentInventory=[Object.keys(EQUIPMENT_DB).find(k=>EQUIPMENT_DB[k].slot==="weapon")];selectForgeV2825("bag",0);mutateForgeV2825(forgeSelectionV2825.nonce,"wash")');
 forge.ids.get('forgeAccessV2842').value=token;forge.run('unlockForgeJevV2842(forgeSelectionV2825.nonce)');a.equal(JSON.parse(forge.storage.get(key)).access,token);a.equal(JSON.parse(forge.storage.get(key)).monster,false);
 forge.run('lockForgeJevV2842(forgeSelectionV2825.nonce)');a.equal(forge.storage.has(key),false);
 // Clearing during an actual pending enemy turn must not restore credentials or stall the fight.
 const pending=page([[key,JSON.stringify(stored)]]);begin(pending);pending.c.fetch=()=>new Promise(()=>{});
 const wait=pending.run('isPlayerTurn=false;enemyTurn()');pending.run('clearJevDeviceV2845()');await wait;pending.flush(150);
 a.equal(pending.run('isPlayerTurn'),true);a.equal(pending.storage.has(key),false);a.equal(pending.run('FORGE_ADVICE_V2842.access'),'');
 console.log('PASS remembered reload, shared access, remembered off, session-only opt-out, clear without save loss, malformed/API-key rejection, blocked-storage fallback, clear pending enemy turn');
})().catch(e=>{console.error(e);process.exitCode=1});
