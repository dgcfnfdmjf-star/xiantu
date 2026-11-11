'use strict';
// Capture the actual compressed GLBs through the standalone Three.js preview.
// Generated frames/video are review evidence, never inputs to runtime tests.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../../../..');
const out=path.resolve(process.env.CAT_EVIDENCE_DIR||path.join(repo,'output/playwright/cat-walk/evidence'));
fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'preview-cat-orange.html'),'utf8');
html=html.replace('// Read-only diagnostics for this standalone review page;', "Object.defineProperty(window,'__catReview',{get:()=>({renderer,scene,model,mixer,walkAction,walkClip,camera,controls})});\n  // Read-only diagnostics for this standalone review page;");
const mime={'.html':'text/html','.js':'text/javascript','.cjs':'text/javascript','.png':'image/png'};
let recordBrowser;
const server=http.createServer((q,r)=>{const name=new URL(q.url,'http://localhost').pathname;const file=path.resolve(root,'.'+name);if(!file.startsWith(root+'/')){r.writeHead(403);return r.end();}if(name==='/preview-cat-orange.html'){r.setHeader('Content-Type','text/html');return r.end(html);}fs.readFile(file,(e,b)=>{r.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});r.end(e?'missing':b)});});
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=recordBrowser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const ctx=await browser.newContext({viewport:{width:1000,height:900},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1000,height:900}}});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await page.goto(`http://127.0.0.1:${server.address().port}/preview-cat-orange.html`);
 for(const [kind,label] of [['orange','橘猫'],['calico','三花'],['black','小煤球'],['tabby','狸花']]){
  await page.locator(`[data-cat="${kind}"]`).click();await page.waitForFunction(k=>__catPreview.state==='ready'&&__catPreview.loadedCat===k,kind);
  await page.locator('[data-motion="sit"]').click();await page.locator('[data-view="front"]').click();
  await page.locator('canvas').screenshot({path:path.join(out,kind+'-sit-front.png')});
  await page.locator('[data-view="side"]').click();
  await page.locator('canvas').screenshot({path:path.join(out,kind+'-sit-side.png')});
  await page.locator('[data-motion="walk"]').click();await page.waitForTimeout(3400);
  for(const phase of [0,.25,.5,.75]){
   await page.evaluate(({phase,label})=>{const {walkAction,mixer,walkClip,renderer,scene,camera}=__catReview;walkAction.paused=true;walkAction.time=phase*walkClip.duration;mixer.update(0);scene.updateMatrixWorld(true);renderer.render(scene,camera);document.querySelector('.stage-label').textContent=label+' · Walk · '+Math.round(phase*100)+'%';},{phase,label});
   await page.locator('canvas').screenshot({path:path.join(out,kind+'-walk-'+String(Math.round(phase*100)).padStart(2,'0')+'.png')});
  }
  await page.locator('[data-motion="sit"]').click();
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{const video=page.video();await ctx.close();await video.saveAs(path.join(out,'four-cats-walk-browser.webm'));await browser.close();await new Promise(r=>server.close(r));}console.log('Browser evidence: '+out);
})().catch(async e=>{if(recordBrowser)await recordBrowser.close();if(server.listening)server.close();console.error(e);process.exitCode=1});
