'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),fixture=require('./v2858-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function game(){
 const f=fixture(root);let stamp=1000,rid=0,randomCalls=0;const frames=new Map();
 f.c.Math=Object.create(Math);f.c.Math.random=()=>{randomCalls++;return .5};f.c.performance.now=()=>stamp;
 f.c.requestAnimationFrame=fn=>{frames.set(++rid,fn);return rid};f.c.cancelAnimationFrame=id=>frames.delete(id);f.c.AbortController=AbortController;
 for(const name of files)f.load(name);f.storage.set('xiantu_battle_presentation_v2756','report');
 f.run("startGame();closeWorldOverlay();startCombat({name:'寒冰蛟龙',hp:50000,maxHp:50000,atk:2,def:2,gold:8,exp:10});");f.timers.clear();frames.clear();
 const rect=(x,y,w,h)=>({left:x,top:y,width:w,height:h,right:x+w,bottom:y+h});
 f.ids.get('skillEffect').getBoundingClientRect=()=>rect(0,0,390,330);
 f.ids.get('combatPlayerChar').getBoundingClientRect=()=>rect(24,60,108,180);
 f.ids.get('enemyChar').getBoundingClientRect=()=>rect(251,55,115,180);
 f.step=(dt)=>{stamp+=dt;const batch=[...frames];frames.clear();for(const [,cb] of batch)cb(stamp)};
 f.frames=frames;f.randomCalls=()=>randomCalls;return f;
}
const f=game(),inspect=()=>f.run('InkSkillFxV2854.inspect()');
f.run("playSkillEffect('御剑术','sword')");a.equal(inspect().active,1);a.equal(inspect().jobs[0].hitAt,null);a(inspect().jobs[0].from.x<inspect().jobs[0].to.x);a(inspect().pixels<=400000);a.equal(f.ids.get('skillEffect').children.length,1);
f.step(150);f.run("playHitEffect('enemy')");a.equal(inspect().jobs[0].hitAt,150);f.step(500);f.step(300);a.equal(inspect().active,0);a.equal(inspect().pixels,0);a.equal(f.frames.size,0);
f.run("playBossSkillEffect('寒霜吐息')");a.equal(inspect().jobs[0].family,'ice');a(inspect().jobs[0].from.x>inspect().jobs[0].to.x);f.step(150);a.equal(inspect().jobs[0].hitAt,null);f.run("playHitEffect('player')");a.equal(inspect().jobs[0].hitAt,150);
f.run("playSkillEffect('凝露诀','heal')");a.equal(inspect().active,2);const heal=inspect().jobs.find(j=>j.side==='player');a.deepEqual(heal.from,heal.to);a(heal.self);
f.run("playSkillEffect('雷神附体','thunder')");a.equal(inspect().active,2);a(inspect().jobs.find(j=>j.side==='player').self);
f.run("playSkillEffect('镇岳山河震','sword','passive')");a.match(f.ids.get('inkFxNameV2854').textContent,/被动.*镇岳山河震/);a.equal(inspect().jobs.find(j=>j.side==='player').family,'earth');
f.run("playSkillEffect('穿云贯日','sword')");a.equal(inspect().jobs.find(j=>j.side==='player').family,'spear');
console.log('PASS attacker/receiver anchors, authoritative impact cue, caster healing/armor, distinct staff/spear, passive label, two-cast overlap and canvas budget');
const state=f.run('JSON.stringify([player,currentEnemy])'),random=f.randomCalls();
const skills=f.run('SKILLS.map(s=>({name:s.name,element:s.element}))');
for(const skill of skills){f.run(`playSkillEffect(${JSON.stringify(skill.name)},${JSON.stringify(skill.element)})`);f.step(180);f.run("InkSkillFxV2854.hit('enemy')");f.step(180);a(inspect().active<=2);a.equal(f.ids.get('skillEffect').children.length,1)}
a.equal(f.run('JSON.stringify([player,currentEnemy])'),state);a.equal(f.randomCalls(),random);
for(let i=0;i<200;i++)f.run("playSkillEffect('万剑归宗','sword');playBossSkillEffect('九天神雷')");a.equal(inspect().active,2);a.equal(f.frames.size,1);a(inspect().pixels<=400000);f.step(1200);a.equal(inspect().active,0);a.equal(f.frames.size,0);
console.log('PASS every '+skills.length+' learned-definition visual draws; 400 rapid casts bounded; visuals preserve combat state and gameplay RNG');
for(const event of ['pagehide','resize','orientationchange','xiantu:combat-finishing']){
 f.run("playSkillEffect('天火焚世','fire')");for(const fn of f.events[event]||[])fn({type:event});a.equal(inspect().pixels,0,event);a.equal(inspect().active,0);a.equal(inspect().raf,false);f.frames.clear();
}
f.run("playSkillEffect('万剑归宗','sword');document.hidden=true");for(const fn of f.events.visibilitychange||[])fn();a.equal(inspect().pixels,0);f.run("playSkillEffect('万剑归宗','sword')");a.equal(inspect().active,0);f.run('document.hidden=false');
f.run("playSkillEffect('天火焚世','fire');setBattlePresentationV2756('report')");a.equal(inspect().pixels,0);
f.run("playSkillEffect('天火焚世','fire');pauseVisualsV2767()");a.equal(inspect().pixels,0);
f.run("playSkillEffect('天火焚世','fire');gameState='exploring'");f.step(50);a.equal(inspect().active,0);f.run("gameState='combat'");
f.run("setBattlePresentationV2756('cinema');playSkillEffect('天火焚世','fire')");f.ids.get('cinemaPauseBtnV2756').click();a.equal(inspect().pixels,0);f.run("playSkillEffect('天火焚世','fire')");f.ids.get('cinemaSkipBtnV2756').click();a.equal(inspect().pixels,0);
a.equal(f.c.document.querySelectorAll('.skill-v26-fx').length,0);
console.log('PASS background, hidden-cast suppression, finish, map exit, actual cinema pause/skip buttons, visual pause, resize/orientation cleanup; no legacy emoji overlay');
f.run('InkSkillFxV2854.cycle()');a.equal(inspect().quality,'rich');a.equal(f.storage.get('xiantu_skill_fx_v2854'),'rich');
f.run("playSkillEffect('万剑归宗','sword')");a(inspect().pixels<=900000);
f.run('InkSkillFxV2854.clear()');f.frames.clear();f.c.matchMedia=q=>({matches:q.includes('reduced-motion'),addEventListener(){}});
f.run("playSkillEffect('万剑归宗','sword')");a.equal(inspect().raf,false);a.equal(f.frames.size,0);f.flush(440);a.equal(inspect().pixels,0);
f.c.matchMedia=()=>({matches:false,addEventListener(){}});f.c.localStorage.setItem=()=>{throw new Error('quota')};a.doesNotThrow(()=>f.run('InkSkillFxV2854.cycle()'));
const g=game();g.El.prototype.getContext=()=>null;a.equal(g.run("playInkSkillV2854('御剑术','sword')"),false);a.equal(g.run('InkSkillFxV2854.inspect().active'),0);
console.log('PASS persisted quality, pixel ceiling, reduced motion uses no RAF, restricted storage tolerated, Canvas unavailable delegates to legacy');
// Compare real skill execution with visuals enabled and with the renderer suppressed.
function actual(suppress){const h=game();h.run("player.level=4;syncUnlockedSkills();player.skillLoadoutInitializedV212=false;ensureSkillLoadoutV212();player.hp=getMaxHp();player.mp=getMaxMp();isPlayerTurn=true;");if(suppress)h.run('window.playInkSkillV2854=()=>true');h.run("combat('skill',player.skills.findIndex(s=>s.name==='清风剑诀'))");h.flush(150);h.step(150);h.flush(300);return {h,data:h.run('JSON.stringify([player.hp,player.mp,currentEnemy.hp,currentEnemy.def,isPlayerTurn])')}}
const on=actual(false),off=actual(true);a.equal(on.data,off.data);a(on.h.run('currentEnemy.hp')<50000);a(on.h.run('InkSkillFxV2854.inspect().active')>0);
for(const t of [f,g,on.h,off.h])a.equal(t.errors.length,0,JSON.stringify(t.errors));
console.log('PASS real equipped skill produces identical HP/MP/turn outcome; no paid/network calls; Node simulated DOM, not a phone benchmark');

// Regression: a one-hit victory used to clear the effect at the exact hit callback.
function lethal(mode='report'){
 const t=game();t.run(`setBattlePresentationV2756('${mode}');player.level=4;syncUnlockedSkills();player.skillLoadoutInitializedV212=false;ensureSkillLoadoutV212();player.hp=getMaxHp();player.mp=getMaxMp();isPlayerTurn=true;currentEnemy.hp=1;combat('skill',player.skills.findIndex(s=>s.name==='清风剑诀'))`);
 t.flush(150);t.step(150);t.flush(300);return t;
}
for(const mode of ['report','cinema']){
 const t=lethal(mode),state=()=>t.run('InkSkillFxV2854.inspect()');
 a.equal(t.run('gameState'),'combat-ending');a(state().active>0);a(state().finishing);a(state().jobs[0].hitAt!==null);
 const settled=t.run('JSON.stringify([player.gold,player.exp,player.mp,currentEnemy.hp,COMBAT_FINISH_V2764.token])');
 t.step(150);a(state().active>0);t.run("playSkillEffect('天火焚世','fire')");a.equal(state().jobs[0].name,'清风剑诀');
 t.step(150);a(state().active>0);a.equal(t.run('JSON.stringify([player.gold,player.exp,player.mp,currentEnemy.hp,COMBAT_FINISH_V2764.token])'),settled);
 t.step(300);a.equal(state().active,0);a.equal(state().pixels,0);t.flush(720);a.equal(t.run('gameState'),'exploring');a.equal(t.errors.length,0);
}
for(const action of ['completeCombatFinishV2764()',"document.hidden=true;window.dispatchEvent(new CustomEvent('visibilitychange'))"]){const t=lethal();t.run(action);a.equal(t.run('InkSkillFxV2854.inspect().active'),0);t.step(300);a.equal(t.run('InkSkillFxV2854.inspect().active'),0)}
const miss=game();miss.run("playSkillEffect('天火焚世','fire');beginCombatFinishV2764('flee')");a.equal(miss.run('InkSkillFxV2854.inspect().active'),0);
console.log('PASS lethal report/cinema casts retain bounded confirmed impact through settlement; rewards/MP/token unchanged; return/hidden cancel immediately; no new casts or fake missed impacts');
// Visual lifecycle contracts: staggered bodies arrive, then yield to one impact.
const sample=f.c.InkSkillFxV2854.sample;
a.equal(typeof sample,'function');
const job={arriveAt:310,hitAt:310,duration:900};
for(const delay of [0,20,60,100]){
 a.equal(sample(job,310,delay).travel,1,'every staggered projectile reaches the contact anchor');
 a.equal(sample(job,30,delay).travel,0,'no projectile advances during anticipation');
}
a.equal(sample(job,450).flight,0,'body expires after impact handoff');
a.equal(sample(job,900).visible,false,'one-shot effect expires');
a.equal(sample({...job,hitAt:null},450).struck,false,'a miss never invents an impact');
a.equal(sample({...job,hitAt:null},710).flight,0,'missed projectile also expires');
console.log('PASS staggered arrival, body/impact handoff, miss and one-shot expiry');
