const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);for(const file of ['definition.js','choreography.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'preview',file),'utf8'),ctx);
const {sample,definition:D}=ctx.window.AbsoluteZeroPreview;
assert.equal(JSON.stringify(D),JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname,'preview/effect-manifest.json'))).effects[0]));assert.deepEqual(fs.readFileSync(path.join(__dirname,'preview/effect-manifest.json')),fs.readFileSync(path.join(__dirname,'preview/effect-manifest.preview.json')));
for(const quality of ['rich','light','reduced'])for(const hit of [true,false])for(const freezeEnd of [0,420,1600,5000,Infinity]){
 for(let age=0;age<=6100;age+=5){
  const ps=sample(age,{hit,quality,freezeEnd});const shells=ps.filter(p=>['impact','sustain'].includes(p.layer));
  assert(shells.reduce((v,p)=>v+p.opacity,0)<=1.000001,'one shell silhouette');
  for(const p of ps){assert(p.frame>=0&&p.frame<D.layers[p.layer].frames);assert(p.opacity>0&&p.opacity<=1);assert(['origin','target','moving'].includes(p.anchor));if(p.layer==='body')assert.equal(p.width,D.display.body);if(['impact','sustain','residue'].includes(p.layer)){assert(hit&&age>=310);assert.equal(p.x,493);assert.equal(p.y,278)}if(quality==='reduced')assert.notEqual(p.anchor,'moving')}
  if(!hit&&age>=450)assert.equal(ps.length,0);if(hit&&Number.isFinite(freezeEnd)&&age>=Math.max(450,freezeEnd+300))assert.equal(ps.length,0);
 }
}
for(const age of [500,900,1500,4800,12000])assert(sample(age,{freezeEnd:Infinity}).some(p=>p.layer==='sustain'),'persistent shell cannot inherit cast timeout');
for(const age of [100,350,900,2000])assert.equal(sample(age,{targetPresent:false}).length,0);
for(const [layer,meta] of Object.entries(D.layers))assert(Array.from({length:1900},(_,age)=>sample(age)).flat().some(p=>p.layer===layer&&p.frame===meta.frames-1),layer+' final frame');
assert.equal(sample(430).filter(p=>p.layer==='sustain').length,0);const mid=sample(460).filter(p=>['impact','sustain'].includes(p.layer));assert.equal(mid.length,2);assert.equal(mid[0].pivotY,mid[1].pivotY);assert.equal(mid[0].width,mid[1].width);assert(Math.abs(mid[0].opacity+mid[1].opacity-1)<1e-9);
for(const age of [50,220,350,750]){const a=sample(age),b=sample(age,{scale:1.2,offsetX:12,offsetY:-9});for(let i=0;i<a.length;i++){assert(Math.abs(b[i].width-a[i].width*1.2)<1e-9);assert.equal(b[i].x,a[i].x+12);assert.equal(b[i].y,a[i].y-9)}}
console.log('PASS 30 quality/hit/freeze combinations, state-owned sustain, early release, target removal, shell crossfade, terminal frames, expiry, tuning and manifest parity');
