'use strict';
const f=require('../../../../games/healing-game/tests/cat-models-fixture.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const server=await f.server({root:process.argv[2]});
 const browser=await f.browser(); const test=await f.fresh(browser,{randomSeed:125431,save:{level:2,total:0,ended:false,caught:{orange:3,black:2,calico:2,white:1,tabby:1},companions:{}}});
 try{
 const page=test.page; await f.start(test,server.url);
 await page.waitForFunction(()=>window.__catTestAmbient?.catVisual);
 const sample=()=>page.evaluate(()=>{
   const c=__catTestAmbient, v=new THREE.Vector3(); GardenCatModels.ambientHead(c,v);
   v.project(__catTestCamera);
   let visible=true; for(let p=c.catVisual;p;p=p.parent)visible=visible&&p.visible;
   return {visible,ambientHead:[Math.round((v.x+1)/2*innerWidth),Math.round((1-v.y)/2*innerHeight)],activeActors:__l2Cutscene.stage().actors,cast:__l2Cutscene.stage().cast,eyes:__l2Cutscene.eyes().map(e=>e.px)};
 });
 const before=await sample();
 await page.evaluate(()=>__l2Cutscene.play({ muted:true })); await page.waitForFunction(()=>__l2Cutscene.stage().staged && __l2Cutscene.stage().blender>=4);
 await page.evaluate(()=>{__l2Cutscene.pause();__l2Cutscene.seek(21.3);});await page.waitForTimeout(450);
 const seated=await sample();
 await page.evaluate(()=>__l2Cutscene.seek(40.7));await page.waitForTimeout(450);
 const walking=await sample();
 await page.evaluate(()=>__l2Cutscene.close()); await page.waitForTimeout(100);
 const after=await sample();
 console.log(JSON.stringify({before,seated,walking,after}));
 assert(before.visible && after.visible, 'ambient in live chapter');
 assert.equal(seated.activeActors,7);
 assert.equal(walking.activeActors,7);
 assert.equal(seated.visible,false,'decorative cat is hidden during the actual chapter-two film');
 assert.equal(walking.visible,false);
 } finally {await browser.close(); await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
