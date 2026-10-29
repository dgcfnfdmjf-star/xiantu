'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.c.Math=Object.create(Math);
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
for(const file of files)f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`)),collected=[],notices=[],realCollect=f.c.onCollectMaterial;
const collectSpy=(name,count)=>collected.push({name,count});
f.c.onCollectMaterial=collectSpy;f.c.showFloatingText=(...args)=>notices.push(args);
function fresh(level=0){
 run(`resetRuntimeState();player=createDefaultPlayer();player.level=${level};gameState='exploring';currentRegion='south';player.worldMapId='south';player.materials={};document.hidden=false;closeWorldOverlay();document.getElementById('equipmentPanel')?.remove();
 swordFlightV2896=false;FLAT_WORLD.width=4000;FLAT_WORLD.height=1450;FLAT_WORLD.player={x:500,y:500,r:17,speed:250};FLAT_WORLD.keys={};FLAT_WORLD.target=null;FLAT_WORLD.pois=[];FLAT_WORLD.monsters=[];FLAT_WORLD.colliders=[];FLAT_WORLD.resourceTravelAccumulator=0;autoNavigationV2830=null;
 updateWorldMonsters=()=>{};revealExplorationV2828=()=>{};syncWarMapV2840=()=>{};`);
 f.timers.clear();collected.length=0;notices.length=0;
}
function rolls(values){let calls=0;f.c.Math.random=()=>{a(calls<values.length,'unexpected RNG draw');return values[calls++];};return()=>calls;}
a.equal(files.length,40);
a.equal(run('typeof gatheringCountV286882'),'function');
// Quantity tiers and strict boundaries are separate from the discovery probability.
for(const level of [0,1,2]){f.c.testCountRng=()=>{throw Error('early tiers must not draw quantity RNG');};a.equal(run(`gatheringCountV286882(${level},testCountRng)`),1);}
for(const level of [3,4,5,6])for(const [roll,expected] of [[0,2],[.149999,2],[.15,1],[.999999,1]]){f.c.testCountRng=()=>roll;a.equal(run(`gatheringCountV286882(${level},testCountRng)`),expected);}
for(const level of [7,8,16])for(const [values,expected] of [[[0],3],[[.049999],3],[[.05,.199999],2],[[.999,.199999],2],[[.05,.20],1],[[.999,.999],1]]){
 let calls=0;f.c.testCountRng=()=>{a(calls<values.length);return values[calls++];};a.equal(run(`gatheringCountV286882(${level},testCountRng)`),expected);a.equal(calls,values.length);
}
for(const [chance,expected] of [[.179999,1],[.18,0],[.999,0]]){
 fresh();const count=rolls(expected?[chance,0]:[chance]);run('checkResourceCollection(150)');a.equal(collected.length,expected);a.equal(count(),expected?2:1);
}
// Small real-sized increments preserve the distance gate; standing still cannot farm.
fresh();let calls=0;f.c.Math.random=()=>{calls++;return .99;};run('for(let i=0;i<150;i++)checkResourceCollection(10)');a.equal(calls,10);a.equal(run('FLAT_WORLD.resourceTravelAccumulator'),0);a.equal(collected.length,0);
fresh();calls=0;f.c.Math.random=()=>{calls++;return 0;};run('for(let i=0;i<150;i++)checkResourceCollection(10)');a.equal(collected.length,10);a.equal(run("player.materials['灵草']"),10);a.equal(calls,20);
fresh();calls=0;f.c.Math.random=()=>{calls++;return 0;};run('for(let i=0;i<1000;i++)checkResourceCollection(0);for(const n of [-1,NaN,Infinity,-Infinity])checkResourceCollection(n)');a.equal(calls,0);a.equal(collected.length,0);a.equal(run('FLAT_WORLD.resourceTravelAccumulator'),0);
for(const bad of ['NaN','Infinity','-Infinity','-7','"140"']){
 fresh();calls=0;f.c.Math.random=()=>{calls++;return 0;};run(`FLAT_WORLD.resourceTravelAccumulator=${bad};checkResourceCollection(10)`);a.equal(run('FLAT_WORLD.resourceTravelAccumulator'),10);a.equal(calls,0);a.equal(collected.length,0);
}
for(const bad of ['null','[]','"bad"']){fresh();calls=0;f.c.Math.random=()=>{calls++;return 0;};run(`player.materials=${bad};checkResourceCollection(150)`);a.equal(calls,0);a.equal(collected.length,0);}
// Task progress receives only quantities actually added, including a partial overflow clamp.
for(const [held,expected,gain] of [['"5"',8,3],['-5',3,3],['NaN',3,3],['Infinity',3,3],['Number.MAX_SAFE_INTEGER-1',Number.MAX_SAFE_INTEGER,1],['Number.MAX_SAFE_INTEGER',Number.MAX_SAFE_INTEGER,0]]){
 fresh(7);f.c.Math.random=()=>0;run(`player.materials['灵草']=${held};checkResourceCollection(150)`);a.equal(run("player.materials['灵草']"),expected);a.deepEqual(collected,gain?[{name:'灵草',count:gain}]:[]);a.equal(notices.length,gain?1:0);
}
// Use the real task handler as well: three actual herbs advance a five-herb task
// to 3/5, while a full inventory must not advance or complete it.
fresh(7);f.c.Math.random=()=>0;f.c.onCollectMaterial=realCollect;
a.equal(run("acceptTask('side_daily_01',true)"),true);
run("player.tasks.active.side_daily_01.progress['灵草']=0;checkResourceCollection(150)");
a.equal(run("player.tasks.active.side_daily_01.progress['灵草']"),3);a.equal(run('player.tasks.active.side_daily_01.currentStep'),0);a.equal(run('player.tasks.active.side_daily_01.completed'),false);
run("player.materials['灵草']=Number.MAX_SAFE_INTEGER;checkResourceCollection(150)");
a.equal(run("player.tasks.active.side_daily_01.progress['灵草']"),3);a.equal(run('player.tasks.active.side_daily_01.completed'),false);f.c.onCollectMaterial=collectSpy;
// Crossing to another region drops the old map's partial distance, without awarding it.
fresh(16);f.c.Math.random=()=>0;run("FLAT_WORLD.resourceTravelAccumulator=149;applyWorldMapLayout('north',true)");a.equal(run('currentRegion'),'north');a.equal(run('FLAT_WORLD.resourceTravelAccumulator'),0);a.equal(collected.length,0);run('checkResourceCollection(1)');a.equal(collected.length,0);a.equal(run('FLAT_WORLD.resourceTravelAccumulator'),1);

// Exercise the actual movement -> collision resolution -> collection call, not a synthetic distance hook.
fresh();f.c.Math.random=()=>0;const before=json('player'),set=f.c.localStorage.setItem;let writes=0;
f.c.localStorage.setItem=(key,value)=>{if(key==='xiantu_save')writes++;return set(key,value);};
run('FLAT_WORLD.keys={d:true};for(let i=0;i<300;i++)updateFlatWorld(.02)');
a.equal(run('FLAT_WORLD.player.x'),2000);a.equal(run('FLAT_WORLD.player.y'),500);a.equal(collected.length,10);a.equal(collected.reduce((n,e)=>n+e.count,0),10);a.equal(writes,0,'walking does not synchronously save per collection');
const after=json('player');a.deepEqual(after.materials,{'灵草':10});delete before.materials;delete after.materials;a.deepEqual(after,before,'movement collection changes no unrelated player state');
run('FLAT_WORLD.keys={};for(let i=0;i<200;i++)updateFlatWorld(.034)');a.equal(collected.length,10);run('autoSave()');a.equal(writes,1);a.equal(JSON.parse(f.storage.get('xiantu_save')).player.materials['灵草'],10);f.c.localStorage.setItem=set;
// A blocked actor is not credited for requested movement beyond the world boundary.
fresh();f.c.Math.random=()=>0;run('FLAT_WORLD.player.x=FLAT_WORLD.width-30;FLAT_WORLD.keys={d:true};for(let i=0;i<200;i++)updateFlatWorld(.034)');a.equal(run('FLAT_WORLD.resourceTravelAccumulator'),0);a.equal(collected.length,0);
console.log('PASS gathering quantity/probability boundaries, distance gate, idle/invalid input, inventory normalization/caps, exact task quantity, region reset, actual movement and existing autosave path');

// Seeded integration sampling: every shipped region pool at each quantity tier.
// 50,000 discoveries-attempts per row; quantities and pool selections use the actual collector.
fresh();const samples=run(`(()=>{
 const rows=[],n=50000,seedBase=286882;showFloatingText=()=>{};
 for(const level of [0,3,7])for(const [index,id] of Object.keys(WORLD_MAP_CONFIGS).entries()){
  const declaredPool=getRegionInfo(id).materials,pool=declaredPool.filter(name=>MATERIALS[name]);
  let seed=(seedBase+level*1009+index*7919)>>>0;const initialSeed=seed;
  Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  currentRegion=id;player.level=level;player.materials={};FLAT_WORLD.resourceTravelAccumulator=0;
  let found=0,total=0;const byMaterial={},byCount={};
  onCollectMaterial=(name,count)=>{found++;total+=count;byMaterial[name]=(byMaterial[name]||0)+1;byCount[count]=(byCount[count]||0)+1;};
  for(let i=0;i<n;i++)checkResourceCollection(150);
  rows.push({id,level,seed:initialSeed,n,declaredPool,pool,found,total,byMaterial,byCount,stored:{...player.materials}});
 }
 return rows;
})()`);
const groups={};
for(const row of samples){
 const quantityMean=row.level===0?1:row.level===3?1.15:1.29;
 a(row.pool.length>0,row.id+': nonempty legal pool');a.deepEqual(row.pool,row.declaredPool,row.id+': every declared material exists');a.equal(row.pool.length,new Set(row.pool).size,row.id+': no duplicated material weighting');
 a(Math.abs(row.found/row.n-.18)<.008,`${row.id}/${row.level}: discovery rate ${row.found/row.n}`);
 a(Math.abs(row.total/row.n-.18*quantityMean)<.012,`${row.id}/${row.level}: per-attempt material yield ${row.total/row.n}`);
 a(Math.abs(row.total/row.found-quantityMean)<.035,`${row.id}/${row.level}: conditional quantity mean`);
 a.equal(Object.values(row.stored).reduce((x,y)=>x+y,0),row.total);
 for(const name of Object.keys(row.stored))a(row.pool.includes(name),row.id+': only local legal materials');
 for(const name of row.pool){const mean=row.found/row.pool.length;a(Math.abs((row.byMaterial[name]||0)-mean)<7*Math.sqrt(mean),`${row.id}/${row.level}/${name}: approximately uniform pool`);}
 const expectedCounts=row.level===0?{1:1}:row.level===3?{1:.85,2:.15}:{1:.76,2:.19,3:.05};
 for(const [count,p] of Object.entries(expectedCounts))a(Math.abs((row.byCount[count]||0)/row.found-p)<.025,`${row.id}/${row.level}: count ${count} distribution`);
 const g=groups[row.level]||={rows:0,attempts:0,discoveries:0,materials:0};g.rows++;g.attempts+=row.n;g.discoveries+=row.found;g.materials+=row.total;
}
console.log('PASS seeded gathering across all region pools: '+JSON.stringify({seedBase:286882,attemptsPerRegionAndTier:50000,groups}));
