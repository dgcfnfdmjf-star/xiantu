const fs=require('fs'),a=require('assert'),fixture=require('./dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||'release-v2838/xiantu-v2831-scroll';
function game(){const f=fixture(root);const h=fs.readFileSync(root+'/game-v2762.html','utf8');for(const file of JSON.parse(h.match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.run('startGame()');f.timers.clear();return f;}
function finishScene(f){let n=0;while(f.run('!!sceneSessionV2838')){a(n++<10);f.run('advanceSceneV2838(1)')}}
(async()=>{
 const f=game(),r=f.run;
 a.equal(r('getTaskInstance("main_01").currentStep'),0);
 r('performTaskAction("main_01")');a(f.ids.has('sceneV2838'));a.equal(r('getTaskInstance("main_01").currentStep'),0);
 r('advanceSceneV2838(1);closeSceneV2838(true)');a.equal(r('getTaskInstance("main_01").currentStep'),0,'closing must not advance');
 r('performTaskAction("main_01")');finishScene(f);a.equal(r('getTaskInstance("main_01").currentStep'),1);
 r('advanceSceneV2838(1)');a.equal(r('getTaskInstance("main_01").currentStep'),1,'double confirmation');
 const currency=r('player.gold');r('openTaskSceneV2838("main_01","walk_to_sect",true)');finishScene(f);a.equal(r('player.gold'),currency);a.equal(r('getTaskInstance("main_01").currentStep'),1);
 r('performTaskAction("main_01");player={...player}');r('advanceSceneV2838(1)');a.equal(r('sceneSessionV2838'),null);a.equal(r('getTaskInstance("main_01").currentStep'),1);
 r('acceptTask("side_daily_01");performTaskAction("side_daily_01")');a(!f.ids.has('sceneV2838'));a.equal(r('getTaskInstance("side_daily_01").currentStep'),0,'gather must require real material events');r('onCollectMaterial("灵草",4)');a.equal(r('getTaskInstance("side_daily_01").currentStep'),0);r('onCollectMaterial("灵草",1)');a(r('getTaskInstance("side_daily_01").completed'));
 console.log('PASS reading confirmation, close/resume, duplicate taps, read-only recaps, stale character, genuine gathering');
 // Eight chapters: actual quest acceptance and narrative -> preview -> fight -> choice -> save/load.
 r('closeTaskPanel();closeWorldOverlay();player.tasks.completed.push("main_16","main_17")');
 const ids=JSON.parse(r('JSON.stringify(JOURNEYS_V2838.map(j=>j.id))'));
 for(const id of ids){
  r(`player.level=JOURNEYS_V2838.find(j=>j.id==='${id}').level;player.phase=0;player.hp=getMaxHp();player.mp=getMaxMp();acceptTask('${id}');performTaskAction('${id}');`);
  a.equal(r(`getTaskInstance('${id}').currentStep`),0);finishScene(f);a.equal(r(`getTaskInstance('${id}').currentStep`),1);
  r(`performTaskAction('${id}')`);const modal=f.ids.get('journeyPrepareV2838');a(modal,'enemy preview exists');a.equal(r('gameState'),'exploring');
  modal.onclick({target:modal.querySelector('[data-journey="fight"]')});a.equal(r('gameState'),'combat');a.equal(r('currentEnemy._taskId'),id);
  a.equal(r(`getTaskInstance('${id}').currentStep`),1,'opening fight not a win');
  // Run a real attack through damage, delayed hit and victory settlement using a one-hit test opponent.
  r('currentEnemy.hp=1;combat("attack")');f.flush(150);
  a.equal(r('gameState'),'combat-ending');a.equal(r(`getTaskInstance('${id}').currentStep`),2);
  const wonGold=r('player.gold');r('checkBattleEnd()');a.equal(r('player.gold'),wonGold,'no repeat reward');
  r('completeCombatFinishV2764()');a.equal(r('gameState'),'exploring');a(f.ids.has('afterBattleV2838'));
  r(`performTaskAction('${id}')`);finishScene(f);a.equal(r(`getTaskInstance('${id}').currentStep`),3);
  r(`onChoiceMade('${id}',JOURNEYS_V2838.find(j=>j.id==='${id}').choices[0][0])`);a(r(`getTaskInstance('${id}').completed`));const doneGold=r('player.gold');finishScene(f);
  r(`onChoiceMade('${id}',JOURNEYS_V2838.find(j=>j.id==='${id}').choices[0][0]);completeTask('${id}')`);a.equal(r('player.gold'),doneGold);
  f.timers.clear();
 }
 r('saveGame();loadAndStart()');a.equal(r('player.tasks.completed.filter(id=>id.startsWith("journey_")).length'),8);a.equal(r('Object.keys(player.tasks.choices).filter(id=>id.startsWith("journey_")).length'),8);
 a(r('journalEntriesV2838().length>=25'));a.equal(f.errors.length,0,JSON.stringify(f.errors));
 console.log('PASS all 8 journey chapters: unlock, read, enemy preview, actual damage/victory, one-time rewards, choices, journal and save/load');
 // Delayed combat effects belong to one character, opponent and combat token.
 const b=game();b.run('currentEnemy={hp:10};gameState="combat";window.hit=0;battleLaterV2838(()=>window.hit++,150)');b.run('currentEnemy={hp:10}');b.flush(150);a.equal(b.c.hit,0);
 b.run('battleLaterV2838(()=>window.hit++,150);player={...player}');b.flush(150);a.equal(b.c.hit,0);
 b.run('battleLaterV2838(()=>window.hit++,150)');b.flush(150);a.equal(b.c.hit,1);
 b.run('battleLaterV2838(()=>window.hit++,150);gameState="combat-ending"');b.flush(150);a.equal(b.c.hit,1);
 console.log('PASS delayed combat callbacks rejected after opponent/session/state changes');
 // New-game transaction and fixed prior-character checkpoint.
 const s=game();s.run('player.name="原角色";player.gold=3456;saveGame()');const primary=s.storage.get('xiantu_save');s.c.confirm=()=>false;s.run('newGame()');a.equal(s.run('player.name'),'原角色');a.equal(s.storage.get('xiantu_save'),primary);
 s.c.confirm=()=>true;const setItem=s.c.localStorage.setItem;s.c.localStorage.setItem=(k,v)=>{if(k==='xiantu_save_previous_character')throw Error('quota');return setItem(k,v)};s.run('newGame()');a.equal(s.run('player.name'),'原角色');a.equal(s.storage.get('xiantu_save'),primary);
 s.c.localStorage.setItem=setItem;s.run('newGame()');a.equal(s.run('gameState'),'start');a(!s.c.document.body.classList.contains('flat-world-active'));a.equal(s.run('FLAT_WORLD.raf'),null);a.equal(s.storage.get('xiantu_save'),primary,'keep old until new save');a.equal(JSON.parse(s.storage.get('xiantu_save_previous_character')).player.gold,3456);s.run('autoSave()');a.equal(s.storage.get('xiantu_save'),primary);
 s.ids.get('playerName').value='新角色';s.run('startGame();player.gold=88;saveGame();saveGame()');a.equal(JSON.parse(s.storage.get('xiantu_save_previous_character')).player.name,'原角色');s.run('restorePreviousV2838()');a.equal(s.run('player.name'),'原角色');a.equal(s.run('player.gold'),3456);
 const ordinary=s.storage.get('xiantu_save');s.run('player.testAccount999=true;saveGame()');a.equal(s.storage.get('xiantu_save'),ordinary);a(s.storage.has('xiantu_save_test_999'));
 console.log('PASS new-game cancel/quota failure, prior-character checkpoint, repeated autosave, restoration, isolated 999 save');
 // Async import must recheck current character and in-flight combat.
 const t=game();t.run('saveGame()');const raw=t.storage.get('xiantu_save');let resolve;t.c.file={size:raw.length,text:()=>new Promise(ok=>resolve=ok)};
 const importing=t.run('importSaveV2768(file)');t.run('player={...player,name:"导入期间换档"}');resolve(raw);await importing;a.equal(t.storage.get('xiantu_save'),raw);a(!t.run('saveImportBusyV2768'));a.equal(t.run('player.name'),'导入期间换档');
 t.c.file={size:raw.length,text:async()=>raw};t.run('gameState="combat-ending"');await t.run('importSaveV2768(file)');a.equal(t.storage.get('xiantu_save'),raw);
 console.log('PASS async import rejects stale owner and combat-ending; busy flag cleared');
 // Backup-only startup remains available without eagerly parsing the save.
 const z=game();const zraw=z.storage.get('xiantu_save');z.storage.delete('xiantu_save');z.storage.set('xiantu_save_backup',zraw);z.run('hasCheckedSave=false;checkSaveOnStart()');a.equal(z.ids.get('loadDialog').style.display,'flex');a(z.run('loadGame().player'));
 console.log('PASS backup-only continue path');
 const d=game();d.run('Math.random=()=>0.9;player.gold=1001;player.hp=1;startCombat({name:"失败回归检查",hp:99999,maxHp:99999,atk:999999,def:1,gold:1,exp:1,_realmLevel:0,_realmPhase:0},false,false);enemyTurn()');d.flush(150);a.equal(d.run('gameState'),'combat-ending');a.equal(d.run('player.gold'),801);a.equal(JSON.parse(d.storage.get('xiantu_save')).player.gold,801);d.run('completeCombatFinishV2764()');a.equal(d.run('gameState'),'exploring');console.log('PASS defeat returns safely, deducts 20% of carried stones and saves immediately');
})().catch(e=>{console.error(e);process.exit(1)});
