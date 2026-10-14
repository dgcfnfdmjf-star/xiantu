async page=>{
 await page.goto('http://127.0.0.1:8772/xiantu-v2831-scroll/battle-25d-preview.html');await page.waitForFunction(()=>scene?.ready);
 const results=[];for(const [name,key] of [['流火飞索','bind'],['炎阳护盾','shield']]){await page.locator('#skillSelect').selectOption(name);await page.locator('#castSelected').click();await page.waitForTimeout(1400);await page.locator('#stage').screenshot({path:'/workspace/xiantu/output/playwright/fire-finale/before-'+key+'.png'});results.push(await page.evaluate(name=>({name,bind:state.chillTurns??null,guard:state.guardPool??null,burn:state.burnTurns??null}),name));}return results;
}
