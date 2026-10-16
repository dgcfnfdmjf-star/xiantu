'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out=path.resolve('output/playwright/thunder-batch3-integration');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const context=await browser.newContext({viewport:{width:1000,height:900},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1000,height:900}}});await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await context.newPage(),errors=[],rows=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/xiantu-v2831-scroll/game-v2762.html');await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();await page.waitForFunction(()=>document.documentElement.classList.contains('xiantu-v2762-ready'));
 fs.writeFileSync(path.join(out,'initial-snapshot.txt'),await page.locator('body').ariaSnapshot());
 await page.evaluate(()=>{startGame();closeWorldOverlay();resetRuntimeState();window.marks=[];window.events=[];const b=InkSkillFxV2854.thunderBatch3,draw=InkSkillFxV2854.draw,state=b.drawState,notify=b.notify;const log=(j,t,kind)=>{if(b.definition(j.profile.name))marks.push({kind,name:j.profile.name,t,parts:b.sample(j,t).map(p=>p.id),ground:j.toGround,from:j.from,bounds:b.sample(j,t).map(p=>({left:p.x-p.width*p.pivotX,right:p.x+p.width*(1-p.pivotX),top:p.y-p.height*p.pivotY})),width:j.width})};InkSkillFxV2854.draw=function(c,j,t){log(j,t,'cast');return draw.apply(this,arguments)};b.drawState=function(c,j,t){log(j,t,'state');return state.apply(this,arguments)};b.notify=function(kind,d){events.push(kind);return notify(kind,d)};b.definitions.forEach(d=>b.prepare(d.name));});
 await page.waitForFunction(()=>InkSkillFxV2854.thunderBatch3.definitions.every(d=>InkSkillFxV2854.thunderBatch3.ready(d.name)));
 async function setup(name,set=true,enemy='苍山野狼'){
  await page.evaluate(({name,set,enemy})=>{resetRuntimeState();player=createDefaultPlayer();player.name='雷系验收';player.hp=1000;player.mp=1000;player.skills=[{...SKILLS.find(s=>s.name===name)}];player.skillLoadoutV212={thunder:[name]};player.skillLoadoutInitializedV212=true;if(name==='九霄雷云'){if(set)NEW_SETS_V2790['万象玄霆'].slots.forEach((slot,i)=>player.equipment[slot]=newGearNameV2790('万象玄霆',i,3));else player.equipment.weapon=newGearNameV2790('万象玄霆',0,1)}setBattlePresentationV2756('report');startCombat({name:enemy,hp:50000,maxHp:50000,atk:20,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});currentEnemy.atk=20;currentEnemy.def=10;marks.length=0;events.length=0;}, {name,set,enemy});await page.waitForTimeout(180);
 }
 for(const [width,height]of [[1000,900],[390,844],[844,390]]){
  await page.setViewportSize({width,height});
  for(const name of ['闪电链','万雷噬狱','雷神附体','九霄雷云']){
   await setup(name);const spent=await page.evaluate(()=>{const mp=player.mp;combat('skill',0);return mp-player.mp});assert.equal(spent,{闪电链:30,万雷噬狱:68,雷神附体:45,九霄雷云:55}[name]);
   await page.waitForTimeout(390);await page.locator('#combatArena').screenshot({path:path.join(out,`cast-${name}-${width}.png`)});await page.waitForTimeout(520);
   const result=await page.evaluate(()=>({hp:currentEnemy.hp,marks,events,overflow:document.documentElement.scrollWidth>innerWidth}));assert(!result.overflow);assert(result.marks.some(m=>m.parts.includes('body')),name+' body');
   if(name!=='闪电链')assert(result.marks.some(m=>m.kind==='state'&&m.t>700&&m.parts.includes('body')),name+' persistent body');
   if(name==='雷神附体')assert(result.events.includes('reflect'),'real incoming hit triggers reflect');
   await page.locator('#combatArena').screenshot({path:path.join(out,`state-${name}-${width}.png`)});rows.push({name,width,height,spent,events:[...new Set(result.events)],layers:[...new Set(result.marks.flatMap(m=>m.parts))]});
  }
 }
 await page.setViewportSize({width:1000,height:900});await setup('九霄雷云',false);await page.evaluate(()=>combat('skill',0));await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>events.includes('domain')),false);assert.equal(await page.evaluate(()=>marks.some(m=>m.kind==='state')),false);
 // Exercise three authoritative ticks through real actions; visuals must not change the pool.
 await setup('万雷噬狱');await page.evaluate(()=>combat('skill',0));await page.waitForTimeout(400);
 const ticks=[];for(let i=0;i<3;i++){ticks.push(await page.evaluate(()=>{isPlayerTurn=true;const before=currentEnemy.hp,damage=currentEnemy.thunderDomainDamage;combat('attack');return {loss:before-currentEnemy.hp,damage,turns:currentEnemy.thunderDomainTurns}}));await page.waitForTimeout(900)}
 ticks.forEach((t,i)=>{assert.equal(t.loss,t.damage);assert.equal(t.turns,2-i)});assert.equal(await page.evaluate(()=>events.filter(e=>e==='tick').length),3);
 // Portrait fallback must retain real state too.
 await setup('万雷噬狱',true,'未知访客');assert.equal(await page.locator('.duel25-stage').count(),0,'unsupported actor uses portrait renderer');await page.evaluate(()=>combat('skill',0));await page.waitForFunction(()=>marks.some(m=>m.kind==='state'&&m.t>1100&&m.parts.includes('body')));assert(await page.evaluate(()=>marks.filter(m=>m.kind==='state').every(m=>m.bounds.every(p=>p.left>=0&&p.right<=m.width))),'portrait status fits canvas edges');await page.locator('#combatArena').screenshot({path:path.join(out,'portrait-fallback.png')});

 // Resume authentic status without replaying the cast or inventing events.
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await page.evaluate(()=>{marks.length=0});await page.setViewportSize(viewport);await page.waitForTimeout(350);
  assert(await page.evaluate(()=>marks.some(m=>m.kind==='state'&&m.parts.includes('body'))),'resize restores portrait status');
  assert(await page.evaluate(()=>marks.filter(m=>m.kind==='state').every(m=>m.parts.every(p=>p==='body'))),'resize must not replay impact');
 }
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));marks.length=0});
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>marks.length),0,'no background draws');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(300);
 assert(await page.evaluate(()=>marks.some(m=>m.kind==='state'&&m.parts.includes('body'))),'foreground restores status');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);assert(await page.evaluate(()=>InkSkillFxV2854.inspect().raf),'reduced motion retains status');
 await page.evaluate(()=>{currentEnemy={...currentEnemy};marks.length=0});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>marks.length),0,'replacement enemy clears old status');assert.equal(await page.evaluate(()=>InkSkillFxV2854.inspect().raf),false);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>resetRuntimeState());assert.equal(await page.locator('.duel25-stage').count(),0);
 const trial=await context.newPage();trial.on('pageerror',e=>errors.push(e.message));
 await trial.addInitScript(()=>{window.pendingDraws=new Set();const raf=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window);window.requestAnimationFrame=fn=>{let id;id=raf(t=>{pendingDraws.delete(id);fn(t)});if(fn.name==='draw')pendingDraws.add(id);return id};window.cancelAnimationFrame=id=>{pendingDraws.delete(id);cancel(id)}});
 await trial.goto('http://127.0.0.1:8782/xiantu-v2831-scroll/battle-25d-preview.html');await trial.waitForFunction(()=>scene?.ready);
 for(const name of ['闪电链','万雷噬狱','雷神附体','九霄雷云']){await trial.locator('#skillSelect').selectOption(name);await trial.locator('#castSelected').click();await trial.waitForTimeout(1000)}
 await trial.locator('#skillSelect').selectOption('万雷噬狱');await trial.locator('#castSelected').click();await trial.waitForTimeout(1000);await trial.evaluate(()=>{window.stateParts=[];const b=InkSkillFxV2854.thunderBatch3,draw=b.drawState;b.drawState=function(c,j,t){stateParts.push(b.sample(j,t).map(p=>p.id));return draw.apply(this,arguments)}});
 assert.equal(await trial.evaluate(()=>pendingDraws.size),1);
 for(let i=0;i<3;i++){
  await trial.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));stateParts.length=0});await trial.waitForTimeout(100);assert.equal(await trial.evaluate(()=>pendingDraws.size),0);assert.equal(await trial.evaluate(()=>stateParts.length),0);
  await trial.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))});await trial.waitForTimeout(150);assert.equal(await trial.evaluate(()=>pendingDraws.size),1);
  assert(await trial.evaluate(()=>stateParts.some(parts=>parts.includes('body'))));assert(await trial.evaluate(()=>stateParts.every(parts=>parts.every(p=>p==='body'))),'duel resume must not replay cast');
 }
 await trial.locator('#thunderTurn').click();assert.equal(await trial.evaluate(()=>state.thunderDomainTurns),2);await trial.locator('#clearThunder').click();assert.equal(await trial.evaluate(()=>state.thunderDomainTurns),0);
 const broken=await context.newPage();broken.on('pageerror',e=>errors.push(e.message));await broken.route('**/thunder_prison_body.png',r=>r.abort());await broken.goto('http://127.0.0.1:8782/xiantu-v2831-scroll/battle-25d-preview.html');await broken.waitForFunction(()=>scene?.ready);await broken.locator('#skillSelect').selectOption('万雷噬狱');await broken.locator('#castSelected').click();await broken.waitForTimeout(1200);assert.equal(await broken.evaluate(()=>InkSkillFxV2854.thunderBatch3.ready('万雷噬狱')),false);await broken.screenshot({path:path.join(out,'missing-texture-fallback.png')});
 assert.equal(errors.length,0,JSON.stringify(errors));const video=page.video();await context.close();await video.saveAs(path.join(out,'combat-recording.webm'));
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({rows,ticks,errors,ordinaryCloud:true,portraitFallback:true,trialControls:true,missingTextureFallback:true,portraitLifecycle:true,duelResumeSingleLoop:true,scope:'Real equipped skills, disposable player, external requests blocked; Chromium emulation'},null,2));console.log('PASS '+rows.length+' actual casts, actual ticks/reflection, ordinary/set cloud, portrait lifecycle, single-loop duel resume and trial controls');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
