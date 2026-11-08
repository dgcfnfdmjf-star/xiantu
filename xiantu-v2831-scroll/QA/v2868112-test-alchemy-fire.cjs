'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function setup(sequence=[.5]){const f=require('./v2858-dom-fixture.cjs')(root);for(const file of files)f.load(file);f.run("startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();gameState='alchemy';player.alchemyLevel=1;player.alchemyExp=0;player.alchemyCount=0;player.materials={'灵草':1000,'仙果':1000};player.inventory=[];updateStats=()=>{};showFloatingText=()=>{};playSound=()=>{};autoSave=()=>{};alchemyResultV2868110=(...args)=>{globalThis.fireResult=args;};");let calls=0;f.c.Math=Object.create(Math);f.c.Math.random=()=>sequence[calls++%sequence.length];return {...f,calls:()=>calls};}
const state=f=>f.run('JSON.stringify({m:player.materials,i:player.inventory,c:player.alchemyCount,l:player.alchemyLevel,e:player.alchemyExp})');

// Skipping the choice, or naming the default, matches the original single-roll rule exactly.
for(const count of [1,5,10]){
 const seq=[.2,.95,.4,.99,.1],base=setup(seq),named=setup(seq);
 const r1=base.run(`craftPill('小还丹',${count})`),r2=named.run(`craftPill('小还丹',${count},'steady')`);
 a.equal(state(base),state(named));a.equal(base.calls(),count);a.equal(named.calls(),count);a.equal(r1.pills,r1.success);a.equal(r2.pills,r2.success);
}

// Default rate at the boundary: 小还丹 Lv1 is exactly .9.
{const hit=setup([.8999]),miss=setup([.9]);a.equal(hit.run("craftPill('小还丹',1).success"),1);a.equal(miss.run("craftPill('小还丹',1).success"),0);}

// Gentle: more material per furnace, +12 points, 15 exp, no bonus roll.
{const f=setup([.85]);const r=f.run("craftPill('养元丹',1,'gentle')");a.equal(r.success,1);a.equal(r.pills,1);a.equal(f.calls(),1);a.equal(f.run("player.materials['灵草']"),990);a.equal(f.run("player.materials['仙果']"),996);a.equal(f.run('player.alchemyExp'),15);
 const m=setup([.97]);a.equal(m.run("craftPill('养元丹',1,'gentle').success"),0);a.equal(m.run('player.alchemyExp'),0);
 a.equal(f.run("alchemyFireRateV2868112(RECIPES['小还丹'],'gentle',30)"),1);
 const short=setup([.1]);short.run("player.materials={'灵草':2}");a.equal(short.run("craftPill('小还丹',1,'gentle')"),false);a.equal(short.calls(),0);a.equal(short.run("player.materials['灵草']"),2);a.equal(short.run("craftPill('小还丹',1)").success,1);
 const partial=setup([.1]);partial.run("player.materials={'灵草':7}");a.equal(partial.run("craftPill('小还丹',5,'gentle').attempted"),2);a.equal(partial.run("player.materials['灵草']"),1);}

// Fierce: lower rate, bonus only after success, and one exp award per furnace.
{const miss=setup([.68]);a.equal(miss.run("craftPill('小还丹',1,'fierce').success"),0);a.equal(miss.calls(),1);a.equal(miss.run('player.inventory.length'),0);
 const one=setup([.67,.34]);a.deepEqual({...one.run("craftPill('小还丹',1,'fierce')")},{attempted:1,success:1,pills:1});a.equal(one.calls(),2);a.equal(one.run('player.alchemyExp'),10);
 const two=setup([.67,.33]);a.deepEqual({...two.run("craftPill('小还丹',1,'fierce')")},{attempted:1,success:1,pills:2});a.equal(two.run('player.inventory.length'),2);a.equal(two.run('player.alchemyExp'),10);a.equal(two.run('player.alchemyCount'),1);a.deepEqual([...two.run('fireResult')].slice(1),['小还丹',1,1,2]);
 const cap=setup([.1]);cap.run("player.inventory=Array(99999).fill('小还丹')");cap.run("craftPill('小还丹',1,'fierce')");a.equal(cap.run('player.inventory.length'),100000);a.equal(cap.calls(),1);
 const life=setup([.1]);const before=state(life);a.equal(life.run("craftPill('养元丹',1,'fierce')"),false);a.equal(state(life),before);a.equal(life.calls(),0);a.match(life.run("getAlchemyPlanV286850('养元丹',1,'fierce').reason"),/武火/);}

// Economy bound for every shipped recipe and level, on real runtime data.
{const f=setup(),rows=f.run(`Object.entries(RECIPES).map(([name,r])=>[name,r.baseSuccess,r.alchemyLevelRequired,Object.values(r.materials)])`);a.ok(rows.length>=12);
 for(const [name,,req,needs] of rows)for(let lv=req;lv<=30;lv++){
  const rate=fire=>f.run(`alchemyFireRateV2868112(RECIPES[${JSON.stringify(name)}],'${fire}',${lv})`),s=rate('steady'),g=rate('gentle'),h=rate('fierce');
  a.ok(g>=s&&h<=s,name);a.ok(Math.abs(h*(1+1/3)-s)<1e-12,name+' fierce EV');
  for(const need of needs){const cost=f.run(`alchemyFireCostV2868112(${need},'gentle')`);a.ok(g/cost<=s/need+1e-12,`${name} Lv${lv} gentle output per material`);}
 }}
{const seq=[];let x=20261107;for(let i=0;i<40000;i++){x=(x*48271)%2147483647;seq.push(x/2147483647);}
 const out=fire=>{const f=setup(seq);let pills=0;for(let i=0;i<4000;i++){f.run("player.alchemyLevel=1;player.alchemyExp=0;player.materials={'灵草':1000};player.inventory=[]");pills+=f.run(`craftPill('小还丹',1,'${fire}').pills`);}return pills/4000;};
 a.ok(Math.abs(out('fierce')-.9)<.03);a.ok(Math.abs(out('steady')-.9)<.03);}

// Invalid input and existing guards leave state untouched; no field reaches the save.
for(const fire of ['','wu','__proto__','constructor',null,1]){const f=setup(),before=state(f);f.c.badFire=fire;a.equal(f.run("craftPill('小还丹',1,badFire)"),false);a.equal(state(f),before);a.equal(f.run('setAlchemyFireV2868112(badFire)'),false);a.equal(f.run('alchemyFireV2868112'),'steady');}
for(const st of ['combat','combat-ending','start']){const f=setup();f.run(`gameState='${st}'`);a.equal(f.run("craftPill('小还丹',1,'fierce')"),false);a.equal(f.calls(),0);}
{const f=setup();const keys=f.run('Object.keys(player).sort().join()');f.run("setAlchemyFireV2868112('gentle');craftPill('小还丹',1,'gentle')");a.equal(f.run('Object.keys(player).sort().join()'),keys);a.doesNotMatch(f.run('JSON.stringify(player)'),/alchemyFire|gentle|fierce/);
 // A pre-feature save has this same shape: it normalizes unchanged and opens on the default fire.
 a.equal(f.run("(()=>{const raw=JSON.parse(JSON.stringify(player));raw.materials={'灵草':2};player=normalizePlayer(raw);return getAlchemyPlanV286850('小还丹',1).count;})()"),1);a.equal(f.run("player.alchemyExp"),15);}

// Panel shows the chosen fire, passes it on, and always reopens on the default.
{const f=setup();f.run('updateAlchemyPanel()');const html=()=>f.run("document.getElementById('recipeList').innerHTML");
 a.match(html(),/craftPill\('小还丹',1,'steady'\)/);a.match(html(),/成功率: 90%/);a.match(html(),/aria-pressed="true"[^>]*>稳火/);
 f.run("setAlchemyFireV2868112('gentle')");a.match(html(),/craftPill\('小还丹',5,'gentle'\)/);a.match(html(),/灵草x3/);a.match(html(),/成功率: 100%/);
 f.run("setAlchemyFireV2868112('fierce')");a.match(html(),/成功率: 67%/);a.match(html(),/craftPill\('养元丹',1,'fierce'\)" disabled/);
 f.run("alchemyStageOpenV2868110=()=>{};showAlchemy()");a.equal(f.run('alchemyFireV2868112'),'steady');a.match(html(),/craftPill\('小还丹',1,'steady'\)/);}
console.log('PASS alchemy fire: default parity, gentle/fierce rules, per-material bounds on all recipes, lifetime and inventory caps, invalid input, no new save fields, panel reset');
