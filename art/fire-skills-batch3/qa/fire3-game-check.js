async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8770/xiantu-v2831-scroll/game-v2762.html');await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();await page.waitForFunction(()=>document.documentElement.classList.contains('xiantu-v2762-ready'));
 await page.evaluate(()=>{startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.name='火系验收';setBattlePresentationV2756('report');window.fireSeen=[];const base=InkSkillFxV2854.draw;InkSkillFxV2854.draw=function(c,j,t){if(['天火焚世','赤焰龙息','燎原火域'].includes(j.profile.name))fireSeen.push({name:j.profile.name,t,hit:j.hitAt,det:j.detonationAt,parts:InkSkillFxV2854.fireBatch.sample(j,t).map(p=>p.layer)});return base.apply(this,arguments)};for(const name of ['天火焚世','赤焰龙息','燎原火域'])InkSkillFxV2854.fireBatch.prepare(name)});
 await page.waitForFunction(()=>['天火焚世','赤焰龙息','燎原火域'].every(n=>InkSkillFxV2854.fireBatch.ready(n)));
 const results=[];
 for(const [name,turns] of [['天火焚世',0],['赤焰龙息',0],['燎原火域',0]]){
 await page.evaluate(({name,turns})=>{resetRuntimeState();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name===name)}];player.skillLoadoutV212={fire:[name]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'苍山野狼',hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});currentEnemy.burnTurns=turns;currentEnemy.burnStacks=10;fireSeen.length=0;}, {name,turns});
 await page.waitForTimeout(180);const before=await page.evaluate(()=>player.mp);await page.evaluate(()=>combat('skill',0));await page.waitForTimeout(name==='燎原火域'?480:430);
 await page.locator('#combatArena').screenshot({path:'/workspace/xiantu/output/playwright/fire-batch3-integration/'+(name==='天火焚世'?'meteor':name==='赤焰龙息'?'dragon':'domain')+'.png'});
 await page.waitForTimeout(250);results.push(await page.evaluate(({name,turns,before})=>({name,turns,mpSpent:before-player.mp,burn:currentEnemy.burnTurns,seen:fireSeen.length,detonation:fireSeen.some(v=>v.parts.includes('detonation')),impact:fireSeen.some(v=>v.parts.includes('impact')||(name==='燎原火域'&&v.hit!==null&&v.t>=v.hit&&v.parts.includes('body'))),hp:currentEnemy.hp}),{name,turns,before}));
 }
 if(!results.every(r=>r.impact&&r.mpSpent===({'天火焚世':75,'赤焰龙息':58,'燎原火域':72}[r.name])))throw Error('actual cast mismatch '+JSON.stringify(results));
 await page.evaluate(()=>resetRuntimeState());await page.waitForTimeout(100);const canvases=await page.locator('.duel25-stage').count();
 return {results,errors,afterResetStages:canvases};
}
