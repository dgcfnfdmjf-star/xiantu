const {test,expect}=require('@playwright/test');
// V28.68.116: breakthrough-ready chip opens the existing screen; success card counts up, is static with effects off,
// fits short landscape screens and still auto-dismisses. Synthetic new character only; never a real save.
async function boot(page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('突破测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();player.tutorial.skipped=true;player.tutorial.completedSteps=TUTORIAL_ORDER.slice();closeTutorialBubble();if(typeof tutorialState!=='undefined')tutorialState.active=false;document.getElementById('tutorialToast')?.remove();player.level=1;player.phase=2;});
}
const success=page=>page.evaluate(()=>{const after=createBreakthroughSnapshot();showBreakthroughSuccess({snapshot:Object.assign({},after,{atk:after.atk-18,hp:after.hp-120}),fromName:'炼气三层',toName:getCultivationName(),after});return [after.atk,after.hp];});

test('chip appears when ready and opens the existing breakthrough screen without changing state',async({page})=>{
 await boot(page);const chip=page.locator('#xtBreakChipV2868116');
 await page.evaluate(()=>{player.exp=1;updateStats();updateWorldHUD();});await expect(chip).toHaveCount(0);
 await page.evaluate(()=>{player.exp=getCurrentExpNeed()+3;player.breakthrough.cooldownDays=0;updateStats();updateWorldHUD();});
 const next=await page.evaluate(()=>getNextCultivationName());
 await expect(chip).toBeVisible();await expect(chip).toHaveText('可突破 · '+next);
 await expect(page.locator('.world-bar-row.xt-exp-ready-v2868116')).toHaveCount(1);
 const before=await page.evaluate(()=>JSON.stringify([player.exp,player.level,player.phase,player.gold,player.age]));
 await chip.click();await expect(page.locator('#storyText [data-retreat-view-v2868102="breakthrough"]')).toHaveCount(1);
 await expect(chip).toBeHidden();
 expect(await page.evaluate(()=>JSON.stringify([player.exp,player.level,player.phase,player.gold,player.age]))).toBe(before);
 await page.evaluate(()=>{closeWorldOverlay();player.breakthrough.cooldownDays=3;updateWorldHUD();});await expect(chip).toHaveText('调息 3天');
});

test('success card counts up, flashes once, then settles; effects off is static; auto-dismiss kept',async({page})=>{
 await page.setViewportSize({width:844,height:390});await boot(page);
 const [atk,hp]=await success(page);const card=page.locator('#breakthroughSuccess');
 await expect(card).toHaveClass(/counting-v2868116/);
 await expect(card.locator('.value').nth(1)).toHaveText(`${atk}（+18）`);await expect(card.locator('.value').nth(3)).toHaveText(`${hp}（+120）`);
 await expect(card).not.toHaveClass(/counting-v2868116/);
 const btn=await card.locator('.btn-continue').boundingBox();expect(btn.y+btn.height).toBeLessThanOrEqual(390);
 await expect(card).toHaveCount(0,{timeout:7000});
 await page.evaluate(()=>localStorage.setItem('xiantu_map_fx_v2868104','off'));await success(page);
 await expect(card).toHaveClass(/still-v2868116/);await expect(card.locator('.breakthrough-burst-v2868116')).toHaveCount(0);
 await expect(card.locator('.value').nth(1)).toHaveText(`${atk}（+18）`);
 await page.locator('#breakthroughSuccess .btn-continue').click();await expect(card).toHaveCount(0);
});
