async root => {
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)},browser=root.context().browser();
 const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p=await c.newPage(),errors=[],external=[],catches=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{
  if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort();}
  if(r.request().resourceType()!=='document')return r.continue();
  const res=await r.fetch();let html=await res.text();
  // Read-only test observation stays in this response; gameplay still uses real pointer input.
  const edits=[['  function toast(msg, ms) {','  function toast(msg, ms) { (window.__c3Notices||(window.__c3Notices=[])).push({msg:msg,t:performance.now()});'],
   ['wisps = [], lamps = [], ornaments = []','wisps = [], lamps = [], ornaments = window.__c3Ornaments = []'],
   ['      addStyle(); prepareWisps(); buildLamps(); bindSwipes();','      addStyle(); prepareWisps(); buildLamps(); bindSwipes(); window.__c3Inspect={H:H,J:J,fx:lampFx};'],
   ['    var sp = TYPES[w.type], fresh = !S.caught[sp.id];','    window.__c3LastCatch={type:w.type,id:TYPES[w.type].id};\n    var sp = TYPES[w.type], fresh = !S.caught[sp.id];']];
  for(const [a,b]of edits){assert(html.includes(a),'inspection anchor missing: '+a);html=html.replace(a,b);}
  await r.fulfill({response:res,body:html});
 });
 await p.addInitScript(()=>{
  const schedule=window.setTimeout;
  window.setTimeout=function(fn,delay){if(delay===900&&typeof fn==='function'&&fn.toString().includes('星灯湾'))window.__c3Welcome=fn;return schedule.apply(window,arguments);};
  if(sessionStorage.getItem('chapter3-feedback'))return;sessionStorage.setItem('chapter3-feedback','1');
  localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('xiantu_save','KEEP');
  localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({level:3,total:20,ended:true}));
  localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2],lamps:[false,false,false],charge:0,decor:[true,true,true]}));
 });
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/',state=()=>p.evaluate(()=>__journey.state());
 try {
 await p.goto(url);
 assert((await p.locator('#start').innerText()).includes('所有颜色每只都 +1'),'entry explains every color');
 await p.locator('#start').click();await p.waitForTimeout(300);
 assert(await p.evaluate(()=>!__c3Ornaments[2].visible),'locked crown stays hidden');
 const identity=await p.evaluate(()=>{window.__c3Island=GardenClip.world.island;return __journey.state().worldChildren;});
 await p.locator('#starLamp0').click();
 assert((await state()).progress.charge===0&&(await p.locator('#toast').innerText()).includes('还差 4'),'uncharged lamp explains missing charge');
 // Exercise the actual passive callbacks during action feedback, including the former 900ms welcome race.
 await p.evaluate(()=>{GardenPlay.debug.weather('petals');if(!window.__c3Welcome)throw Error('Welcome callback not observed');window.__c3Welcome();});
 assert((await p.locator('#toast').innerText()).includes('还差 4'),'weather and delayed welcome cannot replace action feedback');
 const empty=await p.evaluate(()=>{
  for(let y=260;y<650;y+=35)for(let x=15;x<innerWidth-10;x+=30){if(document.elementFromPoint(x,y)?.tagName==='CANVAS'&&!__level3fx.wispAt(x,y)&&__level3fx.lampAt(x,y)<0)return{x,y};}return null;
 });
 assert(empty,'empty point is available');await p.touchscreen.tap(empty.x,empty.y);
 assert((await p.locator('#toast').innerText()).includes('没有接到星萤'),'empty tap gives guidance');
 assert((await state()).progress.charge===0,'empty tap grants no charge');
 async function pick(){
  for(let attempt=0;attempt<30;attempt++){
   const targets=await p.evaluate(()=>{const caught=__journey.state().progress.caught;return __journey.targets().filter(t=>t.front&&t.x>10&&t.x<innerWidth-10&&t.y>230&&t.y<innerHeight-120&&document.elementFromPoint(t.x,t.y)?.tagName==='CANVAS'&&__level3fx.wispAt(t.x,t.y)&&__level3fx.lampAt(t.x,t.y)<0).sort((a,b)=>(caught[a.id]||0)-(caught[b.id]||0));});
   for(const t of targets){
    const before=await state();await p.touchscreen.tap(t.x,t.y);const after=await state();
    if(after.progress.charge===before.progress.charge+1){
     const last=await p.evaluate(()=>__c3LastCatch),toast=await p.locator('#toast').innerText();
     assert(toast.includes('星光 +1')&&toast.includes(after.progress.charge+' / 4'),'every catch shows its actual +1 and charge: '+JSON.stringify({toast,notices:await p.evaluate(()=>window.__c3Notices.slice(-5))}));
     if(after.progress.charge===4)assert(toast.includes('点亮星灯'),'full charge instruction survives a discovery');
     catches.push({...last,before:before.progress.charge,after:after.progress.charge,joy:after.progress.joys-before.progress.joys});return;
    }
   }
   await p.waitForTimeout(180);
  }throw Error('No reachable wisp');
 }
 // Choose lamp 3 first: the real rules allow any unlit lamp, regardless of its preferred colors.
 for(const index of [2,0,1]){
  while((await state()).progress.charge<4)await pick();
  const ready=await p.evaluate(()=>__c3Inspect.fx.map((f,i)=>({lit:__c3Inspect.J.lit(i),label:f.readyLabel.visible,halo:__c3Inspect.J.lamps[i].halo.scale.x})));
  assert(ready.every(f=>f.lit||f.label&&f.halo>=3.3),'every available lamp has the bright world label and large halo');
  if(index===2){
   await p.waitForTimeout(700);
   assert((await state()).xp>=60&&(await p.locator('#toast').innerText()).includes('点亮星灯'),'rank-up polling preserves the full-charge action notice');
   await p.screenshot({path:'output/playwright/healing-v94-chapter3-ready.png',scale:'css'});
   await p.setViewportSize({width:1280,height:800});await p.waitForTimeout(350);
   await p.screenshot({path:'output/playwright/healing-v94-chapter3-ready-desktop.png',scale:'css'});
   await p.setViewportSize({width:390,height:844});
   // Earned legacy collections put the crown above its real unlock threshold after this reload.
   await p.evaluate(()=>{
    localStorage.setItem('healingGarden.butterflies.v1',JSON.stringify({total:30,ended:true,caught:Object.fromEntries(__bf.species.map(s=>[s.id,1]))}));
    localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({level:3,total:20,ended:true,caught:Object.fromEntries(__kittens.kinds.map(s=>[s.id,1]))}));
   });
   await p.reload();await p.locator('#start').click();await p.waitForTimeout(200);
   await p.evaluate(()=>{window.__c3Island=GardenClip.world.island;});
   assert(await p.evaluate(()=>__c3Ornaments[2].visible),'unlocked crown visible during chapter 3');
   assert((await state()).progress.charge===4,'full charge survives reload');
  }
  const target=await p.evaluate(i=>{
   const h=__c3Inspect.H,v=new THREE.Vector3(0,2.45,0);__c3Inspect.J.lamps[i].g.localToWorld(v);v.project(h.camera);
   return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};
  },index);
  assert(await p.evaluate(pt=>document.elementFromPoint(pt.x,pt.y)?.tagName==='CANVAS',target),'ready world label is unobscured');
  await p.touchscreen.tap(target.x,target.y);
  assert((await state()).progress.lamps[index]&&(await state()).progress.charge===0,'world label lights requested lamp and spends exactly four');
  if(index!==1){
   await p.locator('#starLamp'+index).click();
   if(index===2)await p.evaluate(()=>__voyage.update(3.1,__voyage.state().clock+3.1));
   assert((await p.locator('#toast').innerText()).includes('已经亮了'),'already-lit feedback survives the pending boat announcement');
  }
 }
 assert(new Set(catches.map(s=>s.id)).size===6,'all six colors collected in twelve catches');
 assert(catches.some(s=>s.joy===0)&&catches.some(s=>s.joy===1),'preferred and ordinary colors both grant exactly one charge');
 assert(await p.evaluate(()=>!__c3Ornaments[2].visible),'crown clears immediately on third lamp');
 await p.locator('#starFinaleSkip').click();await p.locator('#starStay').click();
 const completed=await state();
 assert(completed.progress.decor[2]===true,'crown preference remains saved');
 await p.locator('#kitLevelBtn').click();
 assert((await p.locator('#journeyContent').innerText()).includes('V9.4'),'journal release version');
 await p.locator('[data-jr-go="1"]').click();
 assert(await p.evaluate(()=>!__c3Ornaments[2].visible),'crown absent outside chapter 3');
 await p.locator('#kitLevelBtn').click();await p.locator('[data-jr-go="3"]').click();
 assert(await p.evaluate(()=>!__c3Ornaments[2].visible&&GardenClip.world.island===__c3Island),'free play has no crown and preserves island identity');
 assert((await state()).xp===completed.xp&&(await state()).worldChildren===identity,'chapter switching preserves growth and scene allocations');
 await p.reload();await p.locator('#start').click();
 assert((await state()).progress.lamps.every(Boolean)&&!(await p.evaluate(()=>__c3Ornaments[2].visible)),'completed save restores with no crown');
 assert(await p.evaluate(()=>localStorage.getItem('xiantu_save'))==='KEEP','Xiantu save isolated');
 assert(!errors.length&&!external.length,JSON.stringify({errors,external}));
 checks.push('truthful entry / all colors +1 / fresh catch instruction / empty and invalid feedback / passive notice priority / any-order world lamps / charge reload / crown lifecycle / scene identity / saved preferences');
 await c.close();return{checks,catches,completed,errors,external};
 } catch(e) {
  const notices=await p.evaluate(()=>window.__c3Notices&&window.__c3Notices.slice(-8)).catch(()=>[]);
  await c.close();throw Error(e.message+'; recent notices='+JSON.stringify(notices));
 }
}
