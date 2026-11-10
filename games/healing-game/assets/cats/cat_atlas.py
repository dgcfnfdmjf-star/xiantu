"""Shared analytic cat palettes and guarded Blender atlas baking.

Source atlases retain the approved authoring convention. Runtime atlases receive
nonoverlapping charts and sample normalized UV texel centers correctly.
"""
import bpy
import math
import json
import hashlib
from pathlib import Path
import numpy as np
from cat_uv import repair_uv_layout, geometry_fingerprint


def active(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active=obj


def paint_atlas(body, fur, eye_mat, *, kind, palette, work, tail_points, size=1024, runtime=False):
    KIND=kind
    PALETTE=palette
    ASSET=kind+'-cat'
    TITLE=kind.capitalize()+'Cat'
    WORK=Path(work)
    before=geometry_fingerprint(body.data)
    if runtime:
        # Source materials keep their original packed atlas. Only these copied
        # runtime materials replace their texture nodes.
        for mat in (fur,eye_mat):
            for node in list(mat.node_tree.nodes):
                if node.type=='TEX_IMAGE':mat.node_tree.nodes.remove(node)
    # The painted atlas is calculated at the exact UV surface positions, so markings
    # cross the remeshed joins seamlessly. Color values are authored in sRGB.
    active(body)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.008)
    bpy.ops.object.mode_set(mode='OBJECT')
    layout_report=repair_uv_layout(body,size=size) if runtime else None
    body.data.calc_loop_triangles()
    SIZE = size
    pos = np.zeros((SIZE,SIZE,3), dtype=np.float32)
    normal = np.zeros_like(pos)
    valid = np.zeros((SIZE,SIZE), dtype=bool)
    uv_conflicts=np.zeros_like(valid)
    max_uv_separation=0.0
    minimum_uv_area=float("inf")
    degenerate_uv_triangles=0
    uv_data = body.data.uv_layers.active.data
    for tri in body.data.loop_triangles:
        vi = list(tri.vertices)
        xy = np.array([uv_data[i].uv[:] for i in tri.loops], dtype=np.float32)*(SIZE if runtime else SIZE-1)
        x0,y0 = np.maximum(np.floor(xy.min(0)).astype(int),0)
        x1,y1 = np.minimum(np.ceil(xy.max(0)).astype(int), SIZE-1)
        if x1<x0 or y1<y0:
            continue
        xx,yy = np.meshgrid(np.arange(x0,x1+1)+.5, np.arange(y0,y1+1)+.5)
        a,b,c = xy
        det = (b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        minimum_uv_area=min(minimum_uv_area,float(abs(det)*.5))
        if abs(det)<1e-9:
            degenerate_uv_triangles+=1
            if runtime: raise RuntimeError("Degenerate runtime UV triangle")
            continue
        w0 = ((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/det
        w1 = ((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/det
        w2 = 1-w0-w1
        inside = (w0>=-.0001)&(w1>=-.0001)&(w2>=-.0001)
        if not inside.any():
            continue
        weights = np.stack((w0,w1,w2),axis=-1)
        coords = np.array([body.data.vertices[i].co[:] for i in vi])
        norms = np.array([body.data.corner_normals[i].vector[:] for i in tri.loops]) if runtime else np.array([body.data.vertices[i].normal[:] for i in vi])
        new_position=weights@coords
        already_covered=valid[y0:y1+1,x0:x1+1]&inside
        separation=np.linalg.norm(pos[y0:y1+1,x0:x1+1]-new_position,axis=-1)
        if already_covered.any():
            max_uv_separation=max(max_uv_separation,float(separation[already_covered].max()))
        uv_conflicts[y0:y1+1,x0:x1+1]|=already_covered&(separation>1e-4)
        pos[y0:y1+1,x0:x1+1][inside]=new_position[inside]
        normal[y0:y1+1,x0:x1+1][inside] = (weights@norms)[inside]
        valid[y0:y1+1,x0:x1+1] |= inside

    bake_report={"conflictingTexels":int(uv_conflicts.sum()),
        "surfaceConflictTolerance":1e-4,"maxObservedSurfaceSeparation":max_uv_separation,
        "coveredTexels":int(valid.sum()),"coverageFraction":float(valid.mean()),
        "minimumTriangleAreaTexels":float(minimum_uv_area),
        "degenerateUVTriangles":degenerate_uv_triangles,
        "rasterConvention":"UV*SIZE with centers i+0.5" if runtime else "Retained source atlas convention"}
    if runtime and (uv_conflicts.any() or valid.mean()<.25 or minimum_uv_area<1):
        raise RuntimeError("Unsafe runtime atlas coverage: "+json.dumps(bake_report))
    xyz=pos[valid].copy()
    paint_normals=normal[valid].copy()
    if runtime:
        # Invert only the approved 32mm chest compression, keeping every analytic
        # color field in the original authoring coordinates.
        final_z=xyz[:,2].copy()
        uncompressed_z=final_z.copy()
        for inverse_step in range(10):
            t=np.clip((uncompressed_z-.43)/.24,0,1)
            uncompressed_z=final_z+.032*t*t*(3-2*t)
        xyz[:,2]=uncompressed_z
        t=np.clip((uncompressed_z-.43)/.24,0,1)
        paint_normals[:,2]*=1-(.032/.24)*6*t*(1-t)
        paint_normals/=np.maximum(np.linalg.norm(paint_normals,axis=1)[:,None],1e-9)
    x,y,z=xyz.T
    nx,ny,nz=paint_normals.T
    def sigmoid(v):
        return 1/(1+np.exp(-np.clip(v,-40,40)))
    def mix(a,b,t):
        return a*(1-t[:,None])+np.asarray(b)*t[:,None]
    def inkpath(points, width):
        # Feathered strokes in face projection, without opaque graphic outlines.
        result = np.zeros(len(x),dtype=np.float32)
        for a,b in zip(points[:-1], points[1:]):
            a=np.array(a); b=np.array(b)
            vx,vz = b-a
            t=np.clip(((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz),0,1)
            d2=(x-a[0]-t*vx)**2+(z-a[1]-t*vz)**2
            result = np.maximum(result,np.exp(-d2/(width*width)))
        return result

    def rgb(v):
        return np.array([int(v[i:i+2],16) for i in (1,3,5)],dtype=np.float32)/255
    base=rgb(PALETTE['fur'])
    cream=rgb(PALETTE['belly'])
    stripe=rgb(PALETTE.get('stripes', PALETTE['fur']))
    wash=(np.sin(33*x+8*np.sin(14*z)+17*y)+np.sin(49*z+12*y)+np.sin(81*y+17*x))/3
    grain=np.sin(x*1421+np.sin(z*377))*np.sin(z*1193+y*837)
    fibers=np.sin(x*2400+y*413+np.sin(z*900))*np.sin(z*580+y*270)
    color=np.tile(base,(len(x),1))
    color += (wash*.028+grain*.010+fibers*.006)[:,None]
    # Light underside and irregular edged bib, with the main belly visible between legs.
    bib_width=.067+.023*np.exp(-((z-.42)/.12)**2)
    bib = sigmoid((bib_width-np.abs(x)+.003*np.sin(98*z+21*x))*130)
    bib *= sigmoid((z-.155)*85)*sigmoid((.623-z)*75)*sigmoid((-y-.065)*90)*sigmoid((-ny-.16)*12)
    color=mix(color,cream,np.minimum(bib*.94,1))
    muzzle= np.exp(-((x/.084)**4+((z-.654)/.043)**4))*sigmoid((-y-.159)*140)
    color=mix(color,cream,np.minimum(muzzle*.94,1))
    # Softer pale feet, without sock-like hard boundaries.
    paws=np.exp(-((z-.026)/.034)**2)*sigmoid((-y-.08)*60)*sigmoid((.142-np.abs(x))*60)
    color=mix(color,cream,paws*.65)
    # Broad broken flank markings wrap the volume; variation prevents a barcode rhythm.
    side=sigmoid((np.abs(x)-.108)*80)*sigmoid((.575-z)*40)*sigmoid((z-.100)*45)
    body_ink=np.zeros(len(x),dtype=np.float32)
    for zi,phase,width in [(.183,1.0,.011),(.295,2.2,.018),(.410,-.8,.013),(.515,1.8,.009)]:
        curve=zi+.050*np.sin(y*10+phase)+.080*(np.abs(x)-.15)
        stroke=np.exp(-((z-curve)/width)**2)
        stroke*=.30+.70*sigmoid(np.sin(y*34+phase*2)*4)
        body_ink=np.maximum(body_ink,stroke)
    body_ink*=side*.62
    # A gently darkened spinal wash and less regular shoulder streaks.
    back=sigmoid((y-.074)*65)*np.exp(-(x/.045)**2)*sigmoid((.65-z)*35)
    body_ink=np.maximum(body_ink,back*.42)
    face=np.zeros(len(x),dtype=np.float32)
    for sign in (-1,1):
        face=np.maximum(face,inkpath([(sign*.076,.802),(sign*.055,.771),(sign*.034,.796),(sign*.017,.754)],.0065))
        face=np.maximum(face,inkpath([(sign*.135,.734),(sign*.112,.714),(sign*.096,.708)],.007))
        face=np.maximum(face,inkpath([(sign*.142,.698),(sign*.116,.682),(sign*.098,.678)],.006))
        face=np.maximum(face,inkpath([(sign*.118,.758),(sign*.100,.750)],.006))
    face*=sigmoid((-y-.105)*100)*sigmoid((z-.66)*100)*.83
    mark=np.maximum(body_ink,face)
    # Tail bands use arc length rather than world axes, following its entire curl.
    tail_dist=np.full(len(x),10,dtype=np.float32)
    tail_t=np.zeros(len(x),dtype=np.float32)
    for i,point in enumerate(tail_points):
        pp=np.asarray(point)
        d=np.sum((xyz-pp)**2,axis=1)
        take=d<tail_dist
        tail_dist[take]=d[take]
        tail_t[take]=i/(len(tail_points)-1)
    tail_mask=sigmoid((.047-np.sqrt(tail_dist))*220)*sigmoid((x-.143)*100)
    bands=np.zeros(len(x),dtype=np.float32)
    for t,w in [(.22,.029),(.39,.032),(.57,.034),(.74,.032),(.91,.038)]:
        bands=np.maximum(bands,np.exp(-((tail_t-t)/w)**2))
    mark=np.maximum(mark,bands*tail_mask*.79)
    mark*=.91+.09*wash
    if PALETTE['pattern']=='stripes':
        color=mix(color,stripe,np.clip(mark,0,1))
    elif PALETTE['pattern']=='patches':
        # Asymmetric calico islands wrap over the head, flank and tail. Their soft,
        # irregular edges are sampled in 3D rather than stamped as flat decals.
        def patch(center, radii, phase):
            q=(xyz-np.array(center))/np.array(radii)
            dist=np.sqrt(np.sum(q*q,axis=1))
            wobble=.055*np.sin(x*81+phase)*np.sin(z*56+y*29)+.025*np.sin(y*91+z*63)
            return sigmoid((1-dist+wobble)*38)
        orange=np.maximum.reduce([
            patch((-.102,-.047,.770),(.105,.145,.161),.2),
            patch((-.136,.035,.456),(.096,.137,.139),1.4),
            patch((.172,.041,.182),(.113,.137,.109),2.0),
            patch((.070,.146,.562),(.094,.090,.103),.7),
        ])
        dark=np.maximum.reduce([
            patch((.123,-.012,.817),(.081,.142,.110),1.5),
            patch((-.075,.153,.267),(.119,.093,.149),2.8),
            patch((.148,.092,.443),(.094,.106,.102),.4),
        ])
        white_face=sigmoid((.023+.007*np.sin(z*53)-np.abs(x))*180)*sigmoid((z-.655)*80)
        orange*=1-white_face*.94
        dark*=1-white_face*.94
        # Continuous world-space transitions avoid visible steps between tail samples.
        orange=np.maximum(orange,tail_mask*sigmoid((y+.205)*65))
        dark_tail=sigmoid((.247-x)*80)*sigmoid((-y-.205)*85)
        dark=np.maximum(dark,tail_mask*dark_tail)
        color=mix(color,rgb(PALETTE['patches'][0])+(wash*.012)[:,None],orange)
        color=mix(color,rgb(PALETTE['patches'][1])+(wash*.009)[:,None],dark)
        color=mix(color,cream,muzzle*.88)
    # Pink warm inner ears painted within generous orange borders.
    et=np.clip((z-.747)/.173,0,1)
    ec=.094+.033*et
    ew=.037*(1-et)**.8
    ear=sigmoid((ew-np.abs(np.abs(x)-ec))*350)*sigmoid((z-.810)*170)*sigmoid((.903-z)*230)
    ear*=sigmoid((-y-.040)*250)*sigmoid((-ny-.1)*15)
    ear_rgb=np.array([125,92,104])/255 if KIND=='black' else np.array([223,153,123])/255
    color=mix(color,ear_rgb,ear*.8)
    # Tiny warm dots on whisker pads are texture, not extra geometry.
    freckle=np.zeros(len(x),dtype=np.float32)
    for s in (-1,1):
        for fx,fz in [(.043,.666),(.057,.658),(.035,.650)]:
            freckle=np.maximum(freckle,np.exp(-((x-s*fx)**2+(z-fz)**2)/(.0017**2)))
    freckle*=sigmoid((-y-.192)*180)
    color=mix(color,np.array([162,106,65])/255,freckle*.46)
    atlas=np.zeros((SIZE,SIZE,4),dtype=np.float32)
    atlas[:,:,:3]=base
    atlas[:,:,3]=1
    atlas[valid,:3]=np.clip(color,0,1)
    # Texel padding protects UV borders under mipmaps without external image libraries.
    filled=valid.copy()
    for _ in range(7):
        acc=np.zeros((SIZE,SIZE,3),dtype=np.float32)
        count=np.zeros((SIZE,SIZE),dtype=np.float32)
        for axis,shift in [(0,1),(0,-1),(1,1),(1,-1)]:
            fm=np.roll(filled,shift,axis)
            acc+=np.roll(atlas[:,:,:3],shift,axis)*fm[:,:,None]
            count+=fm
        take=(~filled)&(count>0)
        atlas[take,:3]=acc[take]/count[take,None]
        filled|=take
    # Colored-eye variants reuse unoccupied atlas space. No vertices or faces change.
    eye_tile=None
    if KIND in ('black','tabby'):
        for edge in (64,48,32):
            found=False
            for ty in range(3,SIZE-edge-3,4):
                for tx in range(3,SIZE-edge-3,4):
                    if not filled[ty-3:ty+edge+3,tx-3:tx+edge+3].any():
                        eye_tile=(tx,ty,edge); found=True; break
                if found: break
            if found: break
        if eye_tile is None:
            raise RuntimeError('No free atlas square for the iris; do not overwrite fur UVs')
        tx,ty,edge=eye_tile
        ex,ey=np.meshgrid(np.linspace(-1,1,edge),np.linspace(-1,1,edge))
        pupil_width=.10*np.sqrt(np.maximum(0,1-ey*ey))+.035
        pupil=np.exp(-np.minimum((ex/pupil_width)**6,80))
        rim=sigmoid((np.sqrt(ex*ex+ey*ey)-.92)*70)
        ink=np.maximum(pupil,rim*.70)
        iris=np.tile(rgb(PALETTE['eyes']),(edge,edge,1))
        iris+=(np.sin(ex*34+ey*17)*.012)[:,:,None]
        iris=iris*(1-ink[:,:,None])+rgb('#33262a')*ink[:,:,None]
        atlas[ty:ty+edge,tx:tx+edge,:3]=np.clip(iris,0,1)
    image_name=TITLE+('_RuntimeAtlas_' if runtime else '_Handpainted_')+str(SIZE)
    image=bpy.data.images.new(image_name,width=SIZE,height=SIZE,alpha=False)
    image.colorspace_settings.name='sRGB'
    image.pixels.foreach_set(atlas.ravel())
    image.filepath_raw=str(WORK/(ASSET+('-runtime-basecolor.jpg' if runtime else '-basecolor.jpg')))
    image.file_format='JPEG'
    image.save(quality=90)
    # Reopen compressed pixels before rendering, then pack them into the .blend.
    image_path=image.filepath_raw
    bpy.data.images.remove(image)
    image=bpy.data.images.load(image_path,check_existing=False)
    image.name=image_name
    image.pack()
    nodes=fur.node_tree.nodes
    tex=nodes.new('ShaderNodeTexImage')
    tex.image=image
    tex.label='Original painted tabby atlas — embedded in GLB'
    fur.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
    if eye_tile:
        eye_nodes=eye_mat.node_tree.nodes
        eye_tex=eye_nodes.new('ShaderNodeTexImage'); eye_tex.image=image
        eye_mat.node_tree.links.new(eye_tex.outputs['Color'],eye_nodes.get('Principled BSDF').inputs['Base Color'])


    missing_centroids=0
    for tri in body.data.loop_triangles:
        center_uv=np.mean([body.data.uv_layers.active.data[i].uv[:] for i in tri.loops],axis=0)
        px,py=np.clip(np.floor(center_uv*SIZE).astype(int),0,SIZE-1)
        missing_centroids+=not filled[py,px]
    bake_report["uncoveredTriangleCentroidsAfterPadding"]=int(missing_centroids)
    if runtime and missing_centroids:raise RuntimeError("Uncovered runtime UV triangle centroid")
    bake_report["geometryAndCornerNormalsUnchanged"]=before==geometry_fingerprint(body.data)
    bake_report["geometrySha256"]=before
    bake_report["uvSha256"]=hashlib.sha256(np.array([v.uv[:] for v in body.data.uv_layers.active.data],dtype="<f4").tobytes()).hexdigest()
    bake_report["atlasSha256"]=hashlib.sha256(Path(image.filepath_raw).read_bytes()).hexdigest()
    if not bake_report["geometryAndCornerNormalsUnchanged"]:raise RuntimeError("Atlas bake changed geometry or normals")
    return {"image":image,"eye_tile":eye_tile,"audit":bake_report,"layout":layout_report}
