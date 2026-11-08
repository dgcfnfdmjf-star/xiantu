const {test,expect}=require('@playwright/test');
// 青绿鎏金 in-game dialog replaces native confirm/alert/prompt on converted sites. Synthetic new character only.
async function boot(page,natives){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page.on('dialog',d=>{natives.push(d.type());d.dismiss();});
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('弹窗测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>closeWorldOverlay());
}
test('confirm modal: focus, Esc/cancel = no action, confirm runs once, text is not parsed as HTML',async({page})=>{
 const natives=[];await boot(page,natives);
 await page.evaluate(()=>{window.__hits=0;document.body.focus();gameConfirmV2868114('<img src=x onerror="window.__xss=1">确认？',()=>window.__hits++);});
 const dlg=page.getByRole('dialog');await expect(dlg).toBeVisible();await expect(dlg).toHaveAttribute('aria-modal','true');
 await expect(dlg.locator('img')).toHaveCount(0);await expect(dlg).toContainText('<img src=x');
 await expect(page.getByRole('button',{name:'取消'})).toBeFocused();
 await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'确定'})).toBeFocused();
 await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'取消'})).toBeFocused();
 await page.keyboard.press('Escape');await expect(dlg).toHaveCount(0);
 await page.evaluate(()=>gameConfirmV2868114('再确认？',()=>window.__hits++));await page.getByRole('button',{name:'取消'}).click();
 await page.evaluate(()=>gameConfirmV2868114('三确认？',()=>window.__hits++));await page.getByRole('button',{name:'确定'}).click();await page.getByRole('button',{name:'确定'}).click({timeout:300}).catch(()=>{});
 expect(await page.evaluate(()=>[window.__hits,window.__xss||0])).toEqual([1,0]);expect(natives).toEqual([]);
});
test('prompt modal returns the typed value or null; build badge uses an in-game alert',async({page})=>{
 const natives=[];await boot(page,natives);
 await page.evaluate(()=>{window.__v='unset';gamePromptV2868114('赐名',"旧名",v=>{window.__v=v;});});
 const input=page.getByRole('dialog').locator('input');await expect(input).toBeFocused();await expect(input).toHaveValue('旧名');
 await input.fill('雪团');await input.press('Enter');expect(await page.evaluate(()=>window.__v)).toBe('雪团');
 await page.evaluate(()=>gamePromptV2868114('赐名','',v=>{window.__v=v;}));await page.keyboard.press('Escape');expect(await page.evaluate(()=>window.__v)).toBeNull();
 await page.evaluate(()=>document.getElementById('xiantuBuildBadgeV2814').click());
 const alert=page.getByRole('alertdialog');await expect(alert).toContainText('仙途 · V28.68');await page.getByRole('button',{name:'知道了'}).click();await expect(alert).toHaveCount(0);
 expect(natives).toEqual([]);
});
test('tutorial skip: cancel keeps the tutorial, confirm skips it',async({page})=>{
 const natives=[];await boot(page,natives);
 await page.evaluate(()=>{const t=ensureTutorialState();t.skipped=false;t.completedSteps=[];skipAllTutorial();});
 await page.getByRole('button',{name:'取消'}).click();expect(await page.evaluate(()=>ensureTutorialState().skipped)).toBe(false);
 await page.evaluate(()=>skipAllTutorial());await page.getByRole('button',{name:'确定'}).click();expect(await page.evaluate(()=>ensureTutorialState().skipped)).toBe(true);
 expect(natives).toEqual([]);
});
