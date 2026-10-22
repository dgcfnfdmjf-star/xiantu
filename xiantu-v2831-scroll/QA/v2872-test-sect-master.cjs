const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),run=s=>f.run(s);
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.c.console.log=()=>{};
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.sect='凌霄宗';player.level=4;player.sectTotalContribution=1000;player.sectContribution=500;player.gold=1000;player.worldTime.totalDays=10;player.sectPromotion={version:1,sect:'凌霄宗',inherited:true,tasksCompleted:5};player.sectData.prosperity=20;discipleRosterV2815().members=[{id:1,name:'青禾',level:3,specialty:0,job:null},{id:2,name:'满级',level:10,specialty:0,job:null},{id:3,name:'忙碌',level:3,specialty:0,job:{type:'train',end:20}}]");f.timers.clear();f.c.confirm=()=>true;}
function act(kind){run('showSectMasterV2872()');return run(`executeSectMasterV2872('${kind}',sectMasterViewV2872?.token)`);}
fresh();a.equal(run('formatSectTaskDesc({desc:"{count}份，再交{count}份",materials:{x:3}})'),'3份，再交3份');
run('player.sectPromotion={inherited:true,tasksCompleted:5};player=normalizePlayer(player)');a.equal(run('player.sectPromotion.sect'),'凌霄宗');a.equal(run('hasRank("宗主")'),true);
run('player.sect="青云宗"');a.equal(run('hasRank("宗主")'),false);a.equal(run('sectMasterRequirementsV2872().promotion.tasksCompleted'),0);
fresh();run('player.sectPromotion.inherited=false');a.equal(run('sectMasterRequirementsV2872().ready'),true);run('player.level=3');a.equal(run('sectMasterRequirementsV2872().ready'),false);a.equal(act('repair'),false);
fresh();run('showSectMasterV2872();globalThis.before=JSON.stringify(player)');f.c.confirm=()=>false;a.equal(run('executeSectMasterV2872("repair",sectMasterViewV2872.token)'),false);a.equal(run('JSON.stringify(player)'),run('before'));
f.c.confirm=()=>true;a.equal(act('repair'),true);a.equal(run('player.sectContribution'),400);a.equal(run('player.gold'),800);a.equal(run('player.sectData.prosperity'),25);a.equal(run('player.sectTotalContribution'),1000);a.equal(act('lesson'),false);
run('saveGame();player=normalizePlayer(loadGame().player)');a.equal(run('sectMasterPlanV2872("repair").wait'),30);run('player.worldTime.totalDays=40');a.equal(act('lesson'),true);a.equal(run('player.sectContribution'),350);a.equal(run('sectMembersReadV2868()[0].level'),4);a.equal(run('sectMembersReadV2868()[1].level'),10);a.equal(run('sectMembersReadV2868()[2].level'),3);
for(const kind of ['repair','lesson']){fresh();run('showSectMasterV2872();globalThis.before=JSON.stringify(player);globalThis.oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("quota")}');a.equal(run(`executeSectMasterV2872('${kind}',sectMasterViewV2872?.token)`),false);run('localStorage.setItem=oldSet');a.equal(run('JSON.stringify(player)'),run('before'));}
for(const state of ['combat','combat-ending']){fresh();run('showSectMasterV2872()');run(`gameState='${state}'`);a.equal(run('executeSectMasterV2872("repair",sectMasterViewV2872.token)'),false);}
fresh();run('player.sectData.prosperity=150');a.equal(act('repair'),false);a.equal(run('player.sectData.prosperity'),150);
fresh();run('player.sectContribution=0');a.equal(act('lesson'),false);
fresh();run('showSectMasterV2872();globalThis.oldToken=sectMasterViewV2872.token;player={...player}');a.equal(run('executeSectMasterV2872("repair",oldToken)'),false);
fresh();f.c.confirm=()=>{run('sectMembersReadV2868()[0].job={type:"train",end:30}');return true};a.equal(act('lesson'),false);a.equal(run('player.sectContribution'),500);
fresh();run('player.sectPromotion.inherited=false;player.sectTotalContribution=0;showSectHall()');a(!f.ids.get('storyText').innerHTML.includes('宗主传承考核'));a(!f.ids.get('storyText').innerHTML.includes('undefined'));
console.log('PASS scoped legacy promotion, shared gates, all placeholders, rank-only council, costs/cap, idle-only training, shared persisted cooldown, stale/blocked/cancel/quota rollback');
