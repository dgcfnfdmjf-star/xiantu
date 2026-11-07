async root=>{
 const b=root.context().browser(),assert=(v,m)=>{if(!v)throw Error(m)},checks=[];
 for(const fail of [false,true]){
  const c=await b.newContext(),p=await c.newPage(),errors=[];let loads=0;
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/nightvoyage-bgm.mp3',r=>{loads++;return fail?r.fulfill({status:404,body:'missing'}):r.continue();});
  await p.addInitScript(()=>{
   window.requestAnimationFrame=()=>0;window.probe={sources:[],pads:0};
   localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:5}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({lamps:[true,true,true],completed:[1,2,3],chimes:{round:3}}));
   const create=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){const s=create.call(this),start=s.start.bind(s),stop=s.stop.bind(s);s.start=function(){if(s.buffer?.duration>80)probe.sources.push(s);return start(...arguments)};s.stop=function(){s.stopped=true;return stop(...arguments)};return s;};
  });
  await p.goto('http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/');
  assert(await p.evaluate(()=>GardenAudio.context()===null&&probe.sources.length===0),'fifth does not autoplay');
  await p.evaluate(()=>{const pad=GardenAudio.kit.pad;GardenAudio.kit.pad=function(){probe.pads++;return pad(...arguments)};});await p.locator('#start').click();
  if(fail){await p.waitForFunction(()=>probe.pads>0,null,{polling:50});await p.evaluate(()=>__kittens.setLevel(3));await p.waitForTimeout(100);assert(await p.evaluate(()=>probe.sources.length===0),'both chapters fall back to original synth');checks.push('shared synth fallback');}
  else{
   await p.waitForFunction(()=>probe.sources.length===1,null,{polling:50});assert(await p.evaluate(()=>probe.sources[0].loop),'fifth uses looping recording');
   await p.evaluate(()=>{__musicLush.setStyle('classic');__musicLush.setStyle('lush');});await p.waitForTimeout(100);assert(await p.evaluate(()=>probe.sources.length===1&&!probe.sources[0].stopped),'style does not restart fifth');
   await p.evaluate(()=>__kittens.setLevel(3));assert(await p.evaluate(()=>probe.sources[0].stopped),'fifth stops on exit to third');await p.waitForFunction(()=>probe.sources.length===2,null,{polling:50});
   await p.evaluate(()=>__kittens.setLevel(5));assert(await p.evaluate(()=>probe.sources[1].stopped),'third stops on exit to fifth');await p.waitForFunction(()=>probe.sources.length===3,null,{polling:50});assert(loads===1,'one shared fetch and decoded buffer');
   await p.locator('#btnMusic').click();assert(await p.evaluate(()=>probe.sources[2].stopped),'fifth toggle stops');await p.evaluate(()=>__kittens.setLevel(4));await p.evaluate(()=>__kittens.setLevel(5));await p.waitForTimeout(200);assert(await p.evaluate(()=>probe.sources.length===3),'fifth muted entry silent');
   await p.locator('#btnMusic').click();await p.waitForFunction(()=>probe.sources.length===4,null,{polling:50});checks.push('gesture / loop / style isolation / 3-to-5 transitions / one fetch / toggle / muted entry');
  }
  assert(!errors.length,errors.join(';'));await c.close();
 }
 return checks;
}
