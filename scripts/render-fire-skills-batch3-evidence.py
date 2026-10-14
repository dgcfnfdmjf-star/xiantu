#!/usr/bin/env python3
"""Reproducible source-over composites of exported sprites from shared sampler."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess,hashlib,math,shutil
R=Path(__file__).resolve().parents[1];A=R/'art/fire-skills-batch3';P=A/'preview';E=A/'evidence';E.mkdir(exist_ok=True)
js="""const {sampleFireBatch3:s}=require('./art/fire-skills-batch3/sampler.js');const ds=require('./art/fire-skills-batch3/preview/effect-manifest.json').effects;const job=t=>({from:{x:290,y:205},to:{x:493,y:250},toGround:{x:493,y:278},hitAt:310,domainConfirmed:true,burn:{burnTurns:t<2000?3:0,burnStacks:100}});console.log(JSON.stringify(ds.map(d=>({key:d.key,frames:Array.from({length:65},(_,i)=>({t:i*40,parts:s(d,job(i*40),i*40)})),overlaps:(d.key==='heaven_meteor'?[80,120,200,310,330,349,490,510,529,700,850,900]:d.key==='dragon_breath'?[100,120,139,250,310,330,349,450,470,489,750,800]:[310,330,349,400,440,469,610,640,669,900,960,1500]).map(t=>({t,parts:s(d,job(t),t)}))}))));"""
data=json.loads(subprocess.check_output(['node','-e',js],cwd=R));defs={d['key']:d for d in json.loads((P/'effect-manifest.json').read_text())['effects']}
bg=Image.open(P/'stage-reference.webp').convert('RGBA');font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',14);strips={}
def draw(key,parts):
    out=bg.copy()
    for p in parts:
        L=defs[key]['layers'][p['layer']];file=P/L['file']
        if str(file) not in strips:strips[str(file)]=Image.open(file).convert('RGBA')
        f=strips[str(file)].crop((p['frame']*256,0,(p['frame']+1)*256,256))
        if 'clipEnd' in p:
            mask=f.getchannel('A');d=ImageDraw.Draw(mask);d.rectangle((0,0,int(p['clipStart']*256)-1,255),fill=0);d.rectangle((math.ceil(p['clipEnd']*256),0,255,255),fill=0);f.putalpha(mask)
        f=f.resize((round(p['width']),round(p['height'])),Image.Resampling.LANCZOS);f.putalpha(f.getchannel('A').point(lambda a:round(a*p['opacity'])))
        layer=Image.new('RGBA',bg.size);layer.alpha_composite(f,(round(p['x']-p['width']*p['pivotX']),round(p['y']-p['height']*p['pivotY'])))
        if p['rotation']:layer=layer.rotate(-math.degrees(p['rotation']),resample=Image.Resampling.BICUBIC,center=(p['x'],p['y']))
        out.alpha_composite(layer)
    return out.convert('RGB')
for item in data:
    key=item['key'];frames=[draw(key,f['parts']) for f in item['frames']];frames[0].save(E/(key+'.webp'),save_all=True,append_images=frames[1:],duration=40,loop=0,quality=88)
    contact=Image.new('RGB',(1080,4*240),'#24191d');d=ImageDraw.Draw(contact)
    for i,f in enumerate(item['overlaps']):
        x=i%3*360;y=i//3*240;contact.paste(draw(key,f['parts']).resize((360,210)),(x,y));d.text((x+5,y+211),str(f['t'])+'ms '+','.join(p['id']+':'+str(round(p['opacity'],2)) for p in f['parts'])[:45],font=font,fill='#f1dedb')
    contact.save(E/(key+'-overlaps.jpg'),quality=90)
frames=[]
for i in range(65):
    out=Image.new('RGB',(720,3*448),'#24191d');d=ImageDraw.Draw(out)
    for row,item in enumerate(data):
        note=' · 模拟灼烧已清除' if row==2 and i>=50 else ' · 灼烧余域' if row==2 and i>=25 else ''
        d.text((12,row*448+6),defs[item['key']]['name']+note,font=font,fill='#ffbb88');out.paste(draw(item['key'],item['frames'][i]['parts']),(0,row*448+28))
    frames.append(out)
frames[0].save(E/'fire-batch-animation.webp',save_all=True,append_images=frames[1:],duration=40,loop=0,quality=86)
if shutil.which('ffmpeg'):
    encoder=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size','720x448','-framerate','25','-i','-','-an','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(E/'fire-batch-preview.mp4')],stdin=subprocess.PIPE)
    for item in data:
        for repeat in range(2):
            for f in item['frames']:
                out=Image.new('RGB',(720,448),'#24191d');d=ImageDraw.Draw(out);d.text((12,6),defs[item['key']]['name']+' · 透明动画资源预览',font=font,fill='#ffbb88');out.paste(draw(item['key'],f['parts']),(0,28));encoder.stdin.write(out.tobytes())
    encoder.stdin.close();assert encoder.wait()==0
(E/'samples.json').write_text(json.dumps(data,indent=2))
comparison=Image.new('RGB',(1080,3*520),'#24191d');dc=ImageDraw.Draw(comparison)
for row,item in enumerate(data):
    key=item['key'];src=A/'source'/key;y=row*520;board=Image.open(A/'design'/(key+'-storyboard.png')).convert('RGB');board.thumbnail((390,260));comparison.paste(board,((1080-board.width)//2,y))
    for col,title in enumerate(['已确认设计的独立母版','旧运行时目标区域','新透明主体（同可见宽度）']):dc.text((col*360+8,y+264),title,font=font,fill='#ffccaa')
    old=Image.open(src/'previous-runtime.png').convert('RGBA').crop((355,55,640,325));sheet=Image.open(P/defs[key]['layers']['body']['file']);new=sheet.crop((256*3,0,256*4,256))
    for col,plate in enumerate([Image.open(src/'master-original.png').convert('RGBA'),old,new]):
        bounds=plate.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();plate=plate.crop(bounds);width={'heaven_meteor':65,'dragon_breath':150,'wildfire_domain':215}[key];ratio=width/plate.width
        plate=plate.resize((round(plate.width*ratio),round(plate.height*ratio)),Image.Resampling.LANCZOS);stage=bg.copy();stage.alpha_composite(plate,(493-plate.width//2,278-plate.height if key!='dragon_breath' else 250-plate.height//2));comparison.paste(stage.convert('RGB').resize((360,210)),(col*360,y+290));dc.text((col*360+8,y+502),key,font=font,fill='#f1dedb')
comparison.save(E/'comparison.jpg',quality=92)
inputs=[R/'scripts/render-fire-skills-batch3-evidence.py',R/'scripts/build-fire-skills-batch3-vfx.py',P/'effect-manifest.json',A/'sampler.js',P/'stage-reference.webp',*A.glob('design/*-storyboard.png'),*A.glob('source/*/*.png'),*P.glob('*.png')]
(E/'provenance.json').write_text(json.dumps({'command':'python3 scripts/render-fire-skills-batch3-evidence.py','inputs':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},'note':'Comparison normalizes alpha-visible bounds; old target ROI [355,55,640,325] excludes caster ornaments. Original full old captures retained. Dragon master includes source head plus stream; new body strip is the flame segment only. Full lifecycle evidence is separate.'},indent=2)+'\n')
print('Generated three animation previews, overlap sheets and normalized material comparison')
