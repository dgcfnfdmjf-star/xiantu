#!/usr/bin/env python3
"""Promote approved plates and sampler; preserve all unrelated resources."""
from pathlib import Path
import hashlib,json,re,shutil
R=Path(__file__).resolve().parents[1];A=R/'art/sword-skills-batch1';P=A/'preview';G=R/'xiantu-v2831-scroll';dest=G/'sword-skills-batch1';dest.mkdir(exist_ok=True)
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
untouched={str(p.relative_to(G)):hashfile(p) for p in G.rglob('*') if p.is_file() and p.suffix in ['.png','.webp','.jpg'] and dest not in p.parents}
manifest=json.loads((P/'effect-manifest.json').read_text());hashes={}
for src in sorted(P.iterdir()):
 if src.is_file():shutil.copyfile(src,dest/src.name);hashes[src.name]=hashfile(src);assert hashes[src.name]==hashfile(dest/src.name)
sampler=(A/'sampler.js').read_text();sampler=sampler[sampler.index('function sampleSwordBatch'):sampler.index("if(typeof module")]
block='  // BEGIN SWORD BATCH1 GENERATED\n  const SWORD_BATCH='+json.dumps(manifest['effects'],ensure_ascii=False,separators=(',',':'))+';\n'+sampler+'  // END SWORD BATCH1 GENERATED\n'
p=G/'xiantu-v2855-skill-fx.js';s=p.read_text()
if '// BEGIN SWORD BATCH1 GENERATED' in s:s=re.sub(r'  // BEGIN SWORD BATCH1 GENERATED\n.*?  // END SWORD BATCH1 GENERATED\n',lambda _:block,s,flags=re.S)
else:s=s.replace('  // BEGIN SOLAR GENERATED CONFIG',block+'  // BEGIN SOLAR GENERATED CONFIG',1)
names={d['name'] for d in manifest['effects']};m=re.search(r'const ELEMENT_BATCH=(.*?);\n',s);defs=json.loads(m[1])
for d in defs:d['skills']=[n for n in d['skills'] if n not in names]
s=s[:m.start(1)]+json.dumps(defs,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
s=s.replace('function fireDefinition(name){return thunderDefinition(name)',"function fireDefinition(name){return SWORD_BATCH.find(d=>d.name===name)||thunderDefinition(name)")
s=s.replace("function batchFolder(D){return THUNDER_BATCH3", "function batchFolder(D){return SWORD_BATCH.includes(D)?'./sword-skills-batch1/':THUNDER_BATCH3")
s=s.replace('return D?(THUNDER_BATCH3.includes(D)?sampleThunderBatch3','return D?(SWORD_BATCH.includes(D)?sampleSwordBatch(D,j,age):THUNDER_BATCH3.includes(D)?sampleThunderBatch3')
marker='  const fireBatch={definitions:FIRE_BATCH'
if 'const swordBatch=' not in s:s=s.replace(marker,"  const swordBatch={definitions:SWORD_BATCH,definition:name=>SWORD_BATCH.find(d=>d.name===name),prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample};\n"+marker)
s=s.replace('absoluteZero,fireBatch,fireBatch2','absoluteZero,swordBatch,fireBatch,fireBatch2')
# Falling sword enters above the target without painting through the battle HUD.
s=s.replace("const D=fireDefinition(j.profile.name),textures=fireBatchTextures.get(D.key);\n    c.save();c.beginPath();c.rect(0,0,j.width,j.clipBottom);", "const D=fireDefinition(j.profile.name),textures=fireBatchTextures.get(D.key);\n    const top=SWORD_BATCH.includes(D)?Math.min(85,j.clipBottom*.24):0;\n    c.save();c.beginPath();c.rect(0,top,j.width,Math.max(0,j.clipBottom-top));")
s=s.replace('opt.reduced&&elementDefinition(name)','opt.reduced&&(elementDefinition(name)||swordBatch.definition(name))')
p.write_text(s)
assert all(hashfile(G/name)==h for name,h in untouched.items())
(A/'runtime-promotion-audit.json').write_text(json.dumps({'status':'approved resources integrated; runtime validation pending','command':'python3 scripts/promote-sword-skills-batch1-vfx.py','source':'art/sword-skills-batch1/preview','sha256':hashes,'unchangedArt':untouched},ensure_ascii=False,indent=2)+'\n')
print('PASS identical promotion:',len(hashes),'files; unchanged art:',len(untouched))
