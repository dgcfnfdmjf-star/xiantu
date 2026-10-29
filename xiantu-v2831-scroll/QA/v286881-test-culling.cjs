'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run('JSON.stringify('+s+')'));
run("player=createDefaultPlayer();player.level=10;gameState='exploring';applyWorldMapLayout('north',true);PERF_CONFIG.mobile=false;PERF_CONFIG.graphicsQuality='high';ALIVE_V2893.dprDowngraded=false");
const canvas=f.c.document.getElementById('worldCanvas');
let order=[],time=1000;
f.c.drawWorldPoi=(ctx,o)=>order.push(o.id);f.c.drawWorldPlayer=()=>order.push('player');
f.c.drawWorldMonster=()=>order.push('monster');f.c.drawDepthTreeV2770=()=>order.push('tree');
f.c.drawWorldLabelsV2836=()=>{};f.c.mapAliveBuildingV2893=()=>{};
function scene({region='north',loaded=true,low=false,dpr=1,gap=160}={}){
 canvas.width=500*dpr;canvas.height=400*dpr;canvas._dpr=dpr;
 run(`currentRegion='${region}';player.worldMapId=currentRegion;PERF_CONFIG.lowEnd=${low};PERF_CONFIG.ultraSmooth=${low};FLAT_WORLD.width=4200;FLAT_WORLD.height=3200;FLAT_WORLD.camera.x=500;FLAT_WORLD.camera.y=500;FLAT_WORLD.player.x=750;FLAT_WORLD.player.y=700;FLAT_WORLD.moving=false;ALIVE_V2893.snap=false;ALIVE_V2893.la={x:0,y:0};
  SCROLL_ART_V2831.regionalBuildings=${loaded?'{width:1536,height:2048}':'null'};SCROLL_ART_V2831.palace=${loaded?'{width:300,height:400}':'null'};SCROLL_ART_V2831.buildings=${loaded?'{width:1536,height:1024}':'null'};
  FLAT_WORLD.pois=[{id:'back',action:'shop',name:'后方商店',x:750,y:600,r:40},{id:'near',action:'market',name:'前方坊市',x:750,y:750,r:40},{id:'sect',action:'sect',name:'凌霄宗',x:750,y:${900+gap},r:105}];
  FLAT_WORLD.monsters=[];FLAT_WORLD.decor=[];FLAT_WORLD.colliders=[];releaseStaticWorldCacheV2767();`);
}
function frame(){order=[];run(`drawFlatWorld(${time+=33},1/30)`);return order.slice();}
// The real regional atlas leaves ~40 world pixels of roof visible with its centre 160 below the viewport.
for(const region of ['north','demon_domain','immortal_domain','south'])for(const low of [false,true])for(const dpr of [1,1.5]){
 scene({region,low,dpr});const before=run('JSON.stringify({p:FLAT_WORLD.player,pois:FLAT_WORLD.pois,colliders:FLAT_WORLD.colliders})');
 a.deepEqual(frame(),['back','player','near','sect'],`${region}, low=${low}, DPR=${dpr}: retains depth order and draws the clipped roof once`);
 const box=json('poiTapBoxV2904(FLAT_WORLD.pois[2])');a(box.top<900&&box.bottom>900,'roof really intersects the visible rectangle');
 a.equal(run('JSON.stringify({p:FLAT_WORLD.player,pois:FLAT_WORLD.pois,colliders:FLAT_WORLD.colliders})'),before,'drawing never changes movement, POI position/radius or collision');
 run('FLAT_WORLD.pois[2].y=1500');a(!frame().includes('sect'),'fully offscreen building remains culled');
}
// Adjacent frames crossing the old 130px boundary cannot remove a still-visible roof.
scene();for(const gap of [129,131,160,190]){run(`FLAT_WORLD.pois[2].y=${900+gap}`);a.equal(frame().filter(id=>id==='sect').length,1,'no pop at the old centre threshold');}
// Sprite availability is consulted on every frame; missing art must not leave cached dimensions.
scene({loaded:false,gap:80});a.equal(frame().filter(id=>id==='sect').length,1,'fallback building still draws within the existing safe margin');
run('FLAT_WORLD.pois[2].y=1060');a(!frame().includes('sect'),'unloaded, small fallback need not draw outside its conservative margin');
run('SCROLL_ART_V2831.regionalBuildings={width:1536,height:2048}');a.equal(frame().filter(id=>id==='sect').length,1,'late atlas arrival immediately extends roof visibility');
run('SCROLL_ART_V2831.regionalBuildings=null');a(!frame().includes('sect'),'failed/unloaded atlas cannot keep stale expanded bounds');
// No global expansion of monster, tree, NPC, war or hidden exploration visibility.
scene();run("FLAT_WORLD.monsters=[{x:750,y:1060,alive:true,enemy:{name:'灵狼'}}];FLAT_WORLD.decor=[{x:750,y:1060,t:'tree',s:1}];FLAT_WORLD.pois.push({id:'hidden',action:'explore_v2828',x:750,y:650,r:24},{id:'npc',action:'npc_elder',x:750,y:1060,r:20})");
f.c.exploredPointV2828=()=>false;const drawn=frame();for(const id of ['tree','monster','hidden','npc'])a(!drawn.includes(id),id+' culling/discovery remains unchanged');
for(const o of [{enemy:{}},{t:'tree'},{_warUnitV2840:true},{action:'war_map_v2840'},{action:'explore_v2828'},{action:'yewuji_v2810'}]){f.c.__cullObject=o;a.equal(run('architectureInViewV286881(__cullObject,{x:0,y:0},500,400)'),false);}
// The existing isolated MAP_ALIVE comparison deliberately omits landmark helpers.
const point=f.c.landmarkPointV2893;f.c.landmarkPointV2893=undefined;
a.doesNotThrow(()=>frame());a.equal(run('architectureInViewV286881(FLAT_WORLD.pois[2],{x:500,y:500},500,400)'),false);
f.c.landmarkPointV2893=point;
console.log('PASS architecture culling: all atlas regions, low/high, DPR 1/1.5, edge continuity, single depth-sorted draw, live atlas bounds and unchanged non-building visibility');
