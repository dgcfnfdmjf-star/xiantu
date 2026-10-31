'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.console.log=()=>{};const Image=f.c.Image;f.c.Image=class extends Image{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`)),requests=()=>images.filter(i=>i.src?.includes('sect-panorama-v286896'));
run("player=createDefaultPlayer();player.level=10;gameState='exploring';applyWorldMapLayout('south',true);loadScrollArtV2831()");a.equal(requests().length,0);
run("applyWorldMapLayout('north',true);loadScrollArtV2831();ensureStaticWorldCache()");a.equal(requests().length,1);
const oldCache=run('PERF_CONFIG.staticWorldCanvas'),save=run('JSON.stringify(player)'),pois=run('JSON.stringify(FLAT_WORLD.pois)'),im=requests()[0];
im.naturalWidth=1374;im.naturalHeight=1145;im.onload();a.equal(oldCache.width,1);a.equal(run('sectSceneReadyV286896()'),true);
a.equal(run('JSON.stringify(player)'),save);a.equal(run('JSON.stringify(FLAT_WORLD.pois)'),pois,'existing IDs and coordinates retained');
for(let i=0;i<20;i++)run('loadScrollArtV2831()');a.equal(requests().length,1);
a.equal(run("FLAT_WORLD.colliders.some(c=>c.type!=='sect-scene'&&c.type!=='poi'&&sectScenePointV286896(c.x,c.y))"),false,'no invisible random tree/stone blockers under scene');
const rooms=json('Object.keys(SECT_SCENE_V286896.rooms)');a.equal(rooms.length,6);
// A route ends on the painted approach, and is physically clear all the way.
const routes=run(`(()=>{
 const result=[];for(const start of [null,...Object.keys(SECT_SCENE_V286896.rooms)]){
  const q=start?sectSceneDoorV286896(FLAT_WORLD.pois.find(p=>p.buildingId===start)):{x:1305,y:1120};FLAT_WORLD.player.x=q.x;FLAT_WORLD.player.y=q.y;
  for(const id of Object.keys(SECT_SCENE_V286896.rooms)){
   const poi=FLAT_WORLD.pois.find(p=>p.buildingId===id),door=sectSceneDoorV286896(poi),route=planNavigationV2830(poi);
   if(!route?.length)throw Error('unreachable '+start+' -> '+id);
   if(Math.hypot(route.at(-1).x-door.x,route.at(-1).y-door.y)>.001)throw Error('wrong door');
   if(Math.hypot(door.x-poi.x,door.y-poi.y)>poi.r+62)throw Error('door outside original interaction radius');
   let at=q;for(const next of route){if(FLAT_WORLD.colliders.some(c=>worldDistanceSegmentV2827(c.x,c.y,at,next)<c.radius+17-1e-5))throw Error('route crossed wall');at=next;}
   result.push(id);
  }
 }return result.length;})()`);a.equal(routes,42);
run("globalThis.scenePoi=FLAT_WORLD.pois.find(p=>p.buildingId==='main_hall');globalThis.sceneBox=sectSceneBoundsV286896(scenePoi)");
a.equal(run('tappedPoiV2904((sceneBox.left+sceneBox.right)/2,(sceneBox.top+sceneBox.bottom)/2).id'),'lx_main_hall');
const bounds=json('sceneBox');for(const mode of [false,true])for(const cam of [0,700,1400]){run(`scene25dEnabledV2888=${mode};FLAT_WORLD.camera.y=${cam}`);a.deepEqual(json('poiTapBoxV2904(scenePoi)'),bounds);}
// Roof masking draws only the authored roof region, never the old building sprite.
let paints=[];f.c.sceneCtx=new Proxy({canvas:{id:'worldCanvas'},globalAlpha:1,measureText:s=>({width:s.length*8}),drawImage:(...args)=>paints.push(args)},{get:(o,k)=>k in o?o[k]:()=>{}});
run('drawSectSceneRoofV286896(sceneCtx,scenePoi)');a.equal(paints.length,1);a.equal(paints[0][0],im);a.equal(paints[0].length,9);a(paints[0][3]<1374&&paints[0][4]<1145,'roof draw uses a bounded source rectangle');
run('drawFlatWorld(1000,0)'); // initialize existing renderer-owned state once before the repeat-render invariant
const state=run('JSON.stringify([player,FLAT_WORLD.pois,FLAT_WORLD.colliders,FLAT_WORLD.decor])');
run('ensureStaticWorldCache()');const cache=run('PERF_CONFIG.staticWorldCanvas');for(let i=0;i<60;i++)run('drawFlatWorld(1000,0)');a.equal(run('PERF_CONFIG.staticWorldCanvas'),cache);a.equal(run('JSON.stringify([player,FLAT_WORLD.pois,FLAT_WORLD.colliders,FLAT_WORLD.decor])'),state);
// Old saves inside newly painted walls recover to a clear approach; free ground never snaps.
const recovery=json(`(()=>{const c=FLAT_WORLD.colliders.find(c=>c.id==='scene_main_hall'),q=resolvePlayerMotionV2896(c.x,c.y,c.x+1,c.y,17);return {q,blocked:FLAT_WORLD.colliders.some(b=>Math.hypot(q.x-b.x,q.y-b.y)<b.radius+17),free:sectSceneSafePointV286896(1305,1120)}})()`);a.equal(recovery.blocked,false);a.equal(recovery.free,null);
run("applyWorldMapLayout('south',true)");a.equal(run('sectSceneReadyV286896()'),false);a.equal(run("FLAT_WORLD.colliders.some(c=>c.type==='sect-scene')"),false);
// Late completion in another region does not rewrite its scene or colliders.
run("currentRegion='north';SCROLL_ART_V2831.sectSceneRequested=false;SCROLL_ART_V2831.sectScene=null;loadSectSceneV286896();currentRegion='south';ensureStaticWorldCache()");const south=run('PERF_CONFIG.staticWorldCanvas'),southState=run('JSON.stringify(FLAT_WORLD.colliders)');const late=requests()[1];late.naturalWidth=1374;late.naturalHeight=1145;late.onload();a.equal(run('PERF_CONFIG.staticWorldCanvas'),south);a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),southState);
run("currentRegion='north';SCROLL_ART_V2831.sectScene=null;SCROLL_ART_V2831.sectSceneRequested=false;loadSectSceneV286896()");requests()[2].onerror();for(let i=0;i<20;i++)run('loadSectSceneV286896()');a.equal(requests().length,3);a.equal(run('sectSceneReadyV286896()'),false);
run('SCROLL_ART_V2831.sectSceneRequested=false;loadSectSceneV286896()');requests()[3].naturalWidth=1;requests()[3].naturalHeight=1;requests()[3].onload();a.equal(run('sectSceneReadyV286896()'),false);
console.log('PASS continuous sect scene: 42 door routes, actual wall collision/recovery, roof picking/occlusion, fixed transforms, cached ground, unchanged save/POIs, region isolation and loading fallback');
