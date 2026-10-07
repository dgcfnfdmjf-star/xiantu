const fs=require('node:fs'),a=require('node:assert/strict'),root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root);
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay()');
const cases={'灵纹野兔':'rabbit','【精英】灵纹野兔':'rabbit','碧水灵龟':'turtle','精英·碧水灵龟':'turtle','魔渊蝙蝠':'bat'};
const calls=[];let shapes=0;
f.c.artCtx=new Proxy({drawImage:(...v)=>calls.push(v),ellipse:()=>shapes++,arc:()=>shapes++,createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});
f.run('SCROLL_ART_V2831.smallBeastsV28682={complete:true,naturalWidth:2172,naturalHeight:724}');
const before=f.run('JSON.stringify(player)');
for(const [name,key]of Object.entries(cases)){
 a.equal(f.run(`scrollMonsterKeyV2853(${JSON.stringify(name)},'west',true)`),key);
 calls.length=0;f.run(`drawInkEnemyV2833(artCtx,{enemy:{name:${JSON.stringify(name)}},regionId:'west'})`);a.equal(calls.length,1);a.equal(calls[0][0],f.run('SCROLL_ART_V2831.smallBeastsV28682'));
 f.ids.get('enemyChar').getContext=()=>f.c.artCtx;f.run(`currentEnemy={name:${JSON.stringify(name)}}`);calls.length=0;f.run(`drawScrollMonsterPortraitV2853(document.getElementById('enemyChar'),'${key}')`);a.equal(calls.length,1);a.equal(calls[0][0],f.run('SCROLL_ART_V2831.smallBeastsV28682'));
}
a.equal(f.run('JSON.stringify(player)'),before);
f.run('SCROLL_ART_V2831.smallBeastsV28682=null;SCROLL_ART_V2831.enemies={complete:true,width:400,height:200}');
for(const name of Object.keys(cases)){calls.length=0;const prev=shapes;f.run(`drawInkEnemyV2833(artCtx,{enemy:{name:${JSON.stringify(name)}},regionId:'south'})`);a.equal(calls.length,0);a(shapes>prev,'species fallback draws without loading humanoid art');}
for(const name of f.run('Object.keys(PET_DATABASE)'))a(!['bandit','cultivator','demon-general','celestial-guard'].includes(f.run(`scrollMonsterKeyV2853(${JSON.stringify(name)},'south',true)`)),name);
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS rabbit/turtle/bat and elite identities, map and battle atlas, all capturable species, offline nonhuman fallback, unchanged player state');
