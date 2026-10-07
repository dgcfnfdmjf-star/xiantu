"""Package all website runtime files under the original deployment directory."""
from pathlib import Path
import json, zipfile
root=Path(__file__).resolve().parent.parent
site=root/'xiantu-v2831-scroll'
version=json.loads((root/'package.json').read_text())['version'].replace('28.','28',1)
out=root/'dist';out.mkdir(exist_ok=True)
target=out/f'xiantu-v{version}-game-folder.zip'
extensions={'.html','.js','.css','.webmanifest','.webp','.png','.svg','.mp4','.jpg','.jpeg','.gif','.ico','.woff','.woff2','.ttf','.mp3','.ogg','.wav'}
files=sorted(p for p in site.rglob('*') if p.is_file() and 'QA' not in p.relative_to(site).parts and p.suffix.lower() in extensions)
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for p in files:z.write(p,site.name+'/'+p.relative_to(site).as_posix())
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(files)
    for p in files:assert z.read(site.name+'/'+p.relative_to(site).as_posix())==p.read_bytes()
print(f'{target} — verified {len(files)} files, {target.stat().st_size} bytes')
