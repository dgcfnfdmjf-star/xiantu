'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=path.resolve(__dirname,'../xiantu-v2831-scroll'),f=require('../xiantu-v2831-scroll/QA/v2858-dom-fixture.cjs')(root);
f.c.Math=Object.create(Math);f.c.console.log=()=>{};
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run('startGame();closeWorldOverlay()');
(async()=>{const rows=[];for(const step of [4,9])for(const route of ['rescue','chase'])for(let seed=1;seed<=20;seed++){
 let r=seed;f.c.Math.random=()=>((r=(Math.imul(r,1664525)+1013904223)>>>0)/4294967296);
 f.c.probeStep=step;f.c.probeRoute=route;
 f.run(`resetRuntimeState();player=createDefaultPlayer();player.level=0;player.phase=0;player.equipment={weapon:'木剑',robe:'布衣'};player.skills=[SKILLS.find(s=>s.name==='御剑术')];player.skillLoadoutInitializedV212=false;ensureSkillLoadoutV212();player.inventory=[];player.activePet=null;player.activeArtifact=null;player.hp=getMaxHp();player.mp=getMaxMp();player.rainChapterV286822={step:probeStep,route:probeRoute,puzzle:probeRoute==='rescue'};gameState='exploring';initAchievements();showRainChapterV286822();actRainV286822(rainViewV286822.token,'fight')`);f.timers.clear();
 let turns=0;
 while(f.run("gameState==='combat'&&!COMBAT_FINISH_V2764.settling")&&turns<80){
  a(f.run('isPlayerTurn'));f.run("getCombatSkillAvailabilityV2769(0).ok?combat('skill',0):combat('attack')");turns++;
  for(let i=0;i<300&&!f.run("isPlayerTurn||gameState!=='combat'||COMBAT_FINISH_V2764.settling");i++){const next=[...f.timers].sort((x,y)=>x[1].delay-y[1].delay)[0];if(next){f.timers.delete(next[0]);next[1].f();}await Promise.resolve();}
 }
 a(turns<80);rows.push({step,route,seed,turns,win:f.run(`rainStateV286822().step>${step}`),hp:f.run('player.hp')});
}
const groups=[];for(const step of [4,9])for(const route of ['rescue','chase']){const g=rows.filter(r=>r.step===step&&r.route===route),t=g.map(r=>r.turns).sort((a,b)=>a-b);groups.push({step,route,n:g.length,wins:g.filter(r=>r.win).length,medianTurns:t[10],p95Turns:t[18]});}
fs.mkdirSync(path.resolve(__dirname,'../output/balance'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../output/balance/rain22.json'),JSON.stringify({conditions:'80 seeded complete battles; mortal initial stage; wooden sword and cloth robe; carried sword skill then normal attack when out of MP; no potions/pet/artifact. Step9 rescue means solved puzzle, chase means forced gate. Synthetic combat fixture, not natural story playtime.',groups,rows},null,2));console.log(groups);
})().catch(e=>{console.error(e);process.exitCode=1});
