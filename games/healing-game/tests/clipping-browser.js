async root => {
 const failed=[],assert=(ok,msg)=>{if(!ok)failed.push(msg)};
 const browser=root.context().browser(), results={}, errors=[], external=[];
 const url='http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/';
 const inject=[['var kittens = [], COUNT = 6','var kittens = window.__kl = [], COUNT = 6'],['wisps = [], lamps = []','wisps = window.__wl = [], lamps = []'],['  var clouds = [];','  var clouds = window.__cl = [];'],['  var floaters = [];','  var floaters = window.__fl = [];'],
  ['    update(dt);\n    renderer.render(scene, camera);','    for (var q = 0; q < 8; q++) { update(0.05); if (window.__probe) window.__probe(); }\n    renderer.render(scene, camera);']];
 async function open(save,vp){
  const context=await browser.newContext({viewport:vp||{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort()}
   if(r.request().resourceType()!=='document')return r.continue();
   const res=await r.fetch();let body=await res.text();for(const [a,b] of inject){if(body.includes(a))body=body.replace(a,b)}
   body=body.replace(/var bfs = \[\]/,'var bfs = window.__bl = []');await r.fulfill({response:res,body})});
  await page.addInitScript(d=>{if(sessionStorage.getItem('fx'))return;sessionStorage.setItem('fx','1');for(const k in d)localStorage.setItem(k,JSON.stringify(d[k]));localStorage.setItem('hg_level2_unlocked','1')},save);
  await page.goto(url);await page.locator('#start').click();await page.waitForTimeout(600);return {context,page};
 }
 const onSpot={x:0,z:3.8,id:'daisy'}, garden=s=>({flowers:[onSpot,{x:3.3,z:1.5,id:'rose'},{x:-1,z:-3,id:'lav'},{x:1,z:0.5,id:'sky'},{x:-1.5,z:1.2,id:'mint'},{x:-3,z:0.5,id:'lemon'}],...s});
 const probe=`(()=>{const W=GardenClip.world,T=window.__T||THREE,m={n:0,minBottom:9,pair:9,flower:9,tree:9,cam:9,cat:9,bush:9,cloudCam:9,cloudRock:9,keel:9,lampBoat:9,wispTree:9,wispPair:9,wispLamp:9,yarn:9};window.__m=m;
  const vtx=new T.Vector3(),meshBottom=(o,st)=>{let y=9;o.updateWorldMatrix(true,true);o.traverse(c=>{if(c.isMesh&&c.visible&&c.geometry){const a=c.geometry.attributes.position;for(let i=0;i<a.count;i++){W.island.worldToLocal(vtx.fromBufferAttribute(a,i).applyMatrix4(c.matrixWorld));if(vtx.y<y){y=vtx.y;if(y-.25<m.minBottom)m.worst=st+':'+c.geometry.type+':'+(c.parent===o?'root':(c.parent&&c.parent.children.length))}}}});return y},h=(a,b,c,d)=>Math.hypot(a-c,b-d);
  const BUSH=[[-1.2,2.7],[3.3,1.5],[-3.6,.9],[.7,-3.3],[1.9,3.3],[-1.5,-.1]],LAMP=[[-3.7,.7],[0,3.8],[3.7,.7]],TREE=[-2.5,-1.7];
  window.__probe=()=>{m.n++;const iy=W.island.position.y,top=iy+.25,fl=W.flowers,cam=W.camera.position;
   (window.__cl||[]).forEach(c=>{m.cloudCam=Math.min(m.cloudCam,c.position.distanceTo(cam));(window.__fl||[]).forEach(r=>m.cloudRock=Math.min(m.cloudRock,c.position.distanceTo(r.position)))});
   if(__kittens.state().level===1)(window.__bl||[]).forEach((b,i,a)=>{if(b.state==='release')return;m.minBottom=Math.min(m.minBottom,b.pos.y-top);m.cam=Math.min(m.cam,b.g.position.distanceTo(cam));m.tree=Math.min(m.tree,Math.hypot(b.pos.x-TREE[0],b.pos.y-top-1.95,b.pos.z-TREE[1]));fl.forEach(f=>m.flower=Math.min(m.flower,Math.hypot(b.pos.x-f.root.position.x,b.pos.y-top-.72,b.pos.z-f.root.position.z)));m.cat=Math.min(m.cat,Math.hypot(b.pos.x-1.25,b.pos.y-top-.25,b.pos.z-2.45));for(let j=i+1;j<a.length;j++)m.pair=Math.min(m.pair,b.pos.distanceTo(a[j].pos))});
   if(__kittens.state().level===2){const ks=window.__kl.filter(k=>k.state!=='hug'&&k.fade>.5);ks.forEach((k,i)=>{if(m.n%20===0)m.minBottom=Math.min(m.minBottom,meshBottom(k.root,k.state+'/'+k.curl.toFixed(2)+'/'+k.fade.toFixed(1))-.25);BUSH.forEach(b=>m.bush=Math.min(m.bush,h(k.x,k.z,b[0],b[1])));fl.forEach(f=>m.flower=Math.min(m.flower,h(k.x,k.z,f.root.position.x,f.root.position.z)));m.cat=Math.min(m.cat,h(k.x,k.z,1.25,2.45));for(let j=i+1;j<ks.length;j++)m.pair=Math.min(m.pair,h(k.x,k.z,ks[j].x,ks[j].z));if(k.yarn&&k.state==='play')m.yarn=Math.min(m.yarn,h(k.x,k.z,k.yarn.position.x,k.yarn.position.z))})}
   if(__kittens.state().level===3){const B=GardenClip.boat;if(B&&B.visible){const bp=B.position;LAMP.forEach(l=>m.lampBoat=Math.min(m.lampBoat,h(bp.x,bp.z,l[0],l[1])));fl.forEach(f=>{if(h(bp.x,bp.z,f.root.position.x,f.root.position.z)<.6)m.keel=Math.min(m.keel,bp.y-.12-.02-1.08)})}
    window.__wl.filter(w=>w.g.visible&&w.fade>.5).forEach((w,i,a)=>{const p=w.g.position;m.wispTree=Math.min(m.wispTree,Math.hypot(p.x-TREE[0],p.y-.25-1.95,p.z-TREE[1]));LAMP.forEach(l=>m.wispLamp=Math.min(m.wispLamp,Math.hypot(p.x-l[0],p.y-.25-.91,p.z-l[1])));for(let j=i+1;j<a.length;j++)m.wispPair=Math.min(m.wispPair,p.distanceTo(a[j].g.position))})}
  }})()`;
 const run=async(page,ms,name)=>{await page.evaluate(probe);await page.waitForTimeout(ms);const m=await page.evaluate(()=>window.__m);for(const k in m)if(m[k]===9)delete m[k];results[name]=m;await page.screenshot({path:'output/playwright/clipping-'+name+'.png'});return m};

 const kitSave=l=>({'healingGarden.kittens.v1':{total:20,ended:true,level:l,caught:{orange:20}}});
 let s=await open({'healingGarden.v3':garden({}),...kitSave(1)},{width:1280,height:720});
 let m=await run(s.page,25000,'level1');
 assert(m.n>200,'level 1 simulated');assert(m.minBottom>=.6,'butterfly wing floor '+m.minBottom);assert(m.tree>=1.55,'butterfly/canopy '+m.tree);assert(m.flower>=.45,'butterfly/flower '+m.flower);assert(!(m.cam<1.55),'butterfly/camera '+m.cam);assert(!(m.cloudCam<4.9),'cloud/camera '+m.cloudCam);assert(m.cloudRock>=4.9,'cloud/rock '+m.cloudRock);
 await s.context.close();

 s=await open({'healingGarden.v3':garden({}),...kitSave(2)});
 await s.page.evaluate(()=>{window.__kl[0]&&(window.__kl[0].state='sleep')});
 m=await run(s.page,30000,'level2');
 const tapped=await s.page.evaluate(()=>{const k=window.__kl.find(k=>k.state!=='sleep'&&k.state!=='hug');k.state='idle';k.timer=99;const c=__kittens.screenOf(k);return c&&{x:c.x,y:c.y,i:window.__kl.indexOf(k)}});
 await s.page.touchscreen.tap(tapped.x,tapped.y);
 assert(await s.page.waitForFunction(i=>window.__kl[i]&&window.__kl[i].state==='play',tapped.i,{timeout:15000}).then(()=>true,()=>false),'lured kitten reaches play');
 const yarnGap=await s.page.evaluate(i=>{const k=window.__kl[i];return k&&k.yarn?Math.hypot(k.x-k.yarn.position.x,k.z-k.yarn.position.z):null},tapped.i);
 assert(yarnGap>=.4,'yarn clear of kitten body '+yarnGap);results.yarnGap=yarnGap;
 assert(m.n>200,'level 2 simulated');assert(m.minBottom>=-.02,'kitten mesh under grass '+m.minBottom);assert(m.pair>=.55,'kitten pair '+m.pair);assert(m.bush>=.8,'kitten/bush '+m.bush);assert(m.flower>=.42,'kitten/flower '+m.flower);assert(m.cat>=.75,'kitten/cat '+m.cat);
 await s.context.close();

 s=await open({'healingGarden.v3':garden({}),...kitSave(3),'healingGarden.journey.v1':{caught:{dew:4,peach:4,amber:4,moon:4,violet:4,tide:4},charge:0,lamps:[true,true,true],completed:[1,2,3],decor:[true,true,true]}});
 const home=await s.page.evaluate(()=>{const p=GardenClip.world.flowers[0].root.position;return{x:p.x,z:p.z,count:GardenClip.world.flowers.length,keep:JSON.parse(localStorage.getItem('healingGarden.v3')).flowers[0]}});
 assert(home.count===6,'all saved flowers restored');assert(Math.hypot(home.x,home.z-3.8)>=.75,'flower moved off lamp on screen');assert(home.keep.x===0&&home.keep.z===3.8,'save keeps original flower spot');
 m=await run(s.page,30000,'level3');
 assert(m.n>200,'level 3 simulated');assert(m.lampBoat>=.75,'boat/lamp '+m.lampBoat);assert(m.keel===undefined||m.keel>=-.02,'keel over flower '+m.keel);assert(m.wispTree>=1.75,'wisp/canopy '+m.wispTree);assert(m.wispLamp>=.75,'wisp/lamp '+m.wispLamp);assert(m.wispPair>=.7,'wisp pair '+m.wispPair);
 await s.context.close();
 assert(!errors.length,'page errors: '+errors.join('; '));assert(!external.length,'external requests');
 if(failed.length)throw Error(failed.join(' | ')+' :: '+JSON.stringify(results));
 return results;
}
