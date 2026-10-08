/* Contract checks for the standalone resource candidate. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{}};vm.createContext(ctx);for(const name of ['definition.js','choreography.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'preview',name),'utf8'),ctx);
const {sample,definition:D}=ctx.window.IceButterflyPreview;
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'preview/effect-manifest.json')));
assert.equal(JSON.stringify(manifest.effects[0]),JSON.stringify(D));assert.deepEqual(fs.readFileSync(path.join(__dirname,'preview/effect-manifest.json')),fs.readFileSync(path.join(__dirname,'preview/effect-manifest.preview.json')));
for(const quality of ['rich','light','reduced'])for(const hit of [true,false]){
 const visited={};
 for(let t=0;t<=1000;t++){
  const parts=sample(t,{quality,hit});if(t>=900)assert.equal(parts.length,0);
  for(const p of parts){
   assert.ok(['origin','target','moving'].includes(p.anchor));assert.ok(p.opacity>0&&p.opacity<=1);assert.ok(p.frame>=0&&p.frame<D.layers[p.layer].frames);
   if(p.layer==='body')assert.equal(p.width,D.display.body);
   if(p.layer==='impact'||p.layer==='residue'){assert.ok(hit&&t>=310);assert.equal(p.x,493);assert.equal(p.y,278)}
   if(quality==='reduced'){assert.equal(p.rotation,0);assert.equal(p.trail,0);assert.notEqual(p.anchor,'moving')}
   assert.ok(p.trail<=D.trailLength);(visited[p.layer]??=new Set()).add(p.frame);
  }
  const ground=parts.filter(p=>p.layer==='impact'||p.layer==='residue');assert.ok(ground.reduce((sum,p)=>sum+p.opacity,0)<=1.000001);
 }
 if(quality==='rich'&&hit)for(const [name,spec] of Object.entries(D.layers))assert.ok(visited[name].has(spec.frames-1),name+' final frame unreachable');
 assert.equal(sample(899,{quality,hit}).length,0);
}
for(const t of [50,200,350,550]){
 const a=sample(t),b=sample(t,{offsetX:12,offsetY:-8}),c=sample(t,{scale:1.2});assert.equal(a.length,b.length);
 for(let i=0;i<a.length;i++){assert.ok(Math.abs(c[i].width-a[i].width*1.2)<1e-8);assert.ok(Math.abs(b[i].x-a[i].x-12)<1e-8);assert.ok(Math.abs(b[i].y-a[i].y+8)<1e-8)}
}
console.log('PASS manifest parity, six mode/hit combinations, fixed size, configured-hit gate, bounded trail, ground crossfade, terminal frames, expiry and tuning');
