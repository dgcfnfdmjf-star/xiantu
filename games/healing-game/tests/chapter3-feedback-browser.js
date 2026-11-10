async root => {
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)},browser=root.context().browser();
 const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p=await c.newPage(),errors=[],external=[],catches=[],checks=[];
 const TYPES=['dew','peach','amber','moon','violet','tide'],PREFS=[['peach','amber'],['dew','moon'],['violet','tide']];
 const preferred=progress=>PREFS[progress.lamps.indexOf(false)]||TYPES;
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{
  if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort();}
  if(r.request().resourceType()!=='document')return r.continue();
  const res=await r.fetch();let html=await res.text();
  // Read-only test observation stays in this response; gameplay still uses real pointer input.
  const edits=[['  function toast(msg, ms) {','  function toast(msg, ms) { (window.__c3Notices||(window.__c3Notices=[])).push({msg:msg,t:performance.now()});'],
   ['wisps = [], lamps = [], ornaments = []','wisps = [], lamps = [], ornaments = window.__c3Ornaments = []'],
   ['      addStyle(); prepareWisps(); buildLamps(); bindSwipes();','      addStyle(); prepareWisps(); buildLamps(); bindSwipes(); window.__c3Inspect={H:H,J:J,fx:lampFx};'],
   ['    S.caught[sp.id] = Math.min(99999, (S.caught[sp.id] || 0) + 1);','    window.__c3LastCatch={type:w.type,id:TYPES[w.type].id};\n    S.caught[sp.id] = Math.min(99999, (S.caught[sp.id] || 0) + 1);']];
  for(const [a,b]of edits){assert(html.includes(a),'inspection anchor missing: '+a);html=html.replace(a,b);}
  await r.fulfill({response:res,body:html});
 });
 await p.addInitScript(()=>{
  const schedule=window.setTimeout;
  window.setTimeout=function(fn,delay){if(delay===900&&typeof fn==='function'&&fn.toString().includes('星灯湾'))window.__c3Welcome=fn;return schedule.apply(window,arguments);};
  if(sessionStorage.getItem('chapter3-feedback'))return;sessionStorage.setItem('chapter3-feedback','1');
  localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('xiantu_save','KEEP');
  localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({level:3,total:20,ended:true}));
  localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2],lamps:[false,false,false],charge:0,decor:[true,true,true],seen:{flowers:['daisy','rose']}}));
 });
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/',state=()=>p.evaluate(()=>__journey.state());
 try {
 await p.goto(url);
 assert((await p.locator('#start').innerText()).includes('偏爱')&&!(await p.locator('#start').innerText()).includes('所有颜色每只都 +1'),'entry explains preferred-color scoring');
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
 async function targets(ids,slot){
  return p.evaluate(({ids,slot,TYPES})=>{const caught=__journey.state().progress.caught;return __c3Inspect.J.wisps.filter(w=>w.g.visible&&!w.cooldown&&w.fade>=.3&&(slot==null||w.slot===slot)&&ids.includes(TYPES[w.type])).map(w=>{const v=w.g.getWorldPosition(new THREE.Vector3()).project(__c3Inspect.H.camera);return{id:TYPES[w.type],type:w.type,slot:w.slot,x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,front:v.z<1};}).filter(t=>t.front&&t.x>10&&t.x<innerWidth-10&&t.y>230&&t.y<innerHeight-120&&document.elementFromPoint(t.x,t.y)?.tagName==='CANVAS'&&__level3fx.wispAt(t.x,t.y)?.slot===t.slot&&__level3fx.lampAt(t.x,t.y)<0).sort((a,b)=>(caught[a.id]||0)-(caught[b.id]||0));},{ids,slot,TYPES});
 }
 async function availability(){
  const progress=(await state()).progress,expected=preferred(progress),observed=await p.evaluate(()=>({voyage:__voyage.state(),types:__c3Inspect.J.wisps.map(w=>w.type)}));
  assert(observed.voyage.currentLamp===progress.lamps.indexOf(false),'current lamp is the first unlit lamp');
  if(progress.lamps.some(v=>!v))assert(expected.every(id=>observed.types.includes(TYPES.indexOf(id))),'both preferred colors remain available, including bounded respawn cooldowns');
 }
 async function wrongHits(){
  const progress=(await state()).progress,wrong=TYPES.filter(id=>!preferred(progress).includes(id));let target;
  for(let attempt=0;attempt<60&&!target;attempt++){target=(await targets(wrong))[0];if(!target)await p.waitForTimeout(150);}
  assert(target,'a non-preferred wisp is reachable');
  for(let repeat=0;repeat<3;repeat++){
   const current=(await targets(wrong,target.slot))[0];assert(current,'rejected wisp remains available for repeated taps');
   const before=await p.evaluate(slot=>({progress:__journey.state().progress,saved:localStorage.getItem('healingGarden.journey.v1'),wisp:__c3Inspect.J.wisps.filter(w=>w.slot===slot).map(w=>({type:w.type,cooldown:w.cooldown,visible:w.g.visible}))}),target.slot);
   await p.touchscreen.tap(current.x,current.y);
   const after=await p.evaluate(slot=>({progress:__journey.state().progress,saved:localStorage.getItem('healingGarden.journey.v1'),wisp:__c3Inspect.J.wisps.filter(w=>w.slot===slot).map(w=>({type:w.type,cooldown:w.cooldown,visible:w.g.visible}))}),target.slot);
   assert(JSON.stringify(after)===JSON.stringify(before),'wrong-color taps preserve all progress, saved state, type, cooldown and visibility');
   assert((await p.locator('#toast').innerText()).includes('不加分'),'wrong color receives gentle non-scoring feedback');
  }
 }
 async function pick(ids){
  for(let attempt=0;attempt<80;attempt++){
   const beforeTargets=(await state()).progress,allowed=ids||preferred(beforeTargets),list=await targets(allowed);
   for(const t of list){
    const before=await state();await p.touchscreen.tap(t.x,t.y);const after=await state();
    if(Object.values(after.progress.caught).reduce((a,b)=>a+b,0)===Object.values(before.progress.caught).reduce((a,b)=>a+b,0)+1){
     const last=await p.evaluate(()=>__c3LastCatch),toast=await p.locator('#toast').innerText();
     if(!before.progress.completed.includes(3)){
      assert(preferred(before.progress).includes(last.id),'only the current first-unlit lamp preference scores');
      assert(after.progress.charge===before.progress.charge+1&&after.progress.stars===before.progress.stars+1&&after.progress.joys===before.progress.joys+1,'accepted colors grant exactly one charge, sky star and joy');
      assert(toast.includes('星光 +1')&&toast.includes(after.progress.charge+' / 4'),'accepted catch shows its +1 and charge: '+JSON.stringify({toast,notices:await p.evaluate(()=>window.__c3Notices.slice(-5))}));
      if(after.progress.charge===4)assert(toast.includes('点亮星灯'),'full charge instruction survives a discovery');
      catches.push({...last,currentLamp:before.progress.lamps.indexOf(false),before:before.progress.charge,after:after.progress.charge,joy:after.progress.joys-before.progress.joys});
     }else assert(after.progress.charge===before.progress.charge&&after.progress.stars===before.progress.stars+1&&after.progress.joys===before.progress.joys,'completed free play collects any color without charging or preference bonuses');
     await availability();return last;
    }
   }
   await p.waitForTimeout(180);
  }throw Error('Preferred colors became unreachable or starved');
 }
 // Charging follows the first unlit lamp; spending four points still permits any unlit lamp.
 for(const index of [2,0,1]){
  await availability();await wrongHits();
  while((await state()).progress.charge<4)await pick();
  const fullBefore=(await state()).progress;let fullTarget;
  for(let attempt=0;attempt<60&&!fullTarget;attempt++){fullTarget=(await targets(preferred(fullBefore)))[0];if(!fullTarget)await p.waitForTimeout(150);}
  assert(fullTarget,'a preferred wisp respawns at full charge');
  await p.touchscreen.tap(fullTarget.x,fullTarget.y);assert(JSON.stringify((await state()).progress)===JSON.stringify(fullBefore),'full charge blocks collection and every reward');
  const ready=await p.evaluate(()=>__c3Inspect.fx.map((f,i)=>({lit:__c3Inspect.J.lit(i),label:f.readyLabel.visible,halo:__c3Inspect.J.lamps[i].halo.scale.x})));
  assert(ready.every(f=>f.lit||f.label&&f.halo>=3.3),'every available lamp has the bright world label and large halo');
  if(index===2){
   await p.waitForTimeout(700);
   assert((await state()).xp>=60&&/点亮星灯|点我点亮/.test(await p.locator('#toast').innerText()),'rank-up polling preserves the full-charge action notice');
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
  await availability();
  if(index!==1){
   await p.locator('#starLamp'+index).click();
   if(index===2)await p.evaluate(()=>__voyage.update(3.1,__voyage.state().clock+3.1));
   assert((await p.locator('#toast').innerText()).includes('已经亮了'),'already-lit feedback survives the pending boat announcement');
  }
 }
 assert(catches.length===12&&catches.every(s=>PREFS[s.currentLamp].includes(s.id)&&s.joy===1),'twelve accepted catches respect the changing current-lamp preferences');
 assert(catches.slice(0,8).every(s=>PREFS[0].includes(s.id))&&catches.slice(8).every(s=>PREFS[1].includes(s.id)),'lighting lamp 3 first preserves lamp 1 preference; lighting lamp 1 advances to lamp 2');
 assert(await p.evaluate(()=>!__c3Ornaments[2].visible),'crown clears immediately on third lamp');
 await p.locator('#starFinaleSkip').click();await p.locator('#starStay').click();
 await pick(['violet','tide']);
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
 checks.push('preferred-color scoring / repeated wrong-color non-mutation / available preferred targets / full charge blocks awards / free-play all colors / passive notice priority / any-order world lamps / charge reload / crown lifecycle / scene identity / saved preferences');
 await c.close();return{checks,catches,completed,errors,external};
 } catch(e) {
  const notices=await p.evaluate(()=>window.__c3Notices&&window.__c3Notices.slice(-8)).catch(()=>[]);
  await c.close();throw Error(e.message+'; recent notices='+JSON.stringify(notices));
 }
}
