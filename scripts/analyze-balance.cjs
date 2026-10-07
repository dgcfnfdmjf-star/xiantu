// Offline formula probes, not full battles or natural progression simulations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../xiantu-v2831-scroll');
const f=require(path.join(root,'QA/v2858-dom-fixture.cjs'))(root);
f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;
const files=JSON.parse(fs.readFileSync(path.join(root,'game-v2762.html'),'utf8').match(/var files=(\[[^;]+\]);/)[1]);
for(const file of files)f.load(file);
f.run('startGame();closeWorldOverlay();');
const rows=[],count=f.run('CULTIVATION_REALMS.length');
for(let lv=0;lv<count;lv++)for(let phase=0;phase<4;phase++)for(const loadout of ['bare','attack','defense']){
 const row=f.run(`(()=>{
 player=createDefaultPlayer();player.level=${lv};player.phase=${phase};player.equipment={};
 const gear={};
 if('${loadout}'!=='bare'){
  for(const [name,d] of Object.entries(EQUIPMENT_DB)){
   if((d.realmRequired||0)>player.level)continue;
   const score=d.stats?.['${loadout==='attack'?'atk':'def'}']||0;
   if(score>(gear[d.slot]?.score||0))gear[d.slot]={name,score};
  }
  for(const [slot,piece] of Object.entries(gear))player.equipment[slot]=piece.name;
 }
 const e={name:'公式探针',hp:100,maxHp:100,atk:10,def:5,_realmLevel:player.level,_realmPhase:player.phase};
 balanceEnemyV2802(e);
 const a={level:player.level,phase:player.phase,atk:getAtk(),def:getDef()},b={level:player.level,phase:player.phase,atk:e.atk,def:e.def};
 return {realm:getCultivationName(),level:player.level,phase:player.phase,loadout:'${loadout}',equipment:{...player.equipment},hp:getMaxHp(),mp:getMaxMp(),atk:a.atk,def:a.def,expNeed:getCurrentExpNeed(),enemyHp:e.hp,attack:calculateFinalDamage({attacker:a,defender:b}).damage,skill:calculateFinalDamage({attacker:a,defender:b,skill:{damage:2,armorPierce:.2}}).damage,received:calculateFinalDamage({attacker:b,defender:a}).damage};
 })()`);
 for(const key of ['hp','mp','atk','def','expNeed','enemyHp','attack','skill','received'])assert(Number.isFinite(row[key])&&row[key]>=0,`${key}: ${lv}/${phase}/${loadout}`);
 assert(row.skill>=row.attack);
 rows.push(row);
}
const groups=Object.fromEntries(['bare','attack','defense'].map(key=>{
 const r=rows.filter(x=>x.loadout===key),hits=r.map(x=>Math.ceil(x.enemyHp/x.attack));
 return [key,{cases:r.length,minNormalHits:Math.min(...hits),maxNormalHits:Math.max(...hits),minimumDamageCases:r.filter(x=>x.attack===1).length}];
}));
const economy=f.run('({grants:EARLY_GRANTS_V2773,grantTotal:EARLY_GRANTS_V2773.reduce((s,g)=>s+g.gold,0),buyback:EARLY_BUYBACK_V2773})');
const report={assumptions:'All loaded runtime scripts; random=.5; default player with only level/phase/gear changed; ideal flat-stat gear by realm requirement, acquisition ignored; synthetic same-realm normal enemy; generic 2x skill with 20% pierce. All four phase indices probed, not a claim of reachability. Hit counts assume constant damage and no enemy actions; not win rates.',groups,economy,rows};
const out=path.resolve(__dirname,'../output/balance');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'baseline.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:rows.length,groups,economy},null,2));
