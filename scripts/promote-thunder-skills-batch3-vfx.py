#!/usr/bin/env python3
"""Promote approved resource bytes; preserve original runtime inputs for review."""
from pathlib import Path
import hashlib,json,re,shutil
R=Path(__file__).resolve().parents[1];A=R/'art/thunder-skills-batch3';P=A/'preview';G=R/'xiantu-v2831-scroll';dest=G/'thunder-skills-batch3';dest.mkdir(exist_ok=True)
backup=A/'runtime-before';backup.mkdir(exist_ok=True)
for name in ['xiantu-v2855-skill-fx.js','xiantu-v28684-duel.js','xiantu-v2762-core.js','battle-25d-preview.html']:
 if not (backup/name).exists():shutil.copyfile(G/name,backup/name)
hashes={}
for p in P.iterdir():
 if p.is_file():shutil.copyfile(p,dest/p.name);hashes[p.name]=hashlib.sha256(p.read_bytes()).hexdigest()
defs=json.loads((P/'effect-manifest.json').read_text())['effects']
sampler=(A/'sampler.js').read_text().replace('sampleThunderBatch','sampleThunderBatch3')
block='  // BEGIN THUNDER BATCH3 GENERATED\n  const THUNDER_BATCH3='+json.dumps(defs,ensure_ascii=False,separators=(',',':'))+';\n'+sampler+'\n'+(A/'state.js').read_text()+'\n  // END THUNDER BATCH3 GENERATED\n'
p=G/'xiantu-v2855-skill-fx.js';s=p.read_text()
if '// BEGIN THUNDER BATCH3 GENERATED' in s:s=re.sub(r'  // BEGIN THUNDER BATCH3 GENERATED\n.*?  // END THUNDER BATCH3 GENERATED\n',lambda _:block,s,flags=re.S)
else:s=s.replace('  // BEGIN SOLAR GENERATED CONFIG',block+'  // BEGIN SOLAR GENERATED CONFIG',1)
match=re.search(r'const ELEMENT_BATCH=(.*?);\n',s);elements=json.loads(match[1]);names={d['name'] for d in defs}
for d in elements:d['skills']=[n for n in d['skills'] if n not in names]
s=s[:match.start(1)]+json.dumps(elements,ensure_ascii=False,separators=(',',':'))+s[match.end(1):];p.write_text(s)
(A/'runtime-promotion-audit.json').write_text(json.dumps({'status':'preview accepted; integration under validation','command':'python3 scripts/promote-thunder-skills-batch3-vfx.py','sha256':hashes},indent=2)+'\n')
print('Promoted',len(hashes),'files with identical approved resource bytes')
