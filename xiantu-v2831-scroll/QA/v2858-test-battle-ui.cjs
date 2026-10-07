'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),fixture=require('./v2858-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const scripts=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function game(){const f=fixture(root);f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.c.AbortController=AbortController;f.storage.set('xiantu_battle_presentation_v2756','report');for(const name of scripts)f.load(name);f.run("startGame();closeWorldOverlay();startCombat({name:'野狼',hp:50000,maxHp:50000,atk:2,def:2,gold:1,exp:1,_realmLevel:0,_realmPhase:0});player.hp=getMaxHp();player.mp=getMaxMp();");f.timers.clear();return f;}
const f=game();
f.run("player.skillLoadoutV212=makeEmptySkillLoadoutV212();player.skillLoadoutInitializedV212=true;selectCombatSkillElementV212('fire')");
a.equal(f.run('combatSkillUiV212.element'),'fire');a.match(f.ids.get('combatSkillDrawerV2856').innerHTML,/此系暂未携带/);a.equal(f.storage.get('xiantu_skill_tab_v2856'),'fire');
f.c.localStorage.setItem=()=>{throw Error('storage denied')};a.doesNotThrow(()=>f.run("selectCombatSkillElementV212('heal')"));
f.run("player.skills=[SKILLS.find(s=>s.requiredWeapon==='staff')];player.skillLoadoutInitializedV212=false;ensureSkillLoadoutV212();player.mp=getMaxMp();selectCombatSkillElementV212('sword')");
a.match(f.ids.get('combatSkillDrawerV2856').innerHTML,/需装备棍才能施展/);a.equal(f.ids.get('combatSkillDrawerV2856').querySelector('.combat-skill-btn-v212').disabled,true);
const before=f.run('JSON.stringify([player.mp,currentEnemy.hp,isPlayerTurn])');f.run("combat('skill',0)");a.equal(f.run('JSON.stringify([player.mp,currentEnemy.hp,isPlayerTurn])'),before);
f.run("player.skills=[SKILLS[0]];player.skillLoadoutInitializedV212=false;ensureSkillLoadoutV212();player.mp=3;updateCombatChoices()");
a.match(f.ids.get('combatSkillDrawerV2856').innerHTML,/还差 7 灵力/);a.equal(f.ids.get('combatSkillDrawerV2856').querySelector('.combat-skill-btn-v212').disabled,true);
f.run('player.mp=getMaxMp();updateCombatChoices();toggleSkillDetailsV2856()');a.match(f.ids.get('combatSkillDrawerV2856').innerHTML,/skill-desc-v2856/);a.equal(f.ids.get('combatSkillDrawerV2856').querySelector('.combat-skill-btn-v212').disabled,false);
f.run("combat('attack')");a.equal(f.run('isPlayerTurn'),false);a.match(f.ids.get('battleReadoutV2856').innerHTML,/行动结算中/);a(f.ids.get('combatChoices').querySelectorAll('button').filter(b=>/^combat\(/.test(b.getAttribute('onclick')||'')).every(b=>b.disabled));
console.log('PASS empty skill tabs stay selected, stored tab tolerates storage denial, correct weapon/mana reasons, readable descriptions, stale action buttons locked');
const m=game(),heal=m.run("Object.keys(ITEMS).find(k=>ITEMS[k].type==='heal'&&ITEMS[k].value>10)"),mana=m.run("Object.keys(ITEMS).find(k=>ITEMS[k].type==='mp'&&ITEMS[k].value>10)");
m.run(`player.inventory.push(${JSON.stringify(heal)},${JSON.stringify(heal)},${JSON.stringify(mana)});toggleCombatMedicineDrawer(true)`);
let inventory=m.run('JSON.stringify(player.inventory)');m.run(`useCombatBagItem(${JSON.stringify(heal)});useCombatBagItem(${JSON.stringify(mana)})`);a.equal(m.run('JSON.stringify(player.inventory)'),inventory);a.equal(m.run('isPlayerTurn'),true);a.match(m.ids.get('combatItemDrawer').innerHTML,/已满，无需服用/);
m.run('player.hp=getMaxHp()-5;renderCombatMedicineDrawer()');a.match(m.ids.get('combatItemDrawer').innerHTML,/实际恢复 5 点气血/);a.match(m.ids.get('combatItemDrawer').innerHTML,/超出上限/);
const n=m.run('player.inventory.length');m.run(`useCombatBagItem(${JSON.stringify(heal)})`);a.equal(m.run('player.hp'),m.run('getMaxHp()'));a.equal(m.run('player.inventory.length'),n-1);a.equal(m.run('isPlayerTurn'),false);a.match(m.ids.get('combatLog').firstChild.innerHTML,/实际恢复 5 点气血/);
m.run(`useCombatBagItem(${JSON.stringify(heal)})`);a.equal(m.run('player.inventory.length'),n-1);m.flush(500);m.flush(150);a.equal(m.run('isPlayerTurn'),true);
m.run('player.mp=getMaxMp()-4');m.run(`useCombatBagItem(${JSON.stringify(mana)})`);a.equal(m.run('player.mp'),m.run('getMaxMp()'));a.match(m.ids.get('combatLog').firstChild.innerHTML,/实际恢复 4 点灵力/);
console.log('PASS full vitals do not consume medicines/turns; preview and logs use actual capped gain; rapid repeated taps consume once; enemy gets one response');
// A delayed medicine response from an old battle must not run against a new one.
const stale=game();stale.run(`player.inventory.push(${JSON.stringify(heal)});player.hp=getMaxHp()-6;useCombatBagItem(${JSON.stringify(heal)})`);
stale.run("gameState='exploring';startCombat({name:'下一场',hp:50000,maxHp:50000,atk:2,def:2,_realmLevel:0,_realmPhase:0});");const snap=stale.run('JSON.stringify([player.hp,player.mp,currentEnemy,monsterStateV2844().round,isPlayerTurn])');stale.flush(500);a.equal(stale.run('JSON.stringify([player.hp,player.mp,currentEnemy,monsterStateV2844().round,isPlayerTurn])'),snap);
stale.run(`player.inventory.push(${JSON.stringify(heal)});gameState='exploring';player.hp=1`);inventory=stale.run('JSON.stringify([player.inventory,player.hp,isPlayerTurn])');stale.run(`useCombatBagItem(${JSON.stringify(heal)})`);a.equal(stale.run('JSON.stringify([player.inventory,player.hp,isPlayerTurn])'),inventory);
const s=game();s.run("guardsV2785.set(currentEnemy,{owner:player,ratio:.3});player._thunderArmorTurns=2;currentEnemy.burnStacks=12;currentEnemy.burnTurns=3;currentEnemy.thunderDomainDamage=9;currentEnemy.thunderDomainTurns=2;skipEnemyTurn=true;currentEnemy._skipReason='冻结';");
const state=s.run('JSON.stringify([player,currentEnemy,skipEnemyTurn,guardsV2785.get(currentEnemy).ratio])');s.run('BattleClarityV2856.sync()');const box=s.ids.get('battleReadoutV2856');a.match(box.innerHTML,/护体 · 下次减伤30%/);a.match(box.innerHTML,/灼烧 · 12点×3次/);a.match(box.innerHTML,/雷域 · 9点×2次/);a.match(box.innerHTML,/冻结/);a.equal(s.run('JSON.stringify([player,currentEnemy,skipEnemyTurn,guardsV2785.get(currentEnemy).ratio])'),state);
s.run("currentEnemy.burnTurns=0;currentEnemy.thunderDomainTurns=0;skipEnemyTurn=false;guardsV2785.delete(currentEnemy);player._thunderArmorTurns=0;BattleClarityV2856.sync()");a(!box.innerHTML.includes('灼烧'));a(!box.innerHTML.includes('battle-chip-v2856'));
s.run("beginCombatFinishV2764('victory')");a.match(box.innerHTML,/本场结算中/);s.run("gameState='exploring';BattleClarityV2856.sync()");a.equal(box.hidden,true);
for(const x of [f,m,stale,s])a.equal(x.errors.length,0,JSON.stringify(x.errors));
console.log('PASS medicine stale battle callbacks and out-of-battle use blocked; read-only guard/burn/thunder/control status expires correctly; settlement and map visibility correct');
const clean=game();clean.run('BattleClarityV2856.sync()');
const quick=()=>clean.ids.get('combatChoices').querySelectorAll('.quick-skill-v286816');
clean.run(`player.skills=[
{name:'火甲',element:'fire',mpCost:10},{name:'冰甲',element:'ice',mpCost:10},
{name:'火乙',element:'fire',mpCost:20},{name:'兵甲',element:'sword',mpCost:10},
{name:'未携带火',element:'fire',mpCost:10}];
player.skillLoadoutV212={sword:['兵甲'],thunder:[],ice:['冰甲'],fire:['火乙','火甲'],heal:[]};
player.skillLoadoutInitializedV212=true;selectCombatSkillElementV212('fire')`);
const indices=()=>quick().map(b=>b.getAttribute('onclick'));
a.deepEqual(indices(),["combat('skill',2)","combat('skill',0)"]);
clean.run("selectCombatSkillElementV212('ice')");a.deepEqual(indices(),["combat('skill',1)"]);
clean.run("selectCombatSkillElementV212('sword')");a.deepEqual(indices(),["combat('skill',3)"]);
for(const el of ['thunder','heal']){clean.run(`selectCombatSkillElementV212('${el}')`);a.equal(quick().length,0);a.match(clean.ids.get('combatChoices').querySelector('.combat-quick-v286816').innerHTML,/此系暂未携带/);}
clean.run("selectCombatSkillElementV212('fire');toggleCombatSkillDrawerV212()");
a.deepEqual(indices(),["combat('skill',2)","combat('skill',0)"]);
const slots=indices();
clean.run('player.mp=0;updateCombatChoices()');a.deepEqual(quick().map(b=>b.getAttribute('onclick')),slots);a(quick().every(b=>b.disabled));
a.equal(clean.ids.get('monsterAiV2844').parentNode.id,'battleSettingsV286816');
a.equal(clean.ids.get('battleVitalsV286816').parentNode.id,'combatArena');
const logCount=clean.ids.get('combatLog').children.length;
for(let i=0;i<5;i++)clean.run(`addCombatLog('消息${i}')`);
a.equal(clean.ids.get('battleRecentV286816').children.length,3);a.equal(clean.ids.get('combatLog').children.length,logCount+5);
clean.run('player.mp=getMaxMp();updateCombatChoices();toggleCombatSkillDrawerV212()');a(clean.ids.get('combatSkillDrawerV2856'));
console.log('PASS selected-family quick slots and equipped order, mana guard, settings relocation, unified vitals and three-line log with full history');
