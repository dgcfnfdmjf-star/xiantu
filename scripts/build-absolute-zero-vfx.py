"""Build independent blue-ice raster plates; only alignment, blending and alpha expansion."""
from pathlib import Path
import json,hashlib,subprocess,sys,shutil
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parent.parent; ART=ROOT/'art/absolute-zero'; SRC=ART/'source'; OUT=ART/'preview'; OUT.mkdir(exist_ok=True)
validator=ROOT/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
def audit(p,frames,cols,rows):subprocess.run([sys.executable,str(validator),'--input',str(p),'--frames',str(frames),'--columns',str(cols),'--rows',str(rows),'--safe-margin-percent','.12'],check=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
# Master has complete, unclipped silhouette; expand its individual source canvas for safe framing.
im=Image.open(SRC/'material-master-original.png').convert('RGBA');a=np.array(im)[:,:,3];assert max(a[:2].max(),a[-2:].max(),a[:,:2].max(),a[:,-2:].max())<=12
safe=Image.new('RGBA',(im.width+640,im.height+640));safe.paste(im,(320,320));safe.save(SRC/'material-master-safe.png');audit(SRC/'material-master-safe.png',1,1,1)
raw=Image.open(SRC/'keyplates-original.png').convert('RGBA');audit(SRC/'keyplates-original.png',8,4,2);w,h=raw.width//4,raw.height//2;assert w==h
plates=[];registration=[]
for i in range(8):
 cell=raw.crop((i%4*w,i//4*h,(i%4+1)*w,(i//4+1)*h));a=np.array(cell)[:,:,3];ys,xs=np.where(a>12)
 dx=round(w*.5-(xs.min()+xs.max())/2);dy=round(h*.76-(ys.max()-h*.07))
 moved=Image.new('RGBA',(w,h));moved.paste(cell,(dx,dy));plates.append(moved.resize((256,256),Image.Resampling.LANCZOS));registration.append(dict(cell=i,offset=[dx,dy],bounds=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())]))
def blend(a,b,t):
 aa=np.asarray(a,dtype=float)/255;bb=np.asarray(b,dtype=float)/255
 alpha=aa[:,:,3:]*(1-t)+bb[:,:,3:]*t;rgb=(aa[:,:,:3]*aa[:,:,3:]*(1-t)+bb[:,:,:3]*bb[:,:,3:]*t)/np.maximum(alpha,1e-6)
 return Image.fromarray(np.uint8(np.clip(np.concatenate([rgb,alpha],axis=2)*255,0,255)))
def fade(im,a):
 out=im.copy();out.putalpha(out.getchannel('A').point(lambda x:round(x*a)));return out
seqs={'telegraph':[fade(plates[0],a) for a in [.5,.68,.85,1]],'body':[blend(plates[0],plates[1],i/5) for i in range(6)],'impact':[plates[2],blend(plates[2],plates[3],.5),plates[3],blend(plates[3],plates[4],.5),plates[4],plates[5]],'residue':[plates[5],blend(plates[5],plates[6],.33),blend(plates[5],plates[6],.67),plates[6],blend(plates[6],plates[7],.5),plates[7],fade(plates[7],.6),fade(plates[7],.25)]}
records=[];layers={}
for name,seq in seqs.items():
 strip=Image.new('RGBA',(256*len(seq),256));previous=None
 for i,im in enumerate(seq):
  strip.paste(im,(i*256,0));pixels=np.array(im);a=pixels[:,:,3]/255;rgb=pixels[:,:,:3].astype(float);v=a>12/255;mass=a[v].sum();white=float(a[v&(rgb.min(2)>230)].sum()/mass);blue=float(a[v&(rgb[:,:,2]>rgb[:,:,0]*1.08)&(rgb[:,:,1]>rgb[:,:,0]*1.05)].sum()/mass)
  assert white<.08 and blue>.75,(name,i,white,blue)
  digest=hashlib.sha256(im.tobytes()).hexdigest();assert digest!=previous;previous=digest
  records.append(dict(layer=name,frame=i,sha256=digest,whiteCoverage=white,blueCoverage=blue))
 file='absolute_zero_'+name+'.png';strip.save(OUT/file,optimize=True);audit(OUT/file,len(seq),len(seq),1)
 layers[name]=dict(file=file,frames=len(seq),frameWidth=256,frameHeight=256,pivotX=.5,pivotY=.76,fps={'telegraph':28,'body':35,'impact':25,'residue':20}[name],loop=False,holdLast=False)
D=dict(key='absolute_zero',name='绝对零度',element='ice',visualArchetype='ground-eruption',layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,timing=dict(arrivalMs=310,impactMs=240,crossfadeMs=60,aftermathMs=560,durationMs=900),display={k:340 for k in layers},preview=dict(displayMode='ground-eruption',motion='anchored',durationMs=900,distance=0,layers={k:dict(start=start,end=end,anchor='target',width=340,height=340,fadeIn=fi,fadeOut=fo) for k,start,end,fi,fo in [('telegraph',0,.217,0,.28),('body',.155,.345,.3,0),('impact',.345,.612,0,.25),('residue',.545,.967,.16,.26)]}))
D['acceptance']=['Independent blue-cyan crystalline plates, no copied actor','Target-ground anchored frost, impact only after authoritative hit','Hollow target silhouette, source-over color, no broad white bloom','No damage, MP, freeze, RNG or save mutation']
manifest=dict(schemaVersion=1,effects=[D]);encoded=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
for name in ['effect-manifest.json','effect-manifest.preview.json']:(OUT/name).write_text(encoded)
(OUT/'definition.js').write_text('window.AbsoluteZeroDefinition='+json.dumps(D,ensure_ascii=False,separators=(',',':'))+';\n')
sampler=(ART/'sampler.js').read_text();(OUT/'choreography.js').write_text(sampler+"\n(()=>{const D=window.AbsoluteZeroDefinition;window.AbsoluteZeroPreview={definition:D,sample(age,{quality='rich',hit=true,scale=1,offsetX=0,offsetY=0}={}){return sampleAbsoluteZero(D,{toGround:{x:493+offsetX,y:278+offsetY},scale,light:quality==='light',reduced:quality==='reduced',duration:900,arriveAt:310,hitAt:hit?310:null},age)}}})();\n")
(ART/'asset-audit.json').write_text(json.dumps(dict(sources={p.name:sha(p) for p in SRC.glob('*.png')},registration=registration,frames=records,outputs={p.name:sha(p) for p in OUT.glob('*.png')}),indent=2)+'\n')
if '--runtime' in sys.argv:
 dest=ROOT/'xiantu-v2831-scroll/absolute-zero-v286835';dest.mkdir(exist_ok=True)
 for p in OUT.iterdir():
  if p.is_file():shutil.copyfile(p,dest/p.name)
 p=ROOT/'xiantu-v2831-scroll/xiantu-v2855-skill-fx.js';code=p.read_text();start,end='  // BEGIN ABSOLUTE ZERO GENERATED','  // END ABSOLUTE ZERO GENERATED';block=start+'\n  const ABSOLUTE_ZERO='+json.dumps(D,ensure_ascii=False,separators=(',',':'))+';\n'+sampler+end
 if start in code:a,tail=code.split(start,1);_,b=tail.split(end,1);code=a+block+b
 else:code=code.replace("  let quality='auto';",block+"\n  let quality='auto';",1)
 p.write_text(code)
print('PASS 24 blue-ice frames, alpha, boundaries, palette and stable foot registration')
