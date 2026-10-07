"""Build a deterministic deployment ZIP from current function sources, not the historical ZIP."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
out=root/'dist';out.mkdir(exist_ok=True)
with zipfile.ZipFile(out/'xiantu-jev-cloud-function.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
    for file in sorted((root/'tencent-jev-function').iterdir()):
        if file.suffix not in ('.js','.json'):continue
        info=zipfile.ZipInfo(file.name,date_time=(2026,10,5,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
        z.writestr(info,file.read_bytes())
print(out/'xiantu-jev-cloud-function.zip')
