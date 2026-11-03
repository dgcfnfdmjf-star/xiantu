/* Optional map atmosphere. No gameplay RNG, save fields or independent map loop. */
(function(){
'use strict';
const S={renderer:null,scene:null,camera:null,canvas:null,ctx:null,loading:null,noGL:false,tier:null,width:0,height:0,dpr:0,dirty:false,burst:null,raf:0,frames:0,calls:0,points:0,triangles:0,reason:'',last:0,warm:0,elapsed:0,samples:0,slow:0,bad:0,downgrades:0,region:null,pois:null,candidates:[],slots:[],systems:[],rings:[],textures:[],quality:null,clip:null,theme:null};
const K='xiantu_map_fx_v2868104';
let seed=1041937;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function reduced(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}
function preference(){try{return localStorage.getItem(K)||'auto';}catch(_){return 'auto';}}
function desired(){const p=preference();return p==='off'||reduced()?'off':p==='high'?'high':p==='low'?'low':PERF_CONFIG.mobile||PERF_CONFIG.lowEnd?'low':'high';}
function quality(){if(S.quality!==preference()){S.quality=preference();S.tier=desired();}if(reduced())return 'off';return S.tier||desired();}
function makeCanvas(){const old=document.getElementById('world3dCanvas'),c=document.createElement('canvas');c.id='world3dCanvas';c.width=c.height=1;c.setAttribute('aria-hidden','true');c.className='map-fx-v2868104 map-fx-hidden-v2868104';if(old)old.replaceWith(c);else document.getElementById('worldPanel').appendChild(c);S.canvas=c;return c;}
function canvas(){if(!S.canvas){S.canvas=document.getElementById('world3dCanvas')||makeCanvas();S.canvas.setAttribute('aria-hidden','true');S.canvas.classList.add('map-fx-v2868104','map-fx-hidden-v2868104');}return S.canvas;}
function surface(event){const c=canvas(),host=event?document.body:document.getElementById('worldPanel');if(c.parentNode!==host)host.appendChild(c);c.classList.toggle('map-fx-event-v2868104',event);c.classList.remove('map-fx-hidden-v2868104');}
function hide(){if(S.dirty){try{if(S.renderer&&!S.noGL)S.renderer.clear();else if(S.ctx)S.ctx.clearRect(0,0,S.width,S.height);}catch(_){}S.dirty=false;}if(S.canvas){S.canvas.classList.add('map-fx-hidden-v2868104');S.canvas.classList.remove('map-fx-event-v2868104');const host=document.getElementById('worldPanel');if(host&&S.canvas.parentNode!==host)host.appendChild(S.canvas);}S.calls=S.points=S.triangles=0;}
function pause(all){if(all){if(S.raf)cancelAnimationFrame(S.raf);S.raf=0;S.burst=null;}if(S.burst)return;hide();S.last=S.warm=S.elapsed=S.samples=S.slow=S.bad=0;}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.22,'rgba(255,255,255,.7)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return c;}
function formationTexture(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.translate(128,128);x.strokeStyle='#f4d795';x.lineWidth=2;for(const r of [76,87,115,121]){x.beginPath();x.arc(0,0,r,0,Math.PI*2);x.stroke();}for(let i=0;i<8;i++){x.save();x.rotate(i*Math.PI/4);for(let j=0;j<3;j++){const y=93+j*6;if((i>>j)&1){x.beginPath();x.moveTo(-10,y);x.lineTo(10,y);x.stroke();}else{x.beginPath();x.moveTo(-10,y);x.lineTo(-2,y);x.moveTo(2,y);x.lineTo(10,y);x.stroke();}}x.restore();}x.beginPath();x.arc(0,0,42,-Math.PI/2,Math.PI/2);x.arc(0,21,21,Math.PI/2,Math.PI*1.5,true);x.arc(0,-21,21,Math.PI/2,Math.PI*1.5);x.stroke();return c;}
const glow=glowTexture(),formation=formationTexture();
const palette=['#52ffcb','#68d8ff','#ffd166','#d08bff'];
const tintedGlows=palette.concat(['#ffab42']).map(color=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.drawImage(glow,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,64,64);return c;});
// Fixed slots and seeds are allocated once; neither rendering path consumes Math.random.
for(let i=0;i<6;i++)S.slots.push({kind:0,x:0,y:0,n:0,alpha:0,size:1,span:1,t:0,color:'#e3ab63'});
const seeds=new Float32Array(1800*2);for(let i=0;i<seeds.length;i++)seeds[i]=random();
function loadThree(){if(window.THREE?.REVISION==='128')return Promise.resolve(window.THREE);return new Promise((resolve,reject)=>{const s=document.createElement('script');let done=false;const end=ok=>{if(done)return;done=true;clearTimeout(timer);ok&&window.THREE?.REVISION==='128'?resolve(window.THREE):reject(Error('renderer unavailable'));};const timer=setTimeout(()=>end(false),10000);s.src='./vendor/three-r128.min.js';s.onload=()=>end(true);s.onerror=()=>end(false);document.head.appendChild(s);});}
function fallback(reason){if(S.noGL&&S.ctx)return;S.noGL=true;S.reason=reason;const previous=S.renderer;try{S.renderer?.dispose();}catch(_){}S.renderer=null;for(const sys of S.systems){sys.geometry.dispose();sys.material.dispose();}for(const ring of S.rings){ring.geometry.dispose();ring.material.dispose();}for(const t of S.textures)t.dispose();S.systems=[];S.rings=[];S.textures=[];S.scene=S.camera=null;makeCanvas();S.ctx=S.canvas.getContext('2d');S.width=S.height=S.dpr=0;if(!S.ctx){S.tier='off';S.reason='绘制不可用';}else if(quality()!=='off')S.tier='lite';try{previous?.forceContextLoss();}catch(_){} }
function system(T,kind,max,map){
 const g=new T.BufferGeometry(),positions=new Float32Array(max*3),a=new Float32Array(max*2);a.set(seeds.subarray(0,max*2));g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('aSeed',new T.BufferAttribute(a,2));
 const m=new T.ShaderMaterial({uniforms:{time:{value:0},origin:{value:new T.Vector2()},extent:{value:new T.Vector2()},pixel:{value:1},kind:{value:kind},opacity:{value:1},scale:{value:1},map:{value:map},tint:{value:new T.Color(0xffffff)}},vertexShader:`
attribute vec2 aSeed;
uniform float time,pixel,kind,scale;
uniform vec2 origin,extent;
varying float alpha;
varying vec3 hue;
void main(){
 float p=fract(time*(.16+.08*aSeed.y)+aSeed.x);
 float a=p*10.0+floor(aSeed.y*4.0)*1.571+time*.85;
 vec2 v;float size=6.0;
 float c=floor(aSeed.y*4.0);
 hue=c<1.0?vec3(.32,1.0,.80):c<2.0?vec3(.41,.85,1.0):c<3.0?vec3(1.0,.82,.40):vec3(.82,.55,1.0);
 if(kind<.5){
  float r=4.0+pow(p,.85)*26.0;
  v=vec2(cos(a)*r+sin(time+p*4.0)*3.0,p*120.0+sin(a)*r*.22);
  alpha=pow(sin(p*3.14159),.6)*.9;size=5.0+8.0*p;
 }else if(kind<1.5){
  v=vec2(fract(aSeed.x+time*.006)*extent.x,fract(aSeed.y+time*.009)*extent.y);
  alpha=.18+.25*sin(p*3.14159);size=3.5;hue=vec3(1.0);
 }else if(kind<2.5){
  a=aSeed.x*6.283+time*.8;v=vec2(cos(a)*(23.0+p*12.0),sin(a)*10.0+p*18.0);
  alpha=.6;size=5.0;
 }else if(kind<3.5){
  a=aSeed.x*6.283;float speed=28.0+aSeed.y*95.0;
  v=vec2(cos(a)*speed*time,sin(a)*speed*time-time*time*24.0);
  alpha=max(0.0,1.0-time/1.5);size=6.0;hue=vec3(1.0);
 }else if(kind<4.5){
  a=aSeed.x*6.283+time*.24;float r=35.0+22.0*aSeed.y;
  v=vec2(cos(a)*r,sin(a)*r*.38+p*48.0);
  alpha=sin(p*3.14159)*.9;size=4.5;hue=mix(vec3(1.0,.35,.08),vec3(1.0,.88,.35),p);
 }else if(kind<5.5){
  float r=8.0+sqrt(aSeed.x)*56.0;a=aSeed.y*30.0+time*(2.8-1.4*aSeed.x);
  v=vec2(cos(a)*r,sin(a)*r*.9);alpha=.6+.25*sin(p*3.14159);size=4.5;
 }else{
  float r=10.0+sin(p*3.14159)*4.0;
  v=vec2((aSeed.y<.5?-1.0:1.0)*extent.x+cos(a)*r,p*140.0+sin(a)*5.0);
  alpha=sin(p*3.14159)*.9;size=5.0;hue=mix(vec3(1.0,.64,.20),vec3(1.0,.92,.58),p);
 }
 gl_Position=projectionMatrix*modelViewMatrix*vec4(origin+v*scale,0.0,1.0);
 gl_PointSize=size*pixel*max(.65,scale);
}`,fragmentShader:`precision mediump float;uniform sampler2D map;uniform float opacity;uniform vec3 tint;varying float alpha;varying vec3 hue;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(tint*hue,t.a*alpha*opacity);}`,transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending});
 const obj=new T.Points(g,m);obj.frustumCulled=false;S.scene.add(obj);return obj;
}
function init(){if(S.renderer||S.ctx||S.loading)return;canvas();S.loading=loadThree().then(T=>{if(S.noGL||quality()==='off'||document.hidden){S.loading=null;return;}try{
 const opts={alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'low-power',depth:false,stencil:false},gl=S.canvas.getContext('webgl2',opts)||S.canvas.getContext('webgl',opts)||S.canvas.getContext('experimental-webgl',opts);if(!gl){fallback('图形能力不可用，使用轻量特效');return;}if(gl.getParameter(gl.MAX_TEXTURE_SIZE)<2048){gl.getExtension('WEBGL_lose_context')?.loseContext();fallback('图形能力受限，使用轻量特效');return;}
 const r=new T.WebGLRenderer({...opts,canvas:S.canvas,context:gl});S.renderer=r;r.setClearColor(0x000000,0);S.scene=new T.Scene();S.camera=new T.OrthographicCamera(0,1,0,-1,.1,10);S.camera.position.z=2;
 const texture=new T.CanvasTexture(glow),ringTexture=new T.CanvasTexture(formation);S.textures=[texture,ringTexture];ringTexture.center.set(.5,.5);
 S.systems=[system(T,0,1800,texture),system(T,0,640,texture),system(T,1,120,texture),system(T,2,96,texture),system(T,3,300,texture)];
 for(let i=0;i<2;i++){const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:ringTexture,transparent:true,opacity:.3,depthTest:false,depthWrite:false,blending:T.AdditiveBlending}));mesh.frustumCulled=false;S.rings.push(mesh);S.scene.add(mesh);}
 S.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('图形上下文已丢失，使用轻量特效');});
 }catch(_){fallback('图形能力不可用，使用轻量特效');}}).catch(()=>fallback('特效组件未加载，使用轻量特效'));
}
function resize(w,h){const d=quality()==='high'?Math.min(1.5,devicePixelRatio||1):1;if(w===S.width&&h===S.height&&d===S.dpr)return;S.width=w;S.height=h;S.dpr=d;if(S.renderer){S.renderer.setPixelRatio(d);S.renderer.setSize(w,h,false);S.camera.left=0;S.camera.right=w;S.camera.top=0;S.camera.bottom=-h;S.camera.updateProjectionMatrix();}else if(S.ctx){S.canvas.width=Math.round(w*d);S.canvas.height=Math.round(h*d);S.ctx.setTransform(d,0,0,d,0,0);}}
function slot(i,kind,x,y,n,alpha,size,span,t,color){const o=S.slots[i];o.kind=kind;o.x=x;o.y=y;o.n=n;o.alpha=alpha;o.size=size;o.span=span;o.t=t;o.color=color;}
function clearSlots(){for(const s of S.slots)s.n=0;}
function render(){
 S.calls=S.points=S.triangles=0;
 if(S.renderer){
 for(let i=0;i<S.systems.length;i++){const obj=S.systems[i],s=S.slots[i];obj.visible=s.n>0;if(!obj.visible)continue;obj.geometry.setDrawRange(0,s.n);const u=obj.material.uniforms;u.kind.value=s.kind;u.time.value=s.t;u.origin.value.set(s.x,-s.y);u.extent.value.set(s.kind===6?(s.span||90):S.width,-S.height);u.pixel.value=S.dpr;u.opacity.value=s.alpha;u.scale.value=s.size;u.tint.value.set(s.color);S.points+=s.n;}
 for(let i=0;i<2;i++){const m=S.rings[i],s=S.slots[5];m.visible=s.n>i;if(!m.visible)continue;m.position.set(s.x,-s.y,0);const extent=s.span*(i?.78:1);m.scale.set(extent,extent*.42,1);m.rotation.z=i?-s.t*.15:0;m.material.opacity=s.alpha;m.material.color.set(s.color);}S.textures[1].rotation=S.slots[5].t*.15;
 S.renderer.setScissorTest(false);S.renderer.clear();
 if(S.clip){const c=S.clip;S.renderer.setScissor(Math.max(0,c.x),Math.max(0,S.height-c.y-c.h),Math.max(0,Math.min(S.width,c.x+c.w)-Math.max(0,c.x)),Math.max(0,Math.min(S.height,c.y+c.h)-Math.max(0,c.y)));S.renderer.setScissorTest(true);}
 S.renderer.render(S.scene,S.camera);S.renderer.setScissorTest(false);S.calls=S.renderer.info.render.calls;S.triangles=S.renderer.info.render.triangles;
 }else if(S.ctx){
 const x=S.ctx;x.clearRect(0,0,S.width,S.height);x.save();if(S.clip){x.beginPath();x.rect(S.clip.x,S.clip.y,S.clip.w,S.clip.h);x.clip();}x.globalCompositeOperation='lighter';
 for(let k=0;k<5;k++){
  const s=S.slots[k];if(!s.n)continue;const n=Math.min(s.kind===3?40:120,s.n);S.calls++;S.points+=n;
  for(let i=0;i<n;i++){
   const a=seeds[i*2],b=seeds[i*2+1],p=(s.t*(.16+.08*b)+a)%1;
   let dx,dy,r=6,alpha=.65,sprite=tintedGlows[Math.floor(b*4)];
   const angle=p*10+Math.floor(b*4)*1.571+s.t*.85;
   if(s.kind===0){const rad=4+Math.pow(p,.85)*26;dx=Math.cos(angle)*rad+Math.sin(s.t+p*4)*3;dy=-p*120-Math.sin(angle)*rad*.22;r=5+8*p;alpha=Math.pow(Math.sin(p*Math.PI),.6)*.9;}
   else if(s.kind===1){dx=((a+s.t*.006)%1)*S.width;dy=((b+s.t*.009)%1)*S.height;r=3;alpha=.3;}
   else if(s.kind===2){dx=Math.cos(a*6.283+s.t*.8)*(23+p*12);dy=-Math.sin(a*6.283+s.t*.8)*10-p*18;r=5;}
   else if(s.kind===3){const speed=28+b*95;dx=Math.cos(a*6.283)*speed*s.t;dy=-Math.sin(a*6.283)*speed*s.t+s.t*s.t*24;alpha=Math.max(0,1-s.t/1.5);sprite=glow;}
   else if(s.kind===4){const ang=a*6.283+s.t*.24,rad=35+22*b;dx=Math.cos(ang)*rad;dy=-Math.sin(ang)*rad*.38-p*48;r=4.5;alpha=Math.sin(p*Math.PI)*.9;sprite=tintedGlows[4];}
   else if(s.kind===5){const rad=8+Math.sqrt(a)*56,ang=b*30+s.t*(2.8-1.4*a);dx=Math.cos(ang)*rad;dy=-Math.sin(ang)*rad*.9;r=4.5;}
   else{const rad=10+Math.sin(p*Math.PI)*4;dx=(b<.5?-1:1)*(s.span||90)+Math.cos(angle)*rad;dy=-p*140-Math.sin(angle)*5;r=5;alpha=Math.sin(p*Math.PI)*.9;sprite=tintedGlows[2];}
   r*=Math.max(.65,s.size);x.globalAlpha=s.alpha*alpha;x.drawImage(sprite,s.x+dx*s.size-r/2,s.y+dy*s.size-r/2,r,r);
  }
 }
 const s=S.slots[5];if(s.n){x.save();x.translate(s.x,s.y);x.scale(1,.42);x.rotate(s.t*.15);x.globalAlpha=s.alpha;x.drawImage(formation,-s.span/2,-s.span/2,s.span,s.span);x.restore();S.calls++;}x.restore();
 }
 S.dirty=true;S.frames++;
}
function observe(t){if(!S.last){S.last=t;S.warm=t+3000;return;}const dt=(t-S.last)/1000;S.last=t;if(t<S.warm||dt<=0||dt>.5)return;S.elapsed+=dt;S.samples++;if(dt>.045)S.slow++;if(S.elapsed>=2){const fps=S.samples/S.elapsed;if(fps<24||S.slow/S.samples>.25)S.bad++;else S.bad=0;S.elapsed=S.samples=S.slow=0;if(S.bad>=2){S.bad=0;S.downgrades++;if(S.tier==='high')S.tier='low';else if(S.tier==='low'){fallback('持续掉帧，使用轻量特效');}else S.tier='off';S.reason='持续掉帧，已降低本次特效';S.warm=t+3000;}}}
function eligible(){return !document.hidden&&!reduced()&&quality()!=='off'&&gameState==='exploring'&&!isWorldOverlayOpen()&&document.body.classList.contains('flat-world-active');}
function theme(p){
 const id=p?.buildingId||p?.action;
 if(['alchemy','alchemy_hall','night_yaolu'].includes(id))return 'alchemy';
 if(['secret','secret_realm_gate','mini_secret_realm'].includes(id))return 'vortex';
 if(id==='main_hall')return 'palace';
 if(id==='forbidden_library'||p?.id==='war_command_v2840')return 'seal';
 return null;
}
function composition(kind,x,y,scale,t,groundX=x,groundY=y+28){
 const high=quality()==='high';S.theme=kind;
 if(kind==='alchemy'){
  slot(0,0,x,y,high?1600:480,high?.10:.33,scale,0,t,'#ffffff');
  slot(1,4,groundX,groundY,high?600:160,high?.25:.65,scale,0,t,'#ffffff');
 }else if(kind==='vortex'){
  slot(0,5,x,y,high?1800:560,high?.23:.65,scale,0,t,'#ffffff');
  slot(1,4,groundX,groundY,high?320:100,.45,scale*.65,0,t,'#ffffff');
 }else if(kind==='palace'){
  slot(0,6,x,y,high?1200:400,high?.20:.55,scale,0,t,'#ffffff');
  slot(1,0,x+110*scale,y-38*scale,high?480:120,high?.12:.40,scale*.6,0,t,'#ffffff');
 }
 slot(5,4,groundX,groundY,high?2:1,.38,1,180*scale,t,kind==='vortex'?'#b6e5ff':'#e9cb84');
}
function roomFrame(room,t){
 const v=room.view,kind=theme(room.poi);if(!v?.painted||!kind||!interiorSceneImageV286893(room))return false;
 // Anchors are in the 576x448 painted scene, then use the exact room camera/crop transform.
 const station=projectInteriorV286892(400,192);
 const x=v.x+(kind==='alchemy'?station.x:288)*v.scale;
 const y=v.y+(kind==='alchemy'?station.y-49*station.k:135)*v.scale;
 composition(kind,x,y,v.scale*(kind==='alchemy'?.8:1),t,v.x+288*v.scale,v.y+245*v.scale);
 S.slots[1].size=v.scale;S.slots[5].span=180*v.scale;
 if(kind==='palace'){S.slots[0].span=147;S.slots[1].x=v.x+440*v.scale;S.slots[1].y=v.y+105*v.scale;}
 S.clip={x:v.x,y:v.y,w:576*v.scale,h:448*v.scale};return true;
}
function frame(t){
 if(S.burst)return;if(!eligible()){pause(false);return;}
 const world=document.getElementById('worldCanvas'),w=world.width/(world._dpr||1),h=world.height/(world._dpr||1),cam=FLAT_WORLD._camDrawV2893||FLAT_WORLD.camera,high=quality()==='high',time=t*.001%1000;
 clearSlots();S.clip=null;S.theme=null;
 const room=interiorStateV286886();
 if(room){if(!roomFrame(room,time)){pause(false);return;}}
 else{
  if(S.pois!==FLAT_WORLD.pois){S.pois=FLAT_WORLD.pois;S.candidates=S.pois.filter(p=>theme(p));}
  let closest=null,distance=Infinity;
  for(const p of S.candidates){
   if(!exploredPointV2828(p.x,p.y))continue;
   const b=wildSceneBoundsV286898(p)||sectSceneBoundsV286896(p),kind=theme(p);
   const x=b?(b.left+b.right)/2:p.x,y=kind==='vortex'&&b?b.top+(b.bottom-b.top)*.45:p.y-36;
   if(x-cam.x<-100||x-cam.x>w+100||y-cam.y<-60||y-cam.y>h+170)continue;
   const d=Math.hypot(p.x-FLAT_WORLD.player.x,p.y-FLAT_WORLD.player.y);
   if(d<distance){distance=d;closest={p,b,kind,x,y};}
  }
  if(closest){const {p,b,kind,x,y}=closest;
   // Put roof smoke at the painted furnace, while the fire circle stays on its entrance court.
   const top=kind==='alchemy'&&b?b.top+(b.bottom-b.top)*.65:y;
   composition(kind,x-cam.x,top-cam.y,kind==='vortex'?1.15:.85,time,p.x-cam.x,p.y-cam.y+15);
  }
  if(high){slot(2,1,0,0,80,.30,1,0,time,currentRegion==='west'?'#c4a6df':currentRegion==='north'?'#d4e4ff':'#c5e5cc');if(FLAT_WORLD.moving)slot(3,2,FLAT_WORLD.player.x-cam.x,FLAT_WORLD.player.y-cam.y,96,.65,1,0,time,'#ffffff');}
  if(!closest&&!high){pause(false);return;}
 }
 init();if(!S.renderer&&!S.ctx)return;surface(false);resize(w,h);observe(t);if(quality()==='off'){pause(true);return;}render();
}
function burstValid(b){return S.burst===b&&b.owner===player&&!document.hidden&&!reduced()&&quality()!=='off'&&gameState!=='combat'&&gameState!=='combat-ending'&&(b.kind==='breakthrough'?!!document.getElementById('breakthroughOverlay'):!document.getElementById('alchemyPanel')?.classList.contains('hidden'));}
function tickEvent(t){S.raf=0;const b=S.burst;if(!b||!burstValid(b)||t-b.started>=b.life){pause(true);return;}if(S.renderer||S.ctx){surface(true);resize(innerWidth,innerHeight);clearSlots();S.clip=null;const age=Math.max(0,(t-b.started)/1000),high=quality()==='high',color=b.kind==='pill'?'#97eac5':b.success?'#f8d58b':'#c898a1';slot(4,3,innerWidth*.5,innerHeight*.42,high?300:120,.65,1,0,age,color);if(b.kind==='breakthrough')slot(5,4,innerWidth*.5,innerHeight*.42,1,Math.max(0,.45-age*.3),1,80+age*100,age,color);render();}S.raf=requestAnimationFrame(tickEvent);}
function event(kind,success,owner,started){if(!['pill','breakthrough'].includes(kind)||owner!==player||document.hidden||quality()==='off'||reduced())return;pause(true);S.burst={kind,success,owner,started,life:kind==='pill'?1000:1500};init();S.raf=requestAnimationFrame(tickEvent);}
function resetQuality(){pause(true);S.quality=preference();S.tier=desired();if(S.noGL&&S.tier!=='off')S.tier='lite';S.downgrades=0;}
function stats(){return {preference:preference(),tier:quality(),backend:S.noGL?'canvas2d':S.renderer?'webgl':'waiting',calls:S.calls,points:S.points,triangles:S.triangles,frames:S.frames,width:S.width,height:S.height,dpr:S.dpr,event:!!S.burst,eventRaf:!!S.raf,downgrades:S.downgrades,reason:S.reason,theme:S.theme,interior:!!S.clip};}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});window.addEventListener('pagehide',()=>pause(true));
const motion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;if(motion?.addEventListener)motion.addEventListener('change',()=>pause(true));else motion?.addListener?.(()=>pause(true));
window.XiantuMapFxV2868104={frame,event,pause,resetQuality,stats};
})();
