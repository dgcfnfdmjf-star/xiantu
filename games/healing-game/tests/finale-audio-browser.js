async root => {
 const c=await root.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:3}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({caught:{dew:2,peach:2,amber:2,moon:2,violet:2,tide:1},lamps:[true,true,false],charge:4,completed:[1,2]}));});
 await p.goto('http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/');await p.locator('#start').click();await p.waitForTimeout(800);
 const audio=await p.evaluate(()=>{GardenAudio.setMusic(false);let count=0,osc=GardenAudio.kit.osc;GardenAudio.kit.osc=function(){count++;return osc.apply(this,arguments)};GardenAudio.setSfx(false);for(let i=0;i<6;i++)__level3.catchSound(i,2);const muted=count;GardenAudio.setSfx(true);for(let i=0;i<6;i++)__level3.catchSound(i,2);GardenAudio.kit.osc=osc;return{muted,unmuted:count,ctx:GardenAudio.context().state}});
 if(audio.muted!==0||audio.unmuted===0)throw Error('SFX toggle does not control new voices');
 await p.locator('#starLamp2').click();await p.waitForFunction(()=>!document.getElementById('starEnding').hidden,null,{timeout:45000});
 const final=await p.evaluate(()=>({level:__level3.state(),voyage:__voyage.state(),xp:__journey.state().xp}));
 if(final.level.running||!final.level.grow.every(n=>n===1)||final.voyage.looping)throw Error('Natural finale not completed');
 await p.screenshot({path:'output/playwright/healing-v7-natural-ending.png',scale:'css'});
 if(errors.length)throw Error(errors.join(';'));await c.close();return{audio,final,errors};
}
