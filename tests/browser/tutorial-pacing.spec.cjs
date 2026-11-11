const {test,expect}=require('@playwright/test');
// V28.68.121 (audit G5): simple tutorial steps open on the compact reminder with the spotlight; counter advances per card.
// Synthetic new character only; never a real save.
async function boot(page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('引路测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 // The prologue story is skipped here; open the first guide card the same way the prologue's last choice does.
 await page.evaluate(()=>{closeWorldOverlay();triggerTutorial('welcome',true);});
}
for(const vp of [{width:390,height:844},{width:844,height:390}]){
 test(`welcome card then movement opens docked with spotlight ${vp.width}x${vp.height}`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize(vp);await boot(page);
  const bubble=page.locator('#tutorialBubble');
  await expect(bubble.locator('.tutorial-counter')).toContainText('起步之路 1 / 11 · 本段 1/3');
  await bubble.getByRole('button',{name:'开始引路'}).click();
  await expect(bubble).toHaveClass(/tutorial-docked/);
  await expect(bubble.locator('.tutorial-mini-progress')).toHaveText('1/11 · 2/3');
  await expect(bubble.getByRole('button',{name:'开始操作'})).toHaveCount(0);
  const spot=page.locator('.tutorial-spotlight-v2868114');await expect(spot).toBeVisible();
  const [s,j]=await Promise.all([spot.boundingBox(),page.locator('#virtualJoystick').boundingBox()]);
  expect(s.x).toBeLessThanOrEqual(j.x);expect(s.x+s.width).toBeGreaterThanOrEqual(j.x+j.width);
  const b=await bubble.boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(vp.width);
  expect(await page.locator('.tutorial-dim').evaluate(e=>e.classList.contains('acting'))).toBe(true);
  expect(errors).toEqual([]);
 });
}
