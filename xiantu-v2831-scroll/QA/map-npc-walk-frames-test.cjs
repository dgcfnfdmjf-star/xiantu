'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.Image=class{
 constructor(){this.complete=false;this.naturalWidth=this.naturalHeight=0;images.push(this);}
 set src(value){this._src=value;}get src(){return this._src||'';}
 addEventListener(){}removeAttribute(){this._src='';}
 finish(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=960;this.onload?.();}
};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run("startGame();closeWorldOverlay();player.level=5;applyWorldMapLayout('west',true);");f.timers.clear();
const enter=r=>{run(`closeWorldOverlay();applyWorldMapLayout('${r}',true);`);f.timers.clear();};
// Subdividing the same actual displacement must not change the gait or simulation.
function travel(dt,n){
 enter('west');run('FLAT_WORLD.colliders=[];FLAT_WORLD.pois=[mapNpcWalkV1.poi];mapNpcWalkV1.walking=true;mapNpcWalkV1.target.x+=60;mapNpcWalkV1.target.y-=20;');
 for(let i=0;i<n;i++)run(`updateMapNpcWalkV1(${dt})`);
 return json('({x:mapNpcWalkV1.poi.x,y:mapNpcWalkV1.poi.y,phase:mapNpcWalkV1.phase,dir:mapNpcWalkV1.dir})');
}
const t1=travel(.02,50),t2=travel(.01,100);
for(const key of ['x','y','phase'])a(Math.abs(t1[key]-t2[key])<1e-8,key);
a.equal(t1.dir,t2.dir);a(Math.abs(t1.phase-13*.14)<1e-8);
const calls=[],transforms=[],createdTiles=[],create=f.c.document.createElement;
f.c.document.createElement=t=>{const el=create(t);if(t==='canvas')createdTiles.push(el);return el;};
f.c.npcFrameCtx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),drawImage:(...args)=>calls.push(args),translate:(...args)=>transforms.push(['translate',...args]),rotate:(...args)=>transforms.push(['rotate',...args]),scale:(...args)=>transforms.push(['scale',...args])},{get:(o,k)=>k in o?o[k]:()=>{}});
const draw=()=>{calls.length=transforms.length=0;run('drawMapNpcV2863(npcFrameCtx,mapNpcWalkV1.poi)');};
for(const [region,key]of [['south','mentor'],['east','beast'],['north','elder'],['west','trader']]){
 enter(region);run(`mapNpcWalkFramesV2('${key}')`);const im=images.find(i=>i.src.endsWith(`/walk-v1/${key}.webp`));a(im);im.finish();const frames=run(`MAP_NPC_WALK_IMAGES_V2.get('${key}').frames`);a.equal(frames.length,12);a.equal(im.src,'','release decoded source after packing');
 const before=run('JSON.stringify(player)'),save=run('JSON.stringify(createSaveDataV2768())'),timers=f.timers.size,tiles=createdTiles.length;
 for(let dir=0;dir<8;dir++)for(let step=0;step<4;step++){
  run(`mapNpcWalkV1.dir=${dir};mapNpcWalkV1.walking=mapNpcWalkV1.stepping=true;mapNpcWalkV1.phase=${(step+.2)*Math.PI/2}`);draw();
  a.equal(calls.length,1);const row=dir===2||dir===6?1:dir>=3&&dir<=5?2:0;
  a.equal(calls[0][0],frames[row*4+[1,2,3,2][step]]);a.equal(calls[0].length,5,'draw cached tile without atlas crop');
  a.equal(transforms.some(t=>t[0]==='scale'&&t[1]===-1),dir>=5);
 }
 run('mapNpcWalkV1.walking=false');draw();a.equal(calls[0][0],frames[0],'idle uses standing column');
 run('mapNpcWalkV1.walking=true;mapNpcWalkV1.stepping=false');draw();a.equal(calls[0][0],frames[0],'target selection without displacement is not a step');
 run('mapNpcWalkV1.stepping=true;PERF_CONFIG.mobile=true;PERF_CONFIG.lowEnd=true');draw();a.equal(calls[0][0],frames[2],'low-end uses the same single draw, with real legs');
 a.equal(run('MAP_NPC_WALK_IMAGES_V2.size'),1,'low-end retains only the current NPC atlas');
 run('PERF_CONFIG.mobile=false;PERF_CONFIG.lowEnd=false');
 a.equal(run('JSON.stringify(player)'),before);a.equal(f.timers.size,timers);a.equal(createdTiles.length,tiles,'no canvas allocation during drawing');
 // No animation fields enter even the existing mapNpc save object.
 a.deepEqual(json('player.mapNpc'),JSON.parse(save).player.mapNpc);
}
// Every busy condition immediately selects standing while preserving the intended route/phase.
for(const [on,off]of [
 ["gameState='combat'","gameState='exploring'"],
 ["gameState='combat-ending'","gameState='exploring'"],
 ['COMBAT_FINISH_V2764.settling=true','COMBAT_FINISH_V2764.settling=false'],
 ['player.breakthrough.isAnimating=true','player.breakthrough.isAnimating=false'],
 ['document.hidden=true','document.hidden=false'],
 ["showStory('冻结帧验证',[])",'closeWorldOverlay()'],
 ['autoNavigationV2830={poi:mapNpcWalkV1.poi}','autoNavigationV2830=null'],
 ['autoNavigationV2830={goal:mapNpcWalkV1.poi.id}','autoNavigationV2830=null']
]){
 run('mapNpcWalkV1.walking=mapNpcWalkV1.stepping=true;mapNpcWalkV1.phase=2');const phase=run('mapNpcWalkV1.phase');
 run(on);draw();a.equal(calls[0][0],run("MAP_NPC_WALK_IMAGES_V2.get('trader').frames[0]"),on);a.equal(run('mapNpcWalkV1.phase'),phase);run(off);
}
// The overlay transition repaints only once; the frozen background is then left alone.
run("document.body.classList.add('flat-world-active');showStory('test',[]);mapNpcWalkV1.renderMoving=true;var npcOldDraw=drawFlatWorld,npcFreezeDraws=0;drawFlatWorld=()=>npcFreezeDraws++;");
run('flatWorldLoop(100);flatWorldLoop(300);flatWorldLoop(500)');a.equal(run('npcFreezeDraws'),1);
run('drawFlatWorld=npcOldDraw;closeWorldOverlay()');
// Loading and failures do not allocate/retry per frame; fallbacks keep distance-based motion.
run('releaseMapNpcWalkImagesV2();mapNpcWalkV1.walking=mapNpcWalkV1.stepping=true;mapNpcWalkV1.phase=1');
draw();const pending=images.at(-1),count=images.length;for(let i=0;i<20;i++)draw();a.equal(images.length,count);
a(transforms.some(t=>t[0]==='rotate'&&t[1]!==0));pending.onerror();for(let i=0;i<20;i++)draw();a.equal(images.length,count);
for(const key of ['mentor','beast','elder','trader','rival','traveller','unknown'])run(`mapNpcWalkFramesV2('${key}')`);
a.equal(run('MAP_NPC_WALK_IMAGES_V2.size'),4);run('releaseMapNpcWalkImagesV2()');a.equal(run('MAP_NPC_WALK_IMAGES_V2.size'),0);a(createdTiles.every(t=>t.width===0&&t.height===0),'release all cached backing stores');
for(const region of ['human_peaks','human_valleys','demon_domain','immortal_domain']){enter(region);a.equal(run('mapNpcWalkV1'),null);}
// Mechanical packing has twelve non-overlapping cells per NPC, with the common foot anchor.
const manifest=JSON.parse(fs.readFileSync(root+'/art/npc/walk-v1/manifest.json','utf8'));
a.equal(Object.keys(manifest.npcs).length,4);
for(const npc of Object.values(manifest.npcs)){
 a.equal(npc.frames.length,12);a.equal(fs.statSync(root+'/art/npc/walk-v1/'+npc.file).size,npc.bytes);
 for(const {packed:[x,y,w,h]}of npc.frames){a(x>=6&&y>=6&&x+w<=250);a.equal(y+h,296);}
}
a.deepEqual(manifest.npcs.elder.bodyLimit,[58,86]);
console.log('PASS NPC distance gait, 4 frames x 8 headings x 4 NPCs, immediate idle/busy poses, one freeze repaint, unchanged saves/timers, lazy/failure cache, low-end legs and atlas anchors');
