(function(){
  const root=document.documentElement;
  root.classList.add('xiantu-mobile-dedicated','mobile-game');
  root.classList.remove('xiantu-force-landscape','xiantu-landscape','xiantu-short-landscape');

  let stableViewport=null;
  function rawViewport(){
    const vv=window.visualViewport;
    return {
      w:Math.max(280,Math.round(vv?.width||window.innerWidth||document.documentElement.clientWidth||390)),
      h:Math.max(320,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||700))
    };
  }
  function viewport(){
    const raw=rawViewport();
    const landscape=raw.w>raw.h;
    // iOS/ChatGPT 文件预览的顶部工具栏会反复显隐，只改变高度。
    // 固定同一方向下的逻辑视口，避免 HUD / 面板在两套布局之间来回跳。
    if(!stableViewport || stableViewport.landscape!==landscape || Math.abs(raw.w-stableViewport.w)>72){
      stableViewport={w:raw.w,h:raw.h,landscape};
    }
    return {w:stableViewport.w,h:stableViewport.h};
  }
  function gameIsActiveV2762(){
    const gs=document.getElementById('gameScreen');
    return document.body.classList.contains('flat-world-active') || !!(gs && !gs.classList.contains('hidden'));
  }
  let timer=0;
  function syncMobileViewport(forceCanvas=false){
    clearTimeout(timer);
    timer=setTimeout(function(){
      const v=viewport();
      root.style.setProperty('--mx-vw',v.w+'px');
      root.style.setProperty('--mx-vh',v.h+'px');
      root.classList.remove('xiantu-force-landscape','xiantu-short-landscape');
      root.classList.toggle('xiantu-mobile-landscape',v.w>v.h);
      try{
        if(forceCanvas && gameIsActiveV2762() && typeof resizeWorldCanvas==='function') resizeWorldCanvas();
        if(gameIsActiveV2762() && typeof updateWorldHUD==='function') updateWorldHUD();
      }catch(_){ }
    },60);
  }

  function installCanvasResize(){
    if(typeof window.resizeWorldCanvas!=='function') return;
    if(window.resizeWorldCanvas.__mobileDedicated) return;
    const fn=function(){
      const c=document.getElementById('worldCanvas');
      if(!c)return;
      const v=viewport();
      const dpr=Math.min(typeof worldDprCapV2893==='function'?worldDprCapV2893():1,window.devicePixelRatio||1);
      const w=Math.round(v.w*dpr),h=Math.round(v.h*dpr);
      if(c.width!==w||c.height!==h||c._dpr!==dpr){
        c.width=w;c.height=h;c._dpr=dpr;
        if(typeof resetMapAliveV2893==='function')resetMapAliveV2893();
        try{ if(typeof resize3DAvatar==='function') resize3DAvatar(); }catch(_){ }
        try{ if(typeof PERF_CONFIG!=='undefined'){PERF_CONFIG.staticWorldReady=false;PERF_CONFIG.staticWorldCanvas=null;} }catch(_){ }
      }
    };
    fn.__mobileDedicated=true;
    window.resizeWorldCanvas=fn;
  }

  function cleanLegacyOrientation(){
    document.getElementById('landscapeRotateGate')?.remove();
    root.classList.remove('xiantu-force-landscape','xiantu-short-landscape');
    document.body.style.transform='none';
    document.body.style.rotate='none';
    document.body.style.width='';document.body.style.height='';
  }

  function ready(){
    cleanLegacyOrientation();
    installCanvasResize();
    syncMobileViewport(false);
  }

  window.addEventListener('resize',()=>syncMobileViewport(gameIsActiveV2762()),{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(()=>syncMobileViewport(gameIsActiveV2762()),180),{passive:true});
  // 不再监听 visualViewport.resize：iOS 地址栏动画会连续触发数十次。
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-05-mobile-dedicated-script.js"]="28.68.76";
