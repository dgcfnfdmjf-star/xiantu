'use strict';
// V28.68.119 alchemy show (audit A4): cosmetic only. One pill per pill made (max 10), grey smoke on failures,
// 紫霄丹雷 on a full-success x10 or a level-up, fixed resource pools, jade/gold controls, unchanged economy and save.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const stageSrc=fs.readFileSync(root+'/xiantu-v2868110-alchemy-stage.js','utf8'),css=fs.readFileSync(root+'/xiantu-v2762.css','utf8'),html=fs.readFileSync(root+'/game-v2762.html','utf8');

// 1. What the stage shows is derived only from the committed result.
{const f=require('./v2858-dom-fixture.cjs')(root);f.c.document.head={appendChild(){}};f.load('xiantu-v2868110-alchemy-stage.js');
 const api=f.c.XiantuAlchemyStageV2868110,show=r=>({...api.planShow(r)});
 a.equal(api.maxPills,10);
 a.deepEqual(show({attempted:1,success:1,pills:1}),{pills:1,total:1,smoke:0,thunder:false});
 a.deepEqual(show({attempted:5,success:5,pills:5}),{pills:5,total:5,smoke:0,thunder:false});
 a.deepEqual(show({attempted:10,success:10,pills:10}),{pills:10,total:10,smoke:0,thunder:true},'full-success x10 strikes 紫霄丹雷');
 a.deepEqual(show({attempted:5,success:3,pills:3}),{pills:3,total:3,smoke:.4,thunder:false},'partial batch: 3 pills and grey smoke');
 a.deepEqual(show({attempted:5,success:0,pills:0}),{pills:0,total:0,smoke:1,thunder:false},'all-fail: no pills, grey smoke');
 a.equal(show({attempted:10,success:9,pills:9}).thunder,false);a.equal(show({attempted:10,success:9,pills:9}).smoke,.35,'one failed furnace still puffs visibly');
 a.deepEqual(show({attempted:10,success:10,pills:17}),{pills:10,total:17,smoke:0,thunder:true},'武火 bonus pills cap the pool at 10');
 a.equal(show({attempted:1,success:1,pills:1,levelUp:true}).thunder,true,'alchemy level-up strikes 紫霄丹雷');
 a.equal(show({attempted:2,success:2}).pills,2,'older results without pills fall back to success');
 for(const bad of [null,undefined,{},{attempted:-1,success:'5',pills:NaN},{attempted:3,success:9,pills:-4}]){const s=show(bad);a.ok(s.pills>=0&&s.pills<=10&&!s.thunder&&s.smoke<=1,JSON.stringify(bad));}
}

// 2. Fixed resource count: every pool is allocated at mount; update/tick/play create no three.js objects.
{const body=stageSrc.slice(stageSrc.indexOf(' function update('),stageSrc.indexOf(' return {play,dispose}'));
 a.ok(body.length>500);a.doesNotMatch(body,/new THREE\./,'no per-frame three.js allocation');a.doesNotMatch(body,/new (Float32Array|Array)\(/);
 a.match(stageSrc,/new THREE\.InstancedMesh\([^;]*MAX_PILLS\)/,'pills are one instanced pool');
 a.match(stageSrc,/for\(let b=0;b<BOLTS;b\+\+\)/);a.match(stageSrc,/BOLTS=3/);
 a.match(stageSrc,/function displace\(/,'bolts use midpoint displacement');
 a.match(stageSrc,/delete host\.dataset\.pillsShown/,'dispose clears stage state for the static fallback');
 a.doesNotMatch(stageSrc,/localStorage|saveGame|player\.|craftPill|Math\.random\(/,'stage never touches saves, player state or the economy RNG');}

// 3. Core passes pills and level-up to the stage after the durable commit, without changing outcomes or the save.
{const f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};f.c.console.warn=()=>{};for(const file of files)f.load(file);
 const setup=(level,exp,rnd)=>{f.run(`resetRuntimeState();player=createDefaultPlayer();initAchievements();gameState='alchemy';player.materials={'灵草':1000,'仙果':1000};player.inventory=[];player.alchemyCount=0;player.alchemyLevel=${level};player.alchemyExp=${exp};Math.random=()=>${rnd};document.getElementById('alchemyPanel').classList.remove('hidden');globalThis.played=[];ALCHEMY_STAGE_V2868110.instance={play:r=>played.push(r),dispose(){}};`);};
 const last=()=>JSON.parse(f.run('JSON.stringify(played.at(-1))'));
 setup(5,0,.1);const r10=f.run("craftPill('小还丹',10)");a.equal(r10.pills,10);let d=last();a.equal(d.pills,10);a.equal(d.attempted,10);a.equal(d.success,10);a.equal(d.levelUp,false);
 a.equal(f.run('ALCHEMY_STAGE_V2868110.levelUp'),false,'presentation consumes the transient flag');
 const before=f.run('JSON.stringify({l:player.alchemyLevel,e:player.alchemyExp,c:player.alchemyCount,m:player.materials,i:player.inventory.length})');
 setup(1,40,.1);f.run("craftPill('小还丹',1)");d=last();a.equal(d.levelUp,true,'Lv1 at 40 exp + 10 reaches Lv2');a.equal(f.run('player.alchemyLevel'),2);
 setup(1,0,.99);f.run("craftPill('小还丹',5)");d=last();a.deepEqual([d.attempted,d.success,d.pills,d.levelUp],[5,0,0,false]);
 setup(5,0,.1);f.run("craftPill('小还丹',10)");a.equal(f.run('JSON.stringify({l:player.alchemyLevel,e:player.alchemyExp,c:player.alchemyCount,m:player.materials,i:player.inventory.length})'),before,'identical rolls give identical results');
 const keys=f.run('Object.keys(player).sort().join()');f.run('saveGame()');const saved=JSON.parse(f.storage.get('xiantu_save'));a.equal(Object.keys(saved.player).sort().join(),keys);a.doesNotMatch(JSON.stringify(saved),/"levelUp"|pillsShown|"smoke"/,'display data never reaches the save');
 // Stale owner or hidden panel: nothing is presented (existing guards still apply to the new data).
 f.run("globalThis.old=player;player=createDefaultPlayer();alchemyResultV2868110(old,'小还丹',1,1,1)");a.equal(f.run('played.length'),1);
 // Effects off and reduced motion keep the static furnace (no stage is mounted).
 f.run("localStorage.setItem('xiantu_map_fx_v2868104','off')");a.equal(f.run('alchemyStageAllowedV2868110()'),false);f.run("localStorage.removeItem('xiantu_map_fx_v2868104')");
 f.c.matchMedia=()=>({matches:true,addEventListener(){}});a.equal(f.run('alchemyStageAllowedV2868110()'),false);f.c.matchMedia=()=>({matches:false,addEventListener(){}});
 // Recipe controls carry classes, not neon inline colours.
 setup(1,0,.1);f.run("player.materials={'灵草':3};updateAlchemyPanel()");const list=f.run("document.getElementById('recipeList').innerHTML");
 a.doesNotMatch(list,/#69f0ae|#ff6b6b|opacity:\.62/);a.match(list,/alchemy-have-v2868119 ok">灵草x2\(3\)/);a.match(list,/alchemy-have-v2868119 short">灵草x8\(3\)/);a.match(list,/aria-pressed="true"[^>]*>稳火/);}

// 4. 青绿鎏金 restyle uses the shared tokens and respects reduced motion; static SVG fallback remains.
{const block=css.slice(css.indexOf('V28.68.119 alchemy show'));a.ok(block.length>200);
 for(const sel of ['#alchemyPanel .craft-btn','#alchemyPanel .recipe-item','#alchemyPanel .material-tag','.alchemy-fire-v2868112 .craft-btn[aria-pressed="true"]','#alchemyPanel .alchemy-have-v2868119.short'])a.ok(block.includes(sel),sel);
 a.match(block,/var\(--xt-fill-gold/);a.match(block,/var\(--xt-fill-jade/);a.match(block,/var\(--xt-gold-700/);a.doesNotMatch(block,/#8B4513|#CD853F|#00ff00|#ff00ff/i);
 a.match(block,/html\.xt-reduce-motion #alchemyPanel \.craft-btn\{transition:none\}/);a.match(block,/prefers-reduced-motion:reduce/);
 a.match(html,/<svg class="alchemy-still-v110"/);}
console.log('PASS alchemy show: pills shown = pills made (x1/x5/x10/partial/all-fail, cap 10), grey smoke, 紫霄丹雷 on full x10 or level-up, fixed pools, no save fields, static fallback, jade/gold controls');
