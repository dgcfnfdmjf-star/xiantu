/* Chapter 5 grows inside the original island pond and shares its transform. */
(function(window,document){
  'use strict';
  var R=window.LotusRules,GA=window.GardenAudio,M=window.__music2;
  if(M){var original=M.tracks.filter(function(t){return t.id==='nightvoyage';})[0],score={};Object.keys(original).forEach(function(k){score[k]=original[k];});score.id='moonlotus';score.name='星灯夜曲';M.register(score);}
  var H,T,J,group,water,moon,flowers=[],ripples=[],stations=[],beacons=[],leafBoats=[],melodyBells=[],vessels=[],mirrorArm,mirrorTarget,mote,boat,blendCore,lanterns=[],links=[];
  var temp,active=false,reduced=false,selected=0,practice=null,finale=0,elapsed=0,bloomPause=0,pulse=0,lastFocus=null,drag=null,echo=null,notePulse=null,guideRay,guidePlane,guidePointer,layoutKey='',layoutPending=false,sceneZoom=null,noticeHomes=[],fitPoints=[],fitChunks=[],fitRects=null,flowerKey='',flowersMoved=false,carriedLanterns=[];
  var coords=[[-.468,.27],[-.468,-.27],[0,-.54],[.468,-.27],[.468,.27],[0,.54]],guide=[[-.8,-.45],[0,.35],[.8,-.45]];
  var WATER=.26,FLOWER_SCALE=.36,FLOWER_Y=.3212,MOON_Y=4.6,colors=[0xe9edff,0x91dfe7,0xffd79b];
  function $(id){return document.getElementById(id);}
  function progress(){return practice||J.progress.lotus;}
  function finished(){return R.current(progress())<0;}
  function modal(){return !!$('lotusEnding')&&!$('lotusEnding').hidden;}
  function canPlay(){return active&&H.isStarted()&&!J.blocked()&&!document.hidden&&!finale&&!bloomPause;}
  function hint(){return '循着六朵月莲，找回一条月光归途 · 不计时，走错也不会失去进度';}
  function sound(i){if(GA&&GA.isSfxOn())GA.melody([[0,2],[2,4],[4,7],[5,9],[7,9],[9,12]][i],.16,true);}
  function playNote(i){notePulse={index:i,time:.6};if(GA&&GA.isSfxOn())GA.melody([i*2],.14,true);}
  function persist(){if(!practice)J.changed();}
  function select(i){if(!canPlay())return;if(progress().light[i]<3&&i!==R.current(progress())){H.toast('先陪眼前这朵莲花走一小段，下一朵就会醒来。');return;}selected=i;pulse=1;sound(i);if(flowers[i]){flowers[i].pulse=1;ripples[i].time=1;}render();}
  function act(kind,value){
    if(!canPlay())return;
    if(kind==='note'&&selected===5&&value>=0&&value<3){echo=null;playNote(value);}
    var result=R.act(progress(),selected,kind,value);pulse=.7;
    if(result.changed){persist();render();}
    if(result.progress){if(kind!=='note')sound(selected);flowers[selected].pulse=1;ripples[selected].time=1;}
    if(result.bloomed){drag=null;
      H.toast('「'+R.blooms[selected].name+'」绽开了 · '+(practice?'这段光又找到了归途':'月莲已收入手账'),2400);
      if(result.finished){if(!practice)J.complete(5);persist();startFinale();}
      else {if(selected===3&&!reduced)bloomPause=.9;else selected=R.current(progress());render();}
    }else if(result.hint)H.toast('不用重来。'+taskHint(),1800);
  }
  function taskHint(){var s=progress(),n=s.light[selected];if(selected===0)return '花心在等'+['月白','潮蓝','暖金'][R.dew[n]]+'色的月露。';if(selected===1)return s.mirror===R.mirror[n]?'已对准 '+(s.mirror+1)+' 号 · 可以送入花心':'月镜 '+(s.mirror+1)+' 号 → 目标 '+(R.mirror[n]+1)+' 号 · 轻转月镜';if(selected===2)return '下一站是 '+(n+1)+' 号路标。';if(selected===3)return ['先收一束暖光。','再收一束冷光。','现在让两束光相遇。'][n];if(selected===4)return '让三片叶舟的光纹都朝上 ↑。';return '下一枚音是 '+(R.song[n]+1)+' 号。';}
  function startFinale(){drag=null;echo=null;elapsed=0;finale=reduced?0:7;render();if(reduced)showEnding();}
  function showEnding(){finale=0;elapsed=7;render();lastFocus=document.activeElement;$('lotusEnding').hidden=false;$('lotusStay').focus();}
  function closeEnding(){$('lotusEnding').hidden=true;if(lastFocus&&document.contains(lastFocus)&&lastFocus.getClientRects().length)lastFocus.focus();}
  function replay(){if(!canPlay()||!finished())return;practice=R.normalize(null);selected=0;elapsed=0;render();H.toast('再游一程 · 原收藏与成长保留，这次只为享受旅途。',2600);}
  function listen(){if(!canPlay()||selected!==5)return;echo={index:0,wait:0};}
  // Some old flowers are pushed toward the pond by the optional wind-chime
  // ornament. Separate their display roots on this chapter only; saves stay intact.
  // Positions only change when a flower is added, the chime toggles or the
  // shared syncFlowers() puts them back, so the per-frame check is just a key.
  function clearPondFlowers(){
    var c=window.GardenClip.chime,key=H.flowers.length+'/'+c.on+'/'+c.x+'/'+c.z;if(key===flowerKey&&!flowersMoved)return;flowerKey=key;flowersMoved=false;
    H.flowers.forEach(function(f){var p=f.root.position;
      for(var pass=0;pass<3;pass++){
        var dx=p.x-H.POND.x,dz=p.z-H.POND.z,d=Math.hypot(dx,dz);
        if(d<1.35){p.x=H.POND.x+dx/d*1.35;p.z=H.POND.z+dz/d*1.35;}
        var c=window.GardenClip.chime;dx=p.x-c.x;dz=p.z-c.z;d=Math.hypot(dx,dz);
        if(c.on&&d<.7){p.x=c.x+(d?dx/d:1)*.7;p.z=c.z+(d?dz/d:0)*.7;}
      }
    });
  }
  function layout(){layoutPending=true;fitRects=null;}
  function placeNotices(inBay){
    if(inBay&&!noticeHomes.length){['toast','starSaveWarning'].forEach(function(id){var el=$(id);if(!el)return;noticeHomes.push({el:el,parent:el.parentNode,next:el.nextSibling});$('lotusDock').insertBefore(el,$('lotusActions'));});}
    if(!inBay){noticeHomes.forEach(function(n){n.parent.insertBefore(n.el,n.next&&n.next.parentNode===n.parent?n.next:null);});noticeHomes=[];}
  }
  // Capture the existing island, including its grass, rock underside, tree and
  // ornaments. Hidden chapter props do not affect the shared island's framing.
  // fitPoints holds the extreme vertex along each of FIT_DIRS directions (a small
  // convex sample). fitChunks keep every vertex in blocks of FIT_CHUNK with an
  // island-local box; fitLayout() projects a block only when its box reaches past
  // the sample's frame, so the result equals projecting all vertices.
  var FIT_DIRS=48,FIT_CHUNK=128;
  function collectFitPoints(){
    fitPoints=[];fitChunks=[];H.island.updateWorldMatrix(true,true);var inv=new T.Matrix4().copy(H.island.matrixWorld).invert(),m=new T.Matrix4(),v=new T.Vector3(),best=[],score=[],chunk=null,d,i,k;
    var dirs=[];for(k=0;k<FIT_DIRS;k++){var y=1-2*(k+.5)/FIT_DIRS,r=Math.sqrt(1-y*y),a=k*2.399963229728653;dirs.push(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));best.push(null);score.push(-Infinity);}
    H.island.traverse(function(o){
      if(!o.isMesh||!o.geometry||o.isInstancedMesh)return;
      for(var n=o;n&&n!==H.island;n=n.parent)if(!n.visible)return;
      var a=o.geometry.attributes.position;if(!a)return;m.multiplyMatrices(inv,o.matrixWorld);
      for(i=0;i<a.count;i++){
        v.fromBufferAttribute(a,i).applyMatrix4(m);for(k=0;k<FIT_DIRS;k++){d=dirs[k].dot(v);if(d>score[k]){score[k]=d;best[k]=v.clone();}}
        if(i%FIT_CHUNK===0){chunk={box:new T.Box3(),xyz:new Float32Array(Math.min(FIT_CHUNK,a.count-i)*3),corners:[]};fitChunks.push(chunk);}
        chunk.box.expandByPoint(v);v.toArray(chunk.xyz,i%FIT_CHUNK*3);
      }
    });
    fitChunks.forEach(function(c){for(k=0;k<8;k++)c.corners.push(new T.Vector3(k&1?c.box.max.x:c.box.min.x,k&2?c.box.max.y:c.box.min.y,k&4?c.box.max.z:c.box.min.z));});
    best.forEach(function(p){if(p&&!fitPoints.some(function(q){return q.equals(p);}))fitPoints.push(p);});
    // Reserve the whole moon and its finale pulse, even when the camera turns.
    [-.85,.85].forEach(function(x){[-.85,.85].forEach(function(y){[-.85,.85].forEach(function(z){fitPoints.push(new T.Vector3(x,MOON_Y+y,-.5+z));});});});
  }
  function fitLayout(){
    layoutPending=false;
    if(!active||!group)return;var w=innerWidth,h=innerHeight;
    // Panel rects are read once per layout change (resize, render, panel resize), not every frame.
    if(!fitRects)fitRects={dock:$('lotusDock').getBoundingClientRect(),hud:$('lotusHud').getBoundingClientRect(),toggles:$('toggles').getBoundingClientRect(),top:w>=900?12:$('topbar').getBoundingClientRect().bottom+10};
    var dock=fitRects.dock,hud=fitRects.hud,toggles=fitRects.toggles,top=fitRects.top;
    var left=w>=900?hud.right+12:12,right=h<480?dock.left-12:w>=900?toggles.left-12:w-12,bottom=h<480?h-12:dock.top-10,camera=H.camera;
    var key=[w,h,dock.left,dock.top,top,camera.position.x.toFixed(2),camera.position.y.toFixed(2),camera.position.z.toFixed(2)].join('/');if(key===layoutKey)return;layoutKey=key;
    if(sceneZoom===null)sceneZoom=camera.zoom;camera.clearViewOffset();camera.zoom=sceneZoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    var lo={x:Infinity,y:Infinity},hi={x:-Infinity,y:-Infinity},v=new T.Vector3();
    // Island-local bounds ignore the tiny bob, keeping the initial/rotated scale stable.
    function add(p){v.copy(p).project(camera);var px=(v.x+1)*w/2,py=(1-v.y)*h/2;lo.x=Math.min(lo.x,px);lo.y=Math.min(lo.y,py);hi.x=Math.max(hi.x,px);hi.y=Math.max(hi.y,py);}
    fitPoints.forEach(add);
    // A block whose box corners all project inside the frame cannot widen it (boxes in front of the camera stay convex).
    fitChunks.forEach(function(c){
      var inside=c.corners.every(function(p){v.copy(p).project(camera);var px=(v.x+1)*w/2,py=(1-v.y)*h/2;return v.z>-1&&v.z<1&&px>=lo.x&&px<=hi.x&&py>=lo.y&&py<=hi.y;});
      if(!inside)for(var i=0;i<c.xyz.length;i+=3)add(temp.fromArray(c.xyz,i));
    });
    var scale=Math.max(.1,Math.min(1,(right-left)/(hi.x-lo.x),(bottom-top)/(hi.y-lo.y))*.94);camera.zoom=sceneZoom*scale;
    var cx=w/2+((lo.x+hi.x)/2-w/2)*scale,cy=h/2+((lo.y+hi.y)/2-h/2)*scale;
    camera.setViewOffset(w,h,cx-(left+right)/2,cy-(top+bottom)/2,w,h);
  }
  function restore(){carriedLanterns.forEach(function(a){a.g.visible=a.visible;});carriedLanterns=[];H.camera.clearViewOffset();if(sceneZoom!==null){H.camera.zoom=sceneZoom;H.camera.updateProjectionMatrix();sceneZoom=null;}layoutKey='';}
  function mesh(geometry,material,parent,x,y,z){var m=new T.Mesh(geometry,material);m.position.set(x||0,y||0,z||0);parent.add(m);return m;}
  function glow(parent,color,size,x,y,z){var s=new T.Sprite(new T.SpriteMaterial({map:H.glowTex,color:color,transparent:true,opacity:.3,depthWrite:false,depthTest:true,blending:T.AdditiveBlending}));s.position.set(x||0,y||0,z||0);s.scale.set(size,size,1);parent.add(s);return s;}
  function buildWorld(){
    if(group)return;
    group=new T.Group();group.name='lotus-pond-garden';group.position.set(H.POND.x,0,H.POND.z);H.island.add(group);
    var gold=new T.MeshBasicMaterial({color:0xffe7ad}),jade=new T.MeshLambertMaterial({color:0x64a7a1});
    // Reuse the original pond mesh and shoreline. No replacement water or island.
    water=H.island.children.filter(function(o){return o.isMesh&&o.geometry.type==='CircleGeometry'&&Math.abs(o.position.x-H.POND.x)<.001&&Math.abs(o.position.z-H.POND.z)<.001;})[0];
    WATER=water.position.y;
    var petalGeo=new T.SphereGeometry(1,12,8),leafGeo=new T.CylinderGeometry(.5,.5,.035,32),seedGeo=new T.SphereGeometry(.1,12,8),ringGeo=new T.TorusGeometry(.58,.012,4,32);
    R.blooms.forEach(function(b,i){
      var g=new T.Group();g.position.set(coords[i][0],FLOWER_Y,coords[i][1]);g.scale.setScalar(FLOWER_SCALE);group.add(g);
      mesh(leafGeo,jade,g,0,-.14,0);
      mesh(new T.CylinderGeometry(.045,.06,.46,8),jade,g,0,.08,0);
      var petals=[],mat=new T.MeshLambertMaterial({color:b.color,emissive:b.color,emissiveIntensity:.15});
      for(var j=0;j<8;j++){var pivot=new T.Group();pivot.rotation.y=j*Math.PI/4;g.add(pivot);var hinge=new T.Group();hinge.position.y=.16;pivot.add(hinge);var p=mesh(petalGeo,mat,hinge,0,0,.3);p.scale.set(.075,.065,.235);petals.push(hinge);}
      var seed=mesh(seedGeo,new T.MeshBasicMaterial({color:0xffe7ad}),g,0,.31,0),halo=glow(g,b.color,.75,0,.62,0);flowers.push({g:g,petals:petals,seed:seed,glow:halo,pulse:0});
      // Small ripples clear the original shore stones and neighbouring leaf pads.
      var ring=mesh(ringGeo,new T.MeshBasicMaterial({color:b.color,transparent:true,opacity:0,depthWrite:false}),group,coords[i][0],WATER+.018,coords[i][1]);ring.rotation.x=-Math.PI/2;ring.scale.set(.32,.32,1);ripples.push({mesh:ring,time:0});
      var points=[];for(var k=0;k<=36;k++){var a=(i+k/36)*Math.PI/3+Math.PI/6;points.push(new T.Vector3(Math.sin(a)*.27,WATER+.014,Math.cos(a)*.27));}
      var line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:b.color,transparent:true,opacity:.08}));group.add(line);links.push(line);
    });
    moon=new T.Group();moon.position.set(-H.POND.x,MOON_Y,-.5-H.POND.z);group.add(moon);mesh(new T.TorusGeometry(.58,.045,8,56,Math.PI*1.7),gold,moon).rotation.z=.25;glow(moon,0xe0eaff,1.5);
    for(var i=0;i<6;i++){var station=new T.Group();station.position.y=i===4?.2128:.65;station.scale.setScalar(i===4?.24:.5);group.add(station);stations.push(station);}
    // The active goal hovers above the pond; leaf boats use its clear inner water.
    for(i=0;i<3;i++){var bead=mesh(new T.SphereGeometry(.12,12,8),new T.MeshBasicMaterial({color:colors[i]}),stations[0],(i-1)*.65,.64,0);glow(bead,colors[i],.5);}
    var dial=mesh(new T.TorusGeometry(.85,.025,6,48),new T.MeshBasicMaterial({color:0x90c4d2}),stations[1],0,.36,0);dial.rotation.x=Math.PI/2;
    mirrorArm=new T.Group();mirrorArm.position.y=.43;stations[1].add(mirrorArm);var ray=mesh(new T.CylinderGeometry(.028,.028,.74,5),gold,mirrorArm,0,0,.37);ray.rotation.x=Math.PI/2;
    mirrorTarget=mesh(new T.SphereGeometry(.12,10,6),gold,stations[1]);
    for(i=0;i<6;i++){var a=i*Math.PI/3,points=[new T.Vector3(Math.sin(a)*.91,.36,Math.cos(a)*.91),new T.Vector3(Math.sin(a)*1.02,.36,Math.cos(a)*1.02)];stations[1].add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xd2e7ef})));}
    for(i=0;i<3;i++){var beacon=new T.Group();beacon.position.set(guide[i][0],1.15,guide[i][1]);stations[2].add(beacon);var marker=mesh(new T.TorusGeometry(.16,.025,6,32),new T.MeshBasicMaterial({color:0xf4b8d1}),beacon,0,-.47,0);marker.rotation.x=Math.PI/2;glow(beacon,0xf4b8d1,.3);beacons.push(beacon);}
    mote=mesh(new T.SphereGeometry(.08,12,8),gold,stations[2],-.95,1.15,.25);glow(mote,0xffe9c4,.5);
    for(i=0;i<2;i++){var vessel=mesh(new T.SphereGeometry(.14,12,8),new T.MeshBasicMaterial({color:i?0x91dfe7:0xffd79b}),stations[3],i?.55:-.55,.55,0);glow(vessel,i?0x91dfe7:0xffd79b,.65);vessels.push(vessel);}
    blendCore=mesh(seedGeo,gold,stations[3],0,.55,0);
    for(i=0;i<3;i++){var leaf=new T.Group();leaf.position.set((i-1)*.8,.25,0);stations[4].add(leaf);var board=mesh(new T.CylinderGeometry(.25,.25,.04,20),jade,leaf);var mark=mesh(new T.ConeGeometry(.085,.24,3),gold,leaf,0,.16,0);mark.rotation.x=-Math.PI/2;leafBoats.push(leaf);}
    for(i=0;i<3;i++){var bell=mesh(new T.CylinderGeometry(.09,.15,.3,10),new T.MeshLambertMaterial({color:colors[i]}),stations[5],(i-1)*.65,.55,0);melodyBells.push(bell);}
    // The small finale boat sails the real pond's open centre, inside the six lotuses.
    boat=new T.Group();boat.scale.setScalar(.45);group.add(boat);var hull=mesh(new T.ConeGeometry(.13,.4,3),gold,boat);hull.rotation.x=Math.PI/2;glow(boat,0xffe2ab,.6);boat.visible=false;
    for(i=0;i<6;i++){var lantern=mesh(new T.SphereGeometry(.055,8,6),gold,group,coords[i][0],.75,coords[i][1]);glow(lantern,R.blooms[i].color,.2);lantern.visible=false;lanterns.push(lantern);}
    render();pose(0,0);collectFitPoints();
  }
  function render(){
    if(!J)return;var focusId=document.activeElement&&document.activeElement.id,wasAction=$('lotusActions')&&$('lotusActions').contains(document.activeElement);var s=progress(),done=finished(),n=s.light[selected],b=R.blooms[selected],resting=n===3&&!done;
    $('lotusCount').textContent=practice?'月汐莲湾 · 再游一程':done?'月汐莲湾 · 月光归航':'月汐莲湾 · '+s.found.length+' / 6 朵莲花';
    $('lotusHint').textContent=done?'六段光路已经连成一条归途。':(selected+1)+' · '+b.goal+' · '+n+' / 3';
    $('lotusTaskTitle').textContent=done?'把月光送回远方':b.name+' · '+(resting?'已绽放':b.goal);
    $('lotusHelp').textContent=done?'可以重看归航，也可以再游一程，体验六种小小的相遇。':resting?b.note:b.help;
    $('lotusPrompt').textContent=finale?'六朵莲花的光，正在陪一叶小舟归航……':bloomPause?'暖光与冷光，正在一起点亮这朵莲花。':done?'今晚的小岛，也在温柔地等你。':resting?'这朵莲花的光已经留下。下一朵还在等你。':taskHint();
    $('lotusActions').innerHTML='';
    function button(label,kind,value,id){var el=document.createElement('button');el.textContent=label;if(id)el.id=id;el.onclick=function(){act(kind,value);};$('lotusActions').appendChild(el);return el;}
    if(resting&&!finale&&!bloomPause){var resume=document.createElement('button');resume.id='lotusContinue';resume.textContent='继续光路 →';resume.onclick=function(){select(R.current(progress()));};$('lotusActions').appendChild(resume);}
    if(!done&&!finale&&!resting){
      if(selected===0)['月白','潮蓝','暖金'].forEach(function(v,i){button(v,'color',i,'lotusColor'+i).style.color='#'+colors[i].toString(16);});
      if(selected===1){button('↶ 左转','turn',-1,'lotusLeft');button('☾ 送入花心','shine',0,'lotusShine');button('右转 ↷','turn',1,'lotusRight');}
      if(selected===2)for(var j=0;j<3;j++){var el=button('引到 '+(j+1)+' 号路标','guide',j,'lotusGuide'+j);el.disabled=j!==n;}
      if(selected===3){button('收集暖光','blend','warm','lotusWarm').disabled=n!==0;button('收集冷光','blend','cool','lotusCool').disabled=n!==1;button('让光相遇','blend','join','lotusJoin').disabled=n!==2;}
      if(selected===4)for(j=0;j<3;j++){el=button('叶舟 '+(j+1)+' '+['↑','→','↓','←'][s.leaves[j]],'leaf',j,'lotusLeaf'+j);el.disabled=s.leaves[j]===0;}
      if(selected===5){for(j=0;j<3;j++)button('♪ '+(j+1),'note',j,'lotusNote'+j);var listenButton=document.createElement('button');listenButton.textContent='听一遍 · 1 → 3 → 2';listenButton.id='lotusListen';listenButton.onclick=listen;$('lotusActions').appendChild(listenButton);}
    }
    $('lotusReplay').hidden=!done||!!finale;$('lotusFinale').hidden=!done||!!finale;$('lotusSkip').hidden=!finale;
    R.blooms.forEach(function(b,i){var el=$('lotusKey'+i);el.textContent=(i+1)+' '+b.name+(s.light[i]===3?' ✧':'');el.classList.toggle('bloomed',s.light[i]===3);el.classList.toggle('current',i===selected);el.setAttribute('aria-pressed',String(i===selected));el.setAttribute('aria-label',b.name+'，'+(s.light[i]===3?'已绽放':i===R.current(s)?'正在寻找光路':'等待前一朵莲花'));});
    if(wasAction){var nextFocus=$(focusId);if(!nextFocus||nextFocus.disabled)nextFocus=$('lotusActions').querySelector('button:not(:disabled)');if(nextFocus)nextFocus.focus();}
    if(stations.length)stations.forEach(function(g,i){g.visible=!done&&!finale&&(!resting||!!bloomPause)&&selected===i;});layout();
  }
  function pose(dt,t){
    var s=progress();flowers.forEach(function(f,i){var v=s.light[i]/3;f.pulse=Math.max(0,f.pulse-dt);f.g.position.y=FLOWER_Y+(reduced?0:Math.sin(t*.6+i)*.002);f.glow.material.opacity=.12+v*.18+f.pulse*.22;f.open=dt===0?v:(f.open||0)+(v-(f.open||0))*Math.min(1,dt*3);f.petals.forEach(function(p){p.rotation.x=-.9*(1-f.open);});links[i].material.opacity=s.light[i]===3?.8:.08;});
    if(flowers[0])flowers[0].seed.material.color.setHex(selected===0&&s.light[0]<3?colors[R.dew[s.light[0]]]:0xffe7ad);
    if(stations[0])stations[0].children.forEach(function(bead,i){bead.scale.setScalar(selected===0&&s.light[0]<3&&i===R.dew[s.light[0]]?1.15:1);});
    ripples.forEach(function(r){r.time=Math.max(0,r.time-dt*.6);var scale=reduced?1:1+(1-r.time)*.1;r.mesh.scale.set(scale*.32,scale*.32,1);r.mesh.material.opacity=r.time*.45;});
    if(mirrorArm){mirrorArm.rotation.y=s.mirror*Math.PI/3;var a=R.mirror[Math.min(s.light[1],2)]*Math.PI/3;mirrorTarget.position.set(Math.sin(a)*.85,.43,Math.cos(a)*.85);}
    leafBoats.forEach(function(g,i){g.rotation.y=-s.leaves[i]*Math.PI/2;});
    beacons.forEach(function(b,i){var current=selected===2&&i===s.light[2];b.children[0].material.color.setHex(current?0xffe7ad:0xf4b8d1);b.children[1].material.opacity=current?.65:.16;});
    if(mote&&!drag){var k=Math.min(s.light[2],2);mote.position.set(s.light[2]?guide[Math.max(0,k-1)][0]:-.95,1.15,s.light[2]?guide[Math.max(0,k-1)][1]:.25);}
    if(blendCore)blendCore.visible=s.light[3]>=2;
    lanterns.forEach(function(l,i){l.visible=!!finale;l.position.y=.75+Math.min(1,elapsed/7)*(1.35+i*.05);});
    var blend=bloomPause?1-bloomPause/.9:0;
    vessels.forEach(function(v,i){v.material.color.setHex(s.light[3]>i?0xffedbc:i?0x91dfe7:0xffd79b);v.position.x=(i?1:-1)*(.55-blend*.37);v.scale.setScalar(bloomPause?1.2-blend*1.1:s.light[3]>i?1.2:1);});
    if(blendCore)blendCore.scale.setScalar(1+Math.sin(blend*Math.PI)*.2);
    if(notePulse){notePulse.time=Math.max(0,notePulse.time-dt);if(!notePulse.time)notePulse=null;}
    melodyBells.forEach(function(b,i){b.scale.y=notePulse&&notePulse.index===i?1+.18*notePulse.time/.6:1;});
    boat.visible=!!finale||finished();if(boat.visible){var u=finale?elapsed/7:1,a=Math.PI/6+Math.PI*2*u;boat.position.set(Math.sin(a)*.18,WATER+.09,Math.cos(a)*.18);boat.rotation.y=a+Math.PI/2;}
    H.island.getWorldQuaternion(moon.quaternion).invert().multiply(H.camera.quaternion);moon.scale.setScalar(finale?1+Math.sin(Math.min(1,elapsed/7)*Math.PI)*.12:1);
  }
  function screen(v,parent){temp.copy(v);(parent||group).localToWorld(temp);temp.project(H.camera);return {x:(temp.x+1)*innerWidth/2,y:(1-temp.y)*innerHeight/2,z:temp.z};}
  function guideAt(x,y){
    var n=progress().light[2];if(n>=3||selected!==2)return;
    var points=guide.map(function(p){return screen(new T.Vector3(p[0],1.15,p[1]),stations[2]);}),target=points[n],separation=Infinity;
    points.forEach(function(p,i){if(i!==n)separation=Math.min(separation,Math.hypot(p.x-target.x,p.y-target.y));});
    // Keep adjacent hit regions separate, even on a narrow phone. Missing never resets a route.
    if(Math.hypot(x-target.x,y-target.y)<Math.max(6,Math.min(18,separation*.35)))act('guide',n);
  }
  function bindTrail(){
    var canvas=document.querySelector('canvas:not(#bfTrail)'),downs={},trailGesture=false;if(!canvas)return;
    canvas.addEventListener('pointerdown',function(e){downs[e.pointerId]=true;if(trailGesture){drag=null;e.stopImmediatePropagation();return;}if(Object.keys(downs).length!==1){drag=null;return;}if(!canPlay()||selected!==2||finished())return;var p=screen(mote.position,stations[2]);if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>48)return;drag=e.pointerId;trailGesture=true;e.stopImmediatePropagation();if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);},true);
    canvas.addEventListener('pointermove',function(e){if(!trailGesture)return;e.stopImmediatePropagation();if(drag!==e.pointerId||!canPlay())return;var n=progress().light[2];if(n>=3){drag=null;return;}guidePointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);guideRay.setFromCamera(guidePointer,H.camera);stations[2].updateWorldMatrix(true,false);guidePlane.set(new T.Vector3(0,1,0),-1.15).applyMatrix4(stations[2].matrixWorld);if(guideRay.ray.intersectPlane(guidePlane,temp)){stations[2].worldToLocal(temp);var radius=Math.hypot(temp.x,temp.z),scale=radius>1.25?1.25/radius:1;mote.position.set(temp.x*scale,1.15,temp.z*scale);}
      guideAt(e.clientX,e.clientY);e.stopImmediatePropagation();},true);
    // The base camera never saw the captured first finger. Keep the whole canceled
    // gesture here, or its second finger would become a fresh, reward-bearing tap.
    function end(e){delete downs[e.pointerId];if(!trailGesture)return;if(drag===e.pointerId){drag=null;if(e.type==='pointerup'&&canPlay())guideAt(e.clientX,e.clientY);}if(!Object.keys(downs).length)trailGesture=false;e.stopImmediatePropagation();}
    canvas.addEventListener('pointerup',end,true);canvas.addEventListener('pointercancel',end,true);canvas.addEventListener('lostpointercapture',function(e){delete downs[e.pointerId];if(drag===e.pointerId)drag=null;if(!Object.keys(downs).length)trailGesture=false;},true);
    document.addEventListener('visibilitychange',function(){drag=null;downs={};trailGesture=false;echo=null;notePulse=null;});
  }
  function buildUI(){
    var hud=document.createElement('div');hud.id='lotusHud';hud.hidden=true;hud.className='glass';hud.innerHTML='<strong id="lotusCount"></strong><p id="lotusHint"></p><small>没有限时 · 找到的光不会失去</small>';$('topbar').insertBefore(hud,$('topbar').firstChild);
    var dock=document.createElement('div');dock.id='lotusDock';dock.hidden=true;dock.className='glass';dock.innerHTML='<div id="lotusKeys" aria-label="月莲光路"></div><strong id="lotusTaskTitle"></strong><p id="lotusHelp"></p><p id="lotusPrompt" role="status" aria-live="polite"></p><div id="lotusActions"></div><button id="lotusReplay">再游一程</button><button id="lotusFinale">重看月汐归航</button><button id="lotusSkip" hidden>跳过归航演出</button>';document.body.appendChild(dock);
    R.blooms.forEach(function(b,i){var el=document.createElement('button');el.id='lotusKey'+i;el.style.setProperty('--lotus','#'+b.color.toString(16));el.onclick=function(){select(i);};$('lotusKeys').appendChild(el);});$('lotusReplay').onclick=replay;$('lotusFinale').onclick=function(){if(canPlay())startFinale();};$('lotusSkip').onclick=showEnding;
    var noticeObserver=new MutationObserver(function(){dock.classList.toggle('has-notice',$('toast').classList.contains('show'));layout();});noticeObserver.observe($('toast'),{attributes:true,childList:true,subtree:true});if($('starSaveWarning'))noticeObserver.observe($('starSaveWarning'),{attributes:true,childList:true,subtree:true});
    var end=document.createElement('div');end.id='lotusEnding';end.hidden=true;end.setAttribute('role','dialog');end.setAttribute('aria-modal','true');end.setAttribute('aria-labelledby','lotusEndTitle');end.innerHTML='<div class="jr-card"><div class="jr-eyebrow">CHAPTER 05 · COMPLETE</div><h2 id="lotusEndTitle">月光连成了归途</h2><p>月露、倒影、光路与晚安，<br>终于陪一叶小舟走过了整片莲湾。<br>你让每一束光，都找到了停靠的地方。</p><p class="jr-note">收藏与首次通关的成长只领取一次</p><button class="jr-action" id="lotusStay">留下来，听听月色</button><button class="jr-action" id="lotusJournal">翻开成长手账</button></div>';document.body.appendChild(end);$('lotusStay').onclick=closeEnding;$('lotusJournal').onclick=function(){closeEnding();J.open('growth');};
    var nextButton=document.createElement('button');nextButton.id='lotusFromChime';nextButton.className='jr-action';nextButton.textContent='第五关：月汐莲湾';nextButton.onclick=function(){$('chimeStay').click();J.go(5);};$('chimeEnding').querySelector('.jr-card').appendChild(nextButton);
    document.addEventListener('keydown',function(e){if(end.hidden)return;if(e.key==='Escape'){e.preventDefault();closeEnding();}if(e.key==='Tab'){var first=$('lotusStay'),last=$('lotusJournal');if(e.shiftKey&&(document.activeElement===first||!end.contains(document.activeElement))){last.focus();e.preventDefault();}else if(!e.shiftKey&&(document.activeElement===last||!end.contains(document.activeElement))){first.focus();e.preventDefault();}}});render();bindTrail();
  }
  window.LotusChapter={
    init:function(hooks,bridge){H=hooks;T=hooks.THREE;J=bridge;temp=new T.Vector3();guideRay=new T.Raycaster();guidePlane=new T.Plane(new T.Vector3(0,1,0),-1.15);guidePointer=new T.Vector2();reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;buildUI();window.addEventListener('resize',layout);
      // A toast or prompt can resize the panels without a render() or resize event.
      if(window.ResizeObserver){var ro=new ResizeObserver(layout);['lotusDock','lotusHud','toggles','topbar'].forEach(function(id){if($(id))ro.observe($(id));});}
      var clip=window.GardenClip,sync=clip.syncFlowers;clip.syncFlowers=function(){flowersMoved=true;return sync.apply(clip,arguments);};return this;},
    beforeLevel:function(n){if(active&&n!==5){restore();placeNotices(false);}},
    onLevel:function(n){var leaving=active&&n!==5;active=n===5;drag=null;echo=null;notePulse=null;bloomPause=0;finale=0;elapsed=0;$('lotusEnding').hidden=true;$('lotusHud').hidden=$('lotusDock').hidden=!active;placeNotices(active);if(leaving){restore();practice=null;}if(active){buildWorld();group.visible=true;flowerKey='';clearPondFlowers();collectFitPoints();layout();selected=Math.max(0,R.current(progress()));H.setNightTarget(.9);H.setDeepNight(0);pose(0,0);}if(group)group.visible=active;render();},
    update:function(dt,t){if(!active)return;clearPondFlowers();H.setNightTarget(.9);H.setDeepNight(0);fitLayout();if(document.hidden||J.blocked()){drag=null;return;}if(bloomPause){bloomPause=Math.max(0,bloomPause-dt);if(!bloomPause){selected=R.current(progress());render();}}if(echo){echo.wait-=dt;if(echo.wait<=0){if(echo.index<3){playNote(R.song[echo.index]);$('lotusPrompt').textContent='听见 '+(R.song[echo.index]+1)+' 号';echo.index++;echo.wait=.8;}else echo=null;}}if(finale){elapsed+=dt;finale=Math.max(0,7-elapsed);if(!finale)showEnding();}pose(dt,t);},
    tap:function(ray){if(!canPlay())return false;temp.copy(ray.ray.origin).addScaledVector(ray.ray.direction,10).project(H.camera);var x=(temp.x+1)*innerWidth/2,y=(1-temp.y)*innerHeight/2,best=-1,dist=40;
      function nearest(list){var index=-1,range=32;list.forEach(function(o,i){if(!o.visible)return;o.getWorldPosition(temp);temp.project(H.camera);var d=Math.hypot((temp.x+1)*innerWidth/2-x,(1-temp.y)*innerHeight/2-y);if(temp.z>=-1&&temp.z<=1&&d<range){index=i;range=d;}});return index;}
      if(!finished()&&progress().light[selected]<3){
        var j=-1;
        if(selected===0){j=nearest(stations[0].children);if(j>=0){act('color',j);return true;}}
        if(selected===1){j=nearest([mirrorArm,mirrorTarget]);if(j>=0){act(j?'shine':'turn',1);return true;}}
        if(selected===2){j=nearest(beacons);if(j>=0){act('guide',j);return true;}}
        if(selected===3){j=nearest(vessels.concat([blendCore]));if(j>=0){act('blend',['warm','cool','join'][j]);return true;}}
        if(selected===4){j=nearest(leafBoats);if(j>=0){act('leaf',j);return true;}}
        if(selected===5){j=nearest(melodyBells);if(j>=0){act('note',j);return true;}}
      }
      flowers.forEach(function(f,i){f.seed.getWorldPosition(temp);temp.project(H.camera);var d=Math.hypot((temp.x+1)*innerWidth/2-x,(1-temp.y)*innerHeight/2-y);if(temp.z>=-1&&temp.z<=1&&d<dist){best=i;dist=d;}});if(best>=0){select(best);return true;}return false;},
    // Prior chapters' temporary lanterns keep their lifetime, but do not cross
    // the pond's new actors. Permanent island scenery is never hidden.
    carryLantern:function(l){if(!active)return;if(!carriedLanterns.some(function(a){return a.g===l.g;}))carriedLanterns.push({g:l.g,visible:l.g.visible});l.g.visible=false;},
    cameraBusy:function(){return active;},isModalOpen:modal,hint:hint
  };
})(window,document);
