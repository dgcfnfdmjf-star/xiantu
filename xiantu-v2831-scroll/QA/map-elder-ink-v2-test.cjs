'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const asset='art/npc/map-elder-ink-v2.webp';
function scene(){
 const f=require('./v2858-dom-fixture.cjs')(root),images=[],calls=[];
 f.c.console.log=()=>{};const OriginalImage=f.c.Image;
 f.c.Image=class extends OriginalImage{
  constructor(){super();images.push(this);this.srcWrites=0;}
  set src(value){this.srcWrites++;super.src=value;}
  get src(){return super.src;}
 };
 for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
 const ctx=f.ids.get('worldCanvas').getContext('2d');
 for(const name of ['drawImage','ellipse','lineTo','save','restore'])ctx[name]=(...args)=>calls.push({name,args});
 f.c.elderTestContext=ctx;
 return {f,images,calls,elders:()=>images.filter(im=>im.src==='./'+asset),draw(action='npc_elder'){
  calls.length=0;f.c.elderTestNpc={action};f.run('drawMapNpcV2863(elderTestContext,elderTestNpc)');return calls;
 }};
}
const fallback=calls=>{
 a.equal(calls.filter(c=>c.name==='drawImage').length,0,'pending or failed elder keeps its local fallback');
 a(calls.some(c=>c.name==='lineTo'),'fallback still contains a visible body');
 a.equal(calls.filter(c=>c.name==='save').length,calls.filter(c=>c.name==='restore').length,'canvas state remains balanced');
};

// Startup preload and an independent first NPC draw must converge on one request.
for(const first of ['preload','draw']){
 const s=scene(),{f}=s;
 for(const action of ['npc_mentor','npc_beast','npc_trader','yewuji_v2810','traveller'])s.draw(action);
 a.equal(s.elders().length,0,'other NPC roles do not request elder art');
 if(first==='preload')f.run('loadScrollArtV2831()');else fallback(s.draw());
 a.equal(s.elders().length,1,first+' creates one elder image');
 const image=s.elders()[0],created=s.images.length,state=f.run('JSON.stringify(player)');
 for(let i=0;i<30;i++){f.run('loadScrollArtV2831()');fallback(s.draw());}
 a.equal(s.images.length,created,'pending frames and repeated preloads allocate no new images');
 a.equal(image.srcWrites,1,'pending frames never reassign the URL');

 if(first==='preload'){
  image.complete=true;image.naturalWidth=348;image.naturalHeight=516;image.onload();
  const calls=s.draw(),draws=calls.filter(c=>c.name==='drawImage');
  a.equal(draws.length,1,'ready elder draws exactly one sprite');
  a.equal(draws[0].args[0],image,'rendering uses the preloaded image instance');
  a.deepEqual(draws[0].args.slice(1),[-29,-62,58,86],'original body box and foot anchor are retained');
  a.equal(calls.filter(c=>c.name==='lineTo').length,0,'ready sprite does not also draw the polygon body');
  a.deepEqual(calls.filter(c=>c.name==='ellipse').map(c=>c.args),[[0,23,25,7,0,0,Math.PI*2]],'original ground shadow is retained');
  a.equal(calls.filter(c=>c.name==='save').length,1);a.equal(calls.filter(c=>c.name==='restore').length,1);
  for(const action of ['npc_mentor','npc_beast','npc_trader','yewuji_v2810','traveller']){
   a.equal(s.draw(action).filter(c=>c.name==='drawImage').length,0,action+' does not use elder art');
  }
 }else{
  image.complete=true;image.onerror();
  a.equal(f.run('SCROLL_ART_V2831.mapElderInkV2'),null);
  for(let i=0;i<30;i++){f.run('loadScrollArtV2831()');fallback(s.draw());}
  a.equal(s.elders().length,1,'failed art is not retried every frame');
 }
 a.equal(image.srcWrites,1);a.equal(image.onload,null);a.equal(image.onerror,null);
 a.equal(f.run('JSON.stringify(player)'),state,'rendering and image completion do not change player state');
 a.equal(f.errors.length,0,JSON.stringify(f.errors));
}
a(fs.existsSync(path.join(root,asset)),'new map artwork is included with the website');
console.log('PASS elder preload/draw request sharing, pending/error fallback, sprite-only ready path, anchors and NPC role isolation');
