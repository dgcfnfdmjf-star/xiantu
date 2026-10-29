'use strict';
// Full shipped loader, isolated in-memory saves; no real player data is accessed.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.c.console.warn=()=>{};f.c.Math=Object.create(Math);
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
for(const file of files)f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
run('showBreakthroughSuccess=()=>{};showBreakthroughFailure=()=>{};playBreakthroughAnimation=()=>{};');
const near=(actual,expected,label='')=>a(Math.abs(actual-expected)<1e-10,`${label}: ${actual} != ${expected}`);
function fresh(level=6,phase=3,extra=''){
 run(`resetRuntimeState();player=createDefaultPlayer();initAchievements();gameState='exploring';COMBAT_FINISH_V2764.settling=false;miniSaveDeferredV286840=false;
 player.level=${level};player.phase=${phase};player.name='道途数值回归';player.heartDemon.broken=true;player.statusEffects=[];player.inventory=[];player.artifacts=[];player.activeArtifact=null;player.sectData=null;activeRegionDebuff=null;
 player.daoV286883={v:1,introducedAt:0,awards:{},history:[],lifeLoss:0,heldProtection:null,last:null};player.breakthrough={isAnimating:false,cooldownDays:0,protectionV28683:{key:'${level}:${phase}',failures:0}};
 player.exp=getCurrentExpNeed();player.hp=getMaxHp()*.6;player.mp=getMaxMp();${extra}`);
 f.timers.clear();f.c.Math.random=()=>.5;
}
function history(kind,n=5){run(`player.daoV286883.awards={};player.daoV286883.history=[];for(const key of ['4:0','4:1','4:2','4:3','5:0'].slice(0,${n})){player.daoV286883.awards[key]=${JSON.stringify(kind)};player.daoV286883.history.push(key);}`);}
function factor(key){return run(`daoFactorsV286883({base:.3,pillBonus:0,sectBonus:0}).find(r=>r.key===${JSON.stringify(key)}).v`);}
function plan(kind,level,phase){return `{snapshot:{level:${level},phase:${phase}},expNeed:1000,daoV2905:{v:1,kind:${JSON.stringify(kind)},fromLevel:${level},fromPhase:${phase}}}`;}
function attempt(values){let i=0;f.c.Math.random=()=>values[i++]??.5;a.equal(run('triggerBreakthrough(false)'),true);return json('player.breakthrough.pendingV28683');}
function settle(){a.equal(run('settlePendingBreakthroughV2905(player.breakthrough.pendingV28683.result,player.breakthrough.pendingV28683.success)'),true);}
a.equal(files.length,40);

// New mechanics start at Yuan Ying, and never replace the ascension gate.
for(let level=0;level<4;level++)for(let phase=0;phase<4;phase++){
 fresh(level,phase);const expected=Math.min(.95,[.95,.85,.75,.55][level]+(phase<3?.2:0));
 near(run('calculateBreakthroughSuccess().rate'),expected);a.equal(run('calculateBreakthroughSuccess().daoActive'),undefined);
 a.equal(run(`planDaoBreakthroughV2905({snapshot:{level:${level},phase:${phase}}},true)`),null);
}
for(const [level,phase] of [[9,3],[16,3]]){fresh(level,phase);a.equal(run('planDaoBreakthroughV2905({snapshot:createBreakthroughSnapshot()},true)'),null);}
for(const flag of ['forced','noAdvance','ascension']){
 fresh();const before=run('JSON.stringify(player)');
 a.equal(run(`planDaoBreakthroughV2905({snapshot:createBreakthroughSnapshot(),${flag}:true},true)`),null);
 run(`applyDaoBreakthroughV2905({...${plan('perfect',6,3)},${flag}:true},true)`);a.equal(run('JSON.stringify(player)'),before);
}
fresh(9,3);a.equal(run('canAttemptBreakthrough()'),false);a.equal(run('isFinalTribulationGate()'),true);

// Each factor has an independent boundary; equipment must actually be owned.
fresh();for(const [hp,expected] of [[0,-.04],[.399999,-.04],[.4,0],[.799999,0],[.8,.02],[1,.02]]){run(`player.hp=getMaxHp()*${hp}`);near(factor('body'),expected);}
fresh(9,2);run('player.hp=getMaxHp()*.2');near(factor('body'),-.04,'no doubled tribulation penalty');
fresh();for(const [count,expected] of [[0,0],[7,0],[8,.005],[15,.005],[16,.01],[31,.015],[32,.02],[39,.02]]){
 run(`completedAchievements=new Set(Object.keys(ACHIEVEMENTS).slice(0,${count}))`);near(factor('luck'),expected);
}
fresh();history('barely');near(factor('foundation'),-.02);a.equal(run('daoFoundationV286883()'),-2);
history('perfect');near(factor('foundation'),.03);a.equal(run('daoFoundationV286883()'),3);
run("player.statusEffects=[{id:'jichuV286883',remainingDays:360}]");near(factor('foundation'),-.07);
fresh();run("player.activeArtifact={id:'owned',type:'飞剑',level:1}");near(factor('aids'),0);
run('player.artifacts=[player.activeArtifact]');near(factor('aids'),.02);
run("player.activeArtifact={id:'owned',type:'飞剑',level:1}");near(factor('aids'),.02);
run("player.activeArtifact={id:'missing',type:'飞剑',level:1}");near(factor('aids'),0);
run("player.activeArtifact={id:'owned',type:'invalid'}");near(factor('aids'),0);
fresh();run('player.sectData={level:10}');near(factor('place'),0,'sect level is not a spirit vein');
run("player.statusEffects=[{id:'lingmai',remainingDays:30}]");near(factor('place'),.03);
run("activeRegionDebuff={type:'test'}");near(factor('place'),0);run('player.statusEffects=[]');near(factor('place'),-.03);
run("player.statusEffects=[{id:'xinmo',remainingDays:30},{id:'jingmai',remainingDays:30}];player.heartDemon.broken=false");near(factor('heart'),-.35);near(factor('body'),-.1);

// The original clamps, 15-point protection steps and pill costs remain intact.
fresh(16,2,"player.statusEffects=[{id:'xinmo',remainingDays:30},{id:'jingmai',remainingDays:30},{id:'jichuV286883',remainingDays:360}];player.heartDemon.broken=false;player.hp=1;activeRegionDebuff={type:'test'}");
near(run('calculateBreakthroughSuccess().rate'),.05);
for(let failures=0;failures<=5;failures++){run(`player.breakthrough.protectionV28683.failures=${failures}`);near(run('calculateBreakthroughSuccess().rate'),failures===5?1:.05+failures*.15);}
fresh(4,0,'player.sectData={level:100};player.hp=getMaxHp()');near(run('calculateBreakthroughSuccess().rate'),.95);
fresh(6,3);for(let failures=0;failures<=5;failures++){run(`player.breakthrough.protectionV28683.failures=${failures}`);near(run('calculateBreakthroughSuccess().rate'),failures===5?1:Math.min(.95,.3+.15*failures));}
a.deepEqual(json('BREAKTHROUGH_PILLS_V28683'),{'破障丹':{bonus:.15,cost:300,level:2},'渡劫丹':{bonus:.2,cost:500,level:5},'九转金丹':{bonus:.3,cost:900,level:9}});
for(const [name,level] of [['破障丹',4],['渡劫丹',6],['九转金丹',9]]){
 fresh(level,2,`player.inventory=[${JSON.stringify(name)},${JSON.stringify(name)}];player.breakthrough.pillV28683=${JSON.stringify(name)}`);
 const out=attempt([0,.5]);a.equal(out.result.pillName,name);a.equal(run('player.inventory.length'),1);settle();a.equal(run('player.inventory.length'),1);
 fresh(level,2,`player.inventory=[${JSON.stringify(name)}];player.breakthrough.pillV28683=${JSON.stringify(name)};player.breakthrough.protectionV28683.failures=5`);
 const guaranteed=attempt([.5]);a.equal(guaranteed.success,true);a.equal(guaranteed.result.guaranteed,true);a.equal(guaranteed.result.pillName,null);settle();a.equal(run('player.inventory.length'),1);
}
console.log('PASS realm exclusions, all factor boundaries, original rate clamps/protection and real one-pill/no-pill guarantee paths');

const qualityRows=[{name:'standard',kind:null,luck:0,odds:{barely:.10,normal:.78,perfect:.12}},
 {name:'weak',kind:'barely',luck:0,odds:{barely:.12,normal:.78,perfect:.10}},
 {name:'good',kind:'perfect',luck:32,odds:{barely:.05,normal:.78,perfect:.17}}];
for(const row of qualityRows){
 fresh();if(row.kind)history(row.kind);run(`completedAchievements=new Set(Object.keys(ACHIEVEMENTS).slice(0,${row.luck}))`);a.deepEqual(json('daoQualityOddsV286883()'),row.odds);
 // A guarantee and very low success rate do not secretly change quality odds.
 run("player.breakthrough.protectionV28683.failures=5;player.hp=1;player.statusEffects=[{id:'xinmo',remainingDays:30}]");a.deepEqual(json('daoQualityOddsV286883()'),row.odds);
 let cumulative=0;
 for(const [kind,p] of Object.entries(row.odds)){f.c.Math.random=()=>cumulative+p/2;a.equal(run('planDaoBreakthroughV2905({snapshot:createBreakthroughSnapshot()},true).kind'),kind);cumulative+=p;}
}
fresh();a.deepEqual(json('daoFailOddsV286883()'),{minor:.72,moderate:.16,severe:.02,epiphany:.06,lifespan:.04});
for(const [level,phase,held] of [[5,3,false],[6,2,false],[6,3,true]]){
 fresh(level,phase,held?"player.daoV286883.heldProtection={key:'6:3',failures:2}":'');a.deepEqual(json('daoFailOddsV286883()'),{minor:.74,moderate:.16,severe:0,epiphany:.06,lifespan:.04});
}

// First-success awards are permanent, individually bounded and never repeat on repair.
for(const [kind,stat,life] of [['barely',.001,0],['normal',.002,.02],['perfect',.004,.05]]){
 fresh(7,0);run(`applyDaoBreakthroughV2905(${plan(kind,6,3)},true)`);
 near(run('daoBonusesV286883().stat'),stat);a.equal(run('daoBonusesV286883().life'),Math.floor(run('calculateMaxLifespan(7)')*life));
 const before=json('player.daoV286883');run(`applyDaoBreakthroughV2905(${plan(kind,6,3)},true)`);a.deepEqual(json('player.daoV286883'),before);
 fresh(6,1);run(`applyDaoBreakthroughV2905(${plan(kind,6,0)},true)`);near(run('daoBonusesV286883().life'),0,'minor advances add no lifespan');
}
fresh(16,3);const baseStats=json('[getAtk(),getDef(),getMaxHp(),getMaxMp()]');
run("for(let level=4;level<=16;level++)for(let phase=0;phase<4;phase++){const key=`${level}:${phase}`;if(daoKeyV286883(key))player.daoV286883.awards[key]='perfect';}");
near(run('daoBonusesV286883().stat'),.1);const cappedStats=json('[getAtk(),getDef(),getMaxHp(),getMaxMp()]');
for(let i=0;i<3;i++)a(Math.abs(cappedStats[i]-baseStats[i]*1.1)<=1.1,'stat getters apply bounded multiplier');a.equal(cappedStats[3],baseStats[3],'quality does not add MP');
fresh(6,1,"player.statusEffects=[{id:'jingmai',remainingDays:60},{id:'daoshangV286883',remainingDays:60}]");run(`applyDaoBreakthroughV2905(${plan('perfect',6,0)},true)`);a.equal(run('hasStatusEffect("jingmai")'),false);a.equal(run('daoInjuryDaysV286883()'),60);
// Old saves cannot farm awards for stages completed before the feature existed.
fresh(12,3,'delete player.daoV286883;normalizeDaoV286883(player)');a.equal(run('player.daoV286883.introducedAt'),51);
run(`player.breakthrough.protectionV28683.failures=1;applyDaoBreakthroughV2905(${plan('severe',12,3)},false);normalizeDaoV286883(player)`);a.equal(run('player.phase'),2);a.equal(run('daoRewardedV286883("12:2")'),true);
run(`player.phase=3;applyDaoBreakthroughV2905(${plan('perfect',12,2)},true)`);near(run('daoBonusesV286883().stat'),0);
run(`player.level=13;player.phase=0;applyDaoBreakthroughV2905(${plan('normal',12,3)},true)`);near(run('daoBonusesV286883().stat'),.002);a.equal(run('daoBonusesV286883().life'),Math.floor(run('calculateMaxLifespan(13)')*.02));

// Real attempt -> result settlement: retreat retains the old bottleneck's protection.
fresh(6,3,"completedAchievements=new Set(Object.keys(ACHIEVEMENTS));player.breakthrough.protectionV28683.failures=2;player.daoV286883.awards['6:2']='normal';player.daoV286883.history=['6:2']");
const severe=attempt([.999,.25,.89]);a.equal(severe.result.daoV2905.kind,'severe');settle();
a.equal(run('player.level'),6);a.equal(run('player.phase'),2);a.equal(run('player.exp'),0);a.deepEqual(json('player.daoV286883.heldProtection'),{key:'6:3',failures:3});a.equal(run('player.statusEffects.find(e=>e.id==="jichuV286883").remainingDays'),360);
const award=run('JSON.stringify(player.daoV286883.awards)');
run('player.breakthrough.cooldownDays=0;player.exp=getCurrentExpNeed()');attempt([0,.5]);settle();
a.equal(run('player.phase'),3);a.deepEqual(json('breakthroughProtectionV28683()'),{key:'6:3',failures:3});a.equal(run('JSON.stringify(player.daoV286883.awards)'),award);
a.equal(run('daoFailOddsV286883().severe'),0);near(run('daoFailOddsV286883().minor'),.74);
run('player.exp=getCurrentExpNeed()');const second=attempt([.999,.25,.89]);a.equal(second.result.daoV2905.kind,'moderate');settle();a.equal(run('player.phase'),3);a.equal(run('player.daoV286883.heldProtection.failures'),4);
run('player.breakthrough.cooldownDays=0;player.exp=getCurrentExpNeed()');attempt([0,.5]);settle();a.equal(run('player.level'),7);a.equal(run('player.daoV286883.heldProtection'),null);

for(const [kind,roll] of [['minor',.1],['moderate',.8],['epiphany',.93],['lifespan',.98]]){
 fresh(6,3,'completedAchievements=new Set(Object.keys(ACHIEVEMENTS))');const exp=run('player.exp'),life=run('getTotalMaxLifespan()');
 a.equal(attempt([.999,.25,roll]).result.daoV2905.kind,kind);settle();
 a.equal(run('player.exp'),exp-Math.floor(exp*.15)+(kind==='epiphany'?Math.floor(exp*.3):0));a.equal(run('player.breakthrough.cooldownDays'),35);
 if(kind==='minor'){a.equal(run('player.statusEffects.find(e=>e.id==="jingmai").remainingDays'),60);near(factor('body'),-.1);}
 if(kind==='moderate'){near(run('getExpBonus()'),.8);run('advanceGameTime(59)');a.equal(run('daoInjuryDaysV286883()'),1);run('advanceGameTime(1)');near(run('getExpBonus()'),1);}
 if(kind==='epiphany')a.equal(run('player.breakthrough.pendingBreakthrough'),true);
 if(kind==='lifespan'){a.equal(run('player.daoV286883.lifeLoss'),Math.floor(life*.02));a.equal(run('getTotalMaxLifespan()'),life-Math.floor(life*.02));}
}
console.log('PASS quality odds/unique awards/stat cap/lifespan, legacy migration, real severe-repair protection and failure consequences');

// Seeded sampling uses the real planner, with 50,000 independent outcomes per state.
const rows=[];
for(const [index,row] of qualityRows.entries()){
 fresh();if(row.kind)history(row.kind);run(`completedAchievements=new Set(Object.keys(ACHIEVEMENTS).slice(0,${row.luck}))`);
 rows.push(sample(row.name,true,row.odds,index));
}
for(const [index,row] of [{name:'eligible',lv:6,ph:3,held:false},{name:'held',lv:6,ph:3,held:true},{name:'ineligible',lv:5,ph:3,held:false}].entries()){
 fresh(row.lv,row.ph,row.held?"player.daoV286883.heldProtection={key:'6:3',failures:2}":'');rows.push(sample(row.name,false,json('daoFailOddsV286883()'),index+3));
}
function sample(name,success,odds,index){
 const snapshot=run('JSON.stringify(player)'),seed=286883+index*7919;
 const result=json(`(()=>{let seed=${seed}>>>0;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const counts={},result={snapshot:createBreakthroughSnapshot()};for(let i=0;i<50000;i++){const kind=planDaoBreakthroughV2905(result,${success}).kind;counts[kind]=(counts[kind]||0)+1;}return {counts,n:50000};})()`);
 a.equal(run('JSON.stringify(player)'),snapshot,'planning cannot mutate player or grant rewards');
 for(const [kind,p] of Object.entries(odds)){const actual=result.counts[kind]||0;if(p===0)a.equal(actual,0);else a(Math.abs(actual-result.n*p)<6*Math.sqrt(result.n*p*(1-p)),`${name}/${kind}: seeded frequency`);}
 for(const kind of Object.keys(result.counts))a(Object.hasOwn(odds,kind));
 if(success){const expected=odds.barely*.001+odds.normal*.002+odds.perfect*.004,actual=((result.counts.barely||0)*.001+(result.counts.normal||0)*.002+(result.counts.perfect||0)*.004)/result.n;a(Math.abs(actual-expected)<.00003);result.meanStat=actual;}
 return {name,seed,...result};
}
console.log('PASS seeded DAO quality/failure distributions: '+JSON.stringify(rows));
