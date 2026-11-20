'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.console.log=()=>{};f.c.Math=Object.create(Math);const Base=f.c.Image;
f.c.Image=class extends Base{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
const regions=['human_peaks','human_valleys','demon_domain','immortal_domain'],counts=[12,12,10,9];
// Interior probes are measured from the final paintings, independently of the
// collider sampling grid: walls, cave arches, spring water and both gate posts.
const solidProbes={
 human_peaks:[[320,150],[650,140],[990,163],[1249,344],[1230,634],[960,816],[640,799],[325,697],[200,409],[650,518],[433,533],[131,928],[202,928]],
 human_valleys:[[326,159],[650,109],[970,160],[1252,336],[1255,617],[960,816],[630,757],[210,708],[145,417],[726,490],[438,535],[109,939],[204,939]],
 demon_domain:[[330,149],[678,129],[1003,150],[1275,313],[1250,630],[145,420],[246,420],[730,482],[451,540],[119,879],[211,879]],
 immortal_domain:[[319,150],[676,123],[976,131],[1201,332],[1231,640],[152,420],[265,420],[756,491],[445,540],[99,894],[230,894]]
};
function activate(region){
 run(`applyWorldMapLayout('${region}',true);loadScrollArtV2831()`);
 const scene=json('wildSceneV286898()');a(scene,region+' has an authored panorama');
 const im=images.filter(im=>im.src==='./'+scene.file).at(-1);
 if(im.onload){im.naturalWidth=scene.width;im.naturalHeight=scene.height;im.onload();}
 a(run('wildSceneReadyV286898()'));return im;
}
run('player=createDefaultPlayer();player.level=10;gameState="exploring";applyWorldMapLayout("south",true);loadScrollArtV2831()');
a.equal(images.filter(im=>/-(peaks|valleys|domain)-panorama-v2868124/.test(im.src)).length,0,'faction art is not requested from another region');
let routes=0,spawned=0;
for(const [index,region] of regions.entries()){
 run(`applyWorldMapLayout('${region}',true);loadScrollArtV2831()`);
 const before=run('JSON.stringify({player,pois:FLAT_WORLD.pois,config:getWorldMapConfig(),region:getRegionInfo(currentRegion),unlock:REGION_UNLOCK_LEVEL[currentRegion]})');
 const scene=json('wildSceneV286898()');a(scene);a.equal(scene.width,1484);a.equal(scene.height,1060);a(scene.minimap&&scene.overview);a.equal(scene.actorScale,1);a(fs.statSync(path.join(root,scene.file)).size>10000);
 activate(region);
 a.equal(run('JSON.stringify({player,pois:FLAT_WORLD.pois,config:getWorldMapConfig(),region:getRegionInfo(currentRegion),unlock:REGION_UNLOCK_LEVEL[currentRegion]})'),before,'paint load preserves POIs, save, region, entry requirements and config');
 a.deepEqual(json('getWorldMapConfig().spawn'),{x:464,y:1537});a.deepEqual(json('WORLD_MAP_BASE_V2900[currentRegion].safeZones'),[{x:390,y:630,r:230}]);
 a.equal(Object.keys(scene.rooms).length,counts[index]);
 a(run('FLAT_WORLD.colliders.some(c=>c.type==="wild-scene")'),'painted solid bodies exist');
 a.equal(run('FLAT_WORLD.colliders.some(c=>c.type==="tree"||c.type==="stone")'),false,'procedural scenery does not leave invisible blockers');
 for(const [x,y] of solidProbes[region])a(run(`(()=>{const p=wildSceneWorldV286898(${x},${y});return FLAT_WORLD.colliders.some(c=>c.type==='wild-scene'&&Math.hypot(p.x-c.x,p.y-c.y)<c.radius+17);})()`),region+' painted solid remains blocked at '+x+','+y);
 const spawn=json('getWorldMapConfig().spawn');
 for(const id of Object.keys(scene.rooms)){
  run(`globalThis.factionPoi123=FLAT_WORLD.pois.find(p=>p.id==='${id}');globalThis.factionDoor123=wildSceneDoorV286898(factionPoi123)`);
  a(run('!!factionDoor123'),region+' '+id+' entrance retains original interaction reach');
  a(run('Math.hypot(factionDoor123.x-factionPoi123.x,factionDoor123.y-factionPoi123.y)<2'),'painted entrance stays at the original POI');
  a(run('!FLAT_WORLD.colliders.some(c=>Math.hypot(factionDoor123.x-c.x,factionDoor123.y-c.y)<c.radius+21)'),'door is clear for walking and navigation');
  const box=json('poiTapBoxV2904(factionPoi123)');a(box.right>box.left&&box.bottom>box.top);
  run('FLAT_WORLD.camera.y+=350');a.deepEqual(json('poiTapBoxV2904(factionPoi123)'),box,'roof picking is independent of camera depth');
  if(scene.rooms[id].mask){
   const cuts=[],ctx={globalAlpha:1,save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){this.clipped=true;},drawImage(...args){cuts.push(args);}};
   f.c.factionMaskContext123=ctx;run('drawWildMaskV286898(factionMaskContext123,factionPoi123)');
   a(ctx.clipped);a.equal(cuts.length,1);a.equal(cuts[0][0],run('SCROLL_ART_V2831.wildScenes[currentRegion]'));
   const [,x,y,w,h]=cuts[0];a(x>=0&&y>=0&&w>0&&h>0&&x+w<=1484&&y+h<=1060,'roof crop stays within its own scene');
  }
 }
 a(run(`!FLAT_WORLD.colliders.some(c=>Math.hypot(${spawn.x}-c.x,${spawn.y}-c.y)<c.radius+21)`),'original spawn remains clear');
 run('globalThis.factionRoadClear123=(a,b)=>!FLAT_WORLD.colliders.some(c=>worldDistanceSegmentV2827(c.x,c.y,a,b)<c.radius+21)');
 a(run('(()=>{const s=wildSceneV286898(),n=s.roads.map(p=>wildSceneWorldV286898(...p));return s.links.every(([a,b])=>factionRoadClear123(n[a],n[b]));})()'),'painted road links avoid pillars, bodies and unchanged exploration objects');
 a(run('Object.keys(wildSceneV286898().rooms).every(id=>{const p=FLAT_WORLD.pois.find(p=>p.id===id);return !!wildSceneRouteV286898({...p,...wildSceneDoorV286898(p)},factionRoadClear123);})'),'all entrances connect through the painted road graph from spawn');
 // Exercise the existing planner from every painted entrance, including services,
 // to every existing POI (the six exploration IDs are not replaced by this art).
 for(const start of [null,...Object.keys(scene.rooms)]){
  run(`globalThis.factionStart123=${start?`wildSceneDoorV286898(FLAT_WORLD.pois.find(p=>p.id==='${start}'))`:'getWorldMapConfig().spawn'};FLAT_WORLD.player.x=factionStart123.x;FLAT_WORLD.player.y=factionStart123.y`);
  for(const id of json('FLAT_WORLD.pois.map(p=>p.id)')){
   run(`globalThis.factionGoal123=FLAT_WORLD.pois.find(p=>p.id==='${id}');globalThis.factionRoute123=planNavigationV2830(factionGoal123)`);
   a(run('factionRoute123?.length>0'),region+' '+start+' -> '+id);
   a(run('(()=>{let previous=factionStart123;for(const q of factionRoute123){if(FLAT_WORLD.colliders.some(c=>worldDistanceSegmentV2827(c.x,c.y,previous,q)<c.radius+17-1e-5))return false;previous=q;}return true})()'),'route crosses a solid body: '+region+' '+id);
   if(scene.rooms[id])a(run('Math.hypot(factionRoute123.at(-1).x-wildSceneDoorV286898(factionGoal123).x,factionRoute123.at(-1).y-wildSceneDoorV286898(factionGoal123).y)<.1'),'route ends at painted entrance');
   routes++;
  }
 }
 // Reuse the real spawning rules; a new background must not spawn actors in its
 // walls or water-side rocks, or bypass service safety and POI separation.
 const beforeSpawned=spawned;
 for(let seed=1;seed<=40;seed++){
  let state=seed;f.c.Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  run('FLAT_WORLD.monsters=[];FLAT_WORLD.player.x=getWorldMapConfig().spawn.x;FLAT_WORLD.player.y=getWorldMapConfig().spawn.y');
  const monster=run('spawnSingleMonster()');if(!monster)continue;spawned++;
  a.equal(monster.regionId,region);a(!run('FLAT_WORLD').colliders.some(c=>Math.hypot(monster.x-c.x,monster.y-c.y)<c.radius+monster.radius));
  a(!run('getWorldMapConfig()').safeZones.some(z=>Math.hypot(monster.x-z.x,monster.y-z.y)<z.r));
 }
 a.equal(spawned-beforeSpawned,40,region+' retains valid spawns for all 40 baseline seeds');
 const progress=run('JSON.stringify(player)'),cache=run('ensureStaticWorldCache()');for(let i=0;i<5;i++)a.equal(run('ensureStaticWorldCache()'),cache);
 a.equal(run('JSON.stringify(player)'),progress,'painting never discovers fog or grants rewards');
 a(run('Object.keys(SCROLL_ART_V2831.wildScenes).length<=2'),'decoded panorama cache remains bounded');
}
a(spawned>80,'normal valid monster candidates remain available');
// The NPC is still drawn separately over his authored, empty stone platform.
activate('demon_domain');run('globalThis.rivalDraws123=0;globalThis.oldRivalDraw123=drawMapNpcPresenceV286889;drawMapNpcPresenceV286889=()=>{rivalDraws123++};drawWorldPoi(document.createElement("canvas").getContext("2d"),FLAT_WORLD.pois.find(p=>p.id==="yewuji_gate"));drawMapNpcPresenceV286889=oldRivalDraw123');a.equal(run('rivalDraws123'),1);
// A slow request for a map already left must not move actors or replace the active geometry.
run('delete SCROLL_ART_V2831.wildScenes.human_peaks;delete SCROLL_ART_V2831.wildSceneRequested.human_peaks;applyWorldMapLayout("human_peaks",true);loadScrollArtV2831()');
const late=images.filter(im=>im.src?.includes('human-peaks-panorama')).at(-1);activate('immortal_domain');
const geometry=run('JSON.stringify(FLAT_WORLD.colliders)'),position=run('JSON.stringify(FLAT_WORLD.player)');late.naturalWidth=1484;late.naturalHeight=1060;late.onload();
a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),geometry);a.equal(run('JSON.stringify(FLAT_WORLD.player)'),position);a(run('Object.keys(SCROLL_ART_V2831.wildScenes).length<=2'));
for(const malformed of [false,true]){
 run('delete SCROLL_ART_V2831.wildScenes.human_valleys;delete SCROLL_ART_V2831.wildSceneRequested.human_valleys;applyWorldMapLayout("human_valleys",true);loadScrollArtV2831()');
 const im=images.filter(im=>im.src?.includes('human-valleys-panorama')).at(-1),legacy=run('JSON.stringify(FLAT_WORLD.colliders)'),count=images.length;
 if(malformed){im.naturalWidth=1;im.naturalHeight=1;im.onload();}else im.onerror();
 a.equal(run('wildSceneReadyV286898()'),false);a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),legacy);
 for(let n=0;n<10;n++)run('loadScrollArtV2831()');a.equal(images.length,count,'failed scene does not hot-retry');
}
console.log(`PASS four faction panoramas: ${routes} clear routes, ${spawned} safe seeded spawns, original POIs/save/safety/access, NPC, masks/picking, cache, and failed/late loads`);
