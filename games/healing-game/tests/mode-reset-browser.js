async root => {
 // Audit #2: levels 4/5 hide #modes, so a plant/lantern/firefly mode left over from levels 1-3 must be reset to net.
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
 const browser=root.context().browser();for(const c of browser.contexts())if(c!==root.context())await c.close();
 const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await c.newPage(),errors=[],external=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{
  if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort()}
  if(r.request().resourceType()!=='document')return r.continue();
  const res=await r.fetch();let html=await res.text();
  // Inspection only in this intercepted test response, absent from the release.
  html=html.replace("  var mode = 'net';","  var mode = 'net'; window.__mode=function(){return mode;};");
  html=html.replace('  function plantFlower(lx, lz, forceSp) {','  function plantFlower(lx, lz, forceSp) { window.__plantCalls=(window.__plantCalls||0)+1;');
  html=html.replace('  if (window.GardenPlay) window.GardenPlay.init({','  window.__t={camera:camera,island:island,TOP_Y:TOP_Y,canPlant:canPlant,lanterns:function(){return lanterns.length;}};\n  if (window.GardenPlay) window.GardenPlay.init({');
  await r.fulfill({response:res,body:html});
 });
 await p.addInitScript(()=>{if(sessionStorage.getItem('fixture-mode'))return;sessionStorage.setItem('fixture-mode','yes');localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:3}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({caught:{dew:2,peach:2,amber:2,moon:2,violet:2,tide:2},lamps:[true,true,true],completed:[1,2,3,4],chimes:{round:3}}));});
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/';
 const st=()=>p.evaluate(()=>__journey.state());
 await p.goto(url);await p.locator('#start').click();await p.waitForTimeout(400);
 assert((await st()).level===3,'fixture starts on third chapter');
 await p.evaluate(()=>document.querySelector('#modes button[data-mode="plant"]').click());
 assert(await p.evaluate(()=>__mode())==='plant','plant mode selected on third chapter');
 // An empty grass point far from the pond, tree, cat and bells, projected to the screen.
 const spot=await p.evaluate(()=>{const T=THREE,cands=[[-3,1.2],[-2.6,2.2],[-3.4,-.6],[-1.8,3],[2.8,2.4],[-2.2,-2.6]];
  for(const [x,z] of cands){if(__t.canPlant(x,z))continue;const v=new T.Vector3(x,__t.TOP_Y,z);__t.island.localToWorld(v);v.project(__t.camera);const sx=(v.x+1)*innerWidth/2,sy=(1-v.y)*innerHeight/2;
   const el=document.elementFromPoint(sx,sy);if(el&&el.tagName==='CANVAS')return{x,z};}return null;});
 assert(spot,'found an empty grass point');
 const screen=()=>p.evaluate(s=>{const v=new THREE.Vector3(s.x,__t.TOP_Y,s.z);__t.island.localToWorld(v);v.project(__t.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}},spot);
 const snap=()=>p.evaluate(()=>({calls:window.__plantCalls||0,count:__garden.count(),lanterns:__t.lanterns(),saved:JSON.parse(localStorage.getItem('healingGarden.v3')||'{"flowers":[]}').flowers.length}));
 await p.locator('#kitLevelBtn').click();await p.locator('[data-jr-go="4"]').click();await p.waitForTimeout(700);
 assert((await st()).level===4,'entered fourth chapter');
 assert(await p.evaluate(()=>__mode())==='net','fourth chapter resets hidden mode to net');
 assert(await p.evaluate(()=>document.querySelector('#modes button.on').getAttribute('data-mode'))==='net','net button marked on');
 let before=await snap(),pt=await screen();await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(500);let after=await snap();
 assert(after.calls===before.calls&&after.count===before.count&&after.saved===before.saved,'fourth chapter empty tap plants nothing: '+JSON.stringify([before,after]));
 assert(after.lanterns===before.lanterns,'fourth chapter empty tap releases no lantern');
 checks.push('3(plant) -> 4: mode net, empty tap plants nothing');
 // Control: the same tap with the hidden plant mode forced back on does reach plantFlower, so the check above is meaningful.
 await p.evaluate(()=>document.querySelector('#modes button[data-mode="plant"]').click());
 before=await snap();await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(500);after=await snap();
 assert(after.calls===before.calls+1,'control: forced plant mode plants at this point');
 checks.push('control: tap point reaches plantFlower in plant mode');
 // V5 setLevel already clicks the net button on every switch; GardenJourney.onLevel must also reset on its own
 // for 4/5 so a path that skips setLevel cannot leave a hidden mode on. Fails without the resetMode hook.
 await p.evaluate(()=>GardenJourney.onLevel(4));
 assert(await p.evaluate(()=>__mode())==='net','GardenJourney.onLevel(4) alone resets hidden mode');
 checks.push('GardenJourney.onLevel(4) resets mode without V5 setLevel');
 await p.evaluate(()=>__kittens.setLevel(3));await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('#modes button[data-mode="lantern"]').click());
 await p.evaluate(()=>__kittens.setLevel(5));await p.waitForTimeout(700);
 assert((await st()).level===5,'entered fifth chapter');
 assert(await p.evaluate(()=>__mode())==='net','fifth chapter resets hidden mode to net');
 before=await snap();pt=await screen();await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(500);after=await snap();
 assert(after.calls===before.calls&&after.count===before.count&&after.lanterns===before.lanterns,'fifth chapter empty tap writes nothing: '+JSON.stringify([before,after]));
 checks.push('3(lantern) -> 5: mode net, empty tap plants/releases nothing');
 assert(!errors.length,'page errors: '+errors.join(';'));assert(!external.length,'external assets');await c.close();return{checks,errors,external};
}
