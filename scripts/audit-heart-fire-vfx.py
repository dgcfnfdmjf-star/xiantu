"""Reproducible comparison/overlap sheets from current sources, sampler and manifests."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,subprocess,hashlib,math
R=Path(__file__).resolve().parent.parent;A=R/'art/heart-fire';O=A/'evidence';O.mkdir(exist_ok=True)
D=json.loads((A/'preview/effect-manifest.json').read_text())['effects'][0]
code="const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);const D=JSON.parse(fs.readFileSync(process.argv[2])).effects[0];console.log(JSON.stringify(Array.from({length:28},(_,i)=>({time:i*33,parts:c.sampleHeartFire(D,{from:{x:260,y:205},to:{x:493,y:210},scale:1,duration:900,arriveAt:310,hitAt:310},i*33)}))))"
data=json.loads(subprocess.check_output(['node','-e',code,str(A/'sampler.js'),str(A/'preview/effect-manifest.json')]))
bg=Image.open(A/'preview/stage-reference.webp').convert('RGBA').resize((720,420));strips={n:Image.open(A/'preview'/l['file']).convert('RGBA') for n,l in D['layers'].items()}
def render(parts):
 out=bg.copy()
 for p in parts:
  l=D['layers'][p['layer']];w,h=l['frameWidth'],l['frameHeight'];im=strips[p['layer']].crop((p['frame']*w,0,(p['frame']+1)*w,h)).resize((round(p['width']),round(p['height'])),Image.Resampling.LANCZOS)
  im.putalpha(im.getchannel('A').point(lambda a:round(a*p['opacity'])))
  # Pure sampler uses small target-height difference; rotate around authored pivot on a larger local canvas.
  pivot=(round(p['width']*p['pivotX']),round(p['height']*p['pivotY']));layer=Image.new('RGBA',(1200,1200));layer.paste(im,(600-pivot[0],600-pivot[1]));layer=layer.rotate(-p['rotation']*180/math.pi,resample=Image.Resampling.BICUBIC,center=(600,600))
  out.alpha_composite(layer,(round(p['x'])-600,round(p['y'])-600))
 return out
frames=[render(x['parts']).convert('RGB') for x in data];frames[0].save(O/'heart-fire-animation.webp',save_all=True,append_images=frames[1:],duration=33,loop=0,quality=85)
def sheet(items,name,columns):
 out=Image.new('RGB',(720*columns,448*math.ceil(len(items)/columns)),(19,32,29));draw=ImageDraw.Draw(out)
 for i,(label,im) in enumerate(items):x=i%columns*720;y=i//columns*448;draw.text((x+12,y+8),label,fill='#eed7b0');out.paste(im.convert('RGB'),(x,y+28))
 out.save(O/name)
sheet([(f'{data[i]["time"]} ms',frames[i]) for i in [2,6,10,13,14,15,22,27]],'stages-and-overlaps.jpg',2)
# Material reference and newest body compared at identical visible-alpha width on real stage.
master=Image.open(A/'source/material-master-safe.png').convert('RGBA');box=master.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox();master=master.crop(box);master.thumbnail((175,100));ref=bg.copy();ref.alpha_composite(master,(320,200-master.height//2))
old=Image.open(A/'source/previous-runtime.png').convert('RGB').resize((720,420))
sheet([('Authored reference material - normalized visible size',ref),('Previous procedural runtime (impact)',old),('New raster runtime (travel)',frames[6]),('New raster runtime (torso impact)',frames[11])],'comparison.jpg',2)
records={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [A/'sampler.js',A/'preview/effect-manifest.json',A/'preview/stage-reference.webp',A/'source/previous-runtime.png',*list((A/'source').glob('*.png')),*list((A/'preview').glob('*.png'))]}
(O/'provenance.json').write_text(json.dumps({'inputs':records,'samples':data,'outputs':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in O.iterdir() if p.suffix in ['.jpg','.webp']}},indent=2))
print('PASS evidence generated from hashed current sources and shared runtime sampler')
