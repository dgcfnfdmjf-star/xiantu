/* Chapter 6 「雪灯归林」: a snowy winter night on the SAME floating island (H.island, H.camera, frame loop).
 * Everything new lives in one group parented to H.island and is shown only while level 6 is active; the
 * island's own materials, lights and fog are tinted on entry and put back exactly on leaving.
 * Play: tap the next (pulsing) snow lantern to light it; once the lanterns up to a lost kitten are lit, tap the kitten
 * and it walks the lit path home to the cabin (the existing Blender cats and their Walk clip). No timer, no fail. */
(function(window,document){
  'use strict';
  var R=window.SnowRules,GA=window.GardenAudio,M=window.__music2,K=GA&&GA.kit,V=M&&M.voices;
  // 「雪灯摇篮」: an original, slow E-major winter lullaby. Soft piano over a felt pad, a music-box glint on
  // the off-beats like snow catching lamplight. No phrase is shared with the other themes.
  if(K&&V)M.register({id:'snowlantern',name:'雪灯摇篮',key:64,bpm:56,swing:0,delay:.3,level:1.2,
    prog:[[0,'add9'],[9,'m7'],[5,'maj9'],[7,'sus'],[0,'maj9'],[4,'m7'],[5,'add9'],[7,'sus'],
      [9,'m9'],[5,'maj9'],[0,'six'],[7,'sus'],[5,'add9'],[2,'m7'],[7,'sus'],[0,'add9']],
    mel:['5---3---','2-3-1---','6---5-4-','5-------','3-4-5---','7---6---','6-5-4-3-','2-------',
      '1---3-6-','5---4---','3-2-3-5-','2-------','4---6-5-','3---2---','2-1-2---','1-------'],
    play:function(t,s,bar,ch,sd,p){
      var out=V.bus(p,1800),n=ch.notes;
      if(s===0){K.pad(t,n.slice(0,4),sd*16,.026,out,'sine',640);K.bass(t,ch.bass,.06,sd*14,out);}
      // Second half of each loop: a slow falling harp figure, like snow settling (never on melody onsets).
      if(bar>=8&&(s===2||s===6)&&!K.melNote(this,bar,s,sd)){var hn=n[(s===2?3:1)%n.length]+12;if(V.harp)V.harp(t,hn,.045,out);else V.guitar(t,hn,.025,sd*3,out);}
      if(s===4||s===12)V.guitar(t,n[(bar+s/4)%n.length]+12,.03,sd*4,out);
      var mn=K.melNote(this,bar,s,sd);
      if(mn)V.softPiano(t,mn.m,.07,mn.dur,out);
      if(s===10&&bar%2===1)K.musicBox(t,n[2]+24,.016,out);
    }
  });
  var H,T,J,group=null,snow=null,snowU=null,dome=null,lanterns=[],cabin=null,windowGlow=null,cloudSprites=[];
  var active=false,staging=false,saved=null,hiddenFlowers=[],hemi=null,sun=null,temp=null,fogColor=null;
  var patch=null,patchU=[],litU=0,cats=[],homeSpots=[],sparks=[],practice=null,finale=0,elapsed=0,pendingFinale=false,reduced=false,lastFocus=null,warm=null,cool=null,FIN=7;
  var TOP=.25,PATH=[[.55,4.35],[.15,3.15],[-.25,1.9],[.55,.7],[.1,-.6],[-.45,-1.75],[-.5,-2.3]];
  var CABIN={x:-.5,z:-3.05},PINES=[[-2.05,-3.85,1],[1.85,-4.0,.9],[4.1,-.55,.95],[-4.2,-.55,.9],[-3.0,3.25,.85],[3.25,2.95,.8]];
  // Island colours in snow (original V5 hex -> winter hex). Anything not listed keeps its colour.
  var WINTER={0xa9dcb2:0xd9e3f2,0xe6b8a2:0xb7b9da,0xc6a0c0:0x9aa3cc,0xc4e8ff:0xa9c8ea,0xd8cde6:0xe7edf7,0x86c993:0xc2d0e8,0xd6c6e2:0xe3e9f5,
    0xffc4d8:0xf3f6fc,0xffd3e2:0xeaf0fa,0xf7b6cf:0xe2eaf7,0xa9846f:0x7f6b68,0xffeaf2:0xe9effc};
  var EMISSIVE={0x4a2034:0x26304e,0x403048:0x2a3358};
  function $(id){return document.getElementById(id);}
  function progress(){return practice||J.progress.snow;}
  function hint(){var s=progress();return R.finished(s)?'❄ 雪灯都亮了 · 小猫们都在小屋里':R.next(s)>=0?'❄ 轻点发光的那盏雪灯，把小路点亮':'❄ 点一点等在灯旁的小猫，带它回家';}
  function canPlay(){return active&&H.isStarted()&&!J.blocked()&&!document.hidden&&!finale&&!modal();}
  function modal(){var e=$('snowEnding');return !!e&&!e.hidden;}
  function sfx(deg,gap){if(GA&&GA.isSfxOn&&GA.isSfxOn()&&GA.melody)GA.melody(deg,gap||.15,true);}
  // Same footprint test the island props use (clipping.js), plus the pond and the cabin.
  function clear(x,z,pad){var C=window.GardenClip;return Math.hypot(x,z)<4.55-pad&&Math.hypot(x-H.POND.x,z-H.POND.z)>1.15+pad&&
    Math.hypot(x-CABIN.x,z-CABIN.z)>.85+pad&&(!C||C.groundClear(x,z,pad));}
  function pathAt(u){ // Catmull-Rom through PATH, u in [0,1]
    var n=PATH.length-1,f=Math.min(n-1e-6,Math.max(0,u*n)),i=Math.floor(f),t=f-i,p0=PATH[Math.max(0,i-1)],p1=PATH[i],p2=PATH[i+1],p3=PATH[Math.min(n,i+2)];
    function c(k){return .5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t);}
    return [c(0),c(1)];
  }
  function lambert(color,extra){var o={color:color};for(var k in extra)o[k]=extra[k];return new T.MeshLambertMaterial(o);}
  function mesh(geo,mat,parent,x,y,z){var m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);parent.add(m);return m;}
  function glow(parent,color,size,opacity,x,y,z){var s=new T.Sprite(new T.SpriteMaterial({map:H.glowTex,color:color,transparent:true,opacity:opacity,depthWrite:false,blending:T.AdditiveBlending}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s;}
  function paintCloud(){ // a soft watercolour cloud: overlapping translucent washes with a pale rim
    var c=document.createElement('canvas');c.width=256;c.height=128;var g=c.getContext('2d');
    for(var i=0;i<14;i++){var x=40+Math.random()*176,y=58+Math.random()*30-Math.abs(x-128)*.12,r=24+Math.random()*30,gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(236,242,255,.42)');gr.addColorStop(.7,'rgba(196,210,240,.22)');gr.addColorStop(1,'rgba(160,178,224,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
    var tex=new T.CanvasTexture(c);return tex;
  }
  function buildWorld(){
    if(group)return;
    group=new T.Group();group.name='snow-lantern-night';group.visible=false;H.island.add(group);
    var snowWhite=lambert(0xf4f7fd,{emissive:0x1c2440}),dark=lambert(0x2f5a55,{emissive:0x0c1a22}),wood=lambert(0x8a5a3c,{emissive:0x2a160c}),woodDark=lambert(0x5b3a28);
    var dummy=new T.Object3D(),i;
    // Snowy pines: one instanced mesh for the green tiers, one for their snow caps (2 draw calls).
    var tier=new T.ConeGeometry(1,1,7),cap=new T.ConeGeometry(1,1,7);tier.translate(0,.5,0);cap.translate(0,.5,0);
    var tiers=new T.InstancedMesh(tier,dark,PINES.length*3),caps=new T.InstancedMesh(cap,snowWhite,PINES.length*3);
    PINES.forEach(function(p,j){for(var k=0;k<3;k++){var s=p[2],w=(.62-k*.15)*s,h=(.7-k*.08)*s,y=TOP+(.25+k*.42)*s;
      dummy.position.set(p[0],y,p[1]);dummy.rotation.set(0,j+k,0);dummy.scale.set(w,h,w);dummy.updateMatrix();tiers.setMatrixAt(j*3+k,dummy.matrix);
      dummy.position.y=y+h*.42;dummy.scale.set(w*.72,h*.6,w*.72);dummy.updateMatrix();caps.setMatrixAt(j*3+k,dummy.matrix);}});
    var trunks=new T.InstancedMesh(new T.CylinderGeometry(.07,.1,.3,5),woodDark,PINES.length);
    PINES.forEach(function(p,j){dummy.position.set(p[0],TOP+.15*p[2],p[1]);dummy.rotation.set(0,0,0);dummy.scale.set(p[2],p[2],p[2]);dummy.updateMatrix();trunks.setMatrixAt(j,dummy.matrix);});
    tiers.name='snow-pines';group.add(tiers);group.add(caps);group.add(trunks);
    // The winding snowy path: pressed-snow stepping patches from the island's front edge to the cabin door.
    var steps=22;patch=new T.InstancedMesh(new T.CylinderGeometry(.3,.32,.04,10),lambert(0xfbfcff,{emissive:0x3a4466}),steps);patch.name='snow-path';
    for(i=0;i<steps;i++){var q=pathAt(i/(steps-1));dummy.position.set(q[0],TOP+.02,q[1]);dummy.rotation.set(0,i*.9,0);dummy.scale.set(1+(i%3)*.08,1,.82);dummy.updateMatrix();patch.setMatrixAt(i,dummy.matrix);}
    group.add(patch);
    for(i=0;i<steps;i++){patchU.push(i/(steps-1));patch.setColorAt(i,cool);}patch.instanceColor.needsUpdate=true;
    // The cabin: warm wood, a snow-laden roof and a glowing window that faces the default camera (+z).
    cabin=new T.Group();cabin.name='snow-cabin';cabin.position.set(CABIN.x,TOP,CABIN.z);group.add(cabin);
    mesh(new T.BoxGeometry(1.3,.8,1),wood,cabin,0,.4,0);
    [-1,1].forEach(function(side){var r=mesh(new T.BoxGeometry(.86,.07,1.2),woodDark,cabin,side*.34,1.03,0);r.rotation.z=-side*.62;
      var sn=mesh(new T.BoxGeometry(.86,.07,1.24),snowWhite,cabin,side*.36,1.08,0);sn.rotation.z=-side*.62;});
    var gable=new T.Shape();gable.moveTo(-.65,0);gable.lineTo(.65,0);gable.lineTo(0,.48);gable.lineTo(-.65,0);
    var gg=new T.ShapeGeometry(gable);[.5,-.5].forEach(function(z){var m=mesh(gg,wood,cabin,0,.8,z);if(z<0)m.rotation.y=Math.PI;});
    mesh(new T.BoxGeometry(.16,.36,.16),woodDark,cabin,.35,1.25,-.15);mesh(new T.BoxGeometry(.2,.06,.2),snowWhite,cabin,.35,1.45,-.15);
    mesh(new T.PlaneGeometry(.3,.52),lambert(0x4a2c1e),cabin,-.33,.27,.505);
    var win=new T.MeshBasicMaterial({color:0xffc566});mesh(new T.PlaneGeometry(.34,.28),win,cabin,.28,.48,.506);
    mesh(new T.BoxGeometry(.4,.04,.04),woodDark,cabin,.28,.48,.52);mesh(new T.BoxGeometry(.04,.34,.04),woodDark,cabin,.28,.48,.52);
    windowGlow=glow(cabin,0xffb252,1.5,.55,.28,.48,.62);
    mesh(new T.BoxGeometry(1.42,.05,.16),snowWhite,cabin,0,.03,.55);
    // Six unlit snow lanterns along the path, alternating sides; a side that would clip a prop flips over.
    var domeGeo=new T.SphereGeometry(.2,12,8,0,Math.PI*2,0,Math.PI/2),base=new T.CylinderGeometry(.24,.27,.12,12),hole=new T.CircleGeometry(.075,10);
    var holeMat=new T.MeshBasicMaterial({color:0x3a2a30});
    for(i=0;i<R.LANTERNS;i++){
      var u=.06+i*.15,a=pathAt(u),b=pathAt(u+.02),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1,side=i%2?1:-1,x,z,tries;
      for(tries=0;tries<16;tries++){var off=tries<8?.62:.85;x=a[0]-dz/len*off*side;z=a[1]+dx/len*off*side;if(clear(x,z,.28))break;side=-side;if(tries%2){u+=(tries%4===1?.03:-.06);a=pathAt(u);b=pathAt(u+.02);dx=b[0]-a[0];dz=b[1]-a[1];len=Math.hypot(dx,dz)||1;}}
      var L=new T.Group();L.name='snow-lantern-'+i;L.position.set(x,TOP,z);L.scale.setScalar(1.25);group.add(L);
      mesh(base,snowWhite,L,0,.06,0);mesh(domeGeo,snowWhite,L,0,.12,0);
      var h=mesh(hole,holeMat.clone(),L,0,.2,.17);h.rotation.x=-.25;
      var e=glow(L,0xffb860,.5,.14,0,.2,.2);
      var ring=glow(L,0xffe2a8,.9,0,0,.16,0);
      lanterns.push({g:L,hole:h,ember:e,ring:ring,lit:false,u:u,flash:0});
    }
    // Falling snow: one Points draw call, animated entirely in the vertex shader (no per-frame CPU writes).
    var count=H.IS_MOBILE?360:620,pos=new Float32Array(count*3),size=new Float32Array(count),phase=new Float32Array(count);
    for(i=0;i<count;i++){var rr=Math.sqrt(Math.random())*8,aa=Math.random()*6.283;pos[i*3]=Math.cos(aa)*rr;pos[i*3+1]=Math.random()*12;pos[i*3+2]=Math.sin(aa)*rr;size[i]=.05+Math.random()*.07;phase[i]=Math.random()*6.283;}
    var sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(pos,3));sg.setAttribute('aSize',new T.BufferAttribute(size,1));sg.setAttribute('aPhase',new T.BufferAttribute(phase,1));
    snowU={uTime:{value:0},uScale:{value:600}};
    snow=new T.Points(sg,new T.ShaderMaterial({uniforms:snowU,transparent:true,depthWrite:false,
      vertexShader:'attribute float aSize;attribute float aPhase;uniform float uTime;uniform float uScale;varying float vA;'+
        'void main(){vec3 p=position;float sp=.35+fract(aPhase*7.3)*.3;p.y=mod(p.y-uTime*sp,12.0)-1.6;'+
        'p.x+=sin(uTime*.5+aPhase)*.35;p.z+=cos(uTime*.4+aPhase*1.7)*.25;vec4 mv=modelViewMatrix*vec4(p,1.0);'+
        'gl_PointSize=max(1.5,aSize*uScale/max(-mv.z,.5));gl_Position=projectionMatrix*mv;vA=smoothstep(-1.6,-.6,p.y)*smoothstep(10.4,8.8,p.y);}',
      fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.15,d);gl_FragColor=vec4(.93,.96,1.0,a*.9*vA);}'}));
    snow.name='snow-fall';snow.frustumCulled=false;group.add(snow);
    buildCats();
    // A cool night wash over the existing sky (inside its 120 radius) and a few big painterly clouds.
    dome=new T.Mesh(new T.SphereGeometry(100,24,12),new T.MeshBasicMaterial({color:0x1b2858,transparent:true,opacity:.58,side:T.BackSide,depthWrite:false,fog:false}));
    dome.name='snow-sky-wash';dome.visible=false;H.scene.add(dome);
    var tex=paintCloud();
    [[-.9,9,1],[.5,11,1.25],[2.2,7,1.1],[3.6,10,.95],[5.0,8,1.15]].forEach(function(c){
      var s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,opacity:.7,depthWrite:false,fog:false,color:0xd6e0fb}));
      s.position.set(Math.cos(c[0])*48,c[1],Math.sin(c[0])*48-6);s.scale.set(34*c[2],17*c[2],1);s.visible=false;s.name='snow-cloud';H.scene.add(s);cloudSprites.push(s);});
  }
  // ---- Kittens: the four local Blender cats (src/cat-models.js) with their own Walk clip; a simple fallback cat if a
  // model cannot load. Each waits beside its lantern, a little away from the path, under a small paw marker.
  function bubble(ready){
    var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d');
    g.fillStyle=ready?'rgba(255,214,150,.95)':'rgba(190,204,236,.85)';g.beginPath();g.arc(64,58,44,0,7);g.fill();
    g.beginPath();g.moveTo(52,96);g.lineTo(64,120);g.lineTo(76,96);g.fill();
    g.fillStyle=ready?'#7a4320':'#4a5478';g.beginPath();g.ellipse(64,70,15,12,0,0,7);g.fill();
    [[44,50],[57,40],[71,40],[84,50]].forEach(function(p){g.beginPath();g.ellipse(p[0],p[1],7,8.5,0,0,7);g.fill();});
    return new T.CanvasTexture(c);
  }
  function fallbackCat(root,color){
    var m=lambert(color,{emissive:0x121522}),b=mesh(new T.SphereGeometry(.16,10,8),m,root,0,.17,0);b.scale.set(1,.85,1.35);
    mesh(new T.SphereGeometry(.12,10,8),m,root,0,.33,.18);
    [-1,1].forEach(function(s){var e=mesh(new T.ConeGeometry(.045,.09,4),m,root,s*.065,.45,.18);e.rotation.z=-s*.2;});
    var tl=mesh(new T.CylinderGeometry(.025,.03,.26,5),m,root,0,.25,-.22);tl.rotation.x=-.7;
  }
  function freeSpot(x,z,taken,pad){
    return clear(x,z,pad)&&lanterns.every(function(l){return Math.hypot(l.g.position.x-x,l.g.position.z-z)>.5;})&&
      PINES.every(function(p){return Math.hypot(p[0]-x,p[1]-z)>.75*p[2]+.25;})&&taken.every(function(q){return Math.hypot(q[0]-x,q[1]-z)>.55;});
  }
  function buildCats(){
    var taken=[],tex=[bubble(false),bubble(true)],a,i;
    // Home spots: a row in front of the cabin, beside (not on) the end of the path.
    for(a=-1.5;a<=1.5&&homeSpots.length<4;a+=.12){var hx=CABIN.x+Math.sin(a)*1.2,hz=CABIN.z+Math.cos(a)*1.2,end=pathAt(1);
      if(Math.abs(a)>.3&&Math.hypot(hx-end[0],hz-end[1])>.4&&freeSpot(hx,hz,homeSpots,.12))homeSpots.push([hx,hz]);}
    while(homeSpots.length<4)homeSpots.push([CABIN.x+.9,CABIN.z+.8+homeSpots.length*.1]);
    R.kittens.forEach(function(k,ki){
      var L=lanterns[k.lantern],lx=L.g.position.x,lz=L.g.position.z,pa=pathAt(L.u),dx=lx-pa[0],dz=lz-pa[1],dl=Math.hypot(dx,dz)||1,base=Math.atan2(dx/dl,dz/dl),x=lx,z=lz;
      for(i=0;i<24;i++){var ang=base+(i%2?1:-1)*Math.ceil(i/2)*.3,r=.62+(i>12?.25:0);x=lx+Math.sin(ang)*r;z=lz+Math.cos(ang)*r;if(freeSpot(x,z,taken,.18))break;}
      taken.push([x,z]);
      var root=new T.Group();root.name='snow-kitten-'+k.id;root.position.set(x,TOP,z);group.add(root);
      var marker=new T.Sprite(new T.SpriteMaterial({map:tex[0],transparent:true,depthWrite:false,depthTest:false}));marker.position.set(0,1.12,0);marker.scale.set(.5,.5,1);marker.renderOrder=3;root.add(marker);
      var c={k:k,i:ki,root:root,spot:[x,z],home:homeSpots[ki],marker:marker,tex:tex,walk:null,owner:null,yaw:0,bob:Math.random()*6};
      root.rotation.y=Math.atan2(pa[0]-x,pa[1]-z);cats.push(c);
      var CM=window.GardenCatModels;
      if(CM&&CM.snowCat)CM.snowCat(k.id,root,.66).then(function(o){if(o)c.owner=o;else fallbackCat(root,k.color);});else fallbackCat(root,k.color);
    });
  }
  // Arc-length walk (equal-distance sampling of the curve, as in zz85/threejs-path-flow; arrive-style easing as in
  // yuka's FollowPath/Arrive): spot -> path beside its lantern -> along the lit path -> the cabin door -> home spot.
  function route(c){
    var pts=[[c.root.position.x,c.root.position.z]],u=c.k.lantern>=0?lanterns[c.k.lantern].u:0,j;
    for(j=0;j<=24;j++){var q=pathAt(u+(1-u)*j/24);pts.push(q);}
    pts.push(c.home);var cum=[0];for(j=1;j<pts.length;j++)cum.push(cum[j-1]+Math.hypot(pts[j][0]-pts[j-1][0],pts[j][1]-pts[j-1][1]));
    return {pts:pts,cum:cum,len:cum[cum.length-1],d:0};
  }
  function along(w,d){var j=1;while(j<w.cum.length-1&&w.cum[j]<d)j++;var a=w.pts[j-1],b=w.pts[j],f=(d-w.cum[j-1])/Math.max(1e-6,w.cum[j]-w.cum[j-1]);f=Math.max(0,Math.min(1,f));return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,Math.atan2(b[0]-a[0],b[1]-a[1])];}
  function sitHome(c){c.walk=null;c.root.position.set(c.home[0],TOP,c.home[1]);c.root.rotation.y=Math.atan2(-.2-c.home[0]*.05,1);c.marker.visible=false;
    if(c.owner&&window.GardenCatModels.snowWalk)window.GardenCatModels.snowWalk(c.owner,false,0,0);}
  function sitWaiting(c){c.walk=null;c.root.position.set(c.spot[0],TOP,c.spot[1]);var pa=pathAt(lanterns[c.k.lantern].u);c.root.rotation.y=Math.atan2(pa[0]-c.spot[0],pa[1]-c.spot[1]);c.marker.visible=true;
    if(c.owner&&window.GardenCatModels.snowWalk)window.GardenCatModels.snowWalk(c.owner,false,0,0);}
  function homeCount(){return cats.filter(function(c){return progress().home.indexOf(c.k.id)>=0&&!c.walk;}).length;}
  // Put every lantern and kitten in the state the progress says (on entry, practice replay, reload).
  function sync(){
    if(!group)return;var s=progress();
    lanterns.forEach(function(l,i){setLit(l,s.lit.indexOf(i)>=0);});
    litU=targetU();paintPath();
    cats.forEach(function(c){if(s.home.indexOf(c.k.id)>=0)sitHome(c);else sitWaiting(c);});
  }
  function setLit(l,on){l.lit=on;l.hole.material.color.setHex(on?0xffc566:0x3a2a30);}
  function targetU(){var s=progress(),u=0;for(var i=0;i<R.LANTERNS&&s.lit.indexOf(i)>=0;i++)u=lanterns[i].u+.05;return i===R.LANTERNS?1.01:u;}
  function paintPath(){if(!patch)return;for(var i=0;i<patchU.length;i++){var f=Math.max(0,Math.min(1,(litU-patchU[i])/.05+1));temp.set(1,1,1);patch.setColorAt(i,cool.clone().lerp(warm,f));}patch.instanceColor.needsUpdate=true;}
  function burst(pos,color){
    if(H.emitSpark){var c=new T.Color(color);for(var i=0;i<16;i++){var a=i*.39,sp=.5+Math.random()*.7;H.emitSpark(pos.x,pos.y,pos.z,Math.cos(a)*sp*.6,.8+Math.random()*.8,Math.sin(a)*sp*.6,.9+Math.random()*.5,.12+Math.random()*.1,c);}}
  }
  function act(kind,i){
    if(!canPlay())return;
    var s=progress(),res=R.act(s,kind,i);
    if(kind==='lantern'){
      var l=lanterns[i];
      if(res.progress){setLit(l,true);l.flash=1;l.g.getWorldPosition(temp);temp.y+=.3;burst(temp,0xffc978);sfx([[0,2],[1,4],[2,4],[2,5],[4,7],[5,9]][i]||[0,4],.16);
        var ready=R.kittens.filter(function(k,ki){return R.reachable(s,ki)&&k.lantern===i;})[0];
        H.toast(ready?'第 '+(i+1)+' 盏雪灯亮了 · 「'+ready.name+'」看见光了，点它带它回家':'第 '+(i+1)+' 盏雪灯亮了'+(R.next(s)<0?' · 整条小路都暖起来了':''),2200);}
      else if(res.hint==='far')H.toast('先点亮那盏正在轻轻发光的雪灯 ✧ 不着急',1900);
      else if(res.hint==='lit'){l.flash=.6;sfx([4],.1);}
    }else{
      var c=cats[i];
      if(res.progress){c.marker.visible=false;sfx([2,4,7],.14);H.toast('「'+c.k.name+'」跟着灯光往小木屋走了',2000);
        if(reduced){sitHome(c);arrived(c);}else c.walk=route(c);}
      else if(res.hint==='dark'){var n=R.darkness(s,i);H.toast('「'+c.k.name+'」那边还暗着 · 再点亮 '+n+' 盏雪灯就能接它回家',2200);}
    }
    if(res.finished&&res.progress&&!practice)J.complete(6);
    if(res.changed){if(!practice)J.changed();render();}
    if(res.finished&&res.progress){if(reduced||!cats.some(function(c){return c.walk;}))startFinale();else pendingFinale=true;}
  }
  function arrived(c){
    c.root.getWorldPosition(temp);temp.y+=.35;burst(temp,0xffe0a8);
    H.toast(c.k.name+'回到小木屋了'+(practice?'':' · 记进雪灯手记'),2200);sfx([4,5,7],.13);render();
    if(pendingFinale&&!cats.some(function(o){return o.walk;})){pendingFinale=false;startFinale();}
  }
  function startFinale(){finale=reduced?0:FIN;elapsed=0;render();if(reduced)showEnding();else sfx([0,2,4,5,7,9],.22);}
  function showEnding(){finale=0;elapsed=FIN;render();lastFocus=document.activeElement;$('snowEnding').hidden=false;$('snowStay').focus();}
  function closeEnding(){$('snowEnding').hidden=true;render();if(lastFocus&&document.contains(lastFocus)&&lastFocus.getClientRects().length)lastFocus.focus();}
  function replay(){if(!canPlay()||!R.finished(progress()))return;practice=R.normalize(null);pendingFinale=false;sync();render();H.toast('再走一程 · 收藏与成长都保留，这次只为看灯',2600);}
  // Snapshot every island/scene material we tint so leaving the level restores the exact original values.
  function tint(on){
    if(on){
      saved=[];var seen=[];
      function take(m){if(!m||seen.indexOf(m)>=0||!m.color)return;var hex=m.color.getHex();if(WINTER[hex]===undefined)return;seen.push(m);
        saved.push({m:m,color:hex,emissive:m.emissive?m.emissive.getHex():null});m.color.setHex(WINTER[hex]);
        if(m.emissive&&EMISSIVE[m.emissive.getHex()]!==undefined)m.emissive.setHex(EMISSIVE[m.emissive.getHex()]);}
      H.island.children.forEach(function(o){if(o===group||H.flowers.some(function(f){return f.root===o;}))return;
        if(o.isMesh)take(o.material);
        else if(o.isGroup&&Math.abs(o.position.x-H.TREE.x)<.01&&Math.abs(o.position.z-H.TREE.z)<.01)o.children.forEach(function(c){if(c.isMesh)take(c.material);});});
      // Floating rocks and the drifting clouds are scene children with orbit userData {a, r, sp}.
      H.scene.children.forEach(function(o){if(o.isGroup&&o.userData&&o.userData.sp!==undefined)o.traverse(function(c){if(c.isMesh)take(c.material);});});
      H.scene.children.forEach(function(o){if(o.isHemisphereLight)hemi=o;if(o.isDirectionalLight&&!sun)sun=o;});
      saved.lights={hc:hemi&&hemi.color.getHex(),hg:hemi&&hemi.groundColor.getHex(),sc:sun&&sun.color.getHex()};
      if(hemi){hemi.color.setHex(0xc9dcff);hemi.groundColor.setHex(0x5a6aa6);}if(sun)sun.color.setHex(0xc4d4ff);
    }else if(saved){
      saved.forEach(function(s){s.m.color.setHex(s.color);if(s.emissive!==null)s.m.emissive.setHex(s.emissive);});
      if(hemi){hemi.color.setHex(saved.lights.hc);hemi.groundColor.setHex(saved.lights.hg);}if(sun)sun.color.setHex(saved.lights.sc);
      saved=null;
    }
  }
  // Player flowers that would sit inside the cabin, a lantern or a pine are hidden for this level only.
  function hideFlowers(on){
    if(!on){hiddenFlowers.forEach(function(f){f.root.visible=f.was;});hiddenFlowers=[];return;}
    var spots=lanterns.map(function(l){return [l.g.position.x,l.g.position.z,.5];}).concat(PINES.map(function(p){return [p[0],p[1],.75*p[2]];}),[[CABIN.x,CABIN.z,1.1]]);
    for(var i=0;i<12;i++){var q=pathAt(i/11);spots.push([q[0],q[1],.38]);}
    cats.forEach(function(c){spots.push([c.spot[0],c.spot[1],.4],[c.home[0],c.home[1],.4]);});
    H.flowers.forEach(function(f){var p=f.root.position;if(spots.some(function(s){return Math.hypot(p.x-s[0],p.z-s[1])<s[2];})){hiddenFlowers.push({root:f.root,was:f.root.visible});f.root.visible=false;}});
  }
  function prompt(){var s=progress(),n=R.next(s),r=R.kittens.map(function(k,i){return R.reachable(s,i)?k.name:null;}).filter(Boolean);
    if(finale)return '雪灯一盏盏亮着，小猫们在窗边暖暖地睡了……';
    if(R.finished(s))return practice?'这一程也走完了 · 小屋一直暖着':'雪灯把小猫们都送回了家';
    if(r.length)return '点一点「'+r[0]+'」，带它沿着灯光回家';
    return '轻点正在发光的第 '+(n+1)+' 盏雪灯';}
  function render(){var hud=$('snowHud');if(!hud)return;hud.hidden=!active;var s=progress(),done=R.finished(s);
    $('snowCount').textContent=practice?'再走一程 · '+s.lit.length+'/'+R.LANTERNS+' 灯':R.progressText(s);
    var dock=$('snowDock');dock.hidden=!active;if(!active)return;
    $('snowPrompt').textContent=prompt();
    var walking=cats.some(function(c){return c.walk;});
    $('snowSkip').hidden=!finale;$('snowFinale').hidden=$('snowReplay').hidden=!done||!!finale||walking||pendingFinale;}
  function buildUI(){
    var hud=document.createElement('div');hud.id='snowHud';hud.className='glass';hud.hidden=true;hud.setAttribute('role','status');
    hud.innerHTML='<strong>❄ 雪灯归林</strong><span id="snowCount"></span>';
    var top=$('topbar');if(top)top.insertBefore(hud,top.firstChild);else document.body.appendChild(hud);
    var dock=document.createElement('div');dock.id='snowDock';dock.className='glass';dock.hidden=true;
    dock.innerHTML='<p id="snowPrompt" role="status" aria-live="polite"></p><div id="snowButtons"><button id="snowSkip" hidden>跳过</button><button id="snowFinale" hidden>重看雪灯归林</button><button id="snowReplay" hidden>再走一程</button></div>';
    document.body.appendChild(dock);
    $('snowSkip').onclick=function(){if(finale)showEnding();};$('snowFinale').onclick=function(){if(canPlay()&&R.finished(progress()))startFinale();};$('snowReplay').onclick=replay;
    var end=document.createElement('div');end.id='snowEnding';end.hidden=true;end.setAttribute('role','dialog');end.setAttribute('aria-modal','true');end.setAttribute('aria-labelledby','snowEndTitle');
    end.innerHTML='<div class="jr-card"><div class="jr-eyebrow">CHAPTER 06 · COMPLETE</div><h2 id="snowEndTitle">雪灯把小猫们都送回了家</h2><p>六盏雪灯连成一条暖暖的小路，<br>小橘、花卷、墨团和虎斑，<br>都在亮着窗的小木屋里睡着了。</p><p class="jr-note">收藏与首次通关的成长只领取一次</p><button class="jr-action" id="snowStay">留下来，看看雪</button><button class="jr-action" id="snowJournal">翻开成长手账</button></div>';
    document.body.appendChild(end);$('snowStay').onclick=closeEnding;$('snowJournal').onclick=function(){closeEnding();J.open('growth');};
    document.addEventListener('keydown',function(e){if(end.hidden)return;if(e.key==='Escape'){e.preventDefault();closeEnding();}
      if(e.key==='Tab'){var first=$('snowStay'),last=$('snowJournal');if(e.shiftKey&&(document.activeElement===first||!end.contains(document.activeElement))){last.focus();e.preventDefault();}else if(!e.shiftKey&&(document.activeElement===last||!end.contains(document.activeElement))){first.focus();e.preventDefault();}}});
    // From the level-5 card, a gentle way on to level 6.
    var le=$('lotusEnding');if(le){var nb=document.createElement('button');nb.id='snowFromLotus';nb.className='jr-action';nb.textContent='第六关：雪灯归林';nb.onclick=function(){$('lotusStay').click();J.go(6);};le.querySelector('.jr-card').appendChild(nb);}
  }
  function leave(){if(!active)return;practice=null;finale=0;pendingFinale=false;$('snowEnding').hidden=true;cats.forEach(function(c){if(c.walk)sitHome(c);});tint(false);hideFlowers(false);if(group)group.visible=false;dome.visible=false;cloudSprites.forEach(function(s){s.visible=false;});}
  window.SnowChapter={
    init:function(hooks,bridge){H=hooks;T=hooks.THREE;J=bridge;temp=new T.Vector3();fogColor=new T.Color(0x56679a);warm=new T.Color(0xffd08a);cool=new T.Color(0xaebbe0);
      reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);buildUI();return this;},
    beforeLevel:function(n){if(active&&n!==6)leave();},
    onLevel:function(n){
      if(active&&n!==6)leave();
      var entering=!active&&n===6;active=n===6;
      if(entering){buildWorld();tint(true);group.visible=true;dome.visible=true;cloudSprites.forEach(function(s){s.visible=true;});hideFlowers(true);H.setNightTarget(.9);H.setDeepNight(0);sync();}
      render();
    },
    update:function(dt,t){
      if(!active)return;
      H.setNightTarget(.9);H.setDeepNight(0);
      // The main loop recomputes the fog colour every frame before this runs; give it the snowy blue.
      if(H.scene.fog)H.scene.fog.color.copy(fogColor);
      snowU.uTime.value=t;
      var pr=Math.min(1.5,window.devicePixelRatio||1);snowU.uScale.value=innerHeight*pr/(2*Math.tan(H.camera.fov*Math.PI/360))*H.camera.zoom;
      var s=progress(),nx=R.next(s),hc=homeCount(),fin=finale?Math.min(1,elapsed/1.5):0;
      if(windowGlow){var w=.42+hc*.13+fin*.25;windowGlow.material.opacity=Math.min(1,w+Math.sin(t*1.3)*.05);windowGlow.scale.setScalar(1.25+hc*.3+fin*.5);}
      lanterns.forEach(function(l,i){l.flash=Math.max(0,l.flash-dt*1.2);
        var wave=finale?Math.max(0,Math.sin(elapsed*2.2-i*.7)):0;
        if(l.lit){l.ember.material.opacity=.62+Math.sin(t*1.9+i)*.06+l.flash*.3+wave*.25;l.ember.scale.setScalar(1.05+l.flash*.6+wave*.3);}
        else if(i===nx&&!finale){var p=.5+.5*Math.sin(t*3.2);l.ember.material.opacity=.22+p*.3;l.ember.scale.setScalar(.6+p*.35);}
        else{l.ember.material.opacity=.12+Math.sin(t*1.7+i)*.03;l.ember.scale.setScalar(.5);}
        l.ring.material.opacity=l.flash*.8;l.ring.scale.setScalar(.9+(1-l.flash)*1.6);});
      var tu=targetU();if(Math.abs(litU-tu)>.002){litU+=(tu-litU)*Math.min(1,dt*(reduced?60:1.6));paintPath();}
      var CM=window.GardenCatModels;
      cats.forEach(function(c){
        if(c.walk){var w=c.walk,sp=.75*Math.min(1,.35+w.d*1.5)*Math.min(1,.3+(w.len-w.d)*1.6);w.d=Math.min(w.len,w.d+sp*dt);var q=along(w,w.d);
          c.root.position.set(q[0],TOP,q[1]);var dy=q[2]-c.root.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));c.root.rotation.y+=dy*Math.min(1,dt*6);
          if(c.owner&&CM.snowWalk)CM.snowWalk(c.owner,true,sp,dt);
          if(w.d>=w.len){sitHome(c);arrived(c);}}
        else if(c.marker.visible){var ready=R.reachable(s,c.i),bob=Math.sin(t*2+c.bob);c.marker.material.map=c.tex[ready?1:0];c.marker.position.y=1.02+bob*.04;c.marker.scale.setScalar(ready?.62+bob*.05:.5);}
      });
      if(finale){elapsed+=dt;finale=Math.max(0,FIN-elapsed);if(!finale)showEnding();}
    },
    // Screen-space hit test with generous radii (one thumb on a phone): the nearest lantern or waiting kitten wins.
    tap:function(ray){if(!canPlay())return active;temp.copy(ray.ray.origin).addScaledVector(ray.ray.direction,10).project(H.camera);
      var x=(temp.x+1)*innerWidth/2,y=(1-temp.y)*innerHeight/2,best=null,dist=Math.max(44,Math.min(innerWidth,innerHeight)*.11);
      function test(obj,dy,kind,i){obj.getWorldPosition(temp);temp.y+=dy;temp.project(H.camera);if(temp.z<-1||temp.z>1)return;var d=Math.hypot((temp.x+1)*innerWidth/2-x,(1-temp.y)*innerHeight/2-y);if(d<dist){dist=d;best=[kind,i];}}
      lanterns.forEach(function(l,i){test(l.g,.25,'lantern',i);});
      cats.forEach(function(c){if(c.marker.visible){test(c.root,.25,'kitten',c.i);test(c.marker,0,'kitten',c.i);}});
      if(best){act(best[0],best[1]);return true;}
      var now=performance.now();if(!this._last||now-this._last>2500){this._last=now;H.toast(hint(),2600);}return true;},
    cameraBusy:function(){return false;},
    // The level-6 film (l6-cutscene.js) borrows this snowy world as its set, on any level: stage(true) builds it,
    // tints the island and shows the group (if level 6 is not already active) and hands back display handles;
    // stage(false) puts everything back. It never touches progress or saves.
    stage:function(on){
      if(!H)return null;
      if(on){buildWorld();if(!active){tint(true);hideFlowers(true);}staging=true;group.visible=true;
        return {group:group,snow:snow,cabin:cabin,patch:patch,lanterns:lanterns.map(function(l){return l.g;}),cats:cats.map(function(c){return c.root;}),
          markers:cats.map(function(c){return c.marker;}),dome:dome,clouds:cloudSprites,windowGlow:windowGlow,path:pathAt,cabinAt:{x:CABIN.x,z:CABIN.z},top:TOP,
          pines:PINES.map(function(p){return p.slice();})};}
      if(!staging)return null;staging=false;if(!active){tint(false);hideFlowers(false);group.visible=false;}return null;},
    isModalOpen:modal,
    hint:hint,
    // Read-only inspection for tests.
    isActive:function(){return active;},
    debug:function(){return {active:active,built:!!group,visible:!!group&&group.visible,lanterns:lanterns.map(function(l){return {x:l.g.position.x,z:l.g.position.z};}),
      cabin:CABIN,pines:PINES.map(function(p){return {x:p[0],z:p[1],r:.62*p[2]};}),path:PATH.map(function(p,i){return pathAt(i/(PATH.length-1));}),tinted:saved?saved.length:0,finale:finale,practice:!!practice,
      kittens:cats.map(function(c){return {id:c.k.id,x:c.root.position.x,z:c.root.position.z,spot:c.spot,home:c.home,walking:!!c.walk,model:!!c.owner,marker:c.marker.visible};}),
      lit:lanterns.map(function(l){return l.lit;}),hiddenFlowers:hiddenFlowers.length,snow:snow?snow.geometry.attributes.position.count:0};}
  };
})(window,document);
