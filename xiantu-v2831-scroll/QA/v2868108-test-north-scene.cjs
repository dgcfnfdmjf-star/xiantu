'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.console.log=()=>{};const Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),j=s=>JSON.parse(run(`JSON.stringify(${s})`));
const legacy=()=>images.filter(im=>/north-terrain|architecture-courtyards|sect-panorama/.test(im.src));
function activate(region){run(`applyWorldMapLayout('${region}',true);loadScrollArtV2831()`);const data=j('wildSceneV286898()'),im=images.filter(im=>im.src==='./'+data.file).at(-1);if(im.onload){im.naturalWidth=data.width||1484;im.naturalHeight=data.height||1060;im.onload();}a(run('wildSceneReadyV286898()'));return im;}
run('player=createDefaultPlayer();player.level=40;gameState="exploring";applyWorldMapLayout("north",true);loadScrollArtV2831()');
const frozen=j('FLAT_WORLD.pois.map(({id,x,y,r})=>({id,x,y,r}))');
const expected=JSON.parse(fs.readFileSync(path.resolve(root,'../art/north-region-v2868108/layout.json'))).pois.map(({id,x,y,r})=>({id,x,y,r}));a.deepEqual(frozen,expected,'original 41 POI ids, positions and interaction radii');
const save=run('JSON.stringify(player)');activate('north');a.equal(run('JSON.stringify(player)'),save);a.deepEqual(j('FLAT_WORLD.pois.map(({id,x,y,r})=>({id,x,y,r}))'),frozen);
a.equal(legacy().length,0,'successful scene never requests the three obsolete layers');a.equal(run('sectSceneReadyV286896()'),false);a.equal(run('FLAT_WORLD.pois.some(joinedArchitectureReadyV286896)'),false);
a.equal(run('Object.keys(wildSceneV286898().rooms).length'),35);a.equal(run('FLAT_WORLD.colliders.some(c=>["tree","stone","sect-scene"].includes(c.type))'),false);
run("explorationV2828().seen['0,0']=1;explorationV2828().claimed.explore_v2828_0='taken'");const state=run('JSON.stringify(player.explorationV2828)');run('ensureStaticWorldCache();drawWorldMinimap(390,844)');a.equal(run('JSON.stringify(player.explorationV2828)'),state);
a(run('scrollRegionStyleV2834().includes("north-panorama-v2868108.webp")'));
let routes=0;
// Every door and every exploration point is reachable from spawn and from each authored entrance.
for(const start of [null,...j('Object.keys(wildSceneV286898().rooms)')]){
 run(`globalThis.start108=${start?`wildSceneDoorV286898(FLAT_WORLD.pois.find(p=>p.id==='${start}'))`:'getWorldMapConfig().spawn'};FLAT_WORLD.player.x=start108.x;FLAT_WORLD.player.y=start108.y`);
 a(run('!FLAT_WORLD.colliders.some(c=>Math.hypot(start108.x-c.x,start108.y-c.y)<c.radius+17)'),start+' blocked');
 for(const id of j('FLAT_WORLD.pois.map(p=>p.id)')){
  run(`globalThis.goal108=FLAT_WORLD.pois.find(p=>p.id==='${id}');globalThis.route108=planNavigationV2830(goal108)`);
  a(run('route108?.length>0'),start+' -> '+id);
  a(run(`(()=>{let p=start108;for(const q of route108){if(FLAT_WORLD.colliders.some(c=>worldDistanceSegmentV2827(c.x,c.y,p,q)<c.radius+17-1e-5))return false;p=q;}return true})()`),'route crosses solid body '+start+' -> '+id);
  if(run('!!wildSceneRoomV286898(goal108)')){
   a(run('!!wildSceneDoorV286898(goal108)'),'door outside original interaction radius '+id);
   a(run('Math.hypot(route108.at(-1).x-wildSceneDoorV286898(goal108).x,route108.at(-1).y-wildSceneDoorV286898(goal108).y)<.1'));
   a(run('scrollPoiArtV2832(goal108).includes("scroll-pin-v2868108")'));
   const box=j('poiTapBoxV2904(goal108)');run('FLAT_WORLD.camera.y+=350');a.deepEqual(j('poiTapBoxV2904(goal108)'),box);
  }routes++;
 }
}
for(const p of j('FLAT_WORLD.pois.filter(p=>p.id==="elder_npc"||p.id.startsWith("explore_"))'))a(run(`!FLAT_WORLD.colliders.some(c=>c.type==="wild-scene"&&Math.hypot(${p.x}-c.x,${p.y}-c.y)<c.radius+17)`),p.id+' on blocked ground');
// North joins the bounded regional cache; late callbacks must not alter the active region.
activate('south');activate('east');activate('west');a(run('Object.keys(SCROLL_ART_V2831.wildScenes).length<=2'));run('applyWorldMapLayout("north",true);loadScrollArtV2831();applyWorldMapLayout("south",true)');const im=images.filter(im=>im.src?.includes('north-panorama')).at(-1),geometry=run('JSON.stringify(FLAT_WORLD.colliders)'),pos=run('JSON.stringify(FLAT_WORLD.player)');im.naturalWidth=1448;im.naturalHeight=1086;im.onload();a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),geometry);a.equal(run('JSON.stringify(FLAT_WORLD.player)'),pos);
// Network/decode failure allows the proven original map, without per-frame request loops.
for(const malformed of [false,true]){
 run('delete SCROLL_ART_V2831.wildScenes.north;delete SCROLL_ART_V2831.wildSceneRequested.north;applyWorldMapLayout("north",true);loadScrollArtV2831()');const im=images.filter(im=>im.src?.includes('north-panorama')).at(-1);if(malformed){im.naturalWidth=1;im.naturalHeight=1;im.onload()}else im.onerror();
 a.equal(run('wildSceneReadyV286898()'),false);a.equal(run('SCROLL_ART_V2831.wildSceneFailed.north'),true);a(!run('scrollRegionStyleV2834().includes("north-panorama")'));a.equal(legacy().length,3);
 const count=images.length;for(let i=0;i<20;i++)run('loadScrollArtV2831()');a.equal(images.length,count);
}
// Existing position embedded in a new wall safely relocates, no save reward/quest rewrite.
run('delete SCROLL_ART_V2831.wildSceneRequested.north;loadScrollArtV2831();globalThis.b108=wildSceneV286898().bodies[0];globalThis.old108=wildSceneWorldV286898((b108[0]+b108[2])/2,(b108[1]+b108[3])/2);FLAT_WORLD.player.x=old108.x;FLAT_WORLD.player.y=old108.y;FLAT_WORLD.keys={joystick:{x:1,y:0}};FLAT_WORLD.monsters=[{...old108,r:22,alive:true,inCombat:false},{...old108,r:22,alive:true,inCombat:true}]');
const last=images.filter(im=>im.src?.includes('north-panorama')).at(-1);last.naturalWidth=1448;last.naturalHeight=1086;last.onload();a.equal(run('SCROLL_ART_V2831.wildSceneFailed.north'),undefined);a(run('!FLAT_WORLD.keys.joystick'));a(run('!FLAT_WORLD.colliders.some(c=>Math.hypot(FLAT_WORLD.player.x-c.x,FLAT_WORLD.player.y-c.y)<c.radius+17)'));a(run('!FLAT_WORLD.colliders.some(c=>Math.hypot(FLAT_WORLD.monsters[0].x-c.x,FLAT_WORLD.monsters[0].y-c.y)<c.radius+22)'));a.equal(run('FLAT_WORLD.monsters[1].x'),run('old108.x'));
console.log(`PASS north panorama: ${routes} collision-safe routes; 41 stable POIs, 35 entrances, discovery/save invariants, overview/fallback and cache isolation`);
