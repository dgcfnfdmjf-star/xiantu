'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
function game(){const f=fixture(root);f.c.console.log=()=>{};f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.storage.set('xiantu_battle_presentation_v2756','report');for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.run('startGame();closeWorldOverlay();MONSTER_JEV_V2844.enabled=false;completedAchievements=new Set(Object.keys(ACHIEVEMENTS))');f.timers.clear();return f;}
function prep(f,id='journey_01'){f.c.id=id;f.run("resetRuntimeState();player=createDefaultPlayer();player.level=16;ensureTaskState();player.tasks.completed=MAIN_TASKS.slice(0,MAIN_TASKS.findIndex(t=>t.id===id)).map(t=>t.id);acceptTask(id,true);completeTaskStep(id,id+'_open');player.hp=42;player.mp=13;launchJourneyBattleV2838(id)");f.timers.clear();}
function clickPrep(f,action,el=f.ids.get('journeyPrepareV2838')){el.onclick({target:{closest:()=>({dataset:{journey:action}})}});}
const f=game();
for(let n=1;n<=8;n++){
 prep(f,'journey_0'+n);const before=f.run('JSON.stringify([player.gold,player.exp,player.hp,player.mp,player.inventory])');clickPrep(f,'all');
 a.equal(f.run('journeyPrepV286823(id).clues.length'),2);a.equal(f.run('journeyPrepV286823(id).plan'),null);a.equal(f.run('gameState'),'exploring');a.equal(f.run('JSON.stringify([player.gold,player.exp,player.hp,player.mp,player.inventory])'),before);
 a.equal(f.run("setJourneyPrepV286823(id,'all')"),false);
 a(f.ids.get('journeyPrepareV2838').innerHTML.includes(f.run('investigationV286823(id).clues[1][1]')));
 const plan=n%2?'guard':'breach';clickPrep(f,plan);const def=f.run('journeyEnemyV2838(JOURNEYS_V2838.find(j=>j.id===id)).def');clickPrep(f,'fight');a.equal(f.run('gameState'),'combat');a.equal(f.run('currentEnemy.def'),def);a.equal(f.run('player.mp'),13);
 if(plan==='guard')a.equal(f.run('elementGuardsV286818.get(currentEnemy).pool'),f.run('Math.floor(getMaxHp()*.12)'));
}
prep(f);const old=f.run('JSON.stringify(getTaskInstance(id).progress)'),save=f.c.saveGame;f.c.saveGame=()=>false;clickPrep(f,'all');a.equal(f.run('JSON.stringify(getTaskInstance(id).progress)'),old);f.c.saveGame=()=>{throw Error('quota')};clickPrep(f,'all');a.equal(f.run('JSON.stringify(getTaskInstance(id).progress)'),old);f.c.saveGame=save;
const stale=f.ids.get('journeyPrepareV2838');f.run('launchJourneyBattleV2838(id)');clickPrep(f,'all',stale);a.equal(f.run('journeyPrepV286823(id).clues.length'),0);
f.run('launchJourneyBattleV2838(id)');clickPrep(f,'all');f.run('player=normalizePlayer(loadGame().player)');a.equal(f.run('journeyPrepV286823(id).clues.length'),2);
// Remote dossier respects saint + main-story gates, leaves travel and currency untouched, and is atomic.
f.run("resetRuntimeState();player=createDefaultPlayer();ensureTaskState();player.level=15;player.tasks.completed=['main_19']");a.equal(f.run('surveyDossierV2884()'),false);f.run('player.level=16;player.tasks.completed=[]');a.equal(f.run('surveyDossierV2884()'),false);
f.run("player.tasks.completed=['main_19'];currentRegion='south';player.storyExpansionV286827={fragments:['north']}");
const state=f.run('JSON.stringify([player.gold,player.exp,currentRegion,player.x,player.y])'),expOld=f.run('JSON.stringify(player.storyExpansionV286827)');f.c.saveGame=()=>false;a.equal(f.run('surveyDossierV2884()'),false);a.equal(f.run('JSON.stringify(player.storyExpansionV286827)'),expOld);f.c.saveGame=()=>{throw Error('quota')};a.equal(f.run('surveyDossierV2884()'),false);a.equal(f.run('JSON.stringify(player.storyExpansionV286827)'),expOld);f.c.saveGame=save;
a.equal(f.run('surveyDossierV2884()'),true);a.equal(f.run('expansionStateV286827().fragments.length'),3);a.equal(f.run('JSON.stringify([player.gold,player.exp,currentRegion,player.x,player.y])'),state);a.equal(f.run('surveyDossierV2884()'),false);f.run('player=normalizePlayer(loadGame().player)');a.equal(f.run('expansionStateV286827().fragments.length'),3);
f.run('player.storyExpansionV286827={};gameState="combat"');a.equal(f.run('surveyDossierV2884()'),false);
// Real pet formulas and battle checkpoints; invalid/no-op selections never spend the allowance.
const p=game();p.run(`player.level=6;player.pets=[{_petId:'pet_a',type:'灵狐',name:'狐',level:10},{_petId:'pet_b',type:'玄龟',name:'龟',level:10,mutationTraits:[{name:'护生',key:'hp',value:.5,tier:'normal'}]}];ensurePetSystemState();player.pets.forEach(ensurePetGrowthStateV210);player.activePet=player.pets[0];player.hp=getMaxHp();player.mp=getMaxMp();startCombat({name:'野狼',hp:1000,maxHp:1000,atk:2,def:2,gold:0,exp:0});`);p.timers.clear();
a.equal(p.run('showCombatPetsV2884()'),true);p.run('globalThis.session=combatPetSessionV2884');a.equal(p.run("switchCombatPetV2884(session,'missing')"),false);a.equal(p.run("switchCombatPetV2884(session,'pet_a')"),false);
p.run('isPlayerTurn=false');a.equal(p.run("switchCombatPetV2884(session,'pet_b')"),false);p.run('isPlayerTurn=true;player.petCapture.isCapturing=true');a.equal(p.run("switchCombatPetV2884(session,'pet_b')"),false);p.run('player.petCapture.isCapturing=false');
const vitals=p.run('JSON.stringify([player.hp,player.mp,currentEnemy.hp,isPlayerTurn])'),atk=p.run('getDef()');
a.equal(p.run("switchCombatPetV2884(session,'pet_b')"),true);a.equal(p.run('player.activePet===player.pets[1]'),true);a.equal(p.run('JSON.stringify([player.hp,player.mp,currentEnemy.hp,isPlayerTurn])'),vitals);a(p.run('getDef()')>atk);a.equal(p.run('canSwitchCombatPetV2884()'),false);a.equal(p.run("switchCombatPetV2884(session,'pet_a')"),false);
p.run("setActivePetById('pet_a')");a.equal(p.run('player.activePet._petId'),'pet_b');
a.equal(p.run('createSaveDataV2768().player.activePet._petId'),'pet_a','refresh restores pre-battle pet, not a mid-battle checkpoint');
p.run("beginCombatFinishV2764('flee');completeCombatFinishV2764()");p.timers.clear();a.equal(p.run('loadGame().player.activePet._petId'),'pet_b','normal finish persists pet');
p.run('player.hp=getMaxHp();player.mp=getMaxMp();startCombat({name:"野狼",hp:1000,maxHp:1000,atk:2,def:2,gold:0,exp:0});showCombatPetsV2884();globalThis.nextSession=combatPetSessionV2884');p.timers.clear();const oldMax=p.run('getMaxHp()');a.equal(p.run("switchCombatPetV2884(nextSession,'pet_a')"),true);a(p.run('getMaxHp()')<oldMax);a.equal(p.run('player.hp'),p.run('getMaxHp()'));
p.run('resetRuntimeState();player.hp=getMaxHp();startCombat({name:"野狼",hp:1000,maxHp:1000,atk:2,def:2,gold:0,exp:0});showCombatPetsV2884();globalThis.staleSession=combatPetSessionV2884');p.timers.clear();p.run('resetRuntimeState()');a.equal(p.run("switchCombatPetV2884(staleSession,'pet_b')"),false);a.equal(p.run('combatPetSessionV2884'),null);
p.run('player.hp=getMaxHp();startCombat({name:"野狼",hp:1000,maxHp:1000,atk:2,def:2,gold:0,exp:0});showCombatPetsV2884();globalThis.ownerSession=combatPetSessionV2884;player=createDefaultPlayer()');a.equal(p.run("switchCombatPetV2884(ownerSession,'pet_b')"),false);
console.log('PASS 8 quick investigation paths, no free supplies, dossier gates/rollback/reload, battle-local pet allowance, turn/capture/owner/stale guards, real caps/defense and checkpoint persistence');
