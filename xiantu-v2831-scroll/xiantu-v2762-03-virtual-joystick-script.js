(function(){
  function init(){
    const pad=document.getElementById('virtualJoystick'),knob=document.getElementById('virtualJoystickKnob');
    if(!pad||!knob||pad.dataset.joystickReady==='1')return;
    pad.dataset.joystickReady='1';
    let active=null;
    const DEAD=.18;
    function clear(){
      if(typeof FLAT_WORLD!=='undefined'&&FLAT_WORLD?.keys){
        for(const key of ['w','a','s','d'])FLAT_WORLD.keys[key]=false;
      }
    }
    function reset(){
      const pointer=active;active=null;
      pad.classList.remove('active');knob.style.transform='translate(-50%,-50%)';
      // Global releases unrelated to the joystick must not cancel keyboard input.
      if(pointer!==null){clear();try{pad.releasePointerCapture(pointer)}catch(_){}}
    }
    function apply(x,y){
      if(typeof FLAT_WORLD==='undefined'||!FLAT_WORLD?.keys)return;
      if(typeof stopNavigationV2830==='function')stopNavigationV2830();FLAT_WORLD.target=null;FLAT_WORLD.tapTargetFx=null;
      const mag=Math.hypot(x,y);if(mag<DEAD){clear();return;}
      const nx=x/mag,ny=y/mag,t=.28;
      FLAT_WORLD.keys.a=nx<-t;FLAT_WORLD.keys.d=nx>t;
      FLAT_WORLD.keys.w=ny<-t;FLAT_WORLD.keys.s=ny>t;
    }
    function update(e){
      const r=pad.getBoundingClientRect(),max=r.width*.32;
      if(!(max>0)||!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY)){reset();return;}
      let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
      const dist=Math.hypot(dx,dy);if(dist>max){dx*=max/dist;dy*=max/dist;}
      knob.style.transform=`translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
      apply(dx/max,dy/max);
    }
    function start(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(active!==null){
        // A new primary contact proves the previous touch ended, even if its
        // release never reached the page. Secondary fingers cannot steal it.
        if(e.isPrimary!==true)return;
        reset();
      }
      e.preventDefault();e.stopPropagation();active=e.pointerId;
      pad.classList.add('active');try{pad.setPointerCapture(active)}catch(_){}
      update(e);try{navigator.vibrate?.(8)}catch(_){}
    }
    function move(e){
      if(active===null||e.pointerId!==active)return;
      if(e.pointerType==='mouse'&&e.buttons===0){reset();return;}
      e.preventDefault();update(e);
    }
    function end(e){if(active!==null&&e.pointerId===active)reset();}
    pad.addEventListener('pointerdown',start,{passive:false});
    pad.addEventListener('pointermove',move,{passive:false});
    pad.addEventListener('pointerup',end,{passive:true});
    pad.addEventListener('pointercancel',end,{passive:true});
    pad.addEventListener('lostpointercapture',end,{passive:true});
    // Capture-phase listeners still see releases over other controls when
    // setPointerCapture fails or the browser changes the hit target.
    window.addEventListener('pointerup',end,{capture:true,passive:true});
    window.addEventListener('pointercancel',end,{capture:true,passive:true});
    const touchEnd=e=>{if(active!==null&&e.touches?.length===0)reset();};
    window.addEventListener('touchend',touchEnd,{capture:true,passive:true});
    window.addEventListener('touchcancel',touchEnd,{capture:true,passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
    for(const event of ['blur','pagehide','resize','orientationchange','xiantu-movement-reset'])window.addEventListener(event,reset);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2762-03-virtual-joystick-script.js']='28.68.84';
