async root => {
 const browser = root.context().browser();
 for (const c of browser.contexts()) if (c !== root.context()) await c.close();
 const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const page = await context.newPage(), errors=[], external=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Observe the identity of actual catches: a repeated screen position may hit a different moving wisp.
 await page.route('**/*',async r=>{
  if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort();}
  if(r.request().resourceType()!=='document')return r.continue();
  const response=await r.fetch();let body=await response.text();const anchor='    var sp = TYPES[w.type], fresh = !S.caught[sp.id];';
  if(!body.includes(anchor))throw Error('Catch inspection anchor missing');
  body=body.replace(anchor,'    (window.__caughtWispSlots||(window.__caughtWispSlots=[])).push(w.slot);\n'+anchor);await r.fulfill({response,body});
 });
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/';
 const assert=(v,m)=>{if(!v)throw Error(m)};
 async function start(){await page.locator('#start').click();await page.waitForTimeout(1500);}
 async function state(){return page.evaluate(()=>__journey.state());}
 async function journal(tab='journey'){await page.locator('#kitLevelBtn').click();if(tab!=='journey')await page.locator('[data-jr-tab="'+tab+'"]').click();}
 await page.goto(url);await start();
 assert(await page.title()==='暮色浮岛 · 月汐莲湾 V9.1','version');
 await page.evaluate(()=>localStorage.setItem('xiantu_save','untouched'));
 await journal();assert(await page.locator('[data-jr-go="2"]').isDisabled(),'new save chapter2 locked');assert(await page.locator('[data-jr-go="3"]').isDisabled(),'new save chapter3 locked');
 await page.locator('[data-jr-tab="collection"]').click();assert(await page.locator('.jr-item').count()===47,'47 species in journal');await page.locator('#journeyClose').click();
 await page.evaluate(()=>{__garden.plantRandom();window.dispatchEvent(new PageTransitionEvent('pagehide'));});
 await page.reload();await start();assert(await page.evaluate(()=>__garden.count())===1,'immediate close flushes flower');
 // Migrate a real-shaped V5 save; no V6 progress exists in this fixture.
 await page.evaluate(()=>{
  localStorage.removeItem('healingGarden.journey.v1');
  localStorage.setItem('healingGarden.butterflies.v1',JSON.stringify({caught:Object.fromEntries(__bf.species.map(s=>[s.id,1])),total:30,ended:true}));
  localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({caught:Object.fromEntries(__kittens.kinds.map(s=>[s.id,1])),total:20,ended:true,level:2}));
  localStorage.setItem('hg_level2_unlocked','1');
 });
 await page.reload();await start();
 const migrated=await state();assert(migrated.progress.completed.includes(1)&&migrated.progress.completed.includes(2),'old chapters migrated');assert(migrated.progress.seen.butterflies.length===12&&migrated.progress.seen.kittens.length===6,'old album migrated');
 await journal('growth');await page.screenshot({path:'output/playwright/v8-growth-phone.png',scale:'css'});await page.locator('[data-jr-tab="journey"]').click();await page.locator('[data-jr-go="3"]').click();
 await page.waitForTimeout(1200);assert((await state()).level===3,'enter third chapter');
 const childCount=(await state()).worldChildren;
 await page.locator('#starLamp0').click();assert(!(await state()).progress.lamps[0],'lamp rejects insufficient charge');
 // Actual touch input on projected objects, not a reward-granting debug hook.
 async function pick(){
  for(let attempt=0;attempt<25;attempt++){
   const targets=await page.evaluate(()=>__journey.targets().filter(p=>p.front&&p.x>10&&p.x<innerWidth-10&&p.y>180&&p.y<innerHeight-115&&document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS'&&__level3fx.wispAt(p.x,p.y)&&__level3fx.lampAt(p.x,p.y)<0));
   for(const p of targets){
    const old=await state();
    await page.touchscreen.tap(p.x,p.y);
    const after=await state();
    if(JSON.stringify(after.progress.caught)!==JSON.stringify(old.progress.caught))return p;
   }
   await page.waitForTimeout(250);
  }throw Error('No touch target caught');
 }
 const first=await pick();const caughtBefore=await page.evaluate(()=>__caughtWispSlots.slice());const firstSlot=caughtBefore[caughtBefore.length-1];
 await page.touchscreen.tap(first.x,first.y);const caughtAfter=await page.evaluate(()=>__caughtWispSlots.slice());
 assert(caughtAfter.filter(slot=>slot===firstSlot).length===caughtBefore.filter(slot=>slot===firstSlot).length,'duplicate tap cannot collect same wisp');
 const repeatTap={before:caughtBefore,after:caughtAfter};
 await journal('collection');const beforeOverlay=await state();await page.mouse.click(first.x,first.y);assert((await state()).progress.charge===beforeOverlay.progress.charge,'journal blocks world input');await page.locator('#journeyClose').click();
 for(let lamp=0;lamp<3;lamp++){
  while((await state()).progress.charge<4)await pick();
  if(lamp===0){
   await page.screenshot({path:'output/playwright/v8-star-phone.png',scale:'css'});
   const beforeCap=await state();await pickAtFull();assert((await state()).progress.charge===4,'charge is capped');
   await page.reload();await start();assert((await state()).progress.charge===4,'partial progress persists');
  }
  await page.locator('#starLamp'+lamp).click();
  assert((await state()).progress.lamps[lamp]===true,'lamp lit');
  if(lamp<2){await page.locator('#starLamp'+lamp).click();assert((await state()).progress.charge===0,'lit lamp cannot consume again');}
 }
 async function pickAtFull(){
  await page.waitForFunction(()=>__journey.targets().some(p=>document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS'&&__level3fx.wispAt(p.x,p.y)&&__level3fx.lampAt(p.x,p.y)<0));
  const target=await page.evaluate(()=>__journey.targets().find(p=>document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS'&&__level3fx.wispAt(p.x,p.y)&&__level3fx.lampAt(p.x,p.y)<0));
  await page.touchscreen.tap(target.x,target.y);
 }
 await page.locator('#starFinaleSkip').click();
 assert(await page.locator('#starEnding').isVisible(),'chapter ending visible');
 await page.screenshot({path:'output/playwright/v8-ending.png',scale:'css'});
 await page.locator('#starJournal').click();const completed=await state();assert(completed.progress.completed.includes(3),'chapter completion stored');
 assert(completed.xp===5*(completed.progress.seen.flowers.length+12+6+Object.values(completed.progress.caught).filter(n=>n>0).length)+60,'growth counted once');
 await page.locator('[data-jr-decor="0"]').uncheck();await page.locator('#journeyClose').click();
 await page.reload();await start();const restored=await state();assert(restored.xp===completed.xp&&restored.progress.lamps.every(Boolean),'completed progress reload');assert(restored.progress.decor[0]===false,'decoration preference persists');
 for(const n of [1,2,3,1,2,3]){await journal();await page.locator('[data-jr-go="'+n+'"]').click();assert((await state()).level===n,'switch chapter '+n);}
 assert((await state()).worldChildren===childCount,'no duplicate scene objects');assert((await state()).xp===completed.xp,'switching cannot farm growth');
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(600);await journal();await page.screenshot({path:'output/playwright/v8-journal-landscape.png',scale:'css'});await page.locator('#journeyClose').click();
 assert(await page.evaluate(()=>localStorage.getItem('xiantu_save'))==='untouched','xiantu save untouched');
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError');};});await pick();assert(await page.locator('#starSaveWarning').isVisible(),'save failure is visible');
 assert(errors.length===0,'page errors: '+errors.join(';'));assert(external.length===0,'external requests');
 const result={version:'9.1.0',migrated,completed,restored,childCount,repeatTap,errors,external,checks:'locks, migration, real touch collection, duplicate guard, modal input, charge cap, partial reload, 3 lamps, ending, growth idempotence, decor persistence, switching, landscape, isolated saves, quota warning'};
 await root.evaluate(r=>window.__journeyResult=r,result);await context.close();return result;
}
