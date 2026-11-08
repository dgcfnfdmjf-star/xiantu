const {test,expect}=require('@playwright/test');
// Group E: forge, pet karma/release/bond confirms run through the in-game dialog. Synthetic new character only; never a real save.
const DIALOG='#xtDialogV2868114';
async function boot(page){
 const natives=[];page.natives=natives;
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page.on('dialog',d=>{natives.push(d.type()+':'+d.message());d.dismiss();});
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('灵宠测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();if(typeof tutorialState!=='undefined')tutorialState.active=false;});
}
test.afterEach(async({page})=>{expect(page.natives||[]).toEqual([]);});
const press=(page,how)=>page.locator(`${DIALOG} [data-xt-dialog="${how}"]`).click();
async function tripleOk(page){const ok=page.locator(`${DIALOG} [data-xt-dialog="ok"]`);await ok.click();for(let i=0;i<2;i++)await ok.click({timeout:200}).catch(()=>{});await expect(page.locator(DIALOG)).toHaveCount(0);}

test('material forge: cancel spends nothing, reopen shows one dialog, triple confirm forges once, stale gold refuses',async({page})=>{
 await boot(page);
 const state=()=>page.evaluate(()=>[player.gold,player.materials['灵木']||0,player.equipmentInventory.filter(n=>n==='灵剑').length]);
 await page.evaluate(()=>{player.level=3;player.gold=1000;Object.assign(player.materials,{'灵木':6,'兽骨':4,'星辰砂':2});player.equipmentInventory=player.equipmentInventory.filter(n=>n!=='灵剑');saveGame();});
 await page.evaluate(()=>forgeMaterialEquipment('spirit_sword'));await expect(page.locator(DIALOG)).toContainText('确定铸造【灵剑】');
 await press(page,'cancel');expect(await state()).toEqual([1000,6,0]);
 await page.evaluate(()=>{forgeMaterialEquipment('spirit_sword');forgeMaterialEquipment('spirit_sword');});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);expect(await state()).toEqual([600,3,1]);
 // Gold changes while the dialog is open: the stamp no longer matches and nothing is spent.
 await page.evaluate(()=>forgeMaterialEquipment('spirit_sword'));await page.evaluate(()=>{player.gold=550;});
 await press(page,'ok');expect(await state()).toEqual([550,3,1]);
});

test('pet karma cleanse and release: cancel keeps state, triple confirm applies once, materials spent once',async({page})=>{
 await boot(page);
 const karma=()=>page.evaluate(()=>[player.materials['仙果']||0,player.materials['灵草']||0,player.petCapture.killedBabyBeast,player.heartDemon?.attachment??null]);
 await page.evaluate(()=>{ensurePetCaptureState();player.petCapture.killedBabyBeast=true;Object.assign(player.materials,{'仙果':5,'灵草':12});player.heartDemon=player.heartDemon||{};player.heartDemon.attachment=40;saveGame();});
 await page.evaluate(()=>cleanseBeastKarmaV2870());await press(page,'cancel');expect(await karma()).toEqual([5,12,true,40]);
 await page.evaluate(()=>{cleanseBeastKarmaV2870();cleanseBeastKarmaV2870();});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);expect(await karma()).toEqual([3,7,false,20]);
 // Release: a synthetic pet; cancel keeps it, triple confirm removes exactly one pet.
 await page.evaluate(()=>{ensurePetSystemState();const base=JSON.parse(JSON.stringify(player.pets[0]||{name:'测宠',level:1,exp:0,bondType:'blood'}));
  player.pets=[{...base,_petId:'qaA',name:'测宠甲',bondType:'blood'},{...base,_petId:'qaB',name:'测宠乙',bondType:'blood'}];player.activePet=null;saveGame();});
 const pets=()=>page.evaluate(()=>player.pets.map(p=>p._petId));
 await page.evaluate(()=>releasePetById('qaA'));await expect(page.locator(DIALOG)).toContainText('放生「测宠甲」');
 await press(page,'cancel');expect(await pets()).toEqual(['qaA','qaB']);
 await page.evaluate(()=>{releasePetById('qaA');releasePetById('qaA');});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);expect(await pets()).toEqual(['qaB']);
 // Bond change: one contract item, cancel keeps it, triple confirm consumes exactly one.
 const bond=()=>page.evaluate(()=>[player.inventory.filter(n=>n==='平等契约符').length,getPetById('qaB').bondType]);
 await page.evaluate(()=>{player.inventory.push('平等契约符','平等契约符');saveGame();});
 await page.evaluate(()=>changePetBondById('qaB','equal'));await press(page,'cancel');expect(await bond()).toEqual([2,'blood']);
 await page.evaluate(()=>{changePetBondById('qaB','equal');changePetBondById('qaB','equal');});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);expect(await bond()).toEqual([1,'equal']);
});
