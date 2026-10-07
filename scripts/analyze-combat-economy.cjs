// Seeded full combat and resource accounting in an isolated offline fixture.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../xiantu-v2831-scroll');
const f=require(path.join(root,'QA/v2858-dom-fixture.cjs'))(root);
f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;
const files=JSON.parse(fs.readFileSync(path.join(root,'game-v2762.html'),'utf8').match(/var files=(\[[^;]+\]);/)[1]);
for(const file of files)f.load(file);
f.run('startGame();closeWorldOverlay();');

f.c.AbortController=AbortController;f.c.console.log=()=>{};

(async()=>{
f.run(`var balanceUsage={heal:0,mana:0,mpSpent:0};const balanceUseOriginal=useCombatBagItem;useCombatBagItem=function(n){const before=player.inventory.filter(x=>x===n).length;balanceUseOriginal(n);const used=Math.max(0,before-player.inventory.filter(x=>x===n).length);if(n==='大还丹')balanceUsage.heal+=used;if(n==='聚灵丹')balanceUsage.mana+=used;};const balanceCombatOriginal=combat;combat=function(...args){const before=player.mp;balanceCombatOriginal(...args);balanceUsage.mpSpent+=Math.max(0,before-player.mp);};`);
const rows=[];
for(const lv of [2,3,10])for(const elite of [false,true])for(const prepared of [false,true])for(let seed=1;seed<=30;seed++){
 let rng=seed;f.c.Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
 f.run(`resetRuntimeState();player=createDefaultPlayer();player.level=${lv};player.phase=0;player.activePet=null;player.activeArtifact=null;player.inventory=['大还丹','大还丹','大还丹','聚灵丹','聚灵丹','聚灵丹'];player.equipment={};if(${prepared}){const groups={};for(const [name,d] of Object.entries(EQUIPMENT_DB)){if(!d.priceV2790||d.priceV2790>1000||!canEquipItem(name).ok)continue;const score=(d.stats?.atk||0)+(d.stats?.def||0)+(d.stats?.hp||0)/10;if(score>(groups[d.slot]?.score||0))groups[d.slot]={name,score};}for(const [slot,p] of Object.entries(groups))player.equipment[slot]=p.name;}syncUnlockedSkills();player.skillLoadoutInitializedV212=false;ensureSkillLoadoutV212();player.hp=getMaxHp();player.mp=getMaxMp();initAchievements();startCombat({...ENEMIES[0],_realmLevel:${lv},_realmPhase:0,_isElite:${elite}},false,false);`);
 f.timers.clear();f.run("balanceUsage={heal:0,mana:0,mpSpent:0}");let actions=0;
 const before=f.run('({gear:player.equipment,gearCost:Object.values(player.equipment).reduce((s,n)=>s+(EQUIPMENT_DB[n]?.priceV2790||0),0),hp:player.hp,atk:getAtk(),def:getDef(),gold:player.gold,oldGold:Math.floor(currentEnemy.gold*getGoldBonus())+getEarlyBattleBonusV2773(currentEnemy),repeatableGold:Math.floor(battleGoldV28683(currentEnemy)*getGoldBonus())+getEarlyBattleBonusV2773(currentEnemy),mp:player.mp,oldExp:currentEnemy.exp,newExp:battleExpV28683(currentEnemy)})');
 while(f.run("gameState==='combat'&&!COMBAT_FINISH_V2764.settling")&&actions<120){
  if(!f.run('isPlayerTurn'))throw Error('stalled before action');
  f.run(`(()=>{if(player.hp<getMaxHp()*.45&&combatMedicineAvailabilityV2856('大还丹').ok){useCombatBagItem('大还丹');return;}
  if(player.mp<15&&combatMedicineAvailabilityV2856('聚灵丹').ok){useCombatBagItem('聚灵丹');return;}
  const i=player.skills.findIndex((s,i)=>getCombatSkillAvailabilityV2769(i).ok&&s.damage>1);if(i>=0)combat('skill',i);else combat('attack');})()`);
  actions++;
  for(let tick=0;tick<300&&!f.run("isPlayerTurn||COMBAT_FINISH_V2764.settling||gameState!=='combat'");tick++){
   const next=[...f.timers].sort((a,b)=>a[1].delay-b[1].delay)[0];
   if(next){f.timers.delete(next[0]);next[1].f();}await Promise.resolve();
  }
 }
 const end=f.run("({...balanceUsage,win:currentEnemy.hp<=0,hp:player.hp,mp:player.mp,healLeft:player.inventory.filter(x=>x==='大还丹').length,manaLeft:player.inventory.filter(x=>x==='聚灵丹').length,settled:COMBAT_FINISH_V2764.settling})");
 assert(actions<120&&end.settled,'unfinished battle');
 rows.push({lv,elite,prepared,seed,actions,...before,...end,medicineCost:end.heal*70+end.mana*35});
}
const summaries=[];
for(const lv of [2,3,10])for(const elite of [false,true])for(const prepared of [false,true]){
 const r=rows.filter(x=>x.lv===lv&&x.elite===elite&&x.prepared===prepared),n=r.length,w=r.filter(x=>x.win).length,p=w/n,z=1.96,den=1+z*z/n,center=(p+z*z/(2*n))/den,half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
 summaries.push({lv,elite,prepared,gear:r[0].gear,gearCost:r[0].gearCost,n,wins:w,winRate:p,wilson95:[Math.max(0,center-half),Math.min(1,center+half)],meanActions:r.reduce((s,x)=>s+x.actions,0)/n,meanMpSpent:r.reduce((s,x)=>s+x.mpSpent,0)/n,meanMedicineCost:r.reduce((s,x)=>s+x.medicineCost,0)/n,oldExp:r[0].oldExp,newExp:r[0].newExp,repeatableGoldOnWin:r[0].repeatableGold,oldMeanNetGold:r.reduce((s,x)=>s+(x.win?x.oldGold:0)-x.medicineCost,0)/n,meanNetGold:r.reduce((s,x)=>s+(x.win?x.repeatableGold:0)-x.medicineCost,0)/n});
}
const economy=f.run('({grants:EARLY_GRANTS_V2773.reduce((s,g)=>s+g.gold,0),pills:BREAKTHROUGH_PILLS_V28683})');
let survival=1,expected=0;const distribution=[];
for(let i=0;i<6;i++){const rate=i===5?1:Math.min(.95,.05+i*.15);expected+=survival;distribution.push({attempt:i+1,rate,successBy:1-survival*(1-rate)});survival*=1-rate;}
const report={conditions:'360 seeded full fights through actual combat/enemy AI/medicine/settlement. Same-realm phase0 wolf template normal or elite via normal scaling, bare vs purchasable gear (each piece price <=1000; eligibility via canEquipItem), automatically unlocked/equipped available skills, no pet/artifact, three heal and three mana pills bought at map merchant prices. Fresh default stats with realm changed, not a natural progression save. 120 action limit. Local/offline enemy AI; not Jev. Medicine thresholds HP45%, MP15; first available damage skill else attack. No between-battle recovery cost; free spring exists. No balance claim for other builds or bosses.',summaries,economy,pity:{oldFloorExpected:20,newFloorExpected:expected,distribution},rows};
fs.writeFileSync(path.resolve(__dirname,'../output/balance/combat-economy.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({summaries,economy,pity:report.pity},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
