"""Package all website runtime files under the original deployment directory."""
from pathlib import Path
import json, zipfile, subprocess, sys, hashlib, re, tempfile, os
root=Path(__file__).resolve().parent.parent
site=root/'xiantu-v2831-scroll'
# Reject stale sources before creating or truncating an existing archive.
subprocess.run([sys.executable,str(root/'scripts/checksums.py')],check=True)
version=json.loads((root/'package.json').read_text())['version'].replace('28.','28',1)
out=root/'dist';out.mkdir(exist_ok=True)
target=out/f'xiantu-v{version}-game-folder.zip'
extensions={'.html','.js','.json','.css','.webmanifest','.webp','.png','.svg','.mp4','.jpg','.jpeg','.gif','.ico','.woff','.woff2','.ttf','.mp3','.ogg','.wav'}
# Art review kits remain in source control; no live entry/diagnostic link targets them.
preview_kits={'absolute-zero-v286835','fire-skills-batch1','fire-skills-batch2','fire-skills-batch3','heart-fire-v286833','ice-butterfly-v286831','sword-skills-batch1','sword-skills-batch2','thunder-skills-batch1','thunder-skills-batch2','thunder-skills-batch3'}
preview_parts={'index.html','preview.js','stage-reference.webp','effect-manifest.preview.json'}
preview_only={'skill-fx-v2854.html','solar-fire-preview.html','V27.70-角色方向预览.png','V27.72-主角同款方向预览.png','solar-fire-v286830/effect-manifest.preview.json'}
# QA fixtures, version notes (.txt) and recorded preview media are development-only.
def shipped(p):
    rel=p.relative_to(site)
    if rel.as_posix()=='vendor/THREE-LICENSE.txt':return True
    if rel.as_posix() in preview_only or len(rel.parts)==2 and rel.parts[0] in preview_kits and rel.name in preview_parts:return False
    return 'QA' not in rel.parts and p.suffix.lower() in extensions and not (p.stem.endswith('-preview') and p.suffix.lower() in {'.mp4','.png','.jpg','.webp'})
files=sorted(p for p in site.rglob('*') if p.is_file() and shipped(p))
# Reject literal local resource references that cannot be shipped. Runtime-built
# paths still need the game/browser suites; this is deliberately not a JS parser.
shipped_paths={p.resolve() for p in files}
literal=re.compile(r'''["']((?:\./|\.\./)[^\s"'<>]+\.(?:png|webp|jpg|jpeg|svg|gif|ico|mp4|mp3|ogg|wav|woff2?|ttf|css|js|html|json|webmanifest)(?:[?#][^\s"'<>]*)?)["']''',re.I)
missing=[]
for p in files:
    if p.suffix.lower() not in {'.html','.js','.css','.json','.webmanifest'}:continue
    source=p.read_text(encoding='utf-8')
    for ref in literal.findall(source):
        if '${' in ref:continue
        destination=(p.parent/re.split(r'[?#]',ref,1)[0]).resolve()
        if destination not in shipped_paths:missing.append(f'{p.relative_to(site)} -> {ref}')
if missing:raise SystemExit('Unshipped local resource reference(s):\n'+'\n'.join(sorted(set(missing))))
manifest=dict(line.split('  ',1)[::-1] for line in (site/'checksums.sha256').read_text().splitlines())
for p in files:
    expected=manifest.get(p.relative_to(site).as_posix())
    if not expected or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:
        raise SystemExit('Unverified runtime file: '+str(p.relative_to(site)))
fd,scratch=tempfile.mkstemp(prefix=target.stem+'-',suffix='.tmp',dir=out);os.close(fd)
try:
    with zipfile.ZipFile(scratch,'w',zipfile.ZIP_DEFLATED) as z:
        for p in files:z.write(p,site.name+'/'+p.relative_to(site).as_posix())
    with zipfile.ZipFile(scratch) as z:
        assert z.testzip() is None
        assert len(z.namelist())==len(files)
        for p in files:assert z.read(site.name+'/'+p.relative_to(site).as_posix())==p.read_bytes()
    os.replace(scratch,target)
finally:
    if os.path.exists(scratch):os.unlink(scratch)
print(f'{target} — verified {len(files)} files, {target.stat().st_size} bytes')
