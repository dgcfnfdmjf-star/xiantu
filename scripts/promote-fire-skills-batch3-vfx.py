#!/usr/bin/env python3
"""Promote approved bytes and pure choreography without changing combat rules."""
from pathlib import Path
import json,shutil,hashlib,re
R=Path(__file__).resolve().parents[1];A=R/'art/fire-skills-batch3';P=A/'preview';G=R/'xiantu-v2831-scroll';dest=G/'fire-skills-batch3';dest.mkdir(exist_ok=True)
manifest=json.loads((P/'effect-manifest.json').read_text());hashes={}
for file in P.iterdir():
 if file.is_file():
  shutil.copyfile(file,dest/file.name);hashes[file.name]=hashlib.sha256(file.read_bytes()).hexdigest();assert hashes[file.name]==hashlib.sha256((dest/file.name).read_bytes()).hexdigest()
sampler=(A/'sampler.js').read_text();text='  // BEGIN FIRE BATCH3 GENERATED\n  const FIRE_BATCH3='+json.dumps(manifest['effects'],ensure_ascii=False,separators=(',',':'))+';\n'+sampler+'  // END FIRE BATCH3 GENERATED\n'
p=G/'xiantu-v2855-skill-fx.js';s=p.read_text()
if '// BEGIN FIRE BATCH3 GENERATED' in s:s=re.sub(r'  // BEGIN FIRE BATCH3 GENERATED\n.*?  // END FIRE BATCH3 GENERATED\n',lambda _:text,s,flags=re.S)
else:s=s.replace('  // BEGIN SOLAR GENERATED CONFIG',text+'  // BEGIN SOLAR GENERATED CONFIG',1)
p.write_text(s)
(A/'runtime-promotion-audit.json').write_text(json.dumps({'status':'resource-preview-approved; integration under validation','source':'art/fire-skills-batch3/preview','destination':'xiantu-v2831-scroll/fire-skills-batch3','command':'python scripts/promote-fire-skills-batch3-vfx.py','sha256':hashes},indent=2)+'\n')
print('Promoted',len(hashes),'identical files')
