async root => {
 const assert=(v,m)=>{if(!v)throw Error(m)}, browser=root.context().browser(), checks=[];
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/';
 for(const mode of ['success','http','decode','timeout','late']) {
  const c=await browser.newContext(); const p=await c.newPage(), errors=[];p.on('pageerror',e=>errors.push(e.message));
  let release; const gate=new Promise(r=>release=r);
  if(mode!=='success')await p.route('**/nightvoyage-bgm.mp3',async r=>{
   if(mode==='http')return r.fulfill({status:404,body:'missing'});
   if(mode==='decode')return r.fulfill({status:200,body:'broken mp3'});
   await gate; return r.continue();
  });
  if(mode==='timeout')await p.addInitScript(()=>{const original=window.setTimeout;window.setTimeout=function(fn,ms,...args){return original(fn,ms===15000?150:ms,...args)};});
  await p.addInitScript(()=>{
   localStorage.setItem('hg_level2_unlocked','1');
   localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:3}));
   localStorage.setItem('healingGarden.journey.v1',JSON.stringify({lamps:[true,true,true],completed:[1,2,3]}));
   window.requestAnimationFrame=()=>0;
   window.audioProbe={sources:[],pads:0};
   const proto=AudioContext.prototype, orig=proto.createBufferSource;
   proto.createBufferSource=function(){const s=orig.call(this), start=s.start.bind(s),stop=s.stop.bind(s),connect=s.connect.bind(s);
    s.connect=function(dest){s.probeDest=dest;return connect(dest)};
    s.start=function(){if(s.buffer?.duration>80){audioProbe.sources.push(s);s.probeStarted=true}return start(...arguments)};
    s.stop=function(){s.probeStopped=true;return stop(...arguments)};return s;};
  });
  await p.goto(url);
  assert(await p.evaluate(()=>audioProbe.sources.length===0 && GardenAudio.context()===null),'no audio before gesture');
  await p.evaluate(()=>{const pad=GardenAudio.kit.pad;GardenAudio.kit.pad=function(){audioProbe.pads++;return pad(...arguments)};});
  await p.locator('#start').click();
  if(mode==='late'){
   await p.waitForTimeout(150); await p.evaluate(()=>__kittens.setLevel(4,false)); release();
   await p.waitForTimeout(800);assert(await p.evaluate(()=>audioProbe.sources.length===0),'late decode cannot start after leaving');
   await p.evaluate(()=>__kittens.setLevel(3,false));
  }
  if(mode==='http'||mode==='decode'||mode==='timeout'){
   await p.waitForFunction(()=>audioProbe.pads>0,null,{polling:50});
   assert(await p.evaluate(()=>audioProbe.sources.length===0),'failure falls back to synth');checks.push(mode+' fallback');
  }else{
   await p.waitForFunction(()=>audioProbe.sources.length===1,null,{polling:50});
   const unchanged=await p.evaluate(()=>{const track=GardenAudio.currentTrackName();__musicLush.setStyle('classic');__musicLush.setStyle('lush');return {track,sources:audioProbe.sources.length,same:track===GardenAudio.currentTrackName(),theme:__music2.theme[3]};});
   assert(unchanged.same&&unchanged.theme==='nightvoyage'&&unchanged.sources===1,'style switch leaves chapter 3 recording untouched');
   const details=await p.evaluate(()=>{const s=audioProbe.sources[0];s.playbackRate.value=40;return {loop:s.loop,end:s.loopEnd,duration:s.buffer.duration,gain:s.probeDest.gain.value};});
   assert(details.loop&&details.end===details.duration&&details.gain>1,'sample loops with compensated gain');
   await p.waitForTimeout(2500);
   assert(await p.evaluate(()=>audioProbe.sources.length===1&&!audioProbe.sources[0].probeStopped),'one source crosses loop boundary');
   await p.locator('#btnMusic').click();assert(await p.evaluate(()=>audioProbe.sources[0].probeStopped),'toggle stops recording');
   await p.waitForTimeout(1100); await p.locator('#btnMusic').click();
   await p.waitForFunction(()=>audioProbe.sources.length===2,null,{polling:50});
   for(const n of [1,2,4]){
    await p.evaluate(n=>__kittens.setLevel(n,false),n);
    assert(await p.evaluate(()=>audioProbe.sources.every(s=>s.probeStopped)),'leaving stops MP3 for level '+n);
    const prior=await p.evaluate(()=>audioProbe.sources.length);
    await p.evaluate(()=>GardenAudio.setTrack(__music2.tracks.find(t=>t.id==='nightvoyage').index));
    await p.waitForTimeout(200);assert(await p.evaluate(n=>audioProbe.sources.length===n,prior),'manual night theme outside level 3 stays synthesized');
    await p.evaluate(()=>__kittens.setLevel(3,false));await p.waitForFunction(()=>audioProbe.sources.some(s=>!s.probeStopped),null,{polling:50});
   }
   await p.evaluate(()=>GardenAudio.setMusic(false)); await p.evaluate(()=>__kittens.setLevel(4,false));await p.evaluate(()=>__kittens.setLevel(3,false));
   const count=await p.evaluate(()=>audioProbe.sources.length);await p.waitForTimeout(500);
   assert(await p.evaluate(n=>audioProbe.sources.length===n,count),'muted entry stays silent');checks.push(mode+' lifecycle / unlock / toggle / all exits / loop boundary');
  }
  assert(errors.length===0,errors.join('\n'));release();await c.close();
 }
 return checks;
}
