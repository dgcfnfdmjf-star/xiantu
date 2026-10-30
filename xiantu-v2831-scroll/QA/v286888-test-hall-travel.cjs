'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run('startGame();closeWorldOverlay();');
f.c.canAccessBuilding=()=>({allowed:true});f.c.syncTaskWithLingxiaoBuilding=()=>{};
function fresh(){run(`clearInteriorV286886();resetWorldMovementV28686();player=createDefaultPlayer();gameState='exploring';currentRegion='south';closeWorldOverlay();tutorialState.active=false;FLAT_WORLD.width=1000;FLAT_WORLD.height=1000;FLAT_WORLD.colliders=[];FLAT_WORLD.player.x=300;FLAT_WORLD.player.y=340;FLAT_WORLD.pois=[{id:'hall-a',buildingId:'task_hall',name:'任务堂',action:'lingxiao_building',x:300,y:300,r:40},{id:'hall-b',buildingId:'dormitory',name:'弟子居',action:'lingxiao_building',x:650,y:300,r:40}];FLAT_WORLD.nearby=FLAT_WORLD.pois[0];tryEnterInteriorV286886(FLAT_WORLD.pois[0]);globalThis.room88=interiorV286886;`);f.timers.clear();}
const queue=()=>run("queueHallTravelV286888(room88,'hall-b')");
fresh();const outdoor=json('FLAT_WORLD.player'),gold=run('player.gold');a(queue());a.deepEqual(json('FLAT_WORLD.player'),outdoor,'selection does not teleport');a.equal(run('autoNavigationV2830'),null,'must walk out first');
for(let i=0;i<200&&run('!!interiorV286886');i++)run('updateInteriorV286886(.033)');
a.equal(run('interiorV286886'),null);a.equal(run('autoNavigationV2830.poi.id'),'hall-b');a.deepEqual(json('FLAT_WORLD.player'),outdoor,'door keeps outdoor position');a.equal(run('player.gold'),gold);
// Existing outdoor navigator owns arrival and rechecks entry access.
run('FLAT_WORLD.player.x=650;FLAT_WORLD.player.y=340;enterTappedPoiV2904(autoNavigationV2830)');a.equal(run('interiorV286886.poi.id'),'hall-b');
for(const cancel of ['resetWorldMovementV28686()','interiorRouteV286886(room88,400,208)','FLAT_WORLD.keys.w=true;updateInteriorV286886(.033)','showStory("临时事务",[])']){fresh();a(queue());run(cancel);a.equal(run('room88.hallDestination'),null,cancel);}
fresh();a(queue());f.c.canAccessBuilding=()=>({allowed:false});run('room88.player.y=399;updateInteriorV286886(.033)');a.equal(run('autoNavigationV2830'),null,'access revoked before exit');f.c.canAccessBuilding=()=>({allowed:true});
fresh();a(queue());run('FLAT_WORLD.pois.pop();room88.player.y=399;updateInteriorV286886(.033)');a.equal(run('autoNavigationV2830'),null,'removed destination');
fresh();run('player=createDefaultPlayer()');a.equal(queue(),false,'stale room handler');
fresh();run('currentRegion="north"');a.equal(queue(),false,'region changed');
fresh();run('gameState="combat"');a.equal(queue(),false,'cannot initiate in combat');
fresh();a.equal(run("queueHallTravelV286888(room88,'missing')"),false);
// CSS resizing, DPR and the drawn camera already agree; no second input correction.
for(const dpr of [1,1.5,2,3]){const p=json(`worldTapPointV2893({width:${640*dpr},height:${360*dpr},_dpr:${dpr}},{left:10,top:20,width:320,height:180},170,110)`);const cam=json('FLAT_WORLD._camDrawV2893||FLAT_WORLD.camera');a.equal(p.x,cam.x+320);a.equal(p.y,cam.y+180);}
// Extended art remains visible even when its ground centre is just offscreen.
a(run("warSpriteInViewV286888({_warUnitV2840:true,x:100,y:200},{minX:80,maxX:120,minY:70,maxY:100})"));
a(run("warSpriteInViewV286888({action:'war_map_v2840',x:100,y:225},{minX:80,maxX:120,minY:70,maxY:100})"));
a.equal(run("warSpriteInViewV286888({_warUnitV2840:true,x:1000,y:200},{minX:80,maxX:120,minY:70,maxY:100})"),false);
console.log('PASS hall walking transfer, arrival, cancellation, stale/locked targets, DPR mapping and war sprite culling');
