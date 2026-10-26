'use strict';
// Pure combat regressions adapted from the supplied candidate; integration is tested separately.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);

const f=fixture(root);f.c.console.log=()=>{};
for(const file of files)f.load(file);
a.equal(typeof f.c.startBossFightV2887,'function','apply xiantu-boss-patch.js (BLOCK 1) first');

a.equal(f.run('BOSS_V2887.version'),2,'this test is for version 2 of the boss module');

const actualBossStats=f.c.bossPlayerStatsV2887;
// ---------------------------------------------------------------- harness ----
let shown=null,saves=0,saveOk=true;const floats=[],alerts=[],advanced=[];
const realAdvance=f.c.advanceGameTime,realRoster=f.c.discipleRosterV2815;
const clone=o=>JSON.parse(JSON.stringify(o));
const deq=(x,y,m)=>a.deepEqual(clone(x),clone(y),m);      // objects made inside the vm context have a foreign prototype
function fresh(){
  f.c.showStory=(html,choices)=>{shown={html:String(html),choices};};
  f.c.showFloatingText=m=>floats.push(String(m));
  f.c.alert=m=>alerts.push(String(m));
  f.c.confirm=()=>true;if(f.c.window)f.c.window.confirm=()=>true;
  f.c.updateStats=()=>{};
  saveOk=true;f.c.saveGame=()=>{saves++;return saveOk;};
  f.c.advanceGameTime=(d,w)=>{advanced.push(d);if(typeof realAdvance==='function')return realAdvance(d,w);};
  f.c.discipleRosterV2815=realRoster;
  // C1: fixed, known combat stats so balance assertions do not depend on the real formulas
  f.c.bossPlayerStatsV2887=()=>{const lv=f.run('player.level');return {level:lv,hpMax:100+80*lv,mpMax:50+10*lv,atk:20+12*lv};};
  f.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring'");
  floats.length=0;alerts.length=0;advanced.length=0;shown=null;saves=0;
}
const WIN0=270,Y=360;                                   // first day of the window in year 0; year length
function setup(o={}){
  const d={sect:'凌霄宗',level:4,day:WIN0,master:false,pros:20,gold:5000,...o};
  f.run(`(()=>{player.sect=${JSON.stringify(d.sect)};player.level=${d.level};player.gold=${d.gold};player.exp=0;player.materials={};
    player.worldTime=player.worldTime||{};player.worldTime.totalDays=${d.day};
    player.sectData=Object.assign({},player.sectData,{prosperity:${d.pros}});
    player.sectPromotion={tasksCompleted:5,inherited:${d.master}};
    player.sectTotalContribution=${d.master?1200:200};player.sectContribution=100;
    player.sectPathV2880=normalizeSectPathV2880(undefined,player.sect);
    player.bossV2887=normalizeBossV2887(undefined,{sect:player.sect,worldTime:{totalDays:0}});      // a save born at day 0, so later days really count as missed
    player.sectRank=getRankInfoForContribution(player.sectTotalContribution,player).name;})()`);
}
const B=()=>f.run('player.bossV2887'),setDay=n=>f.run(`player.worldTime.totalDays=${n}`),P=e=>f.run(`player.${e}`);
const bones=n=>f.run(`player.materials={'玄冥残骨':${n}}`);
function stats(level){return {level,hpMax:100+80*level,mpMax:50+10*level,atk:20+12*level};}
const NEUTRAL={master:false,strike:1,hp:1,guardCut:0,mpRegen:1,locks:0,charge:0,doctrine:null,ward:false,opening:0,allies:{}};
const MASTER={master:true,strike:1.13,hp:1,guardCut:0.1,mpRegen:1.25,locks:2,charge:1,doctrine:'zhen',ward:true,opening:0.06,allies:{hufa:'甲',zhishi:'乙',xianfeng:'丙'}};
// year 1 = 噬魂相 (no armor, no tide) unless asked otherwise
function newFight(level,adv=NEUTRAL,missed=0,year=1){
  f.c.__t={level,adv,missed,year,s:stats(level)};
  return f.run(`(()=>{const T=bossTierV2887(__t.level);return bossNewFightV2887('xuanming',T.id,__t.s,__t.adv,__t.missed,__t.year);})()`);
}
function step(F,action){f.c.__F=F;f.c.__a=action;return f.run('bossStepV2887(__F,__a)');}
const sel=F=>{f.c.__F=F;return f.run('bossSelectIntentV2887(__F)');};
const setIntent=(F,skill,stage='act',extra={})=>{F.intent={skill,stage,read:null,why:null,tide:false,...extra};};

// players: a 2-step look-ahead (a careful human), the v1 answer table, fixed rotations
f.run(`
function botActsV2887(F){if(F.boon)return F.boon.options.map(o=>'boon:'+o);return BOSS_V2887.actions;}
function botValV2887(F){if(F.over==='win')return 1e6-F.round*100+F.hp/F.hpMax*50;if(F.over)return -1e6+(1-F.bossHp/F.bossMax)*1000;
 return (1-F.bossHp/F.bossMax)*1000+(F.hp/F.hpMax)*700+F.charge*25+F.locks*45+F.mp/F.mpMax*40+(F.ward?60:0)-(F.curse?20:0)-(F.seal.left?15:0);}
function botSearchV2887(F,d){if(d===0||F.over)return botValV2887(F);let best=-Infinity;for(const x of botActsV2887(F)){const G=JSON.parse(JSON.stringify(F));if(bossStepV2887(G,x).invalid)continue;const v=botSearchV2887(G,F.boon?d:d-1);if(v>best)best=v;}return best===-Infinity?botValV2887(F):best;}
function botValidV2887(F){return botActsV2887(F).filter(x=>!bossStepV2887(JSON.parse(JSON.stringify(F)),x).invalid);}
function botPickV2887(F,pol){
 const v=botValidV2887(F);let r;
 if(pol==='look'){let best=-Infinity;for(const x of v){const G=JSON.parse(JSON.stringify(F));bossStepV2887(G,x);const s=botSearchV2887(G,F.boon?2:1);if(s>best){best=s;r=x;}}}
 else if(F.boon)r=v[0];
 else if(pol==='table'){const C=BOSS_V2887,it=F.intent,B=C.bosses[F.id],can=x=>v.includes(x);
  if(it.stage==='stunned')r='strike';
  else if(it.stage==='charge')r=can('break')?'break':can('lock')?'lock':'guard';
  else{const d=it.stage==='release'?B.skills[it.skill].release:B.skills[it.skill];
   if(F.curse>0&&can('cleanse')&&F.mp>0.5*F.mpMax)r='cleanse';
   else if(d.evadable)r=F.charge>=2&&F.hp>0.6*F.hpMax&&can('strike')?'strike':'evade';
   else r=F.locks>0&&F.hp<0.5*F.hpMax?'lock':'guard';}}
 else if(pol==='rot')r=['evade','guard','strike'][F.round%3];
 else r=pol;
 return v.includes(r)?r:(v.includes('guard')?'guard':v[0]);
}`);
function play(F,pol){let n=0;while(!F.over&&n<120){f.c.__F=F;f.c.__p=pol;const x=f.run('botPickV2887(__F,__p)');const r=step(F,x);a(!r.invalid,'bot chose an invalid move '+x);n++;}return F;}

// ===================================================== 1. calendar and 年相 ====
fresh();setup();
const win=d=>{setDay(d);return f.run('bossWindowV2887()');};
a.equal(win(269).open,false);a.equal(win(269).daysToOpen,1);
a.equal(win(270).open,true);a.equal(win(270).daysLeft,10);
a.equal(win(279).open,true);a.equal(win(279).daysLeft,1);
a.equal(win(280).open,false);a.equal(win(280).daysToOpen,350);
a.equal(win(360).daysToOpen,270);a.equal(win(630).open,true);a.equal(win(630).year,1);a.equal(win(0).open,false);
a.equal(f.run('bossYearLenV2887()'),360);
setDay(0);a.equal(f.run('bossLastDoneYearV2887()'),-1);setDay(279);a.equal(f.run('bossLastDoneYearV2887()'),-1);setDay(280);a.equal(f.run('bossLastDoneYearV2887()'),0);
setDay(639);a.equal(f.run('bossLastDoneYearV2887()'),0);setDay(640);a.equal(f.run('bossLastDoneYearV2887()'),1);
deq([0,1,2,3,4,5].map(y=>f.run(`bossAspectIdV2887(${y})`)),['gu','shi','chao','gu','shi','chao'],'年相 rotates by year');
a.equal(f.run('bossAspectIdV2887(-5)'),'gu');a.equal(f.run('bossAspectIdV2887("x")'),'gu');

// ===================================================== 2. tiers and eligibility ====
a.equal(f.run('bossTierV2887(3)'),null);
for(const [lv,id] of [[4,1],[6,1],[7,2],[10,2],[11,3],[20,3]])a.equal(f.run(`bossTierV2887(${lv}).id`),id,'level '+lv);
a.equal(f.run('bossTierV2887(NaN)'),null);
setup({level:3});a.equal(f.run('bossEligibleV2887()'),false);setup();a.equal(f.run('bossEligibleV2887()'),true);
setup({sect:'散修'});a.equal(f.run('bossEligibleV2887()'),false);
setup();f.c.isFactionDestroyed=n=>n==='凌霄宗';a.equal(f.run('bossEligibleV2887()'),false,'a destroyed sect has no altar');f.c.isFactionDestroyed=()=>false;

// ===================================================== 3. normalizer and saves ====
fresh();setup();
const junk=[undefined,null,0,'x',[],{},{v:2,kills:'a'},{v:2,kills:{xuanming:-5,other:9},best:{xuanming:1e99},relics:['zhenyue','gudi','gudi','evil',7,'__proto__'],seal:{settledYear:'x',wonYears:'no',missed:99}},
  {v:2,fight:{id:'nope'}},
  {v:2,fight:{id:'xuanming',bossMax:'NaN',hp:Infinity,intent:{skill:'__proto__',stage:'act'},round:-3,tier:99,phase:7,aspect:'evil',armor:50,locks:99,memo:{heavy:'rm',sweep:'evade',__proto__:{x:1}},
    streak:{action:'zap',n:1e9},seal:{action:'rm -rf',left:50},boon:{phase:9},boonsTaken:['suo','x','master','suo'],allies:{hufa:{}},missed:77}}];
for(const j of junk){
  f.c.__j=j;const n=f.run('normalizeBossV2887(__j,player)');
  a.equal(n.v,2);a(Number.isInteger(n.kills.xuanming)&&n.kills.xuanming>=0);a(!('other' in n.kills));
  a(n.relics.every(r=>['zhenyue','gudi','suopian'].includes(r))&&new Set(n.relics).size===n.relics.length);a(n.seal.missed>=0&&n.seal.missed<=5);
  if(n.fight){const F=n.fight;a(Number.isFinite(F.bossHp)&&Number.isFinite(F.hp)&&F.tier>=1&&F.tier<=3&&F.phase>=1&&F.phase<=3);
    a(['gu','shi','chao'].includes(F.aspect));a(F.armor<=3&&F.locks<=4&&F.missed<=5);a(['act','charge','release','stunned'].includes(F.intent.stage));
    a(Object.values(F.memo).every(x=>['strike','guard','evade','break','cleanse','lock'].includes(x)));deq(F.memo,{sweep:'evade'});
    a(F.streak.action===null&&F.streak.n<=99);deq(F.boonsTaken,['suo','master']);a(F.allies.hufa===null);
    if(F.boon)a(F.boon.options.every(o=>['suo','quan','jian','master'].includes(o)));}
}
// version 1 saves: records survive, a fight in progress from version 1 is dropped (nothing was paid for it)
f.c.__s={v:1,kills:{xuanming:2},best:{xuanming:9},relics:['zhenyue'],seal:{settledYear:0,wonYears:[0],missed:1},fight:{id:'xuanming',round:3,bossMax:500,bossHp:200}};
{const n=f.run('normalizeBossV2887(__s,player)');a.equal(n.v,2);a.equal(n.kills.xuanming,2);deq(n.relics,['zhenyue']);a.equal(n.seal.missed,1);a.equal(n.fight,null,'v1 fight dropped');}
setup({day:2000});a.equal(f.run('normalizeBossV2887(undefined,player).seal.settledYear'),f.run('bossLastDoneYearV2887()'),'no back penalty for old saves');
// EDIT 1: the normalizer layer carries the state; idempotent; peek is pure
setup();f.c.__s={bossV2887:{v:2,kills:{xuanming:3},relics:['zhenyue'],seal:{settledYear:0,wonYears:[0],missed:2}}};
a.equal(f.run('normalizePlayer(__s).bossV2887.kills.xuanming'),3,'EDIT 1: normalizePlayer must carry bossV2887');
deq(f.run('normalizeBossV2887(normalizeBossV2887(__s.bossV2887,player),player)'),f.run('normalizeBossV2887(__s.bossV2887,player)'),'idempotent');
f.c.__s={};a.equal(f.run('normalizePlayer(__s).bossV2887.v'),2,'old saves without the block get one');
f.run('delete player.bossV2887');f.run('bossPeekV2887()');a.equal(f.run('player.bossV2887'),undefined,'peek is pure');
// a running fight with every new field round-trips through a save
setup();{
  const F=newFight(7,MASTER,2,2);F.sect='凌霄宗';F.day=270;F.memo={heavy:'evade'};F.streak={action:'guard',n:1};F.boonsTaken=['quan'];F.armor=1;F.boon={phase:2,options:['suo','jian','master']};setIntent(F,null,'stunned');
  f.c.__F=F;f.run('player.bossV2887.fight=__F');f.c.__s=JSON.parse(JSON.stringify({sect:P("sect"),bossV2887:B()}));
  deq(f.run('normalizePlayer(__s).bossV2887.fight'),B().fight,'running fight round-trips');
}

// ===================================================== 4. engine basics ====
fresh();
{
  const F=newFight(4);
  a.equal(F.bossMax,68*9,'boss life is 9 strikes at tier 1');a.equal(F.aspect,'shi');a.equal(F.armor,0);
  a.equal(F.hpMax,420);a.equal(F.mpMax,90);deq(F.intent,{skill:'heavy',stage:'act',read:null,why:null,tide:false});
  a.equal(newFight(7).bossMax,Math.round(104*9*1.2));a.equal(newFight(11).bossMax,Math.round(152*9*1.4));
  a.equal(newFight(4,NEUTRAL,0,0).armor,1,'骨甲相 starts armoured');
  // plain hits
  const S=newFight(4);step(S,'strike');a.equal(S.bossHp,612-68);a.equal(S.hp,420-Math.round(0.26*420));
  // guard: heal (capped) then 40% of the hit, +1 道韵, mp back
  const G=newFight(4);G.mp=50;step(G,'guard');a.equal(G.hp,420-Math.round(0.26*420*0.4));a.equal(G.charge,1);a.equal(Math.round(G.mp),Math.round(50+0.12*90+0.05*90));
  const GH=newFight(4);GH.hp=200;step(GH,'guard');a.equal(GH.hp,200+Math.round(0.03*420)-Math.round(0.26*420*0.4),'guard recovers 3% when hurt');
  // evade: costs 10% mp, dodges, +1 道韵, riposte
  const E=newFight(4);step(E,'evade');a.equal(E.hp,420);a.equal(E.charge,1);a.equal(E.bossHp,612-34);a.equal(Math.round(E.mp*10)/10,90-9+4.5);
  const E0=newFight(4);E0.mp=5;const r0=step(E0,'evade');a(r0.invalid,'evade needs 10% mp');a.equal(E0.round,1);
  // 道韵 multiplies and is spent; never above 3
  const C2=newFight(4);C2.charge=2;step(C2,'strike');a.equal(C2.bossMax-C2.bossHp,Math.round(68*1.5));a.equal(C2.charge,0);
  const C3=newFight(4);C3.charge=3;step(C3,'evade');a.equal(C3.charge,3);
  // over-levelling within a tier helps a bit, capped
  a.equal(+newFight(6).strike.toFixed(3),1.12);a.equal(+newFight(30).strike.toFixed(3),1.36);
}
// invalid actions change nothing (and cost no round)
for(const bad of ['nope','',undefined,null,5,'cleanse','lock','boon:suo']){const G=newFight(4);const snap=JSON.stringify(G);const r=step(G,bad);a(r.invalid,String(bad));a.equal(JSON.stringify(G),snap,String(bad)+' changed state');}
{const G=newFight(4);G.mp=10;const snap=JSON.stringify(G);a(step(G,'break').invalid);a.equal(JSON.stringify(G),snap);}

// ===================================================== 5. 看破 (reads) ====
{
  // evade twice in a row: the next attack that can be dodged cannot be
  const F=newFight(4);step(F,'evade');step(F,'evade');
  deq({s:F.intent.skill,r:F.intent.read,w:F.intent.why},{s:'curse',r:'evade',w:'streak'},'3rd attack reads the evades');deq(F.streak,{action:null,n:0},'a read resets the streak');
  const hp=F.hp;const r=step(F,'evade');a.equal(F.hp,hp-Math.round(0.08*420),'a read evade is hit');a.equal(F.curse,2);a(r.ev.join('').includes('看穿'));
  // guard three times: the curse (unguardable anyway) does not consume it, the next heavy pierces
  const G=newFight(4);step(G,'guard');step(G,'guard');a.equal(G.intent.skill,'curse');a.equal(G.intent.read,null,'no read where it would not matter');a.equal(G.streak.n,2,'the streak waits');
  step(G,'guard');a.equal(G.intent.skill,'heavy');a.equal(G.intent.read,'guard');const h=G.hp;step(G,'guard');a.equal(G.hp,Math.min(420,h+Math.round(0.03*420))-Math.round(0.26*420),'pierced: full damage');
  // strike twice: the third strike is braced against
  const K=newFight(4,NEUTRAL,0,2);step(K,'strike');step(K,'strike');a.equal(K.intent.read,'strike');const bh=K.bossHp;step(K,'strike');a.equal(bh-K.bossHp,34,'braced: half damage');
  // alternating answers are never read
  const A=newFight(4);for(const m of ['evade','guard','evade','guard'])step(A,m);a.equal(A.intent.read,null);
  // 记招: from phase 2 the boss answers last time's response to the same skill
  const M=newFight(4);M.memo={heavy:'evade'};M.idx=1;a.equal(sel(M).read,null,'phase 1 does not remember');
  M.phase=2;M.idx=1;const it=sel(M);deq({s:it.skill,r:it.read,w:it.why},{s:'heavy',r:'evade',w:'memo'});
  M.idx=1;M.memo={heavy:'guard'};a.equal(sel(M).read,'guard');M.idx=1;M.memo={heavy:'strike'};a.equal(sel(M).read,null,'only dodges and guards are remembered');
  // the memo is written by every real attack
  const W=newFight(4);step(W,'guard');a.equal(W.memo.heavy,'guard');step(W,'evade');a.equal(W.memo.sweep,'evade');
}

// ===================================================== 6. skills and 年相 ====
{
  // 吞灵诀: announced, broken -> stun -> free strike; not broken -> unevadable release that heals
  const F=newFight(4);F.phase=2;F.idx=0;F.bossHp=400;setIntent(F,'sweep');step(F,'evade');deq({s:F.intent.skill,g:F.intent.stage},{s:'channel',g:'charge'});
  const mp=F.mp;step(F,'break');a.equal(F.stun,1);a.equal(F.intent.stage,'stunned');a(F.mp<mp);
  const hp=F.hp,bh=F.bossHp;step(F,'strike');a.equal(F.hp,hp);a(F.bossHp<bh);a.notEqual(F.intent.stage,'stunned');
  const G=newFight(4);G.phase=2;G.bossHp=400;setIntent(G,'channel','release');const h=G.hp,b=G.bossHp;step(G,'evade');a.equal(G.hp,h-Math.round(0.40*420));a(G.bossHp>b-35,'release heals the boss');
  const L=newFight(4,{...NEUTRAL,locks:1});L.phase=2;L.bossHp=400;setIntent(L,'channel','charge');L.pendingRelease=true;step(L,'lock');a.equal(L.pendingRelease,false);a.notEqual(L.intent.stage,'release');a.equal(L.locks,0);
  const W=newFight(4);const wh=W.hp;step(W,'break');a(W.hp<wh,'a wasted break leaves you open');
}
{ // 骨甲相: armour cuts your damage 10% a layer, 破阵 shatters a layer, every new phase grows one back
  const F=newFight(4,NEUTRAL,0,0);a.equal(F.armor,1);step(F,'strike');a.equal(612-F.bossHp,Math.round(68*0.9));
  const G=newFight(4,NEUTRAL,0,0);step(G,'break');a.equal(G.armor,0,'碎甲');const bh=G.bossHp;G.intent.read=null;setIntent(G,'heavy');step(G,'strike');a.equal(bh-G.bossHp,68);
  const H=newFight(4,NEUTRAL,0,0);H.armor=0;H.bossHp=Math.round(612*0.66);step(H,'strike');a.equal(H.phase,2);a.equal(H.armor,1,'armour regrows');
  const I=newFight(4,NEUTRAL,0,0);I.armor=1;I.charge=0;step(I,'evade');a.equal(612-I.bossHp,Math.round(68*0.5*0.9),'the riposte is armoured against too');
}
{ // 潮汐相: every 4th round a telegraphed tide
  const F=newFight(4,NEUTRAL,0,2);a.equal(F.intent.tide,false);
  for(let i=0;i<3;i++)step(F,i===1?'guard':'evade');a.equal(F.round,4);a.equal(F.intent.tide,true,'round 4 is a tide');
  const mp=F.mp;f.c.__F=F;a.equal(f.run("bossCostV2887(__F,'break')"),0,'tide: no mp costs');
  const G=JSON.parse(JSON.stringify(F));setIntent(G,'heavy','act',{tide:true});const gh=G.hp;step(G,'guard');a.equal(G.hp,Math.min(G.hpMax,gh+Math.round(0.03*420))-Math.round(0.26*420*1.5*0.4),'tide: boss +50%');
  const K=JSON.parse(JSON.stringify(F));setIntent(K,'heavy','act',{tide:true});const kb=K.bossHp;K.charge=0;step(K,'strike');a.equal(kb-K.bossHp,Math.round(68*1.3),'tide: you +30%');
  a.equal(newFight(4,NEUTRAL,0,1).intent.tide,false);
}
{ // 噬魂相: leeches while you carry a curse or a seal; cleanse is cheaper
  const F=newFight(4);F.bossHp=500;setIntent(F,'curse');step(F,'guard');a.equal(F.curse,2);a.equal(F.bossHp,500+Math.round(0.02*612),'leech');
  f.c.__F=F;a.equal(f.run("bossCostV2887(__F,'cleanse')"),0.10);
  const G=newFight(4,NEUTRAL,0,0);G.curse=1;f.c.__F=G;a.equal(f.run("bossCostV2887(__F,'cleanse')"),0.15);setIntent(G,'heavy');step(G,'evade');a.equal(G.bossHp,612-Math.round(68*0.5*0.7*0.9),'no leech outside 噬魂相');
  // 噬名 seals the move just used; cleanse frees it
  const D=newFight(4);setIntent(D,'devour');step(D,'guard');deq(D.seal,{action:'guard',left:2});setIntent(D,'heavy');a(step(D,'guard').invalid);a.equal(D.round,2);
  step(D,'cleanse');deq(D.seal,{action:null,left:0});
}

// ===================================================== 7. phase changes and 九锁回应 ====
{
  const F=newFight(4);F.bossHp=Math.round(612*0.66);const hp=F.hp;const r=step(F,'strike');
  a.equal(F.phase,2);a(r.transition);a(F.hp<hp,'the boss still strikes on the round it sheds its skin');
  deq(F.boon.options,['suo','quan','jian']);a(step(F,'strike').invalid,'answer the locks first');a(step(F,'boon:master').invalid,'no master boon for members');
  const round=F.round,h2=F.hp;step(F,'boon:quan');a.equal(F.round,round,'a boon costs no round');a.equal(F.hp,Math.min(420,h2+Math.round(0.25*420)));a.equal(F.boon,null);
  deq({s:F.intent.skill,g:F.intent.stage},{s:'channel',g:'charge'},'噬灵 opens with 吞灵诀');
  F.bossHp=Math.round(612*0.31);F.pendingRelease=false;setIntent(F,'heavy');step(F,'strike');a.equal(F.phase,3);deq(F.boon.options,['suo','jian'],'each answer once per fight');
  const ch=F.charge;step(F,'boon:jian');a.equal(F.charge,Math.min(3,ch+2));a.equal(F.intent.skill,'abyss','归墟 opens with 归墟坠');
  const S2=newFight(4);S2.bossHp=Math.round(612*0.66);step(S2,'strike');step(S2,'boon:suo');a.equal(S2.locks,1);
  // a giant blow from phase 1 straight to 3: one boon, phase 3
  const J=newFight(4);J.bossHp=Math.round(612*0.66);J.strike=4;step(J,'strike');a.equal(J.phase,3);a(J.boon);
  // master: a 4th answer chosen by 道统
  for(const [doc,check] of [['jian',G=>612*1.15-G.bossHp>0],['dan',G=>G.mp===G.mpMax],['zhen',G=>G.locks>=4],[null,G=>G.charge>=1]]){
    const G=newFight(4,{...MASTER,doctrine:doc,opening:0},0,0);G.bossHp=Math.round(G.bossMax*0.66);G.mp=10;G.locks=2;G.charge=0;step(G,'strike');a(G.boon.options.includes('master'));
    const bh=G.bossHp;step(G,'boon:master');a(check(G),'master boon '+doc);
    if(doc==='jian')a.equal(bh-G.bossHp,Math.round(2*G.atk*G.strike),'万剑归宗 ignores armour');
    a(!bossOpts(G).includes('master'),'master answer only once');
  }
  function bossOpts(G){f.c.__F=G;return clone(f.run('bossBoonOptionsV2887(__F)'));}
  const K=newFight(4,{...MASTER,doctrine:'jian'});K.bossHp=Math.round(K.bossMax*0.66);step(K,'strike');K.bossHp=5;const r2=step(K,'boon:master');a.equal(r2.over,'win','a boon can end the fight');
}
{ // 护法舍身: once
  const F=newFight(4,{...NEUTRAL,ward:true,allies:{hufa:'<b>白羽</b>'}});F.hp=5;setIntent(F,'heavy');const r=step(F,'strike');a.equal(F.hp,1);a.equal(F.ward,false);a(r.ev.join('').includes('白羽'));
  setIntent(F,'heavy');a.equal(step(F,'strike').over,'lose');
}
// ends
{
  const W=newFight(4);W.bossHp=1;a.equal(step(W,'strike').over,'win');a.equal(step(W,'strike').over,'win','finished stays finished');
  const R=newFight(4);R.bossHp=10;a.equal(step(R,'evade').over,'win','a riposte can win');
  const L=newFight(4);L.hp=1;a.equal(step(L,'strike').over,'lose');
  const X=newFight(4);X.round=30;a.equal(step(X,'evade').over,'exhausted');
}

// ===================================================== 8. telegraphs: preview and foreshadow are exact ====
{
  let checked=0;
  for(const year of [0,1,2])for(let k=0;k<12;k++){
    const F=newFight(7,k%2?MASTER:NEUTRAL,k%3,year);let n=0;
    while(!F.over&&n<40){const before=JSON.stringify(F);f.c.__F=F;const pv=clone(f.run('bossPreviewV2887(__F)'));a.equal(JSON.stringify(F),before,'preview is pure');
      if(!F.boon)for(const x of ['strike','guard','evade','break','cleanse','lock']){const G=JSON.parse(JSON.stringify(F));const r=step(G,x);
        a.equal(pv[x].ok,!r.invalid,'preview validity '+x);if(r.invalid)continue;checked++;
        a.equal(pv[x].taken,Math.max(0,F.hp-G.hp));a.equal(pv[x].dealt,Math.max(0,F.bossHp-Math.max(0,G.bossHp)));a.equal(pv[x].over,G.over);}
      f.c.__p=['look','table','rot'][(k+n)%3];const x=f.run('botPickV2887(__F,__p)');
      // the foreshadowed skill is what comes after the announced one when nothing interferes (no break/lock/phase change)
      f.c.__F=F;const fs=clone(f.run('bossForeshadowV2887(__F)'));const G=JSON.parse(JSON.stringify(F));const r=step(G,'guard');
      if(fs&&!r.invalid&&!G.over&&!G.boon&&F.intent.stage!=='charge')a.equal(G.intent.skill,fs.skill,'foreshadow');
      step(F,x);n++;}
  }
  a(checked>500,'preview compared '+checked+' times');
}

{ // 年相 change the rotation itself
  const cyc=(year,phase)=>{const F=newFight(4,NEUTRAL,0,year);F.phase=phase;f.c.__F=F;return clone(f.run('bossCycleV2887(__F)'));};
  deq(cyc(0,1),['heavy','sweep','curse','heavy','sweep'],'骨甲相 keeps the base rotation');
  a.equal(cyc(1,1).at(-1),'devour');a.equal(cyc(1,2).at(-1),'curse');a.equal(cyc(2,1).at(-1),'channel');a.equal(cyc(2,2).at(-1),'abyss');a.equal(cyc(2,3).length,5);
  // after an announced 吞灵诀 the foreshadow is its release
  const F=newFight(4);setIntent(F,'channel','charge');F.pendingRelease=true;f.c.__F=F;const fs=clone(f.run('bossForeshadowV2887(__F)'));a.equal(fs.skill,'channel');a(fs.omen.includes('释放'));
  F.boon={phase:2,options:['suo']};a.equal(f.run('bossForeshadowV2887(__F)'),null,'nothing to foreshadow while the locks answer');
}
// ===================================================== 9. what the screen says about the next attack ====
{
  const F=newFight(4);step(F,'evade');step(F,'evade');f.c.__F=F;const v=clone(f.run('bossIntentViewV2887(__F)'));
  a.equal(v.tag,'咒');a(v.mods.some(m=>m.includes('看破')&&m.includes('避让')));
  const T=newFight(4,NEUTRAL,0,2);T.round=4;T.idx=3;T.intent=sel(T);f.c.__F=T;a(clone(f.run('bossIntentViewV2887(__F)')).mods.some(m=>m.includes('涨潮')));
  const S=newFight(4);setIntent(S,null,'stunned');f.c.__F=S;a.equal(f.run('bossIntentViewV2887(__F)').title,'蜕影僵直');
}

// ===================================================== 10. balance guard rails ====
// If a future edit makes the boss trivial or impossible these fail. Stats are the test's own formula (C1).
{
  let careful=0,table=0;const hpLeft=[];
  for(const year of [0,1,2])for(const lv of [4,7,11]){
    const F=play(newFight(lv,NEUTRAL,0,year),'look');a.equal(F.over,'win',`careful play must win: level ${lv}, aspect ${F.aspect}`);careful++;hpLeft.push(F.hp/F.hpMax);
    a(F.round<=30);
    const M=play(newFight(lv,MASTER,0,year),'look');a.equal(M.over,'win',`a careful master must win: level ${lv}, aspect ${M.aspect}`);
    if(play(newFight(lv,NEUTRAL,0,year),'table').over==='win')table++;
    for(const pol of ['strike','guard','rot'])a.notEqual(play(newFight(lv,NEUTRAL,0,year),pol).over,'win',`${pol} must not win (level ${lv}, ${F.aspect})`);
  }
  const avg=hpLeft.reduce((x,y)=>x+y,0)/hpLeft.length;
  a(avg>0.2&&avg<0.75,'careful play should end bruised but standing, average life left '+avg.toFixed(2));
  a(table<=3,`the old answer table must not solve the fight (${table}/9 wins)`);
  // a heavily neglected seal is a real threat even to careful play, a little neglect is not
  a.equal(play(newFight(4,NEUTRAL,2,1),'look').over,'win');
  a(newFight(4,MASTER,5,1).bossMax>newFight(4,NEUTRAL,5,1).bossMax*1.3,'the master carries the full weight of the seal');
}

// ===================================================== 11. rewards ====
fresh();setup();
{
  const mk=(o)=>({id:'xuanming',tier:1,round:20,flawless:false,missed:0,master:false,year:0,...o});
  const R=(F,b)=>{f.c.__F=F;f.c.__b=b;return clone(f.run('bossRewardsV2887(__F,__b)'));};
  const fresh0=()=>clone(f.run('normalizeBossV2887(undefined,player)'));
  let b=fresh0(),r=R(mk({}),b);
  a.equal(r.grade,'C');a.equal(r.relic,'zhenyue');a.equal(r.gold,Math.round(1500*1.5));a.equal(r.exp,500);a.equal(r.contribution,80);a.equal(r.bones,2);a.equal(r.prosperity,2);a.equal(r.repeat,false);
  r=R(mk({round:16,flawless:true}),b);a.equal(r.grade,'A');a.equal(r.gold,Math.round(1500*(1+0.5+0.3)));a.equal(r.bones,3);
  r=R(mk({round:17,flawless:true}),b);a.equal(r.grade,'B','tier 1: 16 rounds or fewer is fast');
  r=R(mk({tier:3,round:20,flawless:false}),b);a.equal(r.grade,'B','tier 3: 20 rounds or fewer is fast');a.equal(r.relic,'suopian');
  b.relics=['zhenyue'];r=R(mk({missed:2,master:true}),b);a.equal(r.relic,null);a.equal(r.gold,Math.round(1500*1.2));a.equal(r.prosperity,3,'the master raises prosperity more');
  b.seal.wonYears=[0];r=R(mk({round:3,flawless:true}),b);deq({repeat:r.repeat,gold:r.gold,exp:r.exp,c:r.contribution,bones:r.bones,p:r.prosperity,relic:r.relic},{repeat:true,gold:150,exp:0,c:0,bones:1,p:0,relic:null},'second win in a year is practice');
}


console.log("PASS yearly windows, migration, three phases/aspects, preview parity, counters, boons, simulated tactics and bounded reward rules");

// A free doctrine hit may itself cross a phase: do not skip that phase's response/signature.
{const F=newFight(4,MASTER,0,0);F.phase=2;F.bossHp=F.bossMax*.4;F.boon={phase:2,options:['master']};F.doctrine='jian';const r=step(F,'boon:master');a(!r.invalid);a.equal(F.phase,3);a.equal(F.boon.phase,3);a(!F.boon.options.includes('master'));}
// Actual runtime formula snapshots; synthetic equipment profiles, not naturally progressed characters.
const rows=[];
for(const level of [4,7,11,16])for(const phase of [0,3])for(const gear of ['bare','ordinary','ideal']){
 f.run(`player=createDefaultPlayer();player.level=${level};player.phase=${phase};player.equipment=createEmptyEquipmentSlots();`);
 if(gear!=='bare'){
  f.c.gearProfile=gear;
  f.run(`for(const slot of Object.keys(player.equipment)){const pool=Object.entries(EQUIPMENT_DB).filter(([,d])=>d.slot===slot&&d.realmRequired<=player.level&&(gearProfile==='ideal'||['MORTAL','GOOD','FINE','EXCELLENT'].includes(d.quality)));pool.sort((a,b)=>Object.values(b[1].stats||{}).reduce((x,y)=>x+y,0)-Object.values(a[1].stats||{}).reduce((x,y)=>x+y,0));if(pool[0])player.equipment[slot]=pool[0][0];}`);
 }
 const real=actualBossStats();a.equal(real.atk,f.run('getAtk()'));
 for(const year of [0,1,2])for(const master of [false,true]){
  f.c.simStats=real;f.c.simAdv=master?MASTER:NEUTRAL;f.c.simYear=year;
  const F=play(f.run("bossNewFightV2887('xuanming',bossTierV2887(simStats.level).id,simStats,simAdv,0,simYear)"),'look');
  rows.push({level,phase,gear,master,aspect:F.aspect,result:F.over,rounds:F.round,hpShare:F.hp/F.hpMax});
  a.equal(F.over,'win',JSON.stringify(rows.at(-1)));
 }
}
if(process.env.XIANTU_TEST_OUTPUT)fs.writeFileSync(path.join(process.env.XIANTU_TEST_OUTPUT,'seal-boss-matrix.json'),JSON.stringify(rows,null,2));
console.log(`PASS ${rows.length} deterministic look-ahead fights using actual stats: four realm bands, early/full phases, bare/ordinary/ideal gear, member/master, all aspects. No claim about human win rate.`);
