"""Export independently authored heart-fire plates; no procedural flame drawing.
Pillow/numpy are offline build dependencies; --runtime promotes reviewed output.
"""
from pathlib import Path
import hashlib,json,subprocess,sys,shutil
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parent.parent;ART=ROOT/'art/heart-fire';SRC=ART/'source';OUT=ART/'preview';OUT.mkdir(parents=True,exist_ok=True)
validator=ROOT/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
def audit_grid(p,frames,cols,margin=.18):
 subprocess.run([sys.executable,str(validator),'--input',str(p),'--frames',str(frames),'--columns',str(cols),'--rows',str(frames//cols),'--safe-margin-percent',str(margin)],check=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
master=Image.open(SRC/'material-master-original.png').convert('RGBA');a=np.array(master)[:,:,3]
assert max(a[:3].max(),a[-3:].max(),a[:,:3].max(),a[:,-3:].max())<=12,'clipped master'
# Expand the complete source canvas; do not crop or scale away a bad edge.
safe=Image.new('RGBA',(master.width+1024,master.height+768));safe.paste(master,(512,384));safe.save(SRC/'material-master-safe.png');audit_grid(SRC/'material-master-safe.png',1,1)
raw=Image.open(SRC/'keyplates-original.png').convert('RGBA');assert raw.width==raw.height
# Preserve the generated original. Complete its fractional last grid pixel with transparency.
rawSide=(raw.width+2)//3;whole=Image.new('RGBA',(rawSide*3,rawSide*3));whole.paste(raw,(0,0));whole.save(SRC/'keyplates-grid.png')
# Reject any actually clipped/cross-cell content before expanding each full cell.
audit_grid(SRC/'keyplates-grid.png',9,3,.02)
side=rawSide+174;grid=Image.new('RGBA',(side*3,side*3))
for i in range(9):
 cell=whole.crop((i%3*rawSide,i//3*rawSide,(i%3+1)*rawSide,(i//3+1)*rawSide))
 grid.paste(cell,(i%3*side+87,i//3*side+87))
grid.save(SRC/'keyplates-safe.png');audit_grid(SRC/'keyplates-safe.png',9,3)
# Only this complete, safe source grid is sliced into authored animation plates.
plates=[];registration=[]
for i in range(9):
 im=grid.crop((i%3*side,i//3*side,(i%3+1)*side,(i//3+1)*side));px=np.array(im);rgb=px[:,:,:3].astype(float);a=px[:,:,3]
 # Bright fire tip/body-contact registration, independent of transparent bounds.
 score=rgb[:,:,0]+rgb[:,:,1]-rgb[:,:,2];score[a<100]=0
 y,x=np.unravel_index(score.argmax(),score.shape)
 target=(round(side*.70),side//2) if i<3 else (side//2,side//2)
 # Scale the complete authored plate uniformly to give normalized visible height.
 normalized=Image.new('RGBA',im.size);normalized.paste(im,(target[0]-x,target[1]-y))
 assert (np.array(normalized)[:,:,3]>12).sum()==(a>12).sum(),'registration cropped pixels'
 plates.append(normalized);registration.append(dict(index=i,sourcePivot=[int(x),int(y)],registeredPivot=list(target)))
 safeGrid=Image.new('RGBA',(side*3,side*3))
for i,p in enumerate(plates):safeGrid.paste(p,(i%3*side,i//3*side))
safeGrid.save(SRC/'keyplates-registered.png');audit_grid(SRC/'keyplates-registered.png',9,3,.12)
mix=lambda a,b,t:Image.blend(plates[a],plates[b],t)
def fade(im,a):
 im=im.copy();im.putalpha(im.getchannel('A').point(lambda v:round(v*a)));return im
frames={'telegraph':[mix(3,4,t) for t in [0,.33,.67,1]],'body':[plates[0],mix(0,1,.5),plates[1],mix(1,2,.5),plates[2],mix(2,1,.5),plates[1],mix(1,0,.5)],'impact':[mix(5,6,t) for t in [0,.2,.4,.6,.8,1]],'residue':[fade(mix(7,8,i/5),1-i*.10) for i in range(6)]}
layers={};records=[]
for name,seq in frames.items():
 size=256;strip=Image.new('RGBA',(size*len(seq),size));previous=None
 for i,im in enumerate(seq):
  im=im.resize((size,size),Image.Resampling.LANCZOS);strip.paste(im,(size*i,0));p=np.array(im);a=p[:,:,3]/255;v=a>12/255;rgb=p[:,:,:3].astype(float);mass=a[v].sum();assert mass>0
  white=float(a[v&(rgb.min(2)>230)].sum()/mass);red=float(a[v&(rgb[:,:,0]>rgb[:,:,1]*1.2)&(rgb[:,:,0]>rgb[:,:,2]*1.2)].sum()/mass)
  assert white<.03 and red>.78,(name,i,white,red)
  digest=hashlib.sha256(im.tobytes()).hexdigest();assert digest!=previous;previous=digest
  y,x=np.where(v);records.append(dict(layer=name,frame=i,sha256=digest,bounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],whiteCoverage=white,redCoverage=red))
 file='heart_fire_'+name+'.png';strip.save(OUT/file,optimize=True);audit_grid(OUT/file,len(seq),len(seq),.12)
 layers[name]=dict(file=file,frames=len(seq),frameWidth=size,frameHeight=size,pivotX=round(side*.70)/side if name=='body' else .5,pivotY=.5,fps={'telegraph':32,'body':8/.217,'impact':6/.18,'residue':6/.42}[name],loop=name=='body',holdLast=False)
effect=dict(key='heart_scorching_fire',name='焚心炎',element='fire',visualArchetype='projectile',layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,
 timing=dict(arrivalMs=310,gatherFraction=.30,impactMs=180,crossfadeMs=60,aftermathMs=540,missFadeMs=140,durationMs=900),
 display=dict(telegraph=200,body=390,impact=230,residue=230),
 preview=dict(displayMode='projectile',motion='travel',durationMs=900,distance=233,layers=dict(
 telegraph=dict(start=0,end=121/900,anchor='origin',width=200,height=200,fadeOut=28/121),body=dict(start=93/900,end=310/900,anchor='moving',width=390,height=390,fadeIn=28/217),impact=dict(start=310/900,end=490/900,anchor='target',width=230,height=230,fadeOut=1/3),residue=dict(start=430/900,end=850/900,anchor='target',width=230,height=230,fadeIn=60/420,fadeOut=100/420))),
 acceptance=['Independent crimson-black material master, no reused solar art','Fixed-size tip-aligned projectile; torso-centered impact only after real hit','Registered target pivot and complementary impact/residue alpha','No damage, shield break, debuff, RNG or save mutations'])
encoded=json.dumps(dict(schemaVersion=1,effects=[effect]),ensure_ascii=False,indent=2)+'\n'
for name in ['effect-manifest.json','effect-manifest.preview.json']:(OUT/name).write_text(encoded)
(OUT/'definition.js').write_text('window.HeartFireDefinition='+json.dumps(effect,ensure_ascii=False,separators=(',',':'))+';\n')
sampler=(ART/'sampler.js').read_text();(OUT/'choreography.js').write_text(sampler+'''\n(()=>{const D=window.HeartFireDefinition;window.HeartFirePreview={definition:D,sample(age,{quality='rich',hit=true,scale=1,offsetX=0,offsetY=0}={}){const move=p=>({x:p.x+offsetX,y:p.y+offsetY});return sampleHeartFire(D,{from:move({x:260,y:205}),to:move({x:493,y:210}),scale,light:quality==='light',reduced:quality==='reduced',duration:900,arriveAt:310,hitAt:hit?310:null},age)}}})();\n''')
sourcePalette=[]
for file,cols in [('material-master-safe.png',1),('keyplates-safe.png',3)]:
 im=np.array(Image.open(SRC/file));h,w=im.shape[:2]
 for i in range(cols*cols):
  p=im[i//cols*(h//cols):(i//cols+1)*(h//cols),i%cols*(w//cols):(i%cols+1)*(w//cols)];a=p[:,:,3]/255;v=a>12/255;rgb=p[:,:,:3].astype(float);mass=a[v].sum();white=float(a[v&(rgb.min(2)>230)].sum()/mass);red=float(a[v&(rgb[:,:,0]>rgb[:,:,1]*1.2)&(rgb[:,:,0]>rgb[:,:,2]*1.2)].sum()/mass)
  assert white<.03 and red>.78,(file,i,white,red)
  sourcePalette.append(dict(file=file,cell=i,whiteCoverage=white,redCoverage=red))
report=dict(sourcePalette=sourcePalette,sources={p.name:sha(p) for p in SRC.glob('*.png')},registration=registration,outputs={p.name:sha(p) for p in OUT.glob('*.png')},manifest=sha(OUT/'effect-manifest.json'),frames=records)
(ART/'asset-audit.json').write_text(json.dumps(report,indent=2)+'\n')
if '--runtime' in sys.argv:
 dest=ROOT/'xiantu-v2831-scroll/heart-fire-v286833';dest.mkdir(exist_ok=True)
 for p in OUT.iterdir():
  if p.is_file():shutil.copyfile(p,dest/p.name)
 p=ROOT/'xiantu-v2831-scroll/xiantu-v2855-skill-fx.js';code=p.read_text();start,end='  // BEGIN HEART FIRE GENERATED','  // END HEART FIRE GENERATED';block=start+'\n  const HEART_FIRE='+json.dumps(effect,ensure_ascii=False,separators=(',',':'))+';\n'+sampler+end
 if start in code:a,tail=code.split(start,1);_,b=tail.split(end,1);code=a+block+b
 else:code=code.replace("  let quality='auto';",block+"\n  let quality='auto';",1)
 p.write_text(code)
print('PASS source boundaries, source-over palette, 24 frames, manifest and sampler export')
