const {test,expect}=require('@playwright/test');
// V28.68.118: battle loot reveal (audit A3 + G3). Synthetic new character only; never a real save.
async function boot(page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('战利测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();player.tutorial.skipped=true;player.tutorial.completedSteps=TUTORIAL_ORDER.slice();closeTutorialBubble();if(typeof tutorialState!=='undefined')tutorialState.active=false;document.getElementById('tutorialToast')?.remove();player.level=3;});
}
async function eliteWin(page){
 await page.evaluate(()=>{const e={name:'精英山贼',hp:60,maxHp:60,atk:5,def:1,gold:10,exp:10,_realmLevel:0,_realmPhase:0,_isElite:true};const m={id:'wm_spec',x:FLAT_WORLD.player.x+200,y:FLAT_WORLD.player.y,radius:18,speed:0,enemy:e,regionId:currentRegion||getPlayerRegion(),dir:{x:0,y:0},dirTimer:99,alive:true,inCombat:false,battleCooldown:0};FLAT_WORLD.monsters=[m];startCombat(e,false,false,m);});
 await page.waitForTimeout(400);
 await page.evaluate(()=>{const r=Math.random;Math.random=()=>0.01;try{currentEnemy.hp=0;checkBattleEnd();}finally{Math.random=r;}});
 await page.waitForFunction(()=>gameState==='exploring',null,{timeout:15000});
}
test('portrait receipt shows gilded loot tiles, counts up and keeps a 2x2 action grid',async({page})=>{
 await page.setViewportSize({width:390,height:844});await boot(page);await eliteWin(page);
 const el=page.locator('#afterBattleV2838');await expect(el).toBeVisible();
 await expect(el.locator('.loot-tile-v2868118').first()).toBeVisible();await expect(el.locator('.loot-tile-v2868118.rare').first()).toBeVisible();
 await expect(el).toHaveClass(/has-rare-v2868118/);
 const gold=el.locator('.after-battle-gains-v2868118 b').first();await expect(gold).toHaveText(await gold.getAttribute('data-count'));
 const boxes=await el.locator('.after-battle-actions-v2868118 button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return [Math.round(r.top),Math.round(r.left),r.height];}));
 expect(new Set(boxes.map(b=>b[0])).size).toBe(2);expect(new Set(boxes.map(b=>b[1])).size).toBe(2);for(const b of boxes)expect(b[2]).toBeGreaterThanOrEqual(44);
 expect(await page.evaluate(()=>JSON.stringify(player).includes('2868118'))).toBe(false);
});
test('landscape receipt fits the screen and is static with effects off',async({page})=>{
 await page.setViewportSize({width:844,height:390});await boot(page);
 await page.evaluate(()=>localStorage.setItem('xiantu_map_fx_v2868104','off'));await eliteWin(page);
 const el=page.locator('#afterBattleV2838');await expect(el).toBeVisible();await expect(el).toHaveClass(/still-v2868118/);
 // A first-kill achievement card folds an untouched receipt on short screens (V28.68.114); the player opens it from its title.
 if(await el.evaluate(e=>e.classList.contains('collapsed')))await el.locator('strong').first().click();await expect(el).not.toHaveClass(/collapsed/);
 expect(await el.locator('.loot-tile-v2868118').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 const box=await el.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(390);expect(box.x+box.width).toBeLessThanOrEqual(844);
 const last=await el.locator('.after-battle-actions-v2868118 button').last().boundingBox();expect(last.y+last.height).toBeLessThanOrEqual(390);
});
