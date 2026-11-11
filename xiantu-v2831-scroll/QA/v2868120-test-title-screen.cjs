'use strict';
// V28.68.120 title screen (audit A1): gilded 仙途, mist/mote backdrop (static with effects off or reduced motion),
// returning card with name/realm/save time read from the existing save (never written), landscape two columns.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const html=fs.readFileSync(root+'/game-v2762.html','utf8'),css=fs.readFileSync(root+'/xiantu-v2762.css','utf8'),core=fs.readFileSync(root+'/xiantu-v2762-core.js','utf8');
const files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);

// 1. Markup: title, backdrop, card, and the ids other code depends on are kept.
const start=html.slice(html.indexOf('<div id="startScreen"'),html.indexOf('<!-- 游戏界面 -->'));
a.match(start,/class="title-logo-v2868120" aria-label="仙途"/);
a.match(start,/<canvas id="titleMistV2868120"[^>]*aria-hidden="true"/);
for(const id of ['startChar','playerName'])a.ok(start.includes(`id="${id}"`),id+' kept');
a.ok(start.includes('onclick="startGame()">开始修仙</button>')&&start.includes('onclick="showSaveManagerV2768()"'));
a.match(html,/<div id="saveSummaryV2868120" class="save-summary-v2868120" hidden><\/div>/);
a.ok(html.includes('id="saveInfo"')&&html.includes('onclick="loadAndStart()">续行仙途'),'continue flow unchanged');

// 2. CSS: 青绿鎏金 tokens, gilded text, landscape grid, vignette.
const block=css.slice(css.indexOf('/* ===== V28.68.120 title screen'));
a.ok(block.length>500);
a.match(block,/var\(--xt-gold-100[^)]*\)[^;]*var\(--xt-gold-700/,'gilded gradient uses gold tokens');
a.match(block,/background-clip:text/);a.match(block,/title-vignette-v2868120\{[^}]*radial-gradient/);
a.match(block,/@media \(orientation:landscape\) and \(max-height:500px\)\{[\s\S]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/,'two columns in phone landscape');

// 3. Backdrop is display-only, fixed pools, 30fps cap, stops off-screen, static under effects-off/reduced motion.
const fx=core.slice(core.indexOf('const TITLE_FX_V2868120'),core.indexOf('window.startTitleFxV2868120'));
a.ok(fx.length>1000);
a.doesNotMatch(fx,/setItem|saveGame|writeSave|player\.|Math\.random\(/,'backdrop never touches saves, player or game RNG');
a.match(fx,/xiantu_map_fx_v2868104'\)==='off'/);a.match(fx,/xt-reduce-motion/);a.match(fx,/prefers-reduced-motion: reduce/);
a.match(fx,/length:9\}/);a.match(fx,/length:36\}/);a.match(fx,/t-F\.last>=33/);
a.match(fx,/if\(!F\.canvas\?\.isConnected\|\|!titleScreenShownV2868120\(\)\)return;/,'loop ends when the title is hidden');
const loop=fx.slice(fx.indexOf('function titleFxDrawV2868120'),fx.indexOf('function startTitleFxV2868120'));a.doesNotMatch(loop,/Array\.from|new Array|createElement/,'no per-frame allocation of pools');

// 4. Runtime in the DOM fixture: card shows name/realm/time; reads only; large saves stay unparsed; bad saves hide the card.
const f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};for(const file of files)f.load(file);
const save={player:{name:'青岚',level:3,phase:2,inventory:[],gold:10,exp:1,hp:10,mp:5},achievements:{progress:{},completed:[]},timestamp:Date.now()-3*3600e3,version:12};
const raw=JSON.stringify(save);f.storage.set('xiantu_save',raw);
let sum=f.run('refreshTitleSaveCardV2868120()');const card=f.ids.get('saveSummaryV2868120');
a.equal(sum.name,'青岚');a.equal(sum.realm,f.run('getCultivationName(3,2)'));a.equal(card.hidden,false);
a.match(card.innerHTML,/青岚/);a.match(card.innerHTML,/保存于 \d{4}-\d\d-\d\d \d\d:\d\d · 3 小时前/);
a.equal(f.storage.get('xiantu_save'),raw,'save is unchanged');a.equal(f.storage.has('xiantu_save_backup'),false,'no backup written');
f.storage.set('xiantu_save',JSON.stringify({...save,player:{...save.player,name:'<img src=x onerror=alert(1)>'}}));
f.run('refreshTitleSaveCardV2868120()');a.doesNotMatch(card.innerHTML,/<img/,'names are escaped');
f.storage.delete('xiantu_save');f.storage.set('xiantu_save_backup',raw);f.run('refreshTitleSaveCardV2868120()');a.match(card.innerHTML,/备用档/,'backup-only save is labelled');
const big=JSON.stringify({...save,player:{...save.player,pad:'x'.repeat(1600*1024)}});f.storage.set('xiantu_save',big);
sum=f.run('refreshTitleSaveCardV2868120()');a.equal(sum.large,true);a.equal(sum.ts,save.timestamp,'large saves show time from the tail without JSON.parse');a.match(card.innerHTML,/续行后读取/);
f.storage.set('xiantu_save','{broken');a.equal(f.run('refreshTitleSaveCardV2868120()'),null);a.equal(card.hidden,true);
// checkSaveOnStart still opens the dialog and fills the card; the backdrop call is tolerant of the fixture canvas.
f.storage.set('xiantu_save',raw);f.run('hasCheckedSave=false;checkSaveOnStart();startTitleFxV2868120()');
a.equal(f.ids.get('loadDialog').style.display,'flex');a.equal(card.hidden,false);
a.deepEqual(f.errors,[]);
console.log('PASS v2868120 title screen');
