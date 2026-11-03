'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function setup(){const f=fixture(root);f.c.console.log=()=>{};for(const name of files)f.load(name);f.run('player=createDefaultPlayer();gameState="exploring";player.gold=120;saveGame();bindSaveSessionV2868102()');return f;}
function newer(f,gold=1620){const d=JSON.parse(f.storage.get('xiantu_save'));d.player.gold=gold;d.timestamp++;const raw=JSON.stringify(d);f.storage.set('xiantu_save',raw);return raw;}
for(const action of ['saveGame()','autoSave()','manualSave()','deleteSave()','newGame()','startGame()','loadAndStart()','replaceSaveV2870(JSON.stringify(createSaveDataV2768()),{player})']){
 const f=setup(),raw=newer(f),backup=f.storage.get('xiantu_save_backup');try{f.run(action)}catch(_){}
 a.equal(f.storage.get('xiantu_save'),raw,action+' preserves newer main');a.equal(f.storage.get('xiantu_save_backup'),backup,action+' preserves backup');a(f.run('SAVE_SESSION_V2868102.stale'));a(f.ids.has('saveConflictV2868102'));a.equal(f.run('player.gold'),120);
}
{const f=setup();f.storage.delete('xiantu_save');a.equal(f.run('saveGame()'),false);a.equal(f.storage.has('xiantu_save'),false,'old page cannot resurrect deleted save');}
{const f=setup(),raw=f.storage.get('xiantu_save');newer(f);f.run('saveGame()');f.storage.set('xiantu_save',raw);a.equal(f.run('saveGame()'),false,'conflict is sticky even if raw restored');}
{const f=setup();f.run('player.gold=300;saveGame();player.gold=400;saveGame()');a.equal(JSON.parse(f.storage.get('xiantu_save')).player.gold,400);a.equal(JSON.parse(f.storage.get('xiantu_save_backup')).player.gold,300);a.equal(f.run('SAVE_SESSION_V2868102.stale'),false);}
{const f=setup(),before=f.storage.get('xiantu_save'),set=f.c.localStorage.setItem;f.c.localStorage.setItem=(k,v)=>{if(k==='xiantu_save')throw Error('quota');return set(k,v)};f.run('player.gold=150');a.equal(f.run('saveGame()'),false);a.equal(f.run('SAVE_SESSION_V2868102.raw'),before);f.c.localStorage.setItem=set;a(f.run('saveGame()'),'retry after quota error');}
{const f=setup();f.run('globalThis.copy102=createSaveDataV2768();copy102.player.gold=998;replaceSaveV2870(JSON.stringify(copy102),dryRunLoadV2870(JSON.stringify(copy102)))');a.equal(f.run('player.gold'),998);a(f.run('saveGame()'));a.equal(f.run('SAVE_SESSION_V2868102.stale'),false);}
console.log('PASS save conflicts: stale autosave/manual/import/restore/new/load/delete gates, deletion, sticky conflict, backup preservation, quota retry and valid replacement');
