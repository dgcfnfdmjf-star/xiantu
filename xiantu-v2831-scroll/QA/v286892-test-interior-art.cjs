'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),run=s=>f.run(s),json=s=>JSON.parse(run('JSON.stringify('+s+')'));
f.c.console.log=()=>{};for(const name of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(name);
run("startGame();closeWorldOverlay();tutorialState.active=false;gameState='exploring';currentRegion='south';");
function enter(kind='home'){
 run(`clearInteriorV286886();FLAT_WORLD.pois=[{id:'fixture',name:'测试室内',action:'${kind}',x:300,y:300,r:40}];FLAT_WORLD.player.x=300;FLAT_WORLD.player.y=340;tryEnterInteriorV286886(FLAT_WORLD.pois[0]);`);
}
let images=[];f.c.Image=class{constructor(){images.push(this);this.naturalWidth=0;}set src(v){this.url=v;}};
const saved=json('player'),timers=f.timers.size;enter();a.equal(images.filter(i=>/interior-painted|sect-stewards/.test(i.url)).length,3,'bounded textures only on entering');a.equal(f.timers.size,timers,'art adds no timer');
a(!run('INTERIOR_ART_V286892.ready'));run('drawInteriorV286886()');a.equal(run('interiorV286886.view.painted'),false,'loading textures use the old working room');
run('globalThis.oldFloor=interiorV286886.floor');images[0].naturalWidth=1448;images[0].onload();a(!run('INTERIOR_ART_V286892.ready'));
// Completion after leaving only populates the shared cache, never resurrects a room.
run('clearInteriorV286886()');images[1].naturalWidth=1254;images[1].onload();a.equal(run('interiorV286886'),null);images[2].onerror();
enter();a.equal(images.filter(i=>/interior-painted|sect-stewards/.test(i.url)).length,3);run('drawInteriorV286886()');a(run('interiorV286886.view.painted'));a.equal(run('oldFloor.width'),1);
const canvas=f.ids.get('worldCanvas');
// Round-trip actual world cell centres through the perspective mapping.
for(let y=80;y<=400;y+=32)for(let x=48;x<=528;x+=32){f.c.px=x;f.c.py=y;const point=json('unprojectInteriorV286892(...Object.values(projectInteriorV286892(px,py)).slice(0,2))');a(Math.abs(point.x-x)<1e-9);a(Math.abs(point.y-y)<1e-9);}
a.equal(run('unprojectInteriorV286892(288,80)'),null,'wall does not masquerade as ground');a.equal(run('unprojectInteriorV286892(NaN,200)'),null);
for(const [vw,vh,dpr]of [[390,844,2],[844,390,2],[1366,768,1]]){
 canvas.width=vw*dpr;canvas.height=vh*dpr;canvas._dpr=dpr;canvas.getBoundingClientRect=()=>({left:17,top:31,width:vw*.8,height:vh*.8});
 run('drawInteriorV286886()');const view=json('interiorV286886.view'),screen=json('projectInteriorV286892(400,176)');
 run(`interiorTapV286886(document.getElementById('worldCanvas'),${17+(view.x+screen.x*view.scale)*.8},${31+(view.y+screen.y*view.scale)*.8})`);
 a.deepEqual(json('interiorV286886.path.at(-1)'),{x:400,y:208},'screen picking arrives before the service');
 run('interiorV286886.player={x:288,y:352};drawInteriorV286886()');const v=json('interiorV286886.view');
 run(`interiorTapV286886(document.getElementById('worldCanvas'),${17+(v.x+288*v.scale)*.8},${31+(v.y+425*v.scale)*.8})`);
 a.deepEqual(json('interiorV286886.path.at(-1)'),{x:288,y:400},'visible exit text walks to doorway');
}
run('globalThis.floor92=paintedInteriorFloorV286892(interiorV286886)');const old=run('floor92');a.equal(old.width,1152);run('drawInteriorV286886();drawInteriorV286886()');a(run('floor92===paintedInteriorFloorV286892(interiorV286886)'));
// Art does not mutate player progression or outdoor coordinates.
a.deepEqual(json('player'),saved);a.deepEqual(json('({x:FLAT_WORLD.player.x,y:FLAT_WORLD.player.y})'),{x:300,y:340});
run('clearInteriorV286886()');a.equal(old.width,1);
const manifest=JSON.parse(fs.readFileSync(root+'/interior-painted-v286892/manifest.json','utf8'));
a.deepEqual(json('INTERIOR_FRAMES_V286892'),manifest.props.frames);for(const [x,y,w,h]of Object.values(manifest.props.frames)){a(x>=0&&y>=0&&x+w<=manifest.props.width&&y+h<=manifest.props.height);}
for(const file of ['room.webp','props.webp']){const b=fs.readFileSync(root+'/interior-painted-v286892/'+file);a.equal(b.toString('ascii',0,4),'RIFF');a.equal(b.toString('ascii',8,12),'WEBP');}
console.log('PASS lazy bounded art, failed/pending fallback, stale completion, projection/picking/DPR/exit, cache release and unchanged player state');
