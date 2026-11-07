// Real Three.js geometry and screenshots; temporary response instrumentation only.
async root=>{
 const b=root.context().browser();for(const c of b.contexts())if(c!==root.context())await c.close();await root.goto('about:blank');
 const assert=(v,m)=>{if(!v)throw Error(m)},c=await b.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1')throw Error('External request');if(r.request().resourceType()!=='document')return r.continue();const response=await r.fetch();let body=await response.text();
  body=body.replace('render();pose(0,0);',`window.__bay={H,group,water,moon,flowers,ripples,stations,beacons,mote,boat,lanterns,vessels,mirrorArm,mirrorTarget,leafBoats,melodyBells,pose,render,select,progress,clearPondFlowers,
   sample:function(stage,index,t,angle,ending){var s=progress();s.light=[stage,stage,stage,stage,stage,stage];s.found=stage===3?LotusRules.blooms.map(x=>x.id):[];s.leaves=[stage>0?0:1,stage>1?0:3,stage>2?0:2];s.mirror=angle;selected=index;bloomPause=0;finale=ending?7-t:0;elapsed=ending?t:0;flowers.forEach(f=>f.pulse=1);ripples.forEach(r=>r.time=.01);render();pose(0,t);},
   blendFrame:function(u){selected=3;bloomPause=.9*(1-u);progress().light[3]=3;render();pose(0,0);},
   draw:function(){window.__renderer.render(H.scene,H.camera);}};render();pose(0,0);`);
  // Keep normal animation for the initial profile. The audit then pauses scheduling and poses real frames.
  body=body.replace('  renderer.setPixelRatio(DPR);',`  window.__renderer=renderer;window.__frames=[];window.__drawTimes=[];var renderBase=renderer.render;renderer.render=function(){var now=performance.now();__frames.push(now);var value=renderBase.apply(this,arguments);__drawTimes.push(performance.now()-now);return value;};\n  renderer.setPixelRatio(DPR);`);
  body=body.replace('  var cam = { th:', '  var cam = window.__cam = { th:');await r.fulfill({response,body});});
 await p.addInitScript(()=>{localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({level:5,total:20,ended:true}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2,3],lamps:[true,true,true],chimes:{round:3}}));localStorage.setItem('healingGarden.v3',JSON.stringify({flowers:[{x:0,z:0,id:'daisy'},{x:-2.5,z:-1.7,id:'rose'},{x:1.9,z:1.1,id:'mint'},{x:3.2219,z:-2.0375,id:'moonorchid'}]}));});
 await p.goto('http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/');await p.locator('#start').click();await p.waitForTimeout(2200);
 const profile=await p.evaluate(()=>{const median=a=>{a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)]||0},a=__frames.slice(-60),gaps=a.slice(1).map((t,i)=>t-a[i]);return{samples:gaps.length,frameMedianMs:median(gaps),drawMedianMs:median(__drawTimes.slice(-60)),geometries:__renderer.info.memory.geometries,textures:__renderer.info.memory.textures};});
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(100);
 const audit=await p.evaluate(()=>{
  const B=__bay,T=THREE,box=new T.Box3(),v=new T.Vector3();let samples=0,minWater=Infinity,maxFlowerRadius=0,maxRippleRadius=0,minCamera=Infinity,minFlowerGap=Infinity,minPropGap=Infinity;
  const check=(ok,m)=>{if(!ok)throw Error(m)},visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
  function vertices(root,fn){root.updateWorldMatrix(true,true);root.traverse(o=>{if(!o.isMesh||!visible(o)||o.material.visible===false||!o.geometry?.attributes.position)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)fn(B.group.worldToLocal(v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld)),o);});}
  function waterClear(root,label){vertices(root,v=>{minWater=Math.min(minWater,v.y-.26);check(v.y>.261,label+' crosses original water: '+v.y);});}
  check(B.group.parent===B.H.island&&B.H.island.visible,'chapter5 must reuse original island');
  check(B.water.parent===B.H.island&&B.water.geometry.parameters.radius===.85,'original pond identity/radius retained');
  check(!B.group.children.some(o=>o.geometry?.type==='CircleGeometry'||o.geometry?.type==='CylinderGeometry'),'no separate water/disc');
  const baseMeshes=B.H.island.children.filter(o=>o.isMesh&&o!==B.water);
  check(B.H.grassTop.parent===B.H.island&&B.H.grassTop.visible,'original grass retained');check(baseMeshes.some(o=>new T.Box3().setFromObject(o).min.y < -6),'original rock underside retained');
  const original=B.H.island.children.filter(o=>o!==B.group).map(o=>({o,visible:o.visible,matrix:o.matrix.clone()}));
  const saved=JSON.stringify(JSON.parse(localStorage.getItem('healingGarden.v3')));
  function solidBox(root){const box=new T.Box3();root.traverse(o=>{if(o.isMesh&&visible(o)&&o.material.visible!==false)box.union(new T.Box3().setFromObject(o));});return box;}
  B.clearPondFlowers();
  for(let stage=0;stage<4;stage++)for(let station=0;station<6;station++)for(let tick=0;tick<12;tick++){
   B.sample(stage,station,tick*Math.PI/3,tick%6,false);B.group.updateMatrixWorld(true);samples++;
   check(B.H.island.visible&&B.water.visible,'original island/pond must stay visible');B.H.island.position.y=Math.sin(tick)*.12;B.H.island.rotation.z=Math.sin(tick)*.012;B.H.island.updateWorldMatrix(true,true);
   B.flowers.forEach((f,i)=>{waterClear(f.g,'lotus '+i);vertices(f.g,v=>{const r=Math.hypot(v.x-f.g.position.x,v.z-f.g.position.z);maxFlowerRadius=Math.max(maxFlowerRadius,r);check(r<.213,'flower exceeds reserved pond space');check(Math.hypot(v.x,v.z)<.754,'lotus intersects original shore stones');});
    const center=f.g.position.clone();for(let j=i+1;j<6;j++){const other=B.flowers[j].g.position,gap=Math.hypot(center.x-other.x,center.z-other.z)-.426;minFlowerGap=Math.min(minFlowerGap,gap);check(gap>.11,'lotus actors intersect');}
    vertices(B.ripples[i].mesh,v=>{check(v.y>.265,'ripple cuts original water');const radius=Math.hypot(v.x-center.x,v.z-center.z);maxRippleRadius=Math.max(maxRippleRadius,radius);check(radius>.18,'ripple intersects lotus leaf');check(Math.hypot(v.x,v.z)<.754,'ripple reaches original shore stones');});
   });
   for(const s of B.stations)if(s.visible){waterClear(s,'goal props');vertices(s,v=>{check(Math.hypot(v.x,v.z)<.68,'goal prop reaches original shoreline');if(station!==4)check(v.y>.80,'hovering props intersect lotus petals');});}
   // Each independent actor in the selected station must have a non-intersecting solid envelope.
   const actors=station===0?B.stations[0].children:station===2?B.beacons.concat([B.mote]):station===3?B.vessels.concat([B.stations[3].children[2]]):station===4?B.leafBoats:station===5?B.melodyBells:[];
   for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++)if(visible(actors[i])&&visible(actors[j])){
    const a=new T.Box3().setFromObject(actors[i]),z=new T.Box3().setFromObject(actors[j]);
    // Light flies above low rings; their glow markers are intentionally non-solid.
    if(station===2){const solid=o=>{const box=new T.Box3();o.traverse(k=>{if(k.isMesh&&k.geometry)box.union(new T.Box3().setFromObject(k));});return box;};check(!solid(actors[i]).intersectsBox(solid(actors[j])),'light intersects a beacon rim');continue;}
    check(!a.intersectsBox(z),'independent goal actors intersect in station '+station);
   }
  }
  B.sample(0,0,0,0,false);B.progress().light=[3,3,3,3,3,3];B.progress().found=LotusRules.blooms.map(x=>x.id);
  for(let frame=0;frame<120;frame++){B.pose(1/60,frame/60);B.flowers.forEach((f,i)=>waterClear(f.g,'unfurling lotus '+i));}
  B.sample(2,3,0,0,false);
  for(let frame=0;frame<30;frame++){B.blendFrame(frame/30);waterClear(B.stations[3],'converging light');const core=new T.Box3().setFromObject(B.stations[3].children[2]);for(const vessel of B.vessels){const body=new T.Box3().setFromObject(vessel);check(!body.intersectsBox(core),'converging lights pierce the core');}}
  for(let t=0;t<=7;t+=.25){B.sample(3,5,t,0,true);waterClear(B.boat,'boat');B.lanterns.forEach(l=>{waterClear(l,'rising lantern');const pos=B.group.worldToLocal(l.getWorldPosition(new T.Vector3()));check(pos.y>.70,'lantern starts inside flower');});
   const pos=B.boat.position;for(const f of B.flowers){const a=f.g.position,gap=Math.hypot(a.x-pos.x,a.z-pos.z)-.213-.104;minPropGap=Math.min(minPropGap,gap);check(gap>.02,'boat clips lotus');}vertices(B.boat,v=>check(Math.hypot(v.x,v.z)<.29,'boat crosses clear centre of original pond'));
  }
  B.sample(0,2,1,0,false);
  for(let a=0;a<Math.PI*2;a+=Math.PI/8){B.mote.position.set(Math.cos(a)*1.25,1.15,Math.sin(a)*1.25);waterClear(B.mote,'dragged light');vertices(B.mote,v=>check(Math.hypot(v.x,v.z)<.68&&v.y>1.18,'dragged light enters shoreline/lotus space'));for(const marker of B.beacons){const lightBox=new T.Box3().setFromObject(B.mote),rimBox=new T.Box3().setFromObject(marker.children[0]);check(!lightBox.intersectsBox(rimBox),'dragged light intersects marker rim');}}
  for(const ending of [false,true]){B.sample(ending?3:2,ending?5:4,ending?6.75:1,0,ending);
  for(const zoom of [.6,1.5])for(const phi of [.75,1.4])for(let theta=0;theta<Math.PI*2;theta+=Math.PI/4){const camera=B.H.camera;camera.position.set(window.__cam.baseR*zoom*Math.sin(phi)*Math.cos(theta),.4+window.__cam.baseR*zoom*Math.cos(phi),window.__cam.baseR*zoom*Math.sin(phi)*Math.sin(theta));camera.lookAt(0,.4,0);camera.updateMatrixWorld();const direction=camera.getWorldDirection(new T.Vector3());vertices(B.H.island,v=>{const d=B.group.localToWorld(v.clone()).sub(camera.position).dot(direction);minCamera=Math.min(minCamera,d);check(d>camera.near+.3,'near-plane slices model');});B.group.traverse(o=>{if(!o.isSprite||!visible(o))return;const center=o.getWorldPosition(new T.Vector3()),scale=o.getWorldScale(new T.Vector3()),d=center.sub(camera.position).dot(direction)-Math.max(scale.x,scale.y)/2;check(d>camera.near+.3,'near-plane slices a light');});}
  }
  // Ring/arrow are separate from the leaf board, with a deliberate vertical clearance.
  B.sample(2,4,1,0,false);
  for(const leaf of B.leafBoats){const a=new T.Box3().setFromObject(leaf.children[0]),z=new T.Box3().setFromObject(leaf.children[1]);check(z.min.y>a.max.y+.003,'leaf arrow intersects board');}
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){B.progress().leaves=[a,b,c];B.pose(0,1);B.leafBoats.forEach(leaf=>waterClear(leaf,'asymmetric leaf pose'));for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)check(!new T.Box3().setFromObject(B.leafBoats[i]).intersectsBox(new T.Box3().setFromObject(B.leafBoats[j])),'rotated leaf boats overlap');}
  check(maxRippleRadius<.209,'ripple bounded');
  for(const r of B.ripples){r.time=1;B.pose(0,0);vertices(r.mesh,v=>check(Math.hypot(v.x-r.mesh.position.x,v.z-r.mesh.position.z)>.18,'initial ripple intersects its leaf'));}
  B.sample(3,5,3.5,0,true);B.H.island.updateWorldMatrix(true,true);
  for(const f of B.H.flowers){const box=solidBox(f.root);for(const lotus of B.flowers)check(!box.intersectsBox(solidBox(lotus.g)),'legacy flower intersects lotus');}
  check(JSON.stringify(JSON.parse(localStorage.getItem('healingGarden.v3')))===saved,'display clearance must not change saved coordinates');
  check(original.every(a=>a.o.visible===a.visible),'shared landmark visibility changed');return{samples,unfurlFrames:120,blendFrames:30,leafPoses:64,finaleFrames:29,cameraCases:64,minWater,maxFlowerRadius,maxRippleRadius,minCamera,minFlowerGap,minPropGap};
 });
 // Render a selection of the audited views, including both tilt/zoom extremes and the final procession.
 const views=[['front',Math.PI/2,1.12,1],['side',0,1.12,1],['rear',Math.PI*1.5,1.12,1],['close-low',Math.PI/4,1.4,.6],['close-high',Math.PI*1.25,.75,.6],['far',Math.PI/2,.75,1.5]];
 for(const [name,theta,phi,zoom]of views){await p.evaluate(([theta,phi,zoom])=>{const B=__bay;B.sample(2,4,1,0,false);B.H.camera.position.set(window.__cam.baseR*zoom*Math.sin(phi)*Math.cos(theta),.4+window.__cam.baseR*zoom*Math.cos(phi),window.__cam.baseR*zoom*Math.sin(phi)*Math.sin(theta));B.H.camera.lookAt(0,.4,0);B.H.camera.updateMatrixWorld();B.pose(0,1);window.__renderer.render(B.H.scene,B.H.camera);},[theta,phi,zoom]);await p.screenshot({path:'output/playwright/healing-v9.2-validation/lotus92-audit-'+name+'.png',scale:'css'});}
 await p.evaluate(()=>{const B=__bay;B.sample(3,5,3.5,0,true);B.H.camera.position.set(0,7.3,14.4);B.H.camera.lookAt(0,.4,0);__renderer.render(B.H.scene,B.H.camera);});await p.screenshot({path:'output/playwright/healing-v9.2-validation/lotus92-audit-finale.png',scale:'css'});
 // Storage coordinates must not be rewritten to make the new bay clear.
 assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('healingGarden.v3')).flowers[0].x)===0,'saved garden positions preserved');assert(!errors.length,errors.join(';'));await c.close();return{profile,audit,views:views.length,errors};
}
