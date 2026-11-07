// Offline-renders each score through the real engine graph: levels, clicks, voice counts, crossfade, render speed.
// Writes listening copies to output/playwright/music/. Serve the repo at 127.0.0.1:8784/xiantu/ as the other browser tests do.
async root => {
 const browser=root.context().browser();for(const c of browser.contexts())if(c!==root.context())await c.close();
 const SR=44100,url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/',results={},errors=[];
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
 const render=async(name,first,seconds,then)=>{
  const c=await browser.newContext({acceptDownloads:true});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(([SR,seconds])=>{
   window.requestAnimationFrame=()=>0;let seed=12345;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
   const off=new OfflineAudioContext(2,SR*seconds,SR);window.__off=off;window.AudioContext=window.webkitAudioContext=function(){return off};
   const si=window.setInterval;window.setInterval=function(f,d){if(d===25&&f.name==='schedule'&&!window.__tick){window.__tick=f;return 1}return si.apply(this,arguments)};
  },[SR,seconds]);
  await p.goto(url);
  const m=await p.evaluate(async([first,seconds,then,name])=>{
   __music2.play(first);const off=__off,step=.05;let peakLive=0,steps=0,tickMs=0,maxTick=0;
   for(let t=step;t<seconds;t+=step){off.suspend(t).then(()=>{const a=performance.now();__tick();const d=performance.now()-a;tickMs+=d;if(d>maxTick)maxTick=d;steps++;
     if(window.__musicLush)peakLive=Math.max(peakLive,__musicLush.live());
     if(then&&Math.abs(off.currentTime-then[0])<step/2&&!window.__sw){window.__sw=1;__music2.play(then[1])}
     off.resume()})}
   const t0=performance.now(),buf=await off.startRendering(),ms=performance.now()-t0,L=buf.getChannelData(0),R=buf.getChannelData(1),win=buf.sampleRate*2;
   let peak=0,jump=0,sum=0,rms=[];
   for(let i=0;i<L.length;i++){const a=Math.abs(L[i]),b=Math.abs(R[i]);if(a>peak)peak=a;if(b>peak)peak=b;if(i){const j=Math.abs(L[i]-L[i-1]);if(j>jump)jump=j}sum+=L[i]*L[i]+R[i]*R[i];
    if((i+1)%win===0){rms.push(+(10*Math.log10(sum/(2*win)+1e-12)).toFixed(1));sum=0}}
   let sumLR=0,l2=0,r2=0;for(let i=buf.sampleRate*10;i<L.length;i+=3){sumLR+=L[i]*R[i];l2+=L[i]*L[i];r2+=R[i]*R[i]}
   const pcm=new Int16Array(L.length*2);for(let i=0;i<L.length;i++){pcm[2*i]=Math.max(-1,Math.min(1,L[i]))*32767;pcm[2*i+1]=Math.max(-1,Math.min(1,R[i]))*32767}
   const head=new DataView(new ArrayBuffer(44));[[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']].forEach(([o,s])=>{for(let i=0;i<4;i++)head.setUint8(o+i,s.charCodeAt(i))});
   head.setUint32(4,36+pcm.byteLength,true);head.setUint32(16,16,true);head.setUint16(20,1,true);head.setUint16(22,2,true);head.setUint32(24,buf.sampleRate,true);head.setUint32(28,buf.sampleRate*4,true);head.setUint16(32,4,true);head.setUint16(34,16,true);head.setUint32(40,pcm.byteLength,true);
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([head.buffer,pcm],{type:'audio/wav'}));a.download=name+'.wav';window.__dl=a;
   return{track:GardenAudio.currentTrackName(),peak:+peak.toFixed(3),jump:+jump.toFixed(3),correlation:+(sumLR/Math.sqrt(l2*r2+1e-20)).toFixed(3),speed:+(seconds*1000/ms).toFixed(1),peakLive,maxTickMs:+maxTick.toFixed(1),rms};
  },[first,seconds,then,name]);
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>__dl.click())]);await dl.saveAs('output/playwright/music/'+name+'.wav');
  await c.close();results[name]=m;return m;
 };
 for(const id of ['dreamy','cozy','nightvoyage','morningchimes']){
  const m=await render(id,id,100);
  assert(m.peak<1,id+' clips');assert(Math.min(...m.rms.slice(2))>-45,id+' falls silent');assert(m.peakLive<=40,id+' voices');
 }
 await render('dreamy_classic','dreamy_classic',40);
 await render('cozy_classic','cozy_classic',40);
 // Every loop variation must run: the engine swallows errors thrown by a track's play().
 const c=await browser.newContext();const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 results.form=await p.evaluate(()=>{GardenAudio.unlock();GardenAudio.setMusic(false);const K=GardenAudio.kit,out={};
  for(const id of ['dreamy','cozy','nightvoyage','morningchimes']){const tr=__music2.tracks.find(d=>d.id===id),sd=60/tr.bpm/4,len=tr.mel.length;
   for(let loop=0;loop<6;loop++){const p={out:K.gain(0),loop},t0=GardenAudio.context().currentTime+1;
    for(let b=0;b<len;b++)for(let s=0;s<16;s++)tr.play(t0+(b*16+s)*sd,s,b+loop*len,{notes:[60,64,67,71,74],bass:36},sd,p)}
   out[id]={seconds:+(len*16*sd).toFixed(1),bars:len}}
  return out});await c.close();
 for(const id in results.form)assert(results.form[id].seconds>=60,id+' form too short');
 await render('dreamy_long','dreamy',300);
 assert(results.dreamy_long.peak<1&&results.dreamy_long.peakLive<=40&&Math.min(...results.dreamy_long.rms.slice(2))>-45,'long run');
 const x=await render('crossfade','dreamy',44,[24,'cozy']);
 assert(x.track==='小猫午后'&&x.peak<1,'crossfade');assert(!errors.length,errors.join());
 return results;
}
