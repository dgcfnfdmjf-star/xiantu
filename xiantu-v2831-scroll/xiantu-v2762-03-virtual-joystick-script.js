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
        delete FLAT_WORLD.keys.joystick;
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
      const force=Math.min(1,(mag-DEAD)/(1-DEAD)),speed=force*force*(3-2*force);
      FLAT_WORLD.keys.joystick={x:nx*speed,y:ny*speed};
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
    // Browsers can omit the click for a second finger while the first stays on
    // the pad, even after an encounter has opened the combat controls.
    for(const area of [document.getElementById('touchAction'),document.getElementById('combatChoices')]){
      if(!area)continue;
      let tap=null;
      const moved=finger=>Math.hypot(finger.clientX-tap.x,finger.clientY-tap.y)>14;
      area.addEventListener('touchstart',event=>{
        tap=null;
        if(!event.cancelable||event.touches.length!==2||event.changedTouches.length!==1)return;
        const finger=event.changedTouches[0],button=finger.target.closest('button');
        if(!button||button.disabled)return;
        const holdingPad=Array.from(event.touches).some(t=>t.identifier!==finger.identifier&&pad.contains(t.target));
        if(!holdingPad)return;
        // Claim just this button press. Once the joystick moves, touchend can
        // be non-cancelable. Cancel here to avoid a second, native click.
        event.preventDefault();
        tap={id:finger.identifier,x:finger.clientX,y:finger.clientY,button};
      },{passive:false});
      area.addEventListener('touchmove',event=>{
        if(!tap)return;
        const finger=Array.from(event.changedTouches).find(t=>t.identifier===tap.id);
        if(event.touches.length>2||(finger&&moved(finger)))tap=null;
      },{passive:true});
      area.addEventListener('touchcancel',()=>{tap=null;},{passive:true});
      area.addEventListener('touchend',event=>{
        if(!tap)return;
        const finger=Array.from(event.changedTouches).find(t=>t.identifier===tap.id);
        if(!finger)return;
        const button=tap.button;
        const activate=event.touches.length<=1&&!moved(finger)
          &&button.contains(document.elementFromPoint(finger.clientX,finger.clientY));
        tap=null;
        if(activate)button.click();
      },{passive:true});
    }
    document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
    for(const event of ['blur','pagehide','resize','orientationchange','xiantu-movement-reset'])window.addEventListener(event,reset);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2762-03-virtual-joystick-script.js']='28.68.124';
