'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};
const html=fs.readFileSync(root+'/game-v2762.html','utf8');
for(const n of JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run('startGame();closeWorldOverlay()');f.timers.clear();
function fresh(){f.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';COMBAT_FINISH_V2764.settling=false;COMBAT_FINISH_V2764.pending=null;currentEnemy=null;ensureTaskState();ensureTutorialState()");f.timers.clear();}

fresh();f.run('player.tutorial.readPopups=[];checkTutorialRealm(REGION_UNLOCK_LEVEL.north)');
a(f.run("player.tutorial.readPopups.includes('unlock_north')"),'north popup fires at the real unlock level');
a.equal(f.run("getBreakthroughStageLabel({ascension:true},3)"),'地仙道果 · 飞升仙界');
a.doesNotMatch(fs.readFileSync(root+'/xiantu-v2762-04-tutorial-guide-script.js','utf8'),/进入金仙/);
a.equal(f.run("getBreakthroughStageLabel({snapshot:{level:6}},2)"),'炼虚破而后立 · 道体重铸');
console.log('PASS realm copy and north unlock hint follow the runtime tables');

fresh();f.run("player.level=3;player.tasks.active.main_14=createTaskInstance(getTaskData('main_14'));currentChoices=[{text:'委托',action:'tournament_auto'}];handleChoice(0)");
a.equal(f.run("currentChoices.some(c=>c.action==='tournament_auto'&&c.confirmed)"),true,'delegating during main_14 asks for confirmation');
a.equal(f.run("currentChoices.some(c=>c.action==='tournament_start')"),true);
console.log('PASS delegating the tournament during 万宗争锋 warns first');

fresh();f.run('player.level=3');
a.equal(f.run("isLingxiaoNight()"),false);
a.match(f.run("canAccessBuilding('night_yaolu').reason||''"),/静候入夜/);
f.run('toggleLingxiaoNightV286838()');
a.equal(f.run("isLingxiaoNight()"),true);a.equal(f.run("player.worldTime.night"),true);
a.equal(f.run("currentChoices.some(c=>c.action==='lingxiao_night_v286838'&&c.text.includes('天明'))"),true);
a.equal(f.run("normalizePlayer(JSON.parse(JSON.stringify(player))).worldTime.night"),true,'night state survives save normalisation');
console.log('PASS night buildings use in-game day/night instead of the device clock');

a.equal(f.run("new Set(SECT_LIBRARY.map(x=>x.skillName)).size===SECT_LIBRARY.length"),true,'sect library has no duplicate entries');
const realm=f.run("Object.entries(ACHIEVEMENTS).filter(([,v])=>v.type==='realm').map(([id,v])=>[id,v.target,v.phase||0,v.desc])");
const keys=realm.map(r=>r[1]+':'+r[2]);a.equal(new Set(keys).size,keys.length,'realm achievements have distinct realm/phase targets');
a(realm.some(r=>r[1]===10)&&realm.some(r=>r[1]===11),'地仙 and 天仙 achievements exist');
fresh();f.run("initAchievements();completedAchievements.clear();player.level=2;player.phase=1;checkAchievement('realm',2)");
a.equal(f.run("completedAchievements.has('realm_kaiguang')"),true);a.equal(f.run("completedAchievements.has('realm_xindong')"),false);
console.log('PASS achievement list is de-duplicated and covers 地仙/天仙');

fresh();f.run('isMuted=false');
const quick=f.c.document.createElement('button');quick.id='quickMuteV286838';f.ids.set('quickMuteV286838',quick);
f.run('toggleMute()');a.match(quick.textContent,/取消静音/);a.equal(quick.getAttribute?.('aria-pressed')??'true','true');
f.run('toggleMute()');a.match(quick.textContent,/^🔊 静音/);
a.match(f.run("ACHIEVEMENTS.boss_first.name"),/首领/);
a.doesNotMatch(html,/user-scalable=no/);a.match(html,/Object\.hasOwn/);a.match(html,/rel="icon"/);
console.log('PASS mute label, terminology, zoom, polyfill and favicon');

fresh();f.run("player.level=16;player.tasks.completed=MAIN_TASKS.map(t=>t.id);player.tasks.choices={main_19:'guard'};showEpilogueV286838()");
const ep=f.ids.get('expansionV286827');a(ep,'epilogue opens');a.match(ep.innerHTML,/道途圆满/);a.match(ep.innerHTML,/继续自由修炼/);
a.equal(f.run('player.tasks.epilogueShownV286838'),true);
console.log('PASS main_19 has an epilogue with a free-play exit');

(async()=>{
 let calls=0;f.c.fetch=async()=>{calls++;return {ok:false,status:403,json:async()=>({})};};
 f.run("JEV_FRIENDS_V2850.mode=true;JEV_FRIENDS_V2850.paused=false;JEV_FRIENDS_V2850.retryAt=0;JEV_FRIENDS_V2850.token=''");
 const first=await f.run("ensureJevFriendSessionV2850().then(()=>'ok',e=>e.message)");
 a.equal(first,'public_403');a.equal(f.run('JEV_FRIENDS_V2850.retryAt'),Infinity);
 const second=await f.run("ensureJevFriendSessionV2850().then(()=>'ok',e=>e.message)");
 a.equal(second,'public_wait');a.equal(calls,1,'a refused origin is not polled again');
 console.log('PASS Jev public session stops retrying after a 403');
})().catch(e=>{console.error(e);process.exitCode=1;});
