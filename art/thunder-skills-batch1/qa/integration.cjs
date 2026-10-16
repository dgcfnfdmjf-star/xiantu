'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out=path.resolve('output/playwright/thunder-integration');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1000,height:900},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1000,height:900}}});
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await context.newPage(),errors=[],rows=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/xiantu-v2831-scroll/game-v2762.html');await page.locator('#xiantuSafeBootButton').click();await page.locator('#introSkipV2860').click();await page.waitForFunction(()=>document.documentElement.classList.contains('xiantu-v2762-ready'));
 fs.writeFileSync(path.join(out,'game-snapshot.txt'),await page.locator('body').ariaSnapshot());
 await page.evaluate(()=>{startGame();closeWorldOverlay();resetRuntimeState();player=createDefaultPlayer();player.name='雷系接入验收';window.castMarks=[];const base=InkSkillFxV2854.draw;InkSkillFxV2854.draw=function(c,j,t){if(InkSkillFxV2854.thunderBatch.definition(j.profile.name))castMarks.push({name:j.profile.name,t,hitAt:j.hitAt,to:j.to,ground:j.toGround,parts:InkSkillFxV2854.thunderBatch.sample(j,t).map(p=>p.layer)});return base.apply(this,arguments)};['雷法','惊雷闪','裂地奔雷'].forEach(n=>InkSkillFxV2854.thunderBatch.prepare(n));});
 await page.waitForFunction(()=>['雷法','惊雷闪','裂地奔雷'].every(n=>InkSkillFxV2854.thunderBatch.ready(n)));
 for(const [width,height]of [[1000,900],[390,844],[844,390]]){
  await page.setViewportSize({width,height});
  for(const name of ['雷法','惊雷闪','裂地奔雷']){
   await page.evaluate(name=>{resetRuntimeState();player.mp=300;player.hp=200;player.skills=[{...SKILLS.find(s=>s.name===name)}];player.skillLoadoutV212={thunder:[name]};player.skillLoadoutInitializedV212=true;setBattlePresentationV2756('report');startCombat({name:'苍山野狼',hp:50000,maxHp:50000,atk:1,def:10,gold:1,exp:1,_realmLevel:0,_realmPhase:0});currentEnemy.atk=1;currentEnemy.def=10;castMarks.length=0;},name);
   await page.waitForTimeout(180);const before=await page.evaluate(()=>({mp:player.mp,hp:currentEnemy.hp}));await page.evaluate(()=>combat('skill',0));await page.waitForTimeout(385);
   await page.locator('#combatArena').screenshot({path:path.join(out,`combat-${name}-${width}.png`)});
   await page.waitForTimeout(450);const after=await page.evaluate(()=>({mp:player.mp,hp:currentEnemy.hp,marks:castMarks,overflow:document.documentElement.scrollWidth>innerWidth}));
   assert.equal(before.mp-after.mp,{雷法:20,惊雷闪:25,裂地奔雷:38}[name]);assert(after.hp<before.hp);assert(after.marks.some(m=>m.parts.includes('impact')),'actual hit draws impact');assert(after.marks.some(m=>m.parts.includes('body')),'actual cast draws unique body');assert(!after.overflow);
   rows.push({name,width,height,spent:before.mp-after.mp,damage:before.hp-after.hp,hitAt:[...new Set(after.marks.map(m=>m.hitAt))],layers:[...new Set(after.marks.flatMap(m=>m.parts))],overflow:after.overflow});
  }
 }
 await page.evaluate(()=>resetRuntimeState());assert.equal(await page.locator('.duel25-stage').count(),0);
 const trial=await context.newPage();trial.on('pageerror',e=>errors.push(e.message));await trial.goto('http://127.0.0.1:8782/xiantu-v2831-scroll/battle-25d-preview.html');await trial.waitForFunction(()=>scene?.ready);
 await trial.evaluate(()=>['雷法','惊雷闪','裂地奔雷'].forEach(n=>InkSkillFxV2854.thunderBatch.prepare(n)));await trial.waitForFunction(()=>['雷法','惊雷闪','裂地奔雷'].every(n=>InkSkillFxV2854.thunderBatch.ready(n)));
 const quality=await trial.evaluate(()=>{const results=[];for(const name of ['雷法','惊雷闪','裂地奔雷'])for(const q of ['rich','light','reduced']){const j={profile:InkSkillFxV2854.profile(name),from:{x:250,y:205},to:{x:493,y:210},fromGround:{x:242,y:305},toGround:{x:493,y:278},duration:1100,hitAt:310,arriveAt:310,light:q==='light',reduced:q==='reduced'};const parts=[350,500,600].flatMap(t=>InkSkillFxV2854.thunderBatch.sample(j,t));results.push({name,q,layers:[...new Set(parts.map(p=>p.layer))]})}return results});
 for(const r of quality){assert(r.layers.includes('impact'));if(r.q!=='rich')assert(!r.layers.includes('residue'));if(r.q==='reduced')assert(!r.layers.includes('body'));}
 const broken=await context.newPage();broken.on('pageerror',e=>errors.push(e.message));await broken.route('**/thunder_strike_unique_body.png',r=>r.abort());await broken.goto('http://127.0.0.1:8782/xiantu-v2831-scroll/battle-25d-preview.html');await broken.waitForFunction(()=>scene?.ready);await broken.evaluate(()=>InkSkillFxV2854.thunderBatch.prepare('雷法'));await broken.waitForTimeout(300);assert.equal(await broken.evaluate(()=>InkSkillFxV2854.thunderBatch.ready('雷法')),false);
 await broken.evaluate(()=>{scene.act('player','thunder','雷法');scene.hit('enemy',10)});await broken.waitForTimeout(400);await broken.screenshot({path:path.join(out,'missing-texture-fallback.png')});
 assert.equal(errors.length,0,JSON.stringify(errors));const video=page.video();await context.close();await video.saveAs(path.join(out,'combat-recording.webm'));await browser.close();fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({rows,quality,errors,resetClean:true,missingTextureFallback:true,scope:'Chromium emulation; real equipped casts on disposable saves; external requests blocked'},null,2));console.log('PASS real combat at desktop/portrait/landscape, quality tiers, fallback and reset');
})().catch(e=>{console.error(e);process.exit(1)});
