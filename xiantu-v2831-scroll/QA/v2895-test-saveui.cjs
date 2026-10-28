'use strict';
/*
 * QA/v2895-test-saveui.cjs - V2895 存档护身 + 手机界面 (xiantu-v2895-saveui.js and its small hooks in core / systems / equipment manager).
 * Save safety: IndexedDB mirror of the main save (written only after localStorage succeeded, throttled, flushed on hide,
 * a lagging 'daily' copy), start-screen restore offer (never automatic, never after a deliberate delete), persistent-storage
 * request (once per session, never on the title screen, not auto on Firefox), export reminder rules, save-manager section.
 * Phone UI: no English slot or type keys in the equipment panel, bag or market; minimap zoom buttons and status text sizes.
 * Guards: the save itself is byte-for-byte what it was without V2895, and V2895 never writes the main save on its own.
 * Run:  XIANTU_TEST_ROOT=xiantu-v2831-scroll node xiantu-v2831-scroll/QA/v2895-test-saveui.cjs
 */
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const html=fs.readFileSync(root+'/game-v2762.html','utf8'),files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
const ME='xiantu-v28684-duel.js',DAY=86400e3;
const drain=async(n=8)=>{for(let i=0;i<n;i++)await new Promise(r=>setImmediate(r));};

// Minimal in-memory IndexedDB: open/upgrade/success, one object store, get/put/delete, oncomplete/onerror.
function fakeIDB(){
 const dbs=new Map(),api={dbs,failPut:false,opens:0,
  open(name){api.opens++;const req={};queueMicrotask(()=>{let db=dbs.get(name);const isNew=!db;if(isNew){db={stores:new Map()};dbs.set(name,db);}
   req.result=db.handle||(db.handle=handle(db));if(isNew)req.onupgradeneeded?.();req.onsuccess?.();});return req;},
  peek(name,store,key){const v=dbs.get(name)?.stores.get(store)?.get(key);return v&&structuredClone(v);},
  poke(name,store,key,v){dbs.get(name).stores.get(store).set(key,structuredClone(v));}};
 function handle(db){return {close(){},createObjectStore(n){db.stores.set(n,new Map());},
  transaction(n,mode){const tx={},ops=[];let aborted=false;
   const store={get(k){const req={};ops.push(()=>{req.result=staged.has(k)?structuredClone(staged.get(k)):undefined;req.onsuccess?.();});return req;},
    put(v,k){if(mode!=='readwrite')throw Error('readonly');ops.push(()=>{if(api.failPut)throw Error('QuotaExceededError');staged.set(k,structuredClone(v));});},
    delete(k){ops.push(()=>staged.delete(k));}};
   let staged;tx.objectStore=()=>store;tx.abort=()=>{aborted=true;};
   setImmediate(()=>{try{staged=new Map(db.stores.get(n));for(let i=0;i<ops.length;i++){if(aborted)throw Error('aborted');ops[i]();}
    if(aborted)throw Error('aborted');if(mode==='readwrite')db.stores.set(n,staged);tx.oncomplete?.();
   }catch(e){tx.error=e;tx.onerror?.();}});return tx;}};}

 return api;
}
function game(list=files,{idb=true}={}){
 const f=fixture(root);f.c.console.log=()=>{};f.c.console.warn=(...x)=>f.errors.push(['warn',...x]);
 if(idb)f.c.indexedDB=f.idb=fakeIDB();
 f.c.queueMicrotask=queueMicrotask;
 for(const file of files){if(file===ME&&!list.includes(ME)){const code=fs.readFileSync(root+'/'+file,'utf8').replace(/\/\/ BEGIN SAVE_UI_V2895[\s\S]*?\/\/ END SAVE_UI_V2895/, '');f.run(code);}else f.load(file);}return f;
}
const J=(f,code)=>JSON.parse(f.run(`JSON.stringify(${code})`));
function fresh(f,setup=''){f.run(`resetRuntimeState();player=createDefaultPlayer();player.name='镜中人';gameState='exploring';currentRegion='south';player.level=4;player.phase=1;player.gold=1234;player.hp=getMaxHp();
 document.getElementById('startScreen').classList.add('hidden');document.getElementById('gameScreen').classList.remove('hidden');${setup}`);f.c.confirm=()=>true;}
function startScreen(f){f.run(`document.getElementById('startScreen').classList.remove('hidden');document.getElementById('gameScreen').classList.add('hidden');SAVEUI_STATE_V2895.offerShown=false;document.getElementById('mirrorOfferV2895')?.remove();`);}
async function flushMirror(f){
 for(let i=0;i<4;i++){
  const id=f.run('SAVEUI_STATE_V2895.mirror.timer');
  if(id){const t=f.timers.get(id);f.timers.delete(id);f.run('SAVEUI_STATE_V2895.mirror.timer=null');t.f();}
  await drain();
  if(!f.run('SAVEUI_STATE_V2895.mirror.busy')&&!f.run('SAVEUI_STATE_V2895.mirror.pending'))return;
 }
}
const visibleText=h=>String(h).replace(/<(script|style)[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&[a-z#0-9]+;/gi,' ');

(async()=>{
// ---------------------------------------------------------------- loading ----
a.equal(files.at(-1),ME,'loads last, after V2894');
const f=game();const MDB=J(f,'SAVEUI_V2895.mirror');
a.equal(f.run(`window.__xiantuBuildFilesV2814["${ME}"]`),html.match(/var expectedBuild='([^']+)'/)[1],'build stamp');
a.equal(f.run('Object.isFrozen(SAVEUI_V2895)&&Object.isFrozen(SAVEUI_V2895.ui)&&Object.isFrozen(SAVEUI_V2895.remind)'),true,'config frozen');
for(const h of ['saveMirrorV2895','saveMirrorClearedV2895','saveMirrorOfferV2895','saveExportedV2895','saveManagerExtraV2895'])a.equal(f.run(`typeof window.${h}`),'function',h+' exposed');

// ---------------------------------------------------------------- labels: no English keys on screen ----
{const slots=J(f,'EQUIPMENT_SLOTS'),han=/^[㐀-鿿·]+$/;
 for(const [k,s] of Object.entries(slots)){a.equal(f.run(`equipSlotLabelV2895('${k}')`),s.label);a.match(f.run(`equipTypeLabelV2895('${s.type}')`),han,`type ${s.type} is Chinese`);}
 for(const [name,d] of Object.entries(J(f,'EQUIPMENT_DB')))a.match(f.run(`equipSlotLabelV2895(${JSON.stringify(d.slot)})`),han,`slot of ${name}`);
 a.equal(f.run("equipSlotLabelV2895('ring')"),'戒指');a.equal(f.run("equipSlotLabelV2895('artifact')"),'法宝');a.equal(f.run("equipSlotLabelV2895('nonsense')"),'装备','unknown slot never shows its key');
 a.equal(f.run("equipTypeLabelV2895('nonsense')"),'装备');}
{fresh(f,'player.gold=999999;player.level=8;player.equipmentInventory=Object.keys(EQUIPMENT_DB).slice(0,40)');
 const shown=[];const base=f.c.showStory;f.c.showStory=(h,...r)=>{shown.push(['story',h]);return base(h,...r);};
 const keys=new Set([...Object.keys(J(f,'EQUIPMENT_SLOTS')),'ring','artifact','armor','jewelry','weapon','life_artifact']);
 const leak=t=>(visibleText(t).match(/[A-Za-z_]{3,}/g)||[]).filter(w=>keys.has(w));
 for(const cat of ['weapon','armor'])for(let g=0;g<6;g++){shown.length=0;f.run(`showMarketGearV2800('${cat}',${g})`);for(const [,h] of shown)a.deepEqual(leak(h),[],`market ${cat} grade ${g}`);}
 shown.length=0;f.run('showEquipmentInventory()');for(const [,h] of shown)a.deepEqual(leak(h),[],'equipment bag');
 const slotsHtml=f.run('renderEquipSlots(Object.keys(EQUIPMENT_SLOTS))');a(slotsHtml.length>500,'slot rows rendered');a.deepEqual(leak(slotsHtml),[],'equipment slot rows');
 for(const w of ['防具','饰品','兵器','法宝'])a(visibleText(slotsHtml).includes(w),w+' shown');
 shown.length=0;f.run('showEquipmentPanel()');const panel=f.run("document.getElementById('equipmentPanel')");a(panel,'equipment panel opens');
 a.deepEqual(leak((panel._html||'')+shown.map(x=>x[1]).join('')),[],'equipment panel');
 for(const file of ['xiantu-v2762-core.js','xiantu-v2762-12-v277equipmentmanager.js']){const src=fs.readFileSync(root+'/'+file,'utf8');
  a(!src.includes('>${s.type}<'),file+': no raw slot type printed');a(!/EQUIPMENT_SLOTS\[[^\]]+\]\?\.name/.test(src),file+': no .name lookups on slots');}
 f.c.showStory=base;}

// ---------------------------------------------------------------- IndexedDB mirror ----
fresh(f);
{const ls=f.c.localStorage;
 a.equal(f.run('saveGame()'),true);await flushMirror(f);
 const main=f.idb.peek(MDB.db,MDB.store,'main');a(main,'main mirror written');
 a.equal(main.raw,ls.getItem('xiantu_save'),'mirror is the exact main save');a.equal(main.name,'镜中人');a.equal(main.level,4);
 a.equal(f.run('SAVEUI_STATE_V2895.mirror.status'),'ok');
 // throttle: saves inside the interval wait for one coalesced write
 const w0=f.run('SAVEUI_STATE_V2895.mirror.writes');
 f.run('player.gold=2000;saveGame();player.gold=2500;saveGame()');await drain();
 a.equal(f.run('SAVEUI_STATE_V2895.mirror.writes'),w0,'no write inside the 15 s interval');
 const tid=f.run('SAVEUI_STATE_V2895.mirror.timer');a(tid&&f.timers.get(tid).delay>MDB.minIntervalMs-2000,'one timer for the rest of the interval');
 // page hide flushes now
 const hide=(f.events.visibilitychange||[]).find(fn=>String(fn).includes('flushNow'));a(hide,'visibilitychange listener');
 f.run("document.visibilityState='hidden'");hide();f.run("document.visibilityState='visible'");await drain();
 a.equal(f.run('SAVEUI_STATE_V2895.mirror.writes'),w0+1,'exactly one coalesced write');a.equal(JSON.parse(f.idb.peek(MDB.db,MDB.store,'main').raw).player.gold,2500,'latest save wins');
 a(!f.timers.has(tid),'pending timer cleared');a((f.events.pagehide||[]).some(fn=>String(fn).includes('suMirrorScheduleV2895(true)')),'pagehide flushes too');
 // 'daily' lags: first write with no daily rotates the previous main in; a fresh daily is kept
 const d1=f.idb.peek(MDB.db,MDB.store,'daily');a(d1&&JSON.parse(d1.raw).player.gold!==2500,'daily holds an older copy');
 f.run('player.gold=3000;saveGame()');f.run('suMirrorScheduleV2895(true)');await drain();
 a.equal(f.idb.peek(MDB.db,MDB.store,'daily').savedAt,d1.savedAt,'daily not replaced within 20 h');
 const old=f.idb.peek(MDB.db,MDB.store,'daily');old.savedAt-=MDB.dailyMs+1;f.idb.poke(MDB.db,MDB.store,'daily',old);
 const prevMain=f.idb.peek(MDB.db,MDB.store,'main');
 f.run('player.gold=3100;saveGame()');f.run('suMirrorScheduleV2895(true)');await drain();
 a.equal(f.idb.peek(MDB.db,MDB.store,'daily').raw,prevMain.raw,'stale daily replaced by the previous main, not the new one');
 // the mirror never writes the main save, and the main save never waits for it
 const writes=[];const set=ls.setItem;ls.setItem=(k,v)=>{writes.push(k);return set(k,v);};
 f.run('saveMirrorV2895(localStorage.getItem("xiantu_save"))');f.run('suMirrorScheduleV2895(true)');await drain();
 ls.setItem=set;a(!writes.some(k=>k==='xiantu_save'||k==='xiantu_save_backup'),'mirror flush touches no save keys');
 // write failure is invisible to saving
 f.idb.failPut=true;a.equal(f.run('saveGame()'),true,'saveGame still succeeds');f.run('suMirrorScheduleV2895(true)');await drain();
 a.equal(f.run('SAVEUI_STATE_V2895.mirror.status'),'error');f.idb.failPut=false;
 // a failed localStorage write never reaches the mirror
 {f.run('SAVEUI_STATE_V2895.mirror.pending=null');const set=ls.setItem;ls.setItem=(k,v)=>{if(k==='xiantu_save'){const e=Error('full');e.name='QuotaExceededError';throw e;}return set(k,v);};
  a.equal(f.run('player.gold=7777;saveGame()'),false,'main save failed');ls.setItem=set;a.equal(f.run('SAVEUI_STATE_V2895.mirror.pending'),null,'failed save not mirrored');
  a.equal(f.errors.filter(e=>e[0]==='保存失败:').length,1,'the game logged its own save failure');f.errors.splice(0);}
 // invalid saves never reach the hook
 const before=f.run('SAVEUI_STATE_V2895.mirror.pending');a.throws(()=>f.run('writeSaveV2768("{}")'));a.equal(f.run('SAVEUI_STATE_V2895.mirror.pending'),before,'rejected save not mirrored');
 // test account 999 does not go through the mirror
 f.run('SAVEUI_STATE_V2895.mirror.pending=null');const w9=f.run('SAVEUI_STATE_V2895.mirror.writes');
 f.run('player.testAccount999=true;try{saveGame()}catch(_){};player.testAccount999=false');a.equal(f.run('SAVEUI_STATE_V2895.mirror.pending'),null,'999 account not mirrored');a.equal(f.run('SAVEUI_STATE_V2895.mirror.writes'),w9);}
// no IndexedDB at all: saving is unaffected
{const g=game(files,{idb:false});fresh(g);a.equal(g.run('saveGame()'),true);g.run('suMirrorScheduleV2895(true)');await drain();
 a.equal(g.run('SAVEUI_STATE_V2895.mirror.status'),'unavailable');a(g.c.localStorage.getItem('xiantu_save'),'main save written');
 startScreen(g);g.c.localStorage.removeItem('xiantu_save');g.c.localStorage.removeItem('xiantu_save_backup');
 a.equal(await g.run('saveMirrorOfferV2895()'),false,'no offer without IndexedDB');}

// ---------------------------------------------------------------- restore offer ----
{fresh(f,'player.gold=4242');f.run('saveGame()');f.run('suMirrorScheduleV2895(true)');await drain();
 const raw=f.idb.peek(MDB.db,MDB.store,'main').raw,ls=f.c.localStorage;
 startScreen(f);a.equal(await f.run('saveMirrorOfferV2895()'),false,'local save present: no offer');
 ls.removeItem('xiantu_save');ls.removeItem('xiantu_save_backup');
 f.run("document.getElementById('startScreen').classList.add('hidden');document.getElementById('gameScreen').classList.remove('hidden')");
 a.equal(await f.run('saveMirrorOfferV2895()'),false,'not on the title screen: no offer');
 startScreen(f);a.equal(await f.run('saveMirrorOfferV2895()'),true,'title screen without a local save offers the mirror');
 const dlg=f.run("document.getElementById('mirrorOfferV2895')");a(dlg._html.includes('镜中人')&&dlg._html.includes(f.run('getCultivationName(4,1)')),'shows name and realm');
 a.equal(ls.getItem('xiantu_save'),null,'nothing written before the player agrees');
 a.equal(await f.run('saveMirrorOfferV2895()'),false,'offered once');
 const btn=k=>{const out=[];const walk=n=>{for(const c of n.children){if(c.dataset?.su===k)out.push(c);walk(c);}};walk(dlg);return out[0];};
 // 暂不恢复
 dlg.listeners.click[0]({target:{closest:()=>btn('skip')}});a.equal(f.run("document.getElementById('mirrorOfferV2895')"),null);a.equal(ls.getItem('xiantu_save'),null,'skip writes nothing');
 // 恢复
 startScreen(f);await f.run('saveMirrorOfferV2895()');const dlg2=f.run("document.getElementById('mirrorOfferV2895')");
 const b2=(()=>{const out=[];const walk=n=>{for(const c of n.children){if(c.dataset?.su==='restore')out.push(c);walk(c);}};walk(dlg2);return out[0];})();
 dlg2.listeners.click[0]({target:{closest:()=>b2}});
 a.equal(ls.getItem('xiantu_save'),raw,'restore writes the mirror as the main save');a.equal(f.run("document.getElementById('loadDialog').style.display"),'flex','continue dialog shown');
 a.match(f.run("document.getElementById('saveInfo').innerHTML"),/备用库/);
 // a local save appearing meanwhile is never overwritten
 startScreen(f);ls.removeItem('xiantu_save');ls.removeItem('xiantu_save_backup');await f.run('saveMirrorOfferV2895()');
 const dlg3=f.run("document.getElementById('mirrorOfferV2895')");const b3=(()=>{const out=[];const walk=n=>{for(const c of n.children){if(c.dataset?.su==='restore')out.push(c);walk(c);}};walk(dlg3);return out[0];})();
 ls.setItem('xiantu_save_backup','LOCAL');let alerted='';f.c.alert=m=>{alerted=m;};
 dlg3.listeners.click[0]({target:{closest:()=>b3}});a.equal(ls.getItem('xiantu_save'),null);a.equal(ls.getItem('xiantu_save_backup'),'LOCAL');a.match(alerted,/未覆盖/);f.c.alert=()=>{};
 ls.removeItem('xiantu_save_backup');
 // corrupt main falls back to the older daily copy
 const m=f.idb.peek(MDB.db,MDB.store,'main');f.idb.poke(MDB.db,MDB.store,'main',{...m,raw:'{"broken":'});
 startScreen(f);a.equal(await f.run('saveMirrorOfferV2895()'),true);a.match(f.run("document.getElementById('mirrorOfferV2895')._html"),/较早的一份/,'daily offered when main is unreadable');
 const dly=f.idb.peek(MDB.db,MDB.store,'daily');f.idb.poke(MDB.db,MDB.store,'daily',{...dly,raw:'{"version":12,"player":{"level":-1,"inventory":[]}}'});
 startScreen(f);a.equal(await f.run('saveMirrorOfferV2895()'),false,'records that fail the save checks are never offered');
 f.idb.poke(MDB.db,MDB.store,'daily',dly);f.idb.poke(MDB.db,MDB.store,'main',m);
 // deleteSave tombstones and clears the mirror
 f.run('deleteSave()');await drain();a(Number(ls.getItem('xiantu_mirror_cleared_v2895'))>0);
 a.equal(f.idb.peek(MDB.db,MDB.store,'main'),undefined,'mirror cleared');startScreen(f);a.equal(await f.run('saveMirrorOfferV2895()'),false,'nothing offered after a delete');
 // records older than the tombstone are ignored even if still present
 f.idb.poke(MDB.db,MDB.store,'main',m);ls.setItem('xiantu_mirror_cleared_v2895',String(m.savedAt+1));startScreen(f);a.equal(await f.run('saveMirrorOfferV2895()'),false,'older than the delete: ignored');
 ls.removeItem('xiantu_mirror_cleared_v2895');}

// ---------------------------------------------------------------- persistent storage ----
{const calls={persist:0};let grant=false;
 f.c.navigator.storage={persisted:async()=>grant,persist:async()=>{calls.persist++;return grant;}};
 const reset=()=>{f.run("SAVEUI_STATE_V2895.persist.state='unknown';SAVEUI_STATE_V2895.persist.askedThisSession=false");f.c.localStorage.removeItem('xiantu_persist_v2895');};
 fresh(f);f.run('saveGame()');reset();
 startScreen(f);f.run('suPersistGestureV2895()');await drain();a.equal(calls.persist,0,'never asked on the title screen');
 fresh(f);f.run('suPersistGestureV2895()');await drain();a.equal(calls.persist,1,'first tap in game asks once');
 a.equal(f.run('SAVEUI_STATE_V2895.persist.state'),'denied');a.equal(JSON.parse(f.c.localStorage.getItem('xiantu_persist_v2895')).state,'denied');
 f.c.localStorage.removeItem('xiantu_persist_v2895');f.run('suPersistGestureV2895()');await drain();a.equal(calls.persist,1,'once per session');
 f.c.localStorage.setItem('xiantu_persist_v2895',JSON.stringify({at:Date.now(),state:'denied'}));
 f.run('SAVEUI_STATE_V2895.persist.askedThisSession=false');f.run('suPersistGestureV2895()');await drain();a.equal(calls.persist,1,'not again within 3 days');
 const rec=JSON.parse(f.c.localStorage.getItem('xiantu_persist_v2895'));rec.at-=3*DAY+1;f.c.localStorage.setItem('xiantu_persist_v2895',JSON.stringify(rec));
 f.run('suPersistGestureV2895()');await drain();a.equal(calls.persist,2,'asks again after 3 days');
 reset();grant=true;f.run('suPersistGestureV2895()');await drain();a.equal(calls.persist,2,'already granted: no request');a.equal(f.run('SAVEUI_STATE_V2895.persist.state'),'granted');
 grant=false;reset();const ua=f.c.navigator.userAgent;f.c.navigator.userAgent='Mozilla/5.0 (X11; Linux) Gecko/20100101 Firefox/131.0';
 f.run('suPersistGestureV2895()');await drain();a.equal(calls.persist,2,'Firefox: no automatic prompt');
 a.equal(await f.run('requestPersistV2895()'),'denied');a.equal(calls.persist,3,'Firefox: the button asks');f.c.navigator.userAgent=ua;
 reset();f.c.localStorage.removeItem('xiantu_save');f.c.localStorage.removeItem('xiantu_save_backup');f.run('suPersistGestureV2895()');await drain();a.equal(calls.persist,3,'no save yet: not asked');
 delete f.c.navigator.storage;reset();a.equal(await f.run('requestPersistV2895()'),'unsupported','missing API handled');}

// ---------------------------------------------------------------- export reminder ----
{const K=J(f,'SAVEUI_V2895.keys'),R=J(f,'SAVEUI_V2895.remind'),ls=f.c.localStorage,now=Date.now();
 const due=(t=now)=>J(f,`exportReminderDueV2895(${t})`);
 fresh(f);for(const k of Object.values(K))ls.removeItem(k);
 a.equal(due(),null,'unknown first save: no reminder');
 ls.setItem(K.firstSeen,String(now-(R.firstAfterDays*DAY-1000)));a.equal(due(),null,'never exported, under 2 days');
 ls.setItem(K.firstSeen,String(now-R.firstAfterDays*DAY));a.equal(due().reason,'never','never exported, 2 days');
 f.run('saveExportedV2895("file")');const ex=JSON.parse(ls.getItem(K.exported));a.equal(ex.kind,'file');a.equal(due(),null,'just exported');
 a.equal(due(now+R.everyDays*DAY+1000),null,'7 days, no progress since: quiet');a.equal(due(now+30*DAY),null,'30 days, no progress: still quiet');
 f.run('player.exp+=10');a.equal(due(now+(R.everyDays*DAY-60000)),null,'progress, under 7 days');a.equal(due(now+R.everyDays*DAY+1000).reason,'overdue','7 days with progress');
 f.run('player.level+=1');a.equal(due(now+DAY-60000),null,'new realm, under a day');a.equal(due(now+DAY+1000).reason,'realm','new realm after a day');
 const t1=now+DAY+1000;ls.setItem(K.snooze,String(t1));a.equal(due(t1+R.snoozeHours*3600e3-1000),null,'稍后 snoozes');a(due(t1+R.snoozeHours*3600e3),'snooze ends');ls.removeItem(K.snooze);ls.removeItem(K.snooze);
 f.run('player.testAccount999=true');a.equal(due(now+30*DAY),null,'999 account never reminded');f.run('player.testAccount999=false');
 // exporting writes only device keys: the save after an export equals the save before it
 const s0=J(f,'(()=>{const d=createSaveDataV2768();delete d.timestamp;return d})()');f.run('saveExportedV2895("text")');
 a.deepEqual(J(f,'(()=>{const d=createSaveDataV2768();delete d.timestamp;return d})()'),s0,'export does not change the save');
 // exports through the real buttons
 f.run('player.gold+=1;saveGame();player.gold+=1;saveGame()');a(ls.getItem('xiantu_save_backup'),'backup exists');
 ls.removeItem(K.exported);let exportedRaw=null;const er=f.c.exportRawSaveV2870;f.c.exportRawSaveV2870=async r=>{exportedRaw=r;return true;};
 await f.run('exportSaveV2768(true)');f.c.exportRawSaveV2870=er;a.equal(exportedRaw,ls.getItem('xiantu_save_backup'),'backup exported');a.equal(ls.getItem(K.exported),null,'backup export is not the current save');
 await f.run('exportSaveV2768()');a.equal(JSON.parse(ls.getItem(K.exported)).kind,'file','export records');
 ls.removeItem(K.exported);f.c.navigator.clipboard={writeText:async()=>{}};await f.run('copySaveTextV2870()');a.equal(JSON.parse(ls.getItem(K.exported)).kind,'text','copy records');
 ls.removeItem(K.exported);delete f.c.navigator.clipboard;await f.run('copySaveTextV2870()');a.equal(ls.getItem(K.exported),null,'manual text window does not count as copied');
 ls.removeItem(K.exported);f.c.File=class{constructor(p,n){this.name=n;}};f.c.navigator.canShare=()=>true;f.c.navigator.share=async()=>{const e=Error('cancel');e.name='AbortError';throw e;};
 await f.run('exportSaveV2768()');a.equal(ls.getItem(K.exported),null,'cancelled share is not an export');
 f.c.navigator.share=async()=>{};await f.run('exportSaveV2768()');a.equal(JSON.parse(ls.getItem(K.exported)).kind,'file','completed share records');
 delete f.c.File;delete f.c.navigator.share;delete f.c.navigator.canShare;
 // the tick: session delay, quiet map, once per session
 ls.removeItem(K.exported);ls.setItem(K.firstSeen,String(now-5*DAY));
 f.run("closeWorldOverlay();for(const id of ['equipmentPanel','saveManagerV2768','mirrorOfferV2895','rawSaveTextV2870'])document.getElementById(id)?.remove()");a.equal(f.run('isWorldOverlayOpen()'),false,'map is quiet');
 f.run('SAVEUI_STATE_V2895.remind.shownThisSession=false;SAVEUI_STATE_V2895.remind.sessionStart=Date.now()');a.equal(f.run('suRemindTickV2895()'),null,'not in the first 90 s');
 f.run(`SAVEUI_STATE_V2895.remind.sessionStart=Date.now()-${R.sessionDelayMs}`);
 f.run("gameState='combat'");a.equal(f.run('suRemindTickV2895()'),null,'not in combat');f.run("gameState='exploring'");
 const ov=f.run("(()=>{const e=document.createElement('div');e.className='mobile-inventory-overlay';document.body.appendChild(e);return e})()");a.equal(f.run('suRemindTickV2895()'),null,'not over another panel');ov.remove();
 f.run("document.getElementById('storyPanel').classList.remove('hidden')");a.equal(f.run('suRemindTickV2895()'),null,'not over a story panel');f.run("document.getElementById('storyPanel').classList.add('hidden')");
 const card=f.run('suRemindTickV2895()');a(card&&card.id==='saveRemindV2895','shown on a quiet map');a.match(card._html,/还没有导出过/);
 f.run("document.getElementById('saveRemindV2895').remove()");a.equal(f.run('suRemindTickV2895()'),null,'once per session');
 // buttons
 f.run('SAVEUI_STATE_V2895.remind.shownThisSession=false');const c2=f.run('suRemindTickV2895()');
 c2.listeners.click[0]({target:{closest:()=>({dataset:{su:'later'}})}});a.equal(f.run("document.getElementById('saveRemindV2895')"),null);a(Number(ls.getItem(K.snooze))>0,'稍后 snoozes');
 ls.removeItem(K.snooze);f.run('SAVEUI_STATE_V2895.remind.shownThisSession=false');const c3=f.run('suRemindTickV2895()');
 c3.listeners.click[0]({target:{closest:()=>({dataset:{su:'export'}})}});await drain();a(ls.getItem(K.exported),'导出存档 exports');a.equal(f.run("document.getElementById('saveRemindV2895')"),null,'card closes after export');
 // iPhone tip only outside home-screen mode
 a.match(f.run('suIosHintV2895()'),/添加到主屏幕/);f.c.navigator.standalone=true;a.equal(f.run('suIosHintV2895()'),'');delete f.c.navigator.standalone;}

// ---------------------------------------------------------------- save manager section ----
{fresh(f);f.run('saveGame()');f.run('suMirrorScheduleV2895(true)');await drain();
 f.c.navigator.storage={persisted:async()=>false,persist:async()=>true};f.run("SAVEUI_STATE_V2895.persist.state='unknown'");
 f.run('showSaveManagerV2768()');await drain(12);
 const el=f.run("document.getElementById('saveManagerV2768')"),card=el.children[0],sec=card.children.find(c=>c.className==='su-manager-v2895');
 a(sec,'section added');a.match(sec._html,/存档护身/);
 const find=(n,k)=>{for(const c of n.children){if(c.dataset?.su===k)return c;const r=find(c,k);if(r)return r;}return null;};
 a.match(find(sec,'mirror').textContent,/镜中人/);a.equal(find(sec,'mirrorBtns').hidden,false);a.equal(find(sec,'ask').hidden,false,'ask button while not granted');
 await find(sec,'ask').onclick();a.match(find(sec,'persist').textContent,/已获浏览器授予/);a.equal(find(sec,'ask').hidden,true);
 let replaced=null;const rs=f.c.replaceSaveV2870;f.c.replaceSaveV2870=(raw)=>{replaced=raw;};
 find(sec,'mrestore').onclick();a.equal(replaced,f.idb.peek(MDB.db,MDB.store,'main').raw,'restore goes through replaceSaveV2870 (keeps the before-replace record)');
 replaced=null;f.c.confirm=()=>false;f.run('player.gold=8888;saveGame()');const mainBefore=f.c.localStorage.getItem('xiantu_save');
 find(sec,'mrestore').onclick();a.equal(replaced,null,'cancel changes nothing');a.equal(f.c.localStorage.getItem('xiantu_save'),mainBefore,'main save untouched on cancel');f.c.confirm=()=>true;
 f.run("gameState='combat'");let al='';f.c.alert=m=>{al=m};find(sec,'mrestore').onclick();a.equal(replaced,null);a.match(al,/战斗/,'blocked in combat');f.run("gameState='exploring'");f.c.alert=()=>{};
 f.c.replaceSaveV2870=rs;delete f.c.navigator.storage;}

// ---------------------------------------------------------------- phone UI sizes ----
{const U=J(f,'SAVEUI_V2895.ui'),css=f.run("document.getElementById('saveUiStyleV2895').textContent");
 for(const k of ['realmText','hudButtonText','areaText','minimapHead','zoomLabel','saveIndicator'])a(U[k]>=12,`${k} at least 12 px`);
 a.equal((U.zoomButton-2)+2*((U.hitTarget-(U.zoomButton-2))/2),U.hitTarget,'touch area reaches 44 px');a(U.hitTarget>=44);const inset=Number((css.match(/minimap-zoom-controls button::after\{content:'';position:absolute;inset:-([\d.]+)px/)||[])[1]);
 a.equal((U.zoomButton-2)+2*inset,U.hitTarget,'css ::after inset (inside the 1 px border) gives a 44 px touch area');
 a(2*U.zoomButton+U.zoomLabelWidth+2*U.zoomGap+6<=116,'zoom pill fits the 108 px minimap column');
 for(const [k,sel] of [['zoomButton','.minimap-zoom-controls button{width:'],['realmText','.world-realm{font-size:'],['minimapHead','.world-minimap-head{font-size:'],['hudToggleMin','#mobileHudToggle{min-width:']])
  a(css.includes(sel+U[k]+'px'),`css carries ${k}`);
 a(css.includes(`@media (max-width:${U.narrowWidth}px)`)&&css.includes('word-break:keep-all'),'narrow phones wrap icon over word');}

// ---------------------------------------------------------------- guard: the save is unchanged ----
{const without=game(files.filter(x=>x!==ME));const withIt=game();
 const script=g=>{fresh(g,"player.equipmentInventory=['素云冠','青云冠'];player.inventory.push('回春丹')");g.run('saveGame()');
  const d=JSON.parse(g.c.localStorage.getItem('xiantu_save'));delete d.timestamp;return d;};
 a.deepEqual(script(withIt),script(without),'save identical with and without V2895');
 const keys=g=>[...g.c.localStorage.storage?.keys?.()||[]];
 const added=[...withIt.storage.keys()].filter(k=>!without.storage.has(k));
 const allowed=new Set(Object.values(J(withIt,'SAVEUI_V2895.keys')));a(added.every(k=>allowed.has(k)),'only V2895 device keys added: '+added.join(','));}

// Deleting during an in-flight mirror cannot resurrect it, even when the local tombstone is later lost.
{const g=game();fresh(g);g.run('saveGame();suMirrorScheduleV2895(true);deleteSave()');await drain(20);
 a.equal(g.idb.peek(MDB.db,MDB.store,'main'),undefined);a.equal(g.idb.peek(MDB.db,MDB.store,'daily'),undefined);
 a(g.idb.peek(MDB.db,MDB.store,'cleared')>0);g.c.localStorage.removeItem('xiantu_mirror_cleared_v2895');startScreen(g);
 a.equal(await g.run('saveMirrorOfferV2895()'),false,'durable tombstone survives loss of local marker');}
// A save later rolled back by an existing transaction must not become the recovery candidate.
{const g=game();fresh(g);g.run('saveGame();suMirrorScheduleV2895(true)');await drain(20);const original=g.idb.peek(MDB.db,MDB.store,'main').raw;
 g.run('player.gold=9999;saveGame()');g.c.localStorage.setItem('xiantu_save',original);g.run('suMirrorScheduleV2895(true)');await drain(20);
 a.equal(g.idb.peek(MDB.db,MDB.store,'main').raw,original);}
// Restoration callbacks cannot outlive the title screen, the manager, a deleted save or the current actor.
{const g=game();fresh(g);g.run('saveGame();suMirrorScheduleV2895(true)');await drain(20);g.c.localStorage.removeItem('xiantu_save');g.c.localStorage.removeItem('xiantu_save_backup');startScreen(g);
 await g.run('saveMirrorOfferV2895()');const offer=g.run("document.getElementById('mirrorOfferV2895')"),button=offer.querySelector('[data-su="restore"]');
 fresh(g);offer.listeners.click[0]({target:{closest:()=>button}});a.equal(g.c.localStorage.getItem('xiantu_save'),null,'leaving title blocks stale offer');
 g.run('saveGame();suMirrorScheduleV2895(true)');await drain(20);g.run('showSaveManagerV2768()');await drain(20);
 const manager=g.run("document.getElementById('saveManagerV2768')"),restore=manager.querySelector('[data-su="mrestore"]');a(restore);
 let replaced=0;g.c.replaceSaveV2870=()=>{replaced++};g.c.confirm=()=>{g.run("gameState='combat'");return true};restore.onclick();a.equal(replaced,0);
 g.run("gameState='exploring'");g.c.confirm=()=>{g.run('player=createDefaultPlayer()');return true};restore.onclick();a.equal(replaced,0);
 manager.remove();g.c.confirm=()=>true;restore.onclick();a.equal(replaced,0);}
// Missing storage and failed restoration writes fail closed; export records use the actual exported snapshot.
{const g=game();fresh(g);g.run('saveGame();suMirrorScheduleV2895(true)');await drain(20);
 const original=g.c.localStorage.getItem('xiantu_save');g.c.localStorage.removeItem('xiantu_save');g.c.localStorage.removeItem('xiantu_save_backup');startScreen(g);await g.run('saveMirrorOfferV2895()');
 const offer=g.run("document.getElementById('mirrorOfferV2895')"),button=offer.querySelector('[data-su="restore"]');const set=g.c.localStorage.setItem;
 g.c.localStorage.setItem=(k,v)=>{if(k==='xiantu_save')throw Error('quota');set(k,v)};offer.listeners.click[0]({target:{closest:()=>button}});a.equal(g.c.localStorage.getItem('xiantu_save'),null);a(offer.isConnected);g.c.localStorage.setItem=set;
 fresh(g);g.run('player.gold=9000');g.run(`saveExportedV2895('file',${JSON.stringify(original)})`);a.equal(JSON.parse(g.c.localStorage.getItem('xiantu_export_v2895')).fp.split('|').at(-1),'1234');
 const get=g.c.localStorage.getItem;g.c.localStorage.getItem=()=>{throw Error('denied')};a.equal(g.run('suHasLocalSaveV2895()'),true,'storage failure is not an empty save');g.c.localStorage.getItem=get;}

a.deepEqual(f.errors.filter(e=>e[0]!=='warn'),[],'no console errors');
console.log('v2895-test-saveui: all checks passed');
})().catch(e=>{console.error(e);process.exit(1);});
