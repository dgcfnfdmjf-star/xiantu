'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run('startGame();closeWorldOverlay();');
function fresh(){run('resetWorldMovementV28686();player=createDefaultPlayer();player.level=7;gameState="exploring";currentRegion="south";closeWorldOverlay();FLAT_WORLD.width=1200;FLAT_WORLD.height=900;FLAT_WORLD.player={x:180,y:400,r:17,speed:250};FLAT_WORLD.pois=[{id:"shop",name:"商铺",action:"shop",x:700,y:400,r:30}];FLAT_WORLD.monsters=[];FLAT_WORLD.colliders=[{x:700,y:400,radius:35},{x:400,y:400,radius:40}];FLAT_WORLD.keys={};SCROLL_ART_V2831.buildings={width:900,height:600};updateWorldMonsters=()=>{};revealExplorationV2828=()=>{};syncWarMapV2840=()=>{};checkResourceCollection=()=>{};');f.timers.clear();}
const originalInteract=f.c.interactFlatWorld;let entries=0;
f.c.interactFlatWorld=()=>{entries++;run('showStory("到达指定建筑",[])');};
function tap(){const b=json('poiTapBoxV2904(FLAT_WORLD.pois[0])');return run(`handleWorldTapV2904(${(b.left+b.right)/2},${b.top+15},"touch")`);}
function travel(){for(let i=0;i<900&&run('autoNavigationV2830');i++){run('updateFlatWorld(.016)');a(run('Math.hypot(FLAT_WORLD.player.x-400,FLAT_WORLD.player.y-400)>=57-1e-6'),'must route around tree');}}
fresh();a(tap());a.equal(entries,0);a(run('autoNavigationV2830.poi===FLAT_WORLD.pois[0]'));travel();a.equal(entries,1);a.equal(run('autoNavigationV2830'),null);a(run('Math.hypot(FLAT_WORLD.player.x-700,FLAT_WORLD.player.y-400)<92'));run('tickNavigationV2830(.016)');a.equal(entries,1);
// Arriving opens the original panel; the completion frame must not continue into monster encounters.
fresh();tap();const nav=run('autoNavigationV2830');nav.index=nav.route.length-1;nav.target=nav.route.at(-1);run('FLAT_WORLD.target=autoNavigationV2830.target;FLAT_WORLD.player.x=autoNavigationV2830.target.x;FLAT_WORLD.player.y=autoNavigationV2830.target.y');let encounters=0;f.c.updateWorldMonsters=()=>encounters++;run('updateFlatWorld(.016)');a.equal(encounters,0);a.equal(entries,2);
fresh();run('FLAT_WORLD.player.x=700;FLAT_WORLD.player.y=460');a(tap());a.equal(entries,3);a.equal(run('autoNavigationV2830'),null);
// Cancel on every ownership/control/lifecycle interruption; no deferred enter survives.
for(const change of ['FLAT_WORLD.keys.d=true','resetWorldMovementV28686()','currentRegion="north"','player=createDefaultPlayer()','gameState="combat"','gameState="combat-ending"','showStory("其他面板",[])','document.hidden=true','FLAT_WORLD.pois=[]']){
 fresh();tap();const before=entries;run(change);run('tickNavigationV2830(.016)');a.equal(run('autoNavigationV2830'),null,change);a.equal(entries,before);run('document.hidden=false');
}
fresh();tap();a.equal(run('handleWorldTapV2904(100,800,"touch")'),false,'joystick empty ground stays disabled');a.equal(run('autoNavigationV2830'),null);run('player.controlMode="touch"');a(run('handleWorldTapV2904(100,800,"touch")'));a.deepEqual(json('FLAT_WORLD.target'),{x:100,y:800});
// Existing deliberate navigation still stops for manual interaction; no global auto-entry change.
fresh();const before=entries;run('startNavigationV2830("shop")');travel();a.equal(entries,before);
// Locks at click and at arrival, missing/replaced targets, zero-path failure.
fresh();run('FLAT_WORLD.pois=[{id:"lx_main_hall",name:"大殿",action:"lingxiao_building",buildingId:"main_hall",x:700,y:400,r:28}];player.level=0');const access=f.c.canAccessBuilding;f.c.canAccessBuilding=()=>({allowed:false,reason:'尚未入宗'});a.equal(tap(),false);a.equal(run('autoNavigationV2830'),null);
f.c.canAccessBuilding=()=>({allowed:true});a(tap());f.c.canAccessBuilding=()=>({allowed:false,reason:'资格变化'});travel();a.equal(entries,before);f.c.canAccessBuilding=access;
fresh();run('FLAT_WORLD.colliders=Array.from({length:20},(_,i)=>({x:400,y:30+i*45,radius:30}))');a.equal(tap(),false);a.equal(run('autoNavigationV2830'),null);
fresh();run('FLAT_WORLD.pois.push({...FLAT_WORLD.pois[0],id:"market",y:420});');const box=json('poiTapBoxV2904(FLAT_WORLD.pois[1])');a.equal(run(`tappedPoiV2904(700,${box.top+30}).id`),'market','front-most roof takes the tap');
run('FLAT_WORLD.pois=[{id:"secret",x:200,y:200,r:25,action:"explore_v2828"}]');a.equal(run('tappedPoiV2904(200,180)'),null,'no automatic reward pickup');
// Single gesture handler: pointer down alone, drags, multi-touch and cancelled touches never enter.
fresh();const canvas=f.ids.get('worldCanvas');run('FLAT_WORLD.player.x=700;FLAT_WORLD.player.y=460;FLAT_WORLD._camDrawV2893={x:500,y:200};');canvas.width=390;canvas.height=700;canvas._dpr=1;
const b=json('poiTapBoxV2904(FLAT_WORLD.pois[0])'),x=200,y=b.top+15-200;
const emit=(type,more={})=>{for(const h of canvas.listeners[type]||[])h({type,pointerId:1,pointerType:'mouse',button:0,clientX:x,clientY:y,preventDefault(){},...more});};
let count=entries;emit('pointerdown');a.equal(entries,count);emit('pointerup');a.equal(entries,++count);run('closeWorldOverlay()');
emit('pointerdown');emit('pointermove',{clientX:x+30});emit('pointerup');a.equal(entries,count);
emit('pointerdown');emit('pointercancel');emit('pointerup');a.equal(entries,count);
emit('pointerdown',{button:2});emit('pointerup',{button:2});a.equal(entries,count);
const t={identifier:5,clientX:x,clientY:y};emit('touchstart',{touches:[t]});emit('touchcancel');emit('touchend',{touches:[],changedTouches:[t]});a.equal(entries,count);
emit('touchstart',{touches:[t]});emit('touchstart',{touches:[t,{...t,identifier:6}]});emit('touchend',{touches:[],changedTouches:[t]});a.equal(entries,count);
emit('touchstart',{touches:[t]});emit('touchmove',{touches:[{...t,clientX:x+30}]});emit('touchend',{touches:[],changedTouches:[t]});a.equal(entries,count);
emit('touchstart',{touches:[t]});emit('touchend',{touches:[],changedTouches:[t]});a.equal(entries,++count);run('closeWorldOverlay()');emit('pointerdown');emit('pointerup');a.equal(entries,count,'synthetic mouse suppressed');
// Actual interaction remains authoritative and does not purchase or grant rewards automatically.
fresh();f.c.interactFlatWorld=originalInteract;run('FLAT_WORLD.player.x=700;FLAT_WORLD.player.y=460;globalThis.goldBefore=player.gold');a(tap());a.equal(run('player.gold'),run('goldBefore'));a.equal(run('isWorldOverlayOpen()'),true);
console.log('PASS roof hitboxes, obstacle-safe auto-entry once, nearby entry, cancellation/ownership/access/encounter guards, manual nav retained, mouse/touch gesture filtering and real shop opens without purchase');
