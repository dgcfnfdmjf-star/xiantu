#!/usr/bin/env python3
"""Export independent authored thunder rasters; no game runtime changes."""
from pathlib import Path
from PIL import Image
import numpy as np
import hashlib,json,subprocess,shutil
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'art/thunder-skills-batch1';OUT=ART/'preview';OUT.mkdir(exist_ok=True)
VALIDATOR=ROOT/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
N=256
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(p,n=1,cols=1,margin=.18):
 r=subprocess.run(['python3',str(VALIDATOR),'--input',str(p),'--frames',str(n),'--columns',str(cols),'--safe-margin-percent',str(margin)],capture_output=True,text=True)
 assert r.returncode==0,r.stdout+r.stderr
 return r.stdout.strip()
def opacity(im,k):
 a=np.array(im);a[:,:,3]=np.rint(a[:,:,3]*k).astype('uint8');return Image.fromarray(a)
def fit(im,kind,extent=.58):
 a=np.array(im)[:,:,3];y,x=np.where(a>12);bounds=(x.min(),y.min(),x.max()+1,y.max()+1)
 s=min(N*extent/(bounds[2]-bounds[0]),N*extent/(bounds[3]-bounds[1]))
 im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
 a=np.array(im)[:,:,3];y,x=np.where(a>12)
 px=(x.min()+x.max())/2;py=(y.min()+y.max())/2
 tx=128;ty=128
 if kind=='ground':py=y.max();ty=184
 if kind=='nose':px=x.max();tx=194
 if kind=='front':px=x.max();py=y.max();tx=194;ty=184
 # Whole cell translated on a padded output; assert no alpha is clipped.
 dx=round(tx-px);dy=round(ty-py)
 assert x.min()+dx>=0 and x.max()+dx<N and y.min()+dy>=0 and y.max()+dy<N
 out=Image.new('RGBA',(N,N));out.alpha_composite(im,(dx,dy));return out

def audit(im):
 a=np.array(im);mask=a[:,:,3]>16;y,x=np.where(mask);rgb=a[:,:,:3][mask].astype(float)
 return dict(bounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],white=float((rgb.min(1)>230).mean()),blue=float(((rgb[:,2]>rgb[:,0]*1.12)&(rgb[:,2]>rgb[:,1]*.80)).mean()),opaque=float((a[:,:,3][mask]>180).mean()),hash=hashlib.sha256(im.tobytes()).hexdigest())
reports={};effects=[]
for key,name,kind,arrival in [('thunder_strike_unique','雷法','falling',360),('thunder_flash','惊雷闪','projectile',320),('ground_thunder','裂地奔雷','moving-front',440)]:
 src=ART/'source'/key;original=src/'keyplates-original.png';master=src/'master-original.png'
 raw=Image.open(original).convert('RGBA');assert raw.width%2==raw.height%2==0
 # Reject any cut or cross-cell material before padding complete isolated cells.
 checks=[validate(original,4,2,.02),validate(master,1,1,.02)]
 cw,ch=raw.width//2,raw.height//2;pad=max(cw,ch)//2
 safe=Image.new('RGBA',((cw+2*pad)*2,(ch+2*pad)*2))
 for i in range(4):safe.alpha_composite(raw.crop((i%2*cw,i//2*ch,(i%2+1)*cw,(i//2+1)*ch)),(i%2*(cw+2*pad)+pad,i//2*(ch+2*pad)+pad))
 safe.save(src/'keyplates-safe.png');checks.append(validate(src/'keyplates-safe.png',4,2))
 masterIm=Image.open(master).convert('RGBA');ms=Image.new('RGBA',(masterIm.width*2,masterIm.height*2));ms.alpha_composite(masterIm,(masterIm.width//2,masterIm.height//2));ms.save(src/'master-safe.png');checks.append(validate(src/'master-safe.png'))
 cells=[]
 for i in range(4):
  x=i%2*(cw+2*pad);y=i//2*(ch+2*pad);cells.append(safe.crop((x,y,x+cw+2*pad,y+ch+2*pad)))
 bodyKind='ground' if kind=='falling' else 'nose' if kind=='projectile' else 'front'
 otherKind='center' if kind=='projectile' else 'ground'
 # Body A/B come from separately authored master and key plate, same visible pivot.
 bodyA=fit(ms,bodyKind);bodyB=fit(cells[1],bodyKind)
 tele=fit(cells[0],otherKind,.50);impact=fit(cells[2],otherKind,.54);residue=fit(cells[3],otherKind,.48)
 framesets={'telegraph':[opacity(tele,k) for k in [.55,.75,.9,1]],'body':[Image.blend(bodyA,bodyB,k) for k in [0,.25,.55,.85,1,.72,.43,.12]],'impact':[opacity(impact,k) for k in [1,.95,.83,.68,.47,.24]],'residue':[opacity(residue,k) for k in [1,.82,.65,.47,.30,.13]]}
 start=arrival*.45;fade=60;after=440;duration=arrival+after
 windows={'telegraph':(0,arrival+fade if kind=='falling' else start+fade,'target' if kind=='falling' else 'origin'),'body':(start,arrival+fade,'moving'),'impact':(arrival,arrival+200,'target'),'residue':(arrival+140,duration,'target')}
 display={'telegraph':180 if kind=='falling' else 110,'body':240 if kind=='falling' else 190 if kind=='projectile' else 230,'impact':190,'residue':150}
 layers={};detail={}
 for layer,frames in framesets.items():
  strip=Image.new('RGBA',(N*len(frames),N))
  for i,im in enumerate(frames):strip.alpha_composite(im,(N*i,0))
  path=OUT/f'{key}_{layer}.png';strip.save(path);a=[audit(im) for im in frames]
  assert len({v['hash'] for v in a})==len(a),(key,layer,'duplicate frames')
  assert all(v['white']<.08 and v['blue']>.78 for v in a),(key,layer,'palette',a)
  assert all(min(v['bounds'][0],v['bounds'][1],N-v['bounds'][2],N-v['bounds'][3])>=25 for v in a),(key,layer,'padding')
  detail[layer]=a;pk=bodyKind if layer=='body' else otherKind
  begin,end,_=windows[layer]
  layers[layer]=dict(file=path.name,frames=len(frames),frameWidth=N,frameHeight=N,pivotX=194/N if pk in ['nose','front'] else .5,pivotY=184/N if pk in ['ground','front'] else .5,fps=len(frames)*1000/(end-begin),loop=False,holdLast=False)
 D=dict(key=key,name=name,element='thunder',visualArchetype=kind,layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,display=display,timing=dict(arrivalMs=arrival,gatherRatio=.45,crossfadeMs=fade,impactMs=200,aftermathMs=after,durationMs=duration,fallDistance=55),acceptance=['Authored independent master and keyplates; normal source-over','Fixed body size and attached painted trail; actual target only','Impact requires acknowledged hit; no combat writes or RNG'])
 D['preview']=dict(displayMode=kind,durationMs=duration,distance=233,layers={k:dict(start=a/duration,end=b/duration,anchor=c,width=display[k],height=display[k],fadeIn=60/(b-a),fadeOut=60/(b-a)) for k,(a,b,c) in windows.items()})
 effects.append(D);reports[key]=dict(inputs={p.name:digest(p) for p in [original,master]},checks=checks,frames=detail,outputHashes={v['file']:digest(OUT/v['file']) for v in layers.values()})
manifest=dict(schemaVersion=1,effects=effects)
for n in ['effect-manifest.json','effect-manifest.preview.json']:(OUT/n).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'definition.js').write_text('window.ThunderBatchDefinitions = '+json.dumps(effects,ensure_ascii=False)+';\n')
shutil.copy(ART/'sampler.js',OUT/'choreography.js')
shutil.copy(ROOT/'art/fire-skills-batch1/preview/stage-reference.webp',OUT/'stage-reference.webp')
(ART/'asset-audit.json').write_text(json.dumps(dict(command='python3 scripts/build-thunder-skills-batch1-vfx.py',sourcePolicy='Failed 3x2 grids rejected; regenerated isolated 2x2 plates. Verify 2% non-clipping first, expand whole cells, then verify 18% margin before slicing.',effects=reports),indent=2)+'\n')
print('PASS: 3 effects, 12 strips, 72 frames; current-input source boundaries and palette audited')
