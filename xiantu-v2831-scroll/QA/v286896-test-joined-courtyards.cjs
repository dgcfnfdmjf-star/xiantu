'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.console.log=()=>{};const Image=f.c.Image;f.c.Image=class extends Image{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`)),atlases=()=>images.filter(i=>i.src?.includes('architecture-courtyards-v286896'));
run("currentRegion='south';loadScrollArtV2831()");a.equal(atlases().length,0);
run("player=createDefaultPlayer();player.level=10;gameState='exploring';applyWorldMapLayout('north',true);loadScrollArtV2831();ensureStaticWorldCache()");
a.equal(atlases().length,1);const oldCache=run('PERF_CONFIG.staticWorldCanvas'),im=atlases()[0];
a.equal(run('!!SCROLL_ART_V2831.joinedBuildings'),false);
im.naturalWidth=1536;im.naturalHeight=1024;im.onload();a.equal(oldCache.width,1,'asset readiness rebuilds cached road endpoints');a.equal(run('SCROLL_ART_V2831.joinedBuildings'),im);
for(let i=0;i<10;i++)run('loadScrollArtV2831()');a.equal(atlases().length,1);
const ids=json('FLAT_WORLD.pois.filter(joinedArchitectureReadyV286896).map(p=>p.id)');a.equal(ids.length,29);
run('player.mapBuildingLabelsV211=true');
const before=run('JSON.stringify([player,FLAT_WORLD.pois,FLAT_WORLD.colliders,LINGXIAO_BUILDINGS,BUILDING_PATHS])');
let matrix=[1,0,0,1,0,0],stack=[],painted=[];
const mul=(b)=>{const [a0,a1,a2,a3,a4,a5]=matrix;matrix=[a0*b[0]+a2*b[1],a1*b[0]+a3*b[1],a0*b[2]+a2*b[3],a1*b[2]+a3*b[3],a0*b[4]+a2*b[5]+a4,a1*b[4]+a3*b[5]+a5];};
const point=(x,y)=>({x:matrix[0]*x+matrix[2]*y+matrix[4],y:matrix[1]*x+matrix[3]*y+matrix[5]});
f.c.courtyardContext=new Proxy({canvas:{id:'worldCanvas'},globalAlpha:1,measureText(s){return {width:s.length*8}},save(){stack.push([...matrix])},restore(){matrix=stack.pop()},translate(x,y){mul([1,0,0,1,x,y])},scale(x,y){mul([x,0,0,y,0,0])},transform(...args){mul(args)},rotate(t){mul([Math.cos(t),Math.sin(t),-Math.sin(t),Math.cos(t),0,0])},drawImage(img,sx,sy,sw,sh,x,y,w,h){if(img===im)painted.push({sx,sy,sw,sh,x,y,w,h,m:[...matrix],bounds:[point(x,y),point(x+w,y+h)]})}},{get:(o,k)=>k in o?o[k]:()=>{}});
const footprintById=new Map();
for(const enabled of [true,false])for(const cameraY of [0,700,1500])for(const id of ids){
 run(`scene25dEnabledV2888=${enabled};FLAT_WORLD.camera.y=${cameraY};globalThis.courtyardPoi=FLAT_WORLD.pois.find(p=>p.id===${JSON.stringify(id)})`);
 painted=[];matrix=[1,0,0,1,0,0];stack=[];run('drawWorldPoi(courtyardContext,courtyardPoi)');a.equal(painted.length,1);
 const p=painted[0],cell=json('joinedArchitectureLayoutV286896(courtyardPoi).cell'),landing=json('stoneRoadLandingV286896(courtyardPoi)'),box=json('poiTapBoxV2904(courtyardPoi)');matrix=p.m;
 if(footprintById.has(id))a.deepEqual(box,footprintById.get(id),'entire building footprint stays fixed as camera/depth changes');else footprintById.set(id,box);
 a.equal(run('s25CastKindV2888(courtyardPoi)'),null,'no duplicate oval shadow under painted contact shadow');
 const actual=point(p.x+cell.exitX*p.w/p.sw,p.y+cell.exitY*p.h/p.sh);
 a(Math.abs(actual.x-landing.x)<1e-7&&Math.abs(actual.y-landing.y)<1e-7,'painted mouth meets cached road at every depth');
 for(const [key,value] of Object.entries({left:p.bounds[0].x,top:p.bounds[0].y,right:p.bounds[1].x,bottom:p.bounds[1].y}))a(Math.abs(box[key]-value)<1e-7,'picking and culling enclose actual transformed art');
}
a.equal(run('JSON.stringify([player,FLAT_WORLD.pois,FLAT_WORLD.colliders,LINGXIAO_BUILDINGS,BUILDING_PATHS])'),before,'painting leaves saves, locations and collision unchanged');
// Asymmetric three-quarter facades use their actual roof edge for player visibility.
run("globalThis.grandPoi=FLAT_WORLD.pois.find(p=>p.id==='sect');globalThis.grandLayout=joinedArchitectureLayoutV286896(grandPoi);globalThis.grandBounds=poiTapBoxV2904(grandPoi);FLAT_WORLD.player.x=grandBounds.right-1;FLAT_WORLD.player.y=grandPoi.y-25;courtyardContext.globalAlpha=1;drawJoinedArchitectureV286896(courtyardContext,grandPoi)");
a.equal(run('courtyardContext.globalAlpha'),.42,'player under the extended side facade remains visible');
run("FLAT_WORLD.player.x=grandBounds.right+30;courtyardContext.globalAlpha=1;drawJoinedArchitectureV286896(courtyardContext,grandPoi)");a.equal(run('courtyardContext.globalAlpha'),1,'nearby open terrain does not fade the building');
run("currentRegion='south'");a.equal(run('joinedArchitectureReadyV286896(courtyardPoi)'),false);
run("currentRegion='north';SCROLL_ART_V2831.joinedRequested=false;SCROLL_ART_V2831.joinedBuildings=null;loadJoinedArchitectureV286896()");atlases()[1].naturalWidth=10;atlases()[1].naturalHeight=10;atlases()[1].onload();a.equal(run('SCROLL_ART_V2831.joinedBuildings'),null,'bad atlas uses existing fallback');
run('SCROLL_ART_V2831.joinedRequested=false;loadJoinedArchitectureV286896()');atlases()[2].onerror();for(let i=0;i<20;i++)run('loadJoinedArchitectureV286896()');a.equal(atlases().length,3,'failed atlas does not retry every frame');
a.equal(f.errors.length,0);console.log('PASS 29 courtyard landmarks: lazy/failure fallback, road cache invalidation, actual transformed entrance/picking agreement at six camera modes, unchanged save/collision/access');

// Terrain covers the entire world independently of camera/quality and stays in the ground cache.
const terrainImages=()=>images.filter(i=>i.src?.includes('north-terrain-v286896'));
a.equal(terrainImages().length,1);const terrain=terrainImages()[0];
run('ensureStaticWorldCache()');const previousGround=run('PERF_CONFIG.staticWorldCanvas');
terrain.naturalWidth=1254;terrain.naturalHeight=1254;terrain.onload();a.equal(previousGround.width,1);
a.equal(run('SCROLL_ART_V2831.northernTerrain'),terrain);
let tiles=0,fills=[];const terrainCtx=new Proxy({fillRect(...args){fills.push(args)},drawImage(img){a.equal(img.width,256);a.equal(img.height,160);tiles++;}},{get:(o,k)=>k in o?o[k]:()=>{}});f.c.terrainContext=terrainCtx;
const terrainState=run('JSON.stringify([player,FLAT_WORLD.pois,FLAT_WORLD.colliders,FLAT_WORLD.decor])');
const rng=f.c.Math.random;f.c.Math.random=()=>{throw Error('terrain consumed gameplay RNG')};
a.equal(run('drawNorthernTerrainV286896(terrainContext)'),true);f.c.Math.random=rng;
a(tiles>0);a.deepEqual(fills[0],[0,0,run('FLAT_WORLD.width'),run('FLAT_WORLD.height')],'ground always covers full world');a.equal(run('SCROLL_ART_V2831.groundStamps.length'),4);const stamps=run('SCROLL_ART_V2831.groundStamps');run('drawNorthernTerrainV286896(terrainContext)');a.equal(run('SCROLL_ART_V2831.groundStamps'),stamps,'small stamp canvases reused');
a.equal(run('JSON.stringify([player,FLAT_WORLD.pois,FLAT_WORLD.colliders,FLAT_WORLD.decor])'),terrainState);
let bakes=0;const paint=f.c.drawNorthernTerrainV286896;f.c.drawNorthernTerrainV286896=function(...args){bakes++;return paint(...args)};
const cache=run('ensureStaticWorldCache()');for(let i=0;i<120;i++)a.equal(run('ensureStaticWorldCache()'),cache);a.equal(bakes,1);
run("currentRegion='south'");tiles=0;a.equal(run('drawNorthernTerrainV286896(terrainContext)'),false);a.equal(tiles,0);
run('loadNorthernTerrainV286896()');a.equal(terrainImages().length,1);
// A late load in another region must not invalidate that region's cached ground.
run("currentRegion='north';SCROLL_ART_V2831.northernTerrainRequested=false;SCROLL_ART_V2831.northernTerrain=null;loadNorthernTerrainV286896();currentRegion='south'");const second=terrainImages()[1];second.naturalWidth=1254;second.naturalHeight=1254;second.onload();a.equal(run('PERF_CONFIG.staticWorldCanvas'),cache);
run("currentRegion='north';SCROLL_ART_V2831.northernTerrainRequested=false;SCROLL_ART_V2831.northernTerrain=null;loadNorthernTerrainV286896()");terrainImages()[2].onerror();for(let i=0;i<30;i++)run('loadNorthernTerrainV286896()');a.equal(terrainImages().length,3);a.equal(run('drawNorthernTerrainV286896(terrainContext)'),false);
console.log('PASS continuous terrain full-map coverage, one cached bake, unchanged gameplay/RNG, regional isolation and failed/late loading');
// Unified scene effects must not sit beneath bright architecture or reveal new map cells.
f.c.sceneAtlasForTest=im;f.c.sceneTerrainForTest=terrain;
run("startGame();closeWorldOverlay();tutorialState.active=false;player.level=10;applyWorldMapLayout('north',true);SCROLL_ART_V2831.joinedBuildings=sceneAtlasForTest;SCROLL_ART_V2831.northernTerrain=sceneTerrainForTest;scene25dEnabledV2888=true;releaseStaticWorldCacheV2767();drawFlatWorld(1000,0)");
let sceneOrder=[];
for(const [name,label] of [['drawWorldPoi','poi'],['drawWorldPlayer','player'],['drawWorldLabelsV2836','labels'],['drawExplorationFogV2828','fog'],['s25CloudShadowsV2888','cloud'],['s25JoinedWorldLightV286896','light']]){
 const original=f.c[name];f.c[name]=function(...args){sceneOrder.push(label);return original.apply(this,args)};
}
const seenBefore=run('JSON.stringify(player.explorationV2828)');
run('drawFlatWorld(1033,0)');
for(const effect of ['cloud','light','fog'])a.equal(sceneOrder.filter(x=>x===effect).length,1,effect+' runs once');
a(sceneOrder.lastIndexOf('poi')<sceneOrder.indexOf('cloud'));a(sceneOrder.indexOf('player')<sceneOrder.indexOf('cloud'));a(sceneOrder.indexOf('cloud')<sceneOrder.indexOf('light'));a(sceneOrder.indexOf('light')<sceneOrder.indexOf('fog'));a(sceneOrder.indexOf('fog')<sceneOrder.indexOf('labels'));
a.equal(run('JSON.stringify(player.explorationV2828)'),seenBefore,'shared veil never reveals unvisited cells');
const light=run('S25_V2888.joinedLight');a.equal(light.width,256);a.equal(light.height,256);
f.c.lightContext={drawImage(img){a.equal(img,light)}};for(let i=0;i<100;i++)run('s25JoinedWorldLightV286896(lightContext)');a.equal(run('S25_V2888.joinedLight'),light);
sceneOrder=[];run('scene25dEnabledV2888=false;drawFlatWorld(1066,0)');a(!sceneOrder.includes('cloud')&&!sceneOrder.includes('light'));a(sceneOrder.lastIndexOf('poi')<sceneOrder.indexOf('fog'));
sceneOrder=[];run('scene25dEnabledV2888=true;SCROLL_ART_V2831.northernTerrain=null;releaseStaticWorldCacheV2767();drawFlatWorld(1100,0)');a(sceneOrder.indexOf('fog')<sceneOrder.indexOf('poi'));a(!sceneOrder.includes('light'),'asset failure retains legacy rendering');
console.log('PASS shared cloud/light/fog follows all actors once, labels remain above veil, discovery untouched, lighting cache bounded/reused, off switch and asset fallback');
