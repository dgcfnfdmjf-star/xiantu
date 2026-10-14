async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8770/xiantu-v2831-scroll/battle-25d-preview.html');await page.waitForFunction(()=>scene?.ready);
 await page.evaluate(()=>{window.gmMarks=0;const base=InkSkillFxV2854.fireBatch3.drawStatus;InkSkillFxV2854.fireBatch3.drawStatus=function(){gmMarks++;return base.apply(this,arguments)}});
 const rows=[];
 for(const size of [{width:390,height:844},{width:844,height:390}]){
 await page.setViewportSize(size);
 for(const name of ['天火焚世','赤焰龙息','燎原火域']){
 await page.locator('#skillSelect').selectOption(name);await page.locator('#castSelected').click();await page.waitForTimeout(1300);
 rows.push(await page.evaluate(({name,size})=>({name,size,burn:state.burnTurns,overflow:document.documentElement.scrollWidth>innerWidth,backing:[scene.canvas.width,scene.canvas.height]}),{name,size}));
 if(name==='燎原火域'){await page.locator('#stage').screenshot({path:'/workspace/xiantu/output/playwright/fire-batch3-integration/gm-'+size.width+'.png'});}
 }
 }
 if(rows.some(r=>r.overflow||r.burn!==(r.name==='天火焚世'?2:3)))throw Error(JSON.stringify(rows));
 const marks=await page.evaluate(()=>gmMarks);if(!marks)throw Error('No GM domain');await page.locator('#clearBurn').click();await page.evaluate(()=>gmMarks=0);await page.waitForTimeout(200);if(await page.evaluate(()=>gmMarks))throw Error('GM clear failed');
 await page.locator('#enemySelect').selectOption('tiger');await page.waitForTimeout(200);if(await page.evaluate(()=>state.burnTurns))throw Error('target reset failed');
 await page.locator('#inkFxQualityV2854').click();await page.locator('#skillSelect').selectOption('赤焰龙息');await page.locator('#castSelected').click();await page.waitForTimeout(400);const quality=await page.locator('#inkFxQualityV2854').innerText();
 return {rows,marks,errors,quality};
}
