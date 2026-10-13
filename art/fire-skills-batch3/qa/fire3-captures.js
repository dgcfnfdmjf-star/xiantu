async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8770/xiantu-v2831-scroll/game-v2762.html');await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();await page.waitForFunction(()=>document.documentElement.classList.contains('xiantu-v2762-ready'));
 await page.evaluate(()=>{
 startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.name='火系验收';window.captures3={};window.status3=0;
 const draw=InkSkillFxV2854.draw,mark=InkSkillFxV2854.fireBatch3.drawStatus;
 function capture(c,key){if(captures3[key])return;const out=document.createElement('canvas');out.width=c.canvas.width;out.height=c.canvas.height;const g=out.getContext('2d'),bg=c.canvas.parentElement?.querySelector('.duel25-backdrop');if(bg)g.drawImage(bg,0,0,out.width,out.height);g.drawImage(c.canvas,0,0);captures3[key]=out.toDataURL();}
 window.capture3=capture;
 InkSkillFxV2854.draw=function(c,j,t){const v=draw.apply(this,arguments);if(['天火焚世','赤焰龙息','燎原火域'].includes(j.profile.name)){const key=({'天火焚世':'meteor','赤焰龙息':'dragon','燎原火域':'domain'})[j.profile.name];if(t>(key==='dragon'?240:130)&&t<310)capture(c,key+'-travel');if(j.hitAt!=null&&t-j.hitAt>50&&t-j.hitAt<180)capture(c,key+'-impact');if(j.hitAt!=null&&t-j.hitAt>370&&t-j.hitAt<450)capture(c,key+'-residue');}return v;};
 InkSkillFxV2854.fireBatch3.drawStatus=function(c,...args){status3++;const v=mark.call(this,c,...args);return v;};
 for(const n of ['天火焚世','赤焰龙息','燎原火域'])InkSkillFxV2854.fireBatch3.prepare(n);
 });
 await page.waitForFunction(()=>['天火焚世','赤焰龙息','燎原火域'].every(n=>InkSkillFxV2854.fireBatch3.ready(n)));
 for(const name of ['天火焚世','赤焰龙息','燎原火域']){
 await page.evaluate(name=>{resetRuntimeState();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name===name)}];player.skillLoadoutV212={fire:[name]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'苍山野狼',hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});},name);
 await page.waitForTimeout(150);await page.evaluate(()=>combat('skill',0));await page.waitForTimeout(1900);if(name==='燎原火域')await page.evaluate(()=>capture3(document.querySelector('#combatArena .duel25-canvas').getContext('2d'),'domain-loop'));
 }
 const status=await page.evaluate(()=>status3);if(!status)throw Error('No real combat domain status');
 await page.evaluate(()=>{currentEnemy.burnTurns=0;currentEnemy.burnStacks=0;status3=0});await page.waitForTimeout(250);if(await page.evaluate(()=>status3))throw Error('Domain persisted after burn clear');
 await page.evaluate(()=>{currentEnemy.burnTurns=3;currentEnemy.burnStacks=10});await page.waitForTimeout(250);if(await page.evaluate(()=>status3))throw Error('Domain resurrected from generic burn');
 const captures=await page.evaluate(()=>captures3);await page.evaluate(()=>resetRuntimeState());return {errors,status,captures};
}
