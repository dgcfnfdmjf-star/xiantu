'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run("startGame();closeWorldOverlay();player.level=10;player.mapBuildingLabelsV211=true;gameState='exploring';FLAT_WORLD.camera={x:400,y:400};FLAT_WORLD.width=2000;FLAT_WORLD.height=1800;FLAT_WORLD.deferLabelsV2836=true");
// Capture actual paint transforms, not a second copy of the bounds formula.
let matrix,stack,ellipses,rings,texts,scaleCalls;
const ctx={canvas:{id:'worldCanvas'},globalAlpha:1,measureText:t=>({width:String(t).length*12}),
 save(){stack.push({matrix:matrix.slice(),fillStyle:this.fillStyle,font:this.font});},
 restore(){const v=stack.pop();matrix=v.matrix;this.fillStyle=v.fillStyle;this.font=v.font;},
 translate(x,y){matrix[2]+=matrix[0]*x;matrix[3]+=matrix[1]*y;},
 scale(x,y){matrix[0]*=x;matrix[1]*=y;},
 transform(){},
 ellipse(x,y,rx,ry){ellipses.push({left:matrix[2]+matrix[0]*(x-rx),right:matrix[2]+matrix[0]*(x+rx),top:matrix[3]+matrix[1]*(y-ry),bottom:matrix[3]+matrix[1]*(y+ry)});},
 arc(x,y,r){if(r===run('FLAT_WORLD.pois[0].r+16'))rings.push({r:r*matrix[0]});},
 fillText(text,x,y){texts.push({text,x:matrix[2]+matrix[0]*x,y:matrix[3]+matrix[1]*y,font:this.font});},
 createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})};
f.c.vectorCtx=new Proxy(ctx,{get:(o,k)=>k in o?o[k]:()=>{}});
const originalScale=f.c.applyVectorLandmarkScaleV286882;
f.c.applyVectorLandmarkScaleV286882=(c,o)=>{scaleCalls++;return originalScale(c,o);};
function reset(){matrix=[1,1,0,0];stack=[];ellipses=[];rings=[];texts=[];scaleCalls=0;}
const cases=[{id:'rest',action:'rest',r:65,name:'灵泉',region:'south'},
 {id:'lx_spirit_spring',buildingId:'spirit_spring',action:'lingxiao_building',r:54,name:'北域灵泉',region:'north'},
 {id:'battlefield',action:'battlefield',r:110,name:'古战场',region:'west'}];
for(const poi of cases)for(const low of [false,true])for(const loaded of [false,true])for(const depth of [false,true]){
 f.c.testPoi={...poi,x:700,y:650};
 run(`currentRegion=testPoi.region;PERF_CONFIG.lowEnd=${low};PERF_CONFIG.ultraSmooth=${low};PERF_CONFIG.mobile=true;scene25dEnabledV2888=${depth};FLAT_WORLD.pois=[testPoi];FLAT_WORLD.nearby=testPoi;FLAT_WORLD.player={x:700,y:760,r:17,speed:250};FLAT_WORLD.colliders=[{x:700,y:650,radius:testPoi.r}];SCROLL_ART_V2831.regionalBuildings=${loaded?'{width:900,height:1200}':'null'};SCROLL_ART_V2831.palace=${loaded?'{width:400,height:300}':'null'};SCROLL_ART_V2831.buildings=${loaded?'{width:900,height:600}':'null'};`);
 const before=run('JSON.stringify({player,position:FLAT_WORLD.player,pois:FLAT_WORLD.pois,colliders:FLAT_WORLD.colliders})');
 reset();run('drawWorldPoi(vectorCtx,testPoi)');a.equal(scaleCalls,1,'only the vector art receives one local scaling');
 const bounds=json('vectorLandmarkBoundsV286882(testPoi)');a.deepEqual(json('poiTapBoxV2904(testPoi)'),bounds);
 for(const ellipse of ellipses)a(ellipse.left>=bounds.left-1e-6&&ellipse.right<=bounds.right+1e-6&&ellipse.top>=bounds.top-1e-6&&ellipse.bottom<=bounds.bottom+1e-6,'actual painted ellipses fit shared bounds');
 a.equal(rings.length,1);a(Math.abs(rings[0].r-run('(testPoi.r+16)*(scene25dOnV2888()?s25DepthScaleV2888(testPoi.y):1)'))<1e-6,'near ring retains original radius and existing depth only');
 a.equal(run(`tappedPoiV2904(${bounds.right-1},${(bounds.top+bounds.bottom)/2})===testPoi`),true,'visible enlarged edge is clickable');
 reset();run('drawWorldLabelsV2836(vectorCtx,[testPoi])');const name=texts.find(t=>t.text===poi.name);a(name,'near name survives the player directly below it');a(name.y-12>=bounds.bottom+10,'plate never rises into the vector art');a(/800 12px/.test(name.font),'mobile font is not scaled');
 a.equal(run('JSON.stringify({player,position:FLAT_WORLD.player,pois:FLAT_WORLD.pois,colliders:FLAT_WORLD.colliders})'),before,'render and label layout preserve gameplay/save state');
 const cam={x:bounds.right-1,y:bounds.top};f.c.testCam=cam;a.equal(run('architectureInViewV286881(testPoi,testCam,390,700)'),true,'visible vector edge uses the same culling bounds');
}
// Existing atlas and forest branches receive no new transform, even while atlases are missing.
for(const id of ['mountain','forest','romance','secret','travel_gate','sect','market']){
 f.c.testPoi={id,action:id,x:700,y:650,r:60,name:id};a.equal(run('vectorLandmarkProfileV286882(testPoi)'),null);reset();run('FLAT_WORLD.pois=[testPoi];FLAT_WORLD.nearby=null;drawWorldPoi(vectorCtx,testPoi)');a.equal(scaleCalls,0,id+' keeps its existing art scale');
}
// MAP_ALIVE isolation deliberately omits landmarkPoint; vector labels/taps still remain usable.
const point=f.c.landmarkPointV2893;f.c.landmarkPointV2893=undefined;
for(const poi of cases){f.c.testPoi={...poi,x:700,y:650};a.doesNotThrow(()=>run('poiNameAnchorV286880(testPoi);poiTapBoxV2904(testPoi)'));const b=json('poiTapBoxV2904(testPoi)');a(Object.values(b).every(Number.isFinite));}f.c.landmarkPointV2893=point;
// Clicking the visible edge creates normal walking, respects reach/access, and cannot teleport or pay rewards.
run("resetWorldMovementV28686();closeWorldOverlay();currentRegion='south';FLAT_WORLD.player={x:180,y:400,r:17,speed:250};FLAT_WORLD.pois=[{id:'rest',action:'rest',name:'灵泉',x:700,y:400,r:65}];FLAT_WORLD.colliders=[];FLAT_WORLD.monsters=[];");
const b=json('poiTapBoxV2904(FLAT_WORLD.pois[0])'),position=json('FLAT_WORLD.player'),gold=run('player.gold');
a(run(`handleWorldTapV2904(${b.right-1},${(b.top+b.bottom)/2},'touch')`));a(run('autoNavigationV2830.poi===FLAT_WORLD.pois[0]'));a.deepEqual(json('FLAT_WORLD.player'),position);a.equal(run('player.gold'),gold);
a.equal(run('enterTappedPoiV2904({owner:player,region:currentRegion,poi:FLAT_WORLD.pois[0]})'),false,'out-of-range direct entry remains forbidden');
const access=f.c.scrollPoiAccessV2837;f.c.scrollPoiAccessV2837=()=>({allowed:false,reason:'尚未解锁'});a.equal(run(`handleWorldTapV2904(${b.right-1},${(b.top+b.bottom)/2},'touch')`),false);f.c.scrollPoiAccessV2837=access;
console.log('PASS vector landmarks: actual draw transforms, both atlas states, low/high, depth toggle, ring/physics invariants, edge taps/cull, near label clearance, MAP_ALIVE fallback and guarded walking');
