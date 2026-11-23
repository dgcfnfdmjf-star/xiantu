'use strict';
// Use the built island with its normal level-2 ending, in a fresh test profile.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {chromium} = require(process.env.PW_MODULE || 'playwright');
const phase = process.argv[2];
const site = path.resolve(process.argv[3]);
const out = path.join(__dirname, phase);
const key = 'healingGarden.kittens.v1';
const report = { phase, site, started: new Date().toISOString(), errors: [], sampled: {}, conditions: {headless: true, width: 650, height: 820, deviceScaleFactor: 1, mobile: true, touch: true, gl: 'ANGLE SwiftShader', seed: 125431, motion: 'no-preference', syntheticSave: true} };
fs.mkdirSync(out, {recursive:true});
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  const file = path.join(site, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(site + path.sep) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, {'content-type': {'.html':'text/html; charset=utf-8', '.glb':'model/gltf-binary', '.mp3':'audio/mpeg'}[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium', args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 try {
 report.browser = browser.version();
 const ctx = await browser.newContext({viewport: {width:report.conditions.width,height:report.conditions.height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page = await ctx.newPage(); page.setDefaultTimeout(90000); page.setDefaultNavigationTimeout(90000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error' && !m.text().includes('404')) report.errors.push(m.text())});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.addInitScript(({key,seed})=>{
   let s=seed; Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
   if(sessionStorage.getItem('l2-seeded'))return;
   sessionStorage.setItem('l2-seeded','1');
   localStorage.setItem('hg_level2_unlocked','1');
   localStorage.setItem(key,JSON.stringify({level:2,total:19,ended:false,caught:{orange:3,calico:2,black:2,white:1,tabby:2},companions:{}}));
   localStorage.setItem('healingGarden.journey.v1', JSON.stringify({completed:[1]}));
 }, {key,seed:report.conditions.seed});
 const origin='http://127.0.0.1:'+server.address().port;
 const navigation = await page.goto(origin, {waitUntil:'domcontentloaded'});
 report.htmlSha256 = createHash('sha256').update(await navigation.body()).digest('hex');
 if (process.env.EXPECT_HTML_SHA) assert.equal(report.htmlSha256, process.env.EXPECT_HTML_SHA);
 console.log('served HTML SHA-256',report.htmlSha256);
 await page.locator('#start').click();
 await page.waitForFunction(()=>window.__kittens && __kittens.state().level===2 && __kittens.list.some(k=>k.catVisual),null,{timeout:60000});
 report.graphics = await page.evaluate(()=>{
   const canvas = [...document.querySelectorAll('canvas')].find(c=>c.clientWidth>=innerWidth);
   const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
   const ext=gl.getExtension('WEBGL_debug_renderer_info');
   return {width:canvas.width,height:canvas.height,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
 });
 async function tapKit() {
   const point = await page.evaluate(()=>{
     const selectable=(k)=>!k.dead && k.state!=='hug' && k.state!=='hop';
     return __kittens.list.filter(selectable).map(k=>({...__kittens.screenOf(k), state:k.state, kind:k.kind.id}))
       .filter(p=>p.x>10 && p.y>120 && p.x<innerWidth-10 && p.y<innerHeight-120 && document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS')
       .sort((a,b)=>Number(b.state==='lure'||b.state==='play')-Number(a.state==='lure'||a.state==='play'))[0];
   });
   if(point){ await page.touchscreen.tap(point.x,point.y); console.log('tap',point); }
 }
 for(let i=0;i<60;i++) {
   if(await page.evaluate(()=>__kittens.state().total>=20))break;
   await tapKit(); await page.waitForTimeout(150);
 }
 await page.waitForFunction(()=>__l2Cutscene.stage().staged && __l2Cutscene.stage().blender>=4,null,{timeout:30000});
 console.log('entered real cutscene');
 await page.evaluate(()=>__l2Cutscene.pause());
 report.saveAtClear = await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert(report.saveAtClear.ended && report.saveAtClear.total>=20);
 async function at(t) {
  await page.evaluate(t=> { __l2Cutscene.seek(t); }, t);
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  return page.evaluate(()=>{
    const cs=__l2Cutscene,s=cs.stage();
    return {time:cs.time(),beat:cs.beat(),cast:s.cast,actors:s.actors,blender:s.blender,shot:s.shot,rig:s.rig,sit:cs.sit(),frame:cs.frame().cats,tail:cs.tails(),eyes:cs.eyes().map(x=>({visible:x.visible,px:x.px}))};
  });
 }
 const sitTime=21.3, walkTime=27.5;
 const times=[9.65,11,13,14.5,16.5,17.6,18.5,sitTime,walkTime,36.4,40.7,42,49];
 for(const t of times) {
  const s=await at(t);
  report.sampled[t]=s;
  if(t===36.4 || t===40.7) await page.screenshot({path:path.join(out, t===36.4?"seated-ring.png":"walking-ring.png")});
  if(t===sitTime || t===walkTime) {
   assert.equal(s.actors,7);
   await page.screenshot({path:path.join(out, t===sitTime?'seated.png':'walking.png')});
  }
 }
 const states=Object.values(report.sampled);
 const seated=report.sampled[sitTime];
 assert(seated.frame.every(m=>m.stand===0), JSON.stringify(seated.frame.map(m=>m.stand)));
 assert(report.sampled[walkTime].rig[2].running);
 for(let i=0;i<7;i++) {
   assert(states.some(s=>s.sit[i].visible && s.frame[i].moving && (s.rig[i]?s.rig[i].running:s.sit[i].legs>0.02)), 'missing walking cat '+i);
   assert(states.some(s=>s.sit[i].visible && !s.frame[i].moving && s.frame[i].stand===0), 'missing seated cat '+i);
 }
 // Sample the real presentation's render cadence, after all four coats have loaded.
 await at(sitTime);
 report.frameIntervals=await page.evaluate(()=>new Promise(resolve=>{
   const intervals=[];let prev=performance.now();
   const sample=now=>{intervals.push(+(now-prev).toFixed(2));prev=now;if(intervals.length>=18)resolve(intervals.slice(1));else requestAnimationFrame(sample)}; requestAnimationFrame(sample);
 }));
 await page.evaluate(()=>__l2Cutscene.resume());
 await page.locator('#l2csSkip').tap();
 await page.waitForTimeout(800);
 await page.locator('#l2csGo').tap();
 await page.locator('#kitStay').click();
 report.saveAfterStay=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert.deepEqual(report.saveAfterStay,report.saveAtClear);
 await page.reload();
 await page.locator('#start').click();
 await page.waitForFunction(()=>__kittens.state().level===2);
 report.afterReload=await page.evaluate(key=>({state:__l2Cutscene.state(),saved:JSON.parse(localStorage.getItem(key)),journey:JSON.parse(localStorage.getItem('healingGarden.journey.v1'))}),key);
 assert.equal(report.afterReload.state,'idle');
 assert.deepEqual(report.afterReload.saved,report.saveAtClear);
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log(JSON.stringify({browser:report.browser,cast:seated.cast,coats:seated.blender,walk:walkTime,sit:sitTime,saved:report.saveAtClear,pass:true}));
 } finally {
  report.finished=new Date().toISOString();
  fs.writeFileSync(path.join(out,'raw-'+Date.now()+'.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();server.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
