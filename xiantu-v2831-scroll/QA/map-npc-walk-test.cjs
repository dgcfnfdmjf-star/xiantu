'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.Math=Object.create(Math);
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run("startGame();closeWorldOverlay();player.level=15;");f.timers.clear();
const enter=region=>{run(`closeWorldOverlay();applyWorldMapLayout('${region}',true);`);f.timers.clear();};
const sample=()=>json('({x:mapNpcWalkV1.poi.x,y:mapNpcWalkV1.poi.y,phase:mapNpcWalkV1.phase,pause:mapNpcWalkV1.pause,walking:mapNpcWalkV1.walking})');
const originalRandom=f.c.Math.random;let calls=0;
const rhythms=[];
for(const region of ['south','east','north','west']){
 enter(region);
 const s=run('mapNpcWalkV1'),home=[s.poi.x,s.poi.y],before=run('JSON.stringify(player)'),config=run('JSON.stringify(WORLD_MAP_CONFIGS)');
 // Independent movement must not consume gameplay RNG or allocate timers/save fields.
 f.c.Math.random=()=>{calls++;return .5;};const timerCount=f.timers.size;
 let distance=0,stops=0,wasWalking=false,first=-1;
 for(let i=0;i<18000;i++){
  const x=s.poi.x,y=s.poi.y;run('updateMapNpcWalkV1(1/60)');
  const d=Math.hypot(s.poi.x-x,s.poi.y-y);distance+=d;
  assert(d<=s.profile.speed/60+1e-8);assert(Math.hypot(s.poi.x-home[0],s.poi.y-home[1])<=s.profile.radius);
  assert(run('mapNpcWalkClearV1(mapNpcWalkV1,mapNpcWalkV1.poi.x,mapNpcWalkV1.poi.y)'));
  if(d&&first<0)first=i;
  if(wasWalking&&!s.walking){stops++;assert(s.pause>=2&&s.pause<=6);assert.equal(s.phase,0);}
  if(!wasWalking&&!s.walking)assert.equal(d,0);
  wasWalking=s.walking;
 }
 assert(distance>300,region);assert(stops>8,region);assert.equal(f.timers.size,timerCount);
 assert.equal(run('JSON.stringify(player)'),before);assert.equal(run('JSON.stringify(WORLD_MAP_CONFIGS)'),config);
 assert(!run('JSON.stringify(createSaveDataV2768())').includes('homeX'));
 rhythms.push(first);f.c.Math.random=originalRandom;
 enter(region);assert.deepEqual([run('mapNpcWalkV1.poi.x'),run('mapNpcWalkV1.poi.y')],home);
}
assert.equal(calls,0);assert.equal(new Set(rhythms).size,4);
// Pauses preserve both the next destination and exact step phase; resuming does not teleport.
enter('north');run('while(!mapNpcWalkV1.walking)updateMapNpcWalkV1(.1);updateMapNpcWalkV1(.1)');
for(const [on,off] of [
 ["gameState='combat'","gameState='exploring'"],
 ["gameState='combat-ending'","gameState='exploring'"],
 ['player.breakthrough.isAnimating=true','player.breakthrough.isAnimating=false'],
 ['COMBAT_FINISH_V2764.settling=true','COMBAT_FINISH_V2764.settling=false'],
 ['document.hidden=true','document.hidden=false'],
 ["showStory('test',[])",'closeWorldOverlay()'],
 ['autoNavigationV2830={poi:mapNpcWalkV1.poi}','autoNavigationV2830=null'],
 ['autoNavigationV2830={goal:mapNpcWalkV1.poi.id}','autoNavigationV2830=null']
]){run(on);const before=sample();run('for(let i=0;i<100;i++)updateMapNpcWalkV1(.1)');assert.deepEqual(sample(),before,on);run(off);}
const before=sample();run('updateMapNpcWalkV1(.1)');assert.notDeepEqual(sample(),before);
// Stale owner/load and a different region cannot inherit an earlier walk.
run('player=JSON.parse(JSON.stringify(player));updateMapNpcWalkV1(.01)');assert.equal(run('mapNpcWalkV1.poi.x'),696);assert.equal(run('mapNpcWalkV1.poi.y'),1276);
for(const region of ['human_peaks','human_valleys','demon_domain','immortal_domain']){enter(region);assert.equal(run('mapNpcWalkV1'),null);}
// Same colliders as the player; sweep rejects a tree/wall even if the target is clear.
enter('west');run('FLAT_WORLD.colliders=[];FLAT_WORLD.pois=[mapNpcWalkV1.poi]');
assert(run('mapNpcWalkClearV1(mapNpcWalkV1,mapNpcWalkV1.homeX+70,mapNpcWalkV1.homeY-30)'));
run("FLAT_WORLD.colliders=[{type:'tree',x:mapNpcWalkV1.homeX+35,y:mapNpcWalkV1.homeY-15,radius:3}]");
assert.equal(run('mapNpcWalkClearV1(mapNpcWalkV1,mapNpcWalkV1.homeX+70,mapNpcWalkV1.homeY-30)'),false);
run("FLAT_WORLD.colliders=[];FLAT_WORLD.pois.push({id:'travel_gate',x:mapNpcWalkV1.homeX+55,y:mapNpcWalkV1.homeY-35,r:30})");
assert.equal(run('mapNpcWalkClearV1(mapNpcWalkV1,mapNpcWalkV1.homeX+70,mapNpcWalkV1.homeY-30)'),false);
// Geometry loaded during a walk also stops it before entering a new obstacle.
enter('south');run('while(!mapNpcWalkV1.walking)updateMapNpcWalkV1(.1);FLAT_WORLD.colliders.push({x:mapNpcWalkV1.poi.x,y:mapNpcWalkV1.poi.y,radius:3})');
const blocked=sample();run('updateMapNpcWalkV1(.1)');assert.equal(sample().x,blocked.x);assert.equal(sample().y,blocked.y);assert.equal(sample().walking,false);
// UI reads the moved runtime POI, while the immutable source template remains at home.
enter('south');run('for(let i=0;i<80;i++)updateMapNpcWalkV1(.1)');
assert.equal(run('(()=>{const b=poiTapBoxV2904(mapNpcWalkV1.poi);return tappedPoiV2904((b.left+b.right)/2,(b.top+b.bottom)/2)?.id})()'),'mentor_npc');
enter('east');run('for(let i=0;i<80;i++)updateMapNpcWalkV1(.1)');
assert.equal(run('(()=>{const b=poiTapBoxV2904(mapNpcWalkV1.poi);return tappedPoiV2904((b.left+b.right)/2,(b.top+b.bottom)/2)?.id})()'),'beast_npc');
console.log('PASS NPC walk: independent rhythms, 20 simulated minutes, speed/radius/patch/collider/POI limits, pauses, owner/entry reset, faction exclusion, RNG/timer/save invariants and moving hitbox');
