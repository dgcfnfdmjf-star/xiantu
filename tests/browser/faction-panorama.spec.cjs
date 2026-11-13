'use strict';
const {test,expect}=require('@playwright/test');

const MAPS={
 human_peaks:['zhandian','qingluan','leiyin','ziwei','qinglian','xuehun','biyun','liuli'],
 human_valleys:['jinbi','xingyue','nishang','lianhua','caifeng','cuizhu','panyu','zixia'],
 demon_domain:['tiancan','huyan','moba','zhanhun','xianmo'],
 immortal_domain:['yinyue','huanyu','taisui','fengqi','taixu']
};
const POINTS=[[350,230],[700,200],[1050,230],[1320,440],[1320,790],[1050,980],[700,980],[350,850]];
const imageFile=region=>`${region.replace('_','-')}-panorama-v2868123.webp`;

async function boot(page){
 await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('/game-v2762.html');
 await page.locator('#introSkipChoiceV2898').check();
 await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('四境全景回归');
 await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{tutorialState.active=false;closeTutorialBubble();closeWorldOverlay();player.level=10;});
}
async function enter(page,region){
 expect(await page.evaluate(r=>{closeWorldOverlay();return applyWorldMapLayout(r,true);},region)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>wildSceneReadyV286898())).toBe(true);
}

for(const [region,factions] of Object.entries(MAPS))test(`${region}: painted field, minimap and selectable entrances share one intact panorama`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await boot(page);await enter(page,region);
 const info=await page.evaluate(()=>{
  const scene=wildSceneV286898(),im=SCROLL_ART_V2831.wildScenes[currentRegion],cfg=getWorldMapConfig();
  // Exercise the real ground/POI/minimap renderers against decoded browser images.
  const c=document.createElement('canvas');c.width=300;c.height=220;const ctx=c.getContext('2d');
  const ground=[],architecture=[],draw=ctx.drawImage.bind(ctx);let used=ground;
  ctx.drawImage=(image,...args)=>{used.push(image.src);return draw(image,...args);};
  // The walking field bakes its panorama before consulting drawWorldGround,
  // which is deliberately the legacy fallback. Observe that real cache path.
  const proto=CanvasRenderingContext2D.prototype,canvasDraw=proto.drawImage;
  releaseStaticWorldCacheV2767();
  try{proto.drawImage=function(image,...args){ground.push(image.src);return canvasDraw.call(this,image,...args);};ensureStaticWorldCache();}
  finally{proto.drawImage=canvasDraw;}
  used=architecture;
  let legacyHouses=0;const house=drawIsoHouse;
  try{drawIsoHouse=function(...args){legacyHouses++;return house(...args);};
   for(const poi of FLAT_WORLD.pois.filter(p=>scene.rooms[p.id]&&p.action!=='yewuji_v2810'))drawWorldPoi(ctx,poi);
  }finally{drawIsoHouse=house;}
  const mini=document.getElementById('minimapCanvas').getContext('2d'),miniDraw=mini.drawImage,miniImages=[];
  try{mini.drawImage=function(image,...args){miniImages.push(image.src);return miniDraw.call(this,image,...args);};drawWorldMinimap(390,844);}
  finally{mini.drawImage=miniDraw;}
  const routes=Object.keys(scene.rooms).map(id=>{
   const p=FLAT_WORLD.pois.find(o=>o.id===id),door=wildSceneDoorV286898(p),route=planNavigationV2830(p),box=poiTapBoxV2904(p);
   let previous=FLAT_WORLD.player,clear=!!route?.length;
   for(const q of route||[]){if(FLAT_WORLD.colliders.some(b=>worldDistanceSegmentV2827(b.x,b.y,previous,q)<b.radius+(FLAT_WORLD.player.r||17)-1e-5))clear=false;previous=q;}
   return {id,doorOffset:door?Math.hypot(door.x-p.x,door.y-p.y):null,clear,
    endOffset:route?.length&&door?Math.hypot(route.at(-1).x-door.x,route.at(-1).y-door.y):null,
    hit:box?tappedPoiV2904((box.left+box.right)/2,(box.top+box.bottom)/2)?.id:null};
  });
  return {file:scene.file,size:[im.naturalWidth,im.naturalHeight],minimap:scene.minimap,overview:scene.overview,
   base:WORLD_MAP_BASE_V2900[currentRegion],worldSize:[cfg.width,cfg.height],spawn:{x:FLAT_WORLD.player.x,y:FLAT_WORLD.player.y},
   roomIds:Object.keys(scene.rooms).sort(),ground,architecture,legacyHouses,miniImages,routes,
   legacyObstacles:FLAT_WORLD.colliders.filter(c=>['tree','stone'].includes(c.type)).length,
   paintedObstacles:FLAT_WORLD.colliders.filter(c=>c.type==='wild-scene').length};
 });
 const positions={travel_gate:[170,1060],[`${region}_supply`]:[220,510],[`${region}_rest`]:[460,650],[`${region}_guide`]:[800,600]};
 factions.forEach((id,i)=>positions[`faction_${id}`]=POINTS[i]);
 if(region==='demon_domain')positions.yewuji_gate=[1050,980];
 expect(info.base.poiPositions).toEqual(positions);
 expect({width:info.base.width,height:info.base.height,spawn:info.base.spawn,hub:info.base.hub,safeZones:info.base.safeZones})
  .toEqual({width:1600,height:1200,spawn:{x:320,y:1060},hub:{x:800,y:600},safeZones:[{x:390,y:630,r:230}]});
 expect(info.worldSize).toEqual([2320,1740]);expect(info.spawn).toEqual({x:464,y:1537});
 expect(info.file).toBe(imageFile(region));expect(info.size).toEqual([1484,1060]);
 expect(info.minimap).toBe(true);expect(info.overview).toBe(true);
 expect(info.roomIds).toEqual(Object.keys(positions).sort());
 expect(info.ground.map(u=>u.split('/').at(-1))).toEqual([imageFile(region)]);
 expect(info.miniImages.map(u=>u.split('/').at(-1))).toContain(imageFile(region));
 expect(info.architecture.every(u=>u.endsWith(imageFile(region)))).toBe(true);expect(info.legacyHouses).toBe(0);
 expect(info.legacyObstacles).toBe(0);expect(info.paintedObstacles).toBeGreaterThan(0);
 for(const route of info.routes){
  expect(route.doorOffset,route.id).not.toBeNull();expect(route.doorOffset,route.id).toBeLessThan(1);
  expect(route.clear,route.id).toBe(true);expect(route.endOffset,route.id).toBeLessThan(.1);
  expect(route.hit,route.id).toBe(route.id);
 }

 // Select a real mobile directory row and use its navigation action, then let
 // the normal animation/movement loop advance instead of teleporting the actor.
 const selected=`faction_${factions[0]}`;
 await page.evaluate(()=>showScrollMapV2831());
 await expect(page.locator('#scrollFieldV2831')).toHaveCSS('background-image',new RegExp(imageFile(region).replace('.','\\.')));
 if(!await page.locator('#scrollDetailsV2837').evaluate(el=>el.open))await page.locator('#scrollDetailsV2837 summary').click();
 await page.locator(`#scrollDirectoryV2837 [data-poi="${selected}"]`).click();
 await page.locator('#scrollSelectionV2831 [data-scroll-action="go"]').click();
 await expect(page.locator('#scrollMapV2831')).toHaveCount(0);
 expect(await page.evaluate(()=>autoNavigationV2830?.goal)).toBe(selected);
 await expect.poll(()=>page.evaluate(()=>Math.hypot(FLAT_WORLD.player.x-getWorldMapConfig().spawn.x,FLAT_WORLD.player.y-getWorldMapConfig().spawn.y))).toBeGreaterThan(10);
 expect(await page.evaluate(()=>FLAT_WORLD.colliders.some(c=>Math.hypot(FLAT_WORLD.player.x-c.x,FLAT_WORLD.player.y-c.y)<c.radius+(FLAT_WORLD.player.r||17)-.5))).toBe(false);
 expect(errors).toEqual([]);
});

test('faction panorama failures keep legacy interaction and successful region changes retain only two decoded scenes',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await boot(page);
 await page.route(`**/${imageFile('human_peaks')}*`,r=>r.abort());
 await page.evaluate(()=>applyWorldMapLayout('human_peaks',true));
 await expect.poll(()=>page.evaluate(()=>SCROLL_ART_V2831.wildSceneFailed?.human_peaks)).toBe(true);
 const fallback=await page.evaluate(()=>{
  const p=FLAT_WORLD.pois.find(p=>p.id==='faction_zhandian');
  for(let i=0;i<10;i++)loadScrollArtV2831();
  return {ready:wildSceneReadyV286898(),door:wildSceneDoorV286898(p),box:!!poiTapBoxV2904(p),
   poiCollider:FLAT_WORLD.colliders.some(c=>c.type==='poi'&&c.id===p.id),route:!!planNavigationV2830(p)?.length};
 });
 expect(fallback).toEqual({ready:false,door:null,box:true,poiCollider:true,route:true});
 expect(requests.filter(u=>u.includes(imageFile('human_peaks')))).toHaveLength(1);
 for(const region of ['human_valleys','demon_domain','immortal_domain','human_valleys']){
  await enter(page,region);
  const cache=await page.evaluate(()=>({keys:Object.keys(SCROLL_ART_V2831.wildScenes),region:currentRegion}));
  expect(cache.keys.length).toBeLessThanOrEqual(2);expect(cache.keys).toContain(region);
 }
});
