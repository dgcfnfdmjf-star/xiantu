#!/usr/bin/env python3
"""Reproduce sprite-only contact sheets and animation using the shipped preview sampler."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, hashlib, math
R=Path(__file__).resolve().parents[1]; A=R/'art/thunder-skills-batch3'; P=A/'preview'; E=A/'evidence'; E.mkdir(exist_ok=True)
js="""const s=require('./art/thunder-skills-batch3/sampler.js').sampleThunderBatch,ds=require('./art/thunder-skills-batch3/preview/effect-manifest.json').effects;console.log(JSON.stringify(ds.map(d=>{const a=d.timing.arrivalMs,b=a*.45,f=d.timing.crossfadeMs;const j={from:{x:260,y:205},fromGround:{x:260,y:278},to:{x:493,y:210},toGround:{x:493,y:278},hitAt:a,stateActive:true,stateEndAt:2600,events:[{id:'one',type:d.key==='thunder_mantle'?'reflect':'tick',at:1100},{id:'two',type:d.key==='thunder_mantle'?'reflect':'tick',at:1900}]};return {key:d.key,frames:Array.from({length:85},(_,i)=>({t:i*40,parts:s(d,j,i*40)})),stages:[80,a-60,a+100,1400,1180,d.key==='chain_lightning'?a+320:2750].map(t=>({t,parts:s(d,j,t)})),overlaps:[b+1,b+f/2,b+f-1,a+1,a+f/2,a+f-1,...(d.key==='chain_lightning'?[a+161,a+200,a+239]:[2601,2640,2679])].map(t=>({t,parts:s(d,j,t)}))}})));"""
data=json.loads(subprocess.check_output(['node','-e',js],cwd=R)); defs={d['key']:d for d in json.loads((P/'effect-manifest.json').read_text())['effects']}
bg=Image.open(P/'stage-reference.webp').convert('RGBA'); font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16); strips={}
def draw(key,parts):
    out=bg.copy()
    for p in parts:
        L=defs[key]['layers'][p['layer']]; file=P/L['file']
        if str(file) not in strips: strips[str(file)]=Image.open(file).convert('RGBA')
        im=strips[str(file)].crop((p['frame']*256,0,(p['frame']+1)*256,256)).resize((round(p['width']),round(p['height'])),Image.Resampling.LANCZOS)
        im.putalpha(im.getchannel('A').point(lambda a:round(a*p['opacity'])))
        if p['rotation']:
            # Rotating the centered chain/reflection keeps its pivot at the texture center.
            assert p['pivotX']==p['pivotY']==.5
            im=im.rotate(-p['rotation']*180/math.pi,Image.Resampling.BICUBIC,expand=True)
            x=round(p['x']-im.width/2); y=round(p['y']-im.height/2)
        else: x=round(p['x']-p['width']*p['pivotX']); y=round(p['y']-p['height']*p['pivotY'])
        out.alpha_composite(im,(x,y))
    return out.convert('RGB')
labels=['起手','主体','命中','持续循环','事件脉冲','消散']
for item in data:
    key=item['key']; sheet=Image.new('RGB',(1080,490),'#111729'); dd=ImageDraw.Draw(sheet)
    for i,f in enumerate(item['stages']):
        x=i%3*360; y=i//3*245; sheet.paste(draw(key,f['parts']).resize((360,210)),(x,y));dd.text((x+5,y+214),defs[key]['name']+' · '+labels[i]+f" {f['t']:.0f}ms",font=font,fill='#a4ceff')
    sheet.save(E/(key+'-stages.jpg'),quality=93)
    sheet=Image.new('RGB',(1080,735),'#111729');dd=ImageDraw.Draw(sheet)
    for i,f in enumerate(item['overlaps']):
        x=i%3*360;y=i//3*245;sheet.paste(draw(key,f['parts']).resize((360,210)),(x,y));dd.text((x+5,y+214),f"{f['t']:.0f}ms "+','.join(p['id']+':'+str(round(p['opacity'],2)) for p in f['parts']),font=font,fill='#a4ceff')
    sheet.save(E/(key+'-overlaps.jpg'),quality=93)
video=R/'output/playwright/thunder-batch3/video-frames';video.mkdir(parents=True,exist_ok=True)
for i in range(85):
    im=Image.new('RGB',(1440,896),'#111729');dd=ImageDraw.Draw(im)
    for n,item in enumerate(data):
        x=n%2*720;y=n//2*448;dd.text((x+10,y+5),defs[item['key']]['name']+' · 资源预览／模拟事件',font=font,fill='#a4ceff');im.paste(draw(item['key'],item['frames'][i]['parts']),(x,y+28))
    im.save(video/f'{i:03d}.png')
poster=Image.new('RGB',(1440,896),'#111729');dd=ImageDraw.Draw(poster)
for n,item in enumerate(data):
    x=n%2*720;y=n//2*448;chosen=item['stages'][1 if n==0 else 3 if n in [1,2] else 4]
    dd.text((x+10,y+5),defs[item['key']]['name']+f" · 资源预览 {chosen['t']:.0f}ms",font=font,fill='#a4ceff');poster.paste(draw(item['key'],chosen['parts']),(x,y+28))
poster.save(E/'overview.jpg',quality=94)
subprocess.run(['ffmpeg','-y','-v','error','-framerate','25','-i',str(video/'%03d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','20',str(E/'thunder-batch-animation.mp4')],check=True)
# Reference / previous shared body / new body on identical stage, normalized visible bounds.
oldP=R/'art/element-skills-v286838/preview'; old=json.loads((oldP/'effect-manifest.json').read_text())['effects'][0]['layers']['body']; oldFile=R/'xiantu-v2831-scroll/element-skills-v286838'/old['file']; oldStrip=Image.open(oldFile).convert('RGBA'); oldBody=oldStrip.crop((2*old['frameWidth'],0,3*old['frameWidth'],old['frameHeight']))
sheet=Image.new('RGB',(1080,1010),'#111729');dd=ImageDraw.Draw(sheet)
for i,label in enumerate(['独立材质母版','原有共享雷系素材','导出主体帧']):dd.text((i*360+6,6),label,font=font,fill='#a4ceff')
for row,item in enumerate(data):
    key=item['key']; new=Image.open(P/defs[key]['layers']['body']['file']).convert('RGBA').crop((2*256,0,3*256,256))
    for col,im in enumerate([Image.open(A/'source'/key/'master-original.png').convert('RGBA'),oldBody,new]):
        box=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();im=im.crop(box);ratio=min(150/im.width,150/im.height);im=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS);stage=bg.copy();stage.alpha_composite(im,(493-im.width//2,278-im.height));x=col*360;y=30+row*245;sheet.paste(stage.convert('RGB').resize((360,210)),(x,y));dd.text((x+6,y+214),defs[key]['name'],font=font,fill='#a4ceff')
sheet.save(E/'comparison.jpg',quality=94)
(E/'samples.json').write_text(json.dumps(data,indent=2))
inputs=[P/'effect-manifest.json',A/'sampler.js',P/'stage-reference.webp',oldP/'effect-manifest.json',oldFile]+list(P.glob('*.png'))+list(A.glob('source/*/master-original.png'))
(E/'provenance.json').write_text(json.dumps(dict(command='python3 scripts/render-thunder-skills-batch3-evidence.py',inputs={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs},scope='Exported sprite composition on actual project background; simulated state/events, not combat recording'),indent=2))
print('PASS four stage sheets, overlap sheets, normalized comparison, 85-frame 25fps movie and source hashes')
