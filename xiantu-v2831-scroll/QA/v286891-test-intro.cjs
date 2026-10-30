'use strict';
// Behavioral tests of the shipped intro controller; no network or player saves.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'game-v2762.html'),'utf8'),src=html.match(/<script id="xiantu-intro-v2860">([\s\S]*?)<\/script>/)[1];
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function world({seen=false,skip=false,saveData=false,reduced=false,width=390,network='4g',blocked=false,denied=false}={}){
 let now=0,next=0;const timers=new Map(),events={},requests=[],store=new Map(),els={};
 if(seen)store.set('xiantu_intro_seen_v286891','1');if(skip)store.set('xiantu_skip_intro_v2898','1');
 function el(id){const listeners={},classes=new Set();return {id,hidden:true,checked:false,muted:true,textContent:'',attrs:{},listeners,classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:v=>classes.has(v)},addEventListener:(k,f)=>(listeners[k]??=new Set()).add(f),removeEventListener:(k,f)=>listeners[k]?.delete(f),fire(k){for(const f of [...(listeners[k]||[])])f({});},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this[k];},plays:0,pauses:0,play(){this.plays++;requests.push(this.src);return denied?Promise.reject(Object.assign(Error('blocked'),{name:'NotAllowedError'})):Promise.resolve();},pause(){this.pauses++;},load(){},click(){this.onclick?.();}};}
 for(const id of ['introVideoV2860','introPanelV2860','xiantuSafeBoot','introSkipV2860','introSoundV2860','introSkipChoiceV2898','introEnterV286891','introReplayV286891'])els[id]=el(id);
 const context={document:{getElementById:id=>els[id]},localStorage:{getItem(k){if(blocked)throw Error('storage blocked');return store.get(k)||null;},setItem(k,v){if(blocked)throw Error('storage blocked');store.set(k,v);}},navigator:{connection:{saveData,effectiveType:network}},innerWidth:width,matchMedia:()=>({matches:reduced}),addEventListener:(k,f)=>events[k]=f,setTimeout:(f,ms)=>{timers.set(++next,{f,at:now+ms});return next;},clearTimeout:id=>timers.delete(id),Promise};context.window=context;
 vm.runInNewContext(src,context);
 function tick(ms){const end=now+ms;for(;;){const row=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!row)break;now=row[1].at;timers.delete(row[0]);row[1].f();}now=end;}
 return {I:context.XiantuIntroV2860,E:els,video:els.introVideoV2860,store,requests,events,timers,tick};
}
(async()=>{
 for(const reason of ['skip','enter','ended']){
  const w=world(),p=w.I.start();a.equal(w.I.start(),p);a.equal(w.requests.length,1);a.equal(w.requests[0],'./intro-v286891-360.mp4');a(!w.E.introPanelV2860.hidden);
  w.video.fire('playing');a(w.E.introEnterV286891.hidden);w.I.ready();a(!w.E.introEnterV286891.hidden);a(w.E.introReplayV286891.hidden);
  w.E.introSoundV2860.click();a.equal(w.video.muted,false);a.equal(w.E.introSoundV2860.attrs['aria-pressed'],'true');
  if(reason==='ended')w.video.fire('ended');else w.E[reason==='skip'?'introSkipV2860':'introEnterV286891'].click();
  a(w.E.xiantuSafeBoot.classList.contains('intro-fading'));w.tick(250);await p;
  a(w.E.introPanelV2860.hidden);a.equal(w.store.get('xiantu_intro_seen_v286891'),'1');a.equal(w.video.src,undefined);a.equal(w.timers.size,0);a.equal(w.video.pauses,1);
 }
 for(const options of [{seen:true},{skip:true},{saveData:true},{reduced:true}]){
  const w=world(options);await w.I.start();a.equal(w.requests.length,0);a(w.E.introPanelV2860.hidden);a(!w.E.introReplayV286891.hidden);
  w.E.introReplayV286891.click();a.equal(w.requests.length,1);let resolved=false;w.I.wait().then(()=>resolved=true);await flush();a(!resolved);
  w.I.ready();w.E.introEnterV286891.click();w.tick(250);await flush();a(resolved);a(w.E.introReplayV286891.hidden);
  w.E.introReplayV286891.click();a.equal(w.requests.length,1,'cannot replay after ready');
 }
 {const w=world({width:844});w.I.start();a.equal(w.requests[0],'./intro-v2860.mp4');const stale=[...w.video.listeners.error][0];w.video.fire('error');a.equal(w.requests[1],'./intro-v286891-360.mp4');stale();a.equal(w.requests.length,2);w.video.fire('error');await w.I.wait();a(!w.store.has('xiantu_intro_seen_v286891'));a.equal(w.timers.size,0);}
 {const w=world({width:844,network:'3g'});w.I.start();a.equal(w.requests[0],'./intro-v286891-360.mp4');w.I.dispose();await w.I.wait();}
 for(const reason of ['startup','stall','deadline','pagehide','denied','dispose-fading','blocked']){
  const w=world({denied:reason==='denied',blocked:reason==='blocked'});let resolved=false;w.I.start().then(()=>resolved=true);
  if(reason==='startup'){w.tick(3400);await flush();a(!resolved);w.tick(100);}
  if(reason==='stall'){w.video.fire('playing');w.video.fire('waiting');w.tick(7900);await flush();a(!resolved);w.tick(100);}
  if(reason==='deadline'){w.video.fire('playing');w.tick(45000);}
  if(reason==='pagehide')w.events.pagehide();
  if(reason==='dispose-fading'){w.video.fire('playing');w.E.introSkipV2860.click();w.I.dispose();}
  if(reason==='blocked'){w.E.introSkipV2860.click();w.tick(250);}
  await flush();a(resolved,reason);a(w.E.introPanelV2860.hidden,reason);a.equal(w.timers.size,0,reason);
  if(!['dispose-fading','blocked'].includes(reason))a(!w.store.has('xiantu_intro_seen_v286891'),reason+' not remembered as watched');
 }
 // A rejected old play promise cannot cancel a subsequent source/run; repeat cleanup has no effect.
 {const w=world();w.I.finish();w.I.start();w.I.finish();await w.I.wait();w.E.introReplayV286891.click();a.equal(w.requests.length,2);w.video.fire('playing');w.video.fire('waiting');w.tick(7000);w.video.fire('playing');w.tick(2000);a(!w.E.introPanelV2860.hidden);w.I.dispose();a.equal(w.timers.size,0);}
 for(const blocked of [false,true]){
  const w=world({blocked});const choice=w.E.introSkipChoiceV2898;
  choice.checked=true;choice.onchange();if(!blocked)a.equal(w.store.get('xiantu_skip_intro_v2898'),'1');
  choice.checked=false;choice.onchange();if(!blocked)a.equal(w.store.get('xiantu_skip_intro_v2898'),'0');
  choice.checked=true;await w.I.start();a.equal(w.requests.length,0);a(choice.disabled);
 }
 const files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]),sizes=JSON.parse(html.match(/var sizesV286891=(\{[^;]*\}),cssSizeV286891=/)[1]);
 a.equal(files.length,40);for(const name of files)a.equal(sizes[name],fs.statSync(path.join(root,name)).size,name+' weight');
 a.equal(+html.match(/cssSizeV286891=(\d+)/)[1],fs.statSync(path.join(root,'xiantu-v2762.css')).size);
 for(const name of ['intro-v286891-360.mp4','intro-poster-v286891.jpg','boot-bg-v286891.jpg'])a(fs.statSync(path.join(root,name)).size>0);
 const mp4=fs.readFileSync(path.join(root,'intro-v286891-360.mp4'));let offset=0,atoms=[];
 while(offset+8<=mp4.length){const size=mp4.readUInt32BE(offset);a(size>=8);atoms.push(mp4.toString('ascii',offset+4,offset+8));offset+=size;}
 a(atoms.indexOf('moov')<atoms.indexOf('mdat'),'phone video supports fast start');a(mp4.length<fs.statSync(path.join(root,'intro-v2860.mp4')).size);
 console.log('PASS intro first/repeat/ready/replay, preference/storage, fallback/stale events, slow/stall/deadline/disposal, weights and media');
})().catch(e=>{console.error(e);process.exitCode=1;});
