async page=>{
 await page.goto('http://127.0.0.1:8770/xiantu-v2831-scroll/battle-25d-preview.html');await page.waitForFunction(()=>scene?.ready);
 for(let i=0;i<3&&!((await page.locator('#inkFxQualityV2854').innerText()).includes('省电'));i++)await page.locator('#inkFxQualityV2854').click();
 const quality=await page.locator('#inkFxQualityV2854').innerText();if(!quality.includes('省电'))throw Error(quality);
 await page.locator('#skillSelect').selectOption('燎原火域');await page.locator('#castSelected').click();await page.waitForTimeout(1200);
 const light=await page.evaluate(()=>({settings:InkSkillFxV2854.settings(),burn:state.burnTurns,ready:InkSkillFxV2854.fireBatch3.ready('燎原火域')}));
 await page.route('**/fire-skills-batch3/dragon_breath_body.png',r=>r.abort());await page.reload();await page.waitForFunction(()=>scene?.ready);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.evaluate(()=>['天火焚世','赤焰龙息','燎原火域'].forEach(n=>InkSkillFxV2854.fireBatch3.prepare(n)));await page.waitForFunction(()=>InkSkillFxV2854.fireBatch3.ready('天火焚世')&&InkSkillFxV2854.fireBatch3.ready('燎原火域'));
 await page.locator('#skillSelect').selectOption('赤焰龙息');await page.locator('#castSelected').click();await page.waitForTimeout(1200);
 const failed=await page.evaluate(()=>({dragonReady:InkSkillFxV2854.fireBatch3.ready('赤焰龙息'),hp:state.enemyHp,burn:state.burnTurns}));if(failed.dragonReady||failed.hp!==770||errors.length)throw Error(JSON.stringify({failed,errors}));
 await page.unroute('**/fire-skills-batch3/dragon_breath_body.png');return {light,failed,errors};
}
