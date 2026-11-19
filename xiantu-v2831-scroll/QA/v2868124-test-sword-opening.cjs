'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.XIANTU_TEST_ROOT || path.resolve(__dirname, '..');
const fixture = require('./v2858-dom-fixture.cjs')(root);
fixture.c.console.log = () => {};
fixture.c.Math = Object.create(Math);
fixture.c.Math.random = () => .5;
for (const file of JSON.parse(fs.readFileSync(path.join(root, 'game-v2762.html'), 'utf8').match(/var files=(\[[^;]+\]);/)[1])) fixture.load(file);
const run = fixture.run;
run('startGame(); closeWorldOverlay()');

function battle(flags = {}) {
  run(`resetRuntimeState(); player=createDefaultPlayer();
    startCombat({...ENEMIES[0],name:'野狼',hp:2000,maxHp:2000,_realmLevel:0,_realmPhase:0,...${JSON.stringify(flags)}});
    currentEnemy.atk=30; player.hp=getMaxHp(); player.mp=getMaxMp()`);
  fixture.timers.clear();
}
function cast(name) {
  run(`combat('skill', player.skills.findIndex(s => s.name === ${JSON.stringify(name)}))`);
  fixture.flush(300);
}
function enemyAttack() {
  // Select the same legal enemy action in each comparison.
  fixture.timers.clear();
  run('resolveEnemyTurnV2844({choice:"attack",source:"local"})');
  fixture.flush(150);
}
function opening() { return !!run('tacticsV286821.get(currentEnemy)?.swordOpening'); }
function guard() { return run('guardsV2785.get(currentEnemy)?.ratio || 0'); }
function finisherHint() { return run('combatComboMarkupV2868124(player.skills.find(s=>s.name==="御剑术"))'); }

battle();
cast('御剑术');
assert.equal(guard(), 0);
const hp = run('player.hp');
enemyAttack();
const normalDamage = hp - run('player.hp');
assert.ok(normalDamage > 0);

battle();
cast('清风剑诀');
assert.ok(opening());
assert.equal(guard(), 0);
enemyAttack();
assert.match(finisherHint(), /可回锋/);
const before = run('player.hp');
const mp = run('player.mp');
run('combat("skill",-1); toggleCombatMedicineDrawer(true); toggleCombatMedicineDrawer(false)');
assert.ok(opening(), 'invalid input and viewing the bag do not spend a turn');
cast('御剑术');
cast('御剑术');
assert.equal(run('player.mp'), mp - 10, 'a second click during settlement cannot pay or cast twice');
assert.equal(opening(), false);
assert.equal(guard(), .3);
enemyAttack();
assert.equal(before - run('player.hp'), Math.floor(normalDamage * .7));
assert.equal(guard(), 0, 'a hit consumes the guard');

battle();
cast('清风剑诀');
enemyAttack();
run('applyGuardV2785({name:"更强护体",guardRatio:.5})');
cast('御剑术');
assert.equal(guard(), .5, 'the combo cannot stack with or replace a stronger guard');

battle();
cast('清风剑诀');
enemyAttack();
run('combat("attack")');
fixture.flush(150);
enemyAttack();
cast('御剑术');
assert.equal(guard(), 0, 'intervening basic attack gives up the opening');

battle();
cast('清风剑诀');
enemyAttack();
run('player.inventory.push("小还丹"); useCombatBagItem("小还丹")');
assert.equal(run('isPlayerTurn'), false);
assert.equal(opening(), false, 'drinking a pill uses up the opportunity');

battle();
cast('清风剑诀');
enemyAttack();
run('playerPressureStun=true');
cast('御剑术');
assert.equal(guard(), 0);
assert.equal(opening(), false, 'a lost turn cannot produce the follow-up');

battle({ _isTutorial:true });
cast('清风剑诀');
assert.equal(opening(), false, 'the tutorial keeps its scripted move sequence');
battle();
run('combat("skill", player.skills.findIndex(s => s.name === "清风剑诀")); COMBAT_FINISH_V2764.token++');
fixture.flush(300);
assert.equal(opening(), false, 'stale hit callback cannot create an opening');
assert.deepEqual(fixture.errors, []);
console.log(`PASS starter sword sequence, shield priority, cost, interruption, guards and reset. Fixed enemy hit ${normalDamage} → ${Math.floor(normalDamage*.7)}.`);
