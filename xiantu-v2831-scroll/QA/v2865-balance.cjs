const fs=require('fs'),assert=require('assert'),root=process.env.XIANTU_TEST_ROOT||'release-v2865/xiantu-v2831-scroll';
const f=require('./v2858-dom-fixture.cjs')(root);f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;
for(const s of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(s);
f.run('startGame();closeWorldOverlay();');let rows=[];
for(let lv=0;lv<17;lv++)for(let phase=0;phase<4;phase++)for(const loadout of ['bare','attack','defense']){
 const row=f.run(`(()=>{player=createDefaultPlayer();player.level=${lv};player.phase=${phase};player.equipment={};
 if('${loadout}'!=='bare'){const groups={};for(const [name,d] of Object.entries(EQUIPMENT_DB)){if((d.realmRequired||0)>player.level)continue;const score=(d.stats?.['${loadout==='attack'?'atk':'def'}']||0);if(score>(groups[d.slot]?.score||0))groups[d.slot]={name,score};}for(const [slot,piece] of Object.entries(groups))player.equipment[slot]=piece.name;}
 const e={name:'模拟对手',hp:100,maxHp:100,atk:10,def:5,_realmLevel:player.level,_realmPhase:player.phase};balanceEnemyV2802(e);
 const a={level:player.level,phase:player.phase,atk:getAtk(),def:getDef()},b={level:player.level,phase:player.phase,atk:e.atk,def:e.def};
 return {level:player.level,phase:player.phase,loadout:'${loadout}',atk:a.atk,def:a.def,hp:getMaxHp(),mp:getMaxMp(),enemyHp:e.hp,attack:calculateFinalDamage({attacker:a,defender:b}).damage,skill:calculateFinalDamage({attacker:a,defender:b,skill:{damage:2,armorPierce:.2}}).damage,received:calculateFinalDamage({attacker:b,defender:a}).damage};})()`);
 for(const k of ['atk','def','hp','mp','enemyHp','attack','skill','received'])assert(Number.isFinite(row[k])&&row[k]>=0);
 assert(row.skill>=row.attack);rows.push(row);
}
fs.writeFileSync(root+'/QA/v2865-damage-matrix.json',JSON.stringify({note:'204 deterministic single-hit cases: no random crit/dodge, no full battle win-rate claim. Eligible flat attack/defense gear by slot; generic 2x skill with 20% pierce.',rows},null,2));console.log('PASS 204 realm/phase/loadout damage probes: finite outputs; damage skill >= normal attack');
