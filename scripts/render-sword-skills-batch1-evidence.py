#!/usr/bin/env python3
"""Compose actual exported sprite frames using shared read-only choreography."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess,hashlib,math
R=Path(__file__).resolve().parents[1];A=R/'art/sword-skills-batch1';P=A/'preview';E=A/'evidence';E.mkdir(exist_ok=True)
js="""const s=require('./art/sword-skills-batch1/sampler.js').sampleSwordBatch,ds=require('./art/sword-skills-batch1/preview/effect-manifest.json').effects;console.log(JSON.stringify(ds.map(d=>({key:d.key,frames:Array.from({length:40},(_,i)=>{let t=i*40;return {t,parts:s(d,{from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:310},t)}}),overlaps:[91,110,129,311,330,349,...(d.key==='myriad_swords'?[623,652,681]:[491,520,549])].map(t=>({t,parts:s(d,{from:{x:260,y:205},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:310},t)}))}))))"""
data=json.loads(subprocess.check_output(['node','-e',js],cwd=R));defs={d['key']:d for d in json.loads((P/'effect-manifest.json').read_text())['effects']};bg=Image.open(P/'stage-reference.webp').convert('RGBA');font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',14);strips={}
def draw(key,parts):
 out=bg.copy();effect=Image.new('RGBA',bg.size)
 for p in parts:
  L=defs[key]['layers'][p['layer']];file=P/L['file']
  if str(file) not in strips:strips[str(file)]=Image.open(file).convert('RGBA')
  sheet=strips[str(file)];im=sheet.crop((p['frame']*256,0,(p['frame']+1)*256,256)).resize((round(p['width']),round(p['height'])),Image.Resampling.LANCZOS)
  im.putalpha(im.getchannel('A').point(lambda a:round(a*p['opacity'])))
  layer=Image.new('RGBA',bg.size);layer.alpha_composite(im,(round(p['x']-p['width']*p['pivotX']),round(p['y']-p['height']*p['pivotY'])))
  if p['rotation']:layer=layer.rotate(-math.degrees(p['rotation']),Image.Resampling.BICUBIC,center=(p['x'],p['y']))
  effect.alpha_composite(layer)
 # Same HUD clipping contract as DOM preview.
 out.alpha_composite(effect.crop((0,85,720,385)),(0,85));return out.convert('RGB')
for item in data:
 frames=[draw(item['key'],f['parts']) for f in item['frames']];frames[0].save(E/(item['key']+'.webp'),save_all=True,append_images=frames[1:],duration=40,loop=0,quality=90)
 sheet=Image.new('RGB',(1080,720),'#101920');dd=ImageDraw.Draw(sheet)
 for i,f in enumerate(item['overlaps']):
  x=i%3*360;y=i//3*240;sheet.paste(draw(item['key'],f['parts']).resize((360,210)),(x,y));dd.text((x+4,y+212),f"{f['t']}ms "+','.join(k+':'+str(round(max(p['opacity'] for p in f['parts'] if p['layer']==k),1)) for k in dict.fromkeys(p['layer'] for p in f['parts'])),font=font,fill='#cee1e0')
 sheet.save(E/(item['key']+'-overlaps.jpg'),quality=90)
contact=Image.new('RGB',(1440,3*240),'#101920');dd=ImageDraw.Draw(contact)
for row,item in enumerate(data):
 for col,t in enumerate([80,240,360,640]):
  f=min(item['frames'],key=lambda f:abs(f['t']-t));x=col*360;y=row*240;contact.paste(draw(item['key'],f['parts']).resize((360,210)),(x,y));dd.text((x+4,y+212),defs[item['key']]['name']+f' · {t}ms',font=font,fill='#cee1e0')
contact.save(E/'contact-sheet.jpg',quality=92)
frames=[]
for i in range(40):
 im=Image.new('RGB',(720,3*448),'#101920');dd=ImageDraw.Draw(im)
 for row,item in enumerate(data):dd.text((10,row*448+5),defs[item['key']]['name']+' · 资源预览（未接入）',font=font,fill='#cee1e0');im.paste(draw(item['key'],item['frames'][i]['parts']),(0,row*448+28))
 frames.append(im)
frames[0].save(E/'sword-batch-animation.webp',save_all=True,append_images=frames[1:],duration=40,loop=0,quality=88)
# Compare design + old family sheet + new independent source at matched visible sizes.
oldP=R/'xiantu-v2831-scroll/element-skills-v286838';oldDefs=json.loads((R/'art/element-skills-v286838/preview/effect-manifest.json').read_text())['effects'];old=next(d for d in oldDefs if d['key']=='sword_qi')['layers']['body'];oldFile=oldP/old['file'];oldIm=Image.open(oldFile).convert('RGBA').crop((2*old['frameWidth'],0,3*old['frameWidth'],old['frameHeight']))
board=Image.open(A/'design/storyboard-draft.png').convert('RGB');board.thumbnail((1080,720));sheet=Image.new('RGB',(1080,board.height+750),'#101920');sheet.paste(board,(0,0));dd=ImageDraw.Draw(sheet)
for col,label in enumerate(['Independent authored master','Previous shared sword_qi','New exported body']):dd.text((col*360+5,board.height+5),label,font=font,fill='#cee1e0')
for row,item in enumerate(data):
 key=item['key'];L=defs[key]['layers']['body'];new=Image.open(P/L['file']).convert('RGBA').crop((0,0,256,256))
 for col,im in enumerate([Image.open(A/'source'/key/'master-original.png').convert('RGBA'),oldIm,new]):
  box=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();im=im.crop(box);s=150/max(im.size);im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS);stage=bg.copy();stage.alpha_composite(im,(493-im.width//2,278-im.height));x=col*360;y=board.height+30+row*240;sheet.paste(stage.convert('RGB').resize((360,210)),(x,y));dd.text((x+4,y+211),defs[key]['name'],font=font,fill='#cee1e0')
sheet.save(E/'comparison.jpg',quality=92)
(E/'samples.json').write_text(json.dumps(data,indent=2))
inputs=[P/'effect-manifest.json',A/'sampler.js',P/'stage-reference.webp',A/'design/storyboard-draft.png',R/'art/element-skills-v286838/preview/effect-manifest.json',oldFile]+list(P.glob('*.png'))+list(A.glob('source/*/master-original.png'))
(E/'provenance.json').write_text(json.dumps({'command':'python3 scripts/render-sword-skills-batch1-evidence.py','inputs':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'scope':'Resource choreography on actual stage reference; not live combat footage'},indent=2))
print('PASS animation, comparison, overlap evidence generated from current exported strips')
