'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
function game(){const f=fixture(root);f.c.Math=Object.create(Math);f.c.Math.random=()=>.99;f.c.console.log=()=>{};f.storage.set('xiantu_battle_presentation_v2756','report');for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.run('startGame();closeWorldOverlay();player.level=6;player.hp=42;player.mp=13;MONSTER_JEV_V2844.enabled=false;completedAchievements=new Set(Object.keys(ACHIEVEMENTS));');f.timers.clear();return f;}
const f=game(),act=k=>f.run(`actRainV286822(rainViewV286822.token,${JSON.stringify(k)})`);
for(const n of [1,5,7]){
 f.run(`player.rainChapterV286822={step:${n}};showRainChapterV286822()`);const saved=f.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp])');a.equal(act('all'),true);a.equal(f.run('rainStateV286822().step'),n);a.equal(f.run('rainStateV286822().clues.length'),3);a.equal(act('all'),false);a.equal(f.run('JSON.stringify([player.hp,player.mp,player.gold,player.exp])'),saved);
 f.run(`showRainChapterV286822(${n})`);a.equal(act('all'),false);
}
f.run('player.rainChapterV286822={step:1};showRainChapterV286822()');const save=f.c.saveGame,old=f.run('JSON.stringify(player)');f.c.saveGame=()=>{throw Error('quota')};a.equal(act('all'),false);a.equal(f.run('JSON.stringify(player)'),old);f.c.saveGame=save;a.equal(act('all'),true);f.run('player=normalizePlayer(loadGame().player)');a.equal(f.run('rainStateV286822().clues.length'),3);
f.run('player.rainChapterV286822={step:4};showRainChapterV286822()');a.equal(act('all'),false);a.equal(act('rest'),true);a.equal(act('rest'),false);f.run('player.hp=12');a.equal(act('rest'),false);a.equal(f.run('player.hp'),12);
f.run('player.rainChapterV286822={step:13};player.storyExpansionV286827={rain2:{step:4}};showRainTwoV286827()');a.equal(f.run('actRainTwoV286827(expansionSessionV286827,"all")'),true);a.equal(f.run('expansionStateV286827().rain2.step'),4);a.equal(f.run('expansionStateV286827().rain2.plan'),'');a.equal(f.run('player.hp'),12);a.equal(f.run('actRainTwoV286827(expansionSessionV286827,"breach")'),true);a.equal(f.run('expansionStateV286827().rain2.step'),5);
// Echoes use local copies, require terminal story and completed episodes, never save or reward.
a.equal(f.run('showStoryEchoV2885()'),false);f.run("player.tasks.completed=['main_19','journey_01'];player.tasks.choices={journey_01:'lamp'};player.rainChapterV286822={step:13,route:'rescue',trust:'share',policy:'public',rewarded:true};player.storyExpansionV286827={rain2:{step:9,ending:'arrest'}}");
const echoBefore=f.run('JSON.stringify(player)'),stored=f.storage.get(f.run('SAVE_KEY'));a.equal(f.run('showStoryEchoV2885({kind:"journey",id:"journey_01",choice:"home"})'),true);a(f.ids.get('expansionV286827').innerHTML.includes(f.run('JOURNEYS_V2838[0].outcomes.home')));a.equal(f.run('showStoryEchoV2885({kind:"journey",id:"journey_02"})'),false);
for(const route of ['rescue','chase'])for(const trust of ['share','reserve'])for(const policy of ['public','protect','trace'])a.equal(f.run(`showStoryEchoV2885({kind:'rain1',route:'${route}',trust:'${trust}',policy:'${policy}'})`),true);
for(const ending of ['arrest','rescue','seal']){f.run(`showStoryEchoV2885({kind:'rain2',ending:'${ending}'})`);a(f.ids.get('expansionV286827').innerHTML.includes(f.run(`RAIN_TWO_ENDINGS_V286827['${ending}'][1]`)));}
a.equal(f.run('JSON.stringify(player)'),echoBefore);a.equal(f.storage.get(f.run('SAVE_KEY')),stored);
f.run('player.tasks.completed.push(...JOURNEYS_V2838.map(j=>j.id))');const allEchoBefore=f.run('JSON.stringify(player)');
for(let n=1;n<=8;n++)for(let option=0;option<2;option++)a.equal(f.run(`showStoryEchoV2885({kind:'journey',id:'journey_0${n}',choice:JOURNEYS_V2838[${n-1}].choices[${option}][0]})`),true);
a.equal(f.run('JSON.stringify(player)'),allEchoBefore);
// Real hit metadata, not damage-number rendering; baseline calls keep 30% guard.
const c=game();c.run('player.hp=getMaxHp();player.mp=getMaxMp();startCombat({name:"野狼",hp:1000,maxHp:1000,atk:2,def:2,gold:0,exp:0});globalThis.ai=monsterStateV2844()');c.timers.clear();c.c.getAtk=()=>100;
function arm(mp=100){c.run(`ai.guard=true;ai.mp=${mp};ai.supportTurns=2;`);}
arm();a.equal(c.run('monsterGuardDamageV2844(100)'),70);a.equal(c.run('ai.supportTurns'),2);a.equal(c.run('ai.mp'),100);
arm();a.equal(c.run('monsterGuardDamageV2844(100,{crit:false,skill:null})'),70);a.equal(c.run('ai.supportTurns'),2);
arm();a.equal(c.run('monsterGuardDamageV2844(100,{crit:false,skill:{element:"fire"}})'),70);a.equal(c.run('ai.supportTurns'),0);a.equal(c.run('ai.mp'),100);
for(const hit of ['{crit:true,skill:null}','{crit:false,skill:{element:"thunder"}}']){arm(7);a.equal(c.run(`monsterGuardDamageV2844(20,${hit})`),20);a.equal(c.run('ai.guard'),false);a.equal(c.run('ai.mp'),0);a.equal(c.run('ai.supportTurns'),0);}
arm();a.equal(c.run('monsterGuardDamageV2844(115,{crit:false,skill:null})'),115);a.equal(c.run('ai.mp'),85);a.equal(c.run('ai.supportTurns'),2,'heavy noncrit basic attack does not break rally');
arm();c.run('showDamageNumber(999,"enemy",false,true,false,false,"雷法");dealEnemyDamageV2882(currentEnemy,1,false,"pet");dealEnemyDamageV2882(currentEnemy,1,false,"passive")');a.equal(c.run('ai.guard'),true);a.equal(c.run('ai.supportTurns'),2);a.equal(c.run('ai.mp'),100);
a.equal(c.run('monsterGuardDamageV2844(0,{crit:true,skill:{element:"thunder"}})'),0);a.equal(c.run('ai.guard'),true);
// Actual thunder skill route supplies metadata and consumes MP/cooldown once.
c.run('player.skills=[{...SKILLS.find(s=>s.element==="thunder"),cooldownLeft:0}];player.skillLoadoutV212={thunder:[player.skills[0].name]};player.skillLoadoutInitializedV212=true;player.mp=getMaxMp();player.hp=getMaxHp();currentEnemy.hp=currentEnemy.maxHp=1e6;currentEnemy._pressureStun=false;playerPressureStun=false;isPlayerTurn=true;ai.guard=true;ai.supportTurns=2;ai.mp=100;combat("skill",0)');c.flush(300);a.equal(c.run('ai.guard'),false);a.equal(c.run('ai.supportTurns'),0);a.equal(c.run('ai.mp'),85);
console.log('PASS rain batch/no skip/rest limits/rollback/reload; 8-chapter gates and 15 branch previews read-only; guard, rally, MP, visual/passive exclusions and real thunder-hit integration');
