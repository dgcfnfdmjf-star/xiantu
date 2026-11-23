const { strict: assert } = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const {chromium}=require('playwright');
const fixture=require('../../../../games/healing-game/tests/cat-models-fixture.cjs');
const id=process.argv[2], site=path.resolve(process.argv[3]);
const out=path.join(__dirname,id); fs.mkdirSync(out,{recursive:true});
const report={run:id,date:new Date().toISOString(),site,method:'Actual level via start button, seeded chapter-5 completion in fresh profile, real screen-coordinate clicks; game frame loop. Detail views use a diagnostic close-up camera posed relative to the orange cat on the same paused chapter frame; full frames use game camera.', viewport:{width:1000,height:820}, logs:[],errors:[]};
function record(key,value){report[key]=value;fs.writeFileSync(path.join(out,'run.json'),JSON.stringify(report,null,2));console.log(key,typeof value==='string'?value:'recorded');}
(async()=>{
 const srv=await fixture.server({root:site}); const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 try{
  const c=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,reducedMotion:'no-preference'});
  await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await c.addInitScript(()=>{let seed=392;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   if(sessionStorage.l6Evidence)return;sessionStorage.l6Evidence='1';localStorage.setItem('hg_level2_unlocked','1');localStorage.setItem('healingGarden.kittens.v1',JSON.stringify({total:20,ended:true,level:5,caught:{orange:4},companions:{orange:1}}));localStorage.setItem('healingGarden.journey.v1',JSON.stringify({completed:[1,2,3,4,5],lamps:[true,true,true],chimes:{round:3},lotus:{light:[3,3,3,3,3,3]}}));localStorage.setItem('xiantu_save','UNRELATED_FIXTURE');});
  const p=await c.newPage(); p.on('pageerror',e=>report.errors.push(e.message)); p.on('console',m=>{if(m.type()==='error')report.logs.push(m.text());});
  const url=srv.url+'?level=6&l5cutscene=0&l6cutscene=0'; await p.goto(url);await p.locator('#start').click();
  const debug=()=>p.evaluate(()=>SnowChapter.debug());const kids=()=>p.evaluate(()=>SnowChapter.debug().kittens);
  const waitModels=()=>p.waitForFunction(()=>window.SnowChapter?.isActive()&&SnowChapter.debug().kittens.filter(k=>k.model).length===4,null,{timeout:120000});
  await waitModels();
  record('browser',browser.version());record('start',await debug());record('initialXP',await p.evaluate(()=>__journey.state().xp));
  const tap=async(name)=>{
   const pos=await p.evaluate(name=>{const w=GardenClip.world, o=w.island.getObjectByName('snow-'+name),q=o.getWorldPosition(new THREE.Vector3());q.y+=.25;q.project(w.camera);const x=(q.x+1)*innerWidth/2,y=(1-q.y)*innerHeight/2;return {x,y,tag:document.elementFromPoint(x,y)?.tagName};},name);assert.equal(pos.tag,'CANVAS',`${name} covered at ${JSON.stringify(pos)}`);await p.mouse.click(pos.x,pos.y);};
  await p.evaluate(()=>{window.__snowMotionRecord={samples:[],elapsed:0,paused:false,walkStart:null};const a=__snowMotionRecord, orig=SnowChapter.update;
   SnowChapter.update=function(dt,t){if(a.paused)return;a.elapsed+=dt; const result=orig.call(this,dt,t);if(!this.isActive())return result;
    const state=this.debug(),k=state.kittens[0],w=GardenClip.world,root=w.island.getObjectByName('snow-kitten-orange'),bones={};root.traverse(n=>{if(n.isBone&&/^(Body|Head|Tail|Chest|Spine|FrontPaw)/.test(n.name))bones[n.name]=[...n.position.toArray(),...n.quaternion.toArray()];});
    if(a.samples.length<2400)a.samples.push({time:a.elapsed,x:k.x,z:k.z,walk:k.walking,bones});if(k.walking&&a.walkStart===null)a.walkStart=a.elapsed;
    if(a.freezeWalkAfter&&k.walking&&a.elapsed-a.walkStart>=a.freezeWalkAfter)a.paused=true;return result;};});
  await p.waitForFunction(()=>__snowMotionRecord.elapsed>=1.4,null,{timeout:120000});
  const frame=async(name)=>{
   await p.evaluate(()=>{__snowMotionRecord.paused=true;});await p.screenshot({path:path.join(out,name+'.png'),timeout:90000});
   const box=await p.evaluate(()=>{const r=__catTestRenderer, w=GardenClip.world, camera=w.camera.clone(),root=w.island.getObjectByName('snow-kitten-orange');
    camera.clearViewOffset(); camera.zoom=1;camera.fov=31;camera.updateProjectionMatrix();const eye=new THREE.Vector3(1.35,.8,1.45),aim=new THREE.Vector3(0,.30,0);
    const original=r.render;r.render=function(scene,gameCamera){camera.position.copy(root.localToWorld(eye.clone()));camera.lookAt(root.localToWorld(aim.clone()));return original.call(this,scene,camera);};window.__endDetail=()=>r.render=original;
    return {target:'snow-kitten-orange',eye:eye.toArray(),aim:aim.toArray(),fov:camera.fov};});
   await p.waitForTimeout(420);await p.screenshot({path:path.join(out,name+'-detail.png'),timeout:90000});
   await p.evaluate(()=>{__endDetail();__snowMotionRecord.paused=false;});record(name+'DetailView',box);
  };
  await frame('sitting');
  await tap('lantern-0');await tap('lantern-1');
  assert.deepEqual((await debug()).lit,[true,true,false,false,false,false]);
  await p.evaluate(()=>__snowMotionRecord.freezeWalkAfter=3.0);await tap('kitten-orange');
  await p.waitForFunction(()=>__snowMotionRecord.paused,null,{timeout:120000});
  record('walk',await kids());assert.ok((await kids())[0].walking);await p.evaluate(()=>{__snowMotionRecord.freezeWalkAfter=0;});await frame('walking');
  record('frameTrace',await p.evaluate(()=>({renderer:(()=>{const gl=__catTestRenderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);})(),backing:[__catTestRenderer.domElement.width,__catTestRenderer.domElement.height],timestamps:__catTestFrames.slice()})));
  record('poseSamples',await p.evaluate(()=>__snowMotionRecord.samples));
  for(const [lantern,kind] of [[2,'calico'],[3,null],[4,'black'],[5,'tabby']]){await tap('lantern-'+lantern);assert.ok((await debug()).lit[lantern]);if(kind){await tap('kitten-'+kind);assert.ok((await kids()).find(k=>k.id===kind).walking);}}
  record('allRecruited',await kids());
  // Actual routes use dt capped by the main game loop, so software rasterizers may take longer than elapsed game time.
  await p.waitForFunction(()=>SnowChapter.debug().kittens.every(k=>!k.walking&&!k.marker&&Math.hypot(k.x-k.home[0],k.z-k.home[1])<.01),null,{timeout:360000});
  record('atCabin',await kids());
  if(await p.locator('#snowSkip').isVisible())await p.locator('#snowSkip').click();await p.waitForSelector('#snowEnding:not([hidden])',{timeout:90000});await p.locator('#snowStay').click();
  const state=()=>p.evaluate(()=>({xp:__journey.state().xp,journey:JSON.parse(localStorage.getItem('healingGarden.journey.v1')),unrelated:localStorage.getItem('xiantu_save')}));
  const prev=await state();record('firstCompletion',prev);assert.deepEqual(prev.journey.snow.home,['orange','calico','black','tabby']);assert.equal(prev.xp-report.initialXP,70);assert.equal(prev.unrelated,'UNRELATED_FIXTURE');
  await p.locator('#snowReplay').click();await tap('lantern-0');assert.deepEqual((await state()).journey,prev.journey);
  await p.reload();await p.locator('#start').click();await waitModels();const restored=await kids();assert.ok(restored.every(k=>!k.walking&&!k.marker&&Math.hypot(k.x-k.home[0],k.z-k.home[1])<.01));assert.equal(await p.locator('#snowEnding').isVisible(),false);assert.deepEqual(await state(),prev);record('saveNoticeOnReload',await p.evaluate(()=>Array.from(document.querySelectorAll('[role=alert]')).filter(e=>e.offsetWidth&&e.offsetHeight).map(e=>e.textContent)));
  record('reload',restored);assert.deepEqual(report.errors,[]);record('result','PASS');
 }finally{await browser.close();await srv.close();}
})().catch(e=>{record('failure',e.stack);process.exitCode=1;});
