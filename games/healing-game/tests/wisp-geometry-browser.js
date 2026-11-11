async root => {
 // Compare actual opaque mesh intersections with the original 1.0 wisp extent at identical sampled poses.
 // This catches the 1.35-scale regression without changing the historical center-distance test.
 // Torus obstacles use a conservative convex envelope; sprite halos are deliberately excluded.
 const browser=root.context().browser(),c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage(),errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort();}if(r.request().resourceType()!=='document')return r.continue();const res=await r.fetch();let s=await res.text();s=s.replace('      addStyle(); prepareWisps(); buildLamps(); bindSwipes();','      addStyle(); prepareWisps(); buildLamps(); bindSwipes(); window.__meshCheck={H:H,J:J};');await r.fulfill({response:res,body:s});});
 await p.addInitScript(()=>{let randomSeed=0xC0FFEE;Math.random=()=>((randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0)/4294967296);localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({level:3,total:20,ended:true}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2],charge:0,lamps:[false,false,false]}));});
 await p.goto('http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/');await p.locator('#start').click();
 const result=await p.evaluate(()=>{
  const T=THREE,{H,J}=__meshCheck,ws=J.wisps,V=()=>new T.Vector3(),crossTemp=V();
  const cached=new Map(),EPS=1e-7;
  function model(mesh){
   let d=cached.get(mesh.geometry);if(!d){const geo=mesh.geometry,a=geo.attributes.position,raw=[];for(let i=0;i<a.count;i++)raw.push(V().fromBufferAttribute(a,i));const tri=[];for(let i=0;i<(geo.index?geo.index.count:a.count);i+=3)tri.push([0,1,2].map(k=>geo.index?geo.index.getX(i+k):i+k));d={raw,tri};cached.set(geo,d);}return{mesh,d};
  }
  function hull(m){const vertices=m.d.raw.map(v=>v.clone().applyMatrix4(m.mesh.matrixWorld)),box=new T.Box3().setFromPoints(vertices);return{vertices,box,tri:m.d.tri};}
  function axes(h){if(h.faces)return;h.faces=[];h.edges=[];const seenF=new Set(),seenE=new Set();function add(list,seen,v){if(v.lengthSq()<1e-12)return;v.normalize();if(v.x<-.00001||Math.abs(v.x)<.00001&&v.y<-.00001||Math.abs(v.x)<.00001&&Math.abs(v.y)<.00001&&v.z<0)v.negate();const key=[v.x,v.y,v.z].map(n=>Math.round(n*1e5)).join();if(!seen.has(key)){seen.add(key);list.push(v);}}for(const t of h.tri){const a=h.vertices[t[0]],b=h.vertices[t[1]],c=h.vertices[t[2]],ab=b.clone().sub(a),ac=c.clone().sub(a);add(h.faces,seenF,ab.clone().cross(ac));add(h.edges,seenE,ab);add(h.edges,seenE,ac);add(h.edges,seenE,c.clone().sub(b));}}
  function separated(a,b,axis){if(axis.lengthSq()<1e-12)return false;let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;for(const v of a.vertices){const n=v.dot(axis);amin=Math.min(amin,n);amax=Math.max(amax,n);}for(const v of b.vertices){const n=v.dot(axis);bmin=Math.min(bmin,n);bmax=Math.max(bmax,n);}return amax<bmin+EPS||bmax<amin+EPS;}
  function overlap(a,b){if(!a.box.intersectsBox(b.box))return false;axes(a);axes(b);for(const n of a.faces.concat(b.faces))if(separated(a,b,n))return false;for(const x of a.edges)for(const y of b.edges)if(separated(a,b,crossTemp.crossVectors(x,y)))return false;return true;}
  const models=ws.map(w=>w.g.children.filter(m=>m.isMesh).map(model));
  const tree=H.island.children.find(g=>Math.abs(g.position.x+2.5)<1e-6&&Math.abs(g.position.z+1.7)<1e-6&&g.children.length===5);if(!tree)throw Error('Tree not found');
  J.lamps.forEach(l=>l.core.scale.setScalar(1.9));H.island.updateWorldMatrix(true,true);
  const obstacles=tree.children.filter(m=>m.isMesh).map(m=>({name:'tree-'+m.geometry.type,h:hull(model(m))}));
  J.lamps.forEach((l,i)=>l.g.children.filter(m=>m.isMesh).forEach(m=>obstacles.push({name:'lamp'+i+'-'+m.geometry.type,h:hull(model(m))})));
  const out={samples:25000,dt:.05,scales:[1,'actual final'],obstacleTests:0,obstacleOverlap:0,obstacleOldOverlap:0,obstacleNewOnly:0,obstaclesByName:{},obstacleExamples:[],observedScale:0,pairTests:0,oldOverlap:0,newOverlap:0,newOnly:0,examples:[],minCenter:Infinity};
  // The real movement/settling function, same sampled poses for both sizes; sprites never enter the solid mesh test.
  for(let n=0;n<out.samples;n++){
   const t=n*out.dt;ws.forEach(w=>{w.cooldown=0;w.g.visible=true;w.fade=1;__level3fx.moveWisp(w,out.dt,t);});
   const candidates=[];for(let i=0;i<ws.length;i++)for(let j=i+1;j<ws.length;j++){const d=ws[i].g.position.distanceTo(ws[j].g.position);out.minCenter=Math.min(out.minCenter,d);if(d<1.3)candidates.push([i,j]);}
   const actualScales=ws.map(w=>w.g.scale.x);out.observedScale=actualScales[0];
   const hits=[new Set(),new Set()],obstacleHits=[new Set(),new Set()];
   for(let s=0;s<2;s++){
    ws.forEach((w,i)=>{w.g.scale.setScalar(s===0?1:actualScales[i]);w.g.updateWorldMatrix(true,true);});
    const hulls=models.map(ms=>ms.map(hull));
    for(let i=0;i<hulls.length;i++)for(let x=0;x<hulls[i].length;x++)for(let oi=0;oi<obstacles.length;oi++){const o=obstacles[oi];out.obstacleTests++;if(overlap(hulls[i][x],o.h)){obstacleHits[s].add([i,x,oi].join());if(s===1){out.obstaclesByName[o.name]=(out.obstaclesByName[o.name]||0)+1;if(out.obstacleExamples.length<8)out.obstacleExamples.push({t,wisp:i,mesh:x,obstacle:o.name});}}}
    for(const [i,j]of candidates)for(let x=0;x<3;x++)for(let y=0;y<3;y++){out.pairTests++;if(overlap(hulls[i][x],hulls[j][y]))hits[s].add([i,j,x,y].join());}
   }
   out.obstacleOldOverlap+=obstacleHits[0].size;out.obstacleOverlap+=obstacleHits[1].size;
   for(const key of obstacleHits[1])if(!obstacleHits[0].has(key))out.obstacleNewOnly++;
   out.oldOverlap+=hits[0].size;out.newOverlap+=hits[1].size;
   for(const key of hits[1])if(!hits[0].has(key)){out.newOnly++;if(out.examples.length<12)out.examples.push({t,pair:key,centers:ws.map(w=>w.g.position.toArray())});}
  }
  return out;
 });await c.close();
 if(result.newOnly||result.obstacleNewOnly)throw Error('Enlarged solid wisp geometry introduces intersections: '+JSON.stringify(result));
 if(errors.length||external.length)throw Error(JSON.stringify({errors,external}));
 return {...result,errors,external};
}
