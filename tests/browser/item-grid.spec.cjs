const {test,expect}=require('@playwright/test');

// Group F: bag, equipment-bag and shop cells share one frame, keep 44px touch targets and show a keyboard focus ring.
async function boot(page){
 await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');
 await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();player.level=10;player.gold=5000;player.inventory=['小还丹','小还丹','聚灵丹','聚灵丹'];player.equipmentInventory=Object.keys(EQUIPMENT_DB).slice(0,6);});
}
async function sizes(page,sel){
 return page.locator(sel).evaluateAll(els=>els.filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height};}));
}
async function frame(page,sel){
 return page.locator(sel).evaluateAll(els=>els.filter(e=>e.offsetParent).map(e=>{const s=getComputedStyle(e);return{left:parseFloat(s.borderLeftWidth),radius:s.borderTopLeftRadius,icon:!!e.querySelector('.xt-cell-icon')};}));
}
async function expectFocusRing(page,sel){
 const el=page.locator(sel).first();
 // Reach it with the keyboard so :focus-visible applies.
 await el.evaluate(e=>{const prev=document.createElement('span');prev.id='gridFocusProbe';prev.tabIndex=0;e.before(prev);prev.focus();});
 await page.keyboard.press('Tab');
 await expect(el).toBeFocused();
 const ring=await el.evaluate(e=>{const s=getComputedStyle(e);return{style:s.outlineStyle,width:parseFloat(s.outlineWidth),visible:e.matches(':focus-visible')};});
 expect(ring.visible).toBe(true);expect(ring.style).toBe('solid');expect(ring.width).toBeGreaterThanOrEqual(2);
 await page.evaluate(()=>document.getElementById('gridFocusProbe')?.remove());
}
function expectTargets(list,min=44){
 expect(list.length).toBeGreaterThan(0);
 for(const s of list){expect(s.h).toBeGreaterThanOrEqual(min);expect(s.w).toBeGreaterThanOrEqual(min);}
}
function expectFrames(list){
 expect(list.length).toBeGreaterThan(0);
 for(const f of list){expect(f.left).toBe(4);expect(f.radius).toBe('10px');expect(f.icon).toBe(true);}
}

test('storage bag tabs, pill rows and batch buttons are 44px, framed and keyboard focusable',async({page})=>{
 await boot(page);
 await page.evaluate(()=>{mobileInventoryTab='items';showMobileInventory();});
 expectTargets(await sizes(page,'#mobileInventoryOverlay .mobile-inventory-tab'));
 expectTargets(await sizes(page,'#mobileInventoryOverlay .mobile-inventory-item.usable'));
 expectTargets(await sizes(page,'#mobileInventoryOverlay .bag-batch-v2905 .choice-btn'));
 expectFrames(await frame(page,'#mobileInventoryOverlay .mobile-inventory-item'));
 await expectFocusRing(page,'#mobileInventoryOverlay .mobile-inventory-item.usable');
 await expectFocusRing(page,'#mobileInventoryOverlay .mobile-inventory-tab');
 await page.evaluate(()=>setMobileInventoryTab('materials'));
 expectFrames(await frame(page,'#mobileInventoryOverlay .mobile-inventory-item'));
 await page.evaluate(()=>setMobileInventoryTab('equipment'));
 const edges=await page.locator('#mobileInventoryOverlay .mobile-inventory-item').evaluateAll(els=>els.map(e=>getComputedStyle(e).borderLeftColor));
 expect(edges).toHaveLength(6);
 // Equipment rows take the existing quality colour, so more than one rarity edge appears.
 expect(new Set(edges).size).toBeGreaterThan(1);
});

test('equipment bag rows and filter chips meet 44px and show a focus ring',async({page})=>{
 await boot(page);
 await page.evaluate(()=>showEquipmentInventory());
 expectTargets(await sizes(page,'#bagViewV2905 .bv-main'));
 expectTargets(await sizes(page,'#bagViewV2905 .bv-chip'));
 expectFrames(await frame(page,'#bagViewV2905 .bv-row'));
 await expectFocusRing(page,'#bagViewV2905 .bv-main');
 await expectFocusRing(page,'#bagViewV2905 .bv-chip');
 await page.locator('#bagViewV2905 .bv-main').first().press('Enter');
 await expect(page.locator('#bagViewV2905 .bv-main').first()).toHaveAttribute('aria-expanded','true');
});

test('shop tabs and buy buttons meet 44px, cells share the frame and focus is visible',async({page})=>{
 await boot(page);
 for(const tab of ['pill','gear','material']){
  await page.evaluate(tab=>showShop(tab),tab);
  expectTargets(await sizes(page,'.market-filters-v2800 button'));
  expectTargets(await sizes(page,'.general-buy-v2801 button'));
  expectFrames(await frame(page,'.general-item-v2801'));
 }
 await expectFocusRing(page,'.general-buy-v2801 button:not([disabled])');
 await expectFocusRing(page,'.market-filters-v2800 button');
 expect(await page.evaluate(()=>player.gold)).toBe(5000);
});
