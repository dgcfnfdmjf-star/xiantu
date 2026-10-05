const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
async function test(mode){
 const timers=new Map();let id=0,pauses=0,loads=0,plays=0;const listeners={};
 const video={addEventListener:(k,v)=>listeners[k]=v,play:()=>{plays++;return mode==='denied'?Promise.reject(Error()):Promise.resolve()},pause:()=>pauses++,load:()=>loads++,removeAttribute:k=>delete video[k]};
 const panel={hidden:true},skip={},sound={setAttribute(){}};
 const elems={introVideoV2860:video,introPanelV2860:panel,introSkipV2860:skip,introSoundV2860:sound};
 const c={document:{getElementById:k=>elems[k]},window:{addEventListener(){}},setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id},clearTimeout:id=>timers.delete(id)};
 vm.createContext(c);vm.runInContext(fs.readFileSync('work-v2860/intro.js','utf8'),c);
 assert.equal(plays,0);const intro=c.window.XiantuIntroV2860,p=intro.start();assert.equal(intro.start(),p);assert.equal(plays,1);assert.equal(video.muted,true);
 sound.onclick();assert.equal(video.muted,false);
 if(mode==='skip')skip.onclick();else if(mode==='ended')listeners.ended();else if(mode==='error')listeners.error();else if(mode==='timeout'){[...timers.values()].find(t=>t.ms===45000).fn()}else if(mode==='stall'){listeners.waiting();[...timers.values()].find(t=>t.ms===8000).fn()}
 await p;assert.equal(panel.hidden,true);assert.equal(video.src,undefined);assert.equal(pauses,1);assert.equal(loads,1);intro.finish();assert.equal(pauses,1);assert.equal(timers.size,0);
}
(async()=>{for(const mode of ['skip','ended','error','timeout','stall','denied'])await test(mode);console.log('PASS intro skips/ends/errors/stalls/autoplay denial, sound, idempotence, no preload, timer/resource cleanup')})()
