"""Build Absolute Zero assets from independently authored raster art.

Pillow/numpy are offline tools. Masks reveal/dissolve existing painted pixels;
no procedural effect bodies. --runtime promotes approved art and shared sampling.
"""
from pathlib import Path
import json,hashlib,subprocess,sys,math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'art/absolute-zero';SRC=ART/'source';OUT=ART/'preview'
VALIDATOR=ROOT/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
def validate(p,count,columns,margin):
 subprocess.run([sys.executable,str(VALIDATOR),'--input',str(p),'--frames',str(count),'--columns',str(columns),'--rows',str(count//columns),'--safe-margin-percent',str(margin)],check=True)
def expand(name,n,size):
 im=Image.open(SRC/(name+'-original.png')).convert('RGBA');assert im.width==im.height and im.width%n==0
 old=im.width//n;pad=(size-old)//2;result=Image.new('RGBA',(size*n,size*n))
 for i in range(n*n):
  cell=im.crop((i%n*old,i//n*old,(i%n+1)*old,(i//n+1)*old));a=np.array(cell)[:,:,3]
  assert max(a[:3].max(),a[-3:].max(),a[:,:3].max(),a[:,-3:].max())<=12,'Source is clipped: regenerate'
  result.paste(cell,(i%n*size+pad,i//n*size+pad))
 p=SRC/(name+'-safe.png');result.save(p);validate(p,n*n,n,.18);return result
master=expand('master',1,2016).resize((672,672),Image.Resampling.LANCZOS)
source=expand('keyplates',3,672)
# Slicing only occurs after every expanded source cell passes.
plates=[source.crop((i%3*672,i//3*672,(i%3+1)*672,(i//3+1)*672)) for i in range(9)]
def stats(im):
 p=np.array(im);a=p[:,:,3]/255;mask=a>12/255;rgb=p[:,:,:3].astype(float);mass=a[mask].sum();assert mass>0
 white=float(a[mask&(rgb.min(2)>230)].sum()/mass);blue=float(a[mask&(rgb[:,:,2]>rgb[:,:,0]*1.08)].sum()/mass)
 assert white<.12,white;assert blue>.75,blue
 y,x=np.where(mask);return dict(bounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],whiteCoverage=white,blueCoverage=blue)
# Normalize complete plates using visible center (core) or painted floor contact.
registration=[]
for i,im in enumerate(plates):
 a=np.array(im)[:,:,3]/255;yy,xx=np.indices(a.shape);weights=a*a
 if i<2:
  # Core diamonds occupy the center of each plate; ignore outer faint mist.
  weights*=((xx>260)&(xx<430)&(yy>260)&(yy<440))
 else:
  visible=a>.4;rows=np.where(visible)[0];bottom=int(rows.max());weights*=yy>bottom-35
 observed=((xx*weights).sum()/weights.sum(),(yy*weights).sum()/weights.sum());target=(336,336 if i<2 else 450)
 shift=(round(target[0]-observed[0]),round(target[1]-observed[1]));normalized=Image.new('RGBA',im.size);normalized.paste(im,shift)
 assert (np.array(normalized)[:,:,3]>12).sum()==(np.array(im)[:,:,3]>12).sum()
 plates[i]=normalized;registration.append(dict(cell=i,observedPivot=observed,targetPivot=target,translate=shift))
# Fixed shell ground pivot; it is never stretched to build upwards.
normalized=Image.new('RGBA',master.size);normalized.paste(master,(0,-3));master=normalized
master_stats=stats(master);center=np.array(master)[265:390,265:407,3];assert (center<=12).mean()>.95 and center.mean()/255<.05,'Sparse facet lines must leave the monster window clear'
def alpha(im,factor):
 result=im.copy();a=np.array(im.getchannel('A'),dtype=float);result.putalpha(Image.fromarray(np.clip(np.rint(a*factor),0,255).astype('uint8')));return result
mix=lambda a,b,t:Image.blend(plates[a],plates[b],t)
y=np.indices((672,672))[0]
telegraph=[mix(0,1,t) for t in [0,.2,.4,.6,.8,1]]
body=[mix(2,3,(1-math.cos(i/8*math.tau))/2) for i in range(8)]
impact=[]
for i in range(6):
 # Reveal the already-authored crystal from its floor towards its roof.
 threshold=480-(i+1)/6*320;impact.append(alpha(master,np.clip((y-threshold+30)/30,0,1)))
sustain=[]
for i in range(8):
 # A mild moving transparency modulation on existing facets adds a cold shimmer.
 factor=1-.12*math.sin(math.pi*i/8)**2*(.4+.6*(.5+.5*np.cos(y*.026-i*math.tau/8)))
 sustain.append(alpha(master,factor))
residue=[alpha(mix(4,5,i/5),1-i*.16) for i in range(6)]
frames=dict(telegraph=telegraph,body=body,impact=impact,sustain=sustain,residue=residue);layers={};records=[]
for name,seq in frames.items():
 size=192 if name=='telegraph' else 256 if name in ('body','residue') else 384
 strip=Image.new('RGBA',(size*len(seq),size));last=None
 for i,im in enumerate(seq):
  im=im.resize((size,size),Image.Resampling.LANCZOS);record=stats(im);digest=hashlib.sha256(im.tobytes()).hexdigest();assert digest!=last;last=digest
  record.update(layer=name,frame=i,sha256=digest);records.append(record);strip.paste(im,(i*size,0))
 file='absolute_zero_'+name+'.png';strip.save(OUT/file,optimize=True);validate(OUT/file,len(seq),len(seq),.12)
 layers[name]=dict(file=file,frames=len(seq),frameWidth=size,frameHeight=size,pivotX=.5,pivotY=.5 if name=='telegraph' else 450/672,fps=dict(telegraph=40,body=32,impact=6/.18,sustain=12,residue=20)[name],loop=name in ('body','sustain'),holdLast=False)
effect=dict(key='absolute_zero',name='绝对零度',element='ice',visualArchetype='moving-front',layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,
 display=dict(telegraph=140,body=260,impact=460,sustain=460,residue=300),timing=dict(gatherMs=95,arrivalMs=310,impactMs=180,crossfadeMs=60,releaseMs=300,defaultFreezeEndMs=1600),
 preview=dict(displayMode='moving-front',motion='travel',durationMs=1900,distance=233,layers=dict(
 telegraph=dict(start=0,end=150/1900,anchor='origin',width=140,height=140,fadeIn=.1,fadeOut=.4),body=dict(start=95/1900,end=370/1900,anchor='moving',width=260,height=260,fadeIn=.15,fadeOut=60/275),impact=dict(start=310/1900,end=490/1900,anchor='target',width=460,height=460,fadeOut=1/3),sustain=dict(start=430/1900,end=1,anchor='target',width=460,height=460,fadeIn=60/1470,fadeOut=300/1470),residue=dict(start=1600/1900,end=1,anchor='target',width=300,height=300,fadeIn=.2,fadeOut=.6))),
 acceptance=['Hollow shell has clear central monster window','Fixed-size moving front; no stretched beam','Acknowledged hit and current frozen target own separate visual layers','Eight-frame sustain continues until freeze ends; target loss clears immediately','One registered shell silhouette through impact/sustain/release','Combat state stays authoritative; preview inputs only simulate it'])
manifest=dict(schemaVersion=1,effects=[effect]);text=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
for name in ['effect-manifest.json','effect-manifest.preview.json']:(OUT/name).write_text(text)
(OUT/'definition.js').write_text('/* Generated asset configuration */\nwindow.AbsoluteZeroDefinition='+json.dumps(effect,ensure_ascii=False,separators=(',',':'))+';\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report=dict(sourceHashes={p.name:sha(p) for p in SRC.glob('*.png')},registration=registration,master=master_stats,centerClearFraction=float((center<=12).mean()),centerMeanAlpha=float(center.mean()/255),sourcePalette=[stats(im) for im in plates],frames=records,outputs={p.name:sha(p) for p in OUT.glob('absolute_zero_*.png')},manifest=sha(OUT/'effect-manifest.json'))
(ART/'asset-audit.json').write_text(json.dumps(report,indent=2)+'\n');print('PASS safe sources, clear center, palette, frames and export')

# Shared deterministic choreography for the approved DOM preview and runtime.
sampler=(ART/'sampler.js').read_text()
adapter="""
(()=>{const D=window.AbsoluteZeroDefinition;
 window.AbsoluteZeroPreview={definition:D,sample(age,{hit=true,freezeEnd=D.timing.defaultFreezeEndMs,targetPresent=true,quality='rich',scale=1,offsetX=0,offsetY=0}={}){
  const move=p=>({x:p.x+offsetX,y:p.y+offsetY});
  return sampleAbsoluteZero(D,{from:move({x:260,y:225}),to:move({x:493,y:225}),fromGround:move({x:242,y:305}),toGround:move({x:493,y:278}),scale,light:quality==='light',reduced:quality==='reduced',hitAt:hit?D.timing.arrivalMs:null,freezeEnd,targetPresent},age);
 }};
})();
"""
(OUT/'choreography.js').write_text(sampler+adapter)
if '--runtime' in sys.argv:
 import shutil
 destination=ROOT/'xiantu-v2831-scroll/absolute-zero-v286832';destination.mkdir(exist_ok=True)
 for p in OUT.iterdir():
  if p.is_file():shutil.copyfile(p,destination/p.name)
 page=destination/'index.html'
 page.write_text(page.read_text().replace('</main>','<p><a style="color:#88ddff" href="../battle-25d-preview.html?skill=绝对零度">进入角色与怪物同台试演 →</a></p></main>'))
 runtime=ROOT/'xiantu-v2831-scroll/xiantu-v2855-skill-fx.js'
 code=runtime.read_text();start,end='  // BEGIN ABSOLUTE ZERO GENERATED','  // END ABSOLUTE ZERO GENERATED'
 block=start+'\n  const ABSOLUTE_ZERO = '+json.dumps(effect,ensure_ascii=False,separators=(',',':'))+';\n'+sampler+end
 if start in code:
  a,tail=code.split(start,1);_,b=tail.split(end,1);code=a+block+b
 else:code=code.replace("  let quality='auto';",block+"\n  let quality='auto';",1)
 runtime.write_text(code)
 print('PASS approved absolute zero resources and shared choreography promoted')
