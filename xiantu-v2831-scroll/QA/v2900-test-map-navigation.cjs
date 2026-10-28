'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);for(const file of files)f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run('JSON.stringify('+s+')'));
function fresh(){run('resetRuntimeState();player=createDefaultPlayer();gameState="exploring";closeWorldOverlay();document.getElementById("equipmentPanel")?.remove();FLAT_WORLD.width=1200;FLAT_WORLD.height=900;FLAT_WORLD.player={x:200,y:300,r:17,speed:250};FLAT_WORLD.pois=[];FLAT_WORLD.colliders=[{type:"tree",x:400,y:300,radius:35}];FLAT_WORLD.keys={};FLAT_WORLD.target=null;FLAT_WORLD.monsters=[];autoNavigationV2830=null;updateWorldMonsters=()=>{};revealExplorationV2828=()=>{};syncWarMapV2840=()=>{};checkResourceCollection=()=>{};');}
fresh();run('FLAT_WORLD.target={x:600,y:300};for(let i=0;i<300;i++)updateFlatWorld(.016)');a(run('FLAT_WORLD.player.x')<350,'old direct target reproduces head-on blockage');
a.equal(typeof f.c.setWorldTapDestinationV2900,'function','tap input needs a single obstacle-aware navigation entry');
fresh();a.equal(run('setWorldTapDestinationV2900(600,300)'),true);a(run('autoNavigationV2830'));const route=json('autoNavigationV2830.route');a.deepEqual(route.at(-1),{x:600,y:300});
for(let i=0;i<600&&run('autoNavigationV2830');i++){run('updateFlatWorld(.016)');a(run('Math.hypot(FLAT_WORLD.player.x-400,FLAT_WORLD.player.y-300)')>=52-1e-6,'never cut through obstacle');}
a.equal(run('autoNavigationV2830'),null);a(run('Math.hypot(FLAT_WORLD.player.x-600,FLAT_WORLD.player.y-300)')<1);
console.log('PASS reproduced direct-tap blockage; routed tap reaches exact point without penetrating collider');
// Clear paths must not search the grid or change collision/interaction footprints.
fresh();const plan=f.c.planNavigationV2830;let searches=0;f.c.planNavigationV2830=function(...args){searches++;return plan.apply(this,args)};
run('setWorldTapDestinationV2900(200,600)');a.equal(searches,0);a.equal(run('autoNavigationV2830'),null);
run('setWorldTapDestinationV2900(600,300)');a.equal(searches,1);run('for(let i=0;i<30;i++)updateFlatWorld(.016)');a.equal(searches,1,'path search runs only at tap time');
run('setWorldTapDestinationV2900(100,100)');a.equal(run('autoNavigationV2830'),null);a.deepEqual(json('FLAT_WORLD.target'),{x:100,y:100});
fresh();run('setWorldTapDestinationV2900(600,300);FLAT_WORLD.keys={d:true};tickNavigationV2830(.016)');a.equal(run('autoNavigationV2830'),null);
fresh();a.equal(run('setWorldTapDestinationV2900(400,300)'),false,'tree centre is not walkable');a.equal(run('FLAT_WORLD.target'),null);a.equal(run('autoNavigationV2830'),null);
fresh();run('FLAT_WORLD.colliders=[];setWorldTapDestinationV2900(-100,10000)');a.deepEqual(json('FLAT_WORLD.target'),{x:30,y:870});
const previous=run('FLAT_WORLD.target');a.equal(run('setWorldTapDestinationV2900(NaN,20)'),false);a.equal(run('FLAT_WORLD.target'),previous);
for(const state of ['combat','combat-ending']){fresh();run(`gameState='${state}'`);a.equal(run('setWorldTapDestinationV2900(600,300)'),false);a.equal(run('FLAT_WORLD.target'),null);}
fresh();run('showEquipmentPanel()');a.equal(run('setWorldTapDestinationV2900(600,300)'),false);
// Building-centre taps use the existing approach range; locks remain engine-owned.
fresh();run('FLAT_WORLD.pois=[{id:"lx_main_hall",buildingId:"main_hall",x:600,y:300,r:28,action:"lingxiao_building",name:"大殿"}];rebuildWorldColliders()');
const footprint=run('JSON.stringify(FLAT_WORLD.colliders)'),saved=run('JSON.stringify(player)');a.equal(run('setWorldTapDestinationV2900(600,300)'),true);a.equal(run('JSON.stringify(player)'),saved,'tap does not mark a POI or alter the save');
for(let i=0;i<600&&run('autoNavigationV2830');i++)run('updateFlatWorld(.016)');
const dist=run('Math.hypot(FLAT_WORLD.player.x-600,FLAT_WORLD.player.y-300)');a(dist<28+62&&dist>=35,'arrives inside existing interaction range, outside collider');a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),footprint);
// Reachability failure must discard the previous destination, never keep walking into it.
fresh();run('FLAT_WORLD.colliders=Array.from({length:20},(_,i)=>({type:"tree",x:400,y:30+i*45,radius:30}));FLAT_WORLD.target={x:900,y:300}');a.equal(run('setWorldTapDestinationV2900(600,300)'),false);a.equal(run('FLAT_WORLD.target'),null);
fresh();run('setWorldTapDestinationV2900(600,300);currentRegion="north";tickNavigationV2830(.016)');a.equal(run('autoNavigationV2830'),null);
console.log('PASS one search per blocked tap, exact destination, takeover, unreachable/invalid input, map/overlay/combat guards and unchanged building access/save');
// Regional sheets and lock checks are retained, without scaling coordinates or radii.
fresh();run('SCROLL_ART_V2831.regionalBuildings={width:900,height:1200};SCROLL_ART_V2831.palace={width:400,height:300};SCROLL_ART_V2831.buildings={width:900,height:600};');
const cfg=run('JSON.stringify([WORLD_MAP_CONFIGS,LINGXIAO_BUILDINGS])'),ctx=f.ids.get('worldCanvas').getContext('2d'),draws=[];ctx.drawImage=(...args)=>draws.push(args);
for(const region of ['north','demon_domain','immortal_domain']){
 run(`currentRegion='${region}'`);draws.length=0;
 f.c.testCtx=ctx;run('drawRegionBuildingV2835(testCtx,{action:"lingxiao_building",buildingId:"main_hall",name:"大殿"})');a.equal(draws[0][7],140);a.equal(draws[0][5],-70);
 run('drawRegionBuildingV2835(testCtx,{action:"lingxiao_building",buildingId:"dormitory",name:"居所"})');a.equal(draws[1][7],100);
}
a.equal(run('JSON.stringify([WORLD_MAP_CONFIGS,LINGXIAO_BUILDINGS])'),cfg,'rendering does not expand map configuration');
run('SCROLL_ART_V2831.regionalBuildings={width:0,height:0}');a.equal(run('drawRegionBuildingV2835(testCtx,{action:"lingxiao_building",buildingId:"main_hall"})'),false);
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS architecture hierarchy, same regional atlases, unchanged world coordinates and missing-image fallback');
// Expansion is immutable after installation, including shared faction-position arrays.
const expanded=run('JSON.stringify(WORLD_MAP_CONFIGS)');run('expandWorldLayoutsV2900();expandWorldLayoutsV2900()');a.equal(run('JSON.stringify(WORLD_MAP_CONFIGS)'),expanded);
for(const [id,base] of Object.entries(json('WORLD_MAP_BASE_V2900'))){
 const cfg=json(`WORLD_MAP_CONFIGS[${JSON.stringify(id)}]`);a.equal(cfg.width,Math.round(base.width*1.45));a.equal(cfg.height,Math.round(base.height*1.45));
 a.equal(Math.ceil(base.width/96),Math.ceil(cfg.width/(96*1.45)));a.equal(Math.ceil(base.height/96),Math.ceil(cfg.height/(96*1.45)));
 for(const [key,pos] of Object.entries(base.poiPositions))a.deepEqual(cfg.poiPositions[key],pos.map(n=>Math.round(n*1.45)),id+' '+key);
}
// Recreate the old seeded exploration placement against unscaled inputs. IDs, types,
// rewards and relative positions must survive rather than re-rolling on a new map.
function legacyExploration(region){
 const cfg=json(`WORLD_MAP_BASE_V2900[${JSON.stringify(region)}]`),templates=json('WORLD_POI_TEMPLATES');
 const pois=Object.entries(cfg.poiPositions).map(([id,pos])=>({...templates[id],x:pos[0],y:pos[1]}));
 if(region==='north')for(const b of json('LINGXIAO_BUILDINGS')){const p=json(`LINGXIAO_BASE_V2900[${JSON.stringify(b.id)}]`);pois.push({...p,r:b.id==='spirit_spring'?55:28});}
 let seed=[...region].reduce((n,ch)=>n+ch.charCodeAt(0),817),rows=[];
 const rnd=()=>((seed=seed*16807%2147483647)/2147483647);
 for(let i=0;i<150&&rows.length<6;i++){
  const x=100+rnd()*(cfg.width-200),y=100+rnd()*(cfg.height-200);
  if([...pois,...rows].some(p=>Math.hypot(p.x-x,p.y-y)<(p.r||30)+100))continue;
  rows.push({x,y,r:24,type:rows.length%3});
 }
 return rows;
}
for(const region of Object.keys(json('WORLD_MAP_CONFIGS'))){
 const old=legacyExploration(region),now=json(`buildWorldMapPois(${JSON.stringify(region)}).filter(p=>p.action==='explore_v2828')`);a.equal(now.length,old.length);
 now.forEach((p,i)=>{a.equal(p.id,'explore_v2828_'+i);a.equal(p.exploreTypeV2828,old[i].type);a(Math.abs(p.x-old[i].x*1.45)<1e-8);a(Math.abs(p.y-old[i].y*1.45)<1e-8);});
}
fresh();run('var legacy2900=createDefaultPlayer();legacy2900.level=8;legacy2900.worldMapId="north";legacy2900.explorationV2828={maps:{north:{seen:{"4,5":1},claimed:{explore_v2828_0:"take"}}},marked:{region:"north",id:"lx_main_hall"}};legacy2900.roamingV286818={maps:{north:{seen:["4,5"],resolved:{traveler:"aid"},steps:1}}};player=normalizePlayer(legacy2900);ensureWorldMapInitialized();');
a.equal(run('currentRegion'),'north');a.equal(run('exploredPointV2828(4.5*EXPLORATION_CELL_V2900,5.5*EXPLORATION_CELL_V2900)'),true);a.equal(run('markedExplorationV2829().id'),'lx_main_hall');
a.equal(run('player.roamingV286818.maps.north.resolved.traveler'),'aid');a.equal(run('Object.keys(explorationV2828().seen).length'),1);
a.equal(run('FLAT_WORLD.player.x'),run('WORLD_MAP_CONFIGS.north.spawn.x'));a.equal(run('FLAT_WORLD.player.y'),run('WORLD_MAP_CONFIGS.north.spawn.y'));
run('var claimed2900=FLAT_WORLD.pois.find(p=>p.id==="explore_v2828_0");FLAT_WORLD.player.x=claimed2900.x;FLAT_WORLD.player.y=claimed2900.y');const rewardState=run('JSON.stringify([player.gold,player.exp,player.materials])');run('claimExplorationV2828("explore_v2828_0","take")');a.equal(run('JSON.stringify([player.gold,player.exp,player.materials])'),rewardState);
const oldSite={region:'north',x:600,y:500};f.c.oldSite2900=oldSite;const migrated=json('migrateWarSiteV2900(oldSite2900)');a.deepEqual(migrated,{region:'north',x:870,y:725,layoutV2900:1});a.deepEqual(oldSite,{region:'north',x:600,y:500},'copy migration preserves old save object');
f.c.site2900=migrated;a.deepEqual(json('migrateWarSiteV2900(site2900)'),migrated);a.equal(run('validWarSiteV2840(site2900)'),true);
console.log('PASS eight maps scaled exactly once, legacy exploration/roaming cells and once-only reward IDs retained, spawn/marked POI restored, war coordinates migrate once');
run('player.level=14');let destinations=0;
for(const region of Object.keys(json('WORLD_MAP_CONFIGS'))){
 run(`applyWorldMapLayout(${JSON.stringify(region)},true)`);a.equal(run('FLAT_WORLD.colliders.some(c=>Math.hypot(c.x-FLAT_WORLD.player.x,c.y-FLAT_WORLD.player.y)<c.radius+17)'),false,region+' safe spawn');
 for(const poi of json('FLAT_WORLD.pois')){
  f.c.goal2900=poi;const route=json('planNavigationV2830(goal2900)');a(route?.length,region+' '+poi.id+' reachable');
  const colliders=json('FLAT_WORLD.colliders');let prev=json('FLAT_WORLD.player');
  for(const point of route){
   for(const c of colliders){f.c.segment2900={a:prev,b:point,c};a(run('worldDistanceSegmentV2827(segment2900.c.x,segment2900.c.y,segment2900.a,segment2900.b)')>=c.radius+21-1e-7,'smoothed route keeps clearance');}
   prev=point;
  }destinations++;
 }
}
console.log('PASS safe spawns and collision-free routes to '+destinations+' landmarks across eight expanded maps');
