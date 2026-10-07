// Isolated deterministic full-turn comparison; no real saves or remote services.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../xiantu-v2831-scroll'));
const out=path.resolve(process.argv[3]||path.join(__dirname,'../output/balance/elements.json'));
const f=require('../xiantu-v2831-scroll/QA/v2858-dom-fixture.cjs')(root);
f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay();');
const rows=[];
(async()=>{
for(const lv of [2,3])for(const elite of [false,true])for(const family of ['sword','ice','fire'])for(let seed=1;seed<=20;seed++){
 let rng=seed;f.c.Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
 f.c.levelProbe=lv;f.c.eliteProbe=elite;f.c.familyProbe=family;
 f.run(`resetRuntimeState();player=createDefaultPlayer();player.level=levelProbe;player.phase=0;player.activePet=null;player.activeArtifact=null;player.inventory=['大还丹','大还丹','大还丹'];player.equipment={};var bestGear={};for(const [name,d] of Object.entries(EQUIPMENT_DB)){if(!d.priceV2790||d.priceV2790>1000||!canEquipItem(name).ok||(familyProbe==='sword'&&d.slot==='weapon'&&d.weaponFamily!=='sword'))continue;const score=(d.stats?.atk||0)+(d.stats?.def||0)+(d.stats?.hp||0)/10;if(score>(bestGear[d.slot]?.score||0))bestGear[d.slot]={name,score};}for(const [slot,p] of Object.entries(bestGear))player.equipment[slot]=p.name;player.skills=({sword:['御剑术','清风剑诀'],ice:['玄冰刺','冰爆术','冰甲护身'],fire:['烈焰斩','炎爆术','红莲业火']})[familyProbe].map(n=>({...SKILLS.find(s=>s.name===n)}));player.skillLoadoutV212={[familyProbe]:player.skills.map(s=>s.name)};player.skillLoadoutInitializedV212=true;player.hp=getMaxHp();player.mp=getMaxMp();initAchievements();startCombat({...ENEMIES[0],name:({sword:'石傀儡',ice:'火凤凰',fire:'树精'})[familyProbe],_realmLevel:levelProbe,_realmPhase:0,_isElite:eliteProbe},false,false);`);
 f.timers.clear();let actions=0,mpSpent=0,pills=0;
 while(f.run("gameState==='combat'&&!COMBAT_FINISH_V2764.settling")&&actions<100){
  assert(f.run('isPlayerTurn'),'turn stalled');f.c.actionProbe=actions;
  const before=f.run('({mp:player.mp,pills:player.inventory.filter(x=>x==="大还丹").length})');
  f.run(`(()=>{if(player.hp<getMaxHp()*.45&&combatMedicineAvailabilityV2856('大还丹').ok){useCombatBagItem('大还丹');return;}let desired=familyProbe==='fire'?(currentEnemy.burnTurns>1?'炎爆术':'红莲业火'):familyProbe==='ice'?(actionProbe===0?'冰甲护身':actionProbe%2?'玄冰刺':'冰爆术'):(actionProbe%4===3?'':'御剑术');const index=player.skills.findIndex(s=>s.name===desired);if(index>=0&&getCombatSkillAvailabilityV2769(index).ok)combat('skill',index);else combat('attack');})()`);
  mpSpent+=Math.max(0,before.mp-f.run('player.mp'));pills+=before.pills-f.run('player.inventory.filter(x=>x==="大还丹").length');actions++;
  for(let i=0;i<300&&!f.run("isPlayerTurn||COMBAT_FINISH_V2764.settling||gameState!=='combat'");i++){
   const next=[...f.timers].sort((a,b)=>a[1].delay-b[1].delay)[0];if(next){f.timers.delete(next[0]);next[1].f();}await Promise.resolve();
  }
 }
 assert(actions<100&&f.run('COMBAT_FINISH_V2764.settling'),'unfinished fight');
 rows.push({lv,elite,family,seed,actions,mpSpent,pills,win:f.run('currentEnemy.hp<=0')});
}
const summaries=[];
for(const lv of [2,3])for(const elite of [false,true])for(const family of ['sword','ice','fire']){
 const group=rows.filter(r=>r.lv===lv&&r.elite===elite&&r.family===family),n=group.length,wins=group.filter(r=>r.win).length,p=wins/n,z=1.96,den=1+z*z/n,mid=(p+z*z/(2*n))/den,half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den,actions=group.map(r=>r.actions).sort((a,b)=>a-b);
 summaries.push({lv,elite,family,n,wins,winRate:p,wilson95:[mid-half,mid+half],medianActions:actions[Math.floor(n*.5)],p95Actions:actions[Math.floor(n*.95)],meanMpSpent:group.reduce((s,r)=>s+r.mpSpent,0)/n,meanPillCost:group.reduce((s,r)=>s+r.pills*70,0)/n});
}
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({conditions:'240 seeded complete fights; realm 2/3 phase0, normal/elite golem(sword), phoenix(ice), treant(fire), 20 seeds per group. Gear each <=1000 and equippable, hand-selected carried sword/ice/fire skills; sword weapon and 3 skill/1 normal attack rotation; synthetic fresh character, not natural progression. No pet/artifact/remote calls; three heal pills, no mana pills; HP45% heal, listed skill rotation else normal attack. Not a global balance or boss benchmark.',summaries,rows},null,2));console.log(out);
})().catch(e=>{console.error(e);process.exitCode=1});
