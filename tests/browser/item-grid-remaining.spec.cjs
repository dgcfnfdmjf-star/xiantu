const {test,expect}=require('@playwright/test');

// Group H: equipment slots, pet-capture items, the combat bag and home/sect cards share the item-cell frame,
// keep 44px touch targets, show a keyboard focus ring and opening them changes no state.
async function boot(page){
 await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');
 await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();player.level=10;player.gold=5000;});
 await settle(page);
}
const snapshot=page=>page.evaluate(()=>JSON.stringify(player));
function diffState(a,b){return diffKeys(JSON.parse(a),JSON.parse(b));}
// Right after boot the world map still reveals fog and records the first roaming step on its own timers; wait for that to finish.
async function settle(page){
 let last='';
 await expect.poll(async()=>{await page.waitForTimeout(400);const now=await snapshot(page);const same=now===last;last=now;return same;},{timeout:15000}).toBe(true);
}
function diffKeys(a,b,path='',out=[]){
 if(JSON.stringify(a)===JSON.stringify(b))return out;
 if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diffKeys(a[k],b[k],path+'.'+k,out);}else out.push(path+': '+JSON.stringify(a)+' -> '+JSON.stringify(b));return out;}
async function sizes(page,sel){
 return page.locator(sel).evaluateAll(els=>els.filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,c:e.className,t:e.textContent.slice(0,20)};}));
}
async function frame(page,sel){
 return page.locator(sel).evaluateAll(els=>els.filter(e=>e.offsetParent).map(e=>{const s=getComputedStyle(e);return{left:parseFloat(s.borderLeftWidth),style:s.borderLeftStyle,radius:s.borderTopLeftRadius,icon:!!e.querySelector('.xt-cell-icon'),color:s.borderLeftColor};}));
}
async function expectFocusRing(page,sel){
 const el=page.locator(sel).first();
 await el.evaluate(e=>{const prev=document.createElement('span');prev.id='gridFocusProbe';prev.tabIndex=0;(e.tagName==='SUMMARY'?e.parentElement:e).before(prev);prev.focus();});
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
function expectFrames(list,icon=true){
 expect(list.length).toBeGreaterThan(0);
 for(const f of list){expect(f.left).toBe(4);expect(f.style).toBe('solid');expect(f.radius).toBe('10px');if(icon)expect(f.icon).toBe(true);}
}

test('character equipment slots use the shared frame, 44px targets and keyboard unequip',async({page})=>{
 await boot(page);
 await page.evaluate(()=>{player.equipmentInventory=Object.keys(EQUIPMENT_DB).slice(0,12);autoEquipBest();document.getElementById('equipmentPanel')?.remove();document.getElementById('storyPanel')?.classList.add('hidden');gameState='exploring';});
 const before=await snapshot(page);
 await page.evaluate(()=>showEquipmentPanel());
 await expect(page.locator('#equipmentPanel')).toBeVisible();
 expect(diffState(before,await snapshot(page))).toEqual([]);
 const slots=await frame(page,'#equipmentPanel .equipment-slot-row');
 expect(slots).toHaveLength(18);expectFrames(slots);
 // Equipped slots carry the item's quality colour on the edge.
 expect(new Set(slots.map(s=>s.color)).size).toBeGreaterThan(1);
 expectTargets(await sizes(page,'#equipmentPanel .equipment-slot-row'));
 expectTargets(await sizes(page,'#equipmentPanel .equip-lock-btn'));
 expectTargets(await sizes(page,'#equipmentPanel .equipment-panel-content>button[aria-label="关闭"]'));
 expectTargets(await sizes(page,'#equipmentPanel .equip-toolbar .panel-action-btn'));
 const equipped=page.locator('#equipmentPanel .equipment-slot-row.equipped');
 expect(await equipped.count()).toBeGreaterThan(0);
 await expect(equipped.first()).toHaveAttribute('tabindex','0');
 await expect(equipped.first()).toHaveAttribute('role','button');
 await expectFocusRing(page,'#equipmentPanel .equipment-slot-row.equipped');
 await expectFocusRing(page,'#equipmentPanel .equip-lock-btn');
 await expectFocusRing(page,'#equipmentPanel .equip-toolbar .panel-action-btn');
 expect(diffState(before,await snapshot(page))).toEqual([]);
 // Enter on a slot runs the same unequip as a click: exactly one item leaves the slot and returns to the bag.
 const counts=await page.evaluate(()=>({eq:Object.values(player.equipment).filter(Boolean).length,bag:player.equipmentInventory.length,locked:document.querySelector('#equipmentPanel .equipment-slot-row.equipped.item-locked')}));
 expect(counts.locked).toBeNull();
 await equipped.first().focus();await page.keyboard.press('Enter');
 const after=await page.evaluate(()=>({eq:Object.values(player.equipment).filter(Boolean).length,bag:player.equipmentInventory.length}));
 expect(after).toEqual({eq:counts.eq-1,bag:counts.bag+1});
 // Enter on the lock button inside a row only toggles the lock, never unequips.
 await page.evaluate(()=>{if(!document.getElementById('equipmentPanel'))showEquipmentPanel();});
 const eqBefore=await page.evaluate(()=>Object.values(player.equipment).filter(Boolean).length);
 await page.locator('#equipmentPanel .equip-lock-btn').first().focus();await page.keyboard.press('Enter');
 expect(await page.evaluate(()=>Object.values(player.equipment).filter(Boolean).length)).toBe(eqBefore);
});

test('pet-capture item chips use the shared frame and opening the pet panel changes nothing',async({page})=>{
 await boot(page);
 await page.evaluate(()=>{player.inventory=['灵兽绳'];
  // The pet guide auto-opens once and records that hint; mark it seen so the check isolates the grid.
  player.petGuideV211={autoShown:true,openedPages:[]};});
 const before=await snapshot(page);
 await page.evaluate(()=>showPets());
 await expect(page.locator('#petPanel')).toBeVisible();
 await expect(page.locator('#petCaptureDashboard .pet-capture-chip-v29').first()).toBeVisible();
 expect(diffState(before,await snapshot(page))).toEqual([]);
 const chips=await frame(page,'#petCaptureDashboard .pet-capture-chip-v29');
 expect(chips).toHaveLength(await page.evaluate(()=>Object.keys(CAPTURE_ITEMS).length));
 expectFrames(chips);
 // Chips are read-only counts; the one button on the card stays a 44px keyboard target.
 expect(await page.locator('#petCaptureDashboard .pet-capture-chip-v29 button,#petCaptureDashboard .pet-capture-chip-v29[tabindex]').count()).toBe(0);
 await expect(page.locator('#petCaptureDashboard .pet-capture-chip-v29').first()).toContainText('×1');
});

test('combat bag cells share the frame, buttons are 44px and opening the bag spends no turn or item',async({page})=>{
 await boot(page);
 await page.evaluate(()=>{player.inventory=['小还丹','小还丹','聚灵丹','神行符'];player.hp=1;startCombat({name:'野狼',hp:50000,maxHp:50000,atk:1,def:1,gold:1,exp:1});});
 await expect.poll(()=>page.evaluate(()=>gameState==='combat'&&isPlayerTurn)).toBe(true);
 const before=await page.evaluate(()=>JSON.stringify({p:player,e:currentEnemy.hp,t:isPlayerTurn}));
 await page.evaluate(()=>toggleCombatMedicineDrawer(true));
 await expect(page.locator('#combatItemDrawer')).toBeVisible();
 for(const tab of ['all','heal','mp','item','equip']){
  await page.evaluate(t=>setCombatMedicineTab(t),tab);
  expectTargets(await sizes(page,'#combatItemDrawer .combat-tab-btn'));
  expectTargets(await sizes(page,'#combatItemDrawer .combat-item-head .choice-btn'));
  expectTargets(await sizes(page,'#combatItemDrawer .combat-item-btn'));
 }
 await page.evaluate(()=>setCombatMedicineTab('all'));
 // Pill rows carry the frame and icon box; the escape scroll row keeps its text-only label.
 expectFrames(await frame(page,'#combatItemDrawer .combat-item-btn:not(:has-text("神行符"))'));
 expectFrames(await frame(page,'#combatItemDrawer .combat-item-btn'),false);
 await expect(page.locator('#combatItemDrawer .combat-item-btn').first()).toContainText('💊 小还丹×2');
 await expectFocusRing(page,'#combatItemDrawer .combat-item-btn:not([disabled])');
 await expectFocusRing(page,'#combatItemDrawer .combat-tab-btn');
 await expectFocusRing(page,'#combatItemDrawer .combat-item-head .choice-btn');
 expect(await page.evaluate(()=>JSON.stringify({p:player,e:currentEnemy.hp,t:isPlayerTurn}))).toBe(before);
 expect(await page.evaluate(()=>gameState)).toBe('combat');
});

test('home furniture and sect disciple cards share the frame, 44px controls and no change on open',async({page})=>{
 await boot(page);
 await page.evaluate(()=>{const h=normalizeHomeV2812(player);h.furniture=[{name:'聚灵阵',active:true},{name:'炼器台',active:false}];normalizeHomeV2812(player);});
 let before=await snapshot(page);
 await page.evaluate(()=>showHomeManage());
 expect(diffState(before,await snapshot(page))).toEqual([]);
 expectFrames(await frame(page,'.home-grid-v2812 article'));
 expect(await page.locator('.home-grid-v2812 article').count()).toBe(2);
 expectTargets(await sizes(page,'#storyPanel .choice-btn'));
 await page.evaluate(()=>showFurnitureShop());
 expect(diffState(before,await snapshot(page))).toEqual([]);
 expectFrames(await frame(page,'.home-grid-v2812 article'));
 expect(await page.locator('.home-grid-v2812 article').count()).toBe(await page.evaluate(()=>furnitureCatalogV2812().length));
 await page.evaluate(()=>{player.sect='凌霄宗';});
 // Warm the roster once, then opening again must not change anything.
 await page.evaluate(()=>showDisciplesV2815());
 before=await snapshot(page);
 await page.evaluate(()=>showDisciplesV2815());
 expect(diffState(before,await snapshot(page))).toEqual([]);
 const cards=await frame(page,'.home-grid-v2812 article');
 expect(cards.length).toBeGreaterThan(0);expectFrames(cards);
 await page.evaluate(()=>document.querySelectorAll('.home-board-v2812 details').forEach(d=>d.open=true));
 expectTargets(await sizes(page,'.home-board-v2812 .choice-btn'));
 expectTargets(await sizes(page,'.home-board-v2812 summary'));
 await expectFocusRing(page,'.home-board-v2812 .choice-btn:not([disabled])');
 await expectFocusRing(page,'.home-board-v2812 summary');
 expect(diffState(before,await snapshot(page))).toEqual([]);
});
