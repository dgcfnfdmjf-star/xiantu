(function(){
 'use strict';
 var video=document.getElementById('introVideoV2860'),panel=document.getElementById('introPanelV2860');
 var skip=document.getElementById('introSkipV2860'),sound=document.getElementById('introSoundV2860');
 var done=false,resolveIntro=null,deadline=null,stall=null,promise=null;
 function finish(){
  if(done)return;done=true;clearTimeout(deadline);clearTimeout(stall);
  video.pause();video.removeAttribute('src');video.load();panel.hidden=true;
  if(resolveIntro)resolveIntro();
 }
 function waiting(){clearTimeout(stall);stall=setTimeout(finish,8000);}
 skip.onclick=finish;
 sound.onclick=function(){video.muted=!video.muted;sound.textContent=video.muted?'开启声音':'关闭声音';sound.setAttribute('aria-pressed',String(!video.muted));};
 video.addEventListener('ended',finish);video.addEventListener('error',finish);
 video.addEventListener('waiting',waiting);video.addEventListener('stalled',waiting);
 video.addEventListener('playing',function(){clearTimeout(stall);});
 window.XiantuIntroV2860={finish:finish,start:function(){
  if(promise)return promise;
  promise=new Promise(function(resolve){resolveIntro=resolve;});
  if(done){resolveIntro();return promise;}
  panel.hidden=false;video.muted=true;video.src='./intro-v2860.mp4';
  deadline=setTimeout(finish,45000);waiting();
  try{var play=video.play();if(play&&play.catch)play.catch(finish);}catch(_){finish();}
  return promise;
 }};
 window.addEventListener('pagehide',finish,{once:true});
})();
