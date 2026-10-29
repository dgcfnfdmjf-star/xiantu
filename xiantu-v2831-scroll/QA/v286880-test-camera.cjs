'use strict';
// Guard the existing active 2D camera pipeline; a second smoothing wrapper would break these invariants.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run('JSON.stringify('+s+')'));
run("resetRuntimeState();player=createDefaultPlayer();player.level=10;gameState='exploring';applyWorldMapLayout('south',true);PERF_CONFIG.mobile=false;ALIVE_V2893.dprDowngraded=false;document.body.classList.add('flat-world-active')");
const canvas=f.c.document.getElementById('worldCanvas');
let matrix=[1,0,0,1,0,0],stack=[],terrain=null,actor=null,steps=0,saves=0;
const save=f.c.saveGame;f.c.saveGame=function(...args){saves++;return save.apply(this,args);};
const multiply=n=>{const [x,y,z,w,e,g]=matrix,[i,j,k,l,m,o]=n;matrix=[x*i+z*j,y*i+w*j,x*k+z*l,y*k+w*l,x*m+z*o+e,y*m+w*o+g];};
const ctx=new Proxy({canvas,globalAlpha:1,
 setTransform(...v){matrix=v;},transform(...v){multiply(v);},translate(x,y){multiply([1,0,0,1,x,y]);},scale(x,y){multiply([x,0,0,y,0,0]);},rotate(t){multiply([Math.cos(t),Math.sin(t),-Math.sin(t),Math.cos(t),0,0]);},
 save(){stack.push(matrix.slice());},restore(){matrix=stack.pop()||matrix;},
 drawImage(im,...args){if(im===run('PERF_CONFIG.staticWorldCanvas'))terrain={x:args[0],y:args[1]};},
 measureText:t=>({width:String(t).length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})
},{get:(o,k)=>k in o?o[k]:()=>{}});
canvas.getContext=()=>ctx;
const step=f.c.worldCameraStepV2893,drawPlayer=f.c.drawWorldPlayer;
f.c.worldCameraStepV2893=function(...args){steps++;return step.apply(this,args);};
f.c.drawWorldPlayer=function(...args){actor={x:-matrix[4]/canvas._dpr,y:-matrix[5]/canvas._dpr};return drawPlayer.apply(this,args);};
let t=1000,total=0;
function frame(dt=1/60){
 steps=0;terrain=actor=null;t+=dt*1000;const resources='JSON.stringify({gold:player.gold,exp:player.exp,hp:player.hp,mp:player.mp,inventory:player.inventory,materials:player.materials,equipment:player.equipment,equipmentInventory:player.equipmentInventory})',playerBefore=run(resources),positionBefore=run('JSON.stringify(FLAT_WORLD.player)');
 run(`drawFlatWorld(${t},${dt})`);const cam=json('FLAT_WORLD.camera'),draw=json('FLAT_WORLD._camDrawV2893');
 a.equal(steps,1,'one camera step per rendered frame');a.deepEqual(terrain,draw,'terrain uses the drawn camera');a.deepEqual(actor,draw,'actor uses the same drawn camera');
 for(const axis of ['x','y']){a(Math.abs(cam[axis]-draw[axis])*canvas._dpr<=.500001,'only half-device-pixel snapping difference');a(Math.abs(draw[axis]*canvas._dpr-Math.round(draw[axis]*canvas._dpr))<1e-8);}
 const rect={left:19,top:27,width:canvas.width/canvas._dpr,height:canvas.height/canvas._dpr};f.c.__cameraRect=rect;f.c.__cameraPixel={x:123,y:97};
 const tap=json("worldTapPointV2893(document.getElementById('worldCanvas'),__cameraRect,__cameraRect.left+__cameraPixel.x,__cameraRect.top+__cameraPixel.y)");
 a(Math.abs(tap.x-(draw.x+123))<1e-8&&Math.abs(tap.y-(draw.y+97))<1e-8,'tap conversion reads that rendered frame');
 a.equal(run(resources),playerBefore,'camera drawing cannot change gameplay resources');a.equal(run('JSON.stringify(FLAT_WORLD.player)'),positionBefore,'camera drawing cannot move the player');total++;
}
for(const [width,height,dpr] of [[390,844,1],[1366,768,1.5],[844,390,1]]){
 canvas.width=width*dpr;canvas.height=height*dpr;canvas._dpr=dpr;f.c.innerWidth=width;f.c.innerHeight=height;
 for(const region of ['south','north']){
  run(`applyWorldMapLayout('${region}',true);FLAT_WORLD.moving=false`);frame();
  const target=json(`({x:Math.max(0,Math.min(FLAT_WORLD.width-${width},FLAT_WORLD.player.x-${width}/2)),y:Math.max(0,Math.min(FLAT_WORLD.height-${height},warCameraYV2840(FLAT_WORLD.player,${height})))})`);
  a.deepEqual(json('FLAT_WORLD.camera'),target,'first frame after changing map snaps to its own viewport');
  for(let i=0;i<12;i++){run('FLAT_WORLD.player.x+=3.25;FLAT_WORLD.moving=true;FLAT_WORLD.moveDirX=1;FLAT_WORLD.moveDirY=0');frame(i%2?1/30:1/60);}
 }
}
a.equal(saves,0,'drawing and camera stepping do not write a save');
// The shipping game does not activate Three.js; do not invent a second camera to smooth.
run('init3DAvatar()');a.equal(run('AVATAR3D.ready'),false);a.equal(run('AVATAR3D.failed'),true);
// Real loop guards prevent camera/scene changes while a panel or hidden document pauses the world.
let draws=0,updates=0,avatarDraws=0;f.c.drawFlatWorld=()=>draws++;f.c.updateFlatWorld=()=>updates++;f.c.render3DAvatar=()=>avatarDraws++;
f.c.isWorldOverlayOpen=()=>true;run('flatWorldLoop(5000)');a.equal(draws,0);a.equal(updates,0);a.equal(avatarDraws,0);
f.c.isWorldOverlayOpen=()=>false;f.c.document.hidden=true;run('flatWorldLoop(5100)');a.equal(draws,0);a.equal(updates,0);
f.c.document.hidden=false;run('FLAT_WORLD.lastTime=5100;flatWorldLoop(5133)');a.equal(draws,1);a.equal(updates,1);a.equal(avatarDraws,0);
console.log(`PASS ${total} camera frames: single step, terrain/actor/tap coherence, DPR and region snap, save/player invariants and paused-loop guards`);
