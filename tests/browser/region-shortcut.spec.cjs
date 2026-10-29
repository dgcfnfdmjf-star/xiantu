const {test,expect}=require('@playwright/test');
test('mobile region status opens the existing travel menu by touch, Enter and Space',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);await expect(page.locator('#guideHudBtn')).toBeAttached();
 await page.getByRole('button',{name:'开始修仙',exact:true}).click();await page.evaluate(()=>closeWorldOverlay());
 const hud=page.locator('.world-hud');if(await hud.evaluate(el=>el.classList.contains('mobile-hud-collapsed')))await page.locator('#mobileHudToggle').click();
 const status=page.getByRole('button',{name:/打开三界行路/});
 await expect(status).toBeVisible();expect((await status.boundingBox()).height).toBeGreaterThanOrEqual(44);
 const before=await page.evaluate(()=>({gold:player.gold,map:player.worldMapId}));
 for(const method of ['click','Enter','Space']){
  if(method==='click')await status.click();else {await status.focus();await status.press(method);}
  await expect(page.locator('#worldTravelMenuV2880')).toContainText('三界行路');
  await expect(page.locator('#choices').getByRole('button',{name:/北域/})).toBeDisabled();
  expect(await page.evaluate(()=>({gold:player.gold,map:player.worldMapId}))).toEqual(before);
  await page.getByRole('button',{name:'← 暂不启程',exact:true}).click();await expect(page.locator('#storyPanel')).toBeHidden();
 }
 await page.evaluate(()=>{for(let i=0;i<20;i++)updateRegionStatusHUD();});
 await expect(page.locator('#worldRegionStatus')).toHaveCount(1);expect((await status.textContent()).match(/⇄ 行路/g)).toHaveLength(1);
});
