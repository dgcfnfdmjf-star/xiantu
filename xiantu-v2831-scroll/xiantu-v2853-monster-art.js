/* V28.68. Shared ink-scroll identities for map, battle and war. Presentation only. */
const SCROLL_MONSTER_ART_V2853={
  keys:['wolf','frost-wolf','fox','tiger','dragon','ape','eagle','phoenix','serpent','spider','treant','golem','bandit','cultivator','demon-general','ghost','celestial-guard','war-spirit','mist-lord','blood-elder'],
  extraKeys:['rabbit','turtle','bat'],
  failed:new WeakSet(),configured:new WeakSet(),version:'2868-mini-return-20261015'
};
function scrollMonsterKeyV2853(name='',region='',generic=false){
  const n=String(name||'').replace(/【?精英】?[·・\s]*/g,'').trim();
  // Named people, the player and tribulations retain their established character art.
  if(!n||/夜无疆|天劫|雷劫|苏晚晴|洛清寒|姬红绫/.test(n))return null;
  if(/兔/.test(n))return 'rabbit';
  if(/龟/.test(n))return 'turtle';
  if(/蝙蝠/.test(n))return 'bat';
  if(/血魔老祖/.test(n))return 'blood-elder';
  if(/迷雾领主|幽冥鬼王/.test(n))return 'mist-lord';
  if(/战神|战魂|亡灵战士|古代将军/.test(n))return 'war-spirit';
  if(/宗门试炼守将|秘境守护者|秘境之主|天兵|护卫|仙兵|仙将|巡天镇界仙卫/.test(n))return 'celestial-guard';
  if(/鬼将|魔将|魔族将军/.test(n))return 'demon-general';
  if(/冰.*狼|霜.*狼|雪.*狼|寒.*狼/.test(n))return 'frost-wolf';
  if(/狼/.test(n))return 'wolf';
  if(/狐/.test(n))return 'fox';
  if(/树精|树妖/.test(n))return 'treant';
  if(/傀儡|石灵|石妖/.test(n))return 'golem';
  if(/猿|猴/.test(n))return 'ape';
  if(/鹰|雕/.test(n))return 'eagle';
  if(/火凤|凤凰|凤鸟|朱雀/.test(n))return 'phoenix';
  if(/蛟|龙/.test(n))return 'dragon';
  if(/蛇|蟒/.test(n))return 'serpent';
  if(/蛛|蝎|虫/.test(n))return 'spider';
  if(/虎|灵兽|妖兽|邪兽|妖王/.test(n))return 'tiger';
  if(/鬼|魂|幽灵|迷雾妖|尸妖/.test(n))return 'ghost';
  if(/山贼|盗|匪|刺客/.test(n))return 'bandit';
  if(/邪修|魔修|魔头|血魔/.test(n))return 'cultivator';
  if(generic)return region==='demon_domain'?'demon-general':region==='immortal_domain'?'celestial-guard':'bandit';
  return null;
}
function scrollMonsterTileV2853(key){
  const extra=SCROLL_MONSTER_ART_V2853.extraKeys.indexOf(key);
  if(extra>=0){
    const image=SCROLL_ART_V2831.smallBeastsV28682;
    if(!image?.complete||!image.naturalWidth)return null;
    const cuts=[0,640/2172,1420/2172,1],x=cuts[extra]*image.naturalWidth;
    return {image,x,y:0,w:(cuts[extra+1]-cuts[extra])*image.naturalWidth,h:image.naturalHeight};
  }
  const index=SCROLL_MONSTER_ART_V2853.keys.indexOf(key),image=SCROLL_ART_V2831.monstersV2853;
  if(index<0||!image?.complete||!image.naturalWidth)return null;
  const w=image.naturalWidth/5,h=image.naturalHeight/4;return {image,x:(index%5)*w,y:Math.floor(index/5)*h,w,h};
}
function drawScrollMonsterTileV2853(ctx,key,x,y,w,h,mirror=false){
  const tile=scrollMonsterTileV2853(key);if(!tile)return false;
  ctx.save();ctx.imageSmoothingEnabled=true;
  if(mirror){ctx.translate(x+w,y);ctx.scale(-1,1);x=0;y=0;}
  ctx.drawImage(tile.image,tile.x,tile.y,tile.w,tile.h,x,y,w,h);ctx.restore();return true;
}
function drawScrollMonsterPendingV2853(ctx){
  // Brief loading marker, with no additional image requests or animation loop.
  ctx.save();ctx.strokeStyle='#84765799';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,-12,12,16,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#77644c88';ctx.font='12px serif';ctx.textAlign='center';ctx.fillText('…',0,-10);ctx.restore();return true;
}
// Species silhouettes remain recognizable even offline or while the atlas is loading.
function drawSmallBeastFallbackV28682(ctx,key,x,y,w,h){
  ctx.save();ctx.translate(x,y);ctx.scale(w/100,h/100);ctx.fillStyle=key==='rabbit'?'#c9cab2':key==='turtle'?'#647e68':'#66556f';ctx.strokeStyle='#354039';ctx.lineWidth=2;
  const oval=(x,y,rx,ry)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
  if(key==='rabbit'){oval(55,68,29,22);oval(30,47,17,17);oval(23,24,6,22);oval(37,25,6,22);oval(31,87,15,6);oval(72,86,17,7);oval(86,60,8,8);}
  else if(key==='turtle'){for(const x of [35,68])for(const y of [57,82])oval(x,y,10,7);oval(17,67,14,10);oval(53,64,34,22);ctx.beginPath();ctx.moveTo(53,43);ctx.lineTo(36,57);ctx.lineTo(36,73);ctx.lineTo(53,86);ctx.lineTo(70,73);ctx.lineTo(70,57);ctx.closePath();ctx.stroke();}
  else{ctx.beginPath();ctx.moveTo(50,50);ctx.lineTo(3,18);ctx.quadraticCurveTo(10,44,4,70);ctx.quadraticCurveTo(18,54,30,75);ctx.quadraticCurveTo(40,59,50,76);ctx.quadraticCurveTo(60,59,70,75);ctx.quadraticCurveTo(82,54,96,70);ctx.quadraticCurveTo(90,44,97,18);ctx.closePath();ctx.fill();ctx.stroke();oval(50,57,10,22);ctx.beginPath();ctx.moveTo(40,40);ctx.lineTo(40,23);ctx.lineTo(50,35);ctx.lineTo(60,23);ctx.lineTo(60,40);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#202723';ctx.beginPath();ctx.arc(key==='rabbit'?24:key==='turtle'?10:46,key==='rabbit'?45:key==='turtle'?64:41,2,0,Math.PI*2);ctx.fill();ctx.restore();return true;
}
const drawMapMonsterBeforeV2853=drawInkEnemyV2833;
drawInkEnemyV2833=function(ctx,monster){
  loadScrollArtV2831();const key=scrollMonsterKeyV2853(monster.enemy?.name,monster.regionId,true);
  if(!key)return drawMapMonsterBeforeV2853(ctx,monster);
  const h=monster.enemy?._isElite?86:76,w=h*(key==='bat'?1.3:key==='turtle'?1:.8);
  if(drawScrollMonsterTileV2853(ctx,key,-w/2,24-h,w,h))return true;
  if(SCROLL_MONSTER_ART_V2853.extraKeys.includes(key))return drawSmallBeastFallbackV28682(ctx,key,-w/2,24-h,w,h);
  if(SCROLL_ART_V2831.enemies||SCROLL_ART_V2831.beasts)return drawMapMonsterBeforeV2853(ctx,monster);
  return drawScrollMonsterPendingV2853(ctx);
};
function drawScrollWarFigureV2853(ctx,side,height){
  loadScrollArtV2831();return drawScrollMonsterTileV2853(ctx,side?'demon-general':'celestial-guard',-height*.4,5-height,height*.8,height,true);
}
function scrollMonsterImageV2853(key){
  const src='./monster-'+key+'-v2853.webp?v='+SCROLL_MONSTER_ART_V2853.version;
  const refresh=()=>{
    if(document.hidden||!currentEnemy||scrollMonsterKeyV2853(currentEnemy.name)!==key)return;
    const canvas=document.getElementById('enemyChar');if(canvas)window.drawCharacter(canvas,currentEnemy.name,player.level,true);
  };
  const image=ENEMY_IMAGE_CACHE_V2767.get(src,refresh);
  if(!SCROLL_MONSTER_ART_V2853.configured.has(image)){
    SCROLL_MONSTER_ART_V2853.configured.add(image);const oldError=image.onerror;
    image.onerror=()=>{SCROLL_MONSTER_ART_V2853.failed.add(image);oldError?.();refresh();};
  }
  return image;
}
function drawScrollMonsterPortraitV2853(canvas,key){
  if(!canvas?.getContext)return false;
  loadScrollArtV2831();const extra=SCROLL_MONSTER_ART_V2853.extraKeys.includes(key),image=extra?null:scrollMonsterImageV2853(key),ready=image?.complete&&image.naturalWidth;
  const tile=scrollMonsterTileV2853(key);
  if(!ready&&!tile&&SCROLL_MONSTER_ART_V2853.failed.has(image))return false;
  const ctx=canvas.getContext('2d'),w=canvas.width||180,h=canvas.height||225;
  ctx.clearRect(0,0,w,h);ctx.save();
  const base=ctx.createRadialGradient(w*.5,h*.53,w*.04,w*.5,h*.53,w*.58);
  base.addColorStop(0,'rgba(223,214,175,.15)');base.addColorStop(1,'rgba(223,214,175,0)');ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
  if(ready){const scale=Math.min(w/image.naturalWidth,h/image.naturalHeight),dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,(w-dw)/2,h-dh,dw,dh);}
  else if(tile){const scale=Math.min(w/tile.w,h/tile.h),dw=tile.w*scale,dh=tile.h*scale;drawScrollMonsterTileV2853(ctx,key,(w-dw)/2,h-dh,dw,dh);}
  else if(extra){drawSmallBeastFallbackV28682(ctx,key,0,0,w,h);}
  else{ctx.fillStyle='#cfc3a4';ctx.font='13px serif';ctx.textAlign='center';ctx.fillText('妖影渐现…',w/2,h*.56);}
  ctx.restore();const box=document.getElementById('enemyAvatarContainer');
  box?.classList.remove('v2716-exact-portrait','v2717-exact-portrait');box?.classList.add('ink-monster-v2853');
  canvas.setAttribute('aria-label',(currentEnemy?.name||'敌人')+' · 水墨立绘');return true;
}
const drawCharacterBeforeV2853=window.drawCharacter;
window.drawCharacter=function(canvas,type,level,isEnemy=false){
  if(isEnemy&&canvas?.id==='enemyChar'){
    const key=scrollMonsterKeyV2853(type);
    if(key&&drawScrollMonsterPortraitV2853(canvas,key))return;
    document.getElementById('enemyAvatarContainer')?.classList.remove('ink-monster-v2853');
  }
  return drawCharacterBeforeV2853.apply(this,arguments);
};
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2853-monster-art.js']='28.68.84';
