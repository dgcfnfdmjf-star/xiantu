const fs=require('fs'),assert=require('node:assert/strict'),fixture=require('./v2858-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const scripts=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root);f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;
for(const s of scripts)f.load(s);
f.storage.set('xiantu_save','unchanged-before-start');f.ids.get('gameScreen').classList.add('hidden');
for(const cb of f.events.pagehide)cb();assert.equal(f.storage.get('xiantu_save'),'unchanged-before-start');
f.storage.clear();f.run('startGame();closeWorldOverlay();');f.timers.clear();
f.run(`var damaged=createDefaultPlayer();damaged.mapNpc={rewards:null,quests:[],affinity:null};damaged.tasks={active:null,choices:[]};damaged.materials=null;var recovered=normalizePlayer(damaged);`);
assert.equal(f.run('JSON.stringify(recovered.mapNpc.quests)'),'{}');assert.equal(f.run('JSON.stringify(recovered.tasks.active)'),'{}');assert.equal(f.run('JSON.stringify(recovered.materials)'),'{}');
// Input is not rewritten during collection sanitation.
assert.equal(f.run('damaged.mapNpc.rewards'),null);
f.run('player.gold=987;saveGame();player.gold=123;saveGame()');f.storage.set('xiantu_save','broken');assert.equal(f.run('loadGame().player.gold'),987);assert.equal(f.run('loadGame()._recoveredFromBackup'),true);
f.run('player.gold=321');for(const cb of f.events.pagehide)cb();assert.equal(f.run('loadGame().player.gold'),321);
const setter=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};assert.equal(f.run('saveGame()'),false);f.c.localStorage.setItem=setter;assert.equal(f.run('loadGame().player.gold'),321);f.errors.length=0;
f.run('closeWorldOverlay();showStory("测试",[])');f.timers.clear();f.run('flatWorldLoop(1200)');assert.equal(f.run('FLAT_WORLD.raf'),null);assert.equal([...f.timers.values()].filter(t=>t.delay===200).length,1);
f.run('flatWorldLoop(1250)');assert.equal([...f.timers.values()].filter(t=>t.delay===200).length,1);
f.run('closeWorldOverlay()');assert.notEqual(f.run('FLAT_WORLD.raf'),null);assert.equal([...f.timers.values()].filter(t=>t.delay===200).length,0);
f.run('pauseVisualsV2767()');assert.equal(f.run('FLAT_WORLD.raf'),null);assert.equal(f.run('mapIdleTimerV2865'),null);
for(let lv=0;lv<17;lv++)for(let ph=0;ph<4;ph++){
 const value=f.run(`(()=>{const a={level:${lv},phase:${ph},atk:10000},d={level:${lv},phase:${ph},def:100,pressureTurns:1};const b=getRealmBasePower(${lv},${ph});return [calculateFinalDamage({attacker:a,defender:d}).damage,Math.max(1,Math.floor(10000+b.power*.3-(100+b.defense*.2)*.7))];})()`);
 assert.equal(value[0],value[1]);
}
// Stable enemy scaling for all realms/phases/tiers, independent of equipment.
let rows=[];
for(let lv=0;lv<17;lv++)for(let ph=0;ph<4;ph++)for(const tier of ['normal','elite','boss','tribulation']){
 const row=f.run(`(()=>{const e={name:'验算敌人',hp:100,maxHp:100,atk:10,def:5,_realmLevel:${lv},_realmPhase:${ph},_isElite:${tier==='elite'}};balanceEnemyV2802(e,${tier==='boss'},${tier==='tribulation'});const first=JSON.stringify(e);balanceEnemyV2802(e,${tier==='boss'},${tier==='tribulation'});return {level:${lv},phase:${ph},tier:'${tier}',hp:e.hp,atk:e.atk,def:e.def,stable:first===JSON.stringify(e)};})()`);
 assert(row.stable);assert(row.hp>0&&row.atk>0&&row.def>=0);rows.push(row);
}
for(const id of ['suwanqing','luoqinghan','jihongling'])for(let moment=0;moment<4;moment++){
 const line=f.run(`RELATIONSHIP_WAR_V2865.${id}[${moment}]`);assert(line.length>30);
 f.run(`var history=normalizeRelationshipsV2852({npcs:{${id}:{chats:[{topic:'war',stage:0,variant:0,tone:0,warMoment:${moment}}]}}});`);
 assert.equal(f.run(`history.npcs.${id}.chats[0].warMoment`),moment);
}
f.run("player.yewujiStoryV2816={choices:[],saintVictory:false}");assert.equal(f.run('relationshipWarMomentV2865()'),0);
f.run("player.yewujiStoryV2816.choices=[0]");assert.equal(f.run('relationshipWarMomentV2865()'),1);
f.run("player.yewujiStoryV2816.choices=[0,1,2,0]");assert.equal(f.run('relationshipWarMomentV2865()'),2);
f.run("player.yewujiStoryV2816.saintVictory=true");assert.equal(f.run('relationshipWarMomentV2865()'),3);
f.run("startCombat({name:'野狼',hp:500,maxHp:500,atk:2,def:2,_realmLevel:0,_realmPhase:0});player.hp=17;player.mp=3;BattleClarityV2856.sync()");assert.match(f.ids.get('battleReadoutV2856').innerHTML,/气血 <b>17/);assert.match(f.ids.get('battleReadoutV2856').innerHTML,/灵力 <b>3/);
assert.equal(f.errors.length,0,JSON.stringify(f.errors));
if(process.env.XIANTU_TEST_OUTPUT)fs.writeFileSync(require('node:path').join(process.env.XIANTU_TEST_OUTPUT,'v2865-enemy-matrix.json'),JSON.stringify(rows,null,2));
console.log('PASS save recovery/quota/pagehide guards; malformed legacy records; map idle single timer and resume; 68 pressure calculations; 272 stable enemy cases; 12 war snapshots; battle HP/MP readout');
