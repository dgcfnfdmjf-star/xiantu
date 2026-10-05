'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),fixture=require('./v2850-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||'release-v2850/xiantu-v2831-scroll';
const f=fixture(root);for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay();tutorialState.active=false;player.level=0;player.gold=0;player.hp=1;player.mp=0;player.buildingReadyDaysV2768={spring:999999,herb:999999};');
const unchanged=()=>f.run('JSON.stringify([player.gold,player.exp,player.age,player.longevity,player.worldTime,player.sectContribution,player.materials,player.inventory])');
const before=unchanged();a(f.run('canAccessBuilding("spirit_spring").allowed'));
f.run('showBuildingInterior("spirit_spring")');a.match(f.ids.get('choices').innerHTML,/不限次数/);a(!/还需999|冷却2天/.test(f.ids.get('choices').innerHTML));
f.run('handleLingxiaoBuildingOp("spring","spirit_spring")');a.equal(f.run('player.hp'),f.run('getMaxHp()'));a.equal(f.run('player.mp'),f.run('getMaxMp()'));a.equal(unchanged(),before);a.equal(f.run('player.buildingReadyDaysV2768.spring'),undefined);a(f.run('getBuildingWaitV2768("herb")')>0);
for(let i=0;i<20;i++){f.run('player.hp=1;player.mp=0;handleLingxiaoBuildingOp("spring","spirit_spring")');a.equal(f.run('player.hp'),f.run('getMaxHp()'));a.equal(unchanged(),before);}
f.run('player.hp=1;player.mp=0;showLocation("rest")');a.equal(f.run('player.hp'),f.run('getMaxHp()'));a.equal(f.run('player.mp'),f.run('getMaxMp()'));a.equal(unchanged(),before);a.match(f.ids.get('storyText').innerHTML,/不消耗游戏时间/);a.match(f.ids.get('choices').innerHTML,/返回当前地域地图/);
f.run('doRest()');a.match(f.ids.get('storyText').innerHTML,/已经全满/);a.equal(unchanged(),before);
a.equal(f.run('normalizeBuildingUseV2768({spring:999999,herb:999999}).spring'),undefined);a.equal(f.run('normalizeBuildingUseV2768({spring:999999,herb:999999}).herb'),999999);
// Cannot heal during combat, settlement or an active breakthrough, including via a location shortcut.
for(const state of ['combat','combat-ending']){f.run(`gameState=${JSON.stringify(state)};player.hp=1;player.mp=0;`);for(const action of ['doRest()','showLocation("rest")','handleLingxiaoBuildingOp("spring","spirit_spring")']){f.run(action);a.equal(f.run('player.hp'),1);a.equal(f.run('player.mp'),0);a.equal(f.run('gameState'),state);}}
f.run('gameState="exploring";player.breakthrough.isAnimating=true;doRest();handleLingxiaoBuildingOp("spring","spirit_spring")');a.equal(f.run('player.hp'),1);
f.run('player.breakthrough.isAnimating=false;COMBAT_FINISH_V2764.settling=true;doRest()');a.equal(f.run('player.hp'),1);
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS repeated free north/map spring healing; no time/gold/reward changes; old cooldown removal; other cooldown retained; combat/settlement/breakthrough blocked');
