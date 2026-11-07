async root=>{
 const browser=root.context().browser();for(const c of browser.contexts())if(c!==root.context())await c.close();
 await root.goto('about:blank');
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)},c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage(),errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{
  if(new URL(r.request().url()).hostname!=='127.0.0.1')throw Error('External request '+r.request().url());
  if(r.request().resourceType()!=='document')return r.continue();
  const response=await r.fetch();let body=await response.text();
  body=body.replace('  renderer.setPixelRatio(DPR);','  window.__renderer=renderer; window.__drawCount=0; var renderBase=renderer.render;renderer.render=function(){__drawCount++;return renderBase.apply(this,arguments)};\n  renderer.setPixelRatio(DPR);');
  body=body.replace('if(active){buildWorld();H.setNightTarget(.9);','if(active){buildWorld();window.__lotusInspect={group:group,flowers:flowers,hooks:H};H.setNightTarget(.9);');
  await r.fulfill({response,body});
 });
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/',state=()=>p.evaluate(()=>__journey.state());
 await p.goto(url+'?level=5');await p.locator('#start').click();await p.evaluate(()=>__kittens.setLevel(5));assert((await state()).level===1,'new saves cannot bypass fifth gate');
 await p.locator('#kitLevelBtn').click();assert(await p.locator('[data-jr-go="5"]').isDisabled(),'fifth locked in chapter select');await p.locator('#journeyClose').click();checks.push('new-save gate');
 await p.addInitScript(()=>{if(sessionStorage.getItem('lotus-fixture'))return;sessionStorage.setItem('lotus-fixture','1');localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:4}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2,3],lamps:[true,true,true],chimes:{round:2,step:3,found:[]}}));localStorage.setItem('xiantu_save','KEEP');});
 await p.goto(url);await p.locator('#start').click();assert((await state()).progress.lotus.found.length===0,'V8 migration has no fifth rewards');
 await p.locator('#chimeKey5').click();await p.locator('#chimeSkip').click();await p.locator('#lotusFromChime').click();assert((await state()).level===5,'fourth ending unlocks and enters fifth');
 const before=await state();assert(await p.locator('#lotusHud').isVisible()&&await p.locator('#chimeHud').isHidden(),'fifth HUD only');assert(await p.evaluate(()=>GardenAudio.currentTrackName())==='星灯夜曲','shared music theme');
 await p.waitForTimeout(400);await p.screenshot({path:'output/playwright/healing-v9-lotus-phone.png',scale:'css'});
 await p.locator('#gpBookBtn').click();assert(await p.locator('.jr-item').count()===47,'six new collection entries');await p.locator('#journeyClose').click();
 const t=await p.evaluate(()=>{const f=__lotusInspect.flowers[0],v=new THREE.Vector3();f.seed.getWorldPosition(v);v.project(__lotusInspect.hooks.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};});
 await p.touchscreen.tap(t.x,t.y);assert((await state()).progress.lotus.light[0]===1,'world lotus tap gives one light');
 await p.locator('#lotusKey2').focus();await p.keyboard.press('Enter');assert((await state()).progress.lotus.light[2]===1,'keyboard gift');
 await p.reload();await p.locator('#start').click();assert((await state()).level===5&&(await state()).progress.lotus.light[0]===1,'level and partial gifts restore');
 const partial=JSON.stringify((await state()).progress.lotus);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});const pausedDraws=await p.evaluate(()=>__drawCount);await p.waitForTimeout(300);assert(await p.evaluate(()=>__drawCount)===pausedDraws,'background pauses rendering');assert(JSON.stringify((await state()).progress.lotus)===partial,'background never advances progress');
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));GardenAudio.setSfx(false);});
 // Every click counts; no rhythm window, wrong choice, timer or reward for repeated blooms.
 for(const i of [0,1,2,3,4,5])while((await state()).progress.lotus.light[i]<3)await p.locator('#lotusKey'+i).click();
 const won=await state();assert(won.xp===before.xp+50&&won.progress.completed.includes(5),'six collections and one completion award exactly 50');assert(await p.locator('#lotusEnding').isVisible(),'completion dialog');
 await p.keyboard.press('Tab');assert(await p.locator('#lotusJournal').evaluate(el=>el===document.activeElement),'dialog keyboard moves to journal');await p.keyboard.press('Tab');assert(await p.locator('#lotusStay').evaluate(el=>el===document.activeElement),'dialog traps focus');
 await p.locator('#lotusStay').click();for(let i=0;i<12;i++)await p.locator('#lotusNext').click();assert((await state()).xp===won.xp,'free play cannot award twice');
 await p.reload();await p.locator('#start').click();assert((await state()).xp===won.xp,'completion reload idempotent');checks.push('V8 migration / fourth ending / world and keyboard gifts / partial restore / background / no fail / 50 reward / free play');
 const memory=[];for(let round=0;round<3;round++){
  for(const n of [1,2,3,4,5]){await p.evaluate(n=>__kittens.setLevel(n),n);assert((await state()).level===n,'switch '+n);}
  await p.waitForTimeout(200);memory.push(await p.evaluate(()=>({g:__renderer.info.memory.geometries,t:__renderer.info.memory.textures,n:__lotusInspect.group.children.length})));
 }
 assert(memory[2].g===memory[1].g&&memory[2].t===memory[1].t&&memory[2].n===memory[1].n,'scene resources reused');assert((await state()).xp===won.xp,'switching gives no rewards');
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(200);for(let i=0;i<6;i++)assert(await p.locator('#lotusKey'+i).isVisible(),'landscape key');await p.screenshot({path:'output/playwright/healing-v9-lotus-landscape.png',scale:'css'});
 await p.setViewportSize({width:1280,height:800});await p.waitForTimeout(200);await p.screenshot({path:'output/playwright/healing-v9-lotus-desktop.png',scale:'css'});
 assert(await p.evaluate(()=>localStorage.getItem('xiantu_save'))==='KEEP','Xiantu save untouched');checks.push('all chapter switches / bounded GPU resources / landscape / desktop / save isolation');
 // A fresh unfinished fixture exercises storage failure and retry, including reduced motion.
 await p.addInitScript(()=>{if(sessionStorage.getItem('lotus-retry'))return;sessionStorage.setItem('lotus-retry','1');const s=JSON.parse(localStorage.getItem('healingGarden.journey.v1'));s.lotus={light:[3,3,3,3,3,2]};localStorage.setItem('healingGarden.journey.v1',JSON.stringify(s));});
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.locator('#start').click();
 await p.evaluate(()=>{window.__oldSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='healingGarden.journey.v1')throw new DOMException('full','QuotaExceededError');return __oldSet.call(this,k,v);};});
 await p.locator('#lotusKey5').click();assert(await p.locator('#starSaveWarning').isVisible(),'failed write surfaced');assert(await p.locator('#lotusEnding').isVisible(),'reduced motion completes without waiting');
 await p.evaluate(()=>{Storage.prototype.setItem=__oldSet;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(100);assert(await p.locator('#starSaveWarning').isHidden(),'retry saves pending progress');await p.reload();await p.locator('#start').click();assert((await state()).progress.completed.includes(5),'recovered completion persists');checks.push('write failure / retry / reduced motion');
 assert(!errors.length,errors.join(';'));await c.close();return{checks,memory,errors};
}
