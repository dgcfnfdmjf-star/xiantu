'use strict';
// V28.68.118 battle loot reveal (audit A3 + G3): the receipt lists exactly what the core added to the bag
// during victory settlement (normal, elite, boss, underdog), nothing on defeat, tournament and war duels
// unchanged, rare drops gilded, still under effects-off / reduced motion, 2x2 actions, nothing saved,
// and no "获得 0 灵石，0 修为" line for the training puppet.
const fs=require('fs'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||require('path').resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
const run=s=>f.run(s);
run('document.body.classList[Symbol.iterator]=function(){return document.body._classes[Symbol.iterator]()}');
const realRandom=Math.random;
function fresh(setup=''){Math.random=realRandom;f.storage.delete('xiantu_map_fx_v2868104');run(`resetRuntimeState();player=createDefaultPlayer();player.name='临时测试';player.level=3;player.phase=0;player.tutorial.skipped=true;player.location='world';player.hp=getMaxHp();player.mp=getMaxMp();gameState='exploring';closeTutorialBubble();closeWorldOverlay();document.getElementById('gameScreen').classList.remove('hidden');document.getElementById('startScreen').classList.add('hidden');ensureTaskState();document.getElementById('afterBattleV2838')?.remove();document.documentElement.classList.remove('xt-reduce-motion');FLAT_WORLD.monsters=[];${setup}`);}
// Bag state as an independent multiset (name -> count) across all containers.
const bag=()=>JSON.parse(run(`JSON.stringify((()=>{const m={};const add=(k,n)=>{m[k]=(m[k]||0)+n};for(const n of player.inventory)add(n,1);for(const n of player.equipmentInventory||[])add(n,1);for(const [k,v] of Object.entries(player.materials))add(k,Number(v)||0);for(const [k,v] of Object.entries(player.petMaterials||{}))add(k,Number(v)||0);for(const x of player.artifacts||[])add(x.name,1);return m;})())`));
const gained=(b,c)=>Object.fromEntries(Object.entries(c).map(([k,v])=>[k,v-(b[k]||0)]).filter(([,n])=>n>0));
const html=()=>f.ids.get('afterBattleV2838')?.innerHTML||'';
function win(enemy,{boss=false,monster=false,random=null}={}){
 run(`globalThis.__m=${monster}?{id:'wm_l',x:FLAT_WORLD.player.x+200,y:FLAT_WORLD.player.y,radius:18,speed:0,enemy:${enemy},regionId:currentRegion||getPlayerRegion(),dir:{x:0,y:0},dirTimer:99,alive:true,inCombat:false,battleCooldown:0}:null;if(__m)FLAT_WORLD.monsters=[__m];startCombat(__m?__m.enemy:${enemy},${boss},false,__m)`);
 a.equal(run('gameState'),'combat');f.timers.clear();
 const before=bag(),gold=run('player.gold');if(random)Math.random=random;
 run('currentEnemy.hp=0;checkBattleEnd()');Math.random=realRandom;
 const after=bag(),record=JSON.parse(run('JSON.stringify(lastBattleV2838)'));
 run('completeCombatFinishV2764()');a.equal(run('gameState'),'exploring');
 return {gain:gained(before,after),gold:run('player.gold')-gold,record};
}
const asMap=drops=>{const m={};for(const d of drops)m[d.name]=(m[d.name]||0)+d.count;return m;};
function checkReceipt(r,why){
 const el=f.ids.get('afterBattleV2838');a(el,why+': receipt shown');
 a.deepEqual(asMap(r.record.drops),r.gain,why+': drop list equals what was added to the bag');
 for(const [name,n] of Object.entries(r.gain)){a(html().includes(`<span class="loot-name-v2868118">${name}</span>`),why+': tile for '+name);if(n>1)a(html().includes(`${name}</span><b>×${n}</b>`),why+': count for '+name);}
 a.equal((html().match(/class="xt-item-cell loot-tile-v2868118/g)||[]).length,Math.min(8,r.record.drops.length),why+': one tile per drop (max 8)');
 a(html().includes(`data-count="${r.record.gold}"`),why+': gold count-up target');
 a.equal(r.record.gold,r.gold,why+': gold equals the settled gain');
 return el;
}

// --- Normal wild win (map monster): high rolls give a material and a pill, no artifact ---
fresh();let r=win(`{name:'山贼',hp:60,maxHp:60,atk:5,def:1,gold:10,exp:10,_realmLevel:0,_realmPhase:0}`,{monster:true,random:()=>0.99});
a(Object.keys(r.gain).length>=2,'material and pill dropped');let el=checkReceipt(r,'normal');
a(!el.classList.contains('has-rare-v2868118'),'no rare drop on a plain win');
a(el.querySelector('.after-battle-actions-v2868118'),'2x2 action grid');a.equal(el.querySelector('.after-battle-actions-v2868118').querySelectorAll('button').length,4);
a(!el.classList.contains('still-v2868118'),'motion allowed by default');
console.log('PASS normal win: receipt tiles match the bag gain exactly; four actions in a 2x2 grid');

// --- Elite wild win, low rolls: pet pill, artifact and (maybe) equipment; artifact is rare ---
fresh();r=win(`{name:'精英山贼',hp:60,maxHp:60,atk:5,def:1,gold:10,exp:10,_realmLevel:0,_realmPhase:0,_isElite:true}`,{monster:true,random:()=>0.01});
el=checkReceipt(r,'elite');a(r.record.drops.some(d=>d.kind==='artifact'&&d.rare),'artifact marked rare');a(el.classList.contains('has-rare-v2868118'));
a(html().includes('class="xt-item-cell loot-tile-v2868118 rare"'),'gilded tile');
for(const d of r.record.drops.filter(d=>d.kind==='equip'))a(d.rare&&/^#/.test(d.color),'equipment uses its quality colour');
console.log('PASS elite win: artifact/equipment tiles are rare with quality colours');

// --- Boss win: fixed boss drops, equipment gilded ---
fresh('player.level=1');r=win(`{name:'宗门试炼守将',hp:60,maxHp:60,atk:5,def:1,gold:10,exp:10,_realmLevel:1,_realmPhase:0}`,{boss:true});
el=checkReceipt(r,'boss');a.equal(r.gain['精钢剑'],1);a.equal(r.gain['大还丹'],1);
a(r.record.drops.find(d=>d.name==='精钢剑').rare,'boss equipment is rare');a(!r.record.drops.find(d=>d.name==='大还丹').rare);
a(html().includes('--q:'+run("getQualityInfo(EQUIPMENT_DB['精钢剑'].quality).color")),'equipment tile carries its quality colour');
console.log('PASS boss win: 精钢剑 and 大还丹 shown, equipment gilded');

// --- Underdog win (task battle: no ordinary drops), 15% rare roll forced ---
fresh('player.level=0');r=win(`{name:'越级妖修',hp:60,maxHp:60,atk:5,def:1,gold:10,exp:10,_realmLevel:2,_realmPhase:0,_isTaskBattle:true}`,{random:()=>0.01});
el=checkReceipt(r,'underdog');a.equal(r.record.drops.length,1,'only the 越级 drop');a(r.record.drops[0].rare,'越级奖励 is rare');
console.log('PASS underdog win: the 越级 reward is the single, gilded tile');

// --- No drops: no tile list; gold/exp only ---
fresh('player.level=0');r=win(`{name:'木桩',hp:60,maxHp:60,atk:5,def:1,gold:10,exp:10,_realmLevel:0,_realmPhase:0,_isTaskBattle:true}`);
a.deepEqual(r.gain,{});a(f.ids.get('afterBattleV2838'));a(!html().includes('after-battle-loot-v2868118'),'no empty loot list');
console.log('PASS a win with no drops shows no tile list');

// --- Defeat: no receipt ---
fresh();run(`startCombat({name:'凶狼',hp:9999,maxHp:9999,atk:99999,def:1,gold:10,exp:10,_realmLevel:0,_realmPhase:0});player.hp=1;isPlayerTurn=false`);f.timers.clear();
try{run('resolveEnemyTurnV2844()');}catch(_){}
for(let i=0;i<5&&run("gameState")!=='combat-ending'&&run('gameState')==='combat';i++)for(const [id,t] of [...f.timers]){f.timers.delete(id);try{t.f();}catch(_){}}
a.equal(run('COMBAT_FINISH_V2764.pending?.kind||(player.hp<=0?"defeat":gameState)'),'defeat','defeat reached');a.equal(run('lastBattleV2838'),null,'no record on defeat');
try{run('completeCombatFinishV2764()');}catch(_){}a(!f.ids.get('afterBattleV2838'),'no receipt on defeat');
console.log('PASS defeat leaves no receipt or drop list');

// --- Tournament: no receipt, as before ---
fresh();run("lastBattleV2838={owner:player,name:'x',gold:1,exp:1,drops:[]};recordBattleSummaryV2838({name:'对手',tournamentFight:true},{gold:player.gold,exp:player.exp,lootV2868118:lootSnapshotV2868118()})");
a.equal(run('lastBattleV2838'),null,'tournament clears the record');
// War duels end through finishWarDuelV2839 and never record a summary.
a(!/recordBattleSummaryV2838/.test(run('String(finishWarDuelV2839)')),'war duel path unchanged');
console.log('PASS tournament and war duels unchanged');

// --- Effects off and reduced motion: static tiles, no count-up ---
for(const [why,setup] of [['effects off',"localStorage.setItem('xiantu_map_fx_v2868104','off')"],['reduce motion',"document.documentElement.classList.add('xt-reduce-motion')"]]){
 fresh(setup);run("lastBattleV2838={owner:player,name:'山贼',gold:30,exp:40,taskType:'main',drops:[{kind:'artifact',name:'飞剑',count:1,icon:'⚔️',color:'var(--xt-q-immortal,#b48ce6)',rare:true}]};showAfterBattleV2838(player)");
 el=f.ids.get('afterBattleV2838');a(el.classList.contains('still-v2868118'),why);a.equal(run("countUpLootV2868118(document.getElementById('afterBattleV2838'))"),false,why+': no count-up');
}
fresh();run("lastBattleV2838={owner:player,name:'山贼',gold:30,exp:40,taskType:'main',drops:[]};showAfterBattleV2838(player)");a.equal(run("countUpLootV2868118(document.getElementById('afterBattleV2838'))"),true,'count-up runs with motion allowed');
a(html().includes('data-count="30">30</b>')&&html().includes('data-count="40">40</b>'),'final numbers are in the markup');
console.log('PASS effects off and reduced motion keep the receipt static');

// --- Escaping and colour whitelist ---
fresh();run(`lastBattleV2838={owner:player,name:'山贼',gold:0,exp:0,taskType:'main',drops:[{kind:'item',name:'<img src=x>',count:2,icon:'"><b>',color:'red;background:url(x)',rare:false}]};showAfterBattleV2838(player)`);
a(!html().includes('<img')&&html().includes('&lt;img src=x&gt;'),'names escaped');a(!html().includes('url(x)'),'unknown colours dropped');
// Overflow: at most eight tiles, then a pointer to the bag.
fresh();run(`lastBattleV2838={owner:player,name:'山贼',gold:1,exp:1,taskType:'main',drops:Array.from({length:11},(_,i)=>({kind:'material',name:'灵草'+i,count:1,icon:'🌿',color:'',rare:false}))};showAfterBattleV2838(player)`);
a.equal((html().match(/loot-tile-v2868118/g)||[]).length,8);a(html().includes('另有 3 件'));
console.log('PASS tile text escaped, colours whitelisted, overflow capped at eight');

// --- Save compatibility: the drop list is memory only ---
fresh();r=win(`{name:'山贼',hp:60,maxHp:60,atk:5,def:1,gold:10,exp:10,_realmLevel:0,_realmPhase:0}`,{monster:true,random:()=>0.99});
const saved=run('JSON.stringify(player)');a(!/lootV2868118|underdogV2868118|"drops"/.test(saved),'nothing new in the save');
console.log('PASS the drop list stays in memory');

// --- G3: no zero-gain line for the training puppet; ordinary zero-gain fights unchanged ---
fresh('player.level=0');run(`startCombat({name:'演武傀儡',hp:26,maxHp:26,atk:4,def:1,gold:0,exp:0,_realmLevel:0,_realmPhase:0,_isTutorial:true})`);f.timers.clear();
run("globalThis.__logs=[];globalThis.__addLog=addCombatLog;addCombatLog=function(t){__logs.push(String(t));return __addLog.apply(this,arguments)}");
run('currentEnemy.hp=0;checkBattleEnd()');const logs=JSON.parse(run('JSON.stringify(__logs)'));run('addCombatLog=__addLog;completeCombatFinishV2764()');
a(logs.some(t=>t.includes('击败了 演武傀儡')),'victory line kept');a(!logs.some(t=>/获得 0 灵石，0 修为/.test(t)),'no zero-gain line');
a(logs.length>0);
fresh('player.level=0');run(`startCombat({name:'木桩',hp:26,maxHp:26,atk:4,def:1,gold:0,exp:0,_realmLevel:0,_realmPhase:0,_isTaskBattle:true});globalThis.__logs=[];globalThis.__addLog=addCombatLog;addCombatLog=function(t){__logs.push(String(t));return __addLog.apply(this,arguments)}`);f.timers.clear();
run('currentEnemy.hp=0;checkBattleEnd()');const logs2=JSON.parse(run('JSON.stringify(__logs)'));run('addCombatLog=__addLog;completeCombatFinishV2764()');
a(logs2.some(t=>/^获得 \d+ 灵石，\d+ 修为/.test(t)),'non-tutorial fights keep their gain line');
console.log('PASS training puppet hides the zero-gain line; other fights keep it');
Math.random=realRandom;
