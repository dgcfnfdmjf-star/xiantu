const assert=require('node:assert/strict');
const {sampleSwordBatch:sample}=require('../art/sword-skills-batch3/sampler.js');
const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../art/sword-skills-batch3/preview');
const defs=JSON.parse(fs.readFileSync(path.join(dir,'effect-manifest.json'))).effects;
const job={hitAt:310,actualHeal:20,guardAt:310,guardEnd:1600};
for(const d of defs){
 for(const L of Object.values(d.layers)){
  const buf=fs.readFileSync(path.join(dir,L.file));
  assert.equal(buf.readUInt32BE(16),L.frameWidth*L.frames);assert.equal(buf.readUInt32BE(20),L.frameHeight);
  assert.equal(buf[25],6,'RGBA PNG');
 }
 const before=JSON.stringify({d,job});
 for(let t=0;t<2500;t+=10){
  const parts=sample(d,job,t);
  for(const p of parts){assert(p.frame>=0&&p.frame<d.layers[p.layer].frames);assert(p.opacity>0&&p.opacity<=1);assert(['origin','target','moving'].includes(p.anchor));}
  if(t<310)assert(!parts.some(p=>p.layer==='impact'||p.id==='return'||p.id.startsWith('guard:')));
 }
 assert.equal(JSON.stringify({d,job}),before,'sampling must not mutate state');
 for(const flag of [{hidden:true},{exited:true},{alive:false},{sameTarget:false}])assert.deepEqual(sample(d,{...job,...flag},400),[]);
 for(const t of [-1,NaN,2300])assert.deepEqual(sample(d,job,t),[]);
 assert(!sample(d,{...job,hitAt:null,guardAt:null},400).some(p=>['impact','residue','support'].includes(p.layer)));
 const bodies=[140,210,280].map(t=>sample(d,job,t).find(p=>p.layer==='body'));
 assert(bodies.every(b=>b.width===bodies[0].width&&b.height===bodies[0].height),'travel never stretches');
 assert(bodies[0].x<bodies[2].x);
 for(const layer of ['telegraph','body','impact','residue']){
  const frames=new Set();for(let t=0;t<1000;t++)for(const p of sample(d,job,t))if(p.layer===layer)frames.add(p.frame);
  assert(frames.has(d.layers[layer].frames-1),layer+' final frame reachable');
 }
}
const blood=defs.find(d=>d.key==='blood_return'),guard=defs.find(d=>d.key==='astral_guard');
assert(!sample(blood,{...job,actualHeal:0},600).some(p=>p.id==='return'));
const a=sample(blood,job,500).find(p=>p.id==='return'),b=sample(blood,job,700).find(p=>p.id==='return');assert(a.x>b.x,'return travels toward caster');
assert(!sample(blood,job,820).some(p=>p.id==='return'));
assert.equal(sample(guard,job,900).filter(p=>p.id.startsWith('guard:')).length,3);
assert(!sample(guard,job,1820).some(p=>p.id.startsWith('guard:')));
assert(!sample(guard,{...job,guardAt:null},900).some(p=>p.id.startsWith('guard:')));
const still=t=>sample(guard,{...job,reduced:true},t).filter(p=>p.layer==='support').map(p=>[p.x,p.y,p.frame]);
assert.deepEqual(still(800),still(1200),'reduced motion stops orbit and internal cycle');
const moving=t=>sample(guard,job,t).filter(p=>p.layer==='support').map(p=>[p.x,p.y,p.frame]);assert.notDeepEqual(moving(800),moving(1200));
console.log('PASS: 3 asset sets; pure choreography, actual-heal gate, guard lifecycle, cancellation, fixed-size travel, final frames and reduced motion. Preview only, not combat regression.');
