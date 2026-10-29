'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.c.console.warn=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
function fresh(level=7,phase=0){
 run(`resetRuntimeState();player=createDefaultPlayer();initAchievements();gameState='exploring';player.level=${level};player.phase=${phase};player.name='道基存档回归';player.hp=getMaxHp();player.mp=getMaxMp();player.exp=0;`);
 f.timers.clear();
}
function normalize(value,level=7,phase=0){
 f.c.daoInput={level,phase,daoV286883:value};
 return json('daoStateV286883(daoInput)');
}
const empty=(introducedAt=28)=>({v:1,introducedAt,awards:{},history:[],lifeLoss:0,heldProtection:null,last:null});

// The only canonical spelling of a source stage can enter the first-success ledger.
fresh();
for(const key of ['04:0','4:00','4:4','3:3','9:3','16:3','17:0','-4:0','4.0:0','4:0 ',' 4:0','constructor','__proto__']){
 a.equal(run(`daoKeyV286883(${JSON.stringify(key)})`),null,key);
}
for(const key of ['4:0','6:3','9:2','10:0','16:2'])a(run(`daoKeyV286883(${JSON.stringify(key)})`),key);
const malformed={v:1,introducedAt:0,awards:{'4:0':'perfect','04:0':'perfect','4:1':['perfect'],'4:2':{toString:'perfect'},'4:3':'minor','5:0':true,'5:1':null,'7:0':'perfect','8:0':'perfect','9:3':'perfect','16:3':'perfect'},history:['4:0','04:0','4:1','8:0',{},'4:0'],lifeLoss:'20',heldProtection:{key:'6:3',failures:'3'},last:{key:'4:0',kind:['perfect']}};
a.deepEqual(normalize(malformed),{...empty(0),awards:{'4:0':'perfect'},history:['4:0']});
for(const value of [null,[],true,'bad',42])a.deepEqual(normalize(value),empty());
for(const value of [null,[],true,'bad',42])a.deepEqual(normalize({v:1,introducedAt:0,awards:value,history:value}),empty(0));
console.log('PASS canonical stage keys, future/excluded gates, strict quality values and invalid containers');

// Normalize a copied record, never the caller's save or arbitrary sibling data.
f.c.daoInput={level:7,phase:0,keep:{custom:true},daoV286883:malformed};
const untouched=run('JSON.stringify(daoInput)');run('daoStateV286883(daoInput)');a.equal(run('JSON.stringify(daoInput)'),untouched);
const historyKeys=['4:0','4:1','4:2','4:3','5:0','5:1','5:2'],awards=Object.fromEntries(historyKeys.map(k=>[k,'normal']));
const bounded=normalize({v:1,introducedAt:0,awards,history:[...historyKeys,'4:0','missing',null]});
a.deepEqual(bounded.history,historyKeys.slice(-5));
for(const value of [NaN,Infinity,-Infinity,'12',true,[],{},null])a.equal(normalize({introducedAt:0,lifeLoss:value}).lifeLoss,0);
a.equal(normalize({introducedAt:0,lifeLoss:-7}).lifeLoss,0);
a.equal(normalize({introducedAt:0,lifeLoss:19.9}).lifeLoss,19);
a.equal(normalize({introducedAt:0,lifeLoss:1e12}).lifeLoss,1e9);
for(const held of [{key:'6:3',failures:'3'},{key:'6:3',failures:NaN},{key:'6:3',failures:0},{key:'6:2',failures:3},{key:'5:3',failures:3},{key:'9:3',failures:3}])a.equal(normalize({introducedAt:0,heldProtection:held},6,2).heldProtection,null);
for(const phase of [0,1])a.equal(normalize({introducedAt:0,heldProtection:{key:'6:3',failures:3}},6,phase).heldProtection,null);
for(const phase of [2,3])a.deepEqual(normalize({introducedAt:0,heldProtection:{key:'6:3',failures:9}},6,phase).heldProtection,{key:'6:3',failures:5});
console.log('PASS read-only normalizer, bounded unique history, finite lifetime loss and phase-specific held protection');

// Legacy characters start at their current source stage. A one-phase retreat
// must not turn a stage already completed before this feature into a new award.
fresh(6,3);run('delete player.daoV286883;player=normalizePlayer(player)');
a.equal(run('player.daoV286883.introducedAt'),27);a.deepEqual(json('daoBonusesV286883()'),{stat:0,life:0});
a.equal(run('daoRewardedV286883("6:2")'),true);a.equal(run('daoRewardedV286883("6:3")'),false);
run('player.phase=2;player.daoV286883.heldProtection={key:"6:3",failures:3};player=normalizePlayer(player)');
a.equal(run('player.daoV286883.introducedAt'),27);a.equal(run('daoRewardedV286883("6:2")'),true);
a.deepEqual(json('player.daoV286883.heldProtection'),{key:'6:3',failures:3});
run('player.phase=3;player=normalizePlayer(player)');a.equal(run('player.daoV286883.introducedAt'),27);
for(const value of [undefined,'0',null,true,[],{},NaN,Infinity,-1,1000]){
 const s=normalize({introducedAt:value,awards:{'4:0':'perfect'},history:['4:0']});
 a.equal(s.introducedAt,28,'invalid introduction boundary defaults to the current stage');a.deepEqual(s.awards,{});a.deepEqual(s.history,[]);
}
fresh();a.equal(run('player.daoV286883.introducedAt'),0,'new characters retain the feature from their initial stage');
// Older realm schemas remap indices before establishing this feature's baseline.
// Include parse -> normalize: parsing must not erase the evidence of migration.
for(const [schema,oldLevel,oldPhase,newLevel,newPhase] of [[3,10,3,12,3],[2,10,2,7,2],[1,8,2,9,2]])for(const parsed of [false,true]){
 fresh(oldLevel,oldPhase);run(`player.realmSchemaVersion=${schema};delete player.daoV286883;`);
 if(parsed)run('player=parseSaveV2768(JSON.stringify({version:SAVE_VERSION,player})).player');
 run('player=normalizePlayer(player)');
 a.equal(run('player.level'),newLevel);a.equal(run('player.phase'),newPhase);
 a.equal(run('player.daoV286883.introducedAt'),newLevel*4+newPhase,`schema ${schema}, parsed=${parsed}: baseline uses the final mapped stage`);
 a.equal(run(`daoRewardedV286883("${newLevel}:${newPhase-1}")`),true,'already completed legacy stage cannot be awarded on retraining');
 a.equal(run(`daoRewardedV286883("${newLevel}:${newPhase}")`),false,'the current migrated bottleneck remains eligible');
}
console.log('PASS legacy migration baseline, no retrospective awards after retreat and invalid baseline defenses');

// A legitimate already-awarded phase survives retreat and both save boundaries.
fresh(6,2);run('player.daoV286883={v:1,introducedAt:16,awards:{"4:0":"normal","4:3":"perfect","6:2":"barely"},history:["4:0","4:3","6:2"],lifeLoss:7,heldProtection:{key:"6:3",failures:4},last:{key:"6:3",kind:"severe"}};');
const expected=json('daoStateV286883()'),before=run('JSON.stringify(player)');
const clean=json('createSaveDataV2768()');a.equal(run('JSON.stringify(player)'),before,'save serialization does not modify the live ledger');a.deepEqual(clean.player.daoV286883,expected);
f.c.saveEnvelope=clean;run('writeSaveV2768(JSON.stringify(saveEnvelope))');
a.deepEqual(JSON.parse(f.storage.get('xiantu_save')).player.daoV286883,expected);
a.deepEqual(json('loadGame().player.daoV286883'),expected);
run('player=normalizePlayer(loadGame().player)');a.deepEqual(json('player.daoV286883'),expected);a.equal(run('daoRewardedV286883("6:2")'),true);
const savedBonus=json('daoBonusesV286883()');a.equal(savedBonus.stat,.007);a.equal(savedBonus.life,run('Math.floor(calculateMaxLifespan(5)*.05)-7'));
run('player.daoV286883.lifeLoss=8;saveGame()');a.deepEqual(JSON.parse(f.storage.get('xiantu_save_backup')).player.daoV286883,expected);
a.equal(json('loadGame().player.daoV286883').lifeLoss,8);
// Bad identifiers must be rejected before replacing either existing save.
const disk=f.storage.get('xiantu_save'),backup=f.storage.get('xiantu_save_backup');
const malicious=JSON.parse(disk);Object.defineProperty(malicious.player.daoV286883.awards,'__proto__',{value:'perfect',enumerable:true});f.c.badSave=JSON.stringify(malicious);
a.throws(()=>run('writeSaveV2768(badSave)'),/存档字段无效/);a.equal(f.storage.get('xiantu_save'),disk);a.equal(f.storage.get('xiantu_save_backup'),backup);
console.log('PASS create/parse/load/normalize/write roundtrip, valid retraining ledger, backup preservation and unsafe-field refusal');

// Stat growth is additive and bounded; excluded ascension/final gates cannot
// produce quality or longevity even in a malformed imported ledger.
fresh(16,3);run('player.daoV286883={v:1,introducedAt:0,awards:{},history:[],lifeLoss:0};for(let level=4;level<=16;level++)for(let phase=0;phase<4;phase++)player.daoV286883.awards[`${level}:${phase}`]="perfect";');
const s=json('daoStateV286883()');a.equal(Object.keys(s.awards).length,50);a(!('9:3' in s.awards));a(!('16:3' in s.awards));
a.equal(run('daoBonusesV286883().stat'),.1);
a.equal(run('daoBonusesV286883().life'),run('Object.keys(daoStateV286883().awards).filter(k=>k.endsWith(":3")).reduce((n,k)=>n+Math.floor(calculateMaxLifespan(Number(k.split(":")[0])+1)*.05),0)'));
run('player.daoV286883.lifeLoss=1e9');a.equal(run('getTotalMaxLifespan()'),1);
console.log('PASS additive 10% stat cap, stage-key uniqueness, ascension exclusions and lifetime floor');
