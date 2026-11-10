async root => {
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
 const browser=root.context().browser(), results=[], errors=[], external=[];
 for(const c of browser.contexts())if(c!==root.context())await c.close();
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/';
 await page.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort()}
  if(r.request().resourceType()!=='document')return r.continue();
  const res=await r.fetch();let body=await res.text();body=body.replace('  renderer.setPixelRatio(DPR);','  window.__testRenderer=renderer; window.__draws=0; var oldRender=renderer.render; renderer.render=function(){window.__draws++;return oldRender.apply(this,arguments)};\n  renderer.setPixelRatio(DPR);');await r.fulfill({response:res,body});
 });
 await page.goto(url);
 const v6={caught:{dew:1,peach:1,amber:1,moon:1,violet:1,tide:1},charge:3,lamps:[true,true,false],completed:[1,2],decor:[false,true,false]};
 await page.addInitScript(data=>{
  if(sessionStorage.getItem('fixture-v6'))return;sessionStorage.setItem('fixture-v6','1');
  localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:3,caught:{orange:20}}));localStorage.setItem('hg_level2_unlocked','1');
  localStorage.setItem('healingGarden.journey.v1',JSON.stringify(data));localStorage.setItem('xiantu_save','DO NOT CHANGE');
 },v6);
 await page.reload();await page.locator('#start').click();await page.waitForTimeout(1300);
 const state=()=>page.evaluate(()=>__journey.state());
 const migrated=await state();assert(migrated.progress.stars===6,'V6 catches become six sky stars');assert(migrated.progress.charge===3&&migrated.progress.decor[0]===false,'V6 unfinished charge and decor retained');
 assert(await page.locator('meta[name="garden-version"]').getAttribute('content')==='9.5.0','version metadata');
 assert(await page.evaluate(()=>GardenAudio.currentTrackName())==='星灯夜曲','level-specific music');
 results.push('V6 partial-save migration / version / nocturne');
 const targetProbe=wanted=>{
  const ids=['dew','peach','amber','moon','violet','tide'],preferences=[['peach','amber'],['dew','moon'],['violet','tide']],progress=__journey.state().progress,next=progress.lamps.indexOf(false),allowed=next<0?ids:preferences[next];
  return __journey.targets().find(p=>{const w=__level3fx.wispAt(p.x,p.y);return (!wanted||p.id===wanted)&&allowed.includes(p.id)&&p.front&&p.y>290&&p.y<700&&document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS'&&w&&ids[w.type]===p.id&&__level3fx.lampAt(p.x,p.y)<0;});
 };
 async function target(wanted=null){
  const handle=await page.waitForFunction(targetProbe,wanted,{timeout:15000}),point=await handle.jsonValue();await handle.dispose();return point;
 }
 async function catchOne(wanted=null){for(let i=0;i<20;i++){const before=await state(),t=await target(wanted);await page.touchscreen.tap(t.x,t.y);const after=await state();if(JSON.stringify(after.progress.caught)!==JSON.stringify(before.progress.caught)){
  if(wanted)assert((after.progress.caught[wanted]||0)===(before.progress.caught[wanted]||0)+1,'requested free-play color '+wanted+' collected');
  if(before.progress.completed.includes(3))assert(after.progress.charge===before.progress.charge,'free-play collection leaves charge unchanged');
  else assert(after.progress.charge===before.progress.charge+1&&after.progress.joys===before.progress.joys+1,'preferred catch adds exactly one charge and joy');
  return t.id;
 }}throw Error('No eligible wisp captured'+(wanted?' for '+wanted:''));}
 const resumedColor=await catchOne();assert(['violet','tide'].includes(resumedColor)&&(await state()).progress.charge===4,'one lamp-3 preferred catch restores the preserved partial charge');
 await page.locator('#starLamp2').click();assert(await page.evaluate(()=>__level3.isRunning()),'finale starts');
 const won=await state();assert(won.progress.completed.includes(3)&&won.progress.lamps.every(Boolean),'completion persisted before animation');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const paused=await page.evaluate(()=>({draws:__draws,grow:__level3.state().grow,voyage:__voyage.state()}));
 await page.waitForTimeout(450);
 const still=await page.evaluate(()=>({draws:__draws,grow:__level3.state().grow,voyage:__voyage.state()}));assert(JSON.stringify(paused)===JSON.stringify(still),'background stops rendering, boat, and finale');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(3500);await page.screenshot({path:'output/playwright/healing-v7-finale-phone.png',scale:'css'});
 await page.locator('#starFinaleSkip').click();assert(await page.locator('#starEnding').isVisible(),'skip opens ending');
 await page.locator('#starStay').click();await page.waitForTimeout(1000);
 const beforeReload=await state();await page.reload();await page.locator('#start').click();await page.waitForTimeout(1000);
 const afterReload=await state();assert(afterReload.xp===beforeReload.xp&&afterReload.progress.memories.length===beforeReload.progress.memories.length,'refresh cannot duplicate completion or memories');
 assert(await page.evaluate(()=>__voyage.state().boat),'completed old/new save restores boat');results.push('completion / paused finale / skip / reload idempotence');
 // Exercise a real touch swipe and a two-touch pinch via Chromium input, no direct award calls.
 const cdp=await context.newCDPSession(page);
 const pt=await target(),startCaught=JSON.stringify((await state()).progress.caught);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt.x-38,y:pt.y,id:0}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pt.x+24,y:pt.y,id:0}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert(JSON.stringify((await state()).progress.caught)!==startCaught,'swipe collects');
 const beforePinch=JSON.stringify((await state()).progress.caught),p2=await target();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p2.x-45,y:p2.y,id:0},{x:p2.x+45,y:p2.y,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p2.x,y:p2.y,id:0},{x:p2.x+65,y:p2.y,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert(JSON.stringify((await state()).progress.caught)===beforePinch,'pinch does not collect');results.push('touch swipe / pinch separation');
 // One failed save source must remain visible even when the journey save succeeds.
 await page.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='healingGarden.v3')throw new DOMException('full','QuotaExceededError');return __originalSetItem.call(this,k,v)};});
 // The preserved V5 source uses a separate key; discover it from its own current state writes.
 await page.evaluate(()=>{Storage.prototype.setItem=function(k,v){if(k!=='healingGarden.journey.v1'&&k!=='healingGarden.kittens.v1')throw new DOMException('full','QuotaExceededError');return __originalSetItem.call(this,k,v)};__garden.plantRandom();});
 await page.waitForTimeout(600);assert(await page.locator('#starSaveWarning').isVisible(),'garden save failure shown');
 await catchOne();assert(await page.locator('#starSaveWarning').isVisible(),'journey success does not mask garden failure');
 await page.evaluate(()=>{Storage.prototype.setItem=__originalSetItem;document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(200);assert(await page.locator('#starSaveWarning').isHidden(),'pending save recovers when storage available');results.push('independent save failures / retry recovery');
 const xp=(await state()).xp;
 for(const n of [1,2,3,1,2,3]){await page.locator('#kitLevelBtn').click();await page.locator('[data-jr-go="'+n+'"]').click();assert((await state()).level===n,'level switch');}
 assert((await state()).xp===xp,'switch cannot farm XP');
 await page.setViewportSize({width:844,height:390});await page.locator('#kitLevelBtn').click();await page.screenshot({path:'output/playwright/healing-v7-journal-landscape.png',scale:'css'});await page.locator('#journeyClose').click();
 await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(1500);await page.screenshot({path:'output/playwright/healing-v7-desktop.png',scale:'css'});
 assert(await page.evaluate(()=>localStorage.getItem('xiantu_save'))==='DO NOT CHANGE','Xiantu storage isolated');results.push('switching / landscape / desktop / Xiantu isolation');
 // Corrupt additive fields are whitelisted and bounded, never inserted as markup.
 await page.addInitScript(()=>{if(sessionStorage.getItem('fixture-corrupt'))return;sessionStorage.setItem('fixture-corrupt','1');let s=JSON.parse(localStorage.getItem('healingGarden.journey.v1'));s.stars=999999;s.joys=-3;s.memories=['dew','dew','constructor','__proto__','<img src=x onerror=alert(1)>'];localStorage.setItem('healingGarden.journey.v1',JSON.stringify(s));});
 await page.reload();await page.locator('#start').click();const clean=(await state()).progress;assert(clean.stars===60&&clean.joys===0,'bounded added counters');assert(new Set(clean.memories).size===clean.memories.length&&!clean.memories.includes('constructor')&&!clean.memories.some(s=>s.includes('<')),'bounded known memories');
 const capped=clean.stars;await catchOne();assert((await state()).progress.stars===capped,'sky capped at 60');results.push('corrupt additive fields / 60-star cap');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{if(sessionStorage.getItem('fixture-reduced'))return;sessionStorage.setItem('fixture-reduced','1');const s=JSON.parse(localStorage.getItem('healingGarden.journey.v1'));s.lamps=[true,true,false];s.charge=4;s.completed=[1,2];localStorage.setItem('healingGarden.journey.v1',JSON.stringify(s));});
 await page.reload();await page.locator('#start').click();await page.locator('#starLamp2').click();assert(await page.locator('#starEnding').isVisible(),'reduced-motion skips lengthy finale');assert(!await page.evaluate(()=>__level3.isRunning()||__voyage.state().looping),'no finale or boat loop with reduced motion');results.push('reduced-motion ending');
 // An old completed save can lack its completion flag and all additive voyage fields.
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('fixture-old-complete'))return;sessionStorage.setItem('fixture-old-complete','1');
  localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:3,caught:{orange:20}}));
  localStorage.setItem('healingGarden.journey.v1',JSON.stringify({caught:{dew:1,peach:1,amber:1,moon:1,violet:1,tide:1},charge:0,lamps:[true,true,true],completed:[1,2],decor:[false,true,false]}));
 });
 await page.setViewportSize({width:390,height:844});
 await page.reload();await page.locator('#start').click();await page.waitForTimeout(1000);
 const legacyComplete=await state();
 assert(legacyComplete.progress.completed.includes(3)&&legacyComplete.progress.stars===6&&legacyComplete.progress.charge===0,'old completed lamps restore completion and sky without charging');
 assert(legacyComplete.progress.decor[0]===false&&legacyComplete.progress.decor[2]===false,'old completed decoration choices retained');
 for(const id of ['dew','peach','amber','moon','violet','tide'])await catchOne(id);
 const freePlay=await state();
 assert(freePlay.progress.charge===0&&freePlay.progress.stars===12&&freePlay.progress.joys===0&&freePlay.xp===legacyComplete.xp,'all six free-play colors collect without charge, preference joy, or duplicate growth');
 await page.reload();await page.locator('#start').click();
 const legacyReload=await state();assert(legacyReload.xp===freePlay.xp&&legacyReload.progress.stars===12&&legacyReload.progress.charge===0,'legacy completed free play persists without duplicate rewards');
 results.push('old completed save / all-six-color free play / unchanged charge / no duplicate reward');
 assert(errors.length===0,'page errors: '+errors.join(';'));assert(external.length===0,'no external dependencies');
 await context.close();return {checks:results,errors,external,migrated,won,legacyComplete,freePlay};
}
