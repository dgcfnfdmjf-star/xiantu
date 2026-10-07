'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run('startGame();closeWorldOverlay()');f.timers.clear();
function fresh(){f.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';ensureTaskState();");f.timers.clear();}
for(const v of [0,1,35,36]){fresh();f.c.v=v;f.run('player.level=2;player.heartDemon.attachment=v');a.equal(f.run("getTaskStatus('side_hidden_03')"),v<=35?'available':'locked');}
for(const [input,want] of [[{},0],[{zhinian:0},0],[{zhinian:22},22],[{heartDemon:{attachment:0},zhinian:60},0],[{heartDemon:{attachment:60}},60]]){
 f.c.saved=input;a.equal(f.run('normalizePlayer(saved).heartDemon.attachment'),want);
}
fresh();f.run("player.level=2;player.storyProgress=2;player.romance.npcs.suwanqing.affection=20;addAffection('suwanqing',30)");
a.equal(f.run('player.romance.npcs.suwanqing.affection'),20);a.equal(f.run('player.romance.npcs.suwanqing.resonanceV286826'),30);
f.run('saveGame();player=normalizePlayer(loadGame().player)');a.equal(f.run('player.romance.npcs.suwanqing.resonanceV286826'),30);
f.run("resolveRomanceEvent('suwanqing','cold_reunion',0)");a.equal(f.run('player.romance.npcs.suwanqing.affection'),40);a.equal(f.run('player.romance.npcs.suwanqing.resonanceV286826'),20);
const once=f.run('JSON.stringify(player.romance)');f.run("resolveRomanceEvent('suwanqing','cold_reunion',0)");a.equal(f.run('JSON.stringify(player.romance)'),once);
fresh();f.run("player.romance.npcs.suwanqing.affection=100;resolveRomanceEvent('suwanqing','cold_reunion',0)");a.equal(f.run('getSuReunionCount()'),0);
f.run("player.level=16;player.storyProgress=6;player.romance.npcs.suwanqing.affection=0;resolveRomanceEvent('suwanqing','cold_reunion',0)");a.equal(f.run('getSuReunionCount()'),0);
f.run("player.romance.npcs.suwanqing.affection=8;player.romance.npcs.suwanqing.resonanceV286826=Infinity;addAffection('suwanqing',Infinity)");a.equal(f.run('player.romance.npcs.suwanqing.affection'),8);
fresh();f.run('player.level=2;player.storyProgress=0');a.match(f.run("romanceGuideV286826(ROMANCE_NPCS.suwanqing.events[0],player.romance.npcs.suwanqing)"),/旧地点故事/);
a.match(f.run("choiceNoteV286826('main_11')"),/君子之约/);
// Letters precede challenge realm; no automatic chapter progression or repeated claims.
fresh();f.run("player.tasks.completed=['main_16'];player.level=5");a.equal(f.run('readStoryMailV286826()'),true);a.equal(f.run('readStoryMailV286826()'),false);a.equal(f.run("getTaskStatus('journey_01')"),'locked');
f.run('player.storyMailV286826.at-=86400001');a.equal(f.run('readStoryMailV286826()'),true);
const old=f.run('JSON.stringify(player.storyMailV286826)');f.run('player.storyMailV286826.at-=86400001');const before=f.run('JSON.stringify(player.storyMailV286826)');const set=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(f.run('readStoryMailV286826()'),false);a.equal(f.run('JSON.stringify(player.storyMailV286826)'),before);f.c.localStorage.setItem=set;
// Postlude uses saved gates, cooldown, stale-session and failed-save protection, no asset rewards.
fresh();a.equal(f.run('postCaseOpenV286826()'),false);f.run("player.level=16;player.tasks.completed=['main_19'];player.rainChapterV286822={step:13};showPostCaseV286826()");const gold=f.run('player.gold');a.equal(f.run('recordPostCaseV286826(postCaseSessionV286826)'),true);a.equal(f.run('recordPostCaseV286826(postCaseSessionV286826)'),false);
f.run('showPostCaseV286826()');a.equal(f.run('recordPostCaseV286826(postCaseSessionV286826)'),false);f.run('player.postCaseV286826.at-=86400001');f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(f.run('recordPostCaseV286826(postCaseSessionV286826)'),false);a.equal(f.run('player.postCaseV286826.step'),1);f.c.localStorage.setItem=set;
a.equal(f.run('recordPostCaseV286826(postCaseSessionV286826)'),true);a.equal(f.run('player.gold'),gold);
// Actual story boss entry prep applies one bonus to this enemy only.
for(const plan of ['guard','breach','none']){
 fresh();f.run("player.level=3;currentChoices=[{action:'boss_ghost_king'}];handleChoice(0)");const el=f.ids.get('storyBossPrepV286826');a(el);el.onclick({target:{closest:()=>({dataset:{prep:plan}})}});a.equal(f.run('gameState'),'combat');
 if(plan==='guard')a.equal(f.run('elementGuardsV286818.get(currentEnemy).pool'),f.run('Math.floor(getMaxHp()*.12)'));
 const hp=f.run('currentEnemy.hp');el.onclick({target:{closest:()=>({dataset:{prep:plan}})}});a.equal(f.run('currentEnemy.hp'),hp);
}
// Three action warmup, permanent collapse, heal revalidation, no self-kill; no buff stacking.
fresh();f.run('player.level=15;startCombat(createYeWujiV2810(),true);');a(f.run('!!currentEnemy._originV286826'));const def=f.run('currentEnemy.def'),atk=f.run('currentEnemy.atk');a.equal(f.run('enemyDefenseV286818()'),def*1.25);a.equal(f.run('enemyAttackV286818()'),atk*1.1);
for(let n=0;n<3;n++)f.run('tickRivalOriginV286826(currentEnemy)');a.equal(f.run('currentEnemy._originV286826.collapsed'),false);
const hp=f.run('currentEnemy.hp');f.run('tickRivalOriginV286826(currentEnemy)');a.equal(f.run('currentEnemy._originV286826.collapsed'),true);a(f.run('currentEnemy.hp')<hp);a.equal(f.run('enemyDefenseV286818()'),def);a.equal(f.run('enemyAttackV286818()'),atk*1.2);
a.equal(f.run("monsterAvailableV2844(monsterStateV2844()).includes('heal')"),false);
f.run('currentEnemy.hp=1;tickRivalOriginV286826(currentEnemy)');a.equal(f.run('currentEnemy.hp'),1);a.match(f.ids.get('enemyName').innerHTML,/道基崩裂/);
fresh();f.run('player.level=14;startCombat(createYeWujiV2810(),true)');a.equal(f.run('!!currentEnemy._originV286826'),false);
console.log('PASS zero/legacy boundaries, capped resonance roundtrip and once-only release, event gate, actionable hints, letters and postlude rollback/cooldown, boss deployment, rival phase/heal/no self-kill');
