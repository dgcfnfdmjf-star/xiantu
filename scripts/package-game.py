"""Package all website runtime files under the original deployment directory."""
from pathlib import Path
import json, zipfile, subprocess, sys, hashlib
root=Path(__file__).resolve().parent.parent
site=root/'xiantu-v2831-scroll'
# Reject stale sources before creating or truncating an existing archive.
subprocess.run([sys.executable,str(root/'scripts/checksums.py')],check=True)
version=json.loads((root/'package.json').read_text())['version'].replace('28.','28',1)
out=root/'dist';out.mkdir(exist_ok=True)
target=out/f'xiantu-v{version}-game-folder.zip'
extensions={'.html','.js','.json','.css','.webmanifest','.webp','.png','.svg','.mp4','.jpg','.jpeg','.gif','.ico','.woff','.woff2','.ttf','.mp3','.ogg','.wav'}
# QA fixtures, version notes (.txt) and recorded preview media are development-only.
def shipped(p):
    rel=p.relative_to(site)
    return 'QA' not in rel.parts and p.suffix.lower() in extensions and not (p.stem.endswith('-preview') and p.suffix.lower() in {'.mp4','.png','.jpg','.webp'})
files=sorted(p for p in site.rglob('*') if p.is_file() and shipped(p))
manifest=dict(line.split('  ',1)[::-1] for line in (site/'checksums.sha256').read_text().splitlines())
for p in files:
    expected=manifest.get(p.relative_to(site).as_posix())
    if not expected or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:
        raise SystemExit('Unverified runtime file: '+str(p.relative_to(site)))
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for p in files:z.write(p,site.name+'/'+p.relative_to(site).as_posix())
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(files)
    for p in files:assert z.read(site.name+'/'+p.relative_to(site).as_posix())==p.read_bytes()
print(f'{target} — verified {len(files)} files, {target.stat().st_size} bytes')
