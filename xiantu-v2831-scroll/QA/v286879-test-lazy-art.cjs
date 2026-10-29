'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.console.log=()=>{};const OriginalImage=f.c.Image;f.c.Image=class extends OriginalImage{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const regional=()=>images.filter(i=>i.src?.includes('region-buildings-v2835.webp'));
for(const region of ['south','east','west','human_peaks','human_valleys']){f.run(`currentRegion='${region}';loadScrollArtV2831()`);a.equal(regional().length,0,'unneeded regions never request the atlas');}
f.run("currentRegion='north';loadScrollArtV2831()");a.equal(regional().length,1);
a.equal(f.run('!!SCROLL_ART_V2831.regionalBuildings'),false,'normal building fallback remains while loading');
for(const region of ['south','north','demon_domain','immortal_domain']){f.run(`currentRegion='${region}';loadScrollArtV2831()`);a.equal(regional().length,1,'one atlas request across regions');}
const im=regional()[0];im.width=900;im.height=1200;im.onload();a.equal(f.run('SCROLL_ART_V2831.regionalBuildings'),im);
f.run('SCROLL_ART_V2831.regionalBuildingsRequested=false;SCROLL_ART_V2831.regionalBuildings=null;loadScrollArtV2831()');a.equal(regional().length,2);regional()[1].onerror();
for(let i=0;i<20;i++)f.run('loadScrollArtV2831()');a.equal(regional().length,2,'failed image uses fallback without per-frame retry loop');
for(const key of ['teaching','affairs','discipline','medicine']){const html=f.run(`sectStewardArtV286865('${key}')`);a.match(html,/sect-stewards-v286879\.webp/);a.match(html,/loading="lazy"/);a.match(html,/onerror=/);}
a(fs.existsSync(root+'/art/npc/sect-stewards-v286879.webp'));
console.log('PASS regional atlas lazy request, cached reuse, failure fallback, lazy steward image');
