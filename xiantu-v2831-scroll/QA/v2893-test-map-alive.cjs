'use strict';
/*
 * QA/v2893-test-map-alive.cjs - 山河灵动 V2893: adapted from the user reference into the current 40-script loader.
 * Camera (frame-rate independent, look-ahead, soft deadzone, snap), pixel snapping, desktop DPR fix, visual-only landmark
 * scale, and the presentation-only map life (weather, seasons, day phase, particles, buildings, footsteps, bob, eggs).
 * Guards: POI r, colliders, interaction, the save and V2888's wrappers stay exactly as they were.
 * Run:  XIANTU_TEST_ROOT=xiantu-v2831-scroll node xiantu-v2831-scroll/QA/v2893-test-map-alive.cjs
 */
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const html=fs.readFileSync(root+'/game-v2762.html','utf8'),files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
const ME='xiantu-v28684-duel.js',realRandom=Math.random;
function game(skip=[]){const f=fixture(root);f.c.console.log=()=>{};f.c.console.warn=(...x)=>f.errors.push(['warn',...x]);for(const file of files){if(skip.includes(file))f.run(fs.readFileSync(root+'/'+file,'utf8').replace(/\/\/ BEGIN MAP_ALIVE_V2893[\s\S]*?\/\/ END MAP_ALIVE_V2893/,''));else f.load(file);}return f;}
const J=(f,code)=>JSON.parse(f.run(`JSON.stringify(${code})`));
function fresh(f,setup=''){f.run(`resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.level=4;if(typeof aliveQualityV2893!=='undefined')aliveQualityV2893=null;localStorage.removeItem('xiantu_map_alive_v2893');${setup}`);f.run("applyWorldMapLayout('south',true)");}
function frames(f,n,{move=false,dx=4,dt=.033}={}){for(let i=0;i<n;i++)f.run(`FLAT_WORLD.moving=${move};FLAT_WORLD.moveDirX=${move?1:0};FLAT_WORLD.moveDirY=0;${move?`FLAT_WORLD.player.x+=${dx};`:''}drawFlatWorld(${(f.__t=(f.__t||0)+dt*1000)},${dt})`);}
function rec(id='worldCanvas'){const calls=[];const ctx=new Proxy({canvas:{id,width:390,height:844},globalAlpha:1},{get(o,k){if(k in o)return o[k];return (...args)=>{calls.push([k,...args]);if(k==='createRadialGradient'||k==='createLinearGradient')return {addColorStop(){}};if(k==='measureText')return {width:String(args[0]||'').length*10};};},set(o,k,v){o[k]=v;return true;}});return {ctx,calls};}

// ---------------------------------------------------------------- loading + hooks ----
a.equal(files.length,40,'existing loader order retained');a.equal(files.at(-1),ME);
const f=game(),visualRandom=f.c.aliveRandV2893;
a.equal(f.run(`window.__xiantuBuildFilesV2814["${ME}"]`),html.match(/var expectedBuild='([^']+)'/)[1],'build stamp');
a.equal(f.run('Object.isFrozen(MAP_ALIVE_V2893)&&Object.isFrozen(MAP_ALIVE_V2893.quality.levels.high)'),true,'config frozen');
const C=J(f,'MAP_ALIVE_V2893');
{const core=fs.readFileSync(root+'/xiantu-v2762-core.js','utf8');
 for(const h of ['worldCameraStepV2893(cam,p,targetCamX,targetCamY,dt,vw,vh)','ctx.drawImage(staticMap,camDraw.x,camDraw.y','ctx.translate(-camDraw.x,-camDraw.y)','landmarkPoiApplyV2893(ctx,o)','mapAliveGroundV2893(ctx,t)','mapAliveFrameV2893(t,dt)','playerJuiceV2893(ctx,p)','worldDprCapV2893()'])a(core.includes(h),'core hook: '+h);}
for(const n of ['drawFlatWorld','drawWorldPoi','drawWorldPlayer','drawWorldAmbient'])a.equal(f.run(`!!window.${n}._s25V2888`),true,n+': V2888 wrapper still outermost (no new wrapper)');

// ---------------------------------------------------------------- camera ----
fresh(f);
const step=(cam,tx,ty,dt)=>f.run(`(()=>{const c=${JSON.stringify(cam)};const r=worldCameraStepV2893(c,FLAT_WORLD.player,${tx},${ty},${dt},390,700);return JSON.stringify([c.x,c.y,r]);})()`);
const settle=()=>f.run('ALIVE_V2893.snap=false;ALIVE_V2893.la.x=ALIVE_V2893.la.y=0;FLAT_WORLD.moving=false');
{settle();let c30={x:300,y:300},c120={x:300,y:300};
 for(let i=0;i<30;i++){const [x,y]=JSON.parse(step(c30,400,340,1/30));c30={x,y};}
 settle();for(let i=0;i<120;i++){const [x,y]=JSON.parse(step(c120,400,340,1/120));c120={x,y};}
 a(Math.abs(c30.x-c120.x)<.6&&Math.abs(c30.y-c120.y)<.6,`frame-rate independent (${c30.x.toFixed(2)} vs ${c120.x.toFixed(2)})`);
 a(c30.x<400&&c30.x>370,'eases toward the target, not locked');}
{settle();const small=JSON.parse(step({x:300,y:300},310,300,1/60))[0]-300,large=JSON.parse(step({x:300,y:300},400,300,1/60))[0]-300;
 a(small/10<large/100*.6,'soft deadzone: small offsets follow more gently');}
{settle();a.equal(JSON.parse(step({x:0,y:0},300,300,1/60))[2],'snap','big jump snaps');
 settle();f.run("applyWorldMapLayout('south',true)");const r=JSON.parse(step({x:0,y:0},120,90,1/60));a.deepEqual(r,[120,90,'snap'],'region change snaps exactly');}
{settle();f.run('FLAT_WORLD.moving=true;FLAT_WORLD.moveDirX=1;FLAT_WORLD.moveDirY=0');let c={x:500,y:300};
 for(let i=0;i<120;i++){const [x,y]=JSON.parse(f.run(`(()=>{const c=${JSON.stringify(c)};worldCameraStepV2893(c,FLAT_WORLD.player,500,300,1/60,390,700);FLAT_WORLD.moving=true;return JSON.stringify([c.x,c.y]);})()`));c={x,y};}
 a(Math.abs(f.run('ALIVE_V2893.la.x')-C.camera.lookAhead)<3,'look-ahead builds up in the walking direction');a(c.x>500+C.camera.lookAhead*.6,'camera leads the player');
 settle();f.run('FLAT_WORLD.moving=true;FLAT_WORLD.moveDirX=1');for(let i=0;i<120;i++)f.run('worldCameraStepV2893({x:FLAT_WORLD.width-390,y:0},FLAT_WORLD.player,FLAT_WORLD.width-390,0,1/60,390,700);FLAT_WORLD.moving=true');
 const edge=JSON.parse(f.run('(()=>{const c={x:FLAT_WORLD.width-390,y:0};worldCameraStepV2893(c,FLAT_WORLD.player,FLAT_WORLD.width-390,0,1/60,390,700);return JSON.stringify(c);})()'));a(edge.x<=f.run('FLAT_WORLD.width')-390+1e-9,'clamped at the map edge');}
{settle();f.run('aliveMotionV2893.matches=true');f.run('FLAT_WORLD.moving=true;FLAT_WORLD.moveDirX=1');for(let i=0;i<60;i++)step({x:500,y:300},500,300,1/60);
 a.equal(f.run('ALIVE_V2893.la.x'),0,'no look-ahead with reduced motion');f.run('aliveMotionV2893.matches=false');}
// pixel snapping
a.equal(f.run('worldCameraSnapV2893(10.37,1)'),10);a.equal(f.run('worldCameraSnapV2893(10.37,1.5)'),16/1.5);
fresh(f);frames(f,10,{move:true,dx:3.3});{const d=f.run("document.getElementById('worldCanvas')._dpr||1"),cd=J(f,'FLAT_WORLD._camDrawV2893'),cam=J(f,'FLAT_WORLD.camera');
 a(Number.isInteger(Math.round(cd.x*d*1e6)/1e6)&&Math.abs(cd.x*d-Math.round(cd.x*d))<1e-9,'drawn at whole device pixels');a(Math.abs(cd.x-cam.x)<=.5/d+1e-9,'and within half a pixel of the real camera');}

// ---------------------------------------------------------------- DPR ----
{const low0=f.run('PERF_CONFIG.lowEnd');f.run('PERF_CONFIG.mobile=false;ALIVE_V2893.dprDowngraded=false');
 f.c.navigator.deviceMemory=8;a.equal(f.run('worldDprCapV2893()'),1.5,'8 GB desktop gets 1.5 (was 1)');
 f.c.navigator.deviceMemory=2;a.equal(f.run('worldDprCapV2893()'),1,'small memory stays at 1');
 delete f.c.navigator.deviceMemory;a.equal(f.run('worldDprCapV2893()'),1.5,'unknown memory: desktop default');
 f.run('PERF_CONFIG.mobile=true');a.equal(f.run('worldDprCapV2893()'),1,'phones stay at 1');f.run('PERF_CONFIG.mobile=false');
 a.equal(f.run('PERF_CONFIG.lowEnd'),low0,'PERF_CONFIG.lowEnd itself unchanged');
 // a slow desktop falls back to 1 after three low readings
 let resized=0;f.c.resizeWorldCanvas=()=>{resized++;};f.run("document.getElementById('worldCanvas')._dpr=1.5");
 for(let i=1;i<=3;i++)f.run(`PERF_CONFIG.measuredFps=30;PERF_CONFIG.fpsStartedAt=${i*1000};watchDprV2893()`);
 a.equal(f.run('ALIVE_V2893.dprDowngraded'),true);a.equal(resized,1);a.equal(f.run('worldDprCapV2893()'),1);
 f.run("ALIVE_V2893.dprDowngraded=false;ALIVE_V2893.dprStrikes=0;document.getElementById('worldCanvas')._dpr=1;PERF_CONFIG.mobile=true");}

// ---------------------------------------------------------------- landmark scale: visual only ----
fresh(f);
{const scales=(o,id)=>{const r=rec(id);f.c.__ctx=r.ctx;f.c.__o=o;f.run('drawWorldPoi(__ctx,__o)');return r.calls.filter(c=>c[0]==='scale').map(c=>c[1]);};
 a(scales({id:'sect',x:300,y:300,r:44,name:'宗门',action:'sect'},'worldCanvas').includes(C.landmarks.scale.sect),'sect drawn larger');
 {const small={id:'sect',x:300,y:300,r:30,name:'宗门',action:'sect'};scales(small,'worldCanvas');a.equal(small.r,30,'drawing never touches r');}
 a(!scales({id:'sect',x:300,y:300,r:44,name:'宗门',action:'sect'},'other').includes(C.landmarks.scale.sect),'only on the world canvas');
 a(!scales({id:'n1',x:300,y:300,r:20,name:'路人',action:'npc_x'},'worldCanvas').some(s=>Object.values(C.landmarks.scale).includes(s)),'NPCs unchanged');
 const p=J(f,"landmarkPointV2893({id:'sect',x:300,y:300},0,30)");a(Math.abs(p.y-(300+30*f.run('scene25dOnV2888()?s25DepthScaleV2888(300):1')))<1e-6,'the base line stays put');}

// ---------------------------------------------------------------- guard: r, colliders, interaction, save ----
function snapshot(g){return g.run("JSON.stringify({pois:FLAT_WORLD.pois.map(p=>[p.id,p.x,p.y,p.r]),col:FLAT_WORLD.colliders.map(c=>[c.type,c.id||'',c.x,c.y,c.radius])})");}
{const plain=game([ME]);fresh(plain);fresh(f);a.equal(snapshot(f),snapshot(plain),'layout identical with and without V2893');
 const before=snapshot(f);let saves=0;const sg=f.c.saveGame;f.c.saveGame=function(){saves++;return sg.apply(this,arguments);};
 for(const q of ['high','low','off']){f.run(`setMapAliveQualityV2893('${q}')`);frames(f,80,{move:true});frames(f,40);}
 for(let i=0;i<3;i++){frames(plain,80,{move:true});frames(plain,40);}
 {const r0=rec();f.c.__ctx=r0.ctx;f.run('for(const o of FLAT_WORLD.pois)drawWorldPoi(__ctx,o)');}   // draw every POI, landmarks included
 f.c.saveGame=sg;a.equal(snapshot(f),before,'POI r and colliders untouched after 360 frames');a.equal(saves,0,'no saves from the map layer');
 a.equal(f.run('JSON.stringify(player)'),plain.run('JSON.stringify(player)'),'the save object matches a run without V2893');
 // interaction picks the same POI with the module
 const pick=g=>{g.run('FLAT_WORLD.player.x=FLAT_WORLD.pois[0].x+10;FLAT_WORLD.player.y=FLAT_WORLD.pois[0].y+FLAT_WORLD.pois[0].r+40;FLAT_WORLD.keys={};FLAT_WORLD.target=null;updateFlatWorld(0.016)');return g.run('FLAT_WORLD.nearby?.id||""');};
 a.equal(pick(f),pick(plain),'interaction unchanged');}

// ---------------------------------------------------------------- quality + toggle ----
fresh(f,'PERF_CONFIG.mobile=false');a.equal(f.run('mapAliveQualityV2893()'),'high','desktop default high');
f.run('PERF_CONFIG.mobile=true');a.equal(f.run('mapAliveQualityV2893()'),'low','phone default low');
f.run("setMapAliveQualityV2893('high')");f.run('ensureMapAliveButtonV2893()');frames(f,1);
{const b=f.run("document.getElementById('mapAliveBtnV2893')");a(b&&b.parentNode?.id==='worldExploreActions','button in the explore bar');a.equal(b.textContent,'灵动 · 高');
 a.deepEqual([f.run('cycleMapAliveV2893()'),f.run('cycleMapAliveV2893()'),f.run('cycleMapAliveV2893()')],['low','off','high']);a.equal(b.textContent,'灵动 · 高');}
for(const q of ['high','low']){fresh(f,`setMapAliveQualityV2893('${q}')`);f.run("currentRegion='immortal_domain'");frames(f,40);
 const L=C.quality.levels[q];a.equal(f.run('ALIVE_V2893.fall.length'),L.fall,q+' fall count');a.equal(f.run('ALIVE_V2893.glow.length'),L.glow,q+' glow count');a.equal(f.run('ALIVE_V2893.birds.length'),L.birds,q+' birds');}
f.run("setMapAliveQualityV2893('off')");frames(f,3);a.equal(f.run('ALIVE_V2893.fall.length+ALIVE_V2893.glow.length+ALIVE_V2893.birds.length'),0,'off clears everything');
{let drawn=0;const fall=f.c.drawFallV2893,bl=f.c.drawBuildingLifeV2893;f.c.drawFallV2893=()=>{drawn++;};f.c.drawBuildingLifeV2893=()=>{drawn++;};frames(f,5,{move:true});f.c.drawFallV2893=fall;f.c.drawBuildingLifeV2893=bl;a.equal(drawn,0,'off draws nothing');}
{fresh(f,"setMapAliveQualityV2893('high')");f.run('aliveMotionV2893.matches=true');frames(f,30,{move:true});
 a.equal(f.run('ALIVE_V2893.fall.length+ALIVE_V2893.glow.length+ALIVE_V2893.birds.length+ALIVE_V2893.dust.length'),0,'reduced motion: nothing moves');
 const r=rec();f.c.__ctx=r.ctx;a.equal(f.run('playerJuiceV2893(__ctx,FLAT_WORLD.player)'),false,'no bob with reduced motion');f.run('aliveMotionV2893.matches=false');}

// ---------------------------------------------------------------- environment ----
{const days=4000,count={};for(let d=0;d<days;d++){const w=f.run(`mapWeatherV2893(${d},'south')`);count[w]=(count[w]||0)+1;}
 for(const [k,p] of Object.entries(C.weather.south))a(Math.abs(count[k]/days-p)<.04,`weather ${k} ≈ ${p}`);
 {const seq=()=>f.run("Array.from({length:30},(_,d)=>mapWeatherV2893(d,'east')).join()");a.equal(seq(),seq(),'deterministic per day');}
 a(!Object.keys(count).includes('snow'),'no snow in the south');}
a.deepEqual([3,6,12,18,23].map(h=>f.run(`mapDayPhaseV2893(${h})`)),['night','dawn','day','dusk','night']);
f.run('player.worldTime.night=true');a.equal(f.run('mapDayPhaseV2893()'),'night','manual night drives environment');a.equal(f.run('mapDayPhaseV2893(12)'),'day','explicit hour remains deterministic');f.run('player.worldTime.night=false');

a.equal(f.run("mapFallKindV2893('south','spring','clear')"),'petal');a.equal(f.run("mapFallKindV2893('south','autumn','clear')"),'leaf');
a.equal(f.run("mapFallKindV2893('south','spring','rain')"),null,'rain replaces petals');a.equal(f.run("mapFallKindV2893('north','summer','clear')"),'snow');
a.equal(f.run("mapFallKindV2893('demon_domain','spring','clear')"),'ember');a.equal(f.run("mapFallKindV2893('south','winter','clear')"),'snow');
a.deepEqual([1,4,7,10].map(m=>f.run(`MAP_ALIVE_V2893.seasons[${m}]`)),['spring','summer','autumn','winter']);

// ---------------------------------------------------------------- footsteps + bob ----
fresh(f,"setMapAliveQualityV2893('high')");
{f.run('ALIVE_V2893.lastP=null;ALIVE_V2893.strideDist=0');for(let i=0;i<5;i++)f.run(`FLAT_WORLD.moving=true;FLAT_WORLD.player.x+=12;stepJuiceV2893(0.016,'clear',MAP_ALIVE_V2893.quality.levels.high,'south')`);
 a(f.run('ALIVE_V2893.dust.length')>=1,'dust puffs while walking');a.equal(f.run('ALIVE_V2893.dust.at(-1).kind'),'dust');
 for(let i=0;i<5;i++)f.run(`FLAT_WORLD.moving=true;FLAT_WORLD.player.x+=12;stepJuiceV2893(0.016,'rain',MAP_ALIVE_V2893.quality.levels.high,'south')`);a(f.run('ALIVE_V2893.ripples.length')>=1,'ripples in the rain');
 for(let i=0;i<5;i++)f.run(`FLAT_WORLD.moving=true;FLAT_WORLD.player.x+=12;stepJuiceV2893(0.016,'clear',MAP_ALIVE_V2893.quality.levels.high,'north')`);a.equal(f.run('ALIVE_V2893.dust.at(-1).kind'),'snow','snow puffs in the north');
 for(let i=0;i<60;i++)f.run(`FLAT_WORLD.moving=true;FLAT_WORLD.player.x+=31;stepJuiceV2893(0.004,'clear',MAP_ALIVE_V2893.quality.levels.high,'south')`);a.equal(f.run('ALIVE_V2893.dust.length'),C.quality.levels.high.dust,'bounded pool');
 f.run('FLAT_WORLD.moving=true;ALIVE_V2893.moveAmt=1;ALIVE_V2893.stridePhase=Math.PI/4');const r=rec();f.c.__ctx=r.ctx;a.equal(f.run('playerJuiceV2893(__ctx,FLAT_WORLD.player)'),true);
 const sc=r.calls.find(c=>c[0]==='scale');a(sc&&sc[1]>1&&sc[2]<1,'squash while walking');
 const o=rec('other');f.c.__ctx=o.ctx;a.equal(f.run('playerJuiceV2893(__ctx,FLAT_WORLD.player)'),false,'only on the world canvas');
 f.run("setMapAliveQualityV2893('off')");const r2=rec();f.c.__ctx=r2.ctx;a.equal(f.run('playerJuiceV2893(__ctx,FLAT_WORLD.player)'),false,'off: no bob');}

// ---------------------------------------------------------------- buildings ----
fresh(f,"setMapAliveQualityV2893('high')");
{const sect={id:'sect',x:300,y:300,r:44,action:'sect'},draw=(phase,ground)=>{const r=rec();f.c.__ctx=r.ctx;f.c.__items=[sect];f.run(`drawBuildingLifeV2893(__ctx,__items,1.5,'${phase}',${ground})`);return r.calls;};
 a(draw('day',false).filter(c=>c[0]==='fill').length>=2,'banners flutter');
 a(draw('night',false).filter(c=>c[0]==='drawImage').length>draw('day',false).filter(c=>c[0]==='drawImage').length,'lanterns glow at night');
 f.c.__items=[{id:'travel_gate',x:100,y:100,r:40,action:'world_travel_menu'}];const g=rec();f.c.__ctx=g.ctx;f.run("drawBuildingLifeV2893(__ctx,__items,1,'day',true)");a(g.calls.some(c=>c[0]==='ellipse'),'gate formation on the ground');}

// ---------------------------------------------------------------- easter eggs (session only) ----
fresh(f,"setMapAliveQualityV2893('high')");
{frames(f,40);const save0=f.run('JSON.stringify(player)');const said=[];f.c.showFloatingText=t=>said.push(t);const view="{minX:FLAT_WORLD.camera.x,maxX:FLAT_WORLD.camera.x+390,minY:FLAT_WORLD.camera.y,maxY:FLAT_WORLD.camera.y+700}";
 f.run('aliveRandV2893=()=>0.9');f.run(`ALIVE_V2893.idle=${C.eggs.craneIdleSec+1};ALIVE_V2893.craneCd=0;updateEggsV2893(0.016,${view},390,700,'day','south',MAP_ALIVE_V2893.quality.levels.high)`);
 a(f.run('!!ALIVE_V2893.crane'),'a crane passes after standing still');
 f.run('ALIVE_V2893.crane.x=FLAT_WORLD.player.x');f.run(`updateEggsV2893(0.016,${view},390,700,'day','south',MAP_ALIVE_V2893.quality.levels.high)`);a(said.some(t=>t.includes('鹤鸣')),'crane line');
 f.run('ALIVE_V2893.crane=null;ALIVE_V2893.fox={x:FLAT_WORLD.player.x+40,y:FLAT_WORLD.player.y,fleeing:false,vx:0,age:0,alpha:1}');f.run(`updateEggsV2893(0.016,${view},390,700,'day','south',MAP_ALIVE_V2893.quality.levels.high)`);
 a.equal(f.run('ALIVE_V2893.fox.fleeing'),true,'fox flees when approached');a(said.some(t=>t.includes('灵狐')));
 f.run('aliveRandV2893=()=>0;ALIVE_V2893.meteor=null');f.run(`updateEggsV2893(0.016,${view},390,700,'day','south',MAP_ALIVE_V2893.quality.levels.high)`);a.equal(f.run('ALIVE_V2893.meteor'),null,'no meteor by day');
 f.run(`updateEggsV2893(0.016,${view},390,700,'night','south',MAP_ALIVE_V2893.quality.levels.high)`);a(f.run('!!ALIVE_V2893.meteor'),'meteor at night');
 f.run('ALIVE_V2893.meteor=null;ALIVE_V2893.crane=null;ALIVE_V2893.idle=99;ALIVE_V2893.craneCd=0');f.run(`updateEggsV2893(0.016,${view},390,700,'night','south',MAP_ALIVE_V2893.quality.levels.low)`);a.equal(f.run('ALIVE_V2893.crane'),null,'low quality: no eggs');
 Math.random=realRandom;f.c.showFloatingText=()=>{};a.equal(f.run('JSON.stringify(player)'),save0,'eggs change nothing in the save');
 frames(f,40);const before=f.run('JSON.stringify(player)');frames(f,30);a.equal(f.run('JSON.stringify(player)'),before,'eggs leave the save alone');}

f.c.aliveRandV2893=visualRandom;

// Visual RNG, bounded lifecycle, failed preferences and tap coordinates.
{const g=game();fresh(g);let calls=0;const original=g.c.Math.random;
 try{g.c.Math.random=()=>{calls++;return .5;};g.run("setMapAliveQualityV2893('high')");frames(g,80,{move:true});a.equal(calls,0,'visuals never consume gameplay randomness');}finally{g.c.Math.random=original;}
 g.run("ALIVE_V2893.rain=[{x:1}];ALIVE_V2893.ripples=[{age:0}];ALIVE_V2893.fox={age:0};setMapAliveQualityV2893('off')");
 a.equal(g.run('ALIVE_V2893.rain.length+ALIVE_V2893.ripples.length'),0);a.equal(g.run('ALIVE_V2893.fox'),null);
 const save=g.c.localStorage.setItem;g.c.localStorage.setItem=()=>{throw Error('denied')};g.run("setMapAliveQualityV2893('low')");a.equal(g.run('mapAliveQualityV2893()'),'low','memory preference survives storage denial');g.c.localStorage.setItem=save;
 g.run("ALIVE_V2893.dust=[{age:0}];ALIVE_V2893.idle=123;pauseVisualsV2767()");a.equal(g.run('ALIVE_V2893.dust.length+ALIVE_V2893.idle'),0);
 g.run('ALIVE_V2893.toldFox=true;resetRuntimeState()');a.equal(g.run('ALIVE_V2893.toldFox'),false);
 g.run('FLAT_WORLD._camDrawV2893={x:300,y:200}');
 a.deepEqual(J(g,'worldTapPointV2893({_dpr:1.5,width:1500,height:900},{left:10,top:20,width:1000,height:600},510,320)'),{x:800,y:500},'DPR tap uses the drawn logical camera');
 g.run("setMapAliveQualityV2893('high');ALIVE_V2893.fox={x:500,y:500,fleeing:true,vx:220,age:0,alpha:1}");
 for(let i=0;i<50;i++)g.run("updateEggsV2893(.02,{minX:0,maxX:1000,minY:0,maxY:1000},1000,1000,'day','south',MAP_ALIVE_V2893.quality.levels.high)");
 a.equal(g.run('ALIVE_V2893.fox'),null,'fleeing fox fades out instead of gaining alpha');
 a.deepEqual(g.errors,[]);
}

// ---------------------------------------------------------------- every region and level runs cleanly ----
for(const reg of ['south','east','west','north','human_peaks','human_valleys','demon_domain','immortal_domain'])for(const q of ['high','low']){
 fresh(f,`setMapAliveQualityV2893('${q}')`);f.run(`currentRegion='${reg}'`);frames(f,20,{move:true});frames(f,10);}
// works with V2888 switched off
f.run("localStorage.setItem('xiantu_scene25d_v2888','off')");frames(f,20,{move:true});f.run("localStorage.removeItem('xiantu_scene25d_v2888')");

Math.random=realRandom;
a.deepEqual(f.errors,[],'no errors or warnings');
console.log('v2893-test-map-alive: all checks passed');
