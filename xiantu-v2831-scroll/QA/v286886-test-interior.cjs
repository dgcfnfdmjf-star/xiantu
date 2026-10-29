'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run('startGame();closeWorldOverlay();');
function fresh(){run(`clearInteriorV286886();resetWorldMovementV28686();player=createDefaultPlayer();gameState='exploring';currentRegion='south';closeWorldOverlay();FLAT_WORLD.player.x=300;FLAT_WORLD.player.y=340;FLAT_WORLD.pois=[{id:'shop',name:'百宝阁',action:'shop',x:300,y:300,r:40}];FLAT_WORLD.nearby=FLAT_WORLD.pois[0];interactFlatWorld();`);f.timers.clear();}
fresh();a(run('!!interiorV286886'));run('globalThis.roomFloor=interiorFloorV286886(interiorV286886)');a.equal(run('roomFloor===interiorFloorV286886(interiorV286886)'),true);const outdoor=json('FLAT_WORLD.player'),gold=run('player.gold'),hp=run('player.hp');
let gathers=0,monsters=0;f.c.checkResourceCollection=()=>gathers++;f.c.updateWorldMonsters=()=>monsters++;
run('FLAT_WORLD.keys.w=true');for(let i=0;i<100;i++)run('updateFlatWorld(.033)');run('resetWorldMovementV28686()');
a(run('interiorV286886.player.y<352'));a.deepEqual(json('FLAT_WORLD.player'),outdoor);a.equal(gathers,0);a.equal(monsters,0);a.equal(run('player.gold'),gold);a.equal(run('player.hp'),hp);
// Route around a solid bookshelf; every intermediate actor footprint remains walkable.
run('interiorV286886.player={x:80,y:208};interiorRouteV286886(interiorV286886,80,80)');
for(let i=0;i<240;i++){run('updateInteriorV286886(.033)');a(run('interiorWalkV286886(interiorV286886.player.x,interiorV286886.player.y)'));}
a(run('Math.hypot(interiorV286886.player.x-80,interiorV286886.player.y-80)<3'));
a.equal(run('interiorRouteV286886(interiorV286886,80,112)'),false,'solid furniture cannot be destination');
run('interiorV286886.player={x:400,y:208}');let services=0;const loc=f.c.showLocation;f.c.showLocation=()=>services++;
run('interiorInteractV286886()');a.equal(services,1);run('interiorV286886.player={x:288,y:300};interiorInteractV286886()');a.equal(services,1,'no remote interaction');f.c.showLocation=loc;
run('interiorRouteV286886(interiorV286886,288,400)');for(let i=0;i<160&&run('!!interiorV286886');i++)run('updateInteriorV286886(.033)');a.equal(run('interiorV286886'),null);a.equal(run('roomFloor.width'),1,'exit frees floor backing');a.deepEqual(json('FLAT_WORLD.player'),outdoor,'door preserves outdoor position');
fresh();run('interiorRouteV286886(interiorV286886,400,208);resetWorldMovementV28686()');a.equal(run('interiorV286886.path.length'),0,'blur reset stops indoor path');
run('showStory("室内面板",[])');const pos=json('interiorV286886.player');run('FLAT_WORLD.keys.w=true;updateInteriorV286886(.033)');a.deepEqual(json('interiorV286886.player'),pos,'panel pauses room');run('closeWorldOverlay()');a(run('!!interiorV286886'));
run('player=createDefaultPlayer()');a.equal(run('interiorStateV286886()'),null,'new character discards room');
fresh();run('resetRuntimeState()');a.equal(run('interiorV286886'),null);
fresh();run('currentRegion="north"');a.equal(run('interiorStateV286886()'),null);
fresh();run('clearInteriorV286886();FLAT_WORLD.pois[0].action="lingxiao_building";FLAT_WORLD.pois[0].buildingId="main_hall"');f.c.canAccessBuilding=()=>({allowed:false,reason:'门槛'});run('interactFlatWorld()');a.equal(run('interiorV286886'),null,'locked room cannot enter');
a.equal(run('interiorKindV286886({action:"rest"})'),null,'outdoor springs remain outdoors');
console.log('PASS walkable room entry, furniture routing, outdoor isolation, proximity, door return, overlay pause, lifecycle and access guards');
