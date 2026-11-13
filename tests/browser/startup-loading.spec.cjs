'use strict';
const {test,expect}=require('@playwright/test');
const SHEETS=['scroll-regions-v2834','monster-small-beasts-v28682','scroll-palace-v2831','scroll-buildings-v2832'];
const MONSTERS='monster-map-v2853';
const POSTER='intro-poster-v286891.jpg';
const SCENE='south-panorama-v2868101.webp';
test.use({viewport:{width:390,height:844}});

function track(page){
 const urls=[];page.on('request',r=>urls.push(r.url()));
 return {urls,has:name=>urls.some(u=>u.includes(name)),sheets:()=>SHEETS.filter(name=>urls.some(u=>u.includes(name)))};
}
async function isolate(page){await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());}
async function boot(page){
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
}
async function start(page){
 await page.locator('#playerName').fill('启动顺序测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>closeWorldOverlay());
}

test('first visit keeps the intro poster; a player who skips never downloads it',async({page})=>{
 await isolate(page);const seen=track(page);
 await page.goto('/game-v2762.html');
 await expect(page.locator('#introVideoV2860')).toHaveAttribute('poster',`./${POSTER}`);
 await expect.poll(()=>seen.has(POSTER)).toBe(true);

 const again=await page.context().newPage();await isolate(again);const later=track(again);
 await again.addInitScript(()=>localStorage.setItem('xiantu_skip_intro_v2898','1'));
 await again.goto('/game-v2762.html');
 await expect(again.locator('#introSkipChoiceV2898')).toBeChecked();
 await expect(again.locator('#introVideoV2860')).not.toHaveAttribute('poster',/./);
 await again.locator('#xiantuSafeBootButton').click();
 await expect(again.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 expect(later.has(POSTER)).toBe(false);
});

test('replaying the intro after skipping still shows the poster',async({page})=>{
 await isolate(page);
 await page.route('**/*.mp4*',r=>r.abort());
 await page.addInitScript(()=>localStorage.setItem('xiantu_skip_intro_v2898','1'));
 await page.goto('/game-v2762.html');
 await expect(page.locator('#introVideoV2860')).not.toHaveAttribute('poster',/./);
 await page.locator('#introReplayV286891').click();
 await expect(page.locator('#introVideoV2860')).toHaveAttribute('poster',`./${POSTER}`);
});

test('detail sheets wait for the painted scene, then all load',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await isolate(page);const seen=track(page);
 let release;const held=new Promise(resolve=>{release=resolve;});
 await page.route(`**/${SCENE}*`,async r=>{await held;await r.continue();});
 await boot(page);await start(page);
 await expect.poll(()=>seen.has(SCENE)).toBe(true);
 await expect.poll(()=>seen.has(MONSTERS)).toBe(true); // visible on the first screen, so not held back
 await page.waitForTimeout(500);
 expect(seen.sheets()).toEqual([]);
 release();
 await expect.poll(()=>seen.sheets().sort()).toEqual([...SHEETS].sort());
 await page.waitForFunction(()=>SCROLL_ART_V2831.wildScenes?.south&&SCROLL_ART_V2831.regions&&SCROLL_ART_V2831.smallBeastsV28682&&SCROLL_ART_V2831.palace&&SCROLL_ART_V2831.buildings&&SCROLL_ART_V2831.monstersV2853);
 expect(errors).toEqual([]);
});

test('a failed scene still releases the detail sheets',async({page})=>{
 await isolate(page);const seen=track(page);
 await page.route(`**/${SCENE}*`,r=>r.abort());
 await boot(page);await start(page);
 await expect.poll(()=>seen.sheets().sort()).toEqual([...SHEETS].sort());
 expect(await page.evaluate(()=>SCROLL_ART_V2831.wildSceneFailed?.south)).toBe(true);
});

test('a stalled scene releases the detail sheets once after the time limit',async({page})=>{
 await isolate(page);const seen=track(page);
 let release;const held=new Promise(resolve=>{release=resolve;});
 await page.route(`**/${SCENE}*`,async r=>{await held;await r.continue().catch(()=>{});});
 await boot(page);await start(page);
 await expect.poll(()=>seen.has(SCENE)).toBe(true);
 await expect.poll(()=>seen.sheets().sort(),{timeout:12000}).toEqual([...SHEETS].sort());
 release();
 await page.waitForFunction(()=>SCROLL_ART_V2831.wildScenes?.south);
 await page.waitForTimeout(300);
 for(const name of SHEETS)expect(seen.urls.filter(u=>u.includes(name))).toHaveLength(1);
});

test('a region without a painted scene requests sheets immediately',async({page})=>{
 await isolate(page);const seen=track(page);
 await boot(page);
 // All eight shipped regions now have panoramas. Exercise the absent-metadata
 // compatibility path explicitly in this isolated page instead of depending on
 // a particular production region remaining unpainted forever.
 await page.evaluate(()=>{
  delete WILD_SCENES_V286898.human_peaks;
  currentRegion='human_peaks';loadScrollArtV2831();
 });
 await expect.poll(()=>seen.sheets().sort()).toEqual([...SHEETS].sort());
 expect(seen.has('human-peaks-panorama')).toBe(false);
});
