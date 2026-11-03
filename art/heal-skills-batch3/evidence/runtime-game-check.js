async page=>{
 const errors=[],checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)};page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.context().route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 if(!await page.evaluate(()=>document.documentElement.classList.contains('xiantu-v2762-ready'))){await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();await page.waitForFunction(()=>document.documentElement.classList.contains('xiantu-v2762-ready'));await page.locator('#playerName').fill('护持验证');await page.getByRole('button',{name:'开始修仙',exact:true}).click();await page.evaluate(()=>closeWorldOverlay());}
 await page.evaluate(()=>{
  window.__combatFx=[];const draw=InkSkillFxV2854.draw,status=InkSkillFxV2854.swordFinale.drawStatus,notify=InkSkillFxV2854.swordFinale.notify;
  InkSkillFxV2854.draw=function(c,j,t){if(InkSkillFxV2854.healBatch3.definition(j.profile.name))__combatFx.push({kind:'cast',name:j.profile.name,actualHeal:j.actualHeal,t,parts:InkSkillFxV2854.healBatch3.sample(j,t)});return draw.apply(this,arguments)};
  InkSkillFxV2854.swordFinale.drawStatus=function(c,r,p,o){__combatFx.push({kind:'status',name:r.name,age:r.age,end:r.end,point:p});return status.apply(this,arguments)};
  InkSkillFxV2854.swordFinale.notify=function(k,d){__combatFx.push({kind:'event',event:k,name:d?.name});return notify.apply(this,arguments)};
  const play=window.playSkillEffect,drawImage=CanvasRenderingContext2D.prototype.drawImage;window.playSkillEffect=function(n,e,s,v){__combatFx.push({kind:'play',name:n,actualHeal:v?.actualHeal});return play.apply(this,arguments)};CanvasRenderingContext2D.prototype.drawImage=function(im,...a){if(im?.src?.includes('heal-skills-batch3/'))__combatFx.push({kind:'texture',src:im.src});return drawImage.call(this,im,...a)};
  for(const n of ['青莲护心','莲华济世'])InkSkillFxV2854.healBatch3.prepare(n);
 });await page.waitForFunction(()=>['青莲护心','莲华济世'].every(n=>InkSkillFxV2854.healBatch3.ready(n)));
 for(const report of [false,true])for(const [name,key] of [['青莲护心','jade'],['莲华济世','gold']])for(const full of [false,true]){
  await page.evaluate(({report,name,full})=>{
   resetRuntimeState();player=createDefaultPlayer();player.name='护持验证';player.mp=1000;player.skills=[{...SKILLS.find(s=>s.name===name)}];player.skillLoadoutV212={heal:[name]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:report?'护持测试目标':'野狼',hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});player.hp=getMaxHp()*(full?1:.2);currentEnemy.atk=1;updateCombatUI();
  },{report,name,full});if(!report)await page.waitForFunction(()=>document.getElementById('combatArena').classList.contains('duel25-active'));
  const expected=await page.evaluate(()=>({hp:player.hp,max:getMaxHp(),mp:player.mp,cost:player.skills[0].mpCost}));
  await page.evaluate(()=>{window.__combatFx=[];combat('skill',0)});await page.waitForTimeout(180);
  const result=await page.evaluate(()=>({hp:player.hp,mp:player.mp,guard:guardsV2785.get(currentEnemy)?.ratio,events:__combatFx}));
  check(result.mp===expected.mp-expected.cost,'MP '+report+key+full);check(result.guard===(name==='青莲护心'?.3:.4),'guard established '+report+key+full);
  check(result.events.some(e=>e.kind==='texture'),'runtime draw '+report+key+full);
  check(result.events.filter(e=>e.kind==='play').every(e=>e.actualHeal===(full?0:Math.min(expected.max-expected.hp,Math.floor(expected.max*(name==='青莲护心'?.25:.6))))),'actual healing metadata '+report+key+full);
  if(full)check(!result.events.some(e=>e.kind==='texture'&&/_(body|impact)\.png/.test(e.src)),'full HP suppresses heal '+report+key);
  if(!full)await page.locator('#combatArena').screenshot({path:'output/playwright/heal-guard-integration/game-'+(report?'report-':'duel-')+key+'.png'});
  await page.waitForTimeout(1200);check(await page.evaluate(()=>__combatFx.some(e=>e.kind==='event'&&e.event==='consume')),'real enemy consumes '+report+key+full);
  await page.evaluate(()=>{window.__combatFx=[]});await page.waitForTimeout(300);check(!(await page.evaluate(()=>__combatFx)).some(e=>e.kind==='status'),'consumption cleared '+report+key+full);
 }
 check(errors.length===0,'no real game exceptions');await page.evaluate(()=>resetRuntimeState());return {passed:checks.length,checks,errors};
}
