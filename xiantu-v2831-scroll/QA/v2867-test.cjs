const fs=require('fs'),a=require('node:assert/strict'),root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root);
for(const s of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(s);
f.run("startGame();closeWorldOverlay();player.sect='凌霄宗';player.sectTotalContribution=600;player.level=4;player.gold=10000;var roster=discipleRosterV2815();roster.members=[{id:1,name:'测试弟子',level:6,specialty:0,job:null}];var d=roster.members[0];");
const original=f.run('JSON.stringify(d)');f.run('discipleTraitsV2867(d);discipleTraitsV2867(d)');a.equal(f.run('JSON.stringify(d)'),original);
f.run('d.traitsV2867={aptitude:2,personality:2,loyalty:80}');a.equal(f.run('discipleTrainDaysV2867(d)'),2);
f.run("assignDiscipleV2815(1,'train')");a.equal(f.run('d.job.end-discipleDayV2815()'),2);
f.run('d.job=null;showDiscipleBatchV2866(1);confirmDiscipleBatchV2866(discipleBatchV2866.token)');a(f.run('!!d.job.eventV2867'));
for(let kind=0;kind<3;kind++)for(const choice of [0,1]){
 f.run(`d.job=discipleNewJobV2867(d,disciplePlanV2824(d,0,1));d.job.eventV2867.kind=${kind};player.worldTime.totalDays=d.job.eventV2867.at;showDiscipleEventV2867(1);var eid=d.job.eventV2867.id;var oldEnd=d.job.end;var oldGold=d.job.gold;`);
 f.run(`resolveDiscipleEventV2867(1,eid,${choice})`);a(f.run('d.job.eventV2867.resolved'));
 if(!choice){a.equal(f.run('d.job.end'),f.run('oldEnd'));a.equal(f.run('d.job.gold'),f.run('oldGold'));}
 if(choice&&kind===0)a.equal(f.run('d.job.end'),f.run('oldEnd+1'));
 if(choice&&kind===1)a.equal(f.run('d.job.gold'),f.run('Math.floor(oldGold*1.25)'));
 if(choice&&kind===2){a.equal(f.run('d.job.end'),f.run('discipleDayV2815()'));a.equal(f.run('d.job.count'),0);}
 const once=f.run('JSON.stringify(d)');f.run(`resolveDiscipleEventV2867(1,eid,${choice})`);a.equal(f.run('JSON.stringify(d)'),once);
}
f.run('d.job=discipleNewJobV2867(d,disciplePlanV2824(d,0));player.worldTime.totalDays=d.job.eventV2867.at;showDiscipleEventV2867(1);var eid=d.job.eventV2867.id;closeWorldOverlay();resolveDiscipleEventV2867(1,eid,1)');a.equal(f.run('d.job.eventV2867.resolved'),false);
f.run('player.worldTime.totalDays=d.job.end;claimDiscipleV2815(1)');a.equal(f.run('d.job'),null);
f.run("d.job={type:'mission',name:'旧版事务',end:discipleDayV2815(),gold:111,material:'灵草',count:2};var beforeGold=player.gold;claimDiscipleV2815(1)");a.equal(f.run('player.gold-beforeGold'),111);
// Real entry cost and one-time route selection.
f.run('player.sectData.miniRealmV2778=null;player.buildingReadyDaysV2768={};var entryGold=player.gold;enterMiniRealmV2778()');a.equal(f.run('miniRunV2778().routeV2867'),null);a.equal(f.run('entryGold-player.gold'),30);
f.run('var runId=miniRunV2778().id;selectMiniRouteV2867(runId,1);selectMiniRouteV2867(runId,2)');a.equal(f.run('miniRunV2778().routeV2867'),1);
for(let route=0;route<3;route++){
 f.run(`player.sectData.miniRealmV2778={id:100+${route},step:0,herbs:0,fruit:0,insight:0,enemy:null,routeV2867:${route}};miniClickAtV2778=0;chooseMiniRealmV2778('herb',0,100+${route});`);
 a.equal(f.run('miniRunV2778().herbs'),4);a.equal(f.run('miniRunV2778().insight'),route===1?80:0);
 f.run(`player.inventory.push('小还丹');var pills=player.inventory.filter(n=>n==='小还丹').length;miniClickAtV2778=0;chooseMiniRealmV2778('rescue',1,100+${route});`);a.equal(f.run("player.inventory.filter(n=>n==='小还丹').length"),f.run('pills-1'));
 f.run('var lootGold=player.gold;finishMiniRealmV2778("safe")');a.equal(f.run('player.gold-lootGold'),Math.floor(240*[1,1.15,1.5][route]));const paid=f.run('player.gold');f.run('finishMiniRealmV2778("safe")');a.equal(f.run('player.gold'),paid);
}
f.run("player.sectData.miniRealmV2778={id:200,step:2,herbs:4,fruit:0,insight:0,routeV2867:2};miniClickAtV2778=0;chooseMiniRealmV2778('challenge',2,200);var expected=miniRunV2778().enemy.maxHp;player.hp=getMaxHp();miniClickAtV2778=0;chooseMiniRealmV2778('fight',3,200)");a.equal(f.run('gameState'),'combat');a(f.run('currentEnemy.maxHp>=expected'));
f.run("miniBattleResultV2778(currentEnemy,true);gameState='exploring';finishMiniRealmV2778('clear')");a.equal(f.run('miniRunV2778()'),null);a(f.run('player.sectData.miniFirstV2778'));
f.run("player.sectData.miniRealmV2778={id:201,step:1,herbs:4,fruit:0,insight:0};var legacy=miniRouteV2867(miniRunV2778()).reward");a.equal(f.run('legacy'),1);
for(const state of ['combat','combat-ending']){f.run(`gameState='${state}'`);const stateBefore=f.run('JSON.stringify(player)');f.run('finishMiniRealmV2778("leave");enterMiniRealmV2778();showMiniRealmV2778();selectMiniRouteV2867(201,2)');a.equal(f.run('JSON.stringify(player)'),stateBefore);}
f.run("gameState='exploring';var normalized=normalizePlayer(JSON.parse(JSON.stringify(player)))");a.equal(f.run('JSON.stringify(normalized.sectData.managementV2815)'),f.run('JSON.stringify(player.sectData.managementV2815)'));a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS traits/training, batch event assignment, six event choices, duplicate/stale guards, ignored/legacy jobs, real entry, 3 routes, rescue cost, single reward, guarded battle, legacy route and save roundtrip');
