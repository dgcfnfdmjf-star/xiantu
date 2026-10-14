async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8773/xiantu-v2831-scroll/battle-25d-preview.html');await page.waitForFunction(()=>scene?.ready);
 await page.evaluate(()=>{window.finaleMarks=[];const base=InkSkillFxV2854.fireFinale.drawStatus;InkSkillFxV2854.fireFinale.drawStatus=function(c,kind,x,y,age,reduced,scale,opacity,pulse){if(opacity>0)finaleMarks.push({kind,opacity,pulse});return base.apply(this,arguments)};['流火飞索','炎阳护盾'].forEach(n=>InkSkillFxV2854.elementBatch.prepare(n));});
 await page.waitForFunction(()=>['流火飞索','炎阳护盾'].every(n=>InkSkillFxV2854.elementBatch.ready(n)));
 const rows=[];
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  for(const [name,kind] of [['流火飞索','bind'],['炎阳护盾','guard']]){
   await page.evaluate(()=>finaleMarks.length=0);await page.locator('#skillSelect').selectOption(name);await page.locator('#castSelected').click();await page.waitForTimeout(1500);
   const row=await page.evaluate(({name,kind,viewport})=>({name,kind,viewport,marks:finaleMarks.filter(m=>m.kind===kind).length,chill:state.chillTurns,pool:state.guardPool,turns:state.guardTurns,burn:state.burnTurns,overflow:document.documentElement.scrollWidth>innerWidth}),{name,kind,viewport});
   if(!row.marks||row.overflow)throw Error('state not visible '+JSON.stringify(row));rows.push(row);
   await page.locator('#stage').screenshot({path:'/workspace/xiantu/output/playwright/fire-finale/after-'+kind+'-'+viewport.width+'.png'});
   if(kind==='bind'){await page.locator('#elementTurn').click();await page.evaluate(()=>finaleMarks.length=0);await page.waitForTimeout(160);if(await page.evaluate(()=>finaleMarks.some(m=>m.kind==='bind')))throw Error('bind survived turn');if(await page.evaluate(()=>state.burnTurns)!==2)throw Error('bind expiry erased burn');}
   else{await page.locator('#guardHit').click();await page.waitForTimeout(160);if(!await page.evaluate(()=>finaleMarks.some(m=>m.kind==='guard'&&m.pulse>0)))throw Error('missing absorption pulse');await page.locator('#clearElements').click();await page.waitForTimeout(300);await page.evaluate(()=>finaleMarks.length=0);await page.waitForTimeout(160);if(await page.evaluate(()=>finaleMarks.length))throw Error('shield survived clear');}
  }
 }
 await page.locator('#enemySelect').selectOption('tiger');await page.waitForTimeout(150);if(await page.evaluate(()=>state.guardPool||state.chillTurns))throw Error('target state leaked');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#skillSelect').selectOption('炎阳护盾');await page.locator('#castSelected').click();await page.waitForTimeout(1500);const reduced=await page.evaluate(()=>({settings:InkSkillFxV2854.settings(),pool:state.guardPool}));await page.emulateMedia({reducedMotion:'no-preference'});
 if(errors.length)throw Error(JSON.stringify(errors));return {rows,errors,reduced};
}
