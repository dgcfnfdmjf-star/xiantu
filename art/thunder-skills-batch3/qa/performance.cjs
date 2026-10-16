'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const rows=[],out=path.resolve('output/playwright/thunder-batch3-integration');
 try{for(const baseline of [true,false])for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1});
  await context.route('**/*',route=>{const u=new URL(route.request().url()),name=u.pathname.split('/').pop(),backup=path.resolve('art/thunder-skills-batch3/runtime-before',name);
   if(u.hostname!=='127.0.0.1')return route.abort();
   if(baseline&&fs.existsSync(backup)&&fs.statSync(backup).isFile())return route.fulfill({path:backup,contentType:name.endsWith('.html')?'text/html':'application/javascript'});
   return route.continue();});
  const page=await context.newPage();await page.addInitScript(()=>{
   window.timing={rows:[],draws:0,last:null};const raf=window.requestAnimationFrame.bind(window),clear=CanvasRenderingContext2D.prototype.clearRect;
   CanvasRenderingContext2D.prototype.clearRect=function(){if(this.canvas.className==='duel25-canvas')timing.draws++;return clear.apply(this,arguments)};
   window.requestAnimationFrame=fn=>raf(function(stamp){const before=timing.draws,t=performance.now();fn(stamp);if(timing.draws>before){timing.rows.push({dt:timing.last===null?null:stamp-timing.last,draw:performance.now()-t});timing.last=stamp;}});
  });
  await page.goto('http://127.0.0.1:8782/xiantu-v2831-scroll/battle-25d-preview.html');await page.waitForFunction(()=>scene?.ready);
  await page.locator('#skillSelect').selectOption('万雷噬狱');await page.locator('#castSelected').click();await page.waitForTimeout(1600);await page.locator('[data-act="reset"]').click();
  for(const phase of ['idle','cast','persistent']){
   await page.evaluate(()=>{timing.rows=[];timing.last=null});if(phase==='cast')await page.locator('#castSelected').click();
   await page.waitForTimeout(1800);const result=await page.evaluate(()=>({samples:timing.rows,pixels:[...document.querySelectorAll('canvas')].reduce((n,c)=>n+c.width*c.height,0)}));
   const stats=key=>{const values=result.samples.map(x=>x[key]).filter(x=>x!==null).sort((a,b)=>a-b);return {n:values.length,median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)]}};
   rows.push({baseline,viewport,phase,interval:stats('dt'),draw:stats('draw'),pixels:result.pixels});
  }
  await context.close();
 }
 fs.writeFileSync(path.join(out,'performance.json'),JSON.stringify({browser:browser.version(),headless:true,dpr:1,scene:'Warmed trial wolf, single thunder prison, default auto quality, no pet, external blocked',limitations:'Shared cloud CPU; JS Canvas submission time excludes GPU; viewport emulation only. Baseline has no persistent state.',rows},null,2));console.log(JSON.stringify(rows));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
