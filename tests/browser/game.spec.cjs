const {test,expect}=require('@playwright/test');
async function boot(page,beforeNavigate){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 if(beforeNavigate)await beforeNavigate();
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
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
  document.querySelector('#xtDialogV2868114 [data-xt-dialog="ok"]').click(); // Import confirmation is the in-game dialog.
  return {attempts,gold:player.gold,saved:loadGame().player.gold,injected:!!window.auditInjected};
 });
 expect(result).toEqual({attempts:Array.from({length:5},()=>({main:true,backup:true,gold:732,mainGold:732})),gold:998,saved:998,injected:false});expect(errors).toEqual([]);
 await page.reload();await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);await page.evaluate(()=>loadAndStart());expect(await page.evaluate(()=>player.gold)).toBe(998);
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
 // Hold the core response until every other module is requested. This proves
 // parallel preloading without tying the assertion to this host's disk/CPU speed.
 const requested=new Set();let releaseCore;
 const preloadBatch=new Promise(resolve=>{releaseCore=resolve;});
 page.on('request',request=>{const url=request.url();if(/\.js\?/.test(url)&&!url.includes('core.js')){requested.add(url);if(requested.size===39)releaseCore();}});
 await boot(page,()=>page.route('**/xiantu-v2762-core.js?*',async route=>{await preloadBatch;await route.continue();}));
 await page.unroute('**/xiantu-v2762-core.js?*');const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('.js?')).map(r=>({name:r.name,start:r.startTime,end:r.responseEnd})));
 const styles=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('xiantu-v2762.css')).map(r=>({end:r.responseEnd})));
 expect(styles).toHaveLength(1);expect(Math.min(...resources.filter(r=>!r.name.includes('core.js')).map(r=>r.start))).toBeGreaterThanOrEqual(styles[0].end);
 expect(resources).toHaveLength(40);expect(new Set(resources.map(r=>r.name)).size).toBe(40);
 const last=resources.at(-1),first=resources.find(r=>r.name.includes('core.js'));expect(last.start).toBeLessThanOrEqual(first.end);
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
 await page.route('**/monster-small-beasts-v28682.webp',r=>r.abort());await page.reload();await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);await page.evaluate(()=>{loadAndStart();closeWorldOverlay();});
 expect(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=180;c.height=225;return ['rabbit','turtle','bat'].every(key=>drawScrollMonsterPortraitV2853(c,key));})).toBe(true);
});

// UI draft integration must not bypass task guards, reuse a stale player, or steal overlay input.
test('newcomer sees one map prompt and no errand panel before Qi Refining',async({page})=>{
 await page.setViewportSize({width:390,height:844});await boot(page);await start(page);
 const bar=page.locator('#xtQuestBar'),path=page.locator('#firstPathV2901'),bubble=page.locator('#tutorialBubble');
 await page.evaluate(()=>{player.tutorial.completedSteps=['welcome','movement','interaction','combat','combat_attack','equipment'];player.tutorial.readPopups.push('training_reward');player.equipment.robe='布衣';closeTutorialBubble();triggerTutorial('tasks',true);});
 await expect(bubble).toContainText('修炼与突破');await expect(bubble.getByRole('button',{name:'查看宗门任务'})).toHaveCount(0);await expect(page.locator('#storyPanel')).toBeHidden();
 await bubble.getByRole('button',{name:'我已明白'}).click();await expect(page.locator('#storyPanel')).toBeVisible();await page.evaluate(()=>closeWorldOverlay());
 await expect(path).toBeVisible();await expect(path).toContainText('山脚试手');await page.evaluate(()=>XT_UI.render());await expect(bar).toBeHidden();
 await page.evaluate(()=>{player.firstJourneyV28687={step:5};XT_UI.render();});await expect(path).toContainText('首次突破');await expect(bar).toBeVisible();
 await path.click();const rows=page.locator('.fp-step-v2901');await expect(rows.nth(9)).toContainText('首次突破');await expect(rows.nth(10)).toContainText('踏入练气后开放');
 await expect(page.locator('[data-fp="go"]')).toHaveCount(1);await expect(page.locator('[data-fp="go"]')).toHaveAttribute('data-id','break');
});
test('alchemy fire choice works on a phone, defaults on reopen and adds nothing to the save',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await boot(page);await start(page);
 await page.evaluate(()=>{tutorialState.active=false;closeWorldOverlay();player.materials={'灵草':20};player.inventory=[];Math.random=()=>.1;showAlchemy();});
 const list=page.locator('#recipeList'),craft=name=>list.locator('.recipe-item',{hasText:name}).getByRole('button',{name:'×1',exact:true});
 await expect(list.getByRole('button',{name:'稳火'})).toHaveAttribute('aria-pressed','true');await expect(list.locator('.recipe-item',{hasText:'小还丹'})).toContainText('灵草x2');
 await list.getByRole('button',{name:'文火'}).click();await expect(list.getByRole('button',{name:'文火'})).toHaveAttribute('aria-pressed','true');await expect(list.locator('.recipe-item',{hasText:'小还丹'})).toContainText('灵草x3');
 await craft('小还丹').click();await expect(page.locator('#alchemyResultV2868110')).toContainText('成丹 1 枚');expect(await page.evaluate(()=>[player.materials['灵草'],player.alchemyExp])).toEqual([17,15]);
 await list.getByRole('button',{name:'武火'}).click();await expect(craft('养元丹')).toBeDisabled();await craft('小还丹').click();await expect(page.locator('#alchemyResultV2868110')).toContainText('成丹 2 枚 · 失败 0 炉');
 expect(await page.evaluate(()=>{const r=document.querySelector('#recipeList .alchemy-fire-v2868112').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;})).toBe(true);
 expect(await page.evaluate(()=>{const save=localStorage.getItem('xiantu_save');return /alchemyFire|gentle|fierce/.test(save)||player.alchemyFire!==undefined;})).toBe(false);
 await page.evaluate(()=>{closeWorldOverlay();showAlchemy();});await expect(list.getByRole('button',{name:'稳火'})).toHaveAttribute('aria-pressed','true');expect(errors).toEqual([]);
});

test('jade quest shortcut hides with overlays and rejects stale owner, step and duplicate actions',async({page})=>{
 await page.setViewportSize({width:390,height:844});await boot(page);await start(page);
 await page.evaluate(()=>{tutorialState.active=false;closeWorldOverlay();player.level=2;player.phase=3;player.tasks.active={};player.tasks.completed=MAIN_TASKS.slice(0,6).map(t=>t.id);player.tasks.legacyMainV286823=[];checkTaskTriggers();updateWorldHUD();});
 const bar=page.locator('#xtQuestBar'),go=bar.locator('.xt-questbar__go');await expect(bar).toBeVisible();await expect(bar).toContainText('内门考核');
 const stale=await page.evaluate(()=>{
   XT_UI.render();const before=JSON.stringify(player.tasks);player={...player};document.querySelector('#xtQuestBar .xt-questbar__go').click();const owner=JSON.stringify(player.tasks)===before&&!document.getElementById('sceneV2838');
   XT_UI.render();player.tasks.active.main_07.currentStep=1;const stepBefore=JSON.stringify(player.tasks);document.querySelector('#xtQuestBar .xt-questbar__go').click();return {owner,step:JSON.stringify(player.tasks)===stepBefore&&gameState==='exploring'};
 });expect(stale).toEqual({owner:true,step:true});
 await page.evaluate(()=>{player.tasks.active.main_07.currentStep=0;XT_UI.render();});
 const guards=await page.evaluate(()=>{
   const button=document.querySelector('#xtQuestBar .xt-questbar__go'),before=JSON.stringify(player.tasks),out=[];
   showStory('遮挡测试',[]);button.click();XT_UI.render();out.push(document.getElementById('xtQuestBar').hidden&&button.disabled&&JSON.stringify(player.tasks)===before);closeWorldOverlay();
   interiorV286886={};XT_UI.render();button.click();out.push(document.getElementById('xtQuestBar').hidden&&JSON.stringify(player.tasks)===before);interiorV286886=null;
   gameState='combat-ending';XT_UI.render();button.click();out.push(document.getElementById('xtQuestBar').hidden&&JSON.stringify(player.tasks)===before);gameState='exploring';XT_UI.render();return out;
 });expect(guards).toEqual([true,true,true]);
 await page.locator('#taskBtn').click();await expect(bar).toBeHidden();await expect(page.locator('#taskListContainer > :first-child')).toHaveClass(/task-card main active/);await page.locator('#taskPanel').getByRole('button',{name:'关闭',exact:true}).click();await expect(bar).toBeVisible();
 const duplicate=await page.evaluate(()=>{const old=performTaskAction;let n=0;performTaskAction=()=>n++;const button=document.querySelector('#xtQuestBar .xt-questbar__go');button.click();XT_UI.render();button.click();performTaskAction=old;return n;});expect(duplicate).toBe(1);
 // Keep the pre-existing low-health confirmation and actual battle entry.
 await page.waitForTimeout(460);await page.evaluate(()=>{player.tasks.active.main_07.currentStep=1;player.hp=1;XT_UI.render();});await go.click();await expect(page.locator('#taskBattlePromptV2868103')).toBeVisible();await expect(bar).toBeHidden();expect(await page.evaluate(()=>gameState)).toBe('exploring');
 await page.evaluate(()=>{closeWorldOverlay();player.tasks.active={};player.tasks.completed=MAIN_TASKS.slice(0,16).map(t=>t.id);player.level=5;checkTaskTriggers();XT_UI.render();});await expect(bar).toContainText('查看准备');
 const before=await page.evaluate(()=>JSON.stringify(player.tasks));await bar.locator('.xt-questbar__body').click();await expect(page.locator('#taskPanel')).toBeVisible();expect(await page.evaluate(()=>JSON.stringify(player.tasks))).toBe(before);
});

test('jade UI fits phone and landscape, honours motion preference and restores original UI',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await boot(page);await start(page);
 await page.evaluate(()=>{tutorialState.active=false;closeWorldOverlay();player.level=2;player.tasks.active={};player.tasks.completed=MAIN_TASKS.slice(0,6).map(t=>t.id);checkTaskTriggers();updateWorldHUD();document.querySelector('.world-hud').classList.add('mobile-hud-collapsed');});
 const bar=page.locator('#xtQuestBar');await expect(bar).toBeVisible();
 for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1366,height:900}]){
   await page.setViewportSize(size);await page.waitForTimeout(220);
   const bounds=await page.evaluate(()=>{const q=document.getElementById('xtQuestBar').getBoundingClientRect();return {inside:q.left>=0&&q.right<=innerWidth+1&&q.top>=0&&q.bottom<=innerHeight+1,controls:['virtualJoystick','touchAction'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.width===0||r.right<=q.left||r.left>=q.right||r.bottom<=q.top||r.top>=q.bottom;})};});expect(bounds).toEqual({inside:true,controls:[true,true]});
   await bar.locator('.xt-questbar__body').click({trial:true});await bar.locator('.xt-questbar__go').click({trial:true});
 }
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});expect(await bar.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
 const state=await page.evaluate(()=>JSON.stringify(player));await page.evaluate(()=>{XT_UI.setTheme(false);XT_UI.setReduceMotion(true);});await expect(bar).toBeHidden();await expect(page.locator('html')).not.toHaveClass(/xt-theme/);expect(await page.evaluate(()=>JSON.stringify(player))).toBe(state);
 expect(await page.locator('#taskBtn .xt-nav-original').isVisible()).toBe(true);await page.locator('#taskBtn').click();await expect(page.locator('#taskPanel')).toBeVisible();
 await page.reload();await page.locator('#xiantuSafeBootButton').click();await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);await expect(page.locator('html')).not.toHaveClass(/xt-theme/);await expect(page.locator('html')).toHaveClass(/xt-reduce-motion/);
 await page.evaluate(()=>{XT_UI.setTheme(true);XT_UI.setReduceMotion(false);loadAndStart();closeWorldOverlay();tutorialState.active=false;});await expect(page.locator('html')).toHaveClass(/xt-theme/);await expect(page.locator('#taskBtn .xt-nav')).toHaveCount(1);await expect(bar).toBeVisible();expect(errors).toEqual([]);
});
