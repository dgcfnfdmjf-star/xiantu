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


// V28.68.110: UI-only theme and main-quest shortcut. Uses existing task actions and loader.
(function(){
  const root=document.documentElement;
  let pending=0,bar=null,shown=null,busyUntil=0,lastAction=null,watcher=null,started=false;
  const watched=new WeakSet();
  function enabled(){return root.classList.contains('xt-theme');}
  function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');svg.setAttribute('class','xt-ico');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');use.setAttribute('href','#xt-i-'+name);use.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href','#xt-i-'+name);svg.appendChild(use);return svg;}
  function decorate(){
    [['taskBtn','quest','任务'],['panelToggleBtn','char','角色'],['inventoryToggleBtn','bag','行囊'],['mobileMenuBtn','menu','更多']].forEach(([id,name,label])=>{
      const el=document.getElementById(id);if(!el||el.querySelector('.xt-nav'))return;
      const original=document.createElement('span');original.className='xt-nav-original';while(el.firstChild)original.appendChild(el.firstChild);
      const face=document.createElement('span');face.className='xt-nav';face.appendChild(icon(name));face.appendChild(document.createTextNode(label));el.appendChild(original);el.appendChild(face);
      if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',original.textContent.trim()||label);
    });
  }
  function contextAllowed(){
    if(!enabled()||document.hidden||typeof player==='undefined'||!player||typeof gameState==='undefined'||gameState!=='exploring'||player.breakthrough?.isAnimating)return false;
    const game=document.getElementById('gameScreen');if(!game||game.classList.contains('hidden')||!document.body.classList.contains('flat-world-active'))return false;
    if(typeof interiorV286886!=='undefined'&&interiorV286886)return false;
    if(typeof tutorialState!=='undefined'&&tutorialState.active)return false;
    if(typeof pathOwnsMapV2901==='function'&&pathOwnsMapV2901())return false;
    if(typeof isWorldOverlayOpen!=='function'||isWorldOverlayOpen())return false;
    if(document.getElementById('mobileQuickMenu')?.classList.contains('show'))return false;
    return !Array.from(document.querySelectorAll('.load-dialog,.tutorial-popup,.tutorial-card,#afterBattleV2838,[role="dialog"]')).some(el=>!el.hidden&&!el.classList.contains('hidden')&&el.getClientRects().length>0);
  }
  function current(){
    const task=getTrackedTasks().find(t=>t.type==='main');if(!task)return null;
    const inst=getTaskInstance(task.id),step=getCurrentTaskStep(task.id),status=getTaskStatus(task.id);
    return {owner:player,tasks:player.tasks,task,inst,step,status,index:inst?.currentStep};
  }
  function same(a,b){return !!a&&!!b&&a.owner===b.owner&&a.tasks===b.tasks&&a.task.id===b.task.id&&a.inst===b.inst&&a.step===b.step&&a.status===b.status&&a.index===b.index;}
  function hide(){shown=null;if(bar){bar.hidden=true;bar.querySelectorAll('button').forEach(b=>b.disabled=true);}root.classList.remove('xt-has-questbar');}
  function activate(openOnly){
    const prior=shown;if(!prior||!contextAllowed()||(!openOnly&&same(prior,lastAction)&&Date.now()<busyUntil))return;
    const now=current();if(!same(prior,now)){render();return;}
    busyUntil=Date.now()+450;lastAction=now;hide();
    // Choices, unaccepted and realm-locked chapters use the full panel, never auto-select.
    if(openOnly||now.status!==TASK_STATUS.ACTIVE||!now.step||now.step.action==='choice')showTaskPanel('main');
    else performTaskAction(now.task.id);
    schedule();
  }
  function ensureBar(){
    if(bar)return;
    bar=document.createElement('nav');bar.id='xtQuestBar';bar.className='xt-questbar';bar.hidden=true;bar.setAttribute('aria-label','当前主线');
    bar.innerHTML='<button type="button" class="xt-questbar__body"><span class="xt-questbar__kicker">主线</span><span class="xt-questbar__title"></span><span class="xt-questbar__step"></span></button><button type="button" class="xt-btn xt-btn--gold xt-questbar__go"></button><div class="xt-questbar__progress" aria-hidden="true"><i></i></div>';
    bar.querySelector('.xt-questbar__body').addEventListener('click',()=>activate(true));bar.querySelector('.xt-questbar__go').addEventListener('click',()=>activate(false));
    document.body.appendChild(bar);
  }
  function text(el,value){if(el.textContent!==value)el.textContent=value;}
  function render(){
    if(!started||!contextAllowed()){hide();return;}
    const now=current();if(!now){hide();return;}ensureBar();
    const locked=now.status===TASK_STATUS.LOCKED,action=now.step?.action||'';
    const short=locked?'查看准备':now.status!==TASK_STATUS.ACTIVE?'查看任务':action==='choice'?'选择分支':/kill|combat|defend|battle|war_defender|saint_win|border_general/.test(action)?'开始挑战':/cultivate|breakthrough/.test(action)?'修炼预览':'推进主线';
    const step=locked?mainTaskLockV2822(now.task):getCurrentStepDesc(now.task.id),chapter=MAIN_TASKS.findIndex(t=>t.id===now.task.id)+1;
    text(bar.querySelector('.xt-questbar__kicker'),'主线 · 第'+chapter+'章');text(bar.querySelector('.xt-questbar__title'),now.task.title);text(bar.querySelector('.xt-questbar__step'),step);
    const open=bar.querySelector('.xt-questbar__body'),go=bar.querySelector('.xt-questbar__go');open.setAttribute('aria-label','查看主线：'+now.task.title+'，'+step);text(go,short);go.setAttribute('aria-label',short+'：'+now.task.title+'，'+(locked?'查看条件':getTaskActionLabel(now.task.id)||step));go.title=locked?step:getTaskActionLabel(now.task.id);
    const width=Math.max(0,Math.min(100,Number(getTaskProgress(now.task.id))||0))+'%',fill=bar.querySelector('.xt-questbar__progress i');if(fill.style.width!==width)fill.style.width=width;
    shown=now;bar.querySelectorAll('button').forEach(b=>b.disabled=false);bar.hidden=false;root.classList.add('xt-has-questbar');
  }
  function watchPanels(){
    if(!watcher)return;
    ['gameScreen','storyPanel','combatPanel','characterPanel','alchemyPanel','petPanel','artifactPanel','mobileQuickMenu'].forEach(id=>{const el=document.getElementById(id);if(el&&!watched.has(el)){watched.add(el);watcher.observe(el,{attributes:true,attributeFilter:['class','hidden','style']});}});
  }
  function schedule(){
    if(!started||pending||document.hidden)return;
    pending=setTimeout(()=>{pending=0;watchPanels();if(enabled())decorate();render();},0);
  }
  function start(){
    if(started||!root.classList.contains('xiantu-v2762-ready'))return;started=true;
    if(typeof MutationObserver==='function'){
      watcher=new MutationObserver(schedule);watcher.observe(document.body,{childList:true,attributes:true,attributeFilter:['class']});watchPanels();
    }
    schedule();
  }
  function preference(key,value){try{localStorage.setItem(key,value?'1':'0');return true;}catch(_){return false;}}
  window.XT_UI={
    refresh:schedule,
    render:()=>{if(started){if(enabled())decorate();watchPanels();render();}},
    setTheme(on){const saved=preference('xt_theme_off',!on);root.classList.toggle('xt-theme',!!on);if(!on)hide();else schedule();return saved;},
    setReduceMotion(on){const saved=preference('xt_reduce_motion',!!on);root.classList.toggle('xt-reduce-motion',!!on);return saved;}
  };
  document.addEventListener('visibilitychange',()=>{clearTimeout(pending);pending=0;if(document.hidden)hide();else schedule();});
  window.addEventListener('pagehide',()=>{clearTimeout(pending);pending=0;hide();});window.addEventListener('pageshow',schedule);
  // Root observer is idle after ready; no timer, RAF loop or background polling.
  if(typeof MutationObserver==='function'){
    const ready=new MutationObserver(()=>{if(root.classList.contains('xiantu-v2762-ready')){ready.disconnect();start();}});ready.observe(root,{attributes:true,attributeFilter:['class']});
  }
  start();
})();
function uiSettingsV2868109(){
 const themed=document.documentElement.classList.contains('xt-theme'),reduced=document.documentElement.classList.contains('xt-reduce-motion');
 return `<h3>界面外观</h3><p>青绿鎏金统一面板与按钮，并在地图显示当前主线。只保存本机偏好。</p><button type="button" class="choice-btn" aria-pressed="${themed}" onclick="setUiPreferenceV2868109('theme',${!themed})">${themed?'恢复原界面':'启用青绿鎏金'}</button><button type="button" class="choice-btn" aria-pressed="${reduced}" onclick="setUiPreferenceV2868109('motion',${!reduced})">${reduced?'恢复界面动效':'减少界面动效'}</button><p>同时遵循系统的减少动态效果设置。技能与地图特效沿用各自的画质开关。</p>`;
}
function setUiPreferenceV2868109(kind,value){
 if(!forgeAllowedV2825()||!window.XT_UI||!['theme','motion'].includes(kind))return;
 const saved=kind==='theme'?window.XT_UI.setTheme(value):window.XT_UI.setReduceMotion(value);
 showGraphicsV2903(saved?'界面设置已保存。':'已应用；当前浏览器不允许保存偏好。');
}

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-05-mobile-dedicated-script.js"]="28.68.112";
