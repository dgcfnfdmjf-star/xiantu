/* V26 冰火技能特效补丁：按技能文案区分冰刺/冰爆/冰蝶/霜龙/冰狱/领域/护甲/寒晶及火球/红莲/火墙/真火/火龙/阴火/火域/太阳/火索/护盾 */
(function(){
 const ICE=new Set(['玄冰刺','冰爆术','霜寒结界','冰蝶幻舞','霜龙吐息','冰河葬狱','寒渊领域','冰甲护身','冰魄封魂','万载寒晶']);
 const FIRE=new Set(['炎爆术','红莲业火','火墙术','三昧真火','赤焰龙息','焚心炎','燎原火域','太阳真火','流火飞索','炎阳护盾']);
 const icons={
  '玄冰刺':'❄️','冰爆术':'💠','霜寒结界':'❄️','冰蝶幻舞':'🦋','霜龙吐息':'🐉','冰河葬狱':'🧊','寒渊领域':'🌨️','冰甲护身':'🛡️','冰魄封魂':'💎','万载寒晶':'💎',
  '炎爆术':'🔥','红莲业火':'🪷','火墙术':'🔥','三昧真火':'☀️','赤焰龙息':'🐉','焚心炎':'💜','燎原火域':'🔥','太阳真火':'☀️','流火飞索':'⛓️','炎阳护盾':'🛡️'
 };
 window.playV26ElementFx=function(name){
   if(window.InkSkillFxV2854)return; // V28.68 owns these effects; avoid the old full-screen emoji layer.
   if(!ICE.has(name)&&!FIRE.has(name)) return;
   const root=document.createElement('div'); root.className='skill-v26-fx';
   root.style.color=ICE.has(name)?'#9eeeff':'#ff9b5e';
   const core=document.createElement('div'); core.className='skill-v26-core'; core.textContent=icons[name]||'✨'; root.appendChild(core);
   const ring=document.createElement('div'); ring.className='skill-v26-ring'; root.appendChild(ring);
   const particleIcon=ICE.has(name)?(name==='冰蝶幻舞'?'🦋':'❄️'):'🔥';
   for(let i=0;i<14;i++){const p=document.createElement('div');p.className='skill-v26-particle';p.textContent=particleIcon;p.style.left=(45+Math.random()*10)+'%';p.style.top=(40+Math.random()*10)+'%';p.style.setProperty('--dx',((Math.random()-.5)*500)+'px');p.style.setProperty('--dy',((Math.random()-.5)*280)+'px');root.appendChild(p)}
   document.body.appendChild(root); setTimeout(()=>root.remove(),1150);
 };
 // Hook common skill-effect functions without replacing the existing battle implementation.
 ['playSkillEffect','showSkillEffect','triggerSkillEffect'].forEach(fn=>{
   const old=window[fn];
   if(typeof old==='function'&&!old.__v26){
     const wrap=function(){try{window.playV26ElementFx(arguments[0]?.name||arguments[0]);}catch(e){} return old.apply(this,arguments)};
     wrap.__v26=true; window[fn]=wrap;
   }
 });
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-11-feature-11.js"]="28.68.64";
