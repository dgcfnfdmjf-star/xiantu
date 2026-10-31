// V28.47: the existing world renderer owns war animation, visibility and cadence.
// Formation sprites express campaign state; only the combat/command rules award results.
const WAR_MAP_V2840={owner:null,source:null,key:'',scene:null,clock:0,hudKey:'',reduced:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches};
const WAR_ART_V286888={unit:1.38,post:1.55};
const WAR_MAP_POI_V2840='war_command_v2840';
function warMapSourceV2840(){
 const w=player?.warState,c=w?.campaignV2775;
 if(c&&!c.settled&&warStageValidV2839(c))return {record:c,kind:c.step<3?'battle':'victory'};
 if(w?.incomingV2839&&!isFactionDestroyed(w.incomingV2839.enemy))return {record:w.incomingV2839,kind:'incoming'};
 return null;
}
function validWarSiteV2840(site){
 const cfg=WORLD_MAP_CONFIGS[site?.region];return !!cfg&&Number.isFinite(site.x)&&Number.isFinite(site.y)&&site.x>=175&&site.x<=cfg.width-175&&site.y>=180&&site.y<=cfg.height-200;
}
function migrateWarSiteV2900(site){
 if(!site||Number(site.layoutV2900)>=1||!WORLD_MAP_BASE_V2900[site.region]||![site.x,site.y].every(Number.isFinite))return site;
 return {...site,x:Math.round(site.x*WORLD_SCALE_V2900),y:Math.round(site.y*WORLD_SCALE_V2900),layoutV2900:1};
}
function chooseWarSiteV2840(record,kind){
 const attacking=kind!=='incoming'&&record?.mode!=='defense';
 const enemyRegion=attacking?FACTION_LOCATIONS_V2806[record?.enemy]?.region:null;
 const home=FACTION_LOCATIONS_V2806[player.sect]?.region;
 const region=enemyRegion&&isRegionUnlocked(enemyRegion)?enemyRegion:home&&isRegionUnlocked(home)?home:(isRegionUnlocked(currentRegion)?currentRegion:'south');
 const cfg=getWorldMapConfig(region),pois=buildWorldMapPois(region),origin=pois.find(p=>p.name===(region===enemyRegion?record.enemy:player.sect))||cfg.hub||cfg.spawn;
 let best=null,bestScore=-Infinity;
 // A fixed-size search for an open clearing; no map-size bitmap or per-frame search.
 for(let y=360;y<=cfg.height-330;y+=60)for(let x=190;x<=cfg.width-190;x+=80){
  let space=1e9;for(const p of pois){const dx=Math.abs(x-p.x)-150,dy=Math.abs(y-(p.y-35))-150;space=Math.min(space,Math.hypot(Math.max(dx,0),Math.max(dy,0))+Math.min(Math.max(dx,dy),0)-Math.max(35,(p.r||35)*.65));}
  const score=Math.min(space,240)*3-Math.hypot(x-origin.x,y-origin.y)*.12;
  if(score>bestScore){bestScore=score;best={region,x,y};}
 }
 return {...(best||{region,x:cfg.width/2,y:cfg.height/2}),layoutV2900:1};
}
function resetWarMapV2840(){
 WAR_MAP_V2840.owner=null;WAR_MAP_V2840.source=null;WAR_MAP_V2840.key='';WAR_MAP_V2840.scene=null;WAR_MAP_V2840.clock=0;WAR_MAP_V2840.hudKey='';
 if(typeof FLAT_WORLD!=='undefined')FLAT_WORLD.pois=FLAT_WORLD.pois.filter(p=>p.id!==WAR_MAP_POI_V2840);
 document.getElementById('warMapBarV2840')?.remove();
}
function syncWarMapV2840(){
 const state=WAR_MAP_V2840;if(state.owner!==player){resetWarMapV2840();state.owner=player;}
 const source=warMapSourceV2840();
 if(!source){if(state.source){resetWarMapV2840();state.owner=player;}return null;}
 const c=source.record;c.mapV2840=migrateWarSiteV2900(c.mapV2840);if(!validWarSiteV2840(c.mapV2840))c.mapV2840=chooseWarSiteV2840(c,source.kind);
 const site=c.mapV2840,key=[c.id,source.kind,c.step||0,site.region,site.x,site.y,currentRegion,PERF_CONFIG.ultraSmooth,PERF_CONFIG.mobile].join(':');
 if(state.key!==key||state.source!==c){
  state.key=key;state.source=c;state.clock=0;
  FLAT_WORLD.pois=FLAT_WORLD.pois.filter(p=>p.id!==WAR_MAP_POI_V2840);
  const local=site.region===currentRegion,units=[],rows=PERF_CONFIG.ultraSmooth?4:PERF_CONFIG.mobile?5:7;
  if(local){
   for(let side=0;side<2;side++)for(let row=0;row<rows;row++)for(let rank=0;rank<2;rank++)units.push({_warUnitV2840:true,side,row,rank,x:0,y:0,phase:row*.71+rank*.63+side*.37});
   FLAT_WORLD.pois.push({id:WAR_MAP_POI_V2840,name:source.kind==='incoming'?'山门迎敌·军令台':source.kind==='victory'?'战役待结算·军令台':'正魔前线·军令台',icon:'⚑',action:'war_map_v2840',region:site.region,x:site.x,y:site.y+138,r:30,desc:'查看军令、亲自参战或指挥联军；战果按战役规则结算'});
  }
  state.scene={site,kind:source.kind,step:c.step||0,units,rows,local,record:c};
 }
 // Map layout replacement can remove the dynamic post without changing the campaign.
 if(state.scene.local&&!FLAT_WORLD.pois.some(p=>p.id===WAR_MAP_POI_V2840)){state.key='';return syncWarMapV2840();}
 updateWarMapBarV2840(state.scene);return state.scene;
}
function openWarOrdersV2840(){
 if(!warAllowedV2839())return;const source=warMapSourceV2840();if(!source)return;
 source.kind==='incoming'?declareWar(source.record.enemy):showWarCampaignV2775();
}
function viewWarMapV2840(){
 if(!warAllowedV2839())return false;const scene=syncWarMapV2840();if(!scene)return false;
 const {site}=scene;if(!isRegionUnlocked(site.region)){warnRegionLocked(site.region,'战场所在地域尚未开放');return false;}
 closeWarPanelV2839();closeTaskPanel();closeSceneV2838();closeScrollMapV2837();closeWorldOverlay();
 if(currentRegion!==site.region&&!applyWorldMapLayout(site.region,false))return false;
 syncWarMapV2840();stopNavigationV2830();FLAT_WORLD.target=null;FLAT_WORLD.tapTargetFx=null;FLAT_WORLD.keys={};
 // Place the hero behind the allied command post, clear of the decorative formations.
 let destination={x:site.x,y:site.y+155},safe=false;
 for(const dy of [155,180,205]){for(const dx of [0,-35,35,-70,70]){
  const x=site.x+dx,y=site.y+dy;if(x<25||y>FLAT_WORLD.height-25)continue;
  if(!FLAT_WORLD.colliders.some(o=>Math.hypot(x-o.x,y-o.y)<(o.radius||0)+20)){destination={x,y};safe=true;break;}
 }if(safe)break;}
 if(typeof resetMapAliveV2893==='function')resetMapAliveV2893();
 FLAT_WORLD.player.x=destination.x;FLAT_WORLD.player.y=destination.y;
 const canvas=document.getElementById('worldCanvas'),vw=(canvas?.width||390)/(canvas?._dpr||1),vh=(canvas?.height||700)/(canvas?._dpr||1);
 FLAT_WORLD.camera.x=Math.max(0,Math.min(Math.max(0,FLAT_WORLD.width-vw),destination.x-vw/2));FLAT_WORLD.camera.y=Math.max(0,Math.min(Math.max(0,FLAT_WORLD.height-vh),warCameraYV2840(destination,vh)));
 resetPaintedMotionV2838();revealExplorationV2828();updateWorldHUD();autoSave();return true;
}
function warCameraYV2840(p,vh){
 const s=WAR_MAP_V2840.scene;if(!s?.local)return p.y-vh/2;
 const distance=Math.hypot(p.x-s.site.x,p.y-s.site.y),weight=Math.max(0,Math.min(1,(280-distance)/100));
 return (p.y-vh/2)*(1-weight)+(s.site.y-vh*.5)*weight;
}
function updateWarMapBarV2840(scene){
 const c=scene.record,key=[WAR_MAP_V2840.key,c.morale,c.supplies,c.score,player.hp,player.mp].join(':');
 let el=document.getElementById('warMapBarV2840');if(el&&key===WAR_MAP_V2840.hudKey)return;
 const parent=document.getElementById('worldPanel');if(!parent)return;
 if(!el){el=document.createElement('aside');el.id='warMapBarV2840';el.className='war-map-bar-v2840';el.setAttribute('aria-label','正魔战场');parent.appendChild(el);}
 WAR_MAP_V2840.hudKey=key;const esc=discipleEscV2815;
 const name=scene.kind==='incoming'?'魔军压境 · 待迎敌':scene.kind==='victory'?'三处目标结束 · 待结算':WAR_FRONTS_V2839[scene.step].name;
 el.innerHTML=`<div><strong>${esc(name)}</strong><small>${scene.local?'本图前线':esc(getRegionInfo(scene.site.region).shortName)+'战场'}${scene.kind==='battle'?` · 士气${c.morale} · 战备${c.supplies}`:''}</small></div><button type="button" data-war-map="view">看战场</button><button type="button" data-war-map="orders">${scene.kind==='incoming'?'迎敌':scene.kind==='victory'?'结算':'参战'}</button>`;
 const owner=player,record=c;el.onclick=e=>{const b=e.target.closest('button');if(!b||!el.contains(b)||owner!==player||warMapSourceV2840()?.record!==record||!warAllowedV2839())return;e.stopPropagation?.();if(b.dataset.warMap==='view')viewWarMapV2840();else openWarOrdersV2840();};
 el.onpointerdown=e=>e.stopPropagation();el.onkeydown=e=>e.stopPropagation();
}
function warSpriteInViewV286888(o,view){
 const scale=o?._warUnitV2840?WAR_ART_V286888.unit:o?.action==='war_map_v2840'?WAR_ART_V286888.post:0;if(!scale)return false;
 const half=(o._warUnitV2840?46:40)*scale,top=(o._warUnitV2840?90:86)*scale,bottom=(o._warUnitV2840?16:34)*scale;
 return o.x+half>=view.minX&&o.x-half<=view.maxX&&o.y+bottom>=view.minY&&o.y-top<=view.maxY;
}
function warSceneVisibleV2840(scene,view){const p=scene.site;return scene.local&&p.x+210>=view.minX&&p.x-210<=view.maxX&&p.y+200>=view.minY&&p.y-240<=view.maxY;}
function appendWarUnitsV2840(items,dt,view){
 const state=WAR_MAP_V2840,scene=state.scene;if(!scene||!warSceneVisibleV2840(scene,view))return;
 if(!state.reduced)state.clock+=Math.max(0,Math.min(.05,dt));
 const time=state.clock,active=scene.kind==='battle';
 for(const u of scene.units){
  const dir=u.side===0?1:-1,cycle=(time*.65+u.phase)%(Math.PI*2),charge=active?Math.max(0,Math.sin(cycle))*34:0;
  u.x=scene.site.x-dir*(68+u.rank*44)+dir*charge;
  u.y=scene.site.y+(u.row-(scene.rows-1)/2)*31+u.rank*8+(active&&!state.reduced?Math.sin(cycle*2)*2:0);
  u.attack=active&&!state.reduced&&Math.sin(cycle)>.84;u.frame=active&&!state.reduced?1+Math.floor((time*5+u.phase)%3):0;
  if(warSpriteInViewV286888(u,view))items.push(u);
 }
}
function warFlagV2840(ctx,x,y,side,time,label){
 const dir=side?-1:1,wave=Math.sin(time*2+side)*3;
 ctx.save();ctx.translate(x,y);ctx.fillStyle='#222d2588';ctx.beginPath();ctx.ellipse(0,5,20,5,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#746043';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(0,-79);ctx.stroke();
 ctx.fillStyle=side?'#793c41':'#3c716a';ctx.strokeStyle=side?'#c9947c':'#d5ce9e';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(0,-78);ctx.quadraticCurveTo(dir*20,-85+wave,dir*37,-75);ctx.lineTo(dir*34,-37);ctx.quadraticCurveTo(dir*19,-48+wave,0,-41);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff0c5';ctx.font='bold 19px serif';ctx.textAlign='center';ctx.fillText(label,dir*18,-53);ctx.restore();
}
function drawWarGroundV2840(ctx,view){
 const state=WAR_MAP_V2840,s=state.scene;if(!s||!warSceneVisibleV2840(s,view))return;
 const {x,y}=s.site,t=state.reduced?0:state.clock,active=s.kind==='battle';
 ctx.save();ctx.translate(x,y);ctx.fillStyle='#45362c22';ctx.beginPath();ctx.ellipse(0,5,157,117,0,0,Math.PI*2);ctx.fill();
 // Ink washes, scorched earth and bounded smoke; no movement or road connector lines.
 for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#372c3429':'#96794b22';ctx.beginPath();ctx.ellipse((i*73%157)-78,(i*51%135)-67,35+i*3,9+i*2,i*.7,0,Math.PI*2);ctx.fill();}
 if(active){for(let i=0;i<(PERF_CONFIG.ultraSmooth?2:4);i++){const rise=(t*10+i*17)%46;ctx.globalAlpha=.12*(1-rise/55);ctx.fillStyle='#3c3538';ctx.beginPath();ctx.ellipse((i%2?1:-1)*(112+i*2)+Math.sin(t+i)*3,40+i*10-rise,8+rise*.15,13+rise*.22,.2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
 // The second objective visibly protects the spirit vein; the third exposes the enemy seal.
 if(s.step===1||s.step===2){const tx=s.step===1?-95:95;ctx.strokeStyle=s.step===1?'#d9e8b3aa':'#d48c76aa';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tx,88,32,12,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(tx,88,22,8,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();warFlagV2840(ctx,x-135,y-95,0,t,'盟');warFlagV2840(ctx,x+135,y-95,1,t,'魔');
}
function drawWarUnitV2840(ctx,u){
 const state=WAR_MAP_V2840,s=state.scene;if(!s)return;
 ctx.save();ctx.translate(u.x,u.y);ctx.scale(WAR_ART_V286888.unit,WAR_ART_V286888.unit);ctx.fillStyle=u.side?'#56323740':'#30483d40';ctx.beginPath();ctx.ellipse(0,3,11,4,0,0,Math.PI*2);ctx.fill();
 const dir=u.side?-1:1;ctx.scale(dir,1);if(u.attack)ctx.rotate(.10);
 const hero=PAINTED_ACTOR_V2838,im=SCROLL_ART_V2831.enemies;
 if(!u.side&&u.rank===0&&hero.ready){const b=PAINTED_ACTOR_ROWS_V2838[1],f=u.frame,scale=52/256;ctx.drawImage(hero.image,f*192,b.y,192,b.h,-192*scale/2,-b.feet[f]*scale,192*scale,b.h*scale);}
 else if(typeof drawScrollWarFigureV2853==='function'&&drawScrollWarFigureV2853(ctx,u.side,u.rank?54:60)){}
 else if(im){const cell=u.side?5:6,cw=im.width/4,ch=im.height/2,h=u.rank?54:60,w=h*cw/ch;ctx.drawImage(im,cell%4*cw,Math.floor(cell/4)*ch,cw,ch,-w/2,7-h,w,h);}
 else{ctx.fillStyle=u.side?'#6d3840':'#dfddc7';ctx.strokeStyle='#3b3933';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-42);ctx.lineTo(12,-4);ctx.lineTo(-12,-4);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e2c6a0';ctx.beginPath();ctx.arc(0,-48,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b6c5b8';ctx.beginPath();ctx.moveTo(4,-27);ctx.lineTo(25,-49);ctx.stroke();}
 if(u.attack){ctx.strokeStyle=u.side?'#edb69d99':'#eef6d4bb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(5,-30,27,-1.5,.9);ctx.stroke();}
 ctx.restore();
}
function drawWarEffectsV2840(ctx,view){
 const state=WAR_MAP_V2840,s=state.scene;if(!s||!warSceneVisibleV2840(s,view))return;
 const {x,y}=s.site,t=state.clock;
 ctx.save();
 if(s.kind==='battle'&&!state.reduced){
  const count=PERF_CONFIG.ultraSmooth?2:4;
  for(let i=0;i<count;i++){
   const q=(t*.48+i*.27)%1,side=i%2,dir=side?-1:1,px=x-dir*102+dir*q*204,py=y-65+i*37-Math.sin(q*Math.PI)*25;
   ctx.globalAlpha=.75;ctx.strokeStyle=side?'#dba48c':'#cde6d3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-dir*15,py+4);ctx.lineTo(px,py);ctx.stroke();ctx.fillStyle=side?'#f2cdab':'#f1f2c8';ctx.beginPath();ctx.ellipse(px,py,3,2,0,0,Math.PI*2);ctx.fill();
  }
  const pulse=(t*.7)%1;if(pulse<.48){ctx.globalAlpha=(.48-pulse)*.9;ctx.strokeStyle=s.step===2?'#eac689':'#f5ead2';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+15,9+pulse*46,4+pulse*18,0,0,Math.PI*2);ctx.stroke();}
 }
 ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='bold 15px serif';
 const title=s.kind==='incoming'?'两军列阵 · 等待军令':s.kind==='victory'?'交锋结束 · 等待结算':WAR_FRONTS_V2839[s.step].name+' · 两军交锋';
 const width=Math.min(290,ctx.measureText(title).width+30);ctx.fillStyle='#172923e0';ctx.fillRect(x-width/2,y-181,width,30);ctx.strokeStyle='#b9a36c';ctx.lineWidth=1;ctx.strokeRect(x-width/2,y-181,width,30);ctx.fillStyle='#f3dfab';ctx.fillText(title,x,y-161);
 ctx.font='12px serif';ctx.fillStyle='#274e46';ctx.fillText(player.sect+'联军',x-86,y-116);ctx.fillStyle='#733d42';ctx.fillText(s.record.enemy,x+86,y-116);ctx.restore();
}
function drawWarPostV2840(ctx,p){
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(WAR_ART_V286888.post,WAR_ART_V286888.post);ctx.translate(-p.x,-p.y);
 warFlagV2840(ctx,p.x,p.y,0,0,'令');
 ctx.save();ctx.textAlign='center';ctx.font='bold 12px serif';ctx.fillStyle='#172923e8';ctx.fillRect(p.x-37,p.y+10,74,23);ctx.fillStyle='#f3dfab';ctx.fillText('军令台',p.x,p.y+26);ctx.restore();ctx.restore();
}
function drawWarMinimapV2840(ctx,mx,my){
 const s=WAR_MAP_V2840.scene;if(!s?.local)return;
 const x=mx(s.site.x),y=my(s.site.y);ctx.save();ctx.strokeStyle='#f6deab';ctx.fillStyle=s.kind==='incoming'?'#b58237':'#a45145';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x+7,y);ctx.lineTo(x,y+8);ctx.lineTo(x-7,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
const warExecuteBeforeV2840=executeWar;
executeWar=function(enemy){const before=player.warState?.campaignV2775;warExecuteBeforeV2840(enemy);const c=player.warState?.campaignV2775;if(c&&c!==before){syncWarMapV2840();viewWarMapV2840();}};
const warCommandBeforeV2840=commandWarStageV2839;
commandWarStageV2839=function(id,stage){const before=warCampaignV2839(id,stage);warCommandBeforeV2840(id,stage);if(before&&warCampaignV2839(id)===before&&before.step===stage+1)viewWarMapV2840();};
const warSettleBeforeV2840=settleWarV2775;
settleWarV2775=function(enemy){warSettleBeforeV2840(enemy);syncWarMapV2840();};
const warRetreatBeforeV2840=retreatWarV2775;
retreatWarV2775=function(){warRetreatBeforeV2840();syncWarMapV2840();};
// Refresh a limited preference flag; do not start a second animation loop.
window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{WAR_MAP_V2840.reduced=e.matches;});
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2840-war-map.js']='28.68.95';
