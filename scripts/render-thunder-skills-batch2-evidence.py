#!/usr/bin/env python3
"""Reproducible raster compositing of exported strips, using the pure sampler."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,json,hashlib
R=Path(__file__).resolve().parents[1];A=R/'art/thunder-skills-batch2';P=A/'preview';E=A/'evidence';E.mkdir(exist_ok=True)
js="""const s=require('./art/thunder-skills-batch2/sampler.js').sampleThunderBatch,ds=require('./art/thunder-skills-batch2/preview/effect-manifest.json').effects;console.log(JSON.stringify(ds.map(d=>{const arrival=d.timing.arrivalMs,start=arrival*.45,fade=d.timing.crossfadeMs,impact=d.timing.impactMs;const j={from:{x:260,y:205},fromGround:{x:260,y:278},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:arrival};return {key:d.key,frames:Array.from({length:36},(_,i)=>({t:i*40,parts:s(d,j,i*40)})),overlaps:[start+1,start+fade/2,start+fade-1,arrival+1,arrival+fade/2,arrival+fade-1,arrival+impact-fade+1,arrival+impact-fade/2,arrival+impact-1].map(t=>({t,parts:s(d,j,t)}))}})));"""
data=json.loads(subprocess.check_output(['node','-e',js],cwd=R));defs={d['key']:d for d in json.loads((P/'effect-manifest.json').read_text())['effects']}
bg=Image.open(P/'stage-reference.webp').convert('RGBA');font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',14);strips={}
def draw(key,parts):
 out=bg.copy()
 for p in parts:
  L=defs[key]['layers'][p['layer']];file=P/L['file'];sheet=strips.setdefault(str(file),Image.open(file).convert('RGBA'))
  im=sheet.crop((p['frame']*L['frameWidth'],0,(p['frame']+1)*L['frameWidth'],L['frameHeight'])).resize((round(p['width']),round(p['height'])),Image.Resampling.LANCZOS)
  im.putalpha(im.getchannel('A').point(lambda a:round(a*p['opacity'])))
  out.alpha_composite(im,(round(p['x']-p['width']*p['pivotX']),round(p['y']-p['height']*p['pivotY'])))
 return out.convert('RGB')
for item in data:
 frames=[draw(item['key'],f['parts']) for f in item['frames']];frames[0].save(E/(item['key']+'.webp'),save_all=True,append_images=frames[1:],duration=40,loop=0,quality=90)
 sheet=Image.new('RGB',(1080,720),'#111729');dd=ImageDraw.Draw(sheet)
 for i,f in enumerate(item['overlaps']):
  x=i%3*360;y=i//3*240;sheet.paste(draw(item['key'],f['parts']).resize((360,210)),(x,y));dd.text((x+4,y+214),f"{f['t']:.0f}ms "+','.join(p['layer']+':'+str(round(p['opacity'],2)) for p in f['parts']),font=font,fill='#dce7ff')
 sheet.save(E/(item['key']+'-overlaps.jpg'),quality=92)
frames=[]
for i in range(36):
 im=Image.new('RGB',(720,3*448),'#111729');dd=ImageDraw.Draw(im)
 for row,item in enumerate(data):
  dd.text((10,row*448+5),defs[item['key']]['name']+' · 资源试播',font=font,fill='#98caff');im.paste(draw(item['key'],item['frames'][i]['parts']),(0,row*448+28))
 frames.append(im)
videoDir=R/'output/playwright/thunder-batch2/video-frames';videoDir.mkdir(parents=True,exist_ok=True)
for i,im in enumerate(frames):im.save(videoDir/f'{i:03d}.png')
frames[0].save(E/'thunder-batch-animation.webp',save_all=True,append_images=frames[1:],duration=40,loop=0,quality=88)
# Visible-size-normalized old/new comparison. Slice old with its OWN manifest.
oldP=R/'art/element-skills-v286838/preview';old=json.loads((oldP/'effect-manifest.json').read_text())['effects'][0]['layers']['body'];oldFile=R/'xiantu-v2831-scroll/element-skills-v286838'/old['file'];oldStrip=Image.open(oldFile).convert('RGBA');oldBody=oldStrip.crop((2*old['frameWidth'],0,3*old['frameWidth'],old['frameHeight']))
board=Image.open(A/'design/style-reference.png').convert('RGB');board.thumbnail((1080,410));sheet=Image.new('RGB',(1080,board.height+760),'#111729');sheet.paste(board,(0,0));dd=ImageDraw.Draw(sheet)
for col,label in enumerate(['Independent material master','Previous SHARED thunder body','Exported independent body']):dd.text((col*360+6,board.height+5),label,font=font,fill='#98caff')
for row,item in enumerate(data):
 key=item['key'];L=defs[key]['layers']['body'];new=Image.open(P/L['file']).convert('RGBA').crop((2*L['frameWidth'],0,3*L['frameWidth'],L['frameHeight']))
 for col,im in enumerate([Image.open(A/'source'/key/'master-original.png').convert('RGBA'),oldBody,new]):
  bounds=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();im=im.crop(bounds);ratio=min(160/im.width,160/im.height);im=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS);stage=bg.copy();stage.alpha_composite(im,(493-im.width//2,278-im.height));x=col*360;y=board.height+30+row*240;sheet.paste(stage.convert('RGB').resize((360,210)),(x,y));dd.text((x+6,y+212),key,font=font,fill='#dce7ff')
sheet.save(E/'comparison.jpg',quality=92)
(E/'samples.json').write_text(json.dumps(data,indent=2))
inputs=[P/'effect-manifest.json',A/'sampler.js',P/'stage-reference.webp',A/'design/style-reference.png',oldP/'effect-manifest.json',oldFile]+list(P.glob('*.png'))+list(A.glob('source/*/master-original.png'))
(E/'provenance.json').write_text(json.dumps({'command':'python3 scripts/render-thunder-skills-batch2-evidence.py','inputs':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'scope':'Offline composition from pure sampler and real exported strips; not runtime combat footage'},indent=2))
print('PASS: animations, overlaps, visible-size-normalized comparison and input hashes generated')
