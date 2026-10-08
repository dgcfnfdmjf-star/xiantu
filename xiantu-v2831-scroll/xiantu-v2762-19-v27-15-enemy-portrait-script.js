(function(){
  const SOURCES={
    male:'./v2762-asset-enemy-generic-male.webp?v=2765-observer-loop-fix-20260904',
    female:'./v2762-asset-enemy-generic-female.webp?v=2765-observer-loop-fix-20260904',
    beast:'./v2762-asset-enemy-generic-beast.webp?v=2765-observer-loop-fix-20260904'
  };
  function ensureEnemyImageV215(kind){
    const src=SOURCES[kind];
    if(!src)return null;
    return ENEMY_IMAGE_CACHE_V2767.get(src,()=>{
      try{
        if(typeof currentEnemy!=='undefined'&&currentEnemy&&enemyPortraitKindV215(currentEnemy.name)===kind){
          window.drawCharacter?.(document.getElementById('enemyChar'),currentEnemy.name,player?.level||0,true);
        }
      }catch(_){}
    });
  }

  function enemyPortraitKindV215(name=''){
    name=String(name||'');
    if(!name||name.includes('天劫'))return null;
    if(/火凤|凤凰|凤族|焰姬|炎姬|火灵女|赤炎女/.test(name))return 'female';
    if(/狼|兽|妖王|妖兽|妖狐|灵狐|狐狸|蛇|蟒|蛟|龙|鹰|虎|兔|龟|猿|树妖|树精|灵兽|魔界邪兽|冰霜|雪域|寒冰/.test(name))return 'beast';
    if(/山贼|邪修|魔修|鬼|将|守将|老祖|宗主|长老|弟子|修士|真人|道人|散修|剑修|魔头|血魔|幽冥/.test(name))return 'male';
    return null;
  }
  function drawEnemyPortraitV215(canvas,name){
    if(!canvas)return false;
    const kind=enemyPortraitKindV215(name);
    if(!kind)return false;
    const im=ensureEnemyImageV215(kind);
    if(!im?.complete||!im.naturalWidth)return false;
    const ctx=canvas.getContext('2d'),w=canvas.width||180,h=canvas.height||225;
    ctx.clearRect(0,0,w,h);
    const aura=kind==='female'?'rgba(255,125,35,.22)':kind==='beast'?'rgba(255,35,45,.20)':'rgba(154,75,255,.20)';
    const g=ctx.createRadialGradient(w*.5,h*.46,0,w*.5,h*.46,w*.52);
    g.addColorStop(0,aura);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const scale=Math.min(w/im.naturalWidth,h/im.naturalHeight)*1.08,dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;
    ctx.save();ctx.translate(w,0);ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,(w-dw)/2,h-dh,dw,dh);ctx.restore();
    return true;
  }
  const base=window.drawCharacter;
  if(typeof base==='function'){
    window.drawCharacter=function(canvas,type,level,isEnemy=false){if(isEnemy&&canvas?.id==='enemyChar'&&drawEnemyPortraitV215(canvas,type))return;return base.apply(this,arguments)};
  }
  window.enemyPortraitKindV215=enemyPortraitKindV215;
  window.drawEnemyPortraitV215=drawEnemyPortraitV215;
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-19-v27-15-enemy-portrait-script.js"]="28.68.32";
