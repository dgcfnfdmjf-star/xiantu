'use strict';
/* Adapted from user-supplied 仙途2.cjs; runs all 40 real scripts.
 * Keep the actual previous-character storage key. Quota failures fail closed:
 * the user must export first, rather than authorize an unarchived replacement.
 */
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const K='xiantu_save',B='xiantu_save_backup',PREV='xiantu_save_previous_character',BR='xiantu_save_before_replace_v2870';
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const tick=async()=>{for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r));};

// One game, loaded once; fresh() resets everything a scenario may have changed.
const f=fixture(root);f.c.File=File;f.c.console.log=()=>{};
for(const file of files)f.load(file);
a.equal(typeof f.c.dryRunLoadV2870,'function','save safety helper is installed');
Object.assign(f,{alerts:[],confirms:[],answers:[],resets:0,downloads:[],blobs:[]});
f.c.alert=m=>f.alerts.push(String(m));
f.c.confirm=m=>{f.confirms.push(String(m));return f.answers.length?f.answers.shift():true;};
// Count runtime resets. Poison ONE name so a save "parses but cannot be normalized";
// every other name goes through the real normalizePlayer chain.
const realReset=f.c.resetRuntimeState;f.c.resetRuntimeState=function(){f.resets++;return realReset.apply(this,arguments);};
const realNormalize=f.c.normalizePlayer;
f.c.normalizePlayer=function(p){if(p&&p.name==='BOOM')throw new Error('boom');return realNormalize.apply(this,arguments);};
// Record downloads (the fixture's <a>.click() does nothing).
const realCreate=f.c.document.createElement;
f.c.document.createElement=t=>{const e=realCreate(t);if(String(t).toLowerCase()==='a')e.click=()=>f.downloads.push({name:e.download,href:e.href});return e;};
const URLMock={createObjectURL:b=>{f.blobs.push(b);return 'blob:test/'+f.blobs.length;},revokeObjectURL(){}};
const origSetItem=f.c.localStorage.setItem,origMobile=f.c.isMobileV2870;

function fresh({live=false}={}){
  f.c.localStorage.setItem=origSetItem;f.c.URL=URLMock;f.c.isMobileV2870=origMobile;
  for(const k of ['share','canShare','clipboard'])delete f.c.navigator[k];
  for(const id of ['saveManagerV2768','rawSaveTextV2870'])f.ids.get(id)?.remove();
  f.ids.get('gameScreen')?.classList.add('hidden');
  f.run("gameState='start';saveImportBusyV2768=false;player=createDefaultPlayer()");
  if(live)f.run('startGame();closeWorldOverlay()');
  f.storage.clear();
  for(const k of ['alerts','confirms','answers','downloads','blobs'])f[k].length=0;f.resets=0;
}
const mkSave=(name,gold=100)=>f.run(`(()=>{const p=createDefaultPlayer();p.name=${JSON.stringify(name)};p.gold=${gold};return JSON.stringify({player:p,achievements:{progress:{},completed:[]},timestamp:1,version:SAVE_VERSION})})()`);
const file=raw=>({size:raw.length,text:async()=>raw});
const failKeys=(...keys)=>{const set=new Set(keys),orig=f.c.localStorage.setItem;f.c.localStorage.setItem=(k,v)=>{if(set.has(k))throw Object.assign(new Error('quota'),{name:'QuotaExceededError'});return orig(k,v);};};
const put=(k,raw)=>f.storage.set(k,raw),get=k=>f.storage.get(k);
const who=()=>f.run('player.name');

(async()=>{
// ===== Item 2: loading normalizes before it commits =====
fresh();{const bad=mkSave('BOOM'),good=mkSave('GOOD');put(K,bad);put(B,good);
  f.run('loadAndStart()');                                   // old code: reset, then throw, backup never tried
  a.equal(who(),'GOOD');a.equal(f.resets,1);a(f.alerts.some(m=>m.includes('备用档')));a.equal(get(K),bad,'main save is not deleted');}
fresh();put(K,mkSave('MAIN'));put(B,mkSave('GOOD'));f.run('loadAndStart()');a.equal(who(),'MAIN');a.equal(f.alerts.length,0);
fresh();put(B,mkSave('GOOD'));f.run('loadAndStart()');a.equal(who(),'GOOD');a(f.alerts.some(m=>m.includes('备用档')));
fresh();{const bad=mkSave('BOOM');put(K,bad);put(B,bad);f.run('loadAndStart()');
  a.equal(f.resets,0,'nothing is reset when no candidate can be loaded');a(f.ids.has('saveManagerV2768'));a(f.alerts[0].includes('原记录未删除'));a.equal(get(K),bad);a.equal(get(B),bad);}
fresh();f.run('loadAndStart()');a(f.ids.has('saveManagerV2768'));a.equal(f.resets,0);
fresh();put(K,mkSave('A<B'));put(B,mkSave('GOOD'));f.run('loadAndStart()');a.equal(who(),'GOOD','validator-rejected main falls back to backup');
console.log('PASS loading: backup fallback when normalization fails, no reset/deletion when nothing loads, validator-rejected main falls back');

// ===== Item 2/3: import =====
fresh();{const keep=mkSave('KEEP');put(K,keep);f.answers=[true];await f.c.importSaveV2768(file(mkSave('BOOM')));   // old code replaced main first
  a.equal(get(K),keep);a.equal(f.storage.has(BR),false);a.equal(f.resets,0);a(f.alerts.some(m=>m.includes('导入未完成')));a.equal(f.confirms.length,0);}
fresh();{const old=mkSave('OLD',5),nw=mkSave('NEW',9);put(K,old);f.answers=[true];await f.c.importSaveV2768(file(nw));
  a.equal(get(BR),old);a.equal(get(K),nw);a.equal(who(),'NEW');a(f.confirms[0].includes('替换前的记录'));}
fresh({live:true});{put(K,mkSave('STALE',5));f.run('player.gold=77');f.answers=[true];await f.c.importSaveV2768(file(mkSave('NEW',9)));
  a.equal(JSON.parse(get(BR)).player.gold,77,'archive holds live progress, not the stale stored save');}
fresh();{const keep=mkSave('KEEP');put(K,keep);f.run("gameState='combat'");await f.c.importSaveV2768(file(mkSave('NEW')));a.equal(get(K),keep);
  f.run("gameState='start'");f.answers=[false];await f.c.importSaveV2768(file(mkSave('NEW')));a.equal(get(K),keep);a.equal(f.storage.has(BR),false);}
console.log('PASS import: un-normalizable file changes nothing, good file archives the current record, live progress archived, combat/cancel safe');

fresh();{const old=mkSave('ONLY BACKUP');put(B,old);await f.c.importSaveV2768(file(mkSave('NEW')));a.equal(get(BR),old);a.equal(who(),'NEW');}
// ===== Item 3: swap, rollback, quota =====
fresh();{const cur=mkSave('CUR'),prev=mkSave('PREV');put(K,cur);put(PREV,prev);f.answers=[true];f.run('restorePreviousV2838()');
  a.equal(get(K),prev);a.equal(get(PREV),cur,'the character you leave becomes the new previous character');a.equal(who(),'PREV');a(f.confirms[0].includes('互换'));}
fresh();{const cur=mkSave('CUR'),prev=mkSave('PREV');put(K,cur);put(PREV,prev);f.answers=[true,true];f.run('restorePreviousV2838()');f.run('player.gold=456');const live=JSON.parse(f.run('JSON.stringify(createSaveDataV2768())'));f.run('restorePreviousV2838()');a.equal(get(K),cur);a.deepEqual(JSON.parse(get(PREV)).player,live.player);a.equal(JSON.parse(get(PREV)).player.gold,456);}
fresh();{const cur=mkSave('CUR'),prev=mkSave('PREV');put(K,cur);put(PREV,prev);f.answers=[true];failKeys(K);f.run('restorePreviousV2838()');
  a.equal(get(PREV),prev,'archive slot rolled back');a.equal(get(K),cur);a(f.alerts.some(m=>m.includes('未恢复')));}
fresh();{const old=mkSave('OLD');put(K,old);failKeys(BR);f.answers=[true];await f.c.importSaveV2768(file(mkSave('NEW')));
  a.equal(get(K),old);a.equal(f.resets,0);a(f.alerts.some(m=>m.includes('存储空间不足')));}
fresh();{const cur=mkSave('CUR',3),bak=mkSave('BAK',1);put(K,cur);put(B,bak);f.answers=[true,true];f.run('restoreBackupV2768()');
  a.equal(get(K),bak);a.equal(get(BR),cur);f.run('restoreBeforeReplaceV2870()');a.equal(get(K),cur,'undo via "restore replaced record"');}
fresh();{const cur=mkSave('CUR');put(K,cur);put(B,mkSave('BOOM'));f.answers=[true];f.run('restoreBackupV2768()');a.equal(get(K),cur);a.equal(f.storage.has(BR),false);a(f.alerts[0].includes('恢复失败'));}
fresh();{const old=mkSave('OLD');put(K,old);f.answers=[true];a.equal(f.run('prepareNewGameV2838()'),true);a.equal(get(PREV),old);}   // unchanged behaviour
console.log('PASS swap/archive: real previous-character swap and undo, rollback when the write fails, storage-full fails closed, restore-backup archive');

// ===== Item 1: export =====
fresh();{const raw=mkSave('A<B');put(K,raw);f.run('exportSaveV2768()');await tick();                       // old code: blocked by the validator
  a.equal(f.downloads.length,1);a.equal(await f.blobs[0].text(),raw);a(f.alerts.some(m=>m.includes('未通过导入安全校验')));}
fresh();put(K,mkSave('OK'));f.run('exportSaveV2768()');await tick();a.equal(f.downloads.length,1);a.equal(f.alerts.length,0);a(/^xiantu-save-\d+\.json$/.test(f.downloads[0].name));
fresh();put(B,mkSave('A&B"x'));put(PREV,mkSave('P<Q'));f.run('exportSaveV2768(true);exportPreviousV2838()');await tick();a.equal(f.downloads.length,2);
fresh();f.run('exportPreviousV2838();exportSaveV2768(true)');await tick();a.equal(f.alerts.length,2);a(f.alerts.every(m=>m.includes('导出失败')));
fresh();{put(K,mkSave('OK'));let shared=null;f.c.isMobileV2870=()=>true;f.c.navigator.canShare=()=>true;f.c.navigator.share=async o=>{shared=o;};
  f.run('exportSaveV2768()');await tick();a(shared&&shared.files[0].name.endsWith('.json'));a.equal(f.downloads.length,0);
  fresh();put(K,mkSave('OK'));f.c.isMobileV2870=()=>true;f.c.navigator.canShare=()=>true;f.c.navigator.share=async()=>{throw Object.assign(new Error('x'),{name:'AbortError'});};
  f.run('exportSaveV2768()');await tick();a.equal(f.downloads.length,0,'cancelling the share sheet does not fall through to a download');a.equal(f.alerts.length,0);}
fresh();{put(K,mkSave('OK'));let used=false;f.c.isMobileV2870=()=>false;f.c.navigator.canShare=()=>true;f.c.navigator.share=async()=>{used=true;};
  f.run('exportSaveV2768()');await tick();a.equal(used,false);a.equal(f.downloads.length,1);}
fresh();{const raw=mkSave('OK');put(K,raw);f.c.URL={createObjectURL(){throw new Error('blocked');}};let copied=null;f.c.navigator.clipboard={writeText:async t=>{copied=t;}};
  f.run('exportSaveV2768()');await tick();a.equal(copied,raw);a(f.alerts.some(m=>m.includes('已复制')));
  fresh();put(K,raw);f.c.URL={createObjectURL(){throw new Error('blocked');}};f.run('exportSaveV2768()');await tick();
  const overlay=f.ids.get('rawSaveTextV2870');a(overlay,'manual-copy text box appears');a.equal(overlay.children[0].children[2].value,raw);}
fresh();{const raw=mkSave('OK');put(K,raw);let copied=null;f.c.navigator.clipboard={writeText:async t=>{copied=t;}};f.run('copySaveTextV2870()');await tick();a.equal(copied,raw);}
fresh();{f.run('showSaveManagerV2768()');const html=f.ids.get('saveManagerV2768').innerHTML;
  for(const s of ['copySaveTextV2870()','restoreBeforeReplaceV2870()','exportBeforeReplaceV2870()','exportSaveV2768()','exportSaveV2768(true)','restoreBackupV2768()','restorePreviousV2838()','exportPreviousV2838()','importSaveV2768(this.files[0])'])a(html.includes(s),s);}
console.log('PASS export: never gated by the validator, share on phones only, cancel does not download, download->clipboard->manual text fallbacks, manager controls');

// ===== Additions that only make sense against the real game =====
fresh({live:true});{const raw=mkSave('DRY'),before=f.run('JSON.stringify(player)'),ref=f.run('player'),keys=Object.keys(f.c).length,store=JSON.stringify([...f.storage]);
  f.run(`dryRunLoadV2870(${JSON.stringify(raw)})`);
  a.equal(f.run('JSON.stringify(player)'),before,'dry run must not change the live player');a.equal(f.run('player'),ref);a.equal(Object.keys(f.c).length,keys,'dry run must not create globals');a.equal(JSON.stringify([...f.storage]),store);}
fresh({live:true});{f.run('player.name="RT";player.gold=4242');f.run('exportSaveV2768()');await tick();const exported=await f.blobs[0].text();     // export -> import round trip
  fresh();await f.c.importSaveV2768(file(exported));a.equal(who(),'RT');a.equal(f.run('player.gold'),4242);}
// Stale asynchronous reads must not replace a character switched during file.text().
fresh();{const keep=mkSave('KEEP');put(K,keep);let finish;const pending=f.c.importSaveV2768({size:10,text:()=>new Promise(r=>finish=r)});f.run('player=createDefaultPlayer()');finish(mkSave('NEW'));await pending;a.equal(get(K),keep);a.equal(f.resets,0);a.equal(f.confirms.length,0);}
fresh();{const keep=mkSave('KEEP'),bad=JSON.parse(mkSave('BAD'));bad.achievements.completed={wrong:true};put(K,keep);await f.c.importSaveV2768(file(JSON.stringify(bad)));a.equal(get(K),keep);a.equal(f.resets,0);a.equal(f.confirms.length,0);}
fresh();{const cur=mkSave('CUR'),bak=mkSave('BAK'),archive=mkSave('ARCHIVE');put(K,cur);put(B,bak);put(BR,archive);const before=JSON.stringify([...f.storage]);failKeys(K);await f.c.importSaveV2768(file(mkSave('NEW')));a.equal(JSON.stringify([...f.storage]),before);a.equal(f.resets,0);}
fresh();{const cur=mkSave('CUR');put(K,cur);f.run("gameState='combat-ending'");await f.c.importSaveV2768(file(mkSave('NEW')));a.equal(get(K),cur);f.run("gameState='exploring';player.breakthrough.isAnimating=true");f.run('restoreBackupV2768();restorePreviousV2838();restoreBeforeReplaceV2870()');a.equal(get(K),cur);a.equal(f.resets,0);}
fresh();{const raw=mkSave('<img src=x onerror=alert(1)>');f.c.URL={createObjectURL(){throw Error('blocked');}};put(K,raw);await f.c.exportSaveV2768();const area=f.ids.get('rawSaveTextV2870').children[0].children[2];a.equal(area.value,raw);a.equal(area.innerHTML,'');}
console.log('PASS real-game checks: dry run unchanged, export/import round trip, stale async read, malformed achievements, all-slot rollback, battle/breakthrough guards, inert recovery text');
a.equal(f.errors.length,0,JSON.stringify(f.errors));
})().catch(e=>{console.error(e);process.exitCode=1;});
