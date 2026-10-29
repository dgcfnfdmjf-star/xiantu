'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.Math=Object.create(Math);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
let randomCalls=0;
function sequence(values,repeat=.5){randomCalls=0;f.c.Math.random=()=>values[randomCalls++]??repeat;}
function fresh(region='east'){
 run(`player=createDefaultPlayer();player.level=10;gameState='exploring';FLAT_WORLD.maxMonsters=6;applyWorldMapLayout('${region}',true);FLAT_WORLD.monsters=[];FLAT_WORLD.pois=[];FLAT_WORLD.colliders=[];FLAT_WORLD.player.x=1000;FLAT_WORLD.player.y=600;`);
 f.timers.clear();
}
const right=.5+300/720,left=.5-300/720;
for(const type of ['tree','stone','poi']){
 fresh();run(`FLAT_WORLD.colliders=[{type:'${type}',x:1300,y:600,radius:24}]`);sequence([right,.5,left,.5]);
 const before=json('({player,position:FLAT_WORLD.player})'),m=run('spawnSingleMonster()');
 a(m,type+': the next legal candidate is still used');a(Math.abs(m.x-700)<1e-8);a.equal(m.y,600);a.equal(m.radius,22);a.equal(m.battleCooldown,1.5);a.equal(m.regionId,'east');a.equal(m.enemy._regionId,'east');
 a.equal(run('FLAT_WORLD.monsters.length'),1);a.equal(run('FLAT_WORLD.monsters[0]'),m);a.deepEqual(json('({player,position:FLAT_WORLD.player})'),before);
}
// A clear first candidate is accepted unchanged; touching the boundary is not an overlap.
fresh();run("FLAT_WORLD.colliders=[{type:'tree',x:1346,y:600,radius:24}]");sequence([right,.5]);const clear=run('spawnSingleMonster()');a(clear);a(Math.abs(clear.x-1300)<1e-8);a.equal(clear.y,600);
// Exactly the original 45 candidates are tried. No relocation, global fallback or extra RNG roll.
fresh();run("FLAT_WORLD.colliders=[{type:'tree',x:1300,y:600,radius:24}]");randomCalls=0;f.c.Math.random=()=>++randomCalls%2?right:.5;
const blocked=json('({player,position:FLAT_WORLD.player})');a.equal(run('spawnSingleMonster()'),null);a.equal(randomCalls,90);a.equal(run('FLAT_WORLD.monsters.length'),0);a.deepEqual(json('({player,position:FLAT_WORLD.player})'),blocked);
// Existing regional/global caps do not reroll or emit a second monster.
for(const setup of ["FLAT_WORLD.monsters=Array.from({length:4},()=>({alive:true,regionId:'east'}))","FLAT_WORLD.maxMonsters=3;FLAT_WORLD.monsters=Array.from({length:3},()=>({alive:true,regionId:'north'}))"]){
 fresh();run(setup);sequence([]);const before=run('FLAT_WORLD.monsters.length');a.equal(run('spawnSingleMonster()'),null);a.equal(randomCalls,0);a.equal(run('FLAT_WORLD.monsters.length'),before);
}
// South keeps its original single 45% admission roll, including the boundary value.
fresh('south');run('FLAT_WORLD.player.x=90;FLAT_WORLD.player.y=90');sequence([.450001]);a.equal(run('spawnSingleMonster()'),null);a.equal(randomCalls,1);
sequence([.45,right,.5]);const southern=run('spawnSingleMonster()');a(southern);a.equal(southern.regionId,'south');a(Math.hypot(southern.x-90,southern.y-90)>220);
// Existing services, POIs and both actor separation rules still reject every invalid candidate.
for(const kind of ['service','poi','monster','player']){
 fresh();const savedZones=run('getWorldMapConfig().safeZones');
 if(kind==='service')run('getWorldMapConfig().safeZones=[{x:1300,y:600,r:90}]');
 if(kind==='poi')run("FLAT_WORLD.pois=[{x:1300,y:600,r:40,action:'shop'}]");
 if(kind==='monster')run("FLAT_WORLD.monsters=[{x:1300,y:600,alive:true,regionId:'east'}]");
 randomCalls=0;f.c.Math.random=()=>++randomCalls%2?(kind==='player'?.5:right):.5;
 const before=run('FLAT_WORLD.monsters.length');a.equal(run('spawnSingleMonster()'),null,kind);a.equal(run('FLAT_WORLD.monsters.length'),before,kind);a.equal(randomCalls,90,kind);
 f.c.savedSpawnZones=savedZones;run('getWorldMapConfig().safeZones=savedSpawnZones');
}
// Live regional geometry across independent seeds: all emitted actors clear every collider.
function rng(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
let emitted=0;
for(const region of run('Object.keys(WORLD_MAP_CONFIGS)')){
 fresh(region);run(`applyWorldMapLayout('${region}',true)`);const world=run('FLAT_WORLD'),cfg=run('getWorldMapConfig()');
 for(const point of [cfg.spawn,{x:90,y:90},{x:cfg.width-90,y:cfg.height-90}])for(let seed=1;seed<=100;seed++){
  world.player.x=point.x;world.player.y=point.y;world.monsters=[];f.c.Math.random=rng(seed);const m=run('spawnSingleMonster()');if(!m)continue;emitted++;
  a.equal(m.regionId,region);a(m.x>=55&&m.x<=world.width-55&&m.y>=55&&m.y<=world.height-55);a(Math.hypot(m.x-point.x,m.y-point.y)>220);
  a(!world.colliders.some(c=>Math.hypot(m.x-c.x,m.y-c.y)<c.radius+m.radius),region+': no initial overlap');
  a(!cfg.safeZones.some(z=>Math.hypot(m.x-z.x,m.y-z.y)<z.r));a(!world.pois.some(p=>Math.hypot(m.x-p.x,m.y-p.y)<p.r+(p.action==='lingxiao_building'?34:105)));
 }
}
a(emitted>1000);console.log(`PASS tree/stone/building spawn rejection, unchanged candidate/return/caps/45% gate/45-attempt budget/player position/cooldown and ${emitted} collision-free actors across 2400 seeded attempts`);
