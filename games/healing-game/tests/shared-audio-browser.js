async root=>{
 const b=root.context().browser(),assert=(v,m)=>{if(!v)throw Error(m)},checks=[];
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/';
 // The filename remains stable for existing runners. Chapters 3 and 5 share
 // the audio transport, but only chapter 3 may play the supplied recording.
 for(const mode of ['success','http','late']){
  const c=await b.newContext(),p=await c.newPage(),errors=[];let loads=0,release;
  const gate=new Promise(r=>release=r);
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/nightvoyage-bgm.mp3',async r=>{
   loads++;if(mode==='http')return r.fulfill({status:404,body:'missing'});
   if(mode==='late')await gate;return r.continue();
  });
  await p.addInitScript(()=>{
   window.requestAnimationFrame=()=>0;
   window.probe={sources:[],notes:{},players:{},active:null,decoded:0,scoreErrors:[]};
   localStorage.setItem('hg_level2_unlocked','1');
   localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:5}));
   localStorage.setItem('healingGarden.journey.v1',JSON.stringify({lamps:[true,true,true],completed:[1,2,3],chimes:{round:3}}));
   const proto=AudioContext.prototype,create=proto.createBufferSource,osc=proto.createOscillator,decode=proto.decodeAudioData;
   proto.createBufferSource=function(){const s=create.call(this),start=s.start.bind(s),stop=s.stop.bind(s);
    s.start=function(){if(s.buffer?.duration>80)probe.sources.push(s);return start(...arguments)};
    s.stop=function(){s.stopped=true;return stop(...arguments)};return s;};
   proto.createOscillator=function(){const o=osc.call(this),start=o.start.bind(o);
    o.start=function(){const result=start(...arguments);if(probe.active)probe.notes[probe.active]=(probe.notes[probe.active]||0)+1;return result};return o;};
   proto.decodeAudioData=function(){return decode.apply(this,arguments).then(buffer=>{probe.decoded++;return buffer})};
  });
  try{
   await p.goto(url);
   assert(await p.evaluate(()=>GardenAudio.context()===null&&probe.sources.length===0),'fifth does not autoplay');
   assert(loads===0,'fifth does not fetch chapter 3 music before a gesture');
   const score=await p.evaluate(()=>{
    const moon=__music2.tracks.find(t=>t.id==='moonlotus'),night=__music2.tracks.find(t=>t.id==='nightvoyage');
    const result={theme:__music2.theme[5],name:moon.name,recording:!!moon.recording,distinct:moon.play!==night.play&&JSON.stringify(moon.mel)!==JSON.stringify(night.mel)};
    for(const tr of [moon,night]){const play=tr.play;probe.players[tr.id]=[];
     tr.play=function(t,s,bar,ch,sd,player){if(!probe.players[tr.id].includes(player))probe.players[tr.id].push(player);probe.active=tr.id;
      try{return play.apply(this,arguments)}catch(e){probe.scoreErrors.push(e.message);throw e}finally{probe.active=null}};
    }return result;
   });
   assert(score.theme==='moonlotus'&&score.name==='月汐摇光'&&!score.recording&&score.distinct,'fifth has its own named composition');
   await p.locator('#start').click();
   await p.waitForFunction(()=>probe.notes.moonlotus>0,null,{polling:50});
   assert(loads===0&&await p.evaluate(()=>probe.sources.length===0),'fifth synthesizes without loading chapter 3 recording');
   assert(await p.evaluate(()=>GardenAudio.currentTrackName()==='月汐摇光'),'fifth music label names its own score');
   await p.evaluate(()=>{__musicLush.setStyle('classic');__musicLush.setStyle('lush');});
   await p.waitForTimeout(100);
   assert(await p.evaluate(()=>probe.players.moonlotus.length===1&&probe.players.moonlotus[0].until===Infinity&&GardenAudio.currentTrackName()==='月汐摇光'),'style changes preserve the fifth player and music label');

   await p.evaluate(()=>__kittens.setLevel(3));
   assert(await p.evaluate(()=>probe.players.moonlotus[0].until!==Infinity&&GardenAudio.currentTrackName()==='星灯夜曲'),'third retires the fifth score and restores its own label');
   if(mode==='late'){
    await p.waitForFunction(()=>__kittens.state().level===3);await p.waitForTimeout(100);
    assert(loads===1,'third requests its recording');
    await p.evaluate(()=>__kittens.setLevel(5));release();
    await p.waitForFunction(()=>probe.decoded===1,null,{polling:50});await p.waitForTimeout(150);
    assert(await p.evaluate(()=>probe.sources.length===0&&GardenAudio.currentTrackName()==='月汐摇光'),'late third decode cannot play over fifth');
    await p.evaluate(()=>__kittens.setLevel(3));
   }
   if(mode==='http'){
    await p.waitForFunction(()=>probe.notes.nightvoyage>0,null,{polling:50});
    assert(await p.evaluate(()=>probe.sources.length===0),'third request failure uses the original synth fallback');
   }else{
    await p.waitForFunction(()=>probe.sources.length===1,null,{polling:50});
    assert(await p.evaluate(()=>probe.sources[0].loop&&!probe.sources[0].stopped),'third retains its looping recording');
   }
   const beforeReturn=await p.evaluate(()=>probe.players.moonlotus.length);
   await p.evaluate(()=>__kittens.setLevel(5));
   assert(await p.evaluate(()=>probe.sources.every(s=>s.stopped)),'leaving third stops every recording source');
   await p.waitForFunction(n=>probe.players.moonlotus.length>n,beforeReturn,{polling:50});
   assert(loads===1&&await p.evaluate(()=>GardenAudio.currentTrackName()==='月汐摇光'),'fifth return keeps independent music without another MP3 fetch');
   if(mode!=='http'){
    await p.evaluate(()=>__kittens.setLevel(3));await p.waitForFunction(()=>probe.sources.length===2,null,{polling:50});
    assert(loads===1,'third reuses its decoded recording');
    await p.evaluate(()=>__kittens.setLevel(5));assert(await p.evaluate(()=>probe.sources.every(s=>s.stopped)),'repeated third exit stops recording');
   }

   // Allow the existing gentle music fade to finish before testing silence.
   await p.locator('#btnMusic').click();await p.waitForTimeout(1200);
   const muted=await p.evaluate(()=>({notes:probe.notes.moonlotus,players:probe.players.moonlotus.length,sources:probe.sources.length}));
   await p.evaluate(()=>{__kittens.setLevel(4);__kittens.setLevel(5);});await p.waitForTimeout(250);
   assert(await p.evaluate(v=>!GardenAudio.isMusicOn()&&probe.notes.moonlotus===v.notes&&probe.players.moonlotus.length===v.players&&probe.sources.length===v.sources,muted),'music off and muted chapter entry schedule no new fifth music');
   await p.locator('#btnMusic').click();
   await p.waitForFunction(n=>probe.notes.moonlotus>n,muted.notes,{polling:50});
   assert(await p.evaluate(n=>probe.players.moonlotus.length>n&&GardenAudio.currentTrackName()==='月汐摇光',muted.players),'music toggle resumes the fifth composition');
   await p.locator('#btnSfx').click();const beforeSfx=await p.evaluate(()=>probe.notes.moonlotus);
   await p.waitForFunction(n=>probe.notes.moonlotus>n,beforeSfx,{polling:50});
   assert(await p.evaluate(()=>!GardenAudio.isSfxOn()&&GardenAudio.isMusicOn()&&probe.sources.every(s=>s.stopped)),'SFX toggle leaves fifth music playing without chapter 3 recorded ambience');
   assert(await p.evaluate(()=>probe.scoreErrors.length===0),'fifth score never fails silently in the scheduler');
   assert(!errors.length,errors.join(';'));
   checks.push(mode+' / dedicated fifth synth / gesture / labels / style / 3-to-5 lifecycle / toggle / muted entry / SFX isolation');
  }finally{release();await c.close();}
 }
 return checks;
}
