#!/usr/bin/env python3
"""Composite actual exported PNGs from pure sampler output, no effect painting."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,subprocess,hashlib
R=Path(__file__).resolve().parents[1];A=R/'art/fire-skills-batch2';P=A/'preview';E=A/'evidence';E.mkdir(exist_ok=True)
js="""const {sampleFireBatch2:s}=require('./art/fire-skills-batch2/sampler.js');const ds=require('./art/fire-skills-batch2/preview/effect-manifest.json').effects;console.log(JSON.stringify(ds.map(d=>({key:d.key,frames:Array.from({length:60},(_,i)=>({t:i*40,parts:s(d,{from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:310,burn:{burnTurns:i*40<2000?3:0,burnStacks:100,_burnHealBlockV286818:true}},i*40)})),overlaps:(d.visualArchetype==='ground-eruption'?[310,330,349,310,400,489,610,640,669,910,930,950,1000,1500,2000]:[100,120,139,310,330,349,450,470,489,730,750,770,1000,1500,2000]).map(t=>({t,parts:s(d,{from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:310,burn:{burnTurns:3,burnStacks:100,_burnHealBlockV286818:true}},t)}))}))));"""
data=json.loads(subprocess.check_output(['node','-e',js],cwd=R));defs={d['key']:d for d in json.loads((P/'effect-manifest.json').read_text())['effects']}
bg=Image.open(P/'stage-reference.webp').convert('RGBA');font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',14)
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
for i in range(60):
 out=Image.new('RGB',(720,3*448),'#24191d');d=ImageDraw.Draw(out)
 for row,item in enumerate(data):d.text((12,row*448+6),defs[item['key']]['name']+(' · 灼烧结束，莲印撤销' if row==0 and i>=50 else ' · 禁疗灼烧状态生效' if row==0 and i>=24 else ''),font=font,fill='#ffbb88');out.paste(draw(item['key'],item['frames'][i]['parts']),(0,row*448+28))
 frames.append(out)
frames[0].save(E/'fire-batch-animation.webp',save_all=True,append_images=frames[1:],duration=40,loop=0,quality=86)
(E/'samples.json').write_text(json.dumps(data,indent=2))
inputs=[R/'scripts/render-fire-skills-batch2-evidence.py',R/'scripts/build-fire-skills-batch2-vfx.py',P/'effect-manifest.json',A/'sampler.js',P/'stage-reference.webp',*[A/'design'/(k+'-storyboard.png') for k in defs]]+list(P.glob('*.png'))
(E/'provenance.json').write_text(json.dumps({'command':'python scripts/render-fire-skills-batch2-evidence.py','inputs':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}},indent=2))
print('Generated resource animations and sampled overlap sheets')

# Authored design plus master/old/new on the identical real background.
comparison=Image.new('RGB',(1080,3*520),'#24191d');dc=ImageDraw.Draw(comparison)
for row,item in enumerate(data):
 key=item['key'];src=A/'source'/key;y=row*520
 board=Image.open(A/'design'/(key+'-storyboard.png')).convert('RGB');board.thumbnail((390,260));comparison.paste(board,((1080-board.width)//2,y))
 for col,title in enumerate(['Approved material master','Previous runtime (target detail)','Exported new body']):dc.text((col*360+8,y+264),title,font=font,fill='#ffccaa')
 old=Image.open(src/'previous-runtime.png').convert('RGBA').crop((355,55,640,325))
 L=defs[key]['layers']['body'];sheet=Image.open(P/L['file']);new=sheet.crop((256*3,0,256*4,256))
 for col,plate in enumerate([Image.open(src/'master-original.png').convert('RGBA'),old,new]):
  bounds=plate.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();plate=plate.crop(bounds)
  width={'karmic_lotus':170,'ember_wall':215,'samadhi_fire':120}[key];ratio=width/plate.width;plate=plate.resize((round(plate.width*ratio),round(plate.height*ratio)),Image.Resampling.LANCZOS)
  stage=bg.copy();stage.alpha_composite(plate,(493-plate.width//2,278-plate.height if key!='samadhi_fire' else 210-plate.height//2));comparison.paste(stage.convert('RGB').resize((360,210)),(col*360,y+290));dc.text((col*360+8,y+502),key,font=font,fill='#f1dedb')
comparison.save(E/'comparison.jpg',quality=92)
p=E/'provenance.json';v=json.loads(p.read_text());v['comparison']='Each approved board with independent master, old target detail and new body normalized by visible width on actual project background. Old cropped target detail excludes caster.';v['inputs'].update({str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in A.glob('source/*/*.png') if p.name in ['previous-runtime.png','master-original.png','keyplates-original.png','body-original.png']});p.write_text(json.dumps(v,indent=2))
