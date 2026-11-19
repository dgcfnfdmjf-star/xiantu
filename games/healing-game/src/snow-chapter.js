/* Chapter 6 「雪灯归林」: a snowy winter night on the SAME floating island (H.island, H.camera, frame loop).
 * Everything new lives in one group parented to H.island and is shown only while level 6 is active; the
 * island's own materials, lights and fog are tinted on entry and put back exactly on leaving.
 * Item 1: the look and the placed (not yet interactive) cabin, path and lanterns. */
(function(window,document){
  'use strict';
  var R=window.SnowRules,GA=window.GardenAudio,M=window.__music2,K=GA&&GA.kit,V=M&&M.voices;
  // 「雪灯摇篮」: an original, slow E-major winter lullaby. Soft piano over a felt pad, a music-box glint on
  // the off-beats like snow catching lamplight. No phrase is shared with the other themes.
  if(K&&V)M.register({id:'snowlantern',name:'雪灯摇篮',key:64,bpm:56,swing:0,delay:.3,level:1.15,
    prog:[[0,'add9'],[9,'m7'],[5,'maj9'],[7,'sus'],[0,'maj9'],[4,'m7'],[5,'add9'],[7,'sus'],
      [9,'m9'],[5,'maj9'],[0,'six'],[7,'sus'],[5,'add9'],[2,'m7'],[7,'sus'],[0,'add9']],
    mel:['5---3---','2-3-1---','6---5-4-','5-------','3-4-5---','7---6---','6-5-4-3-','2-------',
      '1---3-6-','5---4---','3-2-3-5-','2-------','4---6-5-','3---2---','2-1-2---','1-------'],
    play:function(t,s,bar,ch,sd,p){
      var out=V.bus(p,1800),n=ch.notes;
      if(s===0){K.pad(t,n.slice(0,4),sd*16,.024,out,'sine',640);K.bass(t,ch.bass,.055,sd*14,out);}
      if(s===4||s===12)V.guitar(t,n[(bar+s/4)%n.length]+12,.03,sd*4,out);
      var mn=K.melNote(this,bar,s,sd);
      if(mn)V.softPiano(t,mn.m,.07,mn.dur,out);
      if(s===10&&bar%2===1)K.musicBox(t,n[2]+24,.016,out);
    }
  });
  var H,T,J,group=null,snow=null,snowU=null,dome=null,lanterns=[],cabin=null,windowGlow=null,cloudSprites=[];
  var active=false,saved=null,hiddenFlowers=[],hemi=null,sun=null,temp=null,fogColor=null;
  var TOP=.25,PATH=[[.55,4.35],[.15,3.15],[-.25,1.9],[.55,.7],[.1,-.6],[-.45,-1.75],[-.5,-2.3]];
  var CABIN={x:-.5,z:-3.05},PINES=[[-2.05,-3.85,1],[1.85,-4.0,.9],[4.1,-.55,.95],[-4.2,-.55,.9],[-3.0,3.25,.85],[3.25,2.95,.8]];
  // Island colours in snow (original V5 hex -> winter hex). Anything not listed keeps its colour.
  var WINTER={0xa9dcb2:0xeef3fb,0xe6b8a2:0xb7b9da,0xc6a0c0:0x9aa3cc,0xc4e8ff:0xa9c8ea,0xd8cde6:0xe7edf7,0x86c993:0xd3e0f1,0xd6c6e2:0xe3e9f5,
    0xffc4d8:0xf3f6fc,0xffd3e2:0xeaf0fa,0xf7b6cf:0xe2eaf7,0xa9846f:0x7f6b68,0xffeaf2:0xe9effc};
  var EMISSIVE={0x4a2034:0x26304e,0x403048:0x2a3358};
  function $(id){return document.getElementById(id);}
  function progress(){return J.progress.snow;}
  function hint(){var s=progress();return s.lit.length<R.LANTERNS?'❄ 雪夜里，沿小路的雪灯还在等你点亮':'❄ 雪灯都亮了 · 小屋的窗一直暖着';}
  function canPlay(){return active&&H.isStarted()&&!J.blocked()&&!document.hidden;}
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
    var steps=22,patch=new T.InstancedMesh(new T.CylinderGeometry(.3,.32,.04,10),lambert(0xfbfcff,{emissive:0x3a4466}),steps);patch.name='snow-path';
    for(i=0;i<steps;i++){var q=pathAt(i/(steps-1));dummy.position.set(q[0],TOP+.02,q[1]);dummy.rotation.set(0,i*.9,0);dummy.scale.set(1+(i%3)*.08,1,.82);dummy.updateMatrix();patch.setMatrixAt(i,dummy.matrix);}
    group.add(patch);
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
      var L=new T.Group();L.name='snow-lantern-'+i;L.position.set(x,TOP,z);group.add(L);
      mesh(base,snowWhite,L,0,.06,0);mesh(domeGeo,snowWhite,L,0,.12,0);
      var h=mesh(hole,holeMat.clone(),L,0,.2,.17);h.rotation.x=-.25;
      var e=glow(L,0xffb860,.5,.14,0,.2,.2);
      lanterns.push({g:L,hole:h,ember:e,lit:false});
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
    // A cool night wash over the existing sky (inside its 120 radius) and a few big painterly clouds.
    dome=new T.Mesh(new T.SphereGeometry(100,24,12),new T.MeshBasicMaterial({color:0x1b2858,transparent:true,opacity:.58,side:T.BackSide,depthWrite:false,fog:false}));
    dome.name='snow-sky-wash';dome.visible=false;H.scene.add(dome);
    var tex=paintCloud();
    [[-.9,9,1],[.5,11,1.25],[2.2,7,1.1],[3.6,10,.95],[5.0,8,1.15]].forEach(function(c){
      var s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,opacity:.7,depthWrite:false,fog:false,color:0xd6e0fb}));
      s.position.set(Math.cos(c[0])*48,c[1],Math.sin(c[0])*48-6);s.scale.set(34*c[2],17*c[2],1);s.visible=false;s.name='snow-cloud';H.scene.add(s);cloudSprites.push(s);});
  }
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
    H.flowers.forEach(function(f){var p=f.root.position;if(spots.some(function(s){return Math.hypot(p.x-s[0],p.z-s[1])<s[2];})){hiddenFlowers.push({root:f.root,was:f.root.visible});f.root.visible=false;}});
  }
  function render(){var hud=$('snowHud');if(!hud)return;hud.hidden=!active;$('snowCount').textContent=R.progressText(progress());}
  function buildUI(){
    var hud=document.createElement('div');hud.id='snowHud';hud.className='glass';hud.hidden=true;hud.setAttribute('role','status');
    hud.innerHTML='<strong>❄ 雪灯归林</strong><span id="snowCount"></span>';
    var top=$('topbar');if(top)top.insertBefore(hud,top.firstChild);else document.body.appendChild(hud);
  }
  function leave(){if(!active)return;tint(false);hideFlowers(false);if(group)group.visible=false;dome.visible=false;cloudSprites.forEach(function(s){s.visible=false;});}
  window.SnowChapter={
    init:function(hooks,bridge){H=hooks;T=hooks.THREE;J=bridge;temp=new T.Vector3();fogColor=new T.Color(0x56679a);buildUI();return this;},
    beforeLevel:function(n){if(active&&n!==6)leave();},
    onLevel:function(n){
      if(active&&n!==6)leave();
      var entering=!active&&n===6;active=n===6;
      if(entering){buildWorld();tint(true);group.visible=true;dome.visible=true;cloudSprites.forEach(function(s){s.visible=true;});hideFlowers(true);H.setNightTarget(.9);H.setDeepNight(0);}
      render();
    },
    update:function(dt,t){
      if(!active)return;
      H.setNightTarget(.9);H.setDeepNight(0);
      // The main loop recomputes the fog colour every frame before this runs; give it the snowy blue.
      if(H.scene.fog)H.scene.fog.color.copy(fogColor);
      snowU.uTime.value=t;
      var pr=Math.min(1.5,window.devicePixelRatio||1);snowU.uScale.value=innerHeight*pr/(2*Math.tan(H.camera.fov*Math.PI/360))*H.camera.zoom;
      if(windowGlow)windowGlow.material.opacity=.5+Math.sin(t*1.3)*.05;
      lanterns.forEach(function(l,i){l.ember.material.opacity=.12+Math.sin(t*1.7+i)*.03;});
    },
    tap:function(ray){if(!canPlay())return false;var now=performance.now();if(!this._last||now-this._last>2500){this._last=now;H.toast(hint(),2600);}return true;},
    cameraBusy:function(){return false;},
    isModalOpen:function(){return false;},
    hint:hint,
    // Read-only inspection for tests.
    debug:function(){return {active:active,built:!!group,visible:!!group&&group.visible,lanterns:lanterns.map(function(l){return {x:l.g.position.x,z:l.g.position.z};}),
      cabin:CABIN,pines:PINES.map(function(p){return {x:p[0],z:p[1],r:.62*p[2]};}),path:PATH.map(function(p,i){return pathAt(i/(PATH.length-1));}),tinted:saved?saved.length:0,hiddenFlowers:hiddenFlowers.length,snow:snow?snow.geometry.attributes.position.count:0};}
  };
})(window,document);
