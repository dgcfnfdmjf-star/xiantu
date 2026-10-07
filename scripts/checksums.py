"""Refresh release manifests after an intentional code change, or verify them."""
import hashlib, pathlib, subprocess, sys
root=pathlib.Path(__file__).resolve().parent.parent
names=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
files=sorted({n for n in names if n and (root/n).is_file()})
manifests=['xiantu-v2831-scroll/checksums.sha256','checksums.sha256','handoff-checksums.sha256']
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
if '--write' in sys.argv:
    for name in manifests:
        base=(root/name).parent
        selected=[n for n in files if n!=name and (name!='xiantu-v2831-scroll/checksums.sha256' or n.startswith('xiantu-v2831-scroll/'))]
        if name=='checksums.sha256':selected=[n for n in selected if n!='handoff-checksums.sha256']
        (root/name).write_text(''.join(f'{digest(root/n)}  {(root/n).relative_to(base)}\n' for n in selected))
else:
    for name in manifests:
        for line in (root/name).read_text().splitlines():
            expected,file=line.split('  ',1)
            if digest((root/name).parent/file)!=expected:raise SystemExit('Checksum mismatch: '+file)
    print('PASS all release SHA-256 manifests')
