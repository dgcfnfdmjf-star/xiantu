(function(){
  const SOURCES={"野狼":"./v2762-asset-enemy-wolf.webp?v=2765-observer-loop-fix-20260904","山贼":"./v2762-asset-enemy-bandit.webp?v=2765-observer-loop-fix-20260904","妖兽":"./v2762-asset-enemy-demon-beast.webp?v=2765-observer-loop-fix-20260904","邪修":"./v2762-asset-enemy-evil-cultivator.webp?v=2765-observer-loop-fix-20260904","魔修":"./v2762-asset-enemy-demon-cultivator.webp?v=2765-observer-loop-fix-20260904","幽冥鬼":"./v2762-asset-enemy-nether-ghost.webp?v=2765-observer-loop-fix-20260904","鬼将":"./v2762-asset-enemy-ghost-general.webp?v=2765-observer-loop-fix-20260904","冰霜巨狼":"./v2762-asset-enemy-frost-wolf.webp?v=2765-observer-loop-fix-20260904","寒冰蛟龙":"./v2762-asset-enemy-ice-dragon.webp?v=2765-observer-loop-fix-20260904","远古巨猿":"./v2762-asset-enemy-ancient-ape.webp?v=2765-observer-loop-fix-20260904"};
  const EXACT_NAMES=new Set(Object.keys(SOURCES));
  function normalizeEnemyNameV216(name=''){
    return String(name||'').replace(/^【?精英】?[·・\s]*/,'').replace(/^精英[·・\s]*/,'').trim();
  }
  function ensureExactEnemyImageV216(name){
    if(!EXACT_NAMES.has(name))return null;
    return ENEMY_IMAGE_CACHE_V2767.get(SOURCES[name],()=>{
      try{
        if(typeof currentEnemy!=='undefined'&&currentEnemy&&normalizeEnemyNameV216(currentEnemy.name)===name){
          window.drawCharacter?.(document.getElementById('enemyChar'),name,player?.level||0,true);
        }
      }catch(_){}
    });
  }

  function getExactEnemyImageV216(name=''){
    const n=normalizeEnemyNameV216(name);
    if(!EXACT_NAMES.has(n))return null;
    return {name:n,image:ensureExactEnemyImageV216(n)};
  }
  function drawExactEnemyPortraitV216(canvas,name){
    if(!canvas)return false;
    const hit=getExactEnemyImageV216(name);
    if(!hit)return false;
    const im=hit.image;
    if(!im?.complete||!im.naturalWidth)return false;
    const ctx=canvas.getContext('2d'),w=canvas.width||180,h=canvas.height||225;
    ctx.clearRect(0,0,w,h);
    const g=ctx.createRadialGradient(w*.5,h*.48,0,w*.5,h*.48,w*.55);
    g.addColorStop(0,'rgba(255,115,85,.16)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const scale=Math.min(w/im.naturalWidth,h/im.naturalHeight)*1.12,dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,(w-dw)/2,h-dh,dw,dh);
    const box=document.getElementById('enemyAvatarContainer');
    box?.classList.remove('v2717-exact-portrait');
    box?.classList.add('v2716-exact-portrait');
    return true;
  }
  const previous=window.drawCharacter;
  if(typeof previous==='function'){
    window.drawCharacter=function(canvas,type,level,isEnemy=false){
      if(isEnemy&&canvas?.id==='enemyChar'){
        const box=document.getElementById('enemyAvatarContainer');
        box?.classList.remove('v2716-exact-portrait');
        if(drawExactEnemyPortraitV216(canvas,type))return;
      }
      return previous.apply(this,arguments);
    };
  }
  window.V216_ENEMY_PORTRAITS=Object.keys(SOURCES);
  window.getExactEnemyImageV216=getExactEnemyImageV216;
  window.drawExactEnemyPortraitV216=drawExactEnemyPortraitV216;
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-20-v27-16-enemy-batch1-script.js"]="28.68.56";
