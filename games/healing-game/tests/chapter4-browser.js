async root => {
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
 const browser=root.context().browser();for(const c of browser.contexts())if(c!==root.context())await c.close();
 const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await c.newPage(),errors=[],external=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{
  if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort()}
  const res=await r.fetch();let html=await res.text();
  // Inspection only in this intercepted test response, absent from the release.
  html=html.replace('  renderer.setPixelRatio(DPR);','  window.__chRenderer=renderer; window.__chDraws=0; var renderOld=renderer.render; renderer.render=function(){__chDraws++;return renderOld.apply(this,arguments);};\n  renderer.setPixelRatio(DPR);');
  html=html.replace('    halo = new T.Mesh(new T.TorusGeometry(3.7', '    window.__chInspect={nodes:bells,group:group,hooks:H,preview:function(){return !!preview;}};\n    halo = new T.Mesh(new T.TorusGeometry(3.7');
  await r.fulfill({response:res,body:html});
 });
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/';
 const st=()=>p.evaluate(()=>__journey.state());
 async function start(){await p.locator('#start').click();await p.waitForTimeout(400)}
 await p.goto(url+'?level=4');await start();
 assert((await st()).level===1,'query string cannot unlock fourth chapter');
 await p.locator('#kitLevelBtn').click();assert(await p.locator('[data-jr-go="4"]').isDisabled(),'fourth locked before third clear');await p.locator('#journeyClose').click();
 await p.evaluate(()=>__kittens.setLevel(4));assert((await st()).level===1,'direct level switch gate');checks.push('new-save fourth-chapter gate');
 await p.addInitScript(()=>{if(sessionStorage.getItem('fixture-ch4'))return;sessionStorage.setItem('fixture-ch4','yes');localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:3}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({caught:{dew:2,peach:2,amber:2,moon:2,violet:2,tide:2},lamps:[true,true,true],completed:[1,2,3],decor:[false,true,false]}));localStorage.setItem('xiantu_save','KEEP');});
 await p.goto(url);await start();const before=await st();assert(before.xp===90,'V7 save keeps original XP');
 await p.locator('#kitLevelBtn').click();assert(await p.locator('[data-jr-go="4"]').isEnabled(),'V7 third-clear unlocks fourth');await p.locator('[data-jr-go="4"]').click();
 assert((await st()).level===4,'enter fourth');assert(await p.locator('#starHud').isHidden()&&await p.locator('#chimeHud').isVisible(),'correct HUD');assert(await p.evaluate(()=>GardenAudio.currentTrackName())==='晨风来信','fourth soundtrack');
 await p.locator('#gpBookBtn').click();assert(await p.locator('.jr-item').count()===41,'41 collectible species');await p.locator('#journeyClose').click();
 const previews=(await st()).progress.chimes;
 await p.locator('#chimeListen').click();await p.waitForFunction(()=>document.getElementById('chimeEcho').textContent.includes('1'));
 assert(await p.locator('#chimeKey0').isDisabled(),'input locked while preview plays');
 assert(JSON.stringify((await st()).progress.chimes)===JSON.stringify(previews),'preview grants no rewards');
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const draws=await p.evaluate(()=>__chDraws);await p.waitForTimeout(400);assert(await p.evaluate(()=>__chDraws)===draws,'background stops render loop');
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await p.locator('#kitLevelBtn').click();await p.locator('#journeyClose').click();assert(await p.locator('#chimeKey0').isEnabled(),'opening journal cancels preview');
 await p.locator('#chimeScoreToggle').click();assert((await p.locator('#chimeScore').textContent()).includes('1·芽响 → 3·晨羽 → 5·云歌'),'visible numbered score');
 await p.evaluate(()=>GardenAudio.setSfx(false));
 const target=await p.evaluate(()=>{const b=__chInspect.nodes[0],v=new THREE.Vector3();b.shell.getWorldPosition(v);v.project(__chInspect.hooks.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}});
 await p.touchscreen.tap(target.x,target.y);assert((await st()).progress.chimes.step===1,'real world bell tap advances first note');
 await p.locator('#chimeKey2').click();assert((await st()).progress.chimes.step===2,'distinct notes accepted promptly');
 await p.reload();await start();assert((await st()).level===4&&(await st()).progress.chimes.step===2,'resume fourth at saved note');
 assert(await p.locator('#chimeHud').isVisible(),'saved chapter restores controls');
 await p.locator('#chimeKey1').click();assert((await st()).progress.chimes.step===0,'wrong note resets phrase');assert((await st()).progress.chimes.found.length===2,'mistake retains discoveries');
 for(const n of [0,2,4])await p.locator('#chimeKey'+n).click();assert((await st()).progress.chimes.round===1,'first phrase complete');
 const xp1=(await st()).xp;await p.locator('#chimeKey0').click();assert((await st()).xp===xp1&&(await st()).progress.chimes.round===1,'repeat cannot farm collection or lose completed phrase');
 await p.locator('#chimeKey1').click();await p.reload();await start();assert((await st()).progress.chimes.round===1&&(await st()).progress.chimes.step===1,'second phrase resume');
 for(const n of [3,5])await p.locator('#chimeKey'+n).click();assert((await st()).progress.chimes.found.length===6,'all six tones found in first two phrases');
 await p.screenshot({path:'output/playwright/healing-v8-ch4-phone.png',scale:'css'});checks.push('V7 migration / music / journal / preview / background / world tap / silent feedback / mistakes / partial reload');
 for(const n of [0,3,2,5])await p.locator('#chimeKey'+n).click();
 const won=await st();assert(won.progress.completed.includes(4)&&won.xp===before.xp+50,'fourth gives exactly 30 collection +20 clear XP');
 assert(await p.locator('#chimeSkip').isVisible(),'short ending presentation starts');await p.locator('#chimeSkip').click();assert(await p.locator('#chimeEnding').isVisible(),'skip opens ending');
 await p.screenshot({path:'output/playwright/healing-v8-ch4-ending.png',scale:'css'});await p.locator('#chimeStay').click();
 for(const n of [0,1,2,3,4,5,0,1,2])await p.locator('#chimeKey'+n).click();assert((await st()).xp===won.xp,'free play cannot award again');
 await p.reload();await start();assert((await st()).xp===won.xp&&(await st()).progress.chimes.round===3,'completion reload idempotence');
 const memory=[];
 for(let cycle=0;cycle<3;cycle++){
  for(const n of [1,2,3,4]){await p.locator('#kitLevelBtn').click();await p.locator('[data-jr-go="'+n+'"]').click();assert((await st()).level===n,'switch '+n);}
  await p.waitForTimeout(300);memory.push(await p.evaluate(()=>({g:__chRenderer.info.memory.geometries,t:__chRenderer.info.memory.textures,n:__chInspect.group.children.length})));
 }
 assert(memory.every(x=>x.n===10),'chapter scene reused on every entry');assert(memory[2].g===memory[1].g&&memory[2].t===memory[1].t,'no new GPU resources after warm switches');
 assert((await st()).xp===won.xp,'switching cannot award twice');checks.push('first clear / skip / free play / reentry / GPU reuse');
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);await p.screenshot({path:'output/playwright/healing-v8-ch4-landscape.png',scale:'css'});
 for(let i=0;i<6;i++)assert(await p.locator('#chimeKey'+i).isVisible(),'landscape key visible');
 await p.setViewportSize({width:1280,height:800});await p.waitForTimeout(400);await p.screenshot({path:'output/playwright/healing-v8-ch4-desktop.png',scale:'css'});
 assert(await p.evaluate(()=>localStorage.getItem('xiantu_save'))==='KEEP','Xiantu saves unchanged');
 // A separate state fixture exercises write failures and reduced-motion completion.
 await p.addInitScript(()=>{if(sessionStorage.getItem('fixture-ch4-fail'))return;sessionStorage.setItem('fixture-ch4-fail','1');const s=JSON.parse(localStorage.getItem('healingGarden.journey.v1'));s.chimes={round:2,step:3,found:[]};s.completed=[1,2,3];localStorage.setItem('healingGarden.journey.v1',JSON.stringify(s));});
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await start();
 await p.evaluate(()=>{window.__set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='healingGarden.journey.v1')throw new DOMException('full','QuotaExceededError');return __set.call(this,k,v)}});
 await p.locator('#chimeKey5').click();assert(await p.locator('#starSaveWarning').isVisible(),'save failure surfaced');assert(await p.locator('#chimeEnding').isVisible(),'reduced-motion opens result immediately');assert(await p.locator('#chimeSkip').isHidden(),'no lengthy effect for reduced motion');
 await p.evaluate(()=>{Storage.prototype.setItem=__set;document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(200);assert(await p.locator('#starSaveWarning').isHidden(),'pending state saved after storage recovers');
 await p.reload();await start();assert((await st()).progress.chimes.round===3&&(await st()).progress.completed.includes(4),'recovered completion persisted');
 checks.push('landscape / desktop / save isolation / write failure recovery / reduced motion');
 assert(!errors.length,'page errors: '+errors.join(';'));assert(!external.length,'external assets');await c.close();return{checks,won,memory,errors,external};
}
