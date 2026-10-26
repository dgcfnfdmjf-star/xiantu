// V27.70：由轻量立体几何预绘制8方向步态；地图逐帧仅复制精灵。
const AVATAR25D_V2770={canvas:null,trees:null,key:null,ready:new Set(),dir:0,phase:0,lastX:null,lastY:null,lastTime:0,blend:0,cellW:80,cellH:96};
function releaseAvatar25DV2770(){
 const a=AVATAR25D_V2770;for(const k of ['canvas','trees']){if(a[k]){a[k].width=1;a[k].height=1;a[k]=null;}}
 a.ready.clear();a.key=null;a.lastX=null;a.lastY=null;a.lastTime=0;a.blend=0;
}
function paintAvatarPoseV2770(ctx,dir,frame,armed){
 const yaw=-dir*Math.PI/4,cs=Math.cos(yaw),sn=Math.sin(yaw),walk=frame===0?0:Math.sin((frame-1)*Math.PI/4),bob=frame===0?0:Math.abs(walk)*1.2,faces=[];
 const tr=p=>{const x=p[0]*cs-p[1]*sn,y=p[0]*sn+p[1]*cs,z=p[2];return {x:40+x*1.08,y:84+(y*.54-z*.92)*1.08,d:y*.84+z*.54};};
 function poly(points,color){const p=points.map(tr);faces.push({p,color,d:p.reduce((n,v)=>n+v.d,0)/p.length});}
 function box(x,y,z,w,d,h,colors){
  const v=[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z],[x-w/2,y-d/2,z+h],[x+w/2,y-d/2,z+h],[x+w/2,y+d/2,z+h],[x-w/2,y+d/2,z+h]];
  [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach((idx,i)=>poly(idx.map(j=>v[j]),colors[i%colors.length]));
 }
 function robe(z1,z2,rx1,ry1,rx2,ry2,palette,shift=0){
  const n=8;for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;poly([[Math.cos(a)*rx1,Math.sin(a)*ry1+shift,z1],[Math.cos(b)*rx1,Math.sin(b)*ry1+shift,z1],[Math.cos(b)*rx2,Math.sin(b)*ry2,z2],[Math.cos(a)*rx2,Math.sin(a)*ry2,z2]],palette[i%palette.length]);}
 }
 function limb(x,y1,z1,y2,z2,color){
  const w=z1>30?6.2:4.2;poly([[x-w,y1-3,z1],[x+w,y1-3,z1],[x+w,y2-3,z2],[x-w,y2-3,z2]],color[0]);
  poly([[x+w,y1-3,z1],[x+w,y1+3,z1],[x+w,y2+3,z2],[x+w,y2-3,z2]],color[1]);
  poly([[x+w,y1+3,z1],[x-w,y1+3,z1],[x-w,y2+3,z2],[x+w,y2+3,z2]],color[2]);
 }
 // Shoes and lower legs visibly alternate; the robe follows the same stride.
 for(const side of [-1,1]){const stride=walk*side;
  box(side*5,stride*6+2,Math.max(0,stride)*2,6,10,4,['#17232d','#243643','#384653']);
  limb(side*5,0,18+bob,stride*6,4+Math.max(0,stride)*2,['#d9d9cc','#9baeb1','#e8e4d3']);
 }
 robe(10+bob,29+bob,13,8,8,5,['#b8cfdf','#dce9ef','#f8fbfb','#dfecf4','#abc4db','#94b4cc','#c9e0eb','#e6f1f6'],walk*1.3);
 robe(28+bob,43+bob,8,5,11,5.5,['#c8dbe8','#e8f0f4','#ffffff','#e0edf4','#b6cedf','#9fbcd1','#c4d9e7','#edf4f7']);
 // Ivory lapels, sash and a jade pendant sit on the front of the coat.
 poly([[-8,5.6,42+bob],[-2,6,30+bob],[1,6,31+bob],[-3,5.7,43+bob]],'#ede5c9');
 poly([[8,5.6,42+bob],[2,6,30+bob],[-1,6,31+bob],[3,5.7,43+bob]],'#c8d7ce');
 box(0,0,27+bob,18,12,3,['#253b50','#344d64','#657786','#23384b']);
 box(0,6.7,26+bob,7,2,5,['#9b7c43','#d0af65','#edd68f']);
 box(0,8,27+bob,3.5,1,3,['#277d88','#56bdc5','#93e4df']);
 box(3,7,18+bob,1.3,1.5,8,['#c3a266','#f5dda0']);
 box(3,7,16+bob,3,2,3,['#e0ebef','#ffffff']);
 // Blue inner robe and split white coat panels, matching the protagonist portrait.
 poly([[-4,8.3,10+bob],[4,8.3,10+bob],[3,5.7,27+bob],[-3,5.7,27+bob]],'#238ba7');
 poly([[-3,5.9,29+bob],[3,5.9,29+bob],[4,5.7,43+bob],[-4,5.7,43+bob]],'#287d96');
 for(const side of [-1,1]){
  poly([[side*4,8.4,10+bob],[side*5,8.4,10+bob],[side*3.7,6.2,28+bob],[side*2.8,6.2,28+bob]],'#80cfec');
  box(side*10.5,0,41+bob,6,11,2.2,['#967940','#d4b56e','#f2dd9a']);
  box(side*10.5,1,43+bob,3.5,7,1.5,['#1f6380','#49a1b5','#b3e8ed']);
 }
 for(const side of [-1,1]){const swing=-walk*side*7;
  limb(side*13,0,40+bob,swing,25+bob,['#bacfdf','#e4edf4','#fafcfc']);
  box(side*13,swing,25+bob,12,7,2,['#93bfd6','#e2d09d','#f4e2b1']);
  box(side*13,swing,22+bob,4.5,5,4,['#b88e74','#d8b899','#f0d2af']);
 }
 box(0,0,43+bob,5,5,6,['#b5927a','#d4b499','#e7c9a8']);
 // Tapered head, parted fringe, high ponytail and blue ribbons.
 function headRing(z0,z1,rx0,ry0,rx1,ry1,hair=false){
  for(let i=0;i<12;i++){const u=i*Math.PI/6,v=(i+1)*Math.PI/6,front=Math.sin((u+v)/2)>0;
   poly([[Math.cos(u)*rx0,Math.sin(u)*ry0,z0+bob],[Math.cos(v)*rx0,Math.sin(v)*ry0,z0+bob],[Math.cos(v)*rx1,Math.sin(v)*ry1,z1+bob],[Math.cos(u)*rx1,Math.sin(u)*ry1,z1+bob]],hair?(['#17212d','#293441','#394650'][i%3]):front?(['#efd7c1','#e4c6ac','#f8e4ce'][i%3]):'#202b37');
  }
 }
 headRing(48,54,3.8,4.3,6.3,6.1);headRing(54,60,6.3,6.1,5.8,5.7);
 headRing(59,63,6.7,6.4,4,4,true);
 box(0,-2,62+bob,5,5,4,['#15212a','#293d49','#3e5158']);
 box(0,-2,65+bob,8,6,2,['#927945','#cfaf69','#f2db96']);
 box(0,1,66+bob,3,2,3,['#297d9b','#58c9df']);
 poly([[-5,5.6,60+bob],[-.8,6.3,61+bob],[-4.8,6.6,52+bob],[-6.2,4,48+bob]],'#26313f');
 poly([[.8,6.3,61+bob],[5,5.6,60+bob],[6.2,4,48+bob],[4.8,6.6,52+bob]],'#35414f');
 const sway=walk*2;
 poly([[-3,-4,66+bob],[3,-4,66+bob],[4+sway,-12,45+bob],[sway,-13,33+bob],[-4+sway,-11,45+bob]],'#172431');
 poly([[0,-4.7,66+bob],[2,-4.7,66+bob],[2+sway,-13,45+bob],[sway,-13.5,35+bob],[-1+sway,-12,46+bob]],'#405363');
 for(const side of [-1,1])poly([[side*3,-4.5,66+bob],[side*4.2,-4.5,66+bob],[side*6+sway,-12,43+bob],[side*8+sway,-11,40+bob],[side*4.5+sway,-10.5,43+bob]],side<0?'#479fc9':'#8adaee');
 box(-2.7,6.05,55+bob,1.7,.5,.8,['#34323b']);box(2.7,6.05,55+bob,1.7,.5,.8,['#34323b']);
 box(0,6.3,52+bob,1.2,1,2,['#d9af89','#f4d0a6']);
 if(armed){box(-9,-7,16+bob,3,3,39,['#437d9a','#85d2e4','#d6f8ff']);box(-9,-7,55+bob,3,3,8,['#453c31','#ac8e58']);box(-9,-7,54+bob,10,4,2,['#c7a45e','#e6cf91']);}
 faces.sort((a,b)=>a.d-b.d);
 for(const face of faces){ctx.fillStyle=face.color;ctx.beginPath();ctx.moveTo(face.p[0].x,face.p[0].y);for(let i=1;i<face.p.length;i++)ctx.lineTo(face.p[i].x,face.p[i].y);ctx.closePath();ctx.fill();}
}
function getAvatarFrameV2770(dir,frame,armed){
 const a=AVATAR25D_V2770,key=armed?'sword':'unarmed';
 if(a.key!==key){releaseAvatar25DV2770();a.key=key;}
 if(!a.canvas){a.canvas=document.createElement('canvas');a.canvas.width=a.cellW*8;a.canvas.height=a.cellH*9;}
 const pose=dir+':'+frame;
 if(!a.ready.has(pose)){const ctx=a.canvas.getContext('2d');ctx.save();ctx.translate(dir*a.cellW,frame*a.cellH);paintAvatarPoseV2770(ctx,dir,frame,armed);ctx.restore();a.ready.add(pose);}
 return a.canvas;
}
function drawActor25DV2770(ctx,p){
 if(drawPaintedActorV2838(ctx,p))return;
 const a=AVATAR25D_V2770,t=performance.now();
 const armed=!!player?.equipment?.weapon;
 if(a.key!==(armed?'sword':'unarmed'))getAvatarFrameV2770(a.dir,0,armed);
 const dx=a.lastX==null?0:p.x-a.lastX,dy=a.lastY==null?0:p.y-a.lastY,dist=Math.hypot(dx,dy),dt=Math.min(.08,Math.max(0,(t-a.lastTime)/1000));
 if(dist>.02&&dist<80){a.dir=(Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8;a.phase=(a.phase+dist*.13)%(Math.PI*2);a.blend=Math.min(1,a.blend+dt*12);}
 else a.blend=Math.max(0,a.blend-dt*12);
 a.lastX=p.x;a.lastY=p.y;a.lastTime=t;
 const frame=a.blend>.15?1+Math.floor(a.phase/(Math.PI/4))%8:0;
 const canvas=getAvatarFrameV2770(a.dir,frame,!!player?.equipment?.weapon);
 ctx.fillStyle='rgba(9,20,23,.25)';ctx.beginPath();ctx.ellipse(p.x,p.y+17,15,5.5,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(canvas,a.dir*a.cellW,frame*a.cellH,a.cellW,a.cellH,p.x-40,p.y+17-84,a.cellW,a.cellH);
}
function drawDepthTreeV2770(ctx,o){
 const a=AVATAR25D_V2770;
 if(a.treeRegionV2827!==currentRegion){if(a.trees){a.trees.width=1;a.trees.height=1;}a.trees=null;a.treeRegionV2827=currentRegion;}
 if(!a.trees){a.trees=document.createElement('canvas');a.trees.width=384;a.trees.height=128;const c=a.trees.getContext('2d');for(let v=0;v<3;v++){c.save();c.translate(v*128+64,64);drawBiomeTreeV2827(c,{x:0,y:0,s:1,t:'tree',v,rot:0});c.restore();}}
 const scale=o.s||1,v=Math.max(0,Math.min(2,o.v||0));ctx.save();const p=FLAT_WORLD.player;if(worldDepthV2770(o)>p.y+17&&Math.abs(o.x-p.x)<42*scale&&o.y-p.y<75*scale)ctx.globalAlpha=.3;ctx.translate(o.x,o.y);ctx.rotate(o.rot||0);ctx.drawImage(a.trees,v*128,0,128,128,-64*scale,-64*scale,128*scale,128*scale);ctx.restore();
}
function worldDepthV2770(o){return o.y+(o.t==='tree'?28*(o.s||1):0);}
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAvatar25DV2770();});
window.addEventListener('pagehide',releaseAvatar25DV2770);

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2770-avatar.js"]="28.68.58";

const PAINTED_ACTOR_ROWS_V2838=[{"y": 0, "h": 256, "feet": [244, 250, 249, 249]}, {"y": 256, "h": 244, "feet": [238, 232, 238, 232]}, {"y": 500, "h": 268, "feet": [243, 244, 243, 245]}];
const PAINTED_ACTOR_V2838={image:null,ready:false,failed:false,phase:0,lastX:null,lastY:null,lastTime:0,dir:0,moving:false,reduced:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches};
function drawPaintedActorV2838(ctx,p){
 const a=PAINTED_ACTOR_V2838;
 if(!a.image&&!a.failed){const img=new Image();a.image=img;img.decoding='async';img.onload=()=>{a.ready=img.naturalWidth>0;if(a.ready){const old=AVATAR25D_V2770;if(old.canvas){old.canvas.width=1;old.canvas.height=1;old.canvas=null;}old.ready.clear();old.key=null;}img.onload=img.onerror=null;};img.onerror=()=>{a.failed=true;img.onload=img.onerror=null;a.image=null;};img.src='./hero-walk-v2838.webp';}
 if(!a.ready)return false;
 const t=performance.now(),dx=a.lastX==null?0:p.x-a.lastX,dy=a.lastY==null?0:p.y-a.lastY,d=Math.hypot(dx,dy),gap=t-a.lastTime;
 const walking=d>.03&&d<70&&gap<500;
 if(walking){a.dir=(Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8;a.phase=(a.phase+d*.09)%(Math.PI*2);}
 a.lastX=p.x;a.lastY=p.y;a.lastTime=t;a.moving=walking;
 // Idle has no timer. The world renderer owns cadence and pauses under dialogs/hidden pages.
 const cycle=[1,2,3,2],frame=walking?cycle[Math.floor(a.phase/(Math.PI/2))]:0;
 const side=[2,6].includes(a.dir),row=side?1:[3,4,5].includes(a.dir)?2:0,mirror=a.dir>=5;
 const bounds=PAINTED_ACTOR_ROWS_V2838[row],scale=91/256,cw=192,ch=bounds.h,w=cw*scale,h=ch*scale;
 const bob=!a.reduced&&walking?Math.sin(a.phase*2)*.6:0;
 ctx.save();ctx.translate(p.x,p.y+17);ctx.fillStyle='rgba(17,35,31,.24)';ctx.beginPath();ctx.ellipse(0,0,13,4.2,0,0,Math.PI*2);ctx.fill();
 if(mirror)ctx.scale(-1,1);
 ctx.drawImage(a.image,frame*cw,bounds.y,cw,ch,-w/2,-bounds.feet[frame]*scale+bob,w,h);
 ctx.restore();return true;
}
function resetPaintedMotionV2838(){const a=PAINTED_ACTOR_V2838;a.lastX=a.lastY=null;a.lastTime=0;a.moving=false;}
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetPaintedMotionV2838();});
window.addEventListener('pagehide',resetPaintedMotionV2838);
