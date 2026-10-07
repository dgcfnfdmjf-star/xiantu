'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path'),root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);f.run('startGame();closeWorldOverlay()');f.timers.clear();
function fresh(){f.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';ensureTaskState();");f.timers.clear();}
function act(k){f.c.key=k;return f.run('actRainTwoV286827(expansionSessionV286827,key)');}
function click(k,el=f.ids.get('expansionV286827')){el.onclick({target:{closest:()=>({dataset:{expansion:k}})}});}
fresh();a.equal(f.run('MAIN_TASKS.length'),27);a.equal(f.run('yeChaptersV2816().length'),8);a(f.run('ROMANCE_NPCS.suwanqing.events.every(e=>e.choices.at(-1).distantV286827)'));
// Actual unlock conditions and both battle plans across all 3 final policies, inherited opening choices.
for(const plan of ['guard','breach'])for(const ending of ['arrest','rescue','seal']){
 fresh();a.equal(f.run('rainTwoUnlockedV286827()'),false);f.run("player.level=6;player.hp=getMaxHp();player.mp=getMaxMp();player.rainChapterV286822={step:13,route:'rescue',trust:'share',policy:'public'};showRainTwoV286827()");a(f.ids.get('expansionV286827'));a.equal(f.run('isWorldOverlayOpen()'),true);a.match(f.run('rainTwoPagesV286827(1).join()'),/署名作证/);
 a.equal(act('arrest'),false);for(let i=0;i<4;i++)a.equal(act('next'),true);
 a.equal(act(plan),false);a.equal(act('seal'),true);a.equal(act('seal'),false);a.equal(act('route'),true);a.equal(act(plan),true);
 a.equal(act('fight'),true);a.equal(f.run('gameState'),'combat');if(plan==='guard')a.equal(f.run('elementGuardsV286818.get(currentEnemy).pool'),f.run('Math.floor(getMaxHp()*.12)'));
 f.run('finishRainTwoV286827(currentEnemy)');a.equal(f.run('expansionStateV286827().rain2.step'),5);
 f.run('currentEnemy.hp=0;finishRainTwoV286827(currentEnemy);finishRainTwoV286827(currentEnemy);gameState="exploring";COMBAT_FINISH_V2764.settling=false;battleCheckpointV286812=null;showRainTwoV286827()');a.equal(f.run('expansionStateV286827().rain2.step'),6);
 a.equal(act('next'),true);a.equal(act(ending),true);const gold=f.run('player.gold'),exp=f.run('player.exp');a.equal(act('next'),true);a.equal(f.run('player.gold'),gold+600);a.equal(f.run('player.exp'),exp+300);a.equal(act('next'),false);
 f.run('saveGame();player=normalizePlayer(loadGame().player)');a.equal(f.run('expansionStateV286827().rain2.step'),9);f.c.end=ending;a.equal(f.run('expansionStateV286827().rain2.ending'),ending);f.run('showRainTwoV286827(8)');a.equal(act('next'),false);a.equal(f.run('player.gold'),gold+600);
 a.match(f.run('chronicleV286827()'),/雨夜卷二/);
}
// Failed save on final reward must roll back step AND both asset deltas; stale panels ignored.
fresh();f.run("player.level=6;player.rainChapterV286822={step:13};player.storyExpansionV286827={rain2:{step:8,ending:'rescue'}};showRainTwoV286827()");const old=f.run('JSON.stringify([player.storyExpansionV286827,player.gold,player.exp])'),set=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('quota')};a.equal(act('next'),false);a.equal(f.run('JSON.stringify([player.storyExpansionV286827,player.gold,player.exp])'),old);f.c.localStorage.setItem=set;
const stale=f.ids.get('expansionV286827');f.run('showExpansionV286827()');click('next',stale);a.equal(f.run('expansionStateV286827().rain2.step'),8);
// Optional scenes cannot lock the main sequence; rewards once, old choice retained on refresh.
fresh();f.run("player.level=8;player.tasks.completed=['journey_03'];showExpansionSceneV286827('ji_ash')");const xp=f.run('player.exp');click('home');a.equal(f.run('player.exp'),xp+100);click('home');a.equal(f.run('player.exp'),xp+100);f.run('saveGame();player=normalizePlayer(loadGame().player)');a.equal(f.run('expansionStateV286827().scenes.ji_ash'),'home');
// Seven distancing choices remain usable without romance forced, last one becomes old release state.
fresh();f.run('player.level=16;player.storyProgress=6;player.romance.npcs.suwanqing.affection=100');
for(let i=0;i<7;i++){f.c.idx=i;f.run('resolveRomanceEvent(MAIN_HEROINE_ID,SU_REUNION_EVENT_IDS[idx],2)');}
a.equal(f.run('getSuReunionCount()'),7);a.equal(f.run('player.romanceProgress.endingType'),'release');a.equal(f.run('player.romance.partner'),null);a.match(f.run('getRomanceStage(100,false,MAIN_HEROINE_ID)'),/知己/);
f.run('endingReunion()');a.equal(f.run('player.romance.partner'),null);a.equal(f.run('rainUnlockedV286822()'),true);
a.match(f.run('chronicleV286827()'),/过去已经过去/);
// Neutral main choice grants once, known identity changes contemporary dialogue.
fresh();f.run("player.level=2;player.tasks.active.main_09={currentStep:2,progress:{},completed:false};onChoiceMade('main_09','neutral')");a.equal(f.run('player.rivalState.neutralV286827'),1);const affection=f.run('player.romance.npcs.suwanqing.affection');f.run("onChoiceMade('main_09','neutral')");a.equal(f.run('player.romance.npcs.suwanqing.affection'),affection);
f.run("player.storyExpansionV286827={scenes:{rumor_gu:'listen',rumor_su:'hear'}}");a.match(f.run('getMainHeroineRivalStatus()'),/已知/);
// Only current mapped region grants its fragment; no duplicates or early dossiers.
fresh();a.equal(f.run('collectFragmentV286827()'),false);f.run("player.level=16;player.tasks.completed=['main_19'];currentRegion='south'");a.equal(f.run('collectFragmentV286827()'),false);
for(const region of ['north','east','immortal_domain']){f.c.region=region;f.run('currentRegion=region');a.equal(f.run('collectFragmentV286827()'),true);a.equal(f.run('collectFragmentV286827()'),false);}
a.match(f.run('dossierCardV286827()'),/现有证据全录/);
// Reading high-attachment scenes must never append to shared definitions.
f.run('player.heartDemon.attachment=90');const size=f.run("scenePagesV2838('journey_07','journey_07_open').length");a.equal(f.run("scenePagesV2838('journey_07','journey_07_open').length"),size);
f.run("player.storyExpansionV286827={rain2:{step:9,ending:'arrest'}}");a.match(f.run("postCaseTextV286827('旧记录',0)"),/两人找回/);
a.equal(f.run('normalizeExpansionV286827({rain2:{step:Infinity},scenes:{evil:"x"}}).rain2.step'),0);
a.equal(f.run('normalizeExpansionV286827({rain2:{clues:{}},fragments:{}}).rain2.clues.length'),0);
console.log('PASS 6 rain-II paths, inherited context, reward/save rollback, stale/replay guards, 7 distant events, neutral branch, regional dossier, non-mutating recap and old archive continuity');
