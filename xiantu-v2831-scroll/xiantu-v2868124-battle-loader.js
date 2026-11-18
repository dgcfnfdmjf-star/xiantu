// Keep early casts readable without reviving the legacy particle effects (which
// consume gameplay RNG). The full skill renderer replaces this hook when ready.
window.playInkSkillV2854=function(name,element,side,source){
 const label=document.getElementById('inkFxNameV2854');
 if(label&&gameState==='combat')label.textContent=(source==='passive'?'被动':side==='enemy'?'敌方':'我方')+' · '+name;
 return true;
};

// Combat starts synchronously. Share pending downloads and retry only confirmed
// network failures on a later battle. Never execute a mismatched module twice.
const loadBattlePresentationV2868124=(()=>{
 const files=['xiantu-v2855-skill-fx.js','xiantu-v2868124-duel-scene.js'];
 const build='28.68.124';
 const requests=new Map();
 const query=document.currentScript?.src.split('?')[1]?.split('&')[0]||'v=2868124-audit-20261118';
 const matches=name=>window.__xiantuBuildFilesV2814?.[name]===build;
 function load(name){
  if(requests.has(name))return requests.get(name);
  const request=new Promise(resolve=>{
   const script=document.createElement('script');
   script.src='./'+name+'?'+query;
   script.onload=()=>resolve(matches(name));
   script.onerror=()=>{script.remove();requests.delete(name);resolve(false);};
   document.head.appendChild(script);
  });
  requests.set(name,request);
  return request;
 }
 return attach=>{
  if(files.every(matches)){attach(window.XiantuDuel25D);return;}
  Promise.all(files.map(load)).then(results=>{if(results.every(Boolean))attach(window.XiantuDuel25D);});
 };
})();
;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2868124-battle-loader.js']='28.68.124';
