'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root);f.c.console.log=()=>{};for(const file of files)f.load(file);
const run=s=>f.run(s),save=f.c.saveGame,json=()=>run('JSON.stringify(player)');
function fresh(master=false){f.c.saveGame=save;f.c.confirm=()=>true;run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.level=4;player.gold=10000;player.sectContribution=1000;player.sectTotalContribution=1000;player.sectPromotion={version:1,sect:player.sect,tasksCompleted:5,inherited:false};closeWarPanelV2839();warStateV2839()");if(master)run("player.sectPromotion.inherited=true;discipleRosterV2815().members.push({id:999,name:'林照',level:2,specialty:0,job:null});showDiscipleLifeV2868(999)");}
const member=()=>run('sectMembersReadV2868().find(d=>d.id===999)');
function buy(){return run("allyAllV2892('仙魔教')");}
fresh();const untouched=json(),plan=run('allyPlanV2892()');a.equal(json(),untouched,'planning read-only');a(plan.picks.length>3);a.equal(plan.cost,plan.picks.length*30);a(plan.picks.every((p,i)=>!i||plan.picks[i-1].power>=p.power));
f.c.confirm=()=>false;a.equal(buy(),false);a.equal(json(),untouched);f.c.confirm=()=>true;f.c.saveGame=()=>false;a.equal(buy(),false);a.equal(json(),untouched,'batch save rollback');f.c.saveGame=save;a.equal(buy(),true);a.equal(run('player.sectContribution'),1000-plan.cost);a.equal(run('player.sectTotalContribution'),1000);a.equal(run('player.warState.alliedSects.length'),plan.picks.length);a.equal(buy(),false);
fresh();run("player.sectContribution=65;player.factionReputation['战神殿']=-5");a.equal(run('allyPlanV2892().picks.length'),2);a.equal(run('allyPlanV2892().cost'),60);a.equal(buy(),true);a.equal(run('player.sectContribution'),5);
for(const mutation of ["player.sect='散修'","player.sect='青鸾宫'","player=createDefaultPlayer()","player.warState=JSON.parse(JSON.stringify(player.warState))","player.destroyedFactions.push('仙魔教')","player.sectContribution=0","gameState='combat'"]){fresh();let changed;f.c.confirm=()=>{run(mutation);changed=json();return true;};a.equal(buy(),false,mutation);a.equal(json(),changed,mutation);}
fresh();run("player.sect='散修'");a.equal(buy(),false);run("player.sect='凌霄宗';player.destroyedFactions=['凌霄宗']");a.equal(buy(),false);
fresh();run("showWarAlliesV2839('仙魔教')");a(run("document.getElementById('warPanelV2839').innerHTML").includes('一键邀请'));const old=run('warUiV2839.actions[0]');run('player.sectContribution=30');const stale=json();old();a.equal(json(),stale,'old preview cannot spend a changed budget');
// Keep the accepted war rules; there is no golden invitation or discounted refusal override.
a.equal(run('typeof SECTWAR_V2891'),'undefined');a.equal(run('typeof requestImmortalAidV2892'),'undefined');
fresh();run('player.sectContribution=Infinity');a.equal(run('allyPlanV2892().picks.length'),0);
console.log('PASS batch invitation: original fees/eligibility, power order, budget, cancellation, atomic retry and stale actions');

fresh(true);a(run("document.getElementById('mentorBoxV2892')"));const before=json();f.c.confirm=()=>false;a.equal(run("mentorDiscipleV2892(999,'training')"),false);a.equal(json(),before);f.c.confirm=()=>true;f.c.saveGame=()=>false;a.equal(run("mentorDiscipleV2892(999,'training')"),false);a.equal(json(),before);f.c.saveGame=save;
a.equal(run("mentorDiscipleV2892(999,'training')"),true,'view rebound after rollback');a.equal(run('player.gold'),9700);a.equal(member().level,3);a.equal(member().lifeV2868.history.at(-1).type,'mentor_training');a.equal(member().lifeV2868.counts.training,1);a.equal(run('player.sectData.prosperity'),20);
a.equal(run("mentorDiscipleV2892(999,'rescue')"),false,'shared disciple cooldown');
for(let i=0;i<2;i++){run('player.worldTime.totalDays+=30;showDiscipleLifeV2868(999)');a.equal(run("mentorDiscipleV2892(999,'rescue')"),true);}
run('player.worldTime.totalDays+=30;showDiscipleLifeV2868(999)');a.equal(run("mentorDiscipleV2892(999,'rescue')"),false,'two synthetic experiences maximum');a(!run('lifeTitlesV2868(sectMembersReadV2868().at(-1))').includes('济危同门'));a.equal(member().lifeV2868.thanks,null);a.equal(member().lifeV2868.trail,null);
run('lifeAddV2868(sectMembersReadV2868().at(-1),"rescue")');a(run('lifeTitlesV2868(sectMembersReadV2868().at(-1))').includes('济危同门'),'needs actual rescue');
a.equal(run("mentorDiscipleV2892(999,'explore')"),true);a.equal(member().lifeV2868.trail,null);
const trained=JSON.stringify(member().mentorV2892);run('player=normalizePlayer(JSON.parse(JSON.stringify(player)));showDiscipleLifeV2868(999)');a.equal(JSON.stringify(member().mentorV2892),trained,'record survives migration');a.equal(run("mentorDiscipleV2892(999,'explore')"),false);
for(const setup of ["player.sectPromotion.inherited=false","sectMembersReadV2868().at(-1).job={type:'train'}","player.gold=1","gameState='combat'","player.sect='散修'","player.destroyedFactions.push(player.sect)"]){fresh(true);run(setup);const b=json();a.equal(run("mentorDiscipleV2892(999,'training')"),false,setup);a.equal(json(),b);}
for(const mutation of ["player=createDefaultPlayer()","player.sect='青鸾宫'","sectMembersReadV2868().at(-1).level=8","player.worldTime.totalDays++","showStory('其他面板',[])","player.sectData=JSON.parse(JSON.stringify(player.sectData))"]){fresh(true);let changed;f.c.confirm=()=>{run(mutation);changed=json();return true;};a.equal(run("mentorDiscipleV2892(999,'training')"),false,mutation);a.equal(json(),changed);}
fresh(true);run('sectMembersReadV2868().at(-1).level=10;showDiscipleLifeV2868(999)');a.equal(run("mentorDiscipleV2892(999,'training')"),true);a.equal(member().level,10);a.equal(run('player.gold'),9300);
fresh(true);run('sectMembersReadV2868().at(-1).mentorV2892={next:Infinity,counts:{rescue:100,training:-5}}');a.equal(run('mentorReadV2892(sectMembersReadV2868().at(-1)).counts.rescue'),2);a.equal(run('mentorReadV2892(sectMembersReadV2868().at(-1)).counts.training'),0);
console.log('PASS master mentoring: costs, 30-day cooldown, per-kind caps, real title prerequisite, no side rewards, rollback/retry, migration, ownership and level cap');
