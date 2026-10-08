"""Regenerate provenance, frame metrics and review contact sheets from current files."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parent.parent; A=ROOT/'art/absolute-zero'; E=A/'evidence';E.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
D=json.loads((A/'preview/effect-manifest.json').read_text())['effects'][0]
for spec in D['layers'].values():
 a=A/'preview'/spec['file']; b=ROOT/'xiantu-v2831-scroll/absolute-zero-v286835'/spec['file'];assert a.read_bytes()==b.read_bytes()
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
def sheet(entries,name,cols=2):
 w,h=480,305;out=Image.new('RGB',(w*cols,h*((len(entries)+cols-1)//cols)),'#102832');draw=ImageDraw.Draw(out)
 for i,(label,path) in enumerate(entries):
  im=Image.open(path).convert('RGB');im.thumbnail((w,h-30));x=i%cols*w;y=i//cols*h;draw.text((x+8,y+5),label,font=font,fill='#b9e8f8');out.paste(im,(x,y+30))
 out.save(E/name,quality=90)
sheet([(label,E/f'stage-{t}.png') for label,t in [('Anticipation - ground frost',60),('Build - rising low ice',280),('Impact - hollow ice cage',400),('Residue - fractured crystal',650)]],'storyboard.jpg')
sheet([(f'{t} ms',E/f'stage-{t}.png') for t in [150,190,280,490,520,550]],'overlap-review.jpg',3)
sheet([('Previous procedural prison',E/'previous-impact.png'),('New authored ice plates',E/'resource-impact.png')],'comparison.jpg')
frames=[Image.open(E/f'stage-{t}.png').convert('RGB').resize((540,315)) for t in [60,150,190,280,310,400,490,520,550,650,820,900]]
frames[0].save(E/'absolute-zero-preview.webp',save_all=True,append_images=frames[1:],duration=[90,40,90,30,90,90,30,30,100,170,80,400],loop=0,quality=85)
files=[*A.glob('source/*.png'),*A.glob('preview/*.png'),A/'sampler.js',A/'preview/effect-manifest.json',*E.glob('*.png')]
(A/'provenance.json').write_text(json.dumps(dict(command='python3 scripts/build-absolute-zero-vfx.py --runtime; python3 scripts/audit-absolute-zero-vfx.py',inputs={str(p.relative_to(ROOT)):sha(p) for p in files},evidence={p.name:sha(p) for p in E.iterdir() if p.suffix in ['.jpg','.webp']},runtimeBytes=sum((A/'preview'/v['file']).stat().st_size for v in D['layers'].values())),indent=2)+'\n')
print('PASS current source hashes, runtime/resource identity, storyboard, comparison and overlap evidence')
