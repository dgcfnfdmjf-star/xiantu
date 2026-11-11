#!/usr/bin/env python3
"""Original seated cats, generated entirely with Blender Python.

Run with Blender 4.3+: blender --background --factory-startup --python
games/healing-game/assets/cats/build-cats.py -- --kind orange
Supported kinds: orange, calico, black and tabby. Their posed surfaces are shared.
The packed .blend retains the original 35,280-triangle source; only the optimized,
independently unwrapped and rebaked runtime mesh is exported and rendered.
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
import subprocess
from pathlib import Path
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from cat_atlas import paint_atlas
from cat_uv import geometry_fingerprint
SIZE = 1024
KINDS = {
    'orange': dict(fur='#f6a457', belly='#ffe3c0', stripes='#d97f33', eyes='#33262a', pattern='stripes'),
    'calico': dict(fur='#fff4e6', belly='#ffffff', patches=['#e58f45','#3b3238'], eyes='#33262a', pattern='patches'),
    'black': dict(fur='#35303c', belly='#4a4452', eyes='#ffe27a', pattern='none'),
    'tabby': dict(fur='#b09a80', belly='#eadfce', stripes='#5c4c40', eyes='#4f7a3a', pattern='stripes'),
}
args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
# Blender's voxel-remesh/decimate scheduling changes topology with thread count.
# Use the approved three-thread path even when the caller omits --threads.
thread_flag=next((f for f in ('--threads','-t') if f in sys.argv),None)
if not thread_flag or sys.argv[sys.argv.index(thread_flag)+1]!='3':
    subprocess.run([bpy.app.binary_path,'--background','--factory-startup','--threads','3',
                    '--python',str(Path(__file__).resolve()),'--',*args],check=True)
    raise SystemExit(0)
KIND = args[args.index('--kind')+1] if '--kind' in args else 'orange'
if KIND not in KINDS:
    raise ValueError('Choose exactly one named cat: orange, calico, black or tabby')
PALETTE = KINDS[KIND]
ASSET = KIND+'-cat'
TITLE = KIND.capitalize()+'Cat'
WORK = Path(os.environ.get('CAT_WORK_DIR',os.environ.get('ORANGE_CAT_WORK_DIR', str(Path(tempfile.gettempdir())/'cat-build'))))
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
cat_collection = bpy.data.collections.new(TITLE)
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
body.name = TITLE+'_Fur'
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

fur = material('Watercolor fur · baked atlas', PALETTE['fur'], .93)
body.data.materials.append(fur)
eye_mat = material('Cat eyes', PALETTE['eyes'], .47)
nose_mat = material('Muted rose nose', '#aa6e61', .62)
line_mat = material('Sepia facial detail', '#8c6248', .92)
whisker_mat = material('Warm cream whiskers', '#f9e9d0', .93)
glint_mat = material('Soft eye catchlight', '#ffefd4', .34)

# Retain the approved full-density source atlas for editing in Blender.
source_paint=paint_atlas(body,fur,eye_mat,kind=KIND,palette=PALETTE,work=WORK,
                         tail_points=tail_points,size=SIZE,runtime=False)
eye_tile=source_paint['eye_tile']

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
    if eye_tile:
        tx,ty,edge=eye_tile
        uv=obj.data.uv_layers.new(name='Iris atlas')
        for poly in obj.data.polygons:
            for li in poly.loop_indices:
                v=obj.data.vertices[obj.data.loops[li].vertex_index].co
                dx=v.x-cx
                dz=v.z-cz-sign*.19*dx
                uv.data[li].uv=((tx+1+(dx/.034+1)*.5*(edge-3))/SIZE,
                                (ty+1+(dz/.018+1)*.5*(edge-3))/SIZE)
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

# Retain the approved editable source and its original atlas. Runtime copies use
# the measured 6,886-triangle budget, smooth normals from that source, and their
# own nonoverlapping charts. The source collection is never selected for export.
source_objects=list(cat_collection.objects)
source_triangles=sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in source_objects)
assert source_triangles==35280
source_geometry_sha=hashlib.sha256(''.join(geometry_fingerprint(o.data) for o in source_objects).encode()).hexdigest()
source_collection=bpy.data.collections.new('SOURCE — original 35k mesh and atlas')
scene.collection.children.link(source_collection)
runtime_ratios={TITLE+'_Fur':.185,'Cat eyes':.42,'Soft eye catchlight':.06,
                'Small rose nose':.7,'Sepia facial detail':.35,'Warm cream whiskers':.55}
runtime_objects={}
for original in source_objects:
    role=original.name
    low=original.copy()
    original.name=role+' · source'
    move_collection(original,source_collection)
    original.select_set(False)
    original.hide_render=True
    original.hide_set(True)
    low.name=role
    cat_collection.objects.link(low)
    low.hide_render=False
    low.hide_set(False)
    low.select_set(False)
    decimate=low.modifiers.new('Runtime surface reduction','DECIMATE')
    decimate.ratio=runtime_ratios[role]
    decimate.use_collapse_triangulate=True
    normals=low.modifiers.new('Preserve approved smooth normals','DATA_TRANSFER')
    normals.object=original
    normals.use_loop_data=True
    normals.data_types_loops={'CUSTOM_NORMAL'}
    normals.loop_mapping='POLYINTERP_NEAREST'
    normals.mix_mode='REPLACE'
    normals.mix_factor=1
    low['source_triangles']=sum(len(p.vertices)-2 for p in original.data.polygons)
    low['runtime_decimation_ratio']=runtime_ratios[role]
    runtime_objects[role]=low

depsgraph=bpy.context.evaluated_depsgraph_get()
for low in runtime_objects.values():
    runtime_mesh=bpy.data.meshes.new_from_object(low.evaluated_get(depsgraph),
                         preserve_all_data_layers=True,depsgraph=depsgraph)
    runtime_mesh.name=low.data.name+' · runtime'
    low.modifiers.clear()
    low.data=runtime_mesh

body=runtime_objects[TITLE+'_Fur']
fur=body.data.materials[0].copy()
fur.name='Watercolor fur · runtime atlas'
body.data.materials[0]=fur
runtime_eyes=runtime_objects['Cat eyes']
eye_mat=runtime_eyes.data.materials[0].copy()
eye_mat.name='Cat eyes · runtime'
runtime_eyes.data.materials[0]=eye_mat
runtime_paint=paint_atlas(body,fur,eye_mat,kind=KIND,palette=PALETTE,work=WORK,
                          tail_points=tail_points,size=SIZE,runtime=True)

# A fresh body unwrap relocates the free iris tile. Remap only eye UVs using the
# same approved eye-local coordinates; the pupil/iris colors and geometry stay.
if runtime_paint['eye_tile']:
    tx,ty,edge=runtime_paint['eye_tile']
    iris_uv=runtime_eyes.data.uv_layers.active
    for polygon in runtime_eyes.data.polygons:
        for li in polygon.loop_indices:
            v=runtime_eyes.data.vertices[runtime_eyes.data.loops[li].vertex_index].co
            sign=-1 if v.x<0 else 1
            dx=v.x-sign*.067
            dz=v.z-(.724-.032)-sign*.19*dx
            iris_uv.data[li].uv=((tx+1+(dx/.034+1)*.5*(edge-3))/SIZE,
                                 (ty+1+(dz/.018+1)*.5*(edge-3))/SIZE)

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
scene.render.filepath=str(ROOT/(ASSET+'-preview.png'))

# Model-only export: selection prevents cameras, lights and the ground from leaking.
bpy.ops.object.select_all(action='DESELECT')
for obj in cat_collection.objects:
    obj.select_set(True)
    obj['asset']='Original seated '+KIND+' cat'
bpy.context.view_layer.objects.active=body
scene['asset_notes']='Optimized runtime mesh with rebaked atlas; original editable mesh/atlas retained hidden in SOURCE. glTF +Z forward, Y up, floor at 0.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/(ASSET+'.blend')),compress=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/(ASSET+'.glb')),export_format='GLB',use_selection=True,
                          export_apply=True,export_yup=True,export_texcoords=True,export_normals=True,
                          export_materials='EXPORT',export_image_format='JPEG',export_jpeg_quality=90,export_image_quality=90,export_cameras=False,
                          export_lights=False,export_animations=False)

raw=(ROOT/(ASSET+'.glb')).read_bytes()
chunk_length,chunk_type=struct.unpack_from('<II',raw,12)
doc=json.loads(raw[20:20+chunk_length])
# Blender can emit duplicate texture handles for two materials sharing one image.
# Deduplicate those standard glTF references without touching geometry or pixels.
unique_textures=[]
texture_map={}
for i,texture in enumerate(doc.get('textures',[])):
    if texture not in unique_textures:
        unique_textures.append(texture)
    texture_map[i]=unique_textures.index(texture)
if len(unique_textures)<len(doc.get('textures',[])):
    def remap_textures(value):
        if isinstance(value,dict):
            for key,child in value.items():
                if key.endswith('Texture') and isinstance(child,dict) and 'index' in child:
                    child['index']=texture_map[child['index']]
                remap_textures(child)
        elif isinstance(value,list):
            for child in value: remap_textures(child)
    remap_textures(doc.get('materials',[]))
    doc['textures']=unique_textures
    json_bytes=json.dumps(doc,separators=(',',':')).encode()
    json_bytes+=b' '*((-len(json_bytes))%4)
    rest=raw[20+chunk_length:]
    raw=struct.pack('<4sII',b'glTF',2,20+len(json_bytes)+len(rest))+struct.pack('<II',len(json_bytes),0x4e4f534a)+json_bytes+rest
    (ROOT/(ASSET+'.glb')).write_bytes(raw)
primitives=[p for m in doc['meshes'] for p in m['primitives']]
triangle_count=sum(doc['accessors'][p['indices']]['count']//3 for p in primitives)
corners=[obj.matrix_world@Vector(c) for obj in cat_collection.objects for c in obj.bound_box]
mins=[min(c[k] for c in corners) for k in range(3)]
maxs=[max(c[k] for c in corners) for k in range(3)]
metrics={
    'asset':ASSET,'generator':'Blender Python original geometry and analytic painted atlas',
    'blenderVersion':bpy.app.version_string,'seed':SEED,'triangles':triangle_count,
    'sourceTriangles':source_triangles,'sourceMeshCount':len(source_objects),
    'sourceGeometrySha256':source_geometry_sha,'sourceAtlasSha256':source_paint['audit']['atlasSha256'],
    'triangleBudget':10000,'meshes':len(doc['meshes']),'drawCalls':len(primitives),
    'materials':len(doc.get('materials',[])),'textures':len(doc.get('textures',[])),
    'images':len(doc.get('images',[])),'textureResolution':[SIZE,SIZE],
    'textureEncoding':'JPEG','textureQuality':90,'pattern':PALETTE['pattern'],
    'allImagesEmbedded':all('bufferView' in im and 'uri' not in im for im in doc.get('images',[])),
    'uvsOnTexturedMesh':all('TEXCOORD_0' in p['attributes'] for p in primitives if p.get('material')==0),
    'normalsOnAllPrimitives':all('NORMAL' in p['attributes'] for p in primitives),
    'gltfUpAxis':'+Y','gltfForwardAxis':'+Z','blenderBounds':{'min':mins,'max':maxs},
    'height':maxs[2]-mins[2],'glbBytes':len(raw),
    'glbSha256':hashlib.sha256(raw).hexdigest(),
    'palette':{k:v for k,v in PALETTE.items() if k!='pattern'},
    'uvBake':runtime_paint['audit'],'uvRepair':runtime_paint['layout'],
    'render':{'engine':'Cycles CPU','samples':scene.cycles.samples,
              'resolution':[scene.render.resolution_x,scene.render.resolution_y]},
    'license':'Original generated artwork for this repository; no external model or image dependencies.'
}
assert triangle_count<=10000,metrics
assert metrics['allImagesEmbedded'] and metrics['normalsOnAllPrimitives'],metrics
(ROOT/(ASSET+'-metrics.json')).write_text(json.dumps(metrics,indent=2)+'\n')
print('CAT_METRICS',json.dumps(metrics),flush=True)
if '--no-render' not in args:
    bpy.ops.render.render(write_still=True)
    print('CAT_PREVIEW',scene.render.filepath,flush=True)
