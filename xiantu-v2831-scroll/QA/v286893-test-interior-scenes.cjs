'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),run=s=>f.run(s),json=s=>JSON.parse(run('JSON.stringify('+s+')'));
f.c.console.log=()=>{};
for(const name of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(name);
run("startGame();closeWorldOverlay();tutorialState.active=false;gameState='exploring';currentRegion='north';player.level=12;");
const images=[];f.c.Image=class{constructor(){images.push(this);this.naturalWidth=0;}set src(value){this.url=value;}};
const ids=json('Object.keys(INTERIOR_SCENES_V286893)'),timers=f.timers.size;
const manifest=JSON.parse(fs.readFileSync(root+'/interior-scenes-v286893/manifest.json','utf8'));
assert.equal(ids.length,17);assert.deepEqual(ids,manifest.scenes.map(s=>s.id));
assert.equal(new Set(manifest.scenes.map(s=>s.sha256)).size,17,'all backgrounds independently authored');
for(const item of manifest.scenes){const data=fs.readFileSync(root+'/interior-scenes-v286893/'+item.file);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),item.sha256);assert.equal(data.length,item.bytes);assert(data.length<300000,'mobile texture budget');}
assert.equal(run('INTERIOR_SCENE_CACHE_V286893.size'),0,'no background preload on startup');
function enter(id){
 const action=['shop','market','home','alchemy'].includes(id)?id:'lingxiao_building';
 run(`clearInteriorV286886();closeWorldOverlay();FLAT_WORLD.pois=[{id:'fixture',name:'室内',action:'${action}',buildingId:'${id}',x:300,y:300,r:40}];FLAT_WORLD.player.x=300;FLAT_WORLD.player.y=340;tryEnterInteriorV286886(FLAT_WORLD.pois[0]);`);
}
function finish(image){image.naturalWidth=1152;image.onload();}
const sceneImages=()=>images.filter(i=>i.url.includes('/interior-scenes-'));
enter('home');assert.equal(sceneImages().length,1);const first=sceneImages()[0],late=first.onload;
// Shared fallback textures remain independently useful while a room-specific request is slow.
for(const image of images.filter(i=>/interior-painted|sect-stewards/.test(i.url)))finish(image);
run('drawInteriorV286886();globalThis.fallback93=interiorV286886.floor');assert.equal(run('interiorV286886.floorSceneImage'),null);
finish(first);run('drawInteriorV286886()');assert.equal(run('fallback93.width'),1,'replace the old floor cache once');assert(run('interiorV286886.floorSceneImage===interiorSceneImageV286893(interiorV286886)'));
run('globalThis.painted93=interiorV286886.floor;drawInteriorV286886()');assert(run('painted93===interiorV286886.floor'));
enter('home');assert.equal(sceneImages().length,1,'re-entry reuses background');
// Eviction discards pending callbacks and keeps at most three decoded/requested room images.
enter('shop');const evicted=sceneImages().at(-1),evictedLoad=evicted.onload;enter('market');enter('alchemy');enter('dormitory');
assert.equal(evicted.onload,null);assert.equal(evicted.onerror,null);assert.equal(evicted.url,'');
evicted.naturalWidth=1152;evictedLoad();assert(!run("INTERIOR_SCENE_CACHE_V286893.has('shop')"),'stale completion cannot resurrect an evicted entry');
run('clearInteriorV286886()');late();assert.equal(run('interiorV286886'),null,'stale completion cannot resurrect an exited room');
// Exercise every actual POI mapping, station route, interaction title and exit, not just asset names.
run('globalThis.originalAccess93=canAccessBuilding;canAccessBuilding=()=>({allowed:true})');
for(const id of ids){
 enter(id);assert.equal(run('interiorV286886.sceneId'),id);
 const current=sceneImages().at(-1);if(current.onload)finish(current);
 assert(run('INTERIOR_SCENE_CACHE_V286893.size<=3'));
 const before=json('player');run('drawInteriorV286886()');
 assert.equal(run('interiorV286886.stations[1].name'),run(`INTERIOR_SCENES_V286893['${id}'].service`));
 assert(run('interiorRouteV286886(interiorV286886,400,208)'));
 run('for(let i=0;i<220;i++)updateInteriorV286886(.033)');
 assert(Math.hypot(run('interiorV286886.player.x')-400,run('interiorV286886.player.y')-208)<2);
 assert.deepEqual(json('player'),before,'art and walking do not change progression');
 run('globalThis.departing93=interiorV286886.floor;interiorRouteV286886(interiorV286886,288,400);for(let i=0;i<300&&interiorV286886;i++)updateInteriorV286886(.033)');
 assert.equal(run('interiorV286886'),null);assert.equal(run('departing93.width'),1);
}
// Failure is remembered without a per-frame retry loop; the working shared art is retained.
enter('home');const fail=sceneImages().at(-1);fail.onerror();const count=images.length;
run('drawInteriorV286886();drawInteriorV286886()');assert(run('interiorV286886.view.painted'));assert.equal(images.length,count);assert.equal(run('interiorV286886.floorSceneImage'),null);
assert.equal(f.timers.size,timers,'art adds no interval or animation loop');
// Denied entry must not reveal/request an inaccessible building's illustration.
run("clearInteriorV286886();canAccessBuilding=()=>({allowed:false,reason:'门槛未满足'});");
enter('forbidden_library');assert.equal(run('interiorV286886'),null);assert.equal(images.length,count);
assert.equal(run("interiorSceneIdV286893({action:'__proto__'})"),null);
// A failed download is retried once on a fresh visit, and a late success cannot affect another room.
run('canAccessBuilding=originalAccess93');enter('home');assert.equal(images.length,count+1);
const retry=sceneImages().at(-1);assert(retry.onload);finish(retry);run('drawInteriorV286886()');assert(run('interiorV286886.floorSceneImage!==null'));
// A missing generic shell must not block an otherwise complete dedicated scene.
run('INTERIOR_ART_V286892.room=null;INTERIOR_ART_V286892.ready=false;drawInteriorV286886()');assert(run('interiorV286886.view.painted'));
console.log('PASS 17 distinct scenes, mobile budget, lazy LRU, stale callbacks, floor replacement, every room route/exit, failure fallback and denied entry');
