const {test,expect}=require('@playwright/test');
async function boot(page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
}
async function start(page){await expect(page.locator('#guideHudBtn')).toBeAttached();await page.locator('#playerName').fill('八字角色测试姓名');await page.getByRole('button',{name:'开始修仙',exact:true}).click();await page.evaluate(()=>closeWorldOverlay());}
test('save import rejects executable text without replacing either save, valid saves still restore',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await boot(page);await start(page);
 const result=await page.evaluate(async()=>{
  showStory('存档回归检查',[]); // Pause map exploration so unrelated discovery autosaves cannot change the baseline.
  player.gold=731;saveGame();player.gold=732;saveGame();const original=localStorage.getItem('xiantu_save'),backup=localStorage.getItem('xiantu_save_backup');
  const attempts=[];
  for(const change of [p=>p.name='<img src=x onerror="window.auditInjected=1">',p=>p.inventory.push("');window.auditInjected=1;//"),p=>p.pets=[{type:'wolf',name:'灵狼',_petId:"');window.auditInjected=1;//"}],p=>p.statusEffects=[{name:'<svg onload="window.auditInjected=1">'}],p=>p.statusEffects=[{name:'正常',desc:'" onmouseover="window.auditInjected=1'}]]){
   const data=JSON.parse(original);change(data.player);await importSaveV2768(new File([JSON.stringify(data)],'test.json',{type:'application/json'}));
   attempts.push({main:localStorage.getItem('xiantu_save')===original,backup:localStorage.getItem('xiantu_save_backup')===backup,gold:player.gold,mainGold:JSON.parse(localStorage.getItem('xiantu_save')).player.gold});
  }
  const data=JSON.parse(original);data.player.gold=998;await importSaveV2768(new File([JSON.stringify(data)],'valid.json',{type:'application/json'}));
  return {attempts,gold:player.gold,saved:loadGame().player.gold,injected:!!window.auditInjected};
 });
 expect(result).toEqual({attempts:Array.from({length:5},()=>({main:true,backup:true,gold:732,mainGold:732})),gold:998,saved:998,injected:false});expect(errors).toEqual([]);
 await page.reload();await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);await page.evaluate(()=>loadAndStart());expect(await page.evaluate(()=>player.gold)).toBe(998);
});
for(const width of [360,390,430,1366])test(`navigation remains reachable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});await boot(page);await start(page);
 const name=await page.locator('#worldPlayerName').boundingBox();expect(name.width).toBeGreaterThan(100);expect(name.height).toBeLessThan(30);
 const actions=page.locator('.world-hud-actions');const buttons=actions.locator('button');
 for(let i=0;i<await buttons.count();i++){
  const button=buttons.nth(i);if(!await button.isVisible())continue;
  await button.scrollIntoViewIfNeeded();await button.click({trial:true});
 }
 expect(await actions.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await expect(actions.locator('#guideHudBtn,#controlModeSwitchBtn,#xiantuBuildBadgeV2814,#scrollMapButtonV2831,#explorationButtonV2829')).toHaveCount(0);
 await page.locator('#panelToggleBtn').click();await expect(page.locator('#characterUtilityActions')).toBeHidden();await page.locator('.character-utilities>summary').press('Space');await expect(page.locator('#characterUtilityActions')).toBeVisible();
 const mode=await page.locator('#controlModeSwitchBtn').getAttribute('data-mode');await page.locator('#controlModeSwitchBtn').click();
 await expect(page.locator('#controlModeSwitchBtn')).not.toHaveAttribute('data-mode',mode);
 await page.locator('#guideHudBtn').click();await expect(page.locator('#helpManual')).toBeVisible();await expect(page.locator('#characterPanel')).toBeHidden();await page.locator('#helpManual').getByRole('button',{name:'返回仙途',exact:true}).click();
 const drawer=page.locator('#worldExploreDrawer');await drawer.locator('summary').click();await expect(page.locator('#worldExploreActions')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.locator('#worldExploreActions')).toBeHidden();await expect(drawer.locator('summary')).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.locator('#worldExploreActions')).toBeVisible();
 await page.locator('#scrollMapButtonV2831').click();await expect(page.locator('#scrollTitleV2837')).toBeVisible();await expect(page.locator('#worldExploreActions')).toBeHidden();
});
test('stylesheet precedes parallel scripts and version failure remains actionable',async({page})=>{
 await boot(page);const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('.js?')).map(r=>({name:r.name,start:r.startTime,end:r.responseEnd})));
 const styles=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('xiantu-v2762.css')).map(r=>({end:r.responseEnd})));
 expect(styles).toHaveLength(1);expect(Math.min(...resources.filter(r=>!r.name.includes('core.js')).map(r=>r.start))).toBeGreaterThanOrEqual(styles[0].end);
 expect(resources).toHaveLength(40);expect(new Set(resources.map(r=>r.name)).size).toBe(40);
 const last=resources.at(-1),first=resources.find(r=>r.name.includes('core.js'));expect(last.start).toBeLessThan(first.end+500);
 await page.route('**/xiantu-v2762-core.js?*',async route=>{const response=await route.fetch();const original=await response.text(),body=original.replaceAll(JSON.stringify(require('../../package.json').version),'"bad-version"');expect(body).not.toBe(original);await route.fulfill({response,body});});await page.reload();
 await page.locator('#xiantuSafeBootButton').click();await expect(page.locator('#xiantuSafeBootError')).toContainText('文件版本不一致');
});
test('rabbit turtle and bat use the new artwork in map and battle',async({page})=>{
 await boot(page);await start(page);
 await page.waitForFunction(()=>SCROLL_ART_V2831.smallBeastsV28682?.naturalWidth>0);
 const result=await page.evaluate(()=>{
  const names=['灵纹野兔','碧水灵龟','魔渊蝙蝠'],before=JSON.stringify(player);
  const canvas=document.createElement('canvas');canvas.id='beastPreview';canvas.width=720;canvas.height=250;
  canvas.style.cssText='position:fixed;inset:0;z-index:999999;width:720px;height:250px;background:#e7dec3';document.body.appendChild(canvas);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#e7dec3';ctx.fillRect(0,0,720,250);ctx.scale(2.5,2.5);
  names.forEach((name,i)=>{ctx.save();ctx.translate(46+i*94,70);drawInkEnemyV2833(ctx,{enemy:{name},regionId:'south'});ctx.restore();});
  return {keys:names.map(n=>scrollMonsterKeyV2853(n)),unchanged:JSON.stringify(player)===before,loaded:performance.getEntriesByType('resource').filter(r=>r.name.includes('monster-small-beasts-v28682.webp')).length};
 });
 expect(result).toEqual({keys:['rabbit','turtle','bat'],unchanged:true,loaded:1});
 await page.locator('#beastPreview').screenshot({path:'test-results/beasts-preview.png'});
 await page.route('**/monster-small-beasts-v28682.webp',r=>r.abort());await page.reload();await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);await page.evaluate(()=>{loadAndStart();closeWorldOverlay();});
 expect(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=180;c.height=225;return ['rabbit','turtle','bat'].every(key=>drawScrollMonsterPortraitV2853(c,key));})).toBe(true);
});
