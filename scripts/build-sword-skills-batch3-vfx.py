#!/usr/bin/env python3
"""Export approved sword raster plates; no procedural effect-body drawing."""
from pathlib import Path
from PIL import Image
import numpy as np
import hashlib,json,subprocess,shutil
R=Path(__file__).resolve().parents[1]; A=R/'art/sword-skills-batch3'; P=A/'preview'; P.mkdir(parents=True,exist_ok=True)
V=R/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'; N=256
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def validate(p,n=1,cols=1,margin=.18):
 r=subprocess.run(['python3',str(V),'--input',str(p),'--frames',str(n),'--columns',str(cols),'--safe-margin-percent',str(margin)],capture_output=True,text=True)
 assert r.returncode==0,r.stdout+r.stderr
 return r.stdout.strip()
def opacity(im,k):
 a=np.array(im);a[:,:,3]=np.rint(a[:,:,3]*k).astype('uint8');return Image.fromarray(a)
def fit(im,pivot,extent=.6):
 a=np.array(im)[:,:,3];y,x=np.where(a>12);s=N*extent/max(x.max()-x.min()+1,y.max()-y.min()+1)
 im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
 a=np.array(im)[:,:,3];y,x=np.where(a>12)
 px=x.max() if pivot=='tip' else (x.min()+x.max())/2
 py=y.max() if pivot=='ground' else (y.min()+y.max())/2
 dx=round((194 if pivot=='tip' else 128)-px);dy=round((196 if pivot=='ground' else 128)-py)
 assert x.min()+dx>=0 and x.max()+dx<N and y.min()+dy>=0 and y.max()+dy<N
 out=Image.new('RGBA',(N,N));out.alpha_composite(im,(dx,dy));return out

def audit(im,key):
 a=np.array(im);m=a[:,:,3]>16;y,x=np.where(m);rgb=a[:,:,:3][m].astype(float)
 white=float((rgb.min(1)>230).mean())
 colored=(rgb[:,0]>rgb[:,1]*1.10)&(rgb[:,0]>rgb[:,2]*1.05) if key=='blood_return' else ((rgb[:,2]>rgb[:,1]*1.08)&(rgb[:,2]>rgb[:,0]*1.03)) if key=='soul_chase' else ((rgb[:,1]>rgb[:,0]*1.05)&(rgb[:,2]>rgb[:,0]*1.05))
 return dict(bounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],white=white,dominant=float(colored.mean()),opaque=float((a[:,:,3][m]>180).mean()),hash=hashlib.sha256(im.tobytes()).hexdigest())
report={};effects=[]
for key,name,kind in [('soul_chase','追魂一剑','projectile'),('blood_return','饮血剑诀','projectile'),('astral_guard','玄罡护体剑','projectile')]:
 src=A/'source'/key; original=src/'keyplates-original.png';master=src/'master-original.png';gold=kind=='falling'
 # Audit original cells for clipping first. Expand complete cells, never crop away failed pixels.
 checks=[validate(original,6,3,.02),validate(master,1,1,.02)]
 im=Image.open(original).convert('RGBA');cw,ch=im.width//3,im.height//2;pad=max(cw,ch)//2
 safe=Image.new('RGBA',((cw+2*pad)*3,(ch+2*pad)*2))
 for i in range(6):safe.alpha_composite(im.crop((i%3*cw,i//3*ch,(i%3+1)*cw,(i//3+1)*ch)),(i%3*(cw+2*pad)+pad,i//3*(ch+2*pad)+pad))
 sp=src/'keyplates-safe.png';safe.save(sp);checks.append(validate(sp,6,3))
 m=Image.open(master).convert('RGBA');ms=Image.new('RGBA',(m.width*2,m.height*2));ms.alpha_composite(m,(m.width//2,m.height//2));mp=src/'master-safe.png';ms.save(mp);checks.append(validate(mp))
 cells=[safe.crop((i%3*(cw+2*pad),i//3*(ch+2*pad),(i%3+1)*(cw+2*pad),(i//3+1)*(ch+2*pad))) for i in range(6)]
 piv='center';other='center'
 bodyA=fit(ms,piv);bodyB=fit(cells[1],piv)
 tele=fit(cells[0],other,.55);impact=fit(cells[2],other,.58);res=fit(cells[3],other,.54)
 framesets={'telegraph':[opacity(tele,k) for k in [.55,.75,.9,1]],'body':[Image.blend(bodyA,bodyB,k) for k in [0,.2,.45,.7,1,.8,.5,.25]],'impact':[opacity(impact,k) for k in [1,.94,.8,.62,.43,.2]],'residue':[opacity(res,k) for k in [1,.82,.64,.46,.29,.12]]}
 if key!='soul_chase':
  aa,bb=fit(cells[4],'center',.56),fit(cells[5],'center',.56)
  framesets['support']=[Image.blend(aa,bb,k) for k in [0,.18,.4,.67,1,.82,.6,.33]]
 layers={};detail={}
 for layer,frames in framesets.items():
  sheet=Image.new('RGBA',(N*len(frames),N))
  for i,frame in enumerate(frames):sheet.alpha_composite(frame,(i*N,0))
  path=P/f'{key}_{layer}.png';sheet.save(path);stats=[audit(f,key) for f in frames]
  assert len({s['hash'] for s in stats})==len(frames)
  assert all(s['white']<.06 and s['dominant']>.60 for s in stats),(key,layer,stats)
  assert all(min(s['bounds'][0],s['bounds'][1],N-s['bounds'][2],N-s['bounds'][3])>=28 for s in stats)
  pk=piv if layer=='body' else other
  layers[layer]=dict(file=path.name,frames=len(frames),frameWidth=N,frameHeight=N,pivotX=194/N if pk=='tip' else .5,pivotY=196/N if pk=='ground' else .5,fps=24,loop=layer=='support' and key=='astral_guard',holdLast=False)
  detail[layer]=stats
 arrival=310;duration=2300
 display=dict(telegraph=100,body=210,impact=125,residue=100,support=100 if key=='astral_guard' else 125)
 windows={'telegraph':(0,130,'origin'),'body':(90,350,'moving'),'impact':(310,550,'target'),'residue':(490,790,'target')}
 D=dict(key=key,name=name,element='sword',visualArchetype=kind,layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,display=display,timing=dict(arrivalMs=arrival,gatherMs=90,crossfadeMs=40,aftermathMs=540,durationMs=duration),acceptance=['Independent authored raster master and stage plates','Fixed sword scale and attached painted trails; no gameplay mutation','Actual hit, actual healing and guard ownership control layers; preview uses simulation','Colored source-over, HUD avoidance, explicit cancellation'])
 D['preview']=dict(displayMode=kind,durationMs=duration,distance=233,layers={k:dict(start=a/duration,end=b/duration,anchor=c,width=display[k],height=display[k],fadeIn=(45 if k=='telegraph' else 60 if k=='residue' else 40)/(b-a),fadeOut=(40 if k in ['telegraph','body'] else 100 if k=='residue' else 60)/(b-a)) for k,(a,b,c) in windows.items()})
 D['eventContract']={'hit':'actual combat contact','actualHeal':'positive actual restored HP enables return','guardAt':'authoritative guard apply','guardEnd':'authoritative consumption or replacement','previewOnly':True}
 effects.append(D);report[key]=dict(inputs={str(p.relative_to(R)):hashfile(p) for p in [original,master]},checks=checks,frames=detail,outputHashes={l['file']:hashfile(P/l['file']) for l in layers.values()})
for filename in ['effect-manifest.json','effect-manifest.preview.json']:(P/filename).write_text(json.dumps(dict(schemaVersion=1,effects=effects),ensure_ascii=False,indent=2)+'\n')
(P/'definition.js').write_text('window.SwordBatchDefinitions='+json.dumps(effects,ensure_ascii=False)+';\n')
shutil.copy(A/'sampler.js',P/'choreography.js');shutil.copy(R/'art/absolute-zero/preview/stage-reference.webp',P/'stage-reference.webp')
(A/'asset-audit.json').write_text(json.dumps(dict(command='python3 scripts/build-sword-skills-batch3-vfx.py',sourcePolicy='Check originals for clipping at 2%, expand complete cells, validate 18% safe margins BEFORE slicing. Rejected originals never used.',effects=report),indent=2)+'\n')
print('PASS 3 effects / 14 strips / 88 distinct frames; alpha, margin, exposure and color audits')
