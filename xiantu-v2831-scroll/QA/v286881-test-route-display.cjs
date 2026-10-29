'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
function fresh(){run('resetRuntimeState();player=createDefaultPlayer();gameState="exploring";currentRegion="south";document.hidden=false;closeWorldOverlay();document.getElementById("equipmentPanel")?.remove();FLAT_WORLD.width=1200;FLAT_WORLD.height=900;FLAT_WORLD.player={x:200,y:300,r:17,speed:250};FLAT_WORLD.pois=[];FLAT_WORLD.colliders=[{type:"tree",x:400,y:300,radius:35}];FLAT_WORLD.keys={};FLAT_WORLD.target=null;FLAT_WORLD.monsters=[];autoNavigationV2830=null;updateWorldMonsters=()=>{};revealExplorationV2828=()=>{};syncWarMapV2840=()=>{};checkResourceCollection=()=>{};');}
function recorder(){const events=[],ctx={save(){events.push(['save'])},restore(){events.push(['restore'])},setLineDash(v){events.push(['dash',...v])},beginPath(){events.push(['begin'])},moveTo(x,y){events.push(['move',x,y])},lineTo(x,y){events.push(['line',x,y])},arc(x,y,r){events.push(['arc',x,y,r])},stroke(){events.push(['stroke'])}};return {ctx,events};}
fresh();a.equal(run('setWorldTapDestinationV2900(600,300)'),true);a(run('autoNavigationV2830.route.length')>1);
const original=json('autoNavigationV2830.route'),display=json('worldRouteDisplayV2881()');a.deepEqual(display.points,original);a.equal(display.index,0);a.deepEqual(display.end,{x:600,y:300});
let prev=display.start;for(const point of display.points){f.c.segment2881={a:prev,b:point};a(run('worldDistanceSegmentV2827(400,300,segment2881.a,segment2881.b)')>=56-1e-6);prev=point;}
// Drawing uses exact remaining route geometry, never re-plans or changes movement/saves.
const before=run('JSON.stringify([player,autoNavigationV2830,FLAT_WORLD.player,FLAT_WORLD.target])'),plan=f.c.planNavigationV2830;let plans=0;f.c.planNavigationV2830=()=>{plans++;throw Error('drawing must not plan')};
const random=f.c.Math.random;let randomCalls=0;f.c.Math.random=()=>{randomCalls++;return random();};
const main=recorder();f.c.routeCtx2881=main.ctx;a.equal(run('drawWorldRouteV2881(routeCtx2881)'),true);
a.deepEqual(main.events.filter(e=>e[0]==='line').map(e=>({x:e[1],y:e[2]})),original);a.equal(plans,0);a.equal(run('JSON.stringify([player,autoNavigationV2830,FLAT_WORLD.player,FLAT_WORLD.target])'),before);
const mini=recorder();f.c.routeCtx2881=mini.ctx;run('drawWorldRouteV2881(routeCtx2881,worldRouteDisplayV2881(),{x:v=>(v-100)*.25,y:v=>(v-50)*.5})');
a.deepEqual(mini.events.filter(e=>e[0]==='line').map(e=>[e[1],e[2]]),original.map(q=>[(q.x-100)*.25,(q.y-50)*.5]));a.deepEqual(mini.events[0],['save']);a.deepEqual(mini.events.at(-1),['restore']);a.equal(plans,0);a.equal(randomCalls,0);f.c.planNavigationV2830=plan;f.c.Math.random=random;
// Progress omits consumed waypoints, including the frame between movement and tick.
run('FLAT_WORLD.player.x=autoNavigationV2830.target.x;FLAT_WORLD.player.y=autoNavigationV2830.target.y;FLAT_WORLD.target=null');
a.equal(run('worldRouteDisplayV2881().index'),1);run('tickNavigationV2830(.016)');a.equal(run('worldRouteDisplayV2881().index'),1);
for(let i=0;i<600&&run('autoNavigationV2830');i++)run('updateFlatWorld(.016)');a.equal(run('worldRouteDisplayV2881()'),null);a.equal(run('autoNavigationV2830'),null);
// A clear direct tap may draw a straight segment; legacy blocked targets must not.
fresh();run('setWorldTapDestinationV2900(200,600)');a.equal(run('autoNavigationV2830'),null);a.deepEqual(json('worldRouteDisplayV2881().end'),{x:200,y:600});
run('FLAT_WORLD.target={x:600,y:300}');a.equal(run('worldRouteDisplayV2881()'),null);
// All interruption states hide the route immediately, without waiting for a nav tick.
for(const change of ['stopNavigationV2830()','resetWorldMovementV28686()','FLAT_WORLD.keys.d=true','gameState="combat"','gameState="combat-ending"','player.breakthrough={isAnimating:true}','document.hidden=true','showStory("面板",[])','player=createDefaultPlayer()','currentRegion="north"','FLAT_WORLD.target={x:50,y:50}','autoNavigationV2830.route[0]={x:NaN,y:300}']){
 fresh();run('setWorldTapDestinationV2900(600,300)');run(change);a.equal(run('worldRouteDisplayV2881()'),null,change);
}
// Building auto-entry displays its reachable final point, not a line into the building centre.
fresh();run('FLAT_WORLD.pois=[{id:"shop",name:"商铺",action:"shop",x:700,y:300,r:30}];FLAT_WORLD.colliders.push({x:700,y:300,radius:35});startPointNavigationV28685({...FLAT_WORLD.pois[0],mark:false,silent:true,enterPoiV2904:FLAT_WORLD.pois[0]})');
const end=json('worldRouteDisplayV2881().end');a(Math.hypot(end.x-700,end.y-300)>=56);a(Math.hypot(end.x-700,end.y-300)<92);
run('FLAT_WORLD.pois=[]');a.equal(run('worldRouteDisplayV2881()'),null);
// The minimap insertion stays inside the existing circular clip, and main-map
// rendering retains the existing minimap interval gate (no wrapper bypass).
const code=fs.readFileSync(root+'/xiantu-v2762-core.js','utf8'),minimap=code.slice(code.indexOf('function drawWorldMinimap('),code.indexOf('let exploreCellV2828='));
a(minimap.indexOf('ctx.clip()')<minimap.indexOf('drawWorldRouteV2881('));a(minimap.indexOf('drawWorldRouteV2881(')<minimap.indexOf('ctx.restore()'));
a.match(code,/if\(t-PERF_CONFIG.lastMinimapDraw>=PERF_CONFIG.minimapInterval\)\{\s*PERF_CONFIG.lastMinimapDraw=t;\s*drawWorldMinimap\(vw,vh\)/);
console.log('PASS exact remaining route/projection, read-only drawing without path search, obstacle-safe direct targets, waypoint progress, arrival/cancel/busy/owner/region guards, building endpoint and existing minimap clip/throttle');
