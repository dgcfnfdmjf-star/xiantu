"""Export authored ice butterfly resources and optionally promote with --runtime.

Requires Pillow/numpy offline. No procedural drawing of effect bodies,
combat-state access or gameplay random numbers. Originals remain intact.
"""
from pathlib import Path
import hashlib,json,subprocess,sys
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'art/ice-butterfly'; SRC=ART/'source'; OUT=ART/'preview'; OUT.mkdir(parents=True,exist_ok=True)
VALIDATOR=ROOT/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
def audit_grid(p,n,cols,margin=.18):
 subprocess.run([sys.executable,str(VALIDATOR),'--input',str(p),'--frames',str(n),'--columns',str(cols),'--rows',str(n//cols),'--safe-margin-percent',str(margin)],check=True)
def expand(name,n,size):
 im=Image.open(SRC/(name+'-original.png')).convert('RGBA'); assert im.width==im.height and im.width%n==0
 cell=im.width//n; pad=(size-cell)//2; out=Image.new('RGBA',(n*size,n*size))
 for i in range(n*n):
  p=im.crop((i%n*cell,i//n*cell,(i%n+1)*cell,(i//n+1)*cell));a=np.array(p)[:,:,3]
  assert max(a[:3].max(),a[-3:].max(),a[:,:3].max(),a[:,-3:].max())<=12,'Clipped source must be regenerated'
  out.paste(p,(i%n*size+pad,i//n*size+pad))
 path=SRC/(name+'-safe.png');out.save(path);audit_grid(path,n*n,n);return out
expand('material-master',1,2016)
safe=expand('keyplates',3,672)
# Slice only after the complete expanded grid passes validation.
observed=[(355,405),(339,405),(328,407),(354,446),(337,469),(329,480),(350,447),(339,448),(324,434)]
plates=[];registration=[]
for i,pivot in enumerate(observed):
 cell=safe.crop((i%3*672,i//3*672,(i%3+1)*672,(i//3+1)*672));target=(336,336 if i<3 else 450)
 shift=(target[0]-pivot[0],target[1]-pivot[1]);normalized=Image.new('RGBA',cell.size);normalized.paste(cell,shift)
 assert (np.array(cell)[:,:,3]>12).sum()==(np.array(normalized)[:,:,3]>12).sum()
 plates.append(normalized);registration.append(dict(index=i,observedPivot=pivot,targetPivot=target,translate=shift))
def fade(im,a):
 im=im.copy();im.putalpha(im.getchannel('A').point(lambda v:round(v*a)));return im
mix=lambda a,b,t:Image.blend(plates[a],plates[b],t)
frames={'telegraph':[mix(3,8,t) for t in [0,.33,.67,1]],
 'body':[plates[0],mix(0,1,.5),plates[1],mix(1,2,.5),plates[2],mix(2,1,.5),plates[1],mix(1,0,.5)],
 'impact':[mix(4,5,t) for t in [0,.25,.5,.75,1,1]],
 'residue':[fade(mix(6,7,i/5),1-i*.10) for i in range(6)]}
# Last impact plate settles slightly before opacity crossfade; does not freeze.
frames['impact'][-1]=fade(frames['impact'][-1],.94)
records=[];layers={}
for name,seq in frames.items():
 size=128 if name=='body' else 256;strip=Image.new('RGBA',(size*len(seq),size));previous=None
 for i,im in enumerate(seq):
  im=im.resize((size,size),Image.Resampling.LANCZOS);strip.paste(im,(i*size,0));p=np.array(im);a=p[:,:,3]/255;visible=a>12/255;rgb=p[:,:,:3].astype(float);mass=a[visible].sum();assert mass>0
  white=float(a[visible&(rgb.min(axis=2)>230)].sum()/mass)
  blue=float(a[visible&(rgb[:,:,2]>rgb[:,:,0]*1.18)].sum()/mass)
  assert white<.10,(name,i,white);assert blue>.78,(name,i,blue)
  sha=hashlib.sha256(im.tobytes()).hexdigest();assert sha!=previous;previous=sha
  y,x=np.where(visible);records.append(dict(layer=name,frame=i,sha256=sha,bounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],whiteCoverage=white,blueCoverage=blue))
 file='ice_butterfly_'+name+'.png';strip.save(OUT/file,optimize=True);audit_grid(OUT/file,len(seq),len(seq),.12)
 layers[name]=dict(file=file,frames=len(seq),frameWidth=size,frameHeight=size,pivotX=.5,pivotY=.5 if name=='body' else 450/672,fps=dict(body=32,telegraph=4/0.13,impact=6/0.18,residue=6/0.4)[name],loop=name=='body',holdLast=False)
effect=dict(key='ice_butterfly_dance',name='冰蝶幻舞',element='ice',visualArchetype='projectile-volley',layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=18,
 timing=dict(arrivalMs=310,gatherMs=95,impactMs=180,crossfadeMs=60,residueEndMs=830,durationMs=900),
 display=dict(body=76,telegraph=256,impact=260,residue=260),volley=dict(count=7,lightCount=4,arcHeight=40),
 preview=dict(displayMode='projectile-volley',motion='travel',durationMs=900,distance=233,layers=dict(
 telegraph=dict(start=0,end=130/900,anchor='origin',width=256,height=256,fadeIn=.2,fadeOut=.3),body=dict(start=0,end=310/900,anchor='moving',width=76,height=76,fadeIn=.08),
 impact=dict(start=310/900,end=490/900,anchor='target',width=260,height=260,fadeOut=1/3),residue=dict(start=430/900,end=830/900,anchor='target',width=260,height=260,fadeIn=.15,fadeOut=.25))),
 acceptance=['Independent crystal butterfly master and three authored wing poses','Fixed-size bodies and parent-attached short trails','Impact consumes existing hit event; does not roll freeze or damage','Registered target ground pivot; complementary impact/residue opacity','Approved resources; hit, freeze, damage and RNG remain engine-owned'])
manifest=dict(schemaVersion=1,effects=[effect]);encoded=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
for name in ['effect-manifest.json','effect-manifest.preview.json']:(OUT/name).write_text(encoded)
(OUT/'definition.js').write_text('/* Generated by scripts/build-ice-butterfly-vfx.py */\nwindow.IceButterflyDefinition='+json.dumps(effect,ensure_ascii=False,separators=(',',':'))+';\n')
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report=dict(sources={p.name:hashfile(p) for p in sorted(SRC.glob('*.png'))},registration=registration,outputs={p.name:hashfile(p) for p in sorted(OUT.glob('*.png'))},manifest=hashfile(OUT/'effect-manifest.json'),frames=records)
source_palette=[]
for source_name,grid in [('material-master-safe.png',1),('keyplates-safe.png',3)]:
 pixels=np.array(Image.open(SRC/source_name));side=pixels.shape[0]//grid
 for i in range(grid*grid):
  c=pixels[i//grid*side:(i//grid+1)*side,i%grid*side:(i%grid+1)*side];alpha=c[:,:,3]/255;rgb=c[:,:,:3].astype(float);visible=alpha>12/255;mass=alpha[visible].sum()
  white=float(alpha[visible&(rgb.min(2)>230)].sum()/mass);blue=float(alpha[visible&(rgb[:,:,2]>rgb[:,:,0]*1.18)].sum()/mass)
  assert white<.10 and blue>.78
  source_palette.append(dict(file=source_name,cell=i,whiteCoverage=white,blueCoverage=blue))
report['sourcePaletteAudit']=source_palette
(ART/'asset-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS current sources, alpha, margins, palette, adjacent-frame distinction and export')

# Embed the same pure sampler into the preview and (when requested) the existing
# runtime module, preserving the fixed 40-script game loader.
sampler=(ART/'sampler.js').read_text()
adapter="""
(()=>{
 const D=window.IceButterflyDefinition;
 window.IceButterflyPreview={definition:D,sample(age,{quality='rich',hit=true,scale=1,offsetX=0,offsetY=0}={}){
  const move=p=>({x:p.x+offsetX,y:p.y+offsetY});
  return sampleIceButterfly(D,{from:move({x:260,y:225}),to:move({x:493,y:225}),fromGround:move({x:242,y:305}),toGround:move({x:493,y:278}),scale,light:quality==='light',reduced:quality==='reduced',duration:D.timing.durationMs,arriveAt:D.timing.arrivalMs,hitAt:hit?D.timing.arrivalMs:null},age);
 }};
})();
"""
(OUT/'choreography.js').write_text(sampler+adapter)
if '--runtime' in sys.argv:
 import shutil
 destination=ROOT/'xiantu-v2831-scroll/ice-butterfly-v286831';destination.mkdir(exist_ok=True)
 for p in OUT.iterdir():
  if p.is_file():shutil.copyfile(p,destination/p.name)
 page=destination/'index.html'
 page.write_text(page.read_text().replace('</main>','<p><a style="color:#88ddff" href="../battle-25d-preview.html?skill=冰蝶幻舞">进入角色与怪物同台试演 →</a></p></main>'))
 runtime=ROOT/'xiantu-v2831-scroll/xiantu-v2855-skill-fx.js'
 code=runtime.read_text();start,end='  // BEGIN ICE BUTTERFLY GENERATED','  // END ICE BUTTERFLY GENERATED'
 block=start+'\n  const ICE_BUTTERFLY = '+json.dumps(effect,ensure_ascii=False,separators=(',',':'))+';\n'+sampler+end
 if start in code:
  a,tail=code.split(start,1);_,b=tail.split(end,1);code=a+block+b
 else:code=code.replace("  let quality='auto';",block+"\n  let quality='auto';",1)
 runtime.write_text(code)
 print('PASS approved resource promotion and shared sampler export')
