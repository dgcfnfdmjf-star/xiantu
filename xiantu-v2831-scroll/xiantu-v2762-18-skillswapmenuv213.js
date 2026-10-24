(function(){
  function install(){
    const menu=document.getElementById('mobileQuickMenu');if(menu&&!document.getElementById('skillSwapMenuBtnV213')){const b=document.createElement('button');b.id='skillSwapMenuBtnV213';b.className='skill-menu-entry-v213';b.type='button';b.textContent='🧩 更换技能';b.onclick=()=>{menu.classList.remove('show');showSkillLoadoutPanelV212?.('sword')};const equip=[...menu.querySelectorAll('button')].find(x=>x.textContent.includes('装备'));if(equip) equip.insertAdjacentElement('afterend',b);else menu.appendChild(b)}
  }
  const oldEnable=window.enableWorldMode;if(typeof oldEnable==='function')window.enableWorldMode=function(){const r=oldEnable.apply(this,arguments);setTimeout(install,0);return r};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));setTimeout(install,500);
  window.installSkillSwapMenuV213=install;
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-18-skillswapmenuv213.js"]="28.68.56";
