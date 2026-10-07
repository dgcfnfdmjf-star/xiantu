const fs=require('fs'),a=require('node:assert/strict'),root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const fixture=require('./v2858-dom-fixture.cjs');
function game(){const f=fixture(root);for(const s of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(s);f.run("startGame();closeWorldOverlay();player.sect='凌霄宗';player.sectTotalContribution=600;player.level=4;var roster=discipleRosterV2815();roster.members=[{id:1,name:'甲',level:6,specialty:0,job:null}];var d=roster.members[0];");return f;}
const f=game();
const before=f.run('JSON.stringify(player)');f.run('lifeReadV2868(d);sectTodoReadV2868();syncSectTodoV2868();showDiscipleLifeV2868(1)');a.equal(f.run('JSON.stringify(player)'),before);
// Real rescue choice -> saved pending thanks -> claim exactly once.
f.run("d.job=discipleNewJobV2867(d,disciplePlanV2824(d,0,1));d.job.eventV2867.kind=0;player.worldTime.totalDays=d.job.eventV2867.at;showDiscipleEventV2867(1);resolveDiscipleEventV2867(1,d.job.eventV2867.id,1)");
a.equal(f.run('lifeReadV2868(d).counts.rescue'),1);a.equal(f.run('lifeReadV2868(d).thanks.state'),'waiting');
f.run('showDiscipleLifeV2868(1);var inv=player.inventory.length;claimDiscipleThanksV2868(1)');a.equal(f.run('player.inventory.length'),f.run('inv'));
f.run('player.worldTime.totalDays+=3;syncSectTodoV2868()');a.equal(f.run('sectTodoReadV2868().thanks.length'),1);
f.run('showSectTodoV2868()');a.match(f.ids.get('storyText').innerHTML,/同门答谢已到/);
f.run('showDiscipleLifeV2868(1);claimDiscipleThanksV2868(1);claimDiscipleThanksV2868(1)');a.equal(f.run('player.inventory.length'),f.run('inv+2'));a.equal(f.run('lifeReadV2868(d).thanks.state'),'done');a.equal(f.run('sectTodoReadV2868().thanks.length'),0);
// Exploration grants once-only follow-up; busy character cannot start.
f.run("d.job=discipleNewJobV2867(d,disciplePlanV2824(d,0,1));d.job.eventV2867.kind=1;player.worldTime.totalDays=d.job.eventV2867.at;showDiscipleEventV2867(1);resolveDiscipleEventV2867(1,d.job.eventV2867.id,1);showDiscipleLifeV2868(1);startDiscipleTrailV2868(1)");a.equal(f.run('lifeReadV2868(d).trail.state'),'ready');a.equal(f.run('sectTodoReadV2868().trails.length'),0);
f.run('player.worldTime.totalDays=d.job.end;claimDiscipleV2815(1)');a.equal(f.run('sectTodoReadV2868().trails.length'),1);
f.run('showDiscipleLifeV2868(1);startDiscipleTrailV2868(1);var end=d.job.end;startDiscipleTrailV2868(1)');a.equal(f.run('d.job.end'),f.run('end'));a(f.run('d.job.followupV2868'));a.equal(f.run('d.job.eventV2867'),undefined);
f.run('var paid=player.gold;player.worldTime.totalDays=d.job.end;claimDiscipleV2815(1);claimDiscipleV2815(1)');a.equal(f.run('player.gold-paid'),240);a.equal(f.run('lifeReadV2868(d).trail.state'),'done');
f.run("lifeEventV2868(d,{kind:0},1);lifeEventV2868(d,{kind:1},1)");a.equal(f.run('lifeReadV2868(d).thanks.state'),'done');a.equal(f.run('lifeReadV2868(d).trail.state'),'done');
// Real training settlement records and title; history is bounded.
for(let i=0;i<3;i++)f.run("d.job={type:'train',end:discipleDayV2815()};claimDiscipleV2815(1)");a(f.run("lifeTitlesV2868(d).includes('笃学之士')"));
f.run("for(let i=0;i<100;i++)lifeAddV2868(d,'safe')");a.equal(f.run('d.lifeV2868.history.length'),12);
const archive=f.run('JSON.stringify(d.lifeV2868)');f.run('player=normalizePlayer(JSON.parse(JSON.stringify(player)));d=discipleRosterV2815().members[0]');a.equal(f.run('JSON.stringify(d.lifeV2868)'),archive);
// Complete all material requirements; no misleading ready badge.
f.run("player.sectTasks=[{completed:false,template:{type:'collect',materials:{'灵草':1,'仙果':2}}}];player.materials={'灵草':1,'仙果':0}");a.equal(f.run('sectTodoReadV2868().tasks.length'),0);f.run("player.materials['仙果']=2");a.equal(f.run('sectTodoReadV2868().tasks.length'),1);
f.run('player.sectTotalContribution=1000;player.sectPromotion={tasksCompleted:5,inherited:false}');a.equal(f.run('sectTodoReadV2868().promotion'),true);f.run('player.sectPromotion.inherited=true');a.equal(f.run('sectTodoReadV2868().promotion'),false);
// Reading/painting HUD does not write save or add timers.
const unchanged=f.run('JSON.stringify(player)'),timers=f.timers.size;for(let i=0;i<50;i++)f.run('syncSectTodoV2868()');a.equal(f.run('JSON.stringify(player)'),unchanged);a.equal(f.timers.size,timers);a.equal(f.ids.get('sectTodoBtnV2868').textContent,'宗门待办 1');
f.run("player.sect='散修';syncSectTodoV2868()");a.equal(f.ids.get('sectTodoBtnV2868').hidden,true);
const g=game();g.run("d.lifeV2868={counts:{},history:[],thanks:{state:'waiting',due:0},trail:{state:'ready'}};showDiscipleLifeV2868(1)");
for(const state of ['combat','combat-ending']){g.run(`gameState='${state}'`);const p=g.run('JSON.stringify(player)');g.run('claimDiscipleThanksV2868(1);startDiscipleTrailV2868(1);showSectTodoV2868()');a.equal(g.run('JSON.stringify(player)'),p);}
g.run("gameState='exploring';showDiscipleLifeV2868(1);closeWorldOverlay();claimDiscipleThanksV2868(1);startDiscipleTrailV2868(1)");a.equal(g.run('lifeReadV2868(d).thanks.state'),'waiting');a.equal(g.run('d.job'),null);
g.run("showDiscipleLifeV2868(1);player=normalizePlayer(JSON.parse(JSON.stringify(player)));claimDiscipleThanksV2868(1)");a.equal(g.run("lifeReadV2868(discipleRosterV2815().members[0]).thanks.state"),'waiting');
for(const x of [f,g])a.equal(x.errors.length,0,JSON.stringify(x.errors));console.log('PASS life history/titles/bounds; real rescue and exploration chains; one-time gifts and dispatch/claim; save roundtrip; stale page/player and combat guards; all-material readiness; read-only reminder without timers');
const h=game();h.run("d.lifeV2868={thanks:{state:'waiting',due:200001},history:[{type:'rescue',day:200000}]};player.worldTime.totalDays=200000");a.equal(h.run('lifeReadV2868(d).thanks.due'),200001);a.equal(h.run('sectTodoReadV2868().thanks.length'),0);h.run('player.worldTime.totalDays=200001;syncSectTodoV2868()');a.equal(h.run('sectTodoReadV2868().thanks.length'),1);
let draws=0,depth=0;h.c.testCtx={save(){depth++},restore(){depth--},fillRect(){draws++},fillText(){}};const state=h.run('JSON.stringify(player)');h.run("drawSectTodoV2868(testCtx,{action:'sect',r:100})");a.equal(draws,1);h.run("drawSectTodoV2868(testCtx,{action:'faction_gate_v2806',factionName:'其他宗门',r:100})");a.equal(draws,1);a.equal(depth,0);a.equal(h.run('JSON.stringify(player)'),state);console.log('PASS long-lived game dates and own-sect-only read-only map badge');
