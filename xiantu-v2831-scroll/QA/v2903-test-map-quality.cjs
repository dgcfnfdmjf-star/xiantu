'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function game(ua='Desktop',mem=8,mode=null,coarse=false){const f=fixture(root);f.c.console.log=()=>{};f.c.navigator.userAgent=ua;f.c.navigator.deviceMemory=mem;f.c.matchMedia=q=>({matches:coarse&&q==='(pointer: coarse)',addEventListener(){}});if(mode)f.storage.set('xiantu_gfx_quality_v2876',mode);for(const file of files)f.load(file);return f;}
for(const [ua,mem,mode,coarse,low,cap] of [['Desktop',8,null,false,false,1.5],['Desktop',undefined,null,false,false,1.5],['Desktop',2,null,false,true,1],['iPhone',8,null,false,true,1],['Macintosh',8,null,true,true,1],['Desktop',8,'low',false,true,1],['iPhone',8,'high',false,false,1],['Desktop',2,'high',false,false,1.5],['Desktop',8,'invalid',false,false,1.5]]){
 const f=game(ua,mem,mode,coarse);a.equal(f.run('PERF_CONFIG.lowEnd'),low);a.equal(f.run('PERF_CONFIG.ultraSmooth'),low);a.equal(f.run('worldDprCapV2893()'),cap);
}
const f=game();const run=s=>f.run(s);run('startGame();closeWorldOverlay();');f.timers.clear();
// Toggle never mutates player, geometry or reward state, releases old backing cache, survives reload.
run('ensureStaticWorldCache();globalThis.oldCache=PERF_CONFIG.staticWorldCanvas;globalThis.oldPlayer=JSON.stringify(player);globalThis.geometry=JSON.stringify([FLAT_WORLD.pois,FLAT_WORLD.colliders]);');
a.equal(run('setGraphicsQualityV2903("low")'),true);a.equal(run('PERF_CONFIG.lowEnd'),true);a.equal(run('oldCache.width'),1);a.equal(run('JSON.stringify(player)'),run('oldPlayer'));a.equal(run('JSON.stringify([FLAT_WORLD.pois,FLAT_WORLD.colliders])'),run('geometry'));
a.equal(f.storage.get('xiantu_gfx_quality_v2876'),'low');a.equal(run('readGraphicsQualityV2903()'),'low');a.equal(run('setGraphicsQualityV2903("bad")'),false);
run('globalThis.oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("blocked")};setGraphicsQualityV2903("high")');a.equal(run('PERF_CONFIG.lowEnd'),false);a(f.ids.get('storyText').innerHTML.includes('浏览器禁止保存'));run('localStorage.setItem=oldSet');
for(const state of ['combat','combat-ending']){run(`gameState="${state}";globalThis.pref=PERF_CONFIG.graphicsQuality`);a.equal(run('setGraphicsQualityV2903("low")'),false);a.equal(run('PERF_CONFIG.graphicsQuality'),run('pref'));}run('gameState="exploring"');
// Rebuilding the map in a different quality must not add trees/colliders.
run('globalThis.oldRandom=Math.random;globalThis.seed2903=42;Math.random=()=>((seed2903=Math.imul(seed2903,1664525)+1013904223>>>0)/4294967296);setGraphicsQualityV2903("low");applyWorldMapLayout("north",true);globalThis.layout2903=JSON.stringify([FLAT_WORLD.decor,FLAT_WORLD.colliders]);seed2903=42;setGraphicsQualityV2903("high");applyWorldMapLayout("north",true);');
a.equal(run('JSON.stringify([FLAT_WORLD.decor,FLAT_WORLD.colliders])'),run('layout2903'));run('Math.random=oldRandom');
// Fog uses expanded-grid IDs, expands on level-up even in the same cell, and never clears claimed rewards.
run('player=createDefaultPlayer();currentRegion="north";FLAT_WORLD.width=3190;FLAT_WORLD.height=2102;FLAT_WORLD.player.x=1500;FLAT_WORLD.player.y=1000;player.level=0;explorationV2828().claimed.explore_v2828_0="take";explorationV2828().seen["0,0"]=1;revealExplorationV2828();globalThis.early=Object.keys(explorationV2828().seen).length;');
a.equal(run('explorationVisionV2903()'),460);run('player.level=16;revealExplorationV2828()');a.equal(run('explorationVisionV2903()'),620);a(run('Object.keys(explorationV2828().seen).length>early'));
a.equal(run('explorationV2828().claimed.explore_v2828_0'),'take');a.equal(run('explorationV2828().seen["0,0"]'),1);
run('saveGame();player=normalizePlayer(loadGame().player)');a.equal(run('explorationV2828().claimed.explore_v2828_0'),'take');
run('player=createDefaultPlayer();FLAT_WORLD.player.x=0;FLAT_WORLD.player.y=0;revealExplorationV2828()');a(run('Object.keys(explorationV2828().seen).every(k=>k.split(",").every(n=>Number(n)>=0))'));
// Roads are baked once, including the painted-ground early-return path.
let roads=0,paths=0;f.c.drawRoutesV2827=()=>roads++;f.c.drawLingxiaoBuildingPaths=()=>paths++;
run('releaseStaticWorldCacheV2767();ensureStaticWorldCache();ensureStaticWorldCache()');a.equal(roads,1);a.equal(paths,1);
// Real scaled image envelope controls fade; player below, outside, NPC and other canvases stay opaque.
run('player.level=7;FLAT_WORLD.player={x:500,y:400};globalThis.poi={x:500,y:500,r:60,action:"sect",name:"凌霄宗"};');
f.c.ctx={canvas:{id:'worldCanvas'},globalAlpha:.8};run('architectureFadeV2903(ctx,poi,180,220,32)');a.equal(f.c.ctx.globalAlpha,.8*.42);
for(const [x,y,id] of [[800,400,'worldCanvas'],[500,530,'worldCanvas'],[500,400,'preview']]){f.c.ctx={canvas:{id},globalAlpha:.8};run(`FLAT_WORLD.player.x=${x};FLAT_WORLD.player.y=${y};architectureFadeV2903(ctx,poi,180,220,32)`);a.equal(f.c.ctx.globalAlpha,.8);}
console.log('PASS desktop/mobile quality selection and persistence, cache disposal, unchanged player/collision state, expanded fog IDs/reload, single-bake routes and scale-aware building fade');
