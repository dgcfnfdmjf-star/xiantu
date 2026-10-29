const {test,expect}=require('@playwright/test');

async function openBag(page,width=390){
 await page.setViewportSize({width,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');
 await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await expect(page.locator('#guideHudBtn')).toBeAttached();
 await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{
  closeWorldOverlay();player.level=10;player.equipmentInventory=Object.keys(EQUIPMENT_DB).slice(0,73);
  showEquipmentInventory();
 });
}

for(const width of [360,390,430])test(`equipment search stays clickable below its sticky title at ${width}px`,async({page})=>{
 await openBag(page,width);
 await page.locator('#storyPanel').evaluate(el=>{el.scrollTop=1000;});
 const search=page.locator('#bagSearchV2905'),title=page.locator('.equipment-bag-toolbar-v2803');
 const a=await title.boundingBox(),b=await search.boundingBox();
 expect(b.y).toBeGreaterThanOrEqual(a.y+a.height);
 expect(await search.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el;})).toBe(true);
 await search.click();await search.fill('木剑');
 await expect(page.locator('#bagListV2905 [data-bv="toggle"]')).toHaveCount(1);
 await expect(page.locator('#bagListV2905')).toContainText('木剑');
});

test('locking a deep equipment row preserves scroll, expanded item and keyboard focus',async({page})=>{
 await openBag(page);
 const row=page.locator('[data-bv="toggle"]').nth(55);await row.scrollIntoViewIfNeeded();await row.click();
 const lock=page.locator('[data-bv="lock"]');await lock.scrollIntoViewIfNeeded();
 const before=await page.evaluate(()=>({scroll:document.getElementById('storyPanel').scrollTop,item:BAG_RT_V2905.open}));
 expect(before.scroll).toBeGreaterThan(2000);
 await lock.click();await expect(page.locator('[data-bv="lock"]')).toContainText('解锁');
 const after=await page.evaluate(()=>({scroll:document.getElementById('storyPanel').scrollTop,item:BAG_RT_V2905.open,focused:document.activeElement?.dataset.bv,locked:isEquipmentLocked(BAG_RT_V2905.open)}));
 expect(after).toEqual({...before,focused:'lock',locked:true});
 await page.locator('[data-bv="lock"]').press('Enter');
 await expect(page.locator('[data-bv="lock"]')).toContainText('锁定');
 await expect(page.locator('[data-bv="lock"]')).toBeFocused();
 expect(await page.locator('#storyPanel').evaluate(el=>el.scrollTop)).toBe(before.scroll);
});

test('deferred equipment refreshes expire on close, navigation, character switch and combat',async({page})=>{
 await openBag(page);
 for(const action of ['close','navigate','character','combat']){
  await page.evaluate(action=>{
   gameState='exploring';player=createDefaultPlayer();player.equipmentInventory=['木剑'];showEquipmentInventory();
   equipItemFromInventory('木剑');
   if(action==='close')closeWorldOverlay();
   if(action==='navigate')showStory('新页面：不要被旧装备刷新覆盖',[]);
   if(action==='character'){player=createDefaultPlayer();showEquipmentInventory();}
   if(action==='combat'){closeWorldOverlay();gameState='combat';}
  },action);
  await page.waitForTimeout(150);
  await expect(page.locator('#equipmentPanel')).toHaveCount(0);
  if(action==='close')await expect(page.locator('#storyPanel')).toBeHidden();
  if(action==='navigate')await expect(page.locator('#storyText')).toHaveText('新页面：不要被旧装备刷新覆盖');
  if(action==='combat')expect(await page.evaluate(()=>gameState)).toBe('combat');
 }
 // A refresh that still belongs to the active view must continue to work.
 await page.evaluate(()=>{gameState='exploring';player=createDefaultPlayer();player.equipmentInventory=['木剑'];showEquipmentInventory();equipItemFromInventory('木剑');});
 await expect(page.locator('#equipmentPanel')).toBeVisible();
 await page.evaluate(()=>{toggleEquippedLockEncoded(encodeURIComponent('木剑'));document.getElementById('equipmentPanel').remove();});
 await page.waitForTimeout(80);await expect(page.locator('#equipmentPanel')).toHaveCount(0);
 // Locking then closing the bag must not undo the user's close action either.
 await page.evaluate(()=>{player.equipmentInventory=['素云冠'];showEquipmentInventory();toggleEquipmentLockEncoded(encodeURIComponent('素云冠'));closeWorldOverlay();});
 await page.waitForTimeout(80);await expect(page.locator('#storyPanel')).toBeHidden();
});
