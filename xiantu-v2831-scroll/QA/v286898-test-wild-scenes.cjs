'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.console.log=()=>{};const Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),j=s=>JSON.parse(run(`JSON.stringify(${s})`)),requests=r=>images.filter(im=>im.src?.includes(r+'-panorama-v286898'));
run('player=createDefaultPlayer();player.level=10;gameState="exploring";applyWorldMapLayout("south",true);loadScrollArtV2831()');a.equal(requests('east').length+requests('west').length,0,'lazy outside target regions');
for(const region of ['east','west']){
 run(`applyWorldMapLayout('${region}',true);loadScrollArtV2831()`);a.equal(requests(region).length,1);
 const image=requests(region)[0],pois=run('JSON.stringify(FLAT_WORLD.pois)'),save=run('JSON.stringify(player)');image.naturalWidth=1484;image.naturalHeight=1060;image.onload();a.equal(run('wildSceneReadyV286898()'),true);
 a.equal(run('JSON.stringify(FLAT_WORLD.pois)'),pois,'POI IDs/coordinates preserved');a.equal(run('JSON.stringify(player)'),save,'no save/rewards/exploration changes on image load');
 a.equal(run('FLAT_WORLD.colliders.some(c=>c.type==="tree"||c.type==="stone")'),false,'no invisible procedural scenery blockers');
 a.equal(run('FLAT_WORLD.colliders.filter(c=>c.type==="wild-scene").length'),run('wildSceneV286898().rocks.length'));
 const ids=j('Object.keys(wildSceneV286898().rooms)');
 for(const id of ids){
  run(`globalThis.poi=FLAT_WORLD.pois.find(p=>p.id==='${id}');globalThis.door=wildSceneDoorV286898(poi)`);a(run('!!door'),id+' entrance inside existing interaction radius');
  const box=j('poiTapBoxV2904(poi)');a(box.right>box.left&&box.bottom>box.top);for(const cam of [0,900]){run(`FLAT_WORLD.camera.y=${cam}`);a.deepEqual(j('poiTapBoxV2904(poi)'),box,'picking independent of camera depth');}
 }
 const paths=run(`(()=>{let count=0;for(const start of [null,...Object.keys(wildSceneV286898().rooms)]){
  const at=start?wildSceneDoorV286898(FLAT_WORLD.pois.find(p=>p.id===start)):getWorldMapConfig().spawn;FLAT_WORLD.player.x=at.x;FLAT_WORLD.player.y=at.y;
  for(const poi of FLAT_WORLD.pois){const route=planNavigationV2830(poi);if(!route?.length)throw Error('unreachable '+currentRegion+' '+start+' -> '+poi.id);let q=at;
   for(const next of route){if(FLAT_WORLD.colliders.some(c=>worldDistanceSegmentV2827(c.x,c.y,q,next)<c.radius+17-1e-5))throw Error('crossed collider '+poi.id);q=next;}
   const d=wildSceneDoorV286898(poi);if(d&&Math.hypot(route.at(-1).x-d.x,route.at(-1).y-d.y)>.1)throw Error('wrong entrance');count++;
  }
 }return count})()`);a(paths>=25);
 run('globalThis.c=FLAT_WORLD.colliders.find(c=>c.type==="wild-scene");globalThis.safe=wildSceneSafePointV286898(c.x,c.y)');a(run('!!safe'));a.equal(run('FLAT_WORLD.colliders.some(c=>Math.hypot(safe.x-c.x,safe.y-c.y)<c.radius+17)'),false,'legacy overlap recovers to clear nearby ground');
 for(let n=0;n<20;n++)run('loadScrollArtV2831()');a.equal(requests(region).length,1,'bounded image requests');
 const state=run('JSON.stringify(player)'),cache=run('ensureStaticWorldCache()');for(let i=0;i<20;i++)a.equal(run('ensureStaticWorldCache()'),cache);a.equal(run('JSON.stringify(player)'),state,'render cache does not reveal fog or change rewards');
}
// Late load for a previous region cannot rebuild or move the active region.
run('delete SCROLL_ART_V2831.wildScenes.east;delete SCROLL_ART_V2831.wildSceneRequested.east;applyWorldMapLayout("east",true);loadScrollArtV2831();applyWorldMapLayout("south",true);ensureStaticWorldCache()');
const old=run('PERF_CONFIG.staticWorldCanvas'),colliders=run('JSON.stringify(FLAT_WORLD.colliders)'),actor=run('JSON.stringify(FLAT_WORLD.player)'),late=requests('east').at(-1);late.naturalWidth=1484;late.naturalHeight=1060;late.onload();a.equal(run('PERF_CONFIG.staticWorldCanvas'),old);a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),colliders);a.equal(run('JSON.stringify(FLAT_WORLD.player)'),actor);
// Failed or malformed images retain the complete legacy render/collision path and do not hot-retry.
for(const malformed of [false,true]){run('delete SCROLL_ART_V2831.wildScenes.west;delete SCROLL_ART_V2831.wildSceneRequested.west;applyWorldMapLayout("west",true);loadScrollArtV2831()');const im=requests('west').at(-1),before=run('JSON.stringify(FLAT_WORLD.colliders)'),n=requests('west').length;if(malformed){im.naturalWidth=1;im.naturalHeight=1;im.onload()}else im.onerror();a.equal(run('wildSceneReadyV286898()'),false);a.equal(run('JSON.stringify(FLAT_WORLD.colliders)'),before);run('loadScrollArtV2831()');a.equal(requests('west').length,n);}
console.log('PASS wild region lazy art, coordinate/permission invariants, all POI routes, collision recovery, static cache, camera-independent picking, malformed/error fallback and late-load isolation');
