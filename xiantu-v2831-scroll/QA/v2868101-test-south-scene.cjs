'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.console.log=()=>{};const Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),j=s=>JSON.parse(run(`JSON.stringify(${s})`));
function activate(region){run(`applyWorldMapLayout('${region}',true);loadScrollArtV2831()`);const data=j('wildSceneV286898()');const im=images.filter(im=>im.src==='./'+data.file).at(-1);if(im.onload){im.naturalWidth=data.width||1484;im.naturalHeight=data.height||1060;im.onload();}a(run('wildSceneReadyV286898()'));return im;}
run('player=createDefaultPlayer();player.level=10;gameState="exploring";applyWorldMapLayout("south",true);loadScrollArtV2831()');
const pois=run('JSON.stringify(FLAT_WORLD.pois)'),save=run('JSON.stringify(player)');
activate('south');a.equal(run('JSON.stringify(FLAT_WORLD.pois)'),pois);a.equal(run('JSON.stringify(player)'),save);
a.equal(run('FLAT_WORLD.colliders.some(c=>c.type==="tree"||c.type==="stone")'),false);
a.equal(run('Object.keys(wildSceneV286898().rooms).length'),7);
run("explorationV2828().seen['0,0']=1;explorationV2828().claimed.explore_v2828_0='taken'");const beforeState=run('JSON.stringify(player.explorationV2828)');run('ensureStaticWorldCache();ensureStaticWorldCache();drawWorldMinimap(390,844)');a.equal(run('JSON.stringify(player.explorationV2828)'),beforeState,'painting does not reveal fog or grant rewards');
// Existing exploration IDs and all entrances remain reachable from spawn and each authored door.
let routes=0;
for(const start of [null,...j('Object.keys(wildSceneV286898().rooms)')]){
 run(`globalThis.start101=${start?`wildSceneDoorV286898(FLAT_WORLD.pois.find(p=>p.id==='${start}'))`:'getWorldMapConfig().spawn'};FLAT_WORLD.player.x=start101.x;FLAT_WORLD.player.y=start101.y`);
 for(const id of j('FLAT_WORLD.pois.map(p=>p.id)')){
  run(`globalThis.goal101=FLAT_WORLD.pois.find(p=>p.id==='${id}');globalThis.route101=planNavigationV2830(goal101)`);
  a(run('route101?.length>0'),start+' -> '+id);
  a(run(`(()=>{let p=start101;for(const q of route101){if(FLAT_WORLD.colliders.some(c=>worldDistanceSegmentV2827(c.x,c.y,p,q)<c.radius+17-1e-5))return false;p=q;}return true})()`),'route crosses solid body '+id);
  if(run('!!wildSceneRoomV286898(goal101)')){a(run('!!wildSceneDoorV286898(goal101)'),'door in original interaction radius '+id);a(run('Math.hypot(route101.at(-1).x-wildSceneDoorV286898(goal101).x,route101.at(-1).y-wildSceneDoorV286898(goal101).y)<.1'));
   const box=j('poiTapBoxV2904(goal101)');run('FLAT_WORLD.camera.y+=350');a.deepEqual(j('poiTapBoxV2904(goal101)'),box);
  }routes++;
 }
}
// Late load only mutates the active scene, and decoded scene cache is bounded to two.
activate('east');activate('south');activate('west');a.equal(run('Object.keys(SCROLL_ART_V2831.wildScenes).length'),2);a(run('!!SCROLL_ART_V2831.wildScenes.west'));a(run('!!SCROLL_ART_V2831.wildScenes.south'));a.equal(run('SCROLL_ART_V2831.wildScenes.east'),undefined);
run('applyWorldMapLayout("east",true);loadScrollArtV2831();applyWorldMapLayout("south",true)');const im=images.filter(im=>im.src?.includes('east-panorama')).at(-1),geometry=run('JSON.stringify(FLAT_WORLD.colliders)'),pos=run('JSON.stringify(FLAT_WORLD.player)');im.naturalWidth=1484;im.naturalHeight=1060;im.onload();a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),geometry);a.equal(run('JSON.stringify(FLAT_WORLD.player)'),pos);a(run('!!SCROLL_ART_V2831.wildScenes.south'));a(run('Object.keys(SCROLL_ART_V2831.wildScenes).length<=2'));
// Failed/malformed paint preserves legacy geometry and never repeatedly requests per frame.
for(const malformed of [false,true]){run('delete SCROLL_ART_V2831.wildScenes.south;delete SCROLL_ART_V2831.wildSceneRequested.south;applyWorldMapLayout("south",true);loadScrollArtV2831()');const data=j('wildSceneV286898()'),im=images.filter(im=>im.src==='./'+data.file).at(-1),before=run('JSON.stringify(FLAT_WORLD.colliders)'),count=images.length;if(malformed){im.naturalWidth=1;im.naturalHeight=1;im.onload()}else im.onerror();a.equal(run('wildSceneReadyV286898()'),false);a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),before);for(let i=0;i<20;i++)run('loadScrollArtV2831()');a.equal(images.length,count);}
// Load into an old position inside a new building, with an active monster at the same location.
run('delete SCROLL_ART_V2831.wildSceneRequested.south;loadScrollArtV2831();globalThis.rock101=wildSceneV286898().rocks[0];globalThis.oldPos101=wildSceneWorldV286898(rock101[0],rock101[1]);FLAT_WORLD.player.x=oldPos101.x;FLAT_WORLD.player.y=oldPos101.y;FLAT_WORLD.keys={joystick:{x:1,y:0}};FLAT_WORLD.monsters=[{...oldPos101,r:22,alive:true,inCombat:false},{...oldPos101,r:22,alive:true,inCombat:true}]');
const data=j('wildSceneV286898()'),imSouth=images.filter(im=>im.src==='./'+data.file).at(-1);imSouth.naturalWidth=data.width||1484;imSouth.naturalHeight=data.height||1060;imSouth.onload();
a(run('!FLAT_WORLD.keys.joystick'));a(run('!FLAT_WORLD.colliders.some(c=>Math.hypot(FLAT_WORLD.player.x-c.x,FLAT_WORLD.player.y-c.y)<c.radius+17)'));a(run('!FLAT_WORLD.colliders.some(c=>Math.hypot(FLAT_WORLD.monsters[0].x-c.x,FLAT_WORLD.monsters[0].y-c.y)<c.radius+22)'));a.equal(run('FLAT_WORLD.monsters[1].x'),run('oldPos101.x'));
console.log(`PASS south scene: ${routes} clear routes, stable IDs/rewards/fog, camera-independent hit boxes, old position recovery, bounded cache and failure/late-load isolation`);
