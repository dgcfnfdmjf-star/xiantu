(function(){
  const VALID_MODES=['joystick','touch'];

  const rawCreate=window.createDefaultPlayer;
  if(typeof rawCreate==='function' && !rawCreate._controlModePatched){
    const wrapped=function(){
      const p=rawCreate.apply(this,arguments);
      if(!VALID_MODES.includes(p.controlMode)) p.controlMode='joystick';
      return p;
    };
    wrapped._controlModePatched=true;
    window.createDefaultPlayer=wrapped;
  }

  const rawNormalize=window.normalizePlayer;
  if(typeof rawNormalize==='function' && !rawNormalize._controlModePatched){
    const wrapped=function(saved={}){
      const p=rawNormalize.apply(this,arguments);
      p.controlMode=VALID_MODES.includes(saved?.controlMode) ? saved.controlMode : (VALID_MODES.includes(p.controlMode) ? p.controlMode : 'joystick');
      return p;
    };
    wrapped._controlModePatched=true;
    window.normalizePlayer=wrapped;
  }

  function getPlayer(){
    try{return window.player || player;}catch(_){return window.player || null;}
  }
  function getControlMoveMode(){
    const p=getPlayer();
    return VALID_MODES.includes(p?.controlMode) ? p.controlMode : 'joystick';
  }
  function clearControlMoveState(){
    resetWorldMovementV28686();
    const knob=document.getElementById('virtualJoystickKnob');
    if(knob) knob.style.transform='translate(-50%,-50%)';
    document.getElementById('virtualJoystick')?.classList.remove('active');
  }
  function updateControlModeUI(){
    const mode=getControlMoveMode();
    document.body.classList.toggle('control-mode-touch', mode==='touch');
    document.body.classList.toggle('control-mode-joystick', mode==='joystick');
    const btn=document.getElementById('controlModeSwitchBtn');
    if(btn){
      btn.textContent = mode==='joystick' ? '🕹️ 摇杆移动' : '👆 点触移动';
      btn.title = mode==='joystick' ? '点击切换为点触移动' : '点击切换为摇杆移动';
      btn.dataset.mode = mode;
    }
    const help=document.querySelector('.world-help');
    if(help){
      const nextHelp = mode==='joystick'
        ? '移动：拖动摇杆　·　轻点建筑自动进入　·　交互：右下按钮 / E / 空格'
        : '移动：轻点地面　·　轻点建筑自动进入　·　交互：右下按钮 / E / 空格';
      if(help.textContent !== nextHelp) help.textContent = nextHelp;
    }
  }
  function applyControlMoveMode(mode, save=true){
    const p=getPlayer();
    if(!p) return;
    const next=VALID_MODES.includes(mode) ? mode : 'joystick';
    p.controlMode=next;
    clearControlMoveState();
    updateControlModeUI();
    if(save && typeof autoSave==='function') autoSave();
  }
  function toggleControlMoveMode(){
    const next=getControlMoveMode()==='joystick' ? 'touch' : 'joystick';
    applyControlMoveMode(next, true);
    if(typeof showFloatingText==='function'){
      showFloatingText(next==='joystick' ? '🕹️ 已切换为摇杆移动' : '👆 已切换为点触移动', next==='joystick' ? '#7ec9ff' : '#69f0ae');
    }
  }
  window.toggleControlMoveMode=toggleControlMoveMode;
  window.applyControlMoveMode=applyControlMoveMode;

  function ensureControlModeButton(){
    const host=document.getElementById('characterUtilityActions');
    if(!host) return false;
    if(document.getElementById('controlModeSwitchBtn')) return true;
    const btn=document.createElement('button');
    btn.id='controlModeSwitchBtn';
    btn.type='button';
    btn.addEventListener('click', toggleControlMoveMode);
    host.insertBefore(btn, host.firstChild);
    updateControlModeUI();
    return true;
  }

  // V2904: the core's single tap handler permits building taps in both modes,
  // while keeping empty-ground touch movement exclusive to touch mode.
  function installGroupedNavigation(){
    const drawer=document.getElementById('worldExploreDrawer');
    const utilities=document.getElementById('characterUtilityActions');
    if(!drawer||!utilities||drawer.dataset.installed) return;
    drawer.dataset.installed='1';
    const summary=drawer.querySelector('summary');
    drawer.addEventListener('toggle',()=>{if(drawer.open)clearControlMoveState();});
    drawer.addEventListener('click',e=>{
      if(e.target.closest('button')){drawer.open=false;summary.focus({preventScroll:true});}
    },true);
    drawer.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.key==='Escape'){e.preventDefault();drawer.open=false;summary.focus({preventScroll:true});}
    });
    drawer.addEventListener('focusout',e=>{if(e.relatedTarget&&!drawer.contains(e.relatedTarget))drawer.open=false;});
    document.addEventListener('pointerdown',e=>{if(!drawer.contains(e.target))drawer.open=false;},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)drawer.open=false;});
    window.addEventListener('resize',()=>{drawer.open=false;},{passive:true});
    utilities.addEventListener('click',e=>{
      const button=e.target.closest('button');
      if(button&&!['controlModeSwitchBtn','xiantuBuildBadgeV2814'].includes(button.id)){toggleCharacterPanel(false);document.getElementById('panelToggleBtn')?.focus({preventScroll:true});}
    },true);
    utilities.parentElement.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.key==='Escape'){e.preventDefault();toggleCharacterPanel(false);document.getElementById('panelToggleBtn')?.focus();}
    });
  }

  function boot(){
    const p=getPlayer();
    if(p && !VALID_MODES.includes(p.controlMode)) p.controlMode='joystick';
    ensureControlModeButton();
    installGroupedNavigation();
    updateControlModeUI();
    // V27.6 装备优化：一键最佳、套装评分保护、属性对比、更优提示、一键卸下。
    // V27.7 装备管理：锁定、品质筛选、安全分解、单件/总装备战力显示。
    // V27.5 根修复：
    // 禁止监听整个 body 后再反复修改 DOM。
    // 原 V22 这里会形成 MutationObserver -> updateControlModeUI -> textContent变化
    // -> MutationObserver 再触发的死循环，UC/iPhone 上会导致输入和按钮全部卡死。
    setTimeout(function(){ ensureControlModeButton(); updateControlModeUI(); }, 300);
    setTimeout(function(){ ensureControlModeButton(); updateControlModeUI(); }, 1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-09-control-mode-switch-script.js"]="28.68.78";
