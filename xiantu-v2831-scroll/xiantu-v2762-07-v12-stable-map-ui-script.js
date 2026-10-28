(function(){
  let returnPositionQueuedV2765=false;
  function queueReturnPositionV2765(){
    if(returnPositionQueuedV2765||!document.body.classList.contains('flat-world-active'))return;
    returnPositionQueuedV2765=true;
    requestAnimationFrame(()=>{
      returnPositionQueuedV2765=false;
      if(document.body.classList.contains('flat-world-active'))positionReturnToMap();
    });
  }
  function getVisibleWorldOverlay(){
    const ids=['storyPanel','combatPanel','alchemyPanel','petPanel','artifactPanel'];
    for(const id of ids){const el=document.getElementById(id);if(el&&!el.classList.contains('hidden'))return el;}
    return null;
  }
  function positionReturnToMap(){
    const wrap=document.querySelector('.world-close-panel');
    const panel=getVisibleWorldOverlay();
    if(!wrap||!panel)return;
    const btn=wrap.querySelector('button');
    if(btn){btn.textContent='← 地图';btn.title='返回地图';btn.setAttribute('aria-label','返回地图');}
    const rect=panel.getBoundingClientRect();
    const vw=document.documentElement.clientWidth||window.innerWidth;
    const top=Math.max(8,Math.round(rect.top-40));
    const right=Math.max(8,Math.round(vw-rect.right+6));
    wrap.style.top=top+'px';wrap.style.right=right+'px';wrap.style.bottom='auto';wrap.style.left='auto';
  }
  function install(){
    try{changeMinimapZoom(0);}catch(_){ }
    const canvas=document.getElementById('minimapCanvas');
    if(canvas&&!canvas.dataset.v12ZoomInstalled){
      canvas.dataset.v12ZoomInstalled='1';
      canvas.addEventListener('wheel',function(e){e.preventDefault();changeMinimapZoom(e.deltaY<0?0.5:-0.5);},{passive:false});
      canvas.addEventListener('dblclick',function(e){e.preventDefault();changeMinimapZoom((MINIMAP_VIEW_STATE.zoom||1)>=2?-1:1);});
    }
    positionReturnToMap();
    const gs=document.getElementById('gameScreen');
    if(gs&&!gs.dataset.v12ReturnObserver){
      gs.dataset.v12ReturnObserver='1';
      const overlayObserver=new MutationObserver(queueReturnPositionV2765);
      ['storyPanel','combatPanel','alchemyPanel','petPanel','artifactPanel'].forEach(id=>{
        const panel=document.getElementById(id);
        if(panel)overlayObserver.observe(panel,{attributes:true,attributeFilter:['class']});
      });
    }
  }
  window.addEventListener('resize',()=>{if(document.body.classList.contains('flat-world-active'))queueReturnPositionV2765()},{passive:true});
  window.addEventListener('orientationchange',()=>{if(document.body.classList.contains('flat-world-active'))setTimeout(queueReturnPositionV2765,180)},{passive:true});
  // 小地图与面板观察器只在真正进入大地图后安装。
  const baseEnableWorldModeV2762=window.enableWorldMode;
  if(typeof baseEnableWorldModeV2762==='function')window.enableWorldMode=function(){
    const result=baseEnableWorldModeV2762.apply(this,arguments);
    requestAnimationFrame(install);
    return result;
  };
  if(document.body.classList.contains('flat-world-active'))requestAnimationFrame(install);
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-07-v12-stable-map-ui-script.js"]="28.68.71";
