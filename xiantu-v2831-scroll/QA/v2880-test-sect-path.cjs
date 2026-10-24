'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),run=s=>f.run(s);
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.c.console.log=()=>{};f.c.confirm=()=>true;
function fresh(master=false){run(`resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.sect='凌霄宗';player.level=4;player.gold=5000;player.sectContribution=2000;player.sectTotalContribution=1200;player.worldTime.totalDays=100;player.sectData.prosperity=20;player.sectPromotion={version:1,sect:'凌霄宗',inherited:${master},tasksCompleted:5};discipleRosterV2815().members=[1,2,3].map(id=>({id,name:'弟子'+id,level:1,specialty:0,job:null}));discipleRosterV2815().nextId=4;`);f.timers.clear();f.c.confirm=()=>true;}
function act(kind,id=''){run('showSectPathV2880()');return run(`executeSectPathV2880('${kind}','${id}',sectPathViewV2880.token)`);}
function admin(kind,id='',member=null){run('showSectAdminV2873()');return run(`executeSectAdminV2873('${kind}','${id}',${member},sectAdminViewV2873.token)`);}
const state=()=>run('JSON.stringify(player)'),day=n=>run(`player.worldTime.totalDays=${n}`);
function finishGate(){a.equal(act('start'),true);a.equal(act('heart','ren'),true);run('player.sectPathV2880.roll=.1');a.equal(act('gate','fight'),true);}
fresh();run("showSectPathV2880()");const original=state();run('showSectPathV2880();sectTodoReadV2868();showSectPathV2880()');a.equal(state(),original,'drawing must not migrate or reward');
a.equal(act('doctrine','jian'),false);a.equal(run('inheritSectV2768()'),true);a.equal(run('player.sectPromotion.inherited'),false,'legacy entry cannot skip trials');
a.equal(act('start'),true);a.equal(act('seal','fallen'),false);a.equal(act('heart','ren'),true);
run('player.sectPathV2880.roll=.99;saveGame();player=normalizePlayer(loadGame().player)');a.equal(run('player.sectPathV2880.roll'),.99);
a.equal(act('gate','array'),true);a.equal(run('player.sectContribution'),1900);a.equal(run('player.sectPathV2880.stage'),2);a.equal(run('player.sectPathV2880.retryDay'),103);a.equal(act('gate','fight'),false);
day(103);run('player.sectPathV2880.roll=.1');a.equal(act('gate','disciples'),true);a.equal(act('seal','fallen'),true);a.equal(run('player.sectContribution'),1900,'legacy reward deferred until final inheritance');
a.equal(act('doctrine','dan'),true);a.equal(run('player.sectPromotion.inherited'),true);a.equal(run('player.sectContribution'),2200);a.equal(run('player.sectTotalContribution'),1500);a.equal(run('player.sectData.prosperity'),17);a(f.ids.has('sectCeremonyV2870'));a.equal(act('doctrine','jian'),false);a.equal(run('loadGame().player.sectPathV2880.doctrine'),'dan');
// Guard every irreversible step with the actual storage path, then retry.
for(const [kind,id,setup] of [['start','',()=>{}],['heart','shou',()=>act('start')],['gate','array',()=>{act('start');act('heart','ren');run('player.sectPathV2880.roll=.1');}],['seal','retire',finishGate],['doctrine','jian',()=>{finishGate();act('seal','retire');}]]){
 fresh();setup();run('showSectPathV2880()');const before=state();run('globalThis.oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("quota")}');a.equal(run(`executeSectPathV2880('${kind}','${id}',sectPathViewV2880.token)`),false,kind);run('localStorage.setItem=oldSet');a.equal(state(),before,kind+' rollback');a.equal(act(kind,id),true,kind+' retry');
}
fresh();run('showSectPathV2880();globalThis.oldToken=sectPathViewV2880.token;showSectPathV2880()');a.equal(run("executeSectPathV2880('start','',oldToken)"),false);
for(const mode of ['combat','combat-ending']){fresh();run(`showSectPathV2880();gameState='${mode}'`);a.equal(run("executeSectPathV2880('start','',sectPathViewV2880.token)"),false);}
fresh();run('showSectPathV2880();player={...player}');a.equal(run("executeSectPathV2880('start','',sectPathViewV2880.token)"),false);
fresh();f.c.confirm=()=>{run('player.sect="青云宗"');return true;};a.equal(act('start'),false);
fresh();act('start');day(99);a.equal(act('heart','jue'),false);day(100);a.equal(act('heart','jue'),true);
fresh();act('start');act('heart','jue');run('discipleRosterV2815().members[0].job={type:"train",end:200}');a.equal(act('gate','disciples'),false,'busy disciples excluded');
// Legacy choices retain costs and bonuses through the real succession path.
for(const [legacy,gold,upkeep] of [['retire',960,184],['seclude',1008,224]]){
 fresh();finishGate();act('seal',legacy);act('doctrine','jian');admin('appoint','hufa',1);admin('start');
 // Sword doctrine adds 10% to three disciples' 84 supply: rounded jointly with other costs.
 a.equal(run('player.sectAdminV2873.quarter.gold'),gold);a.equal(run('player.sectAdminV2873.quarter.upkeep'),upkeep+8);
}
fresh(true);run('discipleRosterV2815().members=Array.from({length:16},(_,i)=>({id:i+1,name:"弟子"+i,level:1,job:null}));showDisciplesV2815()');a(f.ids.get('storyText').innerHTML.includes('名册 16/16'));run('recruitDiscipleV2815(0,discipleRosterV2815().batch)');a.equal(run('sectMembersReadV2868().length'),16);
fresh(true);run('showDisciplesV2815()');f.c.confirm=()=>{run('player.sectPromotion.inherited=false;player.sectTotalContribution=0');return true;};run('recruitDiscipleV2815(0,discipleRosterV2815().batch)');a.equal(run('sectMembersReadV2868().length'),3);

// Existing masters opt in once; locked old quotes must remain old through reload.
fresh(true);a.equal(admin('start'),true);a.equal(run('player.sectAdminV2873.quarter.gold'),120);a.equal(act('doctrine','dan'),true);a.equal(run('player.sectPathV2880.stage'),0);a.equal(run('player.sectAdminV2873.quarter.upkeep'),undefined);
run('saveGame();player=normalizePlayer(loadGame().player)');day(130);a.equal(run('sectTodoReadV2868().income'),true);const economic=()=>run('JSON.stringify([player.gold,player.sectContribution,player.sectTotalContribution,player.sectData.prosperity,player.sectAdminV2873,player.sectPathV2880])');const before=economic();run('showSectTodoV2868();showSectAdminV2873()');a.equal(economic(),before,'opening mature ledger never settles');a.equal(admin('claim'),true);a.equal(run('player.gold'),5120);a.equal(run('player.sectAdminV2873.quarter.economy'),2);a.equal(run('player.sectAdminV2873.quarter.upkeep'),147);a.equal(run('sectTodoReadV2868().income'),false);
// New quotes lock real costs, no free retroactive officer bonuses, no multi-season catch-up.
fresh(true);a.equal(act('doctrine','dan'),true);a.equal(admin('start'),true);a.equal(run('player.sectAdminV2873.quarter.gold'),1104);a.equal(run('player.sectAdminV2873.quarter.upkeep'),144);a.equal(admin('appoint','xianfeng',1),true);
a.equal(run('player.sectAdminV2873.quarter.upkeep'),144);day(400);a.equal(admin('claim'),true);a.equal(run('player.gold'),5960);a.equal(run('player.sectAdminV2873.quarter.due'),430);a.equal(admin('claim'),false);
run('saveGame();player=normalizePlayer(loadGame().player)');a.equal(run('player.sectAdminV2873.ledger.net'),960);
fresh(true);act('doctrine','jian');run('player.sectData.prosperity=0');admin('start');a.equal(run('player.sectAdminV2873.quarter.gold'),720,'zero prosperity uses lower income bound10, not fallback20');day(130);admin('claim');a.equal(run('player.sectData.prosperity'),1,'zero prosperity grows from actual zero');
// All legal money formulas; actual available gold determines arrears, rollback preserves quote.
for(const [doctrine,income,upkeep] of [['jian',960,152],['dan',1104,144],['zhen',960,126]]){
 fresh(true);act('doctrine',doctrine);admin('start');a.equal(run('player.sectAdminV2873.quarter.gold'),income);a.equal(run('player.sectAdminV2873.quarter.upkeep'),upkeep);
}
fresh(true);act('doctrine','jian');run('discipleRosterV2815().members=Array.from({length:40},(_,i)=>({id:i+1,name:"旧弟子"+i,level:1,job:null}))');admin('start');day(130);run('player.gold=100');const q=run('JSON.stringify(player.sectAdminV2873.quarter)');const snap=state();run('globalThis.oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("quota")}');a.equal(admin('claim'),false);run('localStorage.setItem=oldSet');a.equal(state(),snap);
a.equal(admin('claim'),true);a.equal(run('player.gold'),0);a.equal(run('player.sectData.prosperity'),19);a.equal(run('player.sectAdminV2873.ledger.arrears'),true);a.equal(run('player.sectAdminV2873.ledger.net'),-100);
// Cap applied at recruitment, visible in overview, old members never truncated.
fresh(true);run('discipleRosterV2815().members=Array.from({length:12},(_,i)=>({id:i+1,name:"弟子"+i,level:1,job:null}));discipleRosterV2815().nextId=13;recruitDiscipleV2815(0,discipleRosterV2815().batch)');a.equal(run('sectMembersReadV2868().length'),13);run('showSectOverviewV2866()');a(f.ids.get('storyText').innerHTML.includes('13/16'));
run('player.sectPromotion.inherited=false');a.equal(run('sectMembersReadV2868().length'),13);run('recruitDiscipleV2815(1,discipleRosterV2815().batch)');a.equal(run('sectMembersReadV2868().length'),13);
fresh(true);const pre=state();run('globalThis.oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("quota")};recruitDiscipleV2815(0,discipleRosterV2815().batch);localStorage.setItem=oldSet');a.equal(state(),pre,'recruit rollback');
// Power applies only to own current sect; started campaigns lock the computed value.
fresh(true);const enemy=run('Object.keys(DEMON_FACTION_POWER)[0]'),foe=run(`calculateSectPower('${enemy}').total`),base=run('calculateSectPower(player.sect).total');act('doctrine','jian');admin('appoint','xianfeng',1);
a.equal(run('calculateSectPower(player.sect).total'),Math.round(base*1.13));a.equal(run(`calculateSectPower('${enemy}').total`),foe);
run(`warStateV2839().incomingV2839={enemy:'${enemy}'};executeWar('${enemy}')`);const locked=run('player.warState.campaignV2775.our');a.equal(locked,Math.round(base*1.13));
run('discipleRosterV2815().members.shift()');a.equal(run('player.warState.campaignV2775.our'),locked,'campaign snapshot remains immutable');a.equal(run('sectPathPowerV2880()'),1.08);
run("player.sect='青云宗'");a.equal(run('sectPathPowerV2880()'),1);run('player=normalizePlayer(player)');a.equal(run('player.sectPathV2880.doctrine'),null);
// Normalization rejects malformed and cross-sect fields and is idempotent.
fresh();run("player.sectPathV2880={sect:'凌霄宗',stage:99,virtue:'bad',doctrine:'bad',fails:Infinity,retryDay:-1};player=normalizePlayer(player)");const norm=run('JSON.stringify(player.sectPathV2880)');run('player=normalizePlayer(player)');a.equal(run('JSON.stringify(player.sectPathV2880)'),norm);a.equal(run('player.sectPathV2880.stage'),1);
a(f.errors.every(e=>e[0]==='保存失败:'),JSON.stringify(f.errors));
console.log('PASS real trial/old-master flows, saved rolls/retry/one-time inheritance, stale/rollback guards, immutable old quotes, doctrine economy/upkeep/arrears, cap/roster/recruit safety, own-sect power and migration');
