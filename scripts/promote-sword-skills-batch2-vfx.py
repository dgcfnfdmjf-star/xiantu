#!/usr/bin/env python3
"""Promote approved batch 2 textures without changing batch 1 or mechanics."""
from pathlib import Path
import hashlib,json,re,shutil
R=Path(__file__).resolve().parents[1];A=R/'art/sword-skills-batch2';P=A/'preview';G=R/'xiantu-v2831-scroll';dest=G/'sword-skills-batch2';dest.mkdir(exist_ok=True)
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
untouched={str(p.relative_to(G)):hashfile(p) for p in G.rglob('*') if p.is_file() and p.suffix in ['.png','.webp','.jpg'] and dest not in p.parents}
manifest=json.loads((P/'effect-manifest.json').read_text());hashes={}
for src in sorted(P.iterdir()):
 if src.is_file():shutil.copyfile(src,dest/src.name);hashes[src.name]=hashfile(src);assert hashes[src.name]==hashfile(dest/src.name)
sampler=(A/'sampler.js').read_text();sampler=sampler[sampler.index('function sampleSwordBatch'):sampler.index("if(typeof module")].replace('sampleSwordBatch','sampleSwordBatch2')
block='  // BEGIN SWORD BATCH2 GENERATED\n  const SWORD_BATCH2='+json.dumps(manifest['effects'],ensure_ascii=False,separators=(',',':'))+';\n'+sampler+'  // END SWORD BATCH2 GENERATED\n'
p=G/'xiantu-v2855-skill-fx.js';s=p.read_text()
if '// BEGIN SWORD BATCH2 GENERATED' in s:s=re.sub(r'  // BEGIN SWORD BATCH2 GENERATED\n.*?  // END SWORD BATCH2 GENERATED\n',lambda _:block,s,flags=re.S)
else:s=s.replace('  // BEGIN SOLAR GENERATED CONFIG',block+'  // BEGIN SOLAR GENERATED CONFIG',1)
names={d['name'] for d in manifest['effects']};m=re.search(r'const ELEMENT_BATCH=(.*?);\n',s);defs=json.loads(m[1])
for d in defs:d['skills']=[n for n in d['skills'] if n not in names]
s=s[:m.start(1)]+json.dumps(defs,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
s=s.replace('function fireDefinition(name){return SWORD_BATCH.find', 'function fireDefinition(name){return SWORD_BATCH2.find(d=>d.name===name)||SWORD_BATCH.find')
s=s.replace("function batchFolder(D){return SWORD_BATCH.includes", "function batchFolder(D){return SWORD_BATCH2.includes(D)?'./sword-skills-batch2/':SWORD_BATCH.includes")
s=s.replace('return D?(SWORD_BATCH.includes(D)?sampleSwordBatch','return D?(SWORD_BATCH2.includes(D)?sampleSwordBatch2(D,j,age):SWORD_BATCH.includes(D)?sampleSwordBatch')
marker='  const swordBatch={definitions:SWORD_BATCH'
if 'const swordBatch2=' not in s:s=s.replace(marker,"  const swordBatch2={definitions:SWORD_BATCH2,definition:name=>SWORD_BATCH2.find(d=>d.name===name),prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample};\n"+marker)
s=s.replace('absoluteZero,swordBatch,fireBatch','absoluteZero,swordBatch,swordBatch2,fireBatch')
s=s.replace('const top=SWORD_BATCH.includes(D)?','const top=(SWORD_BATCH.includes(D)||SWORD_BATCH2.includes(D))?')
s=s.replace('elementDefinition(name)||swordBatch.definition(name))','elementDefinition(name)||swordBatch.definition(name)||swordBatch2.definition(name))')
p.write_text(s)
assert all(hashfile(G/name)==h for name,h in untouched.items())
(A/'runtime-promotion-audit.json').write_text(json.dumps({'status':'approved resources integrated; runtime validation pending','command':'python3 scripts/promote-sword-skills-batch2-vfx.py','source':'art/sword-skills-batch2/preview','sha256':hashes,'unchangedArt':untouched},ensure_ascii=False,indent=2)+'\n')
print('PASS identical promotion:',len(hashes),'files; unchanged art:',len(untouched))
