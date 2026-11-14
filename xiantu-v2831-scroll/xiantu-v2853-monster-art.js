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
// Map gait state/cache are runtime-only; battle portraits and enemy/save data stay unchanged.
const MONSTER_GAITS_V1={
 wolf:{speed:1.12,range:210,walk:[4,7],phase:.10,bob:.65,sway:.012,atlas:'wolf'},
 tiger:{speed:1.08,range:190,walk:[4,6.5],phase:.085,bob:.55,sway:.01,atlas:'tiger'},
 fox:{speed:.95,range:155,walk:[3,5],phase:.12,bob:.65,sway:.02,atlas:'fox'},
 ape:{speed:.65,range:110,walk:[2.5,4],phase:.075,bob:.8,sway:.025,atlas:'ape'},
 serpent:{speed:.7,range:125,walk:[3,5],phase:.12,bob:.15,sway:.04,atlas:'serpent'},
 spider:{speed:.8,range:110,walk:[2,4],phase:.15,bob:.35,sway:.015,atlas:'spider'},
 ghost:{speed:.5,range:90,walk:[2.5,4.5],phase:.08,bob:.2,sway:.025,atlas:'ghost'},
 bandit:{speed:.85,range:140,walk:[2.5,5],phase:.09,bob:.6,sway:.018,alert:.3,atlas:'bandit'},
 cultivator:{speed:.8,range:125,walk:[2.5,4.5],phase:.09,bob:.5,sway:.015,alert:.25,atlas:'cultivator'},
 demon:{speed:.75,range:140,walk:[3,5],phase:.08,bob:.65,sway:.02,alert:.2,atlas:'demon'},
 celestial:{speed:.8,range:140,walk:[3,5],phase:.09,bob:.55,sway:.015,alert:.3,atlas:'celestial'},
 treant:{speed:.35,range:65,walk:[2,3.5],phase:.065,bob:.8,sway:.025,atlas:'treant'},
 golem:{speed:.42,range:80,walk:[2,4],phase:.07,bob:.9,sway:.02,atlas:'golem'},
 rabbit:{speed:1,range:120,walk:[2,4],phase:.17,bob:1.1,sway:.02,atlas:'rabbit'},
 turtle:{speed:.32,range:60,walk:[2,4],phase:.12,bob:.25,sway:.025,atlas:'turtle'},
 dragon:{speed:.6,range:160,walk:[3,5],phase:.085,bob:.35,sway:.035,atlas:'dragon'},
 bird:{speed:.9,range:180,walk:[3,5],phase:.12,bob:.5,sway:.035,atlas:'eagle'},
 bat:{speed:.85,range:130,walk:[2,4],phase:.16,bob:.4,sway:.045,atlas:'bat'}
};
const MONSTER_WALK_FAMILIES_V1={'frost-wolf':'wolf','demon-general':'demon','celestial-guard':'celestial',
 'war-spirit':'celestial','mist-lord':'ghost','blood-elder':'cultivator',eagle:'bird',phoenix:'bird'};
const MONSTER_WALK_CYCLE_V1=[1,2,3,2],MONSTER_WALK_STATES_V1=new WeakMap(),MONSTER_WALK_IMAGES_V1=new Map();
function monsterWalkRandomV1(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function monsterWalkStateV1(m){
 let s=MONSTER_WALK_STATES_V1.get(m);if(s&&s.owner===player)return s;
 const key=scrollMonsterKeyV2853(m.enemy?.name,m.regionId,true)||'bandit',family=MONSTER_WALK_FAMILIES_V1[key]||key;
 let seed=2166136261;for(const c of `${m.id||key}|${m.x||0}|${m.y||0}`)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 s={owner:player,key,family,profile:MONSTER_GAITS_V1[family]||MONSTER_GAITS_V1.bandit,seed,
  homeX:m.x||0,homeY:m.y||0,from:{x:m.x||0,y:m.y||0},probe:{x:0,y:0,radius:m.radius||18,regionId:m.regionId},pause:0,moving:false,phase:0,dir:0,alertAt:0};
 s.pause=2+monsterWalkRandomV1(s)*4;MONSTER_WALK_STATES_V1.set(m,s);return s;
}
function clearMonsterWalkFramesV1(){for(const m of FLAT_WORLD.monsters){const s=MONSTER_WALK_STATES_V1.get(m);if(s)s.moving=false;}}
function turnMonsterHomeV1(m,s){
 const dx=s.homeX-m.x,dy=s.homeY-m.y,d=Math.hypot(dx,dy);
 if(d>8){m.dir.x=dx/d;m.dir.y=dy/d;}else{m.dir.x=-m.dir.x;m.dir.y=-m.dir.y;}
}
function chooseMonsterHeadingV1(m,s){
 const b=getRegionInfo(m.regionId||currentRegion||getPlayerRegion()).bounds;
 const returnHome=Math.hypot(m.x-s.homeX,m.y-s.homeY)>s.profile.range*.72;
 s.from.x=m.x;s.from.y=m.y;
 for(let i=0;i<12;i++){
  const angle=returnHome&&i===0?Math.atan2(s.homeY-m.y,s.homeX-m.x):monsterWalkRandomV1(s)*Math.PI*2;
  const dx=Math.cos(angle),dy=Math.sin(angle);s.probe.x=m.x+dx*24;s.probe.y=m.y+dy*24;
  if(monsterWalkStepClearV1(s.probe,s,b.xMin+30,b.xMax-30,b.yMin+30,b.yMax-30)){m.dir.x=dx;m.dir.y=dy;return;}
 }
 m.dir.x=m.dir.y=0;s.pause=2+monsterWalkRandomV1(s)*4;
}
function advanceMonsterRoamV1(m,s,dt){
 if(!Number.isFinite(dt)||dt<0)return false;
 if(s.pause>0){
  s.pause=Math.max(0,s.pause-dt);
  // Occasional stationary lookout: turn once, never advance the feet while waiting.
  if(s.alertAt&&s.pause<s.alertAt){s.dir=(s.dir+2)%8;s.alertAt=0;}
  if(s.pause===0){
   chooseMonsterHeadingV1(m,s);
   m.dirTimer=s.profile.walk[0]+monsterWalkRandomV1(s)*(s.profile.walk[1]-s.profile.walk[0]);
  }
  return false;
 }
 m.dirTimer-=dt;
 if(m.dirTimer<=0){s.pause=2+monsterWalkRandomV1(s)*4;s.alertAt=monsterWalkRandomV1(s)<(s.profile.alert||0)?s.pause/2:0;return false;}
 return true;
}
function monsterWalkStepClearV1(m,s,minX,maxX,minY,maxY){
 if(m.x<minX||m.x>maxX||m.y<minY||m.y>maxY||Math.hypot(m.x-s.homeX,m.y-s.homeY)>s.profile.range)return false;
 const radius=m.radius||18;
 for(const c of FLAT_WORLD.colliders){
  const limit=(c.radius||0)+radius,old=Math.hypot(s.from.x-c.x,s.from.y-c.y);
  // A newly decoded scene may enclose the old position; permit only monotonic escape.
  const leaving=old<limit&&(s.from.x-c.x)*(m.x-s.from.x)+(s.from.y-c.y)*(m.y-s.from.y)>0;
  if(worldDistanceSegmentV2827(c.x,c.y,s.from,m)<(leaving?old:limit)-1e-6)return false;
 }
 for(const p of FLAT_WORLD.pois){
  const old=Math.hypot(s.from.x-p.x,s.from.y-p.y),limit=p.r+78;
  if(worldDistanceSegmentV2827(p.x,p.y,s.from,m)<Math.min(old,limit)-1e-6)return false;
 }
 for(const z of getWorldMapConfig(m.regionId||currentRegion).safeZones||[]){
  const old=Math.hypot(s.from.x-z.x,s.from.y-z.y);
  if(worldDistanceSegmentV2827(z.x,z.y,s.from,m)<Math.min(old,z.r+radius)-1e-6)return false;
 }
 return true;
}
function recordMonsterStepV1(m,s){
 const dx=m.x-s.from.x,dy=m.y-s.from.y,d=Math.hypot(dx,dy);
 s.moving=d>.001&&d<70;
 if(s.moving){s.phase=(s.phase+d*s.profile.phase)%(Math.PI*2);s.dir=(Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8;}
}
function monsterWalkImageV1(family){
 if(!family||PERF_CONFIG.mobile&&PERF_CONFIG.lowEnd)return null;
 let entry=MONSTER_WALK_IMAGES_V1.get(family);
 if(entry){MONSTER_WALK_IMAGES_V1.delete(family);MONSTER_WALK_IMAGES_V1.set(family,entry);return entry.ready?entry.image:null;}
 const image=new Image();entry={image,ready:false};image.decoding='async';
 image.onload=()=>{entry.ready=image.naturalWidth===512&&image.naturalHeight===480;image.onload=image.onerror=null;};
 image.onerror=()=>{entry.ready=false;image.onload=image.onerror=null;};
 MONSTER_WALK_IMAGES_V1.set(family,entry);image.src=`./art/monsters/walk-v1/${family}.webp`;
 if(MONSTER_WALK_IMAGES_V1.size>8){const [key,old]=MONSTER_WALK_IMAGES_V1.entries().next().value;old.image.onload=old.image.onerror=null;old.image.removeAttribute?.('src');MONSTER_WALK_IMAGES_V1.delete(key);}
 return null;
}
function releaseMonsterWalkImagesV1(){for(const e of MONSTER_WALK_IMAGES_V1.values()){e.image.onload=e.image.onerror=null;e.image.removeAttribute?.('src');}MONSTER_WALK_IMAGES_V1.clear();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseMonsterWalkImagesV1();});
window.addEventListener('pagehide',releaseMonsterWalkImagesV1);
function drawMonsterWalkV1(ctx,m,s){
 const im=monsterWalkImageV1(s.key==='frost-wolf'||s.key==='phoenix'?s.key:s.profile.atlas);if(!im)return false;
 const row=s.dir===2||s.dir===6?1:s.dir>=3&&s.dir<=5?2:0;
 const moving=s.moving&&!(m.battleCooldown>0),frame=moving?MONSTER_WALK_CYCLE_V1[Math.floor(s.phase/(Math.PI/2))]:0;
 const h=m.enemy?._isElite?86:76,w=h*.8,bob=moving?Math.sin(s.phase*2)*s.profile.bob:0;
 // Authored front poses retain their source orientation; all side/rear rows face right.
 const sourceLeft=row===0&&s.family!=='fox'&&s.family!=='treant',mirror=(s.dir>=5)!==sourceLeft;
 ctx.save();if(mirror)ctx.scale(-1,1);
 ctx.drawImage(im,frame*128,row*160,128,160,-w/2,24-h+bob,w,h);ctx.restore();return true;
}
function applyMonsterFallbackGaitV1(ctx,s,m){
 const mirror=s.dir<5; // Existing map atlas poses generally face left.
 if(mirror)ctx.scale(-1,1);
 if(!s.moving||m.battleCooldown>0)return;
 const step=Math.sin(s.phase),bob=Math.sin(s.phase*2)*s.profile.bob;
 ctx.translate(step*.7,bob);ctx.rotate(step*s.profile.sway);
 // Stretch/squash changes the actual body/wing silhouette, in addition to ground motion.
 ctx.translate(0,24);ctx.scale(1+step*.025,1-Math.abs(step)*.025);ctx.translate(0,-24);
}
const drawMapMonsterBeforeV2853=drawInkEnemyV2833;
drawInkEnemyV2833=function(ctx,monster){
  loadScrollArtV2831();const key=scrollMonsterKeyV2853(monster.enemy?.name,monster.regionId,true);
  if(!key)return drawMapMonsterBeforeV2853(ctx,monster);
  const walk=monsterWalkStateV1(monster);
  if(drawMonsterWalkV1(ctx,monster,walk))return true;
  ctx.save();applyMonsterFallbackGaitV1(ctx,walk,monster);
  const h=monster.enemy?._isElite?86:76,w=h*(key==='bat'?1.3:key==='turtle'?1:.8);
  let drawn=drawScrollMonsterTileV2853(ctx,key,-w/2,24-h,w,h);
  if(!drawn&&SCROLL_MONSTER_ART_V2853.extraKeys.includes(key))drawn=drawSmallBeastFallbackV28682(ctx,key,-w/2,24-h,w,h);
  if(!drawn&&(SCROLL_ART_V2831.enemies||SCROLL_ART_V2831.beasts))drawn=drawMapMonsterBeforeV2853(ctx,monster);
  if(!drawn)drawn=drawScrollMonsterPendingV2853(ctx);
  ctx.restore();return drawn;
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
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2853-monster-art.js']='28.68.124';
