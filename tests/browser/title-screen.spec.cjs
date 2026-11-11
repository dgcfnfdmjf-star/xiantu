const {test,expect}=require('@playwright/test');
// V28.68.120 title screen (audit A1): gilded title, live/static backdrop, returning card, 开始修仙 in the first landscape view.
const SAVE={player:{name:'青岚',level:3,phase:2,inventory:[],gold:10,exp:1,hp:10,mp:5},achievements:{progress:{},completed:[]},version:12};
async function boot(page,{save=false,fxOff=false}={}){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 if(save||fxOff)await page.addInitScript(([s,off])=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');if(s)localStorage.setItem('xiantu_save',JSON.stringify({...s,timestamp:Date.now()-2*3600e3}));if(off)localStorage.setItem('xiantu_map_fx_v2868104','off');},[save?SAVE:null,fxOff]);
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
}
for(const [w,h] of [[390,844],[844,390]])test(`new player sees gilded 仙途 and 开始修仙 in the first view at ${w}x${h}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:w,height:h});await boot(page);
 await expect(page.getByRole('heading',{name:'仙途'})).toBeVisible();
 await expect(page.locator('#titleMistV2868120')).toHaveAttribute('data-mode','live');
 const btn=page.getByRole('button',{name:'开始修仙',exact:true});await expect(btn).toBeInViewport({ratio:1});
 const box=await btn.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(h);
 const fill=await page.locator('.title-logo-v2868120').evaluate(el=>getComputedStyle(el).backgroundImage);expect(fill).toContain('linear-gradient');
 if(w>h){const [l,r]=await Promise.all(['.title-brand-v2868120','.title-form-v2868120'].map(s=>page.locator(s).boundingBox()));expect(r.x).toBeGreaterThan(l.x+l.width-1);}
 await page.locator('#playerName').fill('标题测试');await btn.click();await expect(page.locator('#startScreen')).toBeHidden();
 expect(await page.evaluate(()=>!!document.getElementById('titleMistV2868120')&&new Promise(r=>requestAnimationFrame(()=>r(true))))).toBe(true);
 expect(errors).toEqual([]);
});
test('returning player sees name, realm and save time on the continue card, and the save is untouched',async({page})=>{
 await page.setViewportSize({width:844,height:390});await boot(page,{save:true});
 const card=page.locator('#saveSummaryV2868120');await expect(card).toBeVisible();
 await expect(card).toContainText('青岚');await expect(card).toContainText(await page.evaluate(()=>getCultivationName(3,2)));await expect(card).toContainText('2 小时前');
 await expect(page.getByRole('button',{name:'续行仙途'})).toBeInViewport({ratio:1});
 expect(JSON.parse(await page.evaluate(()=>localStorage.getItem('xiantu_save'))).player.name).toBe('青岚');
});
for(const mode of ['reduced-motion','effects-off'])test(`title backdrop is static with ${mode}`,async({page})=>{
 await page.setViewportSize({width:390,height:844});if(mode==='reduced-motion')await page.emulateMedia({reducedMotion:'reduce'});
 await boot(page,{fxOff:mode==='effects-off'});
 const c=page.locator('#titleMistV2868120');await expect(c).toHaveAttribute('data-mode','still');
 const a=await c.screenshot();await page.waitForTimeout(500);const b=await c.screenshot();expect(Buffer.compare(a,b)).toBe(0);
});
