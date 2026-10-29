#!/usr/bin/env python3
"""Refresh accepted batch3 resources/config and pure samplers; preserve runtime adapters."""
from pathlib import Path
import hashlib,json,re,shutil
R=Path(__file__).resolve().parents[1];A=R/'art/sword-skills-batch3';P=A/'preview';G=R/'xiantu-v2831-scroll';dest=G/'sword-skills-batch3';dest.mkdir(exist_ok=True)
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
unchanged={str(p.relative_to(G)):h(p) for p in G.rglob('*') if p.is_file() and p.suffix in ['.png','.webp','.jpg'] and dest not in p.parents}
files=list(P.glob('*.png'))+[P/'effect-manifest.json']
for f in files:shutil.copyfile(f,dest/f.name);assert h(f)==h(dest/f.name)
manifest=json.loads((P/'effect-manifest.json').read_text())
sampler=(A/'sampler.js').read_text();sampler=sampler[sampler.index('function sampleSwordBatch'):sampler.index('if(typeof module')].replace('sampleSwordBatch','sampleSwordBatch3')
block='  // BEGIN SWORD BATCH3 GENERATED\n  const SWORD_BATCH3='+json.dumps(manifest['effects'],ensure_ascii=False,separators=(',',':'))+';\n'+sampler+'  // END SWORD BATCH3 GENERATED\n'
p=G/'xiantu-v2855-skill-fx.js';s=p.read_text();assert s.count('// BEGIN SWORD BATCH3 GENERATED')==1
s=re.sub(r'  // BEGIN SWORD BATCH3 GENERATED\n.*?  // END SWORD BATCH3 GENERATED\n',lambda _:block,s,flags=re.S)
a=s.index('// Presentation-only provenance for the existing one-hit guard.');b=s.index('  function readSwordState(',a)
s=s[:a]+(A/'state.js').read_text()+'\n'+s[b:];p.write_text(s)
assert all(h(G/f)==v for f,v in unchanged.items())
(A/'runtime-promotion-audit.json').write_text(json.dumps({'status':'user approved resources; integrated and verified separately','command':'python3 scripts/promote-sword-skills-batch3-vfx.py','source':'art/sword-skills-batch3/preview','sha256':{f.name:h(f) for f in files},'unchangedArt':unchanged},ensure_ascii=False,indent=2)+'\n')
print('PASS identical promotion:',len(files),'files; unchanged art:',len(unchanged))
