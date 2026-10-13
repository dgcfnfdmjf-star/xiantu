#!/usr/bin/env python3
"""Export authored raster plates. Does not paint or synthesize effect bodies."""
from pathlib import Path
from PIL import Image
import numpy as np
import json, hashlib, subprocess, shutil

ROOT=Path(__file__).resolve().parents[1]; ART=ROOT/'art/fire-skills-batch3'; OUT=ART/'preview'
VALIDATOR=ROOT/'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
OUT.mkdir(exist_ok=True); reports={}; effects=[]
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(p,n=1,cols=1,margin=.18):
    r=subprocess.run(['python3',str(VALIDATOR),'--input',str(p),'--frames',str(n),'--columns',str(cols),'--rows',str((n+cols-1)//cols),'--safe-margin-percent',str(margin)],capture_output=True,text=True)
    assert r.returncode==0,r.stdout+r.stderr
    print(r.stdout.strip());return r.stdout.strip()
def audit(im):
    a=np.array(im);m=a[:,:,3]>16;assert m.any();y,x=np.where(m);rgb=a[:,:,:3][m].astype(float)
    return dict(bounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],white=float((rgb.min(1)>230).mean()),red=float(((rgb[:,0]>rgb[:,1]*1.12)&(rgb[:,0]>rgb[:,2]*1.2)).mean()),midtones=float(((rgb[:,0]>100)&(rgb[:,1]<210)&(rgb[:,2]<150)).mean()),opaque=float((a[:,:,3][m]>128).mean()),hash=hashlib.sha256(im.tobytes()).hexdigest())
def fit(im,ground,width=150,height=135):
    y,x=np.where(np.array(im)[:,:,3]>16);scale=min(width/(x.max()-x.min()+1),height/(y.max()-y.min()+1))
    scaled=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
    px=(x.min()+x.max()+1)*.5*scale;py=(y.max()+1 if ground else (y.min()+y.max()+1)*.5)*scale
    out=Image.new('RGBA',(256,256));out.alpha_composite(scaled,(round(128-px),round((192 if ground else 128)-py)));return out

for key,name in [('heaven_meteor','天火焚世'),('dragon_breath','赤焰龙息'),('wildfire_domain','燎原火域')]:
    src=ART/'source'/key;original=src/'keyplates-original.png';raw=Image.open(original).convert('RGBA')
    # First prove cells are fully isolated (no cut edges or borrowed neighbors).
    # Then enlarge each source cell, as allowed by the source-grid contract.
    # This changes canvas area only, never the artwork's scale or alpha.
    checks=[validate(original,9,3,.02)]
    cell=max((raw.width+2)//3,(raw.height+2)//3);pad=round(cell*.30);size=cell+2*pad
    safe=Image.new('RGBA',(size*3,size*3))
    for i in range(9):
        col,row=i%3,i//3;c=raw.crop((col*raw.width//3,row*raw.height//3,(col+1)*raw.width//3,(row+1)*raw.height//3))
        safe.alpha_composite(c,(col*size+pad,row*size+pad))
    safe.save(src/'keyplates-safe.png');checks.append(validate(src/'keyplates-safe.png',9,3,.18));raw=safe
    master=Image.open(src/'master-original.png').convert('RGBA')
    # Enlarge this single source cell without cropping or rescaling any artwork.
    # Original has no clipped foreground; explicit edge audit below enforces that.
    ma=np.array(master);edge=max(ma[0,:,3].max(),ma[-1,:,3].max(),ma[:,0,3].max(),ma[:,-1,3].max());assert edge<8
    ms=Image.new('RGBA',(master.width*2,master.height*2));ms.alpha_composite(master,(master.width//2,master.height//2));ms.save(src/'master-safe.png');checks.append(validate(src/'master-safe.png'))
    sourceAudit=[];plates=[]
    for i in range(9):
        col,row=i%3,i//3;c=raw.crop((col*raw.width//3,row*raw.height//3,(col+1)*raw.width//3,(row+1)*raw.height//3))
        a=audit(c);sourceAudit.append(a);assert a['white']<.08 and a['red']>.70,(key,i,a)
        grounded=key!='dragon_breath' or i>=7
        plates.append(fit(c,grounded,height=140 if key=='heaven_meteor' and i<3 else 110))
    if key=='wildfire_domain':
        for i in range(2):
            sparks=src/f'impact-{i}-original.png';im=Image.open(sparks).convert('RGBA');a=np.array(im)
            assert max(a[0,:,3].max(),a[-1,:,3].max(),a[:,0,3].max(),a[:,-1,3].max())<8
            c=Image.new('RGBA',(im.width*2,im.height*2));c.alpha_composite(im,(im.width//2,im.height//2));p=src/f'impact-{i}-safe.png';c.save(p);checks.append(validate(p));sourceAudit.append(audit(c));plates[5+i]=fit(c,True,width=150,height=50)
    framesets={}
    for layer,indices,n in [('telegraph',[3,4],4),('body',[0,1,2],8),('impact',[5,6],6),('residue',[7,8],6)]:
        frames=[]
        for j in range(n):
            t=j/(n-1)*(len(indices)-1);k=min(len(indices)-2,int(t));f=Image.blend(plates[indices[k]],plates[indices[k+1]],t-k)
            if key=='wildfire_domain' and layer=='impact':
                # Disconnected sparks are two successive authored bursts. Blending
                # different shard positions halves every core's opacity. Instead
                # retain each intact raster for three frames with a 1px rise/frame.
                f=Image.new('RGBA',(256,256));f.alpha_composite(plates[5+j//3],(0,-(j%3)))
            if key=='wildfire_domain' and layer=='residue':
                # Whole authored ember crescent contracts to the tiny state mark.
                f=fit(f,True,width=150-(j/(n-1))*80,height=70)
            if key=='dragon_breath' and layer=='body':
                a=np.array(f);x=np.arange(256);w=np.minimum(np.clip((x-52)/25,0,1),np.clip((204-x)/25,0,1));a[:,:,3]=(a[:,:,3]*w[None,:]).astype('uint8');f=Image.fromarray(a)
            frames.append(f)
        framesets[layer]=frames
    extra='source' if key=='dragon_breath' else 'status' if key=='wildfire_domain' else None
    if extra:
        indices=[3,4] if extra=='source' else [7,8];framesets[extra]=[]
        for j in range(8):
            w=(1-np.cos(2*np.pi*j/8))/2;f=Image.blend(plates[indices[0]],plates[indices[1]],float(w));a=np.array(f);a[:,:,3]=(a[:,:,3]*(.95+.05*np.sin(2*np.pi*j/8))).astype('uint8');framesets[extra].append(Image.fromarray(a))
    sizes={'heaven_meteor':dict(telegraph=250,body=220,impact=325,residue=180),'dragon_breath':dict(telegraph=105,source=105,body=132,impact=155,residue=180),'wildfire_domain':dict(telegraph=240,body=300,impact=255,residue=300,status=130)}[key]
    layers={};detail={}
    for layer,frames in framesets.items():
        strip=Image.new('RGBA',(256*len(frames),256))
        for i,f in enumerate(frames):strip.alpha_composite(f,(256*i,0))
        filename=key+'_'+layer+'.png';strip.save(OUT/filename);checks.append(validate(OUT/filename,len(frames),len(frames),.12))
        a=[audit(f) for f in frames];assert len({v['hash'] for v in a})==len(frames)
        assert all(v['white']<(.06 if layer in ('body','source') else .08) and v['red']>.70 and v['midtones']>.45 and v['opaque']>.30 for v in a),(key,layer,a)
        detail[layer]=a;grounded=key!='dragon_breath' or layer=='residue'
        layers[layer]=dict(file=filename,frames=len(frames),frameWidth=256,frameHeight=256,pivotX=.5,pivotY=.75 if grounded else .5,fps=8 if layer=='status' else 30,loop=layer=='status',holdLast=False)
    archetype={'heaven_meteor':'falling','dragon_breath':'moving-front','wildfire_domain':'ground-eruption'}[key]
    end={'heaven_meteor':580,'dragon_breath':480,'wildfire_domain':620}[key]
    D=dict(key=key,name=name,element='fire',visualArchetype=archetype,layers=layers,scale=1,offsetX=0,offsetY=0,trailLength=0,timing=dict(arrivalMs=310,crossfadeMs=40,aftermathMs=end,durationMs=2400),display=sizes,acceptance=['Independent approved raster material; source-over','Fixed-size travel; authoritative hit gates contact','Single target burn owner; no combat mutation or timers'])
    windows=({'telegraph':(0,350,'target'),'body':(80,350,'moving'),'impact':(310,530,'target'),'residue':(490,890,'target')} if key=='heaven_meteor' else {'telegraph':(0,140,'origin'),'body':(100,350,'moving'),'source':(100,410,'origin'),'impact':(310,490,'target'),'residue':(450,790,'target')} if key=='dragon_breath' else {'telegraph':(0,350,'target'),'body':(310,670,'target'),'impact':(310,470,'target'),'residue':(610,930,'target'),'status':(870,2400,'target')})
    D['preview']=dict(displayMode=archetype,durationMs=2400,distance=233,layers={k:dict(start=a/2400,end=b/2400,anchor=c,width=sizes[k],height=sizes[k],fadeIn=40/(b-a),fadeOut=(0 if k=='status' else 40/(b-a))) for k,(a,b,c) in windows.items()})
    visible={k:[[round((v['bounds'][2]-v['bounds'][0])*sizes[k]/256,2),round((v['bounds'][3]-v['bounds'][1])*sizes[k]/256,2)] for v in vals] for k,vals in detail.items()}
    inputs=[original,src/'master-original.png',ART/'design'/(key+'-storyboard.png')]
    if key=='wildfire_domain':inputs.extend(src/f'impact-{i}-original.png' for i in range(2))
    reports[key]=dict(inputs={p.name:digest(p) for p in inputs},boundaryChecks=checks,master=audit(ms),originalMasterEdgeAlpha=int(edge),sourcePlates=sourceAudit,frames=detail,visiblePixels=visible);effects.append(D)
manifest=dict(schemaVersion=1,effects=effects)
for filename in ['effect-manifest.json','effect-manifest.preview.json']:(OUT/filename).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'definition.js').write_text('window.FireBatch3Definitions = '+json.dumps(effects,ensure_ascii=False)+';\n')
shutil.copy(ART/'sampler.js',OUT/'choreography.js');shutil.copy(ROOT/'art/fire-skills-batch2/preview/stage-reference.webp',OUT/'stage-reference.webp')
(ART/'asset-audit.json').write_text(json.dumps(dict(command='python3 scripts/build-fire-skills-batch3-vfx.py',effects=reports),indent=2)+'\n')
print('Exported 3 effects, 14 layers, 88 frames with current boundary and material audits')
