const fs=require('fs'),assert=require('assert/strict');const root='release-v2864/xiantu-v2831-scroll';
const f=require('../'+root+'/QA/v2858-dom-fixture.cjs')(root);for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.run('startGame();closeWorldOverlay();');f.timers.clear();const run=s=>f.run(s);
for(const state of ['combat','combat-ending']){
 run(`gameState='${state}';`);const before=run('JSON.stringify(player)');
 for(const fn of ['showMapNpcHub','talkToMapNpc','showMapNpcIntel','acceptMapNpcQuest','submitMapNpcQuest','claimMapNpcReward','showMapNpcShop'])run(fn+'("mentor")');
 run('interactFlatWorld()');assert.equal(run('JSON.stringify(player)'),before);assert.equal(run('gameState'),state);
}
run('gameState="exploring";COMBAT_FINISH_V2764.settling=true;claimMapNpcReward("mentor")');assert.equal(run('gameState'),'exploring');
run('COMBAT_FINISH_V2764.settling=false;player.breakthrough.isAnimating=true;');assert.equal(run('canMapNpcActV2864()'),false);run('player.breakthrough.isAnimating=false;');
run('player.mapNpc=createDefaultMapNpcState();');let before=run('JSON.stringify(player)');assert.equal(run('mapNpcStatusV2864(WORLD_POI_TEMPLATES.mentor_npc)'),'可领取');assert.equal(run('JSON.stringify(player)'),before);
run('claimMapNpcReward("mentor");showMapNpcHub("mentor");');assert.equal(run('currentChoices.find(c=>c.action==="map_npc_reward").condition()'),false);assert.equal(run('mapNpcStatusV2864(WORLD_POI_TEMPLATES.mentor_npc)'),'有委托');
const gold=run('player.gold');run('claimMapNpcReward("mentor")');assert.equal(run('player.gold'),gold);
run('acceptMapNpcQuest("mentor");player.materials["灵草"]=3;');assert.equal(run('mapNpcStatusV2864(WORLD_POI_TEMPLATES.mentor_npc)'),'可交付');
run('submitMapNpcQuest("mentor")');assert.equal(run('mapNpcStatusV2864(WORLD_POI_TEMPLATES.mentor_npc)'), '');assert.equal(run('player.materials["灵草"]'),0);
run('player.worldTime.totalDays++;');assert.equal(run('mapNpcStatusV2864(WORLD_POI_TEMPLATES.mentor_npc)'),'可领取');
run('player.gold=30;player.inventory=["小还丹","小还丹"];showMapNpcShop("trader");');assert.match(run('currentChoices[0].text'),/已有2/);assert.equal(run('currentChoices[1].condition()'),false);
f.c.confirm=()=>false;run('buyFromMapNpc("trader","小还丹",25)');assert.equal(run('player.gold'),30);
f.c.confirm=()=>true;run('buyFromMapNpc("trader","小还丹",25)');assert.equal(run('player.gold'),5);assert.equal(run('player.inventory.length'),3);
console.log('PASS NPC combat/settlement/breakthrough guards, read-only badges, gift refresh, no duplicate rewards, quest submission, stock counts and purchase confirmation');
