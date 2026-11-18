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


test('saved reduced motion skips automatic intro media and permits manual replay',async({page})=>{
 await isolate(page);const seen=track(page);
 await page.addInitScript(()=>localStorage.setItem('xt_reduce_motion','1'));
 await page.goto('/game-v2762.html');
 await expect(page.locator('html')).toHaveClass(/xt-reduce-motion/);
 await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 expect(seen.has(POSTER)).toBe(false);
 expect(seen.has('.mp4')).toBe(false);

 await page.reload();
 await page.locator('#introReplayV286891').click();
 await expect.poll(()=>seen.has('.mp4')).toBe(true);
});

test('standalone intro preview leaves the remembered skip setting editable',async({page})=>{
 await isolate(page);await page.goto('/game-v2762.html');
 await page.locator('#introReplayV286891').click();
 await page.locator('#introSkipV2860').click();
 await expect(page.locator('#introPanelV2860')).toBeHidden();
 await page.locator('#introSkipChoiceV2898').check({timeout:2000});
 expect(await page.evaluate(()=>localStorage.getItem('xiantu_skip_intro_v2898'))).toBe('1');
});

const SKILL_FX='xiantu-v2855-skill-fx.js',DUEL_SCENE='xiantu-v2868124-duel-scene.js';

async function enterBattle(page,name='野狼',task=false){
 await page.evaluate(({name,task})=>{
  startCombat({name,hp:5000,maxHp:5000,atk:1,def:1,gold:1,exp:1,_realmLevel:0,_realmPhase:0,_isTaskBattle:task});
 },{name,task});
 await expect(page.locator('#combatPanel')).toBeVisible();
}

test('combat modules wait for the first battle and a late download attaches only to the current foe',async({page})=>{
 await isolate(page);const seen=track(page),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let release;const held=new Promise(resolve=>{release=resolve;});
 await page.route('**/'+DUEL_SCENE+'?*',async r=>{await held;await r.continue();});
 await boot(page);await start(page);
 expect([seen.has(SKILL_FX),seen.has(DUEL_SCENE)]).toEqual([false,false]);
 await enterBattle(page);
 await expect.poll(()=>seen.has(DUEL_SCENE)).toBe(true);
 const hp=await page.evaluate(()=>{const hp=currentEnemy.hp;combat('attack');return hp;});
 await expect.poll(()=>page.evaluate(()=>currentEnemy.hp)).toBeLessThan(hp);
 await page.evaluate(()=>{endCombatAfterCapture();closeWorldOverlay();});
 await enterBattle(page,'山贼',true);
 release();
 const canvas=page.locator('#combatArena .duel25-canvas');
 await expect(canvas).toHaveCount(1);
 await expect(canvas).toHaveAttribute('aria-label',/山贼/);
 await expect(page.locator('#inkFxQualityV2854')).toBeEnabled();
 for(const name of [SKILL_FX,DUEL_SCENE])expect(seen.urls.filter(u=>u.includes(name))).toHaveLength(1);
 expect(errors).toEqual([]);
});

test('a failed presentation download leaves combat playable and retries only that file on the next fight',async({page})=>{
 await isolate(page);const seen=track(page);
 await page.route('**/'+SKILL_FX+'?*',r=>r.abort(),{times:1});
 await boot(page);await start(page);
 await page.evaluate(()=>setBattlePresentationV2756('report'));
 const failed=page.waitForEvent('requestfailed',r=>r.url().includes(SKILL_FX));
 await enterBattle(page);await failed;
 await page.waitForFunction(()=>!!window.XiantuDuel25D);
 await expect(page.locator('#combatArena .duel25-canvas')).toHaveCount(0);
 const rngCalls=await page.evaluate(()=>{
  let calls=0;const random=Math.random;Math.random=()=>{calls++;return .5;};
  try{playSkillEffect('炎爆术','fire','active');}finally{Math.random=random;}
  return calls;
 });
 expect(rngCalls).toBe(0);
 await expect(page.locator('#inkFxNameV2854')).toContainText('我方 · 炎爆术');
 await expect(page.locator('.skill-v26-fx')).toHaveCount(0);
 const hp=await page.evaluate(()=>{const hp=currentEnemy.hp;combat('attack');return hp;});
 await expect.poll(()=>page.evaluate(()=>currentEnemy.hp)).toBeLessThan(hp);
 await page.evaluate(()=>{endCombatAfterCapture();closeWorldOverlay();});
 await enterBattle(page);
 await expect(page.locator('#combatArena .duel25-canvas')).toHaveCount(1);
 expect(seen.urls.filter(u=>u.includes(SKILL_FX))).toHaveLength(2);
 expect(seen.urls.filter(u=>u.includes(DUEL_SCENE))).toHaveLength(1);
});
