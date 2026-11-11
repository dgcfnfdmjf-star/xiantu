const {test,expect}=require('@playwright/test');
// V28.68.119 alchemy show (audit A4): pills on stage equal pills made; static furnace with effects off or reduced motion.
async function boot(page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('丹炉测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
}
const open=page=>page.evaluate(()=>{tutorialState.active=false;closeWorldOverlay();player.materials={'灵草':500};player.inventory=[];player.alchemyLevel=3;player.alchemyExp=0;showAlchemy();});
const craft=(page,seq,n)=>page.evaluate(([seq,n])=>{player.alchemyLevel=3;player.alchemyExp=0;const R=Math.random;let i=0;Math.random=()=>seq[i++%seq.length];try{return craftPill('小还丹',n);}finally{Math.random=R;}},[seq,n]);
test('alchemy stage shows one pill per pill made, thunder only on a full x10, and keeps materials exact',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await boot(page);await open(page);
 const stage=page.locator('#alchemyStageV2868110');
 const mounted=await stage.evaluate(el=>new Promise(r=>{const t0=performance.now();(function poll(){if(el.classList.contains('alchemy-webgl-v110'))r(true);else if(performance.now()-t0>10000)r(false);else setTimeout(poll,100);})();}));
 test.skip(!mounted,'WebGL unavailable in this browser; static fallback is covered below');
 for(const [seq,n,pills,thunder,smoke] of [[[.1],1,1,'false','0'],[[.1],5,5,'false','0'],[[.1],10,10,'true','0'],[[.1,.99,.1,.99,.1],5,3,'false','1'],[[.99],5,0,'false','1']]){
  const before=await page.evaluate(()=>player.materials['灵草']);
  const r=await craft(page,seq,n);expect(r.pills).toBe(pills);
  await expect(stage).toHaveAttribute('data-pills-shown',String(pills));await expect(stage).toHaveAttribute('data-thunder',thunder);await expect(stage).toHaveAttribute('data-smoke',smoke);
  expect(await page.evaluate(()=>player.materials['灵草'])).toBe(before-2*n);
 }
 await expect(page.locator('#alchemyPhaseV2868110')).toHaveText('此次未能成丹 · 可重新炼制',{timeout:8000});
 expect(errors).toEqual([]);
});
for(const mode of ['effects-off','reduced-motion'])test(`alchemy keeps the static furnace with ${mode}`,async({page})=>{
 await page.setViewportSize({width:844,height:390});
 if(mode==='reduced-motion')await page.emulateMedia({reducedMotion:'reduce'});
 await boot(page);
 if(mode==='effects-off')await page.evaluate(()=>localStorage.setItem('xiantu_map_fx_v2868104','off'));
 await open(page);
 const r=await craft(page,[.1],10);expect(r.pills).toBe(10);
 await expect(page.locator('#alchemyResultV2868110')).toContainText('成丹 10 枚');
 await expect(page.locator('#alchemyPhaseV2868110')).toHaveText('静览丹炉 · 可照常炼制');
 await page.waitForTimeout(600);
 expect(await page.locator('#alchemyStageV2868110 canvas').count()).toBe(0);
 await expect(page.locator('#alchemyStageV2868110 .alchemy-still-v110')).toBeVisible();
 expect(await page.locator('#alchemyStageV2868110').getAttribute('data-pills-shown')).toBeNull();
 // 青绿鎏金 controls: the chosen fire is gilded, the batch buttons are jade with a gold edge.
 const style=await page.evaluate(()=>{const on=document.querySelector('#recipeList .alchemy-fire-v2868112 [aria-pressed="true"]'),btn=document.querySelector('#recipeList .recipe-item .craft-btn:not(:disabled)');return {on:getComputedStyle(on).backgroundImage,btn:getComputedStyle(btn).borderTopColor,h:btn.getBoundingClientRect().height};});
 expect(style.on).toContain('linear-gradient');expect(style.btn).toBe('rgb(138, 106, 50)');expect(style.h).toBeGreaterThanOrEqual(44);
});
