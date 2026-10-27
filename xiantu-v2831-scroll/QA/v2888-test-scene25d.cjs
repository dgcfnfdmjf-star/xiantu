'use strict';
/*
 * QA/v2888-test-scene25d.cjs - 2.5D map scenes (xiantu-v2888-scene25d.js) against the installed game code.
 * Checks loading, the off switch, wrapper safety (world canvas only), depth/shadow rules, caches, the 山河图
 * layers and toggle, location-card markup safety, reduced motion, and that every region draws without errors.
 * Visual quality is checked by eye in the browser (see the install notes); this test guards behaviour.
 * Run:  XIANTU_TEST_ROOT=xiantu-v2831-scroll node xiantu-v2831-scroll/QA/v2888-test-scene25d.cjs
 */
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const html=fs.readFileSync(root+'/game-v2762.html','utf8'),files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root);f.c.console.log=()=>{};f.c.console.warn=(...x)=>f.errors.push(['warn',...x]);
for(const file of files)f.load(file);

// ---------------------------------------------------------------- loading ----
a.equal(files.length,40);a.equal(files.at(-1),'xiantu-v28684-duel.js','embedded visual modules load after their dependencies');
a.equal(f.run('window.__xiantuBuildFilesV2814["xiantu-v28684-duel.js"]'),html.match(/var expectedBuild='([^']+)'/)[1],'build stamp matches the loader');
for(const n of ['drawFlatWorld','drawWorldPoi','drawDepthTreeV2770','drawWorldMonster','drawWorldPlayer','ensureStaticWorldCache','drawWorldAmbient','showScrollMapV2831','renderScrollTargetsV2837','zoomScrollV2837','buildAreaSceneCard'])
  a.equal(f.run(`!!window.${n}?._s25V2888`),true,n+' wrapped');
a.equal(f.run("document.getElementById('scene25dStyleV2888')?.tagName"),'STYLE');
f.run('installScene25dV2888()');a.equal(f.run('window.drawWorldPoi._baseV2888._s25V2888'),undefined,'installing twice does not double-wrap');

// a recording 2D context
function rec(id='worldCanvas'){const calls=[];const ctx=new Proxy({canvas:{id,width:390,height:844},globalAlpha:1},{get(o,k){if(k in o)return o[k];return (...args)=>{calls.push([k,...args]);if(k==='createRadialGradient'||k==='createLinearGradient')return {addColorStop(){}};};},set(o,k,v){o[k]=v;return true;}});return {ctx,calls,names:()=>calls.map(c=>c[0])};}
const on=()=>f.run("setScene25dV2888(true)"),off=()=>f.run("setScene25dV2888(false)");
f.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring'");

// ---------------------------------------------------------------- off switch: exact pass-through ----
off();
{
  const opts={icon:'🏘️',title:'南域 · 青云村',subtitle:'s',desc:'d',chips:['a'],info:'i'};f.c.__o=opts;
  a.equal(f.run('buildAreaSceneCard(__o)'),f.run('buildAreaSceneCard._baseV2888(__o)'),'off: cards untouched');
  // a fresh wrapper around a spy: with the switch off it must call through with the same arguments and draw nothing
  let seen=null;const spy=function(ctx,o){seen=[ctx,o,arguments.length];};
  f.c.__spy=spy;f.run("window.__probeV2888=window.drawWorldPoi;window.drawWorldPoi=__spy;s25WrapSpriteV2888('drawWorldPoi',true)");
  const r=rec(),poi={id:'village',x:100,y:200,r:30};f.c.__ctx=r.ctx;f.c.__poi=poi;f.run('drawWorldPoi(__ctx,__poi)');
  a.equal(seen[0],r.ctx);a.equal(seen[1],poi);a.equal(r.calls.length,0,'off: no extra drawing');
  f.run('window.drawWorldPoi=window.__probeV2888');
}
on();

// ---------------------------------------------------------------- world wrappers ----
{
  // world canvas: depth scale + cast shadow for buildings, none for npc/explore/spring
  // compare against the unwrapped function, so only what the wrapper adds is counted
  const names=(fn,o,id)=>{const r=rec(id);f.c.__ctx=r.ctx;f.c.__o=o;f.run(`${fn}(__ctx,__o)`);return r.names();};
  const extra=(o,k,id='worldCanvas')=>names('drawWorldPoi',o,id).filter(n=>n===k).length-names('drawWorldPoi._baseV2888',o,id).filter(n=>n===k).length;
  f.run('FLAT_WORLD.camera.x=0;FLAT_WORLD.camera.y=0');
  const village={id:'village',x:200,y:300,r:30};
  a.equal(extra(village,'scale'),1,'depth scale on the world canvas');a.equal(extra(village,'transform'),1,'cast shadow (skew) for a building');
  for(const o of [{id:'npc_x',action:'npc_trader',x:1,y:1,r:9},{id:'e1',action:'explore_v2828',x:1,y:1,r:9},{id:'sp',buildingId:'spirit_spring',action:'lingxiao_building',x:1,y:1,r:9}])
    a.equal(extra(o,'transform'),0,'no cast shadow for '+o.id);
  a.deepEqual(names('drawWorldPoi',village,'minimapCanvas'),names('drawWorldPoi._baseV2888',village,'minimapCanvas'),'other canvases are left alone');
  // depth scale: bounded and growing toward the bottom of the view
  f.run('S25_V2888.frameVh=800');const s=[-500,0,200,400,800,2000].map(y=>f.run(`s25DepthScaleV2888(${y})`));
  for(let i=1;i<s.length;i++)a(s[i]>=s[i-1]);a.equal(s[0],f.run('SCENE25D_V2888.depth.far'));a.equal(s.at(-1),f.run('SCENE25D_V2888.depth.near'));
  // trees cast shadows, monsters only scale
  const tree={t:'tree',x:50,y:60,s:1,v:0},mon={alive:true,x:5,y:5,enemy:{name:'x'}};
  const delta=(fn,o,k)=>names(fn,o).filter(n=>n===k).length-names(fn+'._baseV2888',o).filter(n=>n===k).length;
  a.equal(delta('drawDepthTreeV2770',tree,'transform'),1,'trees cast shadows');
  a.equal(delta('drawWorldMonster',mon,'scale'),1);a.equal(delta('drawWorldMonster',mon,'transform'),0,'monsters keep their own shadow');
}
// overlay cache: one per size + region
{
  const o1=f.run('s25OverlayV2888(390,844)'),o2=f.run('s25OverlayV2888(390,844)'),o3=f.run('s25OverlayV2888(400,844)');
  a.equal(o1,o2,'same size: cached');a.notEqual(o2,o3,'resize: rebuilt');
  f.run("currentRegion='north'");a.notEqual(f.run('s25OverlayV2888(400,844)'),o3,'region change: rebuilt');f.run("currentRegion='south'");
}
// relief baked once per ground cache
{
  const r=rec();const cache={width:2200,height:1450,getContext:()=>r.ctx};f.c.__c=cache;
  f.run('s25BakeReliefV2888(__c)');const n=r.calls.length;a(n>0);f.run('s25BakeReliefV2888(__c)');a.equal(r.calls.length,n,'second bake is a no-op');
}
// reduced motion freezes drifting clouds (camera parallax still works)
{
  f.c.matchMedia=q=>({matches:/reduce/.test(q),addEventListener(){}});
  const pos=t=>{const r=rec();f.c.__ctx=r.ctx;f.run(`s25CloudShadowsV2888(__ctx,${t},-1e9,1e9,-1e9,1e9)`);return JSON.stringify(r.calls.filter(c=>c[0]==='drawImage').map(c=>c.slice(2)));};
  a.equal(pos(0),pos(500000),'calm: clouds do not move');
  f.c.matchMedia=()=>({matches:false,addEventListener(){}});a.notEqual(pos(0),pos(500000),'normal: clouds drift');
}
// every region draws without errors, on and off
{
  f.run('startGame();closeWorldOverlay()');
  const before=f.errors.length;
  for(const mode of ['on','off']){mode==='on'?on():off();
    for(const region of ['south','east','west','north','human_peaks','human_valleys','demon_domain','immortal_domain']){
      f.run(`currentRegion=${JSON.stringify(region)};releaseStaticWorldCacheV2767();`);
      for(let i=0;i<5;i++)f.run(`FLAT_WORLD.camera.x+=7;drawFlatWorld(${i*400},1/60)`);
    }}
  on();f.run("currentRegion='south';releaseStaticWorldCacheV2767()");
  a.deepEqual(f.errors.slice(before).map(e=>String(e[1]||e[0])),[],'no errors or warnings while drawing');
}

// ---------------------------------------------------------------- 山河图 ----
{
  f.run('showScrollMapV2831()');
  const wrap=()=>f.run("document.getElementById('scrollMapV2831')"),field=()=>f.run("document.getElementById('scrollFieldV2831')");
  a(wrap().classList.contains('scene25d-scroll-v2888'));
  const layers=()=>field().children.filter(c=>/s25-/.test(c.className));
  a.equal(layers().length,3,'light + two mist layers');for(const l of layers())a.equal(l.getAttribute('aria-hidden'),'true');
  const pois=field().children.filter(c=>c.className.includes('scroll-poi-v2831')).length;
  f.run("renderScrollTargetsV2837()");a.equal(layers().length,3,'layers survive a re-render');
  a.equal(field().children.filter(c=>c.className.includes('scroll-poi-v2831')).length,pois,'landmarks unchanged');
  const t=f.run("document.querySelector('[data-s25-toggle]')");a(t,'toggle in the header');a.equal(t.getAttribute('aria-pressed'),'true');
  t.listeners.click[0]({stopPropagation(){}});
  a.equal(f.run("localStorage.getItem('xiantu_scene25d_v2888')"),'off');a(!wrap().classList.contains('scene25d-scroll-v2888'));a.equal(layers().length,0,'off: layers removed');a.equal(t.getAttribute('aria-pressed'),'false');
  a(f.run("document.documentElement.classList.contains('scene25d-off-v2888')"));
  t.listeners.click[0]({stopPropagation(){}});a.equal(f.run("localStorage.getItem('xiantu_scene25d_v2888')"),null);a.equal(layers().length,3);
  f.run('zoomScrollV2837(2)');f.run('closeScrollMapV2837()');
}

// ---------------------------------------------------------------- location cards ----
{
  const card=o=>{f.c.__o=o;return {mine:f.run('buildAreaSceneCard(__o)'),base:f.run('buildAreaSceneCard._baseV2888(__o)')};};
  const c=card({icon:'🏘️',title:'南域 · 青云村',subtitle:'s',desc:'村口',chips:['a','b'],info:'i',accent:'#7fd1ff'});
  a(c.mine.includes('class="area-scene-card scene25d-card-v2888"'));a(c.mine.includes('aria-hidden="true"'));a(c.mine.includes('--s25-accent:#7fd1ff'));
  a.equal(c.mine.replace(/<div class="s25-diorama-v2888"[\s\S]*?<div class="s25-ground-v2888"><\/div><\/div>/,'').replace(' scene25d-card-v2888',''),c.base,'card content is unchanged apart from the diorama');
  const bad=card({icon:'x',title:'t',accent:'red;"><img src=x onerror=alert(1)>'});const dio=bad.mine.match(/<div class="s25-diorama-v2888"[\s\S]*?<div class="s25-ground-v2888"><\/div><\/div>/)[0];a(!dio.includes('onerror')&&dio.includes('--s25-accent:#ffd98a'),'the diorama only takes a hex accent');
  for(const [icon,title,kind] of [['⛩️','北域 · 凌霄宗','sect'],['🏘️','南域 · 青云村','village'],['🏠','我的洞府 · Lv.1','home'],['🏪','仙市','market'],['🌊','湖畔','pavilion']])a.equal(f.run(`s25SceneKindV2888(${JSON.stringify(icon)},${JSON.stringify(title)})`),kind);
  a.equal(card({icon:'🏘️',title:'同一处'}).mine,card({icon:'🏘️',title:'同一处'}).mine,'same place, same landscape');
  a.notEqual(card({icon:'🏘️',title:'甲地'}).mine,card({icon:'🏘️',title:'乙地'}).mine,'different places, different ridges');
  // a real location panel renders through the wrapper
  f.c.showStory=h=>{f.c.__shown=String(h);};f.run("showLocation('village')");a(f.run('__shown').includes('s25-diorama-v2888'),'village panel has the diorama');
  // pointer parallax sets the card variables (no throw without a card)
  f.run("document.dispatchEvent?.(new Event('pointermove'))");
}
// Toggle restores every inline background declaration and cancels pending parallax.
{
 f.run("showScrollMapV2831();setScene25dV2888(false)");
 const field=f.run("document.getElementById('scrollFieldV2831')");
 const bg={backgroundImage:'',backgroundSize:'cover',backgroundPosition:'10px 20px',backgroundRepeat:'repeat-x'};Object.assign(field.style,bg);
 f.run("setScene25dV2888(true);setScene25dV2888(false)");for(const [k,v] of Object.entries(bg))a.equal(field.style[k],v,k+' restored');
 f.run("S25_V2888.cardTarget=document.getElementById('storyText');S25_V2888.cardRaf=99;S25_V2888.scrollRaf=100;s25StopMotionV2888()");
 a.equal(f.run('S25_V2888.cardRaf+S25_V2888.scrollRaf'),0);a.equal(f.run('S25_V2888.cardTarget'),null);
 f.run('closeScrollMapV2837();setScene25dV2888(true)');
}
a.deepEqual(f.errors.filter(e=>/2\.5D|s25|V2888/.test(String(e[1]||e[0]))),[],'no 2.5D errors');
console.log('PASS v2888 2.5D scenes: loader, off switch, world wrappers, caches, reduced motion, 8 regions, 山河图 layers/toggle, location cards');
