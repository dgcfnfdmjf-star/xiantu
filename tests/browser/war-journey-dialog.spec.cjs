const {test,expect}=require('@playwright/test');
// Group C: war and journey confirms run through the in-game dialog. Synthetic new character only; never a real save.
const DIALOG='#xtDialogV2868114';
async function boot(page){
 const natives=[];page.natives=natives;
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page.on('dialog',d=>{natives.push(d.type()+':'+d.message());d.dismiss();});
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('军务测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();if(typeof tutorialState!=='undefined')tutorialState.active=false;});
}
test.afterEach(async({page})=>{expect(page.natives||[]).toEqual([]);});
const press=(page,how)=>page.locator(`${DIALOG} [data-xt-dialog="${how}"]`).click();
// Three fast clicks on 确定: the first closes the dialog, later ones must find nothing to act on.
async function tripleOk(page){const ok=page.locator(`${DIALOG} [data-xt-dialog="ok"]`);await ok.click();for(let i=0;i<2;i++)await ok.click({timeout:200}).catch(()=>{});await expect(page.locator(DIALOG)).toHaveCount(0);}

test('war merit exchange: cancel, reopen, double-confirm and stale merit spend exactly once',async({page})=>{
 await boot(page);
 const merit=()=>page.evaluate(()=>[warStateV2839().meritV2839,player.inventory.length]);
 await page.evaluate(()=>{warStateV2839().meritV2839=100;saveGame();});const [m0,n0]=await merit();
 await page.evaluate(()=>exchangeWarMeritV2839(0));await expect(page.locator(DIALOG)).toContainText('行军丹药');
 await press(page,'cancel');expect(await merit()).toEqual([m0,n0]);
 // Reopen while showing: still one dialog; then confirm three times.
 await page.evaluate(()=>{exchangeWarMeritV2839(0);exchangeWarMeritV2839(0);});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);expect(await merit()).toEqual([m0-20,n0+6]);
 // Merit changed while the dialog was open: refuse instead of spending against a stale balance.
 await page.evaluate(()=>exchangeWarMeritV2839(0));await page.evaluate(()=>{warStateV2839().meritV2839-=1;});
 await press(page,'ok');expect(await merit()).toEqual([m0-21,n0+6]);
});

test('after-battle recovery: cancel keeps pills, double-confirm spends once, stale bag spends nothing',async({page})=>{
 await boot(page);
 const open=()=>page.evaluate(()=>{player.tutorial.skipped=true;player.hp=getMaxHp()-80;player.inventory=['小还丹','小还丹','小还丹'];lastBattleV2838={owner:player,name:'野狼',gold:5,exp:5};showAfterBattleV2838(player);});
 const bag=()=>page.evaluate(()=>[player.inventory.length,player.hp===getMaxHp()]);
 await open();const recover=page.locator('#afterBattleV2838 [data-after="recover"]');
 await recover.click();await press(page,'cancel');expect(await bag()).toEqual([3,false]);
 await page.evaluate(()=>{const b=document.querySelector('#afterBattleV2838 [data-after="recover"]');b.click();b.click();});await expect(page.locator(DIALOG)).toHaveCount(1);
 const spend=await page.evaluate(()=>Object.values(recoveryPlanV2875().used).reduce((s,n)=>s+n,0));expect(spend).toBeGreaterThan(0);
 await tripleOk(page);expect(await bag()).toEqual([3-spend,true]);
 await open();await recover.click();await page.evaluate(()=>player.inventory.push('悟道丹'));await press(page,'ok');
 expect(await bag()).toEqual([4,false]);
});

test('new game: cancel keeps the character and slots; confirm archives once; restore-previous swaps once',async({page})=>{
 await boot(page);
 await page.evaluate(()=>{player.gold=777;saveGame();localStorage.removeItem(PREVIOUS_SAVE_V2838);
  const orig=window.replaceSaveV2870;window.__replaced=0;window.replaceSaveV2870=(...a)=>{window.__replaced++;return orig(...a);};});
 // Autosave may refresh the main slot's timestamp/exploration, so slots are compared by the character they hold.
 const who=raw=>raw&&(({name,gold})=>name+':'+gold)(JSON.parse(raw).player);
 const slots=()=>page.evaluate(()=>[localStorage.getItem(SAVE_KEY),localStorage.getItem(PREVIOUS_SAVE_V2838),!document.getElementById('startScreen').classList.contains('hidden')]).then(([m,p,start])=>({main:who(m),prev:who(p),start}));
 const before=await slots();
 await page.evaluate(()=>newGame());await press(page,'cancel');
 expect(await slots()).toEqual(before);expect(await page.evaluate(()=>[player.name,player.gold])).toEqual(['军务测试',777]);
 // Reopen and gold changed while open: the archived record is the one current at confirm time.
 await page.evaluate(()=>{newGame();newGame();player.gold=778;});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);const after=await slots();
 expect(after).toEqual({main:'军务测试:777',prev:'军务测试:778',start:true});
 // A second character, then swap back to the archived one.
 await page.locator('#playerName').fill('第二位');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();saveGame();});const second=await slots();
 await page.evaluate(()=>restorePreviousV2838());await press(page,'cancel');
 expect(await slots()).toEqual(second);expect(await page.evaluate(()=>window.__replaced)).toBe(0);
 await page.evaluate(()=>{restorePreviousV2838();restorePreviousV2838();});await expect(page.locator(DIALOG)).toHaveCount(1);
 await tripleOk(page);
 expect(await page.evaluate(()=>[window.__replaced,player.name,JSON.parse(localStorage.getItem(PREVIOUS_SAVE_V2838)).player.name])).toEqual([1,'军务测试','第二位']);
 // Previous slot rewritten while the dialog is open: refuse with an in-game alert and touch no slot.
 await page.evaluate(()=>restorePreviousV2838());const held=await slots();
 await page.evaluate(()=>localStorage.setItem(PREVIOUS_SAVE_V2838,localStorage.getItem(PREVIOUS_SAVE_V2838)+' '));
 await press(page,'ok');await expect(page.getByRole('alertdialog')).toContainText('未恢复');await page.getByRole('button',{name:'知道了'}).click();
 expect(await page.evaluate(()=>window.__replaced)).toBe(1);expect((await slots()).main).toBe(held.main);expect(held.main).toBe('军务测试:778');
});
