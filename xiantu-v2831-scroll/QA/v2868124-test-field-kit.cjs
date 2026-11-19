'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const fixture = require('./v2858-dom-fixture.cjs');

const root = process.env.XIANTU_TEST_ROOT || path.resolve(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'game-v2762.html'), 'utf8');
const files = JSON.parse(entry.match(/var files=(\[[^;]+\]);/)[1]);
const pack = 'packFieldKitV2868124()';
const unpack = 'useItem("行药囊")';
const drink = 'useCombatBagItem("行药囊")';

function game(inventory) {
  const f = fixture(root);
  f.c.Math = Object.create(Math);
  f.c.Math.random = () => 0.5;
  f.storage.set('xiantu_battle_presentation_v2756', 'report');
  for (const file of files) f.load(file);
  f.run('startGame(); closeWorldOverlay()');
  f.run(`player.inventory = ${JSON.stringify(inventory)}`);
  return f;
}

function battle() {
  const f = game(['小还丹', '聚灵丹', '小还丹']);
  assert.equal(f.run(pack), true);
  f.run("startCombat({name:'野狼', hp:500, maxHp:500, atk:2, def:2, _realmLevel:0, _realmPhase:0})");
  f.timers.clear();
  return f;
}

test('stored pills pack once, survive loading, and unpack into the original quantities', () => {
  const f = game(['小还丹', '聚灵丹', '小还丹', '聚灵丹']);
  assert.equal(f.run('saveGame()'), true);
  f.run('loadAndStart()');
  assert.equal(f.run(pack), true);
  assert.deepEqual([...f.run('loadGame().player.inventory')], ['小还丹', '聚灵丹', '行药囊']);
  assert.equal(f.run(pack), false, 'a second pair of pills cannot form a second kit');
  f.run('loadAndStart()');
  const vitals = [...f.run('[player.hp, player.mp]')];
  assert.equal(f.run(unpack), true);
  f.run(unpack);
  assert.deepEqual([...f.run('loadGame().player.inventory')].sort(), ['小还丹', '小还丹', '聚灵丹', '聚灵丹'].sort());
  assert.deepEqual([...f.run('[player.hp, player.mp]')], vitals);
});

test('missing ingredients, full inventory and unavailable map actions leave the bag intact', () => {
  const f = game(['大还丹', '聚灵丹']);
  assert.equal(f.run(pack), false);
  assert.deepEqual([...f.run('player.inventory')], ['大还丹', '聚灵丹']);
  f.run("player.inventory = Array(99999).fill('小还丹'); player.inventory.push('行药囊')");
  f.run(unpack);
  assert.equal(f.run('player.inventory.length'), 100000);
  assert.equal(f.run("player.inventory.at(-1)"), '行药囊');
  assert.equal(f.run("player.inventory.includes('聚灵丹')"), false);

  for (const setup of [
    "gameState='combat'", "gameState='combat-ending'", "gameState='alchemy'",
    "gameState='exploring'; player.breakthrough.isAnimating=true",
  ]) {
    f.run(setup);
    f.run("player.inventory=['小还丹','聚灵丹']");
    f.run(pack);
    assert.deepEqual([...f.run('player.inventory')], ['小还丹', '聚灵丹'], setup);
    f.run("player.inventory=['行药囊']");
    f.run(unpack);
    assert.deepEqual([...f.run('player.inventory')], ['行药囊'], setup);
  }
});

test('a failed save rolls back packing and unpacking', () => {
  for (const [action, inventory] of [[pack, ['小还丹', '聚灵丹']], [unpack, ['行药囊']]]) {
    const f = game(inventory);
    assert.equal(f.run('saveGame()'), true);
    const previous = f.storage.get('xiantu_save');
    const write = f.c.localStorage.setItem;
    f.c.localStorage.setItem = (key, value) => {
      if (key === 'xiantu_save') throw Error('quota');
      return write(key, value);
    };
    assert.equal(f.run(action), false);
    assert.equal(f.storage.get('xiantu_save'), previous);
    assert.deepEqual([...f.run('player.inventory')], inventory);
  }
});

test('the combat drawer previews capped amounts in both medicine tabs and consumes one turn', () => {
  const f = battle();
  f.run('player.hp=getMaxHp()-37; player.mp=getMaxMp()-8; toggleCombatMedicineDrawer(true)');
  for (const tab of ['all', 'heal', 'mp', 'item', 'equip']) {
    f.run(`setCombatMedicineTab('${tab}')`);
    const html = f.ids.get('combatItemDrawer').innerHTML;
    if (tab === 'item' || tab === 'equip') assert.doesNotMatch(html, /行药囊/);
    else assert.match(html, /行药囊[\s\S]*?实际恢复 30 点气血、8 点灵力/);
  }
  let replies = 0;
  const enemyTurn = f.c.enemyTurn;
  f.c.enemyTurn = (...args) => { replies++; return enemyTurn(...args); };
  f.run(drink);
  f.run(drink);
  f.run('useCombatBagItem("小还丹")');
  assert.deepEqual([...f.run('[getMaxHp()-player.hp,getMaxMp()-player.mp,isPlayerTurn]')], [7, 0, false]);
  assert.deepEqual([...f.run('player.inventory')], ['小还丹']);
  assert.match(f.ids.get('combatLog').firstChild.innerHTML, /实际恢复 30 点气血、8 点灵力/);
  f.flush(500);
  f.flush(150);
  assert.equal(replies, 1);
  assert.equal(f.run('isPlayerTurn'), true);
});

test('a full pair or enemy turn keeps the kit, either single deficit can use it', () => {
  for (const [missingHp, missingMp] of [[7, 0], [0, 9]]) {
    const f = battle();
    f.run('player.hp=getMaxHp(); player.mp=getMaxMp()');
    f.run(drink);
    assert.equal(f.run("player.inventory.includes('行药囊') && isPlayerTurn"), true);
    f.run(`player.hp-=${missingHp}; player.mp-=${missingMp}; isPlayerTurn=false`);
    f.run(drink);
    assert.equal(f.run("player.inventory.includes('行药囊')"), true);
    assert.deepEqual([...f.run('[getMaxHp()-player.hp,getMaxMp()-player.mp]')], [missingHp, missingMp]);
    f.run('isPlayerTurn=true');
    f.run(drink);
    assert.equal(f.run("player.inventory.includes('行药囊')"), false);
    assert.deepEqual([...f.run('[getMaxHp()-player.hp,getMaxMp()-player.mp,isPlayerTurn]')], [0, 0, false]);
  }
});
