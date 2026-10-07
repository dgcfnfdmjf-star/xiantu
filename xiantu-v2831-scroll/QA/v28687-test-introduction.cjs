const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.Image.prototype.removeAttribute=function(){};f.El.prototype.removeAttribute=function(k){delete this.attributes[k]};f.c.Math=Object.create(Math);let seed=1;f.c.Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
for(const s of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(s);
f.run('startGame();closeWorldOverlay();player.tutorial.skipped=true;');
const turns=[];
for(let trial=1;trial<=20;trial++){
 seed=trial;f.run('player=createDefaultPlayer();player.tutorial.skipped=true;gameState="exploring";COMBAT_FINISH_V2764.settling=false;player.equipmentInventory=["布衣"];equipItem("布衣");beginFirstJourneyV28687();actFirstJourneyV28687(0);');
 for(const stage of [0,3]){
  f.run('globalThis.journeyEnemyCheck=currentEnemy');let n=0;
  while(f.run('gameState==="combat"')&&n++<30){f.run(stage===0?'combat("attack")':'combat("skill",player.skills.findIndex(s=>s.name==="御剑术"))');for(let tick=0;tick<8;tick++)for(const delay of [...new Set([...f.timers.values()].map(t=>t.delay))].sort((a,b)=>a-b))f.flush(delay);}
  a.ok(n<30,'battle finishes');a.equal(f.run('firstJourneyV28687().step'),stage===0?1:4,'guided enemy defeated');turns.push(n);
  const before=f.run('player.gold'),count=f.run('player.equipmentInventory.filter(n=>n==="木剑").length');f.run('finishFirstJourneyBattleV28687(journeyEnemyCheck)');a.equal(f.run('player.gold'),before);a.equal(f.run('player.equipmentInventory.filter(n=>n==="木剑").length'),count);
  f.run('completeCombatFinishV2764(COMBAT_FINISH_V2764.token);closeWorldOverlay()');
  if(stage===0){a.equal(f.run('firstJourneyV28687().step'),1);f.run('player=normalizePlayer(JSON.parse(JSON.stringify(player)))');a.equal(f.run('firstJourneyV28687().step'),1);f.run('actFirstJourneyV28687(1);actFirstJourneyV28687(2);actFirstJourneyV28687(3)');a.equal(f.run('player.equipment.weapon'),'木剑');}
 }
 a.equal(f.run('firstJourneyV28687().step'),4);f.run('actFirstJourneyV28687(4);actFirstJourneyV28687(4)');a.equal(f.run('firstJourneyV28687().step'),5);
}
console.log('PASS 20 seeded fresh-role sequences (cloth armor, attack then sword skill), no losses; turns range',Math.min(...turns),Math.max(...turns));
f.run('player.firstJourneyV28687={step:0};leaveFirstJourneyV28687()');a.equal(f.run('firstJourneyV28687().paused'),true);
f.run('player.firstJourneyV28687={step:2};gameState="combat";actFirstJourneyV28687(2)');a.equal(f.run('firstJourneyV28687().step'),2);
console.log('PASS reward once-only, stale button rejection, reload resume, opt-out and combat guard');
