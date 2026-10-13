#!/usr/bin/env python3
"""Composite actual exported PNGs from pure sampler output, no effect painting."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,subprocess,hashlib
R=Path(__file__).resolve().parents[1];A=R/'art/fire-skills-batch1';P=A/'preview';E=A/'evidence';E.mkdir(exist_ok=True)
js="""const {sampleFireBatch:s}=require('./art/fire-skills-batch1/sampler.js');const ds=require('./art/fire-skills-batch1/preview/effect-manifest.json').effects;console.log(JSON.stringify(ds.map(d=>({key:d.key,frames:Array.from({length:35},(_,i)=>({t:i*40,parts:s(d,{from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:310,detonationAt:d.key==='flame_burst'?370:null},i*40)})),overlaps:[100,120,139,310,330,349,370,390,409,450,470,489,650,680,709].map(t=>({t,parts:s(d,{from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:310,detonationAt:d.key==='flame_burst'?370:null},t)}))}))));"""
data=json.loads(subprocess.check_output(['node','-e',js],cwd=R));defs={d['key']:d for d in json.loads((P/'effect-manifest.json').read_text())['effects']}
bg=Image.open(P/'stage-reference.webp').convert('RGBA');font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
strips={}
def draw(key,parts):
 out=bg.copy()
 for p in parts:
  L=defs[key]['layers'][p['layer']];path=P/L['file'];sheet=strips.setdefault(str(path),Image.open(path).convert('RGBA'))
  f=sheet.crop((p['frame']*256,0,(p['frame']+1)*256,256)).resize((round(p['width']),round(p['height'])),Image.Resampling.LANCZOS)
  f.putalpha(f.getchannel('A').point(lambda a:round(a*p['opacity'])))
  out.alpha_composite(f,(round(p['x']-p['width']*p['pivotX']),round(p['y']-p['height']*p['pivotY'])))
 return out.convert('RGB')
for item in data:
 key=item['key'];frames=[draw(key,f['parts']) for f in item['frames']];frames[0].save(E/(key+'.webp'),save_all=True,append_images=frames[1:],duration=40,loop=0,quality=88)
 contact=Image.new('RGB',(1080,5*240),'#24191d');d=ImageDraw.Draw(contact)
 for i,f in enumerate(item['overlaps']):
  x=i%3*360;y=i//3*240;contact.paste(draw(key,f['parts']).resize((360,210)),(x,y));d.text((x+5,y+211),str(f['t'])+'ms '+','.join(p['layer']+':'+str(round(p['opacity'],2)) for p in f['parts']),font=font,fill='#f1dedb')
 contact.save(E/(key+'-overlaps.jpg'),quality=90)
# One animated strip for convenient review: all three plus separate burst normal-hit case in the HTML.
frames=[]
for i in range(35):
 out=Image.new('RGB',(720,3*448),'#24191d');d=ImageDraw.Draw(out)
 for row,item in enumerate(data):d.text((12,row*448+6),item['key']+(' (detonation)' if row==1 else ''),font=font,fill='#ffbb88');out.paste(draw(item['key'],item['frames'][i]['parts']),(0,row*448+28))
 frames.append(out)
frames[0].save(E/'fire-batch-animation.webp',save_all=True,append_images=frames[1:],duration=40,loop=0,quality=86)
(E/'samples.json').write_text(json.dumps(data,indent=2))
inputs=[P/'effect-manifest.json',A/'sampler.js',P/'stage-reference.webp',A/'design/approved-storyboard.png']+list(P.glob('*.png'))
(E/'provenance.json').write_text(json.dumps({'command':'python scripts/render-fire-skills-batch1-evidence.py','inputs':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}},indent=2))
print('Generated resource animations and sampled overlap sheets')
# The full approved storyboard is retained above three normalized material comparisons.
board=Image.open(A/'design/approved-storyboard.png').convert('RGB');board.thumbnail((720,500))
comparison=Image.new('RGB',(1080,board.height+3*238+40),'#24191d');comparison.paste(board,((1080-board.width)//2,0));dc=ImageDraw.Draw(comparison)
for col,title in enumerate(['Independent material master','Previous runtime (target detail)','Exported new body / impact']):dc.text((col*360+8,board.height+9),title,font=font,fill='#ffccaa')
for row,item in enumerate(data):
 key=item['key'];src=A/'source'/key
 old=Image.open(src/'previous-runtime.png').convert('RGBA').crop((355,55,640,325))
 L=defs[key]['layers']['detonation' if key=='flame_burst' else 'body'];sheet=Image.open(P/L['file']);new=sheet.crop((256*2,0,256*3,256))
 for col,plate in enumerate([Image.open(src/'master-original.png').convert('RGBA'),old,new]):
  bounds=plate.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();plate=plate.crop(bounds)
  size=130 if key=='flame_slash' else 180;ratio=min(size/plate.height,200/plate.width);plate=plate.resize((round(plate.width*ratio),round(plate.height*ratio)),Image.Resampling.LANCZOS)
  stage=bg.copy();stage.alpha_composite(plate,(493-plate.width//2,278-plate.height if key=='flame_pillar' else 210-plate.height//2))
  x=col*360;y=board.height+40+row*238;comparison.paste(stage.convert('RGB').resize((360,210)),(x,y));dc.text((x+8,y+213),key,font=font,fill='#f1dedb')
comparison.save(E/'comparison.jpg',quality=92)
p=E/'provenance.json';v=json.loads(p.read_text());v['comparison']='Full approved representative storyboard; normalized visible target material, old captured via InkSkillFxV2854.draw; old target crop excludes caster glow.';v['inputs'].update({str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in A.glob('source/*/previous-runtime.png')});p.write_text(json.dumps(v,indent=2))
