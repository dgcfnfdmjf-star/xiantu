async page=>{
 const errors=[],checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)};page.on('pageerror',e=>errors.push(e.message));
 await page.context().route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.waitForFunction(()=>scene?.ready);await page.evaluate(()=>{for(const n of ['青莲护心','莲华济世','玄罡护体剑'])InkSkillFxV2854.healBatch3.prepare(n)});await page.waitForFunction(()=>['青莲护心','莲华济世','玄罡护体剑'].every(n=>InkSkillFxV2854.healBatch3.ready(n)));
 await page.evaluate(()=>{
  scene.destroy();let time=1000,id=0;const callbacks=new Map();window.requestAnimationFrame=fn=>{callbacks.set(++id,fn);return id};window.cancelAnimationFrame=i=>callbacks.delete(i);performance.now=()=>time;
  scene=XiantuDuel25D.create(document.getElementById('stage'),()=>state,selector.value);
  window.__parts=[];const status=InkSkillFxV2854.swordFinale.drawStatus,draw=InkSkillFxV2854.draw;
  InkSkillFxV2854.swordFinale.drawStatus=function(c,r,p,o){window.__parts.push({status:r.name,age:r.age,ending:Number.isFinite(r.end),parts:InkSkillFxV2854.healBatch3.definition(r.name)?InkSkillFxV2854.healBatch3.sample({profile:InkSkillFxV2854.profile(r.name),guardOwned:true,guardConsumedAt:r.end-r.at},r.age):[]});return status.apply(this,arguments)};
  InkSkillFxV2854.draw=function(c,j,t){if(InkSkillFxV2854.healBatch3.definition(j.profile.name))window.__parts.push({cast:j.profile.name,actualHeal:j.actualHeal,parts:InkSkillFxV2854.healBatch3.sample(j,t)});return draw.apply(this,arguments)};
  window.__advance=ms=>{window.__parts=[];for(let i=0;i<ms;i+=20){time+=20;const batch=[...callbacks.values()];callbacks.clear();for(const cb of batch)cb(time);if(callbacks.size>1)throw Error('duplicate RAF')}return callbacks.size};
  window.__advance(100);
 });
 for(const [name,key] of [['青莲护心','jade'],['莲华济世','gold']]){
  for(const full of [false,true]){
   await page.evaluate(()=>perform('reset'));await page.locator('#skillSelect').selectOption(name);await page.locator('#healScenario').selectOption(full?'full':'normal');await page.locator('#castSelected').click();
   await page.evaluate(()=>__advance(200));let parts=await page.evaluate(()=>__parts);check(parts.some(x=>x.cast===name),'cast routed '+key+full);check(parts.some(x=>x.parts.some(p=>p.layer==='body'))===!full,'actual HP body '+key+full);
   if(!full)await page.locator('#stage').screenshot({path:'output/playwright/heal-guard-integration/'+key+'-body.png'});
   await page.evaluate(()=>__advance(1000));check((await page.evaluate(()=>__parts)).some(x=>x.status===name&&x.parts.some(p=>p.layer==='guard')),'guard persists '+key+full);
   await page.locator('#healGuardZero').click();check((await page.evaluate(()=>state.swordGuardRatio))>0,'zero damage retains '+key+full);
   if(!full)await page.locator('#stage').screenshot({path:'output/playwright/heal-guard-integration/'+key+'-guard.png'});
   await page.locator('#healGuardHit').click();await page.evaluate(()=>__advance(100));check((await page.evaluate(()=>__parts)).some(x=>x.status===name&&x.parts.some(p=>p.layer==='consume')),'consume '+key+full);
   if(!full)await page.locator('#stage').screenshot({path:'output/playwright/heal-guard-integration/'+key+'-consume.png'});
   await page.evaluate(()=>__advance(300));await page.evaluate(()=>__advance(100));check(!(await page.evaluate(()=>__parts)).some(x=>x.status),'consumed gone '+key+full);
  }
  await page.evaluate(()=>perform('reset'));await page.locator('#castSelected').click();await page.evaluate(()=>__advance(100));await page.locator('#healGuardHit').click();await page.evaluate(()=>__advance(1000));await page.evaluate(()=>__advance(100));check(!(await page.evaluate(()=>__parts)).some(x=>x.status),'early consume no reappearance '+key);
 }
 await page.evaluate(()=>perform('reset'));await page.locator('#healGuardScenario').selectOption('lotus');await page.locator('#skillSelect').selectOption('青莲护心');await page.locator('#castSelected').click();await page.evaluate(()=>__advance(1200));check((await page.evaluate(()=>__parts)).filter(x=>x.status).every(x=>x.status==='莲华济世'),'strongest visual owner');
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>__advance(100));await page.locator('#stage').screenshot({path:'output/playwright/heal-guard-integration/landscape-guard.png'});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'landscape no overflow');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>__advance(100));await page.screenshot({path:'output/playwright/heal-guard-integration/portrait.png'});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'portrait no overflow');
 check(errors.length===0,'no page errors');await page.evaluate(r=>window.__runtimePreviewChecks=r,{passed:checks.length,checks,errors});return {passed:checks.length,checks,errors};
}
