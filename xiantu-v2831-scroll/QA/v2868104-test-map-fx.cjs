'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run('startGame();tutorialState.active=false;closeWorldOverlay()');f.timers.clear();
// No new mandatory boot module and no renderer download while effects are off.
f.run("localStorage.setItem('xiantu_map_fx_v2868104','off');mapFxFrameV2868104(1000)");a.equal(f.run('MAP_FX_HOST_V2868104.loading'),null);
const source=fs.readFileSync(root+'/xiantu-v2868104-map-fx.js','utf8');
// Expose lifecycle state only inside the test VM, never in the shipped module.
f.run(source.replace('window.XiantuMapFxV2868104={','window.fxTest={S,observe,slot,render,tickEvent,fallback,desired,composition,clearSlots,theme};window.XiantuMapFxV2868104={'));
const state=f.run('JSON.stringify(player)');let rngCalls=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>{rngCalls++;return .5;};
f.run("localStorage.setItem('xiantu_map_fx_v2868104','high');XiantuMapFxV2868104.resetQuality()");a.equal(f.run('XiantuMapFxV2868104.stats().tier'),'high');
// Raw 60 ms frame spacing (not the map's clamped simulation dt) forces one-way downgrade.
f.run('fxTest.observe(1);for(let t=4000;t<8500;t+=60)fxTest.observe(t)');a.equal(f.run('XiantuMapFxV2868104.stats().tier'),'low');a.equal(f.run('XiantuMapFxV2868104.stats().downgrades'),1);
f.run('for(let t=12000;t<16000;t+=33)fxTest.observe(t)');a.equal(f.run('XiantuMapFxV2868104.stats().tier'),'low','good performance never auto raises quality');
// Lightweight rendering, bounded particle pools and no gameplay mutation.
f.run("fxTest.S.noGL=true;fxTest.S.ctx=document.getElementById('worldCanvas').getContext('2d');fxTest.S.width=390;fxTest.S.height=844;fxTest.slot(0,0,100,100,220,.5,1,0,1,'#fff');fxTest.slot(4,3,100,100,300,.5,1,0,1,'#fff');fxTest.render()");a(f.run('XiantuMapFxV2868104.stats().points')<=160);a.equal(rngCalls,0);a.equal(f.run('JSON.stringify(player)'),state);
// Distinct scene motion families stay bounded on mobile and high quality.
for(const tier of ['low','high'])for(const [theme,kinds] of [['alchemy',[0,4]],['vortex',[5,4]],['palace',[6,0]]]){
 f.run(`fxTest.S.tier='${tier}'`);
 f.run(`fxTest.clearSlots();fxTest.composition('${theme}',180,240,1,3)`);
 a.deepEqual(Array.from(f.run('fxTest.S.slots.slice(0,2).map(s=>s.kind)')),kinds);
 a(f.run('fxTest.S.slots.reduce((n,s)=>n+s.n,0)')<=(tier==='high'?2400:662));
 a(f.run('fxTest.S.slots[0].n')>=(tier==='high'?1200:400));
 a.equal(f.run('JSON.stringify(player)'),state);
}
a.equal(f.run("fxTest.theme({action:'secret'})"),'vortex');
a.equal(f.run("fxTest.theme({action:'lingxiao_building',buildingId:'alchemy_hall'})"),'alchemy');
a.equal(f.run("fxTest.theme({action:'shop'})"),null);
a.equal(rngCalls,0);
f.run('XiantuMapFxV2868104.pause(true)');a.equal(f.run('XiantuMapFxV2868104.stats().calls'),0);a.equal(f.run('XiantuMapFxV2868104.stats().eventRaf'),false);
// Event TTL, owner changes, reduced motion, hidden tabs and combat all stop bursts.
f.run("showAlchemy();XiantuMapFxV2868104.event('pill',true,player,1000);fxTest.tickEvent(1100)");a.equal(f.run('XiantuMapFxV2868104.stats().event'),true);f.run('fxTest.tickEvent(2000)');a.equal(f.run('XiantuMapFxV2868104.stats().event'),false);
f.run("XiantuMapFxV2868104.event('pill',true,player,1000);player={...player};fxTest.tickEvent(1100)");a.equal(f.run('XiantuMapFxV2868104.stats().event'),false);
f.run("XiantuMapFxV2868104.event('pill',true,player,1000);gameState='combat';fxTest.tickEvent(1100)");a.equal(f.run('XiantuMapFxV2868104.stats().event'),false);
f.run("gameState='alchemy';XiantuMapFxV2868104.event('pill',true,player,1000);document.hidden=true;fxTest.tickEvent(1100)");a.equal(f.run('XiantuMapFxV2868104.stats().event'),false);f.c.document.hidden=false;
f.c.matchMedia=()=>({matches:true});a.equal(f.run('XiantuMapFxV2868104.stats().tier'),'off');f.run("XiantuMapFxV2868104.event('pill',true,player,1000)");a.equal(f.run('XiantuMapFxV2868104.stats().event'),false);
console.log('PASS optional/off loading, raw-frame downgrade/no auto upgrade, pooled lightweight particle limits, module RNG/gameplay isolation, event TTL/owner/combat/visibility/reduced-motion cleanup');
