#!/usr/bin/env python3
"""Expand authored plates only. Resource preview; does not modify game runtime."""
from pathlib import Path
from PIL import Image
import numpy as np
import hashlib, json, subprocess, shutil

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'art/thunder-skills-batch3'
OUT = ART / 'preview'
VALIDATOR = ROOT / '.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
N = 256

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def validate(p, frames=1, columns=1, margin=.18):
    result = subprocess.run(['python3', str(VALIDATOR), '--input', str(p), '--frames', str(frames), '--columns', str(columns), '--safe-margin-percent', str(margin)], capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr
    return result.stdout.strip()

def fit(im, pivot, extent=.58):
    a = np.array(im)[:, :, 3]; y, x = np.where(a > 12)
    factor = min(N * extent / (x.max() - x.min() + 1), N * extent / (y.max() - y.min() + 1))
    im = im.resize((round(im.width * factor), round(im.height * factor)), Image.Resampling.LANCZOS)
    y, x = np.where(np.array(im)[:, :, 3] > 12)
    dx = round(N * pivot[0] - (x.min() + x.max()) / 2)
    dy = round(N * pivot[1] - (y.max() if pivot[1] > .6 else (y.min() + y.max()) / 2))
    assert x.min() + dx >= 0 and x.max() + dx < N and y.min() + dy >= 0 and y.max() + dy < N
    out = Image.new('RGBA', (N, N)); out.alpha_composite(im, (dx, dy)); return out

def opacity(im, amount):
    out = im.copy(); out.putalpha(im.getchannel('A').point(lambda a: round(a * amount))); return out

def audit(im):
    a = np.array(im); mask = a[:, :, 3] > 16; y, x = np.where(mask); rgb = a[:, :, :3][mask].astype(float)
    return dict(bounds=[int(x.min()), int(y.min()), int(x.max()+1), int(y.max()+1)], white=float((rgb.min(1)>230).mean()), blue=float(((rgb[:,2]>rgb[:,0]*1.12)&(rgb[:,2]>rgb[:,1]*.80)).mean()), hash=hashlib.sha256(im.tobytes()).hexdigest())

SPECS = [
    ('chain_lightning', '闪电链', 'target-beam', 340, dict(telegraph=100, body=400, impact=120, residue=110, event=110)),
    ('thunder_prison', '万雷噬狱', 'persistent-zone', 430, dict(telegraph=300, body=350, impact=310, residue=280, event=270)),
    ('thunder_mantle', '雷神附体', 'shield-orbit', 360, dict(telegraph=150, body=270, impact=210, residue=200, event=150, reflectImpact=70)),
    ('high_cloud', '九霄雷云', 'persistent-zone', 460, dict(telegraph=140, body=260, impact=230, residue=200, event=270)),
]
effects = []; reports = {}
for key, name, archetype, arrival, display in SPECS:
    src = ART / 'source' / key; original = src / 'keyplates-original.png'; master = src / 'master-original.png'
    checks = [validate(original, 6, 3, .02), validate(master, 1, 1, .02)]
    raw = Image.open(original).convert('RGBA'); assert raw.width % 3 == 0 and raw.height % 2 == 0
    cw, ch = raw.width // 3, raw.height // 2; pad = max(cw, ch) // 2
    safe = Image.new('RGBA', ((cw+pad*2)*3, (ch+pad*2)*2))
    for i in range(6):
        safe.alpha_composite(raw.crop((i%3*cw, i//3*ch, (i%3+1)*cw, (i//3+1)*ch)), (i%3*(cw+2*pad)+pad, i//3*(ch+2*pad)+pad))
    safe.save(src / 'keyplates-safe.png'); checks.append(validate(src / 'keyplates-safe.png', 6, 3))
    m = Image.open(master).convert('RGBA'); ms = Image.new('RGBA', (m.width*2, m.height*2)); ms.alpha_composite(m, (m.width//2, m.height//2)); ms.save(src / 'master-safe.png'); checks.append(validate(src / 'master-safe.png'))
    cells = []
    for i in range(6):
        x=i%3*(cw+2*pad); y=i//3*(ch+2*pad); cells.append(safe.crop((x,y,x+cw+2*pad,y+ch+2*pad)))
    center = (.5,.5); ground = (.5,184/N)
    pivots = {layer: center for layer in ['telegraph','body','impact','residue','event']}
    if key == 'thunder_prison': pivots = {layer: ground for layer in pivots}
    if key == 'thunder_mantle': pivots['telegraph'] = ground
    if key == 'high_cloud': pivots['impact'] = pivots['event'] = ground
    # Full isolated cells are uniformly normalized; no procedural effect body is drawn.
    plates = {layer: fit(cells[i], pivots[layer]) for layer,i in [('telegraph',0),('body',1),('impact',2),('residue',3),('event',5)]}
    body_b = fit(cells[4], pivots['body'])
    # A -> B -> A continuous cyclic interpolation; last-to-first is the same small step.
    mix = [0,.15,.5,.85,1,.85,.5,.15]
    body = [Image.blend(plates['body'], body_b, k) for k in mix]
    # Slight phase-aligned exposure changes keep every frame distinct without introducing new painted geometry.
    body = [opacity(im, 1-.025*i/len(body)) for i,im in enumerate(body)]
    sets = dict(telegraph=[opacity(plates['telegraph'],v) for v in [.55,.75,.9,1]], body=body,
                impact=[opacity(plates['impact'],v) for v in [1,.94,.81,.65,.43,.22]],
                residue=[opacity(plates['residue'],v) for v in [1,.83,.66,.48,.30,.12]],
                event=[opacity(plates['event'],v) for v in [1,.93,.80,.64,.42,.20]])
    layers = {}; details = {}
    for layer, frames in sets.items():
        strip = Image.new('RGBA',(N*len(frames),N))
        for i,im in enumerate(frames): strip.alpha_composite(im,(N*i,0))
        p=OUT/f'{key}_{layer}.png'; strip.save(p); details[layer]=[audit(im) for im in frames]
        assert len({a['hash'] for a in details[layer]}) == len(frames)
        assert all(a['white'] < .08 and a['blue'] > .78 for a in details[layer]), (key,layer,'palette')
        assert all(min(a['bounds'][0],a['bounds'][1],N-a['bounds'][2],N-a['bounds'][3])>=25 for a in details[layer])
        layers[layer]=dict(file=p.name,frames=len(frames),frameWidth=N,frameHeight=N,pivotX=pivots[layer][0],pivotY=pivots[layer][1],fps=10 if layer=='body' else 25,loop=layer=='body' and key!='chain_lightning',holdLast=False)
    duration=3400; fade=80
    anchor='origin' if key=='thunder_mantle' else 'target'
    windows=dict(telegraph=(0,arrival*.45+fade,'origin' if key=='chain_lightning' else anchor),body=(arrival*.45,arrival+fade if key=='chain_lightning' else 2680,'moving' if key=='chain_lightning' else anchor),impact=(arrival,arrival+240,anchor),residue=(arrival+160 if key=='chain_lightning' else 2600,arrival+520 if key=='chain_lightning' else 2900,anchor))
    d=dict(key=key,name=name,element='thunder',visualArchetype=archetype,layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,display=display,
           timing=dict(arrivalMs=arrival,gatherRatio=.45,crossfadeMs=fade,impactMs=240,aftermathMs=520,durationMs=duration,loopMs=800,outroMs=300,cloudHeight=145),
           acceptance=['Independent authored master and six stage plates; source-over','State lifetime and event timestamps supplied by caller; no gameplay writes','Shared domain ownership must be resolved during integration; no invented chain targets'])
    d['preview']=dict(displayMode=archetype,durationMs=duration,distance=233,layers={k:dict(start=a/duration,end=b/duration,anchor=c,width=display[k],height=display[k],fadeIn=min(.4,fade/(b-a)),fadeOut=min(.4,fade/(b-a))) for k,(a,b,c) in windows.items()})
    effects.append(d); reports[key]=dict(inputs={p.name:digest(p) for p in [original,master]},checks=checks,frames=details,outputHashes={v['file']:digest(OUT/v['file']) for v in layers.values()})
manifest=dict(schemaVersion=1,effects=effects)
for name in ['effect-manifest.json','effect-manifest.preview.json']: (OUT/name).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'definition.js').write_text('window.ThunderBatchDefinitions = '+json.dumps(effects,ensure_ascii=False)+';\n')
shutil.copy(ART/'sampler.js',OUT/'choreography.js')
shutil.copy(ROOT/'art/thunder-skills-batch2/preview/stage-reference.webp',OUT/'stage-reference.webp')
(ART/'asset-audit.json').write_text(json.dumps(dict(command='python3 scripts/build-thunder-skills-batch3-vfx.py',sourcePolicy='Reject clipped original cells at 2%; pad whole isolated cells and validate 18% before slicing. Independent authored material masters and body key plates.',effects=reports),indent=2)+'\n')
print('PASS four effects, 20 RGBA strips, 120 frames; source boundaries and palette checked')
