const {test,expect}=require('@playwright/test');
async function openNorth(page,width){
 await page.setViewportSize({width,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);await expect(page.locator('#guideHudBtn')).toBeAttached();
 await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();player.level=10;applyWorldMapLayout('north',true);showScrollMapV2831();});
}
async function mapLayout(page){return page.evaluate(()=>{
 const field=document.getElementById('scrollFieldV2831'),buttons=[...field.querySelectorAll('button')],rects=buttons.map(b=>b.getBoundingClientRect()),dots=[...field.querySelectorAll('.scroll-anchor-v286882')],cfg=getWorldMapConfig();let overlaps=0;
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)overlaps++;}
 return {overlaps,hitSizes:rects.map(r=>[r.width,r.height]),buttons:buttons.length,dots:dots.length,rows:document.querySelectorAll('#scrollDirectoryV2837 button').length,
  trueCoordinates:[...buttons,...dots].every(el=>{const p=FLAT_WORLD.pois.find(p=>p.id===el.dataset.poi);return p&&Math.abs(parseFloat(el.style.left)-p.x/cfg.width*100)<.0001&&Math.abs(parseFloat(el.style.top)-p.y/cfg.height*100)<.0001;}),
  markerSemantics:dots.every(d=>d.tagName==='SPAN'&&d.getAttribute('aria-hidden')==='true'&&!d.hasAttribute('tabindex'))};
 });}
for(const width of [360,390,1280])test(`dense northern map remains selectable at ${width}px without false coordinates`,async({page})=>{
 await openNorth(page,width);const layout=await mapLayout(page);
 expect(layout.overlaps).toBe(0);expect(layout.buttons+layout.dots).toBe(layout.rows);expect(layout.trueCoordinates).toBe(true);expect(layout.markerSemantics).toBe(true);
 expect(layout.hitSizes.every(([w,h])=>w>=44&&h>=44)).toBe(true);
 if(width<600){expect(layout.dots).toBeGreaterThan(0);await expect(page.locator('#scrollDetailsV2837')).toHaveAttribute('open','');await expect(page.locator('#scrollResultV2837')).toContainText('请从目录选择');}
 // Search restores the actual map button when a single location no longer overlaps.
 await page.locator('#scrollSearchV2837').fill('凌霄大殿');await expect(page.locator('#scrollDirectoryV2837 button')).toHaveCount(1);
 const filtered=await mapLayout(page);expect(filtered.buttons).toBe(1);expect(filtered.dots).toBe(0);expect(filtered.trueCoordinates).toBe(true);
 if(!await page.locator('#scrollDetailsV2837').evaluate(el=>el.open))await page.locator('#scrollDetailsV2837 summary').click();
 const row=page.locator('#scrollDirectoryV2837 [data-poi="lx_main_hall"]');await row.focus();await row.press('Enter');
 await expect(row).toBeFocused();
 await expect(page.locator('#scrollSelectionV2831')).toContainText('凌霄大殿');expect(await page.evaluate(()=>scrollSessionV2837().state.zoom)).toBeGreaterThanOrEqual(2);
 expect((await mapLayout(page)).overlaps).toBe(0);
 await page.locator('#scrollSelectionV2831 [data-scroll-action="go"]').click();await expect(page.locator('#scrollMapV2831')).toHaveCount(0);
 expect(await page.evaluate(()=>autoNavigationV2830?.goal)).toBe('lx_main_hall');
});
test('scroll resize/filter updates keep user-collapsed directory and search focus; stale handlers cannot touch a newer map',async({page})=>{
 await openNorth(page,390);await page.locator('#scrollDetailsV2837 summary').click();await page.locator('#scrollSearchV2837').focus();
 await page.setViewportSize({width:844,height:390});await expect(page.locator('#scrollSearchV2837')).toBeFocused();await expect(page.locator('#scrollDetailsV2837')).not.toHaveAttribute('open','');
 await page.locator('[data-scroll-filter="service"]').click();await expect(page.locator('#scrollDetailsV2837')).not.toHaveAttribute('open','');
 expect(await page.evaluate(()=>[...document.querySelectorAll('#scrollDirectoryV2837 [data-poi]')].every(b=>scrollPoiGroupV2837(FLAT_WORLD.pois.find(p=>p.id===b.dataset.poi))==='service'))).toBe(true);
 expect((await mapLayout(page)).overlaps).toBe(0);
 await page.locator('[data-scroll-filter="all"]').click();await page.locator('[data-scroll-action="plus"]').click();expect((await mapLayout(page)).overlaps).toBe(0);
 await page.locator('#scrollSearchV2837').fill('凌霄大殿');
 await page.locator('#scrollDetailsV2837 summary').click();await page.locator('#scrollDirectoryV2837 [data-poi="lx_main_hall"]').click();
 for(const [action,width,height] of [['go',390,844],['mark',844,390]]){
  const button=page.locator(`#scrollSelectionV2831 [data-scroll-action="${action}"]`);await button.focus();const previous=await button.elementHandle();await page.setViewportSize({width,height});
  await expect.poll(()=>previous.evaluate(el=>el.isConnected)).toBe(false);
  await expect(button).toBeFocused();expect(await button.evaluate(el=>el.isConnected)).toBe(true);
 }
 // If the selected target disappears while an action has focus, keep focus within the dialog.
 await page.evaluate(()=>{scrollSessionV2837().state.selected=null;renderScrollTargetsV2837();});
 await expect(page.locator('[data-scroll-action="close"]')).toBeFocused();
 // A focused map button can become a non-interactive dot after shrinking the viewport.
 // Respect the user's collapsed directory and provide a visible dialog focus fallback.
 await page.locator('#scrollSearchV2837').fill('');await page.locator('[data-scroll-action="fit"]').click();await page.setViewportSize({width:1280,height:844});
 const arena=page.locator('#scrollFieldV2831 button[data-poi="lx_arena"]');await expect(arena).toBeVisible();
 if(await page.locator('#scrollDetailsV2837').evaluate(el=>el.open))await page.locator('#scrollDetailsV2837 summary').click();
 await arena.focus();const oldArena=await arena.elementHandle();await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>oldArena.evaluate(el=>el.isConnected)).toBe(false);
 await expect(page.locator('#scrollFieldV2831 .scroll-anchor-v286882[data-poi="lx_arena"]')).toHaveCount(1);
 await expect(page.locator('#scrollDetailsV2837')).not.toHaveAttribute('open','');await expect(page.locator('[data-scroll-action="close"]')).toBeFocused();
 const stale=await page.evaluate(()=>{
  const old=document.getElementById('scrollMapV2831'),oldInput=old.querySelector('#scrollSearchV2837'),oldFilter=old.querySelector('[data-scroll-filter="sect"]');
  showScrollMapV2831();const current=document.getElementById('scrollMapV2831');
  oldInput.value='不应应用';old.oninput({target:oldInput});old.onclick({target:oldFilter});old.onkeydown({key:'Escape',stopPropagation(){},preventDefault(){}});
  const state=scrollSessionV2837()?.state;
  return {same:document.getElementById('scrollMapV2831')===current,query:state?.query,filter:state?.filter};
 });expect(stale).toEqual({same:true,query:'',filter:'all'});
 const owner=await page.evaluate(()=>{const old=document.getElementById('scrollMapV2831'),input=old.querySelector('#scrollSearchV2837');player=createDefaultPlayer();input.value='旧角色';old.oninput({target:input});return {closed:!document.getElementById('scrollMapV2831'),name:player.name,navigation:!!autoNavigationV2830};});
 expect(owner.closed).toBe(true);expect(owner.navigation).toBe(false);
});
