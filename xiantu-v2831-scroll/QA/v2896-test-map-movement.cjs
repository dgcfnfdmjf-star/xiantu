'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);for(const file of files)f.load(file);
const run=s=>f.run(s),J=s=>JSON.parse(run('JSON.stringify('+s+')'));
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';swordFlightV2896=false;FLAT_WORLD.width=2200;FLAT_WORLD.height=1450;FLAT_WORLD.player={x:500,y:500,r:17,speed:250};FLAT_WORLD.keys={};FLAT_WORLD.colliders=[];FLAT_WORLD.target=null;FLAT_WORLD.pois=[];FLAT_WORLD.monsters=[];autoNavigationV2830=null;updateWorldMonsters=()=>{};revealExplorationV2828=()=>{};tickNavigationV2830=()=>{};syncWarMapV2840=()=>{};globalThis.travel=0;checkResourceCollection=n=>{travel+=n};");}
a.equal(files.length,40);fresh();a.equal(run('mapMoveSpeedV2896()'),250);
const before=run('JSON.stringify(player)');run('ensureSwordFlightV2896();ensureSwordFlightV2896()');a.equal(run("document.getElementById('swordFlightBtnV2870').parentNode.id"),'worldExploreActions');a.equal(run("document.getElementById('swordFlightBtnV2870').getAttribute('aria-pressed')"),'false');
run('toggleSwordFlightV2870()');a.equal(run('mapMoveSpeedV2896()'),400);a.equal(run('FLAT_WORLD.player.speed'),250);a.equal(f.storage.get('xiantu_sword_flight_v2870'),'1');a.equal(run('JSON.stringify(player)'),before);
for(const state of ['combat','combat-ending']){run(`gameState='${state}'`);a.equal(run('toggleSwordFlightV2870()'),false);a.equal(run('swordFlightV2896'),true);}
run("gameState='exploring';player.breakthrough={isAnimating:true}");a.equal(run('toggleSwordFlightV2870()'),false);
fresh();for(const on of [false,true])for(const n of [30,60,120]){fresh();run(`swordFlightV2896=${on};FLAT_WORLD.keys={d:true};for(let i=0;i<${n};i++)updateFlatWorld(1/${n})`);a(Math.abs(run('FLAT_WORLD.player.x')-(on?900:750))<1e-7);a(Math.abs(run('travel')-(on?400:250))<1e-7);a.equal(run('FLAT_WORLD.player.speed'),250);}
// Both tap and automatic-navigation waypoints consume at most the remaining distance.
for(const on of [false,true])for(const nav of [false,true]){fresh();run(`swordFlightV2896=${on};autoNavigationV2830=${nav?'{}':'null'};FLAT_WORLD.target={x:509,y:500};updateFlatWorld(.1)`);a.equal(run('FLAT_WORLD.player.x'),509);a.equal(run('FLAT_WORLD.target'),null);a.equal(run('travel'),9);}
fresh();run('FLAT_WORLD.keys={d:true,s:true};updateFlatWorld(.04)');a(Math.abs(run('travel')-10)<1e-7,'diagonals do not speed up');
fresh();run('swordFlightV2896=true;FLAT_WORLD.player.x=2190;FLAT_WORLD.keys={d:true};updateFlatWorld(.034)');a.equal(run('FLAT_WORLD.player.x'),2170);
// Continuous contact: a segment ending beyond the obstacle cannot tunnel through it.
fresh();run('FLAT_WORLD.colliders=[{x:100,y:100,radius:8}]');const old=J('resolveWorldCollisionForActor(60,100,140,100,17)'),stopped=J('resolvePlayerMotionV2896(60,100,140,100,17)');a.equal(old.x,140);a(stopped.x<75&&stopped.x>74.8);a.equal(stopped.y,100);
run('FLAT_WORLD.colliders=[{x:100,y:100,radius:20}]');const slide=J('resolvePlayerMotionV2896(60,75,110,90,17)');a(slide.x>60);a(slide.y<75,'inward velocity projects along the upper tangent');a(Math.hypot(slide.x-100,slide.y-100)>=37);
let pos={x:60,y:100};for(let i=0;i<120;i++){pos=J(`resolvePlayerMotionV2896(${pos.x},${pos.y},${pos.x+4},${pos.y},17)`);a(pos.x<=63,'head-on contact does not creep through');}
run('FLAT_WORLD.colliders=[{x:100,y:100,radius:20},{x:140,y:100,radius:20}]');const corner=J('resolvePlayerMotionV2896(120,40,120,110,17)');for(const x of [100,140])a(Math.hypot(corner.x-x,corner.y-100)>=37-1e-5);
// Deterministic geometry samples including long steps and multiple contacts; RNG is untouched.
let seed=42;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<500;i++){const colliders=Array.from({length:8},()=>({x:150+rng()*300,y:150+rng()*300,radius:5+rng()*28}));const from={x:50+rng()*450,y:50+rng()*450};if(colliders.some(c=>Math.hypot(from.x-c.x,from.y-c.y)<c.radius+17))continue;f.c.__colliders=colliders;run('FLAT_WORLD.colliders=__colliders');const dx=(rng()-.5)*120,dy=(rng()-.5)*120,result=J(`resolvePlayerMotionV2896(${from.x},${from.y},${from.x+dx},${from.y+dy},17)`);a(Number.isFinite(result.x)&&Number.isFinite(result.y));for(const c of colliders)a(Math.hypot(result.x-c.x,result.y-c.y)>=c.radius+17-1e-5);}
// Rebuilding/changing maps never compounds the chosen speed and never scales interaction radii.
fresh();run("applyWorldMapLayout('south',true)");const pois=run('JSON.stringify(FLAT_WORLD.pois)'),col=run('JSON.stringify(FLAT_WORLD.colliders)');run('toggleSwordFlightV2870();toggleSwordFlightV2870()');a.equal(run('JSON.stringify(FLAT_WORLD.pois)'),pois);a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),col);
// Equipment overlay pauses the actual world loop, clearing keyboard, joystick and navigation intent.
fresh();run("closeWorldOverlay();FLAT_WORLD.keys={d:true};FLAT_WORLD.target={x:900,y:500};showEquipmentPanel()");a.deepEqual(J('FLAT_WORLD.keys'),{});a.equal(run('FLAT_WORLD.target'),null);a.equal(run('isWorldOverlayOpen()'),true);
let draws=0,updates=0;f.c.drawFlatWorld=()=>{draws++};f.c.updateFlatWorld=()=>{updates++};run("document.body.classList.add('flat-world-active');PERF_CONFIG.mobile=false;flatWorldLoop(1000)");a.equal(draws,0);a.equal(updates,0);
run("document.getElementById('equipmentPanel').remove();flatWorldLoop(1100)");a.equal(draws,1);a.equal(updates,1);
const source=fs.readFileSync(root+'/xiantu-v28684-duel.js','utf8').split('// BEGIN MAP_MOVEMENT_V2896')[1].split('// END MAP_MOVEMENT_V2896')[0];a(!/requestAnimationFrame|setInterval|Math\.random|saveGame\s*=/.test(source),'no additional frame loop, RNG or save wrapper');
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS map movement: optional 1.6x speed, frame-rate parity, tap/waypoint arrival, swept circle sliding, no tunnelling/corner penetration, unchanged actor base speed and map footprints');
