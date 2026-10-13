#!/usr/bin/env python3
"""Build transparent strips from independent authored plates, without painting effects."""
from pathlib import Path
from PIL import Image
import numpy as np, json, hashlib, subprocess, shutil
ROOT=Path(__file__).resolve().parents[1]; ART=ROOT/'art/fire-skills-batch2'; OUT=ART/'preview'
V=ROOT/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
OUT.mkdir(exist_ok=True); reports={}; effects=[]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(p,n=1,cols=1,margin=.18):
 r=subprocess.run(['python3',str(V),'--input',str(p),'--frames',str(n),'--columns',str(cols),'--rows',str((n+cols-1)//cols),'--safe-margin-percent',str(margin)],capture_output=True,text=True)
 print(r.stdout.strip()); assert r.returncode==0,r.stdout+r.stderr
 return r.stdout.strip()
def audit(im):
 a=np.array(im);m=a[:,:,3]>16;assert m.any();y,x=np.where(m);rgb=a[:,:,:3][m].astype(float)
 return dict(bounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],white=float((rgb.min(1)>230).mean()),red=float(((rgb[:,0]>rgb[:,1]*1.12)&(rgb[:,0]>rgb[:,2]*1.2)).mean()),midtones=float(((rgb[:,0]>100)&(rgb[:,1]<210)&(rgb[:,2]<150)).mean()),opaque=float((a[:,:,3][m]>128).mean()),hash=hashlib.sha256(im.tobytes()).hexdigest())
def fit(im,ground=False,width=150,height=140):
 # Uniformly resize the entire plate; no silhouette cropping or stretching.
 y,x=np.where(np.array(im)[:,:,3]>16);s=min(width/(x.max()-x.min()+1),height/(y.max()-y.min()+1))
 scaled=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
 px=(x.min()+x.max()+1)*.5*s;py=(y.max()+1 if ground else (y.min()+y.max()+1)*.5)*s
 out=Image.new('RGBA',(256,256));out.alpha_composite(scaled,(round(128-px),round((192 if ground else 128)-py)));return out
for key,name in [('karmic_lotus','红莲业火'),('ember_wall','火墙术'),('samadhi_fire','三昧真火')]:
 src=ART/'source'/key;original=src/'keyplates-original.png';raw=Image.open(original).convert('RGBA');assert raw.width==raw.height and raw.width%3==0
 cell=raw.width//3;pad=round(cell*.31);safeCell=cell+pad*2
 checks=[validate(original,9,3,.02)]
 safe=Image.new('RGBA',(safeCell*3,safeCell*3))
 for i in range(9):safe.alpha_composite(raw.crop((i%3*cell,i//3*cell,(i%3+1)*cell,(i//3+1)*cell)),(i%3*safeCell+pad,i//3*safeCell+pad))
 safe.save(src/'keyplates-safe.png');checks.append(validate(src/'keyplates-safe.png',9,3))
 master=Image.open(src/'master-original.png').convert('RGBA');ms=Image.new('RGBA',(master.width*2,master.height*2));ms.alpha_composite(master,(master.width//2,master.height//2));ms.save(src/'master-safe.png');checks.append(validate(src/'master-safe.png'))
 sourceAudit=[];plates=[];ground=key!='samadhi_fire'
 for i in range(9):
  c=safe.crop((i%3*safeCell,i//3*safeCell,(i%3+1)*safeCell,(i//3+1)*safeCell));sourceAudit.append(audit(c))
  plates.append(fit(c,ground or i>=7,width=150,height=140 if key=='samadhi_fire' else 115))
 if key=='karmic_lotus':
  # Later draft poses lifted embers above the approved low bowl. Use the
  # accepted first low pose and this effect's own complete material master.
  plates.append(fit(ms,True,width=150,height=115))
 if key=='samadhi_fire':
  bodySrc=src/'body-original.png';bodyRaw=Image.open(bodySrc).convert('RGBA');assert bodyRaw.size==raw.size
  # Only the top row is authored in this 3x3 layout; the other rows are empty.
  r=subprocess.run(['python3',str(V),'--input',str(bodySrc),'--frames','3','--columns','3','--rows','3','--safe-margin-percent','.02'],capture_output=True,text=True)
  assert r.returncode==0,r.stdout+r.stderr;checks.append(r.stdout.strip())
  bs=Image.new('RGBA',(safeCell*3,safeCell))
  for i in range(3):bs.alpha_composite(bodyRaw.crop((i*cell,0,(i+1)*cell,cell)),(i*safeCell+pad,pad))
  bs.save(src/'body-safe.png');checks.append(validate(src/'body-safe.png',3,3))
  for i in range(3):
   c=bs.crop((i*safeCell,0,(i+1)*safeCell,safeCell));sourceAudit.append(audit(c));plates[i]=fit(c,False,width=150,height=140)
 assert all(a['white']<.08 and a['red']>.78 for a in sourceAudit),(key,'source palette')
 layers={};framesets={}
 for layer,indices,n in [('telegraph',[3,4],4),('body',[0,9] if key=='karmic_lotus' else [0,1,2],8),('impact',[5,6],6),('residue',[7,8],6)]:
  frames=[]
  for j in range(n):
   t=j/(n-1)*(len(indices)-1);a=min(len(indices)-2,int(t));f=Image.blend(plates[indices[a]],plates[indices[a+1]],t-a);frames.append(f)
  framesets[layer]=frames
 if key=='karmic_lotus':
  # Authored closed-bud poses are shared by anticipation and the state mark.
  # Smooth cyclic interpolation with a small alpha pulse keeps all 8 frames distinct.
  framesets['status']=[]
  for j in range(8):
   w=(1-np.cos(2*np.pi*j/8))/2;f=Image.blend(plates[3],plates[4],float(w));a=np.array(f);a[:,:,3]=(a[:,:,3]*(.94+.06*np.sin(2*np.pi*j/8))).astype('uint8');framesets['status'].append(Image.fromarray(a))
 detail={}
 for layer,frames in framesets.items():
  strip=Image.new('RGBA',(256*len(frames),256))
  for i,im in enumerate(frames):strip.alpha_composite(im,(256*i,0))
  file=key+'_'+layer+'.png';strip.save(OUT/file);a=[audit(im) for im in frames]
  assert len({v['hash'] for v in a})==len(frames),(key,layer,'duplicate frames')
  assert all(v['white']<(.06 if layer=='body' else .08) and v['red']>.78 and v['midtones']>(.25 if layer=='residue' else .65) and v['opaque']>(.55 if layer in ('body','status') else .20) for v in a),(key,layer,'palette')
  assert all(min(v['bounds'][0],v['bounds'][1],256-v['bounds'][2],256-v['bounds'][3])>=25 for v in a),(key,layer,'bounds')
  detail[layer]=a;layers[layer]=dict(file=file,frames=len(frames),frameWidth=256,frameHeight=256,pivotX=.5,pivotY=.75 if ground or layer=='residue' else .5,fps=8 if layer=='status' else 30,loop=layer=='status',holdLast=False)
 # Display is full-canvas size; alpha-visible extent is audited separately.
 sizes={'karmic_lotus':dict(telegraph=115,body=285,impact=245,residue=245,status=49),'ember_wall':dict(telegraph=350,body=365,impact=310,residue=330),'samadhi_fire':dict(telegraph=150,body=210,impact=190,residue=200)}[key]
 end=620 if key=='karmic_lotus' else 580 if key=='ember_wall' else 440
 D=dict(key=key,name=name,element='fire',visualArchetype='ground-eruption' if ground else 'projectile',layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,timing=dict(arrivalMs=310,gatherMs=100,crossfadeMs=40,bodyMs=360,impactMs=180,aftermathMs=end,durationMs=2400),display=sizes,acceptance=['Independent authored master and stage plates; source-over','Authoritative hit event; same living target state for lotus mark','Fixed moving size; target ground registration; no combat writes'])
 windows={'telegraph':(0,350,'target'),'body':(310,670,'target'),'impact':(310,490,'target'),'residue':(610,310+end,'target')} if ground else {'telegraph':(0,140,'origin'),'body':(100,350,'moving'),'impact':(310,490,'target'),'residue':(450,750,'target')}
 D['preview']=dict(displayMode=D['visualArchetype'],durationMs=1100,distance=233,layers={k:dict(start=a/1100,end=b/1100,anchor=c,width=sizes[k],height=sizes[k],fadeIn=40/(b-a),fadeOut=(60 if k=='body' and ground else 40)/(b-a)) for k,(a,b,c) in windows.items()})
 if key=='karmic_lotus':D['preview']['layers']['status']=dict(start=930/1100,end=1,anchor='target',width=sizes['status'],height=sizes['status'],fadeIn=0,fadeOut=0)
 visible={k:[[round((v['bounds'][2]-v['bounds'][0])*sizes[k]/256,2),round((v['bounds'][3]-v['bounds'][1])*sizes[k]/256,2)] for v in vals] for k,vals in detail.items()}
 inputs=[original,src/'master-original.png',ART/'design'/(key+'-storyboard.png')]
 if key=='samadhi_fire':inputs.append(src/'body-original.png')
 effects.append(D);reports[key]=dict(inputs={p.name:digest(p) for p in inputs},boundaryChecks=checks,master=audit(ms),sourcePlates=sourceAudit,frames=detail,visiblePixels=visible)
manifest=dict(schemaVersion=1,effects=effects)
for name in ['effect-manifest.json','effect-manifest.preview.json']:(OUT/name).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'definition.js').write_text('window.FireBatch2Definitions = '+json.dumps(effects,ensure_ascii=False)+';\n')
shutil.copy(ART/'sampler.js',OUT/'choreography.js');shutil.copy(ROOT/'art/fire-skills-batch1/preview/stage-reference.webp',OUT/'stage-reference.webp')
(ART/'asset-audit.json').write_text(json.dumps(dict(command='python3 scripts/build-fire-skills-batch2-vfx.py',effects=reports),indent=2)+'\n')
print('Exported three independent effects; see asset-audit.json for current dimensions and hashes')
