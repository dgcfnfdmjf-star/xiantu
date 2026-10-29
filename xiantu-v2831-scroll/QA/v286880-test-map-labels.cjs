'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),get=s=>JSON.parse(run(`JSON.stringify(${s})`));
run("player=createDefaultPlayer();player.level=10;player.mapBuildingLabelsV211=true;gameState='exploring';currentRegion='north';FLAT_WORLD.player={x:900,y:800};FLAT_WORLD.nearby=null;FLAT_WORLD.camera={x:500,y:400};PERF_CONFIG.mobile=false;SCROLL_ART_V2831.regionalBuildings={width:900,height:1200};SCROLL_ART_V2831.palace={width:400,height:300};SCROLL_ART_V2831.buildings={width:900,height:600};");
let labels=[];f.c.labelTestCtx=new Proxy({measureText:t=>({width:String(t).length*13}),fillText:(text,x,y)=>labels.push({text,x,y})},{get:(o,k)=>k in o?o[k]:()=>{}});
for(const id of ['main_hall','gate','elder_hall','forbidden_library','ancestor_cave','spirit_spring']){
 run(`globalThis.labelPoi={...getBuildingData('${id}'),id:'lx_${id}',buildingId:'${id}',action:'lingxiao_building',x:1200,y:900,r:28}`);
 for(const region of ['north','south']){
  run(`currentRegion='${region}'`);const bound=run('poiTapBoxV2904(labelPoi).bottom');labels=[];run('drawWorldLabelsV2836(labelTestCtx,[labelPoi])');
  const name=run('labelPoi.name'),entry=labels.find(l=>l.text===name);a(entry,id+' must have a visible name');a(entry.y-12>=bound+10,`${id} text plate must clear its painted base in ${region}`);
 }
}
// Close POIs displace downward, preserving both names without returning into a doorway.
run("currentRegion='north';globalThis.labelPoi={id:'lx_main_hall',buildingId:'main_hall',action:'lingxiao_building',name:'凌霄大殿',x:1200,y:900,r:28};globalThis.secondLabel={...labelPoi,id:'second',name:'相邻大殿'}");labels=[];run('drawWorldLabelsV2836(labelTestCtx,[labelPoi,secondLabel])');const pair=labels.filter(l=>["凌霄大殿","相邻大殿"].includes(l.text));a.equal(pair.length,2);a(Math.abs(pair[0].y-pair[1].y)>=40);
// Keep locked status, label preference, mobile distance culling, and NPC/enemy filtering.
run('player.level=0');labels=[];run('drawWorldLabelsV2836(labelTestCtx,[labelPoi])');a(labels.some(l=>/未解锁/.test(l.text)));run('player.level=10');
run('player.mapBuildingLabelsV211=false');labels=[];run('drawWorldLabelsV2836(labelTestCtx,[labelPoi])');a.equal(labels.length,0);
run('player.mapBuildingLabelsV211=true;PERF_CONFIG.mobile=true;FLAT_WORLD.player={x:10,y:10}');labels=[];run('drawWorldLabelsV2836(labelTestCtx,[labelPoi])');a.equal(labels.length,0);
run('FLAT_WORLD.nearby=labelPoi');labels=[];run('drawWorldLabelsV2836(labelTestCtx,[labelPoi])');a(labels.some(l=>l.text==='凌霄大殿'));
run('PERF_CONFIG.mobile=false');labels=[];run("drawWorldLabelsV2836(labelTestCtx,[{...labelPoi,id:'enemy',enemy:{name:'敌人'}},{...labelPoi,id:'npc',action:'npc_talk'}])");a.equal(labels.length,0);
// Layout never mutates map/collision/save state, and always releases its per-frame layout.
const before=get('({player,pois:FLAT_WORLD.pois,colliders:FLAT_WORLD.colliders,position:FLAT_WORLD.player})');run('drawWorldLabelsV2836(labelTestCtx,[labelPoi])');a.deepEqual(get('({player,pois:FLAT_WORLD.pois,colliders:FLAT_WORLD.colliders,position:FLAT_WORLD.player})'),before);a.equal(run('labelBoxesV2836'),null);
console.log('PASS real building-base label clearance, downward collision avoidance, locked/near/mobile/preference filters, no gameplay changes');
