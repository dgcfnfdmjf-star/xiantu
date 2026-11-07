const {test,expect}=require('@playwright/test');
// Core confirm sites use the in-game dialog: cancel = no change, confirm = exactly one action, double-confirm and reopen = one spend. Synthetic character only.
async function boot(page,natives){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page.on('dialog',d=>{natives.push(d.type());d.dismiss();});
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('弹窗核心');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();player.level=8;player.maxRealm=8;player.gold=10000;gameState='exploring';currentChoices=[];updateStats();});
}
const ok=page=>page.locator('#xtDialogV2868114 [data-xt-dialog="ok"]');
const cancel=page=>page.locator('#xtDialogV2868114 [data-xt-dialog="cancel"]');
test('general shop purchase: cancel, single confirm, double-click and reopen spend once',async({page})=>{
 const natives=[];await boot(page,natives);
 const state=()=>page.evaluate(()=>[player.gold,player.inventory.filter(n=>n==='灵兽绳').length]);
 const buy=()=>page.evaluate(()=>buyGeneralV2801(GENERAL_SHOP_V2801.findIndex(x=>x.name==='灵兽绳'),1));
 const cost=await page.evaluate(()=>GENERAL_SHOP_V2801.find(x=>x.name==='灵兽绳').cost);
 await buy();await cancel(page).click();expect(await state()).toEqual([10000,0]);
 await buy();await ok(page).dblclick();await expect(ok(page)).toHaveCount(0);expect(await state()).toEqual([10000-cost,1]);
 await buy();await buy();await expect(ok(page)).toHaveCount(1);await ok(page).click();expect(await state()).toEqual([10000-2*cost,2]);
 await buy();await page.evaluate(()=>{player.gold=1;});await ok(page).click();expect(await state()).toEqual([1,2]);
 expect(natives).toEqual([]);
});
test('story-choice purchase resumes the same choice once; stale choices do nothing',async({page})=>{
 const natives=[];await boot(page,natives);
 const count=()=>page.evaluate(()=>[player.gold,player.inventory.filter(n=>n==='大还丹').length]);
 const arm=()=>page.evaluate(()=>{currentChoices=[{action:'buy',item:'大还丹',cost:120}];handleChoice(0);});
 await arm();await page.keyboard.press('Escape');expect(await count()).toEqual([10000,0]);
 await arm();await ok(page).click();expect(await count()).toEqual([9880,1]);
 await arm();await page.evaluate(()=>{currentChoices=[{action:'buy',item:'大还丹',cost:120}];});await ok(page).click();expect(await count()).toEqual([9880,1]);
 expect(natives).toEqual([]);
});
test('home upgrade and pill batch act only on confirm and only once',async({page})=>{
 const natives=[];await boot(page,natives);
 const home=()=>page.evaluate(()=>[normalizeHomeV2812(player).level,player.gold]);
 const [lv]=await home();
 await page.evaluate(()=>handleHomeUpgrade());await cancel(page).click();expect(await home()).toEqual([lv,10000]);
 await page.evaluate(()=>{handleHomeUpgrade();handleHomeUpgrade();});await ok(page).dblclick();expect(await home()).toEqual([lv+1,10000-lv*200]);
 const pill=await page.evaluate(()=>{const name=Object.keys(ITEMS).find(n=>ITEMS[n].type==='heal'&&ITEMS[n].value>0);for(let i=0;i<6;i++)player.inventory.push(name);player.hp=1;return name;});
 const pills=()=>page.evaluate(n=>player.inventory.filter(x=>x===n).length,pill);const have=await pills();
 await page.evaluate(n=>useItemBatchV2905(n,5),pill);await cancel(page).click();expect(await pills()).toBe(have);
 await page.evaluate(n=>useItemBatchV2905(n,5),pill);await ok(page).dblclick();expect(await pills()).toBe(have-5);
 expect(natives).toEqual([]);
});
test('manual save feedback uses the in-game alert',async({page})=>{
 const natives=[];await boot(page,natives);
 await page.evaluate(()=>manualSave());const a=page.getByRole('alertdialog');await expect(a).toContainText('修行记录');await page.getByRole('button',{name:'知道了'}).click();await expect(a).toHaveCount(0);
 expect(natives).toEqual([]);
});
