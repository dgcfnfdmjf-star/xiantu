const {test,expect}=require('@playwright/test');
// V28.68.117: 今日修行 tab in the task panel and claimable dot on 任务. Synthetic new character only; never a real save.
async function boot(page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('今日测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();player.tutorial.skipped=true;player.tutorial.completedSteps=TUTORIAL_ORDER.slice();closeTutorialBubble();if(typeof tutorialState!=='undefined')tutorialState.active=false;document.getElementById('tutorialToast')?.remove();});
}
test('dot follows trip yield; card lists tasks and claims through the existing trip function',async({page})=>{
 await page.setViewportSize({width:390,height:844});await boot(page);
 const dot=page.locator('#taskBtn > .today-dot-v2868117');
 await page.evaluate(()=>{updateStats();});await expect(dot).toHaveCount(0);
 await page.evaluate(()=>{player.expeditionV286821={wins:{wolf:0},active:{key:'wolf',started:Date.now()-125*60000,level:0}};updateStats();});
 await expect(dot).toBeVisible();
 await page.locator('#taskBtn').click();await page.locator('.task-tab[data-tab="today"]').click();
 const card=page.locator('#todayCardV2868117');await expect(card).toBeVisible();
 await expect(card.locator('[data-today="daily"] .today-row-v2868117')).toHaveCount(3);await expect(card.locator('[data-today="weekly"] .today-row-v2868117')).toHaveCount(2);
 await expect(card.locator('[data-today="trip"]')).toContainText('已积累120/480分钟');
 const gold=await page.evaluate(()=>player.gold);
 await card.getByRole('button',{name:'领取游历收获并结束本趟'}).click();
 expect(await page.evaluate(()=>player.gold)).toBe(gold+12);expect(await page.evaluate(()=>player.expeditionV286821.active)).toBeNull();
 await expect(dot).toHaveCount(0);
});
test('landscape card fits and dot is static with effects off',async({page})=>{
 await page.setViewportSize({width:844,height:390});await boot(page);
 await page.evaluate(()=>{localStorage.setItem('xiantu_map_fx_v2868104','off');player.expeditionV286821={wins:{wolf:0},active:{key:'wolf',started:Date.now()-30*60000,level:0}};updateStats();});
 const dot=page.locator('#taskBtn > .today-dot-v2868117');await expect(dot).toHaveClass(/still-v2868117/);
 expect(await dot.evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 await page.evaluate(()=>showTaskPanel('today'));const card=page.locator('#todayCardV2868117');await expect(card).toBeVisible();
 const w=await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1);expect(w).toBe(true);
});
