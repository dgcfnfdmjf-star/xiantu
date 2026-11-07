// Fresh-load and rotation regressions: camera fitting must follow the base camera update.
async root=>{
 const b=root.context().browser(),assert=(v,m)=>{if(!v)throw Error(m)},results=[];
 for(const size of [{width:390,height:844},{width:320,height:568},{width:568,height:320},{width:844,height:390}]){
  const c=await b.newContext({viewport:size,deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1')throw Error('External request');if(r.request().resourceType()!=='document')return r.continue();const response=await r.fetch();const body=(await response.text()).replace('render();pose(0,0);','window.__layoutBay={H,group,water,moon,flowers,stations,preview:function(i){selected=i;progress().light=LotusRules.blooms.map((_,n)=>n<i?3:0);progress().leaves=[1,3,2];render();pose(0,0);}};render();pose(0,0);');await r.fulfill({response,body});});
  await p.addInitScript(()=>{localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({level:5,total:20,ended:true}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2,3,4],lamps:[true,true,true],chimes:{round:3}}));});
  await p.goto('http://127.0.0.1:8784/xiantu/games/healing-game/site/healing-game/');await p.locator('#start').click();await p.waitForTimeout(1700);await p.evaluate(()=>__layoutBay.H.toast('每一朵莲花绽开时，光路都会慢慢亮起。',10000));await p.waitForTimeout(150);
  async function measure(){return p.evaluate(()=>{
   const B=__layoutBay,T=THREE,dock=document.getElementById('lotusDock').getBoundingClientRect(),top=document.getElementById('topbar').getBoundingClientRect().bottom+10;
   const rect={left:12,right:innerHeight<480?dock.left-12:innerWidth-12,top,bottom:innerHeight<480?innerHeight-12:dock.top-10},v=new T.Vector3();let low=Infinity,high=-Infinity,covered=[];
   B.group.updateMatrixWorld(true);B.H.camera.updateMatrixWorld();
   const scan=(root,label)=>root.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).project(B.H.camera);const x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2;if(root===B.water){low=Math.min(low,x);high=Math.max(high,x);}if(x<rect.left-1||x>rect.right+1||y<rect.top-1||y>rect.bottom+1)covered.push(label);}});
   scan(B.water,'water');scan(B.moon,'moon');B.flowers.forEach((f,i)=>scan(f.g,'flower'+i));
   return{zoom:B.H.camera.zoom,waterWidth:high-low,availableWidth:rect.right-rect.left,availableHeight:rect.bottom-rect.top,covered:[...new Set(covered)]};
  });}
  const first=await measure();assert(!first.covered.length,JSON.stringify(size)+' initial HUD overlap: '+first.covered);assert(first.waterWidth>Math.min(first.availableWidth,first.availableHeight*1.3)*.45,JSON.stringify(size)+' fresh scene is too small');
  await p.screenshot({path:'output/playwright/lotus91-layout-'+size.width+'x'+size.height+'.png',scale:'css'});
  await p.setViewportSize({width:size.height,height:size.width});await p.waitForTimeout(350);await p.setViewportSize(size);await p.waitForTimeout(350);
  const back=await measure();assert(!back.covered.length,'rotation return HUD overlap: '+back.covered);assert(Math.abs(back.zoom-first.zoom)<.025,'fresh and return camera sizing differ: '+JSON.stringify({size,first,back}));
  const stages=[];for(let i=1;i<6;i++){await p.evaluate(i=>__layoutBay.preview(i),i);await p.waitForTimeout(150);const m=await measure();assert(!m.covered.length,JSON.stringify(size)+' task'+i+' HUD overlap: '+m.covered);stages.push({i,zoom:m.zoom,waterWidth:m.waterWidth});if(i===1||i===5)await p.screenshot({path:'output/playwright/lotus91-layout-'+size.width+'x'+size.height+'-task'+i+'.png',scale:'css'});}
  assert(!errors.length,errors.join(';'));results.push({size,first,back,stages});await c.close();
 }
 return results;
}
