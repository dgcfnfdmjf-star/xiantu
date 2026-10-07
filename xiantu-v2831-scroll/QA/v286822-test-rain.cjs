'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
function game(){const f=fixture(root);f.c.console.log=()=>{};f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);f.run('startGame();closeWorldOverlay();player.level=2');f.timers.clear();return f;}
function act(f,id){return f.run(`actRainV286822(rainViewV286822.token,${JSON.stringify(id)})`);}
function win(f){f.run("currentEnemy.hp=0;finishRainBattleV286822(currentEnemy);gameState='exploring';COMBAT_FINISH_V2764.settling=false;battleCheckpointV286812=null;showRainChapterV286822()");f.timers.clear();}
for(const route of ['rescue','chase'])for(const trust of ['share','reserve'])for(const policy of ['public','protect','trace']){
 const f=game();f.run('showRainChapterV286822()');const gold=f.run('player.gold');
 const token=f.run('rainViewV286822.token');a.equal(act(f,'next'),true);a.equal(f.run(`actRainV286822(${token},'next')`),false);
 a.equal(act(f,'next'),false);act(f,'rope');act(f,'lamp');act(f,'next');act(f,route);act(f,'next');
 a.equal(f.run('rainStateV286822().step'),4);act(f,'rest');a.equal(act(f,'rest'),false);a.equal(act(f,'fight'),true);
 if(route==='rescue')a.equal(f.run('elementGuardsV286818.get(currentEnemy).pool'),f.run('Math.floor(getMaxHp()*.15)'));
 else a(f.run('currentEnemy.atk')<32);
 // A loss or stale unrelated battle cannot advance this step.
 f.run('finishRainBattleV286822({...currentEnemy,hp:0})');a.equal(f.run('rainStateV286822().step'),4);win(f);
 act(f,'print');act(f,'next');act(f,trust);a.equal(act(f,'fraud'),false);
 for(const key of ['ledger','seal','witness'])act(f,key);a.equal(act(f,'theft'),false);act(f,'fraud');act(f,route==='rescue'?'names':'force');
 act(f,'fight');if(route==='rescue')a.equal(f.run('currentEnemy.def'),4);else a.equal(f.run('currentEnemy.def'),6);
 win(f);act(f,'next');act(f,policy);act(f,'next');a.equal(f.run('rainStateV286822().step'),13);a.equal(f.run('player.gold'),gold+120);
 const saved=f.run('JSON.stringify(player)');f.run('showRainChapterV286822(2)');a.equal(act(f,'chase'),false);f.run('showRainChapterV286822()');a.equal(act(f,'next'),false);a.equal(f.run('JSON.stringify(player)'),saved);
 a.match(f.run('rainSummaryV286822()'),route==='rescue'?/沈禾/:/暗号/);
}
console.log('PASS 12 narrative branches, evidence gates and catch-up, puzzle choices, branch battle aid, foreign battle guard, one-time reward and read-only replay');
const f=game();f.run('showRainChapterV286822()');const before=f.run('JSON.stringify(player)'),write=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(act(f,'next'),false);a.equal(f.run('JSON.stringify(player)'),before);f.c.localStorage.setItem=write;a.equal(act(f,'next'),true);
a.equal(f.run('isWorldOverlayOpen()'),true);f.run('rainCloseV286822()');a.equal(f.run("actRainV286822(1,'next')"),false);
f.run('showRainChapterV286822();player={...player}');a.equal(act(f,'rope'),false);
f.run('showTaskPanel()');a.match(f.ids.get('taskListContainer').innerHTML,/雨夜命牌案/);
f.run('player=createDefaultPlayer();gameState="exploring"');a.equal(f.run('rainUnlockedV286822()'),false);
f.run('player.firstJourneyV28687={step:4}');a.equal(f.run('rainUnlockedV286822()'),true);
console.log('PASS save failure rollback/retry, old-owner and closed-view guards, main task entry, early letter gate and advanced-save access');
f.run("player.rainChapterV286822={step:12,route:'chase',trust:'reserve',policy:'trace'};showRainChapterV286822()");
const assets=f.run('JSON.stringify([player.gold,player.rainChapterV286822])');f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(act(f,'next'),false);a.equal(f.run('JSON.stringify([player.gold,player.rainChapterV286822])'),assets);
f.c.localStorage.setItem=write;a.equal(act(f,'next'),true);a.equal(act(f,'next'),false);a.equal(f.run('rainStateV286822().rewarded'),true);
f.run("player.rainChapterV286822={step:4,route:'rescue'};player.hp=1;player.mp=0;showRainChapterV286822()");f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(act(f,'rest'),false);a.equal(f.run('player.hp'),1);a.equal(f.run('rainStateV286822().rested.length'),0);f.c.localStorage.setItem=write;
console.log('PASS completion reward and one-time rest roll back on storage failure without consuming retry');
