'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run("player=createDefaultPlayer();player.level=10;gameState='exploring';applyWorldMapLayout('north',true)");
const courts=json('lingxiaoCourtLayoutV286880()'),buildings=json('LINGXIAO_BUILDINGS'),tiers=json('Object.keys(LINGXIAO_TIER_META)');
a.equal(courts.length,9);a.deepEqual([...new Set(courts.map(c=>c.tier))].sort(),tiers.sort());
a.equal(courts.filter(c=>c.tier==='secret').length,2,'distant secret entrances do not become one map-wide slab');
for(const c of courts){
 const b=buildings.find(b=>b.id===c.anchor);a(b);a.equal(b.tier,c.tier);a.equal(c.x,b.x);
 a.equal(c.y,b.y+c.dy*run('WORLD_SCALE_V2900'));a.equal(c.color,run(`getBuildingTierColor(getBuildingData(${JSON.stringify(c.anchor)}))`));
 a(c.rx>0&&c.ry>0);a(c.x-c.rx>=0&&c.x+c.rx<=run('FLAT_WORLD.width'));a(c.y-c.ry>=0&&c.y+c.ry<=run('FLAT_WORLD.height'));
}
const snapshot=()=>run('JSON.stringify({player,buildings:LINGXIAO_BUILDINGS,paths:BUILDING_PATHS,colliders:FLAT_WORLD.colliders,pois:FLAT_WORLD.pois,access:LINGXIAO_BUILDINGS.map(b=>canAccessBuilding(b.id))})');
const before=snapshot(),calls=[];
const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});f.c.courtTestContext=ctx;
run('PERF_CONFIG.lowEnd=false;drawLingxiaoBuildingPaths(courtTestContext)');
a.equal(calls.filter(c=>c[0]==='translate').length,9);a(!calls.some(c=>/Gradient|drawImage/.test(c[0])));
a.equal(snapshot(),before,'ground painting never changes movement, collision, access or saves');
const highCalls=calls.length;calls.length=0;run('PERF_CONFIG.lowEnd=true;drawLingxiaoBuildingPaths(courtTestContext)');
a.equal(calls.filter(c=>c[0]==='translate').length,9);a(calls.length<highCalls,'low quality keeps the silhouettes and skips inset detail');a.equal(snapshot(),before);
// Schematic map callers keep exactly the original transformed route endpoints and no large courts.
calls.length=0;run('drawLingxiaoBuildingPaths(courtTestContext,(x,y)=>({x:x/10,y:y/10}))');
a.equal(calls.filter(c=>c[0]==='translate').length,0);
const paths=json('BUILDING_PATHS'),moves=calls.filter(c=>c[0]==='moveTo'),lines=calls.filter(c=>c[0]==='lineTo');a.equal(moves.length,paths.length);a.equal(lines.length,paths.length);
paths.forEach(([from,to],i)=>{const b=buildings.find(b=>b.id===from),e=buildings.find(b=>b.id===to);a.deepEqual(moves[i],['moveTo',b.x/10,(b.y+12)/10]);a.deepEqual(lines[i],['lineTo',e.x/10,(e.y+12)/10]);});
calls.length=0;run("currentRegion='south';drawLingxiaoBuildingPaths(courtTestContext)");a.equal(calls.length,0);
// Reuse the existing terrain cache; region changes rebuild once, standing frames do not repaint courts.
let draws=0;const paint=f.c.drawLingxiaoCourtsV286880;f.c.drawLingxiaoCourtsV286880=function(...args){draws++;return paint.apply(this,args);};
run("applyWorldMapLayout('north',true);ensureStaticWorldCache()");a.equal(draws,1);
const cache=run('PERF_CONFIG.staticWorldCanvas');for(let i=0;i<120;i++)a.equal(run('ensureStaticWorldCache()'),cache);a.equal(draws,1);
run("applyWorldMapLayout('south',true);ensureStaticWorldCache()");a.equal(draws,1);a.notEqual(run('PERF_CONFIG.staticWorldCanvas'),cache);a.equal(cache.width,1);
run("applyWorldMapLayout('north',true);ensureStaticWorldCache()");a.equal(draws,2);a.equal(run('PERF_CONFIG.staticWorldCanvas.width'),run('FLAT_WORLD.width'));
a.equal(f.errors.length,0);
console.log('PASS nine restrained courts cover eight tiers at expanded coordinates; paths/collisions/access untouched; no gradients or transformed-map slabs; low-detail reduction and one bake per region cache');
