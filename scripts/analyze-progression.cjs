// Offline formula probes, not full battles or natural progression simulations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../xiantu-v2831-scroll');
const f=require(path.join(root,'QA/v2858-dom-fixture.cjs'))(root);
f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;
const files=JSON.parse(fs.readFileSync(path.join(root,'game-v2762.html'),'utf8').match(/var files=(\[[^;]+\]);/)[1]);
for(const file of files)f.load(file);
f.run('startGame();closeWorldOverlay();');
const rows=[];
for(const lv of [1,2,3,4,8,9,10,14,15])for(const phase of [0,3]){
 rows.push(f.run(`(()=>{
 player=createDefaultPlayer();player.level=${lv};player.phase=${phase};player.exp=0;player.activeArtifact=null;player.home={level:1,furniture:[]};player.inventory=[];
 const p=computeRetreatV2782(false,10), b=calculateBreakthroughSuccess();
 return {realm:getCultivationName(),need:p.need,ratePerDay:p.rate,idealYearsToFill:p.need/p.rate/GAME_DAYS_PER_YEAR,plannedDays:p.days,plannedGain:p.gain,stopReason:p.reason,successRate:b.rate,penalty:b.statusPenalty,normalBreakthroughAllowed:!isFinalTribulationGate(),expectedAttempts:isFinalTribulationGate()?null:1/b.rate,expectedRefillYears:isFinalTribulationGate()?null:(1-b.rate)/b.rate*1.5};
 })()`));
}
// Keep production attempt and settlement logic; suppress result-panel rendering only.
f.run('showBreakthroughSuccess=()=>{};showBreakthroughFailure=()=>{};');
const attempts=[];
for(const random of [.01,.99]){
 f.c.Math.random=()=>random;
 attempts.push(f.run(`(()=>{player=createDefaultPlayer();player.level=2;player.phase=3;player.inventory=[];player.exp=getCurrentExpNeed();const rate=calculateBreakthroughSuccess().rate;triggerBreakthrough(true);return {random:${random},rate,level:player.level,phase:player.phase,exp:player.exp,cooldown:player.breakthrough.cooldownDays};})()`));
}
assert.equal(attempts[0].level,3);assert.equal(attempts[1].level,2);assert.equal(attempts[1].exp,327);assert.equal(attempts[1].cooldown,49);
const report={assumptions:'Fresh default character, no inventory/artifact/furniture, default heart-demon state retained; ideal years ignore lifespan and tournament stops. Expected attempts assume independent fixed probability; expected refill years assume exactly threshold XP, 15% loss without integer rounding, no alternative XP sources and unchanged bonuses. No full playthrough.',rows,attempts};
const out=path.resolve(__dirname,'../output/balance');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'progression.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
