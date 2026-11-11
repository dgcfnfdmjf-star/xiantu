"""Continue the approved analytic coat over newly exposed interior surfaces."""
import bpy, numpy as np, textwrap
from pathlib import Path
from mathutils import Vector

def paint_caps(body, data, kind, work, tail_points):
    root=Path(__file__).resolve().parents[2]/'assets/cats'
    source=(root/'cat_atlas.py').read_text()
    block=source[source.index('    x,y,z=xyz.T'):source.index('    atlas=np.zeros')]
    definition='def paint(xyz,paint_normals,PALETTE,KIND,tail_points):\n'+block+'    return np.clip(color,0,1)\n'
    scope={'np':np};exec(definition,scope);paint=scope['paint']
    palettes={
    'orange':dict(fur='#f6a457',belly='#ffe3c0',stripes='#d97f33',eyes='#33262a',pattern='stripes'),
    'calico':dict(fur='#fff4e6',belly='#ffffff',patches=['#e58f45','#3b3238'],eyes='#33262a',pattern='patches'),
    'black':dict(fur='#35303c',belly='#4a4452',eyes='#ffe27a',pattern='none'),
    'tabby':dict(fur='#b09a80',belly='#eadfce',stripes='#5c4c40',eyes='#4f7a3a',pattern='stripes')}
    size=256;positions=np.zeros((size,size,3),np.float32);normals=np.zeros_like(positions);valid=np.zeros((size,size),bool)
    layer=body.data.uv_layers.active
    for ci,chart in enumerate(data['cap_charts']):
        coords=np.asarray(chart['projected_coords']);span=np.ptp(coords,axis=0);uv=(coords-coords.min(axis=0))/np.maximum(span,1e-9)
        # Three columns/six rows give the major torso patches enough paint texels.
        uv[:,0]=((ci%3)*size/3+3+uv[:,0]*(size/3-6))/size;uv[:,1]=((ci//3)*size/6+3+uv[:,1]*(size/6-6))/size
        mapped=chart['mapped_vertices']
        for tri,loops in zip(chart['triangles'],chart['loop_indices']):
            for i,li in zip(tri,loops):layer.data[li].uv=uv[i]
            xy=uv[list(tri)]*size;lo=np.floor(xy.min(axis=0)).astype(int);hi=np.ceil(xy.max(axis=0)).astype(int)
            xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1)+.5,np.arange(lo[1],hi[1]+1)+.5)
            a,b,c=xy;det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if abs(det)<1e-10:continue
            w0=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/det
            w1=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/det;w2=1-w0-w1
            inside=(w0>=0)&(w1>=0)&(w2>=0);weights=np.stack((w0,w1,w2),axis=-1)
            xyz=np.array([body.data.vertices[mapped[i]].co for i in tri]);ns=np.array([body.data.corner_normals[li].vector for li in loops])
            positions[lo[1]:hi[1]+1,lo[0]:hi[0]+1][inside]=(weights@xyz)[inside]
            normals[lo[1]:hi[1]+1,lo[0]:hi[0]+1][inside]=(weights@ns)[inside]
            valid[lo[1]:hi[1]+1,lo[0]:hi[0]+1]|=inside
    xyz=positions[valid];ns=normals[valid];final_z=xyz[:,2].copy();z=final_z.copy()
    for _ in range(10):t=np.clip((z-.43)/.24,0,1);z=final_z+.032*t*t*(3-2*t)
    xyz[:,2]=z;t=np.clip((z-.43)/.24,0,1);ns[:,2]*=1-(.032/.24)*6*t*(1-t);ns/=np.maximum(np.linalg.norm(ns,axis=1)[:,None],1e-9)
    color=paint(xyz,ns,palettes[kind],kind,tail_points)
    atlas=np.zeros((size,size,4),np.float32);atlas[:,:,3]=1;atlas[valid,:3]=color
    filled=valid.copy()
    for _ in range(4):
        total=np.zeros((size,size,3),np.float32);count=np.zeros((size,size),np.float32)
        for axis,step in [(0,1),(0,-1),(1,1),(1,-1)]:
            mask=np.roll(filled,step,axis);total+=np.roll(atlas[:,:,:3],step,axis)*mask[:,:,None];count+=mask
        take=(~filled)&(count>0);atlas[take,:3]=total[take]/count[take,None];filled|=take
    image=bpy.data.images.new(kind+' • newly revealed inner coat',width=size,height=size,alpha=False);image.colorspace_settings.name='sRGB';image.pixels.foreach_set(atlas.ravel());image.file_format='JPEG';image.filepath_raw=str(work/(kind+'-inner-coat.jpg'));image.save(quality=80)
    path=image.filepath_raw;bpy.data.images.remove(image);image=bpy.data.images.load(path,check_existing=False);image.pack()
    mat=body.data.materials[1];nodes=mat.node_tree.nodes;shader=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexImage');tex.image=image;mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
    # Never multiply the original atlas by an active generic colour attribute.
    for attribute in list(body.data.color_attributes):body.data.color_attributes.remove(attribute)
    print('INNER_COAT',kind,size,int(valid.sum()),flush=True)
