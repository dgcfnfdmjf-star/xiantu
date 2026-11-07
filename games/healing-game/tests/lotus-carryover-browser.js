// Original lanterns and singing birds stay clear of the new pond actors and moon.
async root=>{
 const c=await root.context().browser().newContext({viewport:{width:1280,height:800}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1')throw Error('External request');if(r.request().resourceType()!=='document')return r.continue();const response=await r.fetch();let body=await response.text();
  body=body.replace('render();pose(0,0);','window.__carry={H,group,moon,pose,lanterns,stations,sample:i=>{selected=Math.min(i,5);progress().light=Array(6).fill(i===6?3:0);finale=i===6?7:0;elapsed=0;render();pose(0,0);}};render();pose(0,0);');
  body=body.replace('  function updateBirds(dt, t) {','  function updateBirds(dt, t) { window.__oldBirds={birds:birds,play:singBirds};');
  body=body.replace('  var lanternCol = new THREE.Color','  window.__oldLantern={release:releaseLantern,list:lanterns,step:update};\n  var lanternCol = new THREE.Color');await r.fulfill({response,body});});
 await p.addInitScript(()=>{localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({level:1,total:20,ended:true}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2,3,4],lamps:[true,true,true],chimes:{round:3}}));});
 await p.goto('http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/');await p.locator('#start').click();await p.evaluate(()=>{requestAnimationFrame=()=>0;});await p.waitForTimeout(100);
 const result=await p.evaluate(()=>{
  const check=(v,m)=>{if(!v)throw Error(m)},W=GardenClip.world,shared=W.island.children.slice(0,15),moving=W.scene.children.filter(o=>typeof o.userData?.r==='number');let frames=0;
  for(let station=0;station<7;station++){
   __kittens.setLevel(1);const v=new THREE.Vector3(2.3,.26,-1.3);W.island.localToWorld(v);__oldLantern.release(v.x,v.y,v.z);const L=__oldLantern.list.at(-1);L.dx=L.dz=0;L.vy=.6;
   for(let t=0;t<10;t++)__oldLantern.step(.05);check(L.g.visible,'old lantern still visible in original chapter');
   __kittens.setLevel(5);__carry.sample(station);
   for(let t=0;t<60;t++){__oldLantern.step(.05);frames++;check(!L.g.visible,'carryover lantern crosses goal '+station);check(W.island.visible&&shared.every(o=>o.visible)&&moving.every(o=>o.visible),'permanent island scenery was hidden');if(station===6)check(__carry.lanterns.every(o=>o.visible),'chapter5 finale lanterns must remain visible');}
   check(L.age>3&&L.fade===1,'hidden carryover keeps original lifetime');__kittens.setLevel(4);check(L.g.visible,'leaving5 restores surviving carryover');L.fade=0;__oldLantern.step(0);
  }
  // An already hidden transient must not become visible merely because chapter5 exits.
  const v=new THREE.Vector3(2.3,.26,-1.3);W.island.localToWorld(v);__oldLantern.release(v.x,v.y,v.z);const hidden=__oldLantern.list.at(-1);hidden.g.visible=false;__kittens.setLevel(5);__oldLantern.step(.05);__kittens.setLevel(4);check(!hidden.g.visible,'prior transient visibility is preserved');
  __oldBirds.play();__kittens.setLevel(5);__carry.sample(0);const B=__carry,T=THREE,vertex=new T.Vector3(),moonMesh=B.moon.children.find(o=>o.isMesh),shape=moonMesh.geometry.parameters;let birdPoses=0;
  // Sing before crossing chapters, then sample the whole takeoff, orbit and landing.
  for(let tick=0;tick<140;tick++){__oldLantern.step(.05);
   for(const theta of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const phi of [.75,1.12,1.4]){
    B.H.camera.position.set(14*Math.sin(phi)*Math.cos(theta),.4+14*Math.cos(phi),14*Math.sin(phi)*Math.sin(theta));B.H.camera.lookAt(0,.4,0);B.H.camera.updateMatrixWorld();B.pose(0,tick*.05);B.H.island.updateMatrixWorld(true);birdPoses++;
    __oldBirds.birds.forEach(b=>{check(b.g.visible,'original birds must stay visible');b.g.traverse(o=>{if(!o.isMesh||o.material.visible===false)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){vertex.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);moonMesh.worldToLocal(vertex);let angle=Math.atan2(vertex.y,vertex.x);if(angle<0)angle+=Math.PI*2;check(angle>shape.arc||Math.hypot(Math.hypot(vertex.x,vertex.y)-shape.radius,vertex.z)>=shape.tube,'singing bird intersects moon at '+tick+'/'+theta+'/'+phi);}});});
   }
  }
  return{goals:6,finale:1,frames,birdPoses,permanentLandmarks:shared.length,movingScenery:moving.length};
 });if(errors.length)throw Error(errors.join(';'));await c.close();return result;
}
