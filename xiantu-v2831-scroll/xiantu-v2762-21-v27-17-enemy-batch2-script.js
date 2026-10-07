(function(){
  const SOURCES={"夜无疆":"./portrait-yewuji-v2810.webp","雷鹰":"./v2762-asset-enemy-thunder-eagle.webp?v=2765-observer-loop-fix-20260904","火凤幼崽":"./v2762-asset-enemy-fire-phoenix-cub.webp?v=2765-observer-loop-fix-20260904","冰龙幼崽":"./v2762-asset-enemy-ice-dragon-cub.webp?v=2765-observer-loop-fix-20260904","九尾灵狐":"./v2762-asset-enemy-nine-tailed-fox.webp?v=2765-observer-loop-fix-20260904","暗影魔狼":"./v2762-asset-enemy-shadow-wolf.webp?v=2765-observer-loop-fix-20260904","宗门试炼守将":"./v2762-asset-enemy-sect-trial-guard.webp?v=2765-observer-loop-fix-20260904","战神之魂":"./v2762-asset-enemy-war-god-spirit.webp?v=2765-observer-loop-fix-20260904","幽冥鬼王":"./v2762-asset-enemy-nether-ghost-king.webp?v=2765-observer-loop-fix-20260904","迷雾领主":"./v2762-asset-enemy-mist-lord.webp?v=2765-observer-loop-fix-20260904","血魔老祖":"./v2762-asset-enemy-blood-demon-ancestor.webp?v=2765-observer-loop-fix-20260904"};
  const EXACT_NAMES=new Set(Object.keys(SOURCES));
  function normalizeEnemyNameV217(name=''){
    return String(name||'').replace(/^【?精英】?[·・\s]*/,'').replace(/^精英[·・\s]*/,'').trim();
  }
  function ensureExactEnemyImageV217(name){
    if(!EXACT_NAMES.has(name))return null;
    return ENEMY_IMAGE_CACHE_V2767.get(SOURCES[name],()=>{
      try{
        if(typeof currentEnemy!=='undefined'&&currentEnemy&&normalizeEnemyNameV217(currentEnemy.name)===name){
          window.drawCharacter?.(document.getElementById('enemyChar'),name,player?.level||0,true);
        }
      }catch(_){}
    });
  }

  function getExactEnemyImageV217(name=''){
    const n=normalizeEnemyNameV217(name);
    if(!EXACT_NAMES.has(n))return null;
    return {name:n,image:ensureExactEnemyImageV217(n)};
  }
  function drawExactEnemyPortraitV217(canvas,name){
    if(!canvas)return false;
    const hit=getExactEnemyImageV217(name);
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
    box?.classList.remove('v2716-exact-portrait');
    box?.classList.add('v2717-exact-portrait');
    return true;
  }
  const previous=window.drawCharacter;
  if(typeof previous==='function'){
    window.drawCharacter=function(canvas,type,level,isEnemy=false){
      if(isEnemy&&canvas?.id==='enemyChar'){
        const box=document.getElementById('enemyAvatarContainer');
        box?.classList.remove('v2717-exact-portrait');
        if(drawExactEnemyPortraitV217(canvas,type))return;
      }
      return previous.apply(this,arguments);
    };
  }
  window.V217_ENEMY_PORTRAITS=Object.keys(SOURCES);
  window.getExactEnemyImageV217=getExactEnemyImageV217;
  window.drawExactEnemyPortraitV217=drawExactEnemyPortraitV217;
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-21-v27-17-enemy-batch2-script.js"]="28.68.30";
