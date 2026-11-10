#!/usr/bin/env python3
"""Original seated orange tabby, generated entirely with Blender Python.

Run with Blender 4.3+: blender --background --factory-startup --python
games/healing-game/assets/cats/build-orange-cat.py
Use -- --draft for a faster 640px review render (the export stays full quality).
No downloaded model, photographs, fonts or external texture sources are used.
Blender Z is up and -Y is forward; the exported glTF faces +Z with Y up.
"""
import bpy
import math
import json
import os
import sys
import struct
import hashlib
import tempfile
from pathlib import Path
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
WORK = Path(os.environ.get('ORANGE_CAT_WORK_DIR', str(Path(tempfile.gettempdir())/'orange-cat-build')))
WORK.mkdir(parents=True, exist_ok=True)
DRAFT = '--draft' in sys.argv
SEED = 20261110
np.random.seed(SEED)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
    for item in list(datablocks):
        datablocks.remove(item)
scene = bpy.context.scene
bpy.context.preferences.filepaths.save_version = 0
cat_collection = bpy.data.collections.new('OrangeCat')
scene.collection.children.link(cat_collection)
stage_collection = bpy.data.collections.new('RENDER — not exported')
scene.collection.children.link(stage_collection)

def move_collection(obj, collection=cat_collection):
    for coll in list(obj.users_collection):
        coll.objects.unlink(obj)
    collection.objects.link(obj)

def active(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True

def ellipsoid(name, loc, scale):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    move_collection(obj)
    smooth(obj)
    return obj

parts = []
def mass(name, loc, scale):
    obj = ellipsoid(name, loc, scale)
    parts.append(obj)
    return obj

mass('Pelvis', (0, .047, .235), (.184, .145, .221))
mass('Ribcage', (0, .008, .398), (.144, .120, .214))
mass('Shoulders', (0, -.028, .504), (.123, .106, .153))
mass('Neck', (0, -.028, .594), (.101, .091, .125))
for s in (-1, 1):
    mass('Folded haunch', (s*.137, .027, .157), (.096, .127, .143))
    mass('Rear paw', (s*.162, -.054, .045), (.065, .090, .043))
    leg = mass('Foreleg', (s*.076, -.105, .245), (.047, .054, .204))
    leg.rotation_euler.x = math.radians(-8)
    mass('Front wrist', (s*.075, -.134, .105), (.043, .052, .088))
    mass('Front paw', (s*.077, -.165, .044), (.057, .077, .044))
mass('Head', (0, -.064, .713), (.151, .122, .131))
mass('Lower jaw', (0, -.098, .663), (.108, .088, .065))
for s in (-1, 1):
    mass('Cheek', (s*.098, -.095, .684), (.063, .080, .067))
    mass('Whisker pad', (s*.032, -.169, .659), (.041, .046, .032))
mass('Chin', (0, -.159, .635), (.046, .042, .025))
mass('Nasal bridge', (0, -.158, .697), (.031, .040, .042))

def mesh_object(name, verts, faces):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    cat_collection.objects.link(obj)
    smooth(obj)
    return obj

# Slightly cupped, rounded triangular pinnae, fused to the skull at their roots.
for sign in (-1, 1):
    verts, faces = [], []
    rings, sides = 18, 24
    for k in range(rings):
        t = k / (rings - 1)
        z = .747 + .173*t
        cx = sign*(.094 + .033*t)
        cy = -.035 + .003*t
        width = .052*(1-t)**.84 + .0025
        depth = .032*(1-t)**.70 + .0025
        for j in range(sides):
            a = j*2*math.pi/sides
            verts.append((cx + width*math.cos(a), cy + depth*math.sin(a), z))
    for k in range(rings-1):
        for j in range(sides):
            n = (j+1)%sides
            faces.append((k*sides+j, k*sides+n, (k+1)*sides+n, (k+1)*sides+j))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple((rings-1)*sides+j for j in range(sides)))
    parts.append(mesh_object('Ear', verts, faces))

def catmull(points, samples_per_segment=10):
    p = [Vector(points[0])] + [Vector(v) for v in points] + [Vector(points[-1])]
    result = []
    for i in range(1, len(p)-2):
        for j in range(samples_per_segment):
            t = j/samples_per_segment
            result.append(.5*((2*p[i])+(-p[i-1]+p[i+1])*t +
                              (2*p[i-1]-5*p[i]+4*p[i+1]-p[i+2])*t*t +
                              (-p[i-1]+3*p[i]-3*p[i+1]+p[i+2])*t*t*t))
    result.append(Vector(points[-1]))
    return result

tail_points = catmull([(.155,.113,.137), (.225,.105,.100), (.278,.028,.065),
                      (.292,-.092,.044), (.270,-.213,.036),
                      (.200,-.276,.037), (.132,-.273,.044), (.111,-.239,.056)], 10)
def tube(name, points, radius, sides=12, taper=True):
    verts, faces = [], []
    for i, p in enumerate(points):
        p = Vector(p)
        tangent = Vector(points[min(i+1, len(points)-1)])-Vector(points[max(0,i-1)])
        tangent.normalize()
        ref = Vector((0,0,1)) if abs(tangent.z)<.9 else Vector((1,0,0))
        right = tangent.cross(ref).normalized()
        up = right.cross(tangent).normalized()
        t = i/(len(points)-1)
        rad = radius(t) if callable(radius) else radius
        for j in range(sides):
            a = j*2*math.pi/sides
            verts.append(p + rad*(math.cos(a)*right + math.sin(a)*up))
    for i in range(len(points)-1):
        for j in range(sides):
            faces.append((i*sides+j, i*sides+(j+1)%sides,
                          (i+1)*sides+(j+1)%sides, (i+1)*sides+j))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple((len(points)-1)*sides+j for j in range(sides)))
    return mesh_object(name, verts, faces)

tail = tube('Resting curled tail', tail_points, lambda t: .039*(1-.62*t)+.001, 20)
parts.append(tail)
mass('Tail tip', tuple(tail_points[-1]), (.016, .016, .016))

# A voxel union removes primitive intersections; relaxation sculpts their joins.
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.object
body.name = 'OrangeCat_Fur'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
remesh = body.modifiers.new('Unified sculpt surface', 'REMESH')
remesh.mode = 'VOXEL'
remesh.voxel_size = .0040
remesh.use_smooth_shade = True
bpy.ops.object.modifier_apply(modifier=remesh.name)
relax = body.modifiers.new('Soft anatomical transitions', 'SMOOTH')
relax.factor = 1.1
relax.iterations = 7
bpy.ops.object.modifier_apply(modifier=relax.name)
triangles_before = sum(len(p.vertices)-2 for p in body.data.polygons)
decimate = body.modifiers.new('Mobile surface budget', 'DECIMATE')
decimate.ratio = min(1, 28400/triangles_before)
bpy.ops.object.modifier_apply(modifier=decimate.name)
smooth(body)

# All pads rest on the same plane, with the silhouette remaining gently rounded.
for vertex in body.data.vertices:
    if vertex.co.z < .008:
        vertex.co.z = max(.001, vertex.co.z*.20 + .001)
body.data.update()

def srgb_linear(c):
    return c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4
def hexcolor(v):
    return tuple(srgb_linear(int(v[i:i+2],16)/255) for i in (1,3,5))
def material(name, color, roughness=.75):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    shader = m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*hexcolor(color), 1)
    shader.inputs['Roughness'].default_value = roughness
    # Default IOR avoids KHR_materials_specular: the sample viewer uses r128.
    shader.inputs['Specular IOR Level'].default_value = .5
    return m

fur = material('Watercolor tabby · baked atlas', '#f6a457', .93)
body.data.materials.append(fur)
eye_mat = material('Warm ink eyes', '#33262a', .47)
nose_mat = material('Muted rose nose', '#aa6e61', .62)
line_mat = material('Sepia facial detail', '#8c6248', .92)
whisker_mat = material('Warm cream whiskers', '#f9e9d0', .93)
glint_mat = material('Soft eye catchlight', '#ffefd4', .34)

# The painted atlas is calculated at the exact UV surface positions, so markings
# cross the remeshed joins seamlessly. Color values are authored in sRGB.
active(body)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.008)
bpy.ops.object.mode_set(mode='OBJECT')
body.data.calc_loop_triangles()
SIZE = 2048
pos = np.zeros((SIZE,SIZE,3), dtype=np.float32)
normal = np.zeros_like(pos)
valid = np.zeros((SIZE,SIZE), dtype=bool)
uv_data = body.data.uv_layers.active.data
for tri in body.data.loop_triangles:
    vi = list(tri.vertices)
    xy = np.array([uv_data[i].uv[:] for i in tri.loops], dtype=np.float32)*(SIZE-1)
    x0,y0 = np.maximum(np.floor(xy.min(0)).astype(int),0)
    x1,y1 = np.minimum(np.ceil(xy.max(0)).astype(int), SIZE-1)
    if x1<x0 or y1<y0:
        continue
    xx,yy = np.meshgrid(np.arange(x0,x1+1)+.5, np.arange(y0,y1+1)+.5)
    a,b,c = xy
    det = (b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(det)<1e-9:
        continue
    w0 = ((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/det
    w1 = ((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/det
    w2 = 1-w0-w1
    inside = (w0>=-.0001)&(w1>=-.0001)&(w2>=-.0001)
    if not inside.any():
        continue
    weights = np.stack((w0,w1,w2),axis=-1)
    coords = np.array([body.data.vertices[i].co[:] for i in vi])
    norms = np.array([body.data.vertices[i].normal[:] for i in vi])
    pos[y0:y1+1,x0:x1+1][inside] = (weights@coords)[inside]
    normal[y0:y1+1,x0:x1+1][inside] = (weights@norms)[inside]
    valid[y0:y1+1,x0:x1+1] |= inside

xyz = pos[valid]
x,y,z = xyz.T
nx,ny,nz = normal[valid].T
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

base=np.array([246,164,87],dtype=np.float32)/255
cream=np.array([255,227,192],dtype=np.float32)/255
stripe=np.array([217,127,51],dtype=np.float32)/255
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
color=mix(color,stripe,np.clip(mark,0,1))
# Pink warm inner ears painted within generous orange borders.
et=np.clip((z-.747)/.173,0,1)
ec=.094+.033*et
ew=.037*(1-et)**.8
ear=sigmoid((ew-np.abs(np.abs(x)-ec))*350)*sigmoid((z-.810)*170)*sigmoid((.903-z)*230)
ear*=sigmoid((-y-.040)*250)*sigmoid((-ny-.1)*15)
color=mix(color,np.array([223,153,123])/255,ear*.8)
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
for _ in range(14):
    acc=np.zeros((SIZE,SIZE,3),dtype=np.float32)
    count=np.zeros((SIZE,SIZE),dtype=np.float32)
    for axis,shift in [(0,1),(0,-1),(1,1),(1,-1)]:
        fm=np.roll(filled,shift,axis)
        acc+=np.roll(atlas[:,:,:3],shift,axis)*fm[:,:,None]
        count+=fm
    take=(~filled)&(count>0)
    atlas[take,:3]=acc[take]/count[take,None]
    filled|=take
image=bpy.data.images.new('OrangeCat_Handpainted_2048',width=SIZE,height=SIZE,alpha=False)
image.colorspace_settings.name='sRGB'
image.pixels.foreach_set(atlas.ravel())
image.filepath_raw=str(WORK/'orange-cat-basecolor.png')
image.file_format='PNG'
image.save()
image.pack()
nodes=fur.node_tree.nodes
tex=nodes.new('ShaderNodeTexImage')
tex.image=image
tex.label='Original painted tabby atlas — embedded in GLB'
fur.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])

# All facial features are fitted onto the unified head surface by ray casting.
def front_y(px,pz):
    hit,loc,normal,index=body.ray_cast(Vector((px,-1,pz)),Vector((0,1,0)))
    return loc.y if hit else -.19
def almond(sign):
    verts=[]; faces=[]
    cx,cz=sign*.067,.724
    # Concentric curved almond patches keep the silhouette feline and the eyes modest.
    for k in range(8):
        r=k/7
        for j in range(48):
            a=2*math.pi*j/48
            dx=.034*r*math.cos(a)
            dz=.018*r*math.sin(a)*abs(math.sin(a))**.32+sign*.19*dx
            px,pz=cx+dx,cz+dz
            py=front_y(px,pz)-.0014-.0028*(1-r*r)
            verts.append((px,py,pz))
    for k in range(7):
        for j in range(48):
            faces.append((k*48+j,k*48+(j+1)%48,(k+1)*48+(j+1)%48,(k+1)*48+j))
    obj=mesh_object('Almond eye',verts,faces)
    obj.data.materials.append(eye_mat)
    # Broad, low-contrast catchlight rather than a hard plastic shine.
    px,pz=cx-.009,cz+.006
    gl=ellipsoid('Eye glimmer',(px,front_y(px,pz)-.0052,pz),(.0037,.0010,.0044))
    gl.data.materials.append(glint_mat)
    return obj
for s in (-1,1):
    almond(s)

# Rounded inverted triangular nose and a delicate feline philtrum.
verts=[(-.015,-.217,.673),(.015,-.217,.673),(0,-.224,.657),
       (-.011,-.225,.671),(.011,-.225,.671),(0,-.228,.662)]
faces=[(0,1,4,3),(1,2,5,4),(2,0,3,5),(3,4,5),(2,1,0)]
nose=mesh_object('Small rose nose',verts,faces)
nose.data.materials.append(nose_mat)
bev=nose.modifiers.new('Soft nose corners','BEVEL');bev.width=.003;bev.segments=3
active(nose);bpy.ops.object.modifier_apply(modifier=bev.name)
smooth(nose)

def line(name, controls, radius, mat, sides=6):
    pts=catmull(controls,6)
    obj=tube(name,pts,lambda t: radius*(.45+.55*math.sin(math.pi*t)**.5),sides)
    obj.data.materials.append(mat)
    return obj

line('Philtrum',[(0,-.221,.660),(0,-.216,.651),(0,-.208,.646)],.0008,line_mat)
for s in (-1,1):
    line('Muzzle line',[(0,-.208,.646),(s*.011,-.208,.643),(s*.024,-.204,.648)],.0007,line_mat)
    for j,(z0,zd) in enumerate([(.665,.015),(.658,-.007),(.652,-.024)]):
        line('Whisker',[(s*.050,-.207,z0),(s*.100,-.220,z0+zd*.45),
                        (s*(.181-j*.008),-.219,z0+zd)],.00052,whisker_mat,5)
    # Two restrained toe creases per front paw; their color blends with the fur.
    for dx in (-.015,.015):
        px=s*.077+dx
        line('Front paw crease',[(px,-.233,.042),(px,-.231,.054),(px,-.222,.063)],.00058,line_mat,5)

# Combine small details by material to keep the mobile export to six draw calls.
for mat in [eye_mat,nose_mat,line_mat,whisker_mat,glint_mat]:
    objs=[o for o in cat_collection.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==mat]
    if len(objs)>1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:o.select_set(True)
        bpy.context.view_layer.objects.active=objs[0]
        bpy.ops.object.join()
        objs[0].name=mat.name

# Compress only the upper chest and neck by 32 mm. The head keeps its original
# dimensions; the shoulders remain a continuous curve rather than a short stalk.
for obj in cat_collection.objects:
    active(obj)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for vertex in obj.data.vertices:
        t=max(0,min(1,(vertex.co.z-.43)/.24))
        vertex.co.z-=.032*t*t*(3-2*t)
    obj.data.update()

# Neutral rice-paper studio. This collection is deliberately absent from the GLB.
ground=material('Rice paper stage','#f1eade',.98)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.002))
plane=bpy.context.object;plane.name='Studio ground';move_collection(plane,stage_collection)
plane.data.materials.append(ground)
def area(name,loc,energy,size,color):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color
    obj=bpy.data.objects.new(name,data);stage_collection.objects.link(obj);obj.location=loc
    obj.rotation_euler=(Vector((0,0,.42))-obj.location).to_track_quat('-Z','Y').to_euler()
area('Large soft window',(-2,-3,4),85,4,(1.0,.98,.95))
area('Soft fill',(2,-1,2),30,3,(.94,.97,1.0))
area('Quiet rim',(0,2,3),65,3,(1.0,.98,.95))
world=bpy.data.worlds.new('Warm studio world');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.85,.85,.85,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.8
scene.world=world
camera_data=bpy.data.cameras.new('Portrait camera')
camera=bpy.data.objects.new('Portrait camera',camera_data);stage_collection.objects.link(camera)
camera.location=(.045,-3.4,.69)
look=Vector((.035,-.02,.438))
camera.rotation_euler=(look-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO';camera_data.ortho_scale=1.10
scene.camera=camera
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=32 if DRAFT else 128
scene.cycles.use_denoising=False  # Debian Blender omits OpenImageDenoise.
scene.cycles.use_adaptive_sampling=True
scene.cycles.adaptive_threshold=.015
scene.cycles.seed=SEED
scene.render.resolution_x=640 if DRAFT else 1024
scene.render.resolution_y=640 if DRAFT else 1024
scene.render.resolution_percentage=100
scene.render.threads_mode='FIXED'
scene.render.threads=3
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
scene.view_settings.exposure=0
scene.view_settings.gamma=1
scene.render.filepath=str(ROOT/'orange-cat-preview.png')

# Model-only export: selection prevents cameras, lights and the ground from leaking.
bpy.ops.object.select_all(action='DESELECT')
for obj in cat_collection.objects:
    obj.select_set(True)
    obj['asset']='Original seated orange tabby sample'
bpy.context.view_layer.objects.active=body
scene['asset_notes']='Original mesh and painted atlas. No gameplay integration. glTF +Z forward, Y up, floor at 0.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'orange-cat.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'orange-cat.glb'),export_format='GLB',use_selection=True,
                          export_apply=True,export_yup=True,export_texcoords=True,export_normals=True,
                          export_materials='EXPORT',export_image_format='AUTO',export_cameras=False,
                          export_lights=False,export_animations=False)

raw=(ROOT/'orange-cat.glb').read_bytes()
chunk_length,chunk_type=struct.unpack_from('<II',raw,12)
doc=json.loads(raw[20:20+chunk_length])
primitives=[p for m in doc['meshes'] for p in m['primitives']]
triangle_count=sum(doc['accessors'][p['indices']]['count']//3 for p in primitives)
corners=[obj.matrix_world@Vector(c) for obj in cat_collection.objects for c in obj.bound_box]
mins=[min(c[k] for c in corners) for k in range(3)]
maxs=[max(c[k] for c in corners) for k in range(3)]
metrics={
    'asset':'orange-cat','generator':'Blender Python original geometry and analytic painted atlas',
    'blenderVersion':bpy.app.version_string,'seed':SEED,'triangles':triangle_count,
    'triangleBudget':50000,'meshes':len(doc['meshes']),'drawCalls':len(primitives),
    'materials':len(doc.get('materials',[])),'textures':len(doc.get('textures',[])),
    'images':len(doc.get('images',[])),'textureResolution':[SIZE,SIZE],
    'allImagesEmbedded':all('bufferView' in im and 'uri' not in im for im in doc.get('images',[])),
    'uvsOnTexturedMesh':all('TEXCOORD_0' in p['attributes'] for p in primitives if p.get('material')==0),
    'normalsOnAllPrimitives':all('NORMAL' in p['attributes'] for p in primitives),
    'gltfUpAxis':'+Y','gltfForwardAxis':'+Z','blenderBounds':{'min':mins,'max':maxs},
    'height':maxs[2]-mins[2],'glbBytes':len(raw),
    'glbSha256':hashlib.sha256(raw).hexdigest(),
    'palette':{'fur':'#f6a457','belly':'#ffe3c0','stripes':'#d97f33','eyes':'#33262a'},
    'render':{'engine':'Cycles CPU','samples':scene.cycles.samples,
              'resolution':[scene.render.resolution_x,scene.render.resolution_y]},
    'license':'Original generated artwork for this repository; no external model or image dependencies.'
}
assert triangle_count<=50000,metrics
assert metrics['allImagesEmbedded'] and metrics['normalsOnAllPrimitives'],metrics
(ROOT/'orange-cat-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
print('ORANGE_CAT_METRICS',json.dumps(metrics),flush=True)
bpy.ops.render.render(write_still=True)
print('ORANGE_CAT_PREVIEW',scene.render.filepath,flush=True)
