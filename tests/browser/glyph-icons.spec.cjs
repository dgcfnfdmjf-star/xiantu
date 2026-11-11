const {test,expect}=require('@playwright/test');
// V28.68.122 (audit A8): gold line glyphs replace emoji on equipment slots and exploration points. Synthetic character only.
async function boot(page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('图标测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();player.tutorial.skipped=true;player.tutorial.completedSteps=TUTORIAL_ORDER.slice();closeTutorialBubble();if(typeof tutorialState!=='undefined')tutorialState.active=false;document.getElementById('tutorialToast')?.remove();});
}
for(const [w,h] of [[390,844],[844,390]])test(`equipment panel slot icons are gold SVG line glyphs at ${w}x${h}`,async({page})=>{
 await page.setViewportSize({width:w,height:h});await boot(page);
 await page.evaluate(()=>{player.level=1;showEquipmentPanel();});
 const icons=page.locator('#equipmentPanel .xt-slot-glyph-v2868122');
 await expect(icons).toHaveCount(18);
 const info=await icons.evaluateAll(els=>els.map(el=>{const svg=el.querySelector('svg.xt-glyph'),r=svg?.getBoundingClientRect();return {glyph:svg?.dataset.glyph,text:el.textContent.trim(),stroke:svg&&getComputedStyle(svg).color,w:r?.width,h:r?.height,cls:el.className};}));
 for(const i of info){expect(i.glyph).toBeTruthy();expect(i.text).toBe('');expect(i.w).toBeGreaterThanOrEqual(18);expect(i.h).toBeGreaterThanOrEqual(18);}
 expect(new Set(info.map(i=>i.glyph)).size).toBeGreaterThanOrEqual(11);
 const life=info.find(i=>/is-locked/.test(i.cls));expect(life.glyph).toBe('lock');
 const gold=info.find(i=>/is-empty/.test(i.cls)&&!/is-locked/.test(i.cls));expect(gold.stroke).toBe('rgb(138, 106, 50)');
});
for(const mode of ['map-alive off','reduced motion'])test(`exploration markers stroke a gold glyph on the map canvas, static with ${mode}`,async({page})=>{
 await page.setViewportSize({width:390,height:844});if(mode==='reduced motion')await page.emulateMedia({reducedMotion:'reduce'});await boot(page);
 const r=await page.evaluate(mode=>{
  const pois=FLAT_WORLD.pois.filter(p=>p.action==='explore_v2828');const out={types:[...new Set(pois.map(p=>p.exploreTypeV2828))].sort(),gold:[],static:true};
  const paint=o=>{const c=document.createElement('canvas');c.width=120;c.height=120;const x=c.getContext('2d');x.translate(60,70);drawExplorationPresenceV286889(x,o);return x.getImageData(0,0,120,120).data;};
  const count=d=>{let n=0;for(let i=0;i<d.length;i+=4)if(d[i]>220&&d[i+1]>200&&d[i+2]>140&&d[i+2]<190&&d[i+3]>200)n++;return n;};
  localStorage.setItem('xiantu_map_fx_v2868104','off');if(mode==='map-alive off')setMapAliveQualityV2893('off');else if(!mapAliveCalmV2893())return {calm:false};
  for(const t of [0,1,2]){const o=pois.find(p=>p.exploreTypeV2828===t);explorationV2828().seen[Math.floor(o.x/EXPLORATION_CELL_V2900)+','+Math.floor(o.y/EXPLORATION_CELL_V2900)]=1;
   const a=paint(o);const t0=performance.now();while(performance.now()-t0<40){}const b=paint(o);out.gold.push(count(a));if(a.join()!==b.join())out.static=false;}
  out.scroll=scrollPoiArtV2832(pois[0]);return out;},mode);
 expect(r.types).toEqual([0,1,2]);
 for(const n of r.gold)expect(n).toBeGreaterThan(20);
 expect(r.static).toBe(true);
 expect(r.scroll).toMatch(/xt-scroll-glyph-v2868122.*data-glyph="herb"/);
});
