#!/usr/bin/env python3
"""Copy approved thunder previews verbatim and embed their pure sampler."""
from pathlib import Path
import hashlib,json,re,shutil
R=Path(__file__).resolve().parents[1]; A=R/'art/thunder-skills-batch1'; P=A/'preview'; G=R/'xiantu-v2831-scroll'; dest=G/'thunder-skills-batch1'
dest.mkdir(exist_ok=True)
manifest=json.loads((P/'effect-manifest.json').read_text()); hashes={}
for src in sorted(P.iterdir()):
 if src.is_file():
  shutil.copyfile(src,dest/src.name)
  hashes[src.name]=hashlib.sha256(src.read_bytes()).hexdigest()
  assert hashes[src.name]==hashlib.sha256((dest/src.name).read_bytes()).hexdigest()
block='  // BEGIN THUNDER BATCH1 GENERATED\n  const THUNDER_BATCH='+json.dumps(manifest['effects'],ensure_ascii=False,separators=(',',':'))+';\n'+(A/'sampler.js').read_text()+'\n  // END THUNDER BATCH1 GENERATED\n'
p=G/'xiantu-v2855-skill-fx.js'; s=p.read_text()
if '// BEGIN THUNDER BATCH1 GENERATED' in s:
 s=re.sub(r'  // BEGIN THUNDER BATCH1 GENERATED\n.*?  // END THUNDER BATCH1 GENERATED\n',lambda _:block,s,flags=re.S)
else:
 assert '  // BEGIN SOLAR GENERATED CONFIG' in s
 s=s.replace('  // BEGIN SOLAR GENERATED CONFIG',block+'  // BEGIN SOLAR GENERATED CONFIG',1)
# Dedicated approved effects supersede only these names in the old shared family.
names={d['name'] for d in manifest['effects']}
m=re.search(r'const ELEMENT_BATCH=(.*?);\n',s); defs=json.loads(m[1])
for d in defs:d['skills']=[n for n in d['skills'] if n not in names]
s=s[:m.start(1)]+json.dumps(defs,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
p.write_text(s)
(A/'runtime-promotion-audit.json').write_text(json.dumps({'status':'resource preview approved; integration validation pending','source':'art/thunder-skills-batch1/preview','destination':'xiantu-v2831-scroll/thunder-skills-batch1','command':'python3 scripts/promote-thunder-skills-batch1-vfx.py','sha256':hashes},ensure_ascii=False,indent=2)+'\n')
print('Promoted',len(hashes),'identical files')
