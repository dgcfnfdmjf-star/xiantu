'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),html=fs.readFileSync(root+'/game-v2762.html','utf8');
const loader=html.match(/<script id="xiantu-v2762-loader">([\s\S]*?)<\/script>/)[1],introSource=html.match(/<script id="xiantu-intro-v2860">([\s\S]*?)<\/script>/)[1];
const build=html.match(/var expectedBuild='([^']+)'/)[1],cssBuild=build.replaceAll('.',''),files=JSON.parse(loader.match(/var files=(\[[^;]+\]);/)[1]);
const preload=html.match(/<link rel="preload" as="style"[^>]+>/)[0],href=preload.match(/href="([^"]+)"/)[1];
a(preload.includes('fetchpriority="high"'));a(html.indexOf(preload)<html.indexOf('<body'));a(loader.includes("link.href='"+href+"'"));a.equal(files.length,40);
function harness(styleBuild=cssBuild){
 const nodes=new Map(),added=[],evaluated=[],timers=new Map();let tid=0,stopped=0;
 const cls=()=>({add(){},remove(){},contains(){return false;}});
 function el(id){return {id,style:{},textContent:'',classList:cls(),addEventListener(k,f){this[k]=f;},appendChild(n){added.push(n);},remove(){}};}
 for(const id of ['xiantuSafeBootButton','xiantuSafeBootProgress','xiantuSafeBootError','xiantuSafeBoot','characterUtilityActions','bootMeterV286891','bootTipV286891'])nodes.set(id,el(id));
 const context={document:{getElementById:id=>nodes.get(id),createElement:tag=>({...el(''),tag}),querySelectorAll:()=>[],documentElement:{classList:cls()},body:{classList:cls(),appendChild(n){added.push(n);if(n.src)queueMicrotask(()=>{const name=n.src.split('/').pop().split('?')[0];evaluated.push(name);context.window.__xiantuBuildFilesV2814??={};context.window.__xiantuBuildFilesV2814[name]=build;n.onload();});}},head:{appendChild:n=>added.push(n)}},window:{XiantuIntroV2860:{start:()=>Promise.resolve(),wait:()=>Promise.resolve(),ready(){},dispose:()=>stopped++},addEventListener(){}},getComputedStyle:()=>({getPropertyValue:()=>styleBuild}),setTimeout:(f,ms)=>{const id=++tid;if(ms===0)queueMicrotask(f);else timers.set(id,{f,ms});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:queueMicrotask,Event:class{},location:{reload(){}},bootJevFriendsV2850(){}};
 vm.runInNewContext(loader,context);return {nodes,added,evaluated,timers,context,get stopped(){return stopped;}};
}
(async()=>{
 const h=harness();const done=h.nodes.get('xiantuSafeBootButton').click();
 a.equal(h.added.filter(n=>n.as==='script'||n.src).length,0,'script downloads wait for CSS');
 a.equal(h.added[0].rel,'stylesheet');a.equal(h.added[0].fetchPriority,'high');a.equal(h.added[0].href,href);
 await h.nodes.get('xiantuSafeBootButton').click();a.equal(h.added.length,1,'double tap does not duplicate bootstrap');
 h.added[0].onload();await done;a.deepEqual(h.evaluated,files,'original script evaluation order');
 const links=h.added.filter(n=>n.as==='script');a.equal(links.length,39);a(links.every(n=>n.fetchPriority==='high'));a(!links.some(n=>n.href.includes(files[0])),'core already preloaded in head');
 for(const mode of ['slow','automatic-retry','manual-retry','wrong-version']){
 const x=harness(mode==='wrong-version'?'old':cssBuild),p=x.nodes.get('xiantuSafeBootButton').click(),button=x.nodes.get('xiantuSafeBootButton');
 if(mode==='slow'){
   [...x.timers.values()].find(t=>t.ms===6000).f();a.equal(x.stopped,0);a.match(x.nodes.get('xiantuSafeBootProgress').textContent,/仍在加载/);a.equal(button.disabled,true);a.equal(x.added.length,1);
 }else if(mode.includes('retry')){
   const fail=x.added[0].onerror;fail();fail();a(!x.nodes.get('bootMeterV286891').value,'failed download adds no progress');a.equal(x.stopped,0);a.equal(x.added.length,1);
   [...x.timers.values()].find(t=>t.ms===750).f();a.equal(x.added.length,2);a.equal(x.added[1].href,href+'&retry=1');
   if(mode==='manual-retry'){
     x.added[1].onerror();a.equal(button.disabled,false);a.match(button.textContent,/重试继续/);
     const retry=button.onclick;retry();retry();a.equal(x.added.length,3,'repeated retry taps never duplicate pending downloads');a.equal(x.added[2].href,href+'&retry=2');
   }
 }
 x.added.at(-1).onload();await p;
 if(mode==='wrong-version'){
   a(!x.nodes.get('bootMeterV286891').value,'invalid CSS adds no progress');
   a.equal(x.evaluated.length,0);a.equal(x.added.filter(n=>n.as==='script').length,0);a.equal(x.stopped,1);a.match(x.nodes.get('xiantuSafeBootError').textContent,/样式版本不一致/);
 }else{a.deepEqual(x.evaluated,files);a.equal(x.stopped,1);a.equal(x.nodes.get('bootMeterV286891').value,100);a.equal(x.nodes.get('xiantuSafeBootError').style.display,'none');}
 }
 a(![...h.timers.values()].some(t=>t.ms===5000),'tip timer cleared after ready');
 // Intro behavior moved to v286891-test-intro.cjs.
 console.log('PASS CSS-first startup, slow/retry recovery, single evaluation order, invalid CSS prevents scripts');
})().catch(e=>{console.error(e);process.exitCode=1;});
