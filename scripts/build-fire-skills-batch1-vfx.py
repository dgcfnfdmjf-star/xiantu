#!/usr/bin/env python3
"""Export authored raster plates. Never modifies game runtime or mechanics."""
from pathlib import Path
from PIL import Image
import numpy as np, json, hashlib, subprocess, shutil
ROOT=Path(__file__).resolve().parents[1]; ART=ROOT/'art/fire-skills-batch1'; OUT=ART/'preview'
V=ROOT/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
OUT.mkdir(exist_ok=True); reports={}; effects=[]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(p,n=1,cols=1,margin=.18):
 r=subprocess.run(['python',str(V),'--input',str(p),'--frames',str(n),'--columns',str(cols),'--rows',str((n+cols-1)//cols),'--safe-margin-percent',str(margin)],capture_output=True,text=True)
 print(r.stdout.strip()); assert r.returncode==0,r.stdout+r.stderr
 return r.stdout.strip()
def audit(im):
 a=np.array(im); m=a[:,:,3]>16; y,x=np.where(m); rgb=a[:,:,:3][m].astype(float)
 return dict(bounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],white=float((rgb.min(1)>230).mean()),red=float(((rgb[:,0]>rgb[:,1]*1.12)&(rgb[:,0]>rgb[:,2]*1.2)).mean()),hash=hashlib.sha256(im.tobytes()).hexdigest())
def opacity(im,k):
 a=np.array(im);a[:,:,3]=(a[:,:,3]*k).astype('uint8');return Image.fromarray(a)
def fit(im,ground=False,extent=.60):
 # Whole plate is uniformly resized, never cropped. Register alpha-visible midpoint or ground.
 a=np.array(im)[:,:,3];y,x=np.where(a>16);scale=min(256*extent/(x.max()-x.min()+1),256*extent/(y.max()-y.min()+1))
 if ground:scale=min(scale,256*.40/max(1,y.max()-y.min()+1))
 im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
 px=(x.min()+x.max())*.5*scale;py=(y.max() if ground else (y.min()+y.max())*.5)*scale
 out=Image.new('RGBA',(256,256));out.alpha_composite(im,(round(128-px),round((184 if ground else 128)-py)))
 return out
for key,name in [('flame_slash','烈焰斩'),('flame_burst','炎爆术'),('flame_pillar','焚天烈焰')]:
 src=ART/'source'/key;original=src/'keyplates-original.png'; raw=Image.open(original).convert('RGBA');assert raw.size==(1254,1254)
 # Check authored boundaries before expanding COMPLETE cells. Failed drafts never feed exports.
 checks=[validate(original,9,3,.02)]
 safe=Image.new('RGBA',(2016,2016))
 for i in range(9):safe.alpha_composite(raw.crop((i%3*418,i//3*418,i%3*418+418,i//3*418+418)),(i%3*672+127,i//3*672+127))
 safe.save(src/'keyplates-safe.png');checks.append(validate(src/'keyplates-safe.png',9,3))
 master=Image.open(src/'master-original.png').convert('RGBA');ms=Image.new('RGBA',(master.width*2,master.height*2));ms.alpha_composite(master,(master.width//2,master.height//2));ms.save(src/'master-safe.png');checks.append(validate(src/'master-safe.png'))
 plates=[]
 for i in range(9):
  cell=safe.crop((i%3*672,i//3*672,i%3*672+672,i//3*672+672)); ground=(key=='flame_pillar' or i>=7)
  # Pillar body receives a full-height fit with a stable base at 80%.
  if key=='flame_pillar' and i<3:
   im=fit(cell,False,.60);a=np.array(im)[:,:,3];y,x=np.where(a>16);out=Image.new('RGBA',(256,256));out.alpha_composite(im,(0,205-int(y.max())));im=out
  else:im=fit(cell,ground,.60 if i<3 else .52)
  plates.append(im)
 layers={}; framesets={}
 for layer,indices,n in [('telegraph',[3,4],4),('body',[0,1,2,0],8),('impact',[5,6],6),('residue',[7,8],6)]:
  frames=[]
  for j in range(n):
   t=j/(n if layer=='body' else n-1)*(len(indices)-1);a=min(len(indices)-2,int(t));f=Image.blend(plates[indices[a]],plates[indices[a+1]],t-a)
   frames.append(f)
  framesets[layer]=frames
 if key=='flame_burst':
  peak=fit(ms,False,.62);framesets['detonation']=[opacity(peak,v) for v in [.3,.7,1,.85,.60,.25]]
 detail={}
 for layer,frames in framesets.items():
  strip=Image.new('RGBA',(256*len(frames),256))
  for i,im in enumerate(frames):strip.alpha_composite(im,(256*i,0))
  file=key+'_'+layer+'.png';strip.save(OUT/file);a=[audit(im) for im in frames]
  assert len({v['hash'] for v in a})==len(frames),(key,layer,'duplicate frames')
  assert all(v['white']<.08 and v['red']>.78 for v in a),(key,layer,'palette')
  assert all(min(v['bounds'][0],v['bounds'][1],256-v['bounds'][2],256-v['bounds'][3])>=25 for v in a),(key,layer,'bounds')
  detail[layer]=a
  ground=key=='flame_pillar' or layer=='residue';pivot=.80 if key=='flame_pillar' and layer=='body' else .72 if ground else .5
  layers[layer]=dict(file=file,frames=len(frames),frameWidth=256,frameHeight=256,pivotX=.5,pivotY=pivot,fps=30,loop=layer=='body',holdLast=False)
 D=dict(key=key,name=name,element='fire',visualArchetype='ground-eruption' if key=='flame_pillar' else 'projectile',layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,timing=dict(arrivalMs=310,gatherMs=100,crossfadeMs=40,impactMs=180,aftermathMs=440 if key=='flame_slash' else 650,durationMs=1100),display=dict(telegraph=248 if key=='flame_slash' else 180 if key=='flame_burst' else 155,body=215 if key=='flame_slash' else 155 if key=='flame_burst' else 350,impact=190,residue=180,detonation=350),acceptance=['Independent authored master and stage plates; source-over compositing','Impact and conditional detonation require acknowledged events','Fixed moving size; ground registered pillar; no combat mutations'])
 windows={'telegraph':(0,140,'origin'),'body':(100,350,'moving'),'impact':(310,490,'target'),'residue':(450,310+D['timing']['aftermathMs'],'target')}
 if key=='flame_pillar':windows={'telegraph':(0,350,'target'),'body':(310,710,'target'),'impact':(310,490,'target'),'residue':(650,960,'target')}
 D['preview']=dict(displayMode=D['visualArchetype'],durationMs=1100,distance=233,layers={k:dict(start=a/1100,end=b/1100,anchor=c,width=D['display'][k],height=D['display'][k],fadeIn=40/(b-a),fadeOut=40/(b-a)) for k,(a,b,c) in windows.items()})
 effects.append(D);reports[key]=dict(inputs={p.name:digest(p) for p in [original,src/'master-original.png']},boundaryChecks=checks,frames=detail)
manifest=dict(schemaVersion=1,effects=effects)
for name in ['effect-manifest.json','effect-manifest.preview.json']:(OUT/name).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'definition.js').write_text('window.FireBatchDefinitions = '+json.dumps(effects,ensure_ascii=False)+';\n')
shutil.copy(ART/'sampler.js',OUT/'choreography.js')
shutil.copy(ROOT/'output/playwright/skill-vfx-expansion/stage-reference.webp',OUT/'stage-reference.webp')
(ART/'asset-audit.json').write_text(json.dumps(dict(command='python scripts/build-fire-skills-batch1-vfx.py',effects=reports),indent=2)+'\n')
print('Exported three independent effects')
