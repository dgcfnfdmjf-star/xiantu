import hashlib,json,re,subprocess,zipfile
from pathlib import Path
h=lambda b:hashlib.sha256(b).hexdigest()
p=Path('output/playwright/cat-motion/package'); base=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip(); get=lambda f:subprocess.check_output(['git','show',base+':'+f]);tree=p/'tree';before=p.parent/'build-before';report={'base':base}
z='releases/healing-game-v9.5-tencent.zip'; zipPath=tree/z
assert (before/z).read_bytes() == zipPath.read_bytes() == get('games/healing-game/'+z);report['frozenZipSha256']=h(zipPath.read_bytes())
report['coats']={}
with zipfile.ZipFile(zipPath) as arc:
 for coat in ('orange','calico','black','tabby'):
  rel='cats/'+coat+'-cat.glb';current=(tree/'site/healing-game'/rel).read_bytes()
  assert current == (tree/'assets'/rel).read_bytes() == arc.read('healing-game/'+rel) == get('games/healing-game/assets/'+rel)
  report['coats'][coat]=dict(sha256=h(current),size=len(current))
path='xiantu-v2831-scroll/game-v2762.html';html=Path(path).read_bytes();assert get(path)==html
loader=json.loads(re.search(rb'var files\s*=\s*(\[[^;]*?\]);',html).group(1));assert len(loader)==40
report['xiantuLoader']={'sha256':h(html),'sequence':loader}
read=lambda root: (root/'site/healing-game/index.html').read_text();a,b=[re.findall(r'<script[^>]*>([\s\S]*?)</script>',read(t)) for t in (before,tree)]
assert len(a)==len(b)==36
modified={}
for i,(old,new) in enumerate(zip(a,b)):
 if old==new:continue
 if old.lstrip().startswith('/* cat-models.js'): marker='/* cat-models.js'
 else:
  marker=next(line.strip() for line in old.splitlines() if 20<len(line)<320 and line.strip() in new and sum(line.strip() in other for other in b)==1)
 assert marker in old and marker in new and sum(marker in other for other in a)==sum(marker in other for other in b)==1
 modified[str(i+1)]={'uniqueSharedMarker':marker,'beforeSha256':h(old.encode()),'afterSha256':h(new.encode())}
report['healingScriptOrder']={'count':len(b),'byteIdenticalAtOriginalIndex':len(b)-len(modified),'changedAtOriginalIndex':modified}
report['workingSiteSha256']=h(read(tree).encode());report['workingModules']={n:h((tree/'src'/n).read_bytes()) for n in ('cat-motion.js','cat-surface.js','cat-pose.js','l2-cutscene.js','snow-chapter.js','l6-cutscene.js')}
print(json.dumps(report,ensure_ascii=False,indent=2))
