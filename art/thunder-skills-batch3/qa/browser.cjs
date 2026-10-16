const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out=path.join(process.cwd(),'output/playwright/thunder-batch3');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const context=await browser.newContext({viewport:{width:1000,height:1100},deviceScaleFactor:1});
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/art/thunder-skills-batch3/preview/');await page.waitForFunction(()=>thunderBatchPreview.ready);
 fs.writeFileSync(path.join(out,'initial-snapshot.txt'),await page.locator('body').ariaSnapshot());
 const defs=await page.evaluate(()=>ThunderBatchDefinitions),records=[];
 for(const D of defs){
  await page.locator('#effect').selectOption(D.key);const a=D.timing.arrivalMs;
  for(const [label,t]of Object.entries({anticipation:80,body:a-60,impact:a+100,loop:1400,event:1180,outro:2750})){
   await page.evaluate(t=>thunderBatchPreview.seek(t),t);await page.locator('#viewport').screenshot({path:path.join(out,`${D.key}-${label}.png`)});
  }
  await page.locator('#hit').uncheck();assert.equal((await page.evaluate(t=>thunderBatchPreview.seek(t),a+100)).length,0);await page.locator('#reset').click();
  if(D.key!=='chain_lightning'){
   assert((await page.evaluate(()=>thunderBatchPreview.seek(1400))).some(p=>p.layer==='body'));
   await page.locator('#events').uncheck();assert((await page.evaluate(()=>thunderBatchPreview.seek(1180))).every(p=>!p.id.startsWith('tick:')&&!p.id.startsWith('reflect')));
   await page.locator('#state').uncheck();assert.equal((await page.evaluate(()=>thunderBatchPreview.seek(1400))).length,0);
   await page.locator('#reset').click();await page.locator('#end').selectOption('900');assert.equal((await page.evaluate(()=>thunderBatchPreview.seek(1400))).length,0);
   await page.locator('#reset').click();await page.locator('#quality').selectOption('reduced');assert((await page.evaluate(()=>thunderBatchPreview.seek(1400))).some(p=>p.layer==='body'&&p.frame===0));
  }
  await page.locator('#reset').click();await page.evaluate(t=>thunderBatchPreview.seek(t),a+100);await page.locator('#destroy').click();assert.equal(await page.locator('.sprite:visible').count(),0);
  await page.locator('#reset').click();await page.locator('#step').click();assert((await page.evaluate(()=>thunderBatchPreview.age))>0);
  await page.locator('#play').click();await page.waitForTimeout(100);await page.locator('#play').click();assert.equal(await page.evaluate(()=>thunderBatchPreview.playing),false);
  await page.locator('#scale').fill('1.2');await page.locator('#scale').dispatchEvent('change');await page.locator('#offsetX').fill('10');await page.locator('#offsetX').dispatchEvent('change');
  const scaled=await page.evaluate(t=>thunderBatchPreview.seek(t),a+100);assert.equal(scaled.find(p=>p.id==='impact').width,D.display.impact*1.2);
  for(const bg of ['light','dark']){await page.locator('#background').selectOption(bg);await page.locator('#viewport').screenshot({path:path.join(out,`${D.key}-${bg}.png`)});}
  await page.locator('#reset').click();await page.locator('#reverse').check();await page.evaluate(t=>thunderBatchPreview.seek(t),a-40);await page.locator('#viewport').screenshot({path:path.join(out,`${D.key}-reverse.png`)});
  records.push({key:D.key,controls:true,miss:true,stateLifetime:true,exit:true});
 }
 const sizes=[];
 for(const [width,height]of [[390,844],[844,390],[1366,900]]){
  await page.setViewportSize({width,height});
  for(const D of defs){await page.locator('#effect').selectOption(D.key);await page.evaluate(t=>thunderBatchPreview.seek(t),D.key==='chain_lightning'?D.timing.arrivalMs-30:1400);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,`${D.key}-${width}.png`)});}
  sizes.push({width,height,noOverflow:true});
 }
 await page.locator('#fps').selectOption('15');await page.locator('#speed').selectOption('.25');await page.locator('#loop').uncheck();await page.locator('#arrival').selectOption('520');await page.locator('#quality').selectOption('light');await page.evaluate(()=>thunderBatchPreview.seek(600));
 const broken=await context.newPage();await broken.route('**/chain_lightning_body.png',r=>r.abort());await broken.goto('http://127.0.0.1:8782/art/thunder-skills-batch3/preview/');await broken.waitForFunction(()=>thunderBatchPreview.errors.chain_lightning);assert(await broken.locator('#play').isDisabled());await broken.locator('#effect').selectOption('thunder_prison');assert(await broken.locator('#play').isEnabled());await broken.close();
 await page.locator('#reset').click();await page.locator('#play').click();
 const pacing=await page.evaluate(async()=>{const times=[];let prev;await new Promise(resolve=>{function tick(t){if(prev!==undefined)times.push(t-prev);prev=t;if(times.length===90)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});times.sort((a,b)=>a-b);return {samples:times.length,median:times[45],p95:times[85]}});
 assert.equal(errors.length,0);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({browser:await browser.version(),headless:true,dpr:1,errors,records,sizes,pacing,resourceFailureIsolation:true,scope:'DOM resource preview with simulated events; not integrated combat or physical-phone performance'},null,2));
 console.log('PASS four effects, lifecycle controls, event isolation, three viewports, missing resource isolation, zero JS errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
