'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),fixture=require('./v2853-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||'release-v2853/xiantu-v2831-scroll',files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function game(){const f=fixture(root),images=[];f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.c.Image=class{
 constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;this.width=0;this.height=0;this.listeners={};images.push(this)}
 set src(v){this._src=v}get src(){return this._src||''}addEventListener(k,fn){this.listeners[k]=fn}removeAttribute(k){if(k==='src'){this._src='';this.released=true}}
 finish(w=384,h=480){this.complete=true;this.naturalWidth=this.width=w;this.naturalHeight=this.height=h;this.onload?.();this.listeners.load?.()}
 fail(){this.complete=true;this.naturalWidth=this.naturalHeight=0;this.onerror?.()}
 };f.images=images;f.c.AbortController=AbortController;for(const name of files)f.load(name);f.run('startGame();closeWorldOverlay()');f.timers.clear();return f;}
function context(){const calls=[];return {calls,ctx:new Proxy({globalAlpha:1,drawImage:(...xs)=>calls.push(xs),measureText:t=>({width:String(t).length*8}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}})};}
function readyMap(f){f.run('loadScrollArtV2831()');const image=f.images.find(i=>i.src.includes('monster-map-v2853.webp'));a(image);image.finish(640,640);return image;}
function start(f,name='野狼'){f.run(`gameState='exploring';currentEnemy=null;COMBAT_FINISH_V2764.settling=false;startCombat({name:${JSON.stringify(name)},hp:50000,maxHp:50000,atk:2,def:2,gold:8,exp:10});drawCharacter(document.getElementById('enemyChar'),currentEnemy.name,player.level,true)`);f.timers.clear();}
function render(f,key,name=key){f.run(`currentEnemy={name:${JSON.stringify(name)},hp:999,maxHp:999};drawCharacter(document.getElementById('enemyChar'),${JSON.stringify(name)},player.level,true)`)}
const tests=[];
const f=game();tests.push(f);const map=readyMap(f),c=context();f.c.ctx=c.ctx;
a.equal(f.images.filter(i=>i.src.includes('monster-map')).length,1);a(!f.images.some(i=>/ink-(enemies|beasts)-v2833/.test(i.src)));a(!f.images.some(i=>/monster-(?!map).+-v2853/.test(i.src)));
const mapping={'野狼':'wolf','精英·野狼':'wolf','【精英】冰霜巨狼':'frost-wolf','暗影魔狼':'wolf','九尾灵狐':'fox','妖兽':'tiger','寒冰蛟龙':'dragon','冰龙幼崽':'dragon','远古巨猿':'ape','雷鹰':'eagle','火凤幼崽':'phoenix','毒蛇':'serpent','巨型蜘蛛':'spider','千年树妖':'treant','冰晶傀儡':'golem','山贼':'bandit','邪修':'cultivator','魔修':'cultivator','鬼将':'demon-general','幽冥鬼':'ghost','宗门试炼守将':'celestial-guard','战神之魂':'war-spirit','迷雾领主':'mist-lord','幽冥鬼王':'mist-lord','血魔老祖':'blood-elder'};
for(const [name,key] of Object.entries(mapping)){
 a.equal(f.run(`scrollMonsterKeyV2853(${JSON.stringify(name)})`),key);c.calls.length=0;f.run(`drawInkEnemyV2833(ctx,{enemy:{name:${JSON.stringify(name)}},regionId:'north'})`);a.equal(c.calls.length,1);a.equal(c.calls[0][0],map);const index=f.run(`SCROLL_MONSTER_ART_V2853.keys.indexOf('${key}')`);a.equal(c.calls[0][1],index%5*128);a.equal(c.calls[0][2],Math.floor(index/5)*160);
}
const regions=f.run('Object.values(WORLD_REGIONS).map(r=>({id:r.id,names:r.monsters||[]}))');let regional=0;
for(const region of regions)for(const name of region.names){c.calls.length=0;f.run(`drawInkEnemyV2833(ctx,{enemy:{name:${JSON.stringify(name)}},regionId:${JSON.stringify(region.id)}})`);a.equal(c.calls.length,1,region.id+name);a.equal(c.calls[0][0],map);regional++;}
a(regional>15);a.equal(f.run('ENEMY_IMAGE_CACHE_V2767.size'),0);
console.log('PASS shared identities, distinct ice/forest wolves and snake/dragon/birds, every region entry uses one small atlas; no portrait preload or old-atlas preload');
const battle=context();f.ids.get('enemyChar').getContext=()=>battle.ctx;start(f,'野狼');
const wolf=f.images.find(i=>i.src.includes('monster-wolf-v2853'));a(wolf);a(f.ids.get('enemyAvatarContainer').classList.contains('ink-monster-v2853'));
a(battle.calls.some(xs=>xs[0]===map));battle.calls.length=0;wolf.finish();a(battle.calls.some(xs=>xs[0]===wolf));
const before=f.run('JSON.stringify([player.gold,player.exp,player.hp,player.mp,currentEnemy,player.romance])');for(let i=0;i<5;i++)render(f,'wolf','野狼');const after=f.run('JSON.stringify([player.gold,player.exp,player.hp,player.mp,currentEnemy,player.romance])');
// Render helper swaps the fixture enemy; compare real rendering independently thereafter.
const stable=f.run('JSON.stringify([player,currentEnemy])');for(let i=0;i<5;i++)f.run("drawCharacter(document.getElementById('enemyChar'),'野狼',player.level,true)");a.equal(f.run('JSON.stringify([player,currentEnemy])'),stable);a.equal(f.images.filter(i=>i.src.includes('monster-wolf-v2853')).length,1);
for(const [name,key] of Object.entries(mapping)){render(f,key,name);const image=f.images.find(i=>i.src.includes('monster-'+key+'-v2853'));a(image);image.finish();a(f.run('ENEMY_IMAGE_CACHE_V2767.size')<=6)}
a.equal(f.run('ENEMY_IMAGE_CACHE_V2767.size'),6);a(wolf.released);a.equal(wolf.onload,null);f.run('pauseVisualsV2767()');a.equal(f.run('ENEMY_IMAGE_CACHE_V2767.size'),0);
for(const name of ['夜无疆','九重天劫','苏晚晴','洛清寒','姬红绫'])a.equal(f.run(`scrollMonsterKeyV2853(${JSON.stringify(name)})`),null);
render(f,'named','夜无疆');a(!f.ids.get('enemyAvatarContainer').classList.contains('ink-monster-v2853'));a(f.images.some(i=>i.src.includes('portrait-yewuji-v2810')));
console.log('PASS lazy portraits, map fallback while loading, no render mutations, bounded six-image cache, eviction/background release, named portraits and tribulations preserved');
const late=game();tests.push(late);readyMap(late);const lateCtx=context();late.ids.get('enemyChar').getContext=()=>lateCtx.ctx;start(late,'野狼');const old=late.images.find(i=>i.src.includes('monster-wolf-v2853'));render(late,'frost-wolf','冰霜巨狼');lateCtx.calls.length=0;old.finish();a.equal(lateCtx.calls.length,0);const fresh=late.images.find(i=>i.src.includes('monster-frost-wolf-v2853'));fresh.finish();a(lateCtx.calls.some(xs=>xs[0]===fresh));
const fallback=game();tests.push(fallback);const atlas=readyMap(fallback),fc=context();fallback.ids.get('enemyChar').getContext=()=>fc.ctx;start(fallback,'野狼');fc.calls.length=0;fallback.images.find(i=>i.src.includes('monster-wolf-v2853')).fail();a(fc.calls.some(xs=>xs[0]===atlas));a(!fallback.images.some(i=>i.src.includes('v2762-asset-enemy-wolf')));
const broken=game();tests.push(broken);broken.run('loadScrollArtV2831()');const mb=broken.images.find(i=>i.src.includes('monster-map-v2853'));mb.fail();const oldMap=broken.images.find(i=>i.src.includes('ink-enemies-v2833'));a(oldMap);oldMap.finish(1024,680);broken.images.find(i=>i.src.includes('ink-beasts-v2833')).finish(640,640);const bc=context();broken.c.ctx=bc.ctx;broken.run("drawInkEnemyV2833(ctx,{enemy:{name:'野狼'},regionId:'south'})");a.equal(bc.calls[0][0],oldMap);start(broken,'野狼');broken.images.find(i=>i.src.includes('monster-wolf-v2853')).fail();a(broken.images.some(i=>i.src.includes('v2762-asset-enemy-wolf')));for(let i=0;i<20;i++)broken.run('loadScrollArtV2831()');a.equal(broken.images.filter(i=>i.src.includes('monster-map-v2853')).length,1);
console.log('PASS stale/late load cannot overwrite different enemy; portrait failure uses atlas; atlas failure loads old art once; double failure preserves legacy portrait path');
c.calls.length=0;f.run('warFigureV2841(ctx,1,51,false)');a.equal(c.calls[0][0],map);a.equal(c.calls[0][1],4*128);a.equal(c.calls[0][2],2*160);c.calls.length=0;f.run('warFigureV2841(ctx,0,51,false)');a.equal(c.calls[0][1],128);a.equal(c.calls[0][2],3*160);
const cinema=game();tests.push(cinema);readyMap(cinema);cinema.run("PERF_CONFIG.mobile=false;PERF_CONFIG.lowEnd=false;PERF_CONFIG.ultraSmooth=false;localStorage.setItem('xiantu_battle_presentation_v2756','cinema');setBattlePresentationV2756('cinema')");start(cinema,'寒冰蛟龙');const cut=cinema.ids.get('cinemaCutinV2756');a(cut);const cc=context(),cv=cut.querySelector('canvas');cv.getContext=()=>cc.ctx;cinema.run("playBossSkillEffect('寒霜吐息')");a(cc.calls.some(xs=>xs[0]===cinema.ids.get('enemyChar')));
console.log('PASS both war factions share new atlas; actual cinematic boss skill copies current battle canvas');
for(const t of tests)a.equal(t.errors.length,0,JSON.stringify(t.errors));
console.log('PASS all art integration checks; simulated images/DOM, no device performance claim');
