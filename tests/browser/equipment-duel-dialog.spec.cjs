const {test,expect}=require('@playwright/test');
// Group D: equipment spends and duel-file confirms run through the in-game dialog. Synthetic new character only; never a real save.
const DIALOG='#xtDialogV2868114';
async function boot(page){
 const natives=[];page.natives=natives;
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page.on('dialog',d=>{natives.push(d.type()+':'+d.message());d.dismiss();});
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('器物测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();if(typeof tutorialState!=='undefined')tutorialState.active=false;});
}
test.afterEach(async({page})=>{expect(page.natives||[]).toEqual([]);});
const press=(page,how)=>page.locator(`${DIALOG} [data-xt-dialog="${how}"]`).click();
// Three fast clicks on 确定: the first closes the dialog, later ones must find nothing to act on.
async function tripleOk(page){const ok=page.locator(`${DIALOG} [data-xt-dialog="ok"]`);await ok.click();for(let i=0;i<2;i++)await ok.click({timeout:200}).catch(()=>{});await expect(page.locator(DIALOG)).toHaveCount(0);}

test('bulk and single dismantle: cancel keeps gear, reopen shows one dialog, triple confirm pays once, stale plan pays nothing',async({page})=>{
 await boot(page);
 const state=()=>page.evaluate(()=>[player.gold,player.equipmentInventory.length]);
 await page.evaluate(()=>{player.level=10;player.gold=1000;player.equipmentInventory=['木剑','木剑','木剑'];equipmentDismantleQuality='GOOD';saveGame();});
 const preview=await page.evaluate(()=>getBulkDismantlePreview());expect(preview.count).toBeGreaterThan(0);
 const [g0,n0]=await state();
 await page.evaluate(()=>bulkDismantleEquipment());await expect(page.locator(DIALOG)).toContainText('安全分解');
 await press(page,'cancel');expect(await state()).toEqual([g0,n0]);
 await page.evaluate(()=>{bulkDismantleEquipment();bulkDismantleEquipment();});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);expect(await state()).toEqual([g0+preview.gold,n0-preview.count]);
 // The plan changes while the dialog is open: nothing is removed or paid.
 await page.evaluate(()=>{player.equipmentInventory=['木剑','木剑','木剑'];});const [g1]=await state();
 await page.evaluate(()=>bulkDismantleEquipment());await page.evaluate(()=>player.equipmentInventory.push('木剑'));
 await press(page,'ok');expect(await state()).toEqual([g1,4]);
 // A high-quality single piece asks first; triple confirm removes exactly one copy.
 // Pick a high-quality piece of which at least one of three copies is not protected (better gear / set / upgrade fodder).
 const high=await page.evaluate(()=>{player.equipmentLocks=[];for(const n of Object.keys(EQUIPMENT_DB)){if(QUALITY_KEYS.indexOf(getEquipData(n)?.quality)<4)continue;
  player.equipmentInventory=[n,n,n];if(getSafeDismantleCountForName(n)>=2)return n;}return null;});
 expect(high).toBeTruthy();
 const [g2]=await state();const each=await page.evaluate(n=>getDismantleValue(n),high);
 await page.evaluate(n=>dismantleOneEquipmentEncoded(encodeURIComponent(n)),high);await press(page,'cancel');expect(await state()).toEqual([g2,3]);
 await page.evaluate(n=>{dismantleOneEquipmentEncoded(encodeURIComponent(n));dismantleOneEquipmentEncoded(encodeURIComponent(n));},high);
 await expect(page.locator(DIALOG)).toHaveCount(1);await tripleOk(page);expect(await state()).toEqual([g2+each,2]);
});

test('grade upgrade: cancel spends nothing, busy panel blocks a second dialog, triple confirm pays 1800 once, stale gold refuses',async({page})=>{
 await boot(page);
 const low='万象玄霆·九霄玄霆杖·灵品',next='万象玄霆·九霄玄霆杖·宝器';
 const open=()=>page.evaluate(l=>{player.level=16;player.equipment=createEmptyEquipmentSlots();player.equipmentInventory=[l];gameState='exploring';forgeRestoreV2825(player);showGradeUpgradePanelV2869();},low);
 const exec=()=>page.evaluate(()=>executeGradeUpgradeV2869('bag:0',gradeUpgradeSessionV2869.nonce));
 const state=()=>page.evaluate(()=>[player.gold,player.equipmentInventory.join('|')]);
 await page.evaluate(()=>{player.gold=1000000;});await open();
 await exec();await expect(page.locator(DIALOG)).toContainText('升为');await press(page,'cancel');expect(await state()).toEqual([1000000,low]);
 expect(await page.evaluate(()=>{executeGradeUpgradeV2869('bag:0',gradeUpgradeSessionV2869.nonce);return executeGradeUpgradeV2869('bag:0',gradeUpgradeSessionV2869.nonce);})).toBe(false);
 await expect(page.locator(DIALOG)).toHaveCount(1);await tripleOk(page);expect(await state()).toEqual([998200,next]);
 // Gold drops below the cost while the dialog is open: refuse, nothing spent or replaced.
 await page.evaluate(()=>{player.gold=1000000;});await open();await exec();await page.evaluate(()=>{player.gold=1799;});
 await press(page,'ok');expect(await state()).toEqual([1799,low]);
});

test('unequip-all, loadout overwrite and stats clear: cancel is a no-op, confirm applies exactly once',async({page})=>{
 await boot(page);
 const gear=()=>page.evaluate(()=>[player.equipment.weapon,player.equipmentInventory.filter(n=>n==='铁剑').length]);
 await page.evaluate(()=>{player.equipment.weapon='铁剑';player.equipmentInventory=[];player.equipmentLocks=[];});
 await page.evaluate(()=>unequipAllGear());await press(page,'cancel');expect(await gear()).toEqual(['铁剑',0]);
 await page.evaluate(()=>{unequipAllGear();unequipAllGear();});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);expect(await gear()).toEqual([null,1]);
 // Equipment changes while the dialog is open: nothing is unequipped.
 await page.evaluate(()=>{player.equipment.weapon='铁剑';player.equipmentInventory=[];unequipAllGear();player.equipmentLocks=['铁剑'];});
 await press(page,'ok');expect(await gear()).toEqual(['铁剑',0]);
 // Loadout preset overwrite.
 const preset=()=>page.evaluate(()=>player.loadoutPresetsV2870?.[0]?.equipment?.weapon??null);
 await page.evaluate(()=>{closeWorldOverlay();player.equipmentLocks=[];player.equipment.weapon='铁剑';saveLoadoutPresetV2870(0);closeWorldOverlay();player.equipment.weapon=null;});
 expect(await preset()).toBe('铁剑');
 await page.evaluate(()=>saveLoadoutPresetV2870(0));await press(page,'cancel');expect(await preset()).toBe('铁剑');
 await page.evaluate(()=>{saveLoadoutPresetV2870(0);saveLoadoutPresetV2870(0);});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);expect(await preset()).toBe(null);
 await page.evaluate(()=>closeWorldOverlay());
 // Stats clear: cancel keeps the local stats record.
 await page.evaluate(()=>{localStorage.setItem(STATS_V2901.key,JSON.stringify({v:1,realms:{x:{}}}));statsClearV2901();});
 await press(page,'cancel');expect(await page.evaluate(()=>localStorage.getItem(STATS_V2901.key))).not.toBeNull();
 let after=0;await page.exposeFunction('statsAfterV2868114',()=>{after++;});
 await page.evaluate(()=>{statsClearV2901(()=>window.statsAfterV2868114());statsClearV2901(()=>window.statsAfterV2868114());});
 await expect(page.locator(DIALOG)).toHaveCount(1);await tripleOk(page);
 expect(await page.evaluate(()=>localStorage.getItem(STATS_V2901.key))).toBeNull();expect(after).toBe(1);
});
