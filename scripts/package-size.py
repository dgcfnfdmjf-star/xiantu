"""Report deployment ZIP and extracted sizes; optional budgets use decimal bytes."""
import argparse, json, pathlib, zipfile
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('archive',nargs='?',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]/'downloads/xiantu-v2831-scroll.zip')
parser.add_argument('--max-unpacked',type=int,default=0,help='Fail above this extracted size; 0 disables the limit')
parser.add_argument('--max-zip',type=int,default=0,help='Fail above this ZIP size; 0 disables the limit')
args=parser.parse_args()
if min(args.max_unpacked,args.max_zip)<0:parser.error('budgets must be non-negative')
if not args.archive.is_file():parser.error('archive does not exist; run npm run package:game first')
with zipfile.ZipFile(args.archive) as z:
    files=[i for i in z.infolist() if not i.is_dir()]
    report={'archive':str(args.archive),'files':len(files),'zip_bytes':args.archive.stat().st_size,'unpacked_bytes':sum(i.file_size for i in files),'largest':[{'path':i.filename,'bytes':i.file_size} for i in sorted(files,key=lambda i:i.file_size,reverse=True)[:10]]}
report['over_budget']=[]
for key,limit in [('unpacked_bytes',args.max_unpacked),('zip_bytes',args.max_zip)]:
    if limit and report[key]>limit:report['over_budget'].append(key)
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(1 if report['over_budget'] else 0)
