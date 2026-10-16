const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out=path.join(process.cwd(),'output/playwright/thunder-batch1');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1000,height:950},deviceScaleFactor:1});
 await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/art/thunder-skills-batch1/preview/');await page.waitForFunction(()=>window.thunderBatchPreview?.ready);
 fs.writeFileSync(path.join(out,'initial-snapshot.txt'),await page.locator('body').ariaSnapshot());
 const defs=await page.evaluate(()=>ThunderBatchDefinitions),records=[];
 for(const D of defs){
  await page.locator('#effect').selectOption(D.key);
  for(const [label,t]of Object.entries({anticipation:80,body:D.timing.arrivalMs-70,impact:D.timing.arrivalMs+85,residue:D.timing.arrivalMs+250})){
   await page.evaluate(t=>thunderBatchPreview.seek(t),t);await page.locator('#viewport').screenshot({path:path.join(out,`${D.key}-${label}.png`)});
  }
  const T=D.timing,start=T.arrivalMs*T.gatherRatio;
  for(const [pair,begin,end]of [['tele-body',start,start+60],['body-impact',T.arrivalMs,T.arrivalMs+60],['impact-residue',T.arrivalMs+140,T.arrivalMs+200]]){
   for(const [part,t]of [['start',begin+1],['mid',(begin+end)/2],['end',end-1]]){await page.evaluate(t=>thunderBatchPreview.seek(t),t);await page.locator('#viewport').screenshot({path:path.join(out,`${D.key}-${pair}-${part}.png`)});}
  }
  await page.locator('#hit').uncheck();const miss=await page.evaluate(t=>thunderBatchPreview.seek(t),T.arrivalMs+80);assert.equal(miss.length,0);
  await page.getByRole('button',{name:'恢复默认',exact:true}).click();await page.getByRole('button',{name:'下一帧',exact:true}).click();assert((await page.evaluate(()=>thunderBatchPreview.age))>0);
  await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(100);await page.getByRole('button',{name:'暂停',exact:true}).click();assert.equal(await page.evaluate(()=>thunderBatchPreview.playing),false);
  await page.locator('#scale').fill('1.2');await page.locator('#scale').dispatchEvent('change');await page.locator('#offsetX').fill('10');await page.locator('#offsetX').dispatchEvent('change');
  const scaled=await page.evaluate(t=>thunderBatchPreview.seek(t),T.arrivalMs+80);assert.equal(scaled.find(x=>x.layer==='impact').width,D.display.impact*1.2);
  for(const bg of ['light','dark']){await page.locator('#background').selectOption(bg);await page.locator('#viewport').screenshot({path:path.join(out,`${D.key}-${bg}.png`)});}
  await page.getByRole('button',{name:'恢复默认',exact:true}).click();
  records.push({key:D.key,controls:true,miss:true});
 }
 const sizes=[];
 for(const [width,height]of [[390,844],[844,390]]){
  await page.setViewportSize({width,height});
  for(const D of defs){await page.locator('#effect').selectOption(D.key);await page.evaluate(t=>thunderBatchPreview.seek(t),D.timing.arrivalMs+75);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,`${D.key}-${width}.png`)});}
  sizes.push({width,height,noOverflow:true});
 }
 // Inspect additional playback controls and isolate a missing resource to its own effect.
 await page.setViewportSize({width:1000,height:950});
 await page.locator('#fps').selectOption('15');await page.locator('#speed').selectOption('.25');await page.locator('#loop').uncheck();
 await page.locator('#quality').selectOption('reduced');const reduced=await page.evaluate(()=>thunderBatchPreview.seek(300));assert(reduced.every(p=>!['body','residue'].includes(p.layer)));
 await page.locator('#quality').selectOption('light');await page.locator('#arrival').selectOption('520');await page.evaluate(()=>thunderBatchPreview.seek(550));
 await page.getByRole('button',{name:'恢复默认',exact:true}).click();
 const broken=await context.newPage();await broken.route('**/thunder_strike_unique_body.png',r=>r.abort());
 await broken.goto('http://127.0.0.1:8782/art/thunder-skills-batch1/preview/');await broken.waitForFunction(()=>thunderBatchPreview.errors.thunder_strike_unique);
 assert(await broken.locator('#play').isDisabled());await broken.locator('#effect').selectOption('thunder_flash');assert(await broken.locator('#play').isEnabled());await broken.close();
 await page.locator('#play').click();
 // Measure preview frame intervals only, not game or physical-device performance.
 await page.setViewportSize({width:1000,height:950});const pacing=await page.evaluate(async()=>{const times=[];let prev;await new Promise(resolve=>{function tick(t){if(prev!==undefined)times.push(t-prev);prev=t;if(times.length===60)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});times.sort((a,b)=>a-b);return {samples:times.length,median:times[30],p95:times[57]}});
 assert.equal(errors.length,0);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({browser:await browser.version(),errors,records,sizes,pacing,resourceFailureIsolation:true,scope:'Isolated DOM sprite resource preview; not game integration or real phone GPU'},null,2));
 await browser.close();console.log('PASS three effects, controls, hit/miss, 390/844 layout, no JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
