async root=>{
 const b=root.context().browser(),assert=(v,m)=>{if(!v)throw Error(m)},checks=[];
 for(const mode of ['finale','gesture']){
  const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1')throw Error('External request');if(r.request().resourceType()!=='document')return r.continue();const response=await r.fetch();let body=await response.text();body=body.replace('render();pose(0,0);','window.__trail={H,mote,beacons,boat,lanterns,drag:()=>drag};render();pose(0,0);');await r.fulfill({response,body});});
  await p.addInitScript(mode=>{localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:5}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2,3],lamps:[true,true,true],chimes:{round:3},lotus:{light:mode==='finale'?[3,3,3,3,3,2]:[3,3,0,0,0,0]}}));},mode);
  await p.goto('http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/');await p.locator('#start').click();
  if(mode==='finale'){
   const xp=await p.evaluate(()=>__journey.state().xp);await p.locator('#lotusNote1').click();assert(await p.locator('#lotusSkip').isVisible(),'final procession starts');
   await p.waitForFunction(()=>!document.getElementById('lotusEnding').hidden,null,{timeout:90000});
   assert(await p.evaluate(()=>__trail.boat.visible&&__trail.lanterns.every(l=>!l.visible)),'natural ending leaves a settled, clear scene');assert(await p.evaluate(()=>__journey.state().xp)===xp+25,'legacy partial save gets only its missing awards');
   await p.locator('#lotusStay').click();await p.locator('#lotusFinale').click();await p.locator('#lotusSkip').click();assert(await p.evaluate(()=>__journey.state().xp)===xp+25,'replayed finale cannot award twice');checks.push('natural finale / settled actors / legacy reward / finale replay');
  }else{
   await p.waitForTimeout(200);const a=await p.evaluate(()=>{const v=__trail.mote.getWorldPosition(new THREE.Vector3()).project(__trail.H.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}}),cdp=await c.newCDPSession(p);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:0,x:a.x,y:a.y}]});assert(await p.evaluate(()=>__trail.drag()!==null),'touch catches trail');
   const target=await p.evaluate(()=>{const v=__trail.beacons[0].getWorldPosition(new THREE.Vector3()).project(__trail.H.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:0,x:a.x,y:a.y},{id:1,x:target.x,y:target.y}]});assert(await p.evaluate(()=>__trail.drag()===null),'second finger cancels light dragging');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(await p.evaluate(()=>__journey.state().progress.lotus.light[2]===0),'pinch awards no accidental waypoint');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:0,x:a.x,y:a.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert(await p.evaluate(()=>__trail.drag()===null),'cancel clears pointer capture state');
   for(const i of [0,1,2])await p.locator('#lotusGuide'+i).click();assert(await p.evaluate(()=>__journey.state().progress.lotus.light[2]===3),'button route remains available after gesture cancel');checks.push('touch capture / pinch separation / cancellation / accessible guide route');
  }
  assert(!errors.length,errors.join(';'));await c.close();
 }
 return checks;
}
