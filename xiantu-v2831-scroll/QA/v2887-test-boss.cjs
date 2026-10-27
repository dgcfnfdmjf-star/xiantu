'use strict';
/*
 * QA/v2887-test-boss.cjs - the 镇岳台 boss (V2887) small fixes, against the installed game code.
 *   1 tier-3 entry eased (life x1.25)          2 reputation / level-up remain atomic with rewards
 *   3 refused actions show a message + redraw  4 settlement preview no longer copies the whole save
 *   5 stale comment                            + a full fight through the real screens
 * Run:  XIANTU_TEST_ROOT=xiantu-v2831-scroll node xiantu-v2831-scroll/QA/v2887-test-boss.cjs
 * Add:  'v2887-test-boss' to the tests array in scripts/test.cjs.
 */
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const f=fixture(root);f.c.console.log=()=>{};f.c.console.warn=()=>{};
for(const file of files)f.load(file);
a.equal(typeof f.c.bossFinalizeV2887,'function','boss V2887 must be installed');
a.equal(typeof f.c.bossSettlePlanV2887,'function','apply the V2887 fixes first');
const clone=o=>JSON.parse(JSON.stringify(o)),deq=(x,y,m)=>a.deepEqual(clone(x),clone(y),m);

// ---------------------------------------------------------------- harness ----
let shown='',floats=[],log=[],saveOk=true;
const real={save:f.c.saveGame,rep:f.c.addFactionReputation,lvl:f.c.checkLevelUp,auto:f.c.autoSave};
function hooks(){
  f.c.showStory=html=>{shown=String(html);f.c.__h=shown;f.run('document.getElementById("storyText").innerHTML=__h;document.getElementById("storyPanel").classList.remove("hidden")');};
  f.c.showFloatingText=m=>{floats.push(String(m));};
  f.c.confirm=()=>true;f.c.window.confirm=()=>true;f.c.alert=()=>{};
  f.c.saveGame=(...x)=>{log.push('save');return saveOk?real.save(...x):false;};
  f.c.addFactionReputation=(...x)=>{log.push('rep');return real.rep(...x);};
  f.c.checkLevelUp=(...x)=>{log.push('lvl');return real.lvl(...x);};
  f.c.autoSave=(...x)=>{log.push('auto');return real.auto(...x);};
}
const WIN0=270,Y=360;
function setup({level=4,day=WIN0,master=false,doctrine='jian',pros=20}={}){
  hooks();saveOk=true;shown='';floats=[];log=[];
  f.run(`resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.sect='凌霄宗';player.level=${level};
    player.sectTotalContribution=${master?1500:200};player.sectContribution=500;player.worldTime.totalDays=0;player.materials={};
    player.sectPromotion={tasksCompleted:5,inherited:${master},sect:'凌霄宗'};
    ${master?`player.sectPathV2880={version:1,sect:'凌霄宗',stage:4,virtue:'jue',defense:'fight',legacy:'retire',doctrine:'${doctrine}',roll:.5};`:''}
    player=normalizePlayer(JSON.parse(JSON.stringify(player)));player.sectRank=getRankInfoForContribution(player.sectTotalContribution,player).name;
    player.sectData=Object.assign({},player.sectData,{prosperity:${pros}});player.worldTime.totalDays=${day};`);   // the save is born on day 0
}
const B=()=>f.run('player.bossV2887'),P=e=>f.run('player.'+e),setDay=d=>f.run(`player.worldTime.totalDays=${d}`);
const tok=re=>{const m=shown.match(re);a(m,'button not on screen: '+re);return +m[1];};
const lastFloat=()=>floats[floats.length-1]||'';

// players for the balance check and the full fight
f.run(`
function botActsV2887(F){if(F.boon)return F.boon.options.map(o=>'boon:'+o);return BOSS_V2887.actions;}
function botValV2887(F){if(F.over==='win')return 1e6-F.round*100+F.hp/F.hpMax*50;if(F.over)return -1e6+(1-F.bossHp/F.bossMax)*1000;return (1-F.bossHp/F.bossMax)*1000+(F.hp/F.hpMax)*700+F.charge*25+F.locks*45+F.mp/F.mpMax*40+(F.ward?60:0)-(F.curse?20:0)-(F.seal.left?15:0);}
function botSearchV2887(F,d){if(d===0||F.over)return botValV2887(F);let b=-Infinity;for(const x of botActsV2887(F)){const G=JSON.parse(JSON.stringify(F));if(bossStepV2887(G,x).invalid)continue;const v=botSearchV2887(G,F.boon?d:d-1);if(v>b)b=v;}return b===-Infinity?botValV2887(F):b;}
function botPickV2887(F,pol){const v=botActsV2887(F).filter(x=>!bossStepV2887(JSON.parse(JSON.stringify(F)),x).invalid);let r;
 if(pol==='look'){let b=-Infinity;for(const x of v){const G=JSON.parse(JSON.stringify(F));bossStepV2887(G,x);const s=botSearchV2887(G,F.boon?2:1);if(s>b){b=s;r=x;}}}
 else if(F.boon)r=v[0];
 else{const C=BOSS_V2887,it=F.intent,Bs=C.bosses[F.id],can=x=>v.includes(x);
  if(it.stage==='stunned')r='strike';else if(it.stage==='charge')r=can('break')?'break':can('lock')?'lock':'guard';
  else{const d=it.stage==='release'?Bs.skills[it.skill].release:Bs.skills[it.skill];if(F.curse>0&&can('cleanse')&&F.mp>0.5*F.mpMax)r='cleanse';else if(d.evadable)r=F.charge>=2&&F.hp>0.6*F.hpMax&&can('strike')?'strike':'evade';else r=F.locks>0&&F.hp<0.5*F.hpMax?'lock':'guard';}}
 return v.includes(r)?r:(v.includes('guard')?'guard':v[0]);}
function botFightV2887(level,year,pol){player.level=level;const T=bossTierV2887(level);
 const F=bossNewFightV2887('xuanming',T.id,bossPlayerStatsV2887(),{master:false,strike:1,hp:1,guardCut:0,mpRegen:1,locks:0,charge:0,doctrine:null,ward:false,opening:0,allies:{}},0,year);
 let n=0;while(!F.over&&n<120){bossStepV2887(F,botPickV2887(F,pol));n++;}return F;}`);
function startFight(){f.run('showBossAltarV2887()');a(f.run(`startBossFightV2887(false,${tok(/startBossFightV2887\(false,(\d+)\)/)})`),'start');}
function act(x){return f.run(`bossActV2887(${JSON.stringify(x)},${tok(/bossActV2887\('[^']+',(\d+)\)/)})`);}
function winNow(){const F=B().fight;F.bossHp=1;F.intent={skill:'heavy',stage:'act',read:null,why:null,tide:false};f.run('showBossFightV2887()');a(act('strike'));a.equal(B().fight.over,'win');}
const finalize=()=>f.run(`bossFinalizeV2887(${tok(/bossFinalizeV2887\((\d+)\)/)})`);

// ===================================================== FIX 1: tier 3 entry ====
setup({level:11});
a.equal(f.run('BOSS_V2887.tiers[2].hp'),1.25,'tier-3 life multiplier');
a.equal(f.run('BOSS_V2887.tiers[1].hp'),1.2,'tier 2 unchanged');a.equal(f.run('BOSS_V2887.maxRounds'),30,'round cap unchanged');
{
  const atk=f.run('bossPlayerStatsV2887().atk');a.equal(f.run('botFightV2887(11,0,"table")').bossMax,Math.round(atk*9*1.25));
  let hp=0,table=0;
  for(const y of [0,1,2]){const F=f.run(`botFightV2887(11,${y},'look')`);a.equal(F.over,'win',`careful play wins tier 3 at level 11, aspect ${F.aspect}`);hp+=F.hp/F.hpMax;
    if(f.run(`botFightV2887(11,${y},'table')`).over==='win')table++;}
  a(hp/3>=0.12,'tier-3 entry: careful play keeps more than a sliver of life, avg '+(hp/3).toFixed(2));
  a(table<=1,'the fixed answer table still loses at tier 3');
}

// Rewards and reputation remain one transaction; failed hooks or persistence roll everything back.
setup();startFight();winNow();
{log=[];const g0=P('gold');a.equal(finalize(),true);a(log.indexOf('rep')<log.indexOf('save'));a(log.indexOf('lvl')<log.indexOf('save'));a(P('gold')>g0);a.equal(B().fight,null);a.equal(B().kills.xuanming,1);}
setup();startFight();winNow();
{const original=f.c.addFactionReputation;f.c.addFactionReputation=()=>{throw Error('rep unavailable');};const before=JSON.stringify(f.run('player'));a.equal(finalize(),false);a.equal(JSON.stringify(f.run('player')),before);f.c.addFactionReputation=original;f.run('showBossFightV2887()');a(finalize());a.equal(B().kills.xuanming,1);}
setup();startFight();winNow();
{saveOk=false;const before=JSON.stringify(f.run('player'));a.equal(finalize(),false);a.equal(JSON.stringify(f.run('player')),before);saveOk=true;f.run('showBossFightV2887()');a(finalize());a.equal(B().kills.xuanming,1);}
{startFight();winNow();log=[];a(finalize());a(!log.includes('rep'),'same-year practice pays no reputation');}

// ===================================================== FIX 3: refused actions explain themselves ====
setup({day:100});
f.run('showBossAltarV2887()');{const t=tok(/startBossFightV2887\(false,(\d+)\)/);floats=[];a.equal(f.run(`startBossFightV2887(false,${t})`),false);a(lastFloat().includes('封印稳固'),'closed window: '+lastFloat());a(shown.includes('封印稳固，尚未松动'),'the altar is redrawn with the reason');}
setup();
{ // stale start token
  f.run('showBossAltarV2887()');const old=tok(/startBossFightV2887\(false,(\d+)\)/);f.run('showBossAltarV2887()');
  floats=[];a.equal(f.run(`startBossFightV2887(false,${old})`),false);a(lastFloat().includes('画面已过期'),'stale start: '+lastFloat());a.equal(B().fight,null);
  a(f.run(`startBossFightV2887(false,${tok(/startBossFightV2887\(false,(\d+)\)/)})`),'the redrawn button works');
}
{ // stale move token; invalid move
  const old=tok(/bossActV2887\('[^']+',(\d+)\)/);act('guard');const round=B().fight.round;
  floats=[];a.equal(f.run(`bossActV2887('guard',${old})`),false);a(lastFloat().includes('画面已过期'));a.equal(B().fight.round,round,'nothing happened');a(shown.includes('bossFightV2887'));
  floats=[];a.equal(act('cleanse'),false);a(lastFloat().length>0,'invalid move explained');
  floats=[];a.equal(act('boon:suo'),false);a(lastFloat().length>0);
}
{ // offering without bones
  setup();f.run('showBossAltarV2887()');const t=tok(/startBossFightV2887\(true,(\d+)\)/);floats=[];a.equal(f.run(`startBossFightV2887(true,${t})`),false);a(lastFloat().includes('玄冥残骨不足'));
}
{ // stale settle token
  setup();startFight();winNow();const t=tok(/bossFinalizeV2887\((\d+)\)/);f.run('showBossFightV2887()');
  floats=[];a.equal(f.run(`bossFinalizeV2887(${t})`),false);a(lastFloat().includes('画面已过期'));a.equal(B().kills.xuanming,0);a(finalize(),'fresh token settles');
}
{ // a record from a later day than today (older save loaded) is explained, not just refused
  setup();f.run('showBossAltarV2887()');const t=tok(/startBossFightV2887\(false,(\d+)\)/);f.run('player.bossV2887.highDay=999');
  floats=[];a.equal(f.run(`startBossFightV2887(false,${t})`),false);a(lastFloat().includes('第999日'),'date message: '+lastFloat());
}
{ // not manageable (in combat): a message, no redraw
  setup();f.run('showBossAltarV2887()');const t=tok(/startBossFightV2887\(false,(\d+)\)/);f.run("gameState='combat'");const before=shown;
  floats=[];a.equal(f.run(`startBossFightV2887(false,${t})`),false);a(lastFloat().includes('当前无法处理'));a.equal(shown,before,'no redraw while busy');f.run("gameState='exploring'");
}
{ // reinforce: stale, member, nothing missed, fight running
  setup({master:true,day:300});f.run("player.materials={'玄冥残骨':6}");f.run('showSectAdminV2873()');a(shown.includes('镇岳封印'),'seal section in the admin panel');
  const old=tok(/reinforceSealV2887\((\d+)\)/);f.run('showSectAdminV2873()');
  floats=[];a.equal(f.run(`reinforceSealV2887(${old})`),false);a(lastFloat().includes('画面已过期'));
  const t=tok(/reinforceSealV2887\((\d+)\)/);a.equal(f.run(`reinforceSealV2887(${t})`),true,'a missed year (day 300) can be repaired');a.equal(B().seal.missed,0);
  f.run('showSectAdminV2873()');floats=[];a.equal(f.run(`reinforceSealV2887(${tok(/reinforceSealV2887\((\d+)\)/)})`),false);a(lastFloat().includes('无需加固'));
  setup({day:300});f.run("player.materials={'玄冥残骨':6}");f.c.__h='<h4 id="bossSealV2887">x</h4>'+f.run('bossSealSectionV2887()');shown=f.c.__h;f.run('document.getElementById("storyText").innerHTML=__h;document.getElementById("storyPanel").classList.remove("hidden")');
  floats=[];a.equal(f.run(`reinforceSealV2887(${tok(/reinforceSealV2887\((\d+)\)/)})`),false);a(lastFloat().includes('只有宗主'),'member: '+lastFloat());
}

// A late callback from another character cannot replace their currently visible panel.
setup();f.run('showBossAltarV2887()');
{const old=tok(/startBossFightV2887\(false,(\d+)\)/);f.run("player=createDefaultPlayer();player.sect='凌霄宗';player.level=4;gameState='exploring';showStory('<section id=\"unrelated\">当前角色面板</section>')");const before=shown;
 a.equal(f.run(`startBossFightV2887(false,${old})`),false);a.equal(shown,before);}

// ===================================================== FIX 4: no whole-save copy, same numbers ====
{
  setup({master:true,day:700});let touched=0;
  f.c.__probe=()=>{touched++;return 0;};f.run("Object.defineProperty(player,'probeV2887',{enumerable:true,configurable:true,get:__probe})");
  f.run('bossSettlementPreviewV2887()');f.run('bossSealSectionV2887()');a.equal(touched,0,'preview and seal section do not serialise the save');
  f.run("delete player.probeV2887");
}
// the plan equals the old copy-and-settle algorithm in every case
f.run(`function refSettleV2887(src,master){const p=JSON.parse(JSON.stringify(src)),C=BOSS_V2887,b=ensureBossV2887(p),last=bossLastDoneYearV2887(p);
 let y=b.seal.settledYear+1,n=0,lost=0;while(y<=last&&n<C.seal.catchUpYears){if(!b.seal.wonYears.includes(y)){b.seal.missed=Math.min(C.seal.missedCap,b.seal.missed+1);lost++;}b.seal.settledYear=y;y++;n++;}
 if(b.seal.settledYear<last)b.seal.settledYear=last;if(lost&&master)bossAdjustProsperityV2887(p,-C.seal.missedProsperity*lost);
 return {lost,missed:b.seal.missed,settledYear:b.seal.settledYear,prosperity:p.sectData?.prosperity??20};}`);
{
  let n=0;
  for(const master of [false,true])for(const day of [100,300,700,1500,4000])for(const won of [[],[0],[1,2]])for(const pros of [11,20,99])for(const settled of [-1,0,2]){
    setup({master,day,pros});f.run(`player.bossV2887.seal.wonYears=${JSON.stringify(won)};player.bossV2887.seal.settledYear=${settled};player.bossV2887.seal.missed=${settled>0?2:0}`);
    const ref=f.run(`refSettleV2887(player,${master})`),plan=f.run('bossSettlePlanV2887()');
    deq({l:plan.lost,m:plan.missed,s:plan.settledYear,p:plan.prosperity},{l:ref.lost,m:ref.missed,s:ref.settledYear,p:ref.prosperity},`plan master=${master} day=${day} won=${won} pros=${pros} settled=${settled}`);
    deq(f.run('bossSettlementPreviewV2887()'),{lost:ref.lost,missed:ref.missed,prosperity:ref.prosperity});
    const lost=f.run('bossSettleV2887()');a.equal(lost,ref.lost);a.equal(B().seal.missed,ref.missed);a.equal(B().seal.settledYear,ref.settledYear);a.equal(P('sectData.prosperity'),ref.prosperity,'settle applies exactly the plan');
    n++;
  }
  a.equal(n,270);
  // a sect change: the plan reads a fresh state for the new sect, like the old copy did
  setup({day:1500});f.run("player.bossV2887.seal.missed=3;player.sect='天音宗'");a.equal(f.run('bossSettlePlanV2887().missed'),0);
}

// ===================================================== FIX 5: comment ====
a(!fs.readFileSync(path.join(root,'xiantu-v2768-systems.js'),'utf8').includes('a fight from version 1 is dropped'),'stale comment removed');

// ===================================================== smoke: a whole fight on the real screens ====
setup();startFight();
{
  let n=0;while(B().fight&&!B().fight.over&&n++<150){f.c.__F=B().fight;a(act(f.run("botPickV2887(__F,'look')")),'move refused');}
  a.equal(B().fight.over,'win');a(finalize());a.equal(B().kills.xuanming,1);deq(B().relics,['zhenyue']);a(P("materials")['玄冥残骨']>=2);
  f.run('parseSaveV2768(JSON.stringify(createSaveDataV2768()))');a.equal(f.run('normalizePlayer(JSON.parse(JSON.stringify(player))).bossV2887.kills.xuanming'),1);
}
a.deepEqual(f.errors.map(e=>String(e[0]&&e[0].stack||e[0])).filter(s=>/V2887|boss/i.test(s)),[],'no boss errors logged');
console.log('PASS v2887 boss fixes: tier-3 entry, atomic reward rollback, refusal messages, settlement plan, full fight');
