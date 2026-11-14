'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.Image=class{
 constructor(){this.complete=false;this.naturalWidth=this.naturalHeight=0;images.push(this);}
 set src(v){this._src=v;}get src(){return this._src||'';}
 addEventListener(){}removeAttribute(){this._src='';}
 finish(){this.complete=true;this.naturalWidth=512;this.naturalHeight=480;this.onload?.();}
 fail(){this.onerror?.();}
};
for(const name of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(name);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run(`document.body.classList[Symbol.iterator]=function(){return document.body._classes[Symbol.iterator]()};
 resetRuntimeState();player=createDefaultPlayer();player.name='步态测试';player.level=5;player.hp=getMaxHp();player.tutorial.skipped=true;player.firstJourneyV28687={step:4};
 gameState='exploring';closeTutorialBubble();closeWorldOverlay();applyWorldMapLayout('west',true);
 FLAT_WORLD.monsters=[];FLAT_WORLD.colliders=[];FLAT_WORLD.pois=[];FLAT_WORLD._regionSpawnPending=0;FLAT_WORLD.monsterSpawnTimer=-1000;
 var oldMapConfigWalk=getWorldMapConfig;getWorldMapConfig=()=>({safeZones:[]});
 FLAT_WORLD.player.x=100;FLAT_WORLD.player.y=100;
 var makeWalkMonster=(name='野狼',x=800,y=600,id='walk')=>({id,x,y,radius:22,speed:24,enemy:{name,hp:600,maxHp:600,atk:30,def:5,gold:10,exp:10},regionId:'west',dir:{x:1,y:0},dirTimer:6,alive:true,inCombat:false,battleCooldown:0});
 var m=makeWalkMonster(),s=monsterWalkStateV1(m);FLAT_WORLD.monsters=[m];`);
// Distance, not elapsed time: two update subdivisions give the same phase and position.
const saved=json('player'),enemy=json('m.enemy');
function travel(dt,count){run(`m=makeWalkMonster();FLAT_WORLD.monsters=[m];s=monsterWalkStateV1(m);s.pause=0;`);for(let i=0;i<count;i++)run(`updateWorldMonsters(${dt})`);return json('({x:m.x,y:m.y,phase:s.phase,dir:s.dir,moving:s.moving})');}
const fine=travel(.01,100),coarse=travel(.1,10);
a(Math.abs(fine.x-coarse.x)<1e-8);a(Math.abs(fine.phase-coarse.phase)<1e-8);a.equal(fine.dir,2);a(fine.moving);
a(Math.abs(fine.phase-(fine.x-800)*.1)<1e-8);
run('var idlePhase=s.phase;s.pause=4;var idleX=m.x;updateWorldMonsters(.1)');
a.equal(run('s.moving'),false);a.equal(run('s.phase'),run('idlePhase'));a.equal(run('m.x'),run('idleX'));
a.deepEqual(json('player'),saved);a.deepEqual(json('m.enemy'),enemy);
a(!run("Object.keys(m).some(k=>/phase|walk|gait|pause/.test(k))"));
console.log('PASS actual displacement drives phase; idle stands; no saved/player/combat data mutations');

// Actual draw calls select three facing rows, mirrored directions, and a 1,2,3,2 gait.
const calls=[],transforms=[];f.c.walkCtx=new Proxy({drawImage:(...xs)=>calls.push(xs),scale:(...xs)=>transforms.push(['scale',...xs]),translate:(...xs)=>transforms.push(['translate',...xs]),rotate:(...xs)=>transforms.push(['rotate',...xs])},{get:(o,k)=>k in o?o[k]:()=>{}});
run("PERF_CONFIG.mobile=false;PERF_CONFIG.lowEnd=false;monsterWalkImageV1('wolf')");
const wolf=images.find(i=>i.src.endsWith('/wolf.webp'));a(wolf);wolf.finish();
for(let dir=0;dir<8;dir++)for(let step=0;step<4;step++){
 calls.length=0;run(`s.dir=${dir};s.moving=true;s.phase=${(step+.2)*Math.PI/2};drawMonsterWalkV1(walkCtx,m,s)`);
 a.equal(calls.length,1);a.equal(calls[0][0],wolf);a.equal(calls[0][1],[1,2,3,2][step]*128);
 a.equal(calls[0][2],(dir===2||dir===6?1:dir>=3&&dir<=5?2:0)*160);
}
calls.length=0;run('s.moving=false;drawMonsterWalkV1(walkCtx,m,s)');a.equal(calls[0][1],0);
calls.length=0;run('s.moving=true;m.battleCooldown=8;drawMonsterWalkV1(walkCtx,m,s)');a.equal(calls[0][1],0);
transforms.length=0;run('applyMonsterFallbackGaitV1(walkCtx,s,m)');a(!transforms.some(c=>c[0]==='rotate'));
transforms.length=0;run('m.battleCooldown=0;s.phase=1;applyMonsterFallbackGaitV1(walkCtx,s,m)');a(transforms.some(c=>c[0]==='rotate'&&c[1]!==0));a(transforms.some(c=>c[0]==='scale'&&Math.abs(c[1])!==1));
run('PERF_CONFIG.mobile=true;PERF_CONFIG.lowEnd=true');a.equal(run("monsterWalkImageV1('wolf')"),null);run('PERF_CONFIG.mobile=false;PERF_CONFIG.lowEnd=false');
const aliases={'冰霜巨狼':'wolf','幽冥鬼王':'ghost','血魔老祖':'cultivator','战神之魂':'celestial','鬼将':'demon','火凤幼崽':'bird'};
for(const [name,family]of Object.entries(aliases))a.equal(run(`monsterWalkStateV1(makeWalkMonster('${name}')).family`),family);
run("var elite=makeWalkMonster('精英·野狼');elite.enemy._isElite=true");a.equal(run('monsterWalkStateV1(elite).profile===MONSTER_GAITS_V1.wolf'),true);
const manifest=JSON.parse(fs.readFileSync(root+'/art/monsters/walk-v1/manifest.json','utf8'));
a.equal(Object.keys(manifest.families).length,20);
for(const [family,v]of Object.entries(manifest.families)){
 a.equal(v.frames.length,12);a.equal(fs.statSync(root+'/art/monsters/walk-v1/'+v.file).size,v.bytes);
 for(const frame of v.frames){const [x,y,w,h]=frame.packed;a(x>=3&&y>=3&&x+w<=125&&y+h===148);}
 run(`monsterWalkImageV1('${family}')`);a(run('MONSTER_WALK_IMAGES_V1.size')<=8);
}
run('releaseMonsterWalkImagesV1()');a.equal(run('MONSTER_WALK_IMAGES_V1.size'),0);
run("monsterWalkImageV1('wolf')");images.at(-1).fail();const count=images.length;for(let i=0;i<20;i++)run("monsterWalkImageV1('wolf')");a.equal(images.length,count,'failed atlas is not retried each frame');
console.log('PASS idle/four walking frames, eight headings, family aliases, elite gait, mobile fallback and bounded lazy atlas cache');

// Swept movement cannot cut through a thin collider between the two endpoints.
run(`m=makeWalkMonster();s=monsterWalkStateV1(m);s.from.x=800;s.from.y=600;m.x=900;FLAT_WORLD.colliders=[{x:850,y:600,radius:8,type:'tree'}]`);
a.equal(run('monsterWalkStepClearV1(m,s,30,2000,30,1500)'),false);
run('FLAT_WORLD.colliders=[];FLAT_WORLD.pois=[{x:900,y:600,r:30}]');a.equal(run('monsterWalkStepClearV1(m,s,30,2000,30,1500)'),false);
run('FLAT_WORLD.pois=[];getWorldMapConfig=()=>({safeZones:[{x:900,y:600,r:40}]})');a.equal(run('monsterWalkStepClearV1(m,s,30,2000,30,1500)'),false);
run('getWorldMapConfig=()=>({safeZones:[]});m.x=2100');a.equal(run('monsterWalkStepClearV1(m,s,30,2000,30,1500)'),false);
// Retain all tree colliders, including when the former random 3% bypass would trigger.
run(`m=makeWalkMonster();s=monsterWalkStateV1(m);s.pause=0;m.speed=100;FLAT_WORLD.monsters=[m];FLAT_WORLD.colliders=[{x:840,y:600,radius:14,type:'tree'}];var walkOldRandom=Math.random;Math.random=()=>0;`);
for(let i=0;i<60;i++){run('updateWorldMonsters(.1)');a(run('Math.hypot(m.x-840,m.y-600)>=36-1e-6'));}
run('Math.random=walkOldRandom');
// Multiple species wander for three minutes, respecting dwell durations, home range and obstacles.
run(`FLAT_WORLD.colliders=[{x:1100,y:700,radius:50,type:'tree'}];FLAT_WORLD.pois=[{x:650,y:700,r:50}];
 getWorldMapConfig=()=>({safeZones:[{x:1100,y:400,r:60}]});
 FLAT_WORLD.monsters=['野狼','幽冥鬼','山贼','千年树精','石傀儡','猛虎'].map((n,i)=>makeWalkMonster(n,800+i*60,600,'species'+i));
 var walkSamples=FLAT_WORLD.monsters.map(m=>({moved:0,stopped:0,lastPause:0,pauses:[]}));`);
for(let i=0;i<1800;i++)run(`updateWorldMonsters(.1);FLAT_WORLD.monsters.forEach((m,i)=>{const s=monsterWalkStateV1(m),t=walkSamples[i];t[s.moving?'moved':'stopped']++;if(s.pause>t.lastPause)t.pauses.push(s.pause);t.lastPause=s.pause;
 if(Math.hypot(m.x-s.homeX,m.y-s.homeY)>s.profile.range+.0001)throw Error('range');
 const b=getRegionInfo(m.regionId).bounds;if(m.x<b.xMin+30||m.x>b.xMax-30||m.y<b.yMin+30||m.y>b.yMax-30)throw Error('bounds');
 if(FLAT_WORLD.colliders.some(c=>Math.hypot(m.x-c.x,m.y-c.y)<c.radius+m.radius-.0001))throw Error('collider');
 if(FLAT_WORLD.pois.some(p=>Math.hypot(m.x-p.x,m.y-p.y)<p.r+78-.0001))throw Error('POI');
 if(getWorldMapConfig().safeZones.some(z=>Math.hypot(m.x-z.x,m.y-z.y)<z.r+m.radius-.0001))throw Error('safe zone');});`);
for(const sample of json('walkSamples')){a(sample.moved>50);a(sample.stopped>50);a(sample.pauses.every(p=>p>=2&&p<=6));}
const firstPauses=run("['野狼','幽冥鬼','山贼'].map((n,i)=>monsterWalkStateV1(makeWalkMonster(n,800,600,'seed'+i)).pause)");a.equal(new Set(firstPauses).size,3);
console.log('PASS trees (including former 3% bypass), swept walls, POIs, safe zones, regional bounds, range and 2–6 second independent pauses');

// Use the existing contact path: 60 remains exclusive; cooldown clock and release duration stay intact.
let starts=0;f.c.walkStart=()=>{starts++;};run(`startCombat=walkStart;FLAT_WORLD.colliders=[];FLAT_WORLD.pois=[];getWorldMapConfig=()=>({safeZones:[]});
 m=makeWalkMonster();FLAT_WORLD.monsters=[m];s=monsterWalkStateV1(m);s.pause=6;FLAT_WORLD.player.x=860;FLAT_WORLD.player.y=600;updateWorldMonsters(0)`);
a.equal(starts,0);run('FLAT_WORLD.player.x=859;updateWorldMonsters(0)');a.equal(starts,1);a(run('m.inCombat'));
run('currentMonsterRef=m;releaseCurrentMapMonster(false)');a.equal(run('m.battleCooldown'),8);
const pos=json('[m.x,m.y]');for(let i=0;i<70;i++)run('updateWorldMonsters(.1)');a.equal(starts,1);a.deepEqual(json('[m.x,m.y]'),pos);a(Math.abs(run('m.battleCooldown')-1)<1e-8);
run('m.battleCooldown=0;updateWorldMonsters(0)');a.equal(starts,2);
run(`m.inCombat=false;s.pause=0;s.moving=true;player.firstJourneyV28687={step:2};updateWorldMonsters(.1)`);a.equal(run('s.moving'),false);a.equal(starts,2);
run('player.firstJourneyV28687={step:4};var oldOwner=player;player=normalizePlayer(JSON.parse(JSON.stringify(player)));var loadedWalk=monsterWalkStateV1(m)');a(run('loadedWalk!==s'));a.equal(run('loadedWalk.phase'),0);a.equal(run('loadedWalk.homeX'),run('m.x'));
a.deepEqual(f.errors,[]);
console.log('PASS 59px contact / 60px no contact, eight-second battle release, no approach during cooldown, tutorial guard and old-save runtime reset');
