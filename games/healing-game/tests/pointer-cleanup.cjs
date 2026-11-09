// Pointer tables must be cleared on window blur and lostpointercapture (audit #5).
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'site/healing-game/index.html'),'utf8');
let checks=0;function test(name,run){run();checks++;console.log('PASS '+name)}
function fakeTarget(){const l={};return {l,addEventListener:(t,f)=>{(l[t]=l[t]||[]).push(f)},fire:(t,e)=>{(l[t]||[]).forEach(f=>f(e||{}))}};}
function camera(){
  const a=html.indexOf('  var pointers = {}, pCount = 0'),b=html.indexOf("  cvs.addEventListener('contextmenu'",a);
  assert.ok(a>0&&b>a,'V5 camera pointer block found');
  const cvs=fakeTarget(),win=fakeTarget(),taps=[];
  const run=new Function('renderer','window','cam','clamp','onTap','performance','mode',html.slice(a,b)+';return {s:function(){return {n:Object.keys(pointers).length,pCount:pCount,pinchDist:pinchDist};}};');
  const api=run({domElement:cvs},win,{tTh:0,tPhi:1,tZoom:1},(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),(x,y)=>taps.push([x,y]),{now:()=>0},'net');
  return {cvs,win,taps,state:api.s};
}
const down=(id,x)=>({pointerId:id,clientX:x,clientY:0,buttons:1});
test('camera registers blur and lostpointercapture cleanup',()=>{const c=camera();assert.equal(c.win.l.blur.length,1);assert.equal(c.cvs.l.lostpointercapture.length,1);});
test('window blur clears a stuck two-finger table',()=>{const c=camera();c.cvs.fire('pointerdown',down(1,0));c.cvs.fire('pointerdown',down(2,50));assert.equal(c.state().pCount,2);c.win.fire('blur');assert.deepEqual(c.state(),{n:0,pCount:0,pinchDist:0});c.cvs.fire('pointerdown',down(3,10));assert.equal(c.state().pCount,1,'next touch is single again');});
test('lostpointercapture drops that pointer without a tap',()=>{const c=camera();c.cvs.fire('pointerdown',down(1,0));c.cvs.fire('lostpointercapture',down(1,0));assert.equal(c.state().pCount,0);assert.equal(c.taps.length,0);});
test('a normal tap still fires once when lostpointercapture follows pointerup',()=>{const c=camera();c.cvs.fire('pointerdown',down(1,5));c.cvs.fire('pointerup',down(1,5));c.cvs.fire('lostpointercapture',down(1,5));assert.equal(c.taps.length,1);assert.equal(c.state().pCount,0);});
test('lotus trail lostpointercapture clears downs',()=>{const src=fs.readFileSync(path.join(ROOT,'src/lotus-chapter.js'),'utf8');const m=src.match(/addEventListener\('lostpointercapture',function\(e\)\{([^}]*(?:\}[^}]*)*?)\},true\)/);assert.ok(m,'lotus handler present');assert.match(m[1],/delete downs\[e\.pointerId\]/);assert.ok(html.includes("delete downs[e.pointerId];if(drag===e.pointerId)drag=null;if(!Object.keys(downs).length)trailGesture=false;"),'built HTML carries lotus cleanup');});
console.log(checks+' pointer cleanup checks passed');
