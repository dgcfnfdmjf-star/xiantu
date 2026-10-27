'use strict';
/*
 * QA/v2889-test-battle25d.cjs - 2.5D battle stage and feedback (xiantu-v2889-battle25d.js), against the installed code.
 * Checks: loading, the stage and its region/tier, turn cue, tweened bars, hit/crit/heal/dodge/block bursts, phone
 * skill buttons, the off switch, reduced motion, the 镇岳台 (V2887) screen, and - most important - that a seeded
 * battle ends in exactly the same state with the module on and off (presentation only, no gameplay change).
 * Visual quality is checked by eye (see the install notes).
 * Run:  XIANTU_TEST_ROOT=xiantu-v2831-scroll node xiantu-v2831-scroll/QA/v2889-test-battle25d.cjs
 */
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const html=fs.readFileSync(root+'/game-v2762.html','utf8'),files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
function game(withModule=true){const f=fixture(root);f.c.console.log=()=>{};f.c.console.warn=(...x)=>f.errors.push(['warn',...x]);for(const file of files){if(!withModule&&file==='xiantu-v28684-duel.js')f.run(fs.readFileSync(root+'/'+file,'utf8').replace(/\/\/ BEGIN BATTLE25D_V2889[\s\S]*?\/\/ END BATTLE25D_V2889/,''));else f.load(file);}return f;}
const runAll=(f,rounds=40)=>{for(let i=0;i<rounds&&f.timers.size;i++)for(const [id,t] of [...f.timers]){f.timers.delete(id);try{t.f();}catch(e){f.errors.push(['timer',e]);}}};
const childCount=(el,cls)=>el.children.filter(c=>(c.className||'').split(/\s+/).includes(cls)).length;

// ---------------------------------------------------------------- loading ----
const f=game();
a.equal(files.length,40);a.equal(files.at(-1),'xiantu-v28684-duel.js');
a.equal(f.run('window.__xiantuBuildFilesV2814["xiantu-v28684-duel.js"]'),html.match(/var expectedBuild='([^']+)'/)[1]);
for(const n of ['startCombat','updateCombatUI','updateCombatChoices','combat','enemyTurn','checkBattleEnd','playHitEffect','showDamageNumber','addCombatLog','showBossFightV2887','bossActV2887','showBossAltarV2887'])
  a.equal(f.run(`!!window.${n}?._b25V2889`),true,n+' wrapped');
f.run('installBattleAll25dV2889()');a.equal(f.run('window.playHitEffect._baseV2889._b25V2889'),undefined,'no double wrap');
a.equal(f.run("document.getElementById('battle25dStyleV2889')?.tagName"),'STYLE');

const on=g=>g.run("setBattle25dV2889(true)"),off=g=>g.run("if(typeof setBattle25dV2889==='function')setBattle25dV2889(false)");
function fight(g,opts='{}'){g.run(`resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.level=4;player.hp=getMaxHp();player.mp=getMaxMp();
  (()=>{const o=${opts};if(o.region)currentRegion=o.region;const e={...getEnemy(),name:'层次测试木桩'};e._isElite=!!o.elite;startCombat(e,!!o.boss,!!o.trib);})()`);}
const panel=g=>g.run("document.getElementById('combatPanel')"),arena=g=>g.run("document.getElementById('combatArena')");
const stage=g=>arena(g).children.find(c=>c.className==='b25-stage-v2889');

// ---------------------------------------------------------------- stage, tier, region ----
on(f);fight(f,"{region:'north'}");
{
  const s=stage(f);a(s,'stage created');a.equal(s.getAttribute('aria-hidden'),'true');a.equal(s.dataset.region,'north');a.equal(s.dataset.tier,'normal');
  a(panel(f).classList.contains('b25-on-v2889'));a.equal(arena(f).children.indexOf(s),0,'stage is the first, back-most child');
  for(let i=0;i<5;i++)f.run('updateCombatUI();updateCombatChoices()');
  for(const id of ['playerCombatant','enemyCombatant']){const c=f.run(`document.getElementById('${id}')`);a.equal(childCount(c,'b25-pedestal-v2889'),1,id+' pedestal once');a.equal(childCount(c,'b25-marker-v2889'),1,id+' marker once');}
  a.equal(arena(f).children.filter(c=>c.className==='b25-stage-v2889').length,1,'one stage');
  const first=stage(f).children[0];f.run('updateCombatUI();updateCombatChoices()');a.equal(stage(f).children[0],first,'stage is not rebuilt on every update');
}
for(const [opts,tier] of [["{boss:true}",'boss'],["{trib:true}",'tribulation'],["{elite:true}",'elite']]){f.run("gameState='exploring'");fight(f,opts);a.equal(stage(f).dataset.tier,tier,opts);}
f.run("gameState='exploring'");fight(f,"{region:'demon_domain'}");a.equal(stage(f).dataset.region,'demon_domain');a(stage(f).innerHTML.includes('#1b1220'),'region palette applied');

// ---------------------------------------------------------------- turn cue ----
f.run("gameState='exploring'");fight(f);
a.equal(panel(f).dataset.b25Turn,'player','player turn after the start');
{ // the real wrapper, with a spy in place of the game's enemyTurn: the cue must already say "enemy" when it runs
  let seen=null;const base=f.c.enemyTurn._baseV2889;f.c.enemyTurn._baseV2889=()=>{seen=panel(f).dataset.b25Turn;};
  try{f.run('enemyTurn()');}finally{f.c.enemyTurn._baseV2889=base;}
  a.equal(seen,'enemy','the enemy cue is shown before the enemy acts'); }
f.run("isPlayerTurn=false;updateCombatUI()");a.equal(panel(f).dataset.b25Turn,'enemy');
f.run("isPlayerTurn=true;updateCombatChoices()");a.equal(panel(f).dataset.b25Turn,'player');
f.run("gameState='combat-ending';updateCombatUI()");a.equal(panel(f).dataset.b25Turn,'end');f.run("gameState='combat'");

// ---------------------------------------------------------------- bars: tween + chip ----
{
  const status=()=>f.run("document.getElementById('battleVitalsV286816')");
  const build=(hp,foe)=>{f.run(`(()=>{let s=document.getElementById('battleVitalsV286816');if(!s){s=document.createElement('section');s.id='battleVitalsV286816';document.getElementById('combatArena').appendChild(s);}
    s.innerHTML='<div><span class="battle-meter-v286816 hp"><i style="width:${hp}%"></i></span></div><div><span class="battle-meter-v286816 foe"><i style="width:${foe}%"></i></span></div>';})()`);f.run('b25MetersV2889()');};
  build(100,100);a.equal(status().children[1].children[0].children.filter(c=>c.tagName==='U').length,0,'first sight: no tween');
  build(100,60);const foe=status().children[1].children[0];const chip=foe.children.find(c=>c.tagName==='U');
  a(chip&&chip.className.includes('loss'),'a damage chip marks the lost part');a.equal(chip.style.width,'100%');
  a.equal(foe.children.find(c=>c.tagName==='I').style.width,'60%','the bar ends at the real value');
  build(100,60);a.equal(status().children[1].children[0].children.filter(c=>c.tagName==='U').length,0,'no change, no chip');
  build(100,80);a(status().children[1].children[0].children.find(c=>c.tagName==='U').className.includes('gain'),'healing chip');
}

// ---------------------------------------------------------------- bursts ----
{
  const fx=()=>arena(f).children.find(c=>c.className==='b25-fx-v2889');
  const kinds=()=>fx().children.map(c=>c.className.replace('b25-burst-v2889 ',''));
  fx().innerHTML='';f.run('B25_V2889.fx.length=0');
  f.run("playHitEffect('enemy')");a.deepEqual(kinds(),['hit at-enemy']);
  f.run("showDamageNumber(120,'enemy',false,true)");a(kinds().includes('crit at-enemy'),'crit burst');a(arena(f).classList.contains('b25-quake-v2889'),'crit shakes the stage');
  f.run("showDamageNumber(40,'player',true,false)");a(kinds().includes('heal at-player'));
  f.run("isPlayerTurn=false;addCombatLog('遁光梭发动，<b>闪避</b>了攻击！','heal')");a(kinds().includes('dodge at-player'),'dodge on the defender');a.equal(fx().children.at(-1).children[0].textContent,'闪避');
  f.run("isPlayerTurn=true;addCombatLog('妖兽格挡了这一击')");a(kinds().includes('block at-enemy'));
  const n=fx().children.length;f.run("addCombatLog('你对妖兽造成 300 点伤害！')");a.equal(fx().children.length,n,'ordinary lines add nothing');
  for(let i=0;i<10;i++)f.run("playHitEffect('enemy')");a.equal(fx().children.length,f.run('BATTLE25D_V2889.fxMax'),'capped');
  runAll(f);a.equal(fx().children.length,0,'all bursts clean themselves up');
  arena(f).classList.add('duel25-active');f.run("playHitEffect('enemy')");a.equal(fx().children.length,0,'the illustrated duel stage draws its own effects');arena(f).classList.remove('duel25-active');
}

// ---------------------------------------------------------------- skill buttons ----
{
  f.run(`player.skills=[{name:'火球',element:'fire',mpCost:10,damage:1},{name:'冰锥',element:'ice',mpCost:999,damage:1},{name:'奇招',element:'???',mpCost:1,damage:1}];player.mp=50;isPlayerTurn=true;
    document.getElementById('combatChoices').innerHTML='<button onclick="combat(\\'attack\\')">a</button><button onclick="combat(\\'skill\\', 0)">0</button><button onclick="combat(\\'skill\\', 1)">1</button><button onclick="combat(\\'skill\\', 2)">2</button>';b25ButtonsV2889()`);
  const btn=f.run("document.getElementById('combatChoices')").children;
  a.deepEqual(btn.map(b=>b.dataset.b25El),['strike','fire','ice','sword']);a.equal(btn[2].dataset.b25Why,'灵力差 949');a.equal(btn[1].dataset.b25Why,undefined);
}

// ---------------------------------------------------------------- settings switch ----
{
  f.run("gameState='exploring'");fight(f);f.run('updateCombatUI()');
  const t=f.run("document.querySelector('[data-b25-toggle]')");a(t,'switch in 战斗设置');a.equal(t.getAttribute('aria-pressed'),'true');
  t.listeners.click[0]({});a.equal(f.run("localStorage.getItem('xiantu_battle25d_v2889')"),'off');a.equal(stage(f),undefined,'stage removed at once');a(!panel(f).classList.contains('b25-on-v2889'));
  f.run("playHitEffect('enemy')");a.equal(arena(f).children.filter(c=>c.className==='b25-fx-v2889').length,0,'off: no bursts');
  t.listeners.click[0]({});a(stage(f),'back on');
}
// reduced motion: no stage shake / camera kick, no bar tween
{
  f.c.matchMedia=q=>({matches:/reduce/.test(q),addEventListener(){}});
  f.run("document.getElementById('combatArena').style.setProperty('--b25-kick','0');b25KickV2889('enemy',true)");a.equal(arena(f).style.getPropertyValue?.('--b25-kick')??arena(f).style['--b25-kick'],'0');
  f.run("B25_V2889.meters.set('1:foe',100)");f.run(`document.getElementById('battleVitalsV286816').innerHTML='<div></div><div><span class="battle-meter-v286816 foe"><i style="width:30%"></i></span></div>';b25MetersV2889()`);
  a.equal(f.run("document.getElementById('battleVitalsV286816')").children[1].children[0].children.filter(c=>c.tagName==='U').length,0,'calm: no chip');
  f.c.matchMedia=()=>({matches:false,addEventListener(){}});
}

// ---------------------------------------------------------------- presentation only: same battle, on and off ----
function seededBattle(mode){
  const g=game(mode!=='without');if(mode==='on')on(g);else off(g);
  let seed=12345;g.c.__rand=()=>((seed=(seed*1103515245+12345)%2147483648)/2147483648);
  const realRandom=Math.random;g.run('Math.random=__rand');
  try{
    g.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.level=4;player.hp=getMaxHp();player.mp=getMaxMp();currentRegion='south'");
    g.run("startCombat({name:'测试木桩',hp:900,maxHp:900,atk:60,def:10,gold:5,exp:5,_realmLevel:4,_realmPhase:0,_noBalanceV2802:true})");
    const trace=[];   // every round: both sides' life and spirit, whose turn, how long the log is
    for(let i=0;i<14&&g.run("gameState==='combat'");i++){g.run("if(isPlayerTurn)combat('attack')");runAll(g,6);
      trace.push(g.run('JSON.stringify({hp:player.hp,mp:player.mp,enemy:currentEnemy?currentEnemy.hp:null,state:gameState,turn:isPlayerTurn,log:document.getElementById("combatLog").children.length})'));}
    trace.push(g.run('JSON.stringify({gold:player.gold,exp:player.exp,state:gameState})'));
    return trace;
  }finally{Math.random=realRandom;}
}
{const base=seededBattle('without');a(base.length>=3&&JSON.parse(base[1]).log>3,'the battle really ran');
 a.deepEqual(seededBattle('on'),base,'every round is identical to the game without the module');a.deepEqual(seededBattle('off'),base,'and with the module switched off');}

// ---------------------------------------------------------------- 镇岳台 (V2887) ----
{
  f.run("gameState='exploring';document.getElementById('combatPanel').classList.add('hidden')");
  let shown='';f.c.showStory=h=>{shown=String(h);f.c.__h=shown;f.run('document.getElementById("storyText").innerHTML=__h;document.getElementById("storyPanel").classList.remove("hidden")');};
  f.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.sect='凌霄宗';player.level=4;player.sectTotalContribution=200;player.worldTime.totalDays=270;player.bossV2887=normalizeBossV2887(undefined,{worldTime:{totalDays:0}})");
  f.run('showBossAltarV2887()');f.run(`startBossFightV2887(false,${+shown.match(/startBossFightV2887\(false,(\d+)\)/)[1]})`);
  const host=()=>f.run("document.getElementById('bossFightV2887')");
  a(host().classList.contains('b25-boss-v2889'));a.equal(host().children[0].className,'b25-stage-v2889','stage behind the boss screen');
  const tok=+shown.match(/bossActV2887\('[^']+',(\d+)\)/)[1];a(f.run(`bossActV2887('strike',${tok})`));
  const floats=host().children.find(c=>c.className==='b25-fx-v2889').children.map(c=>c.className.replace('b25-burst-v2889 ','')+':'+(c.children[0]?.textContent||''));
  a(floats.some(t=>/^hit at-enemy:-\d+$/.test(t)),'damage dealt floats over the boss: '+floats);a(floats.some(t=>/^hit at-player:-\d+$/.test(t)),'damage taken floats over you: '+floats);
  const F=f.run('bossPeekV2887().fight');a.equal(F.round,2,'the boss fight itself is untouched');
}
// Lifecycle: pending effects cannot leak into another player or a resumed/finished screen.
{
 const g=game();fight(g);g.run("playHitEffect('enemy');b25LaterV2889(()=>{window.__late=true},100)");
 a(g.run('B25_V2889.tasks.size')>0);
 g.c.document.hidden=true;for(const fn of g.events.visibilitychange||[])fn();
 a.equal(g.run('B25_V2889.tasks.size'),0);a.equal(g.run('B25_V2889.fx.length'),0);runAll(g,2);a.notEqual(g.c.__late,true);
 g.c.document.hidden=false;fight(g);g.run("playHitEffect('enemy');setBattle25dV2889(false)");a.equal(g.run('B25_V2889.tasks.size'),0);
 g.run('setBattle25dV2889(true)');g.run("b25LaterV2889(()=>{window.__late=true},100);player=createDefaultPlayer()");runAll(g,2);a.notEqual(g.c.__late,true,'old owner callback ignored');
 g.run("resetRuntimeState()");a.equal(g.run('B25_V2889.tasks.size'),0);
 for(const text of ['强敌免疫破绽硬直','你凝聚护体灵光','破阵落空，灵力白白散去','闪避率提高']){g.c.__text=text;a.equal(g.run('b25ClassifyLogV2889(__text)'),null,'no false feedback: '+text);}
 fight(g);g.run("document.getElementById('combatArena').classList.add('duel25-active');b25KickV2889('enemy',true)");a.equal(g.run('B25_V2889.tasks.size'),0,'no added shake in illustrated duels');
}
a.deepEqual(f.errors.filter(e=>/立体战场|b25|V2889/.test(String(e[1]||e[0]))),[],'no V2889 errors');
console.log('PASS v2889 battle 2.5D: loader, stage/region/tier, turn cue, bar tween, bursts, buttons, switch, reduced motion, same outcome on/off, 镇岳台');
